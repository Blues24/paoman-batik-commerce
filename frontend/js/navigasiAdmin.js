document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item:not(.logout)');
    const pageTitle = document.getElementById('page-title');
    const contentArea = document.getElementById('content-area');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. Ubah UI Aktif di Sidebar
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 2. Ubah Title Header
            const target = item.getAttribute('data-target');
            pageTitle.innerText = item.innerText.trim();

            // 3. Logika Pergantian Konten (Simulasi)
            if (target !== 'dashboard') {
                contentArea.innerHTML = `
                    <div class="card">
                        <h2>Halaman ${item.innerText.trim()}</h2>
                        <p>Konten untuk bagian ini sedang dalam pengembangan.</p>
                    </div>
                `;
            } else {
                // Refresh halaman untuk kembali ke Dashboard (atau simpan HTML asli)
                location.reload(); 
            }
        });
    });
});