/**
 * Avatar - 精美的头像组件
 *
 * 支持三种模式：
 * 1. 图片头像：传入 avatarUrl 时显示图片 + 渐变边框
 * 2. 渐变首字母头像：无图片时显示渐变背景 + 首字母
 * 3. 可显示在线状态指示器（可选）
 *
 * 渐变颜色根据用户名哈希自动分配，确保同一用户始终显示相同颜色
 * 使用唯一 ID 避免多个头像同时渲染时的 SVG 冲突
 */

import { useMemo } from 'react';

interface AvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: number;
  className?: string;
  showRing?: boolean;
  online?: boolean;
}

// 精心挑选的渐变色对，颜色过渡更自然
const gradientPairs: [string, string, string][] = [
  // [起始色, 中间色, 结束色] - 三色渐变更加丰富
  ['#3b82f6', '#6366f1', '#8b5cf6'],  // 天蓝 → 靛蓝 → 紫
  ['#ec4899', '#f43f5e', '#fb7185'],  // 粉 → 玫瑰 → 浅玫瑰
  ['#10b981', '#14b8a6', '#06b6d4'],  // 翠绿 → 青绿 → 青
  ['#f59e0b', '#f97316', '#ef4444'],  // 琥珀 → 橘 → 红
  ['#6366f1', '#818cf8', '#a78bfa'],  // 靛蓝 → 浅靛蓝 → 薰衣草
  ['#8b5cf6', '#a855f7', '#d946ef'],  // 紫 → 亮紫 → 品红
  ['#0ea5e9', '#38bdf8', '#7dd3fc'],  // 天蓝 → 浅蓝 → 淡蓝
  ['#f43f5e', '#fb7185', '#fda4af'],  // 玫瑰 → 浅玫瑰 → 粉玫瑰
  ['#14b8a6', '#2dd4bf', '#5eead4'],  // 青绿 → 浅青绿 → 淡青
  ['#e11d48', '#f43f5e', '#fb7185'],  // 深玫瑰 → 玫瑰 → 浅玫瑰
  ['#7c3aed', '#8b5cf6', '#a78bfa'],  // 深紫 → 紫 → 浅紫
  ['#059669', '#10b981', '#34d399'],  // 深绿 → 翠绿 → 浅绿
];

let avatarCounter = 0;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  if (!name) return '?';
  // 中文名取第一个字
  if (/[\u4e00-\u9fff]/.test(name.charAt(0))) return name.charAt(0);
  // 英文名取前两个字母大写
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const Avatar = ({ name = '', avatarUrl, size = 120, className, showRing = true, online }: AvatarProps) => {
  // 每个实例使用唯一 ID 避免 SVG 渐变冲突
  const uid = useMemo(() => `av-${++avatarCounter}-${hashName(name)}`, [name]);

  const pairIndex = hashName(name) % gradientPairs.length;
  const [c1, c2, c3] = gradientPairs[pairIndex];
  const initials = getInitials(name);
  const fontSize = size * 0.34;
  const borderWidth = Math.max(2, size * 0.04);
  const innerRadius = size / 2 - borderWidth - 1;

  if (avatarUrl) {
    return (
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={className}
        style={{ flexShrink: 0, borderRadius: '50%', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2={String(size)} y2={String(size)} gradientUnits="userSpaceOnUse">
            <stop stopColor={c1} />
            <stop offset="0.5" stopColor={c2} />
            <stop offset="1" stopColor={c3} />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <circle cx={size / 2} cy={size / 2} r={innerRadius} />
          </clipPath>
          <filter id={`${uid}-shadow`}>
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={c1} floodOpacity="0.25" />
          </filter>
        </defs>
        {/* 渐变外圈 */}
        {showRing && (
          <circle
            cx={size / 2} cy={size / 2} r={size / 2 - borderWidth / 2}
            fill="none"
            stroke={`url(#${uid}-ring)`}
            strokeWidth={borderWidth}
            filter={`url(#${uid}-shadow)`}
          />
        )}
        {/* 图片 */}
        <image
          href={avatarUrl}
          x={borderWidth + 1} y={borderWidth + 1}
          width={size - (borderWidth + 1) * 2}
          height={size - (borderWidth + 1) * 2}
          clipPath={`url(#${uid}-clip)`}
          preserveAspectRatio="xMidYMid slice"
        />
        {/* 在线状态 */}
        {online !== undefined && (
          <>
            <circle
              cx={size * 0.82} cy={size * 0.82} r={size * 0.1}
              fill={online ? '#22c55e' : '#94a3b8'}
              stroke="white" strokeWidth={Math.max(1.5, size * 0.03)}
            />
          </>
        )}
      </svg>
    );
  }

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ flexShrink: 0, borderRadius: '50%' }}
    >
      <defs>
        {/* 主渐变 - 对角线方向 */}
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2={String(size)} y2={String(size)} gradientUnits="userSpaceOnUse">
          <stop stopColor={c1} />
          <stop offset="0.5" stopColor={c2} />
          <stop offset="1" stopColor={c3} />
        </linearGradient>
        {/* 外圈渐变 - 半透明 */}
        <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2={String(size)} y2={String(size)} gradientUnits="userSpaceOnUse">
          <stop stopColor={c1} stopOpacity="0.6" />
          <stop offset="1" stopColor={c3} stopOpacity="0.6" />
        </linearGradient>
        {/* 阴影滤镜 */}
        <filter id={`${uid}-shadow`}>
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={c1} floodOpacity="0.3" />
        </filter>
        {/* 内部光泽 */}
        <radialGradient id={`${uid}-sheen`} cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 外圈光晕 */}
      {showRing && (
        <circle
          cx={size / 2} cy={size / 2} r={size / 2 - borderWidth / 2}
          fill="none"
          stroke={`url(#${uid}-ring)`}
          strokeWidth={borderWidth}
        />
      )}

      {/* 渐变背景圆 */}
      <circle
        cx={size / 2} cy={size / 2} r={innerRadius}
        fill={`url(#${uid}-bg)`}
        filter={showRing ? `url(#${uid}-shadow)` : undefined}
      />

      {/* 光泽层 */}
      <circle cx={size / 2} cy={size / 2} r={innerRadius} fill={`url(#${uid}-sheen)`} />

      {/* 装饰光斑 - 主光斑 */}
      <circle cx={size * 0.33} cy={size * 0.33} r={size * 0.14} fill="white" fillOpacity="0.1" />
      {/* 装饰光斑 - 副光斑 */}
      <circle cx={size * 0.7} cy={size * 0.25} r={size * 0.06} fill="white" fillOpacity="0.08" />

      {/* 首字母 */}
      <text
        x="50%" y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="'Inter', 'Noto Sans SC', -apple-system, sans-serif"
        letterSpacing={initials.length > 1 ? '-0.02em' : '0'}
        style={{ userSelect: 'none' }}
      >
        {initials}
      </text>

      {/* 在线状态指示器 */}
      {online !== undefined && (
        <>
          <circle
            cx={size * 0.82} cy={size * 0.82} r={size * 0.1}
            fill={online ? '#22c55e' : '#94a3b8'}
            stroke="white" strokeWidth={Math.max(1.5, size * 0.03)}
          />
        </>
      )}
    </svg>
  );
};

export default Avatar;
