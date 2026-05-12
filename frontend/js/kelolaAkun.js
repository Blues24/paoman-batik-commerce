// kelolaAkun.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. KONFIGURASI ---
    const API_BASE_URL = '/paoman-batik/backend/public/api/admin'; // Samakan dengan root API kamu
    let currentPage = 1;
    const itemsPerPage = 4;
    let totalItems = 0;
    let currentRow = null;

    // Ambil token dari localStorage (jika ada) untuk keamanan stateless
    const csrfToken = localStorage.getItem('csrf_token');

    // --- 2. FUNGSI FETCH NATIVE ---
    async function customFetch(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

        // Gabungkan headers default dengan opsi user
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken, // Kirim token jika backend butuh
            ...options.headers
        };

        const response = await fetch(url, { ...options, headers });
        const data = await response.json();
        return { response, data };
    }

    // --- 3. RENDER DATA ---
    async function renderTableData(page) {
        try {
            const { response, data } = await customFetch(`/ambil-data-pelanggan?page=${page}`, {
                method: 'GET'
            });

            const tbody = document.getElementById('userTableBody');
            if (!tbody) return;

            // PASTI KOSONG: Hapus semua baris lama sebelum mengisi yang baru
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }

            if (response.ok && data.success) {
                data.data.users.forEach(user => {
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', user.akun_id);
                    const tanggalBergabung = user.tanggal_daftar || user.tanggal_bergabung || user.created_at || '';
                    row.innerHTML = `
                    <td><div class="profile-circle"></div></td>
                    <td><strong>${user.username}</strong></td>
                    <td>${user.email}</td>
                    <td>
                        <span class="badge badge-${user.status === 'aktif' ? 'active' : 'inactive'}">
                            ${user.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </td>
                    <td>${formatTanggalBergabung(tanggalBergabung)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-edit"><i data-lucide="pencil"></i></button>
                            <button class="btn-delete"><i data-lucide="trash-2"></i></button>
                        </div>
                    </td>
                `;
                    tbody.appendChild(row);
                });

                // Update info lainnya
                totalItems = data.data.total;
                updatePaginationUI(data.data.totalPages);
                lucide.createIcons();
                attachEventListeners();
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        }
    }

    function formatTanggalBergabung(tanggal) {
        if (!tanggal) return '-';

        const match = String(tanggal).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
        if (!match) return tanggal;

        const [, tahun, bulan, hari, jam, menit] = match;
        const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const tanggalFormatted = `${hari} ${namaBulan[Number(bulan) - 1]} ${tahun}`;

        return jam && menit ? `${tanggalFormatted} ${jam}:${menit}` : tanggalFormatted;
    }

    // --- 4. EVENT LISTENERS (EDIT & HAPUS) ---
    function attachEventListeners() {
        // Tombol Edit
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.onclick = function () {
                currentRow = this.closest('tr');
                // Username ada di kolom ke-2 (td:nth-child(2))
                document.getElementById('editUsername').value = currentRow.querySelector('td:nth-child(2) strong').textContent.trim();
                // Email ada di kolom ke-3
                document.getElementById('editEmail').value = currentRow.querySelector('td:nth-child(3)').textContent.trim();
                // Status ada di kolom ke-4 (bukan lagi ke-5)
                const currentStatus = currentRow.querySelector('td:nth-child(4) .badge').textContent.trim();
                document.getElementById('editStatus').value = currentStatus;

                document.getElementById('editModal').style.display = 'flex';
            };
        });

        // Tombol Delete
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.onclick = function () {
                currentRow = this.closest('tr');
                const username = currentRow.querySelector('td:nth-child(2) strong').textContent;
                document.getElementById('deleteModalMessage').innerHTML = `Akun <strong>${username}</strong> akan dihapus permanen.`;
                document.getElementById('deleteModal').style.display = 'flex';
            };
        });
    }

    // --- 5. AKSI KE BACKEND ---

    // Update
    document.getElementById('formEditUser').onsubmit = async (e) => {
        e.preventDefault();
        const akunId = currentRow.getAttribute('data-id');
        const payload = {
            akun_id: akunId,
            email: document.getElementById('editEmail').value,
            status: document.getElementById('editStatus').value
        };

        const { response } = await customFetch('/update-data-pelanggan', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Berhasil diupdate!');
            document.getElementById('editModal').style.display = 'none';
            renderTableData(currentPage);
        }
    };

    // Delete
    document.getElementById('btnConfirmDelete').onclick = async () => {
        const akunId = currentRow.getAttribute('data-id');
        const { response } = await customFetch('/hapus-data-pelanggan', {
            method: 'POST',
            body: JSON.stringify({ akun_id: akunId })
        });

        if (response.ok) {
            document.getElementById('deleteModal').style.display = 'none';
            renderTableData(currentPage);
        }
    };

    // --- 6. PAGINASI ---
    function updatePaginationUI(totalPages) {
        document.getElementById('pagination-info').textContent = `Total: ${totalItems} User`;
        document.getElementById('prev-page').disabled = (currentPage === 1);
        document.getElementById('next-page').disabled = (currentPage >= totalPages);
    }

    document.getElementById('prev-page').onclick = () => { if (currentPage > 1) { currentPage--; renderTableData(currentPage); } };
    document.getElementById('next-page').onclick = () => { currentPage++; renderTableData(currentPage); };

    // --- 7. CLOSE MODAL ---
    const closeBtns = ['btnCancelDelete', 'btnCancelEdit', 'closeEdit'];
    closeBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = () => {
            document.getElementById('editModal').style.display = 'none';
            document.getElementById('deleteModal').style.display = 'none';
        };
    });

    // Jalankan pertama kali
    renderTableData(currentPage);
});
