/* ============================================================
   KAS TKJT 1
   MOBILE MENU HAMBURGER
   KURBAN Rp1.000 PER HARI
============================================================ */

const SISWA_MASTER = Array.from({ length: 38 }, (_, i) =>
  `SISWA ${String(i + 1).padStart(2, "0")}`,
);

const BENDAHARA_MASTER = [
  { nama: "Bendahara Kas Rutin", jabatan: "Bendahara Utama" },
  { nama: "Bendahara Dana Acara", jabatan: "Bendahara Acara" },
  { nama: "Bendahara Dana Kurban", jabatan: "Bendahara Kurban" },
];

const KATEGORI_PENGELUARAN = [
  "Konsumsi",
  "ATK DAN PERLENGKAPAN",
  "Kebersihan",
  "Lainnya",
];

/* ============================================================
   IKON
   Ikon garis (SVG) yang digambar sendiri, tanpa pustaka luar.
   Warnanya mengikuti warna teks (currentColor), jadi ikut
   berubah di tema gelap/terang dan tampil sama di semua HP
   (emoji tampil berbeda di tiap perangkat).
   Pakai: icon("lonceng")  atau  icon("centang", "ico-sm")
============================================================ */

const ICONS = {
  dashboard:
    '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
  masuk:
    '<path d="M12 4v10m0 0 4-4m-4 4-4-4"/><path d="M4.5 15v2.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V15"/>',
  keluar:
    '<path d="M12 14V4m0 0 4 4m-4-4-4 4"/><path d="M4.5 15v2.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V15"/>',
  target:
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  kalender:
    '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  qris: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.3"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.3"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.3"/><path d="M14 14h2.5v2.5H14zM20.5 14v3M17.5 20.5h3M14 20.5v.01"/>',
  pengaturan:
    '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.3"/><circle cx="8" cy="17" r="2.3"/>',
  akun: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17.2" cy="9.5" r="2.4"/><path d="M17.5 14.6c2.4.2 4 1.9 4 4.4"/>',
  lonceng:
    '<path d="M6 9.5a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17s2.5-1.5 2.5-8"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  matahari:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2M12 19.2v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M2.8 12h2M19.2 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4"/>',
  bulan: '<path d="M20 14.6A8.4 8.4 0 0 1 9.4 4a8.4 8.4 0 1 0 10.6 10.6z"/>',
  "keluar-akun":
    '<path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10"/><path d="m15.5 8 4 4-4 4M19.5 12H9.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  tutup: '<path d="M6 6l12 12M18 6 6 18"/>',
  centang: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  jam: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  tambah: '<path d="M12 5v14M5 12h14"/>',
  pensil:
    '<path d="M4.5 19.5 5.3 16 16.2 5.1a2.1 2.1 0 0 1 3 3L8.3 19z"/><path d="m14.5 6.8 2.7 2.7"/>',
  sampah:
    '<path d="M4.5 7h15M9.5 7V4.5h5V7"/><path d="m6.5 7 .9 12.5h9.2L17.5 7M10 11v5M14 11v5"/>',
  unggah:
    '<path d="M12 15.5V4m0 0 4 4m-4-4-4 4"/><path d="M4.5 15v2.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V15"/>',
  gambar:
    '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.7"/><path d="m4 17 5-4.5 3.5 3L15 13.5 20 18"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.01"/>',
  dompet:
    '<path d="M16.5 8V6.5A2 2 0 0 0 14.5 4.5H6A2.5 2.5 0 0 0 3.5 7v10A2.5 2.5 0 0 0 6 19.5h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H6.5"/><circle cx="16" cy="13.5" r="1.1" fill="currentColor"/>',
  bendera: '<path d="M5 21V4"/><path d="M5 5h12.5l-2.8 3.8 2.8 3.7H5"/>',
  "bulan-bintang":
    '<path d="M16.5 14.3A7 7 0 0 1 9.7 5.5a7 7 0 1 0 6.8 8.8z"/><path d="m17.5 3.5.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  kirim: '<path d="M20 4 10.5 13.5M20 4l-6 16-3.5-6.5L4 10z"/>',
  tanda: '<path d="M12 4.5 21 19.5H3z"/><path d="M12 10v4.5M12 17v.01"/>',
  siswa:
    '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-3.9 3.4-6.2 7.5-6.2s7.5 2.3 7.5 6.2"/>',
  kunci:
    '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  pesan:
    '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5z"/>',
  laporan:
    '<path d="M7 3.5h7.5L19 8v11.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19.5v-14A2 2 0 0 1 7 3.5z"/><path d="M14.5 3.5V8H19M9 12.5h6M9 16h6"/>',
  rekap:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9 9.5v10"/>',
  cari: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  cetak:
    '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
  unduh: '<path d="M12 4v10.5m0 0 4-4m-4 4-4-4M5 19.5h14"/>',
  grafik: '<path d="M4.5 20.5h15M7.5 20.5V12M12 20.5V6.5M16.5 20.5v-5"/>',
};

function icon(name, kelas) {
  return (
    '<svg class="ico' +
    (kelas ? " " + kelas : "") +
    '" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    (ICONS[name] || "") +
    "</svg>"
  );
}

const POS = [
  {
    key: "Rutin",
    label: "Kas Rutin",
    icon: icon("dompet"),
    jabatan: "Bendahara Utama",
  },
  {
    key: "Acara",
    label: "Dana Acara",
    icon: icon("bendera"),
    jabatan: "Bendahara Acara",
  },
  {
    key: "Kurban",
    label: "Dana Kurban",
    icon: icon("bulan-bintang"),
    jabatan: "Bendahara Kurban",
  },
];

function posMeta(key) {
  return POS.find((p) => p.key === key) || POS[0];
}

function posOfJabatan(jabatan) {
  const p = POS.find((p) => p.jabatan === jabatan);

  return p ? p.key : null;
}

function myPos() {
  return session && session.role === "bendahara"
    ? posOfJabatan(session.jabatan)
    : null;
}

/* ============================================================
   DATA & SESI
   Sumber kebenaran sekarang database MySQL lewat PHP (lihat api.js).
   DB dan session di bawah hanya salinan di memori peramban; tidak
   ada lagi data kas yang disimpan di localStorage (hanya tema).
============================================================ */

const THEME_KEY = "kastkjt1_theme_v1";

function defaultDB() {
  return {
    accounts: [],

    kasMasuk: [],

    pengeluaran: [],

    target: [],

    bukti: [],

    notifikasi: [],

    settings: {
      nominal: {
        Rutin: {
          jumlah: 15000,
          frekuensi: "Bulanan",
        },

        Acara: {
          jumlah: 0,
          frekuensi: "Sesuai kebutuhan",
        },

        Kurban: {
          jumlah: 1000,
          frekuensi: "Harian",
        },
      },

      qris: {
        Rutin: null,
        Acara: null,
        Kurban: null,
      },
    },
  };
}

let DB = defaultDB();

let session = null;

// true selama sebuah permintaan simpan/hapus sedang dikirim ke server
// (mencegah klik ganda dan penyegaran otomatis yang menimpa isian).
let sedangKirim = false;

/* ============================================================
   THEME
============================================================ */

let theme =
  localStorage.getItem(THEME_KEY) ||
  (window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");

function applyTheme() {
  document.documentElement.setAttribute("data-theme", theme);

  localStorage.setItem(THEME_KEY, theme);

  // warna bilah peramban di HP mengikuti tema
  const warna = document.querySelector('meta[name="theme-color"]');

  if (warna) {
    warna.setAttribute("content", theme === "dark" ? "#0d1716" : "#f2f5f1");
  }
}

function toggleTheme() {
  theme = theme === "dark" ? "light" : "dark";

  applyTheme();

  render();
}

/* ============================================================
   UTIL
============================================================ */

function rupiah(number) {
  number = Number(number) || 0;

  return "Rp " + number.toLocaleString("id-ID");
}

// Tanggal/jam "sekarang" mengikuti zona waktu aplikasi (api/config.php) dan jam
// server, bukan jam perangkat, supaya periode bulanan/harian sama untuk semua
// orang walau jam HP-nya salah.
function waktuSekarang() {
  return new Date(Date.now() + selisihJam);
}

// YYYY-MM-DD pada zona waktu aplikasi untuk sebuah waktu (default: sekarang).
function tglZona(waktu) {
  const w = waktu || waktuSekarang();

  try {
    const hasil = new Intl.DateTimeFormat("en-CA", {
      timeZone: META.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(w);

    if (/^\d{4}-\d{2}-\d{2}$/.test(hasil)) {
      return hasil;
    }
  } catch (err) {
    /* zona waktu tidak dikenal peramban: pakai jam perangkat */
  }

  const year = w.getFullYear();
  const month = String(w.getMonth() + 1).padStart(2, "0");
  const day = String(w.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayStr() {
  return tglZona();
}

function parseKasDate(value) {
  // Normalisasi tanggal transaksi tanpa mengubahnya melalui UTC.
  // Mendukung format utama YYYY-MM-DD, ISO datetime, serta format lama DD/MM/YYYY.
  const raw = String(value == null ? "" : value).trim();
  if (!raw) return null;

  let year, month, day, match;
  match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?=$|[T\s])/);
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    match = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (!match) return null;
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  }

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  )
    return null;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31)
    return null;

  const check = new Date(year, month - 1, day);
  if (
    check.getFullYear() !== year ||
    check.getMonth() !== month - 1 ||
    check.getDate() !== day
  )
    return null;

  const yyyy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return {
    year,
    month,
    day,
    iso: `${yyyy}-${mm}-${dd}`,
    monthKey: `${yyyy}-${mm}`,
  };
}

function dateOnlyKey(value) {
  return parseKasDate(value)?.iso || "";
}

// Kunci bulan "YYYY-MM" dari tanggal transaksi.
// Dipakai dashboard, status pembayaran, dan dashboard siswa.
function monthKey(value) {
  return parseKasDate(value)?.monthKey || "";
}

function normalizedText(value) {
  return String(value == null ? "" : value)
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("id-ID");
}

function paymentMatchesDay(
  payment,
  studentName,
  year,
  month,
  day,
  pos = ui.pos,
) {
  if (!payment) return false;
  if (normalizedText(payment.pos) !== normalizedText(pos)) return false;
  if (normalizedText(payment.siswa) !== normalizedText(studentName))
    return false;

  const date = parseKasDate(payment.tanggal);
  // Jangan memakai nomor hari saja: tahun, bulan, dan hari wajib cocok seluruhnya.
  return (
    !!date &&
    date.year === Number(year) &&
    date.month === Number(month) &&
    date.day === Number(day)
  );
}

function calendarMonthHasPayment(payment, studentName, year, month, weekly) {
  if (!payment) return false;
  if (normalizedText(payment.pos) !== normalizedText(ui.pos)) return false;
  if (normalizedText(payment.siswa) !== normalizedText(studentName))
    return false;

  const date = parseKasDate(payment.tanggal);
  const targetYear = Number(year);
  const targetMonth = Number(month);

  // Filter tahun lebih dahulu agar tahun berbeda tidak pernah saling mencentang.
  if (!date || date.year !== targetYear) return false;
  if (!weekly) return date.month === targetMonth;

  // Kalender mingguan memiliki satu penanda per bulan; penanda bulan hanya
  // aktif apabila transaksi ada pada minggu pertama bulan tersebut di tahun itu.
  const anchor = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
  return date.month === targetMonth && weekKey(date.iso) === weekKey(anchor);
}

