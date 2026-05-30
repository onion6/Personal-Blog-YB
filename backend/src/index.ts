import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { initDatabasePromise } from './database';
import { seedDatabase } from './seed';
import { globalLimiter } from './middleware';
import projectsRouter from './routes/projects';
import postsRouter from './routes/posts';
import resourcesRouter from './routes/resources';
import settingsRouter from './routes/settings';
import profileRouter from './routes/profile';

const app = express();
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
    }
  } : false,
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: NODE_ENV, uptime: process.uptime() });
});

app.use('/api/projects', projectsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/profile', profileRouter);

if (NODE_ENV === 'production' && fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
}

async function startServer() {
  await initDatabasePromise();
  seedDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${NODE_ENV}] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);

export default app;
