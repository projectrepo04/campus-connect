import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/db";
import bcrypt from "bcrypt";

// ─── Helper: generate random password ────────────────
function generateRandomPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#$!%';
    const all = upper + lower + digits + special;
    let pw = '';
    pw += upper[Math.floor(Math.random() * upper.length)];
    pw += lower[Math.floor(Math.random() * lower.length)];
    pw += digits[Math.floor(Math.random() * digits.length)];
    pw += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 8; i++) pw += all[Math.floor(Math.random() * all.length)];
    return pw.split('').sort(() => Math.random() - 0.5).join('');
}

// ─── Get all users ───────────────────────────────────
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ users, count: users.length });
};

// ─── Approve user ────────────────────────────────────
export const approveUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const user = await prisma.user.update({ where: { uid: req.params.uid }, data: { isApproved: "approved", updatedAt: new Date().toISOString() } });
    res.json({ message: "User approved", user });
};

// ─── Reject user ─────────────────────────────────────
export const rejectUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const user = await prisma.user.update({ where: { uid: req.params.uid }, data: { isApproved: "rejected", updatedAt: new Date().toISOString() } });
    res.json({ message: "User rejected", user });
};

// ─── Lock user ───────────────────────────────────────
export const lockUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const user = await prisma.user.update({ where: { uid: req.params.uid }, data: { isLocked: true, lockedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
    res.json({ message: "User locked", user });
};

// ─── Unlock user ─────────────────────────────────────
export const unlockUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const user = await prisma.user.update({ where: { uid: req.params.uid }, data: { isLocked: false, failedLoginAttempts: 0, updatedAt: new Date().toISOString() } });
    res.json({ message: "User unlocked", user });
};

// ─── Activate user ───────────────────────────────────
export const activateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const user = await prisma.user.update({ where: { uid: req.params.uid }, data: { isActive: true, updatedAt: new Date().toISOString() } });
    res.json({ message: "User activated", user });
};

// ─── Deactivate user ─────────────────────────────────
export const deactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const user = await prisma.user.update({ where: { uid: req.params.uid }, data: { isActive: false, updatedAt: new Date().toISOString() } });
    res.json({ message: "User deactivated", user });
};

// ─── Flag/unflag user ────────────────────────────────
export const flagUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const existing = await prisma.user.findUnique({ where: { uid: req.params.uid } });
    if (!existing) { res.status(404).json({ error: "User not found" }); return; }
    const user = await prisma.user.update({ where: { uid: req.params.uid }, data: { isFlagged: !existing.isFlagged, updatedAt: new Date().toISOString() } });
    res.json({ message: user.isFlagged ? "User flagged" : "User unflagged", user });
};

// ─── Delete user ─────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const target = await prisma.user.findUnique({ where: { uid: req.params.uid } });
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    if (target.uid === req.user.uid) { res.status(400).json({ error: "Cannot delete your own account" }); return; }
    // Delete related data first
    await prisma.notification.deleteMany({ where: { userId: target.uid } });
    await prisma.like.deleteMany({ where: { userId: target.uid } });
    await prisma.comment.deleteMany({ where: { authorId: target.uid } });
    await prisma.follow.deleteMany({ where: { OR: [{ followerId: target.uid }, { followingId: target.uid }] } });
    await prisma.post.deleteMany({ where: { authorId: target.uid } });
    await prisma.notice.deleteMany({ where: { createdBy: target.uid } });
    await prisma.user.delete({ where: { uid: target.uid } });
    res.json({ message: "User deleted" });
};

// ─── Change user role ────────────────────────────────
export const changeUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const { role } = req.body;
    const valid = ["student", "faculty", "alumni", "admin"];
    if (!role || !valid.includes(role)) { res.status(400).json({ error: `Invalid role. Valid: ${valid.join(", ")}` }); return; }
    const user = await prisma.user.update({ where: { uid: req.params.uid }, data: { role, updatedAt: new Date().toISOString() } });
    res.json({ message: "Role updated", user });
};

// ─── Reset user password ─────────────────────────────
export const resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const target = await prisma.user.findUnique({ where: { uid: req.params.uid } });
    if (!target) { res.status(404).json({ error: "User not found" }); return; }
    const newPassword = generateRandomPassword();
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { uid: req.params.uid },
        data: { password: hashed, mustResetPassword: true, updatedAt: new Date().toISOString() },
    });
    res.json({ message: "Password reset", temporaryPassword: newPassword });
};

// ─── Analytics / Stats ───────────────────────────────
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user || req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    const totalUsers = await prisma.user.count({ where: { isGuest: false } });
    const activeUsers = await prisma.user.count({ where: { isActive: true, isGuest: false } });
    const pendingApproval = await prisma.user.count({ where: { isApproved: "pending" } });
    const lockedUsers = await prisma.user.count({ where: { isLocked: true } });
    const totalPosts = await prisma.post.count();
    const totalNotices = await prisma.notice.count();

    // Users by role
    const allUsers = await prisma.user.findMany({ where: { isGuest: false }, select: { role: true } });
    const usersByRole: Record<string, number> = {};
    for (const u of allUsers) {
        usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
    }

    res.json({
        analytics: {
            totalUsers, activeUsers, pendingApproval, lockedUsers,
            totalPosts, totalNotices, usersByRole,
        },
    });
};
