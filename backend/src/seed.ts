import { queryOne, run } from './database';
import bcrypt from 'bcryptjs';

export async function seedDatabase(): Promise<void> {
  seedInviteCodes();
  await seedAdminUser();
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

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const result = run(
    'INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)',
    ['admin', hashedPassword, '杨聪']
  );

  run(
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

  run('UPDATE invite_codes SET is_used = 1, used_by = ? WHERE code = ?',
    [result.lastInsertRowid, 'ADMIN001']);

  if (process.env.ADMIN_PASSWORD) {
    console.log('Admin user created with custom password from ADMIN_PASSWORD env var.');
  } else {
    console.log('Admin user created with default password. Please change it after first login.');
  }
}