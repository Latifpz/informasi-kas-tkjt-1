# Informasi Kas X TKJT 1 — versi PHP + MySQL

Aplikasi kas kelas dengan tiga pos dana (**Kas Rutin**, **Dana Acara**, **Dana Kurban**) dan dua peran
(**siswa** dan **bendahara**). Front end memakai HTML, CSS, dan JavaScript; back end memakai PHP;
data disimpan di MySQL/MariaDB. Tampilan dan alur aplikasi lama dipertahankan; yang berubah adalah tempat
penyimpanan data (dari peramban ke database server) dan cara pemeriksaan hak akses (sekarang di server).

> Isi paket ini hanya kode aplikasi. Tidak ada akun bawaan dan tidak ada kata sandi bawaan: semua akun
> dibuat sendiri lewat halaman **Daftar**.

---

## 1. Isi paket

```
kas-tkjt1/
├─ index.html  style.css  tambahan.css  tema.js  api.js  fitur.js  script.js   ← front end
├─ router.php                      ← hanya untuk mode uji lokal:  php -S localhost:8000 router.php
├─ api/
│  ├─ index.php                    ← satu-satunya pintu API:  api/index.php?a=<aksi>
│  ├─ config.example.php           ← template konfigurasi; salin menjadi config.php di server
│  └─ lib/*.php                    ← sesi, keuangan, laporan, PDF, Excel, unggahan, dll.
├─ database/database.example.sql   ← skema + 38 nama siswa dan 3 nama bendahara placeholder
├─ tools/impor-data-lama.php       ← pemindah data dari aplikasi lama (localStorage); lewat terminal
└─ README.md
```

## 2. Kebutuhan

- **PHP 8.1 atau lebih baru** dengan ekstensi `pdo_mysql` dan `mbstring` (XAMPP sudah menyertakannya).
  Ekstensi `zlib` bersifat opsional (dipakai untuk memampatkan PDF/Excel bila ada).
- **MySQL 5.7+ / 8.x atau MariaDB 10.3+** (pengujian memakai Dolt yang kompatibel MySQL; lihat bagian 10).
- Peramban modern (Chrome, Edge, Firefox, Safari).

## 3. Memasang dengan XAMPP (paling mudah)

1. Pasang XAMPP (PHP 8.1+), lalu nyalakan **Apache** dan **MySQL** di XAMPP Control Panel.
2. Ekstrak ZIP ini sehingga folder `kas-tkjt1` berada di `htdocs`
   (Windows: `C:\xampp\htdocs\kas-tkjt1`, Linux: `/opt/lampp/htdocs/kas-tkjt1`).
3. **Buat database.** Buka `http://localhost/phpmyadmin` → **Baru** → nama `kas_tkjt1`, susunan karakter
   `utf8mb4_unicode_ci` → **Buat**. Pilih database itu → tab **Impor** → pilih `database/database.example.sql` → **Kirim**.
   (Berkas ini aman diimpor ulang: data yang sudah ada tidak ditimpa.)
4. **Isi kode bendahara.** Salin `api/config.example.php` menjadi `api/config.php` di komputer/server (jangan unggah `config.php` ke GitHub), lalu isi, misalnya:
   `'kode_bendahara' => 'GANTI_DENGAN_KODE_RAHASIA_UNIK'` (ganti dengan kode milik kalian). Selama kode ini **kosong**,
   pendaftaran dan pemulihan akun bendahara ditolak, supaya tidak ada orang lain yang bisa mengaku bendahara.
   Bila MySQL kalian memakai user/password lain dari bawaan XAMPP (`root`, tanpa password), ubah juga bagian `'db'`.
5. Buka **`http://localhost/kas-tkjt1/`**.

**Mendaftar pertama kali**

- Tiga bendahara memilih tab **Bendahara** pada halaman Daftar, memilih namanya, mengisi username, password,
  dan **kode bendahara** dari langkah 4:
  pilih nama bendahara yang sudah kamu masukkan ke tabel `bendahara_master` (nama pada SQL contoh hanyalah placeholder).
- Siswa memilih namanya dari daftar kelas (satu nama = satu akun).
- Username 3–30 karakter (huruf, angka, titik, garis bawah, strip). Password 6–72 karakter.

**Tanpa Apache (hanya untuk mencoba di komputer sendiri):** pastikan MySQL menyala dan database sudah diimpor,
lalu dari dalam folder aplikasi jalankan `php -S localhost:8000 router.php` dan buka `http://localhost:8000/`.
Server bawaan PHP ini tidak untuk dipakai di internet. `router.php` hanya melayani berkas statis yang diizinkan
dan `api/index.php`; folder `api/lib`, `database`, dan `tools` ditutup.

