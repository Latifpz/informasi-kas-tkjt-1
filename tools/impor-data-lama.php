<?php
declare(strict_types=1);

/*
 * KAS TKJT 1 - impor data dari versi lama (localStorage peramban) ke MySQL
 * =======================================================================
 * Versi lama menyimpan semua data di peramban (localStorage, kunci "kastkjt1_db_v3").
 * Skrip ini memindahkan CATATAN KEUANGANNYA ke database MySQL versi baru:
 * kas masuk, pengeluaran, target pembelian, bukti transfer yang masih menunggu,
 * nominal Kas Rutin, dan gambar QRIS.
 *
 * Yang TIDAK dipindahkan: akun & password (password lama memakai hash di peramban yang
 * tidak bisa diubah menjadi hash server) dan notifikasi. Siswa dan bendahara cukup
 * mendaftar ulang lewat halaman "Daftar" di aplikasi baru.
 *
 * LANGKAH
 *   1. Di peramban yang menyimpan data lama, buka aplikasi lama, tekan F12 > Console,
 *      jalankan:   copy(localStorage.getItem("kastkjt1_db_v3"))
 *      lalu tempel (Ctrl+V) ke berkas teks dan simpan sebagai data-lama.json.
 *   2. Pasang aplikasi baru (README), lalu daftarkan akun bendahara (idealnya dengan
 *      username yang sama seperti dulu agar kolom "Pencatat" tetap terisi benar).
 *   3. Dari folder proyek, jalankan UJI COBA dulu (tidak menulis apa pun):
 *          php tools/impor-data-lama.php data-lama.json
 *   4. Cadangkan database (mysqldump), lalu impor sungguhan:
 *          php tools/impor-data-lama.php data-lama.json --simpan
 *
 * KEAMANAN
 *   - Hanya bisa dijalankan dari terminal (bukan lewat web). Folder tools/ juga ditutup
 *     oleh .htaccess dan router.php.
 *   - Hanya MENAMBAH baris; tidak pernah menghapus atau mengubah data yang ada, kecuali
 *     nominal Kas Rutin dan gambar QRIS.
 *   - Semua penulisan berada dalam satu transaksi: bila ada galat, tidak ada yang tersimpan.
 *   - Menolak berjalan bila tabel kas masih berisi data (supaya tidak ganda). Opsi
 *     --izinkan-data-ada mematikan penjagaan ini; pakai hanya bila kamu yakin.
 *   - Setiap isian divalidasi dengan aturan yang sama seperti aplikasi; catatan yang tidak sah
 *     dilewati dan dilaporkan alasannya.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('KAS_APP', true);
@ini_set('memory_limit', '512M');   // data lama berisi gambar base64; penyimpanan peramban paling banyak ~10 MB
$akar = dirname(__DIR__);
require_once $akar . '/api/lib/core.php';
require_once $akar . '/api/lib/upload.php';
require_once $akar . '/api/lib/keuangan.php';

function berhenti(string $pesan, int $kode = 1): never
{
    fwrite(STDERR, $pesan . "\n");
    exit($kode);
}

function bantuan(): never
{
    echo <<<TXT
    Pemakaian:
      php tools/impor-data-lama.php <data-lama.json> [--simpan] [--izinkan-data-ada]

      (tanpa opsi)         uji coba: memeriksa dan melaporkan, TIDAK menulis ke database
      --simpan             menulis ke database (dalam satu transaksi)
      --izinkan-data-ada   tetap jalan walau tabel kas sudah berisi data (hati-hati: bisa ganda)

    TXT;
    echo "\n";
    exit(0);
}

$argumen = array_slice($argv, 1);
if ($argumen === [] || in_array('--bantuan', $argumen, true) || in_array('-h', $argumen, true)) {
    bantuan();
}
$simpan = in_array('--simpan', $argumen, true);
$izinkanAda = in_array('--izinkan-data-ada', $argumen, true);
$berkas = null;
foreach ($argumen as $a) {
    if (!str_starts_with($a, '--')) {
        $berkas = $a;
        break;
    }
}
if ($berkas === null) {
    bantuan();
}

/* ---------------------------------------------------------------- baca JSON */

