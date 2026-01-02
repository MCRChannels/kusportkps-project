import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ChevronRight, Calendar } from 'lucide-react';

import { supabase } from '../lib/supabase';

const NewsSection = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNews = async () => {
        try {
            const res = await api.get('/news');
            if (res.data && res.data.length > 0) {
                setNews(res.data);
            } else {
                setNews([]);
            }
        } catch (error) {
            console.log("News fetch error, using fallback Mock data locally if needed");
            setNews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();

        // Realtime Subscription
        const channel = supabase
            .channel('public:news')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, (payload) => {
                console.log('Realtime message received:', payload);
                fetchNews();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Strip HTML for card preview
    const stripHtml = (html) => {
        if (!html) return "";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    return (
        <div className="w-full">
            {loading ? (
                <div className="h-40 flex items-center justify-center text-gray-400 bg-gray-50 rounded border border-gray-100">Loading news...</div>
            ) : (
                <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-hide snap-x">
                    {news.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white border border-gray-200 rounded overflow-hidden hover:shadow-md transition-shadow duration-300 group cursor-pointer flex flex-col flex-shrink-0 w-80 snap-start"
                            onClick={() => navigate(`/news/${item.id}`)}
                        >
                            <div className="h-48 overflow-hidden bg-gray-100 relative shrink-0">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                        <Newspaper size={32} className="text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex-grow flex flex-col">
                                <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(item.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <h3 className="font-bold text-base text-gray-800 mb-2 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-grow">
                                    {stripHtml(item.content)}
                                </p>
                                <span className="text-green-700 text-sm font-medium mt-auto flex items-center">
                                    อ่านเพิ่มเติม <ChevronRight size={16} className="ml-1" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsSection;
