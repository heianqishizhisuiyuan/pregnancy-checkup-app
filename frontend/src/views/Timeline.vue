<template>
  <div ref="timelinePageRef" class="timeline-page">
    <div
      class="pull-refresh-indicator"
      :style="{
        height: pullDistance ? `${pullDistance}px` : pulling ? '40px' : '0',
        overflow: 'hidden',
      }"
    >
      <template v-if="pulling">刷新中...</template>
      <template v-else-if="pullDistance >= 72">释放刷新</template>
      <template v-else-if="pullDistance > 0">下拉刷新</template>
    </div>

    <header class="page-header">
      <div class="header-text">
        <h1>产检时间轴</h1>
        <p v-if="!loading" class="header-hint">
          {{ hasActiveFilter ? `筛选结果 ${records.length} 次产检` : `共 ${records.length} 次产检` }}
        </p>
      </div>
    </header>

    <div class="filter-wrap">
      <RecordRangeFilter
        v-model="filters"
        v-model:expanded="filterExpanded"
        @apply="applyFilters"
        @reset="resetFilters"
      />
    </div>

    <TimelineListSkeleton v-if="loading" />

    <div v-else-if="records.length === 0" class="empty">
      <el-empty :description="emptyDescription">
        <el-button v-if="isOwner && !hasActiveFilter" type="primary" @click="goToAddRecord">
          添加第一条记录
        </el-button>
        <el-button v-else-if="hasActiveFilter" @click="resetFilters">清除筛选</el-button>
      </el-empty>
    </div>

    <div v-else class="timeline-container">
      <template v-for="group in groupedRecords" :key="group.key">
        <div class="month-header">{{ group.label }}</div>
        <TimelineItem
          v-for="record in group.records"
          :key="record._id"
          :record="record"
          @click="goToDetail"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TimelineItem from '@/components/TimelineItem.vue';
import RecordRangeFilter from '@/components/RecordRangeFilter.vue';
import TimelineListSkeleton from '@/components/skeletons/TimelineListSkeleton.vue';
import { useAuthStore } from '@/stores/auth';
import { groupRecordsByMonth } from '@/utils/timelineGroups.js';
import { usePullToRefresh } from '@/composables/usePullToRefresh';
import { useRecordRangeFilter } from '@/composables/useRecordRangeFilter';

const router = useRouter();
const authStore = useAuthStore();

const {
  filters,
  records,
  loading,
  filterExpanded,
  hasActiveFilter,
  fetchRecords,
  applyFilters,
  resetFilters,
  initFromRoute,
} = useRecordRangeFilter();

const timelinePageRef = ref(null);
const groupedRecords = computed(() => groupRecordsByMonth(records.value));
const isOwner = computed(() => authStore.isOwner);

const emptyDescription = computed(() => {
  if (hasActiveFilter.value) return '没有符合筛选条件的记录';
  return isOwner.value ? '还没有产检记录' : '还没有产检记录，请联系主账号添加';
});

const { pulling, pullDistance } = usePullToRefresh(timelinePageRef, fetchRecords);

const goToDetail = (recordId) => {
  router.push(`/record/${recordId}`);
};

const goToAddRecord = () => {
  router.push('/record/new');
};

onMounted(() => {
  initFromRoute();
  fetchRecords();
});
</script>

<style scoped>
.timeline-page {
  background: var(--color-bg-primary);
  padding: var(--spacing-lg);
}

.page-header {
  max-width: 800px;
  margin: 0 auto var(--spacing-md);
}

.filter-wrap {
  max-width: 800px;
  margin: 0 auto var(--spacing-md);
}

.header-text h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.header-hint {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.empty {
  max-width: 800px;
  margin: var(--spacing-xl) auto;
  text-align: center;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
}

.month-header {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: var(--spacing-lg) 0 var(--spacing-md);
  padding-left: 40px;
}

.month-header:first-child {
  margin-top: 0;
}

@media (max-width: 768px) {
  .timeline-page {
    padding: var(--spacing-md);
  }
}
</style>
