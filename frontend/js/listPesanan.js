document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA SUMBER (Simulasi database)
    let dataPesanan = [
        { id: "#ORD-95628", customer: "Bayu", tanggal: "22 Apr 2026", total: 120000, bayar: "Belum Bayar", status: "Diproses" },
        { id: "#ORD-2023001", customer: "Budi Santoso", tanggal: "28 Feb 2026", total: 1500000, bayar: "Lunas", status: "Diproses" },
        { id: "#ORD-2023002", customer: "Siti Aminah", tanggal: "01 Mar 2026", total: 750000, bayar: "Belum Bayar", status: "Diproses" },
        { id: "#ORD-2023003", customer: "Andi Wijaya", tanggal: "02 Mar 2026", total: 2100000, bayar: "Lunas", status: "Siap Diambil" },
        { id: "#ORD-2023004", customer: "Rina Maria", tanggal: "03 Mar 2026", total: 450000, bayar: "Lunas", status: "Selesai" },
        { id: "#ORD-2023005", customer: "Anwar", tanggal: "04 Mar 2026", total: 1200000, bayar: "Belum Bayar", status: "Diproses" }
    ];

    const tableBody = document.getElementById('orderTableBody');
    const orderCountText = document.getElementById('orderCountText');
    const modal = document.getElementById('orderModal');
    let currentEditId = null;

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
                    <td><span class="badge ${item.bayar === 'Lunas' ? 'lunas' : 'belum-bayar'}">● ${item.bayar}</span></td>
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
            dataPesanan[orderIndex].bayar = document.getElementById('updateBayar').value;
            dataPesanan[orderIndex].status = document.getElementById('updateStatus').value;
            
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
                bayar: "Belum Bayar",
                status: "Diproses"
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

    renderTable();
});