import { Response } from 'express';
import { AuthRequest, generateToken } from '../middleware/auth';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
    isCampusMemberEmail,
    isStrongPassword,
    validateRequired,
} from '../utils/validators';
import crypto from 'crypto';

const VALID_DEPARTMENTS = [
    { id: 'computer', name: 'Computer Engineering', code: 'CO' },
    { id: 'electrical', name: 'Electrical Engineering', code: 'EE' },
    { id: 'entc', name: 'Electronics & Telecommunication', code: 'ENTC' },
    { id: 'civil', name: 'Civil Engineering', code: 'CE' },
    { id: 'mechanical', name: 'Mechanical Engineering', code: 'ME' },
];

const MAX_SEMESTER = 6;
const MAX_FAILED_ATTEMPTS = 5;

function generateRandomPassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '@#$%&*!';
    const all = upper + lower + digits + special;

    let password = '';
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = 0; i < 4; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
}

export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, fullName, role, department } = req.body;

        const errors = validateRequired(req.body, ['email', 'fullName', 'role']);
        if (errors.length > 0) {
            res.status(400).json({ error: 'Validation failed.', details: errors });
            return;
        }

        const allowedRoles = ['student', 'faculty'];
        if (!allowedRoles.includes(role)) {
            res.status(400).json({ error: `Invalid role. Admin can create: ${allowedRoles.join(', ')}` });
            return;
        }

        if (!isCampusMemberEmail(email)) {
            res.status(400).json({ error: 'Invalid email format. Please provide a valid email address.' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            res.status(409).json({ error: 'An account with this email already exists.' });
            return;
        }

        const generatedPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);
        const uid = uuidv4();

        // If admin provided a department, resolve it and mark profile as partially set up
        const dept = department ? VALID_DEPARTMENTS.find(d => d.id === department) : null;

        const user = await prisma.user.create({
            data: {
                uid,
                email: email.toLowerCase(),
                password: hashedPassword,
                fullName,
                role,
                isCampusMember: true,
                isApproved: 'approved',
                isVerified: false,
                mustResetPassword: true,
                // If department is assigned, students still need to pick semester during profile setup
                // Faculty/admin can skip profile setup entirely if department is set
                profileSetupComplete: dept && role !== 'student' ? true : false,
                ...(dept && { department: dept.id, departmentCode: dept.code }),
                verificationToken: crypto.randomBytes(32).toString('hex'),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });

        res.status(201).json({
            message: `Account created for ${fullName}.`,
            user: { uid: user.uid, email: user.email, fullName: user.fullName, role: user.role, department: dept?.name, departmentCode: dept?.code },
            temporaryPassword: generatedPassword,
        });
    } catch (error: any) {
        console.error('Create account error:', error);
        res.status(500).json({ error: 'Account creation failed.' });
    }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }

        if (user.isLocked) {
            res.status(403).json({ error: 'Account locked. Contact admin.', isLocked: true });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ error: 'Account deactivated.' });
            return;
        }

        if (user.isApproved === 'pending') {
            res.status(403).json({ error: 'Account pending approval.' });
            return;
        }

        if (user.isApproved === 'rejected') {
            res.status(403).json({ error: 'Registration rejected.' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            const newAttempts = user.failedLoginAttempts + 1;
            const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: newAttempts,
                    isLocked: shouldLock,
                    ...(shouldLock && { lockedAt: new Date().toISOString() }),
                    updatedAt: new Date().toISOString(),
                },
            });

            if (shouldLock) {
                res.status(403).json({ error: 'Account locked! Too many failed attempts.', isLocked: true });
                return;
            }

            const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
            res.status(401).json({ error: `Invalid password. ${remaining} attempts remaining.`, attemptsRemaining: remaining });
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lastLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        });

        const token = generateToken({ uid: user.uid, email: user.email, role: user.role });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 5 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        res.json({
            message: 'Login successful.',
            user: {
                uid: user.uid,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                department: user.department,
                departmentCode: user.departmentCode,
                semester: user.semester,
                profilePhoto: user.profilePhoto,
                isVerified: user.isVerified,
                verifiedBadge: user.verifiedBadge,
                isCampusMember: user.isCampusMember,
                isGuest: user.isGuest,
                mustResetPassword: user.mustResetPassword,
                profileSetupComplete: user.profileSetupComplete,
                isApproved: user.isApproved,
                isActive: user.isActive,
            },
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
};

export const guestLogin = async (_req: AuthRequest, res: Response): Promise<void> => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    res.cookie('token', 'guest-session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
    });

    res.json({
        message: 'Guest login successful.',
        user: {
            uid: guestId,
            email: null,
            fullName: 'Guest User',
            role: 'guest',
            department: null,
            departmentCode: null,
            semester: null,
            profilePhoto: null,
            isVerified: false,
            verifiedBadge: false,
            isCampusMember: false,
            isGuest: true,
            mustResetPassword: false,
            profileSetupComplete: true,
            isApproved: 'approved',
            isActive: true,
        },
    });
};

