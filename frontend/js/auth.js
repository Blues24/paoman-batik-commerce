function showMessage(message, type = "error") {
    const messageBox = document.getElementById("authMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.className = `auth-message ${type}`;
}

function clearMessage() {
    const messageBox = document.getElementById("authMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = "";
    messageBox.className = "auth-message";
}

function updateModeInUrl(tabName) {
    const url = new URL(window.location.href);

    if (tabName === "register") {
        url.searchParams.set("mode", "register");
    } else if (tabName === "reset") {
        url.searchParams.set("mode", "reset");
    } else {
        url.searchParams.delete("mode");
    }

    window.history.replaceState({}, "", url.toString());
}

function setActiveTab(tabName, syncUrl = true) {
    document.querySelectorAll(".tab-content").forEach((tabPanel) => {
        tabPanel.classList.toggle("active", tabPanel.id === tabName);
    });

    document.querySelectorAll(".tab").forEach((tabButton) => {
        tabButton.classList.toggle("active", tabButton.dataset.tab === tabName);
    });

    clearMessage();

    if (syncUrl) {
        updateModeInUrl(tabName);
    }
}

function openTab(event, tabName) {
    if (event) {
        event.preventDefault();
    }

    setActiveTab(tabName);
}

function getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || "pembelian.html";
}

function setSubmitState(button, isLoading, idleLabel, loadingLabel) {
    if (!button) {
        return;
    }

    button.disabled = isLoading;
    button.textContent = isLoading ? loadingLabel : idleLabel;
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    clearMessage();

    const submitButton = event.currentTarget.querySelector(".btn-submit");
    const identifier = document.getElementById("login-input").value.trim();
    const password = document.getElementById("login-pass").value;

    if (!identifier || !password) {
        showMessage("Username/email dan password wajib diisi.");
        return;
    }

    setSubmitState(submitButton, true, "Masuk", "Memproses...");

    try {
        const result = await window.UserSession.loginUser({ identifier, password });
        
        if (result.success){
            showMessage("Login berhasil! mengalihkan... ", "success");

            // Logika pengalihan halaman berdasarkan role
            setTimeout(() => {
                if (result.role === 'admin'){
                    window.location.href = "../src/admin/dasboardAdmin.html";
                } else {
                    window.location.href = "../src/beranda.html";
                }
            }, 1000);
        } else {
            showMessage(result.message);
        }
    } catch ( err ){
        showMessage("Gagal melakukan login. Silahkan coba lagi");
        console.error(err.message);
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    clearMessage();

    const submitButton = event.currentTarget.querySelector(".btn-submit");
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

    setSubmitState(submitButton, true, "Buat Akun", "Mendaftarkan...");

    try {
        const result = await window.UserSession.registerUser({
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

        showMessage("Akun berhasil dibuat. Kamu akan diarahkan sebentar lagi.", "success");
        window.location.href = getRedirectTarget();
    } catch (error) {
        showMessage("Terjadi kendala saat daftar akun. Coba lagi sebentar.");
    } finally {
        setSubmitState(submitButton, false, "Buat Akun", "Mendaftarkan...");
    }
}

async function handleResetSubmit(event) {
    event.preventDefault();
    clearMessage();

    const submitButton = event.currentTarget.querySelector(".btn-submit");
    const identifier = document.getElementById("reset-input").value.trim();

    if (!identifier) {
        showMessage("Username atau email harus diisi.");
        return;
    }

    setSubmitState(submitButton, true, "Kirim Reset Sandi", "Mengirim...");

    try {
        const result = await window.UserSession.requestPasswordReset(identifier);

        if (!result.success) {
            showMessage(result.message);
            return;
        }

        showMessage(result.message, "success");
    } catch (error) {
        showMessage("Permintaan reset belum berhasil. Coba lagi sebentar.");
    } finally {
        setSubmitState(submitButton, false, "Kirim Reset Sandi", "Mengirim...");
    }
}

function initializePasswordToggles() {
    document.querySelectorAll(".eye-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.target);

            if (!input) {
                return;
            }

            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            button.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const mode = new URLSearchParams(window.location.search).get("mode");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const resetForm = document.getElementById("resetForm");
    const forgotLink = document.querySelector(".forgot-link");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLoginSubmit);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegisterSubmit);
    }

    if (resetForm) {
        resetForm.addEventListener("submit", handleResetSubmit);
    }

    if (forgotLink) {
        forgotLink.addEventListener("click", (event) => {
            event.preventDefault();
            setActiveTab("reset");
        });
    }

    initializePasswordToggles();

    if (mode === "register") {
        setActiveTab("register", false);
    } else if (mode === "reset") {
        setActiveTab("reset", false);
    } else {
        setActiveTab("login", false);
    }
});