function weekKey(date) {
  if (!date) return "";

  const d = new Date(date + "T00:00:00");

  if (isNaN(d)) {
    return "";
  }

  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

  const day = (dt.getUTCDay() + 6) % 7;

  dt.setUTCDate(dt.getUTCDate() - day + 3);

  const firstThu = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));

  const week =
    1 +
    Math.round(
      ((dt - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7,
    );

  return dt.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
}

function fmtDate(date) {
  if (!date) {
    return "-";
  }

  const d = new Date(date + "T00:00:00");

  if (isNaN(d)) {
    return date;
  }

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function esc(text) {
  return String(text == null ? "" : text).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

// Nama siswa disimpan KAPITAL (sesuai data kelas). Tampilannya dibuat
// huruf besar-kecil supaya mudah dibaca; nilai/data aslinya tidak berubah.
function titleCase(text) {
  return String(text == null ? "" : text)
    .toLowerCase()
    .replace(
      /(^|[\s\-.'])([a-z\u00e0-\u024f])/g,
      (m, sep, ch) => sep + ch.toUpperCase(),
    );
}

function tampilNama(nama) {
  return esc(titleCase(nama));
}

// Angka besar: "Rp" kecil, angkanya dominan.
function rupiahFig(number) {
  number = Number(number) || 0;

  return `<span class="cur">Rp</span> ${esc(number.toLocaleString("id-ID"))}`;
}

// Status selalu ikon + kata, tidak hanya warna.
function badgeStatus(sudah) {
  return sudah
    ? `<span class="badge badge-ok">${icon("centang")}Lunas</span>`
    : `<span class="badge badge-warn">${icon("jam")}Belum bayar</span>`;
}

function nominalPos(pos) {
  return (
    (DB.settings.nominal && DB.settings.nominal[pos]) || {
      jumlah: 0,
      frekuensi: "Sesuai kebutuhan",
    }
  );
}

/* ============================================================
   FINANCE
============================================================ */

function totalMasukPos(pos) {
  return DB.kasMasuk
    .filter((x) => x.pos === pos)
    .reduce((sum, x) => sum + Number(x.jumlah || 0), 0);
}

function totalKeluarPos(pos) {
  return DB.pengeluaran
    .filter((x) => x.pos === pos)
    .reduce((sum, x) => sum + Number(x.jumlah || 0), 0);
}

function saldoPos(pos) {
  return totalMasukPos(pos) - totalKeluarPos(pos);
}

/* ============================================================
   PERIODE PEMBAYARAN
   Kas Rutin   -> status berganti setiap BULAN
   Dana Kurban -> status berganti setiap HARI
   Status dihitung dari tanggal setoran, jadi begitu bulan/hari
   berganti semua siswa otomatis kembali "Belum bayar".
============================================================ */

const FREKUENSI_TETAP = {
  Rutin: "Bulanan",

  Kurban: "Harian",
};

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const NAMA_HARI = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

function frekuensiPos(pos) {
  return FREKUENSI_TETAP[pos] || nominalPos(pos).frekuensi;
}

// Periode yang sedang berjalan untuk sebuah pos.
//   frek : "Harian" | "Mingguan" | "Bulanan"
//   key  : penanda periode (YYYY-MM-DD / YYYY-Www / YYYY-MM)
//   label: kata untuk judul ("hari ini", "bulan ini")
//   nama : nama periode yang mudah dibaca ("Oktober 2026")
//   frasa: dipakai di kalimat notifikasi ("bulan Oktober 2026")
function periodeAktif(pos) {
  const frek = frekuensiPos(pos);

  const hari = todayStr();

  const [tahun, bulan, tgl] = hari.split("-").map(Number);

  if (frek === "Harian") {
    const namaHari = NAMA_HARI[new Date(tahun, bulan - 1, tgl).getDay()];

    const nama = `${namaHari}, ${tgl} ${NAMA_BULAN[bulan - 1]} ${tahun}`;

    return {
      frek,
      key: hari,
      label: "hari ini",
      nama,
      frasa: `hari ${nama}`,
      info: "berganti otomatis setiap hari",
    };
  }

  if (frek === "Mingguan") {
    const key = weekKey(hari);

    const [thn, minggu] = key.split("-W");

    const nama = `Minggu ke-${Number(minggu)}, ${thn}`;

    return {
      frek,
      key,
      label: "minggu ini",
      nama,
      frasa: nama.toLowerCase(),
      info: "berganti otomatis setiap minggu",
    };
  }

  const nama = `${NAMA_BULAN[bulan - 1]} ${tahun}`;

  return {
    frek: "Bulanan",
    key: hari.slice(0, 7),
    label: "bulan ini",
    nama,
    frasa: `bulan ${nama}`,
    info: "berganti otomatis setiap bulan",
  };
}

// Sudahkah siswa membayar pada periode tertentu ({ frek, key })?
function sudahBayarPeriode(pos, siswa, periode) {
  return DB.kasMasuk.some((x) => {
    if (normalizedText(x.pos) !== normalizedText(pos)) return false;

    if (normalizedText(x.siswa) !== normalizedText(siswa)) return false;

    const tgl = dateOnlyKey(x.tanggal);

    if (!tgl) return false;

    if (periode.frek === "Harian") return tgl === periode.key;

    if (periode.frek === "Mingguan") return weekKey(tgl) === periode.key;

    return monthKey(tgl) === periode.key;
  });
}

/* ============================================================
   PENGINGAT & NOTIFIKASI
   Bendahara Utama (Kas Rutin) dan Bendahara Kurban (Dana Kurban)
   menekan tombol "Ingatkan" -> notifikasi "belum bayar" masuk ke
   akun siswa yang dituju. Notifikasi disimpan berdasarkan NAMA
   siswa, jadi tetap sampai walau siswa baru membuat akun atau
   mengganti username.
============================================================ */

const POS_PENGINGAT = ["Rutin", "Kurban"];

function bolehMengingatkan(pos) {
  return (
    !!session &&
    session.role === "bendahara" &&
    POS_PENGINGAT.includes(pos) &&
    myPos() === pos
  );
}

function fmtWaktu(ts, pendek) {
  const d = new Date(Number(ts));

  if (isNaN(d)) return "-";

  let jam;

  try {
    jam = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: META.timezone,
    });
  } catch (err) {
    jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  const tgl = tglZona(d);

  if (tgl === todayStr()) return pendek ? jam : `Hari ini, ${jam}`;

  return `${fmtDate(tgl)}, ${jam}`;
}

function notifUntukSaya() {
  if (!session) return [];

  const saya = normalizedText(session.nama);

  return DB.notifikasi
    .filter((n) => normalizedText(n.untuk) === saya)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Pengingat otomatis dianggap selesai begitu siswa sudah membayar periodenya.
function notifSudahLunas(n) {
  return sudahBayarPeriode(n.pos, n.untuk, { frek: n.frek, key: n.periode });
}

function jumlahNotifBaru() {
  return notifUntukSaya().filter((n) => !n.dibaca && !notifSudahLunas(n))
    .length;
}

// Pengingat yang masih berlaku: periodenya sedang berjalan dan belum dibayar.
function pengingatAktifSaya() {
  return notifUntukSaya().filter(
    (n) =>
      POS_PENGINGAT.includes(n.pos) &&
      n.periode === periodeAktif(n.pos).key &&
      !notifSudahLunas(n),
  );
}

// Pengingat periode berjalan yang sudah pernah dikirim ke siswa ini.
function pengingatTerkirim(pos, nama) {
  const key = periodeAktif(pos).key;

  const target = normalizedText(nama);

  return DB.notifikasi.find(
    (n) =>
      n.pos === pos && n.periode === key && normalizedText(n.untuk) === target,
  );
}

// Pengingat dikirim lewat server: server yang menghitung periode berjalan,
// menolak siswa yang sudah lunas, dan menyimpan satu pengingat per siswa
// per periode (mengirim lagi memperbarui yang lama, tidak menumpuk).
async function kirimPengingat(nama, tombol) {
  const pos = myPos();

  if (!bolehMengingatkan(pos) || !SISWA_MASTER.includes(nama)) {
    return;
  }

  await ubahData(tombol, async () => {
    const j = await api("pengingat_kirim", { data: { nama } });

    await setelahUbah();

    showToast(
      j.sudahLunas
        ? `${titleCase(nama)} sudah membayar, pengingat tidak dikirim.`
        : `Pengingat terkirim ke ${titleCase(nama)}`,
      j.sudahLunas ? "" : "ok",
    );
  });
}

function kirimPengingatSemua() {
  const pos = myPos();

  if (!bolehMengingatkan(pos)) {
    return;
  }

  const per = periodeAktif(pos);

  const meta = posMeta(pos);

  const belum = SISWA_MASTER.filter((n) => !sudahBayarPeriode(pos, n, per));

  if (!belum.length) {
    showToast("Semua siswa sudah lunas, tidak ada yang perlu diingatkan.");

    return;
  }

  confirmAction(
    "Kirim pengingat ke semua?",
    `${belum.length} siswa yang belum membayar ${meta.label} ${per.frasa} akan menerima notifikasi.`,
    () =>
      ubahData(null, async () => {
        const j = await api("pengingat_semua", { data: {} });

        await setelahUbah();

        showToast(`Pengingat terkirim ke ${j.terkirim} siswa`, "ok");
      }),
    { yesLabel: "Ya, kirim", yesClass: "btn-teal" },
  );
}

// Membuka panel = semua notifikasi dianggap sudah dibaca (badge hilang),
// tetapi yang baru tetap ditandai selama panel terbuka.
function bukaNotif() {
  const milikku = notifUntukSaya();

  ui.notifBaruIds = milikku.filter((n) => !n.dibaca).map((n) => n.id);

  if (ui.notifBaruIds.length) {
    milikku.forEach((n) => {
      n.dibaca = true;
    });

    // jawaban penyegaran yang sedang di jalan sudah basi (masih "belum dibaca")
    versiData += 1;

    // Ditandai di server tanpa menunggu: panel langsung terbuka. Bila gagal,
    // tanda baca kembali seperti semula pada penyegaran berikutnya.
    api("notif_baca", { data: {} })
      .then(() => muatState(true))
      .then((berubah) => {
        if (berubah && ui.notifOpen) {
          render();
        }
      })
      .catch(() => {});
  }

  ui.notifOpen = true;

  ui.mobileMenuOpen = false;

  render();
}

function tutupNotif() {
  ui.notifOpen = false;

  ui.notifBaruIds = [];

  render();
}

function renderNotifPanel() {
  const daftar = notifUntukSaya();

  const baru = new Set(ui.notifBaruIds || []);

  return `
    <div
      class="notif-overlay no-print"
      data-act="closeNotif"
    ></div>

    <section
      class="notif-panel no-print"
      role="dialog"
      aria-label="Notifikasi"
    >

      <div class="notif-head">

        <strong>
          Notifikasi
        </strong>

        <button
          class="mobile-menu-close"
          data-act="closeNotif"
          title="Tutup"
          aria-label="Tutup notifikasi"
        >
          ${icon("tutup")}
        </button>

      </div>

      <div class="notif-list">

        ${
          daftar.length
            ? daftar
                .map((n) => {
                  const lunas = notifSudahLunas(n);

                  const isBaru = baru.has(n.id) && !lunas;

                  return `
                    <div class="notif-item ${isBaru ? "baru" : ""} ${lunas ? "selesai" : ""}">

                      <div class="notif-ic">
                        ${posMeta(n.pos).icon}
                      </div>

                      <div class="notif-body">

                        <div class="notif-title">
                          ${esc(n.judul || "Pengingat")}
                          ${
                            lunas
                              ? `<span class="badge badge-ok">${icon("centang")}Sudah lunas</span>`
                              : isBaru
                                ? `<span class="badge badge-warn">Baru</span>`
                                : ""
                          }
                        </div>

                        <div class="notif-msg">
                          ${esc(n.pesan)}
                        </div>

                        <div class="notif-meta">
                          ${esc(n.jabatan || "Bendahara")}, ${esc(fmtWaktu(n.createdAt))}
                        </div>

                      </div>

                    </div>
                  `;
                })
                .join("")
            : `
              <div class="empty">

                <div class="big">
                  ${icon("lonceng")}
                </div>

                Belum ada notifikasi.

              </div>
            `
        }

      </div>

    </section>
  `;
}

// Spanduk di dashboard siswa selama pengingat masih berlaku.
function bannerPengingat() {
  return pengingatAktifSaya()
    .map(
      (n) => `
        <div class="reminder-banner">

          <div class="reminder-ic">
            ${icon("lonceng")}
          </div>

          <div class="reminder-text">

            <strong>
              Pengingat dari ${esc(n.jabatan || "Bendahara")}
            </strong>

            <div>
              ${esc(n.pesan)}
            </div>

          </div>

        </div>
      `,
    )
    .join("");
}

// jenis: "" (biasa) | "ok" (berhasil) | "error" (gagal; tampil lebih lama)
function showToast(text, jenis) {
  let root = document.getElementById("toastRoot");

  if (!root) {
    root = document.createElement("div");

    root.id = "toastRoot";

    root.className = "no-print";

    root.setAttribute("role", "status");

    root.setAttribute("aria-live", "polite");

    document.body.appendChild(root);
  }

  const el = document.createElement("div");

  el.className = "toast" + (jenis ? " toast-" + jenis : "");

  // pesan galat harus segera dibacakan pembaca layar
  el.setAttribute("role", jenis === "error" ? "alert" : "status");

  el.textContent = text;

  root.appendChild(el);

  setTimeout(
    () => {
      el.classList.add("out");

      setTimeout(() => el.remove(), 320);
    },
    jenis === "error" ? 6000 : 2800,
  );
}

/* ============================================================
   UI STATE
============================================================ */

let ui = {
  authView: "login",

  loginTab: "siswa",

  forgotStep: 1,

  regRole: "siswa",

  view: "dashboard",

  pos: "Rutin",

  editKasId: null,

  editPengeluaranId: null,

  editTargetId: null,

  // diisi dari tanggal server saat masuk (awaliTampilanMasuk)
  kalenderTahun: new Date().getFullYear(),

  kalenderBulan: new Date().getMonth() + 1,

  mobileMenuOpen: false,

  notifOpen: false,

  notifBaruIds: [],

  // papan absen: petak yang dipilih (nama), filter daftar, dan animasi masuk
  siswaPilih: null,

  filterStatus: "semua",

  papanAnim: true,

  fokusSebelumDialog: null,

  // isian masuk/daftar yang dipertahankan saat gagal (password tidak pernah
  // disimpan) dan kolom yang difokuskan agar tidak perlu mengetik ulang
  authDraft: null,

  fokusAuth: null,

  msg: null,

  confirmDialog: null,

  // password sementara hasil reset akun, tampil sekali di dialog
  passwordSementara: null,

  // ---- fitur.js: grafik, cari & filter, rekap siswa, laporan ----
  grafikBulan: 6,

  grafikTabel: false,

  // pencarian nama pada daftar status pembayaran (dashboard)
  cariStatus: "",

  filterMasuk: { q: "", dari: "", sampai: "", metode: "" },

  filterKeluar: { q: "", dari: "", sampai: "", kategori: "" },

  // rekap siswa: pos mengikuti ui.pos; "buka" = siswa yang riwayatnya terbuka
  rekap: {
    cari: "",
    status: "semua",
    rentang: "bulan-ini",
    dari: "",
    sampai: "",
    buka: null,
  },

  // laporan: pos kosong = pos milik bendahara yang masuk
  laporan: {
    jenis: "lengkap",
    pos: "",
    rentang: "bulan-ini",
    dari: "",
    sampai: "",
  },
};

/* ============================================================
   RENDER
============================================================ */

// Seluruh tampilan digambar ulang setiap kali ada perubahan, jadi fokus papan
// ketik harus dikembalikan ke tombol yang sama supaya tidak "hilang".
function kunciFokus(el) {
  if (!el || !el.dataset || !el.dataset.act || !el.closest("#app")) {
    return null;
  }

  const zona = el.closest(
    ".mobile-menu, .sidebar, .topbar, .notif-panel, .main, .auth-card",
  );

  return {
    zona: zona ? zona.classList[0] : "",
    act: el.dataset.act,
    id: el.dataset.id || "",
    val: el.dataset.val || "",
    nama: el.dataset.nama || "",
    view: el.dataset.view || "",
  };
}

function pulihkanFokus(kunci) {
  if (!kunci) {
    return;
  }

  const zona = kunci.zona
    ? document.querySelector("#app ." + kunci.zona)
    : document.getElementById("app");

  if (!zona) {
    return;
  }

  const cocok = Array.from(
    zona.querySelectorAll('[data-act="' + kunci.act + '"]'),
  ).find(
    (el) =>
      (el.dataset.id || "") === kunci.id &&
      (el.dataset.val || "") === kunci.val &&
      (el.dataset.nama || "") === kunci.nama &&
      (el.dataset.view || "") === kunci.view,
  );

  if (cocok) {
    try {
      cocok.focus({ preventScroll: true });
    } catch (err) {
      cocok.focus();
    }
  }
}

function render() {
  const fokus = kunciFokus(document.activeElement);

  const app = document.getElementById("app");

  // data belum datang dari server: layar memuat / layar gagal terhubung
  if (statusApp === "memuat") {
    app.innerHTML = renderMemuat();

    return;
  }

  if (statusApp === "galat") {
    app.innerHTML = renderGalatServer();

    afterRender();

    return;
  }

  app.innerHTML = session ? renderShell() : renderAuth();

  afterRender();

  if (ui.confirmDialog) {
    renderConfirmDialog();
  } else if (ui.passwordSementara) {
    renderSandiDialog();
  } else {
    pulihkanFokus(fokus);
  }
}

/* ============================================================
   AUTH
============================================================ */

// Sisi kiri halaman masuk (layar lebar saja): papan nomor absen sebagai hiasan.
function authAside() {
  const petak = SISWA_MASTER.map((_, i) => `<li>${i + 1}</li>`).join("");

  return `
    <aside class="auth-aside" aria-hidden="true">

      <p class="auth-claim">
        ${SISWA_MASTER.length} siswa, ${BENDAHARA_MASTER.length} bendahara, satu buku kas.
      </p>

      <ol class="auth-board">${petak}</ol>

      <p class="auth-caption">
        Kas rutin, dana acara, dan dana kurban kelas X TKJT 1.
      </p>

    </aside>
  `;
}

function pesanAuth() {
  if (!ui.msg) {
    return "";
  }

  const galat = ui.msg.type === "error";

  return `
    <div
      id="auth-pesan"
      class="alert ${galat ? "alert-error" : "alert-ok"}"
      role="${galat ? "alert" : "status"}"
    >
      ${icon(galat ? "tanda" : "centang")}
      <span>${esc(ui.msg.text)}</span>
    </div>
  `;
}

function renderAuth() {
  const fab = `
    <button
      class="theme-fab"
      data-act="toggleTheme"
      title="Ganti tema"
      aria-label="${theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"}"
    >
      ${icon(theme === "dark" ? "matahari" : "bulan")}
    </button>
  `;

  if (ui.authView === "forgot") return fab + renderForgotPassword();

  return fab + (ui.authView === "register" ? renderRegister() : renderLogin());
}

function renderLogin() {
  const t = ui.loginTab;

  const draf = ui.authDraft || {};

  return `
    <div class="center-screen">

      <div class="auth-wrap">

        ${authAside()}

        <div class="auth-card">

          <div class="brand">

            <div class="brand-mark">
              TKJ
            </div>

            <div class="brand-text">

              <div class="t1">
                Informasi Kas Kelas X TKJT 1
              </div>

              <div class="t2">
                Kelas Teknik Jaringan
              </div>

            </div>

          </div>

          <h1 class="auth-title">
            Masuk ke akun
          </h1>

          <p class="auth-sub">
            Pilih peranmu lalu masuk
            dengan username dan password
            yang sudah kamu buat.
          </p>

          <div
            class="tabs"
            data-active="${t}"
            role="group"
            aria-label="Peran"
          >

            <button
              type="button"
              data-act="loginTab"
              data-val="siswa"
              class="${t === "siswa" ? "active" : ""}"
              aria-pressed="${t === "siswa" ? "true" : "false"}"
            >
              ${icon("siswa")}
              Siswa
            </button>

            <button
              type="button"
              data-act="loginTab"
              data-val="bendahara"
              class="${t === "bendahara" ? "active" : ""}"
              aria-pressed="${t === "bendahara" ? "true" : "false"}"
            >
              ${icon("kunci")}
              Bendahara
            </button>

          </div>

          ${pesanAuth()}

          <form
            data-form="login"
          >

            <input
              type="hidden"
              name="role"
              value="${t}"
            >

            <div class="field">

              <label for="login-username">
                Username
              </label>

              <input
                id="login-username"
                name="username"
                value="${esc(draf.username || "")}"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                placeholder="misal. abdurrahman"
                required
              >

            </div>

            <div class="field">

              <label for="login-password">
                Password
              </label>

              <input
                id="login-password"
                name="password"
                type="password"
                autocomplete="current-password"
                placeholder="Password kamu"
                required
              >

            </div>

            <button
              class="
                btn
                btn-primary
              "
              type="submit"
            >
              Masuk sebagai
              ${t === "siswa" ? "Siswa" : "Bendahara"}
            </button>

          </form>

          <div class="switch-link">
            <button type="button" data-act="goForgot">Lupa password?</button>
          </div>

          <div class="switch-link">

            Belum punya akun?

            <button
              type="button"
              data-act="goRegister"
            >
              Buat akun sendiri
            </button>

          </div>

        </div>

      </div>

    </div>
  `;
}

// Nama yang belum punya akun, dihitung server (halaman daftar dibuka sebelum
// masuk, jadi daftar akun tidak ada di peramban).
function availableNames(role) {
  const daftar = META.tersedia[role === "bendahara" ? "bendahara" : "siswa"];

  return Array.isArray(daftar) ? daftar.slice() : [];
}

function renderForgotPassword() {
  const draf = ui.authDraft || {};

  const role = draf.role === "bendahara" ? "bendahara" : "siswa";

  return `
    <div class="center-screen">

      <div class="auth-wrap">

        ${authAside()}

        <div class="auth-card">

          <div class="brand">
            <div class="brand-mark">TKJ</div>
            <div class="brand-text">
              <div class="t1">Informasi Kas Kelas X TKJT 1</div>
              <div class="t2">Pemulihan akun</div>
            </div>
          </div>

          <h1 class="auth-title">Lupa password?</h1>

          <p class="auth-sub">
            Masukkan data akun untuk memverifikasi kepemilikan akun,
            lalu buat password baru.
          </p>

          ${pesanAuth()}

          <form data-form="forgotPassword">

            <div class="field">
              <label for="forgot-role">Peran</label>
              <select
                id="forgot-role"
                name="role"
                data-act-change="forgotRole"
                required
              >
                <option value="siswa" ${role === "siswa" ? "selected" : ""}>Siswa</option>
                <option value="bendahara" ${role === "bendahara" ? "selected" : ""}>Bendahara</option>
              </select>
            </div>

            <div class="field">
              <label for="forgot-username">Username</label>
              <input
                id="forgot-username"
                name="username"
                value="${esc(draf.username || "")}"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                placeholder="Username akun"
                required
              >
            </div>

            <div class="field">
              <label for="forgot-nama">Nama sesuai akun</label>
              <input
                id="forgot-nama"
                name="nama"
                value="${esc(draf.nama || "")}"
                autocomplete="name"
                placeholder="Nama yang dipilih saat membuat akun"
                required
              >
            </div>

            <div class="form-row cols-2">
              <div class="field">
                <label for="forgot-password">Password baru</label>
                <input
                  id="forgot-password"
                  name="password"
                  type="password"
                  autocomplete="new-password"
                  minlength="6"
                  maxlength="72"
                  placeholder="Minimal 6 karakter"
                  required
                >
              </div>

              <div class="field">
                <label for="forgot-password2">Ulangi password</label>
                <input
                  id="forgot-password2"
                  name="password2"
                  type="password"
                  autocomplete="new-password"
                  minlength="6"
                  maxlength="72"
                  placeholder="Ulangi password"
                  required
                >
              </div>
            </div>

            ${
              role === "bendahara"
                ? `
                  <div class="field">
                    <label for="forgot-kode">Kode bendahara</label>
                    <input
                      id="forgot-kode"
                      name="kode"
                      type="password"
                      autocomplete="off"
                      autocapitalize="none"
                      spellcheck="false"
                      placeholder="Kode dari admin kelas"
                      required
                    >
                  </div>
                `
                : ""
            }

            <div class="locked-note">
              ${icon("kunci")}
              <span>
                ${
                  role === "bendahara"
                    ? "Akun bendahara memegang uang kelas, jadi pemulihan juga butuh kode bendahara. Tidak punya kodenya? Minta bendahara lain mereset passwordmu di Kelola Akun."
                    : "Username dan nama harus sama dengan yang dipakai saat membuat akun. Bila tidak ingat, minta bendahara mereset passwordmu di Kelola Akun."
                }
              </span>
            </div>

            <button class="btn btn-primary" type="submit">
              ${icon("kunci")}
              Simpan password baru
            </button>

          </form>

          <div class="switch-link">
            Ingat password?
            <button type="button" data-act="goLogin">Kembali ke masuk</button>
          </div>

        </div>
      </div>
    </div>
  `;
}

function renderRegister() {
  const role = ui.regRole;

  const names = availableNames(role);

  const draf = ui.authDraft || {};

  return `
    <div class="center-screen">

      <div class="auth-wrap">

        ${authAside()}

        <div class="auth-card">

          <div class="brand">

            <div class="brand-mark">
              TKJ
            </div>

            <div class="brand-text">

              <div class="t1">
                Informasi Kas Kelas
              </div>

              <div class="t2">
                Kelas X TKJT 1
              </div>

            </div>

          </div>

          <h1 class="auth-title">
            Buat akun sendiri
          </h1>

          <p class="auth-sub">
            Pilih nama sesuai data kelas
            kemudian buat username
            dan password.
          </p>

          <div
            class="tabs"
            data-active="${role}"
            role="group"
            aria-label="Peran"
          >

            <button
              type="button"
              data-act="regRole"
              data-val="siswa"
              class="${role === "siswa" ? "active" : ""}"
              aria-pressed="${role === "siswa" ? "true" : "false"}"
            >
              ${icon("siswa")}
              Siswa
            </button>

            <button
              type="button"
              data-act="regRole"
              data-val="bendahara"
              class="${role === "bendahara" ? "active" : ""}"
              aria-pressed="${role === "bendahara" ? "true" : "false"}"
            >
              ${icon("kunci")}
              Bendahara
            </button>

          </div>

          ${pesanAuth()}

          <form
            data-form="register"
          >

            <input
              type="hidden"
              name="role"
              value="${role}"
            >

            <div class="field">

              <label for="reg-nama">
                Nama sesuai data kelas
              </label>

              <select
                id="reg-nama"
                name="nama"
                required
              >

                <option value="">
                  ${
                    names.length
                      ? "Pilih nama..."
                      : "Semua nama sudah terdaftar"
                  }
                </option>

                ${names
                  .map(
                    (name) => `
                      <option
                        value="${esc(name)}"
                        ${draf.nama === name ? "selected" : ""}
                      >
                        ${tampilNama(name)}
                      </option>
                    `,
                  )
                  .join("")}

              </select>

            </div>

            <div class="field">

              <label for="reg-username">
                Buat username
              </label>

              <input
                id="reg-username"
                name="username"
                value="${esc(draf.username || "")}"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                minlength="3"
                maxlength="30"
                placeholder="3-30 huruf/angka, tanpa spasi"
                required
              >

            </div>

            <div class="field">

              <label for="reg-password">
                Buat password
              </label>

              <input
                id="reg-password"
                name="password"
                type="password"
                autocomplete="new-password"
                minlength="6"
                maxlength="72"
                placeholder="Minimal 6 karakter"
                required
              >

            </div>

            <div class="field">

              <label for="reg-password2">
                Ulangi password
              </label>

              <input
                id="reg-password2"
                name="password2"
                type="password"
                autocomplete="new-password"
                minlength="6"
                maxlength="72"
                required
              >

            </div>

            ${
              role === "bendahara"
                ? META.kodeBendahara
                  ? `
                    <div class="field">

                      <label for="reg-kode">
                        Kode bendahara
                      </label>

                      <input
                        id="reg-kode"
                        name="kode"
                        type="password"
                        autocomplete="off"
                        autocapitalize="none"
                        spellcheck="false"
                        placeholder="Kode dari admin kelas"
                        required
                      >

                    </div>
                  `
                  : `
                    <div class="alert alert-error" role="alert">
                      ${icon("tanda")}
                      <span>
                        Pendaftaran bendahara belum dibuka. Admin perlu mengisi
                        <code>kode_bendahara</code> di <code>api/config.php</code>.
                      </span>
                    </div>
                  `
                : ""
            }

            <button
              class="
                btn
                btn-primary
              "
              type="submit"
              ${names.length === 0 || (role === "bendahara" && !META.kodeBendahara) ? "disabled" : ""}
            >
              Buat akun
            </button>

          </form>

          <div class="switch-link">

            Sudah punya akun?

            <button
              type="button"
              data-act="goLogin"
            >
              Masuk
            </button>

          </div>

        </div>

      </div>

    </div>
  `;
}

/* ============================================================
   NAV
============================================================ */

const NAV = [
  {
    id: "dashboard",
    ic: "dashboard",
    label: "Dashboard",
  },

  {
    id: "kasmasuk",
    ic: "masuk",
    label: "Kas Masuk",
  },

  {
    id: "pengeluaran",
    ic: "keluar",
    label: "Pengeluaran",
  },

  {
    id: "rekap",
    ic: "rekap",
    label: "Rekap Siswa",
    bendaharaOnly: true,
  },

  {
    id: "laporan",
    ic: "laporan",
    label: "Laporan",
    bendaharaOnly: true,
  },

  {
    id: "target",
    ic: "target",
    label: "Target",
  },

  {
    id: "kalender",
    ic: "kalender",
    label: "Kalender",
    bendaharaOnly: true,
  },

  {
    id: "qris",
    ic: "qris",
    label: "QRIS",
  },

  {
    id: "pengaturan",
    ic: "pengaturan",
    label: "Pengaturan",
  },
  {
    id: "kelolaakun",
    ic: "akun",
    label: "Kelola Akun",
    bendaharaOnly: true,
  },
];

/* ============================================================
   SHELL + MOBILE MENU
============================================================ */

function navButtons() {
  return NAV.filter((nav) => !nav.bendaharaOnly || session.role === "bendahara")
    .map(
      (nav) => `
        <button
          class="navitem ${ui.view === nav.id ? "active" : ""}"
          data-act="nav"
          data-view="${nav.id}"
          ${ui.view === nav.id ? 'aria-current="page"' : ""}
        >
          <span class="ic">${icon(nav.ic)}</span>
          ${nav.label}
        </button>
      `,
    )
    .join("");
}

function renderShell() {
  const roleLabel =
    session.role === "bendahara" ? session.jabatan : "Siswa TKJT 1";

  const notifBaru = jumlahNotifBaru();

  const nama = tampilNama(session.nama);

  return `
    <div
      class="mobile-menu-overlay ${ui.mobileMenuOpen ? "open" : ""}"
      data-act="closeMobileMenu"
    ></div>

    <aside
      class="mobile-menu ${ui.mobileMenuOpen ? "open" : ""}"
      aria-label="Menu navigasi"
    >

      <div class="mobile-menu-head">

        <div class="avatar">${initials(session.nama)}</div>

        <div class="mm-who">
          <span class="name">${nama}</span>
          <span class="role-badge">${esc(roleLabel)}</span>
        </div>

        <button
          class="mobile-menu-close"
          data-act="closeMobileMenu"
          title="Tutup menu"
          aria-label="Tutup menu"
        >
          ${icon("tutup")}
        </button>

      </div>

      ${navButtons()}

    </aside>

    <header class="topbar no-print">

      <button
        class="mobile-menu-btn"
        data-act="toggleMobileMenu"
        title="Buka menu"
        aria-label="Buka menu"
      >
        ${icon("menu")}
      </button>

      <div class="brand">

        <div class="brand-mark">TKJ</div>

        <div class="brand-text">

          <div class="t1">Kas TKJT 1</div>

          <div class="t2">
            ${session.role === "bendahara" ? "Panel Bendahara" : "Panel Siswa"}
          </div>

        </div>

      </div>

      <div class="who">

        <div class="who-text">

          <div class="name">${nama}</div>

          <span class="role-badge">${esc(roleLabel)}</span>

        </div>

        <div class="avatar">${initials(session.nama)}</div>

        <button
          class="icon-btn notif-btn"
          data-act="toggleNotif"
          title="Notifikasi"
          aria-label="Notifikasi${notifBaru ? `, ${notifBaru} baru` : ""}"
        >
          ${icon("lonceng")}
          ${
            notifBaru
              ? `<span class="notif-badge">${notifBaru > 9 ? "9+" : notifBaru}</span>`
              : ""
          }
        </button>

        <button
          class="icon-btn"
          data-act="toggleTheme"
          title="Ganti tema"
          aria-label="${theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"}"
        >
          ${icon(theme === "dark" ? "matahari" : "bulan")}
        </button>

        <button
          class="icon-btn"
          data-act="logout"
          title="Keluar"
          aria-label="Keluar"
        >
          ${icon("keluar-akun")}
        </button>

      </div>

    </header>

    ${ui.notifOpen ? renderNotifPanel() : ""}

    <div class="layout">

      <aside class="sidebar no-print" aria-label="Navigasi">
        ${navButtons()}
      </aside>

      <main class="main">

        ${renderPage()}

        <div class="footer-note no-print">
          Kas TKJT 1. Data tersimpan di server sekolah.
        </div>

      </main>

    </div>
  `;
}

function renderPage() {
  switch (ui.view) {
    case "kasmasuk":
      return pageKasMasuk();

    case "pengeluaran":
      return pagePengeluaran();

    case "target":
      return pageTarget();

    case "rekap":
      return session.role === "bendahara" ? Fitur.pageRekap() : pageDashboard();

    case "laporan":
      return session.role === "bendahara"
        ? Fitur.pageLaporan()
        : pageDashboard();

    case "kalender":
      return session.role === "bendahara" ? pageKalender() : pageDashboard();

    case "qris":
      return pageQris();

    case "pengaturan":
      return pagePengaturan();

    case "kelolaakun":
      return session.role === "bendahara" ? pageKelolaAkun() : pageDashboard();

    default:
      return pageDashboard();
  }
}

/* ============================================================
   DASHBOARD
============================================================ */

function posTabs() {
  return `
    <div class="tabs tabs-pos" role="group" aria-label="Pilih pos dana">

      ${POS.map(
        (p) => `
          <button
            data-act="setPos"
            data-val="${p.key}"
            class="${ui.pos === p.key ? "active" : ""}"
            aria-pressed="${ui.pos === p.key ? "true" : "false"}"
          >
            ${p.icon}
            ${p.label}
          </button>
        `,
      ).join("")}

    </div>
  `;
}

function pageDashboard() {
  if (session.role === "siswa") {
    return dashboardSiswa();
  }

  const pos = myPos();

  if (pos === "Rutin") {
    return dashboardUtama();
  }

  return dashboardPos(pos);
}

// Panel saldo: satu angka utama + rincian bertitik-titik seperti buku kas.
//   baris: [{ ikon, k, v, teks }]  (teks=true -> v ditampilkan apa adanya)
function panelSaldo({ ikon, judul, nilai, sub, baris, compact }) {
  const minus = Number(nilai) < 0;

  return `
    <section class="card saldo ${compact ? "compact" : ""}">

      <div>

        <div class="lbl">
          ${ikon}
          ${esc(judul)}
        </div>

        <div class="fig ${minus ? "neg" : ""}">
          ${rupiahFig(nilai)}
        </div>

        ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}

        ${
          minus
            ? `<div class="sub neg">${icon("tanda", "ico-sm")} Pengeluaran lebih besar dari pemasukan.</div>`
            : ""
        }

      </div>

      <dl class="leaders">

        ${baris
          .map(
            (b) => `
              <div class="leader">

                <dt class="k">${b.ikon || ""}${esc(b.k)}</dt>

                <i class="dots" aria-hidden="true"></i>

                <dd class="v ${b.teks ? "teks" : "rp"}">
                  ${b.teks ? esc(b.v) : rupiah(b.v)}
                </dd>

              </div>
            `,
          )
          .join("")}

      </dl>

    </section>
  `;
}

function dashboardUtama() {
  return `
    <div class="page-head">

      <h1>
        Dashboard Bendahara Utama
      </h1>

      <p>
        Ringkasan kas kelas TKJT 1
      </p>

    </div>

    ${panelSaldo({
      ikon: icon("dompet"),
      judul: "Saldo kas rutin",
      nilai: saldoPos("Rutin"),
      sub: "Pos kamu",
      baris: [
        {
          ikon: icon("bendera"),
          k: "Saldo dana acara",
          v: saldoPos("Acara"),
        },
        {
          ikon: icon("bulan-bintang"),
          k: "Saldo dana kurban",
          v: saldoPos("Kurban"),
        },
      ],
    })}

    ${Fitur.dashboardKartu("Rutin")}

    ${statusPembayaranBlock("Rutin")}
  `;
}

function dashboardPos(pos) {
  const meta = posMeta(pos);

  const curMonth = todayStr().slice(0, 7);

  const masuk = DB.kasMasuk
    .filter((x) => x.pos === pos && monthKey(x.tanggal) === curMonth)
    .reduce((s, x) => s + Number(x.jumlah), 0);

  const keluar = DB.pengeluaran
    .filter((x) => x.pos === pos && monthKey(x.tanggal) === curMonth)
    .reduce((s, x) => s + Number(x.jumlah), 0);

  const targets = DB.target
    .filter((t) => t.pos === pos)
    .sort((a, b) => b.createdAt - a.createdAt);

  const target = targets[0];

  return `
    <div class="page-head">

      <h1>
        Dashboard
        ${esc(session.jabatan)}
      </h1>

      <p>
        Pengelolaan

        <span class="pos-chip">
          ${meta.icon}
          ${meta.label}
        </span>

      </p>

    </div>

    ${panelSaldo({
      ikon: meta.icon,
      judul: `Saldo ${meta.label}`,
      nilai: saldoPos(pos),
      sub: "Masuk dikurangi keluar",
      baris: [
        { ikon: icon("masuk"), k: "Masuk bulan ini", v: masuk },
        { ikon: icon("keluar"), k: "Keluar bulan ini", v: keluar },
        {
          ikon: icon("target"),
          k: "Target utama",
          v: target ? target.nama : "Belum ada",
          teks: true,
        },
      ],
    })}

    ${Fitur.dashboardKartu(pos)}

    ${statusPembayaranBlock(pos)}
  `;
}

function dashboardSiswa() {
  const per = periodeAktif("Rutin");

  const myPay = DB.kasMasuk.filter(
    (x) => x.pos === "Rutin" && x.siswa === session.nama,
  );

  const myTotal = myPay.reduce((s, x) => s + Number(x.jumlah), 0);

  const sudah = sudahBayarPeriode("Rutin", session.nama, per);

  const nominal = Number(nominalPos("Rutin").jumlah) || 0;

  return `
    <div class="page-head">

      <h1>
        Halo,
        ${tampilNama(session.nama.split(" ")[0])}
      </h1>

      <p>
        Ringkasan kas kelas
        TKJT 1
      </p>

    </div>

    ${bannerPengingat()}

    <section class="card status-saya ${sudah ? "lunas" : "belum"}">

      <div class="lbl">
        Status saya
      </div>

      <div class="ss-state">
        ${icon(sudah ? "centang" : "jam")}
        ${sudah ? "Sudah bayar" : "Belum bayar"}
      </div>

      <div class="sub">
        Kas rutin ${esc(per.nama)}${nominal ? `, ${rupiah(nominal)} per bulan` : ""}
      </div>

      ${Fitur.tunggakanSaya()}

      ${
        sudah
          ? ""
          : `
            <div class="form-actions">

              <button
                class="btn btn-primary"
                data-act="goPos"
                data-view="qris"
                data-val="Rutin"
              >
                ${icon("qris")}
                Bayar lewat QRIS
              </button>

              <button
                class="btn btn-outline"
                data-act="goPos"
                data-view="kasmasuk"
                data-val="Rutin"
              >
                ${icon("unggah")}
                Kirim bukti bayar
              </button>

            </div>
          `
      }

    </section>

    ${panelSaldo({
      ikon: icon("dompet"),
      judul: "Saldo kas rutin",
      nilai: saldoPos("Rutin"),
      compact: true,
      baris: [
        {
          ikon: icon("bendera"),
          k: "Saldo dana acara",
          v: saldoPos("Acara"),
        },
        {
          ikon: icon("bulan-bintang"),
          k: "Saldo dana kurban",
          v: saldoPos("Kurban"),
        },
      ],
    })}

    <div class="section-title">

      <h2>
        Riwayat setoran saya
      </h2>

      <span class="muted">
        Total kontribusi ${rupiah(myTotal)}, ${myPay.length} kali setoran
      </span>

    </div>

    ${renderKasTable(
      myPay.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
      false,
      true,
    )}
  `;
}

/* ============================================================
   STATUS PEMBAYARAN
   Papan absen (38 petak bernomor) + daftar. Lunas = petak terisi
   dengan centang; belum bayar = petak berbingkai kuning dengan
   jam. Petak dipilih untuk melihat nama (layar sentuh).
============================================================ */

function statusPembayaranBlock(pos) {
  const meta = posMeta(pos);

  if (frekuensiPos(pos) === "Sesuai kebutuhan") {
    return `
      <div class="section-title">

        <h2>
          Kontribusi
          ${meta.label}
        </h2>

      </div>

      <div class="table-wrap">

        <div class="empty">

          <div class="big">
            ${meta.icon}
          </div>

          Dana acara dikumpulkan
          sesuai kebutuhan.

        </div>

      </div>
    `;
  }

  // Periode berjalan: Kas Rutin = bulan ini, Dana Kurban = hari ini.
  // Begitu bulan/hari berganti, semua siswa otomatis kembali "Belum bayar".
  const per = periodeAktif(pos);

  const lunas = new Set(
    SISWA_MASTER.filter((name) => sudahBayarPeriode(pos, name, per)),
  );

  const total = SISWA_MASTER.length;

  const belumBayar = total - lunas.size;

  const bisaIngatkan = bolehMengingatkan(pos);

  const filter = ["semua", "belum", "lunas"].includes(ui.filterStatus)
    ? ui.filterStatus
    : "semua";

  const pilih = SISWA_MASTER.includes(ui.siswaPilih) ? ui.siswaPilih : null;

  const petak = SISWA_MASTER.map((name, i) => {
    const sudah = lunas.has(name);

    return `
      <li>
        <button
          type="button"
          class="tile ${sudah ? "lunas" : "belum"}"
          data-act="pilihSiswa"
          data-nama="${esc(name)}"
          data-no="${i + 1}"
          data-status="${sudah ? "Lunas" : "Belum bayar"}"
          aria-pressed="${pilih === name ? "true" : "false"}"
          aria-label="Nomor ${i + 1}, ${tampilNama(name)}, ${sudah ? "lunas" : "belum bayar"}"
          style="--i:${i}"
        >
          <span class="n">${i + 1}</span>
          ${icon(sudah ? "centang" : "jam")}
        </button>
      </li>
    `;
  }).join("");

  const keterangan = pilih
    ? (() => {
        const sudah = lunas.has(pilih);

        const terkirim =
          bisaIngatkan && !sudah ? pengingatTerkirim(pos, pilih) : null;

        return `
          <div class="papan-cap">

            <div class="cap-name">
              <span>No. ${SISWA_MASTER.indexOf(pilih) + 1}</span>
              ${tampilNama(pilih)}
            </div>

            <div class="cap-aksi">

              ${badgeStatus(sudah)}

              ${
                bisaIngatkan && !sudah
                  ? `
                    <button
                      class="btn btn-soft btn-sm no-print"
                      data-act="kirimPengingat"
                      data-nama="${esc(pilih)}"
                    >
                      ${icon("kirim")}
                      ${terkirim ? "Ingatkan lagi" : "Ingatkan"}
                    </button>
                  `
                  : ""
              }

            </div>

            <button
              type="button"
              class="icon-btn no-print"
              data-act="pilihSiswa"
              data-nama="${esc(pilih)}"
              title="Tutup keterangan"
              aria-label="Tutup keterangan"
            >
              ${icon("tutup")}
            </button>

          </div>
        `;
      })()
    : "";

  const chips = [
    ["semua", "Semua", total],
    ["belum", "Belum bayar", belumBayar],
    ["lunas", "Lunas", lunas.size],
  ]
    .map(
      ([kunci, label, jumlah]) => `
        <button
          type="button"
          class="chip"
          data-act="filterStatus"
          data-val="${kunci}"
          aria-pressed="${filter === kunci ? "true" : "false"}"
        >
          ${label}
          <b>${jumlah}</b>
        </button>
      `,
    )
    .join("");

  return `
    <div class="section-title status-head">

      <div>

        <h2>
          Status pembayaran
          ${meta.label},
          ${per.label}
        </h2>

        <div class="period-note">
          ${icon("kalender", "ico-sm")}
          ${esc(per.nama)}, ${per.info}
        </div>

      </div>

      <div class="status-actions">

        <span class="muted">
          ${lunas.size}/${total} lunas
        </span>

        ${
          bisaIngatkan
            ? `
              <button
                class="btn btn-soft btn-sm no-print"
                data-act="kirimPengingatSemua"
                ${belumBayar ? "" : "disabled"}
              >
                ${icon("kirim")}
                Ingatkan semua (${belumBayar})
              </button>
            `
            : ""
        }

      </div>

    </div>

    <section
      class="card papan"
      aria-label="Papan absen, ${lunas.size} dari ${total} siswa lunas"
    >

      <ol class="papan-grid ${ui.papanAnim ? "anim" : ""}">
        ${petak}
      </ol>

      ${keterangan}

      <div class="papan-legend">

        <span><i class="k-lunas"></i>Lunas</span>

        <span><i class="k-belum"></i>Belum bayar</span>

        <span class="no-print">Pilih nomor untuk melihat namanya.</span>

      </div>

      <div class="tip" role="tooltip" hidden></div>

    </section>

    <div class="chips no-print" role="group" aria-label="Tampilkan siswa">
      ${chips}
    </div>

    <div class="field status-cari no-print">

      <label>
        Cari siswa
      </label>

      <input
        type="search"
        id="cari-status"
        placeholder="Ketik nama siswa"
        maxlength="60"
        autocomplete="off"
        value="${esc(ui.cariStatus)}"
        data-act-input="cariStatus"
      >

    </div>

    <div id="status-daftar" data-pos="${esc(pos)}">
      ${statusDaftarHtml(pos)}
    </div>
  `;
}

/* Daftar siswa pada status pembayaran (tabel, atau keadaan kosong). Dipisah
   dari statusPembayaranBlock agar bisa digambar ulang sendiri ketika nama
   dicari, tanpa menggambar ulang seluruh halaman (fokus ketikan tetap). */
function statusDaftarHtml(pos) {
  const per = periodeAktif(pos);

  const lunas = new Set(
    SISWA_MASTER.filter((name) => sudahBayarPeriode(pos, name, per)),
  );

  const bisaIngatkan = bolehMengingatkan(pos);

  const filter = ["semua", "belum", "lunas"].includes(ui.filterStatus)
    ? ui.filterStatus
    : "semua";

  const pilih = SISWA_MASTER.includes(ui.siswaPilih) ? ui.siswaPilih : null;

  const cari = normalizedText(ui.cariStatus);

  const daftar = SISWA_MASTER.map((name, i) => ({
    name,
    no: i + 1,
    sudah: lunas.has(name),
  }))
    .filter(
      (r) => filter === "semua" || (filter === "belum" ? !r.sudah : r.sudah),
    )
    .filter((r) => !cari || normalizedText(r.name).includes(cari));

  const barisSiswa = daftar
    .map(({ name, no, sudah }) => {
      const terkirim =
        bisaIngatkan && !sudah ? pengingatTerkirim(pos, name) : null;

      return `
        <tr class="${pilih === name ? "sorot" : ""}">

          <td data-label="No">
            ${no}
          </td>

          <td data-label="Nama">
            ${tampilNama(name)}
          </td>

          <td data-label="Status">
            ${badgeStatus(sudah)}
          </td>

          ${
            bisaIngatkan
              ? `
                <td data-label="Pengingat" class="no-print ${sudah ? "kosong" : ""}">
                  ${
                    sudah
                      ? `<span class="muted">-</span>`
                      : `
                        <div class="remind-cell">

                          <button
                            class="btn btn-soft btn-sm"
                            data-act="kirimPengingat"
                            data-nama="${esc(name)}"
                          >
                            ${icon("kirim")}
                            ${terkirim ? "Ingatkan lagi" : "Ingatkan"}
                          </button>

                          ${
                            terkirim
                              ? `<span class="remind-sent">${icon("centang")}Terkirim ${esc(fmtWaktu(terkirim.createdAt, true))}</span>`
                              : ""
                          }

                        </div>
                      `
                  }
                </td>
              `
              : ""
          }

        </tr>
      `;
    })
    .join("");

  return daftar.length
    ? `
          <div class="table-wrap status-wrap">

            <table class="status-table ${bisaIngatkan ? "has-aksi" : ""}">

              <thead>

                <tr>
                  <th class="c-no">No</th>
                  <th>Nama</th>
                  <th>Status</th>
                  ${bisaIngatkan ? `<th class="no-print">Pengingat</th>` : ""}
                </tr>

              </thead>

              <tbody>

                ${barisSiswa}

              </tbody>

            </table>

          </div>
        `
    : `
          <div class="table-wrap">

            <div class="empty">

              <div class="big">
                ${icon(cari ? "cari" : filter === "lunas" ? "jam" : "centang")}
              </div>

              ${
                cari
                  ? `Tidak ada siswa yang cocok dengan “${esc(ui.cariStatus.trim())}”.`
                  : filter === "lunas"
                    ? "Belum ada yang lunas pada periode ini."
                    : "Semua siswa sudah lunas."
              }

            </div>

          </div>
        `;
}

/* ============================================================
   KAS MASUK
============================================================ */

function pageKasMasuk() {
  const canManage = session.role === "bendahara" && myPos() === ui.pos;

  const editing = DB.kasMasuk.find((x) => x.id === ui.editKasId);

  const meta = posMeta(ui.pos);

  const nom = nominalPos(ui.pos);

  const { semua: semuaRows, rows } = riwayatMasuk();

  const pending = DB.bukti.filter(
    (b) => b.pos === ui.pos && b.status === "pending",
  );

  return `
    <div class="page-head">

      <h1>
        Kas Masuk
      </h1>

      <p>
        Total
        ${meta.label}:
        <strong class="rp">
          ${rupiah(totalMasukPos(ui.pos))}
        </strong>
      </p>

    </div>

    ${posTabs()}

    ${
      canManage && pending.length
        ? `
          <div class="form-card">

            <h2 class="card-title">
              ${icon("jam")}
              Menunggu verifikasi
              (${pending.length})
            </h2>

            <ul class="verif">

              ${pending
                .map(
                  (b) => `
                    <li class="verif-item">

                      <button
                        type="button"
                        class="verif-thumb"
                        data-act="lihatBukti"
                        data-id="${b.id}"
                        title="Lihat foto bukti"
                      >
                        <img
                          src="${esc(b.gambar)}"
                          alt="Foto bukti QRIS"
                        >
                      </button>

                      <div class="verif-info">

                        <strong>
                          ${tampilNama(b.siswa)}
                        </strong>

                        <div class="muted">
                          ${fmtDate(b.tanggal)},
                          ${rupiah(b.jumlah)}
                        </div>

                      </div>

                      <div class="verif-aksi">

                        <button
                          class="btn btn-sm btn-primary"
                          data-act="approveBukti"
                          data-id="${b.id}"
                        >
                          Terima
                        </button>

                        <button
                          class="btn btn-sm btn-danger"
                          data-act="rejectBukti"
                          data-id="${b.id}"
                        >
                          Tolak
                        </button>

                      </div>

                    </li>
                  `,
                )
                .join("")}

            </ul>

          </div>
        `
        : ""
    }

    ${
      canManage
        ? `
          <div class="form-card">

            <h2 class="card-title">
              ${editing ? icon("pensil") : icon("tambah")}
              ${editing ? "Edit setoran" : "Catat kas masuk"}
            </h2>

            <form
              data-form="kasMasuk"
            >

              <input
                type="hidden"
                name="id"
                value="${editing ? editing.id : ""}"
              >

              <div
                class="
                  form-row
                  cols-3
                "
              >

                <div class="field">

                  <label>
                    Siswa
                  </label>

                  <select
                    name="siswa"
                    required
                  >

                    <option value="">
                      Pilih siswa...
                    </option>

                    ${SISWA_MASTER.map(
                      (name) => `
                        <option
                          value="${esc(name)}"
                          ${editing && editing.siswa === name ? "selected" : ""}
                        >
                          ${tampilNama(name)}
                        </option>
                      `,
                    ).join("")}

                  </select>

                </div>

                <div class="field">

                  <label>
                    Tanggal
                  </label>

                  <input
                    type="date"
                    name="tanggal"
                    value="${editing ? editing.tanggal : todayStr()}"
                    required
                  >

                </div>

                <div class="field">

                  <label>
                    Jumlah
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    max="999999999"
                    name="jumlah"
                    value="${editing ? editing.jumlah : nom.jumlah || ""}"
                    required
                  >

                </div>

              </div>

              <div
                class="
                  form-row
                  cols-2
                "
              >

                <div class="field">

                  <label>
                    Metode
                  </label>

                  <select
                    name="metode"
                  >

                    <option
                      value="Tunai"
                      ${editing && editing.metode === "QRIS" ? "" : "selected"}
                    >
                      Tunai
                    </option>

                    <option
                      value="QRIS"
                      ${editing && editing.metode === "QRIS" ? "selected" : ""}
                    >
                      QRIS
                    </option>

                  </select>

                </div>

                <div class="field">

                  <label>
                    Keterangan
                  </label>

                  <input
                    name="keterangan"
                    placeholder="Keterangan"
                    value="${editing ? esc(editing.keterangan || "") : ""}"
                  >

                </div>

              </div>

              <div class="form-actions">

                <button
                  class="
                    btn
                    btn-primary
                  "
                  type="submit"
                >
                  ${editing ? "Simpan perubahan" : "Simpan"}
                </button>

                ${
                  editing
                    ? `
                      <button
                        type="button"
                        class="
                          btn
                          btn-outline
                        "
                        data-act="cancelEditKas"
                      >
                        Batal
                      </button>
                    `
                    : ""
                }

              </div>

            </form>

          </div>
        `
        : ""
    }

    ${
      session.role === "siswa"
        ? `
          <div class="form-card">

            <h2 class="card-title">
              ${icon("unggah")}
              Upload bukti transfer
            </h2>

            <form
              data-form="bukti"
            >

              <div
                class="
                  form-row
                  cols-3
                "
              >

                <div class="field">

                  <label>
                    Tanggal
                  </label>

                  <input
                    type="date"
                    name="tanggal"
                    value="${todayStr()}"
                    required
                  >

                </div>

                <div class="field">

                  <label>
                    Jumlah
                  </label>

                  <input
                    type="number"
                    name="jumlah"
                    min="1"
                    step="1"
                    max="999999999"
                    value="${nom.jumlah || ""}"
                    required
                  >

                </div>

                <div class="field">

                  <label>
                    Catatan
                  </label>

                  <input
                    name="catatan"
                    placeholder="Catatan"
                  >

                </div>

              </div>

              <div class="field">

                <label>
                  Gambar bukti transfer
                </label>

                <input
                  type="file"
                  name="gambarFile"
                  accept="image/*"
                  required
                >

              </div>

              <button
                class="
                  btn
                  btn-primary
                "
                type="submit"
              >
                Kirim untuk diverifikasi
              </button>

            </form>

          </div>
        `
        : ""
    }

    <div class="section-title">

      <h2>
        Riwayat ${meta.label}
      </h2>

      <span class="muted" id="info-masuk" role="status" aria-live="polite">
        ${esc(Fitur.infoFilter("masuk", rows.length, semuaRows.length))}
      </span>

    </div>

    ${semuaRows.length ? Fitur.barFilter("masuk") : ""}

    <div id="hasil-masuk">
      ${renderKasTable(rows, canManage, false, semuaRows.length)}
    </div>
  `;
}

// Riwayat kas masuk untuk pos yang sedang dibuka: semua catatan dan yang lolos
// pencarian/filter. Dipakai halaman ini dan penyegaran hasil saat mengetik.
function riwayatMasuk() {
  const canManage = session.role === "bendahara" && myPos() === ui.pos;

  const semua = DB.kasMasuk
    .filter((x) => x.pos === ui.pos)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return { canManage, semua, rows: Fitur.saringMasuk(semua) };
}

function riwayatMasukHtml() {
  const { canManage, semua, rows } = riwayatMasuk();

  return renderKasTable(rows, canManage, false, semua.length);
}

function renderKasTable(
  rows,
  editable,
  tanpaSiswa = false,
  jumlahSemua = rows.length,
) {
  if (!rows.length) {
    const tersaring = jumlahSemua > 0;

    return `
      <div class="table-wrap">

        <div class="empty">

          <div class="big">
            ${icon(tersaring ? "cari" : "dompet")}
          </div>

          ${
            tersaring
              ? "Tidak ada catatan yang cocok dengan pencarian atau filter."
              : "Belum ada catatan kas masuk."
          }

        </div>

      </div>
    `;
  }

  return `
    <div class="table-wrap">

      <table class="t-kas${tanpaSiswa ? " saya" : ""}">

        <thead>

          <tr>

            <th>
              Tanggal
            </th>

            ${tanpaSiswa ? "" : "<th>Siswa</th>"}

            <th class="num">
              Jumlah
            </th>

            <th>
              Metode
            </th>

            <th>
              Keterangan
            </th>

            ${tanpaSiswa ? "" : "<th>Pencatat</th>"}

            ${editable ? "<th>Aksi</th>" : ""}

          </tr>

        </thead>

        <tbody>

          ${rows
            .map(
              (row) => `
                <tr>

                  <td
                    data-label="Tanggal"
                    class="mono"
                  >
                    ${fmtDate(row.tanggal)}
                  </td>

                  ${
                    tanpaSiswa
                      ? ""
                      : `<td data-label="Siswa">${tampilNama(row.siswa)}</td>`
                  }

                  <td
                    data-label="Jumlah"
                    class="rp"
                  >
                    ${rupiah(row.jumlah)}
                  </td>

                  <td
                    data-label="Metode"
                  >

                    <span class="badge badge-info">
                      ${esc(row.metode || "Tunai")}
                    </span>

                  </td>

                  <td
                    data-label="Keterangan"
                    class="${row.keterangan ? "" : "kosong"}"
                  >
                    ${esc(row.keterangan || "-")}
                  </td>

                  ${
                    tanpaSiswa
                      ? ""
                      : `<td data-label="Pencatat" class="pencatat">${Fitur.namaPencatat(row)}</td>`
                  }

                  ${
                    editable
                      ? `
                        <td
                          data-label="Aksi"
                        >

                          <button
                            class="
                              btn
                              btn-sm
                              btn-outline
                            "
                            data-act="editKas"
                            data-id="${row.id}"
                            aria-label="Edit setoran ${tampilNama(row.siswa)}"
                          >
                            Edit
                          </button>

                          <button
                            class="
                              btn
                              btn-sm
                              btn-danger
                            "
                            data-act="delKas"
                            data-id="${row.id}"
                            aria-label="Hapus setoran ${tampilNama(row.siswa)}"
                          >
                            Hapus
                          </button>

                        </td>
                      `
                      : ""
                  }

                </tr>
              `,
            )
            .join("")}

        </tbody>

      </table>

    </div>
  `;
}

/* ============================================================
   PENGELUARAN
============================================================ */

function pagePengeluaran() {
  const canManage = session.role === "bendahara" && myPos() === ui.pos;

  const editing = DB.pengeluaran.find((x) => x.id === ui.editPengeluaranId);

  const meta = posMeta(ui.pos);

  const { semua: semuaRows, rows } = riwayatKeluar();

  return `
    <div class="page-head">

      <h1>
        Pengeluaran
      </h1>

      <p>
        Total:
        <strong class="rp">
          ${rupiah(totalKeluarPos(ui.pos))}
        </strong>
      </p>

    </div>

    ${posTabs()}

    ${
      canManage
        ? `
          <div class="form-card">

            <h2 class="card-title">
              ${editing ? icon("pensil") : icon("tambah")}
              ${editing ? "Edit pengeluaran" : "Catat pengeluaran"}
            </h2>

            <form
              data-form="pengeluaran"
            >

              <input
                type="hidden"
                name="id"
                value="${editing ? editing.id : ""}"
              >

              <div
                class="
                  form-row
                  cols-3
                "
              >

                <div class="field">

                  <label>
                    Tanggal
                  </label>

                  <input
                    type="date"
                    name="tanggal"
                    value="${editing ? editing.tanggal : todayStr()}"
                    required
                  >

                </div>

                <div class="field">

                  <label>
                    Kategori
                  </label>

                  <select
                    name="kategori"
                  >

                    ${KATEGORI_PENGELUARAN.map(
                      (k) => `
                        <option
                          ${editing && editing.kategori === k ? "selected" : ""}
                        >
                          ${k}
                        </option>
                      `,
                    ).join("")}

                  </select>

                </div>

                <div class="field">

                  <label>
                    Jumlah
                  </label>

                  <input
                    type="number"
                    name="jumlah"
                    min="1"
                    step="1"
                    max="999999999"
                    value="${editing ? editing.jumlah : ""}"
                    required
                  >

                </div>

              </div>

              <div class="field">

                <label>
                  Keterangan
                </label>

                <input
                  name="keterangan"
                  required
                  placeholder="mis. beli spidol"
                  value="${editing ? esc(editing.keterangan || "") : ""}"
                >

              </div>

              <div
                class="form-actions"
              >

                <button
                  class="
                    btn
                    btn-primary
                  "
                  type="submit"
                >
                  ${editing ? "Simpan perubahan" : "Simpan"}
                </button>

                ${
                  editing
                    ? `
                      <button
                        type="button"
                        class="
                          btn
                          btn-outline
                        "
                        data-act="cancelEditPengeluaran"
                      >
                        Batal
                      </button>
                    `
                    : ""
                }

              </div>

            </form>

          </div>
        `
        : ""
    }

    <div class="section-title">

      <h2>
        Riwayat pengeluaran
      </h2>

      <span class="muted" id="info-keluar" role="status" aria-live="polite">
        ${esc(Fitur.infoFilter("keluar", rows.length, semuaRows.length))}
      </span>

    </div>

    ${semuaRows.length ? Fitur.barFilter("keluar") : ""}

    <div id="hasil-keluar">
      ${renderKeluarTable(rows, canManage, semuaRows.length)}
    </div>
  `;
}

// Riwayat pengeluaran untuk pos yang sedang dibuka (semua catatan + hasil filter).
function riwayatKeluar() {
  const canManage = session.role === "bendahara" && myPos() === ui.pos;

  const semua = DB.pengeluaran
    .filter((x) => x.pos === ui.pos)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return { canManage, semua, rows: Fitur.saringKeluar(semua) };
}

function riwayatKeluarHtml() {
  const { canManage, semua, rows } = riwayatKeluar();

  return renderKeluarTable(rows, canManage, semua.length);
}

function renderKeluarTable(rows, canManage, jumlahSemua = rows.length) {
  return (
    !rows.length
        ? `
          <div class="table-wrap">

            <div class="empty">

              <div class="big">
                ${icon(jumlahSemua > 0 ? "cari" : "keluar")}
              </div>

              ${
                jumlahSemua > 0
                  ? "Tidak ada catatan yang cocok dengan pencarian atau filter."
                  : "Belum ada data pengeluaran."
              }

            </div>

          </div>
        `
        : `
          <div class="table-wrap">

            <table class="t-keluar">

              <thead>

                <tr>

                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Keterangan</th>
                  <th class="num">Jumlah</th>
                  <th>Pencatat</th>

                  ${canManage ? "<th>Aksi</th>" : ""}

                </tr>

              </thead>

              <tbody>

                ${rows
                  .map(
                    (row) => `
                      <tr>

                        <td
                          data-label="Tanggal"
                          class="mono"
                        >
                          ${fmtDate(row.tanggal)}
                        </td>

                        <td
                          data-label="Kategori"
                        >

                          <span
                            class="
                              badge
                              badge-info
                            "
                          >
                            ${esc(row.kategori)}
                          </span>

                        </td>

                        <td
                          data-label="Keterangan"
                        >
                          ${esc(row.keterangan)}
                        </td>

                        <td
                          data-label="Jumlah"
                          class="rp"
                        >
                          ${rupiah(row.jumlah)}
                        </td>

                        <td data-label="Pencatat" class="pencatat">
                          ${Fitur.namaPencatat(row)}
                        </td>

                        ${
                          canManage
                            ? `
                              <td
                                data-label="Aksi"
                              >

                                <button
                                  class="
                                    btn
                                    btn-sm
                                    btn-outline
                                  "
                                  data-act="editPengeluaran"
                                  data-id="${row.id}"
                                >
                                  Edit
                                </button>

                                <button
                                  class="
                                    btn
                                    btn-sm
                                    btn-danger
                                  "
                                  data-act="delPengeluaran"
                                  data-id="${row.id}"
                                >
                                  Hapus
                                </button>

                              </td>
                            `
                            : ""
                        }

                      </tr>
                    `,
                  )
                  .join("")}

              </tbody>

            </table>

          </div>
        `
  );
}

/* ============================================================
   TARGET
============================================================ */

function pageTarget() {
  const canManage = session.role === "bendahara" && myPos() === ui.pos;

  const editing = DB.target.find((x) => x.id === ui.editTargetId);

  const meta = posMeta(ui.pos);

  const rows = DB.target
    .filter((x) => x.pos === ui.pos)
    .sort((a, b) => b.createdAt - a.createdAt);

  return `
    <div class="page-head">

      <h1>
        Target Pembelian
      </h1>

      <p>
        Rencana penggunaan dana
      </p>

    </div>

    ${posTabs()}

    ${
      canManage
        ? `
          <div class="form-card">

            <h2 class="card-title">
              ${editing ? icon("pensil") : icon("tambah")}
              ${editing ? "Edit target" : "Tambah target"}
            </h2>

            <form
              data-form="target"
            >

              <input
                type="hidden"
                name="id"
                value="${editing ? editing.id : ""}"
              >

              <div
                class="
                  form-row
                  cols-2
                "
              >

                <div class="field">

                  <label>
                    Nama target
                  </label>

                  <input
                    name="nama"
                    required
                    placeholder="Misal. Baju kelas"
                    value="${editing ? esc(editing.nama) : ""}"
                  >

                </div>

                <div class="field">

                  <label>
                    Target dana
                  </label>

                  <input
                    type="number"
                    name="jumlahTarget"
                    min="1"
                    step="1"
                    max="999999999"
                    required
                    value="${editing ? editing.jumlahTarget : ""}"
                  >

                </div>

              </div>

              <div
                class="
                  form-row
                  cols-2
                "
              >

                <div class="field">

                  <label>
                    Terkumpul
                  </label>

                  <input
                    type="number"
                    name="terkumpul"
                    min="0"
                    step="1"
                    max="999999999"
                    value="${editing ? editing.terkumpul : 0}"
                  >

                </div>

                <div class="field">

                  <label>
                    Keterangan
                  </label>

                  <input
                    name="keterangan"
                    value="${editing ? esc(editing.keterangan || "") : ""}"
                  >

                </div>

              </div>

              <div
                class="form-actions"
              >

                <button
                  class="
                    btn
                    btn-primary
                  "
                  type="submit"
                >
                  ${editing ? "Simpan perubahan" : "Simpan target"}
                </button>

                ${
                  editing
                    ? `
                      <button
                        type="button"
                        class="
                          btn
                          btn-outline
                        "
                        data-act="cancelEditTarget"
                      >
                        Batal
                      </button>
                    `
                    : ""
                }

              </div>

            </form>

          </div>
        `
        : ""
    }

    <div
      class="section-title"
    >

      <h2>
        Daftar target
        ${meta.label}
      </h2>

    </div>

    ${
      !rows.length
        ? `
          <div class="table-wrap">

            <div class="empty">

              <div class="big">
                ${icon("target")}
              </div>

              Belum ada target.

            </div>

          </div>
        `
        : rows
            .map((target) => {
              const percent = Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    (target.terkumpul / (target.jumlahTarget || 1)) * 100,
                  ),
                ),
              );

              return `
                <div class="card target-card">

                  <div class="top">

                    <div>

                      <div class="nm">
                        ${esc(target.nama)}
                        ${
                          percent >= 100
                            ? `<span class="badge badge-ok">${icon("centang")}Tercapai</span>`
                            : ""
                        }
                      </div>

                      ${
                        target.keterangan
                          ? `<div class="ket">${esc(target.keterangan)}</div>`
                          : ""
                      }

                    </div>

                    ${
                      canManage
                        ? `
                          <div class="aksi">

                            <button
                              class="btn btn-sm btn-outline"
                              data-act="editTarget"
                              data-id="${target.id}"
                              aria-label="Edit target ${esc(target.nama)}"
                            >
                              Edit
                            </button>

                            <button
                              class="btn btn-sm btn-danger"
                              data-act="delTarget"
                              data-id="${target.id}"
                              aria-label="Hapus target ${esc(target.nama)}"
                            >
                              Hapus
                            </button>

                          </div>
                        `
                        : ""
                    }

                  </div>

                  <div class="meter-row">

                    <div
                      class="progress-outer"
                      role="progressbar"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow="${percent}"
                      aria-label="Terkumpul ${percent} persen untuk ${esc(target.nama)}"
                    >

                      <div
                        class="progress-inner"
                        style="width:${percent}%"
                      ></div>

                    </div>

                    <span class="pct">${percent}%</span>

                  </div>

                  <div class="nums">

                    <span>
                      Terkumpul:
                      <b class="rp">
                        ${rupiah(target.terkumpul)}
                      </b>
                    </span>

                    <span>
                      Target:
                      <b class="rp">
                        ${rupiah(target.jumlahTarget)}
                      </b>
                    </span>

                  </div>

                </div>
              `;
            })
            .join("")
    }
  `;
}

/* ============================================================
   KALENDER
============================================================ */

// Daftar tahun mengikuti tanggal server dan data yang ada (tidak lagi dibatasi
// 2026-2028), supaya kalender tetap bisa dipakai di tahun ajaran berikutnya.
function calendarYears() {
  const sekarang = Number(todayStr().slice(0, 4));

  let awal = Math.min(2026, sekarang);

  let akhir = Math.max(2028, sekarang + 1);

  DB.kasMasuk.forEach((x) => {
    const th = Number(String(x.tanggal || "").slice(0, 4));

    if (th) {
      awal = Math.min(awal, th);

      akhir = Math.max(akhir, th);
    }
  });

  const daftar = [];

  for (let t = awal; t <= akhir; t++) {
    daftar.push(t);
  }

  return daftar;
}

const BULAN_SINGKAT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

// Satu sel matriks kalender. Status dibaca lewat bentuk (terisi + centang),
// kata tersembunyi untuk pembaca layar, dan title untuk kursor.
function selKalender(kelas, bayar, mendatang, sekarang, judul) {
  const kata = bayar
    ? "Sudah bayar"
    : mendatang
      ? "Belum waktunya"
      : "Belum bayar";

  return `<td class="mx-cell ${kelas} ${bayar ? "paid" : ""} ${mendatang ? "future" : ""} ${sekarang ? "hari-ini" : ""}" title="${esc(judul)}"><i></i><span class="sr-only">${kata}</span></td>`;
}

function legendaKalender() {
  return `
    <div class="calendar-legend">

      <span><i class="k-lunas"></i>Sudah bayar</span>

      <span><i></i>Belum bayar</span>

      <span><i class="k-future"></i>Belum waktunya</span>

    </div>
  `;
}

function pageKalender() {
  const meta = posMeta(ui.pos);

  const nom = nominalPos(ui.pos);

  const years = calendarYears();

  const year = years.includes(Number(ui.kalenderTahun))
    ? Number(ui.kalenderTahun)
    : Number(todayStr().slice(0, 4));

  const month = Math.min(12, Math.max(1, Number(ui.kalenderBulan) || 1));

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const hariIni = todayStr();

  const pilihTahun = (label) => `
    <div class="field">

      <label>
        ${label}
      </label>

      <select data-act-change="setKalenderTahun">

        ${years
          .map(
            (y) => `
              <option
                value="${y}"
                ${y === year ? "selected" : ""}
              >
                Tahun ${y}
              </option>
            `,
          )
          .join("")}

      </select>

    </div>
  `;

  /* =======================================
     ACARA
  ======================================= */

  if (nom.frekuensi === "Sesuai kebutuhan") {
    return `
      <div class="page-head">

        <h1>
          Kalender Pembayaran
        </h1>

        <p>
          ${meta.label}
          dikumpulkan
          sesuai kebutuhan.
        </p>

      </div>

      ${posTabs()}

      <div class="table-wrap">

        <div class="empty">

          <div class="big">
            ${icon("kalender")}
          </div>

          Pos ini tidak memiliki
          jadwal pembayaran tetap.

        </div>

      </div>
    `;
  }

  /* =======================================
     KURBAN HARIAN
  ======================================= */

  if (nom.frekuensi === "Harian") {
    const jumlahHari = new Date(year, month, 0).getDate();

    const hariList = Array.from(
      {
        length: jumlahHari,
      },
      (_, index) => ({
        nomor: index + 1,

        tanggal: `${year}-${String(month).padStart(2, "0")}-${String(
          index + 1,
        ).padStart(2, "0")}`,
      }),
    );

    const kepala = hariList
      .map(
        (h) =>
          `<th scope="col" class="${h.tanggal === hariIni ? "hari-ini" : ""}">${h.nomor}</th>`,
      )
      .join("");

    const baris = SISWA_MASTER.map((name, idx) => {
      const bayar = hariList.map((h) =>
        DB.kasMasuk.some((x) =>
          paymentMatchesDay(x, name, year, month, h.nomor, ui.pos),
        ),
      );

      return `
        <tr class="calendar-person">

          <th scope="row" class="mx-no">${idx + 1}</th>

          <th scope="row" class="mx-nama" title="${tampilNama(name)}">${tampilNama(name)}</th>

          <td class="mx-total">${bayar.filter(Boolean).length}/${jumlahHari}</td>

          ${hariList
            .map((h, k) =>
              selKalender(
                "calendar-day",
                bayar[k],
                h.tanggal > hariIni,
                h.tanggal === hariIni,
                `${fmtDate(h.tanggal)}: ${bayar[k] ? "sudah bayar" : "belum bayar"}`,
              ),
            )
            .join("")}

        </tr>
      `;
    }).join("");

    return `
      <div class="page-head">

        <h1>
          Kalender Pembayaran
        </h1>

        <p>
          ${meta.label},
          <strong>
            ${rupiah(nom.jumlah)}
          </strong>
          per hari
        </p>

      </div>

      ${posTabs()}

      <div class="cal-bar">

        ${pilihTahun("Tahun")}

        <div class="field">

          <label>
            Bulan
          </label>

          <select data-act-change="setKalenderBulan">

            ${Array.from(
              {
                length: 12,
              },
              (_, index) => {
                const nama = new Date(2026, index, 1).toLocaleDateString(
                  "id-ID",
                  {
                    month: "long",
                  },
                );

                return `
                  <option
                    value="${index + 1}"
                    ${index + 1 === month ? "selected" : ""}
                  >
                    ${nama}
                  </option>
                `;
              },
            ).join("")}

          </select>

        </div>

        ${legendaKalender()}

      </div>

      <div
        class="section-title"
      >

        <h2>
          ${monthName}
        </h2>

      </div>

      <div
        class="matrix-wrap calendar-list"
        role="region"
        aria-label="Kalender pembayaran ${meta.label} ${monthName}"
        tabindex="0"
      >

        <table class="matrix hari">

          <thead>

            <tr>
              <th scope="col" class="mx-no">No</th>
              <th scope="col" class="mx-nama">Nama</th>
              <th scope="col" class="mx-total">Total</th>
              ${kepala}
            </tr>

          </thead>

          <tbody>
            ${baris}
          </tbody>

        </table>

      </div>
    `;
  }

  /* =======================================
     BULANAN / MINGGUAN
  ======================================= */

  const weekly = nom.frekuensi === "Mingguan";

  const [tahunIni, bulanIni] = hariIni.split("-").map(Number);

  const kepalaBulan = BULAN_SINGKAT.map(
    (nama, i) =>
      `<th scope="col" class="${year === tahunIni && i + 1 === bulanIni ? "hari-ini" : ""}">${nama}</th>`,
  ).join("");

  const baris = SISWA_MASTER.map((name, idx) => {
    const bayar = BULAN_SINGKAT.map((_, index) =>
      DB.kasMasuk.some((x) =>
        calendarMonthHasPayment(x, name, year, index + 1, weekly),
      ),
    );

    return `
      <tr class="calendar-person">

        <th scope="row" class="mx-no">${idx + 1}</th>

        <th scope="row" class="mx-nama" title="${tampilNama(name)}">${tampilNama(name)}</th>

        <td class="mx-total">${bayar.filter(Boolean).length}/12</td>

        ${BULAN_SINGKAT.map((nama, index) =>
          selKalender(
            "calendar-period",
            bayar[index],
            year > tahunIni || (year === tahunIni && index + 1 > bulanIni),
            year === tahunIni && index + 1 === bulanIni,
            `${new Date(year, index, 1).toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}: ${bayar[index] ? "sudah bayar" : "belum bayar"}`,
          ),
        ).join("")}

      </tr>
    `;
  }).join("");

  return `
    <div class="page-head">

      <h1>
        Kalender Pembayaran
      </h1>

      <p>
        Riwayat pembayaran
        ${meta.label}
      </p>

    </div>

    ${posTabs()}

    <div class="cal-bar">

      ${pilihTahun("Pilih tahun")}

      ${legendaKalender()}

    </div>

    <div
      class="matrix-wrap calendar-list"
      role="region"
      aria-label="Kalender pembayaran ${meta.label} tahun ${year}"
      tabindex="0"
    >

      <table class="matrix bulan">

        <thead>

          <tr>
            <th scope="col" class="mx-no">No</th>
            <th scope="col" class="mx-nama">Nama</th>
            <th scope="col" class="mx-total">Total</th>
            ${kepalaBulan}
          </tr>

        </thead>

        <tbody>
          ${baris}
        </tbody>

      </table>

    </div>
  `;
}

/* ============================================================
   QRIS
============================================================ */

function pageQris() {
  const canManage = session.role === "bendahara" && myPos() === ui.pos;

  const meta = posMeta(ui.pos);

  const q = DB.settings.qris[ui.pos];

  return `
    <div class="page-head">

      <h1>
        QRIS
      </h1>

      <p>
        QRIS pembayaran
        ${meta.label}
      </p>

    </div>

    ${posTabs()}

    <div class="card qris-box">

      <div class="pos-chip">
        ${meta.icon}
        ${meta.label}
      </div>

      ${
        q
          ? `
            <img
              src="${esc(q)}"
              alt="QRIS ${meta.label}"
            >
          `
          : `
            <div class="qris-placeholder">

              ${icon("gambar")}

              Belum ada QRIS

            </div>
          `
      }

    </div>

    ${
      canManage
        ? `
          <div class="form-card">

            <h2 class="card-title">
              Kelola QRIS
            </h2>

            <form
              data-form="qris"
            >

              <div
                class="field"
              >

                <label>
                  Upload gambar QRIS
                </label>

                <input
                  type="file"
                  name="qrisFile"
                  accept="image/*"
                >

              </div>

              <div
                class="
                  form-actions
                "
              >

                <button
                  class="
                    btn
                    btn-primary
                  "
                  type="submit"
                >
                  Simpan QRIS
                </button>

                ${
                  q
                    ? `
                      <button
                        type="button"
                        class="
                          btn
                          btn-outline
                        "
                        data-act="removeQris"
                      >
                        Hapus QRIS
                      </button>
                    `
                    : ""
                }

              </div>

            </form>

          </div>
        `
        : ""
    }
  `;
}

function pageKelolaAkun() {
  if (!session || session.role !== "bendahara") return pageDashboard();

  const accounts = DB.accounts
    .slice()
    .sort(
      (a, b) =>
        String(a.role).localeCompare(String(b.role)) ||
        String(a.nama).localeCompare(String(b.nama)),
    );

  return `
    <div class="page-head">

      <h1>Kelola Akun</h1>

      <p>
        Lihat akun yang sudah terdaftar dan reset password bila ada yang lupa.
        Halaman ini hanya untuk bendahara.
      </p>

    </div>

    <div class="form-card">

      <h2 class="card-title">
        ${icon("akun")}
        Daftar akun (${accounts.length})
      </h2>

      ${
        accounts.length
          ? `
            <div class="table-wrap">

              <table class="t-akun">

                <thead>

                  <tr>
                    <th>Nama</th>
                    <th>Username</th>
                    <th>Peran</th>
                    <th>Aksi</th>
                  </tr>

                </thead>

                <tbody>

                  ${accounts
                    .map(
                      (a) => `
                        <tr>

                          <td data-label="Nama">${tampilNama(a.nama)}</td>

                          <td data-label="Username">${esc(a.username)}</td>

                          <td data-label="Peran">${a.role === "bendahara" ? esc(a.jabatan || "Bendahara") : "Siswa"}</td>

                          <td data-label="Aksi">

                            <div class="form-actions">

                              <button
                                class="btn btn-outline btn-sm"
                                data-act="resetAkun"
                                data-id="${a.id}"
                                aria-label="Reset password ${tampilNama(a.nama)}"
                              >
                                Reset password
                              </button>

                              ${
                                a.id !== session.id
                                  ? `
                                    <button
                                      class="btn btn-danger btn-sm"
                                      data-act="hapusAkun"
                                      data-id="${a.id}"
                                      aria-label="Hapus akun ${tampilNama(a.nama)}"
                                    >
                                      Hapus
                                    </button>
                                  `
                                  : `<span class="muted">Akun Anda</span>`
                              }

                            </div>

                          </td>

                        </tr>
                      `,
                    )
                    .join("")}

                </tbody>

              </table>

            </div>
          `
          : `<div class="empty">Belum ada akun terdaftar.</div>`
      }

    </div>

    <div class="form-card">

      <h2 class="card-title">
        ${icon("info")}
        Informasi
      </h2>

      <p class="muted">
        Reset password membuat password sementara yang acak dan hanya
        ditampilkan sekali kepadamu. Berikan ke pemilik akun, lalu minta ia
        segera menggantinya di Pengaturan. Perangkat yang sedang memakai akun
        itu otomatis dikeluarkan.
      </p>

    </div>
  `;
}

/* ============================================================
   PENGATURAN
============================================================ */

function pagePengaturan() {
  const isB = session.role === "bendahara";

  const me = DB.accounts.find((a) => a.id === session.id);

  const currentUsername = (me && me.username) || session.username || "";

  const myNom = isB ? nominalPos(myPos()) : null;

  return `
    <div
      class="
        page-head
      "
    >

      <h1>
        Pengaturan
      </h1>

      <p>
        Ubah username, password,
        dan pengaturan aplikasi.
      </p>

    </div>

    <div
      class="
        settings-block
      "
    >

      <h2 class="card-title">
        Ganti username
      </h2>

      <div class="form-card">

        <form
          data-form="gantiUsername"
        >

          <div
            class="
              form-row
              cols-3
            "
          >

            <div class="field">

              <label>
                Username saat ini
              </label>

              <input
                value="${esc(currentUsername)}"
                disabled
              >

            </div>

            <div class="field">

              <label>
                Username baru
              </label>

              <input
                type="text"
                name="username"
                autocomplete="off"
                autocapitalize="none"
                spellcheck="false"
                minlength="3"
                maxlength="30"
                required
              >

            </div>

            <div class="field">

              <label>
                Password (untuk konfirmasi)
              </label>

              <input
                type="password"
                name="password"
                autocomplete="current-password"
                required
              >

            </div>

          </div>

          <button
            class="
              btn
              btn-primary
            "
            type="submit"
          >
            Simpan username
          </button>

        </form>

      </div>

    </div>

    <div
      class="
        settings-block
      "
    >

      <h2 class="card-title">
        Ganti password
      </h2>

      <div class="form-card">

        <form
          data-form="gantiPassword"
        >

          <div
            class="
              form-row
              cols-3
            "
          >

            <div class="field">

              <label>
                Password lama
              </label>

              <input
                type="password"
                name="lama"
                autocomplete="current-password"
                required
              >

            </div>

            <div class="field">

              <label>
                Password baru
              </label>

              <input
                type="password"
                name="baru"
                autocomplete="new-password"
                minlength="6"
                maxlength="72"
                required
              >

            </div>

            <div class="field">

              <label>
                Ulangi password baru
              </label>

              <input
                type="password"
                name="baru2"
                autocomplete="new-password"
                minlength="6"
                maxlength="72"
                required
              >

            </div>

          </div>

          <button
            class="
              btn
              btn-primary
            "
            type="submit"
          >
            Simpan password
          </button>

        </form>

      </div>

    </div>

    ${
      isB && myPos()
        ? `
          <div
            class="
              settings-block
            "
          >

            <h2 class="card-title">
              Nominal
              ${posMeta(myPos()).label}
            </h2>

            ${
              myPos() === "Acara"
                ? `
                  <div class="locked-note">
                    ${icon("info")}
                    <span>Nominal dana acara diisi manual setiap transaksi.</span>
                  </div>
                `
                : myPos() === "Kurban"
                  ? `
                    <div class="locked-note">
                      ${icon("info")}
                      <span>Nominal Kurban: <strong>Rp 1.000 per hari</strong></span>
                    </div>
                  `
                  : `
                    <div
                      class="
                        form-card
                      "
                    >

                      <form
                        data-form="nominal"
                      >

                        <div
                          class="
                            form-row
                            cols-2
                          "
                        >

                          <div
                            class="field"
                          >

                            <label>
                              Nominal
                            </label>

                            <input
                              type="number"
                              name="nominal"
                              min="0"
                              step="1"
                              max="999999999"
                              value="${myNom.jumlah}"
                              required
                            >

                          </div>

                          <div
                            class="field"
                          >

                            <label>
                              Frekuensi
                            </label>

                            <input
                              value="${esc(myNom.frekuensi)}"
                              disabled
                            >

                          </div>

                        </div>

                        <button
                          class="
                            btn
                            btn-primary
                          "
                          type="submit"
                        >
                          Simpan
                        </button>

                      </form>

                    </div>
                  `
            }

          </div>
        `
        : ""
    }
  `;
}

/* ============================================================
   EVENTS
============================================================ */

function afterRender() {
  const app = document.getElementById("app");

  app
    .querySelectorAll("[data-act]")
    .forEach((element) => element.addEventListener("click", onAction));

  app
    .querySelectorAll("[data-act-change]")
    .forEach((element) => element.addEventListener("change", onActionChange));

  app
    .querySelectorAll("form[data-form]")
    .forEach((form) => form.addEventListener("submit", onSubmit));

  hubungkanLabel();

  pasangTooltipPapan();

  gulirKeKolomIni();

  fokusKolomAuth();

  // grafik digambar sesuai lebar kotaknya; kolom cari/filter diikat ke penanganya
  Fitur.sesudahRender(app);

  // animasi petak hanya dimainkan sekali, saat dashboard dibuka
  ui.papanAnim = false;
}

// Setelah masuk/daftar gagal, arahkan fokus ke kolom yang perlu dibetulkan
// (pesan galatnya sudah dibacakan lewat role="alert").
function fokusKolomAuth() {
  if (!ui.fokusAuth) {
    return;
  }

  const kolom = document.querySelector(
    '#app .auth-card form [name="' + ui.fokusAuth + '"]',
  );

  ui.fokusAuth = null;

  if (kolom) {
    // hubungkan kolom dengan pesan galat agar pembaca layar ikut membacakannya
    // (hanya bila memang ada galat; setelah berhasil kolom tidak "tidak valid")
    if (ui.msg && ui.msg.type === "error") {
      kolom.setAttribute("aria-invalid", "true");

      kolom.setAttribute("aria-describedby", "auth-pesan");
    }

    kolom.focus();
  }
}

// Kalender: geser matriks supaya hari/bulan ini langsung terlihat di HP
// (dua kolom pertama menempel, sisanya bisa digeser).
function gulirKeKolomIni() {
  document.querySelectorAll("#app .matrix-wrap").forEach((wrap) => {
    const kolom = wrap.querySelector("thead th.hari-ini");

    if (!kolom || wrap.scrollWidth <= wrap.clientWidth) {
      return;
    }

    const tetap = [".mx-no", ".mx-nama"].reduce((jumlah, selektor) => {
      const sel = wrap.querySelector(`thead ${selektor}`);

      return jumlah + (sel ? sel.offsetWidth : 0);
    }, 0);

    const ruang = wrap.clientWidth - tetap;

    wrap.scrollLeft = Math.max(
      0,
      kolom.offsetLeft - tetap - (ruang - kolom.offsetWidth) / 2,
    );
  });
}

// Hubungkan setiap <label> dengan isiannya (for/id) supaya mengetuk label
// memfokuskan isian dan pembaca layar membacakan namanya.
let hitungIsian = 0;

function hubungkanLabel() {
  document.querySelectorAll("#app .field").forEach((kotak) => {
    const label = kotak.querySelector("label");

    const isian = kotak.querySelector(
      "input:not([type=hidden]), select, textarea",
    );

    if (!label || !isian || label.htmlFor) {
      return;
    }

    if (!isian.id) {
      hitungIsian += 1;

      isian.id = "fld-" + hitungIsian;
    }

    label.htmlFor = isian.id;
  });
}

// Satu tooltip untuk seluruh papan absen: muncul saat kursor mouse berada di
// atas petak atau saat petak difokus lewat papan ketik. Isinya dipasang dengan
// textContent (nama berasal dari data, bukan HTML).
function pasangTooltipPapan() {
  const papan = document.querySelector("#app .papan");

  const tip = papan && papan.querySelector(".tip");

  if (!papan || !tip) {
    return;
  }

  const tampil = (tile) => {
    const nama = document.createElement("b");

    nama.textContent = `No. ${tile.dataset.no}, ${titleCase(tile.dataset.nama)}`;

    const status = document.createElement("span");

    status.textContent = tile.dataset.status;

    tip.textContent = "";

    tip.append(nama, status);

    tip.hidden = false;

    const kotak = papan.getBoundingClientRect();

    const petak = tile.getBoundingClientRect();

    let kiri = petak.left - kotak.left + petak.width / 2 - tip.offsetWidth / 2;

    kiri = Math.max(8, Math.min(kiri, kotak.width - tip.offsetWidth - 8));

    let atas = petak.top - kotak.top - tip.offsetHeight - 8;

    if (atas < 4) {
      atas = petak.bottom - kotak.top + 8;
    }

    tip.style.left = kiri + "px";

    tip.style.top = atas + "px";
  };

  const sembunyi = () => {
    tip.hidden = true;
  };

  papan.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") {
        tampil(tile);
      }
    });

    tile.addEventListener("pointerleave", sembunyi);

    tile.addEventListener("focus", () => {
      let keyboard = true;

      try {
        keyboard = tile.matches(":focus-visible");
      } catch (err) {
        keyboard = true;
      }

      if (keyboard) {
        tampil(tile);
      }
    });

    tile.addEventListener("blur", sembunyi);
  });
}

