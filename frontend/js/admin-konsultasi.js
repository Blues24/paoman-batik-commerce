document.addEventListener('DOMContentLoaded', async () => {
    const listEl = document.getElementById('konsultasi-list');
    if (!listEl) return;

    try {
        const parts = location.pathname.split('/');
        const projectRoot = parts.length > 1 ? '/' + parts[1] : '';
        const base = location.origin + projectRoot + '/backend/public';

        const res = await fetch(base + '/api/admin/konsultasi');
        const json = await res.json();
        if (!res.ok || !json.success) {
            listEl.innerHTML = '<tr><td colspan="10">Gagal memuat data</td></tr>';
            return;
        }

        const rows = json.data || [];
        if (rows.length === 0) {
            listEl.innerHTML = '<tr><td colspan="10">Belum ada konsultasi</td></tr>';
            return;
        }

        listEl.innerHTML = '';
        rows.forEach((r, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i+1}</td>
                <td>${escapeHtml(r.nama_lengkap)}</td>
                <td>${escapeHtml(r.no_whatsapp)}</td>
                <td>${escapeHtml(r.jenis_kebutuhan)}</td>
                <td>${escapeHtml(r.estimasi_jumlah)}</td>
                <td>${escapeHtml(r.target_waktu)}</td>
                <td>${escapeHtml(r.referensi_produk)}</td>
                <td>${escapeHtml(r.deskripsi_kebutuhan)}</td>
                <td>${escapeHtml(r.status_konsultasi)}</td>
                <td>${escapeHtml(r.tgl_pengajuan)}</td>
            `;
            listEl.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        listEl.innerHTML = '<tr><td colspan="10">Terjadi kesalahan</td></tr>';
    }

    function escapeHtml(s) {
        return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
});
