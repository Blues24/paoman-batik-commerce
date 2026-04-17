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

function loginUser(credentials) {
    return window.UserSession.loginUser(credentials);
}

function registerUser(payload) {
    return window.UserSession.registerUser(payload);
}

function requestPasswordReset(identifier) {
    return window.UserSession.requestPasswordReset(identifier);
}

function showError(msg){
    let messageBox = document.getElementById('authMessage');

    if (!messageBox) {
        messageBox = document.createElement('p');
        messageBox.id = 'authMessage';
        messageBox.className = 'auth-message';
        document.querySelector('.auth-card').appendChild(messageBox);
    }

    messageBox.textContent = msg;
    messageBox.className = 'auth-message error';
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

document.querySelector("#login form").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const identifier = document.getElementById("login-input").value.trim();
    const password = document.getElementById("login-pass").value;

    if (!identifier || !password) {
        showMessage("Username/email dan password wajib diisi.");
        return;
    }

    const result = await loginUser({ identifier, password });

    if (!result.success) {
        showMessage(result.message);
        return;
    }

    showMessage("Login berhasil, kamu akan diarahkan sebentar lagi.", "success");
    window.location.href = getRedirectTarget();
});

document.querySelector("#register form").addEventListener("submit", async (event) => {
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

    const result = await registerUser({
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
});

document.querySelector("#reset form").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const identifier = document.getElementById("reset-input").value.trim();

    if (!identifier) {
        showMessage("Username atau email harus diisi.");
        return;
    }

    const result = await requestPasswordReset(identifier);

    if (!result.success) {
        showMessage(result.message);
        return;
    }

    showMessage(result.message, "success");
});

/**
 *  Logout Area
 *  User bisa logout
 */
async function logout(){
    try {
        await window.UserSession.logoutUser();
    } catch (err) {
        console.error('Tidak bisa logout karena: ', err);
    }

    window.location.href = '../src/auth.html';
}

/**
 *               UPDATE USER PILL (dynamic display) 
 * Ini akan di-call dari setiap page yang butuh show user info
 */
function updateUserPill(){
    const userPill = document.querySelector('.user-pill');
    if (!userPill) return;

    const currentUser = window.UserSession.getCurrentUser();

    if(currentUser){
        userPill.innerHTML = `
            <div class="user-meta">
                <strong>${currentUser.nama || 'User'}</strong>
                <button onclick="logout()" style="background:none; border:none; color:#666; cursor:pointer; font-size:12px;">Logout</button>
            </div>
            <div class="user-icon">
                <i class="bi bi-person"></i>
            </div>
        `;
    } else {
        userPill.innerHTML = `
                <a href="../src/auth.html" style="text-decoration:none; color:inherit;">
                <div class="user-meta">
                    <strong>Guest</strong>
                    <span style="font-size:12px;">Login dulu</span>
                </div>
                <div class="user-icon">
                    <i class="bi bi-person"></i>
                </div>
            </a>
        `
    }
}

// Update user pill saat script load (untuk page lain, bukan auth page)
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.user-pill')) {
        updateUserPill();
    }
});
