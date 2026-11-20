<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   PENGINGAT & NOTIFIKASI
   Bendahara Utama (Kas Rutin) dan Bendahara Kurban (Dana Kurban) dapat
   mengirim pengingat "belum bayar" ke siswa. Satu pengingat per siswa
   per pos per periode: mengirim lagi memperbarui yang sudah ada.
===================================================================== */

/** Bendahara pos pengingat + periode berjalannya. */
function konteks_pengingat(): array
{
    $u = bendahara_pos();
    if (!in_array($u['pos'], POS_PENGINGAT, true)) {
        throw new ApiError('Pengingat hanya tersedia untuk Kas Rutin dan Dana Kurban.', 403, 'akses');
    }
    $per = periode_aktif($u['pos']);
    if ($per === null) {
        throw new ApiError('Pos ini tidak punya jadwal pembayaran tetap.', 422, 'validasi');
    }
    return [$u, $per];
}

/** Simpan (atau perbarui) pengingat untuk satu siswa; kembalikan baris tersimpan. */
function simpan_pengingat(array $u, string $nama, array $per): array
{
    $pos = (string) $u['pos'];
    $jumlah = (int) q('SELECT `nominal` FROM `pengaturan_pos` WHERE `pos` = ?', [$pos])->fetchColumn();
    $pesan = 'Kamu belum membayar ' . POS_LABEL[$pos] . ' ' . $per['frasa']
        . ($jumlah > 0 ? ' sebesar ' . rupiah_teks($jumlah) : '')
        . '. Yuk segera bayar ke ' . $u['jabatan'] . '.';
    $sekarang = now_ms();

    $perbarui = static fn(): int => q(
        'UPDATE `notifikasi`
            SET `jumlah` = ?, `pesan` = ?, `dari` = ?, `jabatan` = ?, `created_at` = ?,
                `dibaca` = 0, `jumlah_kirim` = `jumlah_kirim` + 1
          WHERE `untuk` = ? AND `pos` = ? AND `periode` = ?',
        [$jumlah, $pesan, $u['nama'], $u['jabatan'], $sekarang, $nama, $pos, $per['key']]
    )->rowCount();

    if ($perbarui() === 0) {
        try {
            q(
                'INSERT INTO `notifikasi`
                    (`tipe`, `untuk`, `pos`, `frek`, `periode`, `periode_nama`, `jumlah`, `judul`, `pesan`,
                     `dari`, `jabatan`, `dibaca`, `jumlah_kirim`, `created_at`)
                 VALUES (\'pengingat\', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?)',
                [
                    $nama, $pos, $per['frek'], $per['key'], $per['nama'], $jumlah,
                    'Pengingat ' . POS_LABEL[$pos], $pesan, $u['nama'], $u['jabatan'], $sekarang,
                ]
            );
        } catch (PDOException $e) {
            if ((int) ($e->errorInfo[1] ?? 0) !== 1062) {
                throw $e;
            }
            $perbarui(); // dua bendahara menekan tombol bersamaan: ikut memperbarui
        }
    }

    $r = q(SQL_NOTIF . ' WHERE n.`untuk` = ? AND n.`pos` = ? AND n.`periode` = ?', [$nama, $pos, $per['key']])->fetch();
    return s_notif($r);
}

function aksi_pengingat_kirim(): void
{
    [$u, $per] = konteks_pengingat();
    $nama = nama_siswa_kanonik(teks(badan(), 'nama', 100, 'Nama siswa'));

    if (sudah_bayar_periode((string) $u['pos'], $nama, $per)) {
        kirim_json(['ok' => true, 'sudahLunas' => true, 'notif' => null]);
    }
    kirim_json(['ok' => true, 'sudahLunas' => false, 'notif' => simpan_pengingat($u, $nama, $per)]);
}

function aksi_pengingat_semua(): void
{
    [$u, $per] = konteks_pengingat();

    $lunas = array_flip(array_map('strval', q(
        'SELECT DISTINCT `siswa` FROM `kas_masuk` WHERE `pos` = ? AND `tanggal` BETWEEN ? AND ?',
        [$u['pos'], $per['dari'], $per['sampai']]
    )->fetchAll(PDO::FETCH_COLUMN)));

    $hasil = [];
    foreach (q('SELECT `nama` FROM `siswa` ORDER BY `no_absen`')->fetchAll(PDO::FETCH_COLUMN) as $nama) {
        if (!isset($lunas[(string) $nama])) {
            $hasil[] = simpan_pengingat($u, (string) $nama, $per);
        }
    }
    kirim_json(['ok' => true, 'terkirim' => count($hasil), 'notif' => $hasil]);
}

/** Buka panel notifikasi = semua notifikasi milik sendiri dianggap sudah dibaca. */
function aksi_notif_baca(): void
{
    $u = wajib_login();
    q('UPDATE `notifikasi` SET `dibaca` = 1 WHERE `untuk` = ? AND `dibaca` = 0', [$u['nama']]);
    kirim_json(['ok' => true]);
}
