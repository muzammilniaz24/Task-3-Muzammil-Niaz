const express = require('express');
const router = express.Router();
const pool = require('../db');

function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end - start;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.*, g.full_name AS guest_name, r.room_number, r.room_type
            FROM bookings b
            JOIN guests g ON b.guest_id = g.id
            JOIN rooms r ON b.room_id = r.id
            ORDER BY b.check_in DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.*, g.full_name AS guest_name, r.room_number
            FROM bookings b
            JOIN guests g ON b.guest_id = g.id
            JOIN rooms r ON b.room_id = r.id
            WHERE b.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch booking' });
    }
});

router.post('/', async (req, res) => {
    const { guest_id, room_id, check_in, check_out } = req.body;

    const gId = parseInt(guest_id);
    const rId = parseInt(room_id);

    if (isNaN(gId) || gId <= 0 || isNaN(rId) || rId <= 0 || !check_in || !check_out) {
        return res.status(400).json({ success: false, message: 'All fields are required and must be valid.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate.getTime()) || checkInDate < today) {
        return res.status(400).json({ success: false, message: 'Check-in date cannot be in the past.' });
    }

    if (isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
        return res.status(400).json({ success: false, message: 'Check-out date must be strictly after the check-in date.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [guests] = await connection.query('SELECT id FROM guests WHERE id = ?', [gId]);
        if (guests.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        const [rooms] = await connection.query('SELECT * FROM rooms WHERE id = ?', [rId]);
        if (rooms.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (rooms[0].status === 'Occupied') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Room is not available (already Occupied)' });
        }

        const nights = calculateNights(check_in, check_out);
        const total_amount = nights * parseFloat(rooms[0].price_per_night);

        const [result] = await connection.query(
            'INSERT INTO bookings (guest_id, room_id, check_in, check_out, total_amount) VALUES (?, ?, ?, ?, ?)',
            [gId, rId, check_in, check_out, total_amount]
        );

        await connection.query('UPDATE rooms SET status = ? WHERE id = ?', ['Occupied', rId]);

        await connection.commit();
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: { id: result.insertId, total_amount }
        });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Failed to create booking' });
    } finally {
        connection.release();
    }
});

router.put('/:id', async (req, res) => {
    const { guest_id, room_id, check_in, check_out } = req.body;

    const gId = parseInt(guest_id);
    const rId = parseInt(room_id);

    if (isNaN(gId) || gId <= 0 || isNaN(rId) || rId <= 0 || !check_in || !check_out) {
        return res.status(400).json({ success: false, message: 'All fields are required and must be valid.' });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid check-in date.' });
    }

    if (isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
        return res.status(400).json({ success: false, message: 'Check-out date must be strictly after the check-in date.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const oldRoomId = existing[0].room_id;

        const [guests] = await connection.query('SELECT id FROM guests WHERE id = ?', [guest_id]);
        if (guests.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        const [rooms] = await connection.query('SELECT * FROM rooms WHERE id = ?', [room_id]);
        if (rooms.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (room_id != oldRoomId && rooms[0].status === 'Occupied') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Selected room is not available' });
        }

        const nights = calculateNights(check_in, check_out);
        const total_amount = nights * parseFloat(rooms[0].price_per_night);

        await connection.query(
            'UPDATE bookings SET guest_id = ?, room_id = ?, check_in = ?, check_out = ?, total_amount = ? WHERE id = ?',
            [guest_id, room_id, check_in, check_out, total_amount, req.params.id]
        );

        if (room_id != oldRoomId) {
            await connection.query('UPDATE rooms SET status = ? WHERE id = ?', ['Available', oldRoomId]);
            await connection.query('UPDATE rooms SET status = ? WHERE id = ?', ['Occupied', room_id]);
        }

        await connection.commit();
        res.json({ success: true, message: 'Booking updated successfully', data: { total_amount } });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Failed to update booking' });
    } finally {
        connection.release();
    }
});

router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const roomId = existing[0].room_id;

        await connection.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
        await connection.query('UPDATE rooms SET status = ? WHERE id = ?', ['Available', roomId]);

        await connection.commit();
        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Failed to delete booking' });
    } finally {
        connection.release();
    }
});

module.exports = router;
