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
 * 规则版 AI 提供方：零依赖、零延迟、可解释。
 * 作为 LLM 不可用时的默认实现，保证功能永远可用。
 */
export class RuleAiProvider implements AiProvider {
  readonly name = 'rule';

  async polishWeeklyReport(input: WeeklyReportInput): Promise<string> {
    const { stats, studentName } = input;
    const lines: string[] = [];
    lines.push(
      `本周${studentName}共完成任务 ${stats.taskApproved}/${stats.taskTotal} 个，` +
        `打卡 ${stats.checkinCount} 次，累计学习 ${stats.totalMinutes} 分钟。`,
    );
    if (stats.courseDone > 0) {
      lines.push(
        `上课 ${stats.courseDone} 节，消耗课时 ${stats.consumedLessons}，剩余 ${stats.remainingLessons}。`,
      );
    }
    const lagging = input.progress.filter((p) => p.percent < 50);
    if (lagging.length > 0) {
      lines.push(
        `需要关注：${lagging.map((p) => `${p.subject}·${p.chapter}`).join('、')} 完成度偏低。`,
      );
    }
    const done = input.progress.filter((p) => p.percent >= 70);
    if (done.length > 0) {
      lines.push(
        `进展良好：${done.map((p) => `${p.subject}·${p.chapter}`).join('、')}。`,
      );
    }
    return lines.join('\n');
  }

  async reviewDraft(input: ReviewDraftInput): Promise<string> {
    const { content, durationMin, taskTitle } = input;
    const parts: string[] = [];
    if (durationMin >= 40) {
      parts.push('这次投入了很充分的时间');
    } else if (durationMin > 0 && durationMin < 15) {
      parts.push('用时偏短，注意完成质量');
    }
    if (content.includes('错') && (content.includes('订正') || content.includes('改'))) {
      parts.push('主动订正错题的态度很好');
    }
    if (/不会|不懂|没听懂|卡住/.test(content)) {
      parts.push('有知识点没掌握，建议课后重点讲解');
    }
    if (content.length >= 50) {
      parts.push('记录得很详细，能看出认真思考');
    } else if (content.length > 0 && content.length < 10) {
      parts.push('描述可以再具体一些');
    }
    if (parts.length === 0) {
      parts.push(`已完成「${taskTitle}」`);
    }
    return `${parts.join('；')}。`;
  }

  async opsContent(input: OpsContentInput): Promise<OpsContentResult> {
    const topic = `${input.grade}${input.subject}`;
    const material = (input.material ?? '').trim();
    if (!material) {
      // 无素材：给出选题提示（规则版）
      return {
        available: true,
        summary: `今日选题建议：${input.region}${topic}阶段常见薄弱点与提分案例。可粘贴一条新闻/学员进步数据让 AI 生成完整文案。`,
        posts: [
          {
            platform: 'moments',
            title: `${topic}学习建议`,
            text: `${input.region}的${topic}家长注意：阶段测评后及时查漏补缺，比盲目刷题更有效。需要学情诊断的家长可以私聊我。`,
          },
        ],
      };
    }
    // 有素材：截取式摘要 + 模板文案
    const digest = material.length > 120 ? `${material.slice(0, 120)}…` : material;
    return {
      available: true,
      summary: `素材摘要：${digest}`,
      posts: [
        {
          platform: 'moments',
          title: `${topic}重要信息`,
          text: `${input.region}${topic}家长关注：${digest} 看懂这一条，少走半年弯路。详情私聊。`,
        },
        {
          platform: 'official',
          title: `${input.region}${topic}：家长必须知道的变化`,
          text: `正文引导：${digest}\n\n本文为${input.region}${topic}家长解读相关政策与学习建议，文末可加学情诊断入口。`,
        },
      ],
    };
  }

  async gradeHomework(_input: HomeworkGradeInput): Promise<HomeworkGradeResult> {
    // 规则版无识图能力：明确告知前端配置 AI_API_KEY 后启用
    return {
      available: false,
      items: [],
      summary: '当前为规则版 AI（未配置 AI_API_KEY），暂不支持识图批改；配置后即可自动识别作业图片。',
    };
  }

  async variant(input: VariantInput): Promise<string | null> {
    // 数字等价替换：仅对算术型题目有效，非算术题交给老师人工出题
    const numbers = input.title.match(/\d+(\.\d+)?/g);
    if (!numbers || numbers.length === 0) return null;
    const used = new Set<string>();
    return input.title.replace(/\d+(\.\d+)?/g, (match) => {
      const value = Number(match);
      if (!Number.isFinite(value) || value <= 0) return match;
      let next = value;
      for (let i = 0; i < 8; i += 1) {
        const delta = Math.max(1, Math.round(value * 0.2));
        next =
          value +
          (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * delta));
        if (next > 0 && !used.has(String(next))) break;
      }
      used.add(String(next));
      return Number.isInteger(value) ? String(next) : next.toFixed(1);
    });
  }
}