if (!is_file($berkas) || !is_readable($berkas)) {
    berhenti("Berkas tidak ditemukan atau tidak bisa dibaca: $berkas");
}
if (filesize($berkas) > 50 * 1048576) {
    berhenti('Berkas terlalu besar (maksimal 50 MB). Data peramban biasanya jauh di bawah 10 MB; apakah ini berkas yang benar?');
}
$mentah = (string) file_get_contents($berkas);
$mentah = preg_replace('/^\xEF\xBB\xBF/', '', $mentah) ?? $mentah;
$data = json_decode($mentah, true, 64);
if (is_string($data)) {                       // hasil copy(JSON.stringify(...)) : JSON di dalam string
    $data = json_decode($data, true, 64);
}
if (is_array($data) && isset($data['kastkjt1_db_v3'])) {   // ekspor seluruh localStorage
    $data = $data['kastkjt1_db_v3'];
    if (is_string($data)) {
        $data = json_decode($data, true, 64);
    }
}
if (!is_array($data) || !array_key_exists('kasMasuk', $data) && !array_key_exists('pengeluaran', $data)) {
    berhenti('Isi berkas bukan data versi lama (tidak ada kasMasuk / pengeluaran). Periksa langkah 1.');
}

/* ------------------------------------------------------------ fungsi bantu */

function bersih_teks(mixed $v, int $maks): string
{
    if (!is_string($v) && !is_int($v) && !is_float($v)) {
        return '';
    }
    $s = trim((string) $v);
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $s) ?? '';
    return mb_substr($s, 0, $maks);
}

function nilai_rupiah(mixed $v, int $min): ?int
{
    if (is_string($v) && preg_match('/^\d{1,12}$/', trim($v)) === 1) {
        $v = (int) trim($v);
    }
    if (is_float($v) && $v >= 0 && $v < 1e12 && floor($v) === $v) {
        $v = (int) $v;
    }
    if (!is_int($v) || $v < $min || $v > BATAS_RUPIAH) {
        return null;
    }
    return $v;
}

function tanggal_lama(mixed $v): ?string
{
    if (!is_string($v)) {
        return null;
    }
    $v = trim($v);
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m) !== 1 || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
        return null;
    }
    return $v;
}

function waktu_ms(mixed $v): int
{
    if ((is_int($v) || is_float($v) || (is_string($v) && ctype_digit($v))) && $v > 946684800000 && $v < 4102444800000) {
        return (int) $v;
    }
    return now_ms();
}

/** Gambar dari data URL (data:image/jpeg;base64,...) -> [mime, ukuran, data] atau null. */
function gambar_data_url(mixed $v): ?array
{
    if (!is_string($v) || !str_starts_with($v, 'data:image/')) {
        return null;
    }
    $p = strpos($v, ';base64,');
    if ($p === false || $p > 40) {
        return null;
    }
    $data = base64_decode(substr($v, $p + 8), true);
    if ($data === false || $data === '' || strlen($data) > (int) cfg('upload_maks_byte', 3 * 1024 * 1024)) {
        return null;
    }
    $info = @getimagesizefromstring($data);
    $tipe = is_array($info) ? (int) $info[2] : 0;
    if (!isset(GAMBAR_DIIZINKAN[$tipe]) || $info[0] > 10000 || $info[1] > 10000) {
        return null;
    }
    return ['mime' => GAMBAR_DIIZINKAN[$tipe], 'ukuran' => strlen($data), 'data' => $data];
}

/* ------------------------------------------------------------ database */

try {
    db();
} catch (ApiError $e) {
    berhenti('Gagal terhubung ke database: ' . $e->getMessage());
}

const TABEL_KAS = ['kas_masuk', 'pengeluaran', 'target_pembelian', 'bukti_transfer'];   // daftar tetap, bukan masukan
$sudahAda = [];
foreach (TABEL_KAS as $t) {
    $n = (int) q("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    if ($n > 0) {
        $sudahAda[] = "$t ($n baris)";
    }
}
if ($sudahAda !== [] && !$izinkanAda) {
    berhenti(
        "Database sudah berisi data kas: " . implode(', ', $sudahAda) . ".\n"
        . "Impor dibatalkan supaya catatan tidak terduplikasi. Gunakan database yang masih kosong,\n"
        . "atau tambahkan --izinkan-data-ada bila kamu yakin."
    );
}

