import { Router, Response } from 'express';
import { queryOne, run } from '../database';
import { writeLimiter } from '../middleware';
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

router.get('/', (_req: AuthRequest, res: Response) => {
  const profile = queryOne('SELECT * FROM profile ORDER BY id ASC LIMIT 1');

  if (!profile) {
    return res.status(404).json({ error: '暂无个人信息' });
  }

  res.json(parseProfile(profile));
});

router.put('/', requireAuth, writeLimiter, validateBody(updateProfileSchema), (req: AuthRequest, res: Response) => {
  const { name, title, bio, avatar_url, skills, timeline, hobbies, contacts } = req.body;

  let currentProfile = queryOne('SELECT * FROM profile WHERE user_id = ?', [req.user!.id]);

  if (!currentProfile) {
    currentProfile = queryOne('SELECT * FROM profile WHERE user_id IS NULL ORDER BY id ASC LIMIT 1');
    if (currentProfile) {
      run('UPDATE profile SET user_id = ? WHERE id = ?', [req.user!.id, currentProfile.id]);
    }
  }

  if (!currentProfile) {
    run(
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
      run(`UPDATE profile SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (name !== undefined) {
      run('UPDATE users SET display_name = ? WHERE id = ?', [name, req.user!.id]);
    }
  }

  const updatedProfile = queryOne('SELECT * FROM profile WHERE user_id = ?', [req.user!.id]);
  res.json(parseProfile(updatedProfile));
});

export default router;
