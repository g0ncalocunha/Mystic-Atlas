window.MA = window.MA || {};

(function (MA) {
  "use strict";

  /* ------------------------------------------------------------------ utils */
  MA.$ = (sel, root = document) => root.querySelector(sel);
  MA.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  MA.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  MA.hash = (str) => {                       // FNV-1a
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  MA.rng = (seed) => {                       // mulberry32
    let a = typeof seed === "string" ? MA.hash(seed) : seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  MA.pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
  MA.mod = (a, n) => ((a % n) + n) % n;
  MA.pad = (n) => String(n).padStart(2, "0");
  MA.todayKey = (d = new Date()) => `${d.getFullYear()}-${MA.pad(d.getMonth() + 1)}-${MA.pad(d.getDate())}`;
  MA.digitSum = (n) => String(Math.abs(n)).split("").reduce((a, c) => a + (+c || 0), 0);
  MA.cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  MA.store = {
    get(k, def) { try { const v = localStorage.getItem("ma." + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
    set(k, v) { try { localStorage.setItem("ma." + k, JSON.stringify(v)); } catch { /* private mode */ } },
    del(k) { try { localStorage.removeItem("ma." + k); } catch { /* ignore */ } },
  };

  /* tiny event bus */
  const subs = {};
  MA.on = (ev, fn) => (subs[ev] = subs[ev] || []).push(fn);
  MA.emit = (ev, data) => (subs[ev] || []).forEach((fn) => fn(data));

  /* game-icons path data -> inline svg */
  MA.icon = (key, cls = "") => {
    const paths = (MA.ICONS && MA.ICONS[key]) || [];
    return `<svg class="gi ${cls}" viewBox="0 0 512 512" aria-hidden="true">${paths.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
  };

  /* optional user-provided art (see assets/overrides/README.md) */
  MA.override = (key, fallback, alt = "", fit = "contain") => {
    const o = MA.OVERRIDES && MA.OVERRIDES[key];
    if (!o) return fallback;
    if (typeof o === "string") return `<img class="ovr ${fit}" src="assets/overrides/${MA.esc(o)}" alt="${MA.esc(alt)}" decoding="async">`;
    // region of a texture atlas, drawn as a percentage-based CSS sprite so it scales with its box
    const [IW, IH] = o.size, [x, y, w, h] = o.rect;
    const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0).toFixed(4) + "%";
    return `<span class="ovr-sprite ${fit}" role="img" aria-label="${MA.esc(alt)}" style="aspect-ratio:${w}/${h};` +
      `background-image:url('assets/overrides/${MA.esc(o.src)}');background-size:${pct(IW, w)} ${pct(IH, h)};` +
      `background-position:${pct(x, IW - w)} ${pct(y, IH - h)}"></span>`;
  };
  MA.hasOverride = (key) => !!(MA.OVERRIDES && MA.OVERRIDES[key]);

  MA.toast = (msg, ms = 2600) => {
    const t = MA.$("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), ms);
  };

  /* ---------------------------------------------------------------- astronomy
     Low-precision formulas after Meeus, "Astronomical Algorithms" (ch. 25 & 47).
     Sun ~0.01°, Moon ~0.3° — plenty for signs and a sky map. */
  const RAD = Math.PI / 180;
  const sinD = (x) => Math.sin(x * RAD), cosD = (x) => Math.cos(x * RAD);
  const norm = (x) => MA.mod(x, 360);

  MA.astro = {
    jd: (date) => date.getTime() / 86400000 + 2440587.5,
    sunLon(date) {
      const T = (this.jd(date) - 2451545) / 36525;
      const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
      const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
      const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M) + (0.019993 - 0.000101 * T) * sinD(2 * M) + 0.000289 * sinD(3 * M);
      const om = 125.04 - 1934.136 * T;
      return norm(L0 + C - 0.00569 - 0.00478 * sinD(om));
    },
    moon(date) {
      const T = (this.jd(date) - 2451545) / 36525;
      const Lp = 218.3164477 + 481267.88123421 * T;
      const D = 297.8501921 + 445267.1114034 * T;
      const M = 357.5291092 + 35999.0502909 * T;
      const Mp = 134.9633964 + 477198.8675055 * T;
      const F = 93.272095 + 483202.0175233 * T;
      const L = [[6288774, 0, 0, 1, 0], [1274027, 2, 0, -1, 0], [658314, 2, 0, 0, 0], [213618, 0, 0, 2, 0], [-185116, 0, 1, 0, 0],
        [-114332, 0, 0, 0, 2], [58793, 2, 0, -2, 0], [57066, 2, -1, -1, 0], [53322, 2, 0, 1, 0], [45758, 2, -1, 0, 0],
        [-40923, 0, 1, -1, 0], [-34720, 1, 0, 0, 0], [-30383, 0, 1, 1, 0], [15327, 2, 0, 0, -2], [-12528, 0, 0, 1, 2],
        [10980, 0, 0, 1, -2], [10675, 4, 0, -1, 0], [10034, 0, 0, 3, 0], [8548, 4, 0, -2, 0], [-7888, 2, 1, -1, 0],
        [-6766, 2, 1, 0, 0], [-5163, 1, 0, -1, 0], [4987, 1, 1, 0, 0], [4036, 2, -1, 1, 0]];
      const B = [[5128122, 0, 0, 0, 1], [280602, 0, 0, 1, 1], [277693, 0, 0, 1, -1], [173237, 2, 0, 0, -1],
        [55413, 2, 0, -1, 1], [46271, 2, 0, -1, -1], [32573, 2, 0, 0, 1], [17198, 0, 0, 2, 1]];
      const sum = (tab, fn) => tab.reduce((a, [c, d, m, mp, f]) => a + c * fn(d * D + m * M + mp * Mp + f * F), 0);
      return { lon: norm(Lp + sum(L, sinD) / 1e6), lat: sum(B, sinD) / 1e6 };
    },
    moonPhase(date) {
      const e = norm(this.moon(date).lon - this.sunLon(date));
      const illum = (1 - cosD(e)) / 2;
      const names = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
      return { elong: e, illum, name: names[Math.floor(norm(e + 22.5) / 45) % 8] };
    },
    signAt: (lon) => MA.SIGNS[Math.floor(norm(lon) / 30)],
    sunConstellation(lon) {
      let id = "Psc";
      for (const [start, c] of MA.SUN_CONSTELLATIONS) if (lon >= start) id = c;
      return id;
    },
  };

  /* ------------------------------------------------------- chinese calendar */
  let cnFmt = null;
  try {
    cnFmt = new Intl.DateTimeFormat("en-u-ca-chinese", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
    const probe = cnFmt.formatToParts(new Date(Date.UTC(2024, 1, 10, 12)));
    if (!probe.some((p) => p.type === "relatedYear")) cnFmt = null;
  } catch { cnFmt = null; }

  const STEMS_PY = ["Jia", "Yi", "Bing", "Ding", "Wu", "Ji", "Geng", "Xin", "Ren", "Gui"];

  MA.cn = {
    hasIntl: !!cnFmt,
    /* chinese calendar parts of a civil date (y, m 1-12, d) */
    parts(y, m, d) {
      if (!cnFmt) return null;
      const p = cnFmt.formatToParts(new Date(Date.UTC(y, m - 1, d, 12)));
      const get = (t) => (p.find((x) => x.type === t) || {}).value;
      return { year: +get("relatedYear"), month: get("month"), day: +get("day") };
    },
    /* Lunar New Year date (local Date) for a gregorian year */
    newYear(y) {
      if (cnFmt) {
        for (let d = new Date(Date.UTC(y, 0, 19, 12)); d.getUTCMonth() < 2; d.setUTCDate(d.getUTCDate() + 1)) {
          const p = this.parts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
          if (p.month === "1" && p.day === 1) return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        }
      }
      return this.liChun(y);
    },
    /* Start of Spring 立春: sun at 315° — the boundary used by the Four Pillars */
    liChun(y) {
      let t = Date.UTC(y, 1, 1);
      while (MA.mod(MA.astro.sunLon(new Date(t)) - 315, 360) > 180) t += 3600e3;
      return new Date(t);
    },
    /* animal year by Lunar New Year (popular reckoning) */
    lunarYear(date) {
      const y = date.getFullYear();
      if (cnFmt) {
        const p = this.parts(y, date.getMonth() + 1, date.getDate());
        if (p && p.year) return p.year;
      }
      return date < this.liChun(y) ? y - 1 : y;
    },
    stemBranch(i60) {
      const s = MA.mod(i60, 10), b = MA.mod(i60, 12);
      return { s, b, stem: MA.CN.stems[s], branch: MA.CN.animals[b] };
    },
    yearPillar(y) { return { s: MA.mod(y - 4, 10), b: MA.mod(y - 4, 12) }; },
    yearName(y) {
      const { s, b } = this.yearPillar(y);
      const st = MA.CN.stems[s];
      return { ...this.yearPillar(y), el: st.el, yang: st.yang, animal: MA.CN.animals[b], zh: st.zh + MA.CN.animals[b].branch,
        label: `${st.yang ? "Yang" : "Yin"} ${st.el} ${MA.CN.animals[b].name}`, py: `${STEMS_PY[s]}-${MA.CN.animals[b].py}` };
    },
    /* Four Pillars (BaZi). Solar-term months, day pillar from a known jia-zi day (1949-10-01). */
    pillars(date, hasTime) {
      const lam = MA.astro.sunLon(date);
      const y = date.getFullYear();
      const solarYear = date < this.liChun(y) ? y - 1 : y;
      const yp = this.yearPillar(solarYear);
      const mIdx = Math.floor(MA.mod(lam - 315, 360) / 30);            // 0 = Yin (Tiger) month
      const mp = { s: MA.mod((yp.s % 5) * 2 + 2 + mIdx, 10), b: MA.mod(2 + mIdx, 12) };
      const days = Math.round((Date.UTC(y, date.getMonth(), date.getDate()) - Date.UTC(1949, 9, 1)) / 86400000);
      const dp = { s: MA.mod(days, 10), b: MA.mod(days, 12) };
      const out = [
        { key: "Year", ...yp }, { key: "Month", ...mp }, { key: "Day", ...dp },
      ];
      if (hasTime) {
        const hb = Math.floor((date.getHours() + 1) / 2) % 12;
        out.push({ key: "Hour", s: MA.mod((dp.s % 5) * 2 + hb, 10), b: hb });
      }
      return { pillars: out, solarYear };
    },
    relation(a, b) {                  // element a -> element b
      const o = MA.CN.order, i = o.indexOf(a), j = o.indexOf(b);
      if (i === j) return "same";
      if (MA.mod(i + 1, 5) === j) return "generates";
      if (MA.mod(i + 2, 5) === j) return "controls";
      if (MA.mod(j + 1, 5) === i) return "generatedBy";
      return "controlledBy";
    },
    kua(year, gender) {
      let d = MA.digitSum(year % 100); while (d > 9) d = MA.digitSum(d);
      const r = (n) => { n = MA.mod(n, 9) || 9; return n; };
      const male = year < 2000 ? r(10 - d) : r(9 - d);
      const female = year < 2000 ? r(5 + d) : r(6 + d);
      const fix = (k, g) => (k === 5 ? (g === "m" ? 2 : 8) : k);
      if (gender === "male") return [fix(male, "m")];
      if (gender === "female") return [fix(female, "f")];
      return [fix(male, "m"), fix(female, "f")];
    },
  };

  /* ---------------------------------------------------------------- profile */
  const DEMO = { name: "Akira Kurusu", birth: "1999-07-21", time: "08:30", gender: "male", place: "Tokyo" };

  MA.profile = {
    data: MA.store.get("profile", null),
    get() { return this.data; },
    set(p) {
      this.data = p;
      p ? MA.store.set("profile", p) : MA.store.del("profile");
      this._d = null;
      MA.emit("profile", p);
    },
    demo() { this.set({ ...DEMO }); },
    birthDate() {
      const p = this.data;
      if (!p || !p.birth) return null;
      const [y, m, d] = p.birth.split("-").map(Number);
      const [hh, mm] = (p.time || "12:00").split(":").map(Number);
      return new Date(y, m - 1, d, hh, mm);
    },
    /* everything derived from the birth data, cached */
    derived() {
      if (this._d) return this._d;
      const p = this.data, date = this.birthDate();
      if (!date || isNaN(date)) return null;
      const sunLon = MA.astro.sunLon(date);
      const moon = MA.astro.moon(date);
      const sun = MA.astro.signAt(sunLon), moonSign = MA.astro.signAt(moon.lon);
      let moonUnsure = false;
      if (!p.time) {
        const a = new Date(date); a.setHours(0, 0); const b = new Date(date); b.setHours(23, 59);
        moonUnsure = MA.astro.signAt(MA.astro.moon(a).lon) !== MA.astro.signAt(MA.astro.moon(b).lon);
      }
      const lunarYear = MA.cn.lunarYear(date);
      const year = MA.cn.yearName(lunarYear);
      const bazi = MA.cn.pillars(date, !!p.time);
      const now = new Date();
      let age = now.getFullYear() - date.getFullYear();
      if (now < new Date(now.getFullYear(), date.getMonth(), date.getDate())) age--;
      this._d = { date, sunLon, moon, sun, moonSign, moonUnsure, lunarYear, year, bazi, age,
        first: (p.name || "").trim().split(/\s+/)[0] || "Traveller",
        seed: `${p.name}|${p.birth}|${p.time}` };
      return this._d;
    },
  };
})(window.MA);
