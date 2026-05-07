document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.API_URL || 'http://localhost/paoman-batik/backend/public/api';
    const admin = window.UserSession?.getCurrentUser?.() || { admin_id: 1 };

    function rupiah(value) {
        return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
    }

    function imagePath(path) {
        if (!path) return '../../img/batik1.jpg';
        if (path.startsWith('http')) return path;
        if (path.includes('uploads/')) return `../../img/uploads/${path.split('/').pop()}`;
        return path.replace('../img/', '../../img/');
    }

    async function apiGet(endpoint) {
        const res = await fetch(`${API_URL}${endpoint}`, { credentials: 'include' });
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload?.success) {
            throw new Error(payload?.message || 'Data gagal dimuat');
        }
        return payload.data;
    }

    async function renderStats() {
        const stats = await apiGet(`/admin/statistik-dashboard?admin_id=${encodeURIComponent(admin.admin_id || 1)}`);
        document.getElementById('stat-total-produk').textContent = stats.total_produk ?? 0;
        document.getElementById('stat-produk-aktif').textContent = stats.total_produk ?? 0;
        document.getElementById('stat-total-pesanan').textContent = stats.total_pesanan ?? 0;
        document.getElementById('stat-total-user').textContent = stats.total_pelanggan ?? 0;
    }

    async function renderHistory() {
        const orders = await apiGet(`/admin/pesanan?admin_id=${encodeURIComponent(admin.admin_id || 1)}`);
        const list = document.querySelector('.history-list');
        if (!list) return;

        list.innerHTML = '';
        orders.slice(0, 5).forEach((order) => {
            const status = String(order.status_pesanan || '').toLowerCase();
            const badgeClass = status === 'selesai' ? 'success' : 'warning';
            const badgeText = status === 'selesai' ? 'SUKSES' : status.toUpperCase() || 'MENUNGGU';

            list.insertAdjacentHTML('beforeend', `
                <div class="history-item">
                    <i data-lucide="user" class="item-avatar"></i>
                    <div class="item-info">
                        <strong>${order.nama_pelanggan || '-'}</strong>
                        <span>Order #${order.pesanan_id} - ${order.nama_produk || 'Produk Batik'}</span>
                    </div>
                    <div class="item-status">
                        <strong class="price-sm">${rupiah(order.total_harga)}</strong>
                        <span class="status-badge ${badgeClass}">${badgeText}</span>
                    </div>
                </div>
            `);
        });

        if (orders.length === 0) {
            list.innerHTML = '<p style="color:#6b7280">Belum ada riwayat pembelian.</p>';
        }
    }

    async function renderStock() {
        const products = await apiGet('/produk');
        const tbody = document.querySelector('.table-card tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        products.slice(0, 8).forEach((product, index) => {
            const stock = Number(product.total_stok || 0);
            const statusClass = stock === 0 ? 'red' : stock <= 10 ? 'yellow' : 'green';
            const statusText = stock === 0 ? 'Stok Habis' : stock <= 10 ? 'Stok Sedikit' : 'Stok Banyak';

            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td class="product-cell">
                        <img src="${imagePath(product.gambar_produk)}" alt="${product.nama_produk}">
                        ${product.nama_produk}
                    </td>
                    <td>PB-${String(index + 1).padStart(3, '0')}</td>
                    <td>${product.nama_jenis || 'Batik'}</td>
                    <td class="${stock === 0 ? 'text-red' : ''}">${stock}</td>
                    <td><span class="status-pill ${statusClass}">${statusText}</span></td>
                    <td><a href="kelolaStok.html"><i data-lucide="pencil"></i></a></td>
                </tr>
            `);
        });
    }

    (async () => {
        try {
            await Promise.all([renderStats(), renderHistory(), renderStock()]);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (error) {
            console.warn('[Dashboard Admin]', error.message);
        }
    })();
});
