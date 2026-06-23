const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM guests ORDER BY full_name');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch guests' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM guests WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch guest' });
    }
});

router.post('/', async (req, res) => {
    let { full_name, cnic, phone, email, address } = req.body;

    if (!full_name || !cnic || !phone || !email || !address) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (typeof full_name !== 'string' || !/^[a-zA-Z\s]{3,100}$/.test(full_name.trim())) {
        return res.status(400).json({ success: false, message: 'Name must be 3-100 characters and contain only letters and spaces.' });
    }

    if (typeof cnic !== 'string' || !/^\d{5}-\d{7}-\d{1}$/.test(cnic.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid CNIC in 12345-6789012-3 format.' });
    }

    if (typeof phone !== 'string' || !/^(03\d{9}|03\d{2}-\d{7})$/.test(phone.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid Pakistani phone number.' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (typeof address !== 'string' || address.trim().length < 10) {
        return res.status(400).json({ success: false, message: 'Address must be at least 10 characters long.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO guests (full_name, cnic, phone, email, address) VALUES (?, ?, ?, ?, ?)',
            [full_name.trim(), cnic.trim(), phone.trim(), email.trim().toLowerCase(), address.trim()]
        );
        res.status(201).json({ success: true, message: 'Guest added successfully', data: { id: result.insertId } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'CNIC already registered' });
        }
        res.status(500).json({ success: false, message: 'Failed to add guest' });
    }
});

router.put('/:id', async (req, res) => {
    let { full_name, cnic, phone, email, address } = req.body;

    if (!full_name || !cnic || !phone || !email || !address) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (typeof full_name !== 'string' || !/^[a-zA-Z\s]{3,100}$/.test(full_name.trim())) {
        return res.status(400).json({ success: false, message: 'Name must be 3-100 characters and contain only letters and spaces.' });
    }

    if (typeof cnic !== 'string' || !/^\d{5}-\d{7}-\d{1}$/.test(cnic.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid CNIC in 12345-6789012-3 format.' });
    }

    if (typeof phone !== 'string' || !/^(03\d{9}|03\d{2}-\d{7})$/.test(phone.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid Pakistani phone number.' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (typeof address !== 'string' || address.trim().length < 10) {
        return res.status(400).json({ success: false, message: 'Address must be at least 10 characters long.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE guests SET full_name = ?, cnic = ?, phone = ?, email = ?, address = ? WHERE id = ?',
            [full_name.trim(), cnic.trim(), phone.trim(), email.trim().toLowerCase(), address.trim(), req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        res.json({ success: true, message: 'Guest updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'CNIC already registered' });
        }
        res.status(500).json({ success: false, message: 'Failed to update guest' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const [bookings] = await pool.query('SELECT id FROM bookings WHERE guest_id = ?', [req.params.id]);
        if (bookings.length > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete guest with existing bookings' });
        }

        const [result] = await pool.query('DELETE FROM guests WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Guest not found' });
        }

        res.json({ success: true, message: 'Guest deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete guest' });
    }
});

module.exports = router;
