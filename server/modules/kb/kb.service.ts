import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { educationKb } from '@server/database/schema';

export interface KbSearchInput {
  stage?: string;
  category?: string;
  region?: string;
  keyword?: string;
  limit?: number;
}

export interface KbEntry {
  id: string;
  stage: string;
  category: string;
  region: string;
  title: string;
  question: string;
  content: string;
  keywords: string[];
  source: string;
}

export interface KbUpsertInput {
  stage: string;
  category: string;
  region?: string;
  title: string;
  question?: string;
  content: string;
  keywords?: string[];
  source?: string;
}

const STAGES = new Set(['gaokao', 'zhongkao']);
const CATEGORIES = new Set(['policy', 'zhiyuan', 'xuanke', 'timeline', 'special', 'faq']);

/**
 * 教育知识库（中考/高考 政策·志愿·选科·时间线·FAQ）。
 *
 * 检索策略（诚实说明）：
 *   当前为关键词层：标题/问法/正文 ilike + keywords 数组重叠匹配。
 *   RAG 演进预留：content 是天然语料，后续加 embedding 列后把
 *   search() 内部的 where 条件替换/叠加为向量相似度即可，接口层无需改动。
 *   智能客服接入方：调 search() 拿 top 条目 → 拼 prompt 交给 LLM 生成回答。
 */
@Injectable()
export class KbService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async search(input: KbSearchInput): Promise<KbEntry[]> {
    const conditions: SQL[] = [];
    if (input.stage && STAGES.has(input.stage)) conditions.push(eq(educationKb.stage, input.stage));
    if (input.category && CATEGORIES.has(input.category)) {
      conditions.push(eq(educationKb.category, input.category));
    }
    if (input.region) {
      // 地域匹配：命中 region 或条目本身是全国通用
      conditions.push(or(eq(educationKb.region, input.region), eq(educationKb.region, '全国'))!);
    }
    if (input.keyword?.trim()) {
      const keyword = input.keyword.trim();
      const like = or(
        ilike(educationKb.title, `%${keyword}%`),
        ilike(educationKb.question, `%${keyword}%`),
        ilike(educationKb.content, `%${keyword}%`),
      );
      // 空格分词：任一词命中 keywords 数组即算命中。
      // 注意：不用 `keywords && ARRAY[...]`——drizzle/pg-core 会把数组参数摊平成标量导致类型错误，
      // 改为逐词 = any(keywords)（标量绑定，稳定）。
      const words = keyword.split(/\s+/).filter(Boolean).slice(0, 8);
      const kwMatch = words.length > 0
        ? or(...words.map((w) => sql`${w} = any(${educationKb.keywords})`))
        : undefined;
      conditions.push((like && kwMatch ? or(like, kwMatch) : (kwMatch ?? like))!);
    }

    const rows = await this.db
      .select()
      .from(educationKb)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      // 命中标题的排前面，其余按更新时间
      .orderBy(
        sql`case when ${educationKb.title} ilike ${`%${input.keyword?.trim() ?? ''}%`} then 0 else 1 end`,
        sql`${educationKb.updatedAt} desc`,
      )
      .limit(Math.min(Math.max(input.limit ?? 10, 1), 50));

    return rows.map((row) => ({
      id: row.id,
      stage: row.stage,
      category: row.category,
      region: row.region,
      title: row.title,
      question: row.question ?? '',
      content: row.content,
      keywords: row.keywords ?? [],
      source: row.source ?? '',
    }));
  }

  /** 分类统计（智能客服/前端筛选用） */
  async stats() {
    const rows = await this.db
      .select({
        stage: educationKb.stage,
        category: educationKb.category,
        count: sql<number>`count(*)::int`,
      })
      .from(educationKb)
      .groupBy(educationKb.stage, educationKb.category);
    return rows;
  }

  /** 人工补库（upsert，唯一键 stage+title）。运营核实新政策后可手动追加。 */
  async upsert(input: KbUpsertInput) {
    if (!STAGES.has(input.stage) || !CATEGORIES.has(input.category)) {
      throw new Error('stage 必须为 gaokao|zhongkao，category 必须为 policy|zhiyuan|xuanke|timeline|special|faq');
    }
    const [row] = await this.db
      .insert(educationKb)
      .values({
        stage: input.stage,
        category: input.category,
        region: input.region ?? '全国',
        title: input.title,
        question: input.question,
        content: input.content,
        keywords: input.keywords ?? [],
        source: input.source,
      })
      .onConflictDoUpdate({
        target: [educationKb.stage, educationKb.title],
        set: {
          category: input.category,
          region: input.region ?? '全国',
          question: input.question,
          content: input.content,
          keywords: input.keywords ?? [],
          source: input.source,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }
}
