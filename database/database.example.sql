-- =====================================================================
--  KAS TKJT 1 - skema database + data contoh anonim (MySQL 5.7+ / MySQL 8 / MariaDB 10.3+)
--
--  Cara pakai:
--    1. Buat database kosong (mis. lewat phpMyAdmin: "Baru" -> nama
--       kas_tkjt1 -> susunan karakter utf8mb4_unicode_ci).
--    2. Pilih database itu, buka tab "Impor", lalu pilih berkas ini.
--    3. Sesuaikan akses database di api/config.php.
--
--  Berkas ini aman diimpor ulang: semua tabel memakai IF NOT EXISTS dan
--  data awal memakai INSERT IGNORE, jadi data yang sudah ada tidak hilang.
--  Berkas ini sengaja TIDAK membuat database / memakai USE, supaya bisa
--  diimpor ke database yang disediakan hosting (nama biasanya berawalan).
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
--  Data induk contoh (nama di bawah adalah placeholder, bukan data siswa asli)
-- ---------------------------------------------------------------------

-- Daftar siswa kelas. Urutan no_absen = nomor petak di papan absen.
CREATE TABLE IF NOT EXISTS `siswa` (
  `id`       SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `no_absen` SMALLINT UNSIGNED NOT NULL,
  `nama`     VARCHAR(100)      NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_siswa_nama` (`nama`),
  UNIQUE KEY `uq_siswa_no` (`no_absen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nama yang boleh mendaftar sebagai bendahara, beserta jabatan dan
-- pos dana yang dikelolanya.
CREATE TABLE IF NOT EXISTS `bendahara_master` (
  `id`      TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama`    VARCHAR(100)     NOT NULL,
  `jabatan` VARCHAR(50)      NOT NULL,
  `pos`     ENUM('Rutin','Acara','Kurban') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bendahara_nama` (`nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Akun dan sesi
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `accounts` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role`       ENUM('siswa','bendahara') NOT NULL,
  `nama`       VARCHAR(100)    NOT NULL,
  `username`   VARCHAR(50)     NOT NULL,
  `pass_hash`  VARCHAR(255)    NOT NULL,
  `created_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_accounts_username` (`username`),
  UNIQUE KEY `uq_accounts_role_nama` (`role`, `nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sesi masuk disimpan di database (bukan berkas) supaya tidak bergantung
-- pada folder sesi hosting dan bisa dicabut saat password diganti.
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`         VARCHAR(128)    NOT NULL,
  `account_id` BIGINT UNSIGNED NULL,
  `data`       MEDIUMTEXT      NOT NULL,
  `expires_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_account` (`account_id`),
  KEY `idx_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catatan percobaan gagal (masuk / lupa password) untuk membatasi tebakan.
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip`         VARCHAR(45)     NOT NULL,
  `kunci`      VARCHAR(100)    NOT NULL,
  `created_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_attempts_ip` (`ip`, `created_at`),
  KEY `idx_attempts_kunci` (`kunci`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Berkas gambar (QRIS dan bukti transfer) disimpan sebagai BLOB.
--  Hanya bisa dibuka lewat api/index.php?a=file setelah masuk.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `uploads` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jenis`      ENUM('qris','bukti') NOT NULL,
  `mime`       VARCHAR(50)     NOT NULL,
  `ukuran`     INT UNSIGNED    NOT NULL,
  `data`       MEDIUMBLOB      NOT NULL,
  `created_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pengaturan per pos: nominal, frekuensi, dan gambar QRIS.
CREATE TABLE IF NOT EXISTS `pengaturan_pos` (
  `pos`            ENUM('Rutin','Acara','Kurban') NOT NULL,
  `nominal`        BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `frekuensi`      ENUM('Bulanan','Mingguan','Harian','Sesuai kebutuhan') NOT NULL,
  `qris_upload_id` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`pos`),
  CONSTRAINT `fk_pengaturan_qris` FOREIGN KEY (`qris_upload_id`)
    REFERENCES `uploads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Keuangan
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `kas_masuk` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pos`        ENUM('Rutin','Acara','Kurban') NOT NULL,
  `siswa`      VARCHAR(100)    NOT NULL,
  `tanggal`    DATE            NOT NULL,
  `jumlah`     BIGINT UNSIGNED NOT NULL,
  `metode`     ENUM('Tunai','QRIS') NOT NULL DEFAULT 'Tunai',
  `keterangan` VARCHAR(255)    NOT NULL DEFAULT '',
  `oleh_id`    BIGINT UNSIGNED NULL,
  `created_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_kas_pos_tanggal` (`pos`, `tanggal`),
  KEY `idx_kas_siswa` (`siswa`, `pos`, `tanggal`),
  CONSTRAINT `fk_kas_siswa` FOREIGN KEY (`siswa`)
    REFERENCES `siswa` (`nama`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_kas_oleh` FOREIGN KEY (`oleh_id`)
    REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pengeluaran` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pos`        ENUM('Rutin','Acara','Kurban') NOT NULL,
  `tanggal`    DATE            NOT NULL,
  `kategori`   VARCHAR(50)     NOT NULL,
  `keterangan` VARCHAR(255)    NOT NULL,
  `jumlah`     BIGINT UNSIGNED NOT NULL,
  `oleh_id`    BIGINT UNSIGNED NULL,
  `created_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_keluar_pos_tanggal` (`pos`, `tanggal`),
  CONSTRAINT `fk_keluar_oleh` FOREIGN KEY (`oleh_id`)
    REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `target_pembelian` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pos`           ENUM('Rutin','Acara','Kurban') NOT NULL,
  `nama`          VARCHAR(150)    NOT NULL,
  `jumlah_target` BIGINT UNSIGNED NOT NULL,
  `terkumpul`     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `keterangan`    VARCHAR(255)    NOT NULL DEFAULT '',
  `oleh_id`       BIGINT UNSIGNED NULL,
  `created_at`    BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_target_pos` (`pos`, `created_at`),
  CONSTRAINT `fk_target_oleh` FOREIGN KEY (`oleh_id`)
    REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bukti transfer QRIS yang diunggah siswa dan menunggu diperiksa bendahara.
CREATE TABLE IF NOT EXISTS `bukti_transfer` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pos`            ENUM('Rutin','Acara','Kurban') NOT NULL,
  `siswa`          VARCHAR(100)    NOT NULL,
  `tanggal`        DATE            NOT NULL,
  `jumlah`         BIGINT UNSIGNED NOT NULL,
  `catatan`        VARCHAR(255)    NOT NULL DEFAULT '',
  `upload_id`      BIGINT UNSIGNED NOT NULL,
  `status`         ENUM('pending','diterima','ditolak') NOT NULL DEFAULT 'pending',
  `diperiksa_oleh` BIGINT UNSIGNED NULL,
  `diperiksa_at`   BIGINT UNSIGNED NULL,
  `created_at`     BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bukti_pos_status` (`pos`, `status`),
  KEY `idx_bukti_siswa` (`siswa`, `status`),
  CONSTRAINT `fk_bukti_siswa` FOREIGN KEY (`siswa`)
    REFERENCES `siswa` (`nama`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_bukti_upload` FOREIGN KEY (`upload_id`)
    REFERENCES `uploads` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bukti_pemeriksa` FOREIGN KEY (`diperiksa_oleh`)
    REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pengingat "belum bayar". Satu baris per siswa per pos per periode;
-- mengirim ulang pada periode yang sama memperbarui baris yang ada.
CREATE TABLE IF NOT EXISTS `notifikasi` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tipe`         VARCHAR(20)     NOT NULL DEFAULT 'pengingat',
  `untuk`        VARCHAR(100)    NOT NULL,
  `pos`          ENUM('Rutin','Acara','Kurban') NOT NULL,
  `frek`         ENUM('Harian','Mingguan','Bulanan') NOT NULL,
  `periode`      VARCHAR(20)     NOT NULL,
  `periode_nama` VARCHAR(60)     NOT NULL,
  `jumlah`       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `judul`        VARCHAR(100)    NOT NULL,
  `pesan`        VARCHAR(500)    NOT NULL,
  `dari`         VARCHAR(100)    NOT NULL,
  `jabatan`      VARCHAR(50)     NOT NULL,
  `dibaca`       TINYINT(1)      NOT NULL DEFAULT 0,
  `jumlah_kirim` INT UNSIGNED    NOT NULL DEFAULT 1,
  `created_at`   BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notif_periode` (`untuk`, `pos`, `periode`),
  KEY `idx_notif_pos` (`pos`, `periode`),
  CONSTRAINT `fk_notif_untuk` FOREIGN KEY (`untuk`)
    REFERENCES `siswa` (`nama`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
--  Data awal anonim untuk contoh. Ganti nama placeholder secara lokal
--  sebelum dipakai oleh kelas; jangan commit daftar nama pribadi ke repo publik.
-- ---------------------------------------------------------------------

INSERT IGNORE INTO `pengaturan_pos` (`pos`, `nominal`, `frekuensi`) VALUES
  ('Rutin',  15000, 'Bulanan'),
  ('Acara',      0, 'Sesuai kebutuhan'),
  ('Kurban',  1000, 'Harian');

INSERT IGNORE INTO `bendahara_master` (`nama`, `jabatan`, `pos`) VALUES
  ('Bendahara Kas Rutin',  'Bendahara Utama',  'Rutin'),
  ('Bendahara Dana Acara',  'Bendahara Acara',  'Acara'),
  ('Bendahara Dana Kurban', 'Bendahara Kurban', 'Kurban');

INSERT IGNORE INTO `siswa` (`no_absen`, `nama`) VALUES
  ( 1, 'SISWA 01'),
  ( 2, 'SISWA 02'),
  ( 3, 'SISWA 03'),
  ( 4, 'SISWA 04'),
  ( 5, 'SISWA 05'),
  ( 6, 'SISWA 06'),
  ( 7, 'SISWA 07'),
  ( 8, 'SISWA 08'),
  ( 9, 'SISWA 09'),
  (10, 'SISWA 10'),
  (11, 'SISWA 11'),
  (12, 'SISWA 12'),
  (13, 'SISWA 13'),
  (14, 'SISWA 14'),
  (15, 'SISWA 15'),
  (16, 'SISWA 16'),
  (17, 'SISWA 17'),
  (18, 'SISWA 18'),
  (19, 'SISWA 19'),
  (20, 'SISWA 20'),
  (21, 'SISWA 21'),
  (22, 'SISWA 22'),
  (23, 'SISWA 23'),
  (24, 'SISWA 24'),
  (25, 'SISWA 25'),
  (26, 'SISWA 26'),
  (27, 'SISWA 27'),
  (28, 'SISWA 28'),
  (29, 'SISWA 29'),
  (30, 'SISWA 30'),
  (31, 'SISWA 31'),
  (32, 'SISWA 32'),
  (33, 'SISWA 33'),
  (34, 'SISWA 34'),
  (35, 'SISWA 35'),
  (36, 'SISWA 36'),
  (37, 'SISWA 37'),
  (38, 'SISWA 38');
