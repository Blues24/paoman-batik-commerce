document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA SUMBER (Gunakan data yang sama dengan stok agar sinkron)
    let dataProduk = [
        { id: 1, nama: "Tangga Istana", harga: 150000, stok: 21, img: "../../img/batik7.jpg" },
        { id: 2, nama: "Godong Asem", harga: 135000, stok: 6, img: "../../img/batik3.jpg" },
        { id: 3, nama: "Kembang Kapas", harga: 120000, stok: 0, img: "../../img/batik3.jpg" },
        { id: 4, nama: "Sido Mukti", harga: 160000, stok: 15, img: "../../img/batik7.jpg" },
    ];

    const productGrid = document.getElementById('productGrid');

    function renderProduk() {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        dataProduk.forEach(p => {
            // Logika Status Badge
            const statusText = p.stok > 0 ? "TERSEDIA" : "HABIS";
            const statusClass = p.stok > 0 ? "badge-tersedia" : "badge-habis";

            // Format Harga ke Rupiah
            const formatHarga = p.harga ? `Rp ${p.harga.toLocaleString('id-ID')}` : "Rp N/A";

            const productCard = `
                <div class="product-card">
                    <div class="image-container">
                        <span class="badge-status ${statusClass}">${statusText}</span>
                        <img src="${p.img}" alt="${p.nama}">
                    </div>
                    <div class="product-info">
                        <h4>${p.nama}</h4>
                        <p class="price">${formatHarga}</p>
                        <div class="action-buttons">
                            <button class="btn-icon outline btn-edit" data-id="${p.id}"><i data-lucide="pencil"></i></button>
                            <button class="btn-icon outline btn-delete" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
                            <button class="btn-view" data-id="${p.id}"><i data-lucide="eye"></i></button>
                        </div>
                    </div>
                </div>
            `;
            productGrid.insertAdjacentHTML('beforeend', productCard);
        });

        // Jalankan Lucide Icon setelah render
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Tambahkan Event Listener untuk tombol
        attachEventListeners();
    }

    function attachEventListeners() {
        // Logika Hapus
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                    dataProduk = dataProduk.filter(p => p.id !== id);
                    renderProduk();
                }
            };
        });

        // Logika View/Edit (Bisa dikembangkan ke Modal atau halaman baru)
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.onclick = () => alert('Menampilkan detail produk ID: ' + btn.dataset.id);
        });
    }

    renderProduk();
});