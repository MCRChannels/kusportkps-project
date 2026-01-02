import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';
import { Save, Upload, Building, CreditCard, QrCode, X, Settings } from 'lucide-react';

const GeneralSettings = () => {
    const [settings, setSettings] = useState({
        payment_qr_url: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
        hero_banners: '[]' // JSON string in DB
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data) {
                setSettings(res.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleFileUpload = async (e, type = 'qr') => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${type}-${Date.now()}.${fileExt}`;
            const filePath = `settings/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('images').getPublicUrl(filePath);

            if (type === 'qr') {
                setSettings(prev => ({ ...prev, payment_qr_url: data.publicUrl }));
            } else if (type === 'banner') {
                let currentBanners = [];
                try {
                    currentBanners = settings.hero_banners ? JSON.parse(settings.hero_banners) : [];
                } catch (e) {
                    currentBanners = [];
                }
                const newBanners = [...currentBanners, data.publicUrl];
                setSettings(prev => ({ ...prev, hero_banners: JSON.stringify(newBanners) }));
            }

            setUploading(false);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Upload failed: ' + error.message);
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await api.put('/settings', settings);
            setMessage({ type: 'success', text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + (error.response?.data?.error || error.message) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Settings className="mr-2 text-green-600" />
                ตั้งค่าทั่วไป
            </h1>

            {message && (
                <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bank Details */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Building size={20} /> ข้อมูลบัญชีธนาคาร
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อธนาคาร</label>
                            <input
                                type="text"
                                name="bank_name"
                                value={settings.bank_name || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                placeholder="เช่น SCB, KBank"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี</label>
                            <input
                                type="text"
                                name="bank_account_name"
                                value={settings.bank_account_name || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่บัญชี</label>
                            <input
                                type="text"
                                name="bank_account_number"
                                value={settings.bank_account_number || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 h-fit">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <QrCode size={20} /> QR Code สำหรับรับชำระเงิน
                    </h2>

                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 mb-3">
                        {settings.payment_qr_url ? (
                            <img src={settings.payment_qr_url} alt="Payment QR" className="max-h-48 object-contain mb-3" />
                        ) : (
                            <div className="text-gray-400 mb-3 flex flex-col items-center">
                                <QrCode size={40} className="mb-2" />
                                <span className="text-sm">ยังไม่มี QR Code</span>
                            </div>
                        )}

                        <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded shadow-sm flex items-center gap-2 transition-colors text-sm">
                            <Upload size={14} />
                            {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'qr')} disabled={uploading} />
                        </label>
                    </div>
                </div>

                {/* Hero Banners */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 md:col-span-2">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Upload size={20} /> แบนเนอร์หน้าแรก (Hero Banners)
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        {(() => {
                            let banners = [];
                            try {
                                banners = settings.hero_banners ? JSON.parse(settings.hero_banners) : [];
                            } catch (e) {
                                banners = [];
                            }
                            return banners.map((url, index) => (
                                <div key={index} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    <img src={url} alt={`Banner ${index}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => {
                                            const newBanners = banners.filter((_, i) => i !== index);
                                            setSettings({ ...settings, hero_banners: JSON.stringify(newBanners) });
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ));
                        })()}

                        <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-3 hover:bg-gray-50 transition-colors aspect-video">
                            <Upload size={20} className="text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500 font-medium">{uploading ? 'กำลัง...' : 'เพิ่มรูปภาพ'}</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'banner')}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    <p className="text-xs text-gray-400">* รองรับรูปภาพไม่จำกัดจำนวน (แนะนำขนาด 1920x600px)</p>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded shadow-lg font-bold flex items-center gap-2 transition-colors transform active:scale-95"
                >
                    <Save size={18} />
                    บันทึกการตั้งค่า
                </button>
            </div>
        </div>
    );
};

export default GeneralSettings;
