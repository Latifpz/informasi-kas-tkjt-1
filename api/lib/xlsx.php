<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   EXCEL (.xlsx) LAPORAN
   Pembuat berkas .xlsx tanpa pustaka luar (tidak butuh ekstensi zip):
   berkas .xlsx adalah arsip ZIP berisi XML, jadi cukup ditulis sendiri.

   - Teks ditulis sebagai inline string, sehingga isi sel yang diawali
     "=", "+", "-" atau "@" tetap dianggap teks (tidak ada injeksi rumus).
   - Total, selisih, saldo, porsi, dan tunggakan berupa RUMUS Excel
     (bersama nilai hasil hitungnya), jadi ikut berubah bila isian diedit.
   - Satu lembar per kelompok bagian: Ringkasan, Pemasukan, Pengeluaran,
     Pembayaran Siswa.
===================================================================== */

/** Penulis arsip ZIP sederhana (metode simpan atau deflate). */
final class XlsxZip
{
    /** @var array<int,array{nama:string,crc:int,ukuranAsli:int,ukuranMampat:int,metode:int,posisi:int}> */
    private array $daftar = [];
    private string $isi = '';

    public function tambah(string $nama, string $data): void
    {
        $crc = crc32($data);
        $metode = 0;
        $mampat = $data;
        if (function_exists('gzdeflate')) {
            $coba = gzdeflate($data, 6);
            if (is_string($coba) && strlen($coba) < strlen($data)) {
                $metode = 8;
                $mampat = $coba;
            }
        }
        // waktu DOS tetap (1 Januari 2026 00:00) agar berkas deterministik
        $jam = 0;
        $tgl = ((2026 - 1980) << 9) | (1 << 5) | 1;

        $posisi = strlen($this->isi);
        $this->isi .= pack(
            'VvvvvvVVVvv',
            0x04034b50, 20, 0x0800, $metode, $jam, $tgl, $crc & 0xFFFFFFFF,
            strlen($mampat), strlen($data), strlen($nama), 0
        ) . $nama . $mampat;

        $this->daftar[] = [
            'nama' => $nama, 'crc' => $crc & 0xFFFFFFFF, 'ukuranAsli' => strlen($data),
            'ukuranMampat' => strlen($mampat), 'metode' => $metode, 'posisi' => $posisi,
        ];
    }

    public function bangun(): string
    {
        $jam = 0;
        $tgl = ((2026 - 1980) << 9) | (1 << 5) | 1;
        $pusat = '';
        foreach ($this->daftar as $e) {
            $pusat .= pack(
                'VvvvvvvVVVvvvvvVV',
                0x02014b50, 20, 20, 0x0800, $e['metode'], $jam, $tgl, $e['crc'],
                $e['ukuranMampat'], $e['ukuranAsli'], strlen($e['nama']), 0, 0, 0, 0, 0, $e['posisi']
            ) . $e['nama'];
        }
        $n = count($this->daftar);
        return $this->isi . $pusat . pack('VvvvvVVv', 0x06054b50, 0, 0, $n, $n, strlen($pusat), strlen($this->isi), 0);
    }
}

/* ---------------------------------------------------------------------
   Pembantu XML dan alamat sel
--------------------------------------------------------------------- */

