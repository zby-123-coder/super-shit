import { Injectable, Logger } from '@nestjs/common';
import type {
  AiProvider,
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
 * 未配置 AI_API_KEY 时 AiService 不会实例化本类，业务无感降级到规则版。
 * 请求/响应格式如与你的服务不一致，只改本文件的 chat() 即可。
 */
export class LlmAiProvider implements AiProvider {
  readonly name = 'llm';
  private readonly logger = new Logger(LlmAiProvider.name);
  private readonly apiKey = process.env.AI_API_KEY ?? '';
  private readonly baseUrl = process.env.AI_BASE_URL ?? 'https://api.openai.com/v1';
  private readonly model = process.env.AI_MODEL ?? 'gpt-4o-mini';

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
        model: this.model,
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

  async variant(input: VariantInput): Promise<string | null> {
    const text = await this.chat(
      '你是数学/科学老师，根据题干生成一道同类变式题，只输出题目本身，不要解析。',
      `科目：${input.subject}\n考点：${input.knowledgePoint ?? '未指定'}\n原题：${input.title}`,
    );
    return text || null;
  }
}
