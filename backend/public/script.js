const API_BASE = "";

let services = [];
let selectedTimeSlot = null;
let currentFilter = 'all';

/* ============================================
   USER SESSION MANAGEMENT
   ============================================ */
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("user"));
}

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("user");
        window.location.href = "login.html";
    }
}

/* ============================================
   NAVIGATION & UI UPDATES
   ============================================ */
function showPage(id) {
    // Update page visibility
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    // Load data for specific pages
    if (id === "my-bookings") {
        loadMyBookings();
    } else if (id === "services") {
        if (services.length === 0) fetchServices();
    }
}

function updateActiveNav(element) {
    document.querySelectorAll(".sidebar-menu a").forEach(a => a.classList.remove("active"));
    if (element.target) {
        element.target.closest('a').classList.add("active");
    } else {
        element.classList.add("active");
    }
}

/* ============================================
   INITIALIZE USER INFO
   ============================================ */
function initializeUserInfo() {
    const user = getCurrentUser();
    if (!user) return;

    // Update greeting
    const greetingText = document.getElementById("greeting-text");
    const hour = new Date().getHours();
    let greeting = "Good Evening";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    
    greetingText.textContent = `${greeting}, ${user.name}! 👋`;

    // Update email
    document.getElementById("user-email").textContent = user.email;

    // Update avatar
    const avatar = document.getElementById("user-avatar");
    avatar.textContent = user.name.charAt(0).toUpperCase();
}

/* ============================================
   SERVICES MANAGEMENT
   ============================================ */
async function fetchServices() {
    const user = getCurrentUser();
    const city = user?.city || "";

    try {
        const res = await fetch(`${API_BASE}/api/services?city=${encodeURIComponent(city)}`);
        services = await res.json();
        renderServices();
        initBookingForm();
    } catch (err) {
        console.error("Failed to load services:", err);
        showNotification("Failed to load services", "error");
    }
}

