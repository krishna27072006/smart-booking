const API_BASE = "http://127.0.0.1:5000";

document.getElementById("clientSignupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const city = document.getElementById("city").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;
    const messageDiv = document.getElementById("message");
    const btnText = document.getElementById("btnText");
    const btn = document.querySelector(".signup-btn");

    messageDiv.className = "message";
    messageDiv.textContent = "";

    // Validation
    if (password !== confirm) {
        messageDiv.textContent = "❌ Passwords do not match";
        messageDiv.classList.add("error");
        return;
    }

    if (password.length < 6) {
        messageDiv.textContent = "❌ Password must be at least 6 characters long";
        messageDiv.classList.add("error");
        return;
    }

    // Disable button and show loading
    btn.disabled = true;
    btnText.innerHTML = 'Creating Account<span class="spinner"></span>';

    try {
        const res = await fetch(`${API_BASE}/api/register-client`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, city, password })
        });

        const data = await res.json();

        if (!res.ok) {
            messageDiv.textContent = `❌ ${data.error}`;
            messageDiv.classList.add("error");
            btn.disabled = false;
            btnText.textContent = "Create Account";
            return;
        }

        // Success!
        messageDiv.textContent = "✅ Account created successfully! Redirecting...";
        messageDiv.classList.add("success");
        
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (err) {
        messageDiv.textContent = "❌ Server error. Please try again later.";
        messageDiv.classList.add("error");
        btn.disabled = false;
        btnText.textContent = "Create Account";
    }
});
