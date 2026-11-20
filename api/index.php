<?php
declare(strict_types=1);

/*
 * KAS TKJT 1 - pintu masuk API
 * ----------------------------
 * Semua permintaan dari front end (script.js) lewat berkas ini:
 *     api/index.php?a=<aksi>
 * Alamat dengan query string dipilih supaya jalan di XAMPP, hosting biasa,
 * Nginx, maupun server bawaan PHP tanpa pengaturan rewrite.
 */

define('KAS_APP', true);

// Jangan umumkan versi PHP ke pengunjung.
header_remove('X-Powered-By');

if (PHP_VERSION_ID < 80100) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        ['ok' => false, 'kode' => 'php', 'pesan' => 'Server memakai PHP ' . PHP_VERSION . '. Aplikasi ini butuh PHP 8.1 atau lebih baru.'],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

foreach (['pdo_mysql', 'mbstring'] as $ekstensi) {
    if (!extension_loaded($ekstensi)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            ['ok' => false, 'kode' => 'php', 'pesan' => "Ekstensi PHP \"$ekstensi\" belum aktif. Aktifkan di php.ini lalu mulai ulang Apache."],
            JSON_UNESCAPED_UNICODE
        );
        exit;
    }
}

// Galat PHP dicatat ke log server, tidak pernah ditampilkan ke pengunjung.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require __DIR__ . '/lib/core.php';
require __DIR__ . '/lib/session.php';
require __DIR__ . '/lib/periode.php';
require __DIR__ . '/lib/upload.php';
require __DIR__ . '/lib/data.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/keuangan.php';
require __DIR__ . '/lib/bukti.php';
require __DIR__ . '/lib/notif.php';
require __DIR__ . '/lib/akun.php';
require __DIR__ . '/lib/laporan.php';
require __DIR__ . '/lib/pdf.php';
require __DIR__ . '/lib/xlsx.php';

date_default_timezone_set((string) cfg('timezone', 'Asia/Jakarta'));

/*
 * Daftar aksi: nama => [metode HTTP, perlu sesi + token CSRF?, fungsi].
 * POST tanpa sesi (masuk / daftar / lupa) tetap dijaga pemeriksaan Origin,
 * pembatasan percobaan, dan SameSite pada cookie.
 */
const RUTE = [
    // baca
    'boot'            => ['GET',  false, 'aksi_boot'],
    'state'           => ['GET',  true,  'aksi_state'],
    'file'            => ['GET',  true,  'aksi_file'],

    // laporan (khusus bendahara; GET karena hanya membaca dan diunduh lewat fetch)
    'laporan'         => ['GET',  true,  'aksi_laporan'],
    'laporan_pdf'     => ['GET',  true,  'aksi_laporan_pdf'],
    'laporan_xlsx'    => ['GET',  true,  'aksi_laporan_xlsx'],

    // akun & sesi
    'login'           => ['POST', false, 'aksi_login'],
    'daftar'          => ['POST', false, 'aksi_daftar'],
    'lupa'            => ['POST', false, 'aksi_lupa'],
    'keluar'          => ['POST', true,  'aksi_keluar'],
    'ganti_username'  => ['POST', true,  'aksi_ganti_username'],
    'ganti_password'  => ['POST', true,  'aksi_ganti_password'],
    'akun_reset'      => ['POST', true,  'aksi_akun_reset'],
    'akun_hapus'      => ['POST', true,  'aksi_akun_hapus'],

    // keuangan (khusus bendahara pemilik pos)
    'kas_simpan'      => ['POST', true,  'aksi_kas_simpan'],
    'kas_hapus'       => ['POST', true,  'aksi_kas_hapus'],
    'keluar_simpan'   => ['POST', true,  'aksi_keluar_simpan'],
    'keluar_hapus'    => ['POST', true,  'aksi_keluar_hapus'],
    'target_simpan'   => ['POST', true,  'aksi_target_simpan'],
    'target_hapus'    => ['POST', true,  'aksi_target_hapus'],
    'nominal_simpan'  => ['POST', true,  'aksi_nominal_simpan'],

    // QRIS & bukti transfer
    'qris_simpan'     => ['POST', true,  'aksi_qris_simpan'],
    'qris_hapus'      => ['POST', true,  'aksi_qris_hapus'],
    'bukti_kirim'     => ['POST', true,  'aksi_bukti_kirim'],
    'bukti_terima'    => ['POST', true,  'aksi_bukti_terima'],
    'bukti_tolak'     => ['POST', true,  'aksi_bukti_tolak'],

    // pengingat & notifikasi
    'pengingat_kirim' => ['POST', true,  'aksi_pengingat_kirim'],
    'pengingat_semua' => ['POST', true,  'aksi_pengingat_semua'],
    'notif_baca'      => ['POST', true,  'aksi_notif_baca'],
];

try {
    $aksi = (string) ($_GET['a'] ?? '');
    if (!isset(RUTE[$aksi])) {
        throw new ApiError('Alamat API tidak ditemukan.', 404, 'tidak_ada');
    }

    [$metode, $perluSesi, $fungsi] = RUTE[$aksi];
    if ($_SERVER['REQUEST_METHOD'] !== $metode) {
        header('Allow: ' . $metode);
        throw new ApiError('Metode permintaan tidak diizinkan.', 405, 'metode');
    }

    if ($metode === 'POST') {
        cek_origin();
    }
    if ($perluSesi) {
        wajib_login();            // 401 bila belum masuk
        if ($metode === 'POST') {
            wajib_csrf();         // 403 bila token tidak cocok
        }
    }

    $fungsi();
} catch (ApiError $e) {
    kirim_galat($e->getMessage(), $e->status, $e->kode);
} catch (Throwable $e) {
    error_log('[kas] ' . get_class($e) . ': ' . $e->getMessage() . ' di ' . $e->getFile() . ':' . $e->getLine());
    kirim_galat(
        cfg('debug') ? get_class($e) . ': ' . $e->getMessage() : 'Terjadi kesalahan pada server. Coba lagi nanti.',
        500,
        'server'
    );
}
