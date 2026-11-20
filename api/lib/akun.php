<?php
declare(strict_types=1);
defined('KAS_APP') or exit;

/* =====================================================================
   AKUN: ganti username / password (pemilik akun) dan kelola akun
   (reset / hapus, khusus bendahara)
===================================================================== */

/** Pastikan password saat ini benar; percobaan salah dibatasi. */
function verifikasi_password_akun(array $u, mixed $password): void
{
    batas_cek('verif', (string) $u['id']);
    if (!is_string($password) || $password === '' || !password_verify($password, $u['pass_hash'])) {
        batas_catat('verif', (string) $u['id']);
        throw new ApiError('Password salah.', 403, 'password');
    }
    batas_bersihkan('verif', (string) $u['id']);
}

function aksi_ganti_username(): void
{
    $u = wajib_login();
    $in = badan();

    verifikasi_password_akun($u, $in['password'] ?? null);

    $baru = validasi_username(teks($in, 'username', 50));
    if ($baru === $u['username']) {
        throw new ApiError('Username baru sama dengan username saat ini.', 422, 'username');
    }
    $dipakai = q(
        'SELECT 1 FROM `accounts` WHERE `username` = ? AND `id` <> ?',
        [$baru, (int) $u['id']]
    )->fetchColumn();
    if ($dipakai) {
        throw new ApiError('Username sudah dipakai.', 409, 'username');
    }

    try {
        q('UPDATE `accounts` SET `username` = ? WHERE `id` = ?', [$baru, (int) $u['id']]);
    } catch (PDOException $e) {
        if ((int) ($e->errorInfo[1] ?? 0) === 1062) {
            throw new ApiError('Username sudah dipakai.', 409, 'username');
        }
        throw $e;
    }
    kirim_json(['ok' => true, 'username' => $baru]);
}

function aksi_ganti_password(): void
{
    $u = wajib_login();
    $in = badan();

    verifikasi_password_akun($u, $in['lama'] ?? null);
    $baru = validasi_password($in['baru'] ?? null, 'Password baru', $u['username']);

    q('UPDATE `accounts` SET `pass_hash` = ? WHERE `id` = ?', [password_hash($baru, PASSWORD_DEFAULT), (int) $u['id']]);
    // perangkat lain yang masih masuk dengan akun ini dikeluarkan
    cabut_sesi_akun($u['id'], session_id());
    kirim_json(['ok' => true]);
}

/** Password sementara acak: 10 karakter, tanpa huruf/angka yang mudah tertukar (0/O, 1/l/I). */
function password_sementara(): string
{
    $abjad = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $maks = strlen($abjad) - 1;
    $hasil = '';
    for ($i = 0; $i < 10; $i++) {
        $hasil .= $abjad[random_int(0, $maks)];
    }
    return $hasil;
}

/**
 * Reset password akun: dibuat password sementara acak yang ditampilkan SEKALI
 * kepada bendahara untuk diberikan ke pemilik akun (yang lalu menggantinya di
 * Pengaturan). Password tetap yang sama untuk semua akun akan membuat akun
 * yang baru direset bisa dimasuki siapa saja yang tahu username-nya.
 */
function aksi_akun_reset(): void
{
    $u = wajib_bendahara();
    $id = id_param(badan());

    $sementara = password_sementara();
    $n = q(
        'UPDATE `accounts` SET `pass_hash` = ? WHERE `id` = ?',
        [password_hash($sementara, PASSWORD_DEFAULT), $id]
    )->rowCount();
    if ($n === 0) {
        throw new ApiError('Akun tidak ditemukan.', 404, 'tidak_ada');
    }
    cabut_sesi_akun((string) $id, (string) $id === $u['id'] ? session_id() : null);
    kirim_json(['ok' => true, 'sementara' => $sementara]);
}

function aksi_akun_hapus(): void
{
    $u = wajib_bendahara();
    $id = id_param(badan());

    if ((string) $id === $u['id']) {
        throw new ApiError('Akun yang sedang kamu pakai tidak bisa dihapus.', 422, 'validasi');
    }
    $n = q('DELETE FROM `accounts` WHERE `id` = ?', [$id])->rowCount();
    if ($n === 0) {
        throw new ApiError('Akun tidak ditemukan.', 404, 'tidak_ada');
    }
    cabut_sesi_akun((string) $id);
    kirim_json(['ok' => true, 'tersedia' => nama_tersedia()]);
}
