import { Router, Request, Response } from 'express';
import { queryAll, run } from '../database';
import { writeLimiter } from '../middleware';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const rows = queryAll('SELECT * FROM settings');
  const settings: Record<string, string> = {};

  rows.forEach((row: any) => {
    settings[row.key] = row.value;
  });

  res.json(settings);
});

router.put('/', writeLimiter, (req: Request, res: Response) => {
  const settings = req.body;

  for (const [key, value] of Object.entries(settings)) {
    run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value as string]);
  }

  res.json({ message: 'Settings updated' });
});

export default router;
