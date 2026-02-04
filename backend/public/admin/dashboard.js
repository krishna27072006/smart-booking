// ============================================
// ADMIN DASHBOARD - Stats and Overview
// ============================================

// API_BASE is already defined in admin-common.js

async function loadDashboardStats() {
    if (!window.admin) {
        console.error("Admin not found in session");
        return;
    }

    try {
        console.log("Loading dashboard stats for admin:", window.admin.id);

        // Load services count
        const servicesRes = await fetch(`${API_BASE}/api/admin/services?admin_id=${window.admin.id}`);
        
        if (!servicesRes.ok) {
            throw new Error(`Services API failed: ${servicesRes.status}`);
        }
        
        const services = await servicesRes.json();
        console.log("Services loaded:", services.length);
        document.getElementById("total-services").textContent = services.length;

        // Load bookings
        const bookingsRes = await fetch(`${API_BASE}/api/admin/bookings?admin_id=${window.admin.id}`);
        
        if (!bookingsRes.ok) {
            throw new Error(`Bookings API failed: ${bookingsRes.status}`);
        }
        
        const bookings = await bookingsRes.json();
        console.log("Bookings loaded:", bookings.length);
        document.getElementById("total-bookings").textContent = bookings.length;

        // Count pending bookings
        const pending = bookings.filter(b => b.status === "pending").length;
        document.getElementById("pending-bookings").textContent = pending;

        // Calculate average rating
        const rated = bookings.filter(b => b.rating !== null && b.rating !== undefined);
        if (rated.length > 0) {
            const avgRating = rated.reduce((sum, b) => sum + Number(b.rating), 0) / rated.length;
            document.getElementById("avg-rating").textContent = avgRating.toFixed(1);
        } else {
            document.getElementById("avg-rating").textContent = "N/A";
        }

        console.log("Dashboard stats loaded successfully");

    } catch (err) {
        console.error("Error loading dashboard stats:", err);
        document.getElementById("total-services").textContent = "0";
        document.getElementById("total-bookings").textContent = "0";
        document.getElementById("pending-bookings").textContent = "0";
        document.getElementById("avg-rating").textContent = "N/A";
        
        showNotification("Error loading dashboard stats. Please check console.");
    }
}

// Update greeting based on time
function updateGreeting() {
    if (!window.admin) return;
    
    const hour = new Date().getHours();
    let greeting = "Good Evening";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    
    const greetingEl = document.getElementById("greeting-text");
    if (greetingEl && window.admin.name) {
        greetingEl.textContent = `${greeting}, ${window.admin.name}! 👑`;
    }

    const providerEl = document.getElementById("admin-provider");
    if (providerEl && window.admin.provider_name) {
        providerEl.textContent = `Managing ${window.admin.provider_name}`;
    }
}

// Initialize dashboard
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("Dashboard initializing...");
        updateGreeting();
        loadDashboardStats();
    });
} else {
    console.log("Dashboard initializing (already loaded)...");
    updateGreeting();
    loadDashboardStats();
}
