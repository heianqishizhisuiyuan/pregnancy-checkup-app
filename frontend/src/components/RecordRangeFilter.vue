<template>
  <div class="range-filter">
    <div class="range-filter-header">
      <span class="range-filter-title">筛选范围</span>
      <el-button text size="small" @click="expanded = !expanded">
        {{ expanded ? '收起' : '展开' }}
      </el-button>
    </div>

    <el-collapse-transition>
      <div v-show="expanded" class="range-filter-panel">
        <div class="filter-row">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            @change="handleDateChange"
          />
        </div>

        <div class="filter-row week-range">
          <el-input-number
            v-model="localFilters.minWeek"
            :min="0"
            :max="45"
            placeholder="最小孕周"
            controls-position="right"
          />
          <span class="week-sep">-</span>
          <el-input-number
            v-model="localFilters.maxWeek"
            :min="0"
            :max="45"
            placeholder="最大孕周"
            controls-position="right"
          />
        </div>

        <div class="filter-actions">
          <el-button type="primary" size="small" @click="handleApply">应用</el-button>
          <el-button size="small" @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-collapse-transition>

    <div v-if="!expanded && activeTags.length" class="active-tags">
      <el-tag
        v-for="tag in activeTags"
        :key="tag.key"
        size="small"
        type="info"
        closable
        @close="clearTag(tag.key)"
      >
        {{ tag.label }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  expanded: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'update:expanded', 'apply', 'reset']);

const localFilters = reactive({
  startDate: '',
  endDate: '',
  minWeek: undefined,
  maxWeek: undefined,
});

const dateRange = ref(null);

const expanded = computed({
  get: () => props.expanded,
  set: (value) => emit('update:expanded', value),
});

const syncFromProps = (filters = {}) => {
  localFilters.startDate = filters.startDate || '';
  localFilters.endDate = filters.endDate || '';
  localFilters.minWeek = filters.minWeek ?? undefined;
  localFilters.maxWeek = filters.maxWeek ?? undefined;
  dateRange.value = filters.startDate && filters.endDate
    ? [filters.startDate, filters.endDate]
    : null;
};

watch(() => props.modelValue, syncFromProps, { immediate: true, deep: true });

const buildFilters = () => {
  const next = {};
  if (localFilters.startDate) next.startDate = localFilters.startDate;
  if (localFilters.endDate) next.endDate = localFilters.endDate;
  if (localFilters.minWeek != null && localFilters.minWeek !== '') {
    next.minWeek = localFilters.minWeek;
  }
  if (localFilters.maxWeek != null && localFilters.maxWeek !== '') {
    next.maxWeek = localFilters.maxWeek;
  }
  return next;
};

const activeTags = computed(() => {
  const tags = [];
  const f = props.modelValue;
  if (f.startDate && f.endDate) {
    tags.push({
      key: 'date',
      label: `${dayjs(f.startDate).format('M/D')}-${dayjs(f.endDate).format('M/D')}`,
    });
  }
  if (f.minWeek != null || f.maxWeek != null) {
    const min = f.minWeek ?? 0;
    const max = f.maxWeek ?? 45;
    tags.push({ key: 'week', label: `孕${min}-${max}周` });
  }
  return tags;
});

const handleDateChange = (range) => {
  if (range?.length === 2) {
    localFilters.startDate = range[0];
    localFilters.endDate = range[1];
  } else {
    localFilters.startDate = '';
    localFilters.endDate = '';
  }
};

const handleApply = () => {
  const next = buildFilters();
  emit('update:modelValue', next);
  emit('apply', next);
};

const handleReset = () => {
  localFilters.startDate = '';
  localFilters.endDate = '';
  localFilters.minWeek = undefined;
  localFilters.maxWeek = undefined;
  dateRange.value = null;
  emit('update:modelValue', {});
  emit('reset');
};

const clearTag = (key) => {
  if (key === 'date') {
    localFilters.startDate = '';
    localFilters.endDate = '';
    dateRange.value = null;
  } else if (key === 'week') {
    localFilters.minWeek = undefined;
    localFilters.maxWeek = undefined;
  }
  handleApply();
};
</script>

<style scoped>
.range-filter {
  margin-bottom: var(--spacing-md);
}

.range-filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.range-filter-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.range-filter-panel {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.filter-row {
  margin-bottom: var(--spacing-sm);
}

.week-range {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.week-range :deep(.el-input-number) {
  flex: 1;
}

.week-sep {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.filter-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.active-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--spacing-xs);
}
</style>
