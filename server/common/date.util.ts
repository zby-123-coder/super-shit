import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const BUSINESS_TIMEZONE = 'Asia/Shanghai';

/** 当前业务时区下的自然日起点 */
export function startOfBusinessDay(date: Date = new Date()): Date {
  return dayjs(date).tz(BUSINESS_TIMEZONE).startOf('day').toDate();
}

/** 某天所在自然周（周一为起点）的起止时间 */
export function weekRange(date: Date = new Date()): {
  weekStart: Date;
  weekEnd: Date;
} {
  const base = dayjs(date).tz(BUSINESS_TIMEZONE).startOf('day');
  const offset = base.day() === 0 ? 6 : base.day() - 1;
  const weekStart = base.subtract(offset, 'day');
  return {
    weekStart: weekStart.toDate(),
    weekEnd: weekStart.add(6, 'day').endOf('day').toDate(),
  };
}

/** 业务时区下的 yyyy-MM-dd，用于打卡连续天数等自然日计算 */
export function businessDayKey(date: Date = new Date()): string {
  return dayjs(date).tz(BUSINESS_TIMEZONE).format('YYYY-MM-DD');
}

export function formatBusinessTime(
  date: Date | string,
  format = 'YYYY-MM-DD HH:mm',
): string {
  return dayjs(date).tz(BUSINESS_TIMEZONE).format(format);
}

export { dayjs };
