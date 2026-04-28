// kelolaAkun.js

document.addEventListener('DOMContentLoaded', () => {
    //  INISIALISASI VARIABEL & ELEMEN 
    let currentPage = 1;
    const itemsPerPage = 4; 
    let totalItems = 10;
    let currentRow = null;

    // Elemen penomoran halaman
    const pageNumbersContainer = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const infoText = document.getElementById('pagination-info');

    // Elemen Modal Hapus
    const deleteModal = document.getElementById('deleteModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    const deleteMessage = document.getElementById('deleteModalMessage');

    // Elemen Modal Edit
    const editModal = document.getElementById('editModal');
    const formEdit = document.getElementById('formEditUser');
    const closeEdit = document.getElementById('closeEdit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    // FUNGSI UTAMA: RENDER DATA DARI API
    async function renderTableData(page) {
        console.log(`Memuat data untuk halaman ${page}...`);

        try {
            // Memanggil API Backend (AdminController)
            const { response, data } = await apiFetch(`/admin/pelanggan?page=${page}`, {
                method: 'GET'
            });

            if (response.ok && data.success) {
                const tbody = document.querySelector('.table-card table tbody');
                tbody.innerHTML = '';

                data.data.users.forEach(user => {
                    // Gunakan data-id agar JS tahu akun mana yang dikelola
                    const row = `
                        <tr data-id="${user.akun_id}">
                            <td><div class="profile-circle"></div></td>
                            <td><strong>${user.username}</strong></td>
                            <td>${user.email}</td>
                            <td><span class="badge badge-customer">Customer</span></td>
                            <td><span class="badge badge-${user.status === 'aktif' ? 'active' : 'inactive'}">${user.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span></td>
                            <td>${user.tanggal_bergabung || '-'}</td>
                            <td>
                                <div class="action-btns">
                                    <button class="btn-edit"><i data-lucide="pencil"></i></button>
                                    <button class="btn-delete"><i data-lucide="trash-2"></i></button>
                                </div>
                            </td>
                        </tr>
                    `;
                    tbody.insertAdjacentHTML('beforeend', row);
                });

                // Update info paginasi dari server
                totalItems = data.data.total;
                updatePaginationUI(data.data.totalPages);

                lucide.createIcons();
                attachRowEventListeners();
            }
        } catch (error) {
            console.error("Gagal sinkronisasi data:", error);
        }
    }

    // FUNGSI PEMBANTU: LOGIKA MODAL EDIT & HAPUS 
    function attachRowEventListeners() {
        // Tombol Edit
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.onclick = function () {
                currentRow = this.closest('tr');
                const username = currentRow.querySelector('td:nth-child(2) strong').textContent;
                const email = currentRow.querySelector('td:nth-child(3)').textContent;
                const role = currentRow.querySelector('td:nth-child(4) .badge').textContent;
                const status = currentRow.querySelector('td:nth-child(5) .badge').textContent;

                document.getElementById('editUsername').value = username;
                document.getElementById('editEmail').value = email;
                document.getElementById('editRole').value = role;
                document.getElementById('editStatus').value = status;

                editModal.style.display = 'flex';
            };
        });

        // Tombol Delete
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.onclick = function () {
                currentRow = this.closest('tr');
                const username = currentRow.querySelector('td:nth-child(2) strong').textContent;
                deleteMessage.innerHTML = `Akun <strong>${username}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`;
                deleteModal.style.display = 'flex';
            };
        });
    }

    // Event Submit Edit
    formEdit.onsubmit = async (e) => {
        e.preventDefault();
        if (currentRow) {
            const akunId = currentRow.getAttribute('data-id');
            const payload = {
                akun_id: akunId,
                email: document.getElementById('editEmail').value,
                status: document.getElementById('editStatus').value
            };

            const { response } = await apiFetch('/admin/update-pelanggan', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Data berhasil diperbarui!');
                editModal.style.display = 'none';
                renderTableData(currentPage);
            }
        }
    };

    // Event Konfirmasi Hapus
    btnConfirmDelete.onclick = async () => {
        if (currentRow) {
            const akunId = currentRow.getAttribute('data-id');
            const { response } = await apiFetch('/admin/delete-pelanggan', {
                method: 'POST',
                body: JSON.stringify({ akun_id: akunId })
            });

            if (response.ok) {
                currentRow.style.transition = '0.3s';
                currentRow.style.opacity = '0';
                currentRow.style.transform = 'translateX(20px)';
                setTimeout(() => {
                    deleteModal.style.display = 'none';
                    renderTableData(currentPage);
                }, 300);
            }
        }
    };

    // FUNGSI PEMBANTU: LOGIKA PAGINASI UI
    function updatePaginationUI(totalPages) {
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);
        infoText.textContent = `Menampilkan ${start}-${end} dari ${totalItems} user`;

        prevBtn.disabled = (currentPage === 1);
        nextBtn.disabled = (currentPage === totalPages || totalPages === 0);
    }

    // Event Paginasi
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTableData(currentPage); } };
    nextBtn.onclick = () => { currentPage++; renderTableData(currentPage); };

    // Tutup Modals
    [closeEdit, btnCancelEdit, btnCancelDelete].forEach(btn => {
        if (btn) btn.onclick = () => {
            editModal.style.display = 'none';
            deleteModal.style.display = 'none';
        };
    });

    window.onclick = (e) => {
        if (e.target === editModal || e.target === deleteModal) {
            editModal.style.display = 'none';
            deleteModal.style.display = 'none';
        }
    };

    // Inisialisasi awal
    renderTableData(currentPage);
});