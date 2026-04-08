// Fungsi untuk merender footer global
function createGlobalFooter() {
    const footerTemplate = `
    <footer>
        <div class="footer-container">
            <div class="footer-column branding">
                <div class="footer-logo">
                    <img src="../img/logo-red.jpg" alt="Logo"> 
                    <span class="brand-name">Batik Paoman</span>
                </div>
                <p class="description">
                    Kami berkomitmen untuk memberdayakan pengrajin lokal dan melestarikan warisan budaya Indonesia melalui batik berkualitas tinggi yang telah dikurasi secara ketat.
                </p>
                <div class="social-icons">
                    <a href="#" class="icon-circle"><i class="fas fa-globe"></i></a>
                    <a href="#" class="icon-circle"><i class="fas fa-share-alt"></i></a>
                    <a href="#" class="icon-circle"><i class="fas fa-envelope"></i></a>
                </div>
            </div>

            <div class="footer-column">
                <h3>NAVIGASI</h3>
                <ul>
                    <li><a href="index.html">Beranda</a></li>
                    <li><a href="pemesanan.html">Pemesanan</a></li>
                    <li><a href="#produk">Produk</a></li>
                    <li><a href="kontak.html">Kontak</a></li>
                </ul>
            </div>

            <div class="footer-column">
                <h3>HUBUNGI KAMI</h3>
                <ul>
                    <li>081911315662</li>
                    <li><a href="#">Kebijakan Pengembalian</a></li>
                    <li><a href="#">Syarat & Ketentuan</a></li>
                </ul>
            </div>

            <div class="footer-column">
                <h3>TOKO OFFLINE</h3>
                <p>Jl. Siliwangi No.10, Paoman, Kec. Indramayu, Kabupaten Indramayu, Jawa Barat 45211</p>
                <p class="hours">Senin - Minggu: 09:00 - 21:00</p>
            </div>
        </div>
    </footer>
    `;

    // Mencari tag <div id="footer-placeholder"> atau menyisipkan di akhir body
    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
        placeholder.innerHTML = footerTemplate;
    } else {
        document.body.insertAdjacentHTML('beforeend', footerTemplate);
    }
}

// Jalankan fungsi saat DOM selesai dimuat
document.addEventListener('DOMContentLoaded', createGlobalFooter);