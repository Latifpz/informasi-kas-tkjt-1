<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   DATA: pengambilan baris dan bentuk JSON yang dikirim ke frontend.
   Bentuknya sama dengan objek DB lama di script.js (camelCase), dan
   semua id dikirim sebagai string supaya cocok dengan data-id di HTML.
===================================================================== */

const SQL_KAS = 'SELECT t.`id`, t.`pos`, t.`siswa`, t.`tanggal`, t.`jumlah`, t.`metode`, t.`keterangan`,
        o.`username` AS `oleh`, o.`nama` AS `oleh_nama`, t.`created_at`
    FROM `kas_masuk` t LEFT JOIN `accounts` o ON o.`id` = t.`oleh_id`';

const SQL_KELUAR = 'SELECT t.`id`, t.`pos`, t.`tanggal`, t.`kategori`, t.`keterangan`, t.`jumlah`,
        o.`username` AS `oleh`, o.`nama` AS `oleh_nama`, t.`created_at`
    FROM `pengeluaran` t LEFT JOIN `accounts` o ON o.`id` = t.`oleh_id`';

const SQL_TARGET = 'SELECT t.`id`, t.`pos`, t.`nama`, t.`jumlah_target`, t.`terkumpul`, t.`keterangan`, t.`created_at`
    FROM `target_pembelian` t';

const SQL_BUKTI = 'SELECT b.`id`, b.`pos`, b.`siswa`, b.`tanggal`, b.`jumlah`, b.`catatan`, b.`upload_id`,
        b.`status`, b.`created_at`
    FROM `bukti_transfer` b';

const SQL_NOTIF = 'SELECT n.`id`, n.`tipe`, n.`untuk`, n.`pos`, n.`frek`, n.`periode`, n.`periode_nama`, n.`jumlah`,
        n.`judul`, n.`pesan`, n.`dari`, n.`jabatan`, n.`dibaca`, n.`jumlah_kirim`, n.`created_at`
    FROM `notifikasi` n';

function s_kas(array $r): array
{
    return [
        'id'         => (string) $r['id'],
        'pos'        => (string) $r['pos'],
        'siswa'      => (string) $r['siswa'],
        'tanggal'    => (string) $r['tanggal'],
        'jumlah'     => (int) $r['jumlah'],
        'metode'     => (string) $r['metode'],
        'keterangan' => (string) $r['keterangan'],
        'oleh'       => $r['oleh'] !== null ? (string) $r['oleh'] : null,
        'olehNama'   => $r['oleh_nama'] !== null ? (string) $r['oleh_nama'] : null,
        'createdAt'  => (int) $r['created_at'],
    ];
}

function s_keluar(array $r): array
{
    return [
        'id'         => (string) $r['id'],
        'pos'        => (string) $r['pos'],
        'tanggal'    => (string) $r['tanggal'],
        'kategori'   => (string) $r['kategori'],
        'keterangan' => (string) $r['keterangan'],
        'jumlah'     => (int) $r['jumlah'],
        'oleh'       => $r['oleh'] !== null ? (string) $r['oleh'] : null,
        'olehNama'   => $r['oleh_nama'] !== null ? (string) $r['oleh_nama'] : null,
        'createdAt'  => (int) $r['created_at'],
    ];
}

function s_target(array $r): array
{
    return [
        'id'           => (string) $r['id'],
        'pos'          => (string) $r['pos'],
        'nama'         => (string) $r['nama'],
        'jumlahTarget' => (int) $r['jumlah_target'],
        'terkumpul'    => (int) $r['terkumpul'],
        'keterangan'   => (string) $r['keterangan'],
        'createdAt'    => (int) $r['created_at'],
    ];
}

function s_bukti(array $r): array
{
    return [
        'id'        => (string) $r['id'],
        'pos'       => (string) $r['pos'],
        'siswa'     => (string) $r['siswa'],
        'tanggal'   => (string) $r['tanggal'],
        'jumlah'    => (int) $r['jumlah'],
        'catatan'   => (string) $r['catatan'],
        'gambar'    => url_upload($r['upload_id']),
        'status'    => (string) $r['status'],
        'createdAt' => (int) $r['created_at'],
    ];
}

