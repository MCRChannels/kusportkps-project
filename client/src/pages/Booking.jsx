import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Calendar, Info, ArrowLeft, ChevronLeft, Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, X, Upload, CreditCard } from 'lucide-react';
import api from '../lib/api';

const Booking = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('categoryId');
    const categoryName = searchParams.get('categoryName');

    // If no category selected, redirect to selection screen
    if (!categoryId) {
        return <Navigate to="/booking" replace />;
    }

    // Default value so it doesn't crash if profile is null
    const isKU = profile?.email?.endsWith('@ku.th') || false;

    // Helper: Get local date string 'YYYY-MM-DD' to prevent UTC mismatch issues
    const getTodayLocal = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(getTodayLocal());
    const [bookings, setBookings] = useState([]);
    const [courts, setCourts] = useState([]);
    const [category, setCategory] = useState(null);
    const [closings, setClosings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});

    // Modal & Payment State
    const [bookingStep, setBookingStep] = useState(0); // 0: None, 1: Confirm details, 2: Payment/Upload
    const [pendingBooking, setPendingBooking] = useState(null);
    const [slipFile, setSlipFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    useEffect(() => {
        if (categoryId) {
            fetchData();
        }
        fetchSettings(); // Fetch payment settings

        // Realtime Subscription for Bookings
        const channel = supabase
            .channel('realtime:bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
                console.log('Realtime Booking Update:', payload);
                // Simple re-fetch if any booking changes. 
                // In production, we might want to check if payload.new.booking_date === selectedDate 
                // but checking the date string format matches can be tricky, so generic re-fetch is safer for now.
                if (categoryId) fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedDate, user, categoryId]);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings(res.data);
        } catch (error) {
            console.error("Error fetching settings", error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Category Details & Closings
            const { data: catData } = await supabase.from('sport_categories').select('*').eq('id', categoryId).single();
            setCategory(catData);

            const { data: closingsData } = await supabase
                .from('category_closings')
                .select('*')
                .eq('category_id', categoryId)
                .eq('closing_date', selectedDate);
            setClosings(closingsData || []);

            // 2. Fetch Courts (Use API to bypass RLS issues)
            const courtsRes = await api.get(`/courts?categoryId=${categoryId}`);
            let courtsData = courtsRes.data || [];
            if (!courtsData) courtsData = [];

            // 3. Fetch Bookings (Use API)
            const bookingsRes = await api.get(`/booking/date/${selectedDate}`);
            let bookingsData = bookingsRes.data || [];

            // Filter out cancelled
            bookingsData = bookingsData.filter(b => b.status !== 'cancelled');

            setCourts(courtsData);
            setBookings(bookingsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setCourts([]);
        } finally {
            setLoading(false);
        }
    };

    // State for range selection
    const [selection, setSelection] = useState({ courtId: null, startTime: null }); // Only start is needed to track "pending end"

    // Calculate Time Slots Dynamic
    const startHour = category?.open_time ? parseInt(category.open_time.split(':')[0]) : 8;
    const endHour = category?.close_time ? parseInt(category.close_time.split(':')[0]) : 21;

    // Safety check
    const safeStart = isNaN(startHour) ? 8 : startHour;
    const safeEnd = isNaN(endHour) ? 21 : endHour;

    const timeSlots = [];
    for (let i = safeStart; i < safeEnd; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
    }

    const isSlotBooked = (courtId, time) => {
        return bookings.find(b =>
            b.court_id === courtId &&
            b.start_time && b.end_time && // Guard against missing time
            parseInt(b.start_time.split(':')[0]) <= parseInt(time.split(':')[0]) &&
            parseInt(b.end_time.split(':')[0]) > parseInt(time.split(':')[0])
        );
    };

    const isSlotClosed = (time) => {
        // Check special closings
        const timeVal = parseInt(time.split(':')[0]);
        for (let closing of closings) {
            if (!closing.start_time || !closing.end_time) continue; // Guard
            const start = parseInt(closing.start_time.split(':')[0]);
            const end = parseInt(closing.end_time.split(':')[0]);
            if (timeVal >= start && timeVal < end) {
                return { isClosed: true, reason: closing.reason };
            }
        }
        return { isClosed: false };
    };

    const isWalkInRequired = (time) => {
        const hour = parseInt(time.split(':')[0]);
        // KU Students: 08:00 - 16:00 is Walk-in only (Cannot book online)
        return isKU && (hour >= 8 && hour < 16);
    };

    const handleCellClick = async (court, time) => {
        if (!user) {
            alert('กรุณาเข้าสู่ระบบเพื่อทำการจอง');
            navigate('/login');
            return;
        }

        const { status, text } = getSlotStatus(court, time);

        // If clicking a booked/closed/walkin slot, do nothing (unless perhaps resetting selection?)
        if (status !== 'available' && status !== 'selecting') {
            if (status === 'closed') alert(`ไม่สามารถจองได้: ${text}`);
            // Reset selection if clicking invalid slot? Maybe better to just ignore or alert.
            setSelection({ courtId: null, startTime: null });
            return;
        }

        // --- Range Selection Logic ---

        // 1. If nothing selected, set Start
        if (!selection.courtId) {
            setSelection({ courtId: court.id, startTime: time });
            return;
        }

        // 2. If same slot selected, treat as "End Selection" (1 Hour Duration)
        // Previous logic was to deselect, but user might expect this to confirm 1 hour.

        // 3. If clicking a different court, reset and set new Start
        if (selection.courtId !== court.id) {
            setSelection({ courtId: court.id, startTime: time });
            return;
        }


        const startH = parseInt(selection.startTime.split(':')[0]);
        const endH = parseInt(time.split(':')[0]);


        const firstH = Math.min(startH, endH);
        const lastH = Math.max(startH, endH);

        const count = lastH - firstH + 1;
        const startTimeStr = `${firstH.toString().padStart(2, '0')}:00`;
        const endTimeStr = `${(lastH + 1).toString().padStart(2, '0')}:00`;

        let bookedHours = 0;
        bookings.filter(b => b.user_id === user.id).forEach(b => {
            const s = parseInt(b.start_time.split(':')[0]);
            const e = parseInt(b.end_time.split(':')[0]);
            bookedHours += (e - s);
        });

        if (bookedHours + count > 2) {
            alert(`สามารถจองได้แค่ 2 ชั่วโมงต่อวันนะครับ (ตอนนี้คุณจองไป ${2 - bookedHours} ชั่วโมงแล้ว)`);
            setSelection({ courtId: null, startTime: null }); // Reset
            return;
        }

        // Validation 2: Check for gaps/availability in the range
        // We must ensure every slot from firstH to lastH is available
        for (let h = firstH; h <= lastH; h++) {
            const t = `${h.toString().padStart(2, '0')}:00`;
            const { status } = getSlotStatus(court, t, true); // Use raw status without selection logic
            if (status !== 'available' && status !== 'selecting') {
                // 'selecting' is self, so fine. But raw status won't yield selecting.
                // We need a helper that ignores the current selection visual state.
                // Re-use logic: isSlotBooked, isSlotClosed, isWalkIn
                if (isSlotBooked(court.id, t) || isSlotClosed(t).isClosed || isWalkInRequired(t)) {
                    alert('ช่วงเวลาที่คุณเลือก มีคนจองไปแล้วครับ');
                    setSelection({ courtId: null, startTime: null });
                    return;
                }
            }
        }

        // Confirm
        // const confirm = window.confirm(`ยืนยันการจองสนาม ${court.name} เวลา ${startTimeStr} - ${endTimeStr} (${count} ชั่วโมง)?`);
        // if (confirm) {
        setPendingBooking({
            court,
            startTimeStr,
            endTimeStr,
            count,
            start_time: startTimeStr, // for API
            end_time: endTimeStr,     // for API
            totalPrice: court.price * count
        });
        setBookingStep(1);
        setBookingError(null);
        // } else {
        // setSelection({ courtId: null, startTime: null });
        // }
    };

    const getSlotStatus = (court, time, pureCheck = false) => {
        // 1. Check Closing
        const { isClosed, reason } = isSlotClosed(time);
        if (isClosed) {
            return { status: 'closed', text: reason || 'ปิดปรับปรุง', className: 'bg-gray-200 text-gray-500 font-medium cursor-not-allowed border border-gray-300' };
        }

        // 2. Check Booking
        const booking = isSlotBooked(court.id, time);
        if (booking) {
            if (booking.user_id === user?.id) {
                return { status: 'mine', text: 'ของคุณ', className: 'bg-blue-600 text-white font-bold border-blue-700 cursor-not-allowed shadow-sm truncate' };
            }
            // Add max-w-full and truncate to prevent layout break
            return { status: 'booked', text: 'ไม่ว่าง', className: 'bg-red-500 text-white font-bold border-red-600 cursor-not-allowed shadow-sm truncate' };
        }

        // 3. Walk-in Restricted
        if (isWalkInRequired(time)) {
            return { status: 'walkin', text: 'Walk-in', className: 'bg-gray-100 text-gray-400 font-medium border border-gray-200 cursor-not-allowed' };
        }

        // --- Selection Visuals (if not pure check) ---
        if (!pureCheck && selection.courtId === court.id) {
            const currentHour = parseInt(time.split(':')[0]);
            const selectionHour = parseInt(selection.startTime.split(':')[0]);

            if (selection.startTime === time) {
                return { status: 'selecting', text: 'จุดเริ่ม', className: 'bg-yellow-400 text-yellow-900 font-bold border-yellow-500 cursor-pointer animate-pulse' };
            }
        }

        return { status: 'available', text: 'ว่าง', className: 'text-green-600 hover:bg-green-100 font-medium cursor-pointer transition-colors' };
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-prompt">
            <Navbar />

            <div className="container mx-auto px-4 py-8 flex-grow">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3 mb-4 md:mb-0 w-full md:w-auto">
                        <button onClick={() => navigate('/booking')} className="mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors" title="ย้อนกลับไปเลือกประเภท">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <Calendar className="text-green-600" size={28} />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{categoryName || category?.name || 'สนามกีฬา'}</h1>
                            <p className="text-sm text-gray-500">
                                {category?.open_time ? `เวลาเปิดทำการ: ${category.open_time.slice(0, 5)} - ${category.close_time.slice(0, 5)}` : 'เลือกวันที่และเวลาที่ต้องการจอง'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 shadow-inner">
                        <span className="text-gray-500 mr-2 text-sm font-medium"></span>
                        <input
                            type="date"
                            className="bg-transparent border-none focus:ring-0 text-gray-800 font-bold cursor-not-allowed outline-none opacity-80"
                            value={selectedDate}
                            min={getTodayLocal()}
                            max={getTodayLocal()}
                            disabled={true}
                            title="จองได้เฉพาะวันต่อวันเท่านั้น"
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs md:text-sm mb-4 justify-center md:justify-start">
                    <div className="flex items-center px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm"><span className="w-3 h-3 rounded-full bg-gray-300 mr-2"></span> Walk-in (08:00-16:00)</div>
                    <div className="flex items-center px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> ว่าง (จองได้)</div>
                    <div className="flex items-center px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> ไม่ว่าง (มีคนจองแล้ว)</div>
                    <div className="flex items-center px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm"><span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span> ของคุณ</div>
                    <div className="flex items-center px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm"><span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span> ปิดปรับปรุง</div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto pb-2">
                        {loading ? (
                            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                                กำลังโหลดข้อมูล...
                            </div>
                        ) : courts.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                ไม่พบสนามในหมวดหมู่นี้
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 border-collapse">
                                <thead>
                                    <tr className="bg-green-600 text-white shadow-md">
                                        <th className="px-4 py-4 text-left text-sm font-bold sticky left-0 z-10 bg-green-600 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">สนาม / เวลา</th>
                                        {timeSlots.map(time => (
                                            <th key={time} className="px-2 py-4 text-center text-sm font-bold min-w-[100px] border-l border-green-500/30 whitespace-nowrap">
                                                {time} - {`${(parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0')}:00`}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {courts.map((court, idx) => (
                                        <tr key={court.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                            <td className="px-4 py-3 text-sm font-bold text-gray-800 sticky left-0 z-10 bg-inherit border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                {court.name}
                                                <div className="text-xs text-green-600 font-normal mt-0.5">{court.location || ''}</div>
                                            </td>
                                            {timeSlots.map(time => {
                                                const slot = getSlotStatus(court, time);
                                                return (
                                                    <td key={`${court.id}-${time}`} className="px-1 py-1 h-14 border-l border-gray-50">
                                                        <button
                                                            onClick={() => handleCellClick(court, time)}
                                                            disabled={slot.status !== 'available' && slot.status !== 'selecting'}
                                                            className={`w-full h-full rounded-md text-xs flex items-center justify-center transition-all duration-200 ${slot.className}`}
                                                        >
                                                            {slot.text}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Footer Rules */}
                <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Info size={100} className="text-blue-500" />
                    </div>
                    <h3 className="text-blue-800 font-bold mb-3 flex items-center relative z-10">
                        <Info size={20} className="mr-2" />
                        กติกาการใช้งาน
                    </h3>
                    <ul className="list-disc list-inside text-sm text-blue-900/80 space-y-2 relative z-10 ml-1">
                        <li><span className="font-semibold text-blue-700">08:00 - 16:00:</span> เข้าใช้งานได้ทันที (Walk-in) สำหรับนิสิต/บุคลากร (ต้องแสดงบัตรหรือใช้อีเมล @ku.th)</li>
                        <li><span className="font-semibold text-blue-700">16:00 - 21:00:</span> เปิดจองผ่านระบบออนไลน์สำหรับทุกคน</li>
                        <li>จำกัดสิทธิ์จองสูงสุด 2 ชั่วโมง ต่อท่าน ต่อวัน</li>
                    </ul>
                </div>

            </div>
            {/* Booking Modal */}
            {bookingStep > 0 && pendingBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-green-600 p-4 text-white flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg flex items-center">
                                {bookingStep === 1 ? 'ยืนยันรายละเอียด' : 'ชำระเงิน'}
                            </h3>
                            <button onClick={() => { setBookingStep(0); setSlipFile(null); }} className="hover:bg-green-700/50 p-1 rounded-full transition"><X size={20} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* Step 1: Confirm Details */}
                            {bookingStep === 1 && (
                                <div className="space-y-4">
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <div className="text-sm text-gray-500 mb-1">สนามที่จอง</div>
                                        <div className="font-bold text-gray-800 text-lg">{pendingBooking.court.name}</div>
                                        <div className="text-sm text-gray-500 mt-2">เวลา</div>
                                        <div className="font-bold text-gray-800 text-lg">
                                            {pendingBooking.startTimeStr} - {pendingBooking.endTimeStr}
                                            <span className="text-sm font-normal text-gray-500 ml-2">({pendingBooking.count} ชั่วโมง)</span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-2">ยอดชำระ</div>
                                        <div className="font-bold text-green-600 text-xl">{pendingBooking.totalPrice} บาท</div>
                                    </div>

                                    <button
                                        onClick={() => setBookingStep(2)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center"
                                    >
                                        ดำเนินการชำระเงิน <ChevronLeft className="rotate-180 ml-1" />
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Payment & Upload */}
                            {bookingStep === 2 && (
                                <div className="space-y-6">
                                    {bookingError && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-start">
                                            <AlertCircle size={16} className="mt-0.5 mr-2 shrink-0" />
                                            {bookingError}
                                        </div>
                                    )}

                                    {/* Bank Info */}
                                    <div className="space-y-3">
                                        <h4 className="font-bold text-gray-700 flex items-center"><CreditCard size={18} className="mr-2" /> ช่องทางการชำระเงิน</h4>
                                        <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col items-center">
                                            {settings?.payment_qr_url ? (
                                                <img src={settings.payment_qr_url} alt="QR Code" className="w-48 h-48 object-contain mb-3" />
                                            ) : (
                                                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400 mb-3 rounded-lg">No QR</div>
                                            )}
                                            <div className="text-center">
                                                <div className="font-bold text-gray-800">{settings?.bank_name || 'ธนาคาร'}</div>
                                                <div className="text-gray-600">{settings?.bank_account_number || 'xxx-xxx-xxxx'}</div>
                                                <div className="text-sm text-gray-500">{settings?.bank_account_name || 'ชื่อบัญชี'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload Slip */}
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-gray-700 flex items-center"><Upload size={18} className="mr-2" /> แนบหลักฐานการโอน</h4>
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 text-center hover:bg-white transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setSlipFile(e.target.files[0])}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            {slipFile ? (
                                                <div className="flex items-center justify-center text-green-600 font-medium">
                                                    <CheckCircle size={20} className="mr-2" /> {slipFile.name}
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 text-sm">
                                                    คลิกพื้นที่นี้เพื่ออัปโหลดสลิป<br /><span className="text-xs text-gray-400">(รองรับ JPG, PNG)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (!slipFile) {
                                                setBookingError('กรุณาแนบหลักฐานการโอนเงิน');
                                                return;
                                            }
                                            setUploading(true);
                                            try {
                                                const fileExt = slipFile.name.split('.').pop();
                                                const fileName = `slips/${selectedDate}_${Date.now()}_${user.id}.${fileExt}`;
                                                // Try uploading to 'images' bucket first (or 'slips' if preferred, but keeping it simple)
                                                // Assuming 'images' bucket exists as per previous plan.
                                                const { error: uploadError } = await supabase.storage
                                                    .from('images')
                                                    .upload(fileName, slipFile);

                                                if (uploadError) throw uploadError;

                                                const { data: publicURLData } = supabase.storage.from('images').getPublicUrl(fileName);

                                                // Create Booking
                                                const payload = {
                                                    user_id: user.id,
                                                    court_id: pendingBooking.court.id,
                                                    booking_date: selectedDate,
                                                    start_time: pendingBooking.start_time,
                                                    end_time: pendingBooking.end_time,
                                                    payment_proof_url: publicURLData.publicUrl
                                                };

                                                await api.post('/booking', payload);

                                                alert('จองสำเร็จ! กรุณารอเจ้าหน้าที่ตรวจสอบ');
                                                setBookingStep(0);
                                                setSlipFile(null);
                                                setSelection({ courtId: null, startTime: null, endTime: null });
                                                fetchData();

                                            } catch (err) {
                                                console.error(err);
                                                if (err.response && err.response.status === 409) {
                                                    setBookingError(err.response.data.message);
                                                } else if (err.message.includes('Bucket not found')) {
                                                    setBookingError('Server Error: Storage bucket not found. Please contact admin.');
                                                } else {
                                                    setBookingError('เกิดข้อผิดพลาด: ' + (err.message || 'Unknown'));
                                                }
                                            } finally {
                                                setUploading(false);
                                            }
                                        }}
                                        disabled={uploading}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? 'กำลังดำเนินการ...' : 'ยืนยันการชำระเงิน'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Booking;