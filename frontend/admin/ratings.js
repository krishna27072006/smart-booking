// ============================================
// ADMIN RATINGS - View Customer Feedback
// ============================================

// API_BASE is already defined in admin-common.js

// Load ratings
async function loadRatings() {
    const container = document.getElementById("ratings-container");

    if (!container) {
        console.error("Ratings container not found");
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
        console.log("Loading ratings for admin:", window.admin.id);
        const res = await fetch(`${API_BASE}/api/admin/bookings?admin_id=${window.admin.id}`);
        
        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Bookings data loaded:", data);

        const rated = data.filter(b => b.rating !== null && b.rating !== undefined);
        console.log("Rated bookings:", rated.length);

        if (rated.length === 0) {
            container.innerHTML = `
                <div class="admin-empty-state">
                    <div class="admin-empty-state-icon">⭐</div>
                    <h3>No Ratings Yet</h3>
                    <p>Customer ratings will appear here once they rate your services</p>
                </div>
            `;
            return;
        }

        // Group by service
        const grouped = {};
        rated.forEach(r => {
            const serviceName = r.service_name || "Unknown Service";
            if (!grouped[serviceName]) {
                grouped[serviceName] = [];
            }
            grouped[serviceName].push(r);
        });

        container.innerHTML = "";

        for (const service in grouped) {
            const ratings = grouped[service];
            const avg = ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length;

            const card = document.createElement("div");
            card.className = "admin-rating-card";
            
            card.innerHTML = `
                <div class="rating-header">
                    <h4>🛠 ${service}</h4>
                    <div class="average-rating">
                        ⭐ ${avg.toFixed(1)} / 5.0
                    </div>
                </div>
                <div style="color: #94a3b8; margin-bottom: 20px;">
                    ${ratings.length} ${ratings.length === 1 ? 'review' : 'reviews'}
                </div>
            `;

            // Add individual ratings
            ratings.forEach(r => {
                const ratingDiv = document.createElement("div");
                ratingDiv.className = "rating-item";
                
                const stars = "⭐".repeat(Math.round(r.rating));
                
                ratingDiv.innerHTML = `
                    <div class="client-name">👤 ${r.client_name || "Anonymous"}</div>
                    <div class="rating-stars">${stars} ${r.rating}/5</div>
                    <div class="rating-comment">${r.comment || "No comment provided"}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                        ${new Date(r.booking_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    </div>
                `;
                
                card.appendChild(ratingDiv);
            });

            container.appendChild(card);
        }

        console.log("Ratings rendered successfully");

    } catch (err) {
        console.error("Error loading ratings:", err);
        container.innerHTML = `
            <div class="admin-empty-state">
                <div class="admin-empty-state-icon">❌</div>
                <h3>Error Loading Ratings</h3>
                <p>Check console for details</p>
            </div>
        `;
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("Ratings page initializing...");
        loadRatings();
    });
} else {
    console.log("Ratings page initializing (already loaded)...");
    loadRatings();
}
