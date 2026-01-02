const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')

// Create a booking
// Create a booking
router.post('/', async (req, res) => {
    try {
        const { user_id, court_id, booking_date, start_time, end_time, payment_proof_url } = req.body

        // 1. Check for overlapping bookings (Race Condition Prevention)
        const { data: conflicts, error: conflictError } = await supabase
            .from('bookings')
            .select('id')
            .eq('court_id', court_id)
            .eq('booking_date', booking_date)
            .neq('status', 'cancelled') // Ignore cancelled
            .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time})`)

        // Note: Supabase .or() with range overlap logic is tricky. 
        // Simpler logic: Find any booking where (StartA < EndB) and (EndA > StartB)
        // .filter() is better if RLS allows, but let's try raw query logic or just fetch all for day and filter in JS if load is low.
        // For robustness, let's fetch all active bookings for that court/date and check in JS.

        const { data: existingBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('start_time, end_time')
            .eq('court_id', court_id)
            .eq('booking_date', booking_date)
            .neq('status', 'cancelled');

        if (fetchError) throw fetchError;

        const reqStart = parseInt(start_time.split(':')[0]);
        const reqEnd = parseInt(end_time.split(':')[0]);

        const hasConflict = existingBookings.some(b => {
            const bStart = parseInt(b.start_time.split(':')[0]);
            const bEnd = parseInt(b.end_time.split(':')[0]);
            return (reqStart < bEnd && reqEnd > bStart);
        });

        if (hasConflict) {
            return res.status(409).json({ success: false, message: 'มีคนจองห้วงเวลานี้ไปแล้ว กรุณาเลือกเวลาใหม่' });
        }

        const { data, error } = await supabase
            .from('bookings')
            .insert([{
                user_id,
                court_id,
                booking_date,
                start_time,
                end_time,
                status: 'pending',
                payment_proof_url // Save proof URL
            }])
            .select()

        if (error) throw error

        res.status(201).json({ success: true, message: 'Booking created', data })
    } catch (error) {
        console.error('Booking error:', error)
        res.status(500).json({ success: false, message: 'Error creating booking', error: error.message })
    }
})

// Get bookings for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params
        const { data, error } = await supabase
            .from('bookings')
            .select('*, courts(*)') // Join with courts to get court details
            .eq('user_id', userId)

        if (error) throw error

        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error: error.message })
    }
})

// Get all bookings (Staff/Admin)
router.get('/all', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, courts(*), profiles(*)') // Re-enabled profiles join (User fixed FK)
            .order('booking_date', { ascending: false })

        if (error) throw error

        res.json(data)
    } catch (error) {
        console.error("Error fetching ALL bookings:", error);
        res.status(500).json({ message: 'Error fetching all bookings', error: error.message })
    }
})

// Get bookings by date
router.get('/date/:date', async (req, res) => {
    try {
        const { date } = req.params // Format: YYYY-MM-DD
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('booking_date', date)

        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings by date', error: error.message })
    }
})

// Update booking status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('SERVER ERROR updating booking status:', error);
        res.status(500).json({ message: 'Error updating booking status', error: error.message, details: error });
    }
});

module.exports = router
