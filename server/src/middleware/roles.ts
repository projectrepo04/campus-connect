import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware factory: Restrict access to specific roles.
 * Guest users from other colleges are always blocked from role-restricted endpoints.
 * Usage: authorize('admin', 'faculty')
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        // Guest users (from other colleges) cannot access role-restricted endpoints
        if (req.user.role === 'guest' || !req.user.isCampusMember) {
            res.status(403).json({
                error: 'This feature is only available to members of this college.',
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: `Access denied. Required role(s): ${allowedRoles.join(', ')}.`,
            });
            return;
        }

        next();
    };
};

/**
 * Middleware: Restrict access to campus members only.
 * Users from other colleges (guests) can browse public content but cannot
 * create posts, comment, like, manage profile sections, etc.
 *
 * Use this on any write/mutate endpoint that should be campus-exclusive.
 */
export const campusOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    if (!req.user.isCampusMember) {
        res.status(403).json({
            error: 'Guest access: You can browse content but this action is reserved for campus members.',
            isGuest: true,
        });
        return;
    }

    next();
};

