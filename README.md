# Street Bar POS (Gold & White Edition) 🍸✨

Aplikasi Point of Sale (POS) lengkap, modern, dan touchscreen-friendly untuk Bar, Lounge, Restoran, dan Cafe dengan tema visual **Gold & Dominan Putih (Mewah & Bersih)**.

Sistem ini dirancang untuk multi-platform:
- **Backend**: Laravel 11 REST API dengan MariaDB / MySQL (Optimized Schema, B-Tree Indexes, Stored Views, Triggers)
- **Frontend Web**: Next.js 16 (React 19, Tailwind CSS, Lucide Icons, Touchscreen Friendly)
- **Mobile Android & iOS**: Capacitor Native Wrapper (`android/` project ready to build APK / AAB)

---

## 📸 Arsitektur & Fitur Utama

### 1. Transaksi & Kasir Touchscreen (Point of Sale)
- **Tampilan Khusus Layar Sentuh**: Tombol berukuran besar (touch target >= 48px), visual kartu menu dengan foto, harga, dan badge stok.
- **Kategori & Pencarian Cepat**: Filter kategori horizontal (Signature Cocktails, Mocktails, Beers, Whiskeys, Artisan Coffee, Street Tapas, Steaks) + scan barcode/SKU.
- **Kustomisasi Minuman & Makanan (Variant & Modifier)**: Modal touchscreen untuk memilih ukuran (Single Shot, Double Shot, Pitcher), tingkat es/gula, garnish, dan tingkat kematangan steak (*medium rare*, *well done*).
- **Jenis Pesanan & Meja**: Pilihan Dine In, Takeaway, dan **Bar Tab / Open Tab** dengan manajemen meja (Bar Counter, Indoor Lounge, VIP Mezzanine).
- **CRM Member & Loyalitas**: Pemilihan member (Silver, Gold, Platinum VIP) dan perhitungan poin loyalitas otomatis.
- **Kalkulator Kas Cepat (Quick Cash)**: Tombol pecahan uang pas, 50k, 100k, 150k, 200k, 300k, 500k, serta deteksi kembalian otomatis.
- **Metode Pembayaran Lengkap**: Tunai (Cash), QRIS Dinamis (preview QR interaktif), Kartu Debit EDC, Kartu Kredit, Transfer Bank, dan **Split Bill** (patungan/pisah pembayaran).
- **Hold Bill / Open Tab**: Fitur simpan tagihan sementara dan buka kembali tagihan saat tamu bar ingin menambah pesanan.

### 2. Cetak Struk Transaksi (Thermal Receipt 58mm & 80mm)
- Desain struk thermal realistis dengan font monospace presisi.
- Mendukung printer thermal kertas **58mm** dan **80mm** (ESC/POS USB, Bluetooth, LAN, dan Browser Print).
- Cetak otomatis via `window.print()` dengan optimasi CSS `@media print`.
- Opsi unduh struk, cetak ulang struk historis, dan kirim via WhatsApp.

### 3. Pengelolaan Barang, Menu, dan Stok (Inventory Management)
- Tabel katalog lengkap dengan foto menu, SKU, barcode, kategori, HPP (Harga Pokok Penjualan), harga jual, dan persentase margin laba.
- **Peringatan Stok Rendah (Min Stock Alert)**: Indikator visual saat stok mendekati batas minimum.
- **Penyesuaian Stok & Opname**: Pencatatan Restock barang masuk, Koreksi Opname selisih fisik, dan Waste/Spoilage (rusak/tumpah/kadaluarsa).
- Formulir tambah dan edit produk baru langsung dari dashboard.

### 4. Pengelolaan Keuangan & Shift Kasir (Cash Management)
- **Buka Shift**: Input modal awal uang fisik di laci kasir (*cash float*).
- **Pencatatan Kas Masuk (Cash In)**: Catat penukaran uang pecahan kecil dari bank.
- **Pencatatan Kas Keluar / Petty Cash**: Catat pengeluaran operasional darurat (beli es batu kristal, gas LPG, buah garnish bar, dll).
- **Tutup Shift & Rekonsiliasi Kas (Z-Report)**: Kasir memasukkan uang fisik di laci saat shift berakhir, sistem otomatis membandingkan dengan kalkulasi sistem dan mendeteksi selisih (*Klóp, Surplus, atau Defisit*).
- Riwayat log pergerakan kas dan cetak ringkasan shift.

### 5. Pengelolaan Promo & Happy Hour
- Atur diskon persentase (%), potongan nominal (Rp), dan **Aturan Otomatis Happy Hour Bar** berdasarkan jam operasional (misal: 17:00 - 20:00).
- Dukungan kode voucher promo dan batasan minimum pembelian.

