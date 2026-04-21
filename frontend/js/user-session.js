const API_URL = 'http://localhost:8000/api';
const CURRENT_USER_KEY = 'batikPaomanCurrentUser';

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
    const response = await fetch(`${API_URL}${endpoint}`, {
        credentials: 'include',
        ...otherOptions, // Masukkan method, body, dll disini
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': sessionStorage.getItem('csrf_token') || '', // Mengambil CSRF token
            ...headers // Timpa  headers jika ada yang memakai header spesifik
        }
    })

    const data = await response.json().catch(() => null);
    return { response, data };
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-CSRF-Token': sessionStorage.getItem('csrf_token') || ''
    };
}

async function loginUser({ identifier, password }) {
    const { response, data } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
    });

    if (!response.ok || !data?.success) {
        return { success: false, message: data?.message || 'Login gagal.' };
    }

    setStoredUser(data.data);
    return { success: true, message: data.message };
}

async function registerUser(payload) {
    const { response, data } = await apiFetch('/auth/register', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(payload)
    });

    if (!response.ok || !data?.success) {
        return { success: false, message: data?.message || 'Registrasi gagal.' };
    }

    setStoredUser(data.data);
    return { success: true, message: data.message };
}

async function logoutUser() {
    const { response, data } = await apiFetch('/auth/logout', {
        method: 'POST'
    });

    clearStoredUser();
    return { success: response.ok && data?.success, message: data?.message || 'Logout selesai.' };
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
    const { response, data } = await apiFetch('/pesanan', {
        method: 'POST',
        
        body: JSON.stringify({ items })
    });

    return { success: response.ok && data?.success, message: data?.message || 'Gagal membuat pesanan.', data: data?.data };
}

async function getCurrentUserOrders() {
    const { response, data } = await apiFetch('/pesanan/saya');

    if (!response.ok || !data?.success) {
        return [];
    }

    return data.data;
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
    getCurrentUserOrders
};