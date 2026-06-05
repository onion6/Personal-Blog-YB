/**
 * HobbyIcon - 统一风格的兴趣爱好图标集
 *
 * 每个图标使用 48x48 viewBox，包含：
 * - 柔和渐变圆形背景
 * - 干净的线条图形（strokeWidth=2, round cap/join）
 * - 与项目主色调一致的配色方案
 */

const ICON_SIZE = 48;
const BG_R = 22;

// 每个图标的渐变配色
const gradients: Record<string, [string, string]> = {
  programming: ['#3b82f6', '#6366f1'],
  opensource:  ['#8b5cf6', '#a78bfa'],
  reading:     ['#f59e0b', '#f97316'],
  running:     ['#10b981', '#34d399'],
  photography: ['#6366f1', '#818cf8'],
  coffee:      ['#92400e', '#d97706'],
  music:       ['#ec4899', '#f472b6'],
  travel:      ['#0ea5e9', '#38bdf8'],
  gaming:      ['#7c3aed', '#a78bfa'],
  food:        ['#ef4444', '#f87171'],
  movie:       ['#6366f1', '#8b5cf6'],
  fitness:     ['#059669', '#34d399'],
};

interface HobbyIconProps {
  name: string;
  size?: number;
  className?: string;
}

const HobbyIcon = ({ name, size = 48, className }: HobbyIconProps) => {
  const key = resolveIconKey(name);
  const [c1, c2] = gradients[key] || ['#3b82f6', '#8b5cf6'];
  const id = `hobby-grad-${key}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor={c1} stopOpacity="0.15" />
          <stop offset="1" stopColor={c2} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r={BG_R} fill={`url(#${id})`} />
      <circle cx="24" cy="24" r={BG_R} stroke={c1} strokeWidth="1" strokeOpacity="0.15" fill="none" />
      {renderIconPath(key, c1)}
    </svg>
  );
};

// 解析图标名称：支持 emoji 和中文名称两种格式
const emojiToKey: Record<string, string> = {
  '💻': 'programming',
  '⭐': 'opensource',
  '🌟': 'opensource',
  '📚': 'reading',
  '📖': 'reading',
  '🏃': 'running',
  '🏃‍♂️': 'running',
  '📷': 'photography',
  '📸': 'photography',
  '☕': 'coffee',
  '🎵': 'music',
  '🎶': 'music',
  '🎧': 'music',
  '✈️': 'travel',
  '🌍': 'travel',
  '🗺️': 'travel',
  '🎮': 'gaming',
  '🕹️': 'gaming',
  '🍜': 'food',
  '🍕': 'food',
  '🎬': 'movie',
  '🎥': 'movie',
  '💪': 'fitness',
  '🏋️': 'fitness',
};

const nameToKey: Record<string, string> = {
  '编程': 'programming',
  '写代码': 'programming',
  '开发': 'programming',
  '开源': 'opensource',
  '阅读': 'reading',
  '看书': 'reading',
  '读书': 'reading',
  '跑步': 'running',
  '运动': 'running',
  '摄影': 'photography',
  '拍照': 'photography',
  '咖啡': 'coffee',
  '音乐': 'music',
  '听歌': 'music',
  '旅行': 'travel',
  '旅游': 'travel',
  '游戏': 'gaming',
  '美食': 'food',
  '烹饪': 'food',
  '做饭': 'food',
  '电影': 'movie',
  '健身': 'fitness',
  '锻炼': 'fitness',
};

function resolveIconKey(input: string): string {
  if (emojiToKey[input]) return emojiToKey[input];
  if (nameToKey[input]) return nameToKey[input];
  // 模糊匹配：输入中包含已知关键词
  for (const [keyword, key] of Object.entries(nameToKey)) {
    if (input.includes(keyword)) return key;
  }
  return 'programming'; // fallback
}

