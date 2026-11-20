<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   LAPORAN KEUANGAN
   laporan_bangun() menyusun satu laporan langsung dari database. Hasilnya
   dibaca oleh tiga "penampil": tampilan layar (JSON), PDF (pdf.php), dan
   Excel (xlsx.php). Karena sumbernya satu, angka di ketiganya pasti sama.

   Bentuk bagian laporan:
     kode, judul, lembar (nama lembar Excel), catatan,
     kolom : [{k, l, t, r, w, f?, s?}]
               k = kunci isian baris      l = judul kolom
               t = teks|angka|rupiah|tanggal|persen|status
               r = kiri|kanan|tengah      w = bobot lebar
               f = rumus Excel (token {kunci}, {^kunci}, @nama)
               s = true bila kolom dijumlahkan pada baris total
     baris : [{kunci => nilai, ...}]  (nilai mentah, bukan teks berformat)
     total : {kunci => nilai} atau null
===================================================================== */

const LAPORAN_JENIS = ['lengkap', 'ringkasan', 'pemasukan', 'pengeluaran', 'siswa'];

/** Rentang terpanjang yang boleh diminta (hari), agar permintaan tidak membebani server. */
const LAPORAN_MAKS_HARI = 1830;

const BULAN_SINGKAT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/* ---------------------------------------------------------------------
   Pembantu tanggal dan nama
--------------------------------------------------------------------- */

/** "2026-10-01" -> "1 Oktober 2026" */
function tgl_panjang(string $iso): string
{
    [$t, $b, $h] = array_map('intval', explode('-', $iso));
    return $h . ' ' . NAMA_BULAN[$b - 1] . ' ' . $t;
}

/** "2026-10-01" -> "01 Okt 2026" (sama dengan fmtDate di script.js) */
function tgl_singkat(string $iso): string
{
    [$t, $b, $h] = array_map('intval', explode('-', $iso));
    return sprintf('%02d %s %d', $h, BULAN_SINGKAT_ID[$b - 1], $t);
}

function hari_sebelum(string $iso): string
{
    return (new DateTimeImmutable($iso))->modify('-1 day')->format('Y-m-d');
}

/** "ABDURRAHMAN AL-HAFIZI" -> "Abdurrahman Al-Hafizi" (sama dengan titleCase di script.js) */
function nama_tampil(string $nama): string
{
    $kecil = mb_strtolower($nama, 'UTF-8');
    return (string) preg_replace_callback(
        '/(^|[\s\-.\'])(\p{Ll})/u',
        static fn(array $m): string => $m[1] . mb_strtoupper($m[2], 'UTF-8'),
        $kecil
    );
}

function zona_singkatan(): string
{
    return match ((string) cfg('timezone', 'Asia/Jakarta')) {
        'Asia/Jakarta', 'Asia/Pontianak' => 'WIB',
        'Asia/Makassar'                  => 'WITA',
        'Asia/Jayapura'                  => 'WIT',
        default                          => (new DateTimeImmutable('now'))->format('T'),
    };
}

/* ---------------------------------------------------------------------
   Periode pembayaran (bulanan / mingguan / harian)
--------------------------------------------------------------------- */

/** Kunci periode untuk sebuah tanggal; bentuknya sama dengan di script.js. */
function kunci_periode(string $frek, string $tgl): string
{
    return match ($frek) {
        'Harian'   => $tgl,
        'Mingguan' => (new DateTimeImmutable($tgl))->format('o-\WW'),
        default    => substr($tgl, 0, 7),
    };
}

/** Tanggal pertama periode yang memuat $tgl. */
function awal_periode(string $frek, string $tgl): string
{
    $d = new DateTimeImmutable($tgl);
    return match ($frek) {
        'Harian'   => $tgl,
        'Mingguan' => $d->modify('monday this week')->format('Y-m-d'),
        default    => $d->format('Y-m-01'),
    };
}

/** Semua kunci periode yang menyentuh rentang [$mulai, $akhir], urut waktu. */
function daftar_periode(string $frek, string $mulai, string $akhir): array
{
    if ($mulai > $akhir) {
        return [];
    }
    $hasil = [];
    $d = new DateTimeImmutable(awal_periode($frek, $mulai));
    $henti = new DateTimeImmutable($akhir);
    while ($d <= $henti && count($hasil) <= LAPORAN_MAKS_HARI + 1) {
        $hasil[] = kunci_periode($frek, $d->format('Y-m-d'));
        $d = match ($frek) {
            'Harian'   => $d->modify('+1 day'),
            'Mingguan' => $d->modify('+7 days'),
            default    => $d->modify('first day of next month'),
        };
    }
    return $hasil;
}

