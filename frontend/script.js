const API_BASE = "http://127.0.0.1:5000";

let services = [];
let selectedTimeSlot = null;

/* ---------------- GET USER SESSION ---------------- */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("user"));
}

/* ---------------- NAVIGATION ---------------- */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "my-bookings") loadMyBookings();
}

/* ---------------- FETCH SERVICES (CITY FILTER) ---------------- */
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
  }
}

/* ---------------- RENDER SERVICES GRID ---------------- */
function renderServices() {
  const grid = document.getElementById("services-grid");
  if (!grid) return;
  grid.innerHTML = "";

  services.forEach(s => {
    const card = document.createElement("div");
    card.className = "service-card";

    card.innerHTML = `
      <h3>${s.provider_name || "Service Provider"}</h3>
      <p><strong>Service:</strong> ${s.service_name}</p>
      <p><strong>Price:</strong> ₹${s.price}</p>
      <p><strong>Rating:</strong> ⭐ ${s.avg_rating || 0} (${s.rating_count || 0})</p>

      ${
        s.map_url 
          ? `<p><a href="${s.map_url}" target="_blank" class="map-link">📍 View Location</a></p>`
          : ""
      }

      <button onclick="startBooking('${s.id}')">Book Now</button>
    `;
    grid.appendChild(card);
  });
}

/* ---------------- START BOOKING ---------------- */
function startBooking(id) {
  showPage("book");
  document.getElementById("service-select").value = id;
  document.getElementById("date-select").value = new Date().toISOString().split("T")[0];
  loadTimeSlots();
}

/* ---------------- INITIALIZE BOOKING FORM ---------------- */
function initBookingForm() {
  const select = document.getElementById("service-select");
  if (!select) return;

  select.innerHTML = `<option value="">Select Service</option>`;
  services.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.provider_name || ""} - ${s.service_name} (₹${s.price})`;
    select.appendChild(opt);
  });
}

/* ---------------- LOAD AVAILABLE SLOTS ---------------- */
async function loadTimeSlots() {
  const serviceId = document.getElementById("service-select").value;
  const date = document.getElementById("date-select").value;
  const grid = document.getElementById("time-slots-grid");

  if (!serviceId || !date) return (grid.innerHTML = "Choose service and date");
  grid.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/api/time-slots?service_id=${serviceId}&date=${date}`);
    const slots = await res.json();
    if (!slots.length) return (grid.innerHTML = "No slots available");

    grid.innerHTML = "";
    let unique = Array.from(new Map(slots.map(s => [`${s.start_time}-${s.end_time}`, s])).values());

    unique.forEach(slot => {
      const div = document.createElement("div");
      div.className = "time-slot";
      div.textContent = `${slot.start_time.slice(0,5)} - ${slot.end_time.slice(0,5)}`;
      div.onclick = () => {
        selectedTimeSlot = { id: slot.id, date };
        document.getElementById("customer-form-section").style.display = "block";
      };
      grid.appendChild(div);
    });
  } catch {
    grid.innerHTML = "Error loading slots";
  }
}

/* ---------------- SUBMIT BOOKING ---------------- */
async function submitBooking(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return alert("Login required");

  if (!selectedTimeSlot) return alert("Select time slot first!");

  const name = document.getElementById("customer-name").value.trim();
  const email = document.getElementById("customer-email").value.trim();
  const service_id = document.getElementById("service-select").value;

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
  if (!res.ok) return alert(data.error);

  alert("Booking Confirmed!");
  showPage("my-bookings");
}

/* ---------------- LOAD USER BOOKINGS ---------------- */
async function loadMyBookings() {
  const user = getCurrentUser();
  if (!user) return;

  const list = document.getElementById("bookings-list");
  list.innerHTML = "Loading...";

  const res = await fetch(`${API_BASE}/api/bookings?user_id=${user.id}`);
  const data = await res.json();

  if (!data.length) return (list.innerHTML = "<p>No bookings found</p>");

  list.innerHTML = "";
  data.forEach(b => {
    const id = b.booking_id ?? b.id;
    list.innerHTML += `
      <div class="booking-card">
        <h3>${b.service_name}</h3>
        <p>${new Date(b.booking_date).toLocaleDateString()}</p>
        <p>${b.time_slot}</p>
        <p>Status: <strong>${b.status}</strong></p>

        ${
          b.status === "completed" && !b.is_rated
            ? `<button class="btn-rate" onclick="openRatingModal(${id})">⭐ Rate Appointment</button>`
            : b.status === "completed" && b.is_rated
            ? `<p class="rated-text">⭐ Already Rated</p>`
            : ""
        }
      </div>
    `;
  });
}

/* ---------------- RATING MODAL ---------------- */
let modalBookingId = null;

function openRatingModal(id) {
  modalBookingId = id;
  document.getElementById("rating-booking-id").value = id;
  document.getElementById("rating-modal").style.display = "flex";
}

function closeRatingModal() {
  document.getElementById("rating-modal").style.display = "none";
}

function attachStarRating(id) {
  const container = document.getElementById(id);
  container.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    let star = document.createElement("span");
    star.className = "star";
    star.innerHTML = "★";
    star.dataset.value = i;
    star.onclick = () => {
      [...container.children].forEach((s, index) => {
        s.classList.toggle("selected", index < i);
      });
      container.dataset.value = i;
    };
    container.appendChild(star);
  }
}

attachStarRating("overall-rating");

async function submitRating(event) {
  event.preventDefault();

  const bookingId = modalBookingId;
  const rating = Number(document.getElementById("overall-rating").dataset.value || 0);
  const comment = document.getElementById("rating-comment").value;

  if (!rating) return alert("Please select rating ⭐");

  const res = await fetch(`${API_BASE}/api/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking_id: bookingId, rating, comment })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  alert("⭐ Rating submitted!");
  closeRatingModal();
  loadMyBookings();
}

window.onclick = (e) => {
  if (e.target.id === "rating-modal") closeRatingModal();
};

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (!user || user.role !== "client") return (window.location.href = "login.html");

  showPage("home");
  fetchServices();
});
