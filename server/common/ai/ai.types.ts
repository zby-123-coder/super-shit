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

export interface InsightInput {
  studentName: string;
  signals: {
    overdueReviews: number;
    totalReviews: number;
    taskDoneRate: number;
    daysSinceLastCheckin: number;
    remainingLessons: number;
    newWrongs14d: number;
    diagnosisScores: { label: string; score: number }[];
  };
}

export interface InsightAction {
  /** teacher_alert 通知老师 / parent_notice 通知家长 / student_nudge 学生提示 / practice_pack 习题包 / renewal_reminder 续费提醒 */
  type: string;
  /** 面向谁 */
  target: string;
  /** 可执行文案（通知正文 / 提示语） */
  message: string;
}

export interface InsightResult {
  level: 'on_track' | 'slipping' | 'at_risk' | 'churning';
  score: number;
  headline: string;
  evidence: string[];
  actions: InsightAction[];
}

export interface CompanionReplyInput {
  /** system prompt（人设+阶段+本题信息） */
  systemPrompt: string;
  /** 历史（role: user/assistant） */
  history: { role: 'user' | 'assistant'; content: string }[];
  /** 学生本轮输入 */
  message: string;
  stage: string;
}

export interface CompanionReplyResult {
  /** false = 规则版脚本化引导（不假装理解） */
  available: boolean;
  reply: string;
  /** 建议进入的下一阶段（规则版不推进时为 null） */
  nextStage: string | null;
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

export interface SupportAnswerInput {
  /** system prompt（客服人设+回答规则，由 support 模块构建，可版本化） */
  systemPrompt: string;
  /** 用户问题（中文自然句） */
  question: string;
  /** 检索命中的知识库条目（回答只能依据这些，库外必须拒答） */
  entries: {
    id: string;
    title: string;
    question: string;
    content: string;
    region: string;
  }[];
}

export interface SupportAnswerResult {
  /** false = 规则版回答（不能生成自然语言，退化为条目摘录） */
  available: boolean;
  answer: string;
  /** true = 库内条目不足以回答，已拒答（须转人工） */
  refused: boolean;
  /** 引用的条目 id（服务端会校验必须 ⊆ 输入条目） */
  citedIds: string[];
  /** LLM token 用量（规则版无；供 span/Langfuse 观测） */
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

/** 影子 agent 记忆总结输入：一段对话 + 该生现有记忆（影子 agent 据此判断新增/更新/冲突） */
export interface CompanionMemorySummaryInput {
  studentName: string;
  stage: string;
  /** 本会话消息（role: user/assistant，时间正序） */
  transcripts: { role: string; content: string }[];
  /** 该生现有生效记忆（影子 agent 只能更新这个集合内的条目） */
  existingMemories: { id: string; kind: string; content: string; importance: number }[];
}

/** 一条记忆变更操作：add 新增 / update 更新既有条目（旧条被取代，时间新者胜） */
export interface CompanionMemoryOp {
  action: 'add' | 'update';
  /** action=update 时必填：要更新的现有记忆 id */
  targetId?: string;
  /** weakness/preference/style/progress/fact（服务端白名单校验，非法丢弃） */
  kind: string;
  /** 一句话记忆（服务端截断 500） */
  content: string;
  /** 重要度 1-5 */
  importance: number;
  /** 影子 agent 的理由（落库排查用，不进 prompt） */
  reason?: string;
}

export interface CompanionMemorySummaryResult {
  /** false = 规则版（影子 agent 缺位，ops 为空——规则提炼 refreshMemory 仍在跑） */
  available: boolean;
  ops: CompanionMemoryOp[];
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
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

  /** AI 陪伴对话：带人设与阶段的多轮引导（护栏在 systemPrompt 内） */
  companionReply(input: CompanionReplyInput): Promise<CompanionReplyResult>;

  /** 学习状态洞察：多源信号 → 状态分级 + 证据 + 决策动作 */
  insight(input: InsightInput): Promise<InsightResult>;

  /** 智能客服：问题 + 检索条目 → 受约束回答（只依据条目、库外拒答、必须带来源） */
  supportAnswer(input: SupportAnswerInput): Promise<SupportAnswerResult>;

  /** 影子 agent：总结对话 → 记忆新增/更新操作（冲突由服务端固定规则裁决落库） */
  companionMemorySummary(input: CompanionMemorySummaryInput): Promise<CompanionMemorySummaryResult>;
}
