<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   QRIS, BUKTI TRANSFER, dan penyaji berkas gambar
===================================================================== */

const BUKTI_PENDING_MAKS = 10; // per siswa per pos, mencegah unggahan berlebihan

/* ---------------------------------------------------------------------
   QRIS (milik bendahara pos itu)
--------------------------------------------------------------------- */

function aksi_qris_simpan(): void
{
    $u = bendahara_pos();
    $g = baca_gambar('file');

    $idBaru = transaksi(static function () use ($u, $g): int {
        $lama = q('SELECT `qris_upload_id` FROM `pengaturan_pos` WHERE `pos` = ? FOR UPDATE', [$u['pos']])->fetchColumn();
        $id = simpan_upload('qris', $g);
        q('UPDATE `pengaturan_pos` SET `qris_upload_id` = ? WHERE `pos` = ?', [$id, $u['pos']]);
        if ($lama !== false && $lama !== null) {
            q('DELETE FROM `uploads` WHERE `id` = ?', [(int) $lama]);
        }
        return $id;
    });
    kirim_json(['ok' => true, 'url' => url_upload($idBaru)]);
}

function aksi_qris_hapus(): void
{
    $u = bendahara_pos();
    transaksi(static function () use ($u): void {
        $lama = q('SELECT `qris_upload_id` FROM `pengaturan_pos` WHERE `pos` = ? FOR UPDATE', [$u['pos']])->fetchColumn();
        q('UPDATE `pengaturan_pos` SET `qris_upload_id` = NULL WHERE `pos` = ?', [$u['pos']]);
        if ($lama !== false && $lama !== null) {
            q('DELETE FROM `uploads` WHERE `id` = ?', [(int) $lama]);
        }
    });
    kirim_json(['ok' => true]);
}

/* ---------------------------------------------------------------------
   Bukti transfer: siswa mengirim, bendahara pos memeriksa
--------------------------------------------------------------------- */

