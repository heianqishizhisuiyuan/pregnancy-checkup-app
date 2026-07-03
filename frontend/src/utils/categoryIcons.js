import {
  Avatar,
  Camera,
  Document,
  Filter,
  FirstAidKit,
  Goods,
  IceCreamSquare,
  Search,
  Sunrise,
  VideoCamera
} from '@element-plus/icons-vue';

// 附件分类 → Element Plus 图标（跨平台稳定显示）
export const CATEGORY_ICON_MAP = {
  B超: Camera,
  血常规: FirstAidKit,
  尿常规: Filter,
  唐筛: Search,
  糖耐: IceCreamSquare,
  肝功能: Sunrise,
  肾功能: Goods,
  NT检查: Avatar,
  四维彩超: VideoCamera,
  其他: Document
};

export function getCategoryIconComponent(category) {
  return CATEGORY_ICON_MAP[category] || Document;
}