function s_notif(array $r): array
{
    return [
        'id'          => (string) $r['id'],
        'tipe'        => (string) $r['tipe'],
        'untuk'       => (string) $r['untuk'],
        'pos'         => (string) $r['pos'],
        'frek'        => (string) $r['frek'],
        'periode'     => (string) $r['periode'],
        'periodeNama' => (string) $r['periode_nama'],
        'jumlah'      => (int) $r['jumlah'],
        'judul'       => (string) $r['judul'],
        'pesan'       => (string) $r['pesan'],
        'dari'        => (string) $r['dari'],
        'jabatan'     => (string) $r['jabatan'],
        'dibaca'      => (int) $r['dibaca'] === 1,
        'jumlahKirim' => (int) $r['jumlah_kirim'],
        'createdAt'   => (int) $r['created_at'],
    ];
}

/* ---------------------------------------------------------------------
   Pengambilan satu baris (dipakai setelah simpan, agar respons memuat
   data persis seperti yang tersimpan di database)
--------------------------------------------------------------------- */

function ambil_kas(int $id): ?array
{
    $r = q(SQL_KAS . ' WHERE t.`id` = ?', [$id])->fetch();
    return $r ? s_kas($r) : null;
}

function ambil_keluar(int $id): ?array
{
    $r = q(SQL_KELUAR . ' WHERE t.`id` = ?', [$id])->fetch();
    return $r ? s_keluar($r) : null;
}

function ambil_target(int $id): ?array
{
    $r = q(SQL_TARGET . ' WHERE t.`id` = ?', [$id])->fetch();
    return $r ? s_target($r) : null;
}

function ambil_notif(int $id): ?array
{
    $r = q(SQL_NOTIF . ' WHERE n.`id` = ?', [$id])->fetch();
    return $r ? s_notif($r) : null;
}

/* ---------------------------------------------------------------------
   Data induk dan pengaturan
--------------------------------------------------------------------- */

/** Nama siswa persis seperti di data induk, atau galat bila tidak ada. */
function nama_siswa_kanonik(string $nama): string
{
    $r = q('SELECT `nama` FROM `siswa` WHERE `nama` = ?', [$nama])->fetchColumn();
    if ($r === false) {
        throw new ApiError('Siswa tidak ditemukan di data kelas.', 422, 'validasi');
    }
    return (string) $r;
}

/** Id (angka) dari masukan klien; 404 bila bentuknya bukan angka. */
function id_param(array $in, string $kunci = 'id'): int
{
    $v = $in[$kunci] ?? '';
    if (is_int($v)) {
        $v = (string) $v;
    }
    if (!is_string($v) || preg_match('/^\d{1,18}$/', $v) !== 1) {
        throw new ApiError('Data tidak ditemukan.', 404, 'tidak_ada');
    }
    return (int) $v;
}

function ambil_settings(): array
{
    $nominal = [];
    $qris = [];
    foreach (POS_LIST as $p) {
        $nominal[$p] = ['jumlah' => 0, 'frekuensi' => 'Sesuai kebutuhan'];
        $qris[$p] = null;
    }
    foreach (q('SELECT `pos`, `nominal`, `frekuensi`, `qris_upload_id` FROM `pengaturan_pos`')->fetchAll() as $r) {
        $nominal[$r['pos']] = ['jumlah' => (int) $r['nominal'], 'frekuensi' => (string) $r['frekuensi']];
        $qris[$r['pos']] = $r['qris_upload_id'] !== null ? url_upload($r['qris_upload_id']) : null;
    }
    return ['nominal' => $nominal, 'qris' => $qris];
}

/** Data induk yang boleh dilihat siapa pun (daftar nama untuk halaman daftar). */
function ambil_meta(): array
{
    $siswa = array_map('strval', array_column(q('SELECT `nama` FROM `siswa` ORDER BY `no_absen`')->fetchAll(), 'nama'));

    $bendahara = [];
    foreach (q('SELECT `nama`, `jabatan`, `pos` FROM `bendahara_master` ORDER BY `id`')->fetchAll() as $b) {
        $bendahara[] = ['nama' => (string) $b['nama'], 'jabatan' => (string) $b['jabatan'], 'pos' => (string) $b['pos']];
    }

    return [
        'siswa'         => $siswa,
        'bendahara'     => $bendahara,
        'tersedia'      => nama_tersedia(),
        'kodeBendahara' => (string) cfg('kode_bendahara', '') !== '',
        'timezone'      => (string) cfg('timezone', 'Asia/Jakarta'),
        'serverNow'     => now_ms(),                       // jam server (ms), untuk menyamakan jam peramban
        'hariIni'       => (new DateTimeImmutable('now'))->format('Y-m-d'), // pada zona waktu aplikasi
    ];
}