## 4. Pengaturan (`api/config.php`)

Nilai bisa diubah langsung di berkas, atau lewat variabel lingkungan `KAS_*` (variabel lingkungan menang).

| Pengaturan | Bawaan | Fungsi |
|---|---|---|
| `db.host`, `db.port`, `db.name`, `db.user`, `db.pass` | `127.0.0.1`, `3306`, `kas_tkjt1`, `root`, *(kosong)* | Akses database. Env: `KAS_DB_HOST`, `KAS_DB_PORT`, `KAS_DB_NAME`, `KAS_DB_USER`, `KAS_DB_PASS`. **Di server sungguhan, buat user khusus dengan password kuat.** |
| `kode_bendahara` | *(kosong)* | Kode rahasia pendaftaran/pemulihan bendahara. Env: `KAS_KODE_BENDAHARA`. |
| `timezone` | `Asia/Jakarta` | Menentukan "hari ini"/"bulan ini" pada status bayar. WITA: `Asia/Makassar`, WIT: `Asia/Jayapura`. |
| `sesi_hari` | `30` | Lama akun tetap masuk. |
| `login_maks_gagal`, `login_maks_gagal_ip`, `login_jendela_menit` | `8`, `100`, `10` | Batas percobaan masuk yang salah (per akun+IP dan per IP) dalam satu jendela waktu. Satu Wi-Fi sekolah = satu IP, makanya batas per IP lebih longgar. |
| `cek_origin` | `true` | Menolak permintaan dari situs lain. |
| `lupa_siswa_mandiri` | `true` | `true`: siswa bisa mengatur ulang password sendiri dengan username + nama (dibatasi percobaannya). `false`: hanya bendahara yang bisa mereset (menu *Kelola Akun*). **Pilih `false` bila situs bisa dibuka dari internet umum.** Env: `KAS_LUPA_SISWA_MANDIRI`. |
| `header_ip_proxy` | *(kosong)* | Isi mis. `HTTP_CF_CONNECTING_IP` **hanya** bila situs berada di belakang proxy tepercaya (Cloudflare, dsb.). Bila salah isi, pembatasan percobaan bisa dikelabui. |
| `upload_maks_byte` | `3 MB` | Batas gambar QRIS/bukti. Batas `upload_max_filesize` dan `post_max_size` di `php.ini` juga berlaku. Aplikasi mengecilkan foto di peramban lebih dulu. |
| `debug` | `false` | `true` menampilkan pesan galat teknis. **Jangan aktifkan di server sungguhan.** Env: `KAS_DEBUG`. |

## 5. Memindahkan data dari aplikasi lama (yang menyimpan di peramban)

Aplikasi lama menyimpan semua catatan di `localStorage` peramban. Skrip `tools/impor-data-lama.php` memindahkan
**kas masuk, pengeluaran, target pembelian, bukti transfer yang masih menunggu, nominal Kas Rutin, dan gambar QRIS**.
**Akun dan password tidak dipindahkan** (password lama memakai hash di peramban yang tidak bisa diubah menjadi hash
server), jadi semua orang mendaftar ulang. Notifikasi lama juga tidak dipindahkan.

1. **Ekspor.** Di peramban dan alamat yang biasa dipakai untuk aplikasi lama, buka aplikasinya, tekan **F12 → Console**,
   lalu jalankan `copy(localStorage.getItem("kastkjt1_db_v3"))`. Tempel (Ctrl+V) ke berkas teks, simpan sebagai
   `data-lama.json` di folder aplikasi. Data aplikasi lama ada **per perangkat**: bila bendahara memakai HP/komputer
   yang berbeda, ekspor dari tiap perangkat.
2. **Daftarkan akun baru dulu**, terutama akun bendahara dengan **username yang sama seperti dulu**, supaya kolom
   *Pencatat* terisi benar. Catatan yang username pencatatnya tidak ditemukan diisi dengan bendahara resmi pos itu;
   bila belum ada akun bendahara sama sekali, pencatatnya dikosongkan.
3. **Cadangkan database** (bagian 8), lalu jalankan **uji coba** (tidak menulis apa pun):
   - Windows XAMPP: `C:\xampp\php\php.exe tools\impor-data-lama.php data-lama.json`
   - Linux/Mac: `php tools/impor-data-lama.php data-lama.json`

   Laporan uji coba menampilkan jumlah catatan, total, saldo per pos (bandingkan dengan Dashboard aplikasi lama),
   dan catatan yang dilewati beserta alasannya (nama siswa tak dikenal, tanggal/jumlah tak sah, gambar rusak, dst.).
