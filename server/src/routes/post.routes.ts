import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { campusOnly } from '../middleware/roles';
import {
    createPost,
    getPosts,
    getPost,
    updatePost,
    deletePost,
    toggleLike,
    getComments,
    addComment,
    deleteComment,
    sharePost,
} from '../controllers/post.controller';

const router = Router();

// Read — open to all authenticated users (including guests)
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);
router.get('/:id/comments', optionalAuth, getComments);

// Write — campus members only (guests blocked)
router.post('/', authenticate, campusOnly, createPost);
router.put('/:id', authenticate, campusOnly, updatePost);
router.delete('/:id', authenticate, campusOnly, deletePost);
router.post('/:id/like', authenticate, campusOnly, toggleLike);
router.post('/:id/comments', authenticate, campusOnly, addComment);
router.delete('/comments/:commentId', authenticate, campusOnly, deleteComment);
router.post('/:id/share', authenticate, campusOnly, sharePost);

export default router;

