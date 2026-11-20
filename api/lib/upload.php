<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   UNGGAHAN GAMBAR (QRIS dan bukti transfer)
   Jenis berkas ditentukan dari ISI berkas (bukan nama / Content-Type
   kiriman klien), dan hanya format gambar raster yang diterima.
===================================================================== */

const GAMBAR_DIIZINKAN = [
    IMAGETYPE_JPEG => 'image/jpeg',
    IMAGETYPE_PNG  => 'image/png',
    IMAGETYPE_GIF  => 'image/gif',
    IMAGETYPE_WEBP => 'image/webp',
];

/** Baca dan periksa gambar dari $_FILES[$kolom]. */
function baca_gambar(string $kolom): array
{
    $f = $_FILES[$kolom] ?? null;
    if (!is_array($f) || !isset($f['error']) || is_array($f['error'])) {
        throw new ApiError('Pilih gambar terlebih dahulu.', 422, 'validasi');
    }

    $maks = (int) cfg('upload_maks_byte', 3 * 1024 * 1024);
    $terlalu = 'Gambar terlalu besar (maksimal ' . round($maks / 1048576, 1) . ' MB). Pilih gambar yang lebih kecil.';

    switch ($f['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            throw new ApiError('Pilih gambar terlebih dahulu.', 422, 'validasi');
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            throw new ApiError($terlalu, 413, 'ukuran');
        default:
            throw new ApiError('Gambar gagal diunggah. Coba lagi.', 400, 'upload');
    }

    if ((int) $f['size'] > $maks) {
        throw new ApiError($terlalu, 413, 'ukuran');
    }
    if (!is_uploaded_file((string) $f['tmp_name'])) {
        throw new ApiError('Gambar gagal diunggah. Coba lagi.', 400, 'upload');
    }

    $info = @getimagesize((string) $f['tmp_name']);
    $tipe = is_array($info) ? (int) $info[2] : 0;
    if (!isset(GAMBAR_DIIZINKAN[$tipe])) {
        throw new ApiError('Format gambar harus JPG, PNG, WEBP, atau GIF.', 415, 'format');
    }
    if ($info[0] > 10000 || $info[1] > 10000) {
        throw new ApiError('Dimensi gambar terlalu besar.', 422, 'ukuran');
    }

    $data = file_get_contents((string) $f['tmp_name']);
    if ($data === false || $data === '') {
        throw new ApiError('Gambar tidak bisa dibaca.', 400, 'upload');
    }
    return ['mime' => GAMBAR_DIIZINKAN[$tipe], 'ukuran' => strlen($data), 'data' => $data];
}

/** Simpan gambar ke tabel uploads dan kembalikan ID-nya. */
function simpan_upload(string $jenis, array $g): int
{
    $st = db()->prepare(
        'INSERT INTO `uploads` (`jenis`, `mime`, `ukuran`, `data`, `created_at`) VALUES (?, ?, ?, ?, ?)'
    );
    $st->bindValue(1, $jenis);
    $st->bindValue(2, $g['mime']);
    $st->bindValue(3, $g['ukuran'], PDO::PARAM_INT);
    $st->bindValue(4, $g['data'], PDO::PARAM_LOB);
    $st->bindValue(5, now_ms(), PDO::PARAM_INT);
    $st->execute();
    return (int) db()->lastInsertId();
}

/** Alamat gambar untuk <img src>. Relatif terhadap halaman index.html. */
function url_upload(int|string $id): string
{
    return 'api/index.php?a=file&id=' . (int) $id;
}
