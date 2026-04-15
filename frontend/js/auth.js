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

/**
 *  GLOBAL AUTH STATE
 * Semua state user disimpan di sini, accessible dari mana saja
 */
const authState = {
    isLoggedIn: false,
    nama: null,
    csrf_token : null,
    
    init(){
        this.csrf_token = sessionStorage.getItem('csrf_token');
        this.nama = sessionStorage.getItem('nama');
        this.isLoggedIn = !!(this.csrf_token && this.nama);

    },

    setUser(nama, csrf_token){
        this.nama = nama;
        this.csrf_token = csrf_token;
        this.isLoggedIn = true;
        sessionStorage.setItem('nama', nama);
        sessionStorage.setItem('csrf_token', csrf_token);
    },

    clear(){
        this.nama = null;
        this.csrf_token = null;
        this.isLoggedIn = null;
        sessionStorage.removeItem('nama');
        sessionStorage.removeItem('csrf_token');
    },

    getHeaders(){
        // Helper untuk semua API call yang membutuhkan csrf token
        return {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.csrf_token || ''
        };
    }
};

// Jalankan auth state pada saat script di load
authState.init();

function showError(msg){
    let elm = document.getElementById('error-msg');
    if (!elm){
        elm = document.createElement('p');
        elm.id = 'error-msg';
        elm.style.cssText ='color:red; text-align:center; margin-top:8px; font-size:14px;';

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
});

/**
 *  Logout Area
 *  User bisa logout
 */
async function logout(){
    try {
         await fetch(`${API_URL}/auth/logout`,{
            method: 'POST',
            headers: authState.getHeaders(),
            credentials: 'include'
         });
    } catch (err) {
        console.error('Tidak bisa logout karena: ', err);
    }

    authState.clear();
    window.location.href = '../src/auth.html';
}

/**
 *               UPDATE USER PILL (dynamic display) 
 * Ini akan di-call dari setiap page yang butuh show user info
 */
function updateUserPill(){
    const userPill = document.querySelector('.user-pill');
    if (!userPill) return;

    if(authState.isLoggedIn){
        userPill.innerHTML = `
            <div class="user-meta">
                <strong>${AuthState.nama || 'User'}</strong>
                <button onclick="logout()" style="background:none; border:none; color:#666; cursor:pointer; font-size:12px;">Logout</button>
            </div>
            <div class="user-icon">
                <i class="bi bi-person"></i>
            </div>
        `;
    }else {
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
})
