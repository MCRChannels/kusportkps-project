const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const testConnection = async () => {
    try {
        if (!supabaseUrl || !supabaseKey) {
            console.error('Error: Supabase URL or Key is missing in .env')
            return false
        }
        console.log('Supabase client initialized with URL:', supabaseUrl)
        return true
    } catch (error) {
        console.error('Supabase connection error:', error)
        return false
    }
}

module.exports = { supabase, testConnection }
