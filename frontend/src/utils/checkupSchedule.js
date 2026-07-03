import dayjs from 'dayjs';

/** 常见产检节奏建议（孕周 → 项目名称） */
export const STANDARD_CHECKUP_SCHEDULE = [
  { week: 12, label: 'NT 筛查' },
  { week: 16, label: '唐筛' },
  { week: 20, label: '大排畸' },
  { week: 24, label: '糖耐量' },
  { week: 28, label: '胎心监护' },
  { week: 32, label: '胎位检查' },
  { week: 36, label: '胎心监护（加强）' },
  { week: 37, label: '评估分娩' },
  { week: 38, label: '胎心监护' },
  { week: 39, label: '胎心监护' },
  { week: 40, label: '预产期评估' },
];

/** 根据末次月经计算建议产检日期 */
export function suggestNextCheckupDate(lastPeriod, currentWeek) {
  if (!lastPeriod || currentWeek == null) return null;

  const next = STANDARD_CHECKUP_SCHEDULE.find((item) => item.week > currentWeek);
  if (!next) return null;

  return dayjs(lastPeriod).add(next.week, 'week').format('YYYY-MM-DD');
}

/** 生成 ICS 日历文件内容 */
export function buildCheckupIcs({ title, date, description = '' }) {
  const start = dayjs(date).format('YYYYMMDD');
  const end = dayjs(date).add(1, 'day').format('YYYYMMDD');
  const now = dayjs().format('YYYYMMDDTHHmmss');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pregnancy Checkup App//CN',
    'BEGIN:VEVENT',
    `UID:checkup-${start}@pregnancy-app`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

/** 下载 ICS 文件 */
export function downloadCheckupIcs(options) {
  const content = buildCheckupIcs(options);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `产检提醒_${dayjs(options.date).format('YYYY-MM-DD')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
