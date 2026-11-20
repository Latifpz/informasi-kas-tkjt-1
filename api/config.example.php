<?php
/*
 * Contoh konfigurasi untuk Informasi Kas X TKJT 1.
 * Salin file ini menjadi config.php di server, lalu isi akses MySQL dan
 * kode bendahara. Jangan pernah mengunggah config.php atau rahasianya ke GitHub.
 */
defined('KAS_APP') or exit; // berkas ini tidak boleh dijalankan langsung lewat URL

/*
 * PENGATURAN KAS TKJT 1
 * ---------------------
 * Ubah nilai di sebelah kanan tanda => sesuai server kamu.
 * Nilai juga bisa diisi lewat variabel lingkungan KAS_* (opsional, berguna
 * di VPS/Docker; variabel lingkungan menang atas nilai di berkas ini).
 *
 * Pada XAMPP bawaan (MySQL tanpa password) cukup buat database "kas_tkjt1",
 * impor database/database.example.sql setelah menyesuaikan data contoh secara lokal, lalu isi 'kode_bendahara' di bawah.
 */

$env = static function (string $nama, $bawaan) {
    $nilai = getenv($nama);
    return $nilai === false ? $bawaan : $nilai;
};

return [
    // --- Database MySQL / MariaDB ------------------------------------------
    'db' => [
        'host'    => $env('KAS_DB_HOST', '127.0.0.1'), // isi lewat Environment Variables saat deploy
        'port'    => (int) $env('KAS_DB_PORT', 3306), // TiDB Cloud umumnya memakai port 4000
        'name'    => $env('KAS_DB_NAME', 'kas_tkjt1'),
        'user'    => $env('KAS_DB_USER', 'root'),
        'pass'    => $env('KAS_DB_PASS', ''),   // XAMPP bawaan: kosong
        'charset' => 'utf8mb4',
    ],

    // --- Umum ---------------------------------------------------------------
    // Dipakai untuk menentukan "hari ini" / "bulan ini" pada status bayar.
    // WIB = Asia/Jakarta, WITA = Asia/Makassar, WIT = Asia/Jayapura.
    'timezone' => $env('KAS_TIMEZONE', 'Asia/Jakarta'),

    // Kode rahasia untuk mendaftar (dan memulihkan password) sebagai
    // BENDAHARA. Beri tahu hanya ke para bendahara. Selama kosong,
    // pendaftaran akun bendahara DITOLAK supaya tidak ada siswa lain yang
    // bisa mengaku sebagai bendahara dan mengubah data kas.
    // Contoh: 'kode_bendahara' => 'GANTI_DENGAN_KODE_RAHASIA_UNIK'
    'kode_bendahara' => $env('KAS_KODE_BENDAHARA', ''),

    // --- Sesi & keamanan ----------------------------------------------------
    'session_name'        => 'kas_tkjt1_sid',
    'sesi_hari'           => 30,   // berapa hari akun tetap masuk
    'login_maks_gagal'    => 8,    // percobaan salah per akun per IP ...
    'login_maks_gagal_ip' => 100,  // ... dan total per IP (satu Wi-Fi sekolah = satu IP)
    'login_jendela_menit' => 10,   // ... dalam jendela waktu ini
    'cek_origin'          => true, // tolak permintaan lintas situs
    // Lupa password SISWA: true = siswa bisa mengatur ulang sendiri dengan username + nama
    // (dibatasi percobaannya). false = hanya bendahara yang bisa mereset (menu Kelola Akun);
    // pilih false bila situs bisa dibuka dari internet umum. Bendahara selalu butuh kode_bendahara.
    'lupa_siswa_mandiri'  => (bool) filter_var($env('KAS_LUPA_SISWA_MANDIRI', true), FILTER_VALIDATE_BOOLEAN),
    'header_ip_proxy'     => '',   // mis. 'HTTP_CF_CONNECTING_IP' bila di belakang Cloudflare

    // --- Unggahan gambar (QRIS & bukti transfer) ----------------------------
    // Catatan: batas php.ini (upload_max_filesize / post_max_size) juga berlaku.
    // Aplikasi mengecilkan foto di peramban lebih dulu, jadi biasanya < 1 MB.
    'upload_maks_byte' => 3 * 1024 * 1024,

    // true = tampilkan pesan galat teknis (hanya saat mengembangkan).
    'debug' => (bool) $env('KAS_DEBUG', false),
];
