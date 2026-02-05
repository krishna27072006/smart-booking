// ============================================
// ADMIN SERVICES - Manage Services
// ============================================

// API_BASE is already defined in admin-common.js

// Load admin services
async function loadAdminServices() {
    const container = document.getElementById("admin-services-list");
    
    if (!container) {
        console.error("Services container not found");
        return;
    }

    if (!window.admin) {
        console.error("Admin not found in session");
        container.innerHTML = `
            <div class="admin-empty-state" style="grid-column: 1/-1;">
                <div class="admin-empty-state-icon">❌</div>
                <p>Admin session not found. Please login again.</p>
            </div>
        `;
        return;
    }

    try {
        console.log("Loading services for admin:", window.admin.id);
        const res = await fetch(`/api/admin/services?admin_id=${window.admin.id}`);
        
        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }
        
        const services = await res.json();
        console.log("Services loaded:", services);

        if (!services || services.length === 0) {
            container.innerHTML = `
                <div class="admin-empty-state" style="grid-column: 1/-1;">
                    <div class="admin-empty-state-icon">🛠</div>
                    <h3>No Services Yet</h3>
                    <p>Add your first service using the form above</p>
                </div>
            `;
            return;
        }

        container.innerHTML = "";

        services.forEach(s => {
            const card = document.createElement("div");
            card.className = "admin-service-item";
            card.innerHTML = `
                <h4>🛠 ${s.service_name}</h4>
                <div class="price">₹${s.price}</div>
                <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Service ID: ${s.id}</p>
            `;
            container.appendChild(card);
        });

        console.log("Services rendered successfully");

    } catch (err) {
        console.error("Error loading services:", err);
        container.innerHTML = `
            <div class="admin-empty-state" style="grid-column: 1/-1;">
                <div class="admin-empty-state-icon">❌</div>
                <p>Error loading services. Check console for details.</p>
            </div>
        `;
    }
}

// Add new service
async function handleAddService(e) {
    e.preventDefault();

    const service_name = document.getElementById("service-name").value.trim();
    const price = document.getElementById("service-price").value;
    const btn = e.target.querySelector("button[type='submit']");

    if (!service_name || !price) {
        showNotification("All fields are required", "error");
        return;
    }

    if (!window.admin) {
        showNotification("Admin session not found. Please login again.", "error");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Adding<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; margin-left: 8px;"></span>';

    try {
        console.log("Adding service:", { service_name, price, admin_id: window.admin.id });
        
        const res = await fetch(`/api/admin/services`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                service_name,
                price: Number(price),
                admin_id: window.admin.id,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to add service");
        }

        console.log("Service added:", data);
        showNotification("✅ Service added successfully!");
        e.target.reset();
        loadAdminServices();

    } catch (err) {
        console.error("Error adding service:", err);
        showNotification(err.message || "Server error. Please try again.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "➕ Add Service";
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("Services page initializing...");
        loadAdminServices();
        
        const form = document.getElementById("add-service-form");
        if (form) {
            form.addEventListener("submit", handleAddService);
        }
    });
} else {
    console.log("Services page initializing (already loaded)...");
    loadAdminServices();
    
    const form = document.getElementById("add-service-form");
    if (form) {
        form.addEventListener("submit", handleAddService);
    }
}
