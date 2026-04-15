import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const Profile: React.FC = () => {
    const { userId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Edit state
    const [editForm, setEditForm] = useState<any>({});
    const [newSkill, setNewSkill] = useState('');
    const [newProject, setNewProject] = useState({ title: '', description: '', techStack: '', link: '' });
    const [newCert, setNewCert] = useState({ title: '', organization: '', date: '', certificateUrl: '' });

    const isOwnProfile = !userId || user?.uid === userId;

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const parseJsonField = (val: any, fallback: any[] = []) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return fallback; }
        }
        return fallback;
    };

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/profile/${userId}`);
            const p = data.user;
            p.skills = parseJsonField(p.skills);
            p.certifications = parseJsonField(p.certifications);
            p.projects = parseJsonField(p.projects);
            setProfile(p);
            setEditForm({
                fullName: p.fullName,
                designation: p.designation || '',
                profileVisibility: p.profileVisibility || 'campus-only',
            });
        } catch (err: any) {
            setError(err.message || 'Failed to load profile.');
        }
        setLoading(false);
    };

    const handleUpdateProfile = async () => {
        try {
            await api.put('/profile', editForm);
            setEditing(false);
            fetchProfile();
        } catch (err: any) {
            alert(err.message || 'Failed to update profile.');
        }
    };

    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;
        const updatedSkills = [...(profile.skills || []), newSkill.trim()];
        try {
            await api.put('/profile/skills', { skills: updatedSkills });
            setProfile({ ...profile, skills: updatedSkills });
            setNewSkill('');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleRemoveSkill = async (skillToRemove: string) => {
        const updatedSkills = (profile.skills || []).filter((s: string) => s !== skillToRemove);
        try {
            await api.put('/profile/skills', { skills: updatedSkills });
            setProfile({ ...profile, skills: updatedSkills });
        } catch { /* ignore */ }
    };

    const handleAddProject = async () => {
        if (!newProject.title || !newProject.description) return;
        try {
            const data = await api.post('/profile/projects', {
                ...newProject,
                techStack: newProject.techStack.split(',').map((t) => t.trim()).filter(Boolean),
            });
            setProfile({
                ...profile,
                projects: [...(profile.projects || []), data.project],
            });
            setNewProject({ title: '', description: '', techStack: '', link: '' });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleRemoveProject = async (projectId: string) => {
        try {
            await api.delete(`/profile/projects/${projectId}`);
            setProfile({
                ...profile,
                projects: (profile.projects || []).filter((p: any) => p.id !== projectId),
            });
        } catch { /* ignore */ }
    };

    const handleAddCert = async () => {
        if (!newCert.title || !newCert.organization || !newCert.date) return;
        try {
            const data = await api.post('/profile/certifications', newCert);
            setProfile({
                ...profile,
                certifications: [...(profile.certifications || []), data.certification],
            });
            setNewCert({ title: '', organization: '', date: '', certificateUrl: '' });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg" />
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">😕</div>
                <h3>Profile Unavailable</h3>
                <p className="text-muted">{error || 'This profile could not be loaded.'}</p>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="animate-in">
            {/* Banner */}
            <div className="profile-banner" />

            {/* Profile Info */}
            <div className="profile-info-section">
                <div className="profile-avatar-wrapper">
                    {profile.profilePhoto ? (
                        <img src={profile.profilePhoto} alt={profile.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        getInitials(profile.fullName)
                    )}
                </div>
                <div style={{ flex: 1, paddingBottom: 'var(--space-md)' }}>
                    <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{profile.fullName}</h1>
                        {profile.verifiedBadge && (
                            <span className="badge badge-verified">✓ Verified</span>
                        )}
                        <span className="badge badge-primary">{profile.role}</span>
                        {profile.profileVisibility === 'public' && (
                            <span className="badge badge-info">🌐 Public</span>
                        )}
                    </div>
                    <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
                        {profile.email}
                        {profile.designation && ` · ${profile.designation}`}
                        {profile.semester && ` · Semester ${profile.semester}`}
                        {profile.passingYear && ` · Class of ${profile.passingYear}`}
                        {profile.departmentCode && ` · ${profile.departmentCode}`}
                    </p>
                    {isOwnProfile && (
                        <div className="mt-sm">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setEditing(!editing)}
                            >
                                {editing ? 'Cancel' : '✏️ Edit Profile'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="card-flat mb-lg animate-fade">
                    <h3 className="mb-md">Edit Profile</h3>
                    <div className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                className="form-input"
                                value={editForm.fullName}
                                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Profile Visibility</label>
                            <select
                                className="form-select"
                                value={editForm.profileVisibility}
                                onChange={(e) => setEditForm({ ...editForm, profileVisibility: e.target.value })}
                            >
                                <option value="public">🌐 Public</option>
                                <option value="campus-only">🔒 Campus Only</option>
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={handleUpdateProfile}>
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs mb-lg">
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    Overview
                </button>
                <button className={`tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
                    Projects ({(profile.projects || []).length})
                </button>
                <button className={`tab ${activeTab === 'certifications' ? 'active' : ''}`} onClick={() => setActiveTab('certifications')}>
                    Certifications ({(profile.certifications || []).length})
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    {/* Skills */}
                    <div className="card-flat mb-lg">
                        <h3 className="mb-md">Skills</h3>
                        <div className="flex flex-wrap gap-sm">
                            {(profile.skills || []).map((skill: string, i: number) => (
                                <span key={i} className="tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {skill}
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => handleRemoveSkill(skill)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '10px' }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </span>
                            ))}
                            {(profile.skills || []).length === 0 && (
                                <p className="text-muted text-sm">No skills added yet.</p>
                            )}
                        </div>
                        {isOwnProfile && (
                            <div className="flex gap-sm mt-md">
                                <input
                                    className="form-input"
                                    placeholder="Add a skill..."
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                                    style={{ maxWidth: '250px' }}
                                />
                                <button className="btn btn-secondary btn-sm" onClick={handleAddSkill}>
                                    Add
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Info Card */}
                    <div className="card-flat">
                        <h3 className="mb-md">About</h3>
                        <div className="grid grid-2 gap-md">
                            <div>
                                <span className="text-xs text-muted">Role</span>
                                <p className="font-medium">{profile.role}</p>
                            </div>
                            <div>
                                <span className="text-xs text-muted">Email</span>
                                <p className="font-medium">{profile.email}</p>
                            </div>
                            {profile.rollNumber && (
                                <div>
                                    <span className="text-xs text-muted">Roll Number</span>
                                    <p className="font-medium">{profile.rollNumber}</p>
                                </div>
                            )}
                            {profile.semester && (
                                <div>
                                    <span className="text-xs text-muted">Semester</span>
                                    <p className="font-medium">{profile.semester}</p>
                                </div>
                            )}
                            {profile.passingYear && (
                                <div>
                                    <span className="text-xs text-muted">Passing Year</span>
                                    <p className="font-medium">{profile.passingYear}</p>
                                </div>
                            )}
                            {profile.designation && (
                                <div>
                                    <span className="text-xs text-muted">Designation</span>
                                    <p className="font-medium">{profile.designation}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-xs text-muted">Joined</span>
                                <p className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div>
                    <div className="grid grid-2 gap-md">
                        {(profile.projects || []).map((proj: any) => (
                            <div key={proj.id} className="project-card">
                                <div className="flex justify-between items-start">
                                    <h4>{proj.title}</h4>
                                    {isOwnProfile && (
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleRemoveProject(proj.id)}
                                            style={{ color: 'var(--brand-error)' }}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-secondary mt-sm">{proj.description}</p>
                                <div className="flex flex-wrap gap-xs mt-sm">
                                    {(proj.techStack || []).map((tech: string, i: number) => (
                                        <span key={i} className="tag">{tech}</span>
                                    ))}
                                </div>
                                {proj.link && (
                                    <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-sm mt-sm" style={{ display: 'block' }}>
                                        🔗 {proj.link}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>

                    {(profile.projects || []).length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">🚀</div>
                            <h3>No projects yet</h3>
                            <p className="text-muted">Add your projects to showcase your work!</p>
                        </div>
                    )}

                    {isOwnProfile && (
                        <div className="card-flat mt-lg">
                            <h4 className="mb-md">Add New Project</h4>
                            <div className="auth-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Title</label>
                                        <input className="form-input" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Link</label>
                                        <input className="form-input" value={newProject.link} onChange={(e) => setNewProject({ ...newProject, link: e.target.value })} placeholder="GitHub or demo URL" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} style={{ minHeight: '60px' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tech Stack (comma-separated)</label>
                                    <input className="form-input" value={newProject.techStack} onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })} placeholder="React, Node.js, MongoDB" />
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={handleAddProject}>Add Project</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Certifications Tab */}
            {activeTab === 'certifications' && (
                <div>
                    <div className="flex flex-col gap-md">
                        {(profile.certifications || []).map((cert: any) => (
                            <div key={cert.id} className="card-flat flex items-center gap-md">
                                <div style={{ fontSize: '2rem' }}>📜</div>
                                <div style={{ flex: 1 }}>
                                    <h4>{cert.title}</h4>
                                    <p className="text-sm text-muted">{cert.organization} · {cert.date}</p>
                                    {cert.certificateUrl && (
                                        <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-sm">
                                            View Certificate →
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {(profile.certifications || []).length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">📜</div>
                            <h3>No certifications yet</h3>
                            <p className="text-muted">Add your certifications and achievements!</p>
                        </div>
                    )}

                    {isOwnProfile && (
                        <div className="card-flat mt-lg">
                            <h4 className="mb-md">Add Certification</h4>
                            <div className="auth-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Title</label>
                                        <input className="form-input" value={newCert.title} onChange={(e) => setNewCert({ ...newCert, title: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Organization</label>
                                        <input className="form-input" value={newCert.organization} onChange={(e) => setNewCert({ ...newCert, organization: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input className="form-input" type="date" value={newCert.date} onChange={(e) => setNewCert({ ...newCert, date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Certificate URL</label>
                                        <input className="form-input" value={newCert.certificateUrl} onChange={(e) => setNewCert({ ...newCert, certificateUrl: e.target.value })} placeholder="Optional" />
                                    </div>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={handleAddCert}>Add Certification</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Profile;
