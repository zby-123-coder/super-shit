import { Injectable, Logger } from '@nestjs/common';
import { LlmAiProvider } from './llm-ai.provider';
import { RuleAiProvider } from './rule-ai.provider';
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
 * AI 门面：有 AI_API_KEY 走 LLM，否则走规则版；LLM 调用失败自动降级规则版，
 * 保证任何情况下功能可用。
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly llm: LlmAiProvider | null;
  private readonly fallback = new RuleAiProvider();

  constructor() {
    this.llm = process.env.AI_API_KEY ? new LlmAiProvider() : null;
    if (this.llm) {
      this.logger.log(`AI 提供方：${this.llm.name}（${process.env.AI_MODEL ?? 'gpt-4o-mini'}）`);
    } else {
      this.logger.log('AI 提供方：rule（未配置 AI_API_KEY，使用规则版）');
    }
  }

  get providerName(): string {
    return this.llm?.name ?? this.fallback.name;
  }

  private async run<T>(
    action: (provider: AiProvider) => Promise<T>,
    degrade: (provider: AiProvider) => Promise<T>,
  ): Promise<T> {
    if (!this.llm) return degrade(this.fallback);
    try {
      return await action(this.llm);
    } catch (error) {
      this.logger.warn(`LLM 调用失败，降级规则版：${(error as Error).message}`);
      return degrade(this.fallback);
    }
  }

  polishWeeklyReport(input: WeeklyReportInput): Promise<string> {
    return this.run(
      (p) => p.polishWeeklyReport(input),
      (p) => p.polishWeeklyReport(input),
    );
  }

  reviewDraft(input: ReviewDraftInput): Promise<string> {
    return this.run(
      (p) => p.reviewDraft(input),
      (p) => p.reviewDraft(input),
    );
  }

  variant(input: VariantInput): Promise<string | null> {
    return this.run(
      (p) => p.variant(input),
      (p) => p.variant(input),
    );
  }

  gradeHomework(input: HomeworkGradeInput): Promise<HomeworkGradeResult> {
    return this.run(
      (p) => p.gradeHomework(input),
      (p) => p.gradeHomework(input),
    );
  }

  opsContent(input: OpsContentInput): Promise<OpsContentResult> {
    return this.run(
      (p) => p.opsContent(input),
      (p) => p.opsContent(input),
    );
  }
}
