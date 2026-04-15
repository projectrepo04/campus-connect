import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResetPassword: React.FC = () => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card card">
                <div className="auth-header">
                    <h1>Reset Password</h1>
                    <p className="text-muted">
                        Enter your email and we'll send you a password reset link.
                    </p>
                </div>

                {error && <div className="alert alert-error mb-md">⚠️ {error}</div>}

                {success ? (
                    <div className="alert alert-success">
                        ✅ If an account exists with this email, a reset link has been sent. Check your inbox.
                        <br />
                        <Link
                            to="/login"
                            style={{ color: 'inherit', textDecoration: 'underline', marginTop: '8px', display: 'inline-block' }}
                        >
                            Back to Login →
                        </Link>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reset-email">Email</label>
                            <input
                                id="reset-email"
                                className="form-input"
                                type="email"
                                placeholder="you@college.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                            {loading ? (
                                <><div className="spinner spinner-sm" /> Sending...</>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
