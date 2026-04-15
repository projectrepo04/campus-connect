import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
    const { user } = useAuth();

    return (
        <div style={{ marginTop: 'calc(-1 * var(--nav-height))' }}>
            {/* Hero Section */}
            <section className="landing-hero">
                <div className="animate-in">
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 'var(--radius-xl)',
                            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: 'white',
                            margin: '0 auto var(--space-xl)',
                            boxShadow: 'var(--shadow-glow-lg)',
                        }}
                    >
                        CC
                    </div>
                    <h1 className="landing-title">
                        Campus Connect
                    </h1>
                    <p className="landing-subtitle" style={{ marginTop: 'var(--space-lg)' }}>
                        Your college's all-in-one social platform. Connect with students, faculty, and alumni.
                        Share ideas, stay updated with notices, and build your professional profile.
                    </p>
                </div>

                <div className="landing-actions animate-in">
                    {user ? (
                        <Link to="/feed" className="btn btn-primary btn-lg">
                            Go to Feed →
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-primary btn-lg" id="cta-register">
                                Get Started
                            </Link>
                            <Link to="/login" className="btn btn-secondary btn-lg" id="cta-login">
                                Sign In
                            </Link>
                            <Link to="/feed" className="btn btn-ghost btn-lg" id="cta-guest">
                                Browse as Guest
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="landing-features">
                <div className="card feature-card">
                    <div className="feature-icon">📰</div>
                    <h3>Social Feed</h3>
                    <p className="text-secondary">
                        Share posts, ideas, and projects. Like, comment, and connect with your campus community.
                    </p>
                </div>

                <div className="card feature-card">
                    <div className="feature-icon">📋</div>
                    <h3>Notice Board</h3>
                    <p className="text-secondary">
                        Stay updated with exams, placements, events, and important announcements from faculty and admin.
                    </p>
                </div>

                <div className="card feature-card">
                    <div className="feature-icon">👤</div>
                    <h3>Profile Showcase</h3>
                    <p className="text-secondary">
                        Build your professional profile with skills, certifications, and project showcases.
                    </p>
                </div>

                <div className="card feature-card">
                    <div className="feature-icon">🔔</div>
                    <h3>Real-time Alerts</h3>
                    <p className="text-secondary">
                        Get instant notifications for new notices, comments, and important campus updates.
                    </p>
                </div>

                <div className="card feature-card">
                    <div className="feature-icon">🎓</div>
                    <h3>Role-based Access</h3>
                    <p className="text-secondary">
                        Dedicated dashboards for students, faculty, alumni, and administrators.
                    </p>
                </div>

                <div className="card feature-card">
                    <div className="feature-icon">🌐</div>
                    <h3>Guest Access</h3>
                    <p className="text-secondary">
                        Visitors can browse public profiles and posts without registration.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer
                style={{
                    textAlign: 'center',
                    padding: 'var(--space-2xl)',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                    borderTop: '1px solid var(--border-color)',
                }}
            >
                <p>© 2026 Campus Connect. Built for the college community.</p>
            </footer>
        </div>
    );
};

export default Landing;
