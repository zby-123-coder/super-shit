import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SupportAskResponse, SupportSourceDTO } from '@shared/api.interface';
import { AiService } from '@server/common/ai/ai.service';
import type { SupportAnswerInput } from '@server/common/ai/ai.types';
import { LangfuseExporter } from '@server/common/ai/langfuse-exporter';
import { AiIdempotencyService } from '../ai/ai-idempotency.service';
import { AiInvocationService } from '../ai/ai-invocation.service';
import { AiTraceService, type SpanRecord } from '../ai/ai-trace.service';
import { AccountService } from '../account/account.service';
import { KbService, type KbRagEntry } from '../kb/kb.service';
import { buildSupportSystemPrompt } from './support.persona';

/** 检索可信门槛：top 条目 bigram 覆盖率低于此值视为"库里没有依据"，直接拒答不烧 LLM。
 *  调参依据（黄金集实测）：真拒答题 top1 全部 ≤0.08（老师 0.080/补课 0.069/加油 0.073），
 *  边界改写应答题 0.114（档案投出），明显应答 0.57+——取 0.10 两侧各留余量。
 *  词面重叠但条目答不了的（2028政策 0.16）留给 LLM 层拒答。
 *  调参先用 scripts/eval-support.mjs（改参数先跑评测是铁律）。 */
const MIN_RETRIEVAL_SCORE = 0.1;
/** 送入 LLM 的条目上限（token 预算：34 条量级取 top5 足够） */
const MAX_ENTRIES_FOR_LLM = 5;

/** 幂等 scope：问题+地域的短哈希（同问题 10s 内复用结果，不重复调用 LLM） */
function hashScope(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = (((h << 5) + h + text.charCodeAt(i)) | 0) >>> 0;
  return `q${h.toString(36)}`;
}

/**
 * 智能客服 RAG 链路：question → kb 检索（2-gram）→ 受约束生成 → 来源/拒答。
 *
 * 三层质量把关（与 cs-framework GraphRAG 同一设计哲学）：
 *   1. 检索层只做廉价召回：2-gram bigram 覆盖率，零 embedding 依赖
 *   2. LLM 层是质量闸门：只能依据检索条目回答，语义不够必须拒答（refused=true）
 *   3. 规则层兜底：未配 AI_API_KEY / LLM 失败 → 摘录 top1 条目 + 转人工提示，绝不假装
 *
 * 拒答省钱的关键：检索为空（无条目过门槛）直接转人工，不发起注定拒答的 LLM 调用。
 *
 * 可观测性：每次 ask = 一条 trace（callId），子观测 span 树
 *   kb.search → prompt.build → llm.call(generation,带 token) → answer.compose，
 *   反馈 👍👎 是 trace 上的 event；Langfuse 已配 key 时异步导出（fire-and-forget）。
 */
