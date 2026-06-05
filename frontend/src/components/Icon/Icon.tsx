import type { LucideIcon } from 'lucide-react';
import styles from './Icon.module.css';

/**
 * 统一图标尺寸规范
 * - xs (12px): 极小图标（内联装饰、版权信息等）
 * - sm (14px): 小图标（元信息、按钮内小图标、列表项标记）
 * - md (16px): 中图标（导航链接、搜索框、卡片操作按钮）
 * - lg (18px): 大图标（操作按钮、表单按钮）
 * - xl (22px): 特大图标（板块标题）
 * - 2xl (28px): 超大图标（页面标题）
 * - hero (48px): 英雄图标（空状态占位）
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  /** 当传入 icon 为 LucideIcon 时，直接用 <Icon icon={XIcon} /> */
}

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  hero: 48,
};

/**
 * 统一图标包装组件
 * 用于替代散落在各处的 lucide-react 直接调用，统一尺寸和对齐方式
 */
const Icon = ({ icon: LucideComp, size = 'md', className, strokeWidth = 1.8, style }: IconProps) => {
  const px = sizeMap[size];
  return (
    <LucideComp
      size={px}
      strokeWidth={strokeWidth}
      className={`${styles.icon} ${className || ''}`}
      style={style}
    />
  );
};

export default Icon;