function onActionChange(e) {
  const el = e.currentTarget;

  // trim(): jaga-jaga bila nilai atribut berisi spasi/baris baru
  // (kalau tidak, pilihan Tahun/Bulan di Kalender tidak akan pernah cocok).
  const act = String(el.dataset.actChange || "").trim();

  // Ganti peran di halaman lupa password: kolom kode bendahara ikut muncul/hilang
  if (act === "forgotRole") {
    const form = el.closest("form");

    const isi = (nama) => {
      const kolom = form && form.querySelector(`[name="${nama}"]`);

      return kolom ? kolom.value : "";
    };

    ui.authDraft = {
      role: e.target.value,

      username: isi("username"),

      nama: isi("nama"),
    };

    ui.msg = null;

    ui.fokusAuth = "role";

    render();

    return;
  }

  if (act === "setKalenderTahun") {
    ui.kalenderTahun = Number(e.target.value) || Number(todayStr().slice(0, 4));

    render();

    return;
  }

  if (act === "setKalenderBulan") {
    ui.kalenderBulan = Number(e.target.value) || 1;

    render();

    return;
  }
}

/* ============================================================
   ACTION
============================================================ */

function onAction(e) {
  const el = e.currentTarget;

  const act = el.dataset.act;

  const id = el.dataset.id;

  // grafik, filter, rekap, laporan (fitur.js)
  if (Fitur.aksi(act, el, e)) {
    return;
  }

  /* MOBILE MENU */

  if (act === "toggleMobileMenu") {
    ui.mobileMenuOpen = !ui.mobileMenuOpen;

    ui.notifOpen = false;

    ui.notifBaruIds = [];

    render();

    // menu terbuka: fokus masuk ke menu; tertutup: kembali ke tombol menu
    const tujuan = ui.mobileMenuOpen
      ? document.querySelector(".mobile-menu .mobile-menu-close")
      : document.querySelector(".mobile-menu-btn");

    if (tujuan) {
      tujuan.focus();
    }

    return;
  }

  if (act === "closeMobileMenu") {
    ui.mobileMenuOpen = false;

    render();

    const tombolMenu = document.querySelector(".mobile-menu-btn");

    if (tombolMenu && tombolMenu.offsetParent !== null) {
      tombolMenu.focus();
    }

    return;
  }

  /* AUTH */

  if (act === "loginTab") {
    ui.loginTab = el.dataset.val;

    ui.authDraft = null;

    ui.msg = null;

    render();

    return;
  }

  if (act === "regRole") {
    ui.regRole = el.dataset.val;

    ui.authDraft = null;

    ui.msg = null;

    render();

    return;
  }

  if (act === "goForgot") {
    ui.authView = "forgot";
    ui.authDraft = { role: ui.loginTab || "siswa" };
    ui.msg = null;
    ui.fokusAuth = null;
    render();
    return;
  }

  if (act === "goRegister") {
    ui.authView = "register";

    ui.authDraft = null;

    ui.msg = null;

    render();

    // daftar nama yang masih bebas bisa sudah berubah sejak halaman dibuka
    segarkanMeta().then((ok) => {
      if (ok && ui.authView === "register" && !sedangMengetik()) {
        render();
      }
    });

    return;
  }

  if (act === "muatUlang") {
    muatAwal();

    return;
  }

  if (act === "tutupSandi") {
    ui.passwordSementara = null;

    closeDialog();

    render();

    return;
  }

  if (act === "salinSandi") {
    const sandi = ui.passwordSementara && ui.passwordSementara.sandi;

    if (!sandi) {
      return;
    }

    const pilihManual = () => {
      const node = document.getElementById("sandiNilai");

      if (node && window.getSelection) {
        const rentang = document.createRange();

        rentang.selectNodeContents(node);

        const pilihan = window.getSelection();

        pilihan.removeAllRanges();

        pilihan.addRange(rentang);
      }

      showToast("Password sudah dipilih, tekan Ctrl+C untuk menyalin.");
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(sandi)
        .then(() => showToast("Password disalin.", "ok"), pilihManual);
    } else {
      pilihManual();
    }

    return;
  }

  if (act === "goLogin") {
    ui.authView = "login";
    ui.authDraft = null;
    ui.forgotStep = 1;

    ui.msg = null;

    render();

    return;
  }

  /* NAV */

  if (act === "nav") {
    if (
      ["kelolaakun", "kalender", "rekap", "laporan"].includes(
        el.dataset.view,
      ) &&
      session.role !== "bendahara"
    )
      return;
    ui.view = el.dataset.view;

    ui.papanAnim = ui.view === "dashboard";

    ui.mobileMenuOpen = false;

    ui.notifOpen = false;

    ui.notifBaruIds = [];

    render();

    window.scrollTo(0, 0);

    return;
  }

  // Pintasan dari dashboard siswa: buka halaman lain pada pos tertentu.
  if (act === "goPos") {
    ui.pos = el.dataset.val || "Rutin";

    ui.view = el.dataset.view || "dashboard";

    ui.editKasId = null;

    ui.mobileMenuOpen = false;

    ui.notifOpen = false;

    ui.notifBaruIds = [];

    render();

    window.scrollTo(0, 0);

    return;
  }

  // Papan absen: pilih / lepas petak siswa.
  if (act === "pilihSiswa") {
    const nama = el.dataset.nama;

    ui.siswaPilih = ui.siswaPilih === nama ? null : nama;

    render();

    return;
  }

  // Filter daftar status: semua / belum bayar / lunas.
  if (act === "filterStatus") {
    ui.filterStatus = el.dataset.val || "semua";

    render();

    return;
  }

  if (act === "setPos") {
    ui.pos = el.dataset.val;

    ui.editKasId = null;

    ui.editPengeluaranId = null;

    ui.editTargetId = null;

    render();

    return;
  }

  if (act === "toggleTheme") {
    toggleTheme();

    return;
  }

  if (act === "logout") {
    doLogout();

    return;
  }

  /* NOTIFIKASI & PENGINGAT */

  if (act === "toggleNotif") {
    if (ui.notifOpen) {
      tutupNotif();
    } else {
      bukaNotif();
    }

    return;
  }

  if (act === "closeNotif") {
    tutupNotif();

    return;
  }

  if (act === "kirimPengingat") {
    kirimPengingat(el.dataset.nama, el);

    return;
  }

  if (act === "kirimPengingatSemua") {
    kirimPengingatSemua();

    return;
  }

  /* KAS */

  if (act === "editKas") {
    ui.editKasId = id;

    render();

    return;
  }

  if (act === "cancelEditKas") {
    ui.editKasId = null;

    render();

    return;
  }

  if (act === "delKas") {
    confirmAction("Hapus catatan kas?", "Data ini akan dihapus.", () =>
      hapusDiServer("kas_hapus", id, "Catatan kas dihapus."),
    );

    return;
  }

  /* PENGELUARAN */

  if (act === "editPengeluaran") {
    ui.editPengeluaranId = id;

    render();

    return;
  }

  if (act === "cancelEditPengeluaran") {
    ui.editPengeluaranId = null;

    render();

    return;
  }

  if (act === "delPengeluaran") {
    confirmAction("Hapus pengeluaran?", "Data ini akan dihapus.", () =>
      hapusDiServer("keluar_hapus", id, "Pengeluaran dihapus."),
    );

    return;
  }

  /* TARGET */

  if (act === "editTarget") {
    ui.editTargetId = id;

    render();

    return;
  }

  if (act === "cancelEditTarget") {
    ui.editTargetId = null;

    render();

    return;
  }

  if (act === "delTarget") {
    confirmAction("Hapus target?", "Target ini akan dihapus.", () =>
      hapusDiServer("target_hapus", id, "Target dihapus."),
    );

    return;
  }

  /* KELOLA AKUN - khusus bendahara */
  if (act === "resetAkun") {
    if (session.role !== "bendahara") return;
    confirmAction(
      "Reset password akun?",
      "Server membuatkan password sementara yang acak. Berikan ke pemilik akun, lalu minta ia menggantinya di Pengaturan.",
      () =>
        ubahData(null, async () => {
          const akun = DB.accounts.find((a) => a.id === id);

          const j = await api("akun_reset", { data: { id } });

          await setelahUbah();

          ui.passwordSementara = {
            nama: akun ? akun.nama : "akun ini",
            username: akun ? akun.username : "",
            sandi: j.sementara,
          };

          render();
        }),
      { yesLabel: "Ya, reset", yesClass: "btn-danger" },
    );
    return;
  }
  if (act === "hapusAkun") {
    if (session.role !== "bendahara" || id === session.id) return;
    confirmAction(
      "Hapus akun?",
      "Akun ini tidak dapat digunakan lagi untuk login. Catatan kas yang pernah dibuatnya tetap tersimpan.",
      () =>
        ubahData(null, async () => {
          const j = await api("akun_hapus", { data: { id } });

          if (j.tersedia) {
            META.tersedia = j.tersedia;
          }

          await setelahUbah();

          showToast("Akun dihapus.", "ok");
        }),
    );
    return;
  }

  /* BUKTI */

  if (act === "lihatBukti") {
    if (session.role !== "bendahara") return;
    const bukti = DB.bukti.find((x) => x.id === id);
    if (bukti && bukti.gambar) {
      // gambar disajikan server (hanya untuk bendahara pos ini); tab baru
      // tanpa akses ke halaman ini (noopener)
      window.open(bukti.gambar, "_blank", "noopener,noreferrer");
    }
    return;
  }

  if (act === "approveBukti") {
    confirmAction("Terima bukti?", "Kas masuk akan dicatat otomatis.", () =>
      ubahData(null, async () => {
        await api("bukti_terima", { data: { id } });

        await setelahUbah();

        showToast("Bukti diterima dan kas masuk dicatat.", "ok");
      }),
    );

    return;
  }

  if (act === "rejectBukti") {
    confirmAction("Tolak bukti?", "Bukti akan ditandai ditolak.", () =>
      ubahData(null, async () => {
        await api("bukti_tolak", { data: { id } });

        await setelahUbah();

        showToast("Bukti ditolak.");
      }),
    );

    return;
  }

  /* QRIS */

  if (act === "removeQris") {
    if (!(session.role === "bendahara" && myPos() === ui.pos)) {
      return;
    }

    confirmAction(
      "Hapus QRIS?",
      "Siswa tidak akan melihat QRIS pos ini sampai kamu mengunggah yang baru.",
      () =>
        ubahData(null, async () => {
          await api("qris_hapus", { data: {} });

          await setelahUbah();

          showToast("QRIS dihapus.");
        }),
    );

    return;
  }

  /* DIALOG */

  if (act === "confirmYes") {
    const callback = ui.confirmDialog && ui.confirmDialog.onYes;

    const balik = ui.fokusSebelumDialog;

    ui.confirmDialog = null;

    ui.fokusSebelumDialog = null;

    closeDialog();

    // callback boleh async (simpan ke server); fokus dipulihkan setelah selesai
    Promise.resolve(callback ? callback() : null).finally(() =>
      pulihkanFokus(balik),
    );

    return;
  }

  if (act === "confirmNo") {
    batalDialog();

    return;
  }
}

