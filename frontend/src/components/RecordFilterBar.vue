<template>
  <div class="filter-bar">
    <el-input
      v-model="localFilters.keyword"
      placeholder="搜索医院、医生、备注..."
      clearable
      :prefix-icon="Search"
      class="filter-keyword"
      @keyup.enter="emitSearch"
    />

    <el-input
      v-model="localFilters.hospital"
      placeholder="医院"
      clearable
      class="filter-item"
      @keyup.enter="emitSearch"
    />

    <el-date-picker
      v-model="dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="YYYY-MM-DD"
      class="filter-date"
      @change="handleDateChange"
    />

    <div class="week-range">
      <el-input-number
        v-model="localFilters.minWeek"
        :min="0"
        :max="45"
        placeholder="最小孕周"
        controls-position="right"
        class="filter-week"
      />
      <span class="week-sep">-</span>
      <el-input-number
        v-model="localFilters.maxWeek"
        :min="0"
        :max="45"
        placeholder="最大孕周"
        controls-position="right"
        class="filter-week"
      />
    </div>

    <div class="filter-actions">
      <el-button type="primary" :icon="Search" @click="emitSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue', 'search']);

const localFilters = reactive({
  keyword: '',
  hospital: '',
  startDate: '',
  endDate: '',
  minWeek: null,
  maxWeek: null,
});

const dateRange = ref(null);

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(localFilters, {
      keyword: val.keyword || '',
      hospital: val.hospital || '',
      startDate: val.startDate || '',
      endDate: val.endDate || '',
      minWeek: val.minWeek ?? null,
      maxWeek: val.maxWeek ?? null,
    });
    if (val.startDate && val.endDate) {
      dateRange.value = [val.startDate, val.endDate];
    } else {
      dateRange.value = null;
    }
  },
  { immediate: true, deep: true }
);

const buildParams = () => {
  const params = {};
  if (localFilters.keyword?.trim()) params.keyword = localFilters.keyword.trim();
  if (localFilters.hospital?.trim()) params.hospital = localFilters.hospital.trim();
  if (localFilters.startDate) params.startDate = localFilters.startDate;
  if (localFilters.endDate) params.endDate = localFilters.endDate;
  if (localFilters.minWeek !== null && localFilters.minWeek !== '') {
    params.minWeek = localFilters.minWeek;
  }
  if (localFilters.maxWeek !== null && localFilters.maxWeek !== '') {
    params.maxWeek = localFilters.maxWeek;
  }
  return params;
};

const emitSearch = () => {
  const params = buildParams();
  emit('update:modelValue', params);
  emit('search', params);
};

const handleDateChange = (val) => {
  localFilters.startDate = val?.[0] || '';
  localFilters.endDate = val?.[1] || '';
};

const handleReset = () => {
  localFilters.keyword = '';
  localFilters.hospital = '';
  localFilters.startDate = '';
  localFilters.endDate = '';
  localFilters.minWeek = null;
  localFilters.maxWeek = null;
  dateRange.value = null;
  emitSearch();
};
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
}

.filter-keyword {
  flex: 1;
  min-width: 180px;
}

.filter-item {
  width: 140px;
}

.filter-date {
  width: 260px;
}

.week-range {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.filter-week {
  width: 120px;
}

.week-sep {
  color: var(--color-text-secondary);
}

.filter-actions {
  display: flex;
  gap: var(--spacing-xs);
  margin-left: auto;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-keyword,
  .filter-item,
  .filter-date,
  .filter-week {
    width: 100%;
  }

  .filter-actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
