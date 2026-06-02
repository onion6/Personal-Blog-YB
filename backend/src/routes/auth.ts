import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { queryOne, queryAll, run, withTransaction } from '../database';
import { generateToken, AuthRequest, requireAuth, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware';

const router = Router();

router.post('/register', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, password, display_name, invite_code } = req.body;

  if (!username || !password || !invite_code) {
    res.status(400).json({ error: '用户名、密码和邀请码为必填项' });
    return;
  }

  const existingUser = await queryOne('SELECT id FROM users WHERE username = ?', [username]);
  if (existingUser) {
    res.status(400).json({ error: '用户名已存在' });
    return;
  }

  const codeRecord = await queryOne(
    'SELECT id, is_used FROM invite_codes WHERE code = ?',
    [invite_code]
  );

  if (!codeRecord) {
    res.status(400).json({ error: '邀请码无效' });
    return;
  }

  if (codeRecord.is_used) {
    const usedByUser = await queryOne(
      'SELECT id, username FROM users WHERE id = ?',
      [codeRecord.used_by]
    );
    console.error(`邀请码已被使用: code=${invite_code}, used_by=${codeRecord.used_by}, user=${usedByUser?.username || 'unknown'}`);
    res.status(400).json({ error: '邀请码已被使用' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const displayNameValue = display_name || username;

  const result = await withTransaction(async () => {
    const userResult = await run(
      'INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)',
      [username, hashedPassword, displayNameValue]
    );

    await run('UPDATE invite_codes SET is_used = 1, used_by = ? WHERE id = ?',
      [userResult.lastInsertRowid, codeRecord.id]);

    const existingProfile = await queryOne(
      'SELECT id FROM profile WHERE user_id = ?',
      [userResult.lastInsertRowid]
    );
    if (existingProfile) {
      console.error(`用户 ${username}(id=${userResult.lastInsertRowid}) 的 profile 已存在，跳过创建`);
    } else {
      await run('INSERT INTO profile (user_id, name) VALUES (?, ?)',
        [userResult.lastInsertRowid, displayNameValue]);
    }

    return userResult;
  });

  const token = generateToken({ id: result.lastInsertRowid, username });

  res.json({
    token,
    user: {
      id: result.lastInsertRowid,
      username,
      display_name: displayNameValue
    }
  });
}));

router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码为必填项' });
    return;
  }

  const user = await queryOne(
    'SELECT id, username, password, display_name, avatar_url, role FROM users WHERE username = ?',
    [username]
  );

  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = generateToken({ id: user.id, username: user.username });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role || 'user'
    }
  });
}));

router.get('/me', requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await queryOne(
    'SELECT id, username, display_name, avatar_url, role, created_at FROM users WHERE id = ?',
    [req.user!.id]
  );

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  res.json({ user });
}));

router.get('/invite-codes', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const total = (await queryOne('SELECT COUNT(*) as count FROM invite_codes'))?.count || 0;
  const used = (await queryOne('SELECT COUNT(*) as count FROM invite_codes WHERE is_used = 1'))?.count || 0;
  const unused = (await queryOne('SELECT COUNT(*) as count FROM invite_codes WHERE is_used = 0'))?.count || 0;
  const list = await queryAll('SELECT code, is_used, created_at FROM invite_codes ORDER BY id DESC');

  res.json({ total, used, unused, list });
}));

router.post('/generate-invite-code', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const code = crypto.randomBytes(6).toString('hex').toUpperCase();

  await run('INSERT INTO invite_codes (code, created_by) VALUES (?, ?)',
    [code, req.user!.id]);

  res.json({ code });
}));

export default router;
