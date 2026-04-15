import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    mediaUrls?: string;
    externalLink?: string;
    department?: string;
    semester?: number;
    visibility: string;
    isAnnouncement: boolean;
    isRepost: boolean;
    originalAuthorName?: string;
    likes: string[];
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    createdAt: string;
}

interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    content: string;
    createdAt: string;
}

const Feed: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [newPost, setNewPost] = useState('');
    const [postVisibility, setPostVisibility] = useState('campus-only');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [posting, setPosting] = useState(false);
    const [expandedComments, setExpandedComments] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [commentText, setCommentText] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);
    const [deptFilter, setDeptFilter] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canAnnounce = user?.role === 'faculty' || user?.role === 'admin';

    useEffect(() => {
        fetchPosts();
        fetchDepartments();
    }, [filter, deptFilter]);

    const fetchDepartments = async () => {
        try {
            const data = await api.get('/departments');
            setDepartments(data.departments || []);
        } catch { }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            let url = '/posts?limit=30';
            if (filter === 'announcements') url += '&announcements=true';
            if (deptFilter) url += `&department=${deptFilter}`;
            const data = await api.get(url);
            setPosts(data.posts || []);
        } catch { }
        setLoading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 5) { alert('Maximum 5 files allowed'); return; }
        setMediaFiles(files);
        const previews = files.map(f => ({
            url: URL.createObjectURL(f),
            type: f.type.startsWith('video/') ? 'video' : 'image',
        }));
        setMediaPreview(previews);
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreview(prev => prev.filter((_, i) => i !== index));
    };

    const uploadMedia = async (): Promise<string[]> => {
        if (mediaFiles.length === 0) return [];
        const urls: string[] = [];
        for (const file of mediaFiles) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
                const data = await res.json();
                if (data.url) urls.push(data.url);
            } catch { }
        }
        return urls;
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() && mediaFiles.length === 0) return;
        setPosting(true);
        try {
            const mediaUrls = await uploadMedia();
            const imageUrls = mediaUrls.filter(u => !u.match(/\.(mp4|webm|mov)$/i));
            const videoUrls = mediaUrls.filter(u => u.match(/\.(mp4|webm|mov)$/i));
            await api.post('/posts', {
                content: newPost,
                visibility: postVisibility,
                isAnnouncement: canAnnounce ? isAnnouncement : false,
                imageUrl: imageUrls[0] || null,
                videoUrl: videoUrls[0] || null,
                mediaUrls: mediaUrls.length > 1 ? mediaUrls : null,
            });
            setNewPost('');
            setIsAnnouncement(false);
            setMediaFiles([]);
            setMediaPreview([]);
            fetchPosts();
        } catch (err: any) {
            alert(err.message || 'Failed to create post.');
        }
        setPosting(false);
    };

    const handleLike = async (postId: string) => {
        try {
            const data = await api.post(`/posts/${postId}/like`);
            setPosts(prev =>
                prev.map(p =>
                    p.id === postId
                        ? {
                            ...p,
                            likesCount: data.likesCount || p.likesCount + (data.liked ? 1 : -1),
                            likes: data.liked
                                ? [...p.likes, user?.uid || '']
                                : p.likes.filter(id => id !== user?.uid),
                        }
                        : p
                )
            );
        } catch { }
    };

    const handleShare = async (postId: string) => {
        try {
            await api.post(`/posts/${postId}/share`);
            fetchPosts();
        } catch (err: any) {
            alert(err.message || 'Failed to share post.');
        }
    };

    const toggleComments = async (postId: string) => {
        if (expandedComments === postId) { setExpandedComments(null); return; }
        setExpandedComments(postId);
        try {
            const data = await api.get(`/posts/${postId}/comments`);
            setComments(prev => ({ ...prev, [postId]: data.comments || [] }));
        } catch { }
    };

    const handleComment = async (postId: string) => {
        if (!commentText.trim()) return;
        try {
            const data = await api.post(`/posts/${postId}/comments`, { content: commentText });
            setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment] }));
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
            setCommentText('');
        } catch { }
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        return `${days}d`;
    };

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const getRoleColor = (role: string) => {
        const m: Record<string, string> = { admin: '#ef4444', faculty: '#6366f1', alumni: '#06b6d4', student: '#10b981', guest: '#64748b' };
        return m[role] || '#64748b';
    };

    const renderMedia = (post: Post) => {
        const media: { type: string; url: string }[] = [];
        if (post.imageUrl) media.push({ type: 'image', url: post.imageUrl });
        if (post.videoUrl) media.push({ type: 'video', url: post.videoUrl });
        if (post.mediaUrls) {
            try {
                const urls = JSON.parse(post.mediaUrls);
                urls.forEach((url: string) => {
                    media.push({ type: url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image', url });
                });
            } catch { }
        }
        if (media.length === 0) return null;

        return (
            <div className="feed-media-grid" data-count={Math.min(media.length, 4)}>
                {media.slice(0, 4).map((m, i) =>
                    m.type === 'video' ? (
                        <video key={i} src={m.url} controls className="feed-media-item" />
                    ) : (
                        <img key={i} src={m.url} alt="" className="feed-media-item" onClick={() => window.open(m.url, '_blank')} />
                    )
                )}
                {media.length > 4 && (
                    <div className="feed-media-more">+{media.length - 4}</div>
                )}
            </div>
        );
    };

    return (
        <div className="feed-container">
            <div className="page-header">
                <h1>📰 Feed</h1>
                <p>Stay connected with your campus community</p>
            </div>

            {user && user.isCampusMember && (
                <div className="feed-composer">
                    <form onSubmit={handleCreatePost}>
                        <div className="feed-composer-top">
                            <div className="avatar">{getInitials(user.fullName)}</div>
                            <textarea
                                className="feed-composer-input"
                                placeholder="What's on your mind?"
                                value={newPost}
                                onChange={e => setNewPost(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {mediaPreview.length > 0 && (
                            <div className="feed-composer-previews">
                                {mediaPreview.map((m, i) => (
                                    <div key={i} className="feed-preview-item">
                                        {m.type === 'video' ? (
                                            <video src={m.url} className="feed-preview-media" />
                                        ) : (
                                            <img src={m.url} alt="" className="feed-preview-media" />
                                        )}
                                        <button type="button" className="feed-preview-remove" onClick={() => removeMedia(i)}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="feed-composer-actions">
                            <div className="feed-composer-left">
                                <button type="button" className="feed-action-btn" onClick={() => fileInputRef.current?.click()}>
                                    📷 Media
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <select className="feed-select" value={postVisibility} onChange={e => setPostVisibility(e.target.value)}>
                                    <option value="campus-only">🔒 Campus Only</option>
                                    <option value="public">🌐 Public</option>
                                </select>
                                {canAnnounce && (
                                    <label className="feed-announcement-toggle">
                                        <input type="checkbox" checked={isAnnouncement} onChange={e => setIsAnnouncement(e.target.checked)} />
                                        <span>📢 Announcement</span>
                                    </label>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={posting || (!newPost.trim() && mediaFiles.length === 0)}>
                                {posting ? <><div className="spinner spinner-sm" /> Posting...</> : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="feed-filters">
                <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Posts</button>
                <button className={`filter-chip ${filter === 'announcements' ? 'active' : ''}`} onClick={() => setFilter('announcements')}>📢 Announcements</button>
                <select className="feed-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="loading-container"><div className="spinner spinner-lg" /><p>Loading posts...</p></div>
            ) : posts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3>No posts yet</h3>
                    <p className="text-muted">Be the first to share something!</p>
                </div>
            ) : (
                <div className="feed-posts">
                    {posts.map(post => (
                        <div key={post.id} className={`feed-post${post.isAnnouncement ? ' feed-post-announcement' : ''}`}>
                            {post.isRepost && (
                                <div className="feed-repost-badge">🔄 {post.authorName} shared</div>
                            )}
                            <div className="feed-post-header">
                                <div className="avatar">{getInitials(post.authorName)}</div>
                                <div className="feed-post-meta">
                                    <div className="feed-post-author">
                                        <span className="feed-author-name">{post.authorName}</span>
                                        <span className="feed-role-badge" style={{ background: getRoleColor(post.authorRole) }}>{post.authorRole}</span>
                                        {post.isAnnouncement && <span className="feed-announcement-badge">📢 Announcement</span>}
                                    </div>
                                    <div className="feed-post-time">
                                        <span>{getTimeAgo(post.createdAt)}</span>
                                        <span>·</span>
                                        <span>{post.visibility === 'public' ? '🌐' : '🔒'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="feed-post-content">{post.content}</div>

                            {renderMedia(post)}

                            {post.externalLink && (
                                <a href={post.externalLink} target="_blank" rel="noopener noreferrer" className="feed-link-preview">
                                    🔗 {post.externalLink}
                                </a>
                            )}

                            {user && (
                                <div className="feed-post-interactions">
                                    {user.isCampusMember ? (
                                        <>
                                            <button className={`feed-interact-btn${post.likes.includes(user.uid) ? ' liked' : ''}`} onClick={() => handleLike(post.id)}>
                                                {post.likes.includes(user.uid) ? '❤️' : '🤍'} {post.likesCount}
                                            </button>
                                            <button className="feed-interact-btn" onClick={() => toggleComments(post.id)}>
                                                💬 {post.commentsCount}
                                            </button>
                                            <button className="feed-interact-btn" onClick={() => handleShare(post.id)}>
                                                🔄 {post.sharesCount}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="feed-interact-btn disabled">🤍 {post.likesCount}</span>
                                            <button className="feed-interact-btn" onClick={() => toggleComments(post.id)}>💬 {post.commentsCount}</button>
                                            <span className="feed-interact-btn disabled">🔄 {post.sharesCount}</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {expandedComments === post.id && (
                                <div className="feed-comments">
                                    {(comments[post.id] || []).map(c => (
                                        <div key={c.id} className="feed-comment">
                                            <div className="avatar avatar-sm">{getInitials(c.authorName)}</div>
                                            <div className="feed-comment-body">
                                                <div className="feed-comment-header">
                                                    <span className="feed-author-name">{c.authorName}</span>
                                                    <span className="feed-role-badge" style={{ background: getRoleColor(c.authorRole) }}>{c.authorRole}</span>
                                                </div>
                                                <p className="feed-comment-text">{c.content}</p>
                                                <span className="feed-comment-time">{getTimeAgo(c.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {user?.isCampusMember ? (
                                        <div className="feed-comment-form">
                                            <input
                                                type="text"
                                                className="feed-comment-input"
                                                placeholder="Write a comment..."
                                                value={commentText}
                                                onChange={e => setCommentText(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                                            />
                                            <button className="btn btn-primary btn-sm" onClick={() => handleComment(post.id)} disabled={!commentText.trim()}>
                                                Send
                                            </button>
                                        </div>
                                    ) : user && (
                                        <p className="feed-comment-locked">🔒 Commenting reserved for campus members</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Feed;