function aksi_bukti_kirim(): void
{
    $u = wajib_login();
    if ($u['role'] !== 'siswa') {
        throw new ApiError('Hanya siswa yang dapat mengirim bukti transfer.', 403, 'akses');
    }
    $in = badan(); // multipart: tanggal, jumlah, catatan, pos + berkas "file"

    $pos = pos_valid(teks($in, 'pos', 10));
    $tgl = tanggal($in, 'tanggal');
    $jumlah = angka($in, 'jumlah', 1, BATAS_RUPIAH, 'Jumlah');
    $catatan = teks($in, 'catatan', 255, 'Catatan');
    $siswa = nama_siswa_kanonik($u['nama']);

    $menunggu = (int) q(
        'SELECT COUNT(*) FROM `bukti_transfer` WHERE `siswa` = ? AND `pos` = ? AND `status` = \'pending\'',
        [$siswa, $pos]
    )->fetchColumn();
    if ($menunggu >= BUKTI_PENDING_MAKS) {
        throw new ApiError('Masih ada banyak bukti yang menunggu diperiksa. Tunggu bendahara memprosesnya.', 429, 'batas');
    }

    $g = baca_gambar('file');

    transaksi(static function () use ($pos, $siswa, $tgl, $jumlah, $catatan, $g): void {
        $uploadId = simpan_upload('bukti', $g);
        q(
            'INSERT INTO `bukti_transfer` (`pos`, `siswa`, `tanggal`, `jumlah`, `catatan`, `upload_id`, `status`, `created_at`)
             VALUES (?, ?, ?, ?, ?, ?, \'pending\', ?)',
            [$pos, $siswa, $tgl, $jumlah, $catatan, $uploadId, now_ms()]
        );
    });
    kirim_json(['ok' => true]);
}

/** Terima bukti: kas masuk dicatat otomatis dan bukti ditandai diterima (satu transaksi). */
function aksi_bukti_terima(): void
{
    $u = bendahara_pos();
    $id = id_param(badan());

    $kasId = transaksi(static function () use ($u, $id): int {
        $b = q(
            'SELECT `id`, `pos`, `siswa`, `tanggal`, `jumlah`, `catatan`, `status`
               FROM `bukti_transfer` WHERE `id` = ? FOR UPDATE',
            [$id]
        )->fetch();
        if (!$b || $b['pos'] !== $u['pos']) {
            throw new ApiError('Bukti tidak ditemukan.', 404, 'tidak_ada');
        }
        if ($b['status'] !== 'pending') {
            throw new ApiError('Bukti ini sudah diproses.', 409, 'sudah');
        }
        q(
            'INSERT INTO `kas_masuk` (`pos`, `siswa`, `tanggal`, `jumlah`, `metode`, `keterangan`, `oleh_id`, `created_at`)
             VALUES (?, ?, ?, ?, \'QRIS\', ?, ?, ?)',
            [
                $b['pos'], $b['siswa'], $b['tanggal'], (int) $b['jumlah'],
                $b['catatan'] !== '' ? $b['catatan'] : 'Verifikasi transfer',
                (int) $u['id'], now_ms(),
            ]
        );
        $kasId = (int) db()->lastInsertId();
        q(
            'UPDATE `bukti_transfer` SET `status` = \'diterima\', `diperiksa_oleh` = ?, `diperiksa_at` = ? WHERE `id` = ?',
            [(int) $u['id'], now_ms(), $id]
        );
        return $kasId;
    });
    kirim_json(['ok' => true, 'id' => (string) $id, 'status' => 'diterima', 'kas' => ambil_kas($kasId)]);
}

function aksi_bukti_tolak(): void
{
    $u = bendahara_pos();
    $id = id_param(badan());

    transaksi(static function () use ($u, $id): void {
        $b = q('SELECT `pos`, `status` FROM `bukti_transfer` WHERE `id` = ? FOR UPDATE', [$id])->fetch();
        if (!$b || $b['pos'] !== $u['pos']) {
            throw new ApiError('Bukti tidak ditemukan.', 404, 'tidak_ada');
        }
        if ($b['status'] !== 'pending') {
            throw new ApiError('Bukti ini sudah diproses.', 409, 'sudah');
        }
        q(
            'UPDATE `bukti_transfer` SET `status` = \'ditolak\', `diperiksa_oleh` = ?, `diperiksa_at` = ? WHERE `id` = ?',
            [(int) $u['id'], now_ms(), $id]
        );
    });
    kirim_json(['ok' => true, 'id' => (string) $id, 'status' => 'ditolak']);
}

/* ---------------------------------------------------------------------
   Penyaji gambar. QRIS boleh dilihat semua akun yang sudah masuk; bukti
   transfer hanya oleh pengirimnya dan bendahara pos tersebut.
--------------------------------------------------------------------- */

function aksi_file(): void
{
    $u = wajib_login();
    $id = id_param($_GET);

    $r = q('SELECT `jenis`, `mime`, `ukuran`, `data` FROM `uploads` WHERE `id` = ?', [$id])->fetch();
    if (!$r) {
        throw new ApiError('Gambar tidak ditemukan.', 404, 'tidak_ada');
    }

    if ($r['jenis'] === 'bukti') {
        $b = q('SELECT `pos`, `siswa` FROM `bukti_transfer` WHERE `upload_id` = ?', [$id])->fetch();
        $boleh = $b && (
            ($u['role'] === 'bendahara' && $u['pos'] === $b['pos'])
            || ($u['role'] === 'siswa' && mb_strtolower($u['nama']) === mb_strtolower((string) $b['siswa']))
        );
        if (!$boleh) {
            throw new ApiError('Kamu tidak berhak melihat gambar ini.', 403, 'akses');
        }
    }

    $ekstensi = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'][$r['mime']] ?? 'bin';

    header('Content-Type: ' . $r['mime']);
    header('Content-Length: ' . strlen((string) $r['data']));
    header('Content-Disposition: inline; filename="gambar-' . $id . '.' . $ekstensi . '"');
    header('X-Content-Type-Options: nosniff');
    header("Content-Security-Policy: default-src 'none'; sandbox");
    header('Cache-Control: private, max-age=86400');
    echo $r['data'];
    exit;
}
