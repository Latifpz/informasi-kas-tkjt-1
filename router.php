<?php
declare(strict_types=1);

/*
 * KAS TKJT 1 - router untuk server bawaan PHP
 * -------------------------------------------
 * Jalankan dari folder proyek ini:
 *
 *     php -S localhost:8000 router.php
 *
 * Server bawaan PHP TIDAK membaca .htaccess, sehingga tanpa berkas ini
 * database/database.sql, .htaccess, dan berkas lain dapat diunduh lewat URL.
 * Router ini memakai daftar izin (allowlist):
 *   - hanya berkas statis front end (html, css, js, gambar) yang dilayani;
 *   - satu-satunya skrip PHP yang dijalankan adalah api/index.php;
 *   - segala sesuatu yang lain (api/config.php, api/lib/*, database/*,
 *     berkas tersembunyi seperti .htaccess, README.md, dst.) dijawab 404.
 * Berkas statis dikirim dengan header keamanan yang sama seperti .htaccess.
 *
 * Tidak dibutuhkan di XAMPP/Apache (cukup .htaccess) maupun Nginx (lihat README).
 */

if (PHP_SAPI !== 'cli-server') {
    http_response_code(404);
    exit;
}

header_remove('X-Powered-By'); // jangan umumkan versi PHP

function router_tolak(int $status): never
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    echo $status === 405 ? "Metode tidak diizinkan.\n" : "Tidak ditemukan.\n";
    exit;
}

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$jalur = rawurldecode((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH));
$jalur = str_replace('\\', '/', $jalur);

// byte NUL atau segmen ".." = percobaan keluar dari folder proyek
if (str_contains($jalur, "\0") || preg_match('#(^|/)\.\.(/|$)#', $jalur) === 1) {
    router_tolak(404);
}

if ($jalur === '' || $jalur === '/') {
    $jalur = '/index.html';
}

// 1) satu-satunya skrip PHP yang boleh dijalankan
if ($jalur === '/api/index.php') {
    return false; // biarkan server bawaan menjalankannya
}

// 2) berkas statis: hanya GET/HEAD, hanya ekstensi yang diizinkan
if ($metode !== 'GET' && $metode !== 'HEAD') {
    router_tolak(405);
}

const ROUTER_MIME = [
    'html' => 'text/html; charset=utf-8',
    'css' => 'text/css; charset=utf-8',
    'js' => 'text/javascript; charset=utf-8',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
    'svg' => 'image/svg+xml',
    'ico' => 'image/x-icon',
    'woff2' => 'font/woff2',
];

// folder yang tidak pernah dilayani walaupun isinya berekstensi "aman"
$terlarang = ['api', 'database', 'tools', 'tests', 'node_modules', 'vendor'];
$segmen = explode('/', trim($jalur, '/'));

foreach ($segmen as $s) {
    if ($s !== '' && $s[0] === '.') {
        router_tolak(404); // .htaccess, .git, .env, ...
    }
}
if (in_array(strtolower($segmen[0]), $terlarang, true)) {
    router_tolak(404);
}

$akar = realpath(__DIR__);
$berkas = realpath(__DIR__ . $jalur);

if (
    $akar === false
    || $berkas === false
    || !str_starts_with($berkas, $akar . DIRECTORY_SEPARATOR)
    || !is_file($berkas)
) {
    router_tolak(404);
}

$ekstensi = strtolower(pathinfo($berkas, PATHINFO_EXTENSION));

if (!isset(ROUTER_MIME[$ekstensi])) {
    router_tolak(404);
}

header('Content-Type: ' . ROUTER_MIME[$ekstensi]);
header('Content-Length: ' . (string) filesize($berkas));
header('Cache-Control: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header('Cross-Origin-Opener-Policy: same-origin');

if ($metode !== 'HEAD') {
    readfile($berkas);
}
exit;
