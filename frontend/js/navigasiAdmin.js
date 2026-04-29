// navigasiAdmin.js

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const path = window.location.pathname;
    const page = path.split("/").pop();

    // Menggunakan variabel yang konsisten dengan user-session.js
    const CURRENT_USER_KEY = 'batikPaomanCurrentUser';

    // --- 1. UPDATE INFO ADMIN DI NAVBAR (TOP-BAR) ---
    const userData = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));

    if (userData && userData.role === 'admin') {
        // Target sesuai struktur HTML yang kamu berikan
        const nameElement = document.querySelector('.text-profile .name');
        const roleElement = document.querySelector('.text-profile .role');

        if (nameElement) nameElement.textContent = userData.username;
        // Role bisa diambil dari DB (superadmin/admin) agar lebih dinamis
        if (roleElement) roleElement.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
    }

    // --- 2. LOGIKA NAVIGASI & LOGOUT ---
    navItems.forEach(item => {
        const href = item.getAttribute('href');

        // Menentukan menu mana yang "Active"
        if (page === href) {
            item.classList.add('active');
        } else {
            // Hapus class active jika tidak sesuai halaman (mencegah double active)
            item.classList.remove('active');
        }

        // Event Listener khusus Logout
        if (item.classList.contains('logout')) {
            item.addEventListener('click', async (e) => {
                e.preventDefault();

                if (confirm("Apakah anda yakin ingin keluar dari panel admin?")) {
                    // Panggil fungsi logoutUser yang sudah kita refactor di user-session.js
                    if (window.UserSession && window.UserSession.logoutUser) {
                        const result = await window.UserSession.logoutUser();
                        if (result.success) {
                            // Redirect ke folder auth
                            window.location.href = "../auth.html";
                        }
                    } else {
                        // Fallback jika library belum dimuat
                        localStorage.removeItem(CURRENT_USER_KEY);
                        window.location.href = "../auth.html";
                    }
                }
            });
        }
    });
});