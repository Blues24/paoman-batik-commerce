document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA SUMBER (Data awal)
    let dataProduk = [
        { id: 1, nama: "Tangga Istana", harga: 150000, stok: 21, img: "../../img/batik7.jpg" },
        { id: 2, nama: "Godong Asem", harga: 135000, stok: 6, img: "../../img/batik3.jpg" },
        { id: 3, nama: "Kembang Kapas", harga: 120000, stok: 0, img: "../../img/batik3.jpg" },
        { id: 4, nama: "Sido Mukti", harga: 160000, stok: 15, img: "../../img/batik7.jpg" },
    ];

    const productGrid = document.getElementById('productGrid');
    const modal = document.getElementById('modalProduk');
    const btnTambah = document.getElementById('btnTambahProduk');
    const btnClose = document.querySelector('.close-modal');
    const formProduk = document.getElementById('formProduk');

    // --- Logika Buka/Tutup Modal ---
    if (btnTambah) {
        btnTambah.onclick = () => { modal.style.display = "block"; };
    }

    btnClose.onclick = () => { modal.style.display = "none"; };

    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    };

    // --- Logika Tambah Data ---
    formProduk.onsubmit = (e) => {
        e.preventDefault();

        const baru = {
            id: Date.now(), // Gunakan timestamp sebagai ID unik
            nama: document.getElementById('namaProduk').value,
            harga: parseInt(document.getElementById('hargaProduk').value),
            stok: parseInt(document.getElementById('stokProduk').value),
            img: document.getElementById('imgProduk').value
        };

        // Masukkan data baru ke array utama
        dataProduk.push(baru);

        // Jalankan ulang fungsi render untuk memperbarui tampilan
        renderProduk(); 
        
        // Bersihkan form dan tutup modal
        formProduk.reset();
        modal.style.display = "none";
    };

    function renderProduk() {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        dataProduk.forEach(p => {
            const statusText = p.stok > 0 ? "TERSEDIA" : "HABIS";
            const statusClass = p.stok > 0 ? "badge-tersedia" : "badge-habis";
            const formatHarga = `Rp ${p.harga.toLocaleString('id-ID')}`;

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

        if (typeof lucide !== 'undefined') lucide.createIcons();
        attachEventListeners();
    }

    function attachEventListeners() {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => {
                const id = Number(btn.dataset.id);
                if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                    dataProduk = dataProduk.filter(p => p.id !== id);
                    renderProduk();
                }
            };
        });
    }

    // Jalankan render pertama kali saat halaman dimuat
    renderProduk();
});