import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

import { supabase } from '../../lib/supabase';

const BookingSchedule = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, paid, cancelled, all
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBookings = async () => {
        try {
            const res = await api.get('/booking/all');
            setBookings(res.data);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();

        // Realtime Subscription
        const channel = supabase
            .channel('realtime:dashboard_bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
                console.log('Dashboard Realtime Booking Update:', payload);
                fetchBookings();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleUpdateStatus = async (id, status) => {
        if (!confirm(`ยืนยันการ${status === 'paid' ? 'อนุมัติ' : 'ยกเลิก'}การจอง?`)) return;
        try {
            await api.put(`/booking/${id}/status`, { status });
            fetchBookings(); // Refresh
        } catch (error) {
            console.error('Error updating status:', error);
            const msg = error.response?.data?.error || error.response?.data?.message || error.message;
            alert(`อัปเดตสถานะไม่สำเร็จ: ${msg}`);
        }
    };

    const filteredBookings = bookings.filter(b => {
        // Status Filter
        if (filter !== 'all' && b.status !== filter) return false;

        // Search Filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const userName = `${b.profiles?.first_name || ''} ${b.profiles?.last_name || ''}`.toLowerCase();
            const courtName = b.courts?.name?.toLowerCase() || '';
            const email = b.profiles?.email?.toLowerCase() || '';

            return userName.includes(searchLower) ||
                courtName.includes(searchLower) ||
                email.includes(searchLower) ||
                b.id.toString().includes(searchLower);
        }
        return true;
    });

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <CalendarDays className="mr-2 text-green-600" />
                จัดการการจอง
            </h2>

            {/* Tools Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
                {/* Filter Tabs */}
                <div className="flex space-x-2 overflow-x-auto">
                    {['pending', 'paid', 'cancelled', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${filter === f
                                ? 'bg-green-100 text-green-700'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {f === 'pending' && 'รอตรวจสอบ (Pending)'}
                            {f === 'paid' && 'อนุมัติแล้ว (Approved)'}
                            {f === 'cancelled' && 'ยกเลิก (Cancelled)'}
                            {f === 'all' && 'ทั้งหมด'}
                        </button>
                    ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, อีเมล, ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none w-full md:w-64"
                    />
                    <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredBookings.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-3"><CalendarDays size={32} className="text-gray-400" /></div>
                        ไม่มีรายการจองในสถานะนี้
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="p-6 hover:bg-gray-50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                {/* Booking Info */}
                                <div className="flex items-start space-x-4">
                                    <div className="w-14 h-14 bg-green-100 rounded-xl flex flex-col items-center justify-center text-green-700 font-bold shrink-0 border border-green-200">
                                        <span className="text-xs uppercase">{format(new Date(booking.booking_date), 'MMM', { locale: th })}</span>
                                        <span className="text-xl">{format(new Date(booking.booking_date), 'd')}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900 text-lg">{booking.courts?.name || 'Unknown Court'}</h4>
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${booking.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                                booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                }`}>
                                                {booking.status === 'paid' ? 'APPROVED' : booking.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-y-1">
                                            <span className="flex items-center mr-4"><Clock size={14} className="mr-1" /> {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                                            <span className="flex items-center mr-4"><User size={14} className="mr-1" /> {booking.profiles?.first_name} {booking.profiles?.last_name} ({booking.profiles?.email})</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">Booking ID: {booking.id} • จองเมื่อ: {new Date(booking.created_at).toLocaleString('th-TH')}</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    {booking.payment_proof_url && (
                                        <button
                                            onClick={() => setSelectedSlip(booking.payment_proof_url)}
                                            className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                                        >
                                            ดูสลิปโอนเงิน
                                        </button>
                                    )}

                                    {booking.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(booking.id, 'paid')}
                                                className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition"
                                            >
                                                อนุมัติ
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                className="px-4 py-2 text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition"
                                            >
                                                ยกเลิก
                                            </button>
                                        </>
                                    )}

                                    {/* Action for Paid bookings (e.g. No Show) */}
                                    {booking.status === 'paid' && (
                                        <button
                                            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition"
                                            title="ลูกค้าไม่มาตามนัดหมาย (เกิน 15 นาที)"
                                        >
                                            ยกเลิก (ไม่มาแสดงตัว)
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Slip Modal */}
            {selectedSlip && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSlip(null)}>
                    <div className="relative max-w-lg w-full max-h-[90vh]">
                        <img src={selectedSlip} alt="Payment Slip" className="w-full h-auto rounded-lg shadow-2xl" />
                        <button className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"><User size={20} /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingSchedule;
