import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <>
            <nav className="navbar" id="main-navbar">
                <Link to="/" className="navbar-brand">
                    <div className="navbar-brand-icon">CC</div>
                    <span>Campus Connect</span>
                </Link>

                {user && (
                    <ul className="navbar-nav">
                        <li>
                            <Link
                                to="/feed"
                                className={`navbar-link ${isActive('/feed') ? 'active' : ''}`}
                            >
                                📰 Feed
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/notices"
                                className={`navbar-link ${isActive('/notices') ? 'active' : ''}`}
                            >
                                📋 Notices
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/profiles"
                                className={`navbar-link ${isActive('/profiles') ? 'active' : ''}`}
                            >
                                👥 People
                            </Link>
                        </li>
                        {user.role === 'admin' && (
                            <li>
                                <Link
                                    to="/admin"
                                    className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
                                >
                                    ⚙️ Admin
                                </Link>
                            </li>
                        )}
                    </ul>
                )}

                <div className="navbar-actions">
                    {user ? (
                        <>
                            <NotificationBell />

                            <div className="user-menu">
                                <button
                                    className="user-menu-trigger"
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    id="user-menu-trigger"
                                >
                                    <div className="avatar avatar-sm">
                                        {user.profilePhoto ? (
                                            <img src={user.profilePhoto} alt={user.fullName} />
                                        ) : (
                                            getInitials(user.fullName)
                                        )}
                                    </div>
                                </button>

                                {showUserMenu && (
                                    <div className="user-menu-dropdown" id="user-menu-dropdown">
                                        <div style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                                            <div className="font-semibold" style={{ fontSize: '0.9375rem' }}>
                                                {user.fullName}
                                                {user.verifiedBadge && <span style={{ marginLeft: '4px' }}>✓</span>}
                                            </div>
                                            <div className="text-sm text-muted">{user.email}</div>
                                            <div className="mt-sm">
                                                <span className="badge badge-primary">{user.role}</span>
                                            </div>
                                        </div>
                                        <div className="user-menu-divider" />
                                        <Link
                                            to={`/profile/${user.uid}`}
                                            className="user-menu-item"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            👤 My Profile
                                        </Link>
                                        <Link
                                            to="/notifications"
                                            className="user-menu-item"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            🔔 Notifications
                                        </Link>
                                        <div className="user-menu-divider" />
                                        <button className="user-menu-item" onClick={handleLogout}>
                                            🚪 Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile menu button */}
                            <button
                                className="mobile-menu-btn"
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                            >
                                {showMobileMenu ? '✕' : '☰'}
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-sm">
                            <Link to="/login" className="btn btn-primary btn-sm">
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Mobile sidebar */}
            {showMobileMenu && user && (
                <div className="mobile-sidebar open" onClick={() => setShowMobileMenu(false)}>
                    <nav>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <li>
                                <Link to="/feed" className="sidebar-link">📰 Feed</Link>
                            </li>
                            <li>
                                <Link to="/notices" className="sidebar-link">📋 Notices</Link>
                            </li>
                            <li>
                                <Link to="/profiles" className="sidebar-link">👥 People</Link>
                            </li>
                            <li>
                                <Link to="/notifications" className="sidebar-link">🔔 Notifications</Link>
                            </li>
                            <li>
                                <Link to={`/profile/${user.uid}`} className="sidebar-link">👤 My Profile</Link>
                            </li>
                            {user.role === 'admin' && (
                                <li>
                                    <Link to="/admin" className="sidebar-link">⚙️ Admin Panel</Link>
                                </li>
                            )}
                        </ul>
                    </nav>
                </div>
            )}
        </>
    );
};

export default Navbar;
