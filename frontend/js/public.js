const ROOM_IMAGES = {
    Single: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80',
    Double: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&q=80',
    Deluxe: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
    Suite: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80'
};

const ROOM_INFO = {
    Single: 'Cozy room ideal for solo travelers.',
    Double: 'Spacious comfort for two guests.',
    Deluxe: 'Premium decor with city views.',
    Suite: 'Luxury suite with lounge area.'
};

let roomsData = [];

function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    const icon = type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill';
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `<i class="bi bi-${icon} me-2"></i>${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('visible');
    });
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelectorAll('#publicNav .nav-link').forEach(el => el.classList.remove('active'));
            if (link.classList.contains('nav-link')) link.classList.add('active');
        });
    });
}

function formatCnicInput(e) {
    let value = e.target.value.replace(/\D/g, '').substring(0, 13);
    if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5);
    if (value.length > 13) value = value.slice(0, 13) + '-' + value.slice(13);
    e.target.value = value;
}

function renderPublicStats(rooms) {
    const statsEl = document.getElementById('publicStats');
    if (!statsEl) return;

    const types = new Set(rooms.map(r => r.room_type)).size;
    statsEl.innerHTML = `
        <div class="col-sm-6 col-lg-3">
            <div class="stat-card available">
                <div class="d-flex justify-content-between align-items-start">
                    <div><h3>${rooms.length}</h3><p>Rooms Available</p></div>
                    <div class="stat-icon"><i class="bi bi-door-open"></i></div>
                </div>
            </div>
        </div>
        <div class="col-sm-6 col-lg-3">
            <div class="stat-card rooms">
                <div class="d-flex justify-content-between align-items-start">
                    <div><h3>${types}</h3><p>Room Categories</p></div>
                    <div class="stat-icon"><i class="bi bi-house"></i></div>
                </div>
            </div>
        </div>
        <div class="col-sm-6 col-lg-3">
            <div class="stat-card bookings">
                <div class="d-flex justify-content-between align-items-start">
                    <div><h3>24/7</h3><p>Guest Support</p></div>
                    <div class="stat-icon"><i class="bi bi-headset"></i></div>
                </div>
            </div>
        </div>
        <div class="col-sm-6 col-lg-3">
            <div class="stat-card occupied">
                <div class="d-flex justify-content-between align-items-start">
                    <div><h3>5★</h3><p>Guest Rating</p></div>
                    <div class="stat-icon"><i class="bi bi-star"></i></div>
                </div>
            </div>
        </div>`;
}

function selectRoomForBooking(roomId) {
    const select = document.getElementById('pub_room');
    if (select) select.value = String(roomId);
    updatePricePreview();
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
}

function updatePricePreview() {
    const preview = document.getElementById('pricePreview');
    const roomId = parseInt(document.getElementById('pub_room').value);
    const checkIn = document.getElementById('pub_check_in').value;
    const checkOut = document.getElementById('pub_check_out').value;
    const room = roomsData.find(r => r.id === roomId);

    if (!room || !checkIn || !checkOut) {
        preview.classList.add('d-none');
        return;
    }

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
        preview.classList.add('d-none');
        return;
    }

    const total = nights * parseFloat(room.price_per_night);
    preview.classList.remove('d-none');
    preview.innerHTML = `<i class="bi bi-calculator me-2"></i><strong>Estimated total:</strong> ${formatCurrency(total)} for ${nights} night(s) at ${formatCurrency(room.price_per_night)}/night`;
}

async function loadPublicRooms() {
    const roomsEl = document.getElementById('publicRooms');
    const roomSelect = document.getElementById('pub_room');
    roomsEl.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-primary"></div></div>';

    try {
        const response = await fetch('/api/public/rooms');
        const { data } = await response.json();
        roomsData = data;

        renderPublicStats(data);

        if (!data.length) {
            roomsEl.innerHTML = '<div class="col-12"><div class="empty-state"><i class="bi bi-door-closed"></i> No rooms available right now. Please check back later.</div></div>';
            roomSelect.innerHTML = '<option value="">No rooms available</option>';
            return;
        }

        roomsEl.innerHTML = data.map(room => `
            <div class="col-sm-6 col-lg-4 col-xl-3">
                <div class="room-card">
                    <div class="room-card-img">
                        <img src="${ROOM_IMAGES[room.room_type] || ROOM_IMAGES.Single}" alt="${room.room_type} Room">
                        <span class="room-badge"><span class="badge badge-available">Available</span></span>
                    </div>
                    <div class="room-card-body">
                        <h6>Room ${room.room_number}</h6>
                        <p class="room-type"><i class="bi bi-house"></i> ${room.room_type}</p>
                        <p class="text-muted small">${ROOM_INFO[room.room_type] || 'Comfortable stay with premium service.'}</p>
                        <div class="room-price">${formatCurrency(room.price_per_night)} <small>/ night</small></div>
                        <div class="room-card-actions">
                            <button type="button" class="btn btn-sm btn-primary flex-fill" onclick="selectRoomForBooking(${room.id})">
                                <i class="bi bi-calendar-check"></i> Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        roomSelect.innerHTML = '<option value="">Select room</option>' + data.map(room =>
            `<option value="${room.id}">Room ${room.room_number} - ${room.room_type} (${formatCurrency(room.price_per_night)})</option>`
        ).join('');
    } catch (err) {
        roomsEl.innerHTML = '<div class="col-12"><p class="text-danger mb-0">Failed to load rooms.</p></div>';
        showAlert('Failed to load available rooms', 'danger');
    }
}

document.getElementById('publicBookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('pubSubmitBtn');
    btn.disabled = true;

    const payload = {
        full_name: document.getElementById('pub_name').value.trim(),
        cnic: document.getElementById('pub_cnic').value.trim(),
        phone: document.getElementById('pub_phone').value.trim(),
        email: document.getElementById('pub_email').value.trim(),
        address: document.getElementById('pub_address').value.trim(),
        room_id: parseInt(document.getElementById('pub_room').value),
        check_in: document.getElementById('pub_check_in').value,
        check_out: document.getElementById('pub_check_out').value
    };

    try {
        const response = await fetch('/api/public/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Booking failed');

        showAlert(`${data.message} Total: ${formatCurrency(data.data.total_amount)}`);
        e.target.reset();
        document.getElementById('pricePreview').classList.add('d-none');
        loadPublicRooms();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        showAlert(err.message, 'danger');
    } finally {
        btn.disabled = false;
    }
});

const today = new Date().toISOString().split('T')[0];
document.getElementById('pub_check_in').min = today;
document.getElementById('pub_check_out').min = today;
document.getElementById('pub_check_in').addEventListener('change', (e) => {
    document.getElementById('pub_check_out').min = e.target.value;
    updatePricePreview();
});
document.getElementById('pub_check_out').addEventListener('change', updatePricePreview);
document.getElementById('pub_room').addEventListener('change', updatePricePreview);
document.getElementById('pub_cnic').addEventListener('input', formatCnicInput);

initScrollReveal();
initNavbarScroll();
initSmoothScroll();
loadPublicRooms();
