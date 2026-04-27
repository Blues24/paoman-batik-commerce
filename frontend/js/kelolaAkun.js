document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('customAlert');
    const btnCancel = document.getElementById('btnCancel');
    const btnConfirm = document.getElementById('btnConfirm');
    let rowToDelete = null;

    // Fungsi buka modal
    function openModal(row, username) {
        rowToDelete = row;
        document.getElementById('modalMessage').innerText = `Akun "${username}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`;
        modal.style.display = 'flex';
    }

    // Fungsi tutup modal
    function closeModal() {
        modal.style.display = 'none';
        rowToDelete = null;
    }

    // Event Listener untuk tombol delete di tabel
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const username = row.querySelector('td:nth-child(2) strong').textContent;
            openModal(row, username);
        });
    });

    // Klik Batal
    btnCancel.addEventListener('click', closeModal);

    // Klik Konfirmasi Hapus
    btnConfirm.addEventListener('click', () => {
        if (rowToDelete) {
            rowToDelete.style.transition = '0.3s';
            rowToDelete.style.opacity = '0';
            rowToDelete.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                rowToDelete.remove();
                closeModal();
                // Opsional: Tampilkan notifikasi sukses kecil di pojok
                console.log("Data berhasil dihapus.");
            }, 300);
        }
    });

    // Tutup modal jika klik di luar box putih
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
});


    // Tambahkan logika ini di dalam DOMContentLoaded kelolaAkun.js
const editModal = document.getElementById('editModal');
const formEdit = document.getElementById('formEditUser');
let currentRow = null;

// Fungsi Buka Modal Edit
document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', function() {
        currentRow = this.closest('tr');
        
        // Ambil data dari baris tabel
        const username = currentRow.querySelector('td:nth-child(2) strong').textContent;
        const email = currentRow.querySelector('td:nth-child(3)').textContent;
        const role = currentRow.querySelector('.badge[class*="badge-admin"], .badge[class*="badge-customer"]').textContent;
        const status = currentRow.querySelector('.badge[class*="badge-active"], .badge[class*="badge-inactive"]').textContent;

        // Isi form modal dengan data tersebut
        document.getElementById('editUsername').value = username;
        document.getElementById('editEmail').value = email;
        document.getElementById('editRole').value = role;
        document.getElementById('editStatus').value = status;

        editModal.style.display = 'flex';
    });
});

// Fungsi Tutup Modal Edit
const closeEditBtns = [document.getElementById('closeEdit'), document.getElementById('btnCancelEdit')];
closeEditBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
});

// Simpan Perubahan
formEdit.addEventListener('submit', function(e) {
    e.preventDefault();

    if (currentRow) {
        // Ambil nilai baru dari input
        const newEmail = document.getElementById('editEmail').value;
        const newRole = document.getElementById('editRole').value;
        const newStatus = document.getElementById('editStatus').value;

        // Update tampilan tabel secara langsung (Simulasi)
        currentRow.querySelector('td:nth-child(3)').textContent = newEmail;
        
        // Update Badge Role
        const roleBadge = currentRow.querySelector('td:nth-child(4) .badge');
        roleBadge.textContent = newRole;
        roleBadge.className = `badge badge-${newRole.toLowerCase()}`;

        // Update Badge Status
        const statusBadge = currentRow.querySelector('td:nth-child(5) .badge');
        statusBadge.textContent = newStatus;
        statusBadge.className = `badge badge-${newStatus === 'Aktif' ? 'active' : 'inactive'}`;

        alert('Data berhasil diperbarui!');
        editModal.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    const totalPages = 4;
    const itemsPerPage = 4;
    const totalItems = 10;

    const pageNumbersContainer = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const infoText = document.getElementById('pagination-info');

    // Fungsi untuk memperbarui tampilan info (e.g., "Menampilkan 4 dari 10 user")
    function updatePaginationInfo() {
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);
        infoText.textContent = `Menampilkan ${end - start + 1} dari ${totalItems} user`;
    }

    // Fungsi untuk memperbarui status tombol active dan disabled
    function updatePaginationUI() {
        // Handle Tombol Angka
        const buttons = pageNumbersContainer.querySelectorAll('.page-btn');
        buttons.forEach(btn => {
            if (parseInt(btn.textContent) === currentPage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Handle Tombol Prev/Next
        prevBtn.disabled = (currentPage === 1);
        nextBtn.disabled = (currentPage === totalPages);
        
        updatePaginationInfo();
    }

    // Event Listener untuk Angka Halaman
    pageNumbersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('page-btn')) {
            currentPage = parseInt(e.target.textContent);
            renderTableData(currentPage); // Panggil fungsi muat data
            updatePaginationUI();
        }
    });

    // Event Listener untuk Tombol Previous
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTableData(currentPage);
            updatePaginationUI();
        }
    });

    // Event Listener untuk Tombol Next
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTableData(currentPage);
            updatePaginationUI();
        }
    });

    // Simulasi fungsi muat data ke tabel
    function renderTableData(page) {
        console.log(`Memuat data untuk halaman ${page}...`);
        // Di sini Anda bisa melakukan fetch data dari database via PHP
        // Contoh: fetch(`get_users.php?page=${page}`)
    }

    // Inisialisasi awal
    updatePaginationUI();
});

// --- LOGIKA HAPUS USER ---
const deleteModal = document.getElementById('deleteModal');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
const deleteMessage = document.getElementById('deleteModalMessage');
let rowToDelete = null;

// Buka Modal Hapus
document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', function() {
        rowToDelete = this.closest('tr');
        const username = rowToDelete.querySelector('td:nth-child(2) strong').textContent;
        
        // Update pesan agar lebih personal
        deleteMessage.innerHTML = `Akun <strong>${username}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`;
        
        deleteModal.style.display = 'flex';
    });
});

// Klik Batal
btnCancelDelete.addEventListener('click', () => {
    deleteModal.style.display = 'none';
    rowToDelete = null;
});

// Klik Konfirmasi Hapus
btnConfirmDelete.addEventListener('click', () => {
    if (rowToDelete) {
        // Efek transisi saat menghapus baris
        rowToDelete.style.transition = '0.3s';
        rowToDelete.style.opacity = '0';
        rowToDelete.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            rowToDelete.remove();
            deleteModal.style.display = 'none';
            rowToDelete = null;
            
            // Kamu bisa menambahkan toast/notifikasi sukses di sini
            console.log("User berhasil dihapus.");
        }, 300);
    }
});

// Tutup modal jika klik di luar area putih
window.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        deleteModal.style.display = 'none';
    }
});