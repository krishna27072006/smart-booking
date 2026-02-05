// ============================================
// ADMIN SLOTS - Time Slot Management
// ============================================

// API_BASE is already defined in admin-common.js

// Load services for dropdown
async function loadServicesForSlots() {
    const select = document.getElementById("slot-service");
    if (!select) return;

    if (!window.admin) {
        select.innerHTML = `<option value="">Please login first</option>`;
        return;
    }

    try {
        console.log("Loading services for slots dropdown...");
        const res = await fetch(`/api/admin/services?admin_id=${window.admin.id}`);

        
        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }
        
        const services = await res.json();
        console.log("Services loaded for dropdown:", services);

        select.innerHTML = `<option value="">Select a service...</option>`;
        
        if (services.length === 0) {
            select.innerHTML = `<option value="">No services available - Add services first</option>`;
            return;
        }
        
        services.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = `${s.service_name} — ₹${s.price}`;
            select.appendChild(opt);
        });

        console.log("Services dropdown populated");

    } catch (err) {
        console.error("Error loading services:", err);
        select.innerHTML = `<option value="">Error loading services</option>`;
    }
}

// Generate slot input fields dynamically
document.getElementById("slot-count")?.addEventListener("input", (e) => {
    const count = Number(e.target.value);
    const container = document.getElementById("slots-container");
    
    if (count < 1 || count > 50) {
        container.innerHTML = "";
        return;
    }
    
    console.log("Generating", count, "slot input fields");
    container.innerHTML = "";

    for (let i = 1; i <= count; i++) {
        const div = document.createElement("div");
        div.className = "slot-input-row";
        div.innerHTML = `
            <div class="slot-label">🕐 Slot ${i}</div>
            <div class="slot-row">
                <input type="time" class="slot-start" required placeholder="Start">
                <span class="dash">—</span>
                <input type="time" class="slot-end" required placeholder="End">
            </div>
        `;
        container.appendChild(div);
    }
});

// Add slots to database
async function addSlots(e) {
    e.preventDefault();

    const service_id = document.getElementById("slot-service").value;
    const date = document.getElementById("slot-date").value;
    const count = Number(document.getElementById("slot-count").value);
    const btn = e.target.querySelector("button[type='submit']");

    if (!service_id || !date || !count) {
        showNotification("Please fill all required fields!", "error");
        return;
    }

    if (!window.admin) {
        showNotification("Admin session not found. Please login again.", "error");
        return;
    }

    const rows = document.querySelectorAll(".slot-input-row");
    const slots = [];

    // Collect all slot times
    rows.forEach((row) => {
        const start = row.querySelector(".slot-start").value;
        const end = row.querySelector(".slot-end").value;
        
        if (start && end) {
            slots.push({ start_time: start, end_time: end });
        }
    });

    if (slots.length === 0) {
        showNotification("Please enter slot times!", "error");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Creating<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; margin-left: 8px;"></span>';

    try {
        console.log("Creating", slots.length, "time slots for service", service_id);
        
        // Add each slot to the database
        for (const slot of slots) {
            const res = await fetch(`/api/admin/slots`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    service_id: Number(service_id),
                    slot_date: date,
                    start_time: slot.start_time,
                    end_time: slot.end_time
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create slot");
            }
        }

        console.log("All slots created successfully");
        showNotification(`⚡ ${slots.length} time slots created successfully!`);
        e.target.reset();
        document.getElementById("slots-container").innerHTML = "";

    } catch (err) {
        console.error("Error creating slots:", err);
        showNotification(err.message || "Failed to create slots. Please try again.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "⚡ Create Slots";
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("Slots page initializing...");
        loadServicesForSlots();
        
        // Set minimum date to today
        const dateInput = document.getElementById("slot-date");
        if (dateInput) {
            dateInput.min = new Date().toISOString().split("T")[0];
        }
        
        const form = document.getElementById("slot-form");
        if (form) {
            form.addEventListener("submit", addSlots);
        }
    });
} else {
    console.log("Slots page initializing (already loaded)...");
    loadServicesForSlots();
    
    // Set minimum date to today
    const dateInput = document.getElementById("slot-date");
    if (dateInput) {
        dateInput.min = new Date().toISOString().split("T")[0];
    }
    
    const form = document.getElementById("slot-form");
    if (form) {
        form.addEventListener("submit", addSlots);
    }
}
