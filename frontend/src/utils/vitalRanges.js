/** 生理指标参考范围提示（仅供参考，非医疗诊断） */
export const VITAL_RANGE_HINTS = {
  bloodPressure: '参考：收缩压 90–140 / 舒张压 60–90 mmHg',
  fetalHeartRate: '参考：110–160 次/分',
  weight: '建议与上次记录对比，关注平稳增长',
  fundalHeight: '宫高随孕周增长，可与趋势图对照',
  abdominalCircumference: '腹围变化因人而异，建议记录趋势',
};

export function getVitalHint(field) {
  return VITAL_RANGE_HINTS[field] || '';
}
