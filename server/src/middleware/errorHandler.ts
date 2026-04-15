import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware.
 * Catches unhandled errors and returns structured JSON responses.
 */
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('❌ Unhandled Error:', err.message);
    console.error(err.stack);

    res.status(500).json({
        error: 'Internal server error.',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
};

/**
 * 404 handler for unknown routes.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};
