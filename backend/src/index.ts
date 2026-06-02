import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { initDatabasePromise, closeDatabase } from './database';
import { seedDatabase } from './seed';
import { globalLimiter } from './middleware';
import authRouter from './routes/auth';
import projectsRouter from './routes/projects';
import postsRouter from './routes/posts';
import resourcesRouter from './routes/resources';
import settingsRouter from './routes/settings';
import profileRouter from './routes/profile';
import adminRouter from './routes/admin';

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:5173'];
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..', '..', 'frontend', 'dist');

app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      upgradeInsecureRequests: null,
    }
  } : {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: NODE_ENV === 'production' ? CORS_ORIGINS : true,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(globalLimiter);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', env: NODE_ENV, uptime: process.uptime() });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Personal Website API Server',
    version: '1.0.0',
    docs: '/api/health',
    frontend: 'http://localhost:5173'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);

if (NODE_ENV === 'production' && fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
}

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

async function startServer() {
  await initDatabasePromise();
  await seedDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${NODE_ENV}] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await closeDatabase();
  process.exit(0);
});

export default app;
