import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/db";

const PROFILE_SELECT = {
    id: true, uid: true, email: true, fullName: true, role: true,
    department: true, departmentCode: true, semester: true,
    rollNumber: true, passingYear: true, designation: true,
    profilePhoto: true, isVerified: true, verifiedBadge: true,
    skills: true, certifications: true, projects: true,
    profileVisibility: true, createdAt: true,
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const targetUid = req.params.userId;
    if (!targetUid) {
        // If no userId param, return the logged-in user's profile
        if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
        const user = await prisma.user.findUnique({ where: { uid: req.user.uid }, select: PROFILE_SELECT });
        if (!user) { res.status(404).json({ error: "User not found" }); return; }
        res.json({ user });
        return;
    }
    const user = await prisma.user.findUnique({ where: { uid: targetUid }, select: PROFILE_SELECT });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ user });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
    const allowed = ["fullName", "profilePhoto", "profileVisibility"];
    const updates: any = { updatedAt: new Date().toISOString() };
    for (const f of allowed) {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    const user = await prisma.user.update({ where: { uid: req.user.uid }, data: updates });
    res.json({ message: "Profile updated", user });
};

export const updateSkills = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Auth required" }); return; }
    const { skills } = req.body;
    if (!Array.isArray(skills)) { res.status(400).json({ error: "Skills must be an array" }); return; }
    const user = await prisma.user.update({
        where: { uid: req.user.uid },
        data: { skills: JSON.stringify(skills), updatedAt: new Date().toISOString() },
    });
    res.json({ message: "Skills updated", user });
};

export const getAllProfiles = async (req: AuthRequest, res: Response): Promise<void> => {
    const where: any = { isActive: true, isApproved: "approved", isGuest: false };
    if (req.query.role) where.role = req.query.role as string;
    const users = await prisma.user.findMany({
        where,
        select: {
            uid: true, fullName: true, role: true,
            department: true, departmentCode: true, semester: true,
            profilePhoto: true, skills: true, verifiedBadge: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
    // Parse skills from JSON string
    const profiles = users.map(u => ({
        ...u,
        skills: (() => {
            if (Array.isArray(u.skills)) return u.skills;
            if (typeof u.skills === 'string') {
                try { return JSON.parse(u.skills); } catch { return []; }
            }
            return [];
        })(),
    }));
    res.json({ profiles, count: profiles.length });
};
