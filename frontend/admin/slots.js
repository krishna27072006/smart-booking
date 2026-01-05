const API_BASE = "http://127.0.0.1:5000";

// Ensure admin is available
let admin = window.admin || JSON.parse(localStorage.getItem("user"));
window.admin = admin;

/* Load service list */
async function loadAdminServices() {
  const select = document.getElementById("slot-service");
  if (!select) return;

  select.innerHTML = "<option>Loading...</option>";

  const res = await fetch(`${API_BASE}/api/admin/services?admin_id=${admin.id}`);
  const data = await res.json();

  select.innerHTML = `<option value="">Select Service</option>`;
  data.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.service_name} — ₹${s.price}`;
    select.appendChild(opt);
  });
}

/* Generate slot input rows dynamically */
document.getElementById("slot-count").addEventListener("input", () => {
  const count = Number(document.getElementById("slot-count").value);
  const container = document.getElementById("slots-container");
  container.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.className = "slot-input-row";

    div.innerHTML = `
  <div class="slot-label">Slot ${i}</div>
  <div class="slot-row">
      <input type="time" class="slot-start" required>
      <span class="dash">—</span>
      <input type="time" class="slot-end" required>
  </div>
  <hr>
`;


    container.appendChild(div);
  }
});

/* Add all slots to DB */
async function addSlot(e) {
  e.preventDefault();

  const service_id = document.getElementById("slot-service").value;
  const date = document.getElementById("slot-date").value;
  const count = Number(document.getElementById("slot-count").value);

  if (!service_id || !date || !count) return alert("Please fill all fields!");

  const rows = document.querySelectorAll(".slot-input-row");
  const slots = [];

  rows.forEach((row) => {
    slots.push({
      start_time: row.querySelector(".slot-start").value,
      end_time: row.querySelector(".slot-end").value
    });
  });

  for (const slot of slots) {
    await fetch(`${API_BASE}/api/admin/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id,
        slot_date: date,
        start_time: slot.start_time,
        end_time: slot.end_time
      })
    });
  }

  alert(`⭐ ${slots.length} Slots Added!`);
  document.getElementById("slot-form").reset();
  document.getElementById("slots-container").innerHTML = "";
}

/* Init */
document.addEventListener("DOMContentLoaded", () => {
  if (!admin) return location.href = "../login.html";
  loadAdminServices();
  document.getElementById("slot-form").addEventListener("submit", addSlot);
});
