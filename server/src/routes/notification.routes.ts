import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../controllers/notification.controller';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread', authenticate, getUnreadCount);
router.put('/read-all', authenticate, markAllAsRead);
router.put('/:id/read', authenticate, markAsRead);

export default router;
