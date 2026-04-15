import React, { useState, useEffect } from 'react';
import api from '../api/client';

interface UserRecord {
    uid: string;
    email: string;
    fullName: string;
    role: string;
    department?: string;
    departmentCode?: string;
    isApproved: string;
    isActive: boolean;
    isFlagged: boolean;
    isLocked?: boolean;
    failedLoginAttempts?: number;
    mustResetPassword?: boolean;
    createdAt: string;
}

interface Analytics {
    totalUsers: number;
    activeUsers: number;
    pendingApproval: number;
    lockedUsers: number;
    totalPosts: number;
    totalNotices: number;
    usersByRole: Record<string, number>;
}

const DEPARTMENTS = [
    { id: 'computer', name: 'Computer Engineering', code: 'CO' },
    { id: 'electrical', name: 'Electrical Engineering', code: 'EE' },
    { id: 'entc', name: 'Electronics & Telecommunication', code: 'ENTC' },
    { id: 'civil', name: 'Civil Engineering', code: 'CE' },
    { id: 'mechanical', name: 'Mechanical Engineering', code: 'ME' },
];

const Admin: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [userFilter, setUserFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Create account form
    const [createForm, setCreateForm] = useState({ fullName: '', email: '', role: 'student', department: '' });
    const [creatingAccount, setCreatingAccount] = useState(false);
    const [createdAccount, setCreatedAccount] = useState<{ email: string; password: string; fullName: string } | null>(null);

    // Reset password result
    const [resetResult, setResetResult] = useState<{ uid: string; password: string } | null>(null);

    useEffect(() => {
        if (activeTab === 'dashboard') fetchAnalytics();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/analytics');
            setAnalytics(data.analytics);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        }
        setLoading(false);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/users');
            setUsers(data.users || []);
        } catch {
            console.error('Failed to load users');
        }
        setLoading(false);
    };

    // ─── Create Account ──────────────────────────
    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingAccount(true);
        setCreatedAccount(null);
        try {
            const data = await api.post('/auth/create-account', createForm);
            setCreatedAccount({
                email: createForm.email,
                password: data.temporaryPassword,
                fullName: createForm.fullName,
            });
            setCreateForm({ fullName: '', email: '', role: 'student', department: '' });
        } catch (err: any) {
            alert(err.message || 'Failed to create account.');
        }
        setCreatingAccount(false);
    };

    // ─── User Actions ────────────────────────────
    const handleUserAction = async (userId: string, action: string) => {
        try {
            await api.put(`/admin/users/${userId}/${action}`);
            fetchUsers();
        } catch (err: any) {
            alert(err.message || `Failed to ${action} user.`);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to permanently delete this user and all their data?')) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers((prev) => prev.filter((u) => u.uid !== userId));
        } catch (err: any) {
            alert(err.message || 'Failed to delete user.');
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Failed to change role.');
        }
    };

    const handleResetPassword = async (userId: string) => {
        if (!confirm('Reset this user\'s password? They will need to set a new password on next login.')) return;
        try {
            const data = await api.put(`/admin/users/${userId}/reset-password`);
            setResetResult({ uid: userId, password: data.temporaryPassword });
        } catch (err: any) {
            alert(err.message || 'Failed to reset password.');
        }
    };

    // ─── Filters ─────────────────────────────────
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (userFilter === 'pending') return matchesSearch && u.isApproved === 'pending';
        if (userFilter === 'locked') return matchesSearch && u.isLocked;
        if (userFilter === 'flagged') return matchesSearch && u.isFlagged;
        if (userFilter === 'inactive') return matchesSearch && !u.isActive;
        return matchesSearch;
    });

    const getStatusBadge = (user: UserRecord) => {
        if (user.isLocked) return <span className="badge badge-error">🔒 Locked</span>;
        if (user.isApproved === 'pending') return <span className="badge badge-warning">Pending</span>;
        if (user.isApproved === 'rejected') return <span className="badge badge-error">Rejected</span>;
        if (user.isFlagged) return <span className="badge badge-error">Flagged</span>;
        if (!user.isActive) return <span className="badge badge-warning">Inactive</span>;
        if (user.mustResetPassword) return <span className="badge badge-info">First Login</span>;
        return <span className="badge badge-success">Active</span>;
    };

    return (
        <div>
            <div className="page-header">
                <h1>⚙️ Admin Panel</h1>
                <p>Manage users, create accounts, and monitor system analytics</p>
            </div>

            {/* Tabs */}
            <div className="tabs mb-lg">
                <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                    📊 Dashboard
                </button>
                <button className={`tab ${activeTab === 'create-account' ? 'active' : ''}`} onClick={() => setActiveTab('create-account')}>
                    ➕ Create Account
                </button>
                <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                    👥 Manage Users
                </button>
            </div>

            {/* ─── Dashboard Tab ─────────────────── */}
            {activeTab === 'dashboard' && (
                <>
                    {loading ? (
                        <div className="loading-container"><div className="spinner spinner-lg" /><p>Loading analytics...</p></div>
                    ) : analytics ? (
                        <>
                            <div className="admin-stats">
                                <div className="stat-card">
                                    <div className="stat-value">{analytics.totalUsers}</div>
                                    <div className="stat-label">Total Users</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{analytics.activeUsers}</div>
                                    <div className="stat-label">Active Users</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {analytics.lockedUsers || 0}
                                    </div>
                                    <div className="stat-label">Locked Accounts</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{analytics.totalPosts}</div>
                                    <div className="stat-label">Total Posts</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{analytics.totalNotices}</div>
                                    <div className="stat-label">Total Notices</div>
                                </div>
                            </div>

                            <div className="admin-section">
                                <h2>Users by Role</h2>
                                <div className="grid grid-4 gap-md">
                                    {Object.entries(analytics.usersByRole || {}).map(([role, count]) => (
                                        <div key={role} className="card-flat text-center">
                                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{count}</div>
                                            <div className="stat-label" style={{ textTransform: 'capitalize' }}>{role}s</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state"><p className="text-muted">Failed to load analytics.</p></div>
                    )}
                </>
            )}

            {/* ─── Create Account Tab ────────────── */}
            {activeTab === 'create-account' && (
                <div style={{ maxWidth: '600px' }}>
                    <div className="card-flat mb-lg">
                        <h3 className="mb-sm">🎓 Create New Account</h3>
                        <p className="text-muted text-sm mb-lg">
                            Create an account for a new student or faculty member. A random temporary password will be generated.
                            The user must change this password on their first login.
                        </p>

                        <form onSubmit={handleCreateAccount}>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. Rahul Sharma"
                                    value={createForm.fullName}
                                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">College Email *</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="e.g. rahul@college.edu"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Role *</label>
                                <select
                                    className="form-select"
                                    value={createForm.role}
                                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                >
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Department *</label>
                                <select
                                    className="form-select"
                                    value={createForm.department}
                                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                                    required
                                >
                                    <option value="">Select department</option>
                                    {DEPARTMENTS.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name} ({dept.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button className="btn btn-primary w-full" type="submit" disabled={creatingAccount}>
                                {creatingAccount ? (
                                    <><div className="spinner spinner-sm" /> Creating...</>
                                ) : (
                                    '➕ Create Account'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Show generated credentials */}
                    {createdAccount && (
                        <div className="card-flat" style={{ border: '2px solid var(--brand-success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                            <h3 style={{ color: 'var(--brand-success)' }}>✅ Account Created Successfully</h3>
                            <p className="text-sm text-muted mb-md">
                                Share these credentials with the user. The temporary password will NOT be shown again.
                            </p>
                            <div style={{
                                background: 'var(--bg-tertiary)',
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                fontFamily: 'monospace',
                                fontSize: '0.9375rem',
                                lineHeight: 1.8,
                            }}>
                                <div><strong>Name:</strong> {createdAccount.fullName}</div>
                                <div><strong>Email:</strong> {createdAccount.email}</div>
                                <div><strong>Temporary Password:</strong>{' '}
                                    <span style={{ color: 'var(--brand-warning)', fontWeight: 700, letterSpacing: '0.05em' }}>
                                        {createdAccount.password}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-muted" style={{ marginTop: 'var(--space-sm)' }}>
                                ⚠️ The user will be asked to change this password on their first login.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Users Tab ─────────────────────── */}
            {activeTab === 'users' && (
                <>
                    <div className="flex gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
                        <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
                            <span className="search-icon">🔍</span>
                            <input
                                className="form-input"
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-bar" style={{ marginBottom: 0 }}>
                            {['all', 'locked', 'pending', 'flagged', 'inactive'].map((f) => (
                                <button
                                    key={f}
                                    className={`filter-chip ${userFilter === f ? 'active' : ''}`}
                                    onClick={() => setUserFilter(f)}
                                >
                                    {f === 'all' ? 'All' : f === 'locked' ? '🔒 Locked' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reset password notification */}
                    {resetResult && (
                        <div className="alert alert-warning mb-md" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <strong>Password Reset — New Temporary Password:</strong>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em', fontSize: '1.1rem' }}>
                                {resetResult.password}
                            </span>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setResetResult(null)}
                                style={{ marginTop: '0.25rem' }}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-container"><div className="spinner spinner-lg" /></div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Dept</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => (
                                        <tr key={u.uid}>
                                            <td>
                                                <div className="font-medium">{u.fullName}</div>
                                                <div className="text-xs text-muted">{u.email}</div>
                                            </td>
                                            <td>
                                                <select
                                                    className="form-select"
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                                                    style={{ width: 'auto', padding: '2px 28px 2px 8px', fontSize: '0.75rem' }}
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="faculty">Faculty</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="text-sm">{u.departmentCode || '—'}</td>
                                            <td>{getStatusBadge(u)}</td>
                                            <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                                                    {/* Unlock locked accounts */}
                                                    {u.isLocked && (
                                                        <button className="btn btn-success btn-sm" onClick={() => handleUserAction(u.uid, 'unlock')} title="Unlock">🔓</button>
                                                    )}
                                                    {/* Approve/Reject pending */}
                                                    {u.isApproved === 'pending' && (
                                                        <>
                                                            <button className="btn btn-success btn-sm" onClick={() => handleUserAction(u.uid, 'approve')}>✓</button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => handleUserAction(u.uid, 'reject')}>✕</button>
                                                        </>
                                                    )}
                                                    {/* Activate/Deactivate */}
                                                    {u.isApproved === 'approved' && u.isActive && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleUserAction(u.uid, 'deactivate')} title="Deactivate">⏸️</button>
                                                    )}
                                                    {u.isApproved === 'approved' && !u.isActive && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleUserAction(u.uid, 'activate')} title="Activate">▶️</button>
                                                    )}
                                                    {/* Reset password */}
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleResetPassword(u.uid)} title="Reset Password">🔑</button>
                                                    {/* Flag */}
                                                    {!u.isFlagged ? (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleUserAction(u.uid, 'flag')} title="Flag">🚩</button>
                                                    ) : (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleUserAction(u.uid, 'flag')} title="Unflag">🏳️</button>
                                                    )}
                                                    {/* Delete */}
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteUser(u.uid)} title="Delete" style={{ color: 'var(--brand-error)' }}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center text-muted" style={{ padding: '2rem' }}>
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Admin;
