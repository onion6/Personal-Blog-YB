import { Router, Request, Response } from 'express';
import { queryAll, queryOne, queryCount, run } from '../database';
import { writeLimiter, voteLimiter } from '../middleware';
import { validateBody, validateIdParam, createResourceSchema } from '../validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { category, page, pageSize } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const offset = (pageNum - 1) * size;

  let whereClause = '';
  const params: any[] = [];

  if (category) {
    whereClause = ' WHERE category = ?';
    params.push(category as string);
  }

  const total = queryCount(
    `SELECT COUNT(*) as count FROM resources${whereClause}`,
    params
  );

  const resources = queryAll(
    `SELECT * FROM resources${whereClause} ORDER BY votes DESC LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  res.json({ data: resources, total, page: pageNum, pageSize: size });
});

router.post('/', requireAuth, writeLimiter, validateBody(createResourceSchema), (req: Request, res: Response) => {
  const { name, description, url, category, icon_url } = req.body;
  const categoryStr = Array.isArray(category) ? JSON.stringify(category) : category;
  
  const result = run(
    'INSERT INTO resources (name, description, url, category, icon_url) VALUES (?, ?, ?, ?, ?)',
    [name, description, url, categoryStr, icon_url || '']
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
