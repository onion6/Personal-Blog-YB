import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, run } from '../database';
import { generateToken, AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, display_name, invite_code } = req.body;

    if (!username || !password || !invite_code) {
      res.status(400).json({ error: '用户名、密码和邀请码为必填项' });
      return;
    }

    const existingUser = queryOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    const codeRecord = queryOne(
      'SELECT id, is_used FROM invite_codes WHERE code = ?',
      [invite_code]
    );
    
    if (!codeRecord) {
      res.status(400).json({ error: '邀请码无效' });
      return;
    }
    
    if (codeRecord.is_used) {
      res.status(400).json({ error: '邀请码已被使用' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = run(
      'INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)',
      [username, hashedPassword, display_name || username]
    );

    run('UPDATE invite_codes SET is_used = 1, used_by = ? WHERE id = ?', 
      [result.lastInsertRowid, codeRecord.id]);

    run('INSERT INTO profile (user_id, name) VALUES (?, ?)', 
      [result.lastInsertRowid, display_name || username]);

    const token = generateToken({ id: result.lastInsertRowid, username });

    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        display_name: display_name || username
      }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码为必填项' });
      return;
    }

    const user = queryOne(
      'SELECT id, username, password, display_name, avatar_url FROM users WHERE username = ?',
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
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = queryOne(
    'SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ?',
    [req.user!.id]
  );

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  res.json({ user });
});

router.post('/generate-invite-code', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    run('INSERT INTO invite_codes (code, created_by) VALUES (?, ?)', 
      [code, req.user!.id]);

    res.json({ code });
  } catch (err) {
    console.error('生成邀请码失败:', err);
    res.status(500).json({ error: '生成邀请码失败' });
  }
});

export default router;
