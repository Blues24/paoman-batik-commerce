# 📋 Panduan Pemulihan Produk & Perbaikan Issues

## 📌 Ringkasan Masalah & Solusi

Anda melakukan import database baru dari `paoman-batik-all.sql` namun ada beberapa issue yang terjadi:

### Issue 1: ✅ Dashboard Admin Tidak Ada Fitur Sorting (SUDAH DIPERBAIKI)
**Masalah:** Menu admin dashboard tidak punya opsi untuk mengurutkan produk (Terlaris, Tidak Laris, Stok Banyak, Stok Sedikit)

**Solusi:**
- Ditambahkan 5 button di dashboard untuk sorting:
  - **Terbaru** - Produk baru yang ditambahkan
  - **Terlaris** - Berdasarkan jumlah terjual (tertinggi)
  - **Tidak Laris** - Berdasarkan jumlah terjual (terendah)  
  - **Stok Banyak** - Stok tersedia tertinggi
  - **Stok Sedikit** - Stok tersedia terendah

**File yang diubah:**
- `frontend/src/admin/dasboardAdmin.html` - Ditambah button filter
- `frontend/js/dasboardAdmin.js` - Logika sorting berdasarkan mode
- `frontend/css/dasboardAdmin.css` - Styling button filter

---

### Issue 2: ✅ Gambar Duplikat di Halaman Produk User (SUDAH DIPERBAIKI)
**Masalah:** Beberapa produk menampilkan gambar yang sama, yang menyebabkan tampilan duplikat

**Penyebab:** 
Database lama menggunakan daftar fallback produk dengan nama berbeda dari database baru. Saat sistem mencoba matching nama produk, tidak ada yang cocok, sehingga sistem menampilkan keduanya.

**Solusi:**
- Update fallback product list di `pembelian.js` untuk match dengan database baru
- Update legacy image mapping sesuai nama produk terbaru

**File yang diubah:**
- `frontend/js/pembelian.js` - Update nama & gambar produk fallback

---

### Issue 3: ⚠️ Gambar Produk Test Hilang (PRODUK TIDAK ADA DI DATABASE)
**Masalah:** Anda upload produk test dengan gambar, tapi setelah import database baru, produk & gambarnya hilang

**Penyebab:**
- File gambar masih ada di folder: `frontend/img/uploads/`
- Tapi **database tidak punya record** produk tersebut (hilang saat import)
- Daftar file yang hilang:
  - `produk_1777833343.jpg` (5/6)
  - `produk_1777833585.webp` (5/6)
  - `produk_1777833760.jpg` (5/6)
  - `produk_1778492891_6332442f.jpg` (5/11)
  - `produk_1778540361_54f145f9.jpg` (5/12)
  - `produk_1778571730_5524bc86.png` (5/12)

**Solusi Pilihan:**

#### Opsi A: Re-upload Produk (RECOMMENDED)
1. Buka admin panel → Menu Produk
2. Klik "Tambah Produk Baru"
3. Isi nama produk, harga, stok
4. Upload ulang file gambar
5. Simpan

**Keuntungan:** Produk tercatat di database dengan data lengkap

#### Opsi B: Hapus File Gambar Orphaned
Jika produk test tidak diperlukan, bisa dihapus:
```bash
# Windows PowerShell
Remove-Item -Path "c:\xampp\htdocs\paoman-batik\frontend\img\uploads\produk_*"
```

#### Opsi C: Manual SQL Insert (Advanced)
Jika tahu nama produk yang seharusnya, bisa insert manual ke database:

```sql
USE batik_store;

-- Contoh: Insert produk test
INSERT INTO produk (jenis_id, nama_produk, deskripsi, gambar_produk, status) 
VALUES (1, 'Tes Produk Batik', 'Produk untuk testing', 'uploads/produk_1778571730_5524bc86.png', 'aktif');

-- Simpan produk_id hasil insert (misal: 18)
-- Lalu insert detail harga & stok:
INSERT INTO detail_batik (produk_id, ukuran, warna, bahan, harga, stok)
VALUES (18, 'M', 'Biru', 'Katun', 75000, 10);
```

---

## ✅ Checklist Verifikasi

Untuk memastikan semua perbaikan berjalan dengan baik:

- [ ] Buka `http://localhost/paoman-batik/frontend/src/admin/dasboardAdmin.html`
- [ ] Cek apakah ada 5 button sorting (Terbaru, Terlaris, Tidak Laris, Stok Banyak, Stok Sedikit)
- [ ] Klik setiap button, pastikan list produk berubah urutannya
- [ ] Buka halaman produk user (`pembelian.html`)
- [ ] Cek apakah gambar sudah tidak duplikat
- [ ] Pastikan 17 produk dari database ditampilkan dengan gambar yang benar

---

## 📂 File yang Dimodifikasi

```
frontend/
├── src/admin/
│   └── dasboardAdmin.html         [✅ Ditambah sorting buttons]
├── js/
│   ├── dasboardAdmin.js           [✅ Update sorting logic]
│   └── pembelian.js               [✅ Fix duplicate images]
└── css/
    └── dasboardAdmin.css          [✅ Add button styles]
```

---

## 🔗 Useful Commands

**Lihat daftar produk di database:**
```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root batik_store -e "SELECT produk_id, nama_produk, gambar_produk FROM produk;"
```

**Lihat daftar file gambar:**
```powershell
Get-ChildItem -Path "c:\xampp\htdocs\paoman-batik\frontend\img\uploads\produk_*"
```

---

## 🆘 Jika Masih Ada Issues

1. **Gambar tidak muncul** → Check path gambar di browser (inspect element)
2. **Sorting tidak bekerja** → Cek console (F12) untuk error JS
3. **Produk tidak muncul** → Pastikan API `/api/produk` return data dengan status 'aktif'

Silakan cek log console di browser untuk error details! 🎯
