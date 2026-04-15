import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    createAccount,
    login,
    guestLogin,
    logout,
    getCurrentUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    firstTimePasswordReset,
    setupProfile,
    getDepartmentList,
    recordFailedLogin,
} from '../controllers/auth.controller';
import { authorize } from '../middleware/roles';

const router = Router();

// Admin-only: create accounts for students/faculty
router.post('/create-account', authenticate, authorize('admin'), createAccount);

// Public
router.post('/login', login);
router.post('/guest', guestLogin);
router.post('/record-failed-login', recordFailedLogin);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Authenticated
router.get('/me', authenticate, getCurrentUser);
router.post('/first-time-reset', authenticate, firstTimePasswordReset);
router.post('/setup-profile', authenticate, setupProfile);
router.get('/departments', getDepartmentList);

export default router;
