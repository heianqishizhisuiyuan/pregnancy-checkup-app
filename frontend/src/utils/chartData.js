import dayjs from 'dayjs';
import { formatGestationalAge } from './date.js';

/**
 * 按产检日期升序排列，提取图表数据点
 */
export function buildVitalChartSeries(records) {
  const sorted = [...records].sort(
    (a, b) => dayjs(a.checkupDate).valueOf() - dayjs(b.checkupDate).valueOf()
  );

  const labels = [];
  const weight = [];
  const systolic = [];
  const diastolic = [];
  const fundalHeight = [];
  const fetalHeartRate = [];

  sorted.forEach((record) => {
    labels.push(
      `${dayjs(record.checkupDate).format('MM-DD')}\n${formatGestationalAge(record.gestationalWeek, record.gestationalDay)}`
    );

    const vitals = record.vitals || {};
    weight.push(vitals.weight ?? null);
    systolic.push(vitals.bloodPressure?.systolic ?? null);
    diastolic.push(vitals.bloodPressure?.diastolic ?? null);
    fundalHeight.push(vitals.fundalHeight ?? null);
    fetalHeartRate.push(vitals.fetalHeartRate ?? null);
  });

  return { labels, weight, systolic, diastolic, fundalHeight, fetalHeartRate };
}

/**
 * 构建 ECharts 折线图配置
 */
export function buildLineChartOption({ title, labels, series, yAxisName, color = '#C4612F' }) {
  return {
    title: {
      text: title,
      left: 0,
      textStyle: { fontSize: 14, fontWeight: 600, color: '#1F2421' },
    },
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 24, top: 48, bottom: 64 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { fontSize: 11, color: '#5C635D', interval: 0, rotate: labels.length > 6 ? 30 : 0 },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      axisLabel: { color: '#5C635D' },
    },
    series: series.map((item) => ({
      ...item,
      type: 'line',
      smooth: true,
      connectNulls: false,
      symbolSize: 8,
    })),
    color: Array.isArray(color) ? color : [color],
  };
}
