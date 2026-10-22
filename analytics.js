/* ==========================================================
   analytics.js — ژمارا سەیرکەران (زیندی) + ئامارێن GoatCounter
   ١) ل خوارێ دوو ناڤنیشانان دانە (GoatCounter + Firebase)
   ٢) ل هەر وێبسایتەکی بنڤیسە:
      <script src="analytics.js" data-site="zaha"></script>
   ========================================================== */
window.ANALYTICS_CFG = {
  goatcounter: "mohammed55",                      // نموونە: "mohammed" (ژ mohammed.goatcounter.com)
  db: "https://mohammed-site-5ae97-default-rtdb.firebaseio.com"     // ناڤنیشانا Realtime Database
};

(function () {
  var S = document.currentScript, CFG = window.ANALYTICS_CFG;
  var SITE = (S && S.dataset.site) || "site";
  var silent = !!(S && S.hasAttribute("data-silent"));   // بۆ داشبۆردێ: خۆ نەژمێرە
  var hasGC = CFG.goatcounter.indexOf("YOUR") < 0;
  var hasDB = CFG.db.indexOf("YOUR") < 0;
  if (silent) return;

  /* ---------- GoatCounter ---------- */
  if (hasGC) {
    var g = document.createElement("script");
    g.async = true;
    g.dataset.goatcounter = "https://" + CFG.goatcounter + ".goatcounter.com/count";
    g.src = "https://gc.zgo.at/count.js";
    document.head.appendChild(g);
  }

  var view = "home";
  var id = Math.random().toString(36).slice(2, 10);
  var url = hasDB ? CFG.db + "/presence/" + encodeURIComponent(SITE) + "/" + id + ".json" : "";

  /* ---------- ژمارا زیندی (Firebase REST) ---------- */
  function ping() {
    if (!hasDB || document.hidden) return;
    fetch(url, {
      method: "PUT", keepalive: true,
      body: JSON.stringify({ t: { ".sv": "timestamp" }, v: String(view).slice(0, 50) })
    }).catch(function () {});
  }
  function leave() {
    if (!hasDB) return;
    fetch(url, { method: "DELETE", keepalive: true }).catch(function () {});
  }

  /* ---------- track(): تشتەکێ تایبەت ببینە ---------- */
  window.track = function (kind, name) {
    view = kind + ": " + name;
    try {
      if (hasGC && window.goatcounter && goatcounter.count)
        goatcounter.count({ path: kind + "/" + name, title: name, event: true });
    } catch (e) {}
    ping();
  };

  /* ---------- کلیکێن واتسئاپ و سۆشیال ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var h = a.href;
    if (/wa\.me|whatsapp\.com/.test(h)) track("whatsapp", SITE);
    else if (/instagram\.com|tiktok\.com|snapchat\.com|discord/.test(h)) track("social", h.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]);
    else if (/github\.io/.test(h) && a.hostname !== location.hostname) track("outbound", a.hostname);
  }, true);

  /* ---------- کیژ بەش دهێتە سەیرکرن ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting && x.target.id) { view = "section: " + x.target.id; ping(); } });
    }, { threshold: 0.5 });
    document.addEventListener("DOMContentLoaded", function () {
      document.querySelectorAll("section[id]").forEach(function (s) { io.observe(s); });
    });
  }

  /* ---------- ژمارا زیندی + هەمی سەردانان بۆ هەمی سەردانکەران ---------- */
  function $id(x) { return document.getElementById(x); }
  function revealRow() {
    var on = !$id("liveOn").hidden, v = !$id("liveV").hidden;
    $id("liveSep").hidden = !(on && v);
    $id("liveRow").hidden = !(on || v);
  }
  function showOnline() {
    if (!hasDB || !$id("liveRow")) return;
    fetch(CFG.db + "/presence/" + encodeURIComponent(SITE) + ".json")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var now = Date.now(), n = 0;
        Object.keys(d || {}).forEach(function (k) { if (d[k] && now - d[k].t < 45000) n++; });
        $id("liveN").textContent = Math.max(n, 1);
        $id("liveOn").hidden = false; revealRow();
      }).catch(function () {});
  }
  function showViews() {
    if (!hasGC || !$id("liveRow")) return;
    fetch("https://" + CFG.goatcounter + ".goatcounter.com/counter/TOTAL.json")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.count) { $id("viewsN").textContent = d.count; $id("liveV").hidden = false; revealRow(); }
      }).catch(function () {});
  }
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(showOnline, 1500); setInterval(showOnline, 10000);
    setTimeout(showViews, 2500); setInterval(showViews, 60000);
  });

  ping();
  setInterval(ping, 20000);
  document.addEventListener("visibilitychange", function () { document.hidden ? leave() : ping(); });
  window.addEventListener("pagehide", leave);
})();
