<template>
  <div class="trends-page">
    <header class="page-header">
      <div class="header-text">
        <h1>数据趋势</h1>
        <p v-if="!loading" class="header-hint">
          <template v-if="records.length > 0">
            {{ hasActiveFilter ? `筛选结果 ${records.length} 次` : `共 ${records.length} 次产检` }}
            · 悬停查看详情 · 点击数据点跳转记录{{ records.length > 12 ? ' · 可滚轮缩放' : '' }}
          </template>
          <template v-else-if="hasActiveFilter">当前筛选条件下暂无记录</template>
        </p>
      </div>
    </header>

    <div class="filter-wrap">
      <RecordRangeFilter
        v-model="filters"
        v-model:expanded="filterExpanded"
        @apply="handleApplyFilters"
        @reset="resetFilters"
      />
    </div>

    <ChartCardsSkeleton v-if="loading" />

    <div v-else-if="records.length === 0" class="empty">
      <el-empty :description="emptyDescription">
        <el-button v-if="hasActiveFilter" @click="resetFilters">清除筛选</el-button>
        <el-button v-else type="primary" @click="goBack">返回首页</el-button>
      </el-empty>
    </div>

    <div v-else-if="!hasAnyChartData" class="empty">
      <el-empty description="暂无生理指标数据，无法生成趋势图">
        <el-button type="primary" @click="goBack">返回首页</el-button>
      </el-empty>
    </div>

    <div v-else class="charts-stack">
      <section v-if="showWeightChart" class="chart-card">
        <h2 class="chart-title">体重变化</h2>
        <div ref="weightChartRef" class="chart-body"></div>
      </section>
      <section v-if="showBpChart" class="chart-card">
        <h2 class="chart-title">血压变化</h2>
        <div ref="bpChartRef" class="chart-body"></div>
      </section>
      <section v-if="showFundalChart" class="chart-card">
        <h2 class="chart-title">宫高变化</h2>
        <div ref="fundalChartRef" class="chart-body"></div>
      </section>
      <section v-if="showAbdominalChart" class="chart-card">
        <h2 class="chart-title">腹围变化</h2>
        <div ref="abdominalChartRef" class="chart-body"></div>
      </section>
      <section v-if="showFhrChart" class="chart-card">
        <h2 class="chart-title">胎心率变化</h2>
        <div ref="fhrChartRef" class="chart-body"></div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import RecordRangeFilter from '@/components/RecordRangeFilter.vue';
import { buildVitalChartSeries, buildLineChartOption, seriesHasData } from '@/utils/chartData';
import ChartCardsSkeleton from '@/components/skeletons/ChartCardsSkeleton.vue';
import { useRecordRangeFilter } from '@/composables/useRecordRangeFilter';

const router = useRouter();

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

const emptyDescription = computed(() => (
  hasActiveFilter.value ? '没有符合筛选条件的记录' : '暂无记录，无法生成趋势图'
));

const weightChartRef = ref(null);
const bpChartRef = ref(null);
const fundalChartRef = ref(null);
const abdominalChartRef = ref(null);
const fhrChartRef = ref(null);

const chartInstances = [];

const chartSeries = computed(() => buildVitalChartSeries(records.value));

const showWeightChart = computed(() => seriesHasData(chartSeries.value.weight));
const showBpChart = computed(() =>
  seriesHasData(chartSeries.value.systolic) || seriesHasData(chartSeries.value.diastolic)
);
const showFundalChart = computed(() => seriesHasData(chartSeries.value.fundalHeight));
const showAbdominalChart = computed(() => seriesHasData(chartSeries.value.abdominalCircumference));
const showFhrChart = computed(() => seriesHasData(chartSeries.value.fetalHeartRate));

const hasAnyChartData = computed(() =>
  showWeightChart.value ||
  showBpChart.value ||
  showFundalChart.value ||
  showAbdominalChart.value ||
  showFhrChart.value
);