/* ============================================================
   SUBMIT
============================================================ */

function onSubmit(e) {
  e.preventDefault();

  const form = e.currentTarget;

  const type = form.dataset.form;

  const fd = new FormData(form);

  const val = (key) => (fd.get(key) || "").toString().trim();

  // password dibaca apa adanya: spasi di awal/akhir adalah bagian password
  const mentah = (key) => (fd.get(key) || "").toString();

  // tombol kirim: dikunci selama permintaan ke server berjalan
  const tombol = form.querySelector('[type="submit"]');

  if (type === "login") {
    doLogin(val("role"), val("username"), mentah("password"), tombol);

    return;
  }

  if (type === "forgotPassword") {
    doResetPassword(
      val("role"),
      val("username"),
      val("nama"),
      mentah("password"),
      mentah("password2"),
      val("kode"),
      tombol,
    );

    return;
  }

  if (type === "register") {
    doRegister(
      val("role"),
      val("nama"),
      val("username"),
      mentah("password"),
      mentah("password2"),
      val("kode"),
      tombol,
    );

    return;
  }

  if (type === "kasMasuk") {
    doSaveKas(val, tombol);

    return;
  }

  if (type === "pengeluaran") {
    doSavePengeluaran(val, tombol);

    return;
  }

  if (type === "target") {
    doSaveTarget(val, tombol);

    return;
  }

  if (type === "gantiUsername") {
    doGantiUsername(val("username"), mentah("password"), tombol);

    return;
  }

  if (type === "gantiPassword") {
    doGantiPassword(mentah("lama"), mentah("baru"), mentah("baru2"), tombol);

    return;
  }

  if (type === "nominal") {
    doSaveNominal(Number(val("nominal")), tombol);

    return;
  }

  if (type === "qris") {
    doSaveQris(form.querySelector('[name="qrisFile"]').files[0], tombol);

    return;
  }

  if (type === "bukti") {
    doSaveBukti(val, form.querySelector('[name="gambarFile"]').files[0], tombol);
  }
}