/** Nama periode yang mudah dibaca ("Oktober 2026", "Minggu ke-44, 2026", "Sabtu, 31 Oktober 2026"). */
function nama_periode(string $frek, string $tgl): string
{
    $d = new DateTimeImmutable($tgl);
    $bulan = NAMA_BULAN[(int) $d->format('n') - 1];
    return match ($frek) {
        'Harian'   => NAMA_HARI[(int) $d->format('w')] . ', ' . (int) $d->format('j') . " $bulan " . $d->format('Y'),
        'Mingguan' => 'Minggu ke-' . (int) $d->format('W') . ', ' . $d->format('o'),
        default    => "$bulan " . $d->format('Y'),
    };
}

/* ---------------------------------------------------------------------
   Masukan
--------------------------------------------------------------------- */

/** @return array{0:string,1:string,2:string,3:string} jenis, pos, dari, sampai */
function laporan_parameter(array $u): array
{
    $jenis = teks($_GET, 'jenis', 20, 'Jenis laporan');
    $jenis = $jenis === '' ? 'lengkap' : $jenis;
    if (!in_array($jenis, LAPORAN_JENIS, true)) {
        throw new ApiError('Jenis laporan tidak dikenal.', 422, 'validasi');
    }

    $pos = teks($_GET, 'pos', 10, 'Pos');
    $pos = pos_valid($pos !== '' ? $pos : (string) ($u['pos'] ?? 'Rutin'));

    $hariIni = (new DateTimeImmutable('now'))->format('Y-m-d');
    $dari = teks($_GET, 'dari', 10) !== '' ? tanggal($_GET, 'dari', 'Tanggal awal') : substr($hariIni, 0, 8) . '01';
    $sampai = teks($_GET, 'sampai', 10) !== '' ? tanggal($_GET, 'sampai', 'Tanggal akhir') : $hariIni;

    if ($dari > $sampai) {
        throw new ApiError('Tanggal awal tidak boleh setelah tanggal akhir.', 422, 'validasi');
    }
    $hari = (int) (new DateTimeImmutable($dari))->diff(new DateTimeImmutable($sampai))->days;
    if ($hari > LAPORAN_MAKS_HARI) {
        throw new ApiError('Rentang laporan terlalu panjang (maksimal 5 tahun).', 422, 'validasi');
    }

    return [$jenis, $pos, $dari, $sampai];
}

/* ---------------------------------------------------------------------
   Penyusun laporan
--------------------------------------------------------------------- */

