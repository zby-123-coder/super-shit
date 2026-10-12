/** 批阅快捷评语（老师点一下就填入，3 秒完成批阅） */
export const PRESET_COMMENTS: string[] = [
  '完成得不错，继续保持',
  '书写很工整，值得表扬',
  '思路清晰，注意计算细节',
  '有进步，下次可以再快一点',
  '错题已订正，很好',
  '建议把相关知识点再复习一遍',
  '订正后重新提交一次',
];

/**
 * 批阅草稿（规则版）：基于打卡内容与用时给出初步评语。
 * 当前用本地规则生成，零延迟、无需外部依赖；
 * 后续可无缝替换为 LLM 生成（接口形态不变）。
 */
export function generateReviewDraft(params: {
  content: string;
  durationMin: number;
  taskTitle: string;
}): string {
  const { content, durationMin, taskTitle } = params;
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
    parts.push('已完成「%title%」'.replace('%title%', taskTitle));
  }

  return `${parts.join('；')}。`;
}
