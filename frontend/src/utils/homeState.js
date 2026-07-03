const STORAGE_KEY = 'pregnancy_home_state';

/** 从 sessionStorage 恢复首页筛选与分页状态 */
export function loadHomeState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 持久化首页筛选与分页状态 */
export function saveHomeState({ filters, currentPage, pageSize, filterExpanded }) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    filters: filters || {},
    currentPage: currentPage || 1,
    pageSize: pageSize || 20,
    filterExpanded: !!filterExpanded,
  }));
}

/** 将筛选条件同步到 URL query（便于分享与刷新） */
export function filtersToQuery(filters = {}) {
  const query = {};
  if (filters.keyword) query.keyword = filters.keyword;
  if (filters.hospital) query.hospital = filters.hospital;
  if (filters.startDate) query.startDate = filters.startDate;
  if (filters.endDate) query.endDate = filters.endDate;
  if (filters.minWeek != null) query.minWeek = String(filters.minWeek);
  if (filters.maxWeek != null) query.maxWeek = String(filters.maxWeek);
  return query;
}

/** 从 URL query 解析筛选条件 */
export function queryToFilters(query = {}) {
  const filters = {};
  if (query.keyword) filters.keyword = query.keyword;
  if (query.hospital) filters.hospital = query.hospital;
  if (query.startDate) filters.startDate = query.startDate;
  if (query.endDate) filters.endDate = query.endDate;
  if (query.minWeek != null && query.minWeek !== '') {
    filters.minWeek = Number(query.minWeek);
  }
  if (query.maxWeek != null && query.maxWeek !== '') {
    filters.maxWeek = Number(query.maxWeek);
  }
  return filters;
}
