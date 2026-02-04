// ============================================
// ADMIN BOOKINGS - Manage Customer Bookings
// ============================================

// API_BASE is already defined in admin-common.js

let allBookings = [];

// Load admin bookings
async function loadAdminBookings() {
    const container = document.getElementById("admin-bookings");

    if (!container) {
        console.error("Bookings container not found");
        return;
    }

    if (!window.admin) {
        console.error("Admin not found in session");
        container.innerHTML = `
            <div class="admin-empty-state">
                <div class="admin-empty-state-icon">❌</div>
                <p>Admin session not found. Please login again.</p>
            </div>
        `;
        return;
    }

    try {
        console.log("Loading bookings for admin:", window.admin.id);
        const res = await fetch(`${API_BASE}/api/admin/bookings?admin_id=${window.admin.id}`);
        
        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }
        
        const bookings = await res.json();
        console.log("Bookings loaded:", bookings);

        allBookings = bookings;

        if (!bookings || bookings.length === 0) {
            container.innerHTML = `
                <div class="admin-empty-state">
                    <div class="admin-empty-state-icon">📖</div>
                    <h3>No Bookings Yet</h3>
                    <p>Customer bookings will appear here</p>
                </div>
            `;
            return;
        }

        renderBookings(bookings);
        console.log("Bookings rendered successfully");

    } catch (err) {
        console.error("Error loading bookings:", err);
        container.innerHTML = `
            <div class="admin-empty-state">
                <div class="admin-empty-state-icon">❌</div>
                <h3>Error Loading Bookings</h3>
                <p>Check console for details</p>
            </div>
        `;
    }
}

// Render bookings
function renderBookings(bookings) {
    const container = document.getElementById("admin-bookings");
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <div class="admin-empty-state-icon">📖</div>
                <h3>No Bookings Found</h3>
                <p>No bookings match the selected filter</p>
            </div>
        `;
        return;
    }
    
    // Group by service
    const grouped = {};
    bookings.forEach(b => {
        const serviceName = b.service_name || "Unknown Service";
        if (!grouped[serviceName]) {
            grouped[serviceName] = [];
        }
        grouped[serviceName].push(b);
    });

    container.innerHTML = "";

    for (const service in grouped) {
        const section = document.createElement("div");
        section.className = "admin-section";
        section.innerHTML = `<h3 class="admin-section-title">${service}</h3>`;

        grouped[service].forEach(b => {
            const statusClass = `badge-${b.status}`;
            const bookingId = b.booking_id || b.id;

            const card = document.createElement("div");
            card.className = "admin-booking-card";
            card.dataset.status = b.status;
            
            card.innerHTML = `
                <div class="admin-booking-header">
                    <h4 style="color: #ffffff; font-size: 18px; margin: 0;">
                        👤 ${b.client_name || "Unknown"}
                    </h4>
                    <span class="badge ${statusClass}">${b.status.toUpperCase()}</span>
                </div>
                <div class="admin-booking-details">
                    <div class="admin-booking-detail">
                        <label>📧 Email</label>
                        <span>${b.client_email || "N/A"}</span>
                    </div>
                    <div class="admin-booking-detail">
                        <label>📅 Date</label>
                        <span>${new Date(b.booking_date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                    <div class="admin-booking-detail">
                        <label>⏰ Time</label>
                        <span>${b.time_slot || "N/A"}</span>
                    </div>
                    <div class="admin-booking-detail">
                        <label>💰 Price</label>
                        <span>₹${b.price || "N/A"}</span>
                    </div>
                    <div class="admin-booking-detail">
                        <label>⭐ Rating</label>
                        <span>${b.is_rated ? `${b.rating}/5` : 'Not rated'}</span>
                    </div>
                </div>
                ${
                    b.status === "pending"
                        ? `
                        <div class="booking-actions" style="display: flex; gap: 12px; margin-top: 16px;">
                            <button class="btn btn-success" onclick="updateBookingStatus(${bookingId}, 'completed')">
                                ✅ Mark Completed
                            </button>
                            <button class="btn btn-danger" onclick="updateBookingStatus(${bookingId}, 'cancelled')">
                                ❌ Cancel
                            </button>
                        </div>
                        `
                        : ""
                }
            `;

            section.appendChild(card);
        });

        container.appendChild(section);
    }
}

// Update booking status
async function updateBookingStatus(id, status) {
    if (!confirm(`Are you sure you want to mark this booking as ${status}?`)) return;

    try {
        console.log("Updating booking:", id, "to", status);
        
        const res = await fetch(`${API_BASE}/api/bookings/update-status/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || "Failed to update booking");
        }

        console.log("Booking updated successfully");
        showNotification(`✅ Booking marked as ${status}!`);
        loadAdminBookings();

    } catch (err) {
        console.error("Error updating booking:", err);
        showNotification(err.message || "Server error. Please try again.", "error");
    }
}

// Filter bookings by status
function filterByStatus(status) {
    console.log("Filtering bookings by:", status);
    
    // Update active tab
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    // Filter bookings
    if (status === "all") {
        renderBookings(allBookings);
    } else {
        const filtered = allBookings.filter(b => b.status === status);
        console.log("Filtered bookings:", filtered.length);
        renderBookings(filtered);
    }
}

// Expose functions globally
window.updateBookingStatus = updateBookingStatus;
window.filterByStatus = filterByStatus;

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("Bookings page initializing...");
        loadAdminBookings();
    });
} else {
    console.log("Bookings page initializing (already loaded)...");
    loadAdminBookings();
}
