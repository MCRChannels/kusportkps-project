import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    LayoutDashboard,
    CalendarDays,
    Newspaper,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const DashboardLayout = () => {
    const { user, profile, signOut, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate('/login');
            return;
        }

        if (profile) {
            if (profile.role === 'admin' || profile.role === 'staff') {
                setRole(profile.role);
                setLoading(false);
            } else {
                navigate('/'); // Not authorized
            }
        } else {
            // Profile pending or failed? Wait a bit or redirect?
            // If authLoading is false but profile is null, it means no profile found.
            // But we have cached profile now, so it should be there.
        }
    }, [user, profile, navigate, authLoading]);

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const navItems = [
        { name: 'จัดการผู้ใช้งาน', path: '/dashboard/users', icon: Users, roles: ['admin'] },
        { name: 'จัดการสนาม', path: '/dashboard/courts', icon: LayoutDashboard, roles: ['admin'] },
        { name: 'การจอง', path: '/dashboard/bookings', icon: CalendarDays, roles: ['admin', 'staff'] },
        { name: 'ข่าวประชาสัมพันธ์', path: '/dashboard/news', icon: Newspaper, roles: ['admin', 'staff'] },
        { name: 'ตั้งค่าทั่วไป', path: '/dashboard/settings', icon: Settings, roles: ['admin', 'staff'] },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`bg-white shadow-xl z-20 w-64 fixed h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <img
                            src="https://sac.ku.ac.th/wp-content/uploads/2022/11/cropped-SPKU_WEBLOGO_PNG-1.png"
                            alt="KU Sport Logo"
                            className="h-20 w-auto object-contain mb-2"
                        />
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{role} Panel</p>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500">
                        <X size={24} />
                    </button>
                </div>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        if (!item.roles.includes(role)) return null;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-green-50 text-green-700 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
                    <button
                        onClick={() => { signOut(); navigate('/'); }}
                        className="flex items-center space-x-3 text-red-600 hover:bg-red-50 w-full px-4 py-3 rounded-lg transition"
                    >
                        <LogOut size={20} />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 overflow-auto transition-all duration-300 md:ml-64`}>
                <header className="bg-white shadow-sm p-4 sticky top-0 z-10 md:hidden flex items-center">
                    <button onClick={() => setSidebarOpen(true)} className="mr-4 text-gray-600">
                        <Menu size={24} />
                    </button>
                    <span className="font-semibold text-gray-700">Dashboard</span>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
