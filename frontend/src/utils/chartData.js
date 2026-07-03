import dayjs from 'dayjs';
import { formatGestationalAge } from './date.js';

/** 计算应显示 X 轴标签的数据点索引（始终包含首尾） */
export function buildAxisLabelShowIndexes(total, maxLabels = 8) {
  if (total <= 0) return new Set();
  if (total <= maxLabels) {
    return new Set(Array.from({ length: total }, (_, i) => i));
  }

  const indexes = new Set([0, total - 1]);
  for (let i = 1; i < maxLabels - 1; i += 1) {
    indexes.add(Math.round((i * (total - 1)) / (maxLabels - 1)));
  }
  return indexes;
}

/**
 * 生成 X 轴标签：优先使用产检日期，同一天多次则追加序号
 */
export function buildChartAxisLabels(records) {
  const dateCounts = {};

  return records.map((record) => {
    const dateKey = dayjs(record.checkupDate).format('MM-DD');
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
    if (dateCounts[dateKey] === 1) return dateKey;
    return `${dateKey}(${dateCounts[dateKey]})`;
  });
}

/**
 * 按产检日期升序排列，提取图表数据点
 */
export function buildVitalChartSeries(records) {
  const sorted = [...records].sort(
    (a, b) => dayjs(a.checkupDate).valueOf() - dayjs(b.checkupDate).valueOf()
  );

  const labels = buildChartAxisLabels(sorted);
  const meta = [];
  const weight = [];
  const systolic = [];
  const diastolic = [];
  const fundalHeight = [];
  const abdominalCircumference = [];
  const fetalHeartRate = [];

  sorted.forEach((record) => {
    meta.push({
      date: dayjs(record.checkupDate).format('YYYY-MM-DD'),
      gestational: formatGestationalAge(record.gestationalWeek, record.gestationalDay),
    });

    const vitals = record.vitals || {};
    weight.push(vitals.weight ?? null);
    systolic.push(vitals.bloodPressure?.systolic ?? null);
    diastolic.push(vitals.bloodPressure?.diastolic ?? null);
    fundalHeight.push(vitals.fundalHeight ?? null);
    abdominalCircumference.push(vitals.abdominalCircumference ?? null);
    fetalHeartRate.push(vitals.fetalHeartRate ?? null);
  });

  return {
    labels,
    meta,
    weight,
    systolic,
    diastolic,
    fundalHeight,
    abdominalCircumference,
    fetalHeartRate,
  };
}

/**
 * 构建 ECharts 折线图配置
 */
export function buildLineChartOption({
  labels,
  meta,
  series,
  yAxisName,
  color = '#C4612F',
  showLegend = false,
}) {
  const count = labels.length;
  const dense = count > 12;
  const colors = Array.isArray(color) ? color : [color];
  const labelShowIndexes = buildAxisLabelShowIndexes(count);

  return {
    ...(showLegend && {
      legend: {
        top: 0,
        right: 0,
        itemWidth: 16,
        itemHeight: 8,
        textStyle: { color: '#5C635D', fontSize: 12 },
      },
    }),
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(251, 249, 245, 0.96)',
      borderColor: '#E8E4DC',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#1F2421', fontSize: 13 },
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#C4612F', width: 1, type: 'dashed' },
      },
      formatter(params) {
        if (!params?.length) return '';
        const idx = params[0].dataIndex;
        const point = meta?.[idx];
        const header = point ? `${point.date} · ${point.gestational}` : params[0].axisValue;
        const lines = params
          .filter((p) => p.value != null && p.value !== '')
          .map((p) => `${p.marker} ${p.seriesName}：<strong>${p.value}</strong> ${yAxisName}`);
        return `<div style="font-weight:600;margin-bottom:6px">${header}</div>${lines.join('<br/>')}`;
      },
    },
    grid: {
      left: 48,
      right: 16,
      top: showLegend ? 32 : 12,
      bottom: 28,
    },
    ...(dense && {
      dataZoom: [{ type: 'inside', xAxisIndex: 0 }],
    }),
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E8E4DC' } },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 11,
        color: '#8A918C',
        interval: 0,
        hideOverlap: false,
        margin: 10,
        formatter: (_value, index) => (labelShowIndexes.has(index) ? labels[index] : ''),
      },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameTextStyle: { color: '#8A918C', fontSize: 11 },
      scale: true,
      splitNumber: 4,
      axisLabel: { color: '#8A918C', fontSize: 11 },
      splitLine: { lineStyle: { color: '#F0ECE4', type: 'dashed' } },
    },
    series: series.map((item) => ({
      ...item,
      type: 'line',
      smooth: 0.35,
      connectNulls: false,
      showSymbol: !dense,
      symbolSize: dense ? 0 : 6,
      lineStyle: { width: 2.5, cap: 'round' },
      emphasis: {
        focus: 'series',
        showSymbol: true,
        symbolSize: 8,
      },
      ...(series.length === 1 && {
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(196, 97, 47, 0.14)' },
              { offset: 1, color: 'rgba(196, 97, 47, 0.02)' },
            ],
          },
        },
      }),
    })),
    color: colors,
  };
}
