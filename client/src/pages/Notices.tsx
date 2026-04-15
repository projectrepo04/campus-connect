import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

interface Notice {
    id: string;
    title: string;
    description: string;
    category: string;
    department?: string;
    targetAudience: string;
    targetSemester?: number;
    createdBy: string;
    createdByName: string;
    expiryDate?: string;
    createdAt: string;
}

const Notices: React.FC = () => {
    const { user } = useAuth();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'general',
        targetAudience: 'all',
        expiryDate: '',
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchNotices();
    }, [categoryFilter]);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            let url = '/notices?limit=50';
            if (categoryFilter) url += `&category=${categoryFilter}`;
            const data = await api.get(url);
            setNotices(data.notices || []);
        } catch {
            console.error('Failed to fetch notices');
        }
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/notices', {
                ...form,
                expiryDate: form.expiryDate || undefined,
            });
            setShowCreate(false);
            setForm({ title: '', description: '', category: 'general', targetAudience: 'all', expiryDate: '' });
            fetchNotices();
        } catch (err: any) {
            alert(err.message || 'Failed to create notice.');
        }
        setCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this notice?')) return;
        try {
            await api.delete(`/notices/${id}`);
            setNotices((prev) => prev.filter((n) => n.id !== id));
        } catch { /* ignore */ }
    };

    const getTimeAgo = (dateStr: string) => {
        const d = new Date(dateStr);
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return d.toLocaleDateString();
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'event': return 'badge-primary';
            case 'exam': return 'badge-warning';
            case 'placement': return 'badge-success';
            default: return 'badge-info';
        }
    };

    const isExpired = (date?: string) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    const canManage = user?.role === 'admin' || user?.role === 'faculty';

    return (
        <div>
            <div className="page-header flex justify-between items-start">
                <div>
                    <h1>📋 Notice Board</h1>
                    <p>Important announcements and updates from administration and faculty</p>
                </div>
                {canManage && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                        {showCreate ? 'Cancel' : '➕ New Notice'}
                    </button>
                )}
            </div>

            {/* Create Notice Form */}
            {showCreate && (
                <div className="card-flat mb-lg animate-fade">
                    <h3 className="mb-md">Create Notice</h3>
                    <form className="auth-form" onSubmit={handleCreate}>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input
                                className="form-input"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                required
                                placeholder="Notice title"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                required
                                placeholder="Details about the notice..."
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    <option value="general">General</option>
                                    <option value="exam">Exam</option>
                                    <option value="event">Event</option>
                                    <option value="placement">Placement</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="sports">Sports</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Target Audience</label>
                                <select className="form-select" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
                                    <option value="all">Everyone</option>
                                    <option value="students">Students Only</option>
                                    <option value="faculty">Faculty Only</option>
                                    <option value="department">Department</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Expiry Date (optional)</label>
                            <input
                                className="form-input"
                                type="date"
                                value={form.expiryDate}
                                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                            />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={creating}>
                            {creating ? 'Publishing...' : 'Publish Notice'}
                        </button>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="filter-bar">
                {['', 'general', 'exam', 'event', 'placement', 'workshop', 'sports'].map((cat) => (
                    <button
                        key={cat}
                        className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(cat)}
                    >
                        {cat === '' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {/* Notices List */}
            {loading ? (
                <div className="loading-container">
                    <div className="spinner spinner-lg" />
                    <p>Loading notices...</p>
                </div>
            ) : notices.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3>No notices found</h3>
                    <p className="text-muted">Check back later for updates.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-md">
                    {notices.map((notice) => (
                        <div key={notice.id} className={`notice-card category-${notice.category}`}>
                            <div className="flex justify-between items-start">
                                <div style={{ flex: 1 }}>
                                    <div className="flex items-center gap-sm mb-sm" style={{ flexWrap: 'wrap' }}>
                                        <span className={`badge ${getCategoryColor(notice.category)} notice-category`}>
                                            {notice.category}
                                        </span>
                                        {isExpired(notice.expiryDate) && (
                                            <span className="badge badge-error">Expired</span>
                                        )}
                                    </div>
                                    <h3 style={{ fontSize: '1.125rem' }}>{notice.title}</h3>
                                    <p className="text-secondary mt-sm" style={{ whiteSpace: 'pre-wrap' }}>
                                        {notice.description}
                                    </p>
                                    <div className="flex items-center gap-md mt-md text-sm text-muted" style={{ flexWrap: 'wrap' }}>
                                        <span>By {notice.createdByName}</span>
                                        <span>·</span>
                                        <span>{getTimeAgo(notice.createdAt)}</span>
                                        {notice.expiryDate && (
                                            <>
                                                <span>·</span>
                                                <span>Expires: {new Date(notice.expiryDate).toLocaleDateString()}</span>
                                            </>
                                        )}
                                        <span>·</span>
                                        <span>👥 {notice.targetAudience}</span>
                                    </div>
                                </div>
                                {canManage && notice.createdBy === user?.uid && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDelete(notice.id)}
                                        style={{ color: 'var(--brand-error)', flexShrink: 0 }}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notices;