4. Bila angkanya cocok, jalankan impor sungguhan dengan menambah **`--simpan`**. Semua penulisan berada dalam satu
   transaksi: bila ada galat, tidak ada yang tersimpan.

Pengamanan skrip ini: hanya jalan dari terminal; hanya **menambah** baris (satu-satunya perubahan pada data yang ada
adalah nominal Kas Rutin dan gambar QRIS yang belum terpasang — QRIS yang sudah ada tidak ditimpa); menolak berjalan
bila tabel kas sudah berisi data supaya tidak terduplikasi. Bila data lama tersebar di beberapa perangkat, impor
berkas berikutnya dengan `--izinkan-data-ada` — **periksa dulu lewat uji coba** agar catatan yang sama tidak masuk
dua kali.

## 6. Aturan yang perlu diketahui

- **Hak akses.** Perubahan data kas hanya boleh oleh bendahara pemilik pos tersebut (Kas Rutin, Dana Acara, Dana
  Kurban masing-masing satu bendahara); upaya mengubah data pos lain ditolak server. Siswa hanya melihat data kas
  (seperti di aplikasi lama) dan mengirim bukti transfer. Menu *Rekap Siswa*, *Laporan*, *Kalender*, dan *Kelola
  Akun* hanya tampil untuk bendahara; aksi di *Kelola Akun* dan semua alamat **laporan** (tampilan, PDF, Excel)
  diperiksa lagi di server — siswa yang membukanya langsung lewat URL mendapat penolakan (403), bukan sekadar menu
  yang disembunyikan.
- **Status bayar & tunggakan.** Siswa dianggap *lunas* pada suatu periode bila ada minimal satu setoran bertanggal
  di periode itu (bulan untuk Kas Rutin, hari untuk Dana Kurban, minggu bila pos diatur mingguan). Periode *jatuh
  tempo* dihitung sejak setoran **pertama** yang tercatat di pos itu (atau sejak awal rentang laporan bila belum ada
  setoran) sampai akhir rentang laporan atau hari ini, mana yang lebih dulu. **Tunggakan** = periode jatuh tempo yang
  belum lunas × nominal. Dana Acara tidak punya tunggakan.
- **Laporan** (menu *Laporan*, khusus bendahara): pemasukan, pengeluaran, saldo, pembayaran siswa, dengan filter
  periode, pratinjau, cetak, **PDF**, dan **Excel (.xlsx)**. Bendahara mana pun dapat melihat laporan semua pos. Berkas Excel memuat rumus (total/saldo) dan teks selalu disimpan sebagai teks
  sehingga isian berawalan `=`, `+`, `-`, `@` tidak dijalankan sebagai rumus.
- **Sinkronisasi.** Data di layar diperbarui otomatis tiap 20 detik bila ada bendahara lain yang mencatat.
- **Reset akun.** Bendahara dapat mereset password akun lewat *Kelola Akun*; password sementara ditampilkan sekali.

## 7. Keamanan

Yang sudah diterapkan di kode:

- Semua kueri memakai **prepared statements** (PDO, tanpa emulasi); tidak ada SQL yang disusun dari masukan.
- Password disimpan sebagai **hash bcrypt** (`password_hash`); login dibuat berwaktu relatif sama untuk akun yang ada
  maupun tidak; ada **pembatasan percobaan masuk** dan pembatasan pemulihan password.
- **Sesi di database** dengan cookie `HttpOnly`, `SameSite=Lax`, dan `Secure` otomatis bila memakai HTTPS; ID sesi
  diganti saat login; keluar menghapus sesi di server.
