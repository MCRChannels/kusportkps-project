const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')

// Get all news
router.get('/', async (req, res) => {
    try {
        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        res.json(news)
    } catch (error) {
        console.error('Error fetching news:', error)
        res.status(500).json({ message: 'Error fetching news', error: error.message })
    }
})

// Create news (Staff/Admin only - handling this logic usually requires middleware, 
// but for now strictly just the DB insert)
router.post('/', async (req, res) => {
    try {
        const { title, content, image_url, created_by } = req.body
        const { data, error } = await supabase
            .from('news')
            .insert([{ title, content, image_url, created_by }])
            .select()

        if (error) throw error

        res.status(201).json({ message: 'News created', data })
    } catch (error) {
        console.error('Error creating news:', error)
        res.status(500).json({ message: 'Error creating news', error: error.message })
    }
})

// Update news
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, image_url } = req.body;

        const { data, error } = await supabase
            .from('news')
            .update({ title, content, image_url })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({ message: 'News updated', data });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ message: 'Error updating news', error: error.message });
    }
})

// Delete news
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'News deleted' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ message: 'Error deleting news', error: error.message });
    }
})

module.exports = router
