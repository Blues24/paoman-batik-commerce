# 📊 Panduan Merge Database SQL Files

File ini menjelaskan bagaimana database dan SQL files distruktur, serta cara merge/gabung file SQL untuk menyimpan history data.

---

## 📁 Struktur File SQL

### Tipe-tipe File SQL:

| File | Tujuan | Status |
|------|--------|--------|
| **paoman-batik-all.sql** | Master database (schema + seed data) | ✅ Ready |
| **admin_account_seed.sql** | Insert admin + user accounts | ✅ Merged ke paoman-batik-all.sql |
| **konsultasi.sql** | Create table konsultasi | ✅ Merged ke paoman-batik-all.sql |
| **kontak.sql** | Create table kontak (contact form) | ✅ Merged ke paoman-batik-all.sql |
| **pembayaran_pesanan.sql** | Alter table untuk payment fields | ✅ Merged ke paoman-batik-all.sql |
| **schema_cart.sql** | Create table cart_item | ✅ Merged ke paoman-batik-all.sql |
| **seed_produk_batik.sql** | Insert 17 produk batik + varian | ✅ Merged ke paoman-batik-all.sql |
| **produk_paoman_catalog.sql** | Versi lama (deprecated) | ❌ Jangan pakai |
| **backup_history_pesanan.sql** | Backup history transaksi lama | 📦 Optional |

---

## ✅ Yang Sudah Dilakukan

Semua file SQL penting sudah **digabung ke dalam `paoman-batik-all.sql`**:

1. ✅ CREATE TABLE untuk semua tabel (admin, akun, pelanggan, produk, detail_batik, pesanan, detail_pesanan, konsultasi, kontak, cart_item, ulasan)
2. ✅ INSERT DATA admin accounts (daffa, hasbi, blues)
3. ✅ INSERT DATA akun pelanggan (daffa123, hasbi123, lukman)
4. ✅ INSERT DATA produk jenis (Kain, Baju)
5. ✅ INSERT DATA katalog 17 produk batik dengan varian + harga + stok
6. ✅ ALTER TABLE untuk menambah payment fields di pesanan
7. ✅ ALTER TABLE untuk menambah opsi & catatan di detail_pesanan

---

## 🔄 Cara Menggunakan

### Setup Baru (Fresh Database):
```powershell
# 1. Buka MySQL
& "C:\xampp\mysql\bin\mysql.exe" -u root

# 2. Import master database (hanya 1 file ini)
SOURCE "c:\xampp\htdocs\paoman-batik\backend\sql\paoman-batik-all.sql";

# Selesai! Database siap digunakan.
```

### Jika Ingin Restore History Transaksi Lama:
```powershell
# Setelah import paoman-batik-all.sql, bisa import backup history:
SOURCE "c:\xampp\htdocs\paoman-batik\backend\sql\backup_history_pesanan.sql";

# Ini akan restore:
# - Pesanan lama
# - Detail pesanan
# - Konsultasi masuk lama
# - Kontak form lama
# - Ulasan produk lama
```

---

## 📝 File-File Terpisah (Opsional)

Jika Anda ingin menyimpan file terpisah untuk organisasi, berikut adalah struktur yang bisa digunakan:

```
backend/sql/
├── paoman-batik-all.sql           [Master - Import ini untuk setup baru]
├── 01-schema.sql                  [CREATE TABLE only]
├── 02-seed-admin.sql              [INSERT admin & akun]
├── 03-seed-produk.sql             [INSERT produk + varian]
├── 04-alter-payment.sql           [ALTER untuk payment fields]
├── backup-history/
│   ├── pesanan_2026-05-12.sql
│   ├── konsultasi_2026-05-12.sql
│   └── kontak_2026-05-12.sql
```

Tapi untuk sekarang, **paoman-batik-all.sql sudah cukup dan lengkap**.

---

## 🛠️ Jika Perlu Update Schema Nanti

**Jangan langsung edit paoman-batik-all.sql!** Sebaiknya:

1. **Buat file terpisah** untuk perubahan (misal: `alter-tables-v2.sql`)
2. **Dokumentasikan** perubahan di file ini
3. **Keep backup** versi lama
4. **Test** di database testing dulu sebelum production

Contoh struktur file alter:
```sql
-- alter-tables-v2.sql
-- Tanggal: 2026-05-13
-- Deskripsi: Menambah kolom rating ke tabel produk

USE batik_store;
ALTER TABLE produk ADD COLUMN rating DECIMAL(3,2) DEFAULT 0 AFTER gambar_produk;
```

---

## 📋 Checklist Setup Lengkap

- [ ] Backup old database (jika ada)
- [ ] Import paoman-batik-all.sql
- [ ] Verify 17 produk sudah ada: `SELECT COUNT(*) FROM produk;` → harus 17
- [ ] Verify admin account: `SELECT * FROM admin;` → harus 3 admin
- [ ] Verify pelanggan: `SELECT * FROM pelanggan;` → harus 3 pelanggan
- [ ] Verify tabel cart_item ada: `SHOW TABLES LIKE 'cart%';`
- [ ] Verify tabel kontak ada: `SHOW TABLES LIKE 'kontak';`
- [ ] Test backend API: `GET http://localhost:3000/api/produk` → harus return 17 produk
- [ ] Test frontend: `http://localhost/paoman-batik/frontend/src/pembelian.html` → harus tampil 6 produk per halaman

---

## 🎯 Takeaway

> **TL;DR**: Untuk setup baru, cukup import **`paoman-batik-all.sql`** satu file. Ini sudah mengandung semua yang diperlukan (schema + seed data + alter statements). File-file terpisah lainnya hanya untuk referensi atau backup history.

---

Last Updated: 2026-05-12
