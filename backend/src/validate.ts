import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const idParam = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

export const validateIdParam = (req: Request, res: Response, next: NextFunction) => {
  const result = idParam.safeParse(req.params);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid ID parameter', details: result.error.flatten() });
  }
  next();
};

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(1000),
  cover_url: z.string().url().optional().or(z.literal('')),
  tech_stack: z.union([z.string(), z.array(z.string())]).optional(),
  github_url: z.string().url().optional().or(z.literal('')),
  demo_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['进行中', '已完成', '长期维护', '已归档']).optional(),
  sort_order: z.number().int().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(50000),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
});

export const createCommentSchema = z.object({
  author: z.string().max(50).optional(),
  content: z.string().min(1, 'Content is required').max(5000),
});

export const createResourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  url: z.string().url('Invalid URL format'),
  category: z.union([z.string(), z.array(z.string())]).refine(
    (val) => {
      const categories = typeof val === 'string' ? [val] : val;
      return categories.length > 0;
    },
    { message: 'At least one category is required' }
  ),
  icon_url: z.string().url().optional().or(z.literal('')),
});

export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  layout: z.enum(['card', 'list']).optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  bannerText: z.string().max(200).optional(),
  bannerBg: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color hex').optional(),
  socialLinks: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    icon: z.string(),
  })).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  title: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  skills: z.union([z.string(), z.array(z.any())]).optional(),
  timeline: z.union([z.string(), z.array(z.any())]).optional(),
  hobbies: z.union([z.string(), z.array(z.any())]).optional(),
  contacts: z.union([z.string(), z.array(z.any())]).optional(),
});

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
};
