const API_URL = 'http://localhost:8000/api';

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

        document.querySelector('.auth-card').appendChild(elm);
    }
    elm.textContent = msg; 
}

function clearErrorElm(){
    const elm = document.getElementById('error-msg');
    if (elm) elm.textContent = ' ';
}


function openTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Login Area
document.querySelector('#login form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrorElm();

    const loginInput = document.getElementById('login-input').value.trim();
    const password = document.getElementById('login-pass').value;

    if (!loginInput || !password){
        showError("Username atau Email dan Password wajib diisi...!");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/login`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ identifier: loginInput, password})
        });

        const data = await res.json();

        if(data.success){
            sessionStorage.setItem('csrf-token',  data.data.csrf_token);
            sessionStorage.setItem('nama', data.data.nama);
            // redirect ke halaman utama
            window.location.href = '../src/beranda.html';
        }else {
            showError(data.message);
        }
    } catch (err) {
            showError('Gagal terhubung ke server. Mohon bersabar');
            console.error(`Gagal terhubung ke API karena: ${err.message}`);
    }
});

// Register area
document.querySelector('#register form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrorElm();

    const nama          = document.getElementById('register-nama').value.trim();
    const username  = document.getElementById('register-username').value.trim();
    const email          = document.getElementById('register-email').value.trim();
    const password  = document.getElementById('register-pass').value;

    if (!nama || !username || !email || !password){
        showError('Semua field wajib diisi...!');
        return;
    }

    if (password.length < 8){
        showError('Password harus lebih dari 8 karakter...!');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({  nama, username, email, password})
        });

        const data = await res.json();

        if (data.success){
            showError('');
            alert("Registrasi berhasil! Silahkan login..");
            // Pindah ke tab login
            document.querySelector('.tab').click();
        } else {
            showError(data.message);
        }
    } catch (err) {
        showError('Gagal terhubung ke server..!');
        console.error(`Gagal terhubung ke API karena: ${err.message}`);
    }
} );

// Toggle Password visibility icon
document.querySelectorAll('.eye-icon').forEach(icon => {
    icon.addEventListener('click', () => {
        const input = icon.previousElementSibling;
        input.type  = input.type === 'password' ? 'text' : 'password';
        icon.textContent = input.type === 'password' ? '👁️' : '🙈';
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