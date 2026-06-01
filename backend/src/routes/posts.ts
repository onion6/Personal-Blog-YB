import { Router, Request, Response } from 'express';
import { queryAll, queryOne, queryCount, run } from '../database';
import { writeLimiter, voteLimiter } from '../middleware';
import { validateBody, validateIdParam, createPostSchema, createCommentSchema } from '../validate';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { tag, sort, search, page, pageSize } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const offset = (pageNum - 1) * size;

  let baseQuery = `
    SELECT posts.*, 
      (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comment_count
    FROM posts
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (tag) {
    conditions.push('posts.tags LIKE ?');
    params.push(`%${tag}%`);
  }

  if (search) {
    conditions.push('(posts.title LIKE ? OR posts.content LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  let whereClause = '';
  if (conditions.length > 0) {
    whereClause = ' WHERE ' + conditions.join(' AND ');
  }

  const total = queryCount(
    `SELECT COUNT(*) as count FROM posts${whereClause}`,
    params
  );

  const orderClause = sort === 'hot' ? ' ORDER BY posts.likes DESC' : ' ORDER BY posts.created_at DESC';
  const posts = queryAll(`${baseQuery}${whereClause}${orderClause} LIMIT ? OFFSET ?`, [...params, size, offset]);

  res.json({ data: posts, total, page: pageNum, pageSize: size });
});

router.get('/:id', validateIdParam, (req: Request, res: Response) => {
  const { id } = req.params;
  const post = queryOne('SELECT * FROM posts WHERE id = ?', [Number(id)]);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const comments = queryAll('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC', [Number(id)]);

  res.json({ ...post, comments });
});

router.post('/', requireAuth, writeLimiter, validateBody(createPostSchema), (req: AuthRequest, res: Response) => {
  const { title, content, tags } = req.body;
  const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
  
  const result = run(
    'INSERT INTO posts (title, content, tags) VALUES (?, ?, ?)',
    [title, content, tagsStr]
  );

  res.json({ id: result.lastInsertRowid, title, content, tags, likes: 0, created_at: new Date().toISOString() });
});

router.get('/:id/comments', validateIdParam, (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = queryAll('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC', [Number(id)]);
  res.json(comments);
});

router.post('/:id/like', voteLimiter, validateIdParam, (req: Request, res: Response) => {
  const { id } = req.params;
  const post = queryOne('SELECT * FROM posts WHERE id = ?', [Number(id)]);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [Number(id)]);
  const updated = queryOne('SELECT * FROM posts WHERE id = ?', [Number(id)]);
  res.json(updated);
});

router.post('/:id/comments', requireAuth, writeLimiter, validateIdParam, validateBody(createCommentSchema), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { author, content } = req.body;

  const post = queryOne('SELECT * FROM posts WHERE id = ?', [Number(id)]);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const authorName = author || req.user!.username;

  const result = run(
    'INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)',
    [Number(id), authorName, content]
  );

  res.json({
    id: result.lastInsertRowid,
    post_id: Number(id),
    author: authorName,
    content,
    created_at: new Date().toISOString()
  });
});

export default router;
