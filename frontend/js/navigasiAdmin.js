// navigasiAdmin.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil elemen
    const navItems = document.querySelectorAll('.nav-item');
    const path = window.location.pathname;
    const page = path.split("/").pop();
    const CURRENT_USER_KEY = 'batikPaomanCurrentUser';

    // 2. Info Admin
    const userData = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    if (userData && userData.role === 'admin') {
        const nameElement = document.querySelector('.text-profile .name');
        const roleElement = document.querySelector('.text-profile .role');
        if (nameElement) nameElement.textContent = userData.username;
        if (roleElement) roleElement.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
    }

    // 3. Loop Navigasi & Logout
    navItems.forEach(item => {
        const href = item.getAttribute('href');

        // Logic Active Menu
        if (page === href) {
            item.classList.add('active');
        } else if (href !== '#') { // Cegah hapus active jika href cuma '#' (seperti logout)
            item.classList.remove('active');
        }

        // Event Listener Logout
        if (item.classList.contains('logout')) {
            // Kita gunakan onclick langsung atau pastikan listener menempel
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Mencegah event bubbling

                Swal.fire({
                    title: 'Konfirmasi Logout',
                    text: "Apakah anda yakin ingin keluar dari panel admin?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Ya, Keluar!',
                    cancelButtonText: 'Batal',
                    reverseButtons: true
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        Swal.fire({
                            title: 'Mohon Tunggu...',
                            allowOutsideClick: false,
                            didOpen: () => { Swal.showLoading(); }
                        });

                        if (window.UserSession && typeof window.UserSession.logoutUser === 'function') {
                            const resultLogout = await window.UserSession.logoutUser();
                            if (resultLogout.success) {
                                window.location.href = "../auth.html";
                            }
                        } else {
                            localStorage.removeItem(CURRENT_USER_KEY);
                            window.location.href = "../auth.html";
                        }
                    }
                });
            });
        }
    });
});