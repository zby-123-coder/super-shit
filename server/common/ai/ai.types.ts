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

export interface HomeworkGradeInput {
  subject: string;
  taskTitle: string;
  /** 打卡图片的 base64 data URL 列表 */
  images: string[];
  /** 学生自述完成情况（可选，辅助判断） */
  content?: string;
}

export interface HomeworkGradeItem {
  questionNo: string;
  isCorrect: boolean;
  /** 错因归类：概念不清 / 计算失误 / 审题偏差 / 步骤缺失 / 未作答 */
  errorType?: string;
  /** 解析或鼓励 */
  comment: string;
}

export interface HomeworkGradeResult {
  /** false = 当前提供方不支持识图（如规则版），前端提示配置 AI_API_KEY */
  available: boolean;
  items: HomeworkGradeItem[];
  summary: string;
}

export interface ExplainInput {
  subject: string;
  title: string;
  knowledgePoint?: string;
  /** 学生的错因标注（概念不清/计算失误/审题偏差/步骤缺失/未作答） */
  wrongReason?: string;
  /** 学生的作答（可选，用于针对性讲解） */
  studentAnswer?: string;
}

export interface ExplainStep {
  phase: 'read' | 'hint' | 'explain';
  text: string;
}

export interface ExplainResult {
  /** false = 当前提供方不支持讲解（如规则版） */
  available: boolean;
  steps: ExplainStep[];
  /** 同类题建议 */
  similarTip: string;
  encouragement: string;
}

export interface DiagnoseInput {
  studentName: string;
  days: number;
  dimensions: { label: string; score: number; detail: string }[];
  topReasons: { reason: string; count: number }[];
  progress: { subject: string; chapter: string; percent: number }[];
}

export interface DiagnoseResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  prescriptions: { action: string; reason: string }[];
}

export interface OpsContentInput {
  /** 选题维度 */
  grade: string;        // 如：初二
  region: string;       // 如：杭州
  subject: string;      // 如：数学
  /** 运营粘贴的素材：新闻文字、链接内容、学员进步数据等 */
  material?: string;
  /** 今日日期（ISO），用于 LLM 感知季节/学期节点 */
  today?: string;
}

export interface OpsPostDraft {
  platform: string;     // moments / official / rednote
  title: string;
  text: string;
}

export interface OpsContentResult {
  available: boolean;
  /** 信息摘要（给运营内部看的） */
  summary: string;
  /** 三平台发布文案 */
  posts: OpsPostDraft[];
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

  /** 识图批改：识别作业图片中的题目并逐题判断对错（需多模态模型） */
  gradeHomework(input: HomeworkGradeInput): Promise<HomeworkGradeResult>;

  /** 运营文案：素材/选题 → 信息摘要 + 三平台发布文案 */
  opsContent(input: OpsContentInput): Promise<OpsContentResult>;

  /** 学情诊断：四维数据 + 错因归类 → 总结/优劣势/处方 */
  diagnose(input: DiagnoseInput): Promise<DiagnoseResult>;

  /** 引导式讲题：读题→提示→分步讲解（护栏：不直接给最终答案） */
  explainQuestion(input: ExplainInput): Promise<ExplainResult>;
}
