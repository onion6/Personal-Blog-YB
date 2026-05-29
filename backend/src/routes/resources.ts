import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run } from '../database';
import { writeLimiter, voteLimiter } from '../middleware';
import { validateBody, validateIdParam, createResourceSchema } from '../validate';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { category } = req.query;
  let resources;

  if (category) {
    resources = queryAll('SELECT * FROM resources WHERE category = ? ORDER BY votes DESC', [category as string]);
  } else {
    resources = queryAll('SELECT * FROM resources ORDER BY votes DESC');
  }

  res.json(resources);
});

router.post('/', writeLimiter, validateBody(createResourceSchema), (req: Request, res: Response) => {
  const { name, description, url, category, icon_url } = req.body;
  // 支持多分类，如果是数组则序列化为 JSON 字符串
  const categoryStr = Array.isArray(category) ? JSON.stringify(category) : category;
  
  const result = run(
    'INSERT INTO resources (name, description, url, category, icon_url) VALUES (?, ?, ?, ?, ?)',
    [name, description, url, categoryStr, icon_url]
  );

  res.json({ id: result.lastInsertRowid, ...req.body, votes: 0 });
});

router.post('/:id/vote', voteLimiter, validateIdParam, (req: Request, res: Response) => {
  const { id } = req.params;
  const resource = queryOne('SELECT * FROM resources WHERE id = ?', [Number(id)]);

  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  run('UPDATE resources SET votes = votes + 1 WHERE id = ?', [Number(id)]);
  const updated = queryOne('SELECT * FROM resources WHERE id = ?', [Number(id)]);
  res.json(updated);
});

export default router;
