<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   AUTENTIKASI: aturan username/password, pembatasan percobaan, boot,
   masuk, daftar, lupa password, keluar
===================================================================== */

/* ---------------------------------------------------------------------
   Aturan isian
--------------------------------------------------------------------- */

function validasi_username(string $u): string
{
    if (preg_match('/^[A-Za-z0-9._-]{3,30}$/', $u) !== 1) {
        throw new ApiError(
            'Username 3-30 karakter, hanya huruf, angka, titik, garis bawah, atau strip (tanpa spasi).',
            422,
            'username'
        );
    }
    return $u;
}

const PASSWORD_MIN = 6;

/**
 * Password dibaca apa adanya (tidak dipangkas). Minimal 6 karakter, maksimal
 * 72 byte (batas bcrypt), dan tidak boleh sama dengan username.
 */
function validasi_password(mixed $p, string $label = 'Password', ?string $username = null): string
{
    if (!is_string($p) || $p === '') {
        throw new ApiError("$label wajib diisi.", 422, 'password');
    }
    // Karakter kontrol (termasuk NUL) tidak masuk akal di password dan membuat bcrypt PHP 8.3 melempar galat.
    if (preg_match('/[\x00-\x1F\x7F]/', $p) === 1) {
        throw new ApiError("$label tidak boleh memuat karakter kontrol.", 422, 'password');
    }
    if (mb_strlen($p) < PASSWORD_MIN) {
        throw new ApiError("$label minimal " . PASSWORD_MIN . ' karakter.', 422, 'password');
    }
    if (strlen($p) > 72) {
        throw new ApiError("$label terlalu panjang (maksimal 72 karakter).", 422, 'password');
    }
    if ($username !== null && mb_strtolower($p) === mb_strtolower($username)) {
        throw new ApiError("$label tidak boleh sama dengan username.", 422, 'password');
    }
    return $p;
}

/** Kode bendahara dari kiriman klien cocok dengan kode di config.php? */
function kode_bendahara_benar(mixed $dikirim): bool
{
    $kode = (string) cfg('kode_bendahara', '');
    $dikirim = is_string($dikirim) ? trim($dikirim) : '';
    return $kode !== '' && $dikirim !== '' && hash_equals($kode, $dikirim);
}

function validasi_role(string $role): string
{
    if (!in_array($role, ['siswa', 'bendahara'], true)) {
        throw new ApiError('Peran tidak valid.', 422, 'validasi');
    }
    return $role;
}

/** Hash bcrypt (biaya 10) dari teks acak; hanya dipakai bila belum ada satu pun akun. */
const HASH_PALSU = '$2y$10$hXVjLES6ox91jtZ5P0qfgex3/0Be.dOknDxjomW/QN6eyWawTiraK';

/**
 * Cocokkan password. Bila akunnya tidak ada, tetap lakukan SATU verifikasi bcrypt
 * terhadap hash akun lain (biayanya sama dengan akun asli) supaya lama respons
 * tidak membocorkan apakah sebuah username terdaftar.
 */
function cek_password(string $password, ?string $hash): bool
{
    if ($hash === null) {
        $pembanding = q('SELECT `pass_hash` FROM `accounts` LIMIT 1')->fetchColumn();
        password_verify($password, is_string($pembanding) ? $pembanding : HASH_PALSU);
        return false;
    }
    return password_verify($password, $hash);
}

/* ---------------------------------------------------------------------
   Pembatasan percobaan (masuk, lupa password, kode bendahara, dst.)
--------------------------------------------------------------------- */

/** Kunci pembatasan; dipotong per KARAKTER (bukan byte) agar emoji/huruf Unicode tidak terbelah. */
function batas_kunci(string $jenis, string $akun): string
{
    return mb_substr($jenis . ':' . mb_strtolower($akun), 0, 100);
}

function batas_cek(string $jenis, string $akun): void
{
    $sejak = now_ms() - max(1, (int) cfg('login_jendela_menit', 10)) * 60000;
    $ip = ip_klien();
    $kunci = batas_kunci($jenis, $akun);

    $perIp = (int) q(
        'SELECT COUNT(*) FROM `login_attempts` WHERE `ip` = ? AND `kunci` LIKE ? AND `created_at` > ?',
        [$ip, $jenis . ':%', $sejak]
    )->fetchColumn();
    $perAkun = (int) q(
        'SELECT COUNT(*) FROM `login_attempts` WHERE `ip` = ? AND `kunci` = ? AND `created_at` > ?',
        [$ip, $kunci, $sejak]
    )->fetchColumn();

    if ($perIp >= (int) cfg('login_maks_gagal_ip', 100) || $perAkun >= (int) cfg('login_maks_gagal', 8)) {
        throw new ApiError('Terlalu banyak percobaan gagal. Tunggu beberapa menit lalu coba lagi.', 429, 'batas');
    }
}