$kanon = [];
foreach (q('SELECT `nama` FROM `siswa`')->fetchAll(PDO::FETCH_COLUMN) as $n) {
    $kanon[mb_strtolower((string) $n)] = (string) $n;
}
$idPerUsername = [];   // hanya akun bendahara yang boleh menjadi "pencatat"
foreach (q("SELECT `id`, `username` FROM `accounts` WHERE `role` = 'bendahara'")->fetchAll() as $a) {
    $idPerUsername[mb_strtolower((string) $a['username'])] = (int) $a['id'];
}
$posSaatIni = [];     // pos => [nominal, id QRIS atau null]
foreach (q('SELECT `pos`, `nominal`, `qris_upload_id` FROM `pengaturan_pos`')->fetchAll() as $r) {
    $posSaatIni[(string) $r['pos']] = ['nominal' => (int) $r['nominal'], 'qris' => $r['qris_upload_id'] === null ? null : (int) $r['qris_upload_id']];
}
$idPerPos = [];
foreach (q(
    "SELECT m.`pos`, a.`id` FROM `bendahara_master` m
       JOIN `accounts` a ON a.`nama` = m.`nama` AND a.`role` = 'bendahara'"
)->fetchAll() as $r) {
    $idPerPos[(string) $r['pos']] = (int) $r['id'];
}

/** Akun pencatat: username lama bila sudah terdaftar kembali, jika tidak bendahara resmi pos itu, jika tidak kosong. */
function id_pencatat(mixed $usernameLama, string $pos): ?int
{
    global $idPerUsername, $idPerPos;
    $u = is_string($usernameLama) ? mb_strtolower(trim($usernameLama)) : '';
    return $idPerUsername[$u] ?? $idPerPos[$pos] ?? null;
}

/* ------------------------------------------------------------ validasi */

$lewati = [];       // alasan => [jumlah, contoh]
$catatLewat = static function (string $jenis, string $alasan, ?int $indeks = null) use (&$lewati): void {
    $k = "$jenis: $alasan";
    $lewati[$k] ??= ['n' => 0, 'contoh' => []];
    $lewati[$k]['n']++;
    if ($indeks !== null && count($lewati[$k]['contoh']) < 3) {
        $lewati[$k]['contoh'][] = '#' . ($indeks + 1);   // nomor urut di berkas (mulai dari 1)
    }
};

$kas = [];
foreach ((array) ($data['kasMasuk'] ?? []) as $i => $x) {
    if (!is_array($x)) {
        $catatLewat('kas masuk', 'bukan objek', (int) $i);
        continue;
    }
    $pos = is_string($x['pos'] ?? null) && in_array($x['pos'], POS_LIST, true) ? $x['pos'] : null;
    $siswa = $kanon[mb_strtolower(bersih_teks($x['siswa'] ?? '', 100))] ?? null;
    $tgl = tanggal_lama($x['tanggal'] ?? null);
    $jml = nilai_rupiah($x['jumlah'] ?? null, 1);
    if ($pos === null) { $catatLewat('kas masuk', 'pos tidak dikenal', (int) $i); continue; }
    if ($siswa === null) { $catatLewat('kas masuk', 'nama siswa tidak ada di daftar kelas', (int) $i); continue; }
    if ($tgl === null) { $catatLewat('kas masuk', 'tanggal tidak sah', (int) $i); continue; }
    if ($jml === null) { $catatLewat('kas masuk', 'jumlah tidak sah', (int) $i); continue; }
    $kas[] = [
        'pos' => $pos, 'siswa' => $siswa, 'tanggal' => $tgl, 'jumlah' => $jml,
        'metode' => ($x['metode'] ?? '') === 'QRIS' ? 'QRIS' : 'Tunai',
        'keterangan' => bersih_teks($x['keterangan'] ?? '', 255),
        'oleh' => id_pencatat($x['oleh'] ?? null, $pos), 'dibuat' => waktu_ms($x['createdAt'] ?? null),
    ];
}

