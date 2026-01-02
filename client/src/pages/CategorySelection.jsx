import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CategorySelection = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data);
            } catch (error) {
                console.error("Error fetching categories", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-prompt">
            <Navbar />
            <div className="container mx-auto px-4 py-12 flex-grow">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">เลือกประเภทกีฬา</h1>
                    <p className="text-gray-500">กรุณาเลือกประเภทกีฬาที่ต้องการจองสนาม</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                onClick={() => navigate(`/booking/schedule?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`)}
                                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 group overflow-hidden w-full sm:w-[calc(50%-12px)] md:w-[calc(33.33%-16px)] lg:w-[calc(25%-18px)] max-w-sm"
                            >
                                <div className="h-48 overflow-hidden bg-gray-100">
                                    {cat.image_url ? (
                                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <LayoutDashboard size={48} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 text-center">
                                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-green-600 transition-colors">{cat.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description || "ไม่มีรายละเอียด"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default CategorySelection;
