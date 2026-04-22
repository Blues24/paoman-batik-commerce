// navigasiAdmin.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Handling Active Navigation
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Jika bukan link logout, atur status active
            if (!this.classList.contains('logout')) {
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // 3. Logika Filter Laporan Penjualan (Mockup)
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const period = e.target.value;
            console.log(`Menampilkan laporan untuk: ${period}`);
            // Di sini kamu bisa memanggil fungsi fetch data dari API nantinya
            alert(`Filter diganti ke ${period}. Data akan diperbarui.`);
        });
    }

    // 4. Logika Tombol Logout
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah pindah halaman langsung
            
            const konfirmasi = confirm("Apakah Anda yakin ingin keluar dari sistem?");
            if (konfirmasi) {
                console.log("Admin Logging out...");
                // Hapus session/token di sini jika ada
                // localStorage.removeItem('adminToken');
                
                // Redirect ke halaman login
                window.location.href = "login.html"; 
            }
        });
    }

    // 5. Animasi Chart Bar (Opsional - Memberikan efek naik saat load)
    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => {
        const targetHeight = bar.style.height;
        bar.style.height = '0';
        setTimeout(() => {
            bar.style.transition = 'height 0.8s ease-out';
            bar.style.height = targetHeight;
        }, 100);
    });
});

/**
 * Fungsi pembantu untuk memformat mata uang Rupiah
 * Bisa dipanggil saat kamu memasukkan data real dari database
 */
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}