$keluar = [];
foreach ((array) ($data['pengeluaran'] ?? []) as $i => $x) {
    if (!is_array($x)) {
        $catatLewat('pengeluaran', 'bukan objek', (int) $i);
        continue;
    }
    $pos = is_string($x['pos'] ?? null) && in_array($x['pos'], POS_LIST, true) ? $x['pos'] : null;
    $tgl = tanggal_lama($x['tanggal'] ?? null);
    $jml = nilai_rupiah($x['jumlah'] ?? null, 1);
    $kategori = bersih_teks($x['kategori'] ?? '', 50);
    $ket = bersih_teks($x['keterangan'] ?? '', 255);
    if ($pos === null) { $catatLewat('pengeluaran', 'pos tidak dikenal', (int) $i); continue; }
    if ($tgl === null) { $catatLewat('pengeluaran', 'tanggal tidak sah', (int) $i); continue; }
    if ($jml === null) { $catatLewat('pengeluaran', 'jumlah tidak sah', (int) $i); continue; }
    $keluar[] = [
        'pos' => $pos, 'tanggal' => $tgl, 'kategori' => $kategori !== '' ? $kategori : 'Lainnya',
        'keterangan' => $ket !== '' ? $ket : '-', 'jumlah' => $jml,
        'oleh' => id_pencatat($x['oleh'] ?? null, $pos), 'dibuat' => waktu_ms($x['createdAt'] ?? null),
    ];
}

$target = [];
foreach ((array) ($data['target'] ?? []) as $i => $x) {
    if (!is_array($x)) {
        $catatLewat('target', 'bukan objek', (int) $i);
        continue;
    }
    $pos = is_string($x['pos'] ?? null) && in_array($x['pos'], POS_LIST, true) ? $x['pos'] : null;
    $nama = bersih_teks($x['nama'] ?? '', 150);
    $tujuan = nilai_rupiah($x['jumlahTarget'] ?? null, 1);
    $terkumpul = nilai_rupiah($x['terkumpul'] ?? 0, 0);
    if ($pos === null) { $catatLewat('target', 'pos tidak dikenal', (int) $i); continue; }
    if ($nama === '') { $catatLewat('target', 'nama kosong', (int) $i); continue; }
    if ($tujuan === null || $terkumpul === null) { $catatLewat('target', 'jumlah tidak sah', (int) $i); continue; }
    $target[] = [
        'pos' => $pos, 'nama' => $nama, 'tujuan' => $tujuan, 'terkumpul' => $terkumpul,
        'keterangan' => bersih_teks($x['keterangan'] ?? '', 255),
        'oleh' => $idPerPos[$pos] ?? null, 'dibuat' => waktu_ms($x['createdAt'] ?? null),
    ];
}

$bukti = [];
$buktiDilewatStatus = 0;
foreach ((array) ($data['bukti'] ?? []) as $i => $x) {
    if (!is_array($x)) {
        $catatLewat('bukti transfer', 'bukan objek', (int) $i);
        continue;
    }
    if (($x['status'] ?? 'pending') !== 'pending') {   // yang sudah diterima sudah jadi kas masuk; yang ditolak tidak berdampak
        $buktiDilewatStatus++;
        continue;
    }
    $pos = is_string($x['pos'] ?? null) && in_array($x['pos'], POS_LIST, true) ? $x['pos'] : null;
    $siswa = $kanon[mb_strtolower(bersih_teks($x['siswa'] ?? '', 100))] ?? null;
    $tgl = tanggal_lama($x['tanggal'] ?? null);
    $jml = nilai_rupiah($x['jumlah'] ?? null, 1);
    $gbr = gambar_data_url($x['gambar'] ?? null);
    if ($pos === null) { $catatLewat('bukti transfer', 'pos tidak dikenal', (int) $i); continue; }
    if ($siswa === null) { $catatLewat('bukti transfer', 'nama siswa tidak ada di daftar kelas', (int) $i); continue; }
    if ($tgl === null) { $catatLewat('bukti transfer', 'tanggal tidak sah', (int) $i); continue; }
    if ($jml === null) { $catatLewat('bukti transfer', 'jumlah tidak sah', (int) $i); continue; }
    if ($gbr === null) { $catatLewat('bukti transfer', 'gambar rusak / terlalu besar / bukan JPG-PNG-WEBP-GIF', (int) $i); continue; }
    $bukti[] = [
        'pos' => $pos, 'siswa' => $siswa, 'tanggal' => $tgl, 'jumlah' => $jml,
        'catatan' => bersih_teks($x['catatan'] ?? '', 255), 'gambar' => $gbr, 'dibuat' => waktu_ms($x['createdAt'] ?? null),
    ];
}

