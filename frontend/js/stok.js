document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA SUMBER
    let produkData = [
        { id: 1, nama: "Tangga Istana", kode: "BT-TI-26", kategori: "Batik", stok: 21, satuan: "Pasang", img: "../../img/batik7.jpg" },
        { id: 2, nama: "Godong Asem", kode: "BT-GA-26", kategori: "Batik", stok: 6, satuan: "Pasang", img: "../../img/batik3.jpg" },
        { id: 3, nama: "Kembang Kapas", kode: "BT-KK-26", kategori: "Batik", stok: 0, satuan: "Pasang", img: "../../img/batik3.jpg" },
        { id: 4, nama: "Sido Mukti", kode: "BT-SM-26", kategori: "Batik", stok: 15, satuan: "Pasang", img: "../../img/batik7.jpg" },
    ];

    let currentFilter = 'Semua';
    const tableBody = document.getElementById('stokTableBody');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const modalEdit = document.getElementById('modalEdit');

    function renderApp() {
        renderTable();
        updateFilterCounters();
    }

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        // 2. LOGIKA FILTER
        let displayData = produkData.filter(item => {
            if (currentFilter === 'Stock Banyak') return item.stok > 10;
            if (currentFilter === 'Stock Sedikit') return item.stok > 0 && item.stok <= 10;
            if (currentFilter === 'Stock Habis') return item.stok === 0;
            return true; 
        });

        // 3. LOGIKA SORTING (Terbanyak ke Terkecil)
        displayData.sort((a, b) => b.stok - a.stok);

        displayData.forEach(p => {
            const status = getStatusLabel(p.stok);
            const row = `
                <tr>
                    <td><img src="${p.img}" alt="Batik" class="img-product"></td>
                    <td>${p.nama}</td>
                    <td class="text-muted">${p.kode}</td>
                    <td>${p.kategori}</td>
                    <td class="${p.stok === 0 ? 'text-danger' : ''}"><strong>${p.stok}</strong></td>
                    <td>${p.satuan}</td>
                    <td><span class="badge ${status.color}">${status.text}</span></td>
                    <td>
                        <button class="btn-icon btn-edit" data-id="${p.id}"><i data-lucide="pencil"></i></button>
                        <button class="btn-icon btn-delete" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        // Update Pagination Info
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
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                if (confirm('Hapus produk ini dari daftar stok?')) {
                    produkData = produkData.filter(p => p.id !== id);
                    renderApp();
                }
            };
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                const item = produkData.find(p => p.id === id);
                if (item) {
                    document.getElementById('editIndex').value = item.id;
                    document.getElementById('editNama').value = item.nama;
                    document.getElementById('editStokValue').value = item.stok;
                    modalEdit.style.display = 'flex';
                }
            };
        });
    }

    // Modal Close Logic
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => modalEdit.style.display = 'none';
    });

    window.onclick = (event) => {
        if (event.target == modalEdit) modalEdit.style.display = 'none';
    };

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.childNodes[0].textContent.trim();
            renderTable();
        });
    });

    // Form Edit Submit
    const formEdit = document.getElementById('formEditStok');
    if (formEdit) {
        formEdit.onsubmit = (e) => {
            e.preventDefault();
            const id = parseInt(document.getElementById('editIndex').value);
            const newStok = parseInt(document.getElementById('editStokValue').value);
            const index = produkData.findIndex(p => p.id === id);
            
            if (index !== -1) {
                produkData[index].stok = newStok;
                modalEdit.style.display = 'none';
                renderApp();
            }
        };
    }

    renderApp();
});