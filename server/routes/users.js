const express = require('express')
const router = express.Router()
const { supabase } = require('../lib/supabase')

// Get all users (Admin only - in production check for admin role here)
// Get all users
// Get all users (Using Auth Admin API to ensure we see all registered users)
// Get all users
router.get('/', async (req, res) => {
    try {
        // Fetch directly from profiles table which is the source of truth for roles
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('username', { ascending: true });

        if (error) throw error;

        // Map to ensure consistent format if needed, or just return profiles
        // Profiles table has: id, email, username, role, etc.
        res.json(profiles);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
})

// Update user role
router.put('/:id/role', async (req, res) => {
    try {
        const { id } = req.params
        const { role } = req.body

        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', id)
            .select()

        if (error) throw error

        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error updating role', error: error.message })
    }
})

// Update user details (Admin editing user)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        // Allow updating arbitrary fields passed in body
        const updates = req.body

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error

        res.json(data)
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message })
    }
})

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params
        // Note: Deleting from profiles might verify trigger logic or cascade from auth.users
        // Supabase Auth deletion usually requires service role key on auth.users table.
        // Here we just delete the profile, but usually we want to delete the Auth User too.
        // Deleting Auth user via Client SDK is not direct. 
        // For this demo, we'll delete the profile row.

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)

        if (error) throw error

        res.json({ message: 'User profile deleted' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message })
    }
})

module.exports = router
