import { Injectable, Logger } from '@nestjs/common';
import type {
  AiProvider,
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

  async variant(input: VariantInput): Promise<string | null> {
    const text = await this.chat(
      '你是数学/科学老师，根据题干生成一道同类变式题，只输出题目本身，不要解析。',
      `科目：${input.subject}\n考点：${input.knowledgePoint ?? '未指定'}\n原题：${input.title}`,
    );
    return text || null;
  }
}
