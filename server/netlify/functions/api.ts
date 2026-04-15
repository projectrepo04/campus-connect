import { Handler } from '@netlify/functions';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import serverless from 'serverless-http';

// Import routes
import authRoutes from '../../src/routes/auth.routes';
import profileRoutes from '../../src/routes/profile.routes';
import postRoutes from '../../src/routes/post.routes';
import noticeRoutes from '../../src/routes/notice.routes';
import notificationRoutes from '../../src/routes/notification.routes';
import adminRoutes from '../../src/routes/admin.routes';
import departmentRoutes from '../../src/routes/department.routes';
import uploadRoutes from '../../src/routes/upload.routes';

import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req: Request, res: Response) => {
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

app.use(notFoundHandler);
app.use(errorHandler);

export const handler: Handler = serverless(app);
