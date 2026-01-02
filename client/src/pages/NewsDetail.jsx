import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, ArrowLeft, ArrowRight, User, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../lib/api';

const NewsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentNews, setCurrentNews] = useState(null);
    const [prevNews, setPrevNews] = useState(null);
    const [nextNews, setNextNews] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await api.get('/news'); // Fetch all news using the new api instance
                const allNews = res.data;
                setNewsList(allNews);

                // Find current index
                const currentIndex = allNews.findIndex(n => n.id === parseInt(id));

                if (currentIndex !== -1) {
                    setCurrentNews(allNews[currentIndex]);

                    if (currentIndex > 0) {
                        setPrevNews(allNews[currentIndex - 1]);
                    } else {
                        setPrevNews(null);
                    }

                    if (currentIndex < allNews.length - 1) {
                        setNextNews(allNews[currentIndex + 1]);
                    } else {
                        setNextNews(null);
                    }
                } else {
                    // Not found
                    setCurrentNews(null);
                }
            } catch (error) {
                console.error("Failed to fetch news", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!currentNews) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบข่าวที่คุณต้องการ</h2>
                <Link to="/" className="text-green-600 hover:text-green-700 font-medium">กลับสู่หน้าหลัก</Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back Link */}
                <Link to="/" className="inline-flex items-center text-gray-500 hover:text-green-600 mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    กลับสู่หน้าหลัก
                </Link>

                <article className="mb-8">
                    {/* Header: Title & Meta */}
                    <header className="mb-6">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2 justify-center">
                            <span>{new Date(currentNews.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>


                        <div className="w-90 h-1 bg-green-500 mx-auto my-4 rounded-full opacity-60"></div>

                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight text-center">
                            {currentNews.title}
                        </h1>
                    </header>

                    {/* Featured Image */}
                    {currentNews.image_url && (
                        <div className="w-full relative bg-gray-50 mb-8 border border-gray-100">
                            {/* Blurred Background */}
                            <div
                                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20"
                                style={{ backgroundImage: `url(${currentNews.image_url})` }}
                            />
                            <img
                                src={currentNews.image_url}
                                alt={currentNews.title}
                                className="relative w-full h-auto max-h-[600px] object-contain mx-auto z-10"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="">
                        <div
                            className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-green-600 prose-img:rounded-none prose-img:cursor-zoom-in"
                            dangerouslySetInnerHTML={{ __html: currentNews.content }}
                            onClick={(e) => {
                                if (e.target.tagName === 'IMG') {
                                    setPreviewImage(e.target.src);
                                }
                            }}
                        />
                    </div>
                    <div className="w-90 h-1 bg-green-500 mx-auto my-4 rounded-full opacity-60"></div>
                </article>

                {/* Lightbox */}
                {previewImage && (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setPreviewImage(null)}
                    >
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg animate-in zoom-in-50 duration-300"
                        />
                        <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Previous (Newer) */}
                    <div>
                        {prevNews && (
                            <Link
                                to={`/news/${prevNews.id}`}
                                className="group block h-full bg-white border border-gray-200 p-6 rounded-xl hover:border-green-400 hover:shadow-md transition-all text-left"
                            >
                                <div className="flex items-center text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                                    <ArrowLeft size={12} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                                    ข่าวก่อนหน้า
                                </div>
                                <h4 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors line-clamp-2">{prevNews.title}</h4>
                            </Link>
                        )}
                    </div>

                    {/* Next (Older) */}
                    <div>
                        {nextNews && (
                            <Link
                                to={`/news/${nextNews.id}`}
                                className="group block h-full bg-white border border-gray-200 p-6 rounded-xl hover:border-green-400 hover:shadow-md transition-all text-right"
                            >
                                <div className="flex items-center justify-end text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                                    ข่าวถัดไป
                                    <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <h4 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors line-clamp-2">{nextNews.title}</h4>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default NewsDetail;
