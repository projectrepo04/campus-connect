import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { campusOnly } from '../middleware/roles';
import {
    getProfile,
    updateProfile,
    updateSkills,
    getAllProfiles,
} from '../controllers/profile.controller';

const router = Router();

// Public profiles listing — matches what Profiles.tsx calls: /profile/public/list
router.get('/public', optionalAuth, getAllProfiles);
router.get('/public/list', optionalAuth, getAllProfiles);

// Read single profile
router.get('/:userId', optionalAuth, getProfile);

// Write — campus members only
router.put('/', authenticate, campusOnly, updateProfile);
router.put('/skills', authenticate, campusOnly, updateSkills);

export default router;
