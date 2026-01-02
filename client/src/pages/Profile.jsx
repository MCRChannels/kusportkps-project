import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, Save, Loader2, Shield, CreditCard } from 'lucide-react';

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

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

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
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            <Navbar />

            <div className="container mx-auto px-4 py-10 flex-grow">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">ข้อมูลส่วนตัว</h1>
                    <p className="text-gray-500 mb-8">จัดการข้อมูลบัญชีและการตั้งค่าความปลอดภัยของคุณ</p>

                    {message.text && (
                        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Sidebar / User Card */}
                        <div className="md:col-span-1">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                                    {profile?.first_name ? profile.first_name.charAt(0) : (profile?.username?.charAt(0) || 'U')}
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 break-words">
                                    {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : (profile?.username || 'User')}
                                </h2>
                                <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    {profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : (profile?.role === 'staff' ? 'เจ้าหน้าที่' : 'สมาชิกทั่วไป')}
                                </div>
                            </div>
                        </div>

                        {/* Forms */}
                        <div className="md:col-span-2 space-y-8">

                            {/* Personal Info Form */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                    <User size={20} className="mr-2 text-green-600" />
                                    ข้อมูลทั่วไป
                                </h3>
                                <form onSubmit={handleInfoSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อจริง</label>
                                            <input
                                                type="text"
                                                value={formData.first_name}
                                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="ชื่อจริง"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="นามสกุล"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนิสิต (ถ้ามี)</label>
                                        <input
                                            type="text"
                                            value={formData.student_id}
                                            onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                            placeholder="XXXXXXXXXX"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                            placeholder="08X-XXX-XXXX"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium flex items-center disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                            บันทึกข้อมูล
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Security Form */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                    <Shield size={20} className="mr-2 text-blue-600" />
                                    ความปลอดภัย
                                </h3>
                                <form onSubmit={handleSecuritySubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="email"
                                                value={securityData.email}
                                                onChange={e => setSecurityData({ ...securityData, email: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                                            <div className="relative">
                                                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                                                <input
                                                    type="password"
                                                    value={securityData.password}
                                                    onChange={e => setSecurityData({ ...securityData, password: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                                    placeholder="กรอกเพื่อเปลี่ยน"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                                            <div className="relative">
                                                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                                                <input
                                                    type="password"
                                                    value={securityData.confirmPassword}
                                                    onChange={e => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                                    placeholder="ยืนยันรหัสผ่าน"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
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