/* ============================================================
   LOGIN / REGISTER
   Semua pemeriksaan penting diulang di server (api/lib); pemeriksaan
   di sini hanya supaya galat langsung terlihat tanpa menunggu server.
============================================================ */

const PASSWORD_MIN = 6;

const POLA_USERNAME = /^[A-Za-z0-9._-]{3,30}$/;

const PESAN_USERNAME =
  "Username 3-30 karakter, hanya huruf, angka, titik, garis bawah, atau strip (tanpa spasi).";

// Tampilkan galat masuk/daftar tanpa menghapus apa yang sudah diketik
// (kecuali password) dan arahkan fokus ke kolom yang perlu dibetulkan.
function galatAuth(teks, draft, fokus) {
  ui.msg = {
    type: "error",

    text: teks,
  };

  ui.authDraft = draft;

  ui.fokusAuth = fokus;

  render();
}

// Kolom yang perlu dibetulkan menurut kode galat dari server.
function kolomGalat(err, cadangan) {
  return ["username", "nama", "password", "kode"].includes(err && err.kode)
    ? err.kode
    : cadangan;
}

// Tampilan kembali ke keadaan awal setiap kali masuk (akun bisa berganti).
function awaliTampilanMasuk() {
  const hari = todayStr();

  ui.view = "dashboard";

  ui.pos = myPos() || "Rutin";

  ui.mobileMenuOpen = false;

  ui.notifOpen = false;

  ui.notifBaruIds = [];

  ui.siswaPilih = null;

  ui.filterStatus = "semua";

  ui.papanAnim = true;

  ui.editKasId = null;

  ui.editPengeluaranId = null;

  ui.editTargetId = null;

  ui.kalenderTahun = Number(hari.slice(0, 4));

  ui.kalenderBulan = Number(hari.slice(5, 7));

  ui.passwordSementara = null;

  ui.authDraft = null;

  ui.fokusAuth = null;

  ui.msg = null;

  stempelTanggal = hari;
}

