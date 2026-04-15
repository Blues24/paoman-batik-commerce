function showMessage(message, type = "error") {
    let messageBox = document.getElementById("authMessage");

    if (!messageBox) {
        messageBox = document.createElement("p");
        messageBox.id = "authMessage";
        messageBox.className = "auth-message";
        document.querySelector(".auth-card").appendChild(messageBox);
    }

    messageBox.textContent = message;
    messageBox.className = `auth-message ${type}`;
}

function clearMessage() {
    const messageBox = document.getElementById("authMessage");

    if (messageBox) {
        messageBox.textContent = "";
        messageBox.className = "auth-message";
    }
}

function openTab(event, tabName) {
    // Satu halaman auth dipakai untuk login, daftar, dan reset sandi.
    document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));

    document.getElementById(tabName).classList.add("active");
    event.currentTarget.classList.add("active");
    clearMessage();
}

function activateTab(tabName) {
    const selectedTab = document.querySelector(`.tab[data-tab="${tabName}"]`);

    if (selectedTab) {
        selectedTab.click();
    }
}

function getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || "pembelian.html";
}

document.querySelector("#login form").addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    const identifier = document.getElementById("login-input").value.trim();
    const password = document.getElementById("login-pass").value;

    if (!identifier || !password) {
        showMessage("Username/email dan password wajib diisi.");
        return;
    }

    // Login frontend-only: validasi pakai data yang tersimpan di localStorage.
    const result = window.UserSession.loginUser({ identifier, password });

    if (!result.success) {
        showMessage(result.message);
        return;
    }

    showMessage("Login berhasil, kamu akan diarahkan sebentar lagi.", "success");
    window.location.href = getRedirectTarget();
});

document.querySelector("#register form").addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    const nama = document.getElementById("register-nama").value.trim();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const noHp = document.getElementById("register-phone").value.trim();
    const password = document.getElementById("register-pass").value;
    const confirmPassword = document.getElementById("register-pass-confirm").value;

    if (!nama || !username || !email || !noHp || !password || !confirmPassword) {
        showMessage("Semua field daftar wajib diisi.");
        return;
    }

    if (password.length < 8) {
        showMessage("Password minimal 8 karakter.");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Konfirmasi password belum sama.");
        return;
    }

    // Setelah daftar berhasil, user langsung dianggap login.
    const result = window.UserSession.registerUser({
        nama,
        username,
        email,
        noHp,
        password
    });

    if (!result.success) {
        showMessage(result.message);
        return;
    }

    showMessage("Akun berhasil dibuat. Kamu langsung masuk sebagai user.", "success");
    window.location.href = getRedirectTarget();
});

document.querySelector("#reset form").addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    const identifier = document.getElementById("reset-input").value.trim();

    if (!identifier) {
        showMessage("Masukkan username atau email akunmu.");
        return;
    }

    // Reset sandi masih simulasi, cocok untuk demo proyek frontend.
    const result = window.UserSession.requestPasswordReset(identifier);
    showMessage(result.message, result.success ? "success" : "error");
});

document.querySelectorAll(".eye-toggle").forEach((button) => {
    button.addEventListener("click", () => {
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);

        if (!input) {
            return;
        }

        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        button.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    });
});

document.querySelector(".forgot-link").addEventListener("click", (event) => {
    event.preventDefault();
    activateTab("reset");
});

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");

    if (mode === "register") {
        activateTab("register");
    }
});
