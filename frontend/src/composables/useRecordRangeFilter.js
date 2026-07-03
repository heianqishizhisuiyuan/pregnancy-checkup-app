import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getRecords } from '@/api/record';
import { filtersToQuery, queryToFilters } from '@/utils/homeState';

/**
 * 时间轴/趋势页共用的日期与孕周筛选
 */
export function useRecordRangeFilter() {
  const route = useRoute();
  const router = useRouter();

  const filters = ref({});
  const records = ref([]);
  const loading = ref(true);
  const filterExpanded = ref(false);

  const hasActiveFilter = computed(() => Object.keys(filters.value).length > 0);

  const filterQueriesEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const syncRouteQuery = (nextFilters) => {
    const nextQuery = filtersToQuery(nextFilters);
    if (filterQueriesEqual(filtersToQuery(route.query), nextQuery)) return;
    router.replace({ query: nextQuery });
  };

  const fetchRecords = async () => {
    loading.value = true;
    try {
      const response = await getRecords(filters.value);
      if (response.success) {
        records.value = response.data;
      }
    } catch (error) {
      console.error('获取记录失败:', error);
      ElMessage.error('获取记录失败');
    } finally {
      loading.value = false;
    }
  };

  const applyFilters = (nextFilters) => {
    filters.value = { ...nextFilters };
    syncRouteQuery(filters.value);
    return fetchRecords();
  };

  const resetFilters = () => {
    filters.value = {};
    syncRouteQuery({});
    return fetchRecords();
  };

  const initFromRoute = () => {
    const fromQuery = queryToFilters(route.query);
    filters.value = fromQuery;
    filterExpanded.value = Object.keys(fromQuery).length > 0;
  };

  watch(
    () => route.query,
    (query) => {
      const fromQuery = queryToFilters(query);
      if (filterQueriesEqual(filtersToQuery(filters.value), filtersToQuery(fromQuery))) return;
      filters.value = fromQuery;
      fetchRecords();
    },
  );

  return {
    filters,
    records,
    loading,
    filterExpanded,
    hasActiveFilter,
    fetchRecords,
    applyFilters,
    resetFilters,
    initFromRoute,
  };
}
