/* ============================================================
   KAS TKJT 1 - FITUR TAMBAHAN
   Berisi:
     - kartu angka, grafik batang bulanan, dan aktivitas terbaru (dashboard)
     - cari + filter pada Kas Masuk, Pengeluaran, dan status pembayaran
     - Rekap Siswa: status, tunggakan, dan riwayat setoran tiap siswa
     - halaman Laporan: pratinjau, cetak, unduh PDF dan Excel

   Dimuat SETELAH api.js dan SEBELUM script.js. Berkas ini hanya
   mendefinisikan fungsi; rujukan ke DB, ui, session, icon(), esc(), dan
   lain-lain dari script.js baru terjadi saat fungsi dipanggil. Satu-satunya
   nama global yang ditambahkan adalah `Fitur`.

   Aturan tunggakan (sama persis dengan api/lib/laporan.php):
     - Pos berjadwal (Kas Rutin bulanan, Dana Kurban harian, atau mingguan):
       sebuah periode dianggap LUNAS bila ada minimal satu setoran siswa itu
       pada periode tersebut.
     - Penagihan dimulai dari setoran PERTAMA yang pernah tercatat di pos itu
       (atau awal rentang bila belum ada), sampai akhir rentang atau hari ini
       (mana yang lebih dulu). Periode yang sedang berjalan ikut ditagih.
     - Tunggakan = jumlah periode belum lunas x nominal per periode.
     - Dana Acara dikumpulkan sesuai kebutuhan, jadi tidak ada tunggakan.
============================================================ */

