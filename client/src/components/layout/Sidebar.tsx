import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const isActive = (path: string) => location.pathname.startsWith(path);
    const isCampusMember = user.isCampusMember;

    return (
        <aside className="page-sidebar" id="app-sidebar">
            <nav>
                {/* Guest banner for non-campus users */}
                {!isCampusMember && (
                    <div className="guest-banner">
                        <span style={{ fontSize: '1.25rem' }}>👁️</span>
                        <div>
                            <strong>Guest Access</strong>
                            <p className="text-xs text-muted" style={{ margin: 0 }}>
                                Browse-only mode. You're viewing content from another college.
                            </p>
                        </div>
                    </div>
                )}

                <div className="sidebar-section">Main</div>
                <ul className="sidebar-nav">
                    <li>
                        <Link to="/feed" className={`sidebar-link ${isActive('/feed') ? 'active' : ''}`}>
                            📰 Feed
                        </Link>
                    </li>
                    <li>
                        <Link to="/notices" className={`sidebar-link ${isActive('/notices') ? 'active' : ''}`}>
                            📋 Notice Board
                        </Link>
                    </li>
                    <li>
                        <Link to="/profiles" className={`sidebar-link ${isActive('/profiles') ? 'active' : ''}`}>
                            👥 People
                        </Link>
                    </li>
                    {isCampusMember && (
                        <li>
                            <Link to="/notifications" className={`sidebar-link ${isActive('/notifications') ? 'active' : ''}`}>
                                🔔 Notifications
                            </Link>
                        </li>
                    )}
                </ul>

                {/* Account section — only for campus members */}
                {isCampusMember && (
                    <>
                        <div className="sidebar-section">My Account</div>
                        <ul className="sidebar-nav">
                            <li>
                                <Link
                                    to={`/profile/${user.uid}`}
                                    className={`sidebar-link ${isActive(`/profile/${user.uid}`) ? 'active' : ''}`}
                                >
                                    👤 My Profile
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={`/profile/${user.uid}/edit`}
                                    className={`sidebar-link ${isActive(`/profile/${user.uid}/edit`) ? 'active' : ''}`}
                                >
                                    ✏️ Edit Profile
                                </Link>
                            </li>
                        </ul>
                    </>
                )}

                {/* Management section — campus faculty/admin only */}
                {isCampusMember && (user.role === 'faculty' || user.role === 'admin') && (
                    <>
                        <div className="sidebar-section">Management</div>
                        <ul className="sidebar-nav">
                            {(user.role === 'faculty' || user.role === 'admin') && (
                                <li>
                                    <Link
                                        to="/notices/create"
                                        className={`sidebar-link ${isActive('/notices/create') ? 'active' : ''}`}
                                    >
                                        ➕ Create Notice
                                    </Link>
                                </li>
                            )}
                            {user.role === 'admin' && (
                                <>
                                    <li>
                                        <Link to="/admin" className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}>
                                            ⚙️ Admin Panel
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/users"
                                            className={`sidebar-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
                                        >
                                            👥 Manage Users
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/departments"
                                            className={`sidebar-link ${location.pathname === '/admin/departments' ? 'active' : ''}`}
                                        >
                                            🏢 Departments
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </>
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;

