import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { admissionMajor, admissionSchool } from '@server/database/schema';

export interface MatchInput {
  /** 选科组合，如 ['物理','化学','生物'] */
  subjects: string[];
  /** 意向城市（可空） */
  city?: string;
  /** 关键词（专业名/就业方向，可空） */
  keyword?: string;
}

export interface MatchResult {
  major: {
    id: string;
    name: string;
    category: string;
    requiredSubjects: string[];
    employment: string[];
    intro: string;
  };
  /** 是否满足选科要求 */
  eligible: boolean;
  /** 缺哪些必选科目 */
  missing: string[];
  /** 匹配说明 */
  reason: string;
}

/**
 * 择校/选科知识库。
 *
 * 数据边界（诚实说明）：
 *   已包含：学校基础信息、专业目录、选科要求、就业方向——公开资料可整理，可持续维护
 *   未包含：各省历年录取分数线（分省分专业、逐年更新、各省口径不同，需商业数据源或人工录入）
 *
 * RAG 预留：表结构已按"可嵌入"设计（intro 字段是天然语料），
 * 后期接入 embedding 时新增向量列或外部向量库索引即可，接口层无需改动。
 */
@Injectable()
export class AdmissionService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async schools(params: { city?: string; keyword?: string }) {
    const conditions = [];
    if (params.city) conditions.push(eq(admissionSchool.city, params.city));
    if (params.keyword) {
      conditions.push(
        or(
          ilike(admissionSchool.name, `%${params.keyword}%`),
          ilike(admissionSchool.intro, `%${params.keyword}%`),
        ),
      );
    }
    const rows = await this.db
      .select()
      .from(admissionSchool)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(50);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city ?? '',
      province: row.province ?? '',
      level: row.level ?? '',
      tags: row.tags ?? [],
      intro: row.intro ?? '',
    }));
  }

  async majors(params: { keyword?: string; category?: string }) {
    const conditions = [];
    if (params.category) conditions.push(eq(admissionMajor.category, params.category));
    if (params.keyword) {
      conditions.push(
        or(
          ilike(admissionMajor.name, `%${params.keyword}%`),
          ilike(admissionMajor.intro, `%${params.keyword}%`),
        ),
      );
    }
    const rows = await this.db
      .select()
      .from(admissionMajor)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(100);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category ?? '',
      requiredSubjects: row.requiredSubjects ?? [],
      optionalSubjects: row.optionalSubjects ?? [],
      employment: row.employment ?? [],
      intro: row.intro ?? '',
    }));
  }

  /**
   * 选科匹配：选科组合 → 可报专业（满足必选科目）。
   * 规则：专业的 requiredSubjects 必须全部在学生的选科组合内。
   */
  async match(input: MatchInput): Promise<MatchResult[]> {
    const subjects = input.subjects.map((item) => item.trim()).filter(Boolean);
    const conditions = [];
    if (input.keyword) {
      conditions.push(
        or(
          ilike(admissionMajor.name, `%${input.keyword}%`),
          ilike(admissionMajor.intro, `%${input.keyword}%`),
        ),
      );
    }
    const rows = await this.db
      .select()
      .from(admissionMajor)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .limit(100);

    return rows
      .map((row) => {
        const required = row.requiredSubjects ?? [];
        const missing = required.filter((subject) => !subjects.includes(subject));
        const eligible = missing.length === 0;
        return {
          major: {
            id: row.id,
            name: row.name,
            category: row.category ?? '',
            requiredSubjects: required,
            employment: row.employment ?? [],
            intro: row.intro ?? '',
          },
          eligible,
          missing,
          reason: eligible
            ? required.length === 0
              ? '该专业不限选科'
              : `满足必选科目（${required.join('+')}）`
            : `缺少必选科目：${missing.join('、')}`,
        };
      })
      .sort((a, b) => {
        if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
        return a.missing.length - b.missing.length;
      });
  }
}
