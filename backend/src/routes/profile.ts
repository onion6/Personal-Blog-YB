import { Router, Request, Response } from 'express';
import { queryOne, run } from '../database';
import { writeLimiter } from '../middleware';
import { validateBody, updateProfileSchema } from '../validate';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const profile = queryOne('SELECT * FROM profile WHERE id = 1');
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Parse JSON strings to arrays
  const parsedProfile = {
    ...profile,
    skills: profile.skills ? JSON.parse(profile.skills) : [],
    timeline: profile.timeline ? JSON.parse(profile.timeline) : [],
    hobbies: profile.hobbies ? JSON.parse(profile.hobbies) : [],
    contacts: profile.contacts ? JSON.parse(profile.contacts) : [],
  };

  res.json(parsedProfile);
});

router.put('/', writeLimiter, validateBody(updateProfileSchema), (req: Request, res: Response) => {
  const { name, title, bio, avatar_url, skills, timeline, hobbies, contacts } = req.body;
  
  const currentProfile = queryOne('SELECT * FROM profile WHERE id = 1') || {};
  
  const safeStringify = (val: any, fallback: string) => {
    if (val === undefined) return fallback;
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  };

  run(
    `UPDATE profile SET 
      name = ?, title = ?, bio = ?, avatar_url = ?, 
      skills = ?, timeline = ?, hobbies = ?, contacts = ? 
     WHERE id = 1`,
    [
      name !== undefined ? name : currentProfile.name,
      title !== undefined ? title : currentProfile.title,
      bio !== undefined ? bio : currentProfile.bio,
      avatar_url !== undefined ? avatar_url : currentProfile.avatar_url,
      safeStringify(skills, currentProfile.skills),
      safeStringify(timeline, currentProfile.timeline),
      safeStringify(hobbies, currentProfile.hobbies),
      safeStringify(contacts, currentProfile.contacts),
    ]
  );

  res.json({ message: 'Profile updated' });
});

export default router;
