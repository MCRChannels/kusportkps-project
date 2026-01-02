import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api from '../../lib/api';
import { Newspaper, Trash2, Pencil, X, Search, Filter } from 'lucide-react'; // Added Pencil, X, Search, Filter
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { supabase } from '../../lib/supabase'; // Adjust path as needed
import { compressImage } from '../../utils/imageCompression';

const NewsManagement = () => {
    const [news, setNews] = useState([]);
    const [formData, setFormData] = useState({ title: '', content: '', image_url: '' });
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const quillRef = useRef(null);

    // Custom Image Handler for Quill
    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                try {
                    // Compress
                    const compressedBlob = await compressImage(file, 800, 0.7);
                    const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

                    // Upload
                    const fileName = `content-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
                    const { data, error } = await supabase.storage
                        .from('images')
                        .upload(fileName, compressedFile);

                    if (error) throw error;

                    // Get URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('images')
                        .getPublicUrl(fileName);

                    // Insert to editor
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection();
                    quill.insertEmbed(range.index, 'image', publicUrl);
                } catch (error) {
                    console.error('Image upload failed:', error);
                    alert('แทรกรูปภาพไม่สำเร็จ: ' + error.message);
                }
            }
        };
    }, []);

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), [imageHandler]);

    const fetchNews = async () => {
        try {
            const res = await api.get('/news');
            setNews(res.data);
        } catch (error) {
            console.error("Failed to fetch news", error);
        }
    };

    useEffect(() => { fetchNews(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('ยืนยันว่าจะลบข่าวนี้? การกระทำนี้ไม่สามารถเรียกคืนได้')) return;
        try {
            await api.delete(`/news/${id}`);
            alert('ลบข่าวสำเร็จ');
            fetchNews();
            if (editingId === id) handleCancelEdit();
        } catch (error) {
            console.error(error);
            alert('ลบข่าวไม่สำเร็จ');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // Compress
            const compressedBlob = await compressImage(file, 800, 0.7);
            const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

            // Upload
            const fileName = `news-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
            const { data, error } = await supabase.storage
                .from('images') // Ensure 'images' bucket exists and is public
                .upload(fileName, compressedFile);

            if (error) throw error;

            // Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('อัปโหลดรูปภาพไม่สำเร็จ: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update existing news
                await api.put(`/news/${editingId}`, formData);
                alert('แก้ไขข่าวสารสำเร็จ');
            } else {
                // Create new news
                await api.post('/news', formData);
                alert('เพิ่มข่าวสารสำเร็จ');
            }

            // Reset form
            setFormData({ title: '', content: '', image_url: '' });
            setEditingId(null);
            fetchNews();
        } catch (error) {
            alert(error.response?.data?.message || (editingId ? 'แก้ไขข่าวสารไม่สำเร็จ: ' : 'เพิ่มข่าวสารไม่สำเร็จ: ') + error.message);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            title: item.title,
            content: item.content,
            image_url: item.image_url || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ title: '', content: '', image_url: '' });
    };

    // Strip HTML for the list preview
    const stripHtml = (html) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

    const filteredAndSortedNews = news
        .filter(item => {
            const query = searchQuery.toLowerCase();
            const contentText = stripHtml(item.content).toLowerCase();
            return (
                item.title.toLowerCase().includes(query) ||
                contentText.includes(query)
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Newspaper className="mr-2 text-green-600" />
                จัดการข่าวประชาสัมพันธ์
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`font-bold text-lg ${editingId ? 'text-amber-600' : 'text-green-700'}`}>
                            {editingId ? 'แก้ไขข่าว' : 'เพิ่มข่าวใหม่'}
                        </h3>
                        {editingId && (
                            <button
                                onClick={handleCancelEdit}
                                className="text-gray-500 hover:text-gray-700 text-sm flex items-center bg-gray-100 px-3 py-1 rounded-full transition"
                            >
                                <X size={14} className="mr-1" /> ยกเลิกการแก้ไข
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อข่าว</label>
                            <input
                                required
                                type="text"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="หัวข้อข่าวประชาสัมพันธ์"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพปก (อัปโหลด)</label>
                            <div className="flex flex-col gap-3">
                                {formData.image_url && (
                                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={formData.image_url} alt="Cover" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, image_url: '' })}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 transition"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-green-50 file:text-green-700
                                            hover:file:bg-green-100
                                            cursor-pointer border rounded-lg p-1
                                        "
                                        disabled={uploading}
                                    />
                                    {uploading && <div className="text-sm text-gray-500 animate-pulse">กำลังอัปโหลด...</div>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหาข่าว</label>
                            <div className="h-64 mb-12">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                    className="h-full"
                                    modules={modules}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`w-full text-white py-3 rounded-lg font-bold shadow-md transition-transform active:scale-95 mt-8 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {editingId ? 'บันทึกการแก้ไข' : 'โพสต์ข่าวประชาสัมพันธ์'}
                        </button>
                    </form>
                </div>

                {/* List Preview */}
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="sticky top-0 bg-gray-50 pb-2 z-10 space-y-3">
                        <h3 className="font-bold text-lg text-gray-700">รายการข่าวทั้งหมด</h3>

                        {/* Premium Search and Filter Controls */}
                        <div className="flex flex-col gap-3 p-1">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="ค้นหาข่าวประชาสัมพันธ์..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Filter className="h-4 w-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                                </div>
                                <select
                                    className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none bg-white appearance-none cursor-pointer hover:bg-gray-50 transition-all font-medium text-gray-600"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                >
                                    <option value="newest">วันที่ล่าสุด</option>
                                    <option value="oldest">วันที่เก่าสุด</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {filteredAndSortedNews.map((item) => (
                        <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border flex gap-4 hover:shadow-md transition ${editingId === item.id ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-100'}`}>
                            <div className="w-24 h-24 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                                <img src={item.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 line-clamp-1 text-lg">{item.title}</h4>
                                {/* Show striped plain text for preview */}
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{stripHtml(item.content)}</p>
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{new Date(item.created_at).toLocaleDateString('th-TH')}</span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-amber-500 text-xs hover:bg-amber-50 px-2 py-1 rounded-md transition flex items-center"
                                        >
                                            <Pencil size={14} className="mr-1" /> แก้ไข
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-500 text-xs hover:bg-red-50 px-2 py-1 rounded-md transition flex items-center"
                                        >
                                            <Trash2 size={14} className="mr-1" /> ลบ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredAndSortedNews.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            {searchQuery ? 'ไม่พบข่าวที่ค้นหา' : 'ยังไม่มีข่าวประชาสัมพันธ์'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsManagement;
