import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Added axios
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';

const MyBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMyBookings();

            // Realtime Subscription
            const channel = supabase
                .channel(`realtime:my_bookings:${user.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` }, (payload) => {
                    console.log('My Booking Update:', payload);
                    fetchMyBookings();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const fetchMyBookings = async () => {
        try {
            // Fetch bookings for logged in user, join with courts
            const { data, error } = await supabase
                .from('bookings')
                .select('*, courts(*)')
                .eq('user_id', user.id)
                .order('booking_date', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error("Error fetching my bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!confirm('ยืนยันที่จะยกเลิกการจองนี้?')) return;

        try {
            await api.put(`/booking/${bookingId}/status`, { status: 'cancelled' }); // Changed axios.put to api.put
            alert('ยกเลิกการจองสำเร็จ');
            // Realtime will handle refresh, but we can also optimistic update or just fetch
            fetchMyBookings();
        } catch (error) {
            console.error('Cancel error:', error);
            alert('เกิดข้อผิดพลาดในการยกเลิก');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed':
            case 'paid': // Added 'paid' mapping
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">อนุมัติแล้ว</span>;
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">รอตรวจสอบ</span>;
            case 'cancelled':
                return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">ยกเลิกแล้ว</span>;
            default:
                return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-prompt">
            <Navbar />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <Calendar className="mr-2 text-green-600" />
                        ประวัติการจองของฉัน
                    </h1>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-gray-400">กำลังโหลด...</div>
                        ) : bookings.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                                <AlertCircle size={48} className="mb-4 text-gray-300" />
                                <p className="text-lg">คุณยังไม่มีประวัติการจอง</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-lg text-gray-900">{booking.courts?.name}</h3>
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Calendar size={16} className="mr-1 text-gray-400" />
                                                        {new Date(booking.booking_date).toLocaleDateString('th-TH', {
                                                            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
                                                        })}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Clock size={16} className="mr-1 text-gray-400" />
                                                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                                    </div>
                                                    {booking.courts?.location && (
                                                        <div className="flex items-center">
                                                            <MapPin size={16} className="mr-1 text-gray-400" />
                                                            {booking.courts.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cancel Button for Pending bookings */}
                                            {booking.status === 'pending' && (
                                                <button
                                                    onClick={() => handleCancel(booking.id)}
                                                    className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    ยกเลิกการจอง
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MyBookings;
