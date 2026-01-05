// admin/dashboard.js

const raw = localStorage.getItem("user");

if (!raw) {
  window.location.href = "../login.html";
}

let admin;
try {
  admin = JSON.parse(raw);
} catch {
  localStorage.removeItem("user");
  window.location.href = "../login.html";
}

// case-safe role check
if (!admin.role || admin.role.toLowerCase() !== "admin") {
  window.location.href = "../login.html";
}

// expose admin globally
window.admin = admin;

// show admin info if exists
const info = document.getElementById("admin-info");
if (info) {
  info.innerText = `Logged in as: ${admin.email}`;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "../login.html";
}