async function doLogin(role, username, password, tombol) {
  if (!username || !password) {
    galatAuth(
      "Lengkapi username dan password.",
      { username },
      !username ? "username" : "password",
    );

    return;
  }

  await ubahData(
    tombol,

    async () => {
      const j = await api("login", { data: { role, username, password } });

      terapkanLogin(j.user, j.csrf, j.state, j.rev);

      awaliTampilanMasuk();

      render();
    },

    (err) => {
      // server sengaja tidak membedakan "username salah" dan "password salah"
      galatAuth(
        err.message,
        { username },
        err.kode === "login" ? "password" : "username",
      );
    },
  );
}

async function doLogout() {
  if (sedangKirim) {
    return;
  }

  sedangKirim = true;

  try {
    await api("keluar", { data: {} });
  } catch (err) {
    // Server tak terjangkau: sesi di server masih hidup, jadi jangan pura-pura
    // sudah keluar (berbahaya di komputer bersama).
    if (err.kode === "jaringan" || err.status >= 500) {
      sedangKirim = false;

      showToast(
        "Belum bisa keluar karena server tidak terjangkau. Coba lagi sebentar.",
        "error",
      );

      return;
    }
  }

  sedangKirim = false;

  bersihkanLogin();

  ui.authDraft = null;

  ui.authView = "login";

  ui.view = "dashboard";

  ui.pos = "Rutin";

  ui.mobileMenuOpen = false;

  ui.notifOpen = false;

  ui.notifBaruIds = [];

  ui.passwordSementara = null;

  ui.confirmDialog = null;

  closeDialog();

  ui.msg = null;

  render();

  // daftar nama yang belum punya akun ikut disegarkan untuk halaman daftar
  segarkanMeta();
}

