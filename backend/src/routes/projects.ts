import { Router, Request, Response } from 'express';
import { queryAll, run } from '../database';
import { writeLimiter } from '../middleware';
import { validateBody, validateIdParam, createProjectSchema, updateProjectSchema } from '../validate';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { tag } = req.query;
  let projects;

  if (tag) {
    projects = queryAll('SELECT * FROM projects WHERE tech_stack LIKE ? ORDER BY sort_order ASC', [`%${tag}%`]);
  } else {
    projects = queryAll('SELECT * FROM projects ORDER BY sort_order ASC');
  }

  res.json(projects);
});

router.post('/', writeLimiter, validateBody(createProjectSchema), (req: Request, res: Response) => {
  const { name, description, cover_url, tech_stack, github_url, demo_url, status, sort_order } = req.body;
  const techStackStr = typeof tech_stack === 'string' ? tech_stack : JSON.stringify(tech_stack || []);
  
  const result = run(
    'INSERT INTO projects (name, description, cover_url, tech_stack, github_url, demo_url, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description, cover_url, techStackStr, github_url, demo_url, status || '进行中', sort_order || 0]
  );

  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/:id', validateIdParam, validateBody(updateProjectSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, cover_url, tech_stack, github_url, demo_url, status, sort_order } = req.body;
  const techStackStr = typeof tech_stack === 'string' ? tech_stack : JSON.stringify(tech_stack || []);

  run(
    'UPDATE projects SET name = ?, description = ?, cover_url = ?, tech_stack = ?, github_url = ?, demo_url = ?, status = ?, sort_order = ? WHERE id = ?',
    [name, description, cover_url, techStackStr, github_url, demo_url, status, sort_order, Number(id)]
  );

  res.json({ id: Number(id), ...req.body });
});

router.delete('/:id', validateIdParam, (req: Request, res: Response) => {
  const { id } = req.params;
  run('DELETE FROM projects WHERE id = ?', [Number(id)]);
  res.json({ message: 'Project deleted' });
});

export default router;
