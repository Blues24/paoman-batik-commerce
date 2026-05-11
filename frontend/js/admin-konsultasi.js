document.addEventListener('DOMContentLoaded', async () => {
    const listEl = document.getElementById('konsultasi-list');
    const modal = document.getElementById('consultationDetailModal');
    const statusSelect = document.getElementById('detailStatus');
    const saveStatusButton = document.getElementById('saveConsultationStatus');
    const closeButtons = [
        document.getElementById('closeConsultationModal'),
        document.getElementById('cancelConsultationModal')
    ];

    if (!listEl) return;

    const parts = location.pathname.split('/');
    const projectRoot = parts.length > 1 ? '/' + parts[1] : '';
    const base = location.origin + projectRoot + '/backend/public';
    let consultationRows = [];
    let selectedConsultation = null;

    function showAlert(type, message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: type === 'success' ? 'Berhasil' : 'Gagal',
                text: message,
                confirmButtonColor: '#2B4DBB'
            });
            return;
        }

        alert(message);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatStatus(status) {
        const normalized = String(status || 'Pending').toLowerCase();
        if (normalized === 'diproses') return 'Diproses';
        if (normalized === 'selesai') return 'Selesai';
        return 'Pending';
    }

    function statusValue(status) {
        return formatStatus(status).toLowerCase();
    }

    function truncateText(text, maxLength = 180) {
        const cleanText = String(text || '-').trim();
        if (cleanText.length <= maxLength) return cleanText;
        return `${cleanText.slice(0, maxLength).trim()}...`;
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '-';
    }

    function renderRows() {
        if (consultationRows.length === 0) {
            listEl.innerHTML = '<tr><td colspan="8">Belum ada konsultasi</td></tr>';
            return;
        }

        listEl.innerHTML = '';
        consultationRows.forEach((row, index) => {
            const status = formatStatus(row.status_konsultasi);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${escapeHtml(row.nama_lengkap)}</td>
                <td>${escapeHtml(row.no_whatsapp)}</td>
                <td>${escapeHtml(row.jenis_kebutuhan)}</td>
                <td class="consultation-description-cell">
                    <div class="description-preview">${escapeHtml(truncateText(row.deskripsi_kebutuhan))}</div>
                </td>
                <td><span class="status-badge ${statusValue(status)}">${status}</span></td>
                <td>${escapeHtml(row.tgl_pengajuan)}</td>
                <td><button type="button" class="btn-detail-consultation" data-id="${escapeHtml(row.id_konsultasi)}">Detail</button></td>
            `;
            listEl.appendChild(tr);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function openDetail(row) {
        selectedConsultation = row;

        setText('detailNama', row.nama_lengkap);
        setText('detailWhatsapp', row.no_whatsapp);
        setText('detailJenis', row.jenis_kebutuhan);
        setText('detailEstimasi', row.estimasi_jumlah);
        setText('detailTarget', row.target_waktu);
        setText('detailReferensi', row.referensi_produk);
        setText('detailDeskripsi', row.deskripsi_kebutuhan);
        statusSelect.value = statusValue(row.status_konsultasi);

        modal.style.display = 'flex';
    }

    function closeDetail() {
        modal.style.display = 'none';
        selectedConsultation = null;
    }

    async function loadConsultations() {
        try {
            const res = await fetch(base + '/api/admin/konsultasi');
            const json = await res.json();

            if (!res.ok || !json.success) {
                listEl.innerHTML = '<tr><td colspan="8">Gagal memuat data</td></tr>';
                return;
            }

            consultationRows = json.data || [];
            renderRows();
        } catch (err) {
            console.error(err);
            listEl.innerHTML = '<tr><td colspan="8">Terjadi kesalahan</td></tr>';
        }
    }

    listEl.addEventListener('click', (event) => {
        const button = event.target.closest('.btn-detail-consultation');
        if (!button) return;

        const row = consultationRows.find((item) => String(item.id_konsultasi) === String(button.dataset.id));
        if (row) openDetail(row);
    });

    closeButtons.forEach((button) => {
        if (button) button.addEventListener('click', closeDetail);
    });

    modal?.addEventListener('click', (event) => {
        if (event.target === modal) closeDetail();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal?.style.display === 'flex') {
            closeDetail();
        }
    });

    saveStatusButton?.addEventListener('click', async () => {
        if (!selectedConsultation) return;

        const nextStatus = statusSelect.value;
        const previousStatus = selectedConsultation.status_konsultasi;
        saveStatusButton.disabled = true;
        saveStatusButton.textContent = 'Menyimpan...';

        try {
            const res = await fetch(`${base}/api/admin/konsultasi/${selectedConsultation.id_konsultasi}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_konsultasi: nextStatus })
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                selectedConsultation.status_konsultasi = previousStatus;
                showAlert('error', json.message || 'Status konsultasi gagal diperbarui.');
                return;
            }

            selectedConsultation.status_konsultasi = json.data?.status_konsultasi || formatStatus(nextStatus);
            renderRows();
            closeDetail();
            showAlert('success', 'Status konsultasi berhasil diperbarui.');
        } catch (err) {
            console.error(err);
            selectedConsultation.status_konsultasi = previousStatus;
            showAlert('error', 'Terjadi kesalahan saat memperbarui status konsultasi.');
        } finally {
            saveStatusButton.disabled = false;
            saveStatusButton.textContent = 'Simpan Status';
        }
    });

    await loadConsultations();
});
