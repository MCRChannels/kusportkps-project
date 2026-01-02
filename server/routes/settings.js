const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET /api/settings - Fetch all settings
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*');

        if (error) throw error;

        // Convert array to object
        const settings = {};
        if (data) {
            data.forEach(item => {
                settings[item.key] = item.value;
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
});

// PUT /api/settings - Update settings
router.put('/', async (req, res) => {
    try {
        const updates = req.body; // Expect { key: value, key2: value2 }

        const promises = Object.keys(updates).map(async (key) => {
            const { error } = await supabase
                .from('site_settings')
                .upsert({ key, value: updates[key], updated_at: new Date() }, { onConflict: 'key' });
            if (error) throw error;
        });

        await Promise.all(promises);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
});

module.exports = router;
