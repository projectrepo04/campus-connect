import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import './config/db';

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import postRoutes from './routes/post.routes';
import noticeRoutes from './routes/notice.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import departmentRoutes from './routes/department.routes';
import uploadRoutes from './routes/upload.routes';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Campus Connect API', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║      Campus Connect API Server          ║
  ║──────────────────────────────────────────║
  ║  Port:        ${String(env.port).padEnd(26)}║
  ║  Environment: ${env.nodeEnv.padEnd(26)}║
  ║  Client URL:  ${env.clientUrl.padEnd(26)}║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
