import React, { useState } from 'react';
import { User, LogOut, ChevronDown, LayoutDashboard, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await Promise.race([
                signOut(),
                new Promise(resolve => setTimeout(resolve, 500))
            ]);
        } catch (e) {
            console.error("Logout warning:", e);
        }
        setDropdownOpen(false);
        setMobileMenuOpen(false);
        window.location.href = '/';
    };

    const getDisplayName = () => {
        if (profile?.username) return profile.username;
        if (profile?.first_name) return `${profile.first_name} ${profile.last_name || ''}`;
        if (user?.user_metadata?.username) return user.user_metadata.username;
        return user?.email?.split('@')[0] || 'User';
    };

    // Reusable Dropdown Item for Desktop
    const NavDropdown = ({ title, items }) => (
        <div className="relative group h-full flex items-center">
            <button className="flex items-center gap-1 hover:text-green-700 transition-colors duration-200 py-2 border-b-2 border-transparent hover:border-green-600 focus:outline-none">
                {title} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
            </button>
            <div className="absolute top-full left-0 mt-0 w-64 bg-white rounded-lg shadow-xl py-2 invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 border border-gray-100 origin-top-left z-50">
                {items.map((item, idx) => (
                    <a
                        key={idx}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (item.link) navigate(item.link);
                        }}
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition flex items-center"
                    >
                        {item.label}
                    </a>
                ))}
            </div>
        </div>
    );

    // Mobile Menu Item
    const MobileNavItem = ({ label, link, items }) => {
        const [expanded, setExpanded] = useState(false);

        if (items) {
            return (
                <div className="border-b border-gray-100 last:border-0">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex justify-between items-center py-3 px-4 text-gray-700 font-medium"
                    >
                        {label}
                        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded && (
                        <div className="bg-gray-50 px-4 py-2 space-y-2">
                            {items.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (item.link) {
                                            navigate(item.link);
                                            setMobileMenuOpen(false);
                                        }
                                    }}
                                    className="block py-2 text-sm text-gray-600 hover:text-green-700 cursor-pointer"
                                >
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div
                onClick={() => {
                    navigate(link);
                    setMobileMenuOpen(false);
                }}
                className="block py-3 px-4 text-gray-700 font-medium border-b border-gray-100 last:border-0 hover:bg-green-50 hover:text-green-700 transition cursor-pointer"
            >
                {label}
            </div>
        );
    };

    const sportsItems = [
        { label: "สนามกีฬากลาง", link: "#" },
        { label: "สนามฟุตซอล", link: "/booking" },
        { label: "สนามแฮนด์บอล", link: "/booking" },
        { label: "สนามซอฟท์บอล", link: "/booking" },
        { label: "สนามรักบี้", link: "/booking" },
        { label: "สนามวอลเล่บอลชายหาด", link: "/booking" },
        { label: "สระว่ายน้ำ", link: "/booking" },
        { label: "สนามเทนนิส", link: "/booking" },
        { label: "สนามแบตมินตัน", link: "/booking" },
    ];

    const staffItems = [
        { label: "งานกีฬา", link: "#" },
        { label: "งานท่องเที่ยว และวัฒนธรรม", link: "#" },
    ];

    return (
        <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 transition-all duration-300">
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                        <img
                            src="https://sac.ku.ac.th/wp-content/uploads/2022/11/cropped-SPKU_WEBLOGO_PNG-1.png"
                            alt="KU Sport Logo"
                            className="h-10 md:h-14 w-auto object-contain hover:opacity-90 transition-opacity"
                        />
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-8 text-sm font-medium items-center text-gray-600">
                        <button onClick={() => navigate('/')} className="hover:text-green-700 transition-colors duration-200 py-2 border-b-2 border-transparent hover:border-green-600">หน้าแรก</button>
                        <a href="#" className="hover:text-green-700 transition-colors duration-200 py-2 border-b-2 border-transparent hover:border-green-600">ระเบียบการ</a>

                        <NavDropdown title="สนามกีฬา" items={sportsItems} />
                        <NavDropdown title="บุคลากร" items={staffItems} />

                        <a href="#" className="hover:text-green-700 transition-colors duration-200 py-2 border-b-2 border-transparent hover:border-green-600">ติดต่อเรา</a>

                        <button onClick={() => navigate('/booking')} className="hover:text-green-700 transition-colors duration-200 py-2 border-b-2 border-transparent hover:border-green-600 font-bold text-green-700">
                            จองสนาม
                        </button>

                        {/* Admin Link */}
                        {user && (profile?.role === 'admin' || profile?.role === 'staff') && (
                            <button
                                onClick={() => navigate('/dashboard/users')}
                                className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-full text-xs font-semibold transition border border-green-200 flex items-center space-x-1"
                            >
                                <LayoutDashboard size={14} />
                                <span>ระบบหลังบ้าน</span>
                            </button>
                        )}
                    </div>

                    {/* Mobile & Auth Area */}
                    <div className="flex items-center gap-3">
                        {/* Auth Button (Visible on both) */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-2 md:px-3 py-1.5 pl-2 md:pl-4 rounded-full transition-all border border-gray-200 text-sm group"
                                >
                                    <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                                        {getDisplayName().charAt(0)}
                                    </div>
                                    <span className="font-medium max-w-[100px] truncate text-gray-700 group-hover:text-green-700 transition-colors hidden md:block">{getDisplayName()}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''} hidden md:block`} />
                                </button>

                                {/* User Menu Dropdown */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl py-2 text-gray-800 border border-gray-100 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                                            <p className="text-xs text-gray-500 mb-0.5">เข้าสู่ระบบโดย</p>
                                            <p className="font-bold truncate text-green-700">{getDisplayName()}</p>
                                        </div>
                                        <div className="p-1">
                                            <button
                                                className="w-full text-left px-3 py-2 hover:bg-green-50 rounded-lg text-sm flex items-center transition-colors text-gray-700"
                                                onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                                            >
                                                <User size={16} className="mr-3 text-green-600/70" />
                                                <span>ข้อมูลส่วนตัว</span>
                                            </button>

                                            <button
                                                className="w-full text-left px-3 py-2 hover:bg-green-50 rounded-lg text-sm flex items-center transition-colors text-gray-700"
                                                onClick={() => { navigate('/my-booking'); setDropdownOpen(false); }}
                                            >
                                                <LayoutDashboard size={16} className="mr-3 text-green-600/70" />
                                                <span>ข้อมูลการจอง</span>
                                            </button>

                                            {user && (profile?.role === 'admin' || profile?.role === 'staff') && (
                                                <button
                                                    className="w-full text-left px-3 py-2 hover:bg-green-50 rounded-lg text-sm flex items-center transition-colors text-green-700 font-medium"
                                                    onClick={() => navigate('/dashboard/courts')}
                                                >
                                                    <LayoutDashboard size={16} className="mr-3" />
                                                    <span>ระบบหลังบ้าน</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-100 mt-1 p-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-3 py-2 hover:bg-red-50 rounded-lg text-red-600 text-sm flex items-center transition-colors"
                                            >
                                                <LogOut size={16} className="mr-3" />
                                                <span>ออกจากระบบ</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-full transition-all shadow-md shadow-green-600/20 font-medium text-sm hover:shadow-lg"
                            >
                                <User size={16} />
                                <span className="hidden md:inline">เข้าสู่ระบบ</span>
                            </button>
                        )}

                        {/* Hamburger Button */}
                        <button
                            className="md:hidden p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-4 border-t border-gray-100 pt-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col space-y-1">
                            <MobileNavItem label="หน้าแรก" link="/" />
                            <MobileNavItem label="ระเบียบการ" link="#" />
                            <MobileNavItem label="สนามกีฬา" items={sportsItems} />
                            <MobileNavItem label="บุคลากร" items={staffItems} />
                            <MobileNavItem label="ติดต่อเรา" link="#" />
                            <MobileNavItem label="จองสนาม" link="/booking" />
                            {user && (profile?.role === 'admin' || profile?.role === 'staff') && (
                                <MobileNavItem label="ระบบหลังบ้าน" link="/dashboard/users" />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav >
    );
};

export default Navbar;
