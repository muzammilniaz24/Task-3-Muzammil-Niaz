const API_BASE = '/api';
const ADMIN_TOKEN_KEY = 'hotel_admin_token';

const ADMIN_PAGES = new Set(['index.html', 'rooms.html', 'guests.html', 'bookings.html', '']);

function getAdminToken() {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

function isAdminPage() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    return ADMIN_PAGES.has(page);
}

async function requireAdminAccess() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'X-Admin-Token': token }
        });
        if (!response.ok) {
            sessionStorage.removeItem(ADMIN_TOKEN_KEY);
            window.location.href = 'login.html';
            return false;
        }
    } catch (err) {
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

const ROOM_IMAGES = {
    Single: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80',
    Double: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&q=80',
    Deluxe: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
    Suite: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80'
};

let roomsCache = [];

function getRoomImage(type) {
    return ROOM_IMAGES[type] || ROOM_IMAGES.Single;
}

function getInitials(name) {
    if (!name) return 'G';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    const icon = type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill';
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        <i class="bi bi-${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.appendChild(alert);

    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 4000);
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }
}

function setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Please wait...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    }
}

async function apiRequest(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getAdminToken();
    if (token) headers['X-Admin-Token'] = token;

    const response = await fetch(`${API_BASE}${url}`, {
        headers,
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

function confirmDelete(message) {
    return confirm(message || 'Are you sure you want to delete this item?');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

function getStatusBadge(status) {
    const cls = status === 'Available' ? 'badge-available' : 'badge-occupied';
    return `<span class="badge ${cls}">${status}</span>`;
}

function animateCounter(element, target) {
    const duration = 1000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        element.textContent = current;
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// Validation Framework Helpers
function validateField(input, validationFn, errorMsgElementId, errorMsg) {
    const errorEl = document.getElementById(errorMsgElementId);
    const isValid = validationFn(input.value);
    
    if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
        return true;
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        if (errorEl) {
            errorEl.textContent = errorMsg;
            errorEl.style.display = 'block';
        }
        return false;
    }
}

function clearValidationStyles(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
        el.classList.remove('is-valid', 'is-invalid');
    });
    form.querySelectorAll('.invalid-feedback').forEach(el => {
        el.style.display = 'none';
    });
}

function shakeElement(el) {
    if (!el) return;
    el.classList.add('shake');
    setTimeout(() => {
        el.classList.remove('shake');
    }, 450);
}

// Dashboard
async function loadDashboard() {
    showLoading('dashboardStats');
    try {
        const { data } = await apiRequest('/dashboard');
        document.getElementById('dashboardStats').innerHTML = `
            <div class="col-sm-6 col-lg-3 mb-3">
                <div class="stat-card rooms">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3 data-count="${data.total_rooms}">0</h3>
                            <p>Total Rooms</p>
                        </div>
                        <div class="stat-icon"><i class="bi bi-door-open"></i></div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-lg-3 mb-3">
                <div class="stat-card bookings">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3 data-count="${data.total_bookings}">0</h3>
                            <p>Total Bookings</p>
                        </div>
                        <div class="stat-icon"><i class="bi bi-calendar-check"></i></div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-lg-3 mb-3">
                <div class="stat-card available">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3 data-count="${data.available_rooms}">0</h3>
                            <p>Available Rooms</p>
                        </div>
                        <div class="stat-icon"><i class="bi bi-check-circle"></i></div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-lg-3 mb-3">
                <div class="stat-card occupied">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3 data-count="${data.occupied_rooms}">0</h3>
                            <p>Occupied Rooms</p>
                        </div>
                        <div class="stat-icon"><i class="bi bi-person-fill"></i></div>
                    </div>
                </div>
            </div>
        `;

        document.querySelectorAll('[data-count]').forEach(el => {
            animateCounter(el, parseInt(el.dataset.count) || 0);
        });
    } catch (err) {
        document.getElementById('dashboardStats').innerHTML = `
            <div class="col-12"><div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> ${err.message}</div></div>
        `;
    }
}

// Rooms
let editingRoomId = null;

function toggleRoomView(view) {
    const cardGrid = document.getElementById('roomsCardGrid');
    const tableSection = document.getElementById('roomsTableSection');
    const cardsBtn = document.getElementById('viewCardsBtn');
    const tableBtn = document.getElementById('viewTableBtn');

    if (view === 'cards') {
        cardGrid.classList.remove('d-none');
        tableSection.classList.add('d-none');
        cardsBtn.classList.add('active');
        tableBtn.classList.remove('active');
    } else {
        cardGrid.classList.add('d-none');
        tableSection.classList.remove('d-none');
        cardsBtn.classList.remove('active');
        tableBtn.classList.add('active');
    }
}

function renderRoomCards(data) {
    const grid = document.getElementById('roomsCardGrid');
    if (!grid) return;

    if (data.length === 0) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-door-closed"></i>
                    No rooms found. Add your first room above.
                </div>
            </div>`;
        return;
    }

    grid.innerHTML = data.map(room => `
        <div class="col-sm-6 col-lg-4 col-xl-3">
            <div class="room-card">
                <div class="room-card-img">
                    <img src="${getRoomImage(room.room_type)}" alt="${room.room_type} Room">
                    <span class="room-badge">${getStatusBadge(room.status)}</span>
                </div>
                <div class="room-card-body">
                    <h6>Room ${room.room_number}</h6>
                    <p class="room-type"><i class="bi bi-house"></i> ${room.room_type}</p>
                    <div class="room-price">${formatCurrency(room.price_per_night)} <small>/ night</small></div>
                    <div class="room-card-actions">
                        <button class="btn btn-sm btn-outline-primary flex-fill" onclick="editRoom(${room.id})">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger flex-fill" onclick="deleteRoom(${room.id})">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadRooms() {
    showLoading('roomsTableBody');
    const grid = document.getElementById('roomsCardGrid');
    if (grid) {
        grid.innerHTML = `<div class="col-12"><div class="loading-spinner"><div class="spinner-border text-primary"></div></div></div>`;
    }

    try {
        const { data } = await apiRequest('/rooms');
        renderRoomCards(data);

        const tbody = document.getElementById('roomsTableBody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No rooms found.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(room => `
            <tr>
                <td><img src="${getRoomImage(room.room_type)}" alt="${room.room_type}" class="room-thumb"></td>
                <td>${room.id}</td>
                <td><strong>${room.room_number}</strong></td>
                <td>${room.room_type}</td>
                <td>${formatCurrency(room.price_per_night)}</td>
                <td>${getStatusBadge(room.status)}</td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-outline-primary" onclick="editRoom(${room.id})"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRoom(${room.id})"><i class="bi bi-trash"></i> Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        if (grid) grid.innerHTML = `<div class="col-12"><div class="alert alert-danger">${err.message}</div></div>`;
        const tbody = document.getElementById('roomsTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">${err.message}</td></tr>`;
    }
}

function resetRoomForm() {
    editingRoomId = null;
    document.getElementById('roomForm').reset();
    document.getElementById('roomFormTitle').innerHTML = '<i class="bi bi-plus-circle"></i> Add New Room';
    document.getElementById('roomSubmitBtn').innerHTML = '<i class="bi bi-plus-lg"></i> Add Room';
    document.getElementById('roomCancelBtn').classList.add('d-none');
    clearValidationStyles('roomForm');
}

async function editRoom(id) {
    try {
        const { data } = await apiRequest(`/rooms/${id}`);
        editingRoomId = id;
        document.getElementById('room_number').value = data.room_number;
        document.getElementById('room_type').value = data.room_type;
        document.getElementById('price_per_night').value = data.price_per_night;
        document.getElementById('room_status').value = data.status;
        document.getElementById('roomFormTitle').innerHTML = '<i class="bi bi-pencil"></i> Edit Room';
        document.getElementById('roomSubmitBtn').innerHTML = '<i class="bi bi-check-lg"></i> Update Room';
        document.getElementById('roomCancelBtn').classList.remove('d-none');
        clearValidationStyles('roomForm');
        document.getElementById('roomForm').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

async function deleteRoom(id) {
    if (!confirmDelete('Are you sure you want to delete this room?')) return;

    try {
        const { message } = await apiRequest(`/rooms/${id}`, { method: 'DELETE' });
        showAlert(message);
        loadRooms();
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

function initRoomForm() {
    const form = document.getElementById('roomForm');
    if (!form) return;

    const numEl = document.getElementById('room_number');
    const typeEl = document.getElementById('room_type');
    const priceEl = document.getElementById('price_per_night');
    const statusEl = document.getElementById('room_status');

    // Real-time listeners
    numEl?.addEventListener('input', () => {
        validateField(numEl, val => /^[a-zA-Z0-9-]{1,10}$/.test(val.trim()), 'room_number_error', 'Room number is required (1-10 chars, letters/digits/dashes only).');
    });

    typeEl?.addEventListener('change', () => {
        validateField(typeEl, val => val.trim() !== '', 'room_type_error', 'Please select a room type.');
    });

    priceEl?.addEventListener('input', () => {
        validateField(priceEl, val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'price_per_night_error', 'Price must be greater than zero.');
    });

    statusEl?.addEventListener('change', () => {
        validateField(statusEl, val => ['Available', 'Occupied'].includes(val), 'room_status_error', 'Please select a status.');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Perform strict validation
        const vNum = validateField(numEl, val => /^[a-zA-Z0-9-]{1,10}$/.test(val.trim()), 'room_number_error', 'Room number is required (1-10 chars, letters/digits/dashes only).');
        const vType = validateField(typeEl, val => val.trim() !== '', 'room_type_error', 'Please select a room type.');
        const vPrice = validateField(priceEl, val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'price_per_night_error', 'Price must be greater than zero.');
        const vStatus = validateField(statusEl, val => ['Available', 'Occupied'].includes(val), 'room_status_error', 'Please select a status.');

        if (!vNum || !vType || !vPrice || !vStatus) {
            shakeElement(form.closest('.content-card'));
            showAlert('Please fix the validation errors in the form.', 'danger');
            return;
        }

        const btn = document.getElementById('roomSubmitBtn');
        setButtonLoading(btn, true);

        const payload = {
            room_number: numEl.value.trim(),
            room_type: typeEl.value.trim(),
            price_per_night: parseFloat(priceEl.value),
            status: statusEl.value
        };

        try {
            if (editingRoomId) {
                const { message } = await apiRequest(`/rooms/${editingRoomId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showAlert(message);
            } else {
                const { message } = await apiRequest('/rooms', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showAlert(message);
            }
            resetRoomForm();
            loadRooms();
        } catch (err) {
            showAlert(err.message, 'danger');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    document.getElementById('roomCancelBtn')?.addEventListener('click', resetRoomForm);
}

// Guests
let editingGuestId = null;

async function loadGuests() {
    showLoading('guestsTableBody');
    try {
        const { data } = await apiRequest('/guests');
        const tbody = document.getElementById('guestsTableBody');

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="bi bi-people"></i> No guests found.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(guest => `
            <tr>
                <td>
                    <div class="guest-cell">
                        <div class="guest-avatar">${getInitials(guest.full_name)}</div>
                        <div>
                            <strong>${guest.full_name}</strong>
                            <div class="text-muted small">ID: ${guest.id}</div>
                        </div>
                    </div>
                </td>
                <td>${guest.cnic}</td>
                <td><i class="bi bi-telephone text-muted"></i> ${guest.phone}</td>
                <td><i class="bi bi-envelope text-muted"></i> ${guest.email}</td>
                <td>${guest.address}</td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-outline-primary" onclick="editGuest(${guest.id})"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteGuest(${guest.id})"><i class="bi bi-trash"></i> Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        document.getElementById('guestsTableBody').innerHTML = `
            <tr><td colspan="6" class="text-danger text-center">${err.message}</td></tr>
        `;
    }
}

function resetGuestForm() {
    editingGuestId = null;
    document.getElementById('guestForm').reset();
    document.getElementById('guestFormTitle').innerHTML = '<i class="bi bi-person-plus"></i> Add New Guest';
    document.getElementById('guestSubmitBtn').innerHTML = '<i class="bi bi-person-plus"></i> Add Guest';
    document.getElementById('guestCancelBtn').classList.add('d-none');
    clearValidationStyles('guestForm');
}

async function editGuest(id) {
    try {
        const { data } = await apiRequest(`/guests/${id}`);
        editingGuestId = id;
        document.getElementById('full_name').value = data.full_name;
        document.getElementById('cnic').value = data.cnic;
        document.getElementById('phone').value = data.phone;
        document.getElementById('email').value = data.email;
        document.getElementById('address').value = data.address;
        document.getElementById('guestFormTitle').innerHTML = '<i class="bi bi-pencil"></i> Edit Guest';
        document.getElementById('guestSubmitBtn').innerHTML = '<i class="bi bi-check-lg"></i> Update Guest';
        document.getElementById('guestCancelBtn').classList.remove('d-none');
        clearValidationStyles('guestForm');
        document.getElementById('guestForm').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

async function deleteGuest(id) {
    if (!confirmDelete('Are you sure you want to delete this guest?')) return;

    try {
        const { message } = await apiRequest(`/guests/${id}`, { method: 'DELETE' });
        showAlert(message);
        loadGuests();
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

function initGuestForm() {
    const form = document.getElementById('guestForm');
    if (!form) return;

    const nameEl = document.getElementById('full_name');
    const cnicEl = document.getElementById('cnic');
    const phoneEl = document.getElementById('phone');
    const emailEl = document.getElementById('email');
    const addressEl = document.getElementById('address');

    // Validators
    const nameValFn = val => /^[a-zA-Z\s]{3,100}$/.test(val.trim());
    const cnicValFn = val => /^\d{5}-\d{7}-\d{1}$/.test(val.trim());
    const phoneValFn = val => /^(03\d{9}|03\d{2}-\d{7})$/.test(val.trim());
    const emailValFn = val => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim());
    const addressValFn = val => val.trim().length >= 10;

    // Autoformatters & Input triggers
    nameEl?.addEventListener('input', () => {
        validateField(nameEl, nameValFn, 'full_name_error', 'Name must be at least 3 characters long and contain only letters and spaces.');
    });

    cnicEl?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 13) value = value.substring(0, 13);
        let formatted = '';
        if (value.length > 0) formatted += value.substring(0, 5);
        if (value.length > 5) formatted += '-' + value.substring(5, 12);
        if (value.length > 12) formatted += '-' + value.substring(12, 13);
        e.target.value = formatted;
        validateField(cnicEl, cnicValFn, 'cnic_error', 'Please enter a valid CNIC in 12345-6789012-3 format.');
    });

    phoneEl?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        let formatted = '';
        if (value.length > 0) formatted += value.substring(0, 4);
        if (value.length > 4) formatted += '-' + value.substring(4, 11);
        e.target.value = formatted;
        validateField(phoneEl, phoneValFn, 'phone_error', 'Please enter a valid Pakistani mobile number (e.g. 0300-1234567 or 03001234567).');
    });

    emailEl?.addEventListener('input', () => {
        validateField(emailEl, emailValFn, 'email_error', 'Please enter a valid email address.');
    });

    addressEl?.addEventListener('input', () => {
        validateField(addressEl, addressValFn, 'address_error', 'Address must be at least 10 characters long.');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Strictly validate all fields
        const vName = validateField(nameEl, nameValFn, 'full_name_error', 'Name must be at least 3 characters long and contain only letters and spaces.');
        const vCnic = validateField(cnicEl, cnicValFn, 'cnic_error', 'Please enter a valid CNIC in 12345-6789012-3 format.');
        const vPhone = validateField(phoneEl, phoneValFn, 'phone_error', 'Please enter a valid Pakistani mobile number (e.g. 0300-1234567).');
        const vEmail = validateField(emailEl, emailValFn, 'email_error', 'Please enter a valid email address.');
        const vAddress = validateField(addressEl, addressValFn, 'address_error', 'Address must be at least 10 characters long.');

        if (!vName || !vCnic || !vPhone || !vEmail || !vAddress) {
            shakeElement(form.closest('.content-card'));
            showAlert('Please resolve the errors in the form.', 'danger');
            return;
        }

        const btn = document.getElementById('guestSubmitBtn');
        setButtonLoading(btn, true);

        const payload = {
            full_name: nameEl.value.trim(),
            cnic: cnicEl.value.trim(),
            phone: phoneEl.value.trim(),
            email: emailEl.value.trim(),
            address: addressEl.value.trim()
        };

        try {
            if (editingGuestId) {
                const { message } = await apiRequest(`/guests/${editingGuestId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showAlert(message);
            } else {
                const { message } = await apiRequest('/guests', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showAlert(message);
            }
            resetGuestForm();
            loadGuests();
        } catch (err) {
            showAlert(err.message, 'danger');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    document.getElementById('guestCancelBtn')?.addEventListener('click', resetGuestForm);
}

// Bookings
let editingBookingId = null;

async function loadBookingOptions() {
    try {
        const [guestsRes, roomsRes] = await Promise.all([
            apiRequest('/guests'),
            apiRequest('/rooms')
        ]);

        roomsCache = roomsRes.data;
        const guestSelect = document.getElementById('booking_guest');
        const roomSelect = document.getElementById('booking_room');

        if (guestSelect) {
            guestSelect.innerHTML = '<option value="">Select Guest</option>' +
                guestsRes.data.map(g => `<option value="${g.id}">${g.full_name} (${g.cnic})</option>`).join('');
        }

        if (roomSelect) {
            // Keep the old room option if editing so we don't block selecting the occupied room currently assigned to this booking
            roomSelect.innerHTML = '<option value="">Select Room</option>' +
                roomsRes.data.map(r => {
                    const isOccupiedByAnother = r.status === 'Occupied';
                    const disabledStr = isOccupiedByAnother ? 'disabled' : '';
                    const statusStr = isOccupiedByAnother ? 'Occupied' : 'Available';
                    return `<option value="${r.id}" data-type="${r.room_type}" data-price="${r.price_per_night}" ${disabledStr}>${r.room_number} - ${r.room_type} (${statusStr}) - ${formatCurrency(r.price_per_night)}/night</option>`;
                }).join('');
        }

        updateBookingPreview();
    } catch (err) {
        showAlert('Failed to load form options: ' + err.message, 'danger');
    }
}

function updateBookingPreview() {
    const previewAmount = document.getElementById('previewAmount');
    const previewNights = document.getElementById('previewNights');
    const previewImage = document.getElementById('previewImage');
    if (!previewAmount) return;

    const roomSelect = document.getElementById('booking_room');
    const checkIn = document.getElementById('check_in')?.value;
    const checkOut = document.getElementById('check_out')?.value;

    const selectedOption = roomSelect?.selectedOptions[0];
    const roomType = selectedOption?.dataset.type;
    const price = parseFloat(selectedOption?.dataset.price) || 0;

    if (roomType && previewImage) {
        previewImage.src = getRoomImage(roomType);
    }

    if (!checkIn || !checkOut || !price) {
        previewAmount.textContent = '$0.00';
        previewNights.textContent = 'Select room and dates';
        return;
    }

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
        previewAmount.textContent = '$0.00';
        previewNights.textContent = 'Check-out must be after check-in';
        return;
    }

    const total = nights * price;
    previewAmount.textContent = formatCurrency(total);
    previewNights.textContent = `${nights} night${nights > 1 ? 's' : ''} × ${formatCurrency(price)}/night`;
}

async function loadBookings() {
    showLoading('bookingsTableBody');
    try {
        const { data } = await apiRequest('/bookings');
        const tbody = document.getElementById('bookingsTableBody');

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="bi bi-calendar-x"></i> No bookings found.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(booking => `
            <tr>
                <td><span class="badge bg-primary rounded-pill">#${booking.id}</span></td>
                <td>
                    <div class="guest-cell">
                        <div class="guest-avatar">${getInitials(booking.guest_name)}</div>
                        <span>${booking.guest_name}</span>
                    </div>
                </td>
                <td>
                    <img src="${getRoomImage(booking.room_type)}" alt="${booking.room_type}" class="room-thumb me-2">
                    ${booking.room_number} <small class="text-muted">(${booking.room_type})</small>
                </td>
                <td><i class="bi bi-box-arrow-in-right text-success"></i> ${formatDate(booking.check_in)}</td>
                <td><i class="bi bi-box-arrow-right text-danger"></i> ${formatDate(booking.check_out)}</td>
                <td><strong class="text-primary">${formatCurrency(booking.total_amount)}</strong></td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-outline-primary" onclick="editBooking(${booking.id})"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBooking(${booking.id})"><i class="bi bi-trash"></i> Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        document.getElementById('bookingsTableBody').innerHTML = `
            <tr><td colspan="7" class="text-danger text-center">${err.message}</td></tr>
        `;
    }
}

function resetBookingForm() {
    editingBookingId = null;
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingFormTitle').innerHTML = '<i class="bi bi-calendar-plus"></i> Create Booking';
    document.getElementById('bookingSubmitBtn').innerHTML = '<i class="bi bi-check-lg"></i> Create Booking';
    document.getElementById('bookingCancelBtn').classList.add('d-none');
    clearValidationStyles('bookingForm');
    loadBookingOptions();
}

async function editBooking(id) {
    try {
        await loadBookingOptions();
        const { data } = await apiRequest(`/bookings/${id}`);
        editingBookingId = id;

        // Temporarily add back and select the booked room even if it is marked as 'Occupied' so it shows up in select
        const roomSelect = document.getElementById('booking_room');
        const roomExists = Array.from(roomSelect.options).some(opt => opt.value == data.room_id);
        
        if (!roomExists) {
            const opt = document.createElement('option');
            opt.value = data.room_id;
            opt.textContent = `Room ${data.room_number} (Currently Booked)`;
            opt.dataset.type = data.room_type;
            // Fetch price from cache
            const cachedRoom = roomsCache.find(r => r.id == data.room_id);
            opt.dataset.price = cachedRoom ? cachedRoom.price_per_night : 0;
            roomSelect.appendChild(opt);
        }

        document.getElementById('booking_guest').value = data.guest_id;
        document.getElementById('booking_room').value = data.room_id;
        document.getElementById('check_in').value = data.check_in.split('T')[0];
        document.getElementById('check_out').value = data.check_out.split('T')[0];
        
        document.getElementById('bookingFormTitle').innerHTML = '<i class="bi bi-pencil"></i> Edit Booking';
        document.getElementById('bookingSubmitBtn').innerHTML = '<i class="bi bi-check-lg"></i> Update Booking';
        document.getElementById('bookingCancelBtn').classList.remove('d-none');
        clearValidationStyles('bookingForm');
        updateBookingPreview();
        document.getElementById('bookingForm').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

async function deleteBooking(id) {
    if (!confirmDelete('Are you sure you want to delete this booking? The room will be marked as available.')) return;

    try {
        const { message } = await apiRequest(`/bookings/${id}`, { method: 'DELETE' });
        showAlert(message);
        loadBookings();
        loadBookingOptions();
    } catch (err) {
        showAlert(err.message, 'danger');
    }
}

function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    const guestEl = document.getElementById('booking_guest');
    const roomEl = document.getElementById('booking_room');
    const inEl = document.getElementById('check_in');
    const outEl = document.getElementById('check_out');

    // Date validators
    const checkInValFn = val => {
        if (!val) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDate = new Date(val);
        checkInDate.setHours(0, 0, 0, 0);
        return checkInDate >= today;
    };

    const checkOutValFn = val => {
        const checkInVal = inEl?.value;
        if (!checkInVal || !val) return false;
        const checkInDate = new Date(checkInVal);
        const checkOutDate = new Date(val);
        return checkOutDate > checkInDate;
    };

    // Live Change and Validation triggers
    ['booking_room', 'check_in', 'check_out'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateBookingPreview);
    });

    guestEl?.addEventListener('change', () => {
        validateField(guestEl, val => val !== '' && parseInt(val) > 0, 'booking_guest_error', 'Please select a guest.');
    });

    roomEl?.addEventListener('change', () => {
        validateField(roomEl, val => val !== '' && parseInt(val) > 0, 'booking_room_error', 'Please select a room.');
    });

    inEl?.addEventListener('change', () => {
        validateField(inEl, checkInValFn, 'check_in_error', 'Check-in date cannot be in the past.');
        // Re-validate checkout as check-in changes
        if (outEl?.value) {
            validateField(outEl, checkOutValFn, 'check_out_error', 'Check-out date must be after the check-in date.');
        }
    });

    outEl?.addEventListener('change', () => {
        validateField(outEl, checkOutValFn, 'check_out_error', 'Check-out date must be after the check-in date.');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Perform strict validation
        const vGuest = validateField(guestEl, val => val !== '' && parseInt(val) > 0, 'booking_guest_error', 'Please select a guest.');
        const vRoom = validateField(roomEl, val => val !== '' && parseInt(val) > 0, 'booking_room_error', 'Please select a room.');
        const vIn = validateField(inEl, checkInValFn, 'check_in_error', 'Check-in date cannot be in the past.');
        const vOut = validateField(outEl, checkOutValFn, 'check_out_error', 'Check-out date must be after the check-in date.');

        if (!vGuest || !vRoom || !vIn || !vOut) {
            shakeElement(form.closest('.content-card'));
            showAlert('Please fix the booking details before submitting.', 'danger');
            return;
        }

        const btn = document.getElementById('bookingSubmitBtn');
        setButtonLoading(btn, true);

        const payload = {
            guest_id: parseInt(guestEl.value),
            room_id: parseInt(roomEl.value),
            check_in: inEl.value,
            check_out: outEl.value
        };

        try {
            if (editingBookingId) {
                const { message } = await apiRequest(`/bookings/${editingBookingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                showAlert(message);
            } else {
                const { message, data } = await apiRequest('/bookings', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showAlert(`${message} Total: ${formatCurrency(data.total_amount)}`);
            }
            resetBookingForm();
            loadBookings();
        } catch (err) {
            showAlert(err.message, 'danger');
        } finally {
            setButtonLoading(btn, false);
        }
    });

    document.getElementById('bookingCancelBtn')?.addEventListener('click', resetBookingForm);
}

document.addEventListener('DOMContentLoaded', async () => {
    if (isAdminPage() && !(await requireAdminAccess())) return;

    setActiveNav();
    initScrollReveal();
    initNavbarScroll();

    if (document.getElementById('dashboardStats')) loadDashboard();
    if (document.getElementById('roomsTableBody')) {
        loadRooms();
        initRoomForm();
    }
    if (document.getElementById('guestsTableBody')) {
        loadGuests();
        initGuestForm();
    }
    if (document.getElementById('bookingsTableBody')) {
        loadBookingOptions();
        loadBookings();
        initBookingForm();
    }
});