function renderServices() {
    const grid = document.getElementById("services-grid");
    if (!grid) return;

    grid.innerHTML = "";

    if (!services.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">😔</div>
                <h3>No Services Available</h3>
                <p>There are no services in your city yet</p>
            </div>
        `;
        return;
    }

    services.forEach(s => {
        const card = document.createElement("div");
        card.className = "service-card";
        
        const avgRating = parseFloat(s.avg_rating || 0).toFixed(1);
        const ratingCount = s.rating_count || 0;

        card.innerHTML = `
            <div class="service-header">
                <div>
                    <h3>${s.provider_name || "Service Provider"}</h3>
                </div>
                <div class="service-price">₹${s.price}</div>
            </div>
            <div class="service-details">
                <p><strong>📋 Service:</strong> ${s.service_name}</p>
                ${s.map_url ? `<p><a href="${s.map_url}" target="_blank" class="map-link" style="color: var(--accent-cyan);">📍 View Location</a></p>` : ""}
                <div class="service-rating">
                    <span class="stars">${"⭐".repeat(Math.round(avgRating))}</span>
                    <span>${avgRating} (${ratingCount} reviews)</span>
                </div>
            </div>
            <div class="service-actions">
                <button class="btn btn-primary" onclick="startBooking('${s.id}')">Book Now →</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

/* ============================================
   BOOKING PROCESS
   ============================================ */
function startBooking(id) {
    showPage("book");
    updateActiveNav(document.querySelectorAll('.sidebar-menu a')[1]);
    
    document.getElementById("service-select").value = id;
    
    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("date-select");
    dateInput.min = today;
    dateInput.value = today;
    
    loadTimeSlots();
}

function initBookingForm() {
    const select = document.getElementById("service-select");
    if (!select) return;

    select.innerHTML = `<option value="">Select a service...</option>`;
    services.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.provider_name || ""} - ${s.service_name} (₹${s.price})`;
        select.appendChild(opt);
    });
}

async function loadTimeSlots() {
    const serviceId = document.getElementById("service-select").value;
    const date = document.getElementById("date-select").value;
    const grid = document.getElementById("time-slots-grid");

    if (!serviceId || !date) {
        grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">Please select service and date first</p>';
        return;
    }

    grid.innerHTML = '<div class="loading" style="grid-column: 1/-1;"><div class="spinner"></div><p>Loading available slots...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/api/time-slots?service_id=${serviceId}&date=${date}`);
        const slots = await res.json();
        
        if (!slots.length) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-state-icon">📭</div>
                    <p>No available slots for this date</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = "";
        let unique = Array.from(new Map(slots.map(s => [`${s.start_time}-${s.end_time}`, s])).values());

        unique.forEach(slot => {
            const div = document.createElement("div");
            div.className = "time-slot";
            div.innerHTML = `
                🕐 ${slot.start_time.slice(0,5)}<br>
                <small style="opacity: 0.7;">${slot.end_time.slice(0,5)}</small>
            `;
            
            div.onclick = () => {
                document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
                div.classList.add('selected');
                
                selectedTimeSlot = { id: slot.id, date };
                document.getElementById("customer-form-section").style.display = "block";
                document.getElementById("customer-form-section").scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };
            
            grid.appendChild(div);
        });
    } catch (err) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">❌</div>
                <p>Error loading slots. Please try again.</p>
            </div>
        `;
    }
}

async function submitBooking(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        alert("Login required");
        window.location.href = "login.html";
        return;
    }

    if (!selectedTimeSlot) {
        showNotification("Please select a time slot first!", "error");
        return;
    }

    const name = document.getElementById("customer-name").value.trim();
    const email = document.getElementById("customer-email").value.trim();
    const service_id = document.getElementById("service-select").value;

    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = 'Booking<span class="spinner" style="margin-left: 8px;"></span>';

    try {
        const res = await fetch(`${API_BASE}/api/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                email,
                service_id: Number(service_id),
                booking_date: selectedTimeSlot.date,
                slot_id: selectedTimeSlot.id,
                booked_by: user.id
            })
        });

        const data = await res.json();
        
        if (!res.ok) {
            showNotification(data.error, "error");
            btn.disabled = false;
            btn.textContent = "Confirm Booking ✓";
            return;
        }

        // Success!
        showSuccessModal("Booking Confirmed! 🎉", "Your appointment has been successfully booked. Check 'My Bookings' for details.");
        
        // Reset form
        event.target.reset();
        document.getElementById("customer-form-section").style.display = "none";
        selectedTimeSlot = null;
        
        setTimeout(() => {
            closeSuccessModal();
            showPage("my-bookings");
            updateActiveNav(document.querySelectorAll('.sidebar-menu a')[2]);
        }, 2000);
        
    } catch (err) {
        showNotification("Booking failed. Please try again.", "error");
        btn.disabled = false;
        btn.textContent = "Confirm Booking ✓";
    }
}

/* ============================================
   MY BOOKINGS
   ============================================ */