const Fitur = (() => {
  "use strict";

  const BULAN_PENDEK = [
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

  const FREKUENSI_BERJADWAL = ["Bulanan", "Mingguan", "Harian"];

  const POS_KUNCI = ["Rutin", "Acara", "Kurban"];

  const MAKS_HARI_LAPORAN = 1830;

  const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

  /* ==========================================================
     TANGGAL (teks YYYY-MM-DD; hitungan lewat UTC supaya aman dari zona waktu)
  ========================================================== */

  const utc = (s) => {
    const [y, m, d] = s.split("-").map(Number);

    return new Date(Date.UTC(y, m - 1, d));
  };

  const keIso = (dt) => dt.toISOString().slice(0, 10);

  const tambahHari = (s, n) => {
    const d = utc(s);

    d.setUTCDate(d.getUTCDate() + n);

    return keIso(d);
  };

  const awalBulan = (s) => s.slice(0, 8) + "01";

  const geserBulan = (s, n) => {
    const [y, m] = s.split("-").map(Number);

    const t = y * 12 + (m - 1) + n;

    return (
      String(Math.floor(t / 12)).padStart(4, "0") +
      "-" +
      String((t % 12) + 1).padStart(2, "0") +
      "-01"
    );
  };

  const akhirBulan = (s) => tambahHari(geserBulan(s, 1), -1);

  const selisihHari = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);

  const tanggalSah = (s) =>
    POLA_TANGGAL.test(s || "") && keIso(utc(s)) === s;

  const ribuan = (n) => (Number(n) || 0).toLocaleString("id-ID");

  const desimal = (n) =>
    (Number(n) || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 });

  const rupiahTanda = (n) =>
    (n < 0 ? "−" : n > 0 ? "+" : "") + "Rp " + ribuan(Math.abs(n));

  /* ==========================================================
     RENTANG WAKTU
  ========================================================== */

  const RENTANG = [
    ["bulan-ini", "Bulan ini"],
    ["bulan-lalu", "Bulan lalu"],
    ["7-hari", "7 hari terakhir"],
    ["30-hari", "30 hari terakhir"],
    ["3-bulan", "3 bulan terakhir"],
    ["tahun-ini", "Tahun ini"],
    ["semua", "Semua waktu"],
    ["kustom", "Atur sendiri"],
  ];

  // Tanggal transaksi paling awal pada sebuah pos (kas masuk atau pengeluaran).
  function tanggalAwalPos(pos) {
    let awal = null;

    DB.kasMasuk
      .concat(DB.pengeluaran)
      .filter((x) => x.pos === pos)
      .forEach((x) => {
        const t = dateOnlyKey(x.tanggal);

        if (t && (awal === null || t < awal)) {
          awal = t;
        }
      });

    return awal;
  }

  function rentangDari(id, pos, dariKustom, sampaiKustom) {
    const hari = todayStr();

    switch (id) {
      case "bulan-lalu": {
        const awal = geserBulan(hari, -1);

        return { dari: awal, sampai: akhirBulan(awal) };
      }

      case "7-hari":
        return { dari: tambahHari(hari, -6), sampai: hari };

      case "30-hari":
        return { dari: tambahHari(hari, -29), sampai: hari };

      case "3-bulan":
        return { dari: geserBulan(hari, -2), sampai: hari };

      case "tahun-ini":
        return { dari: hari.slice(0, 4) + "-01-01", sampai: hari };

      case "semua": {
        const awal = tanggalAwalPos(pos);

        const batas = tambahHari(hari, -(MAKS_HARI_LAPORAN - 1));

        return { dari: awal ? (awal > batas ? awal : batas) : hari, sampai: hari };
      }

      case "kustom":
        return {
          dari: dariKustom || awalBulan(hari),
          sampai: sampaiKustom || hari,
        };

      default:
        return { dari: awalBulan(hari), sampai: hari };
    }
  }

  function opsiRentang(terpilih) {
    return RENTANG.map(
      ([id, label]) =>
        `<option value="${id}" ${id === terpilih ? "selected" : ""}>${esc(label)}</option>`,
    ).join("");
  }

  /* ==========================================================
     PERIODE PEMBAYARAN
  ========================================================== */

  function kunciPeriode(frek, tgl) {
    if (frek === "Harian") {
      return tgl;
    }

    if (frek === "Mingguan") {
      return weekKey(tgl);
    }

    return tgl.slice(0, 7);
  }

  function awalPeriode(frek, tgl) {
    if (frek === "Harian") {
      return tgl;
    }

    if (frek === "Mingguan") {
      return tambahHari(tgl, -((utc(tgl).getUTCDay() + 6) % 7));
    }

    return awalBulan(tgl);
  }

  function daftarPeriode(frek, mulai, akhir) {
    if (mulai > akhir) {
      return [];
    }

    const hasil = [];

    let d = awalPeriode(frek, mulai);

    while (d <= akhir && hasil.length <= MAKS_HARI_LAPORAN + 1) {
      hasil.push(kunciPeriode(frek, d));

      d =
        frek === "Harian"
          ? tambahHari(d, 1)
          : frek === "Mingguan"
            ? tambahHari(d, 7)
            : geserBulan(d, 1);
    }

    return hasil;
  }

  function satuanPeriode(frek) {
    return frek === "Harian" ? "hari" : frek === "Mingguan" ? "minggu" : "bulan";
  }

  const kapital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  /* ==========================================================
     REKAP SISWA (dihitung dari data di peramban; angkanya sama dengan laporan)
  ========================================================== */

  function hitungRekap(pos, dari, sampai) {
    const frek = frekuensiPos(pos);

    const nominal = Number(nominalPos(pos).jumlah) || 0;

    const berjadwal = FREKUENSI_BERJADWAL.includes(frek);

    const hariIni = todayStr();

    const rows = [];

    DB.kasMasuk.forEach((x) => {
      if (normalizedText(x.pos) !== normalizedText(pos)) {
        return;
      }

      const t = dateOnlyKey(x.tanggal);

      if (t) {
        rows.push({ n: normalizedText(x.siswa), t, j: Number(x.jumlah) || 0 });
      }
    });

    const total = new Map();

    const setoran = new Map();

    const terakhir = new Map();

    rows.forEach((r) => {
      if (r.t >= dari && r.t <= sampai) {
        total.set(r.n, (total.get(r.n) || 0) + r.j);

        setoran.set(r.n, (setoran.get(r.n) || 0) + 1);
      }

      if (r.t <= sampai && (!terakhir.has(r.n) || terakhir.get(r.n) < r.t)) {
        terakhir.set(r.n, r.t);
      }
    });

    let periode = [];

    let mulai = null;

    let akhir = null;

    let kunciAkhir = null;

    const dibayar = new Map();

    if (berjadwal) {
      akhir = sampai < hariIni ? sampai : hariIni;

      const awalKas = rows.reduce(
        (m, r) => (m === null || r.t < m ? r.t : m),
        null,
      );

      mulai = awalKas !== null && awalKas > dari ? awalKas : dari;

      periode = mulai <= akhir && akhir >= dari ? daftarPeriode(frek, mulai, akhir) : [];

      if (periode.length) {
        const jendela = awalPeriode(frek, mulai);

        kunciAkhir = kunciPeriode(frek, akhir);

        rows.forEach((r) => {
          if (r.t >= jendela && r.t <= akhir) {
            if (!dibayar.has(r.n)) {
              dibayar.set(r.n, new Set());
            }

            dibayar.get(r.n).add(kunciPeriode(frek, r.t));
          }
        });
      }
    }

    const tempo = periode.length;

    const baris = SISWA_MASTER.map((nama, i) => {
      const n = normalizedText(nama);

      const jumlahSetor = setoran.get(n) || 0;

      if (!berjadwal) {
        return {
          no: i + 1,
          nama,
          status: jumlahSetor > 0 ? "Sudah setor" : "Belum setor",
          lunas: 0,
          tempo: 0,
          menunggak: 0,
          setoran: jumlahSetor,
          total: total.get(n) || 0,
          tunggakan: 0,
          terakhir: terakhir.get(n) || null,
        };
      }

      const set = dibayar.get(n);

      const sudah = set ? periode.filter((p) => set.has(p)).length : 0;

      return {
        no: i + 1,
        nama,
        status: tempo ? (set && set.has(kunciAkhir) ? "Lunas" : "Belum bayar") : "-",
        lunas: sudah,
        tempo,
        menunggak: tempo - sudah,
        setoran: jumlahSetor,
        total: total.get(n) || 0,
        tunggakan: (tempo - sudah) * nominal,
        terakhir: terakhir.get(n) || null,
      };
    });

    const lunas = baris.filter(
      (b) => b.status === "Lunas" || b.status === "Sudah setor",
    ).length;

    return {
      pos,
      frek,
      nominal,
      berjadwal,
      satuan: satuanPeriode(frek),
      dari,
      sampai,
      periodeDitagih: tempo,
      mulaiTagih: tempo ? mulai : null,
      baris,
      ringkas: {
        siswa: baris.length,
        lunas,
        belum: baris.length - lunas,
        menunggak: baris.filter((b) => b.menunggak > 0).length,
        tunggakan: baris.reduce((s, b) => s + b.tunggakan, 0),
        total: baris.reduce((s, b) => s + b.total, 0),
      },
    };
  }

  // Rekap sejak setoran pertama sampai hari ini (dipakai dashboard).
  function rekapSemua(pos) {
    const hari = todayStr();

    let awal = null;

    DB.kasMasuk
      .filter((x) => x.pos === pos)
      .forEach((x) => {
        const t = dateOnlyKey(x.tanggal);

        if (t && (awal === null || t < awal)) {
          awal = t;
        }
      });

    return hitungRekap(pos, awal || hari, hari);
  }

  function tunggakanSaya() {
    if (!session || session.role !== "siswa") {
      return "";
    }

    const rekap = rekapSemua("Rutin");

    if (!rekap.berjadwal) {
      return "";
    }

    const saya = rekap.baris.find(
      (b) => normalizedText(b.nama) === normalizedText(session.nama),
    );

    if (!saya) {
      return "";
    }

    return saya.menunggak > 0
      ? `<div class="sub ss-tunggakan">
          ${icon("tanda", "ico-sm")}
          Tunggakan ${saya.menunggak} ${rekap.satuan}: ${esc(rupiah(saya.tunggakan))}
        </div>`
      : `<div class="sub ss-tunggakan">
          ${icon("centang", "ico-sm")}
          Tidak ada tunggakan.
        </div>`;
  }

  /* ==========================================================
     PENCATAT
  ========================================================== */

  function namaPencatat(row) {
    const nama = row && row.olehNama ? String(row.olehNama) : "";

    return nama ? esc(titleCase(nama)) : `<span class="muted">-</span>`;
  }

  /* ==========================================================
     PENGAIT EVENT UNTUK BAGIAN YANG DIGAMBAR ULANG SENDIRI
  ========================================================== */

  function pasangAksiDi(akar) {
    akar
      .querySelectorAll("[data-act]")
      .forEach((el) => el.addEventListener("click", onAction));

    akar
      .querySelectorAll("[data-act-change]")
      .forEach((el) => el.addEventListener("change", onActionChange));

    pasangInput(akar);
  }

  function pasangInput(akar) {
    akar.querySelectorAll("[data-act-input]").forEach((el) => {
      el.addEventListener("input", saatInput);

      el.addEventListener("change", saatInput);
    });
  }

  /* ==========================================================
     CARI + FILTER (Kas Masuk dan Pengeluaran)
  ========================================================== */

  const cocokTeks = (q, ...bidang) => {
    const kunci = normalizedText(q);

    return (
      !kunci || bidang.some((b) => normalizedText(b).includes(kunci))
    );
  };

  const rentangFilterSah = (f) => !(f.dari && f.sampai && f.dari > f.sampai);

  const filterAktif = (f) => Object.values(f).some((v) => String(v).trim() !== "");

  function saringMasuk(rows) {
    const f = ui.filterMasuk;

    if (!rentangFilterSah(f)) {
      return [];
    }

    return rows.filter((r) => {
      const t = dateOnlyKey(r.tanggal);

      if (f.dari && t < f.dari) return false;

      if (f.sampai && t > f.sampai) return false;

      if (f.metode && (r.metode || "Tunai") !== f.metode) return false;

      return cocokTeks(f.q, r.siswa, r.keterangan, r.olehNama);
    });
  }

  function saringKeluar(rows) {
    const f = ui.filterKeluar;

    if (!rentangFilterSah(f)) {
      return [];
    }

    return rows.filter((r) => {
      const t = dateOnlyKey(r.tanggal);

      if (f.dari && t < f.dari) return false;

      if (f.sampai && t > f.sampai) return false;

      if (
        f.kategori &&
        normalizedText(r.kategori) !== normalizedText(f.kategori)
      ) {
        return false;
      }

      return cocokTeks(f.q, r.kategori, r.keterangan, r.olehNama);
    });
  }

  function infoFilter(jenis, n, total) {
    const f = jenis === "masuk" ? ui.filterMasuk : ui.filterKeluar;

    return filterAktif(f) ? `${n} dari ${total} catatan` : `${total} catatan`;
  }

  function kategoriTersedia() {
    const hasil = [];

    const lihat = new Set();

    const tambah = (k) => {
      const n = normalizedText(k);

      if (k && !lihat.has(n)) {
        lihat.add(n);

        hasil.push(k);
      }
    };

    KATEGORI_PENGELUARAN.forEach(tambah);

    DB.pengeluaran.filter((x) => x.pos === ui.pos).forEach((x) => tambah(x.kategori));

    tambah(ui.filterKeluar.kategori);

    return hasil;
  }

  function barFilter(jenis) {
    const masuk = jenis === "masuk";

    const f = masuk ? ui.filterMasuk : ui.filterKeluar;

    const sah = rentangFilterSah(f);

    const kunciPilihan = masuk ? "metode" : "kategori";

    const pilihan = masuk
      ? [
          ["", "Semua"],
          ["Tunai", "Tunai"],
          ["QRIS", "QRIS"],
        ]
      : [["", "Semua"]].concat(kategoriTersedia().map((k) => [k, k]));

    const atribut = (kunci) =>
      `data-act-input="filter" data-jenis="${jenis}" data-kunci="${kunci}"`;

    return `
      <div
        class="filter-bar no-print"
        role="search"
        aria-label="${masuk ? "Cari dan saring riwayat kas masuk" : "Cari dan saring riwayat pengeluaran"}"
      >

        <div class="field fb-cari">
          <label>Cari</label>
          <input
            type="search"
            maxlength="60"
            autocomplete="off"
            placeholder="${masuk ? "Nama, keterangan, atau pencatat" : "Kategori, keterangan, pencatat"}"
            value="${esc(f.q)}"
            ${atribut("q")}
          >
        </div>

        <div class="field">
          <label>Dari tanggal</label>
          <input
            type="date"
            value="${esc(f.dari)}"
            ${sah ? "" : 'aria-invalid="true"'}
            ${atribut("dari")}
          >
        </div>

        <div class="field">
          <label>Sampai tanggal</label>
          <input
            type="date"
            value="${esc(f.sampai)}"
            ${sah ? "" : 'aria-invalid="true"'}
            ${atribut("sampai")}
          >
        </div>

        <div class="field">
          <label>${masuk ? "Metode" : "Kategori"}</label>
          <select ${atribut(kunciPilihan)}>
            ${pilihan
              .map(
                ([v, l]) =>
                  `<option value="${esc(v)}" ${f[kunciPilihan] === v ? "selected" : ""}>${esc(l)}</option>`,
              )
              .join("")}
          </select>
        </div>

        <div class="field fb-reset">
          <button
            type="button"
            class="btn btn-outline"
            data-act="filterReset"
            data-jenis="${jenis}"
            ${filterAktif(f) ? "" : "disabled"}
          >
            Atur ulang
          </button>
        </div>

      </div>

      <p class="filter-galat" id="galat-${jenis}" role="alert" ${sah ? "hidden" : ""}>
        Tanggal awal tidak boleh setelah tanggal akhir.
      </p>
    `;
  }

  // Gambar ulang hanya hasilnya (tabel + info), bukan seluruh halaman, supaya
  // fokus dan posisi kursor di kolom cari tidak hilang selagi mengetik.
  function segarkanHasil(jenis) {
    const kotak = document.getElementById("hasil-" + jenis);

    if (!kotak) {
      render();

      return;
    }

    const masuk = jenis === "masuk";

    kotak.innerHTML = masuk ? riwayatMasukHtml() : riwayatKeluarHtml();

    pasangAksiDi(kotak);

    const { semua, rows } = masuk ? riwayatMasuk() : riwayatKeluar();

    const info = document.getElementById("info-" + jenis);

    if (info) {
      info.textContent = infoFilter(jenis, rows.length, semua.length);
    }

    const f = masuk ? ui.filterMasuk : ui.filterKeluar;

    const sah = rentangFilterSah(f);

    const galat = document.getElementById("galat-" + jenis);

    if (galat) {
      galat.hidden = sah;
    }

    document
      .querySelectorAll(`.filter-bar input[type="date"][data-jenis="${jenis}"]`)
      .forEach((el) => {
        if (sah) {
          el.removeAttribute("aria-invalid");
        } else {
          el.setAttribute("aria-invalid", "true");
        }
      });

    const reset = document.querySelector(
      `[data-act="filterReset"][data-jenis="${jenis}"]`,
    );

    if (reset) {
      reset.disabled = !filterAktif(f);
    }
  }

  function segarkanStatusDaftar() {
    const kotak = document.getElementById("status-daftar");

    if (!kotak) {
      return;
    }

    kotak.innerHTML = statusDaftarHtml(kotak.dataset.pos || "Rutin");

    pasangAksiDi(kotak);
  }

  let tundaCari = null;

  function tunda(fungsi) {
    clearTimeout(tundaCari);

    tundaCari = setTimeout(fungsi, 120);
  }

  function saatInput(e) {
    const el = e.currentTarget;

    const act = el.dataset.actInput;

    if (act === "filter") {
      const jenis = el.dataset.jenis === "keluar" ? "keluar" : "masuk";

      const f = jenis === "masuk" ? ui.filterMasuk : ui.filterKeluar;

      f[el.dataset.kunci] = el.value;

      if (el.dataset.kunci === "q") {
        tunda(() => segarkanHasil(jenis));
      } else {
        segarkanHasil(jenis);
      }

      return;
    }

    if (act === "cariStatus") {
      ui.cariStatus = el.value;

      tunda(segarkanStatusDaftar);

      return;
    }

    if (act === "rekapCari") {
      ui.rekap.cari = el.value;

      tunda(segarkanRekap);

      return;
    }

    if (act === "rekapRentang") {
      const kunci = el.dataset.kunci;

      ui.rekap[kunci] = el.value;

      if (kunci === "rentang" && el.value === "kustom" && !ui.rekap.dari) {
        const pos = posRekap();

        const r = rentangDari(ui.rekap.rentang, pos);

        ui.rekap.dari = r.dari;

        ui.rekap.sampai = r.sampai;
      }

      if (kunci === "rentang" && el.value !== "kustom") {
        // nilai tanggal kustom dibiarkan; yang dipakai adalah rentang bawaan
      }

      sinkronkanKolomRekap();

      segarkanRekap();

      return;
    }

    if (act === "laporanParam") {
      ubahParamLaporan(el);

      return;
    }
  }

  /* ==========================================================
     KARTU ANGKA, GRAFIK, DAN AKTIVITAS TERBARU (DASHBOARD)
  ========================================================== */

  function kartuAngka(pos) {
    const bulan = todayStr().slice(0, 7);

    const jumlahBulan = (daftar) =>
      daftar
        .filter((x) => x.pos === pos && monthKey(x.tanggal) === bulan)
        .reduce((s, x) => s + (Number(x.jumlah) || 0), 0);

    const masuk = totalMasukPos(pos);

    const keluar = totalKeluarPos(pos);

    const berjadwal = FREKUENSI_BERJADWAL.includes(frekuensiPos(pos));

    const total = SISWA_MASTER.length;

    let lunas;

    if (berjadwal) {
      const per = periodeAktif(pos);

      lunas = SISWA_MASTER.filter((n) => sudahBayarPeriode(pos, n, per)).length;
    } else {
      lunas = hitungRekap(pos, "0001-01-01", "9999-12-31").ringkas.lunas;
    }

    const belum = total - lunas;

    const rekap = berjadwal ? rekapSemua(pos) : null;

    const kartu = (kelas, ikon, label, nilai, sub) => `
      <div class="stat ${kelas}">
        <dt>${icon(ikon, "ico-sm")}${esc(label)}</dt>
        <dd class="stat-val">${nilai}</dd>
        <dd class="stat-sub">${sub}</dd>
      </div>
    `;

    return `
      <dl class="stat-grid" aria-label="Ringkasan angka ${esc(posMeta(pos).label)}">

        ${kartu("", "masuk", "Total pemasukan", esc(rupiah(masuk)), "Bulan ini " + esc(rupiah(jumlahBulan(DB.kasMasuk))))}

        ${kartu("", "keluar", "Total pengeluaran", esc(rupiah(keluar)), "Bulan ini " + esc(rupiah(jumlahBulan(DB.pengeluaran))))}

        ${kartu(
          "stat-ok",
          "centang",
          berjadwal ? "Lunas" : "Sudah setor",
          `${lunas}<span class="stat-dari"> dari ${total} siswa</span>`,
          berjadwal ? esc(periodeAktif(pos).nama) : "Sejak dana dibuka",
        )}

        ${kartu(
          "stat-warn",
          "jam",
          berjadwal ? "Belum bayar" : "Belum setor",
          `${belum}<span class="stat-dari"> siswa</span>`,
          berjadwal ? esc(periodeAktif(pos).nama) : "Sejak dana dibuka",
        )}

        ${
          rekap
            ? kartu(
                "stat-warn",
                "tanda",
                "Tunggakan",
                esc(rupiah(rekap.ringkas.tunggakan)),
                `${rekap.ringkas.menunggak} siswa menunggak`,
              )
            : ""
        }

      </dl>
    `;
  }

  /* ---------- data grafik ---------- */

  function dataBulanan(pos, n) {
    const bulanIni = todayStr().slice(0, 7) + "-01";

    const hasil = [];

    for (let i = n - 1; i >= 0; i--) {
      const tgl = geserBulan(bulanIni, -i);

      const bulan = Number(tgl.slice(5, 7));

      const tahun = Number(tgl.slice(0, 4));

      hasil.push({
        kunci: tgl.slice(0, 7),
        bulan,
        tahun,
        label: BULAN_PENDEK[bulan - 1],
        labelPanjang: NAMA_BULAN[bulan - 1] + " " + tahun,
        masuk: 0,
        keluar: 0,
      });
    }

    const indeks = new Map(hasil.map((d, i) => [d.kunci, i]));

    DB.kasMasuk.forEach((x) => {
      const i = x.pos === pos ? indeks.get(monthKey(x.tanggal)) : undefined;

      if (i !== undefined) {
        hasil[i].masuk += Number(x.jumlah) || 0;
      }
    });

    DB.pengeluaran.forEach((x) => {
      const i = x.pos === pos ? indeks.get(monthKey(x.tanggal)) : undefined;

      if (i !== undefined) {
        hasil[i].keluar += Number(x.jumlah) || 0;
      }
    });

    return hasil;
  }

  // Skala sumbu yang rapi: langkah 1 / 2 / 2,5 / 5 x 10^k, sekitar 4 garis bantu.
  function skalaBagus(maks) {
    const kasar = maks / 4;

    const pangkat = Math.pow(10, Math.floor(Math.log10(kasar)));

    const langkah =
      [1, 2, 2.5, 5, 10].map((m) => m * pangkat).find((k) => k >= kasar) ||
      pangkat * 10;

    return { langkah, puncak: Math.ceil(maks / langkah) * langkah };
  }

  // Satu gaya per sumbu: angka penuh di bawah 10.000, ringkas ("50 rb", "1,5 jt") di atasnya.
  function labelSumbu(v, ringkas) {
    if (!ringkas) {
      return ribuan(v);
    }

    if (v >= 1e9) return desimal(v / 1e9) + " M";

    if (v >= 1e6) return desimal(v / 1e6) + " jt";

    if (v >= 1e3) return desimal(v / 1e3) + " rb";

    return String(v);
  }

  const bulatkan = (n) => Math.round(n * 10) / 10;

  // Batang: ujung atas membulat (4px), dasar rata di garis dasar.
  function jalurBatang(x, y, w, h, r) {
    if (h <= 0) {
      return "";
    }

    const rr = Math.min(r, w / 2, h);

    return `M${bulatkan(x)},${bulatkan(y + h)}V${bulatkan(y + rr)}Q${bulatkan(x)},${bulatkan(y)} ${bulatkan(x + rr)},${bulatkan(y)}H${bulatkan(x + w - rr)}Q${bulatkan(x + w)},${bulatkan(y)} ${bulatkan(x + w)},${bulatkan(y + rr)}V${bulatkan(y + h)}Z`;
  }

  /* ---------- kartu grafik ---------- */

  function kartuGrafik(pos) {
    const n = ui.grafikBulan === 12 ? 12 : 6;

    const data = dataBulanan(pos, n);

    const tabel = ui.grafikTabel;

    const pilihBulan = [6, 12]
      .map(
        (v) => `
          <button
            type="button"
            class="chip"
            data-act="grafikBulan"
            data-val="${v}"
            aria-pressed="${n === v ? "true" : "false"}"
          >
            ${v} bulan
          </button>
        `,
      )
      .join("");

    return `
      <div class="dash-kolom">

        <div class="section-title grafik-head">

          <h2>Pemasukan dan pengeluaran</h2>

          <div class="chips no-print" role="group" aria-label="Atur grafik">

            ${pilihBulan}

            <button
              type="button"
              class="chip"
              data-act="grafikTabel"
              aria-pressed="${tabel ? "true" : "false"}"
            >
              ${icon("rekap", "ico-sm")}
              Tabel
            </button>

          </div>

        </div>

        <section class="card grafik" aria-label="Grafik pemasukan dan pengeluaran ${esc(posMeta(pos).label)}, ${n} bulan terakhir">

          <ul class="grafik-legenda">
            <li><i class="sw sw-masuk" aria-hidden="true"></i>Pemasukan</li>
            <li><i class="sw sw-keluar" aria-hidden="true"></i>Pengeluaran</li>
          </ul>

          ${
            tabel
              ? tabelGrafik(data)
              : `<div class="grafik-area" data-pos="${esc(pos)}" data-n="${n}"></div>`
          }

        </section>

      </div>
    `;
  }

  function tabelGrafik(data) {
    return `
      <div class="table-wrap grafik-tabel">

        <table>

          <caption class="sr-only">Pemasukan dan pengeluaran per bulan</caption>

          <thead>
            <tr>
              <th>Bulan</th>
              <th class="num">Pemasukan</th>
              <th class="num">Pengeluaran</th>
              <th class="num">Selisih</th>
            </tr>
          </thead>

          <tbody>
            ${data
              .map(
                (d) => `
                  <tr>
                    <td>${esc(d.labelPanjang)}</td>
                    <td class="rp">${esc(rupiah(d.masuk))}</td>
                    <td class="rp">${esc(rupiah(d.keluar))}</td>
                    <td class="rp">${esc(rupiahTanda(d.masuk - d.keluar))}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>

        </table>

      </div>
    `;
  }

  // Digambar setelah halaman tampil, supaya lebarnya mengikuti kotak sebenarnya.
  function gambarGrafik(area) {
    const lebar = Math.floor(area.clientWidth);

    if (lebar < 120) {
      return;
    }

    const pos = area.dataset.pos;

    const n = Number(area.dataset.n) === 12 ? 12 : 6;

    const data = dataBulanan(pos, n);

    const maks = Math.max(...data.map((d) => Math.max(d.masuk, d.keluar)));

    if (maks <= 0) {
      area.innerHTML = `
        <div class="empty">
          <div class="big">${icon("grafik")}</div>
          Belum ada transaksi pada ${n} bulan terakhir.
        </div>
      `;

      return;
    }

    const tinggi = lebar < 420 ? 210 : 250;

    const { langkah, puncak } = skalaBagus(maks);

    const ringkas = puncak >= 10000;

    const tick = [];

    for (let v = 0; v <= puncak + 1e-9; v += langkah) {
      tick.push(v);
    }

    const lebarLabel = Math.max(...tick.map((v) => labelSumbu(v, ringkas).length)) * 6.4;

    const M = { kiri: Math.ceil(lebarLabel) + 14, kanan: 8, atas: 24, bawah: 40 };

    const lebarPlot = lebar - M.kiri - M.kanan;

    const tinggiPlot = tinggi - M.atas - M.bawah;

    const band = lebarPlot / data.length;

    const batang = Math.max(5, Math.min(24, (band * 0.64 - 2) / 2));

    const yDari = (v) => M.atas + tinggiPlot - (v / puncak) * tinggiPlot;

    const bagian = [];

    // sorotan kelompok yang sedang diperiksa (di belakang batang)
    data.forEach((d, i) => {
      bagian.push(
        `<rect class="g-sorot" data-i="${i}" x="${bulatkan(M.kiri + i * band)}" y="${M.atas - 6}" width="${bulatkan(band)}" height="${bulatkan(tinggiPlot + 6)}" rx="4"/>`,
      );
    });

    // garis bantu dan angka sumbu
    tick.forEach((v) => {
      const y = bulatkan(yDari(v));

      bagian.push(
        `<line class="${v === 0 ? "g-dasar" : "g-grid"}" x1="${M.kiri}" x2="${lebar - M.kanan}" y1="${y}" y2="${y}"/>`,
        `<text class="g-tick" x="${M.kiri - 8}" y="${y + 4}" text-anchor="end">${esc(labelSumbu(v, ringkas))}</text>`,
      );
    });

    // batang
    data.forEach((d, i) => {
      const tengah = M.kiri + i * band + band / 2;

      const hMasuk = (d.masuk / puncak) * tinggiPlot;

      const hKeluar = (d.keluar / puncak) * tinggiPlot;

      const pMasuk = jalurBatang(tengah - batang - 1, yDari(d.masuk), batang, hMasuk, 4);

      const pKeluar = jalurBatang(tengah + 1, yDari(d.keluar), batang, hKeluar, 4);

      if (pMasuk) bagian.push(`<path class="g-batang g-masuk" d="${pMasuk}"/>`);

      if (pKeluar) bagian.push(`<path class="g-batang g-keluar" d="${pKeluar}"/>`);
    });

    // label nilai hanya pada puncak tiap seri (tidak pada setiap batang)
    const puncakMasuk = data.reduce((b, d, i) => (d.masuk > data[b].masuk ? i : b), 0);

    const puncakKeluar = data.reduce((b, d, i) => (d.keluar > data[b].keluar ? i : b), 0);

    const label = [];

    if (data[puncakMasuk].masuk > 0) {
      label.push({ x: M.kiri + puncakMasuk * band + band / 2 - batang / 2 - 1, y: yDari(data[puncakMasuk].masuk), v: data[puncakMasuk].masuk });
    }

    if (data[puncakKeluar].keluar > 0) {
      label.push({ x: M.kiri + puncakKeluar * band + band / 2 + batang / 2 + 1, y: yDari(data[puncakKeluar].keluar), v: data[puncakKeluar].keluar });
    }

    const dipasang = [];

    label
      .sort((a, b) => b.v - a.v)
      .forEach((l) => {
        const teks = labelSumbu(l.v, l.v >= 10000);

        const setengah = teks.length * 3.4 + 4;

        const bentrok = dipasang.some((p) => Math.abs(p.x - l.x) < p.setengah + setengah);

        const kiriKeluar = l.x - setengah < M.kiri - 4 || l.x + setengah > lebar - 2;

        if (!bentrok && !kiriKeluar) {
          dipasang.push({ x: l.x, setengah });

          bagian.push(`<text class="g-nilai" x="${bulatkan(l.x)}" y="${bulatkan(l.y - 6)}" text-anchor="middle">${esc(teks)}</text>`);
        }
      });

    // label bulan (tahun di bawahnya untuk kolom pertama dan Januari)
    const rapat = band < 34;

    data.forEach((d, i) => {
      const x = bulatkan(M.kiri + i * band + band / 2);

      const tampil = !rapat || i % 2 === data.length % 2 || i === data.length - 1;

      if (!tampil) {
        return;
      }

      bagian.push(
        `<text class="g-tick" x="${x}" y="${tinggi - M.bawah + 17}" text-anchor="middle">${esc(d.label)}</text>`,
      );

      if (i === 0 || d.bulan === 1) {
        bagian.push(
          `<text class="g-tahun" x="${x}" y="${tinggi - M.bawah + 31}" text-anchor="middle">${d.tahun}</text>`,
        );
      }
    });

    // area sentuh: setiap bulan satu kolom penuh (jauh lebih besar dari batangnya)
    data.forEach((d, i) => {
      const ringkasan = `${d.labelPanjang}: pemasukan ${rupiah(d.masuk)}, pengeluaran ${rupiah(d.keluar)}, selisih ${rupiahTanda(d.masuk - d.keluar)}`;

      bagian.push(
        `<rect class="grafik-hit" data-i="${i}" data-label="${esc(d.labelPanjang)}" data-masuk="${d.masuk}" data-keluar="${d.keluar}" tabindex="${i === data.length - 1 ? 0 : -1}" role="img" aria-label="${esc(ringkasan)}" x="${bulatkan(M.kiri + i * band)}" y="${M.atas - 6}" width="${bulatkan(band)}" height="${bulatkan(tinggiPlot + 6 + M.bawah)}"/>`,
      );
    });

    area.innerHTML = `<svg class="grafik-svg" width="${lebar}" height="${tinggi}" viewBox="0 0 ${lebar} ${tinggi}" role="group" aria-label="Grafik batang pemasukan dan pengeluaran ${n} bulan terakhir. Gunakan tombol panah kiri dan kanan untuk memeriksa tiap bulan.">${bagian.join("")}</svg>`;
  }

  /* ---------- tooltip grafik (satu elemen di <body>, dipasang sekali) ---------- */

  let tip = null;

  function elemenTip() {
    if (!tip) {
      tip = document.createElement("div");

      tip.className = "grafik-tip";

      tip.setAttribute("role", "tooltip");

      tip.hidden = true;

      document.body.appendChild(tip);
    }

    return tip;
  }

  const buat = (tag, kelas, teks) => {
    const e = document.createElement(tag);

    if (kelas) e.className = kelas;

    if (teks !== undefined) e.textContent = teks;

    return e;
  };

  function sembunyiTip() {
    if (tip) {
      tip.hidden = true;
    }

    document
      .querySelectorAll(".g-sorot.aktif")
      .forEach((e) => e.classList.remove("aktif"));
  }

  function tampilTip(hit) {
    const kotak = elemenTip();

    const masuk = Number(hit.dataset.masuk) || 0;

    const keluar = Number(hit.dataset.keluar) || 0;

    kotak.textContent = "";

    const baris = (kelas, nama, nilai) => {
      const r = buat("div", "tip-baris");

      r.append(buat("i", "tip-kunci " + kelas), buat("span", "tip-nama", nama), buat("b", "tip-nilai", nilai));

      return r;
    };

    kotak.append(
      buat("div", "tip-judul", hit.dataset.label || ""),
      baris("sw-masuk", "Pemasukan", rupiah(masuk)),
      baris("sw-keluar", "Pengeluaran", rupiah(keluar)),
      baris("tip-selisih", "Selisih", rupiahTanda(masuk - keluar)),
    );

    kotak.hidden = false;

    const svg = hit.closest("svg");

    svg.querySelectorAll(".g-sorot.aktif").forEach((e) => e.classList.remove("aktif"));

    const sorot = svg.querySelector(`.g-sorot[data-i="${hit.dataset.i}"]`);

    if (sorot) sorot.classList.add("aktif");

    const r = hit.getBoundingClientRect();

    let kiri = r.left + r.width / 2 - kotak.offsetWidth / 2;

    kiri = Math.max(8, Math.min(kiri, window.innerWidth - kotak.offsetWidth - 8));

    let atas = r.top - kotak.offsetHeight - 6;

    if (atas < 8) {
      atas = Math.min(r.top + 24, window.innerHeight - kotak.offsetHeight - 8);
    }

    kotak.style.left = kiri + "px";

    kotak.style.top = atas + "px";
  }

  const hitDari = (e) =>
    e.target && e.target.closest ? e.target.closest(".grafik-hit") : null;

  document.addEventListener("pointerover", (e) => {
    const hit = hitDari(e);

    if (hit) tampilTip(hit);
  });

  document.addEventListener("pointerout", (e) => {
    if (e.pointerType !== "mouse" || !hitDari(e)) {
      return;
    }

    const ke = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(".grafik-hit") : null;

    if (!ke) sembunyiTip();
  });

  document.addEventListener("pointerdown", (e) => {
    if (!hitDari(e)) sembunyiTip();
  });

  document.addEventListener("focusin", (e) => {
    const hit = hitDari(e);

    if (!hit) return;

    let papanKetik = true;

    try {
      papanKetik = hit.matches(":focus-visible");
    } catch (err) {
      papanKetik = true;
    }

    if (papanKetik) tampilTip(hit);
  });

  document.addEventListener("focusout", (e) => {
    if (hitDari(e)) sembunyiTip();
  });

  document.addEventListener("keydown", (e) => {
    const hit = hitDari(e);

    if (!hit) return;

    if (e.key === "Escape") {
      sembunyiTip();

      return;
    }

    const semua = Array.from(hit.closest("svg").querySelectorAll(".grafik-hit"));

    const i = semua.indexOf(hit);

    let tujuan = null;

    if (e.key === "ArrowRight") tujuan = semua[Math.min(i + 1, semua.length - 1)];

    if (e.key === "ArrowLeft") tujuan = semua[Math.max(i - 1, 0)];

    if (e.key === "Home") tujuan = semua[0];

    if (e.key === "End") tujuan = semua[semua.length - 1];

    if (tujuan) {
      e.preventDefault();

      semua.forEach((h) => h.setAttribute("tabindex", "-1"));

      tujuan.setAttribute("tabindex", "0");

      tujuan.focus();
    }
  });

  // Memfokuskan kolom grafik bisa menggulir halaman (kolomnya tinggi); tooltip
  // milik fokus papan ketik ikut digeser, sedangkan yang milik pointer ditutup.
  window.addEventListener(
    "scroll",
    () => {
      const aktif = document.activeElement;

      if (
        tip &&
        !tip.hidden &&
        aktif &&
        aktif.classList &&
        aktif.classList.contains("grafik-hit")
      ) {
        tampilTip(aktif);

        return;
      }

      sembunyiTip();
    },
    { passive: true },
  );

  let tundaUkur = null;

  window.addEventListener("resize", () => {
    clearTimeout(tundaUkur);

    tundaUkur = setTimeout(() => {
      sembunyiTip();

      document.querySelectorAll("#app .grafik-area").forEach(gambarGrafik);
    }, 150);
  });

  /* ---------- aktivitas terbaru ---------- */

  function kartuAktivitas(pos) {
    const butir = DB.kasMasuk
      .filter((x) => x.pos === pos)
      .map((x) => ({ jenis: "masuk", x }))
      .concat(
        DB.pengeluaran
          .filter((x) => x.pos === pos)
          .map((x) => ({ jenis: "keluar", x })),
      )
      .sort(
        (a, b) =>
          (Number(b.x.createdAt) || 0) - (Number(a.x.createdAt) || 0) ||
          String(b.x.tanggal).localeCompare(String(a.x.tanggal)) ||
          Number(b.x.id) - Number(a.x.id),
      )
      .slice(0, 6);

    const baris = butir
      .map(({ jenis, x }) => {
        const masuk = jenis === "masuk";

        const judul = masuk ? tampilNama(x.siswa) : esc(x.kategori);

        const rincian = masuk
          ? `Setoran, ${esc(x.metode || "Tunai")}${x.keterangan ? ", " + esc(x.keterangan) : ""}`
          : esc(x.keterangan || "Pengeluaran");

        const oleh = x.olehNama ? `, dicatat ${esc(titleCase(x.olehNama))}` : "";

        return `
          <li class="aktivitas-item">

            <span class="a-ikon ${masuk ? "a-masuk" : "a-keluar"}" aria-hidden="true">
              ${icon(masuk ? "masuk" : "keluar")}
            </span>

            <strong class="a-judul">${judul}</strong>

            <span class="a-jumlah rp ${masuk ? "a-plus" : "a-minus"}">
              ${masuk ? "+" : "\u2212"}${esc(rupiah(x.jumlah))}
            </span>

            <div class="a-rinci">
              <span class="a-rincian">${rincian}</span>
              <span class="a-waktu">${esc(fmtDate(x.tanggal))}${oleh}</span>
            </div>

          </li>
        `;
      })
      .join("");

    return `
      <div class="dash-kolom">

        <div class="section-title">
          <h2>Aktivitas terbaru</h2>
        </div>

        <section class="card aktivitas" aria-label="Aktivitas terbaru ${esc(posMeta(pos).label)}">

          ${
            baris
              ? `<ul class="aktivitas-daftar">${baris}</ul>`
              : `<div class="empty"><div class="big">${icon("jam")}</div>Belum ada aktivitas.</div>`
          }

        </section>

      </div>
    `;
  }

  function dashboardKartu(pos) {
    return `
      ${kartuAngka(pos)}

      <div class="dash-grid">
        ${kartuGrafik(pos)}
        ${kartuAktivitas(pos)}
      </div>
    `;
  }

  /* ==========================================================
     REKAP SISWA
  ========================================================== */

  function posRekap() {
    return POS_KUNCI.includes(ui.pos) ? ui.pos : "Rutin";
  }

  function rentangRekap() {
    const r = ui.rekap;

    return rentangDari(r.rentang, posRekap(), r.dari, r.sampai);
  }

  function rekapRentangSah(rg) {
    return tanggalSah(rg.dari) && tanggalSah(rg.sampai) && rg.dari <= rg.sampai;
  }

  function pageRekap() {
    const r = ui.rekap;

    const rg = rentangRekap();

    const kustom = r.rentang === "kustom";

    return `
      <div class="page-head">

        <h1>Rekap Siswa</h1>

        <p>
          Status pembayaran, tunggakan, dan riwayat setoran tiap siswa.
          Angkanya sama dengan yang tertulis di halaman Laporan.
        </p>

      </div>

      ${posTabs()}

      <section class="form-card rekap-filter no-print" aria-label="Atur rekap">

        <div class="fgrid fg3">

          <div class="field fg-penuh">
            <label>Periode</label>
            <select data-act-input="rekapRentang" data-kunci="rentang">
              ${opsiRentang(r.rentang)}
            </select>
          </div>

          <div class="field">
            <label>Dari tanggal</label>
            <input
              type="date"
              id="rekap-dari"
              value="${esc(rg.dari)}"
              ${kustom ? "" : "disabled"}
              data-act-input="rekapRentang"
              data-kunci="dari"
            >
          </div>

          <div class="field">
            <label>Sampai tanggal</label>
            <input
              type="date"
              id="rekap-sampai"
              value="${esc(rg.sampai)}"
              ${kustom ? "" : "disabled"}
              data-act-input="rekapRentang"
              data-kunci="sampai"
            >
          </div>

        </div>

        <p class="filter-galat" id="rekap-galat" role="alert" ${rekapRentangSah(rg) ? "hidden" : ""}>
          Tanggal awal tidak boleh setelah tanggal akhir.
        </p>

        <div class="field">
          <label>Cari siswa</label>
          <input
            type="search"
            id="rekap-cari"
            maxlength="60"
            autocomplete="off"
            placeholder="Ketik nama siswa"
            value="${esc(r.cari)}"
            data-act-input="rekapCari"
          >
        </div>

      </section>

      <div id="rekap-isi">
        ${rekapIsiHtml()}
      </div>
    `;
  }

  function rekapIsiHtml() {
    const pos = posRekap();

    const rg = rentangRekap();

    if (!rekapRentangSah(rg)) {
      return `
        <div class="table-wrap">
          <div class="empty">
            <div class="big">${icon("tanda")}</div>
            Pilih rentang tanggal yang benar untuk melihat rekap.
          </div>
        </div>
      `;
    }

    const rekap = hitungRekap(pos, rg.dari, rg.sampai);

    const r = ui.rekap;

    const status = ["semua", "lunas", "belum", "menunggak"].includes(r.status)
      ? r.status
      : "semua";

    const cari = normalizedText(r.cari);

    const kalimatStatus = rekap.berjadwal
      ? { lunas: "Lunas", belum: "Belum bayar" }
      : { lunas: "Sudah setor", belum: "Belum setor" };

    const jumlahMenunggak = rekap.ringkas.menunggak;

    const chips = [
      ["semua", "Semua", rekap.baris.length],
      ["lunas", kalimatStatus.lunas, rekap.ringkas.lunas],
      ["belum", kalimatStatus.belum, rekap.ringkas.belum],
    ];

    if (rekap.berjadwal) {
      chips.push(["menunggak", "Menunggak", jumlahMenunggak]);
    }

    const cocok = rekap.baris.filter((b) => {
      if (cari && !normalizedText(b.nama).includes(cari)) return false;

      if (status === "lunas") return b.status === "Lunas" || b.status === "Sudah setor";

      if (status === "belum") return b.status === "Belum bayar" || b.status === "Belum setor";

      if (status === "menunggak") return b.menunggak > 0;

      return true;
    });

    const kartu = (kelas, ikon, label, nilai, sub) => `
      <div class="stat ${kelas}">
        <dt>${icon(ikon, "ico-sm")}${esc(label)}</dt>
        <dd class="stat-val">${nilai}</dd>
        <dd class="stat-sub">${sub}</dd>
      </div>
    `;

    const catatan = rekap.berjadwal
      ? rekap.periodeDitagih
        ? `Ditagih ${rekap.periodeDitagih} ${rekap.satuan} (mulai ${fmtDate(rekap.mulaiTagih)}). Tunggakan = ${rekap.satuan} yang belum lunas x ${rupiah(rekap.nominal)}. ${kapital(rekap.satuan)} yang sedang berjalan ikut ditagih.`
        : "Belum ada periode yang jatuh tempo pada rentang ini, sehingga belum ada tunggakan."
      : "Dana ini dikumpulkan sesuai kebutuhan, jadi tidak ada tunggakan.";

    return `
      <dl class="stat-grid rekap-ringkas" aria-label="Ringkasan rekap">

        ${kartu("stat-ok", "centang", kalimatStatus.lunas, `${rekap.ringkas.lunas}<span class="stat-dari"> dari ${rekap.baris.length} siswa</span>`, esc(rentangTeks(rg)))}

        ${kartu("stat-warn", "jam", kalimatStatus.belum, `${rekap.ringkas.belum}<span class="stat-dari"> siswa</span>`, rekap.berjadwal ? "pada periode berjalan" : "belum menyetor")}

        ${
          rekap.berjadwal
            ? kartu("stat-warn", "tanda", "Tunggakan", esc(rupiah(rekap.ringkas.tunggakan)), `${jumlahMenunggak} siswa menunggak`)
            : ""
        }

        ${kartu("", "masuk", "Total dibayar", esc(rupiah(rekap.ringkas.total)), "pada rentang ini")}

      </dl>

      <p class="rekap-catatan muted">${esc(catatan)}</p>

      <div class="chips no-print" role="group" aria-label="Tampilkan siswa">
        ${chips
          .map(
            ([kunci, label, jumlah]) => `
              <button
                type="button"
                class="chip"
                data-act="rekapStatus"
                data-val="${kunci}"
                aria-pressed="${status === kunci ? "true" : "false"}"
              >
                ${esc(label)}
                <b>${jumlah}</b>
              </button>
            `,
          )
          .join("")}

        <button type="button" class="btn btn-soft btn-sm rekap-ke-laporan" data-act="keLaporan">
          ${icon("laporan", "ico-sm")}
          Buat laporan siswa
        </button>
      </div>

      ${
        cocok.length
          ? tabelRekap(rekap, cocok)
          : `
            <div class="table-wrap">
              <div class="empty">
                <div class="big">${icon("cari")}</div>
                Tidak ada siswa yang cocok dengan pencarian atau filter.
              </div>
            </div>
          `
      }
    `;
  }

  function rentangTeks(rg) {
    return rg.dari === rg.sampai
      ? fmtDate(rg.dari)
      : `${fmtDate(rg.dari)} s.d. ${fmtDate(rg.sampai)}`;
  }

  function badgeRekap(status) {
    if (status === "Lunas" || status === "Sudah setor") {
      return `<span class="badge badge-ok">${icon("centang")}${esc(status)}</span>`;
    }

    if (status === "Belum bayar" || status === "Belum setor") {
      return `<span class="badge badge-warn">${icon("jam")}${esc(status)}</span>`;
    }

    return `<span class="muted">-</span>`;
  }

  function tabelRekap(rekap, daftar) {
    const berjadwal = rekap.berjadwal;

    const satuan = kapital(rekap.satuan);

    const jumlahKolom = berjadwal ? 9 : 7;

    const baris = daftar
      .map((b) => {
        const kunci = normalizedText(b.nama);

        const terbuka = ui.rekap.buka === kunci;

        const sel = berjadwal
          ? `
              <td data-label="${satuan} lunas" class="angka"><span>${b.lunas}<span class="dari"> dari ${b.tempo}</span></span></td>
              <td data-label="${satuan} menunggak" class="angka ${b.menunggak ? "menunggak" : ""}"><span>${b.menunggak}</span></td>
              <td data-label="Total dibayar" class="rp">${esc(rupiah(b.total))}</td>
              <td data-label="Tunggakan" class="rp ${b.tunggakan ? "menunggak" : ""}">${esc(rupiah(b.tunggakan))}</td>
            `
          : `
              <td data-label="Setoran" class="angka"><span>${b.setoran}</span></td>
              <td data-label="Total dibayar" class="rp">${esc(rupiah(b.total))}</td>
            `;

        return `
          <tr class="${terbuka ? "sorot" : ""}">

            <td data-label="No" class="c-no">${b.no}</td>

            <td data-label="Nama" class="nama">${tampilNama(b.nama)}</td>

            <td data-label="Status">${badgeRekap(b.status)}</td>

            ${sel}

            <td data-label="Setoran terakhir" class="mono ${b.terakhir ? "" : "kosong"}">${b.terakhir ? esc(fmtDate(b.terakhir)) : "-"}</td>

            <td data-label="Riwayat" class="no-print riwayat-sel">
              <button
                type="button"
                class="btn btn-sm btn-outline"
                data-act="rekapBuka"
                data-nama="${esc(kunci)}"
                aria-expanded="${terbuka ? "true" : "false"}"
                aria-controls="riwayat-${b.no}"
              >
                ${terbuka ? "Tutup" : "Riwayat"}
              </button>
            </td>

          </tr>

          ${terbuka ? riwayatSiswaBaris(rekap, b, jumlahKolom) : ""}
        `;
      })
      .join("");

    return `
      <div class="table-wrap rekap-wrap">

        <table class="t-rekap">

          <thead>
            <tr>
              <th class="c-no">No</th>
              <th>Nama</th>
              <th>Status</th>
              ${
                berjadwal
                  ? `
                    <th class="num">${satuan} lunas</th>
                    <th class="num">${satuan} menunggak</th>
                    <th class="num">Total dibayar</th>
                    <th class="num">Tunggakan</th>
                  `
                  : `
                    <th class="num">Setoran</th>
                    <th class="num">Total dibayar</th>
                  `
              }
              <th>Setoran terakhir</th>
              <th class="no-print">Riwayat</th>
            </tr>
          </thead>

          <tbody>
            ${baris}
          </tbody>

        </table>

      </div>
    `;
  }

  // Riwayat setoran satu siswa pada pos dan rentang yang sedang dilihat.
  function riwayatSiswaBaris(rekap, b, jumlahKolom) {
    const kunci = normalizedText(b.nama);

    const setoran = DB.kasMasuk
      .filter(
        (x) =>
          normalizedText(x.pos) === normalizedText(rekap.pos) &&
          normalizedText(x.siswa) === kunci &&
          dateOnlyKey(x.tanggal) >= rekap.dari &&
          dateOnlyKey(x.tanggal) <= rekap.sampai,
      )
      .sort((a, c) => String(c.tanggal).localeCompare(String(a.tanggal)));

    return `
      <tr class="rekap-detail">
        <td colspan="${jumlahKolom}" id="riwayat-${b.no}">

          <div class="riwayat-judul">
            Riwayat setoran ${tampilNama(b.nama)}
            <span class="muted">${setoran.length} setoran, ${esc(rentangTeks(rekap))}</span>
          </div>

          ${
            setoran.length
              ? `
                <ul class="riwayat-daftar">
                  ${setoran
                    .map(
                      (x) => `
                        <li>
                          <span class="mono">${esc(fmtDate(x.tanggal))}</span>
                          <span class="rp">${esc(rupiah(x.jumlah))}</span>
                          <span class="badge badge-info">${esc(x.metode || "Tunai")}</span>
                          <span class="r-ket">${esc(x.keterangan || "-")}</span>
                          <span class="r-oleh muted">${x.olehNama ? "oleh " + esc(titleCase(x.olehNama)) : ""}</span>
                        </li>
                      `,
                    )
                    .join("")}
                </ul>
              `
              : `<p class="muted">Belum ada setoran pada rentang ini.</p>`
          }

        </td>
      </tr>
    `;
  }

  function segarkanRekap() {
    const kotak = document.getElementById("rekap-isi");

    if (!kotak) {
      return;
    }

    kotak.innerHTML = rekapIsiHtml();

    pasangAksiDi(kotak);

    const galat = document.getElementById("rekap-galat");

    if (galat) {
      galat.hidden = rekapRentangSah(rentangRekap());
    }
  }

  function sinkronkanKolomRekap() {
    const r = ui.rekap;

    const rg = rentangRekap();

    const dari = document.getElementById("rekap-dari");

    const sampai = document.getElementById("rekap-sampai");

    const kustom = r.rentang === "kustom";

    [
      [dari, rg.dari],
      [sampai, rg.sampai],
    ].forEach(([el, nilai]) => {
      if (!el) return;

      el.disabled = !kustom;

      if (!kustom) {
        el.value = nilai;
      }

      if (rekapRentangSah(rg)) {
        el.removeAttribute("aria-invalid");
      } else {
        el.setAttribute("aria-invalid", "true");
      }
    });
  }

  /* ==========================================================
     LAPORAN
  ========================================================== */

  const JENIS_LAPORAN = [
    ["lengkap", "Laporan lengkap"],
    ["ringkasan", "Ringkasan saldo"],
    ["pemasukan", "Pemasukan"],
    ["pengeluaran", "Pengeluaran"],
    ["siswa", "Pembayaran siswa dan tunggakan"],
  ];

  let lapCache = {
    kunci: "",
    rev: "",
    data: null,
    sibuk: false,
    sibukKunci: "",
    sibukRev: "",
    galat: "",
    galatKunci: "",
    galatRev: "",
  };

  let lapNomor = 0;

  function posLaporan() {
    const p = ui.laporan.pos;

    return POS_KUNCI.includes(p) ? p : myPos() || "Rutin";
  }

  function rentangLaporan() {
    const L = ui.laporan;

    return rentangDari(L.rentang, posLaporan(), L.dari, L.sampai);
  }

  // Parameter untuk server; null bila isiannya belum sah.
  function parameterLaporan() {
    const L = ui.laporan;

    const rg = rentangLaporan();

    if (
      !JENIS_LAPORAN.some(([k]) => k === L.jenis) ||
      !tanggalSah(rg.dari) ||
      !tanggalSah(rg.sampai) ||
      rg.dari > rg.sampai ||
      selisihHari(rg.dari, rg.sampai) > MAKS_HARI_LAPORAN
    ) {
      return null;
    }

    return { jenis: L.jenis, pos: posLaporan(), dari: rg.dari, sampai: rg.sampai };
  }

  function pesanGalatRentang() {
    const rg = rentangLaporan();

    if (!tanggalSah(rg.dari) || !tanggalSah(rg.sampai)) {
      return "Isi tanggal awal dan tanggal akhir.";
    }

    if (rg.dari > rg.sampai) {
      return "Tanggal awal tidak boleh setelah tanggal akhir.";
    }

    if (selisihHari(rg.dari, rg.sampai) > MAKS_HARI_LAPORAN) {
      return "Rentang laporan terlalu panjang (maksimal 5 tahun).";
    }

    return "";
  }

  function pageLaporan() {
    const L = ui.laporan;

    const pos = posLaporan();

    const rg = rentangLaporan();

    const kustom = L.rentang === "kustom";

    const galat = pesanGalatRentang();

    const atribut = (kunci) =>
      `data-act-input="laporanParam" data-kunci="${kunci}"`;

    return `
      <div class="page-head no-print">

        <h1>Laporan</h1>

        <p>
          Susun laporan keuangan, lalu cetak atau unduh sebagai PDF atau Excel.
          Angka diambil langsung dari database saat laporan dibuat.
        </p>

      </div>

      <section class="form-card laporan-filter no-print" aria-label="Pengaturan laporan">

        <div class="fgrid fg3">

          <div class="field fg-penuh">
            <label>Jenis laporan</label>
            <select ${atribut("jenis")}>
              ${JENIS_LAPORAN.map(
                ([k, l]) =>
                  `<option value="${k}" ${k === L.jenis ? "selected" : ""}>${esc(l)}</option>`,
              ).join("")}
            </select>
          </div>

          <div class="field">
            <label>Pos dana</label>
            <select ${atribut("pos")}>
              ${POS.map(
                (p) =>
                  `<option value="${p.key}" ${p.key === pos ? "selected" : ""}>${esc(p.label)}</option>`,
              ).join("")}
            </select>
          </div>

          <div class="field">
            <label>Periode</label>
            <select ${atribut("rentang")}>
              ${opsiRentang(L.rentang)}
            </select>
          </div>

        </div>

        <div class="fgrid">

          <div class="field">
            <label>Dari tanggal</label>
            <input
              type="date"
              id="lap-dari"
              value="${esc(rg.dari)}"
              ${kustom ? "" : "disabled"}
              ${galat ? 'aria-invalid="true"' : ""}
              ${atribut("dari")}
            >
          </div>

          <div class="field">
            <label>Sampai tanggal</label>
            <input
              type="date"
              id="lap-sampai"
              value="${esc(rg.sampai)}"
              ${kustom ? "" : "disabled"}
              ${galat ? 'aria-invalid="true"' : ""}
              ${atribut("sampai")}
            >
          </div>

        </div>

        <p class="filter-galat" id="lap-galat" role="alert" ${galat ? "" : "hidden"}>${esc(galat)}</p>

        <div class="form-actions laporan-aksi">

          <button type="button" class="btn btn-primary" data-act="laporanCetak" ${galat ? "disabled" : ""}>
            ${icon("cetak")}
            Cetak
          </button>

          <button type="button" class="btn btn-outline" data-act="laporanUnduh" data-fmt="pdf" ${galat ? "disabled" : ""}>
            ${icon("unduh")}
            Unduh PDF
          </button>

          <button type="button" class="btn btn-outline" data-act="laporanUnduh" data-fmt="xlsx" ${galat ? "disabled" : ""}>
            ${icon("unduh")}
            Unduh Excel
          </button>

        </div>

      </section>

      <div id="laporan-hasil" aria-live="polite">
        ${laporanHasilHtml()}
      </div>
    `;
  }

  // Apa yang tampil di area pratinjau, menurut isi cache dan parameter sekarang.
  function laporanHasilHtml() {
    const p = parameterLaporan();

    if (!p) {
      return `
        <div class="table-wrap">
          <div class="empty">
            <div class="big">${icon("tanda")}</div>
            Lengkapi pengaturan laporan di atas untuk melihat pratinjau.
          </div>
        </div>
      `;
    }

    const kunci = JSON.stringify(p);

    if (lapCache.data && lapCache.kunci === kunci) {
      return `<div class="${lapCache.sibuk ? "lap-menyegarkan" : ""}">${kertasLaporan(lapCache.data)}</div>`;
    }

    if (lapCache.galat && lapCache.galatKunci === kunci && !lapCache.sibuk) {
      return `
        <div class="table-wrap">
          <div class="empty">
            <div class="big">${icon("tanda")}</div>
            <div>${esc(lapCache.galat)}</div>
            <button type="button" class="btn btn-outline" data-act="laporanCoba">Coba lagi</button>
          </div>
        </div>
      `;
    }

    const lama =
      lapCache.data && lapCache.sibuk
        ? `<div class="lap-menyegarkan">${kertasLaporan(lapCache.data)}</div>`
        : "";

    return (
      lama ||
      `
        <div class="table-wrap">
          <div class="empty" role="status">
            <div class="spinner" aria-hidden="true"></div>
            Menyusun laporan...
          </div>
        </div>
      `
    );
  }

  function tampilHasilLaporan() {
    const kotak = document.getElementById("laporan-hasil");

    if (!kotak) {
      return;
    }

    kotak.innerHTML = laporanHasilHtml();

    kotak.setAttribute("aria-busy", lapCache.sibuk ? "true" : "false");

    pasangAksiDi(kotak);
  }

  async function muatLaporan(paksa) {
    const p = parameterLaporan();

    // isian belum sah: pratinjau lama jangan dibiarkan seolah masih berlaku
    if (!p) {
      tampilHasilLaporan();

      return;
    }

    const kunci = JSON.stringify(p);

    const rev = revState;

    const segar =
      !!lapCache.data && lapCache.kunci === kunci && lapCache.rev === rev;

    const sedangMuatIni =
      lapCache.sibuk && lapCache.sibukKunci === kunci && lapCache.sibukRev === rev;

    const gagalIni =
      !!lapCache.galat &&
      lapCache.galatKunci === kunci &&
      lapCache.galatRev === rev;

    if (!paksa && (segar || sedangMuatIni || gagalIni)) {
      tampilHasilLaporan();

      return;
    }

    const nomor = ++lapNomor;

    lapCache.sibuk = true;

    lapCache.sibukKunci = kunci;

    lapCache.sibukRev = rev;

    lapCache.galat = "";

    tampilHasilLaporan();

    try {
      const j = await api("laporan", { method: "GET", params: p });

      if (nomor !== lapNomor) {
        return;
      }

      lapCache = {
        kunci,
        rev,
        data: j.laporan,
        sibuk: false,
        sibukKunci: "",
        sibukRev: "",
        galat: "",
        galatKunci: "",
        galatRev: "",
      };
    } catch (err) {
      if (nomor !== lapNomor) {
        return;
      }

      lapCache.sibuk = false;

      lapCache.galatRev = rev;

      lapCache.galat =
        err && err.kode === "sesi"
          ? ""
          : (err && err.message) || "Laporan gagal dimuat. Coba lagi.";

      lapCache.galatKunci = kunci;
    }

    tampilHasilLaporan();
  }

  function sinkronkanKolomLaporan() {
    const kotakDari = document.getElementById("lap-dari");

    const kotakSampai = document.getElementById("lap-sampai");

    if (!kotakDari || !kotakSampai) {
      return;
    }

    const kustom = ui.laporan.rentang === "kustom";

    const rg = rentangLaporan();

    const galat = pesanGalatRentang();

    [
      [kotakDari, rg.dari],
      [kotakSampai, rg.sampai],
    ].forEach(([el, nilai]) => {
      el.disabled = !kustom;

      if (!kustom) {
        el.value = nilai;
      }

      if (galat) {
        el.setAttribute("aria-invalid", "true");
      } else {
        el.removeAttribute("aria-invalid");
      }
    });

    const pesan = document.getElementById("lap-galat");

    if (pesan) {
      pesan.textContent = galat;

      pesan.hidden = !galat;
    }

    document
      .querySelectorAll(".laporan-aksi [data-act]")
      .forEach((tombol) => {
        tombol.disabled = !!galat;
      });
  }

  function ubahParamLaporan(el) {
    const L = ui.laporan;

    const kunci = el.dataset.kunci;

    if (kunci === "rentang" && el.value === "kustom" && L.rentang !== "kustom") {
      // mulai dari rentang yang sedang tampil, lalu dapat diubah bebas
      const sekarang = rentangLaporan();

      L.dari = sekarang.dari;

      L.sampai = sekarang.sampai;
    }

    L[kunci] = el.value;

    sinkronkanKolomLaporan();

    muatLaporan(false);
  }

  /* ---------- tampilan kertas laporan ---------- */

  function sel(k, nilai) {
    switch (k.t) {
      case "rupiah":
      case "angka":
        return ribuan(nilai);

      case "persen":
        return desimal(nilai) + "%";

      case "tanggal":
        return nilai ? esc(fmtDate(nilai)) : "-";

      case "status":
        return badgeRekap(String(nilai));

      default:
        return nilai === null || nilai === undefined || nilai === "" ? "-" : esc(nilai);
    }
  }

  function kertasLaporan(lap) {
    const r = lap.ringkas;

    const tampilRingkas = lap.jenis === "lengkap" || lap.jenis === "ringkasan";

    return `
      <article class="laporan-kertas" aria-label="Pratinjau ${esc(lap.judul)}">

        <header class="lk-kepala">

          <div class="lk-kelas">${esc(lap.kelas)}</div>

          <h2 class="lk-judul">${esc(lap.judul)}</h2>

          <div class="lk-sub">${esc(lap.posLabel)} &middot; ${esc(lap.periodeTeks)}</div>

          <div class="lk-meta">
            Dibuat oleh ${esc(lap.dibuat.oleh)} (${esc(lap.dibuat.jabatan)}) pada ${esc(lap.dibuat.waktuTeks)}.
            Angka dihitung langsung dari database kas saat laporan dibuat.
          </div>

        </header>

        ${
          tampilRingkas
            ? `
              <dl class="stat-grid lk-ringkas">
                <div class="stat"><dt>Saldo awal</dt><dd class="stat-val">${esc(rupiah(r.saldoAwal))}</dd></div>
                <div class="stat"><dt>${icon("masuk", "ico-sm")}Pemasukan</dt><dd class="stat-val">${esc(rupiah(r.masuk))}</dd><dd class="stat-sub">${r.jumlahMasuk} transaksi</dd></div>
                <div class="stat"><dt>${icon("keluar", "ico-sm")}Pengeluaran</dt><dd class="stat-val">${esc(rupiah(r.keluar))}</dd><dd class="stat-sub">${r.jumlahKeluar} transaksi</dd></div>
                <div class="stat"><dt>Saldo akhir</dt><dd class="stat-val">${esc(rupiah(r.saldoAkhir))}</dd></div>
              </dl>
            `
            : ""
        }

        ${lap.bagian.map(bagianLaporan).join("")}

      </article>
    `;
  }

  function bagianLaporan(b) {
    const kolom = b.kolom;

    const pertamaJumlah = Math.max(
      1,
      kolom.findIndex((k) => k.s),
    );

    const kepala = kolom
      .map(
        (k) =>
          `<th class="${k.t === "rupiah" || k.t === "angka" || k.t === "persen" ? "num" : ""} ${k.r === "tengah" ? "tengah" : ""}">${esc(k.l)}</th>`,
      )
      .join("");

    const isi = b.baris.length
      ? b.baris
          .map(
            (row) => `
              <tr class="${row.tebal ? "tebal" : ""}">
                ${kolom
                  .map(
                    (k) =>
                      `<td data-label="${esc(k.l)}" class="${k.t === "rupiah" || k.t === "angka" || k.t === "persen" ? "rp" : ""} ${k.r === "tengah" ? "tengah" : ""} ${k.t === "tanggal" ? "mono" : ""}">${sel(k, row[k.k])}</td>`,
                  )
                  .join("")}
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="${kolom.length}" class="kosong-baris">Tidak ada data pada periode ini.</td></tr>`;

    let kaki = "";

    if (b.total && b.baris.length) {
      const sel2 = [];

      kolom.forEach((k, i) => {
        if (i === 0) {
          sel2.push(
            `<td colspan="${pertamaJumlah}">${esc(b.total.label || "Jumlah")}</td>`,
          );
        } else if (i >= pertamaJumlah) {
          sel2.push(
            `<td class="${k.t === "rupiah" || k.t === "angka" || k.t === "persen" ? "rp" : ""}">${k.k in b.total ? sel(k, b.total[k.k]) : ""}</td>`,
          );
        }
      });

      kaki = `<tfoot><tr>${sel2.join("")}</tr></tfoot>`;
    }

    const meta = b.meta
      ? b.meta.berjadwal
        ? `<p class="lk-meta-siswa">${b.meta.lunas} lunas, ${b.meta.belum} belum bayar, ${b.meta.menunggak} menunggak, tunggakan ${esc(rupiah(b.meta.tunggakan))}.</p>`
        : `<p class="lk-meta-siswa">${b.meta.lunas} dari ${b.meta.jumlahSiswa} siswa sudah menyetor.</p>`
      : "";

    return `
      <section class="lk-bagian">

        <h3>${esc(b.judul)}</h3>

        ${b.catatan ? `<p class="lk-catatan muted">${esc(b.catatan)}</p>` : ""}

        ${meta}

        <div class="table-wrap lk-tabel">
          <table class="t-lap">
            <thead><tr>${kepala}</tr></thead>
            <tbody>${isi}</tbody>
            ${kaki}
          </table>
        </div>

      </section>
    `;
  }

  function cetakLaporan() {
    const p = parameterLaporan();

    if (!p || !lapCache.data || lapCache.kunci !== JSON.stringify(p)) {
      showToast("Laporan belum siap dicetak. Tunggu sampai pratinjau tampil.", "error");

      return;
    }

    const judulAsli = document.title;

    document.title = `Laporan Kas ${posMeta(p.pos).label} ${p.dari} sd ${p.sampai}`;

    try {
      window.print();
    } finally {
      document.title = judulAsli;
    }
  }

  function unduhLaporan(format, tombol) {
    const p = parameterLaporan();

    if (!p) {
      showToast("Lengkapi pengaturan laporan dulu.", "error");

      return;
    }

    unduhBerkas(
      "laporan_" + format,
      p,
      `Laporan-Kas-${p.pos}-${p.jenis}-${p.dari}_sd_${p.sampai}.${format}`,
      tombol,
    );
  }

  /* ==========================================================
     PENGHUBUNG KE script.js
  ========================================================== */

  // Dipanggil setiap selesai render(): gambar grafik sesuai lebar kotaknya,
  // ikat kolom cari/filter, dan mulai memuat pratinjau laporan bila perlu.
  function sesudahRender(app) {
    pasangInput(app);

    sembunyiTip();

    app.querySelectorAll(".grafik-area").forEach(gambarGrafik);

    if (ui.view === "laporan" && session && session.role === "bendahara") {
      muatLaporan(false);
    }
  }

  // Mengembalikan true bila aksi ini milik berkas ini.
  function aksi(act, el) {
    switch (act) {
      case "grafikBulan":
        ui.grafikBulan = Number(el.dataset.val) === 12 ? 12 : 6;

        render();

        return true;

      case "grafikTabel":
        ui.grafikTabel = !ui.grafikTabel;

        render();

        return true;

      case "filterReset":
        if (el.dataset.jenis === "keluar") {
          ui.filterKeluar = { q: "", dari: "", sampai: "", kategori: "" };
        } else {
          ui.filterMasuk = { q: "", dari: "", sampai: "", metode: "" };
        }

        render();

        return true;

      case "rekapStatus":
        ui.rekap.status = el.dataset.val || "semua";

        segarkanRekap();

        {
          const tombol = document.querySelector(
            `#rekap-isi [data-act="rekapStatus"][data-val="${ui.rekap.status}"]`,
          );

          if (tombol) tombol.focus();
        }

        return true;

      case "rekapBuka": {
        const nama = el.dataset.nama;

        ui.rekap.buka = ui.rekap.buka === nama ? null : nama;

        segarkanRekap();

        const tombol = Array.from(
          document.querySelectorAll('#rekap-isi [data-act="rekapBuka"]'),
        ).find((t) => t.dataset.nama === nama);

        if (tombol) tombol.focus();

        return true;
      }

      case "keLaporan": {
        const rg = rentangRekap();

        ui.laporan = {
          jenis: "siswa",
          pos: posRekap(),
          rentang: "kustom",
          dari: rg.dari,
          sampai: rg.sampai,
        };

        ui.view = "laporan";

        render();

        window.scrollTo(0, 0);

        return true;
      }

      case "laporanCetak":
        cetakLaporan();

        return true;

      case "laporanUnduh":
        unduhLaporan(el.dataset.fmt === "xlsx" ? "xlsx" : "pdf", el);

        return true;

      case "laporanCoba":
        muatLaporan(true);

        return true;

      default:
        return false;
    }
  }

  return {
    pageRekap,
    pageLaporan,
    dashboardKartu,
    tunggakanSaya,
    sesudahRender,
    aksi,
    saringMasuk,
    saringKeluar,
    infoFilter,
    barFilter,
    namaPencatat,
    // dibuka untuk pengujian otomatis
    hitungRekap,
    rentangDari,
    dataBulanan,
  };
})();
