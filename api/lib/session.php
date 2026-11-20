<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   SESI MASUK
   Disimpan di tabel `sessions` (bukan berkas) agar tidak bergantung pada
   folder sesi hosting dan bisa dicabut dari server (mis. saat password
   diganti). Peramban hanya menyimpan cookie acak HttpOnly.
===================================================================== */

final class DbSessionHandler implements SessionHandlerInterface, SessionUpdateTimestampHandlerInterface
{
    public function __construct(private int $ttl)
    {
    }

    public function open(string $path, string $name): bool
    {
        return true;
    }

    public function close(): bool
    {
        return true;
    }

    public function read(string $id): string|false
    {
        $d = q('SELECT `data` FROM `sessions` WHERE `id` = ? AND `expires_at` > ?', [$id, time()])->fetchColumn();
        return $d === false ? '' : (string) $d;
    }

    public function write(string $id, string $data): bool
    {
        $arr = @unserialize($data, ['allowed_classes' => false]); // serialize_handler = php_serialize
        if (!is_array($arr) || $arr === []) {
            return true; // sesi anonim kosong tidak perlu disimpan
        }
        $uid = isset($arr['uid']) ? (int) $arr['uid'] : null;
        q(
            'REPLACE INTO `sessions` (`id`, `account_id`, `data`, `expires_at`) VALUES (?, ?, ?, ?)',
            [$id, $uid, $data, time() + $this->ttl]
        );
        return true;
    }

    public function destroy(string $id): bool
    {
        q('DELETE FROM `sessions` WHERE `id` = ?', [$id]);
        return true;
    }

    public function gc(int $max_lifetime): int|false
    {
        return q('DELETE FROM `sessions` WHERE `expires_at` < ?', [time()])->rowCount();
    }

    public function validateId(string $id): bool
    {
        return (bool) q('SELECT 1 FROM `sessions` WHERE `id` = ? AND `expires_at` > ?', [$id, time()])->fetchColumn();
    }

    public function updateTimestamp(string $id, string $data): bool
    {
        q('UPDATE `sessions` SET `expires_at` = ? WHERE `id` = ?', [time() + $this->ttl, $id]);
        return true;
    }
}

/**
 * Mulai sesi. Tanpa $buat, sesi hanya dimulai bila peramban sudah membawa
 * cookie sesi, sehingga pengunjung anonim tidak membuat apa pun di server.
 */
function mulai_sesi(bool $buat = false): bool
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return true;
    }
    $nama = (string) cfg('session_name', 'kas_tkjt1_sid');
    if (!$buat && empty($_COOKIE[$nama])) {
        return false;
    }
    $ttl = max(1, (int) cfg('sesi_hari', 30)) * 86400;

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    ini_set('session.lazy_write', '1');
    ini_set('session.serialize_handler', 'php_serialize');
    ini_set('session.gc_maxlifetime', (string) $ttl);
    ini_set('session.sid_length', '48');
    ini_set('session.sid_bits_per_character', '5');
    ini_set('session.cache_limiter', ''); // cache dikendalikan tiap respons (mis. gambar boleh di-cache)

    session_name($nama);
    session_set_cookie_params([
        'lifetime' => $ttl,
        'path'     => '/',
        'secure'   => pakai_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_set_save_handler(new DbSessionHandler($ttl), true);
    session_start();
    return true;
}

/**
 * Akun yang sedang masuk (dibaca ulang dari database di setiap permintaan,
 * jadi akun yang dihapus langsung kehilangan akses), atau null.
 */
function user_sekarang(bool $segar = false): ?array
{
    static $cache = false;
    if ($segar) {
        $cache = false;
    }
    if ($cache !== false) {
        return $cache;
    }
    if (!mulai_sesi()) {
        return $cache = null;
    }
    $uid = (int) ($_SESSION['uid'] ?? 0);
    if ($uid <= 0) {
        return $cache = null;
    }
    $r = q(
        'SELECT a.`id`, a.`role`, a.`nama`, a.`username`, a.`pass_hash`, bm.`jabatan`, bm.`pos`
           FROM `accounts` a
           LEFT JOIN `bendahara_master` bm ON a.`role` = \'bendahara\' AND bm.`nama` = a.`nama`
          WHERE a.`id` = ?',
        [$uid]
    )->fetch();
    if (!$r) {
        $_SESSION = [];
        session_destroy();
        return $cache = null;
    }
    return $cache = [
        'id'        => (string) $r['id'],
        'role'      => (string) $r['role'],
        'nama'      => (string) $r['nama'],
        'username'  => (string) $r['username'],
        'pass_hash' => (string) $r['pass_hash'],
        'jabatan'   => $r['jabatan'] !== null ? (string) $r['jabatan'] : null,
        'pos'       => $r['pos'] !== null ? (string) $r['pos'] : null,
    ];
}

/** Data akun yang aman dikirim ke peramban. */
function user_publik(array $u): array
{
    return [
        'id'       => $u['id'],
        'nama'     => $u['nama'],
        'role'     => $u['role'],
        'jabatan'  => $u['jabatan'],
        'username' => $u['username'],
    ];
}

function wajib_login(): array
{
    $u = user_sekarang();
    if ($u === null) {
        throw new ApiError('Sesi berakhir. Silakan masuk lagi.', 401, 'sesi');
    }
    return $u;
}

function wajib_bendahara(): array
{
    $u = wajib_login();
    if ($u['role'] !== 'bendahara') {
        throw new ApiError('Fitur ini khusus bendahara.', 403, 'akses');
    }
    return $u;
}

/** Permintaan tulis yang sudah masuk wajib membawa token CSRF yang cocok. */
function wajib_csrf(): void
{
    $token = (string) ($_SESSION['csrf'] ?? '');
    $kirim = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($token === '' || $kirim === '' || !hash_equals($token, $kirim)) {
        throw new ApiError('Sesi tidak valid. Muat ulang halaman lalu coba lagi.', 403, 'csrf');
    }
}

function token_csrf(): string
{
    return (string) ($_SESSION['csrf'] ?? '');
}

/** Catat akun sebagai sudah masuk: ID sesi diganti (anti session fixation). */
function catat_masuk(int $akunId): void
{
    mulai_sesi(true);
    session_regenerate_id(true);
    $_SESSION = [
        'uid'  => $akunId,
        'csrf' => bin2hex(random_bytes(24)),
    ];
    user_sekarang(true);
}

function catat_keluar(): void
{
    if (mulai_sesi()) {
        $_SESSION = [];
        session_destroy();
    }
    $nama = (string) cfg('session_name', 'kas_tkjt1_sid');
    setcookie($nama, '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'secure'   => pakai_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    user_sekarang(true);
}

/** Cabut semua sesi sebuah akun (kecuali satu sesi yang sedang dipakai). */
function cabut_sesi_akun(string $akunId, ?string $kecualiSid = null): void
{
    q(
        'DELETE FROM `sessions` WHERE `account_id` = ? AND `id` <> ?',
        [(int) $akunId, $kecualiSid ?? '']
    );
}