/** Nama yang belum punya akun, per peran. */
function nama_tersedia(): array
{
    $siswa = q(
        'SELECT s.`nama` FROM `siswa` s
          WHERE NOT EXISTS (SELECT 1 FROM `accounts` a WHERE a.`role` = \'siswa\' AND a.`nama` = s.`nama`)
          ORDER BY s.`no_absen`'
    )->fetchAll(PDO::FETCH_COLUMN);

    $bendahara = q(
        'SELECT b.`nama` FROM `bendahara_master` b
          WHERE NOT EXISTS (SELECT 1 FROM `accounts` a WHERE a.`role` = \'bendahara\' AND a.`nama` = b.`nama`)
          ORDER BY b.`id`'
    )->fetchAll(PDO::FETCH_COLUMN);

    return [
        'siswa'     => array_map('strval', $siswa),
        'bendahara' => array_map('strval', $bendahara),
    ];
}

/* ---------------------------------------------------------------------
   Seluruh data yang boleh dilihat akun ini
--------------------------------------------------------------------- */

function bangun_state(array $u): array
{
    $pos = $u['pos'];
    $bendahara = $u['role'] === 'bendahara';

    $kas = array_map('s_kas', q(SQL_KAS . ' ORDER BY t.`tanggal` DESC, t.`id` DESC')->fetchAll());
    $keluar = array_map('s_keluar', q(SQL_KELUAR . ' ORDER BY t.`tanggal` DESC, t.`id` DESC')->fetchAll());
    $target = array_map('s_target', q(SQL_TARGET . ' ORDER BY t.`created_at` DESC, t.`id` DESC')->fetchAll());

    // Username pencatat adalah separuh kredensial akun bendahara: siswa cukup menerima
    // nama tampilannya (olehNama), tidak pernah username-nya.
    if (!$bendahara) {
        $tanpaUsername = static fn(array $r): array => ['oleh' => null] + $r;
        $kas = array_map($tanpaUsername, $kas);
        $keluar = array_map($tanpaUsername, $keluar);
    }

    // Bukti menunggu verifikasi: hanya untuk bendahara pemilik pos itu.
    $bukti = [];
    if ($bendahara && $pos !== null) {
        $bukti = array_map('s_bukti', q(
            SQL_BUKTI . ' WHERE b.`pos` = ? AND b.`status` = \'pending\' ORDER BY b.`id` DESC',
            [$pos]
        )->fetchAll());
    }

    // Notifikasi: milik sendiri; bendahara pos pengingat juga melihat
    // pengingat yang sudah ia kirim (untuk tombol "Ingatkan lagi").
    if ($bendahara && $pos !== null) {
        $notif = q(SQL_NOTIF . ' WHERE n.`untuk` = ? OR n.`pos` = ? ORDER BY n.`created_at` DESC', [$u['nama'], $pos])->fetchAll();
    } else {
        $notif = q(SQL_NOTIF . ' WHERE n.`untuk` = ? ORDER BY n.`created_at` DESC', [$u['nama']])->fetchAll();
    }

    // Daftar akun: bendahara melihat semuanya (halaman Kelola Akun),
    // siswa hanya akunnya sendiri. Hash password tidak pernah dikirim.
    if ($bendahara) {
        $akun = q(
            'SELECT a.`id`, a.`nama`, a.`role`, a.`username`, a.`created_at`, bm.`jabatan`
               FROM `accounts` a
               LEFT JOIN `bendahara_master` bm ON a.`role` = \'bendahara\' AND bm.`nama` = a.`nama`
              ORDER BY a.`role`, a.`nama`'
        )->fetchAll();
    } else {
        $akun = q(
            'SELECT a.`id`, a.`nama`, a.`role`, a.`username`, a.`created_at`, NULL AS `jabatan`
               FROM `accounts` a WHERE a.`id` = ?',
            [(int) $u['id']]
        )->fetchAll();
    }
    $akun = array_map(static fn(array $a): array => [
        'id'        => (string) $a['id'],
        'nama'      => (string) $a['nama'],
        'role'      => (string) $a['role'],
        'jabatan'   => $a['jabatan'] !== null ? (string) $a['jabatan'] : null,
        'username'  => (string) $a['username'],
        'createdAt' => (int) $a['created_at'],
    ], $akun);

    return [
        'accounts'    => $akun,
        'kasMasuk'    => $kas,
        'pengeluaran' => $keluar,
        'target'      => $target,
        'bukti'       => $bukti,
        'notifikasi'  => array_map('s_notif', $notif),
        'settings'    => ambil_settings(),
    ];
}

/** Sidik jari data, agar polling bisa menjawab "tidak berubah" tanpa kirim ulang. */
function rev_state(array $state): string
{
    return substr(md5((string) json_encode($state, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE)), 0, 16);
}
