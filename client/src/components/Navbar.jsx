import React, { useState } from 'react';
import { User, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);

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
        window.location.href = '/';
    };

    const getDisplayName = () => {
        if (profile?.username) return profile.username;
        if (profile?.first_name) return `${profile.first_name} ${profile.last_name || ''}`;
        if (user?.user_metadata?.username) return user.user_metadata.username;
        return user?.email?.split('@')[0] || 'User';
    };

    // Reusable Dropdown Item
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

    return (
        <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 transition-all duration-300">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                    <img
                        src="https://sac.ku.ac.th/wp-content/uploads/2022/11/cropped-SPKU_WEBLOGO_PNG-1.png"
                        alt="KU Sport Logo"
                        className="h-12 md:h-14 w-auto object-contain hover:opacity-90 transition-opacity"
                    />
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-8 text-sm font-medium items-center text-gray-600">
                    <button onClick={() => navigate('/')} className="hover:text-green-700 transition-colors duration-200 py-2 border-b-2 border-transparent hover:border-green-600">หน้าแรก</button>
                    <a href="#" className="hover:text-green-700 transition-colors duration-200 py-2 border-b-2 border-transparent hover:border-green-600">ระเบียบการ</a>

                    <NavDropdown
                        title="สนามกีฬา"
                        items={[
                            { label: "สนามกีฬากลาง", link: "#" },
                            { label: "สนามฟุตซอล", link: "/booking" },
                            { label: "สนามแฮนด์บอล", link: "/booking" },
                            { label: "สนามซอฟท์บอล", link: "/booking" },
                            { label: "สนามรักบี้", link: "/booking" },
                            { label: "สนามวอลเล่บอลชายหาด", link: "/booking" },
                            { label: "สระว่ายน้ำ", link: "/booking" },
                            { label: "สนามเทนนิส", link: "/booking" },
                            { label: "สนามแบตมินตัน", link: "/booking" },
                        ]}
                    />

                    <NavDropdown
                        title="บุคลากร"
                        items={[
                            { label: "งานกีฬา", link: "#" },
                            { label: "งานท่องเที่ยว และวัฒนธรรม", link: "#" },
                        ]}
                    />

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

                {/* Auth Area */}
                <div>
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 pl-4 rounded-full transition-all border border-gray-200 text-sm group"
                            >
                                <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                    {getDisplayName().charAt(0)}
                                </div>
                                <span className="font-medium max-w-[100px] truncate text-gray-700 group-hover:text-green-700 transition-colors">{getDisplayName()}</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
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
                                            onClick={() => navigate('/profile')}
                                        >
                                            <User size={16} className="mr-3 text-green-600/70" />
                                            <span>ข้อมูลส่วนตัว</span>
                                        </button>

                                        <button
                                            className="w-full text-left px-3 py-2 hover:bg-green-50 rounded-lg text-sm flex items-center transition-colors text-gray-700"
                                            onClick={() => navigate('/my-booking')}
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
                            className="flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 px-5 py-2 rounded-full transition-all shadow-md shadow-green-600/20 font-medium text-sm hover:shadow-lg"
                        >
                            <User size={16} />
                            <span>เข้าสู่ระบบ</span>
                        </button>
                    )}
                </div>
            </div>
        </nav >
    );
};

export default Navbar;
