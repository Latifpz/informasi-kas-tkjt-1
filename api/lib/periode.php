<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   PERIODE PEMBAYARAN (cermin dari periodeAktif() di script.js)
   Kas Rutin   -> status berganti setiap BULAN
   Dana Kurban -> status berganti setiap HARI
   Dana Acara  -> tidak punya periode tetap
===================================================================== */

const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** Pos yang boleh dikirimi pengingat. */
const POS_PENGINGAT = ['Rutin', 'Kurban'];

function rupiah_teks(int $n): string
{
    return 'Rp ' . number_format($n, 0, ',', '.');
}

function frekuensi_pos(string $pos): string
{
    if ($pos === 'Rutin') {
        return 'Bulanan';
    }
    if ($pos === 'Kurban') {
        return 'Harian';
    }
    $f = q('SELECT `frekuensi` FROM `pengaturan_pos` WHERE `pos` = ?', [$pos])->fetchColumn();
    return $f === false ? 'Sesuai kebutuhan' : (string) $f;
}

/**
 * Periode yang sedang berjalan untuk sebuah pos, atau null bila pos itu
 * tidak punya jadwal tetap. 'dari' dan 'sampai' = rentang tanggal periode.
 */
function periode_aktif(string $pos, ?DateTimeImmutable $now = null): ?array
{
    $frek = frekuensi_pos($pos);
    $now = $now ?? new DateTimeImmutable('now');
    $hari = $now->format('Y-m-d');
    $tahun = (int) $now->format('Y');
    $bulan = (int) $now->format('n');
    $tgl = (int) $now->format('j');

    if ($frek === 'Harian') {
        $nama = NAMA_HARI[(int) $now->format('w')] . ", $tgl " . NAMA_BULAN[$bulan - 1] . " $tahun";
        return [
            'frek' => 'Harian', 'key' => $hari, 'label' => 'hari ini',
            'nama' => $nama, 'frasa' => "hari $nama",
            'dari' => $hari, 'sampai' => $hari,
        ];
    }

    if ($frek === 'Mingguan') {
        $minggu = (int) $now->format('W');
        $nama = "Minggu ke-$minggu, " . $now->format('o');
        return [
            'frek' => 'Mingguan', 'key' => $now->format('o-\WW'), 'label' => 'minggu ini',
            'nama' => $nama, 'frasa' => mb_strtolower($nama),
            'dari' => $now->modify('monday this week')->format('Y-m-d'),
            'sampai' => $now->modify('sunday this week')->format('Y-m-d'),
        ];
    }

    if ($frek === 'Bulanan') {
        $nama = NAMA_BULAN[$bulan - 1] . " $tahun";
        return [
            'frek' => 'Bulanan', 'key' => $now->format('Y-m'), 'label' => 'bulan ini',
            'nama' => $nama, 'frasa' => "bulan $nama",
            'dari' => $now->format('Y-m-01'), 'sampai' => $now->format('Y-m-t'),
        ];
    }

    return null;
}

/** Sudahkah siswa membayar pada periode berjalan ($per dari periode_aktif)? */
function sudah_bayar_periode(string $pos, string $siswa, array $per): bool
{
    return (bool) q(
        'SELECT 1 FROM `kas_masuk` WHERE `pos` = ? AND `siswa` = ? AND `tanggal` BETWEEN ? AND ? LIMIT 1',
        [$pos, $siswa, $per['dari'], $per['sampai']]
    )->fetchColumn();
}
