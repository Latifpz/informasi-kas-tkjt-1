<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   KEUANGAN: kas masuk, pengeluaran, target, nominal
   Setiap bendahara hanya boleh mengubah data POS-nya sendiri. Pos selalu
   diambil dari data induk bendahara di server, bukan dari kiriman klien.
===================================================================== */

const BATAS_RUPIAH = 999999999;

/** Bendahara yang punya pos dana (bendahara tanpa pos tidak bisa mengubah data). */
function bendahara_pos(): array
{
    $u = wajib_bendahara();
    if ($u['pos'] === null) {
        throw new ApiError('Akun bendahara ini belum terhubung ke pos dana.', 403, 'akses');
    }
    return $u;
}

/* ---------------------------------------------------------------------
   Kas masuk
--------------------------------------------------------------------- */

function aksi_kas_simpan(): void
{
    $u = bendahara_pos();
    $in = badan();

    $siswa = nama_siswa_kanonik(teks($in, 'siswa', 100, 'Nama siswa'));
    $tgl = tanggal($in, 'tanggal');
    $jumlah = angka($in, 'jumlah', 1, BATAS_RUPIAH, 'Jumlah');
    $metodeKirim = teks($in, 'metode', 10);
    if ($metodeKirim !== '' && !in_array($metodeKirim, ['Tunai', 'QRIS'], true)) {
        throw new ApiError('Metode pembayaran harus Tunai atau QRIS.', 422, 'validasi');
    }
    $metode = $metodeKirim === 'QRIS' ? 'QRIS' : 'Tunai';
    $ket = teks($in, 'keterangan', 255, 'Keterangan');
    $idKirim = teks($in, 'id', 20);

    if ($idKirim !== '') {
        $id = id_param($in);
        $n = q(
            'UPDATE `kas_masuk` SET `siswa` = ?, `tanggal` = ?, `jumlah` = ?, `metode` = ?, `keterangan` = ?
              WHERE `id` = ? AND `pos` = ?',
            [$siswa, $tgl, $jumlah, $metode, $ket, $id, $u['pos']]
        )->rowCount();
        if ($n === 0) {
            throw new ApiError('Catatan kas tidak ditemukan.', 404, 'tidak_ada');
        }
    } else {
        q(
            'INSERT INTO `kas_masuk` (`pos`, `siswa`, `tanggal`, `jumlah`, `metode`, `keterangan`, `oleh_id`, `created_at`)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [$u['pos'], $siswa, $tgl, $jumlah, $metode, $ket, (int) $u['id'], now_ms()]
        );
        $id = (int) db()->lastInsertId();
    }
    kirim_json(['ok' => true, 'kas' => ambil_kas($id)]);
}

function aksi_kas_hapus(): void
{
    $u = bendahara_pos();
    $id = id_param(badan());
    $n = q('DELETE FROM `kas_masuk` WHERE `id` = ? AND `pos` = ?', [$id, $u['pos']])->rowCount();
    if ($n === 0) {
        throw new ApiError('Catatan kas tidak ditemukan.', 404, 'tidak_ada');
    }
    kirim_json(['ok' => true]);
}

/* ---------------------------------------------------------------------
   Pengeluaran
--------------------------------------------------------------------- */

function aksi_keluar_simpan(): void
{
    $u = bendahara_pos();
    $in = badan();

    $tgl = tanggal($in, 'tanggal');
    $kategori = teks($in, 'kategori', 50, 'Kategori');
    $ket = teks($in, 'keterangan', 255, 'Keterangan');
    $jumlah = angka($in, 'jumlah', 1, BATAS_RUPIAH, 'Jumlah');
    if ($kategori === '' || $ket === '') {
        throw new ApiError('Lengkapi data pengeluaran.', 422, 'validasi');
    }
    $idKirim = teks($in, 'id', 20);

    if ($idKirim !== '') {
        $id = id_param($in);
        $n = q(
            'UPDATE `pengeluaran` SET `tanggal` = ?, `kategori` = ?, `keterangan` = ?, `jumlah` = ?
              WHERE `id` = ? AND `pos` = ?',
            [$tgl, $kategori, $ket, $jumlah, $id, $u['pos']]
        )->rowCount();
        if ($n === 0) {
            throw new ApiError('Data pengeluaran tidak ditemukan.', 404, 'tidak_ada');
        }
    } else {
        q(
            'INSERT INTO `pengeluaran` (`pos`, `tanggal`, `kategori`, `keterangan`, `jumlah`, `oleh_id`, `created_at`)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$u['pos'], $tgl, $kategori, $ket, $jumlah, (int) $u['id'], now_ms()]
        );
        $id = (int) db()->lastInsertId();
    }
    kirim_json(['ok' => true, 'pengeluaran' => ambil_keluar($id)]);
}

