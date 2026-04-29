(() => {
const DEFAULT_API_BASE = 'http://localhost/paoman-batik/backend/public/api';
// Global base URL supaya file lain bisa pakai tanpa re-declare const.
window.API_URL = window.API_URL || DEFAULT_API_BASE;

const CURRENT_USER_KEY = 'batikPaomanCurrentUser';
const CART_KEY = 'batikPaomanCart';

function getStoredUser() {
    try {
        // Try sessionStorage first
        let user = JSON.parse(sessionStorage.getItem(CURRENT_USER_KEY));
        if (user) return user;

        // Fallback ke localStorage
        user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
        if (user) {
            // Sync back ke sessionStorage
            sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            const csrfToken = localStorage.getItem('csrf_token');
            if (csrfToken) {
                sessionStorage.setItem('csrf_token', csrfToken);
            }
        }
        return user || null;
    } catch {
        return null;
    }
}

function setStoredUser(user) {
    if (!user) {
        sessionStorage.removeItem(CURRENT_USER_KEY);
        sessionStorage.removeItem('csrf_token');
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem('csrf_token');
        return;
    }

    // Set ke BOTH sessionStorage dan localStorage
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    if (user.csrf_token) {
        sessionStorage.setItem('csrf_token', user.csrf_token);
        localStorage.setItem('csrf_token', user.csrf_token);
    }
}

function clearStoredUser() {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem('csrf_token');
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('csrf_token');
}

async function apiFetch(endpoint, options = {}) {
    const { headers, ...otherOptions} = options;
    const response = await fetch(`${window.API_URL}${endpoint}`, {
        credentials: 'include',
        ...otherOptions, // Masukkan method, body, dll disini
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': sessionStorage.getItem('csrf_token') || '', // Mengambil CSRF token
            ...headers // Timpa  headers jika ada yang memakai header spesifik
        }
    })

    const data = await response.json().catch(() => null);
    window.apiFetch = apiFetch;
    return { response, data };
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-CSRF-Token': sessionStorage.getItem('csrf_token') || ''
    };
}

async function loginUser( credentials ) {
    try {
        // Cek apakah yang login ini admin atau bukan
        const adminResponse = await fetch(`${DEFAULT_API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                username: credentials.identifier,
                password: credentials.password,
            })
        });
        
        const adminData = await adminResponse.json();

        if (adminResponse.ok && adminData.success){
            const dataAdmin = {
                ...adminData.data,
                username: credentials.identifier,
                password: credentials.password,
                role: adminData.data.role,
            };
            setStoredUser(dataAdmin);
            return {
                 success: true,
                 role: 'admin',
                 message: 'Admin berhasil login!'
                 };
        } else {
            // Jika bukan admin maka coba pakai endpoint login USER
            const userResponse = await fetch(`${DEFAULT_API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const userData = await userResponse.json();

            if (userResponse.ok && userData.success) {
                const dataUser = {
                    ...userData.data,
                    username: credentials.identifier,
                    role: 'pelanggan'
                };
                setStoredUser(dataUser);
                return {
                    success: true,
                    role: 'pelanggan',
                    message: 'Pelanggan berhasil login!'
                }
            } else {
                return {
                    success: false,
                    message: userData.message || adminData.message || 'Login gagal'
                }
            }
        }
    } catch (err){
        console.error("Login error: ", err);
        return {
            success: false,
            message: 'Terjadi kesalahan koneksi ke server....'
        };
    }
    
}

async function registerUser(payload) {
    const { response, data } = await apiFetch('/auth/register', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
            ...payload,
            // Backend pakai snake_case.
            no_hp: payload?.noHp ?? payload?.no_hp ?? null
        })
    });

    if (!response.ok || !data?.success) {
        return { success: false, message: data?.message || 'Registrasi gagal.' };
    }

    setStoredUser(data.data);
    return { success: true, message: data.message };
}

