/**
 * CategoryIcon - 资源分类图标组件
 *
 * 为资源分享页面的四大分类提供精美的 SVG 图标，
 * 每个图标拥有独特的渐变配色和辨识度高的小插画。
 * 支持两种尺寸：
 *  - "header" (28px) — 分类标题行内图标
 *  - "card"   (44px) — 资源卡片占位图标
 */

interface CategoryIconProps {
  category: string;
  size?: 'header' | 'card';
  className?: string;
}

const sizeMap = { header: 28, card: 44 };

// 分类 → 配色 & 图标 key
const categoryMeta: Record<string, { key: string; colors: [string, string] }> = {
  '开发工具': { key: 'devtools', colors: ['#3b82f6', '#6366f1'] },
  '学习资源': { key: 'learning', colors: ['#f59e0b', '#ef4444'] },
  '设计素材': { key: 'design',   colors: ['#ec4899', '#8b5cf6'] },
  '实用网站': { key: 'website',  colors: ['#06b6d4', '#3b82f6'] },
};

const CategoryIcon = ({ category, size = 'header', className }: CategoryIconProps) => {
  const meta = categoryMeta[category];
  const key = meta?.key || 'devtools';
  const [c1, c2] = meta?.colors || ['#3b82f6', '#6366f1'];
  const px = sizeMap[size];
  const uid = `cat-${key}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor={c1} stopOpacity="0.18" />
          <stop offset="1" stopColor={c2} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#${uid})`} />
      <rect x="2" y="2" width="44" height="44" rx="12" stroke={c1} strokeWidth="1" strokeOpacity="0.18" fill="none" />
      {renderPath(key, c1, c2)}
    </svg>
  );
};

function renderPath(key: string, c1: string, c2: string): React.ReactNode {
  const common = {
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  switch (key) {
    // 开发工具：代码括号 + 闪电
    case 'devtools':
      return (
        <g stroke={c1} {...common}>
          <polyline points="18,16 12,24 18,32" />
          <polyline points="30,16 36,24 30,32" />
          <path d="M22 20 L26 24 L22 28" stroke={c2} strokeWidth="1.8" />
        </g>
      );

    // 学习资源：翻开的书本 + 知识光芒
    case 'learning':
      return (
        <g stroke={c1} {...common}>
          <path d="M24 18 C20 16 16 15 13 16.5 L13 34 C16 32.5 20 33 24 35" />
          <path d="M24 18 C28 16 32 15 35 16.5 L35 34 C32 32.5 28 33 24 35" />
          <line x1="24" y1="18" x2="24" y2="35" strokeWidth="1.5" />
          {/* 知识光芒 */}
          <circle cx="24" cy="12" r="1.2" fill={c2} stroke="none" />
          <line x1="24" y1="14" x2="24" y2="16" stroke={c2} strokeWidth="1.2" />
          <line x1="21" y1="13.5" x2="22" y2="15" stroke={c2} strokeWidth="1" />
          <line x1="27" y1="13.5" x2="26" y2="15" stroke={c2} strokeWidth="1" />
        </g>
      );

    // 设计素材：调色板 + 画笔
    case 'design':
      return (
        <g stroke={c1} {...common}>
          {/* 调色板 */}
          <path d="M24 12 C15 12 10 18 10 24 C10 30 15 36 24 36 C27 36 29 34.5 29 33 C29 31.5 27.5 31 26 31 L24 31 C21 31 20 29 20 27 C20 25 22 23 24 23 L28 23 C33 23 38 19 38 16 C38 13 33 12 24 12 Z" />
          {/* 调色板上的色点 */}
          <circle cx="17" cy="20" r="2" fill="#ef4444" stroke="none" />
          <circle cx="20" cy="27" r="2" fill="#f59e0b" stroke="none" />
          <circle cx="28" cy="17" r="2" fill="#3b82f6" stroke="none" />
          <circle cx="33" cy="18" r="1.5" fill="#10b981" stroke="none" />
        </g>
      );

    // 实用网站：地球 + 连接线
    case 'website':
      return (
        <g stroke={c1} {...common}>
          <circle cx="24" cy="24" r="11" strokeWidth="1.8" />
          {/* 经纬线 */}
          <ellipse cx="24" cy="24" rx="5" ry="11" strokeWidth="1.2" />
          <line x1="13" y1="20" x2="35" y2="20" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="13" y1="28" x2="35" y2="28" strokeWidth="1" strokeOpacity="0.6" />
          {/* 连接标记 */}
          <circle cx="36" cy="14" r="3" fill={c2} fillOpacity="0.2" stroke={c2} strokeWidth="1.5" />
          <path d="M35 14 L37 14" stroke={c2} strokeWidth="1.5" />
          <path d="M36 13 L36 15" stroke={c2} strokeWidth="1.5" />
        </g>
      );

    default:
      return (
        <g stroke={c1} {...common}>
          <rect x="14" y="14" width="20" height="20" rx="4" strokeWidth="1.5" />
        </g>
      );
  }
}

export default CategoryIcon;
