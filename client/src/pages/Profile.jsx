import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, Save, Loader2, Shield, CreditCard, Camera, CircuitBoard } from 'lucide-react';

const Profile = () => {
    const { user, profile, fetchProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form States
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        student_id: '',
        phone: ''
    });

    const [securityData, setSecurityData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                student_id: profile.student_id || '',
                phone: profile.phone || ''
            });
        }
        if (user) {
            setSecurityData(prev => ({ ...prev, email: user.email }));
        }
    }, [profile, user]);

    // Validation Helpers
    const validateNumeric = (value) => {
        return value.replace(/[^0-9]/g, '');
    };

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validate lengths
        if (formData.student_id && formData.student_id.length !== 10) {
            setMessage({ type: 'error', text: 'รหัสนิสิตต้องมี 10 หลัก' });
            setLoading(false);
            return;
        }
        if (formData.phone && formData.phone.length !== 10) {
            setMessage({ type: 'error', text: 'เบอร์โทรศัพท์ต้องมี 10 หลัก' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    student_id: formData.student_id,
                    phone: formData.phone
                })
                .eq('id', user.id);

            if (error) throw error;

            await fetchProfile(); // Refresh context
            setMessage({ type: 'success', text: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSecuritySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (securityData.password && securityData.password !== securityData.confirmPassword) {
            setMessage({ type: 'error', text: 'รหัสผ่านไม่ตรงกัน' });
            setLoading(false);
            return;
        }

        try {
            const updates = {};
            if (securityData.email !== user.email) updates.email = securityData.email;
            if (securityData.password) updates.password = securityData.password;

            if (Object.keys(updates).length === 0) {
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            setMessage({ type: 'success', text: 'อัปเดตข้อมูลความปลอดภัยเรียบร้อยแล้ว (หากเปลี่ยนอีเมล กรุณายืนยันในกล่องตรวจสอบ)' });
            setSecurityData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error) {
            console.error('Error updating security:', error);
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 font-prompt flex flex-col">
            <Navbar />

            {/* Header Background */}
            <div className="bg-gradient-to-r from-green-800 to-green-600 h-64 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="container mx-auto px-4 h-full flex items-center relative z-10">
                    <div className="text-white ml-0 md:ml-8 mt-[-40px]">
                        <h1 className="text-4xl font-bold mb-2">ข้อมูลส่วนตัว</h1>
                        <p className="text-green-100 opacity-90">จัดการข้อมูลบัญชีและการตั้งค่าความปลอดภัยของคุณ</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-24 pb-12 flex-grow relative z-20">
                <div className="max-w-5xl mx-auto">

                    {message.text && (
                        <div className={`p-4 rounded-xl mb-6 shadow-lg transform transition-all animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            <div className="flex items-center">
                                {message.type === 'success' ? <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div> : <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>}
                                {message.text}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar / User Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
                                <div className="h-32 bg-green-50 relative">
                                    <div className="absolute inset-0 opacity-10 pattern-dots"></div>
                                </div>
                                <div className="px-6 pb-6 relative">
                                    <div className="w-32 h-32 mx-auto -mt-16 bg-white p-1.5 rounded-full shadow-lg relative z-10">
                                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-50 rounded-full flex items-center justify-center text-5xl font-bold text-green-600 border border-green-100">
                                            {profile?.first_name ? profile.first_name.charAt(0) : (profile?.username?.charAt(0) || 'U')}
                                        </div>
                                    </div>

                                    <div className="mt-20 text-center">
                                        <h2 className="text-2xl font-bold text-gray-800 break-words">
                                            {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : (profile?.username || 'User')}
                                        </h2>
                                        <p className="text-sm text-gray-500 mb-4 font-medium">{user?.email}</p>

                                        <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-green-50 text-green-700 border border-green-100">
                                            {profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : (profile?.role === 'staff' ? 'เจ้าหน้าที่' : 'สมาชิกทั่วไป')}
                                        </div>

                                        <div className="mt-8 border-t border-gray-100 pt-6 text-left space-y-3">
                                            <div className="flex items-center justify-between text-sm text-gray-600">
                                                <span>เข้าร่วมเมื่อ</span>
                                                <span className="font-medium">{new Date(user?.created_at).toLocaleDateString('th-TH')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Forms */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Personal Info Form */}
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                    <User size={120} />
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-b border-gray-100 pb-4 relative z-10">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 text-green-600">
                                        <User size={20} />
                                    </div>
                                    ข้อมูลทั่วไป
                                </h3>

                                <form onSubmit={handleInfoSubmit} className="space-y-6 relative z-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 block">ชื่อจริง</label>
                                            <input
                                                type="text"
                                                value={formData.first_name}
                                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                placeholder="สมชาย"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 block">นามสกุล</label>
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                placeholder="ใจดี"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 block">รหัสนิสิต <span className="text-xs font-normal text-gray-400 ml-1">(เฉพาะตัวเลข 10 หลัก)</span></label>
                                            <input
                                                type="text"
                                                maxLength={10}
                                                value={formData.student_id}
                                                onChange={e => setFormData({ ...formData, student_id: validateNumeric(e.target.value) })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white font-mono tracking-wide"
                                                placeholder="XXXXXXXXX"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 block">เบอร์โทรศัพท์ <span className="text-xs font-normal text-gray-400 ml-1">(เฉพาะตัวเลข 10 หลัก)</span></label>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: validateNumeric(e.target.value) })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white font-mono tracking-wide"
                                                placeholder="0812345678"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 active:bg-green-800 transition-all font-bold shadow-lg shadow-green-600/20 flex items-center disabled:opacity-50 disabled:shadow-none transform hover:-translate-y-0.5"
                                        >
                                            {loading ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                                            บันทึกการเปลี่ยนแปลง
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Security Form */}
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                    <Shield size={120} />
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-b border-gray-100 pb-4 relative z-10">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-blue-600">
                                        <Shield size={20} />
                                    </div>
                                    ความปลอดภัย
                                </h3>

                                <form onSubmit={handleSecuritySubmit} className="space-y-6 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 block">อีเมล</label>
                                        <div className="relative group">
                                            <Mail size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="email"
                                                value={securityData.email}
                                                onChange={e => setSecurityData({ ...securityData, email: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 block">รหัสผ่านใหม่</label>
                                            <div className="relative group">
                                                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="password"
                                                    value={securityData.password}
                                                    onChange={e => setSecurityData({ ...securityData, password: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                    placeholder="กรอกเพื่อเปลี่ยนรหัสผ่าน"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 block">ยืนยันรหัสผ่านใหม่</label>
                                            <div className="relative group">
                                                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="password"
                                                    value={securityData.confirmPassword}
                                                    onChange={e => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                                    placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all font-bold shadow-lg shadow-blue-600/20 flex items-center disabled:opacity-50 disabled:shadow-none transform hover:-translate-y-0.5"
                                        >
                                            {loading ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                                            อัปเดตความปลอดภัย
                                        </button>
                                    </div>
                                </form>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Profile;