- **CSRF**: setiap POST wajib memuat token `X-CSRF-Token` dan lolos pemeriksaan `Origin`.
- **XSS**: seluruh keluaran di tampilan di-escape; **Content-Security-Policy** melarang skrip sebaris dan skrip
  dari situs lain; header `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **Unggahan**: jenis berkas ditentukan dari **isi** (hanya JPG/PNG/GIF/WEBP, maks. 3 MB, dimensi dibatasi), disajikan
  dengan `nosniff` dan `Content-Security-Policy: sandbox`, dan hanya bisa diunduh oleh yang berhak.
- **Otorisasi di server** untuk setiap aksi; data bendahara pos lain tidak bisa diubah walau ID-nya ditebak; siswa
  tidak menerima username pencatat.
- **Tidak ada rahasia di front end.** Akses database dan kode bendahara hanya di `api/config.php`, yang ditutup dari
  akses web; peramban hanya menyimpan pilihan tema.
- Galat server dicatat di log, pengunjung hanya melihat pesan umum.

**Yang perlu kalian lakukan di server sungguhan (bukan hanya komputer sendiri):**

1. **Pakai HTTPS** dan aktifkan HSTS di web server. (Aplikasi tidak bisa memasangnya sendiri.)
2. **Buat user MySQL khusus** dengan password kuat; jangan memakai `root` tanpa password. Tutup port MySQL dari internet.
3. Pastikan `debug` = `false` dan `kode_bendahara` panjang serta tidak ditebak.
4. Pastikan web server **menaati `.htaccess`** (Apache: `AllowOverride All`; XAMPP sudah begitu) atau pasang aturan
   Nginx di bawah. Setelah database terpasang, **hapus `database/database.example.sql` dan `tools/` dari server**
   (atau pindahkan keluar dari folder web) bila tidak diperlukan lagi.
5. Pertimbangkan membatasi akses situs ke jaringan sekolah (atau memberi *basic auth*): halaman Daftar menampilkan
   **daftar nama kelas** dan nama mana yang sudah terdaftar, sebelum pengguna masuk.
6. Atur `lupa_siswa_mandiri` = `false` bila situs terbuka untuk umum (lihat bagian 4).
7. Lakukan **cadangan rutin** (bagian 8) dan jaga PHP/MySQL tetap diperbarui.

Satu-satunya sumber luar adalah **Google Fonts** (huruf Inter dan Lora). Bila diblokir, huruf sistem dipakai. Untuk
menghilangkannya, unduh fontnya ke folder aplikasi dan sesuaikan `index.html` serta `style-src`/`font-src` pada
Content-Security-Policy di berkas itu.

### Contoh Nginx (belum diuji pada server Nginx sungguhan)

```nginx
server {
    listen 80;                          # pasang HTTPS (listen 443 ssl) untuk server sungguhan
    server_name kas.contoh.sch.id;
    root /var/www/kas-tkjt1;
    index index.html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "same-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;

    # hanya api/index.php yang dijalankan sebagai PHP
    location = /api/index.php {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;   # sesuaikan dengan versi PHP-FPM
        client_max_body_size 8m;
    }

    location ^~ /api/      { return 404; }
    location ^~ /database/ { return 404; }
    location ^~ /tools/    { return 404; }
    location ^~ /.well-known/ { try_files $uri =404; }   # tantangan sertifikat HTTPS (Let's Encrypt)
    location ~ /\.         { return 404; }
    location ~* \.(php|sql|md|log|bak|env|ini|sh)$ { return 404; }

    location / { try_files $uri =404; }
}
```

## 8. Cadangan dan pemulihan

- **Paling mudah:** phpMyAdmin → pilih database `kas_tkjt1` → **Ekspor** → *Cepat* → format SQL → **Kirim**.
  Pulihkan lewat tab **Impor** pada database kosong.
- **Terminal:** `mysqldump -u USER -p --default-character-set=utf8mb4 --result-file=cadangan-kas.sql kas_tkjt1`
  (gunakan `--result-file`, jangan `>` di PowerShell Windows karena berkas bisa rusak). Pulihkan:
  `mysql -u USER -p kas_tkjt1 < cadangan-kas.sql` (di Command Prompt / Linux).
- Foto QRIS dan bukti transfer ada di tabel `uploads`, jadi ikut tercadangkan.

## 9. Pemecahan masalah

| Gejala | Penyebab / solusi |
|---|---|
| "Tidak dapat terhubung ke database" | MySQL belum menyala, atau `db` di `api/config.php` salah (host, nama database, user, password). Periksa juga bahwa file SQL contoh/produksi sudah diimpor ke database yang sama. |
| "Server memakai PHP …, butuh 8.1" / "Ekstensi PHP … belum aktif" | Perbarui PHP atau aktifkan `pdo_mysql`/`mbstring` di `php.ini`, lalu mulai ulang Apache. |
| Bendahara tidak bisa mendaftar / "kode salah" | `kode_bendahara` di `api/config.php` masih kosong atau tidak sama dengan yang diketik. |
| Unggah gambar gagal | Gambar > 3 MB, bukan JPG/PNG/GIF/WEBP, atau melebihi `upload_max_filesize` / `post_max_size` di `php.ini`. |
| Status "bulan ini" salah di tanggal pergantian | Atur `timezone` di `api/config.php`. |
| Lupa password | Bendahara: *Lupa password* dengan kode bendahara. Siswa: *Lupa password* (username + nama) bila `lupa_siswa_mandiri` aktif, atau minta bendahara mereset lewat *Kelola Akun*. |
| Tampilan tidak berubah setelah memperbarui berkas | Muat ulang paksa (Ctrl+F5). Versi berkas diatur lewat `?v=` di `index.html`. |
| Galat 500 | Lihat log galat PHP/Apache (pesan teknis tidak ditampilkan ke pengunjung). Sementara untuk mencari penyebab, `debug` boleh diaktifkan di komputer sendiri. |

## Penting sebelum memakai repository publik

- Paket ini sengaja memakai nama contoh anonim (`SISWA 01` sampai `SISWA 38`, serta tiga nama bendahara placeholder). Daftar nama asli tidak disertakan.
- Sebelum dipakai kelas, ganti nama placeholder di file SQL secara lokal sebelum impor ke MySQL. File lokal bernama `database/database.sql` diabaikan oleh Git agar data pribadi tidak ikut terunggah. Jangan menghapus aturan ini.
- Aplikasi mengirim daftar nama dari tabel `siswa` dan `bendahara_master` melalui API `boot` untuk proses pendaftaran. Artinya, nama di database dapat dilihat pengunjung yang membuka situs, meskipun belum login. Jangan masukkan data pribadi siswa ke situs internet publik tanpa persetujuan sekolah/orang tua dan tanpa pembatasan akses yang sesuai.
- `api/config.php` tidak disertakan. Salin `api/config.example.php` menjadi `api/config.php` di server, lalu masukkan kredensial database dan kode bendahara rahasia. Jangan commit file `config.php`.
- Repository GitHub hanya menyimpan kode. Jalankan PHP dan MySQL pada hosting yang mendukung PHP 8.1+, `pdo_mysql`, `mbstring`, dan MySQL/MariaDB. GitHub Pages tidak dapat menjalankan PHP.

## Upload ke GitHub

1. Buat repository baru dengan nama `kas-tkjt1`.
2. Ekstrak paket ini, buka PowerShell di folder proyek, lalu jalankan `git init`.
3. Jalankan `git add .` lalu `git status`. Pastikan `api/config.php` dan `database/database.sql` tidak muncul sebagai file yang akan di-commit.
4. Jalankan `git commit -m "Initial commit Kas TKJT 1"`.
5. Jalankan `git branch -M main`.
6. Hubungkan remote repository, misalnya `git remote add origin https://github.com/USERNAME/kas-tkjt1.git`, lalu jalankan `git push -u origin main`.

