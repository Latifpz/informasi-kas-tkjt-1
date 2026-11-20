<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   PDF LAPORAN
   Penulis PDF kecil tanpa pustaka luar: A4, huruf baku Helvetica (tidak
   perlu disematkan), tabel dengan teks yang dibungkus, judul kolom yang
   diulang di setiap halaman, dan nomor halaman "x dari n".
   Teks diubah ke Windows-1252; karakter di luar itu (mis. emoji) tampil "?".
   Lebar huruf di bawah diambil dari metrik AFM Helvetica resmi (kode 32-255).
===================================================================== */

final class PdfDokumen
{
    public const LEBAR  = 595.28;
    public const TINGGI = 841.89;
    public const MARGIN = 40.0;
    public const ATAS   = 46.0;
    public const BAWAH  = 52.0;

    /** Lebar tiap huruf per 1000 satuan, kode 32..255 (Helvetica). */
    private const LEBAR_REG = [
        278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
        556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
        1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
        667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
        333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
        556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 761,
        556, 278, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 278, 611, 278,
        278, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 278, 500, 667,
        278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333,
        400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611,
        667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
        722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
        556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278,
        556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500,
    ];

    /** Sama untuk Helvetica-Bold. */
    private const LEBAR_TEBAL = [
        278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
        556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
        975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
        667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
        333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
        611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 761,
        556, 278, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 278, 611, 278,
        278, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 278, 500, 667,
        278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333,
        400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611,
        722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
        722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
        556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278,
        611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556,
    ];

    /** @var string[] isi halaman yang sudah selesai */
    private array $halaman = [];
    private string $isi = '';

    /** Posisi kursor vertikal, dihitung dari tepi atas halaman (pt). */
    public float $y = 0.0;

    public function __construct(private string $judul, private string $penulis)
    {
        $this->y = self::ATAS;
    }

    public function halamanBaru(): void
    {
        $this->halaman[] = $this->isi;
        $this->isi = '';
        $this->y = self::ATAS;
    }

    /** Sisa ruang vertikal di halaman ini (pt). */
    public function sisa(): float
    {
        return self::TINGGI - self::BAWAH - $this->y;
    }