$set = is_array($data['settings'] ?? null) ? $data['settings'] : [];
$nominalRutin = null;
if (is_array($set['nominal'] ?? null) && is_array($set['nominal']['Rutin'] ?? null)) {
    $nominalRutin = nilai_rupiah($set['nominal']['Rutin']['jumlah'] ?? null, 0);
}
$qris = [];
foreach (POS_LIST as $p) {
    $ada = is_array($set['qris'] ?? null) && !empty($set['qris'][$p]);
    if (!$ada) {
        continue;
    }
    if (($posSaatIni[$p]['qris'] ?? null) !== null) {   // jangan menimpa QRIS yang sudah dipasang di aplikasi baru
        $catatLewat('QRIS', "$p sudah punya gambar QRIS di database, tidak diganti");
        continue;
    }
    $g = gambar_data_url($set['qris'][$p]);
    if ($g === null) {
        $catatLewat('QRIS', "gambar $p rusak / terlalu besar / bukan JPG-PNG-WEBP-GIF");
        continue;
    }
    $qris[$p] = $g;
}

/* ------------------------------------------------------------ laporan rencana */

function rupiah_cli(int $n): string
{
    return 'Rp ' . number_format($n, 0, ',', '.');
}

$totalKas = array_sum(array_column($kas, 'jumlah'));
$totalKeluar = array_sum(array_column($keluar, 'jumlah'));
echo ($simpan ? "== IMPOR SUNGGUHAN ==" : "== UJI COBA (tidak ada yang ditulis) ==") . "\n";
echo "Berkas              : $berkas\n";
echo "Kas masuk           : " . count($kas) . " catatan, total " . rupiah_cli($totalKas) . "\n";
echo "Pengeluaran         : " . count($keluar) . " catatan, total " . rupiah_cli($totalKeluar) . "\n";
echo "Target pembelian    : " . count($target) . " catatan\n";
echo "Bukti menunggu      : " . count($bukti) . " (bukti lain: {$buktiDilewatStatus} sudah diproses, tidak dipindahkan)\n";
echo "Nominal Kas Rutin   : " . ($nominalRutin === null
    ? 'tidak diubah'
    : rupiah_cli($nominalRutin) . ' (sekarang di database: ' . rupiah_cli((int) ($posSaatIni['Rutin']['nominal'] ?? 0)) . ')') . "\n";
echo "Gambar QRIS         : " . (count($qris) === 0 ? 'tidak ada' : implode(', ', array_keys($qris))) . "\n";
echo "Saldo per pos dana (kas masuk - pengeluaran; bandingkan dengan Dashboard aplikasi lama):\n";
foreach (POS_LIST as $p) {
    $masukPos = array_sum(array_column(array_filter($kas, static fn($r) => $r['pos'] === $p), 'jumlah'));
    $keluarPos = array_sum(array_column(array_filter($keluar, static fn($r) => $r['pos'] === $p), 'jumlah'));
    echo '  ' . str_pad(POS_LABEL[$p], 11) . ': masuk ' . rupiah_cli($masukPos) . ', keluar ' . rupiah_cli($keluarPos)
        . ', saldo ' . rupiah_cli($masukPos - $keluarPos) . "\n";
}
$akunLama = is_array($data['accounts'] ?? null) ? count($data['accounts']) : 0;
echo "Akun lama           : $akunLama (TIDAK dipindahkan; daftar ulang lewat halaman Daftar)\n";
$tanpaPencatat = count(array_filter($kas, static fn($r) => $r['oleh'] === null)) + count(array_filter($keluar, static fn($r) => $r['oleh'] === null));
if ($tanpaPencatat > 0) {
    echo "Peringatan          : $tanpaPencatat catatan belum punya pencatat karena akun bendahara belum terdaftar.\n";
    echo "                      (Daftarkan akun bendahara dulu lalu jalankan impor pada database kosong.)\n";
}
if ($lewati !== []) {
    echo "\nDilewati (tidak sah):\n";
    foreach ($lewati as $alasan => $v) {
        echo "  - {$alasan}: {$v['n']}" . ($v['contoh'] === [] ? '' : ' (nomor urut contoh ' . implode(', ', $v['contoh']) . ')') . "\n";
    }
}

