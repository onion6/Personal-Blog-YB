import { queryOne, run } from './database';
import bcrypt from 'bcryptjs';

export async function seedDatabase(): Promise<void> {
  await seedInviteCodes();
  const userId = await seedAdminUser();
  if (userId) {
    await seedProjects(userId);
    await seedPosts(userId);
    await seedResources();
  }
}

async function seedInviteCodes(): Promise<void> {
  const codeCount = (await queryOne('SELECT COUNT(*) as count FROM invite_codes'))?.count || 0;
  if (codeCount > 0) return;

  const defaultCodes = ['WELCOME2024', 'ADMIN001', 'TEST123'];
  for (const code of defaultCodes) {
    await run('INSERT INTO invite_codes (code) VALUES (?)', [code]);
  }
  console.log('Default invite codes created:', defaultCodes);
}

async function seedAdminUser(): Promise<number | null> {
  const userCount = (await queryOne('SELECT COUNT(*) as count FROM users'))?.count || 0;
  if (userCount > 0) {
    const existing = await queryOne('SELECT id FROM users LIMIT 1');
    return existing?.id || null;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const result = await run(
    'INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)',
    ['admin', hashedPassword, '杨聪']
  );

  await run(
    `INSERT INTO profile (user_id, name, title, bio, avatar_url, skills, timeline, hobbies, contacts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.lastInsertRowid,
      '杨聪',
      '全栈开发工程师',
      '热爱编程，喜欢探索新技术。专注于 Web 全栈开发，擅长 React、Node.js 和系统架构设计。',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=yangcong&backgroundColor=b6e3f4',
      JSON.stringify([
        { label: 'React', value: 92 },
        { label: 'Node.js', value: 88 },
        { label: 'TypeScript', value: 85 },
        { label: 'Vue', value: 78 },
        { label: 'Go', value: 65 },
        { label: 'DevOps', value: 72 },
      ]),
      JSON.stringify([
        { date: '2023 - 至今', title: '高级全栈工程师', desc: '负责公司核心业务系统的架构设计与开发，主导技术选型和团队技术培训。' },
        { date: '2021 - 2023', title: '前端开发工程师', desc: '参与多个 B 端产品的前端开发，负责组件库建设和工程化体系建设。' },
        { date: '2017 - 2021', title: '计算机科学与技术 - 本科', desc: '在校期间自学前端开发，参与多个开源项目，获得省级编程竞赛一等奖。' },
      ]),
      JSON.stringify([
        { name: '编程', icon: '💻' },
        { name: '开源', icon: '🌟' },
        { name: '阅读', icon: '📚' },
        { name: '跑步', icon: '🏃' },
        { name: '摄影', icon: '📷' },
        { name: '咖啡', icon: '☕' },
      ]),
      JSON.stringify([
        { name: 'GitHub', icon: 'Github', url: 'https://github.com/yangcong' },
        { name: 'Email', icon: 'Mail', url: 'mailto:yangcong@example.com' },
        { name: 'Blog', icon: 'Globe', url: '/' },
      ]),
    ]
  );

  await run('UPDATE invite_codes SET is_used = 1, used_by = ? WHERE code = ?',
    [result.lastInsertRowid, 'ADMIN001']);

  await run("UPDATE users SET role = 'admin' WHERE id = ?", [result.lastInsertRowid]);

  if (process.env.ADMIN_PASSWORD) {
    console.log('Admin user created with custom password from ADMIN_PASSWORD env var.');
  } else {
    console.log('Admin user created with default password. Please change it after first login.');
  }

  return result.lastInsertRowid;
}

async function seedProjects(userId: number): Promise<void> {
  const count = (await queryOne('SELECT COUNT(*) as count FROM projects'))?.count || 0;
  if (count > 0) return;

  const projects = [
    {
      name: 'Personal-Blog-YB',
      description: '基于 React + Express + MySQL 的全栈个人博客系统，支持暗色/亮色主题切换、Markdown 文章发布、项目展示、资源分享等功能。采用前后端分离架构，支持 Docker 部署。',
      cover_url: '',
      tech_stack: JSON.stringify(['React', 'TypeScript', 'Express', 'MySQL', 'Docker']),
      github_url: 'https://github.com/yangcong/personal-blog',
      demo_url: '/',
      status: '已完成',
      sort_order: 1,
    },
    {
      name: '电商平台管理系统',
      description: '企业级电商后台管理系统，包含商品管理、订单管理、用户管理、数据统计等功能模块。采用微前端架构，支持多团队协作开发。',
      cover_url: '',
      tech_stack: JSON.stringify(['Vue', 'TypeScript', 'Node.js', 'MongoDB']),
      github_url: '',
      demo_url: '',
      status: '已完成',
      sort_order: 2,
    },
    {
      name: '实时协作白板',
      description: '基于 WebSocket 的实时协作白板应用，支持多人同时绘图、文字标注、图形绘制等功能。采用 CRDT 算法解决冲突。',
      cover_url: '',
      tech_stack: JSON.stringify(['React', 'Canvas', 'WebSocket', 'Go']),
      github_url: '',
      demo_url: '',
      status: '进行中',
      sort_order: 3,
    },
  ];

  for (const p of projects) {
    await run(
      'INSERT INTO projects (user_id, name, description, cover_url, tech_stack, github_url, demo_url, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, p.name, p.description, p.cover_url, p.tech_stack, p.github_url, p.demo_url, p.status, p.sort_order]
    );
  }
  console.log('Seed projects created:', projects.length);
}

async function seedPosts(userId: number): Promise<void> {
  const count = (await queryOne('SELECT COUNT(*) as count FROM posts'))?.count || 0;
  if (count > 0) return;

  const posts = [
    {
      title: 'React 18 新特性详解',
      content: '## React 18 新特性\n\nReact 18 带来了许多令人兴奋的新特性，包括：\n\n### 1. 自动批处理 (Automatic Batching)\n在 React 18 中，所有的状态更新都会自动进行批处理，无论是在事件处理、setTimeout、Promise 还是原生事件中。\n\n### 2. Transitions\n新的 `useTransition` 和 `startTransition` API 允许你将某些状态更新标记为非紧急的。\n\n### 3. Suspense 改进\nServer Components 和 Suspense 的结合使得数据获取变得更加优雅。',
      tags: JSON.stringify(['前端', 'React']),
      likes: 12,
    },
    {
      title: 'TypeScript 高级类型技巧',
      content: '## TypeScript 高级类型\n\n本文将介绍一些 TypeScript 高级类型技巧，帮助你写出更安全、更优雅的代码。\n\n### 条件类型\n条件类型的语法类似于三元表达式：\n\n```typescript\ntype IsString<T> = T extends string ? true : false;\n```\n\n### 模板字面量类型\nTypeScript 4.1 引入了模板字面量类型：\n\n```typescript\ntype EventName = `on${Capitalize<string>}`;\n```',
      tags: JSON.stringify(['前端', 'TypeScript']),
      likes: 8,
    },
    {
      title: 'Docker 容器化最佳实践',
      content: '## Docker 最佳实践\n\n### 1. 使用多阶段构建\n多阶段构建可以显著减小镜像大小。\n\n### 2. 使用 .dockerignore\n排除不必要的文件。\n\n### 3. 使用非 root 用户运行\n提高容器安全性。\n\n```dockerfile\nFROM node:18-alpine\nRUN addgroup -g 1001 -S nodejs\nRUN adduser -S nodejs -u 1001\nUSER nodejs\n```',
      tags: JSON.stringify(['工具', 'DevOps']),
      likes: 5,
    },
  ];

  for (const p of posts) {
    await run('INSERT INTO posts (user_id, title, content, tags, likes) VALUES (?, ?, ?, ?, ?)',
      [userId, p.title, p.content, p.tags, p.likes]);
  }
  console.log('Seed posts created:', posts.length);
}

async function seedResources(): Promise<void> {
  const count = (await queryOne('SELECT COUNT(*) as count FROM resources'))?.count || 0;
  if (count > 0) return;

  const resources = [
    { name: 'React 官方文档', description: 'React 框架的官方文档，包含完整的 API 参考和教程。', url: 'https://react.dev', category: '学习资源', icon_url: '', votes: 15 },
    { name: 'TypeScript Handbook', description: 'TypeScript 官方手册，从入门到高级类型编程。', url: 'https://www.typescriptlang.org/docs/', category: '学习资源', icon_url: '', votes: 12 },
    { name: 'VS Code', description: '微软出品的轻量级代码编辑器，支持丰富的插件生态。', url: 'https://code.visualstudio.com/', category: '开发工具', icon_url: '', votes: 20 },
    { name: 'Figma', description: '在线协作设计工具，支持组件化设计和实时协作。', url: 'https://figma.com', category: '设计素材', icon_url: '', votes: 10 },
    { name: 'MDN Web Docs', description: 'Mozilla 维护的 Web 技术文档，涵盖 HTML、CSS、JavaScript 等。', url: 'https://developer.mozilla.org/', category: '实用网站', icon_url: '', votes: 18 },
    { name: 'Tailwind CSS', description: '实用优先的 CSS 框架，快速构建现代化界面。', url: 'https://tailwindcss.com/', category: '开发工具', icon_url: '', votes: 8 },
  ];

  for (const r of resources) {
    await run('INSERT INTO resources (name, description, url, category, icon_url, votes) VALUES (?, ?, ?, ?, ?, ?)',
      [r.name, r.description, r.url, r.category, r.icon_url, r.votes]);
  }
  console.log('Seed resources created:', resources.length);
}