function batas_catat(string $jenis, string $akun): void
{
    $kunci = batas_kunci($jenis, $akun);
    q('INSERT INTO `login_attempts` (`ip`, `kunci`, `created_at`) VALUES (?, ?, ?)', [ip_klien(), $kunci, now_ms()]);

    if (random_int(1, 50) === 1) { // bersih-bersih sesekali
        q('DELETE FROM `login_attempts` WHERE `created_at` < ?', [now_ms() - 86400000]);
    }
}

function batas_bersihkan(string $jenis, string $akun): void
{
    $kunci = batas_kunci($jenis, $akun);
    q('DELETE FROM `login_attempts` WHERE `ip` = ? AND `kunci` = ?', [ip_klien(), $kunci]);
}

/* ---------------------------------------------------------------------
   Endpoint
--------------------------------------------------------------------- */

/** Pemuatan awal halaman: data induk + (bila sudah masuk) akun dan seluruh data. */
function aksi_boot(): void
{
    $out = ['ok' => true, 'meta' => ambil_meta(), 'user' => null, 'csrf' => '', 'state' => null, 'rev' => ''];

    $u = user_sekarang();
    if ($u !== null) {
        // notifikasi yang sudah lebih dari 45 hari dibuang
        q('DELETE FROM `notifikasi` WHERE `created_at` < ?', [now_ms() - 45 * 86400000]);
        $state = bangun_state($u);
        $out['user'] = user_publik($u);
        $out['csrf'] = token_csrf();
        $out['state'] = $state;
        $out['rev'] = rev_state($state);
    }
    kirim_json($out);
}

/** Penyegaran data (polling). Bila ?rev= sama dengan data sekarang: jawaban singkat. */
function aksi_state(): void
{
    $u = wajib_login();
    $state = bangun_state($u);
    $rev = rev_state($state);
    if ((string) ($_GET['rev'] ?? '') === $rev) {
        kirim_json(['ok' => true, 'unchanged' => true, 'rev' => $rev, 'csrf' => token_csrf()]);
    }
    kirim_json(['ok' => true, 'user' => user_publik($u), 'csrf' => token_csrf(), 'state' => $state, 'rev' => $rev]);
}

function aksi_login(): void
{
    $in = badan();
    $role = validasi_role(teks($in, 'role', 20));
    $username = teks($in, 'username', 50);
    $password = is_string($in['password'] ?? null) ? $in['password'] : '';
    if ($username === '' || $password === '') {
        throw new ApiError('Lengkapi username dan password.', 422, 'validasi');
    }

    batas_cek('login', $username);

    $r = q('SELECT `id`, `pass_hash` FROM `accounts` WHERE `username` = ? AND `role` = ?', [$username, $role])->fetch();
    if (!cek_password($password, $r ? (string) $r['pass_hash'] : null) || !$r) {
        batas_catat('login', $username);
        throw new ApiError('Username atau password salah.', 401, 'login');
    }
    batas_bersihkan('login', $username);

    if (password_needs_rehash((string) $r['pass_hash'], PASSWORD_DEFAULT)) {
        q('UPDATE `accounts` SET `pass_hash` = ? WHERE `id` = ?', [password_hash($password, PASSWORD_DEFAULT), (int) $r['id']]);
    }

    catat_masuk((int) $r['id']);
    $u = user_sekarang();
    $state = bangun_state($u);
    kirim_json([
        'ok'    => true,
        'user'  => user_publik($u),
        'csrf'  => token_csrf(),
        'state' => $state,
        'rev'   => rev_state($state),
    ]);
}

