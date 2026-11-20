<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   INTI: konfigurasi, koneksi database, masukan, keluaran JSON, galat
===================================================================== */

const POS_LIST  = ['Rutin', 'Acara', 'Kurban'];
const POS_LABEL = ['Rutin' => 'Kas Rutin', 'Acara' => 'Dana Acara', 'Kurban' => 'Dana Kurban'];

/** Galat yang aman ditampilkan ke pengguna (pesan, kode HTTP, kode mesin). */
final class ApiError extends RuntimeException
{
    public function __construct(
        string $pesan,
        public int $status = 400,
        public string $kode = 'galat'
    ) {
        parent::__construct($pesan);
    }
}

function cfg(string $kunci, mixed $bawaan = null): mixed
{
    static $c = null;
    if ($c === null) {
        $c = require __DIR__ . '/../config.php';
    }
    return $c[$kunci] ?? $bawaan;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $d = cfg('db');
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $d['host'], $d['port'], $d['name'], $d['charset']
    );
    try {
        $opsi = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_FOUND_ROWS   => true, // rowCount() = baris yang cocok
        ];

        // Untuk database online yang mewajibkan TLS (mis. TiDB Cloud).
        // Aktifkan KAS_DB_SSL=true di Environment Variables server.
        if (filter_var(getenv('KAS_DB_SSL') ?: 'false', FILTER_VALIDATE_BOOLEAN)) {
            $ca = getenv('KAS_DB_SSL_CA') ?: '/etc/ssl/cert.pem';
            if (!is_file($ca)) {
                throw new RuntimeException('Sertifikat CA database tidak ditemukan.');
            }
            $opsi[PDO::MYSQL_ATTR_SSL_CA] = $ca;
            $opsi[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
        }

        $pdo = new PDO($dsn, (string) $d['user'], (string) $d['pass'], $opsi);
    } catch (PDOException $e) {
        error_log('[kas] koneksi database gagal: ' . $e->getMessage());
        throw new ApiError(
            'Tidak dapat terhubung ke database. Periksa pengaturan di api/config.php.',
            503,
            'database'
        );
    }
    return $pdo;
}

/** Jalankan query berparameter dan kembalikan statement-nya. */
function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function now_ms(): int
{
    return (int) floor(microtime(true) * 1000);
}

/** Jalankan $fn di dalam transaksi; batalkan semuanya bila ada galat. */
function transaksi(callable $fn): mixed
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $hasil = $fn();
        $pdo->commit();
        return $hasil;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/* ---------------------------------------------------------------------
   Keluaran
--------------------------------------------------------------------- */

function kirim_json(array $data, int $status = 200): void
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: same-origin');
        header('Cross-Origin-Resource-Policy: same-origin');
    }
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function kirim_galat(string $pesan, int $status = 400, string $kode = 'galat'): void
{
    kirim_json(['ok' => false, 'kode' => $kode, 'pesan' => $pesan], $status);
}

/* ---------------------------------------------------------------------
   Masukan
--------------------------------------------------------------------- */

/** Badan permintaan: JSON bila Content-Type application/json, selain itu $_POST. */
function badan(): array
{
    static $b = null;
    if ($b !== null) {
        return $b;
    }
    $tipe = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_starts_with($tipe, 'application/json')) {
        $mentah = (string) file_get_contents('php://input');
        $j = json_decode($mentah, true);
        if (!is_array($j)) {
            throw new ApiError('Permintaan tidak valid.', 400, 'format');
        }
        return $b = $j;
    }
    return $b = $_POST;
}

/** Teks: dipangkas, tanpa karakter kontrol, dibatasi panjangnya. */
function teks(array $in, string $kunci, int $maks = 255, string $label = ''): string
{
    $v = $in[$kunci] ?? '';
    if (is_array($v) || is_object($v)) {
        throw new ApiError('Isian tidak valid.', 422, 'validasi');
    }
    $v = trim((string) $v);
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    if (mb_strlen($v) > $maks) {
        $nama = $label !== '' ? $label : $kunci;
        throw new ApiError("$nama terlalu panjang (maksimal $maks karakter).", 422, 'validasi');
    }
    return $v;
}

/** Bilangan bulat dalam rentang; menerima angka JSON atau string digit. */
function angka(array $in, string $kunci, int $min, int $maks, string $label): int
{
    $v = $in[$kunci] ?? null;
    if (is_string($v)) {
        $v = trim($v);
        $v = preg_match('/^\d{1,15}$/', $v) === 1 ? (int) $v : null;
    }
    if (!is_int($v) || $v < $min || $v > $maks) {
        throw new ApiError(
            "$label harus berupa bilangan bulat antara " . number_format($min, 0, ',', '.')
            . ' dan ' . number_format($maks, 0, ',', '.') . '.',
            422,
            'validasi'
        );
    }
    return $v;
}

/** Tanggal YYYY-MM-DD yang benar-benar ada di kalender. */
function tanggal(array $in, string $kunci, string $label = 'Tanggal'): string
{
    $v = teks($in, $kunci, 10, $label);
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) !== 1
        || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])
        || (int) $m[1] < 2000 || (int) $m[1] > 2100) {
        throw new ApiError("$label tidak valid.", 422, 'validasi');
    }
    return $v;
}

function pos_valid(string $pos): string
{
    if (!in_array($pos, POS_LIST, true)) {
        throw new ApiError('Pos dana tidak dikenal.', 422, 'validasi');
    }
    return $pos;
}

function ip_klien(): string
{
    $header = (string) cfg('header_ip_proxy', '');
    $ip = $header !== '' ? (string) ($_SERVER[$header] ?? '') : '';
    if ($ip !== '') {
        $ip = trim(explode(',', $ip)[0]); // alamat paling kiri = klien asli
    }
    if ($ip === '' || filter_var($ip, FILTER_VALIDATE_IP) === false) {
        $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    }
    return substr($ip, 0, 45);
}

function pakai_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https'
        || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
}

/**
 * Tolak permintaan tulis dari situs lain. Peramban selalu mengirim Origin
 * pada POST lintas situs; bila host-nya tidak sama dengan host server ini,
 * permintaan ditolak.
 */
function cek_origin(): void
{
    if (!cfg('cek_origin', true)) {
        return;
    }
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '') {
        return; // klien non-peramban (curl, dll.) tidak mengirim Origin
    }
    $host = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $port = parse_url($origin, PHP_URL_PORT);
    $skema = strtolower((string) parse_url($origin, PHP_URL_SCHEME));
    $asal = $host . ($port && !(($skema === 'http' && $port === 80) || ($skema === 'https' && $port === 443)) ? ':' . $port : '');

    $kandidat = [];
    foreach (['HTTP_HOST', 'HTTP_X_FORWARDED_HOST'] as $h) {
        $v = strtolower(trim((string) ($_SERVER[$h] ?? '')));
        if ($v !== '') {
            $kandidat[] = preg_replace('/:(80|443)$/', '', $v);
        }
    }
    if ($host === '' || !in_array($asal, $kandidat, true)) {
        throw new ApiError('Permintaan ditolak (asal tidak cocok).', 403, 'origin');
    }
}
