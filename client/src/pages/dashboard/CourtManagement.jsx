
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { LayoutDashboard, Plus, Trash2, Edit2, X } from 'lucide-react';

const CourtManagement = () => {
    // View State
    const [viewMode, setViewMode] = useState('categories'); // 'categories' | 'courts'
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Data State
    const [courts, setCourts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [closings, setClosings] = useState([]); // New state for closings
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false); // New modal

    // Editing State
    const [editingCourt, setEditingCourt] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    // Forms
    const [courtFormData, setCourtFormData] = useState({
        name: '', description: '', price: '', image_url: '', ticket_available: true, category_id: ''
    });
    const [categoryFormData, setCategoryFormData] = useState({
        name: '', description: '', image_url: '', is_active: true,
        open_time: '08:00', close_time: '21:00' // Default hours
    });
    const [closingFormData, setClosingFormData] = useState({
        closing_date: '', start_time: '08:00', end_time: '21:00', reason: ''
    });

    // Time Options Generator (24h)
    const timeOptions = [];
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        timeOptions.push(`${hour}:00`);
        timeOptions.push(`${hour}:30`);
    }
    // Also add end of day if needed, but 23:30 is usually last start slot.
    // Let's stick to 30 min intervals, or maybe just hours as requested "make it simple 24h"
    // User asked "Make it 24 hours better", usually implies 00:00 - 23:00.
    // Let's do hourly to be safe and simple, or 30 mins if granular. Hourly is safer for "simple".
    const simpleTimeOptions = [];
    for (let i = 0; i <= 23; i++) {
        simpleTimeOptions.push(`${i.toString().padStart(2, '0')}:00`);
    }

    const fetchData = async () => {
        try {
            const [courtsRes, catsRes] = await Promise.all([
                api.get('/court'),
                api.get('/categories')
            ]);
            setCourts(courtsRes.data);
            setCategories(catsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClosings = async (catId) => {
        try {
            const res = await api.get(`/categories/${catId}/closings`);
            setClosings(res.data);
        } catch (error) {
            console.error("Error fetching closings", error);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Category Logic ---
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, categoryFormData);
                alert('แก้ไขหมวดหมู่สำเร็จ');
            } else {
                await api.post('/categories', categoryFormData);
                alert('เพิ่มหมวดหมู่สำเร็จ');
            }
            fetchData();
            setIsCategoryModalOpen(false);
        } catch (error) {
            alert('บันทึกหมวดหมู่ไม่สำเร็จ');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('ยืนยันการลบหมวดหมู่? (อาจส่งผลต่อสนามภายใน)')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchData();
        } catch (error) {
            alert('ลบไม่สำเร็จ');
        }
    };

    const openCategoryModal = (cat = null) => {
        if (cat) {
            setEditingCategory(cat);
            setCategoryFormData({
                ...cat,
                open_time: cat.open_time ? cat.open_time.slice(0, 5) : '08:00', // Ensure HH:MM format
                close_time: cat.close_time ? cat.close_time.slice(0, 5) : '21:00'
            });
        } else {
            setEditingCategory(null);
            setCategoryFormData({ name: '', description: '', image_url: '', is_active: true, open_time: '08:00', close_time: '21:00' });
        }
        setIsCategoryModalOpen(true);
    };

    // --- Closing Logic ---
    const openClosingModal = async (cat) => {
        setSelectedCategory(cat);
        await fetchClosings(cat.id);
        setClosingFormData({ closing_date: '', start_time: cat.open_time ? cat.open_time.slice(0, 5) : '08:00', end_time: cat.close_time ? cat.close_time.slice(0, 5) : '21:00', reason: '' });
        setIsClosingModalOpen(true);
    };

    const handleClosingSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/categories/${selectedCategory.id}/closings`, closingFormData);
            fetchClosings(selectedCategory.id); // Refresh list
            setClosingFormData({ ...closingFormData, reason: '', closing_date: '' }); // Reset form but keep times
        } catch (error) {
            alert('เพิ่มช่วงเวลาปิดไม่สำเร็จ');
        }
    };

    const handleDeleteClosing = async (id) => {
        if (!confirm("ลบช่วงเวลาปิดนี้?")) return;
        try {
            await api.delete(`/categories/closings/${id}`);
            fetchClosings(selectedCategory.id);
        } catch (error) {
            alert('ลบไม่สำเร็จ');
        }
    };

    const handleManageCourts = (cat) => {
        setSelectedCategory(cat);
        setViewMode('courts');
    };

    // --- Court Logic ---
    const handleCourtSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...courtFormData,
                category_id: selectedCategory.id // Force category to current
            };

            if (editingCourt) {
                await api.put(`/court/${editingCourt.id}`, payload);
                alert('แก้ไขสนามสำเร็จ');
            } else {
                await api.post('/court', payload);
                alert('เพิ่มสนามสำเร็จ');
            }
            fetchData();
            setIsCourtModalOpen(false);
        } catch (error) {
            alert('บันทึกสนามไม่สำเร็จ');
        }
    };

    const handleDeleteCourt = async (id) => {
        if (!confirm('ยืนยันการลบสนาม?')) return;
        try {
            await api.delete(`/court/${id}`);
            setCourts(courts.filter(c => c.id !== id)); // Optimistic update
        } catch (error) {
            alert('ลบไม่สำเร็จ');
        }
    };

    const openCourtModal = (court = null) => {
        if (court) {
            setEditingCourt(court);
            setCourtFormData({
                ...court,
                category_id: selectedCategory ? selectedCategory.id : (court.category_id || ''),
                ticket_available: court.is_active !== undefined ? court.is_active : (court.ticket_available !== undefined ? court.ticket_available : true)
            });
        } else {
            setEditingCourt(null);
            setCourtFormData({
                name: '', description: '', price: '', image_url: '',
                ticket_available: true,
                category_id: selectedCategory ? selectedCategory.id : ''
            });
        }
        setIsCourtModalOpen(true);
    };

    // Filter courts for the selected category
    const filteredCourts = selectedCategory
        ? courts.filter(c => c.category_id == selectedCategory.id || (c.sport_categories && c.sport_categories.id == selectedCategory.id))
        : [];

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Header Area */}
            {viewMode === 'categories' && (
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <LayoutDashboard className="mr-2 text-green-600" />
                        จัดการหมวดหมู่และสนาม
                    </h2>
                    <button onClick={() => openCategoryModal()} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                        <Plus size={18} className="mr-2" /> เพิ่มหมวดหมู่
                    </button>
                </div>
            )}

            {viewMode === 'courts' && (
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setViewMode('categories')} className="text-gray-500 hover:text-gray-700 flex items-center">
                            <span className="text-2xl mr-2">←</span>
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                {selectedCategory?.name}
                            </h2>
                            <p className="text-sm text-gray-500">จัดการสนามในหมวดหมู่นี้</p>
                        </div>
                    </div>
                    <button onClick={() => openCourtModal()} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                        <Plus size={18} className="mr-2" /> เพิ่มสนาม
                    </button>
                </div>
            )}

            {/* Content Area */}
            {viewMode === 'categories' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมวดหมู่</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">สนามทั้งหมด</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map((cat) => {
                                const courtCount = courts.filter(c => c.category_id == cat.id || (c.sport_categories && c.sport_categories.id == cat.id)).length;
                                return (
                                    <tr key={cat.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <img src={cat.image_url || 'https://via.placeholder.com/40'} alt="" className="h-10 w-10 rounded-full object-cover bg-gray-100" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cat.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{cat.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{courtCount} สนาม</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleManageCourts(cat)}
                                                className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 mr-2 border border-blue-200"
                                            >
                                                จัดการสนาม
                                            </button>
                                            <button
                                                onClick={() => openClosingModal(cat)}
                                                className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-100 mr-4 border border-red-200"
                                            >
                                                วันปิด/เวลา
                                            </button>
                                            <button onClick={() => openCategoryModal(cat)} className="text-gray-400 hover:text-blue-600 mr-2"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {viewMode === 'courts' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {filteredCourts.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            ยังไม่มีสนามในหมวดหมู่นี้
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รูปภาพ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อสนาม</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคา</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCourts.map((court) => (
                                    <tr key={court.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <img src={court.image_url || 'https://via.placeholder.com/40'} alt={court.name} className="h-10 w-10 rounded-full object-cover" />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{court.name}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{court.price} บาท/ชม.</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(court.is_active || court.ticket_available) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                {(court.is_active || court.ticket_available) ? "เปิดให้บริการ" : "ปิดปรับปรุง"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openCourtModal(court)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeleteCourt(court.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
                        <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        <h3 className="text-xl font-bold mb-4">{editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</h3>
                        <form onSubmit={handleCategorySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่</label>
                                <input required type="text" className="w-full border rounded-lg px-3 py-2" value={categoryFormData.name} onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเปิด</label>
                                    <select className="w-full border rounded-lg px-3 py-2" value={categoryFormData.open_time} onChange={e => setCategoryFormData({ ...categoryFormData, open_time: e.target.value })}>
                                        {simpleTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาปิด</label>
                                    <select className="w-full border rounded-lg px-3 py-2" value={categoryFormData.close_time} onChange={e => setCategoryFormData({ ...categoryFormData, close_time: e.target.value })}>
                                        {simpleTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                                <textarea className="w-full border rounded-lg px-3 py-2" rows="3" value={categoryFormData.description} onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL รูปภาพ</label>
                                <input type="text" className="w-full border rounded-lg px-3 py-2" value={categoryFormData.image_url} onChange={e => setCategoryFormData({ ...categoryFormData, image_url: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold mt-4">บันทึก</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Closing Modal */}
            {isClosingModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsClosingModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        <h3 className="text-xl font-bold mb-4">จัดการเวลาปิด: {selectedCategory?.name}</h3>

                        {/* List Existing Closings */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">รายการปิดพิเศษ</h4>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                                {closings.length === 0 ? <p className="text-xs text-gray-400 text-center">ไม่มีรายการปิดพิเศษ</p> :
                                    closings.map(c => (
                                        <div key={c.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm text-sm">
                                            <div>
                                                <div className="font-bold text-gray-800">{c.closing_date}</div>
                                                <div className="text-gray-500 text-xs">{c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)} {c.reason ? `(${c.reason})` : ''}</div>
                                            </div>
                                            <button onClick={() => handleDeleteClosing(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Add New Closing */}
                        <form onSubmit={handleClosingSubmit} className="space-y-3 border-t pt-4">
                            <h4 className="font-semibold text-gray-700 text-sm">เพิ่มช่วงเวลาปิด</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ปิด</label>
                                <input required type="date" className="w-full border rounded-lg px-3 py-2" value={closingFormData.closing_date} onChange={e => setClosingFormData({ ...closingFormData, closing_date: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่ม</label>
                                    <select className="w-full border rounded-lg px-3 py-2" value={closingFormData.start_time} onChange={e => setClosingFormData({ ...closingFormData, start_time: e.target.value })}>
                                        {simpleTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด</label>
                                    <select className="w-full border rounded-lg px-3 py-2" value={closingFormData.end_time} onChange={e => setClosingFormData({ ...closingFormData, end_time: e.target.value })}>
                                        {simpleTimeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผล</label>
                                <input type="text" placeholder="เช่น ปรับปรุงสนาม" className="w-full border rounded-lg px-3 py-2" value={closingFormData.reason} onChange={e => setClosingFormData({ ...closingFormData, reason: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold mt-2">เพิ่มช่วงเวลาปิด</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Court Modal */}
            {isCourtModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 relative">
                        <button onClick={() => setIsCourtModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        <h3 className="text-xl font-bold mb-4">{editingCourt ? 'แก้ไขสนาม' : `เพิ่มสนาม (${selectedCategory?.name})`}</h3>
                        <form onSubmit={handleCourtSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสนาม</label>
                                <input required type="text" className="w-full border rounded-lg px-3 py-2" value={courtFormData.name} onChange={e => setCourtFormData({ ...courtFormData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท/ชม.)</label>
                                    <input required type="number" className="w-full border rounded-lg px-3 py-2" value={courtFormData.price} onChange={e => setCourtFormData({ ...courtFormData, price: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                                <textarea className="w-full border rounded-lg px-3 py-2" rows="3" value={courtFormData.description} onChange={e => setCourtFormData({ ...courtFormData, description: e.target.value })}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL รูปภาพ</label>
                                <input type="text" className="w-full border rounded-lg px-3 py-2" value={courtFormData.image_url} onChange={e => setCourtFormData({ ...courtFormData, image_url: e.target.value })} />
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="active" className="h-4 w-4 text-green-600 rounded" checked={courtFormData.ticket_available} onChange={e => setCourtFormData({ ...courtFormData, ticket_available: e.target.checked })} />
                                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">เปิดให้บริการ</label>
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold mt-4">บันทึก</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourtManagement;
