import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/drizzle';
import { article } from '@server/database/schema';
import { AiService } from '@server/common/ai/ai.service';
import type { OpsContentInput } from '@server/common/ai/ai.types';

export interface OpsGenerateRequest extends OpsContentInput {
  /** 生成后是否直接存为内容中心草稿 */
  saveDraft?: boolean;
}

/**
 * 新媒体运营工作流：
 * 1. 选题参数（年级/地域/学科）+ 素材 → AI 生成信息摘要 + 三平台文案
 * 2. 可一键存为内容中心草稿，编辑后发布
 *
 * 说明：每日"社会重要信息"的实时抓取需要搜索 API（如博查/SerpAPI），
 * 当前 MVP 采用「运营粘贴素材 + AI 摘要改写」与「周期节点选题」两种模式，
 * 搜索 API 接入点已预留（见 docs/接入与部署说明.md）。
 */
@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly aiService: AiService,
  ) {}

  async generate(userId: string, input: OpsGenerateRequest) {
    const result = await this.aiService.opsContent({
      grade: input.grade,
      region: input.region,
      subject: input.subject,
      material: input.material,
      today: new Date().toISOString().slice(0, 10),
    });

    let draftId: string | null = null;
    if (input.saveDraft && result.posts.length > 0) {
      // 存为内容中心草稿（取第一个平台文案作为正文种子）
      const first = result.posts[0];
      const body = [
        `【信息摘要】${result.summary}`,
        '',
        ...result.posts.map((post) => `【${post.platform}】\n${post.text}`),
      ].join('\n');
      const inserted = await this.db
        .insert(article)
        .values({
          title: first.title || `${input.grade}${input.subject}运营文案`,
          columnType: 'case',
          summary: result.summary.slice(0, 255),
          content: body,
          status: 'draft',
        })
        .returning();
      draftId = inserted[0].id;
    }
    return { ...result, draftId };
  }

  /** 今日选题提示：基于学期节点给出选题建议（规则化，不依赖实时新闻） */
  dailyTips(): { date: string; tips: { topic: string; reason: string }[] } {
    const now = new Date();
    const month = now.getMonth() + 1;
    const tips: { topic: string; reason: string }[] = [];
    if (month >= 1 && month <= 2) {
      tips.push({ topic: '期末复盘/寒假计划', reason: '年初是家长规划寒假学习的高峰期' });
    }
    if (month >= 4 && month <= 6) {
      tips.push({ topic: '期中冲刺/学习方法', reason: '学期中段，提分需求集中爆发' });
    }
    if (month >= 7 && month <= 8) {
      tips.push({ topic: '暑期招生/新学期预习', reason: '招生黄金季，家长比对辅导机构' });
    }
    if (month >= 9 && month <= 11) {
      tips.push({ topic: '升学规划/学期规划', reason: '开学季，家长关注新学期安排' });
    }
    if (month === 12) {
      tips.push({ topic: '年度成长报告/寒假蓄力', reason: '年终总结 + 寒假班预售窗口' });
    }
    tips.push({
      topic: '学员进步案例',
      reason: '用本周真实打卡与进度数据制作案例，可信度最高',
    });
    return { date: now.toISOString().slice(0, 10), tips };
  }

  /** 运营草稿列表（内容中心 draft） */
  async drafts() {
    const rows = await this.db
      .select()
      .from(article)
      .where(eq(article.status, 'draft'))
      .orderBy(desc(article.createdAt))
      .limit(50);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary ?? '',
      createdAt: row.createdAt,
    }));
  }
}