function laporan_bangun(string $jenis, string $pos, string $dari, string $sampai, array $u): array
{
    $hariIni = (new DateTimeImmutable('now'))->format('Y-m-d');
    $posLabel = POS_LABEL[$pos];
    $set = ambil_settings()['nominal'][$pos];
    $frek = (string) $set['frekuensi'];
    $nominal = (int) $set['jumlah'];

    // ---- data mentah dalam rentang (satu kali ambil, dipakai semua bagian)
    $masuk = q(
        'SELECT t.`tanggal`, t.`siswa`, t.`metode`, t.`keterangan`, t.`jumlah`, o.`nama` AS `oleh_nama`
           FROM `kas_masuk` t LEFT JOIN `accounts` o ON o.`id` = t.`oleh_id`
          WHERE t.`pos` = ? AND t.`tanggal` BETWEEN ? AND ?
          ORDER BY t.`tanggal`, t.`id`',
        [$pos, $dari, $sampai]
    )->fetchAll();

    $keluar = q(
        'SELECT t.`tanggal`, t.`kategori`, t.`keterangan`, t.`jumlah`, o.`nama` AS `oleh_nama`
           FROM `pengeluaran` t LEFT JOIN `accounts` o ON o.`id` = t.`oleh_id`
          WHERE t.`pos` = ? AND t.`tanggal` BETWEEN ? AND ?
          ORDER BY t.`tanggal`, t.`id`',
        [$pos, $dari, $sampai]
    )->fetchAll();

    $awalMasuk = (int) q('SELECT COALESCE(SUM(`jumlah`), 0) FROM `kas_masuk` WHERE `pos` = ? AND `tanggal` < ?', [$pos, $dari])->fetchColumn();
    $awalKeluar = (int) q('SELECT COALESCE(SUM(`jumlah`), 0) FROM `pengeluaran` WHERE `pos` = ? AND `tanggal` < ?', [$pos, $dari])->fetchColumn();

    $totMasuk = 0;
    foreach ($masuk as $r) {
        $totMasuk += (int) $r['jumlah'];
    }
    $totKeluar = 0;
    foreach ($keluar as $r) {
        $totKeluar += (int) $r['jumlah'];
    }
    $saldoAwal = $awalMasuk - $awalKeluar;
    $saldoAkhir = $saldoAwal + $totMasuk - $totKeluar;

    $rupiah = static fn(string $l): array => ['l' => $l, 't' => 'rupiah', 'r' => 'kanan'];

    // ---- 1. ringkasan saldo
    $ringkasan = [
        'kode' => 'ringkasan', 'judul' => 'Ringkasan saldo', 'lembar' => 'Ringkasan',
        'catatan' => count($masuk) . ' transaksi pemasukan dan ' . count($keluar) . ' transaksi pengeluaran pada periode ini.',
        'kolom' => [
            ['k' => 'uraian', 'l' => 'Uraian', 't' => 'teks', 'r' => 'kiri', 'w' => 70],
            ['k' => 'jumlah', 'l' => 'Jumlah (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 30],
        ],
        'baris' => [
            ['uraian' => 'Saldo awal (sebelum ' . tgl_singkat($dari) . ')', 'jumlah' => $saldoAwal, 'reg' => ['jumlah' => 'saldoAwal']],
            ['uraian' => 'Total pemasukan', 'jumlah' => $totMasuk, 'reg' => ['jumlah' => 'totMasuk']],
            ['uraian' => 'Total pengeluaran', 'jumlah' => $totKeluar, 'reg' => ['jumlah' => 'totKeluar']],
            ['uraian' => 'Selisih periode (pemasukan - pengeluaran)', 'jumlah' => $totMasuk - $totKeluar, 'f_jumlah' => '@totMasuk-@totKeluar', 'reg' => ['jumlah' => 'selisih']],
            ['uraian' => 'Saldo akhir (per ' . tgl_singkat($sampai) . ')', 'jumlah' => $saldoAkhir, 'f_jumlah' => '@saldoAwal+@selisih', 'tebal' => true],
        ],
        'total' => null,
    ];

    // ---- 2. rekap per bulan
    $perBulanMasuk = [];
    foreach ($masuk as $r) {
        $b = substr((string) $r['tanggal'], 0, 7);
        $perBulanMasuk[$b] = ($perBulanMasuk[$b] ?? 0) + (int) $r['jumlah'];
    }
    $perBulanKeluar = [];
    foreach ($keluar as $r) {
        $b = substr((string) $r['tanggal'], 0, 7);
        $perBulanKeluar[$b] = ($perBulanKeluar[$b] ?? 0) + (int) $r['jumlah'];
    }
    $barisBulan = [];
    $saldoJalan = $saldoAwal;
    $pertama = true;
    foreach (daftar_periode('Bulanan', $dari, $sampai) as $b) {
        $m = $perBulanMasuk[$b] ?? 0;
        $k = $perBulanKeluar[$b] ?? 0;
        $saldoJalan += $m - $k;
        $barisBulan[] = [
            'bulan' => BULAN_SINGKAT_ID[(int) substr($b, 5, 2) - 1] . ' ' . substr($b, 0, 4),
            'masuk' => $m, 'keluar' => $k, 'selisih' => $m - $k, 'saldo' => $saldoJalan,
            // rumus saldo: bulan pertama = saldo awal + selisih; selanjutnya = saldo bulan lalu + selisih
            'f_saldo' => $pertama ? '@saldoAwal+{selisih}' : '{^saldo}+{selisih}',
        ];
        $pertama = false;
    }
    $bulanan = [
        'kode' => 'bulanan', 'judul' => 'Rekap per bulan', 'lembar' => 'Ringkasan',
        'catatan' => 'Pemasukan dan pengeluaran dikelompokkan menurut bulan transaksi.',
        'kolom' => [
            ['k' => 'bulan', 'l' => 'Bulan', 't' => 'teks', 'r' => 'kiri', 'w' => 22],
            ['k' => 'masuk', 'l' => 'Pemasukan (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 20, 's' => true],
            ['k' => 'keluar', 'l' => 'Pengeluaran (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 20, 's' => true],
            ['k' => 'selisih', 'l' => 'Selisih (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 19, 'f' => '{masuk}-{keluar}', 's' => true],
            ['k' => 'saldo', 'l' => 'Saldo akhir bulan (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 19],
        ],
        'baris' => $barisBulan,
        'total' => ['label' => 'Jumlah', 'masuk' => $totMasuk, 'keluar' => $totKeluar, 'selisih' => $totMasuk - $totKeluar],
    ];

    // ---- 3. pemasukan (rincian)
    $barisMasuk = [];
    foreach ($masuk as $i => $r) {
        $barisMasuk[] = [
            'no' => $i + 1,
            'tanggal' => (string) $r['tanggal'],
            'siswa' => nama_tampil((string) $r['siswa']),
            'metode' => (string) $r['metode'],
            'keterangan' => (string) $r['keterangan'],
            'oleh' => $r['oleh_nama'] !== null ? nama_tampil((string) $r['oleh_nama']) : '-',
            'jumlah' => (int) $r['jumlah'],
        ];
    }
    $pemasukan = [
        'kode' => 'pemasukan', 'judul' => 'Rincian pemasukan', 'lembar' => 'Pemasukan',
        'catatan' => $barisMasuk ? count($barisMasuk) . ' transaksi, urut tanggal.' : 'Tidak ada pemasukan pada periode ini.',
        'kolom' => [
            ['k' => 'no', 'l' => 'No', 't' => 'angka', 'r' => 'tengah', 'w' => 5],
            ['k' => 'tanggal', 'l' => 'Tanggal', 't' => 'tanggal', 'r' => 'kiri', 'w' => 13],
            ['k' => 'siswa', 'l' => 'Nama siswa', 't' => 'teks', 'r' => 'kiri', 'w' => 24],
            ['k' => 'metode', 'l' => 'Metode', 't' => 'teks', 'r' => 'kiri', 'w' => 8],
            ['k' => 'keterangan', 'l' => 'Keterangan', 't' => 'teks', 'r' => 'kiri', 'w' => 19],
            ['k' => 'oleh', 'l' => 'Pencatat', 't' => 'teks', 'r' => 'kiri', 'w' => 19],
            ['k' => 'jumlah', 'l' => 'Jumlah (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 12, 's' => true],
        ],
        'baris' => $barisMasuk,
        'total' => ['label' => 'Total pemasukan', 'jumlah' => $totMasuk],
    ];

    // ---- 4. pengeluaran per kategori
    $kat = [];
    foreach ($keluar as $r) {
        $nama = (string) $r['kategori'];
        $kat[$nama] ??= ['n' => 0, 'jumlah' => 0];
        $kat[$nama]['n']++;
        $kat[$nama]['jumlah'] += (int) $r['jumlah'];
    }
    uasort($kat, static fn(array $a, array $b): int => $b['jumlah'] <=> $a['jumlah']);
    $barisKat = [];
    foreach ($kat as $nama => $v) {
        $barisKat[] = [
            'kategori' => (string) $nama, 'transaksi' => $v['n'], 'jumlah' => $v['jumlah'],
            'persen' => $totKeluar > 0 ? round($v['jumlah'] * 100 / $totKeluar, 1) : 0.0,
        ];
    }
    $pengeluaranKategori = [
        'kode' => 'pengeluaran_kategori', 'judul' => 'Pengeluaran per kategori', 'lembar' => 'Pengeluaran',
        'catatan' => $barisKat ? 'Diurutkan dari kategori terbesar.' : 'Tidak ada pengeluaran pada periode ini.',
        'kolom' => [
            ['k' => 'kategori', 'l' => 'Kategori', 't' => 'teks', 'r' => 'kiri', 'w' => 40],
            ['k' => 'transaksi', 'l' => 'Transaksi', 't' => 'angka', 'r' => 'kanan', 'w' => 16, 's' => true],
            ['k' => 'jumlah', 'l' => 'Jumlah (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 26, 's' => true],
            ['k' => 'persen', 'l' => 'Porsi', 't' => 'persen', 'r' => 'kanan', 'w' => 18, 'f' => 'IF(@T.pengeluaran_kategori.jumlah=0,0,{jumlah}/@T.pengeluaran_kategori.jumlah)'],
        ],
        'baris' => $barisKat,
        'total' => ['label' => 'Total', 'transaksi' => count($keluar), 'jumlah' => $totKeluar, 'persen' => $totKeluar > 0 ? 100.0 : 0.0],
    ];

    // ---- 5. pengeluaran (rincian)
    $barisKeluar = [];
    foreach ($keluar as $i => $r) {
        $barisKeluar[] = [
            'no' => $i + 1,
            'tanggal' => (string) $r['tanggal'],
            'kategori' => (string) $r['kategori'],
            'keterangan' => (string) $r['keterangan'],
            'oleh' => $r['oleh_nama'] !== null ? nama_tampil((string) $r['oleh_nama']) : '-',
            'jumlah' => (int) $r['jumlah'],
        ];
    }
    $pengeluaran = [
        'kode' => 'pengeluaran', 'judul' => 'Rincian pengeluaran', 'lembar' => 'Pengeluaran',
        'catatan' => $barisKeluar ? count($barisKeluar) . ' transaksi, urut tanggal.' : 'Tidak ada pengeluaran pada periode ini.',
        'kolom' => [
            ['k' => 'no', 'l' => 'No', 't' => 'angka', 'r' => 'tengah', 'w' => 5],
            ['k' => 'tanggal', 'l' => 'Tanggal', 't' => 'tanggal', 'r' => 'kiri', 'w' => 13],
            ['k' => 'kategori', 'l' => 'Kategori', 't' => 'teks', 'r' => 'kiri', 'w' => 16],
            ['k' => 'keterangan', 'l' => 'Keterangan', 't' => 'teks', 'r' => 'kiri', 'w' => 32],
            ['k' => 'oleh', 'l' => 'Pencatat', 't' => 'teks', 'r' => 'kiri', 'w' => 17],
            ['k' => 'jumlah', 'l' => 'Jumlah (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 17, 's' => true],
        ],
        'baris' => $barisKeluar,
        'total' => ['label' => 'Total pengeluaran', 'jumlah' => $totKeluar],
    ];

    // ---- 6. pembayaran siswa (status, riwayat ringkas, tunggakan)
    $siswa = laporan_bagian_siswa($pos, $frek, $nominal, $dari, $sampai, $hariIni);

    $semua = [
        'ringkasan' => $ringkasan, 'bulanan' => $bulanan, 'pemasukan' => $pemasukan,
        'pengeluaran_kategori' => $pengeluaranKategori, 'pengeluaran' => $pengeluaran, 'siswa' => $siswa,
    ];
    $pilih = match ($jenis) {
        'ringkasan'   => ['ringkasan', 'bulanan'],
        'pemasukan'   => ['pemasukan'],
        'pengeluaran' => ['pengeluaran_kategori', 'pengeluaran'],
        'siswa'       => ['siswa'],
        default       => ['ringkasan', 'bulanan', 'pemasukan', 'pengeluaran_kategori', 'pengeluaran', 'siswa'],
    };
    $bagian = [];
    foreach ($pilih as $kode) {
        $bagian[] = $semua[$kode];
    }

    $judul = match ($jenis) {
        'ringkasan'   => 'Laporan Saldo Kas',
        'pemasukan'   => 'Laporan Pemasukan',
        'pengeluaran' => 'Laporan Pengeluaran',
        'siswa'       => 'Laporan Pembayaran Siswa',
        default       => 'Laporan Keuangan',
    };

    $sekarang = new DateTimeImmutable('now');

    return [
        'jenis'    => $jenis,
        'judul'    => $judul,
        'kelas'    => 'Informasi Kas X TKJT 1',
        'pos'      => $pos,
        'posLabel' => $posLabel,
        'dari'     => $dari,
        'sampai'   => $sampai,
        'periodeTeks' => tgl_panjang($dari) . ($dari === $sampai ? '' : ' s.d. ' . tgl_panjang($sampai)),
        'nominal'  => $nominal,
        'frekuensi' => $frek,
        'dibuat'   => [
            'oleh'      => nama_tampil((string) $u['nama']),
            'jabatan'   => (string) ($u['jabatan'] ?? 'Bendahara'),
            'waktu'     => now_ms(),
            'waktuTeks' => tgl_panjang($sekarang->format('Y-m-d')) . ' ' . $sekarang->format('H.i') . ' ' . zona_singkatan(),
        ],
        'ringkas'  => [
            'saldoAwal' => $saldoAwal, 'masuk' => $totMasuk, 'keluar' => $totKeluar, 'saldoAkhir' => $saldoAkhir,
            'jumlahMasuk' => count($masuk), 'jumlahKeluar' => count($keluar),
        ],
        'bagian'   => $bagian,
    ];
}

/**
 * Pembayaran siswa untuk satu pos.
 *
 * Aturan (sama dengan dashboard):
 *  - Siswa dianggap LUNAS pada suatu periode bila ada minimal satu setoran
 *    yang tanggalnya jatuh di periode itu (bulan untuk Kas Rutin, hari untuk
 *    Dana Kurban, minggu bila pos diatur mingguan).
 *  - Periode "jatuh tempo" = semua periode dari awal penagihan sampai akhir
 *    rentang laporan atau hari ini (mana yang lebih dulu). Awal penagihan =
 *    tanggal setoran PERTAMA yang pernah dicatat di pos itu (atau awal rentang
 *    bila belum ada setoran sama sekali), tetapi tidak lebih awal dari rentang.
 *  - Tunggakan = jumlah periode yang jatuh tempo namun belum lunas x nominal.
 *  - Pos tanpa jadwal tetap (Dana Acara) tidak punya tunggakan; yang dicatat
 *    hanya siapa yang sudah menyetor dalam rentang.
 */
function laporan_bagian_siswa(string $pos, string $frek, int $nominal, string $dari, string $sampai, string $hariIni): array
{
    $daftar = q('SELECT `no_absen`, `nama` FROM `siswa` ORDER BY `no_absen`')->fetchAll();

    // total & jumlah setoran dalam rentang, setoran terakhir sampai akhir rentang
    $total = [];
    $jumlahSetor = [];
    foreach (q(
        'SELECT `siswa`, COUNT(*) AS n, COALESCE(SUM(`jumlah`), 0) AS jml
           FROM `kas_masuk` WHERE `pos` = ? AND `tanggal` BETWEEN ? AND ? GROUP BY `siswa`',
        [$pos, $dari, $sampai]
    )->fetchAll() as $r) {
        $total[(string) $r['siswa']] = (int) $r['jml'];
        $jumlahSetor[(string) $r['siswa']] = (int) $r['n'];
    }
    $terakhir = [];
    foreach (q(
        'SELECT `siswa`, MAX(`tanggal`) AS tgl FROM `kas_masuk` WHERE `pos` = ? AND `tanggal` <= ? GROUP BY `siswa`',
        [$pos, $sampai]
    )->fetchAll() as $r) {
        $terakhir[(string) $r['siswa']] = (string) $r['tgl'];
    }

    $baris = [];
    $nomor = 0;

    /* ---------- pos tanpa jadwal tetap ---------- */
    if (!in_array($frek, ['Bulanan', 'Mingguan', 'Harian'], true)) {
        $sudah = 0;
        foreach ($daftar as $s) {
            $nama = (string) $s['nama'];
            $ada = ($jumlahSetor[$nama] ?? 0) > 0;
            $sudah += $ada ? 1 : 0;
            $baris[] = [
                'no' => (int) $s['no_absen'], 'nama' => nama_tampil($nama),
                'status' => $ada ? 'Sudah setor' : 'Belum setor',
                'setoran' => $jumlahSetor[$nama] ?? 0, 'total' => $total[$nama] ?? 0,
                'terakhir' => $terakhir[$nama] ?? null,
            ];
            $nomor++;
        }
        $jumlahTotal = array_sum($total);
        return [
            'kode' => 'siswa', 'judul' => 'Pembayaran siswa', 'lembar' => 'Pembayaran Siswa',
            'catatan' => "Dana ini dikumpulkan sesuai kebutuhan, jadi tidak ada tunggakan. $sudah dari $nomor siswa sudah menyetor pada periode laporan.",
            'kolom' => [
                ['k' => 'no', 'l' => 'No', 't' => 'angka', 'r' => 'tengah', 'w' => 6],
                ['k' => 'nama', 'l' => 'Nama siswa', 't' => 'teks', 'r' => 'kiri', 'w' => 34],
                ['k' => 'status', 'l' => 'Status', 't' => 'status', 'r' => 'tengah', 'w' => 16],
                ['k' => 'setoran', 'l' => 'Jumlah setoran', 't' => 'angka', 'r' => 'kanan', 'w' => 12, 's' => true],
                ['k' => 'total', 'l' => 'Total dibayar (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 17, 's' => true],
                ['k' => 'terakhir', 'l' => 'Setoran terakhir', 't' => 'tanggal', 'r' => 'tengah', 'w' => 15],
            ],
            'baris' => $baris,
            'total' => ['label' => 'Jumlah', 'setoran' => array_sum($jumlahSetor), 'total' => $jumlahTotal],
            'meta' => [
                'berjadwal' => false, 'jumlahSiswa' => $nomor, 'lunas' => $sudah, 'belum' => $nomor - $sudah,
                'menunggak' => 0, 'tunggakan' => 0, 'periodeAkhir' => null,
            ],
        ];
    }

    /* ---------- pos berjadwal ---------- */
    $akhir = min($sampai, $hariIni);
    $awalKas = q('SELECT MIN(`tanggal`) FROM `kas_masuk` WHERE `pos` = ?', [$pos])->fetchColumn();
    $mulai = ($awalKas !== false && $awalKas !== null) ? max($dari, (string) $awalKas) : $dari;

    $periode = ($mulai <= $akhir && $akhir >= $dari) ? daftar_periode($frek, $mulai, $akhir) : [];
    $punyaPeriode = $periode !== [];
    $kunciAkhir = $punyaPeriode ? kunci_periode($frek, $akhir) : null;

    // periode mana saja yang sudah dibayar tiap siswa (setoran sejak awal periode pertama)
    $dibayar = [];
    if ($punyaPeriode) {
        $jendela = awal_periode($frek, $mulai);
        foreach (q(
            'SELECT `siswa`, `tanggal` FROM `kas_masuk` WHERE `pos` = ? AND `tanggal` BETWEEN ? AND ?',
            [$pos, $jendela, $akhir]
        )->fetchAll() as $r) {
            $dibayar[(string) $r['siswa']][kunci_periode($frek, (string) $r['tanggal'])] = true;
        }
    }
    $tempo = count($periode);

    $lunas = 0;
    $menunggak = 0;
    $sumTunggak = 0;
    $sumPeriodeTunggak = 0;
    $sumLunasPeriode = 0;
    foreach ($daftar as $s) {
        $nama = (string) $s['nama'];
        $sudahPeriode = 0;
        foreach ($periode as $p) {
            if (isset($dibayar[$nama][$p])) {
                $sudahPeriode++;
            }
        }
        $tunggakPeriode = $tempo - $sudahPeriode;
        $nilaiTunggak = $tunggakPeriode * $nominal;
        $status = $punyaPeriode ? (isset($dibayar[$nama][$kunciAkhir]) ? 'Lunas' : 'Belum bayar') : '-';
        $lunas += $status === 'Lunas' ? 1 : 0;
        $menunggak += $tunggakPeriode > 0 ? 1 : 0;
        $sumTunggak += $nilaiTunggak;
        $sumPeriodeTunggak += $tunggakPeriode;
        $sumLunasPeriode += $sudahPeriode;
        $baris[] = [
            'no' => (int) $s['no_absen'], 'nama' => nama_tampil($nama), 'status' => $status,
            'lunas' => $sudahPeriode, 'tempo' => $tempo, 'menunggak' => $tunggakPeriode,
            'total' => $total[$nama] ?? 0, 'tunggakan' => $nilaiTunggak,
            'terakhir' => $terakhir[$nama] ?? null,
        ];
        $nomor++;
    }

    $satuan = match ($frek) {
        'Harian' => 'hari', 'Mingguan' => 'minggu', default => 'bulan',
    };
    // "Minggu, 1 November 2026" terbaca ambigu ("minggu" = pekan), jadi pos harian memakai tanggal biasa.
    $namaAkhir = $punyaPeriode ? ($frek === 'Harian' ? tgl_panjang($akhir) : nama_periode($frek, $akhir)) : null;
    $catatan = $punyaPeriode
        ? "Status per $namaAkhir. Periode ditagih: $tempo $satuan (mulai " . tgl_singkat($mulai) . '). '
          . 'Tunggakan = periode yang belum lunas x ' . rupiah_teks($nominal) . ' per ' . $satuan . '.'
        : 'Belum ada periode yang jatuh tempo pada rentang ini, sehingga belum ada tunggakan.';

    return [
        'kode' => 'siswa', 'judul' => 'Pembayaran siswa dan tunggakan', 'lembar' => 'Pembayaran Siswa',
        'catatan' => $catatan,
        'kolom' => [
            ['k' => 'no', 'l' => 'No', 't' => 'angka', 'r' => 'tengah', 'w' => 5],
            ['k' => 'nama', 'l' => 'Nama siswa', 't' => 'teks', 'r' => 'kiri', 'w' => 20],
            ['k' => 'status', 'l' => 'Status', 't' => 'status', 'r' => 'tengah', 'w' => 11],
            ['k' => 'lunas', 'l' => ucfirst($satuan) . ' lunas', 't' => 'angka', 'r' => 'kanan', 'w' => 9, 's' => true],
            ['k' => 'tempo', 'l' => ucfirst($satuan) . ' ditagih', 't' => 'angka', 'r' => 'kanan', 'w' => 9],
            ['k' => 'menunggak', 'l' => ucfirst($satuan) . ' menunggak', 't' => 'angka', 'r' => 'kanan', 'w' => 11, 'f' => '{tempo}-{lunas}', 's' => true],
            ['k' => 'total', 'l' => 'Total dibayar (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 12, 's' => true],
            ['k' => 'tunggakan', 'l' => 'Tunggakan (Rp)', 't' => 'rupiah', 'r' => 'kanan', 'w' => 12, 'f' => '{menunggak}*@nominal', 's' => true],
            ['k' => 'terakhir', 'l' => 'Setoran terakhir', 't' => 'tanggal', 'r' => 'tengah', 'w' => 11],
        ],
        'baris' => $baris,
        'total' => [
            'label' => 'Jumlah', 'lunas' => $sumLunasPeriode, 'menunggak' => $sumPeriodeTunggak,
            'total' => array_sum($total), 'tunggakan' => $sumTunggak,
        ],
        'param' => ['nominal' => $nominal],
        'meta' => [
            'berjadwal' => true, 'jumlahSiswa' => $nomor, 'lunas' => $lunas, 'belum' => $nomor - $lunas,
            'menunggak' => $menunggak, 'tunggakan' => $sumTunggak, 'periodeAkhir' => $namaAkhir,
            'periodeDitagih' => $tempo, 'frekuensi' => $frek, 'satuan' => $satuan, 'mulaiTagih' => $punyaPeriode ? $mulai : null,
        ],
    ];
}

/* ---------------------------------------------------------------------
   Pengiriman berkas unduhan
--------------------------------------------------------------------- */

function nama_berkas_laporan(array $lap, string $ekstensi): string
{
    $jenis = $lap['jenis'] === 'lengkap' ? 'lengkap' : $lap['jenis'];
    return sprintf('Laporan-Kas-%s-%s-%s_sd_%s.%s', $lap['pos'], $jenis, $lap['dari'], $lap['sampai'], $ekstensi);
}

function kirim_berkas(string $isi, string $mime, string $nama): void
{
    if (!headers_sent()) {
        http_response_code(200);
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . strlen($isi));
        header('Content-Disposition: attachment; filename="' . $nama . '"; filename*=UTF-8\'\'' . rawurlencode($nama));
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('Cross-Origin-Resource-Policy: same-origin');
    }
    echo $isi;
    exit;
}

/* ---------------------------------------------------------------------
   Aksi API (khusus bendahara)
--------------------------------------------------------------------- */

function aksi_laporan(): void
{
    $u = wajib_bendahara();
    [$jenis, $pos, $dari, $sampai] = laporan_parameter($u);
    kirim_json(['ok' => true, 'laporan' => laporan_bangun($jenis, $pos, $dari, $sampai, $u)]);
}

function aksi_laporan_pdf(): void
{
    $u = wajib_bendahara();
    [$jenis, $pos, $dari, $sampai] = laporan_parameter($u);
    $lap = laporan_bangun($jenis, $pos, $dari, $sampai, $u);
    kirim_berkas(pdf_laporan($lap), 'application/pdf', nama_berkas_laporan($lap, 'pdf'));
}

function aksi_laporan_xlsx(): void
{
    $u = wajib_bendahara();
    [$jenis, $pos, $dari, $sampai] = laporan_parameter($u);
    $lap = laporan_bangun($jenis, $pos, $dari, $sampai, $u);
    kirim_berkas(
        xlsx_laporan($lap),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        nama_berkas_laporan($lap, 'xlsx')
    );
}