@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly kb: KbService,
    private readonly ai: AiService,
    private readonly idempotency: AiIdempotencyService,
    private readonly invocation: AiInvocationService,
    private readonly trace: AiTraceService,
    private readonly exporter: LangfuseExporter,
    private readonly accountService: AccountService,
  ) {}

  async ask(
    userId: string,
    input: { question: string; studentUserId?: string; region?: string },
  ): Promise<SupportAskResponse> {
    const question = input.question.trim();
    if (!question) throw new BadRequestException('question 不能为空');
    if (question.length > 500) throw new BadRequestException('question 过长（≤500 字）');
    // 身份隔离：归属到学生必须有权（家长只能代自己孩子问，评测/日志按学生归属）
    if (input.studentUserId) await this.assertCanAskFor(userId, input.studentUserId);

    const scopeId = hashScope(`${question}|${input.region ?? ''}`);
    const { result, deduped } = await this.idempotency.run(
      userId,
      'support.ask',
      () => this.execute(userId, question, input.region, scopeId),
      { scopeId },
    );
    return { ...result, deduped };
  }

  /** 用户反馈（👍👎）：trace 上的 event，Langfuse 映射为 score。
   *  身份隔离：只能给自己的调用留反馈；10s 内重复反馈幂等去重。 */
  async feedback(
    userId: string,
    input: { callId: string; rating: 'up' | 'down'; comment?: string },
  ): Promise<{ ok: boolean; deduped?: boolean }> {
    const row = await this.invocation.get(input.callId);
    if (!row) throw new NotFoundException('调用不存在');
    if (row.userId !== userId) throw new ForbiddenException('只能给自己的调用留反馈');
    const { deduped } = await this.idempotency.run(
      userId,
      'support.feedback',
      async () => {
        await this.trace.recordEvent(input.callId, {
          name: 'feedback',
          spanType: 'event',
          payload: { rating: input.rating, comment: input.comment ?? '' },
        });
        this.exporter.exportScore({
          traceId: input.callId,
          value: input.rating === 'up' ? 1 : 0,
          comment: input.comment,
        });
        return { ok: true as const };
      },
      { scopeId: input.callId },
    );
    return { ok: true, deduped };
  }

  /** 归属学生必须有权：与 companion 同一权限口径（admin 放行/学生本人/家长看孩子/老师带学生） */
  private async assertCanAskFor(userId: string, studentUserId: string): Promise<void> {
    const me = await this.accountService.findProfile(userId);
    if (!me) throw new ForbiddenException('请先完善个人身份');
    if (me.role === 'admin') return;
    if (me.role === 'student') {
      if (userId !== studentUserId) throw new ForbiddenException('只能以本人身份提问');
      return;
    }
    if (me.role === 'parent') {
      const ok = await this.accountService.canViewStudent(userId, studentUserId);
      if (!ok) throw new ForbiddenException('只能代自己孩子提问');
      return;
    }
    const ok = await this.accountService.canTeachStudent(userId, studentUserId);
    if (!ok) throw new ForbiddenException('只能代自己学生提问');
  }

  private async execute(
    userId: string,
    question: string,
    region: string | undefined,
    scopeId: string,
  ): Promise<Omit<SupportAskResponse, 'deduped'>> {
    const started = Date.now();
    // trace id 预生成：span 树与调用日志共用（record 传入 callId）
    const traceId = randomUUID();
    const spans: SpanRecord[] = [];

    // ① 检索：2-gram bigram 覆盖率，零 LLM 成本
    let t = Date.now();
    const hits = await this.kb.searchRag({ question, region, limit: MAX_ENTRIES_FOR_LLM });
    spans.push({
      name: 'kb.search', spanType: 'span', startedAt: t, latencyMs: Date.now() - t,
      payload: { question, region: region ?? '', hitCount: hits.length, topScore: hits[0]?.score ?? null },
    });
    const usable = hits.filter((e) => e.score >= MIN_RETRIEVAL_SCORE);

    let answer = '';
    let refused = false;
    let citedIds: string[] = [];
    let provider = this.ai.providerName;
    let llmSpan: SpanRecord | undefined;

    if (usable.length === 0) {
      // ② 检索不到依据：直接拒答转人工，不发起注定拒答的 LLM 调用
      refused = true;
      answer = '这个问题我在知识库里没有找到可靠依据，为避免给你错误信息，已为你转接老师人工确认。';
    } else {
      // ③ prompt 构建
      t = Date.now();
      const systemPrompt = buildSupportSystemPrompt();
      const entriesInput = usable.map((e) => ({
        id: e.id, title: e.title, question: e.question, content: e.content, region: e.region,
      }));
      spans.push({
        name: 'prompt.build', spanType: 'span', startedAt: t, latencyMs: Date.now() - t,
        payload: { entryCount: entriesInput.length, systemChars: systemPrompt.length },
      });

      // ④ 受约束生成：LLM 只能依据条目回答；失败自动降级规则版
      t = Date.now();
      const result = await this.ai.supportAnswer({
        systemPrompt, question, entries: entriesInput,
      });
      provider = result.available ? 'llm' : 'rule';
      llmSpan = {
        name: 'llm.call', spanType: 'generation', startedAt: t, latencyMs: Date.now() - t,
        status: 'success',
        payload: { provider, refused: result.refused, answer: result.answer },
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens,
        totalTokens: result.usage?.totalTokens,
      };
      spans.push(llmSpan);

      if (result.refused || !result.answer.trim()) {
        // 语义不够（检索命中但答不了）/ 空回答：拒答转人工
        refused = true;
        answer = result.answer.trim() || '这个问题我需要人工确认，已为你转接老师。';
      } else {
        answer = result.answer.trim();
        // 引用校验：cited_ids 必须 ⊆ 输入条目（防编造 id）；没引用则退 top1 保证可溯源
        const valid = new Set(usable.map((e) => e.id));
        citedIds = result.citedIds.filter((id) => valid.has(id));
        if (citedIds.length === 0) {
          this.logger.warn(`客服回答未带有效引用（退 top1 溯源）：${question.slice(0, 40)}`);
          citedIds = [usable[0].id];
        }
      }
    }

    // ⑤ 组装：引用校验 + 来源映射
    t = Date.now();
    const byId = new Map(usable.map((e) => [e.id, e]));
    const sources: SupportSourceDTO[] = citedIds
      .map((id) => byId.get(id))
      .filter((e): e is KbRagEntry => Boolean(e))
      .map((e) => ({ entryId: e.id, title: e.title, stage: e.stage, region: e.region, source: e.source }));
    spans.push({
      name: 'answer.compose', spanType: 'span', startedAt: t, latencyMs: Date.now() - t,
      payload: { refused, citedCount: citedIds.length, sourceCount: sources.length, answerLen: answer.length },
    });

    // ⑥ 留痕 + span 落库 + Langfuse 导出（后两者失败均不影响主流程）
    const latencyMs = Date.now() - started;
    const callId = await this.invocation.record(
      { userId, feature: 'support.ask', scopeType: 'kb', scopeId },
      {
        provider,
        status: provider === 'rule' ? 'degraded' : 'success',
        latencyMs,
        preview: answer.slice(0, 200),
        full: {
          question, region: region ?? '', refused, answer, citedIds,
          retrievalScores: usable.map((e) => ({ id: e.id, score: e.score })),
        },
        callId: traceId,
      },
    );
    if (callId) {
      void this.trace.writeSpans(callId, spans);
      this.exporter.exportTrace({
        traceId: callId,
        name: 'support.ask',
        userId,
        latencyMs,
        metadata: { region: region ?? '', refused, provider, scopeId },
        llmSpan,
        spans,
      });
    }

    return { answer, refused, sources, callId, provider };
  }
}
