/** 按孕周返回常见产检项目提示（仅供参考） */
const CHECKUP_GUIDE = [
  { minWeek: 6, maxWeek: 8, items: ['确认宫内孕', '孕酮/ HCG'] },
  { minWeek: 11, maxWeek: 13, items: ['NT 筛查', '早期唐筛'] },
  { minWeek: 15, maxWeek: 20, items: ['中期唐筛', '常规产检'] },
  { minWeek: 20, maxWeek: 24, items: ['大排畸（系统超声）', '血常规'] },
  { minWeek: 24, maxWeek: 28, items: ['糖耐量试验', '血压/体重监测'] },
  { minWeek: 28, maxWeek: 32, items: ['胎心监护', '宫高腹围'] },
  { minWeek: 32, maxWeek: 36, items: ['胎位检查', 'GBS 筛查'] },
  { minWeek: 36, maxWeek: 40, items: ['胎心监护', '评估分娩方式'] },
];

export function getCheckupGuideForWeek(week) {
  if (week == null || week < 0) return null;
  const match = CHECKUP_GUIDE.find((g) => week >= g.minWeek && week <= g.maxWeek);
  return match ? { ...match } : null;
}
