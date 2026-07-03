<template>
  <div v-if="showBar" class="filter-section">
    <div v-if="!expanded && activeTags.length" class="filter-tags">
      <el-tag
        v-for="tag in activeTags"
        :key="tag.key"
        size="small"
        type="info"
        closable
        @close="clearFilter(tag.key)"
      >
        {{ tag.label }}
      </el-tag>
    </div>

    <el-collapse-transition>
      <div v-show="expanded" class="filter-panel">
        <div class="filter-row filter-row--keyword">
          <el-input
            v-model="localFilters.keyword"
            placeholder="搜索医院、医生、备注..."
            clearable
            :prefix-icon="Search"
            @keyup.enter="emitSearch"
          />
        </div>

        <div class="filter-row filter-row--fields">
          <el-input
            v-model="localFilters.hospital"
            placeholder="医院"
            clearable
            @keyup.enter="emitSearch"
          />

          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />

          <div class="week-range">
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
        </div>

        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="emitSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
});

const expanded = defineModel('expanded', { default: false });

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

const activeTags = computed(() => {
  const tags = [];
  if (localFilters.keyword?.trim()) {
    tags.push({ key: 'keyword', label: `关键词: ${localFilters.keyword.trim()}` });
  }
  if (localFilters.hospital?.trim()) {
    tags.push({ key: 'hospital', label: `医院: ${localFilters.hospital.trim()}` });
  }
  if (localFilters.startDate && localFilters.endDate) {
    tags.push({
      key: 'dateRange',
      label: `日期: ${localFilters.startDate} ~ ${localFilters.endDate}`,
    });
  }
  if (localFilters.minWeek !== null && localFilters.minWeek !== '') {
    tags.push({ key: 'minWeek', label: `最小孕周: ${localFilters.minWeek}` });
  }
  if (localFilters.maxWeek !== null && localFilters.maxWeek !== '') {
    tags.push({ key: 'maxWeek', label: `最大孕周: ${localFilters.maxWeek}` });
  }
  return tags;
});

const showBar = computed(() => expanded.value || activeTags.value.length > 0);

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

const clearFilter = (key) => {
  if (key === 'keyword') localFilters.keyword = '';
  else if (key === 'hospital') localFilters.hospital = '';
  else if (key === 'dateRange') {
    localFilters.startDate = '';
    localFilters.endDate = '';
    dateRange.value = null;
  } else if (key === 'minWeek') localFilters.minWeek = null;
  else if (key === 'maxWeek') localFilters.maxWeek = null;
  emitSearch();
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
.filter-section {
  margin-bottom: var(--spacing-lg);
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.filter-panel {
  padding: var(--spacing-md);
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.filter-row--keyword {
  width: 100%;
}

.filter-row--fields {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(240px, 2fr) minmax(200px, 1.5fr);
  gap: var(--spacing-sm);
  align-items: center;
}

.week-range {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.week-range .el-input-number {
  flex: 1;
  min-width: 0;
}

.week-sep {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs);
}

@media (max-width: 768px) {
  .filter-row--fields {
    grid-template-columns: 1fr;
  }
}
</style>
