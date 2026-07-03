import dayjs from 'dayjs';

/** 根据筛选条件生成导出文件名 */
export function buildExportFilename(filters = {}) {
  const date = dayjs().format('YYYY-MM-DD');
  const parts = ['产检记录', date];

  if (filters.startDate || filters.endDate) {
    const start = filters.startDate ? dayjs(filters.startDate).format('YYYYMMDD') : '';
    const end = filters.endDate ? dayjs(filters.endDate).format('YYYYMMDD') : '';
    parts.push(`${start || '起'}_${end || '今'}`);
  }

  if (filters.minWeek != null || filters.maxWeek != null) {
    const min = filters.minWeek ?? 0;
    const max = filters.maxWeek ?? 45;
    parts.push(`孕${min}-${max}周`);
  }

  if (filters.hospital) {
    parts.push(filters.hospital.slice(0, 8));
  }

  if (filters.keyword) {
    parts.push(filters.keyword.trim().slice(0, 8));
  }

  return parts.join('_');
}