export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
    res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
    res.json({ message: 'Logged out successfully.' });
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'Not authenticated.' });
        return;
    }

    const user = await prisma.user.findUnique({
        where: { uid: req.user.uid },
        select: { uid: true, email: true, fullName: true, role: true, department: true, departmentCode: true, semester: true, profilePhoto: true, isVerified: true, verifiedBadge: true, isCampusMember: true, isGuest: true, mustResetPassword: true, profileSetupComplete: true, isApproved: true, isActive: true },
    });

    if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
    }

    res.json({ user });
};

export const firstTimePasswordReset = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    const { newPassword } = req.body;
    if (!newPassword || !isStrongPassword(newPassword)) {
        res.status(400).json({ error: 'Password must be 8+ chars with uppercase, lowercase, digit, and special char.' });
        return;
    }

    const user = await prisma.user.findUnique({ where: { uid: req.user.uid } });
    if (!user || !user.mustResetPassword) {
        res.status(400).json({ error: 'Password reset not required.' });
        return;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(newPassword, 10), mustResetPassword: false, updatedAt: new Date().toISOString() },
    });

    res.json({ message: 'Password changed. Please log in again.', requireReLogin: true });
};

export const setupProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    const { department, semester } = req.body;

    const dept = VALID_DEPARTMENTS.find(d => d.id === department);
    if (!dept) {
        res.status(400).json({ error: 'Invalid department.' });
        return;
    }

    const user = await prisma.user.findUnique({ where: { uid: req.user.uid } });
    if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
    }

    const data: any = { department: dept.id, departmentCode: dept.code, profileSetupComplete: true, updatedAt: new Date().toISOString() };

    if (user.role === 'student') {
        const sem = parseInt(semester);
        if (!sem || sem < 1 || sem > MAX_SEMESTER) {
            res.status(400).json({ error: `Semester must be 1-${MAX_SEMESTER}.` });
            return;
        }
        data.semester = sem;
    }

    await prisma.user.update({ where: { id: user.id }, data });
    res.json({ message: 'Profile setup complete!', department: dept, ...(data.semester && { semester: data.semester }) });
};

export const getDepartmentList = async (_req: AuthRequest, res: Response): Promise<void> => {
    res.json({ departments: VALID_DEPARTMENTS });
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ error: 'Email required.' });
        return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
        res.json({ message: 'If account exists, reset link sent.' });
        return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(), updatedAt: new Date().toISOString() } });

    res.json({ message: 'If account exists, reset link sent.', ...(process.env.NODE_ENV === 'development' && { resetToken }) });
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || !isStrongPassword(newPassword)) {
        res.status(400).json({ error: 'Valid reset token and strong password required.' });
        return;
    }

    const user = await prisma.user.findFirst({ where: { resetToken: token } });
    if (!user || new Date(user.resetTokenExpiry!) < new Date()) {
        res.status(400).json({ error: 'Invalid or expired token.' });
        return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(newPassword, 10), resetToken: null, resetTokenExpiry: null, updatedAt: new Date().toISOString() } });
    res.json({ message: 'Password reset successful.' });
};

export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
    const { token, uid } = req.body;
    if (!token || !uid) {
        res.status(400).json({ error: 'Token and user ID required.' });
        return;
    }

    const user = await prisma.user.findFirst({ where: { uid, verificationToken: token } });
    if (!user) {
        res.status(400).json({ error: 'Invalid token.' });
        return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true, verificationToken: null, updatedAt: new Date().toISOString() } });
    res.json({ message: 'Email verified.' });
};

export const recordFailedLogin = async (req: AuthRequest, res: Response): Promise<void> => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ error: 'Email required.' });
        return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
        res.json({ message: 'Recorded.' });
        return;
    }

    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
        where: { id: user.id },
        data: {
            failedLoginAttempts: newAttempts,
            isLocked: shouldLock,
            ...(shouldLock && { lockedAt: new Date().toISOString() }),
            updatedAt: new Date().toISOString(),
        },
    });

    res.json({ message: 'Recorded.', isLocked: shouldLock });
};
