// ============================================
// ADMIN COMMON - Shared functionality
// ============================================

const API_BASE = "http://127.0.0.1:5000";

// Get admin session
function getAdmin() {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    
    try {
        const parsed = JSON.parse(raw);
        return parsed;
    } catch {
        return null;
    }
}

// Check admin auth
const admin = getAdmin();

// Only redirect if not admin - don't block page load
if (!admin) {
    alert("Please login first");
    window.location.href = "../login.html";
} else if (admin.role?.toLowerCase() !== "admin") {
    alert("Admin access required");
    window.location.href = "../login.html";
}

// Expose globally
window.admin = admin;

// Initialize user info
function initAdminInfo() {
    if (!admin) return;
    
    const avatar = document.getElementById("user-avatar");
    const email = document.getElementById("admin-email");
    const greetingText = document.getElementById("greeting-text");
    
    if (avatar && admin.name) {
        avatar.textContent = admin.name.charAt(0).toUpperCase();
    }
    
    if (email) {
        email.textContent = admin.email || "Admin";
    }
    
    if (greetingText && admin.name) {
        const hour = new Date().getHours();
        let greeting = "Good Evening";
        if (hour < 12) greeting = "Good Morning";
        else if (hour < 18) greeting = "Good Afternoon";
        
        greetingText.textContent = `${greeting}, ${admin.name}! 👑`;
    }
}

// Logout function
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("user");
        window.location.href = "../login.html";
    }
}

// Show notification
function showNotification(message, type = "info") {
    alert(message);
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initAdminInfo);
} else {
    initAdminInfo();
}

// Expose functions globally
window.logout = logout;
window.showNotification = showNotification;
window.getAdmin = getAdmin;
