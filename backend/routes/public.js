const express = require('express');
const router = express.Router();
const pool = require('../db');

function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function validateGuestInput({ full_name, cnic, phone, email, address }) {
    if (!full_name || !cnic || !phone || !email || !address) {
        return 'All guest fields are required';
    }
    if (typeof full_name !== 'string' || !/^[a-zA-Z\s]{3,100}$/.test(full_name.trim())) {
        return 'Name must be 3-100 characters and contain only letters and spaces.';
    }
    if (typeof cnic !== 'string' || !/^\d{5}-\d{7}-\d{1}$/.test(cnic.trim())) {
        return 'Please enter a valid CNIC in 12345-6789012-3 format.';
    }
    if (typeof phone !== 'string' || !/^(03\d{9}|03\d{2}-\d{7})$/.test(phone.trim())) {
        return 'Please enter a valid Pakistani phone number.';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
        return 'Please enter a valid email address.';
    }
    if (typeof address !== 'string' || address.trim().length < 10) {
        return 'Address must be at least 10 characters long.';
    }
    return null;
}

router.get('/rooms', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, room_number, room_type, price_per_night
             FROM rooms WHERE status = 'Available' ORDER BY room_number`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch available rooms' });
    }
});

router.post('/bookings', async (req, res) => {
    const { full_name, cnic, phone, email, address, room_id, check_in, check_out } = req.body || {};
    const guestError = validateGuestInput({ full_name, cnic, phone, email, address });
    if (guestError) {
        return res.status(400).json({ success: false, message: guestError });
    }

    const rId = parseInt(room_id);
    if (isNaN(rId) || rId <= 0 || !check_in || !check_out) {
        return res.status(400).json({ success: false, message: 'Room and dates are required.' });
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

        const [rooms] = await connection.query(
            'SELECT * FROM rooms WHERE id = ? AND status = ?',
            [rId, 'Available']
        );
        if (rooms.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Selected room is not available' });
        }

        let guestId;
        const [existingGuests] = await connection.query('SELECT id FROM guests WHERE cnic = ?', [cnic.trim()]);
        if (existingGuests.length > 0) {
            guestId = existingGuests[0].id;
            await connection.query(
                'UPDATE guests SET full_name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
                [full_name.trim(), phone.trim(), email.trim().toLowerCase(), address.trim(), guestId]
            );
        } else {
            const [guestResult] = await connection.query(
                'INSERT INTO guests (full_name, cnic, phone, email, address) VALUES (?, ?, ?, ?, ?)',
                [full_name.trim(), cnic.trim(), phone.trim(), email.trim().toLowerCase(), address.trim()]
            );
            guestId = guestResult.insertId;
        }

        const nights = calculateNights(check_in, check_out);
        const total_amount = nights * parseFloat(rooms[0].price_per_night);

        const [bookingResult] = await connection.query(
            'INSERT INTO bookings (guest_id, room_id, check_in, check_out, total_amount) VALUES (?, ?, ?, ?, ?)',
            [guestId, rId, check_in, check_out, total_amount]
        );

        await connection.query('UPDATE rooms SET status = ? WHERE id = ?', ['Occupied', rId]);
        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Booking request submitted successfully',
            data: { id: bookingResult.insertId, total_amount }
        });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ success: false, message: 'Failed to create booking' });
    } finally {
        connection.release();
    }
});

module.exports = router;
