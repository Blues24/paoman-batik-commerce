document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.API_URL || 'http://localhost/paoman-batik/backend/public/api';

    const BASE_IMAGE_URL = '../img/uploads';

    const fallbackImages = [
        '../../img/batik1.jpg',
        '../../img/batik2.jpg',
        '../../img/batik3.jpg',
        '../../img/batik4.jpg',
        '../../img/batik5.jpg',
        '../../img/batik6.jpg',
        '../../img/batik7.jpg',
        '../../img/batik8.jpg',
        '../../img/batik9.jpg',
        '../../img/batik10.jpg',
        '../../img/baju1.png',
        '../../img/baju2.png',
        '../../img/baju3.png',
        '../../img/baju4.png',
        '../../img/baju5.png',
        '../../img/baju6.png',
        '../../img/baju7.png'
    ];
    const canonicalCatalog = [
        { nama: 'Kain Batik Motif Tangga Istana', image: '../../img/batik1.jpg' },
        { nama: 'Kain Batik Motif Godong Asem', image: '../../img/batik2.jpg' },
        { nama: 'Kain Batik Motif Kembang Gunda', image: '../../img/batik3.jpg' },
        { nama: 'Kain Batik Motif Ganggeng Manuk', image: '../../img/batik4.jpg' },
        { nama: 'Kain Batik Motif Srempang Kandang', image: '../../img/batik5.jpg' },
        { nama: 'Kain Batik Motif Lasemurang', image: '../../img/batik6.jpg' },
        { nama: 'Kain Batik Motif Kembang Kapas', image: '../../img/batik7.jpg' },
        { nama: 'Kain Batik Motif Mangga Bambu', image: '../../img/batik8.jpg' },
        { nama: 'Kain Batik Motif Cuiri', image: '../../img/batik9.jpg' },
        { nama: 'Kain Batik Motif Sekar Niem', image: '../../img/batik10.jpg' },
        { nama: 'Baju Batik Motif Godong Asem', image: '../../img/baju1.png' },
        { nama: 'Kemeja Batik Motif Kentangan', image: '../../img/baju2.png' },
        { nama: 'Kemeja Batik Motif Sekar Niem', image: '../../img/baju3.png' },
        { nama: 'Kemeja Batik Motif Lasemurang', image: '../../img/baju4.png' },
        { nama: 'Baju Batik Motif Kentangan', image: '../../img/baju5.png' },
        { nama: 'Baju Batik Motif Sekar Niem', image: '../../img/baju6.png' },
        { nama: 'Baju Batik Motif Liris atau Parang', image: '../../img/baju7.png' }
    ];
    const canonicalByName = new Map(canonicalCatalog.map((item, index) => [item.nama, { ...item, order: index + 1 }]));

    let dataProduk = [];

    const productGrid = document.getElementById('productGrid');
    const modal = document.getElementById('modalProduk');
    const btnTambahList = Array.from(document.querySelectorAll('#btnTambahProduk'));
    const btnClose = document.querySelector('.close-modal');
    const formProduk = document.getElementById('formProduk');
    
    function getAdmin() {
        return window.UserSession?.getCurrentUser?.() || null;
    }

    function showMessage(message, type = 'info') {
        if (window.Swal) {
            Swal.fire({
                title: type === 'error' ? 'Gagal' : 'Informasi',
                text: message,
                icon: type
            });
            return;
        }

        alert(message);
    }

    async function apiFetch(endpoint, options = {}) {
        const admin = getAdmin();
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': sessionStorage.getItem('csrf_token') || localStorage.getItem('csrf_token') || '',
            ...(options.headers || {})
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            ...options,
            headers
        });
        const data = await response.json().catch(() => null);
        return { response, data, admin };
    }

    function formatHarga(value) {
        return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
    }

    function getProductImage(product, index = 0) {
        const rawPath = product.gambar_produk || "";

        // 1. Jika path adalah katalog statis (data lama)
        if (rawPath.includes('../img/')) {
            return rawPath.replace('../img/', '../../img/');
        }

        // 2. Jika hasil upload (Data mengandung "uploads/")
        if (rawPath && rawPath.trim() !== "") {
            // Jika di DB isinya "uploads/namafile.jpg", 
            // kita cukup arahkan ke folder img frontend
            return `../../img/${rawPath.replace('uploads/', 'uploads/')}`;
        }

        // 3. Fallback ke Canonical (Katalog bawaan)
        const canonical = canonicalByName.get(product.nama_produk);
        if (canonical && canonical.image) {
            return canonical.image.replace('../img/', '../../img/');
        }

        return fallbackImages[index % fallbackImages.length];
    }

    async function loadProduk() {
        if (!productGrid) return;
        productGrid.innerHTML = '<div class="empty-products">Memuat produk...</div>';

        try {
            const { response, data } = await apiFetch('/produk');
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Produk belum bisa dimuat.');
            }

            // Kita mapping data agar gambar_produk tidak langsung tertimpa oleh canonical
            // Di dalam function loadProduk()
            const mapped = data.data.map((product) => {
                // Ambil stok dari response API
                // Pastikan field 'stok' atau 'total_stok' benar-benar diambil
                const currentStok = product.stok ?? product.total_stok ?? 0;

                return {
                    ...product,
                    stok: Number(currentStok), // Simpan secara konsisten sebagai angka
                    harga_mulai: product.harga_mulai || 0,
                    gambar_produk: product.gambar_produk
                };
            });

            dataProduk = mapped.sort((a, b) => {
                const orderA = canonicalByName.get(a.nama_produk)?.order || 999;
                const orderB = canonicalByName.get(b.nama_produk)?.order || 999;
                return orderA - orderB;
            });

            renderProduk();
        } catch (error) {
            productGrid.innerHTML = `<div class="empty-products">${error.message}</div>`;
        }
    }

    function renderProduk() {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        if (dataProduk.length === 0) {
            productGrid.innerHTML = '<div class="empty-products">Belum ada produk di database.</div>';
            return;
        }

        dataProduk.forEach((product, index) => {
            const stok = getProductStock(product);
            const statusText = stok > 0 ? 'TERSEDIA' : 'HABIS';
            const statusClass = stok > 0 ? 'badge-tersedia' : 'badge-habis';

            // Panggil fungsi getProductImage yang sudah direfactor
            const image = getProductImage(product, index);

            const productCard = `
                <div class="product-card">
                    <div class="image-container">
                        <span class="badge-status ${statusClass}">${statusText}</span>
                        <img src="${image}" alt="${product.nama_produk}" onerror="this.src='../../img/default-batik.jpg'">
                    </div>
                    <div class="product-info">
                        <h4 title="${product.nama_produk}">${product.nama_produk}</h4>
                        <p class="product-meta">Stok ${stok}</p>
                        <p class="price">${formatHarga(product.harga_mulai)}</p>
                        <div class="action-buttons">
                            <button class="btn-icon outline btn-delete" data-id="${product.produk_id}" title="Nonaktifkan produk">
                                <i data-lucide="trash-2"></i>
                            </button>
                            <button class="btn-view" data-id="${product.produk_id}">
                                <i data-lucide="eye"></i> Detail
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productGrid.insertAdjacentHTML('beforeend', productCard);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
        attachEventListeners();
    }

    function getProductStock(product) {
        const stockVal = product.total_stok ?? product.stok ?? 0;
        return Number(stockVal);
    }

    function openModal() {
        formProduk.reset();

        const previewContainer = document.getElementById('previewContainer');
        if (previewContainer) previewContainer.style.display = 'none';
        //  Buka form
        modal.style.display = 'block';

        //  Pastikan scroll body utama mati saat modal buka (agar tidak double scroll)
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Aktifkan kembali scroll utama
    }

    function renderProduk() {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        if (dataProduk.length === 0) {
            productGrid.innerHTML = '<div class="empty-products">Belum ada produk di database.</div>';
            return;
        }

        dataProduk.forEach((product, index) => {
            const stok = getProductStock(product);
            const statusText = stok > 0 ? 'TERSEDIA' : 'HABIS';
            const statusClass = stok > 0 ? 'badge-tersedia' : 'badge-habis';
            const image = getProductImage(product, index);

            const productCard = `
                <div class="product-card">
                    <div class="image-container">
                        <span class="badge-status ${statusClass}">${statusText}</span>
                        <img src="${image}" alt="${product.nama_produk}">
                    </div>
                    <div class="product-info">
                        <h4 title="${product.nama_produk}">${product.nama_produk}</h4>
                        <p class="product-meta">Stok ${stok}</p>
                        <p class="price">${formatHarga(product.harga_mulai)}</p>
                        <div class="action-buttons">
                            <button class="btn-icon outline btn-delete" data-id="${product.produk_id}" title="Nonaktifkan produk"><i data-lucide="trash-2"></i></button>
                            <button class="btn-view" data-id="${product.produk_id}"><i data-lucide="eye"></i> Detail</button>
                        </div>
                    </div>
                </div>
            `;
            productGrid.insertAdjacentHTML('beforeend', productCard);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
        attachEventListeners();
    }

    async function createProduk(event) {
        event.preventDefault();

        const admin = getAdmin();
        if (!admin?.admin_id) {
            showMessage('Login admin dulu sebelum menambah produk.', 'warning');
            return;
        }

        // Gunakan FormData untuk mengirim file[cite: 1]
        const formData = new FormData();
        const fileInput = document.getElementById('imgProdukFile'); // Input file baru

        formData.append('admin_id', admin.admin_id);
        formData.append('nama_produk', document.getElementById('namaProduk').value.trim());
        formData.append('harga', document.getElementById('hargaProduk').value);
        formData.append('stok', document.getElementById('stokProduk').value);

        // Tambahkan file gambar jika ada
        if (fileInput.files[0]) {
            formData.append('gambar_produk', fileInput.files[0]);
        }

        try {
            // Kirim tanpa header Content-Type (biarkan browser set otomatis ke multipart/form-data)
            const response = await fetch(`${API_URL}/admin/tambah-produk`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-Token': sessionStorage.getItem('csrf_token') || ''
                }
            });

            const data = await response.json();

            if (!response.ok || !data?.success) {
                showMessage(data?.message || 'Produk gagal ditambahkan.', 'error');
                return;
            }

            closeModal();
            await loadProduk();
            showMessage('Produk berhasil ditambahkan ke server.', 'success');
        } catch (error) {
            showMessage('Terjadi kesalahan saat upload.', 'error');
        }
    }

    function attachEventListeners() {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = async () => {
                const admin = getAdmin();
                if (!admin?.admin_id) {
                    showMessage('Login admin dulu sebelum mengubah produk.', 'warning');
                    return;
                }

                const ok = confirm('Nonaktifkan produk ini dari katalog?');
                if (!ok) return;

                const { response, data } = await apiFetch(`/produk/${btn.dataset.id}`, {
                    method: 'DELETE',
                    body: JSON.stringify({ admin_id: admin.admin_id })
                });

                if (!response.ok || !data?.success) {
                    showMessage(data?.message || 'Produk gagal dinonaktifkan.', 'error');
                    return;
                }

                await loadProduk();
            };
        });
    }

    // Preview gambar sebelum di upload
    const fileInput = document.getElementById('imgProdukFile');
    const imgPreview = document.getElementById('imgPreview');
    const previewContainer = document.getElementById('previewContainer');

    fileInput.onchange = evt => {
        const [file] = fileInput.files;
        if (file) {
            imgPreview.src = URL.createObjectURL(file);
            previewContainer.style.display = 'block';
        }
    }

    btnTambahList.forEach((button) => {
        button.onclick = openModal;
    });

    if (btnClose) {
        btnClose.onclick = closeModal;
    }

    window.onclick = (event) => {
        if (event.target === modal) closeModal();
    };

    if (formProduk) {
        formProduk.onsubmit = createProduk;
    }

    loadProduk();
});
