import { Router, Response } from 'express';
import { queryAll, queryOne, run } from '../database';
import { writeLimiter } from '../middleware';
import { validateBody, validateIdParam, createProjectSchema, updateProjectSchema } from '../validate';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (req: AuthRequest, res: Response) => {
  const { tag } = req.query;
  let projects;

  if (tag) {
    projects = queryAll(
      'SELECT p.*, u.display_name as author_name FROM projects p LEFT JOIN users u ON p.user_id = u.id WHERE p.tech_stack LIKE ? ORDER BY p.sort_order ASC',
      [`%${tag}%`]
    );
  } else {
    projects = queryAll(
      'SELECT p.*, u.display_name as author_name FROM projects p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.sort_order ASC'
    );
  }

  res.json(projects);
});

router.get('/my', requireAuth, (req: AuthRequest, res: Response) => {
  const projects = queryAll(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY sort_order ASC',
    [req.user!.id]
  );
  res.json(projects);
});

router.post('/', requireAuth, writeLimiter, validateBody(createProjectSchema), (req: AuthRequest, res: Response) => {
  const { name, description, cover_url, tech_stack, github_url, demo_url, status, sort_order } = req.body;
  const techStackStr = typeof tech_stack === 'string' ? tech_stack : JSON.stringify(tech_stack || []);
  
  const result = run(
    'INSERT INTO projects (user_id, name, description, cover_url, tech_stack, github_url, demo_url, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user!.id, name, description, cover_url, techStackStr, github_url, demo_url, status || '进行中', sort_order || 0]
  );

  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/:id', requireAuth, validateIdParam, validateBody(updateProjectSchema), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
  
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  if (project.user_id !== req.user!.id) {
    res.status(403).json({ error: '无权修改此项目' });
    return;
  }

  const { name, description, cover_url, tech_stack, github_url, demo_url, status, sort_order } = req.body;
  const techStackStr = typeof tech_stack === 'string' ? tech_stack : JSON.stringify(tech_stack || []);

  run(
    'UPDATE projects SET name = ?, description = ?, cover_url = ?, tech_stack = ?, github_url = ?, demo_url = ?, status = ?, sort_order = ? WHERE id = ?',
    [name, description, cover_url, techStackStr, github_url, demo_url, status, sort_order, Number(id)]
  );

  res.json({ id: Number(id), ...req.body });
});

router.delete('/:id', requireAuth, validateIdParam, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const project = queryOne('SELECT * FROM projects WHERE id = ?', [Number(id)]);
  
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  if (project.user_id !== req.user!.id) {
    res.status(403).json({ error: '无权删除此项目' });
    return;
  }

  run('DELETE FROM projects WHERE id = ?', [Number(id)]);
  res.json({ message: '项目已删除' });
});

export default router;
