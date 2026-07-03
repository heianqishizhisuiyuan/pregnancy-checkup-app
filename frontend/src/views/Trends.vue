<template>
  <div class="trends-page">
    <header class="page-header">
      <el-button @click="goBack" text :icon="ArrowLeft">返回</el-button>
      <h1>数据趋势</h1>
    </header>

    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      加载中...
    </div>

    <div v-else-if="records.length === 0" class="empty">
      <el-empty description="暂无记录，无法生成趋势图">
        <el-button type="primary" @click="goBack">返回首页</el-button>
      </el-empty>
    </div>

    <div v-else class="charts-grid">
      <div ref="weightChartRef" class="chart-card"></div>
      <div ref="bpChartRef" class="chart-card"></div>
      <div ref="fundalChartRef" class="chart-card"></div>
      <div ref="fhrChartRef" class="chart-card"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Loading } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { getRecords } from '@/api/record';
import { buildVitalChartSeries, buildLineChartOption } from '@/utils/chartData';

const router = useRouter();
const loading = ref(true);
const records = ref([]);

const weightChartRef = ref(null);
const bpChartRef = ref(null);
const fundalChartRef = ref(null);
const fhrChartRef = ref(null);

const chartInstances = [];

const renderCharts = () => {
  const { labels, weight, systolic, diastolic, fundalHeight, fetalHeartRate } =
    buildVitalChartSeries(records.value);

  const configs = [
    {
      el: weightChartRef.value,
      option: buildLineChartOption({
        title: '体重变化',
        labels,
        yAxisName: 'kg',
        series: [{ name: '体重', data: weight }],
      }),
    },
    {
      el: bpChartRef.value,
      option: buildLineChartOption({
        title: '血压变化',
        labels,
        yAxisName: 'mmHg',
        color: ['#C4612F', '#5C635D'],
        series: [
          { name: '收缩压', data: systolic },
          { name: '舒张压', data: diastolic },
        ],
      }),
    },
    {
      el: fundalChartRef.value,
      option: buildLineChartOption({
        title: '宫高变化',
        labels,
        yAxisName: 'cm',
        series: [{ name: '宫高', data: fundalHeight }],
      }),
    },
    {
      el: fhrChartRef.value,
      option: buildLineChartOption({
        title: '胎心率变化',
        labels,
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

  // 等 loading 结束、图表容器挂载后再初始化 ECharts
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
  max-width: 1200px;
  margin: 0 auto var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty {
  max-width: 480px;
  margin: var(--spacing-xl) auto;
}

.charts-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
  gap: var(--spacing-md);
}

.chart-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  height: 320px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    height: 280px;
  }
}
</style>
