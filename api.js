/* ============================================================
   KAS TKJT 1 - HUBUNGAN KE SERVER (PHP + MySQL)
   Dimuat SEBELUM script.js. Berisi:
     - api()            : pemanggil API (JSON / FormData, token CSRF)
     - siapkanGambar()  : mengecilkan foto sebelum diunggah
     - muatAwal()       : memuat data induk + sesi saat halaman dibuka
     - muatState()      : menyegarkan seluruh data dari database
     - polling          : data ikut berubah bila bendahara lain mencatat
   Fungsi di sini memakai DB, session, ui, render() dari script.js;
   semuanya baru dipanggil setelah script.js selesai dimuat.
============================================================ */

const API_URL = "api/index.php";

// "memuat" -> "siap" | "galat"
let statusApp = "memuat";

let pesanGalatApp = "";

let csrfToken = "";

// Data induk dari server: nama siswa/bendahara, nama yang belum punya akun,
// zona waktu, dan apakah pendaftaran bendahara dibuka (kode bendahara terisi).
let META = {
  tersedia: { siswa: [], bendahara: [] },
  kodeBendahara: false,
  timezone: "Asia/Jakarta",
};

// Selisih jam server dan jam perangkat (ms). Dipakai agar "hari ini" /
// "bulan ini" mengikuti server, bukan jam HP yang mungkin salah.
let selisihJam = 0;

// Sidik jari data terakhir; server menjawab "tidak berubah" bila sama.
let revState = "";

// Naik setiap kali ada perubahan lokal; jawaban polling yang dikirim
// sebelum perubahan itu dibuang supaya tidak menimpa data yang lebih baru.
let versiData = 0;

class ApiGalat extends Error {
  constructor(pesan, status, kode) {
    super(pesan);

    this.name = "ApiGalat";

    this.status = status || 0;

    this.kode = kode || "galat";
  }
}

/* ============================================================
   PEMANGGIL API
============================================================ */

// aksi   : nama aksi (lihat api/index.php)
// method : "GET" | "POST"
// data   : objek -> dikirim sebagai JSON
// form   : FormData -> dikirim sebagai multipart (unggah gambar)
// params : parameter tambahan di URL
async function api(aksi, opsi = {}, sudahCobaUlang = false) {
  const method = opsi.method || "POST";

  const url = new URL(API_URL, window.location.href);

  url.searchParams.set("a", aksi);

  Object.entries(opsi.params || {}).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });

  const headers = { Accept: "application/json" };

  const init = {
    method,

    headers,

    credentials: "same-origin",

    cache: "no-store",
  };

  if (method !== "GET") {
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    if (opsi.form) {
      init.body = opsi.form;
    } else {
      headers["Content-Type"] = "application/json";

      init.body = JSON.stringify(opsi.data || {});
    }
  }

  let res;

  try {
    res = await fetch(url, init);
  } catch (err) {
    throw new ApiGalat(
      "Tidak dapat terhubung ke server. Periksa koneksi, lalu pastikan Apache dan MySQL menyala.",
      0,
      "jaringan",
    );
  }

  let json = null;

  try {
    json = await res.json();
  } catch (err) {
    json = null;
  }

  if (res.ok && json && json.ok !== false) {
    return json;
  }

  const kode = (json && json.kode) || "galat";

  // Token CSRF basi (mis. masuk lagi di tab lain): ambil yang baru, coba sekali lagi.
  if (res.status === 403 && kode === "csrf" && !sudahCobaUlang && session) {
    try {
      const baru = await api("boot", { method: "GET" }, true);

      if (baru.user) {
        csrfToken = baru.csrf || "";

        return api(aksi, opsi, true);
      }
    } catch (err) {
      /* jatuh ke penanganan galat di bawah */
    }
  }

  if (res.status === 401 && kode === "sesi" && session) {
    sesiBerakhir();
  }

  throw new ApiGalat(
    (json && json.pesan) ||
      `Server memberi jawaban yang tidak dikenal (kode ${res.status}). Periksa pengaturan di api/config.php.`,
    res.status,
    kode,
  );
}

/* ============================================================
   FOTO: dikecilkan di peramban supaya cepat diunggah
============================================================ */

