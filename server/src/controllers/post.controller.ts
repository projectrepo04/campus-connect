import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/db';

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        const { content, imageUrl, videoUrl, mediaUrls, externalLink, visibility, isAnnouncement } = req.body;

        if (!content || content.trim().length === 0) {
            res.status(400).json({ error: 'Post content is required.' });
            return;
        }

        if (isAnnouncement && !['faculty', 'admin'].includes(req.user.role)) {
            res.status(403).json({ error: 'Only faculty and admin can create announcements.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { uid: req.user.uid } });

        const post = await prisma.post.create({
            data: {
                authorId: req.user.uid,
                authorName: user?.fullName || 'Unknown',
                authorRole: req.user.role,
                content: content.trim(),
                imageUrl: imageUrl || null,
                videoUrl: videoUrl || null,
                mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : '[]',
                externalLink: externalLink || null,
                department: req.user.department || null,
                semester: req.user.semester || null,
                visibility: visibility || 'campus-only',
                isAnnouncement: isAnnouncement || false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });

        res.status(201).json({ message: 'Post created.', post });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post.' });
    }
};

export const getPosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { department, semester, announcements, limit = '20' } = req.query;
        const limitNum = Math.min(parseInt(limit as string), 50);

        const where: any = {};
        if (!req.user) where.visibility = 'public';
        if (department) where.department = department as string;
        if (semester) where.semester = parseInt(semester as string);
        if (announcements === 'true') where.isAnnouncement = true;

        const posts = await prisma.post.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            include: {
                author: { select: { fullName: true, profilePhoto: true } },
                likes: { select: { userId: true } },
            },
        });

        const mapped = posts.map(p => ({
            ...p,
            likes: p.likes.map((l: any) => l.userId),
            likesCount: p.likesCount ?? p.likes.length,
            commentsCount: p.commentsCount ?? 0,
            sharesCount: p.sharesCount ?? 0,
        }));

        res.json({ posts: mapped, count: mapped.length });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Failed to fetch posts.' });
    }
};

export const getPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: { select: { fullName: true, profilePhoto: true } },
                comments: { orderBy: { createdAt: 'asc' } },
                _count: { select: { likes: true, comments: true } },
            },
        });

        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }

        if (!req.user && post.visibility === 'campus-only') {
            res.status(403).json({ error: 'This post is only visible to campus members.' });
            return;
        }

        res.json({ post });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Failed to fetch post.' });
    }
};

export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        const { id } = req.params;
        const post = await prisma.post.findUnique({ where: { id } });

        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }

        if (post.authorId !== req.user.uid && req.user.role !== 'admin') {
            res.status(403).json({ error: 'You can only edit your own posts.' });
            return;
        }

        const allowedFields = ['content', 'imageUrl', 'externalLink', 'visibility', 'isAnnouncement'];
        const updates: any = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }
        updates.updatedAt = new Date().toISOString();

        const updated = await prisma.post.update({ where: { id }, data: updates });

        res.json({ message: 'Post updated.', post: updated });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Failed to update post.' });
    }
};

export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        const { id } = req.params;
        const post = await prisma.post.findUnique({ where: { id } });

        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }

        if (post.authorId !== req.user.uid && req.user.role !== 'admin') {
            res.status(403).json({ error: 'You can only delete your own posts.' });
            return;
        }

        await prisma.post.delete({ where: { id } });

        res.json({ message: 'Post deleted.' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post.' });
    }
};

export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        const { id } = req.params;
        const post = await prisma.post.findUnique({ where: { id } });

        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }

        const existingLike = await prisma.like.findFirst({
            where: { postId: id, userId: req.user.uid },
        });

        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            const updated = await prisma.post.update({
                where: { id },
                data: { likesCount: { decrement: 1 } },
            });
            res.json({ liked: false, likesCount: updated.likesCount });
        } else {
            await prisma.like.create({
                data: {
                    id: crypto.randomUUID(),
                    postId: id,
                    userId: req.user.uid,
                    createdAt: new Date().toISOString(),
                },
            });
            const updated = await prisma.post.update({
                where: { id },
                data: { likesCount: { increment: 1 } },
            });
            res.json({ liked: true, likesCount: updated.likesCount });
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ error: 'Failed to toggle like.' });
    }
};

export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const post = await prisma.post.findUnique({ where: { id } });

        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }

        if (!req.user && post.visibility === 'campus-only') {
            res.status(403).json({ error: 'Access denied.' });
            return;
        }

        const comments = await prisma.comment.findMany({
            where: { postId: id },
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { fullName: true, profilePhoto: true } } },
        });

        res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments.' });
    }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        const { id } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            res.status(400).json({ error: 'Comment content is required.' });
            return;
        }

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { uid: req.user.uid } });

        const comment = await prisma.comment.create({
            data: {
                postId: id,
                authorId: req.user.uid,
                authorName: user?.fullName || 'Unknown',
                content: content.trim(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });

        await prisma.post.update({
            where: { id },
            data: { commentsCount: { increment: 1 } },
        });

        res.status(201).json({ message: 'Comment added.', comment });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment.' });
    }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        const { commentId } = req.params;
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });

        if (!comment) {
            res.status(404).json({ error: 'Comment not found.' });
            return;
        }

        if (comment.authorId !== req.user.uid && req.user.role !== 'admin') {
            res.status(403).json({ error: 'You can only delete your own comments.' });
            return;
        }

        await prisma.comment.delete({ where: { id: commentId } });
        await prisma.post.update({
            where: { id: comment.postId },
            data: { commentsCount: { decrement: 1 } },
        });

        res.json({ message: 'Comment deleted.' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
};

export const sharePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        const { id } = req.params;
        const original = await prisma.post.findUnique({ where: { id } });

        if (!original) {
            res.status(404).json({ error: 'Original post not found.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { uid: req.user.uid } });

        const repost = await prisma.post.create({
            data: {
                authorId: req.user.uid,
                authorName: user?.fullName || 'Unknown',
                authorRole: req.user.role,
                content: req.body.content || original.content,
                imageUrl: original.imageUrl,
                externalLink: original.externalLink,
                department: req.user.department || null,
                semester: req.user.semester || null,
                visibility: req.body.visibility || 'campus-only',
                isAnnouncement: false,
                isRepost: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });

        await prisma.post.update({
            where: { id },
            data: { sharesCount: { increment: 1 } },
        });

        res.status(201).json({ message: 'Post shared.', repost });
    } catch (error) {
        console.error('Share post error:', error);
        res.status(500).json({ error: 'Failed to share post.' });
    }
};