async function logoutUser() {
    try {
        // Ambil data user yang sekarang untuk pengecekan role
        const userData = localStorage.getItem(CURRENT_USER_KEY);
        const curentUser = userData ? JSON.parse(userData)  : null;

        // Cek apakah user yang sekarang itu pelanggan atau admin
        const isPelanggan = currentUser && currentUser.role === 'pelanggan'; // jika nilai variabel ini false maka itu admin

        // 1. Panggil logout melalui API
        const { response, data } = await fetch(`${DEFAULT_API_BASE}/auth/logout`, {
            method: 'POST'
        });
        // 2. Pembersihan total terhadap local dan session storage di browser
        // Menghapus data user, CSRF TOKEN, dan data keranjang
        clearStoredUser();
        
        if (isPelanggan) {
            localStorage.removeItem(CART_KEY);
        }
        return {
            success: true,
            message: data?.message || "Logout berhasil."
        };
    } catch ( err ) {
        console.error("Logout error: ", err);
        // Fallback tetap hapus data lokal
        localStorage.removeItem(CURRENT_USER_KEY);
        return { success: true, message: "Logout lokal berhasil." };
    }
}

async function fetchCurrentUser() {
    const { response, data } = await apiFetch('/auth/me');

    if (!response.ok || !data?.success) {
        clearStoredUser();
        return null;
    }

    setStoredUser(data.data);
    return data.data;
}

async function updateProfile(payload) {
    const user = getStoredUser();
    const { response, data } = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
            ...payload,
            no_hp: payload?.noHp ?? payload?.no_hp ?? null,
            akun_id: user.akun_id
        })
    });

    if (!response.ok || !data?.success) {
        return { success: false, message: data?.message || 'Gagal memperbarui profil.' };
    }

    setStoredUser(data.data);
    return { success: true, message: data.message, user: data.data };
}

async function updatePassword({ currentPassword, newPassword }) {
    const { response, data } = await apiFetch('/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
    });

    return { success: response.ok && data?.success, message: data?.message || 'Gagal mengganti password.' };
}

async function requestPasswordReset(identifier) {
    const { response, data } = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ identifier })
    });

    return { success: response.ok && data?.success, message: data?.message || 'Gagal request reset password.' };
}

async function createOrder(items) {
    const user = getStoredUser();
    const { response, data } = await apiFetch('/pesanan', {
        method: 'POST',
        body: JSON.stringify({ 
            akun_id: user.akun_id,
            items: items
         })
    });

    return { success: response.ok && data?.success, message: data?.message || 'Gagal membuat pesanan.', data: data?.data };
}

async function getCurrentUserOrders() {
    const user = getStoredUser();
    const akunId = user?.akun_id;
    const { response, data } = await apiFetch(`/pesanan/saya?akun_id=${encodeURIComponent(String(akunId || ''))}`);

    if (!response.ok || !data?.success) {
        return {
            success: false,
            message: data?.message || 'Gagal memuat riwayat pesanan.',
            data: []
        };
    }

    return {
        success: true,
        message: data.message || 'Riwayat pesanan berhasil dimuat.',
        data: data.data || []
    };
}

async function getOrderDetail(pesananId) {
    const user = getStoredUser();
    const akunId = user?.akun_id;
    const { response, data } = await apiFetch(`/pesanan/${pesananId}?akun_id=${encodeURIComponent(String(akunId || ''))}`);

    if (!response.ok || !data?.success) {
        return {
            success: false,
            message: data?.message || 'Gagal memuat detail pesanan.',
            data: null
        };
    }

    return {
        success: true,
        message: data.message || 'Detail pesanan berhasil dimuat.',
        data: data.data || null
    };
}

async function cancelOrder(pesananId) {
    const user = getStoredUser();
    const akunId = user?.akun_id;
    const { response, data } = await apiFetch(
        `/pesanan/${encodeURIComponent(String(pesananId))}/cancel?akun_id=${encodeURIComponent(String(akunId || ''))}`,
        {
        method: 'POST',
        body: JSON.stringify({ akun_id: akunId })
    });

    return {
        success: response.ok && data?.success,
        message: data?.message || (response.ok ? 'Pesanan dibatalkan.' : 'Gagal membatalkan pesanan.')
    };
}

async function submitReview(payload) {
    const user = getStoredUser();
    const { response, data } = await apiFetch('/ulasan', {
        method: 'POST',
        body: JSON.stringify({
            ...payload,
            akun_id: user?.akun_id
        })
    });

    return {
        success: response.ok && data?.success,
        message: data?.message || 'Gagal mengirim ulasan.',
        data: data?.data || null
    };
}

window.UserSession = {
    getCurrentUser: getStoredUser,
    loginUser,
    registerUser,
    logoutUser,
    fetchCurrentUser,
    updateProfile,
    updatePassword,
    requestPasswordReset,
    createOrder,
    getCurrentUserOrders,
    getOrderDetail,
    cancelOrder,
    submitReview
};
})();
