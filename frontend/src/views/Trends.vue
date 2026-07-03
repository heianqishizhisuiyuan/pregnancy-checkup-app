<template>
  <div class="trends-page">
    <header class="page-header">
      <el-button @click="goBack" text :icon="ArrowLeft">返回</el-button>
      <div class="header-text">
        <h1>数据趋势</h1>
        <p v-if="records.length > 0" class="header-hint">
          共 {{ records.length }} 次产检 · 悬停查看详情{{ records.length > 12 ? '，可滚轮缩放' : '' }}
        </p>
      </div>
    </header>

    <ChartCardsSkeleton v-if="loading" />

    <div v-else-if="records.length === 0" class="empty">
      <el-empty description="暂无记录，无法生成趋势图">
        <el-button type="primary" @click="goBack">返回首页</el-button>
      </el-empty>
    </div>

    <div v-else class="charts-stack">
      <section class="chart-card">
        <h2 class="chart-title">体重变化</h2>
        <div ref="weightChartRef" class="chart-body"></div>
      </section>
      <section class="chart-card">
        <h2 class="chart-title">血压变化</h2>
        <div ref="bpChartRef" class="chart-body"></div>
      </section>
      <section class="chart-card">
        <h2 class="chart-title">宫高变化</h2>
        <div ref="fundalChartRef" class="chart-body"></div>
      </section>
      <section class="chart-card">
        <h2 class="chart-title">胎心率变化</h2>
        <div ref="fhrChartRef" class="chart-body"></div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { getRecords } from '@/api/record';
import { buildVitalChartSeries, buildLineChartOption } from '@/utils/chartData';
import ChartCardsSkeleton from '@/components/skeletons/ChartCardsSkeleton.vue';

const router = useRouter();
const loading = ref(true);
const records = ref([]);

const weightChartRef = ref(null);
const bpChartRef = ref(null);
const fundalChartRef = ref(null);
const fhrChartRef = ref(null);

const chartInstances = [];

const renderCharts = () => {
  chartInstances.forEach((chart) => chart.dispose());
  chartInstances.length = 0;

  const { labels, meta, weight, systolic, diastolic, fundalHeight, fetalHeartRate } =
    buildVitalChartSeries(records.value);

  const configs = [
    {
      el: weightChartRef.value,
      option: buildLineChartOption({
        labels,
        meta,
        yAxisName: 'kg',
        series: [{ name: '体重', data: weight }],
      }),
    },
    {
      el: bpChartRef.value,
      option: buildLineChartOption({
        labels,
        meta,
        yAxisName: 'mmHg',
        color: ['#C4612F', '#8A918C'],
        showLegend: true,
        series: [
          { name: '收缩压', data: systolic },
          { name: '舒张压', data: diastolic },
        ],
      }),
    },
    {
      el: fundalChartRef.value,
      option: buildLineChartOption({
        labels,
        meta,
        yAxisName: 'cm',
        series: [{ name: '宫高', data: fundalHeight }],
      }),
    },
    {
      el: fhrChartRef.value,
      option: buildLineChartOption({
        labels,
        meta,
        yAxisName: '次/分',
        series: [{ name: '胎心率', data: fetalHeartRate }],
      }),
    },
  ];

  configs.forEach(({ el, option }) => {
    if (!el) return;
    const chart = echarts.init(el);
    chart.setOption(option);
    chartInstances.push(chart);
  });
};

const handleResize = () => {
  chartInstances.forEach((chart) => chart.resize());
};

const loadRecords = async () => {
  loading.value = true;
  try {
    const res = await getRecords();
    if (res.success) {
      records.value = res.data;
    }
  } catch (error) {
    console.error('Failed to load records for trends:', error);
    ElMessage.error('加载记录失败');
  } finally {
    loading.value = false;
  }

  if (records.value.length > 0) {
    await nextTick();
    renderCharts();
  }
};

const goBack = () => {
  router.push({ name: 'Home' });
};

onMounted(() => {
  loadRecords();
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
  margin: 0 auto var(--spacing-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
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