// Gambar kecil dikirim apa adanya (QRIS tetap tajam dan terbaca). Foto besar
// dari kamera HP dikecilkan ke sisi terpanjang 1800 px lalu dijadikan JPEG.
async function siapkanGambar(file) {
  if (!file) {
    return null;
  }

  const BATAS_BYTE = 1.2 * 1024 * 1024;

  if (file.size <= BATAS_BYTE && /^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
    return file;
  }

  try {
    const bmp = await createImageBitmap(file);

    const skala = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));

    const lebar = Math.max(1, Math.round(bmp.width * skala));

    const tinggi = Math.max(1, Math.round(bmp.height * skala));

    const kanvas = document.createElement("canvas");

    kanvas.width = lebar;

    kanvas.height = tinggi;

    const ctx = kanvas.getContext("2d");

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(0, 0, lebar, tinggi);

    ctx.drawImage(bmp, 0, 0, lebar, tinggi);

    if (bmp.close) {
      bmp.close();
    }

    const blob = await new Promise((selesai) =>
      kanvas.toBlob(selesai, "image/jpeg", 0.88),
    );

    if (blob && blob.size < file.size) {
      return new File([blob], "gambar.jpg", { type: "image/jpeg" });
    }
  } catch (err) {
    /* format tak bisa dibaca peramban: kirim apa adanya, server yang menilai */
  }

  return file;
}

/* ============================================================
   DATA: bentuk, penerapan, penyegaran
============================================================ */

function normalisasiDB(state) {
  const dasar = defaultDB();

  const d = Object.assign(dasar, state || {});

  ["accounts", "kasMasuk", "pengeluaran", "target", "bukti", "notifikasi"].forEach(
    (k) => {
      if (!Array.isArray(d[k])) {
        d[k] = [];
      }
    },
  );

  const awal = defaultDB().settings;

  const s = d.settings || {};

  d.settings = {
    nominal: Object.assign(awal.nominal, s.nominal || {}),

    qris: Object.assign(awal.qris, s.qris || {}),
  };

  return d;
}

function terapkanMeta(meta) {
  if (!meta) {
    return;
  }

  // isi daftar nama dari database (konstanta di script.js hanya cadangan)
  SISWA_MASTER.splice(0, SISWA_MASTER.length, ...(meta.siswa || []));

  BENDAHARA_MASTER.splice(
    0,
    BENDAHARA_MASTER.length,
    ...(meta.bendahara || []).map((b) => ({ nama: b.nama, jabatan: b.jabatan })),
  );

  META.tersedia = meta.tersedia || { siswa: [], bendahara: [] };

  META.kodeBendahara = !!meta.kodeBendahara;

  META.timezone = meta.timezone || "Asia/Jakarta";

  if (meta.serverNow) {
    selisihJam = Number(meta.serverNow) - Date.now();
  }
}

function terapkanLogin(user, csrf, state, rev) {
  session = {
    id: user.id,

    nama: user.nama,

    role: user.role,

    jabatan: user.jabatan || null,

    username: user.username,
  };

  csrfToken = csrf || "";

  DB = normalisasiDB(state);

  revState = rev || "";

  versiData += 1;
}

function bersihkanLogin() {
  session = null;

  csrfToken = "";

  DB = defaultDB();

  revState = "";

  versiData += 1;
}

// Sesi habis / dicabut dari server (mis. password diganti di perangkat lain).
function sesiBerakhir(pesan) {
  if (!session) {
    return;
  }

  bersihkanLogin();

  ui.authView = "login";

  ui.authDraft = null;

  ui.view = "dashboard";

  ui.pos = "Rutin";

  ui.mobileMenuOpen = false;

  ui.notifOpen = false;

  ui.notifBaruIds = [];

  ui.confirmDialog = null;

  closeDialog();

  ui.msg = {
    type: "error",

    text: pesan || "Sesi berakhir. Silakan masuk lagi.",
  };

  render();
}

// Memuat data induk (selalu) dan data kas (bila sudah masuk).
async function muatAwal() {
  statusApp = "memuat";

  render();

  try {
    const j = await api("boot", { method: "GET" });

    terapkanMeta(j.meta);

    if (j.user) {
      terapkanLogin(j.user, j.csrf, j.state, j.rev);

      ui.pos = myPos() || "Rutin";
    } else {
      bersihkanLogin();
    }

    statusApp = "siap";

    pesanGalatApp = "";
  } catch (err) {
    statusApp = "galat";

    pesanGalatApp = err.message;
  }

  stempelTanggal = todayStr();

  render();
}

// Ambil data terbaru dari database. Tanpa `paksa`, server menjawab singkat
// bila tidak ada yang berubah. Mengembalikan true bila data diganti.
async function muatState(paksa = false) {
  if (!session) {
    return false;
  }

  const versi = versiData;

  const j = await api("state", {
    method: "GET",

    params: paksa ? {} : { rev: revState },
  });

  if (j.csrf) {
    csrfToken = j.csrf;
  }

  // ada perubahan lokal sejak permintaan ini dikirim: jawaban ini sudah basi
  if (versi !== versiData || !session) {
    return false;
  }

  if (j.unchanged) {
    return false;
  }

  DB = normalisasiDB(j.state);

  revState = j.rev || "";

  if (j.user) {
    session.nama = j.user.nama;

    session.username = j.user.username;

    session.jabatan = j.user.jabatan || null;
  }

  return true;
}