function aksi_keluar_hapus(): void
{
    $u = bendahara_pos();
    $id = id_param(badan());
    $n = q('DELETE FROM `pengeluaran` WHERE `id` = ? AND `pos` = ?', [$id, $u['pos']])->rowCount();
    if ($n === 0) {
        throw new ApiError('Data pengeluaran tidak ditemukan.', 404, 'tidak_ada');
    }
    kirim_json(['ok' => true]);
}

/* ---------------------------------------------------------------------
   Target pembelian
--------------------------------------------------------------------- */

function aksi_target_simpan(): void
{
    $u = bendahara_pos();
    $in = badan();

    $nama = teks($in, 'nama', 150, 'Nama target');
    $jumlahTarget = angka($in, 'jumlahTarget', 1, BATAS_RUPIAH, 'Target dana');
    $terkumpul = angka($in + ['terkumpul' => 0], 'terkumpul', 0, BATAS_RUPIAH, 'Terkumpul');
    $ket = teks($in, 'keterangan', 255, 'Keterangan');
    if ($nama === '') {
        throw new ApiError('Nama target wajib diisi.', 422, 'validasi');
    }
    $idKirim = teks($in, 'id', 20);

    if ($idKirim !== '') {
        $id = id_param($in);
        $n = q(
            'UPDATE `target_pembelian` SET `nama` = ?, `jumlah_target` = ?, `terkumpul` = ?, `keterangan` = ?
              WHERE `id` = ? AND `pos` = ?',
            [$nama, $jumlahTarget, $terkumpul, $ket, $id, $u['pos']]
        )->rowCount();
        if ($n === 0) {
            throw new ApiError('Target tidak ditemukan.', 404, 'tidak_ada');
        }
    } else {
        q(
            'INSERT INTO `target_pembelian` (`pos`, `nama`, `jumlah_target`, `terkumpul`, `keterangan`, `oleh_id`, `created_at`)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$u['pos'], $nama, $jumlahTarget, $terkumpul, $ket, (int) $u['id'], now_ms()]
        );
        $id = (int) db()->lastInsertId();
    }
    kirim_json(['ok' => true, 'target' => ambil_target($id)]);
}

function aksi_target_hapus(): void
{
    $u = bendahara_pos();
    $id = id_param(badan());
    $n = q('DELETE FROM `target_pembelian` WHERE `id` = ? AND `pos` = ?', [$id, $u['pos']])->rowCount();
    if ($n === 0) {
        throw new ApiError('Target tidak ditemukan.', 404, 'tidak_ada');
    }
    kirim_json(['ok' => true]);
}

/* ---------------------------------------------------------------------
   Nominal (hanya Kas Rutin yang bisa diubah; Acara manual, Kurban tetap)
--------------------------------------------------------------------- */

function aksi_nominal_simpan(): void
{
    $u = bendahara_pos();
    if ($u['pos'] !== 'Rutin') {
        throw new ApiError('Nominal pos ini tidak dapat diubah.', 403, 'akses');
    }
    $nominal = angka(badan(), 'nominal', 0, BATAS_RUPIAH, 'Nominal');
    q('UPDATE `pengaturan_pos` SET `nominal` = ? WHERE `pos` = ?', [$nominal, 'Rutin']);
    $s = ambil_settings();
    kirim_json(['ok' => true, 'nominal' => $s['nominal']['Rutin']]);
}
