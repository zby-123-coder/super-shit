import { Injectable, Logger } from '@nestjs/common';
import type {
  AiProvider,
  CompanionReplyInput,
  CompanionReplyResult,
  InsightInput,
  InsightResult,
  DiagnoseInput,
  DiagnoseResult,
  ExplainInput,
  ExplainResult,
  HomeworkGradeInput,
  HomeworkGradeResult,
  OpsContentInput,
  OpsContentResult,
  ReviewDraftInput,
  VariantInput,
  WeeklyReportInput,
} from './ai.types';

/**
 * LLM 提供方骨架（OpenAI 兼容协议）。
 *
 * 启用方式（.env.local 或部署环境变量）：
 *   AI_API_KEY=sk-xxxx
 *   AI_BASE_URL=https://api.openai.com/v1        # 或你自己的模型服务地址
 *   AI_MODEL=gpt-4o-mini                          # 模型名
 *
 * DeepSeek 示例（OpenAI 兼容协议，直接可用）：
 *   AI_API_KEY=sk-xxxx
 *   AI_BASE_URL=https://api.deepseek.com
 *   AI_MODEL=deepseek-chat
 *   # deepseek-chat 不支持图片输入，识图批改需另配多模态模型（不配则该项诚实降级）：
 *   AI_VISION_MODEL=qwen-vl-plus
 *
 * 未配置 AI_API_KEY 时 AiService 不会实例化本类，业务无感降级到规则版。
 * 请求/响应格式如与你的服务不一致，只改本文件的 chat() 即可。
 */
export class LlmAiProvider implements AiProvider {
  readonly name = 'llm';
  private readonly logger = new Logger(LlmAiProvider.name);
  private readonly apiKey = process.env.AI_API_KEY ?? '';
  private readonly baseUrl = process.env.AI_BASE_URL ?? 'https://api.openai.com/v1';
  private readonly model = process.env.AI_MODEL ?? 'gpt-4o-mini';
  /** 识图批改专用模型（多模态）；未配置时默认用主模型 */
  private readonly visionModel = process.env.AI_VISION_MODEL ?? '';
  /** 已知不支持图片输入的纯文本模型：跳过请求，直接诚实降级 */
  private static readonly TEXT_ONLY_MODELS = new Set([
    'deepseek-chat',
    'deepseek-reasoner',
    'deepseek-r1',
    'deepseek-v3',
  ]);

