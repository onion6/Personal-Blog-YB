import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run } from '../database';
import { writeLimiter, voteLimiter } from '../middleware';
import { validateBody, validateIdParam, createPostSchema, createCommentSchema } from '../validate';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { tag, sort, search } = req.query;
  let query = `
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

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  if (sort === 'hot') {
    query += ' ORDER BY posts.likes DESC';
  } else {
    query += ' ORDER BY posts.created_at DESC';
  }

  const posts = queryAll(query, params);
  res.json(posts);
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

router.post('/', writeLimiter, validateBody(createPostSchema), (req: Request, res: Response) => {
  const { title, content, tags } = req.body;
  // tags 应该是数组，如果是字符串则直接使用
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

router.post('/:id/comments', writeLimiter, validateIdParam, validateBody(createCommentSchema), (req: Request, res: Response) => {
  const { id } = req.params;
  const { author, content } = req.body;

  const post = queryOne('SELECT * FROM posts WHERE id = ?', [Number(id)]);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const result = run(
    'INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)',
    [Number(id), author || '匿名', content]
  );

  res.json({
    id: result.lastInsertRowid,
    post_id: Number(id),
    author: author || '匿名',
    content,
    created_at: new Date().toISOString()
  });
});

export default router;
