<div align="center">

# Personal-Blog-YB

### 个人博客 & 作品集网站

一个现代化的全栈个人博客系统，支持项目展示、技术交流、资源分享和个人介绍管理。

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 功能特性

### 五大核心模块

| 模块 | 路由 | 功能说明 |
|------|------|----------|
| **个人介绍** | `/about` | 头像、昵称、技能雷达图、工作经历时间线、兴趣爱好、联系方式，支持在线编辑 |
| **项目展示** | `/projects` | 项目卡片/列表视图切换、状态标签、技术栈展示、新建/编辑/删除 |
| **技术交流** | `/discussion` | Markdown 编辑器、文章目录、代码高亮、一键复制、评论互动、点赞 |
| **资源分享** | `/resources` | 多分类折叠面板、搜索过滤、投票排行、自定义图标 |
| **博客设置** | `/settings` | 暗色/亮色主题切换、布局偏好、字体大小、Banner 自定义、社交链接管理 |

### 技术亮点

- **响应式设计** - 从移动端到桌面端完美适配
- **暗色主题** - CSS 变量驱动的双主题系统，支持一键切换
- **滚动动画** - Framer Motion 驱动的视差滚动和入场动画
- **骨架屏加载** - 优雅的数据加载状态
- **Toast 通知** - 轻量级全局操作反馈
- **参数校验** - Zod 驱动的前后端统一数据校验
- **安全加固** - Helmet + Rate Limit 中间件防护

## 技术栈

### 前端

```
React 18 + TypeScript + Vite
├── 状态管理    Zustand + TanStack Query (React Query)
├── 路由        React Router v6
├── 动画        Framer Motion
├── 样式        CSS Modules + CSS 变量
├── 图标        Lucide React
├── Markdown    react-markdown + remark-gfm
└── HTTP        Axios
```

### 后端

```
Node.js + Express + TypeScript
├── 数据库      sql.js (SQLite)
├── 校验        Zod
├── 安全        Helmet + express-rate-limit
├── 开发工具    nodemon + ts-node
└── 类型声明    sql.js 自定义类型定义
```

### 部署

```
Docker + Nginx
├── 多阶段构建   前端编译 → 后端编译 → 生产镜像
├── 反向代理     Nginx + Gzip + 静态资源缓存
├── 进程守护     PM2 (非 Docker 部署)
└── HTTPS        SSL 证书预留配置
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 本地开发

```bash
# 克隆项目
git clone https://github.com/onion6/Personal-Blog-YB.git
cd Personal-Blog-YB

# 安装后端依赖并启动
cd backend
npm install
npm run dev

# 新开终端，安装前端依赖并启动
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### Docker 部署

```bash
# 一键构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f app
```

### 生产环境部署

```bash
# 构建前端
cd frontend && npm run build

# 构建后端
cd ../backend && npm run build

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置生产环境参数

# 启动服务
npm start
```

## 项目结构

```
Personal-Blog-YB/
├── frontend/                  # 前端项目
│   ├── src/
│   │   ├── api/               # API 接口封装
│   │   ├── components/        # 通用组件 (Modal, Toast, Skeleton...)
│   │   ├── hooks/             # 自定义 Hooks (usePosts, useProfile...)
│   │   ├── pages/             # 页面组件
│   │   │   ├── About/         # 个人介绍
│   │   │   ├── Projects/      # 项目展示
│   │   │   ├── Discussion/    # 技术交流
│   │   │   ├── Resources/     # 资源分享
│   │   │   └── Settings/      # 博客设置
│   │   ├── store/             # Zustand 状态管理
│   │   ├── styles/            # 全局样式 & CSS 变量
│   │   └── types/             # TypeScript 类型定义
│   └── vite.config.ts
├── backend/                   # 后端项目
│   ├── src/
│   │   ├── routes/            # API 路由
│   │   │   ├── projects.ts    # 项目 CRUD
│   │   │   ├── posts.ts       # 帖子 & 评论
│   │   │   ├── resources.ts   # 资源分享
│   │   │   ├── profile.ts     # 个人资料
│   │   │   └── settings.ts    # 系统设置
│   │   ├── database.ts        # 数据库初始化
│   │   ├── middleware.ts      # 限流中间件
│   │   ├── validate.ts        # Zod 参数校验
│   │   └── seed.ts            # 种子数据
│   └── tsconfig.json
├── nginx/                     # Nginx 配置
├── Dockerfile                 # 多阶段构建
├── docker-compose.yml         # 容器编排
└── .gitignore
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET/POST | `/api/projects` | 项目列表 / 创建项目 |
| PUT/DELETE | `/api/projects/:id` | 更新 / 删除项目 |
| GET | `/api/posts` | 帖子列表 |
| GET | `/api/posts/:id` | 帖子详情 |
| POST | `/api/posts/:id/like` | 点赞 |
| GET/POST | `/api/posts/:id/comments` | 评论列表 / 发表评论 |
| GET/POST | `/api/resources` | 资源列表 / 分享资源 |
| POST | `/api/resources/:id/vote` | 资源投票 |
| GET/PUT | `/api/profile` | 获取 / 更新个人资料 |
| GET/PUT | `/api/settings` | 获取 / 更新设置 |

## License

[MIT](LICENSE)

---

<div align="center">

**Made with ❤️ by [onion6](https://github.com/onion6)**

</div>
