import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/db';

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'Auth required' });
        return;
    }
    
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
};
