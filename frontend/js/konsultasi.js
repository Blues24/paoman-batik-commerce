document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.consult-form');
    if (!form) return;

    function showConsultationAlert(type, message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: type === 'success' ? 'Berhasil' : 'Gagal',
                text: message,
                confirmButtonColor: '#2e4fc2'
            });
            return;
        }

        alert(message);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Use explicit selectors for robustness
        const nama = form.querySelector('input[placeholder="Masukkan nama lengkap"]').value.trim();
        const whatsapp = form.querySelector('input[placeholder="08xxxxxxxxxx"]').value.trim();
        const selects = form.querySelectorAll('select');
        const jenis_kebutuhan = selects[0]?.value || null;
        const estimasi_jumlah = selects[1]?.value || null;
        const target_waktu = selects[2]?.value || null;
        const referensi_produk = selects[3]?.value || null;
        const deskripsi_kebutuhan = form.querySelector('textarea')?.value || '';

        const payload = {
            nama_lengkap: nama,
            no_whatsapp: whatsapp,
            jenis_kebutuhan,
            estimasi_jumlah,
            target_waktu,
            referensi_produk,
            deskripsi_kebutuhan
        };

        try {
            const parts = location.pathname.split('/');
            const projectRoot = parts.length > 1 ? '/' + parts[1] : '';
            const base = location.origin + projectRoot + '/backend/public';

            const res = await fetch(base + '/api/konsultasi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (res.ok && json.success) {
                showConsultationAlert('success', 'Konsultasi berhasil dikirim. Tim kami akan menghubungi Anda.');
                form.reset();
            } else {
                showConsultationAlert('error', 'Gagal mengirim konsultasi: ' + (json.message || res.status));
            }
        } catch (err) {
            console.error(err);
            showConsultationAlert('error', 'Terjadi kesalahan saat mengirim konsultasi');
        }
    });
});