async function doResetPassword(
  role,
  username,
  nama,
  password,
  password2,
  kode,
  tombol,
) {
  const draft = { role, username, nama };

  if (!username || !nama) {
    galatAuth(
      "Username dan nama wajib diisi.",
      draft,
      !username ? "username" : "nama",
    );

    return;
  }

  if (password.length < PASSWORD_MIN) {
    galatAuth(`Password baru minimal ${PASSWORD_MIN} karakter.`, draft, "password");

    return;
  }

  if (password !== password2) {
    galatAuth("Konfirmasi password baru tidak sama.", draft, "password2");

    return;
  }

  if (role === "bendahara" && !kode) {
    galatAuth("Akun bendahara wajib memakai kode bendahara.", draft, "kode");

    return;
  }

  await ubahData(
    tombol,

    async () => {
      await api("lupa", { data: { role, username, nama, password, kode } });

      ui.authView = "login";

      ui.loginTab = role;

      ui.authDraft = { username };

      ui.fokusAuth = "password";

      ui.msg = {
        type: "ok",

        text: "Password berhasil diubah. Silakan masuk dengan password baru.",
      };

      render();
    },

    (err) => {
      galatAuth(err.message, draft, kolomGalat(err, "username"));
    },
  );
}

async function doRegister(
  role,
  nama,
  username,
  password,
  password2,
  kode,
  tombol,
) {
  const draft = { nama, username };

  if (!nama) {
    galatAuth("Pilih nama.", draft, "nama");

    return;
  }

  if (!POLA_USERNAME.test(username)) {
    galatAuth(PESAN_USERNAME, draft, "username");

    return;
  }

  if (password.length < PASSWORD_MIN) {
    galatAuth(`Password minimal ${PASSWORD_MIN} karakter.`, draft, "password");

    return;
  }

  if (password.toLowerCase() === username.toLowerCase()) {
    galatAuth("Password tidak boleh sama dengan username.", draft, "password");

    return;
  }

  if (password !== password2) {
    galatAuth("Konfirmasi password tidak sama.", draft, "password2");

    return;
  }

  if (role === "bendahara" && !kode) {
    galatAuth("Isi kode bendahara untuk mendaftar sebagai bendahara.", draft, "kode");

    return;
  }

  await ubahData(
    tombol,

    async () => {
      const j = await api("daftar", {
        data: { role, nama, username, password, kode },
      });

      if (j.tersedia) {
        META.tersedia = j.tersedia;
      }

      ui.authView = "login";

      ui.loginTab = role;

      ui.authDraft = { username };

      ui.fokusAuth = "password";

      ui.msg = {
        type: "ok",

        text: "Akun berhasil dibuat. Silakan masuk.",
      };

      render();
    },

    (err) => {
      galatAuth(err.message, draft, kolomGalat(err, "username"));
    },
  );
}

