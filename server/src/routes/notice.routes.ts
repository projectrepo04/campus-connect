import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/roles';
import {
    createNotice,
    getNotices,
    getNotice,
    updateNotice,
    deleteNotice,
} from '../controllers/notice.controller';

const router = Router();

router.get('/', authenticate, getNotices);
router.get('/:id', authenticate, getNotice);
router.post('/', authenticate, authorize('admin', 'faculty'), createNotice);
router.put('/:id', authenticate, authorize('admin', 'faculty'), updateNotice);
router.delete('/:id', authenticate, authorize('admin', 'faculty'), deleteNotice);

export default router;
