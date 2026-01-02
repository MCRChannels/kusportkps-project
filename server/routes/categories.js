
const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')

// Get all categories (with optional closings if needed, but usually fetched separately)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sport_categories')
            .select('*')
            .order('name', { ascending: true })
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message })
    }
})

// Get closings for a specific category
router.get('/:id/closings', async (req, res) => {
    try {
        const { id } = req.params
        // Fetch closings for this category, order by date
        const { data, error } = await supabase
            .from('category_closings')
            .select('*')
            .eq('category_id', id)
            .gte('closing_date', new Date().toISOString().split('T')[0]) // Only future/today
            .order('closing_date', { ascending: true })

        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching closings', error: error.message })
    }
})

// Add a closing period
router.post('/:id/closings', async (req, res) => {
    try {
        const { id } = req.params
        const { closing_date, start_time, end_time, reason } = req.body

        const { data, error } = await supabase
            .from('category_closings')
            .insert([{
                category_id: id,
                closing_date,
                start_time,
                end_time,
                reason
            }])
            .select()

        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error adding closing', error: error.message })
    }
})

// Delete a closing period
router.delete('/closings/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { error } = await supabase
            .from('category_closings')
            .delete()
            .eq('id', id)

        if (error) throw error
        res.json({ message: 'Closing deleted' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting closing', error: error.message })
    }
})

// Create Category
router.post('/', async (req, res) => {
    try {
        const { name, description, image_url, is_active, open_time, close_time } = req.body
        const { data, error } = await supabase
            .from('sport_categories')
            .insert([{ name, description, image_url, is_active, open_time, close_time }])
            .select()
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error adding category', error: error.message })
    }
})

// Update Category
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { name, description, image_url, is_active, open_time, close_time } = req.body
        const { data, error } = await supabase
            .from('sport_categories')
            .update({ name, description, image_url, is_active, open_time, close_time })
            .eq('id', id)
            .select()
        if (error) throw error
        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error: error.message })
    }
})

// Delete Category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { error } = await supabase
            .from('sport_categories')
            .delete()
            .eq('id', id)
        if (error) throw error
        res.json({ message: 'Category deleted' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error: error.message })
    }
})

module.exports = router
