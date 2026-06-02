import { Router, Request, Response } from 'express';
import { queryOne, queryAll, queryCount, run } from '../database';
import { asyncHandler } from '../middleware';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', requireAdmin, asyncHandler(async (_req: AuthRequest, res: Response) => {
  const userCount = (await queryOne('SELECT COUNT(*) as count FROM users'))?.count || 0;
  const postCount = (await queryOne('SELECT COUNT(*) as count FROM posts'))?.count || 0;
  const projectCount = (await queryOne('SELECT COUNT(*) as count FROM projects'))?.count || 0;
  const resourceCount = (await queryOne('SELECT COUNT(*) as count FROM resources'))?.count || 0;
  const commentCount = (await queryOne('SELECT COUNT(*) as count FROM comments'))?.count || 0;

  const recentUsers = await queryAll(
    'SELECT id, username, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 5'
  );

  const recentPosts = await queryAll(
    'SELECT id, title, created_at FROM posts ORDER BY created_at DESC LIMIT 5'
  );

  res.json({
    stats: {
      users: userCount,
      posts: postCount,
      projects: projectCount,
      resources: resourceCount,
      comments: commentCount,
    },
    recentUsers,
    recentPosts,
  });
}));

router.get('/users', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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
    `SELECT u.id, u.username, u.display_name, u.role, u.created_at,
            p.name, p.title, p.bio,
            (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
            (SELECT COUNT(*) FROM projects WHERE user_id = u.id) as project_count
     FROM users u
     LEFT JOIN profile p ON u.id = p.user_id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  res.json({ data: users, total, page: pageNum, pageSize: size });
}));

router.put('/users/:id/role', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: '无效的角色' });
  }

  const user = await queryOne('SELECT id FROM users WHERE id = ?', [Number(id)]);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  await run('UPDATE users SET role = ? WHERE id = ?', [role, Number(id)]);
  res.json({ message: '角色更新成功' });
}));

router.delete('/users/:id', requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (Number(id) === req.user!.id) {
    return res.status(400).json({ error: '不能删除自己' });
  }

  const user = await queryOne('SELECT id FROM users WHERE id = ?', [Number(id)]);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  await run('DELETE FROM users WHERE id = ?', [Number(id)]);
  res.json({ message: '用户已删除' });
}));

router.get('/posts', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const offset = (pageNum - 1) * size;

  let whereClause = '';
  const params: any[] = [];

  if (search) {
    whereClause = ' WHERE p.title LIKE ?';
    params.push(`%${search}%`);
  }

  const total = await queryCount(
    `SELECT COUNT(*) as count FROM posts p${whereClause}`,
    params
  );

  const posts = await queryAll(
    `SELECT p.*, u.username as author_name, u.display_name as author_display_name,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  res.json({ data: posts, total, page: pageNum, pageSize: size });
}));

router.delete('/posts/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const post = await queryOne('SELECT id FROM posts WHERE id = ?', [Number(id)]);
  if (!post) {
    return res.status(404).json({ error: '文章不存在' });
  }

  await run('DELETE FROM comments WHERE post_id = ?', [Number(id)]);
  await run('DELETE FROM posts WHERE id = ?', [Number(id)]);
  res.json({ message: '文章已删除' });
}));

router.get('/projects', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const offset = (pageNum - 1) * size;

  let whereClause = '';
  const params: any[] = [];

  if (search) {
    whereClause = ' WHERE p.name LIKE ?';
    params.push(`%${search}%`);
  }

  const total = await queryCount(
    `SELECT COUNT(*) as count FROM projects p${whereClause}`,
    params
  );

  const projects = await queryAll(
    `SELECT p.*, u.username as author_name, u.display_name as author_display_name
     FROM projects p
     LEFT JOIN users u ON p.user_id = u.id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  res.json({ data: projects, total, page: pageNum, pageSize: size });
}));

router.delete('/projects/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const project = await queryOne('SELECT id FROM projects WHERE id = ?', [Number(id)]);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }

  await run('DELETE FROM projects WHERE id = ?', [Number(id)]);
  res.json({ message: '项目已删除' });
}));

router.get('/resources', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const offset = (pageNum - 1) * size;

  let whereClause = '';
  const params: any[] = [];

  if (search) {
    whereClause = ' WHERE r.name LIKE ?';
    params.push(`%${search}%`);
  }

  const total = await queryCount(
    `SELECT COUNT(*) as count FROM resources r${whereClause}`,
    params
  );

  const resources = await queryAll(
    `SELECT r.*
     FROM resources r
     ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  res.json({ data: resources, total, page: pageNum, pageSize: size });
}));

router.delete('/resources/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const resource = await queryOne('SELECT id FROM resources WHERE id = ?', [Number(id)]);
  if (!resource) {
    return res.status(404).json({ error: '资源不存在' });
  }

  await run('DELETE FROM resources WHERE id = ?', [Number(id)]);
  res.json({ message: '资源已删除' });
}));

export default router;
