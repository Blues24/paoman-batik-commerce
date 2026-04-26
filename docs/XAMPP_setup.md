# Panduan Migrasi Proyek Paoman Batik (LAMPP/XAMPP)

Dokumen ini berisi langkah-langkah teknis untuk memindahkan proyek **Paoman Batik** dari lingkungan pengembangan lokal (port 8000) ke server Apache pada LAMPP (Linux) atau XAMPP (Windows).

## 1. Lokasi Direktori Proyek
Salin seluruh folder proyek kamu ke dalam direktori *document root* server:
* **Linux (LAMPP):** `/opt/lampp/htdocs/paoman-batik/`
* **Windows (XAMPP):** `C:\xampp\htdocs\paoman-batik\`

## 2. Sinkronisasi API URL (Frontend)
Karena port default Apache adalah 80, kamu harus mengubah konstanta `API_URL` agar mengarah ke subfolder proyek di dalam `htdocs`.

### Edit File: `frontend/js/user-session.js`
Cari baris pertama dan sesuaikan menjadi:
```javascript
// Hapus atau komentari URL lama (port 8000)
// const API_URL = 'http://localhost:8000/api';

// Gunakan path folder proyek di Apache
const API_URL = 'http://localhost/paoman-batik/backend/public';
