# UI Design Specification

## Personal Website / Blog

---

## 1. 设计理念

| 关键词 | 说明 |
|---|---|
| 简洁 | 留白充足，信息层次分明，拒绝视觉噪音 |
| 大方 | 宽屏布局，大字体标题，呼吸感强 |
| 科技感 | 深色基底，霓虹点缀，几何线条，微光动效 |

参考气质：Vercel × Linear × Raycast

---

## 2. 色彩系统

### 2.1 暗色主题（默认）

| Token | 色值 | 用途 |
|---|---|---|
| `--bg-base` | `#09090b` | 页面底色 |
| `--bg-surface` | `#111113` | 卡片 / 面板 |
| `--bg-elevated` | `#1a1a1f` | 悬浮态 / 弹窗 |
| `--border` | `rgba(255,255,255,0.06)` | 边框 / 分割线 |
| `--border-hover` | `rgba(255,255,255,0.12)` | hover 边框 |
| `--text-primary` | `#fafafa` | 主文字 |
| `--text-secondary` | `#a1a1aa` | 次级文字 |
| `--text-muted` | `#52525b` | 辅助 / 占位 |
| `--accent` | `#3b82f6` | 主强调色（蓝） |
| `--accent-soft` | `rgba(59,130,246,0.12)` | 强调色浅底 |
| `--accent-glow` | `rgba(59,130,246,0.25)` | 发光 / 阴影 |
| `--accent-2` | `#8b5cf6` | 次强调色（紫） |
| `--success` | `#22c55e` | 成功 |
| `--warning` | `#eab308` | 警告 |
| `--error` | `#ef4444` | 错误 |

### 2.2 亮色主题

| Token | 色值 | 用途 |
|---|---|---|
| `--bg-base` | `#ffffff` | 页面底色 |
| `--bg-surface` | `#f4f4f5` | 卡片 |
| `--bg-elevated` | `#ffffff` | 悬浮态 |
| `--border` | `rgba(0,0,0,0.06)` | 边框 |
| `--text-primary` | `#09090b` | 主文字 |
| `--text-secondary` | `#71717a` | 次级文字 |
| `--accent` | `#2563eb` | 主强调色（蓝） |
| `--accent-2` | `#7c3aed` | 次强调色（紫） |

---

## 3. 字体系统

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
--font-cn: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

### 字号阶梯

| Token | Size | Weight | 用途 |
|---|---|---|---|
| `--text-5xl` | 48px / 3rem | 800 | Hero 大标题 |
| `--text-4xl` | 36px / 2.25rem | 700 | 页面标题 |
| `--text-3xl` | 30px / 1.875rem | 700 | 区块标题 |
| `--text-2xl` | 24px / 1.5rem | 600 | 卡片标题 |
| `--text-xl` | 20px / 1.25rem | 600 | 子标题 |
| `--text-base` | 16px / 1rem | 400 | 正文 |
| `--text-sm` | 14px / 0.875rem | 400 | 辅助文字 |
| `--text-xs` | 12px / 0.75rem | 500 | 标签 / 时间戳 |

### 行高

| 场景 | Line Height |
|---|---|
| 标题 | 1.2 |
| 正文 | 1.6 |
| 代码 | 1.5 |

---

## 4. 间距系统

基于 4px 网格：

| Token | 值 |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |
| `--space-24` | 96px |

---

## 5. 圆角

| Token | 值 | 用途 |
|---|---|---|
| `--radius-sm` | 6px | 小按钮、标签 |
| `--radius-md` | 10px | 卡片、输入框 |
| `--radius-lg` | 16px | 大卡片、弹窗 |
| `--radius-full` | 9999px | 圆形头像、胶囊按钮 |

---

