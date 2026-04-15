import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../api/client";

export interface UserData {
    uid: string;
    email: string;
    fullName: string;
    role: string;
    department?: string;
    departmentCode?: string;
    semester?: number;
    profilePhoto?: string;
    isVerified: boolean;
    verifiedBadge: boolean;
    isApproved: string;
    isActive: boolean;
    isCampusMember: boolean;
    isGuest: boolean;
    mustResetPassword: boolean;
    profileSetupComplete: boolean;
}

interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<UserData>;
    loginAsGuest: () => Promise<UserData>;
    logout: () => Promise<void>;
    resetPassword: (newPassword: string) => Promise<void>;
    setupProfile: (data: { department: string; semester?: number }) => Promise<void>;
    refreshUser: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be within AuthProvider");
    return ctx;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get("/auth/me").then(r => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string): Promise<UserData> => {
        setError(null); setLoading(true);
        try {
            const r = await api.post("/auth/login", { email, password });
            setUser(r.user);
            return r.user;
        } catch (err: any) {
            setError(err.message || "Login failed");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const loginAsGuest = async (): Promise<UserData> => {
        setError(null); setLoading(true);
        try {
            const r = await api.post("/auth/guest");
            setUser(r.user);
            return r.user;
        } catch (err: any) {
            setError(err.message || "Guest login failed");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await api.post("/auth/logout");
        setUser(null);
    };

    const resetPassword = async (newPassword: string) => {
        setError(null);
        const r = await api.post("/auth/first-time-reset", { newPassword });
        if (r.requireReLogin) { setUser(null); }
    };

    const setupProfile = async (data: { department: string; semester?: number }) => {
        setError(null);
        await api.post("/auth/setup-profile", data);
        await refreshUser();
    };

    const refreshUser = async () => {
        try {
            const r = await api.get("/auth/me");
            setUser(r.user);
        } catch { /* ignore */ }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, loading, error, login, loginAsGuest, logout, resetPassword, setupProfile, refreshUser, clearError }}>
            {children}
        </AuthContext.Provider>
    );
};
