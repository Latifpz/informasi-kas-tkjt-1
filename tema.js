/* Pasang tema sebelum halaman digambar supaya tidak berkedip terang saat
   pengguna memakai tema gelap. Berkas terpisah (bukan skrip di index.html)
   agar Content-Security-Policy bisa melarang skrip sebaris. Logika yang sama
   ada di script.js (applyTheme). */
(function () {
  try {
    var t = localStorage.getItem("kastkjt1_theme_v1");

    if (
      !t &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      t = "dark";
    }

    if (t === "dark" || t === "light") {
      document.documentElement.setAttribute("data-theme", t);

      var m = document.querySelector('meta[name="theme-color"]');

      if (m) {
        m.setAttribute("content", t === "dark" ? "#0d1716" : "#f2f5f1");
      }
    }
  } catch (e) {
    /* penyimpanan peramban diblokir: pakai tema bawaan */
  }
})();