### 6. Pengelolaan Kasir & Otorisasi PIN
- Role karyawan: Super Admin, Manager, Cashier, dan Bartender.
- **Ganti Kasir Cepat dengan PIN 6-Digit**: Kasir dapat berganti akun dalam 2 detik pada layar touchscreen tanpa perlu memasukkan password panjang.

### 7. Dashboard Admin & Cetak Laporan Formal
- **KPI Real-Time**: Total Omset Penjualan Harian, Total Struk Transaksi, Estimasi Laba Bersih (Omset - Pajak - HPP), dan Total Diskon Promo.
- **Ranking Menu Terlaris**: Top 5 Cocktails & Makanan terlaris berdasarkan volume dan nominal.
- **Rincian Pembayaran**: Grafik persentase transaksi (Tunai vs QRIS vs Kartu).
- **Cetak Laporan Formal (A4)**: Format laporan cetak resmi siap tanda tangan (Head Kasir & Owner/Manager).
- **Export Data Excel (CSV)**: Unduh seluruh detail transaksi untuk pembukuan akuntansi.

---

## 🗄️ Database MariaDB yang Dioptimasi

Database dirancang khusus untuk performa tinggi POS retail & F&B:
- **File Skrip SQL Lengkap**: [`database/streetbar_pos_mariadb.sql`](file:///d:/StreetBar/database/streetbar_pos_mariadb.sql)
- **Tipe Data Finansial**: Semua harga, pajak, diskon, dan subtotal menggunakan `DECIMAL(15,2)` untuk mencegah kesalahan pembulatan angka (*floating-point rounding errors*).
- **Indeks B-Tree & Composite Index**: Indeks pada `(outlet_id, created_at, status)`, `(category_id, is_active)`, dan `(shift_id)` agar query laporan bulanan dan pencarian kasir tetap responsif di bawah 50ms.
- **Triggers**: Pengurangan stok otomatis saat order baru dimasukkan (`trg_after_order_item_insert`).
- **Database Views**:
  - `v_daily_sales_summary`
  - `v_top_selling_products`
  - `v_payment_method_breakdown`

### Cara Import Database ke MariaDB / MySQL:
```bash
# 1. Buka Terminal / CMD
mysql -u root -p < d:\StreetBar\database\streetbar_pos_mariadb.sql

# 2. Atau menggunakan Laravel Artisan:
cd d:\StreetBar\backend
php artisan migrate:fresh --seed
```

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Backend (Laravel API)
Backend berjalan di port `8000`:
```bash
cd d:\StreetBar\backend
composer install
php artisan serve --port=8000
```
- API Base URL: `http://127.0.0.1:8000/api/v1`
- Endpoint Inisialisasi: `GET http://127.0.0.1:8000/api/v1/pos/init`

### 2. Frontend Web (Next.js Touchscreen POS)
Frontend berjalan di port `3000`:
```bash
cd d:\StreetBar\frontend
npm install
npm run dev -- --port 3000
```
Buka browser di: **`http://localhost:3000`**

### 3. Versi Android (APK)
Proyek Android native sudah ter-generate di folder `frontend/android/`:
```bash
cd d:\StreetBar\frontend

# 1. Build export web
npm run build

# 2. Sinkronisasi aset ke Android native
npx cap sync android

# 3. Buka di Android Studio untuk build APK / Jalankan di Emulator atau Terminal POS:
npx cap open android
```
*Atau build langsung dari terminal jika Android SDK / Gradle terpasang:*
```bash
cd d:\StreetBar\frontend\android
./gradlew assembleDebug
# File APK akan tersedia di: android/app/build/outputs/apk/debug/app-debug.apk
```

### 4. Versi iOS
Pada lingkungan macOS dengan Xcode:
```bash
cd d:\StreetBar\frontend
npx cap add ios
npx cap sync ios
npx cap open ios
```

---

## 🔑 Akun & PIN Default untuk Uji Coba

| Nama Akun | Email | Role | PIN Kasir Touchscreen |
| :--- | :--- | :--- | :--- |
| **(Owner)** | `admin@streetbar.id` | Super Admin | **`112233`** |
| **(Manager)** | `manager@streetbar.id` | Manager | **`998877`** |
| **(Kasir 1)** | `sholeh@streetbar.id` | Cashier | **`123456`** |
| **(Head Bartender)** | `iwong@streetbar.id` | Bartender | **`556677`** |

*Password standar untuk login email: `admin123` / `cashier123`*
