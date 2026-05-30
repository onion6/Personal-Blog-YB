import { Router, Response } from 'express';
import { queryOne, run } from '../database';
import { writeLimiter } from '../middleware';
import { validateBody, updateProfileSchema } from '../validate';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const profile = queryOne('SELECT * FROM profile WHERE user_id = ?', [req.user!.id]);
  
  if (!profile) {
    const newProfile = run(
      'INSERT INTO profile (user_id, name) VALUES (?, ?)',
      [req.user!.id, req.user!.username]
    );
    const createdProfile = queryOne('SELECT * FROM profile WHERE id = ?', [newProfile.lastInsertRowid]);
    return res.json({
      ...createdProfile,
      skills: createdProfile.skills ? JSON.parse(createdProfile.skills) : [],
      timeline: createdProfile.timeline ? JSON.parse(createdProfile.timeline) : [],
      hobbies: createdProfile.hobbies ? JSON.parse(createdProfile.hobbies) : [],
      contacts: createdProfile.contacts ? JSON.parse(createdProfile.contacts) : [],
    });
  }

  const parsedProfile = {
    ...profile,
    skills: profile.skills ? JSON.parse(profile.skills) : [],
    timeline: profile.timeline ? JSON.parse(profile.timeline) : [],
    hobbies: profile.hobbies ? JSON.parse(profile.hobbies) : [],
    contacts: profile.contacts ? JSON.parse(profile.contacts) : [],
  };

  res.json(parsedProfile);
});

router.get('/public', (req: AuthRequest, res: Response) => {
  const { user_id } = req.query;
  
  let profile;
  if (user_id) {
    profile = queryOne('SELECT name, title, bio, avatar_url, skills FROM profile WHERE user_id = ?', [Number(user_id)]);
  } else {
    profile = queryOne('SELECT name, title, bio, avatar_url, skills FROM profile ORDER BY id LIMIT 1');
  }
  
  if (!profile) {
    return res.status(404).json({ error: '个人信息不存在' });
  }

  res.json({
    ...profile,
    skills: profile.skills ? JSON.parse(profile.skills) : [],
  });
});

router.put('/', requireAuth, writeLimiter, validateBody(updateProfileSchema), (req: AuthRequest, res: Response) => {
  const { name, title, bio, avatar_url, skills, timeline, hobbies, contacts } = req.body;
  
  const currentProfile = queryOne('SELECT * FROM profile WHERE user_id = ?', [req.user!.id]);
  
  if (!currentProfile) {
    run(
      'INSERT INTO profile (user_id, name, title, bio, avatar_url, skills, timeline, hobbies, contacts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user!.id, name, title, bio, avatar_url, 
       typeof skills === 'string' ? skills : JSON.stringify(skills || []),
       typeof timeline === 'string' ? timeline : JSON.stringify(timeline || []),
       typeof hobbies === 'string' ? hobbies : JSON.stringify(hobbies || []),
       typeof contacts === 'string' ? contacts : JSON.stringify(contacts || [])]
    );
    return res.json({ message: '个人信息已创建' });
  }
  
  const safeStringify = (val: any, fallback: string) => {
    if (val === undefined) return fallback;
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  };

  run(
    `UPDATE profile SET 
      name = ?, title = ?, bio = ?, avatar_url = ?, 
      skills = ?, timeline = ?, hobbies = ?, contacts = ? 
     WHERE user_id = ?`,
    [
      name !== undefined ? name : currentProfile.name,
      title !== undefined ? title : currentProfile.title,
      bio !== undefined ? bio : currentProfile.bio,
      avatar_url !== undefined ? avatar_url : currentProfile.avatar_url,
      safeStringify(skills, currentProfile.skills),
      safeStringify(timeline, currentProfile.timeline),
      safeStringify(hobbies, currentProfile.hobbies),
      safeStringify(contacts, currentProfile.contacts),
      req.user!.id
    ]
  );

  res.json({ message: '个人信息已更新' });
});

export default router;
