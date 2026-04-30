USE batik_store;

ALTER TABLE pesanan
    ADD COLUMN metode_pembayaran ENUM('qris','ewallet','cod') NOT NULL DEFAULT 'qris' AFTER status_pesanan,
    ADD COLUMN payment_status ENUM('belum_dibayar','menunggu_konfirmasi','dibayar','bayar_di_tempat') NOT NULL DEFAULT 'belum_dibayar' AFTER metode_pembayaran,
    ADD COLUMN catatan TEXT AFTER payment_status;

ALTER TABLE detail_pesanan
    ADD COLUMN opsi_pesanan JSON AFTER harga_saat_pesan,
    ADD COLUMN catatan TEXT AFTER opsi_pesanan;
