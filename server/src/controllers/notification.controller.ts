import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/db";

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const notifications = await prisma.notification.findMany({ where: { userId: req.user.uid }, orderBy: { createdAt: "desc" }, take: limit });
    res.json({ notifications, count: notifications.length });
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
    const unreadCount = await prisma.notification.count({ where: { userId: req.user.uid, isRead: false } });
    res.json({ unreadCount });
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
    await prisma.notification.updateMany({ where: { userId: req.user.uid, id: req.params.id }, data: { isRead: true } });
    res.json({ message: "Marked as read" });
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
    await prisma.notification.updateMany({ where: { userId: req.user.uid }, data: { isRead: true } });
    res.json({ message: "All marked as read" });
};
