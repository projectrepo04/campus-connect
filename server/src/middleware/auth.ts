import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email: string;
        role: string;
        isApproved: string;
        isActive: boolean;
        isCampusMember: boolean;
        department?: string;
        semester?: number;
    };
}

export const generateToken = (user: { uid: string; email: string; role: string }): string => {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '5d' });
};

export const verifyToken = (token: string): { uid: string; email: string; role: string } | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as { uid: string; email: string; role: string };
    } catch {
        return null;
    }
};

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token || token === 'guest-session') {
            res.status(401).json({ error: 'Authentication required. Please log in.' });
            return;
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            res.status(401).json({ error: 'Session expired. Please log in again.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { uid: decoded.uid } });
        if (!user) {
            res.status(401).json({ error: 'User profile not found.' });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ error: 'Your account has been deactivated.' });
            return;
        }

        if (user.isApproved === 'pending') {
            res.status(403).json({ error: 'Your account is pending admin approval.' });
            return;
        }

        if (user.isApproved === 'rejected') {
            res.status(403).json({ error: 'Your registration has been rejected.' });
            return;
        }

        req.user = {
            uid: user.uid,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
            isActive: user.isActive,
            isCampusMember: user.isCampusMember,
            department: user.department || undefined,
            semester: user.semester || undefined,
        };

        next();
    } catch (error: any) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed.' });
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token || token === 'guest-session') {
            next();
            return;
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            next();
            return;
        }

        const user = await prisma.user.findUnique({ where: { uid: decoded.uid } });
        if (user && user.isActive && user.isApproved === 'approved') {
            req.user = {
                uid: user.uid,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                isActive: user.isActive,
                isCampusMember: user.isCampusMember,
                department: user.department || undefined,
                semester: user.semester || undefined,
            };
        }

        next();
    } catch {
        next();
    }
};
