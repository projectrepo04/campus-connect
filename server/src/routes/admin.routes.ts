import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/roles';
import {
    getAllUsers,
    approveUser,
    rejectUser,
    lockUser,
    unlockUser,
    activateUser,
    deactivateUser,
    flagUser,
    deleteUser,
    changeUserRole,
    resetUserPassword,
    getStats,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:uid/approve', approveUser);
router.put('/users/:uid/reject', rejectUser);
router.put('/users/:uid/lock', lockUser);
router.put('/users/:uid/unlock', unlockUser);
router.put('/users/:uid/activate', activateUser);
router.put('/users/:uid/deactivate', deactivateUser);
router.put('/users/:uid/flag', flagUser);
router.put('/users/:uid/role', changeUserRole);
router.put('/users/:uid/reset-password', resetUserPassword);
router.delete('/users/:uid', deleteUser);
router.get('/analytics', getStats);

export default router;
