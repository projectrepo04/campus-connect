import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Profiles from './pages/Profiles';
import Notices from './pages/Notices';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes (no layout wrapper) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Routes with layout (navbar + sidebar) */}
                    <Route element={<Layout />}>
                        <Route path="/" element={<Navigate to="/login" replace />} />

                        {/* Feed — accessible to all authenticated users */}
                        <Route
                            path="/feed"
                            element={
                                <ProtectedRoute>
                                    <Feed />
                                </ProtectedRoute>
                            }
                        />

                        {/* Profile */}
                        <Route
                            path="/profile/:userId"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile/:userId/edit"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />

                        {/* People Directory */}
                        <Route
                            path="/profiles"
                            element={
                                <ProtectedRoute>
                                    <Profiles />
                                </ProtectedRoute>
                            }
                        />

                        {/* Notices */}
                        <Route
                            path="/notices"
                            element={
                                <ProtectedRoute>
                                    <Notices />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/notices/create"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'faculty']}>
                                    <Notices />
                                </ProtectedRoute>
                            }
                        />

                        {/* Notifications */}
                        <Route
                            path="/notifications"
                            element={
                                <ProtectedRoute>
                                    <Notifications />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin — restricted to admin role */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Admin />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/users"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Admin />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* 404 Catch-all */}
                    <Route
                        path="*"
                        element={
                            <div className="auth-container">
                                <div className="empty-state">
                                    <div className="empty-state-icon">🔍</div>
                                    <h2>Page Not Found</h2>
                                    <p className="text-muted">The page you're looking for doesn't exist.</p>
                                    <a href="/" className="btn btn-primary mt-md">Go Home</a>
                                </div>
                            </div>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
