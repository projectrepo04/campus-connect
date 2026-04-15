import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface ProfileSummary {
    uid: string;
    fullName: string;
    role: string;
    departmentCode?: string;
    skills?: string[];
    verifiedBadge: boolean;
    profilePhoto?: string;
}

const Profiles: React.FC = () => {
    const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => {
        fetchProfiles();
    }, [roleFilter]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            let url = '/profile/public/list';
            if (roleFilter) url += `?role=${roleFilter}`;
            const data = await api.get(url);
            setProfiles(data.profiles || []);
        } catch {
            console.error('Failed to fetch profiles');
        }
        setLoading(false);
    };

    const filtered = profiles.filter(
        (p) =>
            p.fullName.toLowerCase().includes(search.toLowerCase()) ||
            (p.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
            (p.departmentCode || '').toLowerCase().includes(search.toLowerCase())
    );

    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="badge badge-error">Admin</span>;
            case 'faculty': return <span className="badge badge-primary">Faculty</span>;
            case 'alumni': return <span className="badge badge-info">Alumni</span>;
            case 'student': return <span className="badge badge-success">Student</span>;
            default: return null;
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>👥 People</h1>
                <p>Discover students, faculty, and alumni in your college</p>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
                <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
                    <span className="search-icon">🔍</span>
                    <input
                        className="form-input"
                        placeholder="Search by name, skill, or department..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="filter-bar" style={{ marginBottom: 0 }}>
                    <button className={`filter-chip ${roleFilter === '' ? 'active' : ''}`} onClick={() => setRoleFilter('')}>
                        All
                    </button>
                    <button className={`filter-chip ${roleFilter === 'student' ? 'active' : ''}`} onClick={() => setRoleFilter('student')}>
                        Students
                    </button>
                    <button className={`filter-chip ${roleFilter === 'faculty' ? 'active' : ''}`} onClick={() => setRoleFilter('faculty')}>
                        Faculty
                    </button>
                    <button className={`filter-chip ${roleFilter === 'alumni' ? 'active' : ''}`} onClick={() => setRoleFilter('alumni')}>
                        Alumni
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner spinner-lg" />
                    <p>Loading...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3>No profiles found</h3>
                    <p className="text-muted">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-3 gap-md">
                    {filtered.map((p) => (
                        <Link to={`/profile/${p.uid}`} key={p.uid} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="flex items-center gap-md mb-md">
                                <div className="avatar avatar-lg">
                                    {p.profilePhoto ? (
                                        <img src={p.profilePhoto} alt={p.fullName} />
                                    ) : (
                                        getInitials(p.fullName)
                                    )}
                                </div>
                                <div>
                                    <div className="font-semibold flex items-center gap-xs">
                                        {p.fullName}
                                        {p.verifiedBadge && <span style={{ color: 'var(--brand-primary-light)' }}>✓</span>}
                                    </div>
                                    <div className="flex items-center gap-xs mt-sm">
                                        {getRoleBadge(p.role)}
                                        {p.departmentCode && <span className="text-xs text-muted">{p.departmentCode}</span>}
                                    </div>
                                </div>
                            </div>
                            {(p.skills || []).length > 0 && (
                                <div className="flex flex-wrap gap-xs">
                                    {p.skills!.slice(0, 4).map((skill, i) => (
                                        <span key={i} className="tag">{skill}</span>
                                    ))}
                                    {p.skills!.length > 4 && (
                                        <span className="text-xs text-muted">+{p.skills!.length - 4} more</span>
                                    )}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Profiles;
