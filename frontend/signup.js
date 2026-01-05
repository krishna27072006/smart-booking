const API_BASE = "http://127.0.0.1:5000";

/* ===================================================
    WHEN PAGE LOADS — Initialize both signup forms
=================================================== */
document.addEventListener("DOMContentLoaded", () => {
  attachClientSignup();
  attachAdminSignup();
});

/* ===================================================
    CLIENT SIGN-UP HANDLER
=================================================== */
function attachClientSignup() {
  const form = document.getElementById("clientSignupForm");
  if (!form) return; // means this file is not opened on client signup page

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const city = document.getElementById("city").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirm").value.trim();

    if (!name || !email || !phone || !city || !password)
      return alert("⚠ All fields are required!");

    if (password !== confirm)
      return alert("⚠ Passwords do NOT match!");

    try {
      const res = await fetch(`${API_BASE}/api/register-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, city, password })
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "⚠ Signup failed!");

      alert("🎉 Client account created — please login");
      window.location.href = "login.html";
    } catch (err) {
      console.error(err);
      alert("⛔ Server error — Try again");
    }
  });
}

/* ===================================================
    ADMIN SIGN-UP HANDLER
=================================================== */
function attachAdminSignup() {
  const form = document.getElementById("adminSignupForm");
  if (!form) return; // means this file is not opened on admin signup page

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const provider_name = document.getElementById("provider_name").value.trim();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const city = document.getElementById("city").value.trim();
    const map_url = document.getElementById("map_url").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirm").value.trim();

    if (!provider_name || !name || !email || !phone || !city || !password)
      return alert("⚠ All fields except map link are required!");

    if (password !== confirm)
      return alert("⚠ Passwords do NOT match!");

    try {
      const res = await fetch(`${API_BASE}/api/register-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_name, name, email, phone, city, map_url, password })
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "⚠ Signup failed!");

      alert("🎉 Admin account created — Login to continue");
      window.location.href = "login.html";
    } catch (err) {
      console.error(err);
      alert("⛔ Server error — Try again");
    }
  });
}
