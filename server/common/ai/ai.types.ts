/**
 * AI 能力抽象层。
 *
 * 设计目标：业务代码只依赖 AiService，不关心背后是规则模板还是大模型。
 * 切换方式：在 .env.local 配置 AI_API_KEY / AI_BASE_URL / AI_MODEL 即自动启用 LLM，
 * 未配置时零成本降级为规则版（当前默认）。
 *
 * 以后要接自己的模型服务，只需：
 *   1. 改 AI_BASE_URL 指向你的服务
 *   2. 或在 llm-ai.provider.ts 里改请求/响应格式
 * 业务代码零改动。
 */

export interface WeeklyReportInput {
  studentName: string;
  weekStart: string;
  weekEnd: string;
  stats: {
    taskTotal: number;
    taskApproved: number;
    checkinCount: number;
    totalMinutes: number;
    courseDone: number;
    consumedLessons: number;
    purchasedLessons: number;
    remainingLessons: number;
  };
  progress: { subject: string; chapter: string; percent: number }[];
}

export interface ReviewDraftInput {
  content: string;
  durationMin: number;
  taskTitle: string;
}

export interface VariantInput {
  subject: string;
  title: string;
  knowledgePoint?: string;
}

export interface AiProvider {
  /** 提供方名称，用于日志与排查 */
  readonly name: string;

  /** 周报文案润色：在结构化数据基础上生成家长可读的结论文本 */
  polishWeeklyReport(input: WeeklyReportInput): Promise<string>;

  /** 批阅草稿：根据打卡内容生成初步评语 */
  reviewDraft(input: ReviewDraftInput): Promise<string>;

  /** 举一反三：生成一道同类变式题 */
  variant(input: VariantInput): Promise<string | null>;
}
