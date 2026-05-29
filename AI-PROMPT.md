# AI Prompt — 个人网站项目初始化

用以下提示词直接发给 AI（Claude / Codex / OpenCode）即可生成项目。

---

## 提示词正文

```
## 项目概述

创建一个个人网站（博客 + 作品集），采用前后端分离架构，分别存放在两个独立文件夹中。

## 项目结构

personal-website/
├── frontend/          # React + TypeScript（Vite）
├── backend/           # Node.js + Express + TypeScript
└── README.md

两个文件夹各自有独立的 package.json，可分别启动，互不依赖。

## 技术栈

前端 frontend/：
- 框架：React 18 + TypeScript
- 构建工具：Vite
- 路由：react-router-dom v6
- 样式：CSS Modules（不使用 Tailwind，手写 CSS，按规范中的 design token）
- 图标：lucide-react
- 状态管理：zustand
- HTTP 请求：axios
- Markdown 渲染：react-markdown + remark-gfm
- 代码高亮：prismjs 或 shiki
- 图表：自写 SVG 雷达图（不引入额外图表库）
- 动画：CSS animation + Intersection Observer 实现滚动入场
- UI 规范：见下方「设计规范」

后端 backend/：
- 运行时：Node.js
- 框架：Express
- 语言：TypeScript
- 数据库：SQLite（better-sqlite3）— 轻量，无需安装数据库服务
- ORM：无（直接写 SQL，保持简单）
- API 格式：RESTful JSON
- 端口：3001

## 五个核心模块（前端页面）

### 1. 个人介绍 /about
- 顶部：大头像 + 昵称 + 一句话签名（打字机动效）
- 技能雷达图：SVG 绘制，6 个维度（前端/后端/设计/DevOps/移动端/其他）
- 时间线：教育和工作经历，纵向时间轴 + 卡片
- 兴趣爱好：图标 + 文字，网格布局
- 联系方式：邮箱/GitHub/微信/social 链接，icon 按钮

### 2. 项目展示 /projects
- 顶部：筛选标签栏（按技术栈：React/Vue/Node/Python/全栈）
- 卡片网格：3 列 → 2 列 → 1 列响应式
- 每张卡片包含：封面图、项目名、一句话简介、技术栈标签、GitHub 链接、在线演示链接
- 点击卡片展开详情弹窗或进入详情页

### 3. 技术交流 /discussion
- 帖子列表：卡片式，显示标题、摘要、标签、点赞数、评论数、发布时间
- 筛选：按标签（前端/后端/工具/面试/Bug 排查）过滤
- 排序：最新 / 最热
- 帖子详情：标题 + 正文（Markdown 渲染）+ 评论列表
- 发帖功能：Markdown 编辑器（textarea + 预览）
- 搜索：顶部搜索栏，实时过滤

### 4. 资源分享 /resources
- 分类卡片组：开发工具 / 学习资源 / 设计素材 / 实用网站
- 每组可折叠展开
- 每条资源：favicon 图标 + 名称 + 简短描述 + 外链按钮
- 支持搜索过滤

### 5. 博客设置 /settings
- 主题切换：亮色 / 暗色（默认暗色），保存到 localStorage
- 布局偏好：卡片式 / 列表式
- 字体大小：小 / 中 / 大
- 首页 Banner：可自定义文字和背景色
- 社交链接管理：增删改个人链接
- 所有设置保存到 localStorage，刷新不丢失

## 导航栏

```
[Logo/名字]  [个人介绍] [项目展示] [技术交流] [资源分享]  [主题切换🌙] [⚙设置]
```

- sticky 置顶，半透明背景 + backdrop-blur
- 移动端折叠为汉堡菜单
- 当前页面高亮

## 后端 API 设计

后端提供以下 API，前端通过 axios 调用：

### 项目相关
- GET /api/projects — 获取所有项目（支持 ?tag=react 筛选）
- POST /api/projects — 新增项目
- PUT /api/projects/:id — 更新项目
- DELETE /api/projects/:id — 删除项目

### 帖子相关
- GET /api/posts — 获取帖子列表（支持 ?tag=&sort=new|hot&search=keyword）
- GET /api/posts/:id — 获取帖子详情（含评论）
- POST /api/posts — 发帖
- POST /api/posts/:id/like — 点赞
- POST /api/posts/:id/comments — 发表评论

### 资源相关
- GET /api/resources — 获取所有资源（支持 ?category=devtools 筛选）
- POST /api/resources — 新增资源
- POST /api/resources/:id/vote — 投票/收藏

### 设置相关
- GET /api/settings — 获取站点设置
- PUT /api/settings — 更新站点设置

## 数据库表设计（SQLite）

```sql
-- 项目
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  tech_stack TEXT,  -- JSON 数组字符串
  github_url TEXT,
  demo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 帖子
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,  -- JSON 数组字符串
  likes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 评论
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author TEXT DEFAULT '匿名',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 资源
CREATE TABLE resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  icon_url TEXT,
  votes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 站点设置
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

## 设计规范（严格遵守）

### 色彩（暗色主题默认）
- 底色：#09090b
- 卡片：#111113
- 边框：rgba(255,255,255,0.06)
- 主文字：#fafafa
- 次文字：#a1a1aa
- 强调色：#3b82f6（蓝）
- 次强调：#8b5cf6（紫）
- 发光阴影：0 0 20px rgba(59,130,246,0.25)

### 字体
- 英文：Inter（Google Fonts 引入）
- 中文：Noto Sans SC
- 代码：JetBrains Mono

### 字号
- Hero 标题：48px/800
- 区块标题：36px/700
- 卡片标题：24px/600
- 正文：16px/400，行高 1.6
- 辅助：14px
- 标签：12px/500

### 圆角
- 小按钮/标签：6px
- 卡片/输入框：10px
- 大卡片/弹窗：16px
- 头像/胶囊：9999px

### 动效
- hover 过渡：0.15s ease
- 卡片 hover：边框变亮 + 微上浮 2px + 阴影
- 滚动入场：opacity 0→1, translateY 20px→0，0.4s ease
- Hero 签名：打字机效果，逐字显示

### 响应式
- < 640px：单列，汉堡菜单
- 640-1024px：两列
- > 1024px：三列

## 执行要求

1. 先创建文件夹结构，再分别生成前端和后端代码
2. 前端 `npm run dev` 启动在 5173 端口，后端 `npm run dev` 启动在 3001 端口
3. 前端通过 Vite proxy 代理 /api 请求到后端
4. 后端启动时自动初始化 SQLite 数据库和表
5. 代码使用 TypeScript 严格模式（strict: true）
6. 前端组件按模块拆分：components/、pages/、styles/、types/
7. 每个页面对应一个独立组件文件
8. CSS 使用 CSS Modules（.module.css）
9. 提供 seed 脚本或初始数据，使页面打开即有内容展示
10. 写好 README.md，说明如何启动前后端
```

---

## 使用方式

1. 复制上面「提示词正文」中的全部内容
2. 粘贴到 CodexBridge 微信对话框发送
3. 或者发给 Claude / OpenCode
4. AI 会在当前目录生成 `frontend/` 和 `backend/` 两个文件夹
5. 分别进入文件夹 `npm install && npm run dev` 启动

## 注意事项

- 如果 AI 生成不完整，可分步让它补全：「请补全 backend 的 API 路由代码」
- 如果样式不对，可发：「请按 UI-SPEC.md 规范调整样式」
- seed 数据建议让 AI 生成 3 个项目 + 5 篇帖子 + 10 个资源，打开就能看到效果
