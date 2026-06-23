const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./db');
const { requireAdmin } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const roomRoutes = require('./routes/rooms');
const guestRoutes = require('./routes/guests');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);

app.get('/api/dashboard', requireAdmin, async (req, res) => {
    try {
        const [[roomStats]] = await pool.query(`
            SELECT
                COUNT(*) AS total_rooms,
                SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_rooms,
                SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_rooms
            FROM rooms
        `);

        const [[bookingStats]] = await pool.query('SELECT COUNT(*) AS total_bookings FROM bookings');

        res.json({
            success: true,
            data: {
                total_rooms: roomStats.total_rooms || 0,
                available_rooms: roomStats.available_rooms || 0,
                occupied_rooms: roomStats.occupied_rooms || 0,
                total_bookings: bookingStats.total_bookings || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
    }
});

app.use('/api/rooms', requireAdmin, roomRoutes);
app.use('/api/guests', requireAdmin, guestRoutes);
app.use('/api/bookings', requireAdmin, bookingRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