function aksi_daftar(): void
{
    $in = badan();
    $role = validasi_role(teks($in, 'role', 20));
    $nama = teks($in, 'nama', 100);
    $username = teks($in, 'username', 50);

    if ($nama === '') {
        throw new ApiError('Pilih nama sesuai data kelas.', 422, 'nama');
    }
    validasi_username($username);
    $password = validasi_password($in['password'] ?? null, 'Password', $username);

    if ($role === 'bendahara') {
        if ((string) cfg('kode_bendahara', '') === '') {
            throw new ApiError(
                'Pendaftaran bendahara belum dibuka. Admin perlu mengisi kode_bendahara di api/config.php.',
                403,
                'kode'
            );
        }
        batas_cek('kode', 'bendahara');
        if (!kode_bendahara_benar($in['kode'] ?? null)) {
            batas_catat('kode', 'bendahara');
            throw new ApiError('Kode bendahara salah.', 403, 'kode');
        }
        $asli = q('SELECT `nama` FROM `bendahara_master` WHERE `nama` = ?', [$nama])->fetchColumn();
    } else {
        $asli = q('SELECT `nama` FROM `siswa` WHERE `nama` = ?', [$nama])->fetchColumn();
    }
    if ($asli === false) {
        throw new ApiError('Nama tidak ada di data kelas.', 422, 'nama');
    }
    $nama = (string) $asli;

    if (q('SELECT 1 FROM `accounts` WHERE `username` = ?', [$username])->fetchColumn()) {
        throw new ApiError('Username sudah dipakai.', 409, 'username');
    }
    if (q('SELECT 1 FROM `accounts` WHERE `role` = ? AND `nama` = ?', [$role, $nama])->fetchColumn()) {
        throw new ApiError('Nama ini sudah terdaftar.', 409, 'nama');
    }

    try {
        q(
            'INSERT INTO `accounts` (`role`, `nama`, `username`, `pass_hash`, `created_at`) VALUES (?, ?, ?, ?, ?)',
            [$role, $nama, $username, password_hash($password, PASSWORD_DEFAULT), now_ms()]
        );
    } catch (PDOException $e) {
        if ((int) ($e->errorInfo[1] ?? 0) === 1062) { // balapan dua pendaftar sekaligus
            throw new ApiError('Username atau nama sudah terdaftar.', 409, 'username');
        }
        throw $e;
    }

    kirim_json(['ok' => true, 'tersedia' => nama_tersedia()]);
}

/** Lupa password: peran + username + nama harus cocok dengan akun. */
function aksi_lupa(): void
{
    $in = badan();
    $role = validasi_role(teks($in, 'role', 20));
    $username = teks($in, 'username', 50);
    $nama = teks($in, 'nama', 100);
    $password = validasi_password($in['password'] ?? null, 'Password baru', $username);
    if ($username === '' || $nama === '') {
        throw new ApiError('Username dan nama wajib diisi.', 422, 'validasi');
    }
    if ($role === 'siswa' && !cfg('lupa_siswa_mandiri', true)) {
        throw new ApiError(
            'Pemulihan password mandiri dinonaktifkan. Minta bendahara mereset akunmu di menu Kelola Akun.',
            403,
            'reset'
        );
    }

    // Dua pembatas: per username, dan per NAMA (nama teman sekelas bukan rahasia,
    // jadi tanpa pembatas kedua username milik satu orang bisa ditebak berulang-ulang).
    batas_cek('reset', $username);
    batas_cek('resetnama', $nama);

    // Akun bendahara memegang uang kelas: username + nama (yang diketahui
    // teman sekelas) tidak cukup, wajib disertai kode bendahara.
    $kodeOk = $role !== 'bendahara' || kode_bendahara_benar($in['kode'] ?? null);

    $r = q(
        'SELECT `id` FROM `accounts` WHERE `username` = ? AND `role` = ? AND `nama` = ?',
        [$username, $role, $nama]
    )->fetch();
    if (!$r || !$kodeOk) {
        batas_catat('reset', $username);
        batas_catat('resetnama', $nama);
        throw new ApiError(
            $role === 'bendahara'
                ? 'Data akun atau kode bendahara tidak cocok. Periksa username, nama, dan kode.'
                : 'Data akun tidak cocok. Periksa peran, username, dan nama.',
            403,
            'reset'
        );
    }
    batas_bersihkan('reset', $username);
    batas_bersihkan('resetnama', $nama);

    q('UPDATE `accounts` SET `pass_hash` = ? WHERE `id` = ?', [password_hash($password, PASSWORD_DEFAULT), (int) $r['id']]);
    cabut_sesi_akun((string) $r['id']);
    kirim_json(['ok' => true]);
}

function aksi_keluar(): void
{
    catat_keluar();
    kirim_json(['ok' => true]);
}