async function loadMyBookings() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const list = document.getElementById("bookings-list");
    list.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading your bookings...</p></div>';

    try {
        const res = await fetch(`${API_BASE}/api/bookings?user_id=${user.id}`);
        const data = await res.json();

        if (!data.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <h3>No Bookings Yet</h3>
                    <p>Start booking services to see them here</p>
                    <button class="btn btn-primary" onclick="showPage('services'); updateActiveNav(document.querySelectorAll('.sidebar-menu a')[1])">
                        Browse Services →
                    </button>
                </div>
            `;
            return;
        }

        list.innerHTML = "";
        data.forEach(b => {
            const id = b.booking_id ?? b.id;
            const statusClass = `badge-${b.status}`;
            
            const card = document.createElement('div');
            card.className = 'booking-card';
            card.dataset.status = b.status;
            
            card.innerHTML = `
                <div class="booking-header">
                    <h3>📋 ${b.service_name}</h3>
                    <span class="badge ${statusClass}">${b.status.toUpperCase()}</span>
                </div>
                <div class="booking-details">
                    <div class="booking-detail">
                        <label>📅 Date</label>
                        <span>${new Date(b.booking_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div class="booking-detail">
                        <label>⏰ Time</label>
                        <span>${b.time_slot}</span>
                    </div>
                    <div class="booking-detail">
                        <label>📌 Status</label>
                        <span style="color: var(--accent-primary);">${b.status}</span>
                    </div>
                </div>
                <div class="booking-actions">
                    ${
                        b.status === "completed" && !b.is_rated
                            ? `<button class="btn btn-primary" onclick="openRatingModal(${id})">⭐ Rate Service</button>`
                            : b.status === "completed" && b.is_rated
                            ? `<span style="color: var(--accent-green); font-weight: 600;">✅ Rated</span>`
                            : ""
                    }
                </div>
            `;
            
            list.appendChild(card);
        });
        
        // Apply current filter
        applyBookingFilter(currentFilter);
        
    } catch (err) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Error Loading Bookings</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

function filterBookings(status) {
    currentFilter = status;
    
    // Update tab active state
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    applyBookingFilter(status);
}

function applyBookingFilter(status) {
    const cards = document.querySelectorAll('.booking-card');
    
    cards.forEach(card => {
        const cardStatus = card.dataset.status;
        
        if (status === 'all' || cardStatus === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/* ============================================
   RATING SYSTEM
   ============================================ */
let modalBookingId = null;

function openRatingModal(id) {
    modalBookingId = id;
    document.getElementById("rating-booking-id").value = id;
    document.getElementById("rating-modal").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeRatingModal() {
    document.getElementById("rating-modal").classList.remove("active");
    document.body.style.overflow = "auto";
    document.getElementById("rating-form").reset();
    document.getElementById("overall-rating").dataset.value = "0";
    document.querySelectorAll('#overall-rating .star').forEach(s => {
        s.classList.remove('selected', 'filled');
        s.classList.add('empty');
    });
}

function attachStarRating(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    container.dataset.value = "0";
    
    for (let i = 1; i <= 5; i++) {
        let star = document.createElement("span");
        star.className = "star empty";
        star.innerHTML = "★";
        star.dataset.value = i;
        
        star.onclick = () => {
            [...container.children].forEach((s, index) => {
                if (index < i) {
                    s.classList.remove("empty");
                    s.classList.add("selected", "filled");
                } else {
                    s.classList.remove("selected", "filled");
                    s.classList.add("empty");
                }
            });
            container.dataset.value = i;
        };
        
        container.appendChild(star);
    }
}

async function submitRating(event) {
    event.preventDefault();

    const bookingId = modalBookingId;
    const rating = Number(document.getElementById("overall-rating").dataset.value || 0);
    const comment = document.getElementById("rating-comment").value;

    if (!rating) {
        showNotification("Please select a rating ⭐", "error");
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = 'Submitting<span class="spinner" style="margin-left: 8px;"></span>';

    try {
        const res = await fetch(`${API_BASE}/api/ratings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: bookingId, rating, comment })
        });

        const data = await res.json();
        
        if (!res.ok) {
            showNotification(data.error, "error");
            btn.disabled = false;
            btn.textContent = "Submit Rating ⭐";
            return;
        }

        closeRatingModal();
        showSuccessModal("Rating Submitted! ⭐", "Thank you for your valuable feedback!");
        
        setTimeout(() => {
            closeSuccessModal();
            loadMyBookings();
        }, 1500);
        
    } catch (err) {
        showNotification("Failed to submit rating", "error");
        btn.disabled = false;
        btn.textContent = "Submit Rating ⭐";
    }
}

/* ============================================
   MODALS & NOTIFICATIONS
   ============================================ */
function showSuccessModal(title, message) {
    document.getElementById("success-title").textContent = title;
    document.getElementById("success-message").textContent = message;
    document.getElementById("success-modal").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeSuccessModal() {
    document.getElementById("success-modal").classList.remove("active");
    document.body.style.overflow = "auto";
}

function showNotification(message, type = "info") {
    // Simple alert for now - can be enhanced with custom toast notifications
    alert(message);
}

/* ============================================
   MODAL CLICK OUTSIDE TO CLOSE
   ============================================ */
window.onclick = (e) => {
    if (e.target.id === "rating-modal") closeRatingModal();
    if (e.target.id === "success-modal") closeSuccessModal();
};

/* ============================================
   INITIALIZATION
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();
    
    if (!user || user.role !== "client") {
        window.location.href = "login.html";
        return;
    }

    // Initialize user info
    initializeUserInfo();

    // Set minimum date for booking
    const dateInput = document.getElementById("date-select");
    if (dateInput) {
        dateInput.min = new Date().toISOString().split("T")[0];
    }

    // Initialize star rating
    attachStarRating("overall-rating");
    
    // Load initial data
    showPage("home");
    fetchServices();
});