## 6. 阴影

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 12px rgba(0,0,0,0.4);
--shadow-lg: 0 8px 30px rgba(0,0,0,0.5);
--shadow-glow: 0 0 20px var(--accent-glow);  /* 科技感发光 */
```

---

## 7. 组件规范

### 7.1 按钮

| 类型 | 样式 |
|---|---|
| Primary | `bg: accent`, `color: #fff`, `radius: sm`, 无边框, hover 微上浮 |
| Secondary | `bg: transparent`, `color: text-primary`, 1px 边框 `border` |
| Ghost | `bg: transparent`, `color: text-secondary`, hover 变 `bg-elevated` |
| Icon | 40×40, `radius: sm`, ghost 风格 |

```
高度: 40px (sm) / 44px (md) / 48px (lg)
内边距: 0 20px
字号: 14px / 600
过渡: all 0.15s ease
```

### 7.2 卡片

```
背景: bg-surface
边框: 1px solid border
圆角: radius-lg
内边距: space-6 (24px)
hover: border-color → border-hover, shadow-md, 微上浮 2px
```

### 7.3 导航栏

```
高度: 64px
背景: bg-base / 80% 透明 + backdrop-blur(12px)
位置: sticky top 0
边框: 底部 1px solid border
内容最大宽: 1200px, 居中
```

### 7.4 输入框

```
高度: 40px
背景: bg-base
边框: 1px solid border
圆角: radius-md
内边距: 0 12px
字号: 14px
focus: border-color → accent, shadow-glow
placeholder: text-muted
```

### 7.5 标签 (Tag)

```
背景: accent-soft
颜色: accent
圆角: radius-full
内边距: 4px 12px
字号: 12px / 500
```

### 7.6 分割线

```
高度: 1px
背景: border
无 margin 或 margin: space-8 0
```

---

## 8. 布局

### 8.1 全局

```
最大内容宽度: 1200px
侧边距: 24px (移动端) / 48px (桌面)
网格: 12 列 grid, 间距 24px
断点:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
```

### 8.2 导航栏布局

```
[Logo]  [个人介绍] [项目展示] [技术交流] [资源分享]  [主题切换] [搜索]
```

### 8.3 页面结构

```
┌─────────────────────────────────────┐
│            Navigation               │
├─────────────────────────────────────┤
│                                     │
│         Hero / 页面标题              │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         主要内容区域                  │
│         (max-width: 1200px)         │
│                                     │
├─────────────────────────────────────┤
│            Footer                   │
└─────────────────────────────────────┘
```

---

## 9. 动效规范

| 属性 | 值 | 场景 |
|---|---|---|
| `transition-fast` | 0.15s ease | 按钮 hover、颜色切换 |
| `transition-normal` | 0.25s ease | 卡片 hover、展开收起 |
| `transition-slow` | 0.4s ease | 页面过渡、弹窗 |
| `transition-spring` | 0.5s cubic-bezier(0.34,1.56,0.64,1) | 弹性出场 |

### 科技感动效

- **微光扫描**：卡片 hover 时一道光从左到右划过
- **渐显入场**：模块滚动进入时 `opacity: 0 → 1`, `translateY: 20px → 0`
- **呼吸发光**：重要按钮/图标持续柔和光晕
- **打字机**：Hero 区签名逐字显示

---

## 10. 图标

- 图标库：Lucide Icons（轻量、风格统一）
- 默认尺寸：20px
- 颜色：继承当前文字颜色
- 线宽：1.5px

---

## 11. 响应式策略

| 断点 | 布局调整 |
|---|---|
| `< 640px` | 单列，导航折叠为汉堡菜单，字号缩小一档 |
| `640-1024px` | 两列网格，侧边栏收起 |
| `> 1024px` | 三列网格，完整导航 |
| `> 1280px` | 最大宽 1200px 居中 |

---

## 12. 无障碍

- 文字与背景对比度 ≥ 4.5:1（WCAG AA）
- 所有交互元素支持键盘 Tab
- focus 状态可见（outline: 2px solid accent）
- 图片必须有 alt
- 动画支持 `prefers-reduced-motion` 关闭