/* ============================================================
   SAVE KAS
============================================================ */

// Bendahara hanya boleh mengubah data pos miliknya; server memeriksanya lagi
// dan menentukan pos dari akun, bukan dari kiriman ini.
function bolehKelola() {
  return !!session && session.role === "bendahara" && myPos() === ui.pos;
}

// Menghapus satu baris di server. Bila barisnya ternyata sudah tidak ada
// (dihapus bendahara lain), tampilan disegarkan supaya sesuai kenyataan.
function hapusDiServer(aksi, id, pesan) {
  return ubahData(null, async () => {
    await api(aksi, { data: { id } });

    await setelahUbah();

    showToast(pesan, "ok");
  });
}

async function doSaveKas(val, tombol) {
  if (!bolehKelola()) {
    return;
  }

  const id = val("id");

  const siswa = val("siswa");

  const tanggal = val("tanggal");

  const jumlah = Number(val("jumlah"));

  if (!siswa || !tanggal || !jumlah) {
    showToast("Lengkapi semua data.", "error");

    return;
  }

  if (!Number.isInteger(jumlah) || jumlah < 1) {
    showToast("Jumlah harus berupa bilangan bulat lebih dari 0.", "error");

    return;
  }

  await ubahData(tombol, async () => {
    await api("kas_simpan", {
      data: {
        id,

        siswa,

        tanggal,

        jumlah,

        metode: val("metode") || "Tunai",

        keterangan: val("keterangan"),
      },
    });

    ui.editKasId = null;

    await setelahUbah();

    showToast(id ? "Perubahan disimpan." : "Kas masuk dicatat.", "ok");
  });
}

/* ============================================================
   PENGELUARAN SAVE
============================================================ */

async function doSavePengeluaran(val, tombol) {
  if (!bolehKelola()) {
    return;
  }

  const id = val("id");

  const tanggal = val("tanggal");

  const kategori = val("kategori");

  const keterangan = val("keterangan");

  const jumlah = Number(val("jumlah"));

  if (!tanggal || !keterangan || !jumlah) {
    showToast("Lengkapi data.", "error");

    return;
  }

  if (!Number.isInteger(jumlah) || jumlah < 1) {
    showToast("Jumlah harus berupa bilangan bulat lebih dari 0.", "error");

    return;
  }

  await ubahData(tombol, async () => {
    await api("keluar_simpan", {
      data: { id, tanggal, kategori, keterangan, jumlah },
    });

    ui.editPengeluaranId = null;

    await setelahUbah();

    showToast(id ? "Perubahan disimpan." : "Pengeluaran dicatat.", "ok");
  });
}

/* ============================================================
   TARGET SAVE
============================================================ */

async function doSaveTarget(val, tombol) {
  if (!bolehKelola()) {
    return;
  }

  const id = val("id");

  const nama = val("nama");

  const jumlahTarget = Number(val("jumlahTarget"));

  const terkumpul = Number(val("terkumpul") || 0);

  const keterangan = val("keterangan");

  if (!nama || !jumlahTarget) {
    showToast("Lengkapi target.", "error");

    return;
  }

  if (!Number.isInteger(jumlahTarget) || jumlahTarget < 1) {
    showToast("Target dana harus berupa bilangan bulat lebih dari 0.", "error");

    return;
  }

  if (!Number.isInteger(terkumpul) || terkumpul < 0) {
    showToast("Dana terkumpul tidak boleh negatif.", "error");

    return;
  }

  await ubahData(tombol, async () => {
    await api("target_simpan", {
      data: { id, nama, jumlahTarget, terkumpul, keterangan },
    });

    ui.editTargetId = null;

    await setelahUbah();

    showToast(id ? "Perubahan disimpan." : "Target ditambahkan.", "ok");
  });
}

/* ============================================================
   USERNAME
============================================================ */

async function doGantiUsername(baru, password, tombol) {
  if (!password) {
    showToast("Masukkan password untuk konfirmasi.", "error");

    return;
  }

  if (!POLA_USERNAME.test(baru)) {
    showToast(PESAN_USERNAME, "error");

    return;
  }

  if (session && baru === session.username) {
    showToast("Username baru sama dengan username saat ini.", "error");

    return;
  }

  await ubahData(tombol, async () => {
    const j = await api("ganti_username", { data: { username: baru, password } });

    if (session && j.username) {
      session.username = j.username;
    }

    await setelahUbah();

    showToast("Username berhasil diganti.", "ok");
  });
}

/* ============================================================
   PASSWORD
============================================================ */

async function doGantiPassword(lama, baru, baru2, tombol) {
  if (!lama) {
    showToast("Masukkan password lama.", "error");

    return;
  }

  if (baru.length < PASSWORD_MIN) {
    showToast(`Password baru minimal ${PASSWORD_MIN} karakter.`, "error");

    return;
  }

  if (baru !== baru2) {
    showToast("Password baru tidak sama.", "error");

    return;
  }

  await ubahData(tombol, async () => {
    await api("ganti_password", { data: { lama, baru } });

    // render ulang mengosongkan isian password
    render();

    showToast(
      "Password berhasil diganti. Perangkat lain yang memakai akun ini dikeluarkan.",
      "ok",
    );
  });
}

/* ============================================================
   NOMINAL
============================================================ */

async function doSaveNominal(nominal, tombol) {
  // hanya Kas Rutin yang nominalnya bisa diubah (Acara manual, Kurban tetap)
  if (!(session.role === "bendahara" && myPos() === "Rutin")) {
    return;
  }

  if (!Number.isInteger(nominal) || nominal < 0) {
    showToast("Nominal harus berupa bilangan bulat, minimal 0.", "error");

    return;
  }

  await ubahData(tombol, async () => {
    await api("nominal_simpan", { data: { nominal } });

    await setelahUbah();

    showToast("Nominal disimpan.", "ok");
  });
}

/* ============================================================
   QRIS
============================================================ */

const PESAN_BUKAN_GAMBAR =
  "File harus berupa gambar (JPG, PNG, WEBP, atau GIF).";

async function doSaveQris(file, tombol) {
  if (!bolehKelola()) {
    return;
  }

  if (!file) {
    showToast("Pilih gambar QRIS.", "error");

    return;
  }

  if (!/^image\//.test(file.type)) {
    showToast(PESAN_BUKAN_GAMBAR, "error");

    return;
  }

  await ubahData(tombol, async () => {
    const gambar = await siapkanGambar(file);

    const form = new FormData();

    form.append("file", gambar, gambar.name || "qris");

    await api("qris_simpan", { form });

    await setelahUbah();

    showToast("QRIS disimpan.", "ok");
  });
}

/* ============================================================
   BUKTI TRANSFER
============================================================ */

async function doSaveBukti(val, file, tombol) {
  if (session.role !== "siswa") {
    return;
  }

  const tanggal = val("tanggal");

  const jumlah = Number(val("jumlah"));

  const catatan = val("catatan");

  if (!tanggal || !jumlah) {
    showToast("Lengkapi tanggal dan jumlah.", "error");

    return;
  }

  if (!Number.isInteger(jumlah) || jumlah < 1) {
    showToast("Jumlah harus berupa bilangan bulat lebih dari 0.", "error");

    return;
  }

  if (!file) {
    showToast("Pilih bukti transfer.", "error");

    return;
  }

  if (!/^image\//.test(file.type)) {
    showToast(PESAN_BUKAN_GAMBAR, "error");

    return;
  }

  await ubahData(tombol, async () => {
    const gambar = await siapkanGambar(file);

    const form = new FormData();

    form.append("pos", ui.pos);

    form.append("tanggal", tanggal);

    form.append("jumlah", String(jumlah));

    form.append("catatan", catatan);

    form.append("file", gambar, gambar.name || "bukti");

    await api("bukti_kirim", { form });

    // render ulang mengosongkan formulir
    render();

    showToast("Bukti terkirim. Bendahara akan memeriksanya.", "ok");
  });
}

/* ============================================================
   DIALOG
============================================================ */

function batalDialog() {
  const balik = ui.fokusSebelumDialog;

  ui.confirmDialog = null;

  ui.fokusSebelumDialog = null;

  closeDialog();

  pulihkanFokus(balik);
}

function confirmAction(title, text, callback, opts) {
  ui.fokusSebelumDialog = kunciFokus(document.activeElement);

  ui.confirmDialog = {
    title,

    text,

    onYes: callback,

    yesLabel: (opts && opts.yesLabel) || "Ya, lanjutkan",

    yesClass: (opts && opts.yesClass) || "btn-danger",
  };

  renderConfirmDialog();
}

function renderConfirmDialog() {
  closeDialog();

  const wrap = document.createElement("div");

  wrap.id = "confirmDialogRoot";

  wrap.innerHTML = `
    <div
      class="
        dialog-backdrop
      "
    >

      <div
        class="
          dialog
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="dlgJudul"
        aria-describedby="dlgIsi"
      >

        <h3 id="dlgJudul">
          ${esc(ui.confirmDialog.title)}
        </h3>

        <p id="dlgIsi">
          ${esc(ui.confirmDialog.text)}
        </p>

        <div
          class="
            form-actions
          "
        >

          <button
            class="btn ${esc(ui.confirmDialog.yesClass || "btn-danger")}"
            data-act="confirmYes"
          >
            ${esc(ui.confirmDialog.yesLabel || "Ya, lanjutkan")}
          </button>

          <button
            class="
              btn
              btn-outline
            "
            data-act="confirmNo"
          >
            Batal
          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(wrap);

  wrap
    .querySelectorAll("[data-act]")
    .forEach((el) => el.addEventListener("click", onAction));

  // fokus mulai di pilihan paling aman (Batal) dan tidak keluar dari dialog
  const batal = wrap.querySelector('[data-act="confirmNo"]');

  if (batal) {
    batal.focus();
  }

  wrap.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") {
      return;
    }

    const tombol = wrap.querySelectorAll("button");

    const pertama = tombol[0];

    const terakhir = tombol[tombol.length - 1];

    if (e.shiftKey && document.activeElement === pertama) {
      e.preventDefault();

      terakhir.focus();
    } else if (!e.shiftKey && document.activeElement === terakhir) {
      e.preventDefault();

      pertama.focus();
    }
  });
}

function closeDialog() {
  ["confirmDialogRoot", "sandiDialogRoot"].forEach((idRoot) => {
    const old = document.getElementById(idRoot);

    if (old) {
      old.remove();
    }
  });
}

// Dialog password sementara (hasil reset akun). Password hanya ada di sini:
// server tidak menyimpannya dalam bentuk yang bisa dibaca, jadi bila dialog
// ditutup sebelum disalin, bendahara cukup mereset akunnya sekali lagi.
function renderSandiDialog() {
  closeDialog();

  const info = ui.passwordSementara;

  if (!info) {
    return;
  }

  const wrap = document.createElement("div");

  wrap.id = "sandiDialogRoot";

  wrap.innerHTML = `
    <div class="dialog-backdrop">

      <div
        class="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sandiJudul"
        aria-describedby="sandiIsi"
      >

        <h3 id="sandiJudul">Password sementara siap</h3>

        <p id="sandiIsi">
          Berikan password ini ke <strong>${tampilNama(info.nama)}</strong>${
            info.username
              ? ` (username <strong>${esc(info.username)}</strong>)`
              : ""
          }.
          Password hanya tampil sekarang. Minta pemiliknya segera
          menggantinya di Pengaturan setelah masuk.
        </p>

        <div class="sandi-box">
          <code id="sandiNilai">${esc(info.sandi)}</code>
        </div>

        <div class="form-actions">

          <button class="btn btn-primary" data-act="salinSandi">
            Salin password
          </button>

          <button class="btn btn-outline" data-act="tutupSandi">
            Selesai
          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(wrap);

  wrap
    .querySelectorAll("[data-act]")
    .forEach((el) => el.addEventListener("click", onAction));

  const salin = wrap.querySelector('[data-act="salinSandi"]');

  if (salin) {
    salin.focus();
  }

  wrap.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") {
      return;
    }

    const tombol = wrap.querySelectorAll("button");

    const pertama = tombol[0];

    const terakhir = tombol[tombol.length - 1];

    if (e.shiftKey && document.activeElement === pertama) {
      e.preventDefault();

      terakhir.focus();
    } else if (!e.shiftKey && document.activeElement === terakhir) {
      e.preventDefault();

      pertama.focus();
    }
  });
}

/* ============================================================
   INIT
============================================================ */

applyTheme();

// Data kas dan sesi dimuat dari server oleh muatAwal() (api.js); pemanggilannya
// ada di paling bawah berkas ini, setelah semua deklarasi selesai.

/* ============================================================
   PERGANTIAN PERIODE OTOMATIS
   Dashboard digambar ulang begitu tanggal berganti (tengah malam /
   awal bulan) supaya status Kas Rutin (bulanan) dan Dana Kurban
   (harian) langsung kembali ke "Belum bayar" tanpa refresh manual.
============================================================ */

let stempelTanggal = todayStr();

function cekPergantianPeriode() {
  const sekarang = todayStr();

  if (sekarang === stempelTanggal) {
    return;
  }

  const kemarin = stempelTanggal;

  stempelTanggal = sekarang;

  if (!session) {
    return;
  }

  // Hanya dashboard yang digambar ulang: halaman itu tidak punya isian form.
  // Halaman lain dibiarkan agar ketikan yang belum disimpan tidak hilang;
  // periode barunya otomatis terpakai begitu pindah halaman.
  if (ui.view === "dashboard" && !ui.confirmDialog) {
    render();
  }

  const pos = myPos();

  if (pos && POS_PENGINGAT.includes(pos)) {
    const berganti =
      frekuensiPos(pos) === "Harian" ||
      kemarin.slice(0, 7) !== sekarang.slice(0, 7);

    if (berganti) {
      showToast(
        `Periode baru: ${periodeAktif(pos).nama}. Status pembayaran direset.`,
      );
    }
  }
}

setInterval(cekPergantianPeriode, 30 * 1000);

// Tombol Esc menutup lapisan paling atas: dialog, panel notifikasi, lalu menu HP.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") {
    return;
  }

  if (ui.confirmDialog) {
    batalDialog();
  } else if (ui.passwordSementara) {
    ui.passwordSementara = null;

    closeDialog();

    render();
  } else if (ui.notifOpen) {
    tutupNotif();
  } else if (ui.mobileMenuOpen) {
    ui.mobileMenuOpen = false;

    render();
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    cekPergantianPeriode();
  }
});

window.addEventListener("focus", cekPergantianPeriode);

/* ============================================================
   MULAI
   Tampilkan layar "memuat", lalu ambil data induk dan sesi dari server.
============================================================ */

muatAwal();
