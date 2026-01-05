const API_BASE = "http://127.0.0.1:5000";

// Get logged in admin
const admin = JSON.parse(localStorage.getItem("user"));
if (!admin || admin.role !== "admin") {
  window.location.href = "login.html";
}

/* ===============================
   LOAD ADMIN BOOKINGS
================================ */
async function loadAdminBookings() {
  const container = document.getElementById("admin-bookings");
  container.innerHTML = "<p>Loading bookings...</p>";

  try {
    const res = await fetch(
      `${API_BASE}/api/admin/bookings?admin_id=${admin.id}`
    );

    const bookings = await res.json();

    if (!bookings.length) {
      container.innerHTML = "<p>No bookings yet</p>";
      return;
    }

    // Group bookings by service
    const grouped = {};
    bookings.forEach(b => {
      if (!grouped[b.service_name]) {
        grouped[b.service_name] = [];
      }
      grouped[b.service_name].push(b);
    });

    container.innerHTML = "";

    for (const service in grouped) {
      const section = document.createElement("div");
      section.className = "card";
      section.innerHTML = `<h3>${service}</h3>`;

      grouped[service].forEach(b => {
        const card = document.createElement("div");
        card.className = "booking-card";

        card.innerHTML = `
          <p><strong>${b.client_name}</strong> (${b.client_email})</p>
          <p>Date: ${new Date(b.booking_date).toLocaleDateString()}</p>
          <p>Time: ${b.time_slot}</p>
          <p>Status: <strong>${b.status}</strong></p>

          ${
            b.is_rated
              ? `<p>⭐ Rated</p>`
              : `<p><em>No rating yet</em></p>`
          }

          ${
            b.status === "pending"
              ? `
                <button class="btn btn-success"
                  onclick="updateBookingStatus(${b.booking_id}, 'completed')">
                  Mark Completed
                </button>

                <button class="btn btn-danger"
                  onclick="updateBookingStatus(${b.booking_id}, 'cancelled')">
                  Cancel
                </button>
              `
              : ""
          }

          <hr/>
        `;

        section.appendChild(card);
      });

      container.appendChild(section);
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading bookings</p>";
  }
}

/* ===============================
   UPDATE BOOKING STATUS
================================ */
async function updateBookingStatus(id, status) {
  if (!confirm(`Mark booking as ${status}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/bookings/update-status/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "Failed to update booking");

    alert("Booking updated!");
    loadAdminBookings();
  } catch (err) {
    alert("Server error updating booking");
    console.error(err);
  }
}

/* ===============================
   INIT
================================ */
loadAdminBookings();

// Expose for inline onclick()
window.updateBookingStatus = updateBookingStatus;
