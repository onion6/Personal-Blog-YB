import { queryOne, run, queryAll } from './database';
import bcrypt from 'bcryptjs';

export function seedDatabase(): void {
  seedInviteCodes();
  seedAdminUser();
  seedProfile();

  const projectCount = queryOne('SELECT COUNT(*) as count FROM projects')?.count || 0;
  if (projectCount > 0) return;

  run(
    'INSERT INTO projects (name, description, cover_url, tech_stack, github_url, demo_url) VALUES (?, ?, ?, ?, ?, ?)',
    [
      '个人博客系统',
      '基于 React + Node.js 的全栈博客系统，支持 Markdown 编辑、标签分类、评论互动',
      '',
      JSON.stringify(['React', 'Node.js', 'SQLite']),
      'https://github.com/example/blog',
      'https://blog.example.com'
    ]
  );

  run(
    'INSERT INTO projects (name, description, cover_url, tech_stack, github_url, demo_url) VALUES (?, ?, ?, ?, ?, ?)',
    [
      '任务管理工具',
      '简洁高效的待办事项管理应用，支持拖拽排序、优先级标记',
      '',
      JSON.stringify(['Vue', 'Python', 'Flask']),
      'https://github.com/example/todo',
      ''
    ]
  );

  run(
    'INSERT INTO projects (name, description, cover_url, tech_stack, github_url, demo_url) VALUES (?, ?, ?, ?, ?, ?)',
    [
      '数据可视化平台',
      '交互式数据可视化仪表盘，支持多种图表类型和实时数据更新',
      '',
      JSON.stringify(['React', 'Node.js', 'D3.js']),
      'https://github.com/example/dashboard',
      'https://dashboard.example.com'
    ]
  );

  run(
    'INSERT INTO posts (title, content, tags, likes) VALUES (?, ?, ?, ?)',
    [
      'React 18 新特性详解',
      '# React 18 新特性\n\nReact 18 带来了许多激动人心的新特性...\n\n## Concurrent Mode\n\n并发模式是 React 18 最重要的特性之一...',
      JSON.stringify(['前端', 'React']),
      42
    ]
  );

  run(
    'INSERT INTO posts (title, content, tags, likes) VALUES (?, ?, ?, ?)',
    [
      'Node.js 性能优化实践',
      '# Node.js 性能优化\n\n在生产环境中，Node.js 应用的性能优化至关重要...',
      JSON.stringify(['后端', 'Node.js']),
      38
    ]
  );

  run(
    'INSERT INTO posts (title, content, tags, likes) VALUES (?, ?, ?, ?)',
    [
      'TypeScript 高级类型技巧',
      '# TypeScript 高级类型\n\n掌握 TypeScript 的高级类型可以让我们写出更安全的代码...',
      JSON.stringify(['前端', 'TypeScript']),
      56
    ]
  );

  run(
    'INSERT INTO posts (title, content, tags, likes) VALUES (?, ?, ?, ?)',
    [
      'Docker 容器化部署指南',
      '# Docker 部署指南\n\n容器化部署是现代应用部署的标准方式...',
      JSON.stringify(['DevOps', 'Docker']),
      29
    ]
  );

  run(
    'INSERT INTO posts (title, content, tags, likes) VALUES (?, ?, ?, ?)',
    [
      'CSS Grid 布局完全指南',
      '# CSS Grid 布局\n\nCSS Grid 是最强大的 CSS 布局系统...',
      JSON.stringify(['前端', 'CSS']),
      67
    ]
  );

  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['VS Code', '最流行的代码编辑器', 'https://code.visualstudio.com', '开发工具']);
  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['GitHub', '全球最大的代码托管平台', 'https://github.com', '开发工具']);
  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['Figma', '协作设计工具', 'https://figma.com', '设计素材']);
  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['MDN Web Docs', 'Web 开发权威文档', 'https://developer.mozilla.org', '学习资源']);
  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['Stack Overflow', '程序员问答社区', 'https://stackoverflow.com', '学习资源']);
  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['Dribbble', '设计师作品展示平台', 'https://dribbble.com', '设计素材']);
  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['Can I Use', '浏览器兼容性查询工具', 'https://caniuse.com', '开发工具']);
  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['FreeCodeCamp', '免费编程学习平台', 'https://freecodecamp.org', '学习资源']);
  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['Unsplash', '免费高质量图片素材', 'https://unsplash.com', '设计素材']);
  run('INSERT INTO resources (name, description, url, category) VALUES (?, ?, ?, ?)', ['Regex101', '正则表达式在线测试工具', 'https://regex101.com', '开发工具']);

  console.log('Seed data inserted successfully');
}

