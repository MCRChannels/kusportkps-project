import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileWarning = () => {
    const { profile, loading } = useAuth();
    const navigate = useNavigate();

    // Don't show if loading or no profile (guest)
    if (loading || !profile) return null;

    // Check for missing fields
    const isProfileIncomplete = !profile.first_name || !profile.last_name || !profile.phone;

    if (!isProfileIncomplete) return null;

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="flex items-center text-amber-800">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>
                        <span className="font-bold">แจ้งเตือน:</span> กรุณากรอกข้อมูลโปรไฟล์ให้ครบถ้วน (ชื่อ, นามสกุล, เบอร์โทร) เพื่อสิทธิประโยชน์ในการใช้งาน
                    </span>
                </div>
                <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-1.5 rounded-full transition shadow-sm whitespace-nowrap"
                >
                    ไปตั้งค่าโปรไฟล์ <ArrowRight size={14} className="ml-1" />
                </button>
            </div>
        </div>
    );
};

export default ProfileWarning;
