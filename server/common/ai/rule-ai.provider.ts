import type {
  AiProvider,
  DiagnoseInput,
  DiagnoseResult,
  ExplainInput,
  ExplainResult,
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

  /**
   * 规则版诊断：可解释优先——每个结论都直接引用维度分数与错因数据。
   * 教育测量学口径：低于 60 分判弱、高于 80 分判强，处方与最弱维度挂钩。
   */
  async diagnose(input: DiagnoseInput): Promise<DiagnoseResult> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const prescriptions: { action: string; reason: string }[] = [];
    for (const dim of input.dimensions) {
      if (dim.score >= 80) {
        strengths.push(`${dim.label}表现良好（${dim.score} 分）：${dim.detail}`);
      } else if (dim.score < 60) {
        weaknesses.push(`${dim.label}偏弱（${dim.score} 分）：${dim.detail}`);
      }
    }
    const weakest = [...input.dimensions].sort((a, b) => a.score - b.score)[0];
    if (weakest && weakest.score < 80) {
      const actionMap: Record<string, string> = {
        投入度: '与老师约定每周最低打卡频次，先从建立节奏感开始',
        完成质量: '本周挑 2 次打卡重点打磨过程完整性，减少被退回',
        知识掌握: '集中订正错题本中未解决的题目，优先攻克最高频错因',
        持续性: '固定每日学习时段，用短时高频替代集中突击',
      };
      prescriptions.push({
        action: actionMap[weakest.label] ?? `针对「${weakest.label}」制定专项提升计划`,
        reason: `${weakest.label}是当前最弱维度（${weakest.score} 分）`,
      });
    }
    if (input.topReasons.length > 0) {
      const top = input.topReasons[0];
      prescriptions.push({
        action: `针对「${top.reason}」类错题做专项讲解与练习（可由老师在题库检索同类题）`,
        reason: `${input.days} 天内出现 ${top.count} 次，为最高频错因`,
      });
    }
    if (prescriptions.length === 0) {
      prescriptions.push({
        action: '维持当前节奏，可按月做一次学情复盘',
        reason: '各维度均衡，暂无显著短板',
      });
    }
    return {
      summary:
        `${input.studentName}近 ${input.days} 天：` +
        input.dimensions.map((d) => `${d.label} ${d.score}`).join('，') +
        `。${weaknesses.length > 0 ? `主要短板在${weaknesses.map((w) => w.split(' ')[0]).join('、')}。` : '各维度均衡。'}`,
      strengths,
      weaknesses,
      prescriptions,
    };
  }

  /**
   * 规则版不假装会讲题：明确告知未启用 AI 讲解，
   * 并按错因给出可操作的学习建议（诚实降级 > 生成误导内容）。
   */
  async explainQuestion(input: ExplainInput): Promise<ExplainResult> {
    const adviceByReason: Record<string, string> = {
      概念不清: '先回到课本把相关概念和公式抄写一遍，再合上书复述定义',
      计算失误: '把计算过程完整写出，每步检查符号与运算优先级',
      审题偏差: '用笔圈出题干关键词与问题，再动笔',
      步骤缺失: '对照标准解题步骤，检查自己跳过了哪一步',
      未作答: '先写下已知条件和相关问题，尝试列出可用公式',
    };
    const advice = input.wrongReason
      ? adviceByReason[input.wrongReason] ?? '先独立思考 5 分钟，再对照解析'
      : '先独立思考 5 分钟，再对照解析';
    return {
      available: false,
      steps: [
        { phase: 'read', text: `题目：${input.title}` },
        { phase: 'hint', text: `建议：${advice}` },
      ],
      similarTip: '可在错题本点「举一反三」获取同类题练习',
      encouragement: '配置 AI_API_KEY 后可获得分步引导讲解',
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