function seedProfile(): void {
  const adminUser = queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminUser) return;

  const existingProfile = queryOne('SELECT id FROM profile WHERE user_id = ?', [adminUser.id]);
  if (existingProfile) return;

  run(`
    INSERT INTO profile (user_id, name, title, bio, avatar_url, skills, timeline, hobbies, contacts) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    adminUser.id,
    '管理员',
    '网站管理员',
    '热爱技术，追求极致的用户体验。专注于 React, Node.js 和架构设计。',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    JSON.stringify([
      { label: '前端', value: 90 },
      { label: '后端', value: 75 },
      { label: '设计', value: 65 },
      { label: 'DevOps', value: 60 },
      { label: '移动端', value: 55 },
      { label: '其他', value: 70 },
    ]),
    JSON.stringify([
      { date: '2022 - 至今', title: '高级前端工程师', desc: '负责公司核心产品的前端架构设计与开发，推动技术栈升级和团队建设。' },
      { date: '2020 - 2022', title: '前端开发工程师', desc: '参与多个 To B 产品的设计与开发，积累了丰富的 React 和 TypeScript 实战经验。' },
      { date: '2016 - 2020', title: '计算机科学与技术 - 本科', desc: '在校期间参与多个开源项目，获得优秀毕业生称号。' },
    ]),
    JSON.stringify([
      { name: '编程', icon: '💻' },
      { name: '阅读', icon: '📚' },
      { name: '音乐', icon: '🎵' },
      { name: '摄影', icon: '📷' },
      { name: '旅行', icon: '✈️' },
      { name: '游戏', icon: '🎮' },
      { name: '健身', icon: '💪' },
      { name: '咖啡', icon: '☕' },
    ]),
    JSON.stringify([
      { name: 'GitHub', icon: 'Github', url: 'https://github.com' },
      { name: 'Email', icon: 'Mail', url: 'mailto:hello@example.com' },
      { name: 'Blog', icon: 'Globe', url: '/' },
    ])
  ]);

  console.log('Admin profile seed data inserted');
}

function seedInviteCodes(): void {
  const codeCount = queryOne('SELECT COUNT(*) as count FROM invite_codes')?.count || 0;
  if (codeCount > 0) return;

  const defaultCodes = ['WELCOME2024', 'ADMIN001', 'TEST123'];
  for (const code of defaultCodes) {
    run('INSERT INTO invite_codes (code) VALUES (?)', [code]);
  }
  console.log('Default invite codes created:', defaultCodes);
}

async function seedAdminUser(): Promise<void> {
  const userCount = queryOne('SELECT COUNT(*) as count FROM users')?.count || 0;
  if (userCount > 0) return;

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const result = run(
    'INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)',
    ['admin', hashedPassword, '管理员']
  );

  run('INSERT INTO profile (user_id, name, title) VALUES (?, ?, ?)',
    [result.lastInsertRowid, '管理员', '网站管理员']);

  run('UPDATE invite_codes SET is_used = 1, used_by = ? WHERE code = ?',
    [result.lastInsertRowid, 'ADMIN001']);

  console.log('Admin user created: admin / admin123');
}