const bindChartClick = (chart, sortedRecords) => {
  chart.on('click', (params) => {
    const recordId = sortedRecords[params.dataIndex]?._id;
    if (recordId) {
      router.push({ name: 'RecordDetail', params: { id: recordId } });
    }
  });
};

const renderCharts = () => {
  chartInstances.forEach((chart) => chart.dispose());
  chartInstances.length = 0;

  const {
    labels,
    meta,
    sortedRecords,
    weight,
    systolic,
    diastolic,
    fundalHeight,
    abdominalCircumference,
    fetalHeartRate,
  } = chartSeries.value;

  const configs = [];

  if (showWeightChart.value) {
    configs.push({
      el: weightChartRef.value,
      option: buildLineChartOption({
        labels,
        meta,
        yAxisName: 'kg',
        series: [{ name: '体重', data: weight }],
      }),
    });
  }

  if (showBpChart.value) {
    configs.push({
      el: bpChartRef.value,
      option: buildLineChartOption({
        labels,
        meta,
        yAxisName: 'mmHg',
        color: ['#C4612F', '#8A918C'],
        showLegend: true,
        referenceRanges: [
          { min: 90, max: 140 },
          { min: 60, max: 90 },
        ],
        series: [
          { name: '收缩压', data: systolic },
          { name: '舒张压', data: diastolic },
        ],
      }),
    });
  }

  if (showFundalChart.value) {
    configs.push({
      el: fundalChartRef.value,
      option: buildLineChartOption({
        labels,
        meta,
        yAxisName: 'cm',
        series: [{ name: '宫高', data: fundalHeight }],
      }),
    });
  }

  if (showAbdominalChart.value) {
    configs.push({
      el: abdominalChartRef.value,
      option: buildLineChartOption({
        labels,
        meta,
        yAxisName: 'cm',
        color: '#8A918C',
        series: [{ name: '腹围', data: abdominalCircumference }],
      }),
    });
  }

  if (showFhrChart.value) {
    configs.push({
      el: fhrChartRef.value,
      option: buildLineChartOption({
        labels,
        meta,
        yAxisName: '次/分',
        referenceRanges: [{ min: 110, max: 160 }],
        series: [{ name: '胎心率', data: fetalHeartRate }],
      }),
    });
  }

  configs.forEach(({ el, option }) => {
    if (!el) return;
    const chart = echarts.init(el);
    chart.setOption(option);
    bindChartClick(chart, sortedRecords);
    chartInstances.push(chart);
  });
};

const handleResize = () => {
  chartInstances.forEach((chart) => chart.resize());
};

const handleApplyFilters = async (nextFilters) => {
  await applyFilters(nextFilters);
  if (records.value.length > 0 && hasAnyChartData.value) {
    await nextTick();
    renderCharts();
  }
};

watch(records, async () => {
  if (loading.value) return;
  if (records.value.length > 0 && hasAnyChartData.value) {
    await nextTick();
    renderCharts();
  } else {
    chartInstances.forEach((chart) => chart.dispose());
    chartInstances.length = 0;
  }
});

const goBack = () => {
  router.push({ name: 'Home' });
};

onMounted(async () => {
  initFromRoute();
  await fetchRecords();
  if (records.value.length > 0 && hasAnyChartData.value) {
    await nextTick();
    renderCharts();
  }
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstances.forEach((chart) => chart.dispose());
});
</script>

<style scoped>
.trends-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--spacing-lg);
}

.page-header {
  max-width: 880px;
  margin: 0 auto var(--spacing-md);
}

.filter-wrap {
  max-width: 880px;
  margin: 0 auto var(--spacing-lg);
}

.header-text h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.header-hint {
  margin: var(--spacing-xs) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.empty {
  max-width: 480px;
  margin: var(--spacing-xl) auto;
}

.charts-stack {
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.chart-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(31, 36, 33, 0.06);
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm);
}

.chart-body {
  height: 300px;
}

@media (max-width: 768px) {
  .trends-page {
    padding: var(--spacing-md);
  }

  .header-text h1 {
    font-size: 1.25rem;
  }

  .chart-body {
    height: 220px;
  }
}
</style>
