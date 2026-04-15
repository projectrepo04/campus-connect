import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout: React.FC = () => {
    const { user } = useAuth();

    return (
        <>
            <Navbar />
            <div className="page-layout">
                {user && <Sidebar />}
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </>
    );
};

export default Layout;
