const express = require('express')
const cors = require('cors')
const path = require('path')

require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000;

// Import Supabase client
const { supabase, testConnection } = require('./lib/supabase')

testConnection()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.use('/api/court', require('./routes/courts'))
app.use('/api/news', require('./routes/news'))
app.use('/api/settings', require('./routes/settings'))
app.use('/api/booking', require('./routes/bookings'))
app.use('/api/users', require('./routes/users'))
app.use('/api/categories', require('./routes/categories'))

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})