  private async chat(system: string, user: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`LLM 请求失败 ${res.status}: ${text.slice(0, 200)}`);
      throw new Error(`LLM ${res.status}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? '';
  }

  async polishWeeklyReport(input: WeeklyReportInput): Promise<string> {
    const s = input.stats;
    return this.chat(
      '你是家教团队的学习报告撰写助手，面向家长，语气温和、结论清晰、不堆术语，200 字以内。',
      `请根据以下一周学习数据，写一段家长能直接读懂的结论文本：\n${JSON.stringify(
        { 学生: input.studentName, 周期: `${input.weekStart} ~ ${input.weekEnd}`, 数据: s, 章节进度: input.progress },
      )}`,
    );
  }

  async reviewDraft(input: ReviewDraftInput): Promise<string> {
    return this.chat(
      '你是家教老师的助教，根据学生的打卡内容写一句 30 字以内的中文评语，先肯定再指出改进点。',
      `任务：${input.taskTitle}\n打卡内容：${input.content}\n用时：${input.durationMin} 分钟`,
    );
  }

  async gradeHomework(input: HomeworkGradeInput): Promise<HomeworkGradeResult> {
    if (input.images.length === 0) {
      return { available: true, items: [], summary: '该打卡没有上传图片，无需识图批改。' };
    }
    // 视觉模型边界：deepseek-chat 等纯文本模型不支持 image_url，直接诚实降级，
    // 不浪费一次注定失败的调用；用户可通过 AI_VISION_MODEL 单独配多模态模型。
    const visionModel = this.visionModel || this.model;
    if (LlmAiProvider.TEXT_ONLY_MODELS.has(visionModel.toLowerCase())) {
      return {
        available: false,
        items: [],
        summary:
          `当前模型（${visionModel}）不支持图片输入，识图批改暂不可用。` +
          '可在 .env.local 配置 AI_VISION_MODEL 为多模态模型（如 qwen-vl-plus / glm-4v / gpt-4o）后启用。',
      };
    }
    // 多模态消息：图片 + 指令，要求模型输出 JSON
    const contentParts: unknown[] = [
      {
        type: 'text',
        text:
          '这是一份学生上传的作业照片，科目：' + input.subject + '，任务：' + input.taskTitle + '。' +
          (input.content ? '学生自述：' + input.content : '') +
          '\n请识别图中每一道题，逐题判断对错并归类错因，严格输出 JSON：' +
          '{"items":[{"questionNo":"1","isCorrect":true,"comment":"简短点评"}],' +
          '"errorType":"概念不清|计算失误|审题偏差|步骤缺失|未作答（仅错题填写）",' +
          '"summary":"一段给老师看的总体批改建议，100字内"}',
      },
    ];
    for (const image of input.images) {
      contentParts.push({ type: 'image_url', image_url: { url: image } });
    }
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [{ role: 'user', content: contentParts }],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`识图批改请求失败 ${res.status}: ${text.slice(0, 200)}`);
      throw new Error(`LLM ${res.status}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
    // 容错解析：截取第一个 { 到最后一个 }
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) {
      return { available: true, items: [], summary: raw || 'AI 未返回结构化结果，请人工批改。' };
    }
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1)) as {
        items?: HomeworkGradeResult['items'];
        summary?: string;
      };
      return {
        available: true,
        items: (parsed.items ?? []).map((item) => ({
          questionNo: String(item.questionNo ?? ''),
          isCorrect: !!item.isCorrect,
          errorType: item.errorType,
          comment: String(item.comment ?? ''),
        })),
        summary: String(parsed.summary ?? ''),
      };
    } catch {
      return { available: true, items: [], summary: raw.slice(0, 300) };
    }
  }

  async opsContent(input: OpsContentInput): Promise<OpsContentResult> {
    const text = await this.chat(
      '你是家教机构的新媒体运营专家。根据给定信息，为指定年级/地域/学科输出：一段信息摘要，' +
        '以及三个平台的发布文案（朋友圈/公众号/小红书）。朋友圈要短平快带行动号召，' +
        '公众号要有标题党式标题和正文结构，小红书要emoji+分段。严格输出 JSON：' +
        '{"summary":"...","posts":[{"platform":"moments","title":"...","text":"..."},' +
        '{"platform":"official",...},{"platform":"rednote",...}]}',
      `日期：${input.today ?? '今天'}\n地域：${input.region}\n年级：${input.grade}\n学科：${input.subject}\n` +
        `素材：${input.material?.trim() || '（无素材，请基于该年级学科的常见学习节点自选选题）'}`,
    );
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) {
      return { available: true, summary: text, posts: [] };
    }
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as OpsContentResult;
      return {
        available: true,
        summary: String(parsed.summary ?? ''),
        posts: (parsed.posts ?? []).map((post) => ({
          platform: String(post.platform ?? ''),
          title: String(post.title ?? ''),
          text: String(post.text ?? ''),
        })),
      };
    } catch {
      return { available: true, summary: text.slice(0, 300), posts: [] };
    }
  }

  async diagnose(input: DiagnoseInput): Promise<DiagnoseResult> {
    const text = await this.chat(
      '你是资深教学诊断专家。基于四维评分、错因分布与章节进度，输出学情诊断：' +
        '一段总结、2-4 条优势、2-4 条短板、3-5 条可执行处方（每条含 action 与 reason）。' +
        '处方必须具体到动作（如"本周完成3道同知识点题"），禁止空话。严格输出 JSON：' +
        '{"summary":"...","strengths":["..."],"weaknesses":["..."],' +
        '"prescriptions":[{"action":"...","reason":"..."}]}',
      `学生：${input.studentName}，周期：近 ${input.days} 天\n` +
        `四维评分：${JSON.stringify(input.dimensions)}\n` +
        `错因分布：${JSON.stringify(input.topReasons)}\n` +
        `章节进度：${JSON.stringify(input.progress)}`,
    );
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) {
      return {
        summary: text.slice(0, 200),
        strengths: [],
        weaknesses: [],
        prescriptions: [],
      };
    }
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as DiagnoseResult;
      return {
        summary: String(parsed.summary ?? ''),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
        prescriptions: Array.isArray(parsed.prescriptions)
          ? parsed.prescriptions.map((p) => ({ action: String(p.action ?? ''), reason: String(p.reason ?? '') }))
          : [],
      };
    } catch {
      return { summary: text.slice(0, 200), strengths: [], weaknesses: [], prescriptions: [] };
    }
  }

  /**
   * 引导式讲题：四段结构（读题→提示→分步讲解），
   * 护栏：提示段绝不透露最终答案，讲解段才给完整推导。
   */
  async explainQuestion(input: ExplainInput): Promise<ExplainResult> {
    const text = await this.chat(
      '你是善用引导式教学的老师。针对学生的错题，按四段输出：' +
        'read（审题要点：这题在问什么、关键条件是什么）；' +
        'hint（思路提示：指出切入方向与易错点，【绝对不能透露最终答案】）；' +
        'explain（分步讲解：完整推导过程，可以给出最终答案）。' +
        '语气鼓励、步骤清晰。严格输出 JSON：' +
        '{"steps":[{"phase":"read","text":"..."},{"phase":"hint","text":"..."},' +
        '{"phase":"explain","text":"..."}],"similarTip":"...","encouragement":"..."}',
      `科目：${input.subject}\n考点：${input.knowledgePoint ?? '未指定'}\n` +
        `错题：${input.title}\n错因：${input.wrongReason ?? '未标注'}\n` +
        `学生作答：${input.studentAnswer ?? '未提供'}`,
    );
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) {
      return { available: true, steps: [], similarTip: '', encouragement: text.slice(0, 100) };
    }
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as ExplainResult;
      const steps = (parsed.steps ?? []).filter((step) =>
        ['read', 'hint', 'explain'].includes(step.phase),
      );
      return {
        available: true,
        steps: steps.map((step) => ({ phase: step.phase, text: String(step.text ?? '') })),
        similarTip: String(parsed.similarTip ?? ''),
        encouragement: String(parsed.encouragement ?? ''),
      };
    } catch {
      return { available: true, steps: [], similarTip: '', encouragement: text.slice(0, 100) };
    }
  }

  /**
   * AI 陪伴：人设 system prompt + 多轮历史 + 阶段指令。
   * 阶段推进由模型判断（返回 nextStage），服务端负责校验与落库。
   */
  async companionReply(input: CompanionReplyInput): Promise<CompanionReplyResult> {
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: input.systemPrompt },
      ...input.history.slice(-12),
      { role: 'user', content: input.message },
    ];
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.5,
        max_tokens: 400,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`陪伴对话失败 ${res.status}: ${text.slice(0, 200)}`);
      throw new Error(`LLM ${res.status}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? '';
    // 阶段推进：模型在回复末尾附带 [STAGE:xxx] 标记（可选）
    const match = reply.match(/\[STAGE:(understand|guide|consolidate|close)\]/);
    return {
      available: true,
      reply: reply.replace(/\[STAGE:[a-z]+\]/g, '').trim(),
      nextStage: match ? match[1] : null,
    };
  }

  /**
   * LLM 状态洞察：在规则信号基础上做归因与话术个性化。
   * 安全设计：level 由模型建议但服务端会与规则判定交叉校验（AI 不得单独降级风险）。
   */
  async insight(input: InsightInput): Promise<InsightResult> {
    const text = await this.chat(
      '你是家教机构的学习顾问，负责识别学生学习状态异常并给出干预动作。' +
        '基于多源信号判断状态（on_track/slipping/at_risk/churning），输出：' +
        'headline（一句话结论）、evidence（3条以内证据，引用具体数值）、' +
        'actions（2-4 条可执行动作，type 取 teacher_alert/parent_notice/student_nudge/practice_pack/renewal_reminder，' +
        'message 写成可直接发送的中文通知，具体可执行、不空泛）。严格输出 JSON：' +
        '{"level":"...","score":0-100,"headline":"...","evidence":["..."],' +
        '"actions":[{"type":"...","target":"teacher|parent|student","message":"..."}]}',
      `学生：${input.studentName}\n信号：${JSON.stringify(input.signals)}`,
    );
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) {
      throw new Error('LLM 洞察输出无法解析');
    }
    const parsed = JSON.parse(text.slice(start, end + 1)) as InsightResult;
    const levels = ['on_track', 'slipping', 'at_risk', 'churning'];
    return {
      level: levels.includes(parsed.level) ? parsed.level : 'slipping',
      score: Math.max(0, Math.min(100, Number(parsed.score ?? 0))),
      headline: String(parsed.headline ?? ''),
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence.map(String).slice(0, 4) : [],
      actions: Array.isArray(parsed.actions)
        ? parsed.actions.slice(0, 5).map((action) => ({
            type: String(action.type ?? 'teacher_alert'),
            target: String(action.target ?? 'teacher'),
            message: String(action.message ?? ''),
          }))
        : [],
    };
  }

  async variant(input: VariantInput): Promise<string | null> {
    const text = await this.chat(
      '你是数学/科学老师，根据题干生成一道同类变式题，只输出题目本身，不要解析。',
      `科目：${input.subject}\n考点：${input.knowledgePoint ?? '未指定'}\n原题：${input.title}`,
    );
    return text || null;
  }
}