Untuk hosting, unggah file aplikasi ke `public_html` melalui File Manager/FTP. Jangan mengandalkan GitHub Pages untuk menjalankan backend PHP. Impor SQL dari komputer lokal melalui phpMyAdmin hosting; setelah selesai, folder SQL tidak perlu dipasang di folder web.

## 10. Catatan jujur: yang diuji dan yang belum

Diuji otomatis selama pengerjaan: seluruh API (hak akses, validasi, perhitungan saldo/tunggakan, laporan PDF dan Excel,
unggahan), uji keamanan terarah (SQL injection, XSS, CSRF/Origin, sesi, pembatasan percobaan, akses berkas langsung,
IDOR, kebocoran data, injeksi rumus Excel), uji peramban dengan Playwright (masuk/keluar, tambah/ubah/hapus data,
perubahan saldo, cari/filter, tampilan HP 390 px, validasi formulir, tanpa galat konsol/jaringan), serta skrip impor
(data rekaan dan data asli yang dibuat lewat aplikasi lama).

**Belum atau tidak bisa diuji di lingkungan pengerjaan**, jadi mohon diperiksa saat dipasang:

- **MySQL/MariaDB sungguhan.** Pengujian memakai Dolt (kompatibel MySQL). Skema memakai fitur standar, tetapi belum
  pernah dijalankan di MySQL/MariaDB.
- **Aturan `.htaccess` di Apache** dan **contoh Nginx** di atas (tidak ada Apache/Nginx di lingkungan pengerjaan; yang
  diuji adalah `router.php`).
- **Microsoft Excel** (berkas .xlsx diperiksa dengan openpyxl dan LibreOffice) serta berbagai aplikasi pembaca PDF.
- **HTTPS/HSTS** dan pemuatan **Google Fonts** (diblokir di lingkungan pengerjaan).

