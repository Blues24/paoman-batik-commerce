document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.API_URL || 'http://localhost/paoman-batik/backend/public/api';
    let produkData = [];
    let currentFilter = 'Semua';

    const tableBody = document.getElementById('stokTableBody');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const modalEdit = document.getElementById('modalEdit');

    function getImage(path) {
        if (!path) return '../../img/batik1.jpg';
        return path.replace('../img/', '../../img/');
    }

    async function apiFetch(endpoint, options = {}) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            credentials: 'include',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': sessionStorage.getItem('csrf_token') || localStorage.getItem('csrf_token') || '',
                ...(options.headers || {})
            }
        });
        const data = await response.json().catch(() => null);
        return { response, data };
    }

    async function loadProduk() {
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="7">Memuat stok produk...</td></tr>';

        try {
            const { response, data } = await apiFetch('/produk');
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Stok belum bisa dimuat.');
            }

            const detailResults = await Promise.allSettled(
                data.data.map((product) => apiFetch(`/produk/${product.produk_id}`))
            );

            produkData = data.data.map((product, index) => {
                const detail = detailResults[index];
                const detailData = detail.status === 'fulfilled' && detail.value.data?.success
                    ? detail.value.data.data
                    : null;
                const varian = Array.isArray(detailData?.varian) ? detailData.varian : [];
                const stok = varian.reduce((sum, item) => sum + (Number(item.stok) || 0), 0);

                return {
                    id: Number(product.produk_id),
                    varianId: Number(varian[0]?.detail_batik_id || 0),
                    nama: product.nama_produk,
                    kode: `PB-${String(index + 1).padStart(3, '0')}`,
                    stok,
                    satuan: product.nama_produk.startsWith('Kain') ? 'Lembar' : 'Pcs',
                    img: getImage(product.gambar_produk),
                    ukuran: varian[0]?.ukuran || (product.nama_produk.startsWith('Kain') ? '2m' : 'Dewasa M'),
                    warna: varian[0]?.warna || 'Biru',
                    bahan: varian[0]?.bahan || 'Katun',
                    harga: Number(varian[0]?.harga || product.harga_mulai || 0)
                };
            });

            renderApp();
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
        }
    }

    function renderApp() {
        renderTable();
        updateFilterCounters();
    }

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const displayData = produkData.filter(item => {
            if (currentFilter === 'Stock Banyak') return item.stok > 10;
            if (currentFilter === 'Stock Sedikit') return item.stok > 0 && item.stok <= 10;
            if (currentFilter === 'Stock Habis') return item.stok === 0;
            return true;
        });

        if (displayData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">Tidak ada produk untuk filter ini.</td></tr>';
        }

        displayData.forEach(p => {
            const status = getStatusLabel(p.stok);
            const row = `
                <tr>
                    <td><img src="${p.img}" alt="${p.nama}" class="img-product"></td>
                    <td>${p.nama}</td>
                    <td class="text-muted">${p.kode}</td>
                    <td class="${p.stok === 0 ? 'text-danger' : ''}"><strong>${p.stok}</strong></td>
                    <td>${p.satuan}</td>
                    <td><span class="badge ${status.color}">${status.text}</span></td>
                    <td>
                        <button class="btn-icon btn-edit" data-id="${p.id}"><i data-lucide="pencil"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        const info = document.getElementById('paginationInfo');
        if (info) info.textContent = `Menampilkan ${displayData.length} dari ${produkData.length} Produk`;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        attachActionEvents();
    }

    function updateFilterCounters() {
        const counts = {
            banyak: produkData.filter(p => p.stok > 10).length,
            sedikit: produkData.filter(p => p.stok > 0 && p.stok <= 10).length,
            habis: produkData.filter(p => p.stok === 0).length
        };

        const banyakBadge = document.querySelector('.count.green');
        const sedikitBadge = document.querySelector('.count.yellow');
        const habisBadge = document.querySelector('.count.red');

        if (banyakBadge) banyakBadge.textContent = counts.banyak;
        if (sedikitBadge) sedikitBadge.textContent = counts.sedikit;
        if (habisBadge) habisBadge.textContent = counts.habis;
    }

    function getStatusLabel(stok) {
        if (stok > 10) return { text: 'Stok Banyak', color: 'green' };
        if (stok > 0) return { text: 'Stok Sedikit', color: 'yellow' };
        return { text: 'Stok Habis', color: 'red' };
    }

    function attachActionEvents() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => {
                const item = produkData.find(p => p.id === Number(btn.dataset.id));
                if (!item) return;

                document.getElementById('editIndex').value = item.id;
                document.getElementById('editNama').value = item.nama;
                document.getElementById('editStokValue').value = item.stok;
                modalEdit.style.display = 'flex';
            };
        });
    }

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => modalEdit.style.display = 'none';
    });

    window.onclick = (event) => {
        if (event.target === modalEdit) modalEdit.style.display = 'none';
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.childNodes[0].textContent.trim();
            renderTable();
        });
    });

    const formEdit = document.getElementById('formEditStok');
    if (formEdit) {
        formEdit.onsubmit = async (event) => {
            event.preventDefault();
            const id = Number(document.getElementById('editIndex').value);
            const newStok = Number(document.getElementById('editStokValue').value);
            const item = produkData.find(p => p.id === id);

            if (!item) return;
            item.stok = newStok;
            modalEdit.style.display = 'none';
            renderApp();

            const currentUser = window.UserSession?.getCurrentUser?.();
            if (currentUser?.admin_id && item.varianId) {
                await apiFetch(`/varian/${item.varianId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        admin_id: currentUser.admin_id,
                        ukuran: item.ukuran,
                        warna: item.warna,
                        bahan: item.bahan,
                        harga: item.harga,
                        stok: newStok
                    })
                });
            }
        };
    }

    loadProduk();
});
