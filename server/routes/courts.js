const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')

// Get all courts
router.get('/', async (req, res) => {
    try {
        const { categoryId } = req.query
        let query = supabase
            .from('courts')
            .select('*, sport_categories(name)')
            .order('id', { ascending: true })

        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        const { data: courts, error } = await query

        if (error) throw error

        res.json(courts)
    } catch (error) {
        console.error('Error fetching courts:', error)
        res.status(500).json({ message: 'Error fetching courts', error: error.message })
    }
})

// Get a single court
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { data: court, error } = await supabase
            .from('courts')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error

        res.json(court)
    } catch (error) {
        res.status(404).json({ message: 'Court not found', error: error.message })
    }
})

// Create Court
router.post('/', async (req, res) => {
    try {
        const { name, type, description, price, image_url, ticket_available, category_id } = req.body
        const { data, error } = await supabase
            .from('courts')
            .insert([{
                name,
                type: type || 'General', // Fallback or handle appropriately
                description,
                price,
                image_url,
                category_id,
                is_active: ticket_available // Map frontend 'ticket_available' to DB 'is_active'
            }])
            .select()

        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error creating court', error: error.message })
    }
})

// Update Court
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { ticket_available, category_id, sport_categories, id: _id, created_at, ...otherUpdates } = req.body

        const updates = {
            ...otherUpdates,
            is_active: ticket_available, // Map here as well
            category_id
        }

        const { data, error } = await supabase
            .from('courts')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error updating court', error: error.message })
    }
})

// Delete Court
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { error } = await supabase
            .from('courts')
            .delete()
            .eq('id', id)

        if (error) throw error
        res.json({ message: 'Court deleted' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting court', error: error.message })
    }
})

module.exports = router