function x_esc(string $s): string
{
    // buang karakter yang tidak boleh ada di XML 1.0
    $s = preg_replace('/[^\x{9}\x{A}\x{D}\x{20}-\x{D7FF}\x{E000}-\x{FFFD}\x{10000}-\x{10FFFF}]/u', '', $s) ?? '';
    return htmlspecialchars($s, ENT_XML1 | ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** 0 -> A, 25 -> Z, 26 -> AA */
function x_huruf(int $i): string
{
    $s = '';
    for ($n = $i + 1; $n > 0; $n = intdiv($n - 1, 26)) {
        $s = chr(65 + ($n - 1) % 26) . $s;
    }
    return $s;
}

/** Nomor seri tanggal Excel (hari sejak 30 Des 1899). */
function x_serial(string $iso): int
{
    return (int) (new DateTimeImmutable('1899-12-30'))->diff(new DateTimeImmutable($iso))->days;
}

/** Gaya sel: nama => [font, fill, border, numFmt, rata, bungkus, vertikal] */
const X_GAYA = [
    'dasar'        => [0, 0, 0, 0, null, false, null],
    'judul'        => [2, 0, 0, 0, null, false, null],
    'meta'         => [3, 0, 0, 0, null, false, null],
    'bagian'       => [5, 0, 0, 0, null, false, null],
    'catatan'      => [3, 0, 0, 0, null, false, null],
    'head_kiri'    => [4, 2, 0, 0, 'left', true, 'center'],
    'head_kanan'   => [4, 2, 0, 0, 'right', true, 'center'],
    'head_tengah'  => [4, 2, 0, 0, 'center', true, 'center'],
    'teks'         => [0, 0, 1, 0, 'left', true, 'top'],
    'teks_tebal'   => [1, 0, 1, 0, 'left', true, 'top'],
    'tengah'       => [0, 0, 1, 0, 'center', false, 'top'],
    'angka'        => [0, 0, 1, 3, 'right', false, 'top'],
    'angka_tengah' => [0, 0, 1, 3, 'center', false, 'top'],
    'rupiah'       => [0, 0, 1, 164, 'right', false, 'top'],
    'rupiah_tebal' => [1, 0, 1, 164, 'right', false, 'top'],
    'tanggal'      => [0, 0, 1, 165, 'left', false, 'top'],
    'tanggal_tengah' => [0, 0, 1, 165, 'center', false, 'top'],
    'persen'       => [0, 0, 1, 166, 'right', false, 'top'],
    'tot_label'    => [1, 3, 2, 0, 'left', false, 'center'],
    'tot_angka'    => [1, 3, 2, 3, 'right', false, 'center'],
    'tot_rupiah'   => [1, 3, 2, 164, 'right', false, 'center'],
    'tot_persen'   => [1, 3, 2, 166, 'right', false, 'center'],
    'tot_kosong'   => [1, 3, 2, 0, null, false, 'center'],
    'param_label'  => [0, 0, 0, 0, 'left', false, null],
    'param_nilai'  => [1, 0, 1, 164, 'right', false, null],
];

/** Nama gaya -> indeks cellXfs (urutan sama dengan X_GAYA). */
function x_gaya_idx(string $nama): int
{
    static $peta = null;
    if ($peta === null) {
        $peta = array_flip(array_keys(X_GAYA));
    }
    return (int) $peta[$nama];
}

function x_styles(): string
{
    $xf = '';
    foreach (X_GAYA as [$font, $fill, $border, $fmt, $rata, $bungkus, $vert]) {
        $atribut = sprintf(' numFmtId="%d" fontId="%d" fillId="%d" borderId="%d" xfId="0"', $fmt, $font, $fill, $border);
        $atribut .= $fmt ? ' applyNumberFormat="1"' : '';
        $atribut .= $font ? ' applyFont="1"' : '';
        $atribut .= $fill ? ' applyFill="1"' : '';
        $atribut .= $border ? ' applyBorder="1"' : '';
        if ($rata !== null || $bungkus || $vert !== null) {
            $al = ($rata !== null ? ' horizontal="' . $rata . '"' : '')
                . ($vert !== null ? ' vertical="' . $vert . '"' : '')
                . ($bungkus ? ' wrapText="1"' : '');
            $xf .= '<xf' . $atribut . ' applyAlignment="1"><alignment' . $al . '/></xf>';
        } else {
            $xf .= '<xf' . $atribut . '/>';
        }
    }
    $n = count(X_GAYA);

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        . '<numFmts count="3">'
        . '<numFmt numFmtId="164" formatCode="#,##0;(#,##0);&quot;-&quot;"/>'
        . '<numFmt numFmtId="165" formatCode="dd\ mmm\ yyyy"/>'
        . '<numFmt numFmtId="166" formatCode="0.0%"/>'
        . '</numFmts>'
        . '<fonts count="6">'
        . '<font><sz val="10"/><name val="Arial"/><family val="2"/></font>'
        . '<font><b/><sz val="10"/><name val="Arial"/><family val="2"/></font>'
        . '<font><b/><sz val="16"/><color rgb="FF17695A"/><name val="Arial"/><family val="2"/></font>'
        . '<font><sz val="9"/><color rgb="FF566F68"/><name val="Arial"/><family val="2"/></font>'
        . '<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/><family val="2"/></font>'
        . '<font><b/><sz val="12"/><color rgb="FF14302A"/><name val="Arial"/><family val="2"/></font>'
        . '</fonts>'
        . '<fills count="4">'
        . '<fill><patternFill patternType="none"/></fill>'
        . '<fill><patternFill patternType="gray125"/></fill>'
        . '<fill><patternFill patternType="solid"><fgColor rgb="FF17695A"/><bgColor indexed="64"/></patternFill></fill>'
        . '<fill><patternFill patternType="solid"><fgColor rgb="FFE3F1EC"/><bgColor indexed="64"/></patternFill></fill>'
        . '</fills>'
        . '<borders count="3">'
        . '<border><left/><right/><top/><bottom/><diagonal/></border>'
        . '<border><left/><right/><top/><bottom style="thin"><color rgb="FFD3DDD6"/></bottom><diagonal/></border>'
        . '<border><left/><right/><top style="thin"><color rgb="FF17695A"/></top><bottom style="thin"><color rgb="FF17695A"/></bottom><diagonal/></border>'
        . '</borders>'
        . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        . '<cellXfs count="' . $n . '">' . $xf . '</cellXfs>'
        . '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        . '</styleSheet>';
}

/* ---------------------------------------------------------------------
   Penyusunan lembar
--------------------------------------------------------------------- */

/** Ubah rumus ber-token menjadi rumus Excel: {kunci}, {^kunci}, @nama. */
function x_rumus(string $tpl, int $baris, array $kolomHuruf, array $registri): string
{
    $hasil = preg_replace_callback(
        '/\{(\^?)([A-Za-z0-9_]+)\}/',
        static function (array $m) use ($baris, $kolomHuruf): string {
            $huruf = $kolomHuruf[$m[2]] ?? null;
            if ($huruf === null) {
                throw new RuntimeException('Kolom rumus tidak dikenal: ' . $m[2]);
            }
            return $huruf . ($m[1] === '^' ? $baris - 1 : $baris);
        },
        $tpl
    );
    return (string) preg_replace_callback(
        '/@([A-Za-z0-9_.]+)/',
        static function (array $m) use ($registri): string {
            if (!isset($registri[$m[1]])) {
                throw new RuntimeException('Nama rumus tidak dikenal: ' . $m[1]);
            }
            return $registri[$m[1]];
        },
        (string) $hasil
    );
}

/** Kelompokkan bagian laporan per lembar, mempertahankan urutan. */
function x_kelompok_lembar(array $bagian): array
{
    $lembar = [];
    foreach ($bagian as $b) {
        $lembar[$b['lembar']][] = $b;
    }
    return $lembar;
}

/**
 * Susun satu lembar. Mengembalikan XML lembar kerja.
 * Dua lintasan: (1) beri nomor baris + daftarkan alamat bernama,
 * (2) tulis sel dengan rumus yang sudah diselesaikan.
 */
function x_lembar(array $lap, array $bagianList, bool $aktif): string
{
    $baris = [];      // nomor baris => [kolom => ['xml' => ..]]
    $tinggi = [];     // nomor baris => tinggi khusus
    $registri = [];
    $lebarKolom = [];
    $bekuBaris = null;

    $taruh = static function (int $r, int $c, string $xml) use (&$baris): void {
        $baris[$r][$c] = $xml;
    };
    $teksSel = static function (int $r, int $c, string $nilai, string $gaya): string {
        $alamat = x_huruf($c) . $r;
        if ($nilai === '') {
            return '<c r="' . $alamat . '" s="' . x_gaya_idx($gaya) . '"/>';
        }
        return '<c r="' . $alamat . '" s="' . x_gaya_idx($gaya) . '" t="inlineStr"><is><t xml:space="preserve">' . x_esc($nilai) . '</t></is></c>';
    };
    $angkaSel = static function (int $r, int $c, int|float $nilai, string $gaya, ?string $rumus = null): string {
        $alamat = x_huruf($c) . $r;
        $v = is_float($nilai) ? rtrim(rtrim(sprintf('%.10F', $nilai), '0'), '.') : (string) $nilai;
        $v = $v === '' ? '0' : $v;
        return '<c r="' . $alamat . '" s="' . x_gaya_idx($gaya) . '">'
            . ($rumus !== null ? '<f>' . x_esc($rumus) . '</f>' : '') . '<v>' . $v . '</v></c>';
    };
    $perlebar = static function (int $c, float $lebar) use (&$lebarKolom): void {
        $lebarKolom[$c] = max($lebarKolom[$c] ?? 0.0, $lebar);
    };

    // ---- kepala lembar (baris 1-3)
    $taruh(1, 0, $teksSel(1, 0, $lap['judul'] . ' - ' . $lap['posLabel'], 'judul'));
    $taruh(2, 0, $teksSel(2, 0, 'Periode: ' . $lap['periodeTeks'], 'meta'));
    $taruh(3, 0, $teksSel(3, 0, 'Dibuat oleh ' . $lap['dibuat']['oleh'] . ' (' . $lap['dibuat']['jabatan'] . ') pada ' . $lap['dibuat']['waktuTeks']
        . '. Angka diambil dari database; total, selisih, saldo, porsi, dan tunggakan berupa rumus.', 'meta'));
    $tinggi[1] = 24;

    // ---- lintasan 1: rencana baris
    $r = 5;
    $rencana = [];
    foreach ($bagianList as $b) {
        $p = ['bagian' => $b];
        $p['judul'] = $r++;
        $p['catatan'] = $r++;
        if (isset($b['param']['nominal'])) {
            $p['param'] = $r++;
            $registri['nominal'] = '$B$' . $p['param'];
        }
        $p['head'] = $r++;
        $jumlahBaris = max(1, count($b['baris']));
        $p['awal'] = $r;
        $r += $jumlahBaris;
        $p['akhir'] = $r - 1;
        $p['total'] = is_array($b['total'] ?? null) ? $r++ : null;
        $r++; // baris kosong
        $rencana[] = $p;

        $huruf = [];
        foreach ($b['kolom'] as $i => $k) {
            $huruf[$k['k']] = x_huruf($i);
        }
        // alamat bernama dari baris ('reg' => [kolom => nama])
        foreach ($b['baris'] as $n => $row) {
            foreach ($row['reg'] ?? [] as $kolom => $nama) {
                $registri[$nama] = '$' . $huruf[$kolom] . '$' . ($p['awal'] + $n);
            }
        }
        if ($p['total'] !== null) {
            foreach ($b['kolom'] as $i => $k) {
                $registri['T.' . $b['kode'] . '.' . $k['k']] = '$' . x_huruf($i) . '$' . $p['total'];
            }
        }
    }

    // ---- lintasan 2: tulis sel
    foreach ($rencana as $p) {
        $b = $p['bagian'];
        $kolom = $b['kolom'];
        $huruf = [];
        foreach ($kolom as $i => $k) {
            $huruf[$k['k']] = x_huruf($i);
        }

        $taruh($p['judul'], 0, $teksSel($p['judul'], 0, (string) $b['judul'], 'bagian'));
        $tinggi[$p['judul']] = 20;
        $taruh($p['catatan'], 0, $teksSel($p['catatan'], 0, (string) ($b['catatan'] ?? ''), 'catatan'));

        if (isset($p['param'])) {
            $taruh($p['param'], 0, $teksSel($p['param'], 0, 'Nominal per periode (Rp)', 'param_label'));
            $taruh($p['param'], 1, $angkaSel($p['param'], 1, (int) $b['param']['nominal'], 'param_nilai'));
        }

        foreach ($kolom as $i => $k) {
            $gaya = ['kanan' => 'head_kanan', 'tengah' => 'head_tengah'][$k['r']] ?? 'head_kiri';
            $taruh($p['head'], $i, $teksSel($p['head'], $i, (string) $k['l'], $gaya));
            $perlebar($i, mb_strlen((string) $k['l']) * 1.05 + 3);
        }
        $tinggi[$p['head']] = 30;

        if ($b['baris'] === []) {
            $taruh($p['awal'], 0, $teksSel($p['awal'], 0, 'Tidak ada data pada periode ini.', 'teks'));
            foreach ($kolom as $i => $k) {
                if ($i > 0) {
                    $taruh($p['awal'], $i, $teksSel($p['awal'], $i, '', 'teks'));
                }
            }
        }

        foreach ($b['baris'] as $n => $row) {
            $rr = $p['awal'] + $n;
            foreach ($kolom as $i => $k) {
                $nilai = $row[$k['k']] ?? null;
                $tebal = !empty($row['tebal']);
                $rumus = $row['f_' . $k['k']] ?? ($k['f'] ?? null);
                $rumus = $rumus !== null ? x_rumus($rumus, $rr, $huruf, $registri) : null;

                switch ($k['t']) {
                    case 'rupiah':
                        $taruh($rr, $i, $angkaSel($rr, $i, (int) ($nilai ?? 0), $tebal ? 'rupiah_tebal' : 'rupiah', $rumus));
                        $perlebar($i, 16);
                        break;
                    case 'angka':
                        $taruh($rr, $i, $angkaSel($rr, $i, (int) ($nilai ?? 0), $k['r'] === 'tengah' ? 'angka_tengah' : 'angka', $rumus));
                        $perlebar($i, 9);
                        break;
                    case 'persen':
                        $taruh($rr, $i, $angkaSel($rr, $i, round(((float) ($nilai ?? 0)) / 100, 6), 'persen', $rumus));
                        $perlebar($i, 9);
                        break;
                    case 'tanggal':
                        if ($nilai === null || $nilai === '') {
                            $taruh($rr, $i, $teksSel($rr, $i, '-', 'tengah'));
                        } else {
                            $taruh($rr, $i, $angkaSel($rr, $i, x_serial((string) $nilai), $k['r'] === 'tengah' ? 'tanggal_tengah' : 'tanggal'));
                        }
                        $perlebar($i, 14);
                        break;
                    case 'status':
                        $taruh($rr, $i, $teksSel($rr, $i, (string) ($nilai ?? ''), 'tengah'));
                        $perlebar($i, 14);
                        break;
                    default:
                        $taruh($rr, $i, $teksSel($rr, $i, (string) ($nilai ?? ''), $tebal ? 'teks_tebal' : 'teks'));
                        $perlebar($i, min(46.0, mb_strlen((string) ($nilai ?? '')) * 1.05 + 3));
                }
            }
        }

        if ($p['total'] !== null) {
            $rt = $p['total'];
            $tot = $b['total'];
            $pertama = count($kolom);
            foreach ($kolom as $i => $k) {
                if (!empty($k['s'])) {
                    $pertama = $i;
                    break;
                }
            }
            $adaIsi = $b['baris'] !== [];
            foreach ($kolom as $i => $k) {
                if ($i === 0) {
                    $taruh($rt, 0, $teksSel($rt, 0, (string) ($tot['label'] ?? 'Jumlah'), 'tot_label'));
                } elseif ($i < $pertama || !array_key_exists($k['k'], $tot)) {
                    $taruh($rt, $i, $teksSel($rt, $i, '', 'tot_kosong'));
                } else {
                    $h = $huruf[$k['k']];
                    $rumus = !empty($k['s']) ? 'SUM(' . $h . $p['awal'] . ':' . $h . $p['akhir'] . ')' : null;
                    $gaya = match ($k['t']) {
                        'rupiah' => 'tot_rupiah', 'persen' => 'tot_persen', default => 'tot_angka',
                    };
                    $nilai = $k['t'] === 'persen' ? round(((float) $tot[$k['k']]) / 100, 6) : (int) $tot[$k['k']];
                    $taruh($rt, $i, $angkaSel($rt, $i, $nilai, $gaya, $adaIsi || $rumus === null ? $rumus : null));
                }
            }
            $tinggi[$rt] = 20;
        }

        // lembar dengan satu tabel: bekukan sampai judul kolom
        if (count($bagianList) === 1) {
            $bekuBaris = $p['head'];
        }
    }

    // ---- rakit XML
    ksort($baris);
    $data = '';
    $maksBaris = 1;
    $maksKolom = 0;
    foreach ($baris as $nr => $sel) {
        ksort($sel);
        $ht = isset($tinggi[$nr]) ? ' ht="' . $tinggi[$nr] . '" customHeight="1"' : '';
        $data .= '<row r="' . $nr . '"' . $ht . '>' . implode('', $sel) . '</row>';
        $maksBaris = max($maksBaris, $nr);
        $maksKolom = max($maksKolom, max(array_keys($sel)));
    }

    $kol = '';
    ksort($lebarKolom);
    for ($c = 0; $c <= $maksKolom; $c++) {
        $w = max(10.0, min(50.0, $lebarKolom[$c] ?? 12.0));
        $kol .= '<col min="' . ($c + 1) . '" max="' . ($c + 1) . '" width="' . sprintf('%.2F', $w) . '" customWidth="1"/>';
    }

    $pane = $bekuBaris !== null
        ? '<pane ySplit="' . $bekuBaris . '" topLeftCell="A' . ($bekuBaris + 1) . '" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A' . ($bekuBaris + 1) . '" sqref="A' . ($bekuBaris + 1) . '"/>'
        : '';

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        . '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'
        . '<dimension ref="A1:' . x_huruf($maksKolom) . $maksBaris . '"/>'
        . '<sheetViews><sheetView showGridLines="0"' . ($aktif ? ' tabSelected="1"' : '') . ' workbookViewId="0">' . $pane . '</sheetView></sheetViews>'
        . '<sheetFormatPr defaultRowHeight="15"/>'
        . '<cols>' . $kol . '</cols>'
        . '<sheetData>' . $data . '</sheetData>'
        . '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>'
        . '<pageSetup paperSize="9" orientation="portrait" fitToHeight="0"/>'
        . '</worksheet>';
}

/* ---------------------------------------------------------------------
   Berkas .xlsx
--------------------------------------------------------------------- */

function xlsx_laporan(array $lap): string
{
    $lembar = x_kelompok_lembar($lap['bagian']);
    $zip = new XlsxZip();

    $tipe = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        . '<Default Extension="xml" ContentType="application/xml"/>'
        . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        . '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        . '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>';
    $nomor = 0;
    foreach ($lembar as $_) {
        $nomor++;
        $tipe .= '<Override PartName="/xl/worksheets/sheet' . $nomor . '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
    }
    $tipe .= '</Types>';
    $zip->tambah('[Content_Types].xml', $tipe);

    $zip->tambah('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        . '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
        . '</Relationships>');

    $sekarangUtc = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
    $zip->tambah('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        . '<dc:title>' . x_esc($lap['judul'] . ' - ' . $lap['posLabel']) . '</dc:title>'
        . '<dc:creator>' . x_esc($lap['kelas']) . '</dc:creator>'
        . '<cp:lastModifiedBy>' . x_esc($lap['kelas']) . '</cp:lastModifiedBy>'
        . '<dcterms:created xsi:type="dcterms:W3CDTF">' . $sekarangUtc . '</dcterms:created>'
        . '<dcterms:modified xsi:type="dcterms:W3CDTF">' . $sekarangUtc . '</dcterms:modified>'
        . '</cp:coreProperties>');
    $zip->tambah('docProps/app.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>' . x_esc($lap['kelas']) . '</Application></Properties>');

    $sheets = '';
    $rels = '';
    $nomor = 0;
    foreach ($lembar as $nama => $bagianList) {
        $nomor++;
        $sheets .= '<sheet name="' . x_esc((string) $nama) . '" sheetId="' . $nomor . '" r:id="rId' . $nomor . '"/>';
        $rels .= '<Relationship Id="rId' . $nomor . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' . $nomor . '.xml"/>';
        $zip->tambah('xl/worksheets/sheet' . $nomor . '.xml', x_lembar($lap, $bagianList, $nomor === 1));
    }
    $rels .= '<Relationship Id="rId' . ($nomor + 1) . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';

    $zip->tambah('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        . '<bookViews><workbookView activeTab="0"/></bookViews>'
        . '<sheets>' . $sheets . '</sheets>'
        . '<calcPr calcId="191029" fullCalcOnLoad="1"/>'
        . '</workbook>');
    $zip->tambah('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' . $rels . '</Relationships>');
    $zip->tambah('xl/styles.xml', x_styles());

    return $zip->bangun();
}
