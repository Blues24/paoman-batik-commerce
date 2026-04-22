document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    navItems.forEach(item => {
        const href = item.getAttribute('href');

        // 1. Logika untuk menentukan menu mana yang "Active" berdasarkan URL
        if (page === href || (page === '' && href === '../../src/admin/dasboard.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }

        // 2. Event Listener untuk Logout (Opsional)
        if (item.classList.contains('logout')) {
            item.addEventListener('click', (e) => {
                if(!confirm("Apakah anda yakin ingin keluar?")) {
                    e.preventDefault();
                }
            });
        }
    });
});