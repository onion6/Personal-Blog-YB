import { Router, Request, Response } from 'express';
import { queryOne, queryAll, queryCount, run } from '../database';
import { writeLimiter, asyncHandler } from '../middleware';
import { validateBody, updateProfileSchema } from '../validate';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function parseProfile(profile: any) {
  return {
    ...profile,
    skills: profile.skills ? JSON.parse(profile.skills) : [],
    timeline: profile.timeline ? JSON.parse(profile.timeline) : [],
    hobbies: profile.hobbies ? JSON.parse(profile.hobbies) : [],
    contacts: profile.contacts ? JSON.parse(profile.contacts) : [],
  };
}

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await queryOne('SELECT * FROM profile WHERE user_id = ?', [req.user!.id]);

  if (!profile) {
    return res.json({
      user_id: req.user!.id,
      name: req.user!.username,
      title: '',
      bio: '',
      avatar_url: '',
      skills: [],
      timeline: [],
      hobbies: [],
      contacts: [],
    });
  }

  res.json(parseProfile(profile));
}));

router.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const profile = await queryOne(
    `SELECT p.*, u.username, u.display_name, u.avatar_url as user_avatar, u.created_at as user_created_at
     FROM profile p
     RIGHT JOIN users u ON p.user_id = u.id
     WHERE u.id = ?`,
    [Number(userId)]
  );

  if (!profile) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const result = {
    id: profile.id,
    user_id: Number(userId),
    username: profile.username,
    display_name: profile.display_name || profile.username,
    name: profile.name || profile.display_name || profile.username,
    title: profile.title || '',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || profile.user_avatar || '',
    skills: profile.skills ? JSON.parse(profile.skills) : [],
    timeline: profile.timeline ? JSON.parse(profile.timeline) : [],
    hobbies: profile.hobbies ? JSON.parse(profile.hobbies) : [],
    contacts: profile.contacts ? JSON.parse(profile.contacts) : [],
    created_at: profile.user_created_at,
  };

  res.json(result);
}));

router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const offset = (pageNum - 1) * size;

  let whereClause = '';
  const params: any[] = [];

  if (search) {
    whereClause = ' WHERE u.username LIKE ? OR u.display_name LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  const total = await queryCount(
    `SELECT COUNT(*) as count FROM users u${whereClause}`,
    params
  );

  const users = await queryAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.created_at,
            p.name, p.title, p.bio, p.avatar_url as profile_avatar,
            (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
            (SELECT COUNT(*) FROM projects WHERE user_id = u.id) as project_count
     FROM users u
     LEFT JOIN profile p ON u.id = p.user_id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  const formattedUsers = users.map(u => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name || u.username,
    name: u.name || u.display_name || u.username,
    title: u.title || '',
    bio: u.bio || '',
    avatar_url: u.profile_avatar || u.avatar_url || '',
    post_count: u.post_count || 0,
    project_count: u.project_count || 0,
    created_at: u.created_at,
  }));

  res.json({ data: formattedUsers, total, page: pageNum, pageSize: size });
}));

router.put('/', requireAuth, writeLimiter, validateBody(updateProfileSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, title, bio, avatar_url, skills, timeline, hobbies, contacts } = req.body;

  let currentProfile = await queryOne('SELECT * FROM profile WHERE user_id = ?', [req.user!.id]);

  if (!currentProfile) {
    await run(
      'INSERT INTO profile (user_id, name, title, bio, avatar_url, skills, timeline, hobbies, contacts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user!.id,
        name || req.user!.username,
        title || '',
        bio || '',
        avatar_url || '',
        skills ? JSON.stringify(skills) : '[]',
        timeline ? JSON.stringify(timeline) : '[]',
        hobbies ? JSON.stringify(hobbies) : '[]',
        contacts ? JSON.stringify(contacts) : '[]',
      ]
    );
  } else {
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }
    if (avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(avatar_url); }
    if (skills !== undefined) { updates.push('skills = ?'); values.push(JSON.stringify(skills)); }
    if (timeline !== undefined) { updates.push('timeline = ?'); values.push(JSON.stringify(timeline)); }
    if (hobbies !== undefined) { updates.push('hobbies = ?'); values.push(JSON.stringify(hobbies)); }
    if (contacts !== undefined) { updates.push('contacts = ?'); values.push(JSON.stringify(contacts)); }

    if (updates.length > 0) {
      values.push(currentProfile.id);
      await run(`UPDATE profile SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (name !== undefined) {
      await run('UPDATE users SET display_name = ? WHERE id = ?', [name, req.user!.id]);
    }
  }

  const updatedProfile = await queryOne('SELECT * FROM profile WHERE user_id = ?', [req.user!.id]);
  res.json(parseProfile(updatedProfile));
}));

export default router;
