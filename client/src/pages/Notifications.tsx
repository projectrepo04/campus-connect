import React, { useState, useEffect } from 'react';
import api from '../api/client';

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

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await api.get('/notifications?limit=50');
            setNotifications(data.notifications || []);
        } catch {
            console.error('Failed to load notifications');
        }
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch { /* ignore */ }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch { /* ignore */ }
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'post': return '📰';
            case 'notice': return '📋';
            case 'comment': return '💬';
            case 'like': return '❤️';
            case 'mention': return '📌';
            case 'approval': return '✅';
            case 'system': return '🎓';
            default: return '🔔';
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div>
            <div className="page-header flex justify-between items-start">
                <div>
                    <h1>🔔 Notifications</h1>
                    <p>{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner spinner-lg" />
                    <p>Loading notifications...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔕</div>
                    <h3>No notifications</h3>
                    <p className="text-muted">You'll see notifications here when something happens.</p>
                </div>
            ) : (
                <div className="card-flat">
                    {notifications.map((notif, index) => (
                        <React.Fragment key={notif.id}>
                            <div
                                className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                                onClick={() => !notif.isRead && markAsRead(notif.id)}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{getIcon(notif.type)}</span>
                                <div style={{ flex: 1 }}>
                                    <div className="font-semibold" style={{ fontSize: '0.9375rem' }}>
                                        {notif.title}
                                    </div>
                                    <div className="text-sm text-secondary" style={{ marginTop: '2px' }}>
                                        {notif.message}
                                    </div>
                                    <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                                        {getTimeAgo(notif.createdAt)}
                                    </div>
                                </div>
                                {!notif.isRead && <div className="notification-dot" />}
                            </div>
                            {index < notifications.length - 1 && (
                                <div style={{ height: '1px', background: 'var(--border-light)', margin: '0 var(--space-md)' }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
