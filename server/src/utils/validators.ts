import { env } from '../config/env';

/**
 * Validate that the email belongs to the allowed college domain.
 * Now accepts any valid email format (Gmail, Yahoo, etc.).
 */
export const isCollegeEmail = (email: string): boolean => {
    // Accept any valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Check if a user's email belongs to THIS college's domain.
 * Now all valid emails are treated as campus members with full access.
 */
export const isCampusMemberEmail = (email: string): boolean => {
    // Accept any valid email format - all users get full access
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate roll number format using configured regex pattern.
 */
export const isValidRollNumber = (rollNumber: string): boolean => {
    const pattern = new RegExp(env.rollNumberPattern);
    return pattern.test(rollNumber);
};

/**
 * Validate that required fields are present and non-empty.
 */
export const validateRequired = (
    fields: Record<string, any>,
    requiredFields: string[]
): string[] => {
    const errors: string[] = [];
    for (const field of requiredFields) {
        if (fields[field] === undefined || fields[field] === null || fields[field] === '') {
            errors.push(`${field} is required.`);
        }
    }
    return errors;
};

/**
 * Validate password strength.
 */
export const isStrongPassword = (password: string): boolean => {
    // At least 8 chars, one uppercase, one lowercase, one digit, one special char
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return pattern.test(password);
};

/**
 * Valid user roles.
 */
export const VALID_ROLES = ['student', 'faculty', 'alumni', 'admin', 'guest'] as const;
export type UserRole = (typeof VALID_ROLES)[number];

/**
 * Valid notice categories.
 */
export const VALID_NOTICE_CATEGORIES = ['event', 'exam', 'placement', 'general'] as const;
export type NoticeCategory = (typeof VALID_NOTICE_CATEGORIES)[number];

/**
 * Valid audience targets.
 */
export const VALID_TARGET_AUDIENCES = ['all', 'department', 'semester'] as const;
export type TargetAudience = (typeof VALID_TARGET_AUDIENCES)[number];

/**
 * Valid profile visibility options.
 */
export const VALID_VISIBILITY = ['public', 'campus-only'] as const;
export type Visibility = (typeof VALID_VISIBILITY)[number];

/**
 * Valid approval statuses.
 */
export const VALID_APPROVAL_STATUS = ['pending', 'approved', 'rejected'] as const;
export type ApprovalStatus = (typeof VALID_APPROVAL_STATUS)[number];
