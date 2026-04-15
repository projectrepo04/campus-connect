import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    isRead: boolean;
    createdAt: string;
}

const NotificationBell: React.FC = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch unread count
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const data = await api.get('/notifications/unread');
                setUnreadCount(data.unreadCount);
            } catch {
                // Ignore errors
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const openDropdown = async () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown) {
            setLoading(true);
            try {
                const data = await api.get('/notifications?limit=10');
                setNotifications(data.notifications);
            } catch {
                // Ignore
            }
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(c - 1, 0));
        } catch {
            // Ignore
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // Ignore
        }
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.isRead) markAsRead(notif.id);

        if (notif.relatedEntityType === 'post' && notif.relatedEntityId) {
            navigate('/feed');
        } else if (notif.relatedEntityType === 'notice' && notif.relatedEntityId) {
            navigate('/notices');
        }
        setShowDropdown(false);
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'post': return '📰';
            case 'notice': return '📋';
            case 'comment': return '💬';
            case 'mention': return '📌';
            case 'system': return '🎓';
            default: return '🔔';
        }
    };

    return (
        <div className="dropdown" ref={dropdownRef}>
            <button
                className="notification-bell btn btn-ghost btn-icon"
                onClick={openDropdown}
                id="notification-bell"
                aria-label="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {showDropdown && (
                <div className="dropdown-menu" id="notification-dropdown">
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading-container" style={{ padding: '2rem' }}>
                            <div className="spinner" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <div className="empty-state-icon">🔕</div>
                            <p className="text-sm text-muted">No notifications yet</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>{getIcon(notif.type)}</span>
                                    <div style={{ flex: 1 }}>
                                        <div className="font-medium text-sm">{notif.title}</div>
                                        <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                                            {notif.message}
                                        </div>
                                        <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                                            {getTimeAgo(notif.createdAt)}
                                        </div>
                                    </div>
                                    {!notif.isRead && <div className="notification-dot" />}
                                </div>
                            ))}
                            <div style={{ padding: 'var(--space-sm)', borderTop: '1px solid var(--border-color)' }}>
                                <button
                                    className="btn btn-ghost btn-sm w-full"
                                    onClick={() => {
                                        navigate('/notifications');
                                        setShowDropdown(false);
                                    }}
                                >
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