**Batasan desain yang disengaja:**

- **Tidak ada peran administrator** — seperti aplikasi lama, perannya hanya siswa dan bendahara. Menu *Kelola Akun*
  terbuka untuk setiap bendahara: **bendahara mana pun dapat mereset password atau menghapus akun siapa pun**
  (perubahan data kas tetap dibatasi per pos). Bila ini tidak diinginkan, perlu peran administrator terpisah.
- Pemulihan password siswa secara mandiri (username + nama) cukup lemah bila nama teman sekelas diketahui; itu sebabnya
  dibatasi percobaannya dan bisa dimatikan (`lupa_siswa_mandiri`).
- Pengingat/notifikasi hanya di dalam aplikasi (tidak ada WhatsApp/email). Pembaruan antarperangkat lewat polling
  20 detik, bukan real-time.

## 11. Catatan untuk pengembang

- Semua permintaan: `api/index.php?a=<aksi>`. Daftar aksi, metode HTTP, dan syarat sesi/CSRF ada di tabel `RUTE`
  pada `api/index.php`. Permintaan POST berisi JSON (atau form untuk unggahan) dan header `X-CSRF-Token`
  yang diperoleh dari aksi `boot`/`login`.
- Untuk menambah aksi: tulis fungsi `aksi_xxx()` di `api/lib/`, daftarkan di `RUTE`, dan periksa hak aksesnya di
  fungsi itu (`wajib_bendahara()`, `bendahara_pos()`, dst.).
- Skema contoh: `database/database.example.sql` (tabel `siswa`, `bendahara_master`, `accounts`, `sessions`, `kas_masuk`,
  `pengeluaran`, `target_pembelian`, `bukti_transfer`, `uploads`, `pengaturan_pos`, `notifikasi`,
  `login_attempts`). Perubahan struktur sebaiknya berupa berkas migrasi SQL tersendiri yang aman diulang.
- Berkas uji otomatis (Python + Playwright) tidak ikut dalam paket ini.


## Deploy ke Vercel (PHP + FrankenPHP)

Repository ini menyertakan `Dockerfile.vercel` dan `Caddyfile` untuk Vercel Container Runtime. Vercel membangun image dari repository; Docker Desktop hanya diperlukan bila ingin menjalankan atau menguji container secara lokal.

### Persiapan database

- Aplikasi membutuhkan MySQL/MariaDB yang dapat diakses melalui jaringan dari Vercel. MySQL XAMPP di komputer sendiri tidak dapat dijadikan database produksi Vercel secara langsung.
- Gunakan database MySQL online yang mendukung koneksi TLS. Contoh MySQL-compatible yang tersedia di Vercel Marketplace adalah TiDB Cloud.
- Jangan masukkan daftar siswa, akun, transaksi, password, atau hasil export database asli ke repository publik. Gunakan database example yang anonim untuk uji coba. Data kelas sebenarnya hanya boleh dipindahkan setelah memperoleh izin sekolah/guru dan disimpan di database privat.

### Environment Variables Vercel

Atur variabel berikut di Project Settings → Environment Variables:

- `KAS_DB_HOST`: host database online
- `KAS_DB_PORT`: port database (ikuti provider; TiDB Cloud umumnya `4000`)
- `KAS_DB_NAME`: nama database
- `KAS_DB_USER`: username database
- `KAS_DB_PASS`: password database
- `KAS_DB_SSL`: `true` untuk TLS (misalnya TiDB Cloud)
- `KAS_KODE_BENDAHARA`: kode rahasia pendaftaran bendahara
- `KAS_TIMEZONE`: `Asia/Jakarta`
- `KAS_LUPA_SISWA_MANDIRI`: `false` untuk situs yang dapat diakses publik
- `KAS_DEBUG`: `false`

Impor `database/database.example.sql` ke database online untuk uji coba awal. Untuk data kelas yang sebenarnya, gunakan salinan database privat yang telah mendapat persetujuan. Jangan commit file SQL privat ke GitHub.

### Catatan runtime

- Sesi login dan gambar QRIS/bukti transfer aplikasi disimpan di tabel MySQL, sehingga tidak bergantung pada filesystem container yang sementara.
- `api/config.php` dibuat dari `api/config.example.php` saat image dibangun; rahasia koneksi tetap dibaca dari Environment Variables saat runtime.
- Setelah menambah atau mengubah Environment Variables, lakukan redeploy.