if (!$simpan) {
    echo "\nUji coba selesai. Tambahkan --simpan untuk menulis ke database (cadangkan dulu dengan mysqldump).\n";
    exit(0);
}
if ($kas === [] && $keluar === [] && $target === [] && $bukti === [] && $nominalRutin === null && $qris === []) {
    berhenti("\nTidak ada data yang bisa diimpor.");
}

/* ------------------------------------------------------------ tulis (satu transaksi) */

try {
    transaksi(static function () use ($kas, $keluar, $target, $bukti, $nominalRutin, $qris): void {
        usort($kas, static fn($a, $b) => $a['dibuat'] <=> $b['dibuat']);
        usort($keluar, static fn($a, $b) => $a['dibuat'] <=> $b['dibuat']);
        usort($target, static fn($a, $b) => $a['dibuat'] <=> $b['dibuat']);
        usort($bukti, static fn($a, $b) => $a['dibuat'] <=> $b['dibuat']);

        $st = db()->prepare(
            'INSERT INTO `kas_masuk` (`pos`, `siswa`, `tanggal`, `jumlah`, `metode`, `keterangan`, `oleh_id`, `created_at`)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($kas as $r) {
            $st->execute([$r['pos'], $r['siswa'], $r['tanggal'], $r['jumlah'], $r['metode'], $r['keterangan'], $r['oleh'], $r['dibuat']]);
        }
        $st = db()->prepare(
            'INSERT INTO `pengeluaran` (`pos`, `tanggal`, `kategori`, `keterangan`, `jumlah`, `oleh_id`, `created_at`)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($keluar as $r) {
            $st->execute([$r['pos'], $r['tanggal'], $r['kategori'], $r['keterangan'], $r['jumlah'], $r['oleh'], $r['dibuat']]);
        }
        $st = db()->prepare(
            'INSERT INTO `target_pembelian` (`pos`, `nama`, `jumlah_target`, `terkumpul`, `keterangan`, `oleh_id`, `created_at`)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($target as $r) {
            $st->execute([$r['pos'], $r['nama'], $r['tujuan'], $r['terkumpul'], $r['keterangan'], $r['oleh'], $r['dibuat']]);
        }
        $st = db()->prepare(
            'INSERT INTO `bukti_transfer` (`pos`, `siswa`, `tanggal`, `jumlah`, `catatan`, `upload_id`, `status`, `created_at`)
             VALUES (?, ?, ?, ?, ?, ?, \'pending\', ?)'
        );
        foreach ($bukti as $r) {
            $idUnggah = simpan_upload('bukti', $r['gambar']);
            $st->execute([$r['pos'], $r['siswa'], $r['tanggal'], $r['jumlah'], $r['catatan'], $idUnggah, $r['dibuat']]);
        }
        if ($nominalRutin !== null) {
            q('UPDATE `pengaturan_pos` SET `nominal` = ? WHERE `pos` = ?', [$nominalRutin, 'Rutin']);
        }
        foreach ($qris as $pos => $g) {
            $idUnggah = simpan_upload('qris', $g);
            q('UPDATE `pengaturan_pos` SET `qris_upload_id` = ? WHERE `pos` = ?', [$idUnggah, $pos]);
        }
    });
} catch (Throwable $e) {
    error_log('[kas] impor gagal: ' . $e->getMessage());
    berhenti("\nIMPOR GAGAL dan dibatalkan; tidak ada data yang tersimpan.\nPenyebab: " . $e->getMessage());
}

echo "\nSELESAI. Data tersimpan. Hasil di database sekarang:\n";
foreach (TABEL_KAS as $t) {
    echo '  ' . str_pad($t, 18) . (int) q("SELECT COUNT(*) FROM `$t`")->fetchColumn() . " baris\n";
}
echo "Buka aplikasi, masuk sebagai bendahara, dan periksa Dashboard serta Laporan.\n";