// Dipanggil setelah berhasil menyimpan/menghapus sesuatu: tarik data
// terbaru (sumber kebenaran = database), lalu gambar ulang.
async function setelahUbah() {
  versiData += 1;

  try {
    await muatState(true);
  } catch (err) {
    /* perubahan sudah tersimpan; tampilan akan menyusul pada penyegaran berikutnya */
  }

  render();
}

/* ============================================================
   MENYIMPAN PERUBAHAN
   Semua tulis-data lewat ubahData(): mencegah klik ganda, menandai
   tombol "memproses", dan mengubah galat menjadi pesan yang terbaca.
============================================================ */

// Tombol yang sedang memproses: dinonaktifkan dan diberi tanda "memproses".
function tandaiSibuk(el, aktif) {
  if (!el || !el.classList) {
    return;
  }

  if (aktif) {
    el.disabled = true;

    el.classList.add("is-loading");

    el.setAttribute("aria-busy", "true");
  } else {
    el.disabled = false;

    el.classList.remove("is-loading");

    el.removeAttribute("aria-busy");
  }
}

function tampilkanGalat(err) {
  // sesi habis sudah ditangani api(): kembali ke halaman masuk dengan pesan
  if (err && err.kode === "sesi") {
    return;
  }

  if (err instanceof ApiGalat) {
    showToast(err.message, "error");

    return;
  }

  console.error(err);

  showToast(
    "Terjadi kesalahan di aplikasi. Muat ulang halaman lalu coba lagi.",
    "error",
  );
}

// kerja : fungsi async yang memanggil api() dan memperbarui tampilan
// galat  : (opsional) penanganan galat sendiri, mis. formulir masuk
// Mengembalikan true bila berhasil.
async function ubahData(tombol, kerja, galat) {
  if (sedangKirim) {
    return false;
  }

  sedangKirim = true;

  tandaiSibuk(tombol, true);

  try {
    await kerja();

    return true;
  } catch (err) {
    if (galat) {
      galat(err);
    } else {
      tampilkanGalat(err);
    }

    return false;
  } finally {
    sedangKirim = false;

    // bila tombol sudah terhapus dari tampilan (render ulang), tidak berpengaruh
    tandaiSibuk(tombol, false);
  }
}

/* ============================================================
   UNDUH BERKAS (laporan PDF / Excel)
   Berkas diminta lewat fetch (cookie sesi ikut terkirim), dibaca sebagai
   blob, lalu disimpan lewat tautan sementara. Jawaban galat dari server
   (JSON) tampil sebagai pesan, bukan sebagai berkas rusak.
============================================================ */

// Nama berkas dari header Content-Disposition (filename* lebih diutamakan).
function namaBerkasDariHeader(header) {
  if (!header) {
    return "";
  }

  let nama = "";

  const utf8 = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);

  if (utf8) {
    try {
      nama = decodeURIComponent(utf8[1].trim());
    } catch (err) {
      nama = "";
    }
  }

  if (!nama) {
    const biasa = /filename\s*=\s*"?([^";]+)"?/i.exec(header);

    nama = biasa ? biasa[1].trim() : "";
  }

  return nama;
}