// 渲染各图标的 SVG 路径
function renderIconPath(key: string, color: string): React.ReactNode {
  const stroke = color;
  const common = { stroke, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  switch (key) {
    case 'programming':
      return (
        <g {...common}>
          <polyline points="18,16 12,24 18,32" />
          <polyline points="30,16 36,24 30,32" />
          <line x1="26" y1="14" x2="22" y2="34" strokeWidth="1.5" />
        </g>
      );

    case 'opensource':
      return (
        <g {...common}>
          <circle cx="24" cy="14" r="2.5" />
          <circle cx="16" cy="32" r="2.5" />
          <circle cx="32" cy="32" r="2.5" />
          <path d="M24 16.5 C22 20 18 24 16 29.5" />
          <path d="M24 16.5 C26 20 30 24 32 29.5" />
        </g>
      );

    case 'reading':
      return (
        <g {...common}>
          <path d="M24 17 C20 15 16 14.5 13 16 L13 33 C16 31.5 20 32 24 34" />
          <path d="M24 17 C28 15 32 14.5 35 16 L35 33 C32 31.5 28 32 24 34" />
          <line x1="24" y1="17" x2="24" y2="34" strokeWidth="1.5" />
        </g>
      );

    case 'running':
      return (
        <g {...common}>
          <circle cx="26" cy="13" r="2.5" />
          <path d="M20 35 L23 28 L26 21 L30 19" />
          <path d="M30 19 L33 23" />
          <path d="M26 21 L22 24 L19 23" />
          <path d="M23 28 L28 31 L33 35" />
        </g>
      );

    case 'photography':
      return (
        <g {...common}>
          <path d="M14 19 L18 15 L30 15 L34 19 L35 19 C36 19 37 20 37 21 L37 33 C37 34 36 35 35 35 L13 35 C12 35 11 34 11 33 L11 21 C11 20 12 19 13 19 Z" />
          <circle cx="24" cy="26" r="5" />
          <circle cx="24" cy="26" r="2" />
        </g>
      );

    case 'coffee':
      return (
        <g {...common}>
          <path d="M14 22 L14 32 C14 34 16 36 18 36 L28 36 C30 36 32 34 32 32 L32 22" />
          <path d="M32 24 L34 24 C35.5 24 37 25.5 37 27 L37 29 C37 30.5 35.5 32 34 32 L32 32" />
          <line x1="12" y1="22" x2="34" y2="22" strokeWidth="1.5" />
          <path d="M19 18 C19 15 21 14 21 12" strokeWidth="1.5" />
          <path d="M24 18 C24 15 26 14 26 12" strokeWidth="1.5" />
          <path d="M29 18 C29 16 30 15 30 13" strokeWidth="1.5" />
        </g>
      );

    case 'music':
      return (
        <g {...common}>
          <path d="M20 33 L20 16 L34 13 L34 30" />
          <circle cx="17" cy="33" r="3" />
          <circle cx="31" cy="30" r="3" />
        </g>
      );

    case 'travel':
      return (
        <g {...common}>
          <circle cx="24" cy="24" r="11" strokeWidth="1.5" />
          <polygon points="24,14 26.5,22 24,24 21.5,22" fill={stroke} fillOpacity="0.3" strokeWidth="0" />
          <polygon points="24,34 26.5,26 24,24 21.5,26" fill={stroke} fillOpacity="0.15" strokeWidth="0" />
          <polygon points="24,14 26.5,22 24,24 21.5,22" strokeWidth="1.5" fill="none" />
          <polygon points="24,34 26.5,26 24,24 21.5,26" strokeWidth="1.5" fill="none" />
          <line x1="13" y1="24" x2="35" y2="24" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="24" y1="13" x2="24" y2="35" strokeWidth="1" strokeOpacity="0.4" />
        </g>
      );

    case 'gaming':
      return (
        <g {...common}>
          <path d="M12 22 C12 18 16 16 20 16 L28 16 C32 16 36 18 36 22 L36 26 C36 30 34 34 32 34 L30 30 L26 30 L22 30 L18 30 L16 34 C14 34 12 30 12 26 Z" />
          <line x1="18" y1="22" x2="18" y2="26" strokeWidth="1.5" />
          <line x1="16" y1="24" x2="20" y2="24" strokeWidth="1.5" />
          <circle cx="30" cy="22" r="1.5" fill={stroke} strokeWidth="0" />
          <circle cx="33" cy="25" r="1.5" fill={stroke} strokeWidth="0" />
        </g>
      );

    case 'food':
      return (
        <g {...common}>
          <path d="M16 12 L16 20 C16 22 17 23 19 23 L19 36" strokeWidth="1.5" />
          <path d="M14 12 L14 18" strokeWidth="1.5" />
          <path d="M18 12 L18 18" strokeWidth="1.5" />
          <path d="M31 12 C31 12 33 16 33 20 C33 22 32 23 31 23 L31 36" strokeWidth="1.5" />
          <path d="M29 12 C29 14 29 18 29 20 C29 22 30 23 31 23" strokeWidth="1.5" />
        </g>
      );

    case 'movie':
      return (
        <g {...common}>
          <rect x="12" y="14" width="24" height="20" rx="2" strokeWidth="1.5" />
          <line x1="12" y1="20" x2="36" y2="20" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="12" y1="28" x2="36" y2="28" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="18" y1="14" x2="18" y2="20" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="24" y1="14" x2="24" y2="20" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="30" y1="14" x2="30" y2="20" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="18" y1="28" x2="18" y2="34" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="24" y1="28" x2="24" y2="34" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="30" y1="28" x2="30" y2="34" strokeWidth="1" strokeOpacity="0.5" />
        </g>
      );

    case 'fitness':
      return (
        <g {...common}>
          <line x1="16" y1="24" x2="32" y2="24" strokeWidth="2.5" />
          <rect x="12" y="18" width="4" height="12" rx="1.5" fill={stroke} fillOpacity="0.2" strokeWidth="1.5" />
          <rect x="32" y="18" width="4" height="12" rx="1.5" fill={stroke} fillOpacity="0.2" strokeWidth="1.5" />
          <rect x="9" y="20" width="3" height="8" rx="1" fill={stroke} fillOpacity="0.15" strokeWidth="1.5" />
          <rect x="36" y="20" width="3" height="8" rx="1" fill={stroke} fillOpacity="0.15" strokeWidth="1.5" />
        </g>
      );

    default:
      return (
        <g {...common}>
          <circle cx="24" cy="24" r="8" strokeWidth="1.5" />
          <path d="M24 20 L24 28" />
          <path d="M20 24 L28 24" />
        </g>
      );
  }
}

export default HobbyIcon;
