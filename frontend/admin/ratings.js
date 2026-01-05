const API_BASE = "http://127.0.0.1:5000";

// ❗ DO NOT redeclare admin
// admin is already created in dashboard.js
if (!window.admin) {
  window.location.href = "../login.html";
}

async function loadRatings() {
  const container = document.getElementById("ratings-container");
  container.innerHTML = "<p>Loading ratings...</p>";

  try {
    const res = await fetch(
      `${API_BASE}/api/admin/bookings?admin_id=${window.admin.id}`
    );

    const data = await res.json();

    const rated = data.filter(b => b.rating !== null);

    if (rated.length === 0) {
      container.innerHTML = "<p>No ratings submitted yet</p>";
      return;
    }

    // group by service
    const grouped = {};
    rated.forEach(r => {
      if (!grouped[r.service_name]) {
        grouped[r.service_name] = [];
      }
      grouped[r.service_name].push(r);
    });

    container.innerHTML = "";

    for (const service in grouped) {
      const ratings = grouped[service];
      const avg =
        ratings.reduce((sum, r) => sum + Number(r.rating), 0) /
        ratings.length;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${service}</h3>
        <p>⭐ Average Rating: ${avg.toFixed(1)} / 5</p>
        <hr>
      `;

      ratings.forEach(r => {
        card.innerHTML += `
          <p><strong>${r.client_name}</strong></p>
          <p>⭐ ${r.rating}/5</p>
          <p>${r.comment || "No comment"}</p>
          <hr>
        `;
      });

      container.appendChild(card);
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading ratings</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadRatings);