// Buang karakter yang tidak boleh ada pada nama berkas (pemisah folder, kontrol).
function namaBerkasAman(nama, cadangan) {
  const bersih = String(nama || "")
    .replace(/[\u0000-\u001f\u007f\\/:*?"<>|]+/g, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 120);

  return bersih || cadangan || "berkas";
}

// aksi          : nama aksi GET di api/index.php (mis. "laporan_pdf")
// params        : parameter URL
// namaCadangan  : dipakai bila server tidak mengirim nama berkas
// tombol        : (opsional) tombol yang ditandai "memproses" selama mengunduh
// Mengembalikan true bila berkas berhasil diterima.
async function unduhBerkas(aksi, params, namaCadangan, tombol) {
  if (tombol && tombol.disabled) {
    return false;
  }

  tandaiSibuk(tombol, true);

  try {
    const url = new URL(API_URL, window.location.href);

    url.searchParams.set("a", aksi);

    Object.entries(params || {}).forEach(([k, v]) => {
      url.searchParams.set(k, v);
    });

    let res;

    try {
      res = await fetch(url, {
        method: "GET",

        credentials: "same-origin",

        cache: "no-store",
      });
    } catch (err) {
      throw new ApiGalat(
        "Tidak dapat terhubung ke server. Periksa koneksi, lalu coba lagi.",
        0,
        "jaringan",
      );
    }

    const jenis = res.headers.get("Content-Type") || "";

    // galat server selalu berbentuk JSON; berkas sungguhan tidak pernah JSON
    if (!res.ok || /application\/json/i.test(jenis)) {
      let json = null;

      try {
        json = await res.json();
      } catch (err) {
        json = null;
      }

      const kode = (json && json.kode) || "galat";

      if (res.status === 401 && kode === "sesi" && session) {
        sesiBerakhir();
      }

      throw new ApiGalat(
        (json && json.pesan) ||
          `Berkas gagal dibuat (kode ${res.status}). Coba lagi sebentar lagi.`,
        res.status,
        kode,
      );
    }

    const blob = await res.blob();

    if (!blob.size) {
      throw new ApiGalat("Berkas yang diterima kosong. Coba lagi.", res.status, "kosong");
    }

    const nama = namaBerkasAman(
      namaBerkasDariHeader(res.headers.get("Content-Disposition")),
      namaCadangan,
    );

    const alamat = URL.createObjectURL(blob);

    const tautan = document.createElement("a");

    tautan.href = alamat;

    tautan.download = nama;

    tautan.rel = "noopener";

    tautan.hidden = true;

    document.body.appendChild(tautan);

    tautan.click();

    tautan.remove();

    // beri waktu peramban memulai simpan sebelum alamat sementara dilepas
    setTimeout(() => URL.revokeObjectURL(alamat), 30000);

    showToast(`Berkas ${nama} diunduh.`, "ok");

    return true;
  } catch (err) {
    tampilkanGalat(err);

    return false;
  } finally {
    tandaiSibuk(tombol, false);
  }
}

// Data induk (daftar nama yang belum punya akun) untuk halaman daftar.
async function segarkanMeta() {
  try {
    const j = await api("boot", { method: "GET" });

    terapkanMeta(j.meta);

    return true;
  } catch (err) {
    return false;
  }
}

/* ============================================================
   PENYEGARAN OTOMATIS
   Setiap 20 detik (dan saat tab dibuka lagi) data dicek ke server.
   Tampilan tidak digambar ulang bila sedang ada isian yang diketik
   atau dialog yang terbuka, supaya ketikan tidak hilang.
============================================================ */

let sedangPolling = false;

function sedangMengetik() {
  if (ui.confirmDialog || ui.passwordSementara || sedangKirim) {
    return true;
  }

  const el = document.activeElement;

  return !!(
    el &&
    el.closest &&
    el.closest("#app") &&
    /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
  );
}

async function segarkanOtomatis() {
  if (!session || sedangPolling || document.hidden || statusApp !== "siap") {
    return;
  }

  if (sedangMengetik()) {
    return;
  }

  sedangPolling = true;

  try {
    if (await muatState(false)) {
      if (!sedangMengetik()) {
        render();
      }
    }
  } catch (err) {
    /* gangguan jaringan sesaat: coba lagi pada putaran berikutnya */
  } finally {
    sedangPolling = false;
  }
}

setInterval(segarkanOtomatis, 20 * 1000);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    segarkanOtomatis();
  }
});

/* ============================================================
   LAYAR MEMUAT dan LAYAR GAGAL TERHUBUNG
============================================================ */

function renderMemuat() {
  return `
    <div class="center-screen">

      <div class="boot-card" role="status" aria-live="polite">

        <div class="spinner" aria-hidden="true"></div>

        <strong>Memuat data kas...</strong>

        <span class="muted">Menghubungkan ke server.</span>

      </div>

    </div>
  `;
}

function renderGalatServer() {
  return `
    <div class="center-screen">

      <div class="boot-card galat" role="alert">

        ${icon("tanda")}

        <strong>Server belum bisa dihubungi</strong>

        <p>${esc(pesanGalatApp)}</p>

        <ul class="boot-tips">

          <li>
            Buka lewat alamat server, misalnya
            <code>http://localhost/kas-tkjt1/</code>, bukan dengan
            klik dua kali berkas <code>index.html</code>.
          </li>

          <li>Pastikan Apache dan MySQL di XAMPP berstatus hijau (Start).</li>

          <li>
            Pastikan database sudah diimpor dari
            <code>database/database.sql</code> dan pengaturannya benar di
            <code>api/config.php</code>.
          </li>

        </ul>

        <button class="btn btn-primary" data-act="muatUlang">
          Coba lagi
        </button>

      </div>

    </div>
  `;
}
