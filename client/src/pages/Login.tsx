import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type LoginStage = 'login' | 'password-reset' | 'profile-setup';

interface Department {
    id: string;
    name: string;
    code: string;
}

const DEPARTMENTS: Department[] = [
    { id: 'computer', name: 'Computer Engineering', code: 'CO' },
    { id: 'electrical', name: 'Electrical Engineering', code: 'EE' },
    { id: 'entc', name: 'Electronics & Telecommunication', code: 'ENTC' },
    { id: 'civil', name: 'Civil Engineering', code: 'CE' },
    { id: 'mechanical', name: 'Mechanical Engineering', code: 'ME' },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6];

const Login: React.FC = () => {
    const { login, loginAsGuest, resetPassword, setupProfile, error, clearError } = useAuth();
    const navigate = useNavigate();

    // Stage management
    const [stage, setStage] = useState<LoginStage>('login');

    // Login form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Password reset form
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Profile setup form
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [userRole, setUserRole] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMsg('');
        clearError();
        setLoading(true);

        try {
            const userData = await login(email, password);

            // Check if first-time password reset is needed
            if (userData.mustResetPassword) {
                setStage('password-reset');
                setSuccessMsg('');
                setLoading(false);
                return;
            }

            // Check if profile setup is needed
            if (!userData.profileSetupComplete) {
                setUserRole(userData.role);
                setStage('profile-setup');
                setLoading(false);
                return;
            }

            // All good — go to feed
            navigate('/feed');
        } catch (err: any) {
            setLocalError(err.message || 'Login failed. Please try again.');
        }
        setLoading(false);
    };

    const handleGuestLogin = async () => {
        setLocalError('');
        setSuccessMsg('');
        clearError();
        setLoading(true);

        try {
            await loginAsGuest();
            navigate('/feed');
        } catch (err: any) {
            setLocalError(err.message || 'Guest login failed. Please try again.');
        }
        setLoading(false);
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMsg('');
        clearError();

        if (newPassword !== confirmPassword) {
            setLocalError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(newPassword);
            setSuccessMsg('Password changed! Please log in again with your new password.');
            setStage('login');
            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setLocalError(err.message || 'Password reset failed.');
        }
        setLoading(false);
    };

    const handleProfileSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        clearError();

        if (!selectedDepartment) {
            setLocalError('Please select a department.');
            return;
        }

        if (userRole === 'student' && !selectedSemester) {
            setLocalError('Please select your semester.');
            return;
        }

        setLoading(true);
        try {
            await setupProfile({
                department: selectedDepartment,
                ...(userRole === 'student' && { semester: parseInt(selectedSemester) }),
            });
            navigate('/feed');
        } catch (err: any) {
            setLocalError(err.message || 'Profile setup failed.');
        }
        setLoading(false);
    };

    const displayError = localError || error;

    return (
        <div className="auth-container">
            <div className="auth-card card">
                <div className="auth-header">
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 'var(--radius-lg)',
                            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: 'white',
                            margin: '0 auto var(--space-md)',
                        }}
                    >
                        CC
                    </div>

                    {stage === 'login' && (
                        <>
                            <h1>Welcome Back</h1>
                            <p className="text-muted">Sign in to your Campus Connect account</p>
                        </>
                    )}
                    {stage === 'password-reset' && (
                        <>
                            <h1>🔐 Change Your Password</h1>
                            <p className="text-muted">
                                You're logging in for the first time. Please set a new secure password.
                            </p>
                        </>
                    )}
                    {stage === 'profile-setup' && (
                        <>
                            <h1>📋 Complete Your Profile</h1>
                            <p className="text-muted">
                                Select your department{userRole === 'student' ? ' and semester' : ''} to continue.
                            </p>
                        </>
                    )}
                </div>

                {successMsg && (
                    <div className="alert alert-success mb-md">
                        ✅ {successMsg}
                    </div>
                )}

                {displayError && (
                    <div className="alert alert-error mb-md">
                        ⚠️ {displayError}
                    </div>
                )}

                {/* ─── Login Form ─────────────────────── */}
                {stage === 'login' && (
                    <form className="auth-form" onSubmit={handleLogin} id="login-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-email">Email</label>
                            <input
                                id="login-email"
                                className="form-input"
                                type="email"
                                placeholder="you@college.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="login-password">Password</label>
                            <input
                                id="login-password"
                                className="form-input"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                            {loading ? (
                                <><div className="spinner spinner-sm" /> Signing in...</>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <div style={{ position: 'relative', margin: 'var(--space-md) 0', textAlign: 'center' }}>
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border-color)' }}></div>
                            <span style={{ position: 'relative', background: 'var(--card-bg)', padding: '0 var(--space-sm)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
                        </div>

                        <button
                            className="btn btn-outline btn-lg w-full"
                            type="button"
                            disabled={loading}
                            onClick={handleGuestLogin}
                        >
                            {loading ? (
                                <><div className="spinner spinner-sm" /> Loading...</>
                            ) : (
                                '👤 Continue as Guest'
                            )}
                        </button>

                        <div className="auth-footer" style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                            <p className="text-sm text-muted">
                                Account created by your college admin.
                                <br />
                                Contact admin if you don't have an account.
                            </p>
                        </div>
                    </form>
                )}

                {/* ─── First-Time Password Reset ─────── */}
                {stage === 'password-reset' && (
                    <form className="auth-form" onSubmit={handlePasswordReset} id="password-reset-form">
                        <div className="alert alert-warning mb-md" style={{ fontSize: '0.8125rem' }}>
                            🔑 You are using a temporary password assigned by admin. You must change it before continuing.
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="new-password">New Password</label>
                            <input
                                id="new-password"
                                className="form-input"
                                type="password"
                                placeholder="Min 8 chars: uppercase, lowercase, digit, special"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                            <input
                                id="confirm-password"
                                className="form-input"
                                type="password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                            {loading ? (
                                <><div className="spinner spinner-sm" /> Changing Password...</>
                            ) : (
                                'Set New Password'
                            )}
                        </button>
                    </form>
                )}

                {/* ─── Profile Setup ─────────────────── */}
                {stage === 'profile-setup' && (
                    <form className="auth-form" onSubmit={handleProfileSetup} id="profile-setup-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="department-select">Department</label>
                            <select
                                id="department-select"
                                className="form-select"
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                required
                            >
                                <option value="">Select your department</option>
                                {DEPARTMENTS.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name} ({dept.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {userRole === 'student' && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="semester-select">Current Semester</label>
                                <select
                                    id="semester-select"
                                    className="form-select"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    required
                                >
                                    <option value="">Select semester</option>
                                    {SEMESTERS.map((sem) => (
                                        <option key={sem} value={sem}>
                                            Semester {sem}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                                    Your semester will auto-upgrade every January.
                                </p>
                            </div>
                        )}

                        <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                            {loading ? (
                                <><div className="spinner spinner-sm" /> Saving...</>
                            ) : (
                                'Complete Setup'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
