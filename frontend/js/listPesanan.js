document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.API_URL || 'http://localhost/paoman-batik/backend/public/api';
    const imageByName = {
        "Kain Batik Motif Ganggeng Pesisir": "../../img/batik1.jpg",
        "Kain Batik Motif Jarot Asem": "../../img/batik2.jpg",
        "Baju Batik Motif Kembang Kapas": "../../img/baju1.png",
        "Kain Batik Motif Kapal Kandas": "../../img/batik4.jpg",
        "Kain Batik Motif Kembang Gunda": "../../img/batik5.jpg",
        "Kemeja Batik Motif Iwak Etong": "../../img/baju2.png",
        "Kain Batik Motif Banji Tepak": "../../img/batik7.jpg",
        "Blus Batik Motif Kembang Karang": "../../img/baju3.png",
        "Kain Batik Motif Lokcan": "../../img/batik9.jpg",
        "Kemeja Batik Motif Kapal Laju": "../../img/baju4.png",
        "Kain Batik Motif Lasem Urang": "../../img/batik10.jpg",
        "Outer Batik Motif Jarot Asem": "../../img/baju5.png",
        "Tunik Batik Motif Kembang Kapas": "../../img/baju6.png",
        "Dress Batik Motif Kapal Kandas": "../../img/baju7.png",
        "Kain Batik Motif Kembang Gunda Premium": "../../img/batik5.jpg"
    };
    // 1. DATA SUMBER (Simulasi database)
    let dataPesanan = [
        { id: "#ORD-95628", customer: "Bayu", tanggal: "22 Apr 2026", total: 120000, bayar: "QRIS", status: "Diproses", produk: "Blus Batik Motif Kembang Karang", kategori: "Pakaian", jumlah: 5, image: "../../img/baju3.png" },
        { id: "#ORD-2023001", customer: "Budi Santoso", tanggal: "28 Feb 2026", total: 1500000, bayar: "E-Wallet", status: "Diproses", produk: "Kain Batik Motif Ganggeng Pesisir", kategori: "Kain Batik", jumlah: 30, image: "../../img/batik1.jpg" },
        { id: "#ORD-2023002", customer: "Siti Aminah", tanggal: "01 Mar 2026", total: 750000, bayar: "COD", status: "Diproses", produk: "Kemeja Batik Motif Iwak Etong", kategori: "Pakaian", jumlah: 5, image: "../../img/baju2.png" },
        { id: "#ORD-2023003", customer: "Andi Wijaya", tanggal: "02 Mar 2026", total: 2100000, bayar: "QRIS", status: "Siap Diambil", produk: "Kain Batik Motif Banji Tepak", kategori: "Kain Batik", jumlah: 28, image: "../../img/batik7.jpg" },
        { id: "#ORD-2023004", customer: "Rina Maria", tanggal: "03 Mar 2026", total: 450000, bayar: "E-Wallet", status: "Selesai", produk: "Tunik Batik Motif Kembang Kapas", kategori: "Pakaian", jumlah: 5, image: "../../img/baju6.png" },
        { id: "#ORD-2023005", customer: "Anwar", tanggal: "04 Mar 2026", total: 1200000, bayar: "COD", status: "Diproses", produk: "Kain Batik Motif Kembang Gunda", kategori: "Kain Batik", jumlah: 18, image: "../../img/batik5.jpg" }
    ];

    const tableBody = document.getElementById('orderTableBody');
    const orderCountText = document.getElementById('orderCountText');
    const modal = document.getElementById('orderModal');
    let currentEditId = null;

    function getAdmin() {
        return window.UserSession?.getCurrentUser?.() || null;
    }

    function formatDate(value) {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function statusToLabel(status) {
        const map = {
            pending: 'Diproses',
            dibayar: 'Diproses',
            diproses: 'Diproses',
            dikirim: 'Siap Diambil',
            selesai: 'Selesai',
            dibatalkan: 'Dibatalkan'
        };
        return map[String(status || '').toLowerCase()] || status || 'Diproses';
    }

    function statusToApi(label) {
        const map = {
            'Diproses': 'diproses',
            'Siap Diambil': 'dikirim',
            'Selesai': 'selesai',
            'Dibatalkan': 'dibatalkan'
        };
        return map[label] || 'diproses';
    }

    function paymentToLabel(status, method) {
        const metode = String(method || '').toLowerCase();
        const payment = String(status || '').toLowerCase();
        if (metode === 'cod' || payment === 'bayar_di_tempat') return 'COD';
        if (metode === 'ewallet') return 'E-Wallet';
        if (metode === 'qris') return 'QRIS';
        if (payment === 'dibayar') return 'Lunas';
        return 'Belum Bayar';
    }

    function normalizeImagePath(path) {
        if (!path) return '';
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

    async function loadOrdersFromApi() {
        const admin = getAdmin();
        if (!admin?.admin_id) {
            renderTable();
            return;
        }

        const { response, data } = await apiFetch(`/admin/pesanan?admin_id=${encodeURIComponent(admin.admin_id)}`);
        if (!response.ok || !data?.success || !Array.isArray(data.data)) {
            renderTable();
            return;
        }

        dataPesanan = data.data.map((order) => {
            const produk = order.nama_produk || 'Produk Batik';
            return {
                id: String(order.pesanan_id),
                customer: order.nama_pelanggan || '-',
                tanggal: formatDate(order.tanggal_pesanan),
                total: Number(order.total_harga || 0),
                bayar: paymentToLabel(order.payment_status, order.metode_pembayaran),
                status: statusToLabel(order.status_pesanan),
                produk,
                kategori: order.kategori || 'Produk Batik',
                jumlah: Number(order.total_jumlah || 0),
                image: normalizeImagePath(order.gambar_produk) || imageByName[produk] || '../../img/batik1.jpg'
            };
        });

        renderTable();
    }

    // 2. FUNGSI RENDER TABEL
    function renderTable(filterStatus = "Semua") {
        tableBody.innerHTML = "";
        const filteredData = filterStatus === "Semua" 
            ? dataPesanan 
            : dataPesanan.filter(item => item.status === filterStatus);

        filteredData.forEach(item => {
            const row = `
                <tr>
                    <td class="order-id">${item.id}</td>
                    <td class="customer"><div class="avatar-circle"></div> ${item.customer}</td>
                    <td>${item.tanggal}</td>
                    <td><strong>Rp ${item.total.toLocaleString('id-ID')}</strong></td>
                    <td><span class="badge ${item.bayar === 'Belum Bayar' ? 'belum-bayar' : 'lunas'}">${item.bayar}</span></td>
                    <td><span class="status-box ${getStatusClass(item.status)}">${item.status}</span></td>
                    <td><button class="btn-detail-trigger" data-id="${item.id}">DETAIL</button></td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        orderCountText.innerText = `Menampilkan ${filteredData.length} dari ${dataPesanan.length} pesanan`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Pasang ulang event listener untuk tombol detail yang baru dirender
        attachModalEvents();
    }

    function getStatusClass(status) {
        if (status === "Siap Diambil") return "siap";
        if (status === "Selesai") return "selesai";
        if (status === "Dibatalkan") return "batal";
        return "proses";
    }

    // 3. LOGIKA MODAL DETAIL
    function attachModalEvents() {
        document.querySelectorAll('.btn-detail-trigger').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const order = dataPesanan.find(p => p.id === id);
                if (order) {
                    currentEditId = id;
                    document.getElementById('modalOrderId').innerText = order.id;
                    document.getElementById('modalCustomer').innerText = order.customer;
                    document.getElementById('modalProductImage').src = order.image;
                    document.getElementById('modalProductImage').alt = order.produk;
                    document.getElementById('modalProductName').innerText = order.produk;
                    document.getElementById('modalProductMeta').innerText = `${order.kategori} | ${order.jumlah} item`;
                    document.getElementById('updateBayar').value = order.bayar;
                    document.getElementById('updateStatus').value = order.status;
                    modal.style.display = 'block';
                }
            };
        });
    }

    // Simpan Perubahan dari Modal
    document.getElementById('btnSimpanStatus').onclick = () => {
        const orderIndex = dataPesanan.findIndex(p => p.id === currentEditId);
        if (orderIndex !== -1) {
            const nextStatus = document.getElementById('updateStatus').value;
            dataPesanan[orderIndex].bayar = document.getElementById('updateBayar').value;
            dataPesanan[orderIndex].status = nextStatus;

            const admin = getAdmin();
            if (admin?.admin_id && /^\d+$/.test(String(currentEditId))) {
                apiFetch(`/pesanan/${currentEditId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        admin_id: admin.admin_id,
                        status_pesanan: statusToApi(nextStatus)
                    })
                });
            }
            
            modal.style.display = 'none';
            renderTable(); 
            alert("Status Pesanan " + currentEditId + " berhasil diperbarui!");
        }
    };

    // Tutup Modal
    document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };

    // 4. FITUR EKSPOR CSV
    document.getElementById('btnEksporCSV').addEventListener('click', () => {
        let csvContent = "ID Pesanan,Pelanggan,Tanggal,Total,Pembayaran,Status\n";
        dataPesanan.forEach(row => {
            csvContent += `${row.id},${row.customer},${row.tanggal},${row.total},${row.bayar},${row.status}\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Laporan_Pesanan.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // 5. FITUR BUAT PESANAN
    document.getElementById('btnTambahPesanan').addEventListener('click', () => {
        const namaInput = prompt("Masukkan Nama Pelanggan:");
        const totalInput = prompt("Masukkan Total Harga (Angka saja):");

        if (namaInput && totalInput) {
            const newOrder = {
                id: `#ORD-${new Date().getTime().toString().slice(-5)}`,
                customer: namaInput,
                tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                total: parseInt(totalInput),
                bayar: "COD",
                status: "Diproses",
                produk: "Kain Batik Motif Ganggeng Pesisir",
                kategori: "Kain Batik",
                jumlah: 1,
                image: "../../img/batik1.jpg"
            };
            dataPesanan.unshift(newOrder);
            renderTable();
            alert("Pesanan baru berhasil dibuat!");
        }
    });

    // 6. FITUR FILTER TAB
    document.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', function() {
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            renderTable(this.dataset.filter || "Semua");
        });
    });

    loadOrdersFromApi();
});

