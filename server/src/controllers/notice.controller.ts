import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/db";

export const createNotice = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
    if (!['admin', 'faculty'].includes(req.user.role)) { res.status(403).json({ error: "Only faculty and admin can create notices" }); return; }
    const { title, description, category, department, targetAudience, targetSemester, expiryDate } = req.body;
    if (!title || !description || !category || !targetAudience || !expiryDate) { res.status(400).json({ error: "Missing fields" }); return; }
    const user = await prisma.user.findUnique({ where: { uid: req.user.uid } });
    const notice = await prisma.notice.create({ data: { title, description, category, department: department || null, targetAudience, targetSemester: targetSemester ? parseInt(targetSemester) : null, createdBy: req.user.uid, createdByName: user?.fullName || "Unknown", expiryDate, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }});
    res.status(201).json({ message: "Notice created", notice });
};

export const getNotices = async (req: AuthRequest, res: Response): Promise<void> => {
    const { category, status = "active", limit = "20" } = req.query;
    const where: any = {};
    if (category) where.category = category as string;
    if (status === "active") where.expiryDate = { gte: new Date().toISOString() };
    else if (status === "expired") where.expiryDate = { lt: new Date().toISOString() };
    let notices = await prisma.notice.findMany({ where, orderBy: { createdAt: "desc" }, take: Math.min(parseInt(limit as string), 50) });
    if (req.user) notices = notices.filter(n => n.targetAudience === "all" || (n.targetAudience === "department" && n.department === req.user!.department) || (n.targetAudience === "semester" && n.targetSemester === req.user!.semester) || ["admin", "faculty"].includes(req.user!.role));
    res.json({ notices, count: notices.length });
};

export const getNotice = async (req: AuthRequest, res: Response): Promise<void> => {
    const notice = await prisma.notice.findUnique({ where: { id: req.params.id } });
    if (!notice) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ notice });
};

export const updateNotice = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
    if (!['admin', 'faculty'].includes(req.user.role)) { res.status(403).json({ error: "Only faculty and admin can modify notices" }); return; }
    const notice = await prisma.notice.findUnique({ where: { id: req.params.id } });
    if (!notice) { res.status(404).json({ error: "Not found" }); return; }
    if (notice.createdBy !== req.user.uid && req.user.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    const allowed = ["title", "description", "category", "department", "targetAudience", "targetSemester", "expiryDate"];
    const updates: any = { updatedAt: new Date().toISOString() };
    for (const f of allowed) if (req.body[f] !== undefined) updates[f] = req.body[f];
    const updated = await prisma.notice.update({ where: { id: req.params.id }, data: updates });
    res.json({ message: "Updated", notice: updated });
};

export const deleteNotice = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
    const notice = await prisma.notice.findUnique({ where: { id: req.params.id } });
    if (!notice) { res.status(404).json({ error: "Not found" }); return; }
    if (notice.createdBy !== req.user.uid && req.user.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    await prisma.notice.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
};