    public static function kodekan(string $s): string
    {
        $s = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s) ?? '';
        $e = mb_convert_encoding($s, 'Windows-1252', 'UTF-8');
        return is_string($e) ? $e : '?';
    }

    public function lebar(string $s, float $ukuran, bool $tebal = false): float
    {
        $t = self::kodekan($s);
        $tabel = $tebal ? self::LEBAR_TEBAL : self::LEBAR_REG;
        $w = 0;
        $n = strlen($t);
        for ($i = 0; $i < $n; $i++) {
            $c = ord($t[$i]);
            $w += $c >= 32 ? ($tabel[$c - 32] ?? 556) : 0;
        }
        return $w * $ukuran / 1000.0;
    }

    /** Pecah teks menjadi baris-baris yang muat dalam $maks (pt). */
    public function bungkus(string $s, float $maks, float $ukuran, bool $tebal = false): array
    {
        $s = trim((string) preg_replace('/\s+/u', ' ', $s));
        if ($s === '') {
            return [''];
        }
        $baris = [];
        $kini = '';
        foreach (explode(' ', $s) as $kata) {
            // kata yang lebih lebar dari kolom dipotong per huruf
            while ($this->lebar($kata, $ukuran, $tebal) > $maks) {
                $potong = '';
                foreach (mb_str_split($kata) as $h) {
                    if ($this->lebar($potong . $h, $ukuran, $tebal) > $maks && $potong !== '') {
                        break;
                    }
                    $potong .= $h;
                }
                if ($kini !== '') {
                    $baris[] = $kini;
                    $kini = '';
                }
                $baris[] = $potong;
                $kata = mb_substr($kata, mb_strlen($potong));
                if ($kata === '') {
                    continue 2;
                }
            }
            $coba = $kini === '' ? $kata : $kini . ' ' . $kata;
            if ($kini !== '' && $this->lebar($coba, $ukuran, $tebal) > $maks) {
                $baris[] = $kini;
                $kini = $kata;
            } else {
                $kini = $coba;
            }
        }
        if ($kini !== '') {
            $baris[] = $kini;
        }
        return $baris ?: [''];
    }

    /** Tulis teks; $yBasis = posisi garis dasar huruf dari atas halaman. */
    public function teks(float $x, float $yBasis, string $s, float $ukuran, bool $tebal = false, array $warna = [0.0, 0.0, 0.0]): void
    {
        $t = strtr(self::kodekan($s), ['\\' => '\\\\', '(' => '\\(', ')' => '\\)']);
        $this->isi .= sprintf(
            "BT /%s %.2F Tf %.3F %.3F %.3F rg %.2F %.2F Td (%s) Tj ET\n",
            $tebal ? 'F2' : 'F1', $ukuran, $warna[0], $warna[1], $warna[2], $x, self::TINGGI - $yBasis, $t
        );
    }

    public function teksKanan(float $xKanan, float $yBasis, string $s, float $ukuran, bool $tebal = false, array $warna = [0.0, 0.0, 0.0]): void
    {
        $this->teks($xKanan - $this->lebar($s, $ukuran, $tebal), $yBasis, $s, $ukuran, $tebal, $warna);
    }

    public function teksTengah(float $xTengah, float $yBasis, string $s, float $ukuran, bool $tebal = false, array $warna = [0.0, 0.0, 0.0]): void
    {
        $this->teks($xTengah - $this->lebar($s, $ukuran, $tebal) / 2, $yBasis, $s, $ukuran, $tebal, $warna);
    }

    public function kotak(float $x, float $yAtas, float $w, float $h, array $warna): void
    {
        $this->isi .= sprintf(
            "%.3F %.3F %.3F rg %.2F %.2F %.2F %.2F re f\n",
            $warna[0], $warna[1], $warna[2], $x, self::TINGGI - $yAtas - $h, $w, $h
        );
    }

    public function garis(float $x1, float $y1, float $x2, float $y2, float $tebal, array $warna): void
    {
        $this->isi .= sprintf(
            "%.3F %.3F %.3F RG %.2F w %.2F %.2F m %.2F %.2F l S\n",
            $warna[0], $warna[1], $warna[2], $tebal, $x1, self::TINGGI - $y1, $x2, self::TINGGI - $y2
        );
    }

    private static function hexUtf16(string $s): string
    {
        return '<FEFF' . strtoupper(bin2hex((string) mb_convert_encoding($s, 'UTF-16BE', 'UTF-8'))) . '>';
    }

    /** Susun berkas PDF. $kakiKiri = teks kaki di kiri setiap halaman. */
    public function keluarkan(string $kakiKiri): string
    {
        $this->halaman[] = $this->isi;
        $this->isi = '';
        $n = count($this->halaman);

        foreach ($this->halaman as $i => $isi) {
            $this->isi = '';
            $this->garis(self::MARGIN, self::TINGGI - 38, self::LEBAR - self::MARGIN, self::TINGGI - 38, 0.5, [0.78, 0.82, 0.8]);
            $this->teks(self::MARGIN, self::TINGGI - 27, $kakiKiri, 7.5, false, [0.35, 0.4, 0.38]);
            $this->teksKanan(self::LEBAR - self::MARGIN, self::TINGGI - 27, 'Halaman ' . ($i + 1) . ' dari ' . $n, 7.5, false, [0.35, 0.4, 0.38]);
            $this->halaman[$i] = $isi . $this->isi;
        }

        $kompres = function_exists('gzcompress');
        $objek = [];
        $objek[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $anak = [];
        for ($i = 0; $i < $n; $i++) {
            $anak[] = (6 + 2 * $i) . ' 0 R';
        }
        $objek[2] = '<< /Type /Pages /Kids [' . implode(' ', $anak) . '] /Count ' . $n . ' >>';
        $objek[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objek[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

        $kini = new DateTimeImmutable('now');
        $tgl = "D:" . $kini->format('YmdHis') . str_replace(':', "'", $kini->format('P')) . "'";
        $objek[5] = '<< /Title ' . self::hexUtf16($this->judul) . ' /Author ' . self::hexUtf16($this->penulis)
            . ' /Creator ' . self::hexUtf16('Informasi Kas X TKJT 1') . ' /Producer ' . self::hexUtf16('Informasi Kas X TKJT 1')
            . ' /CreationDate (' . $tgl . ') >>';

        foreach ($this->halaman as $i => $isi) {
            $idHal = 6 + 2 * $i;
            $idIsi = 7 + 2 * $i;
            $objek[$idHal] = sprintf(
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.2F %.2F] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents %d 0 R >>',
                self::LEBAR, self::TINGGI, $idIsi
            );
            if ($kompres) {
                $data = (string) gzcompress($isi, 6);
                $objek[$idIsi] = '<< /Length ' . strlen($data) . " /Filter /FlateDecode >>\nstream\n" . $data . "\nendstream";
            } else {
                $objek[$idIsi] = '<< /Length ' . strlen($isi) . " >>\nstream\n" . $isi . "\nendstream";
            }
        }

        $out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $posisi = [];
        ksort($objek);
        foreach ($objek as $id => $badan) {
            $posisi[$id] = strlen($out);
            $out .= $id . " 0 obj\n" . $badan . "\nendobj\n";
        }
        $xref = strlen($out);
        $maks = max(array_keys($objek));
        $out .= "xref\n0 " . ($maks + 1) . "\n0000000000 65535 f \n";
        for ($id = 1; $id <= $maks; $id++) {
            $out .= sprintf("%010d 00000 n \n", $posisi[$id]);
        }
        $out .= "trailer\n<< /Size " . ($maks + 1) . " /Root 1 0 R /Info 5 0 R >>\nstartxref\n" . $xref . "\n%%EOF\n";
        return $out;
    }
}

/* ---------------------------------------------------------------------
   Tata letak laporan
--------------------------------------------------------------------- */

const PDF_HIJAU    = [0.090, 0.412, 0.353];   // #17695a (warna utama aplikasi)
const PDF_HIJAU_MUDA = [0.890, 0.945, 0.925]; // #e3f1ec
const PDF_ZEBRA    = [0.965, 0.973, 0.965];
const PDF_TEKS     = [0.078, 0.188, 0.165];   // #14302a
const PDF_ABU      = [0.337, 0.435, 0.408];   // #566f68
const PDF_GARIS    = [0.827, 0.867, 0.839];   // #d3ddd6

/** Teks sel sesuai tipe kolomnya. */
function pdf_sel(string $tipe, mixed $nilai): string
{
    if ($nilai === null || $nilai === '') {
        return $tipe === 'tanggal' ? '-' : '';
    }
    return match ($tipe) {
        'rupiah', 'angka' => number_format((int) $nilai, 0, ',', '.'),
        'persen'  => number_format((float) $nilai, 1, ',', '.') . '%',
        'tanggal' => tgl_singkat((string) $nilai),
        default   => (string) $nilai,
    };
}

function pdf_laporan(array $lap): string
{
    $pdf = new PdfDokumen($lap['judul'] . ' - ' . $lap['posLabel'], $lap['kelas']);
    $lebar = PdfDokumen::LEBAR - 2 * PdfDokumen::MARGIN;
    $kiri = PdfDokumen::MARGIN;

    // ---- kepala laporan
    $pdf->teks($kiri, $pdf->y + 8, $lap['kelas'], 9, true, PDF_HIJAU);
    $pdf->y += 26;
    $pdf->teks($kiri, $pdf->y, $lap['judul'], 18, true, PDF_TEKS);
    $pdf->y += 17;
    $pdf->teks($kiri, $pdf->y, $lap['posLabel'] . '  -  ' . $lap['periodeTeks'], 10.5, false, PDF_TEKS);
    $pdf->y += 9;
    $pdf->garis($kiri, $pdf->y, $kiri + $lebar, $pdf->y, 1.2, PDF_HIJAU);
    $pdf->y += 13;
    $d = $lap['dibuat'];
    $pdf->teks($kiri, $pdf->y, 'Dibuat oleh ' . $d['oleh'] . ' (' . $d['jabatan'] . ') pada ' . $d['waktuTeks'], 8, false, PDF_ABU);
    $pdf->y += 10;
    $pdf->teks($kiri, $pdf->y, 'Angka dihitung langsung dari database kas pada saat laporan dibuat.', 8, false, PDF_ABU);
    $pdf->y += 12;

    foreach ($lap['bagian'] as $bagian) {
        pdf_bagian($pdf, $bagian);
    }

    return $pdf->keluarkan($lap['kelas'] . '  -  ' . $lap['judul'] . ' ' . $lap['posLabel']);
}

function pdf_bagian(PdfDokumen $pdf, array $b): void
{
    $kiri = PdfDokumen::MARGIN;
    $lebarIsi = PdfDokumen::LEBAR - 2 * PdfDokumen::MARGIN;
    $ukuran = 8.0;
    $leading = 10.4;
    $padX = 3.6;
    $padY = 3.2;

    $kolom = $b['kolom'];
    $jumlahBobot = 0.0;
    foreach ($kolom as $k) {
        $jumlahBobot += (float) $k['w'];
    }
    $lebarKolom = [];
    foreach ($kolom as $i => $k) {
        $lebarKolom[$i] = $lebarIsi * ((float) $k['w'] / $jumlahBobot);
    }

    // tinggi baris judul kolom
    $hJudul = 0.0;
    $judulBaris = [];
    foreach ($kolom as $i => $k) {
        $judulBaris[$i] = $pdf->bungkus((string) $k['l'], $lebarKolom[$i] - 2 * $padX, $ukuran, true);
        $hJudul = max($hJudul, count($judulBaris[$i]) * $leading + 2 * $padY);
    }

    // judul bagian + catatan: minimal sisakan ruang untuk judul kolom dan satu baris data
    $catatan = $pdf->bungkus((string) ($b['catatan'] ?? ''), $lebarIsi, 8.0, false);
    $tinggiKepala = 22 + (($b['catatan'] ?? '') !== '' ? count($catatan) * 10.5 + 4 : 0);
    if ($pdf->sisa() < $tinggiKepala + $hJudul + 3 * $leading + 4) {
        $pdf->halamanBaru();
    } else {
        $pdf->y += 8;
    }

    $pdf->teks($kiri, $pdf->y + 11, (string) $b['judul'], 11.5, true, PDF_TEKS);
    $pdf->y += 17;
    if (($b['catatan'] ?? '') !== '') {
        foreach ($catatan as $baris) {
            $pdf->teks($kiri, $pdf->y + 7, $baris, 8, false, PDF_ABU);
            $pdf->y += 10.5;
        }
        $pdf->y += 4;
    }

    $gambarJudul = function () use ($pdf, $kolom, $lebarKolom, $judulBaris, $hJudul, $kiri, $lebarIsi, $ukuran, $leading, $padX, $padY): void {
        $pdf->kotak($kiri, $pdf->y, $lebarIsi, $hJudul, PDF_HIJAU);
        $x = $kiri;
        foreach ($kolom as $i => $k) {
            $yb = $pdf->y + $padY + $ukuran;
            foreach ($judulBaris[$i] as $baris) {
                match ($k['r']) {
                    'kanan'  => $pdf->teksKanan($x + $lebarKolom[$i] - $padX, $yb, $baris, $ukuran, true, [1, 1, 1]),
                    'tengah' => $pdf->teksTengah($x + $lebarKolom[$i] / 2, $yb, $baris, $ukuran, true, [1, 1, 1]),
                    default  => $pdf->teks($x + $padX, $yb, $baris, $ukuran, true, [1, 1, 1]),
                };
                $yb += $leading;
            }
            $x += $lebarKolom[$i];
        }
        $pdf->y += $hJudul;
    };
    $gambarJudul();

    $baris = $b['baris'];
    if ($baris === []) {
        $h = $leading + 2 * $padY + 4;
        $pdf->teks($kiri + $padX, $pdf->y + $padY + $ukuran + 2, 'Tidak ada data pada periode ini.', $ukuran, false, PDF_ABU);
        $pdf->garis($kiri, $pdf->y + $h, $kiri + $lebarIsi, $pdf->y + $h, 0.5, PDF_GARIS);
        $pdf->y += $h;
    }

    foreach ($baris as $no => $row) {
        // bungkus tiap sel; tinggi baris mengikuti sel terpanjang
        $sel = [];
        $h = 0.0;
        foreach ($kolom as $i => $k) {
            $teks = pdf_sel((string) $k['t'], $row[$k['k']] ?? null);
            $sel[$i] = $k['t'] === 'teks' || $k['t'] === 'status'
                ? $pdf->bungkus($teks, $lebarKolom[$i] - 2 * $padX, $ukuran, false)
                : [$teks];
            $h = max($h, count($sel[$i]) * $leading + 2 * $padY);
        }
        if ($pdf->sisa() < $h) {
            $pdf->halamanBaru();
            $gambarJudul();
        }
        if ($no % 2 === 1) {
            $pdf->kotak($kiri, $pdf->y, $lebarIsi, $h, PDF_ZEBRA);
        }
        $x = $kiri;
        foreach ($kolom as $i => $k) {
            $yb = $pdf->y + $padY + $ukuran;
            $tebal = !empty($row['tebal']);
            foreach ($sel[$i] as $teksBaris) {
                match ($k['r']) {
                    'kanan'  => $pdf->teksKanan($x + $lebarKolom[$i] - $padX, $yb, $teksBaris, $ukuran, $tebal, PDF_TEKS),
                    'tengah' => $pdf->teksTengah($x + $lebarKolom[$i] / 2, $yb, $teksBaris, $ukuran, $tebal, PDF_TEKS),
                    default  => $pdf->teks($x + $padX, $yb, $teksBaris, $ukuran, $tebal, PDF_TEKS),
                };
                $yb += $leading;
            }
            $x += $lebarKolom[$i];
        }
        $pdf->garis($kiri, $pdf->y + $h, $kiri + $lebarIsi, $pdf->y + $h, 0.4, PDF_GARIS);
        $pdf->y += $h;
    }

    // baris total: label menjangkau semua kolom sebelum kolom jumlah pertama
    if (is_array($b['total'] ?? null)) {
        $pertama = count($kolom);
        foreach ($kolom as $i => $k) {
            if (!empty($k['s'])) {
                $pertama = $i;
                break;
            }
        }
        $h = $leading + 2 * $padY + 1;
        if ($pdf->sisa() < $h) {
            $pdf->halamanBaru();
            $gambarJudul();
        }
        $pdf->kotak($kiri, $pdf->y, $lebarIsi, $h, PDF_HIJAU_MUDA);
        $pdf->garis($kiri, $pdf->y, $kiri + $lebarIsi, $pdf->y, 0.9, PDF_HIJAU);
        $yb = $pdf->y + $padY + $ukuran + 0.5;
        $pdf->teks($kiri + $padX, $yb, (string) ($b['total']['label'] ?? 'Jumlah'), $ukuran, true, PDF_TEKS);
        $x = $kiri;
        foreach ($kolom as $i => $k) {
            if ($i >= $pertama && !empty($k['s']) && array_key_exists($k['k'], $b['total'])) {
                $pdf->teksKanan($x + $lebarKolom[$i] - $padX, $yb, pdf_sel((string) $k['t'], $b['total'][$k['k']]), $ukuran, true, PDF_TEKS);
            }
            $x += $lebarKolom[$i];
        }
        $pdf->y += $h;
    }
    $pdf->y += 4;
}
