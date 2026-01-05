const API_BASE = "http://127.0.0.1:5000";

// ✨ FIX — Load admin session only once
let admin = window.admin || JSON.parse(localStorage.getItem("user"));
window.admin = admin;

// Redirect if session missing
if (!admin || admin.role !== "admin") {
  window.location.href = "../login.html";
}

/* ===============================
   LOAD SERVICES
================================ */
async function loadAdminServices() {
  const container = document.getElementById("admin-services-list");
  container.innerHTML = "<p>Loading services...</p>";

  try {
    const res = await fetch(`${API_BASE}/api/admin/services?admin_id=${admin.id}`);
    const services = await res.json();

    if (!services.length) {
      container.innerHTML = "<p>No services added yet</p>";
      return;
    }

    container.innerHTML = "";

    services.forEach(s => {
      const div = document.createElement("div");
      div.className = "service-card";
      div.innerHTML = `
        <strong>${s.service_name}</strong>
        <p>₹ ${s.price}</p>
      `;
      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading services</p>";
  }
}

/* ===============================
   ADD SERVICE
================================ */
document.getElementById("add-service-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const service_name = document.getElementById("service-name").value.trim();
  const price = document.getElementById("service-price").value;

  if (!service_name || !price) return alert("All fields required");

  const res = await fetch(`${API_BASE}/api/admin/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_name,
      price,
      admin_id: admin.id,
    }),
  });

  const data = await res.json();

  if (!res.ok) return alert(data.error);

  alert("Service added successfully!");
  e.target.reset();
  loadAdminServices();
});

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", loadAdminServices);
