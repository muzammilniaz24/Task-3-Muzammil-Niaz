const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rooms ORDER BY room_number');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch room' });
    }
});

router.post('/', async (req, res) => {
    let { room_number, room_type, price_per_night, status } = req.body;

    if (!room_number || !room_type || price_per_night === undefined) {
        return res.status(400).json({ success: false, message: 'Room number, type, and price are required' });
    }

    if (typeof room_number !== 'string' || !/^[a-zA-Z0-9-]{1,10}$/.test(room_number.trim())) {
        return res.status(400).json({ success: false, message: 'Room number must be alphanumeric (1-10 characters, letters/digits/dashes only).' });
    }

    if (!['Single', 'Double', 'Deluxe', 'Suite'].includes(room_type)) {
        return res.status(400).json({ success: false, message: 'Room type must be Single, Double, Deluxe, or Suite.' });
    }

    const price = parseFloat(price_per_night);
    if (isNaN(price) || price <= 0) {
        return res.status(400).json({ success: false, message: 'Price per night must be a valid number greater than zero.' });
    }

    const roomStatus = status || 'Available';
    if (!['Available', 'Occupied'].includes(roomStatus)) {
        return res.status(400).json({ success: false, message: 'Status must be Available or Occupied.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO rooms (room_number, room_type, price_per_night, status) VALUES (?, ?, ?, ?)',
            [room_number.trim(), room_type, price, roomStatus]
        );
        res.status(201).json({ success: true, message: 'Room added successfully', data: { id: result.insertId } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Room number already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to add room' });
    }
});

router.put('/:id', async (req, res) => {
    let { room_number, room_type, price_per_night, status } = req.body;

    if (!room_number || !room_type || price_per_night === undefined || !status) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (typeof room_number !== 'string' || !/^[a-zA-Z0-9-]{1,10}$/.test(room_number.trim())) {
        return res.status(400).json({ success: false, message: 'Room number must be alphanumeric (1-10 characters, letters/digits/dashes only).' });
    }

    if (!['Single', 'Double', 'Deluxe', 'Suite'].includes(room_type)) {
        return res.status(400).json({ success: false, message: 'Room type must be Single, Double, Deluxe, or Suite.' });
    }

    const price = parseFloat(price_per_night);
    if (isNaN(price) || price <= 0) {
        return res.status(400).json({ success: false, message: 'Price per night must be a valid number greater than zero.' });
    }

    if (!['Available', 'Occupied'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be Available or Occupied.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE rooms SET room_number = ?, room_type = ?, price_per_night = ?, status = ? WHERE id = ?',
            [room_number.trim(), room_type, price, status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        res.json({ success: true, message: 'Room updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Room number already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to update room' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const [bookings] = await pool.query('SELECT id FROM bookings WHERE room_id = ?', [req.params.id]);
        if (bookings.length > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete room with active bookings' });
        }

        const [result] = await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        res.json({ success: true, message: 'Room deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete room' });
    }
});

module.exports = router;
