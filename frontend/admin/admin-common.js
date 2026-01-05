// GLOBAL ADMIN SESSION (shared across all admin pages)
window.admin = window.admin || JSON.parse(localStorage.getItem("user"));

if (!window.admin || window.admin.role !== "admin") {
  window.location.href = "../login.html";
}
