window.MA = window.MA || {};
MA.views = MA.views || {};

(function (MA) {
  "use strict";
  const { $, $$, esc } = MA;
  const CN = MA.CN, A = CN.animals, EL = CN.elements;

  let root, theme = "imperial", sel = null;          // sel = animal index shown in the detail card

  const DAY_MASTER = [
    "a tall tree: upright, principled and always growing toward the light",
    "a climbing vine or flower: graceful, adaptable and quietly persistent",
    "the sun: generous, warm and impossible to ignore",
    "a candle flame: perceptive, gentle and illuminating in the dark",
    "a mountain: steady, trustworthy and protective",
    "fertile soil: nurturing, practical and full of potential",
    "raw iron or an axe: decisive, loyal and unafraid of hard work",
    "a polished jewel: refined, sharp-minded and quietly proud",
    "the ocean: vast, free-flowing and full of ideas",
    "rain and morning dew: intuitive, gentle and nourishing",
  ];
  const REMEDY = {
    Wood: "add plants, greens and the East; morning walks", Fire: "add reds, candlelight, the South; laugh more",
    Earth: "add ochres, ceramics, the Centre; regular meals", Metal: "add whites, golds, the West; declutter",
    Water: "add blues and blacks, the North; rest and reflection",
  };
  const REL_TEXT = {
    generates: "nourishes", controls: "restrains", generatedBy: "is nourished by", controlledBy: "is restrained by", same: "mirrors",
  };

  /* ------------------------------------------------------------ emblems */
  function iconG(id, x, y, s, extra = "") {
    const paths = (MA.ICONS[id] || []).map((d) => `<path d="${d}"/>`).join("");
    return `<g transform="translate(${x} ${y}) scale(${s / 512})" ${extra}>${paths}</g>`;
  }

  function emblem(i, cls = "") {
    const a = A[i], uid = "e" + i + cls.replace(/\W/g, "");
    const ovr = MA.OVERRIDES && MA.OVERRIDES[`${theme}/${a.id}`];
    if (ovr) return `<span class="emblem ${cls}"><img src="assets/overrides/${esc(ovr)}" alt="${a.name}"></span>`;
    let svg;
    if (theme === "jca") {
      svg = `<defs><radialGradient id="${uid}s" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#cfd3c4"/><stop offset=".55" stop-color="#8f9686"/><stop offset="1" stop-color="#4b5148"/></radialGradient>
        <radialGradient id="${uid}i" cx="60%" cy="65%" r="70%"><stop offset="0" stop-color="#a8ae9c"/><stop offset="1" stop-color="#6c7365"/></radialGradient></defs>
        <circle cx="100" cy="104" r="92" fill="#2b2f29" opacity=".45"/>
        <circle cx="100" cy="100" r="92" fill="url(#${uid}s)" stroke="#3a3f37" stroke-width="3"/>
        <circle cx="100" cy="100" r="74" fill="url(#${uid}i)" stroke="#5c6357" stroke-width="2"/>
        <circle cx="100" cy="100" r="80" fill="none" stroke="#b8bdae" stroke-width="1.5" stroke-dasharray="3 5" opacity=".7"/>
        ${iconG(a.id, 42, 44, 116, `fill="#e4e8da" opacity=".8"`)}
        ${iconG(a.id, 40, 42, 116, `fill="#3d4339"`)}
        <path d="M30 70 A80 80 0 0 1 80 25" stroke="#fff" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>`;
    } else if (theme === "cultivation") {
      svg = inkEmblem(a, uid, i);
    } else {
      svg = paperCut(a, uid);
    }
    return `<svg class="emblem ${cls}" viewBox="0 0 200 200" role="img" aria-label="${a.name}">${svg}</svg>`;
  }

  /* 剪纸 paper-cut: red paper with a sawtooth rim, crescent cuts and an outlined animal on cream */
  function paperCut(a, uid) {
    const icon = (MA.ICONS[a.id] || []).map((d) => `<path d="${d}"/>`).join("");
    let saw = "";
    for (let k = 0; k < 96; k++) {
      const r = k % 2 ? 90 : 96, ang = (k * Math.PI) / 48;
      saw += `${k ? "L" : "M"}${(100 + Math.cos(ang) * r).toFixed(1)} ${(100 + Math.sin(ang) * r).toFixed(1)}`;
    }
    let moons = "";
    for (let k = 0; k < 16; k++) {
      const ang = (k * Math.PI) / 8, x = 100 + Math.cos(ang) * 81, y = 100 + Math.sin(ang) * 81;
      moons += `<path d="M${x - 5} ${y}Q${x} ${y - 7} ${x + 5} ${y}Q${x} ${y - 3} ${x - 5} ${y}Z" transform="rotate(${k * 22.5 + 90} ${x} ${y})" fill="#000"/>`;
    }
    return `<defs><pattern id="${uid}c" width="110" height="96" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
        <path d="M10 30Q36 2 62 30Q36 16 10 30Z" fill="#000"/><path d="M65 78Q91 50 117 78Q91 64 65 78Z" fill="#000"/></pattern>
      <mask id="${uid}m" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
        <path d="${saw}Z" fill="#fff"/><circle cx="100" cy="100" r="74" fill="#000"/>${moons}
        <g transform="translate(38 36) scale(${124 / 512})"><g fill="#fff" stroke="#fff" stroke-width="22" stroke-linejoin="round">${icon}</g>
          <g fill="none" stroke="#000" stroke-width="12" stroke-linejoin="round">${icon}</g><rect width="512" height="512" fill="url(#${uid}c)"/></g>
      </mask></defs>
      <circle cx="100" cy="100" r="96" fill="#f6e6c0"/><rect width="200" height="200" fill="#b3241a" mask="url(#${uid}m)"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#e3b54a" stroke-width="2"/>
      <g transform="translate(138 138)"><rect width="34" height="34" rx="3" fill="#b3241a" stroke="#e3b54a" stroke-width="1"/>
        <text x="17" y="27" text-anchor="middle" font-size="26" fill="#f6e6c0" font-family="'Ma Shan Zheng','Noto Serif TC',serif">${a.zh}</text></g>`;
  }

  /* 水墨 ink: a tapered ensō brush circle, wet-ink animal, grey wash and a red seal */
  function enso(cx, cy, R, seed) {
    const r = MA.rng("enso" + seed), a0 = -0.95 * Math.PI + (r() - 0.5) * 0.4, a1 = a0 + 1.78 * Math.PI, N = 90, out = [], inn = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, ang = a0 + (a1 - a0) * t;
      const rad = R * (1 + 0.035 * Math.sin(t * 7 + seed)), w = 2 + 15 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.25 + 0.08)), 0.7) * (1 - 0.55 * t);
      out.push([cx + Math.cos(ang) * (rad + w / 2), cy + Math.sin(ang) * (rad + w / 2)]);
      inn.push([cx + Math.cos(ang) * (rad - w / 2), cy + Math.sin(ang) * (rad - w / 2)]);
    }
    const d = out.concat(inn.reverse()).map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("") + "Z";
    let streaks = "";
    for (let k = 0; k < 4; k++) {
      const t0 = 0.45 + k * 0.11, rr = R + (r() - 0.5) * 8, aa = a0 + (a1 - a0) * t0, ab = a0 + (a1 - a0) * (t0 + 0.22);
      streaks += `<path d="M${(cx + Math.cos(aa) * rr).toFixed(1)} ${(cy + Math.sin(aa) * rr).toFixed(1)}A${rr} ${rr} 0 0 1 ${(cx + Math.cos(ab) * rr).toFixed(1)} ${(cy + Math.sin(ab) * rr).toFixed(1)}" style="stroke:var(--paper,#f1e8d6)" stroke-width="${(0.6 + r() * 0.9).toFixed(2)}" fill="none" opacity=".8"/>`;
    }
    return `<path d="${d}" fill="#1b1a17"/>${streaks}`;
  }
  function inkEmblem(a, uid, i) {
    return `<defs><filter id="${uid}r" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="${i + 1}"/><feDisplacementMap in="SourceGraphic" scale="5"/><feGaussianBlur stdDeviation=".5"/></filter>
        <filter id="${uid}b" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
        <filter id="${uid}w" x="-40%" y="-40%" width="180%" height="180%"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="3" seed="${i * 3 + 2}"/><feDisplacementMap in="SourceGraphic" scale="40"/><feGaussianBlur stdDeviation="6"/></filter>
        <radialGradient id="${uid}g" cx="40%" cy="35%" r="80%"><stop offset="0" stop-color="#3a3733"/><stop offset="1" stop-color="#0f0e0c"/></radialGradient></defs>
      <ellipse cx="98" cy="110" rx="60" ry="46" fill="#1b1a17" opacity=".16" filter="url(#${uid}w)"/>
      <g filter="url(#${uid}b)">${enso(100, 101, 74, i)}</g>
      <g transform="translate(48 46) scale(${106 / 512})" fill="url(#${uid}g)" filter="url(#${uid}r)">${(MA.ICONS[a.id] || []).map((d) => `<path d="${d}"/>`).join("")}</g>
      <g transform="translate(146 146) rotate(-4)"><rect width="30" height="30" rx="2" style="fill:var(--sect,#b3241a)" opacity=".92"/>
        <text x="15" y="23" text-anchor="middle" font-size="22" fill="#f1e8d6" font-family="'Ma Shan Zheng','Noto Serif TC',serif">${a.zh}</text></g>`;
  }

  function taijitu(cls = "") {
    return `<svg class="taiji ${cls}" viewBox="-50 -50 100 100" aria-hidden="true"><circle r="49" fill="#f6f1e4" stroke="#111" stroke-width="1"/>
      <path d="M0-49A49 49 0 0 1 0 49A24.5 24.5 0 0 1 0 0A24.5 24.5 0 0 0 0-49Z" fill="#111"/>
      <circle cy="-24.5" r="6.5" fill="#111"/><circle cy="24.5" r="6.5" fill="#f6f1e4"/></svg>`;
  }

  /* ------------------------------------------------------------ helpers */
  function relationTo(i, j) {
    if (i === j) return "same";
    if (CN.trines.some((t) => t.includes(i) && t.includes(j))) return "trine";
    if (CN.harmony[i] === j) return "harmony";
    if (MA.mod(i + 6, 12) === j) return "clash";
    if (CN.harm[i] === j) return "harm";
    return "neutral";
  }
  const REL_LABEL = { same: "Same sign", trine: "Trine ally", harmony: "Secret friend", clash: "Clash", harm: "Harm", neutral: "Neutral" };

  function yearsOf(i) {
    const now = new Date().getFullYear(), out = [];
    for (let y = 1924; y <= now + 12; y++) if (MA.mod(y - 4, 12) === i) out.push(y);
    return out.slice(-8);
  }

  function myIndex() { const d = MA.profile.derived(); return d ? d.year.b : null; }

  /* ------------------------------------------------------------ murim sect */
  function assignedSect() {
    const d = MA.profile.derived();
    if (!d) return MA.SECTS[0];
    const dm = CN.stems[d.bazi.pillars[2].s].el;
    const pool = MA.SECTS.filter((s) => s.els.includes(dm));
    return MA.pick(MA.rng("sect|" + d.seed), pool.length ? pool : MA.SECTS);
  }
  function currentSect() {
    const chosen = MA.store.get("sect", null);
    return MA.SECTS.find((s) => s.id === chosen) || assignedSect();
  }
  let paintedSect = null;
  function paintBackground() {
    const bgA = $(".z-bg-a", root), parts = $(".z-particles", root);
    if (theme !== "cultivation") { bgA.innerHTML = ""; paintedSect = null; parts.dataset.p = ""; root.style.removeProperty("--sect"); return; }
    const s = currentSect();
    root.style.setProperty("--sect", s.accent);
    root.style.setProperty("--paper", s.paper);
    parts.dataset.p = s.particle;
    if (paintedSect !== s.id) { bgA.innerHTML = MA.landscape(s.id); paintedSect = s.id; }
  }
  function sectStrip() {
    const s = currentSect(), as = assignedSect(), d = MA.profile.derived();
    const chosen = MA.store.get("sect", null) && s.id !== as.id;
    return `<div class="sect-strip">
        <div class="ss-seal">${s.seal}</div>
        <div class="ss-txt"><span class="ss-k">門派 · ${chosen ? "Sect of your choosing" : d ? "Your sect, decided by your Day Master" : "Sect"}</span>
          <b>${s.name} <span class="cz">${s.zh}</span></b><small>${esc(s.place)} — “${esc(s.motto)}”</small></div>
        <button type="button" class="ss-btn" aria-expanded="false">Change sect ▾</button>
      </div>
      <div class="sect-picker" hidden>${MA.SECTS.map((x) => `<button type="button" class="sp-card ${x.id === s.id ? "on" : ""}" data-sect="${x.id}">
          <span class="sp-thumb">${MA.landscape(x.id, { thumb: true })}</span>
          <span class="sp-name">${x.name} <span class="cz">${x.zh}</span></span>
          <span class="sp-tag">${x.id === as.id && d ? "assigned · " : ""}${x.els.join(" · ")}</span></button>`).join("")}
        ${chosen ? `<button type="button" class="sp-reset">Return to my assigned sect (${as.name})</button>` : ""}</div>`;
  }
  function bindSectStrip(box) {
    const btn = $(".ss-btn", box), picker = $(".sect-picker", box);
    if (!btn) return;
    btn.onclick = () => { picker.hidden = !picker.hidden; btn.setAttribute("aria-expanded", !picker.hidden); };
    $$(".sp-card", box).forEach((c) => (c.onclick = () => {
      const id = c.dataset.sect;
      if (id === assignedSect().id) MA.store.del("sect"); else MA.store.set("sect", id);
      const s = currentSect();
      MA.toast(`You bow before the gates of ${s.name}. ${s.zh}`);
      renderAll();
    }));
    const reset = $(".sp-reset", box);
    if (reset) reset.onclick = () => { MA.store.del("sect"); renderAll(); };
  }

  /* ------------------------------------------------------------ rendering */
  function shell() {
    root.innerHTML = `<div class="z-bg" aria-hidden="true"><div class="z-bg-a"></div><div class="z-bg-b"></div><div class="z-particles"></div></div>
      <div class="z-wrap">
        <header class="z-hero" id="zHero"></header>
        <div class="z-grid">
          <section class="z-card z-wheel-card"><h2 class="z-h" id="zWheelH"></h2><div id="zWheel"></div>
            <div class="z-legend"><span class="lg trine">Trine allies</span><span class="lg harmony">Secret friend</span><span class="lg clash">Clash</span><span class="lg harm">Harm</span></div></section>
          <section class="z-card z-detail" id="zDetail"></section>
        </div>
        <section class="z-card z-align" id="zAlign"></section>
        <section class="z-card z-extra" id="zExtra"></section>
      </div>`;
    const parts = $(".z-particles", root);
    const r = MA.rng(3);
    parts.innerHTML = Array.from({ length: 26 }, () => `<i style="left:${(r() * 100).toFixed(1)}%;--d:${(6 + r() * 10).toFixed(1)}s;--l:${(r() * -14).toFixed(1)}s;--s:${(0.5 + r()).toFixed(2)}"></i>`).join("");
  }

  function renderAll() {
    if (sel == null) sel = myIndex() ?? MA.cn.yearName(MA.cn.lunarYear(new Date())).b;
    paintBackground();
    renderHero(); renderWheel(); renderDetail(); renderAlign(); renderExtra();
  }

  function themeWord(imperial, jca, cult) { return theme === "jca" ? jca : theme === "cultivation" ? cult : imperial; }

  function renderHero() {
    const box = $("#zHero", root), d = MA.profile.derived();
    const nowYear = MA.cn.yearName(MA.cn.lunarYear(new Date()));
    if (!d) {
      box.innerHTML = `<div class="zh-art">${emblem(nowYear.b, "big")}</div>
        <div class="zh-txt"><p class="zh-kicker">${themeWord("The year of the", "Current talisman year:", "The heavens now favour the")} ${nowYear.label}</p>
        <h1>${themeWord("Find your animal", "Which talisman is yours?", "Awaken your spirit beast")}</h1>
        <p>Enter your birth date to reveal your animal, your Four Pillars and how your five elements align.</p>
        <button type="button" class="btn">Enter my data</button></div>${theme === "cultivation" ? sectStrip() : ""}`;
      $(".btn", box).onclick = MA.openProfile;
      bindSectStrip(box);
      return;
    }
    const y = d.year, a = y.animal, cny = MA.cn.newYear(d.lunarYear);
    const near = d.date.getMonth() < 2;
    const kicker = themeWord(`${esc(d.first)}, you were born in the year of the`,
      `Agent ${esc(d.first)}, your talisman is the`, `Cultivator ${esc(d.first)}, your spirit beast is the`);
    const tag = theme === "jca" ? `<p class="zh-power">Power: <b>${a.talisman.power}</b> — ${a.talisman.desc}</p>` : "";
    box.innerHTML = `<div class="zh-art">${emblem(y.b, "big hero-emblem")}</div>
      <div class="zh-txt"><p class="zh-kicker">${kicker}</p>
        <h1><span class="zh-zh">${y.zh}</span> ${y.label}</h1>
        <p class="zh-py">${y.py} · ${d.lunarYear} · ${a.zh} ${a.name}${theme === "jca" && a.talisman.alias ? ` (${a.talisman.alias} talisman)` : ""}</p>
        ${tag}<p>${esc(a.about)}</p>
        ${near ? `<p class="zh-note">Lunar New Year ${d.lunarYear} fell on ${cny.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}${MA.cn.hasIntl ? "" : " (approximate)"} — your animal follows that boundary.</p>` : ""}
      </div>${theme === "cultivation" ? sectStrip() : ""}`;
    bindSectStrip(box);
  }

  function renderWheel() {
    $("#zWheelH", root).textContent = themeWord("The Twelve Earthly Branches · 十二生肖", "The Twelve Talismans", "Wheel of the Twelve Spirit Beasts");
    const me = myIndex(), focus = sel;
    const R = 232, C = 300, P = (i, r = R) => { const ang = (i * 30 - 90) * Math.PI / 180; return [C + Math.cos(ang) * r, C + Math.sin(ang) * r]; };
    const line = (i, j, cls) => { const [x1, y1] = P(i, R - 50), [x2, y2] = P(j, R - 50); return `<line class="rl ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; };
    let rel = "";
    const tri = CN.trines.find((t) => t.includes(focus));
    rel += `<polygon class="rl trine" points="${tri.map((k) => P(k, R - 50).join(",")).join(" ")}"/>`;
    rel += line(focus, MA.mod(focus + 6, 12), "clash");
    rel += line(focus, CN.harmony[focus], "harmony");
    rel += line(focus, CN.harm[focus], "harm");
    const nodes = A.map((a, i) => {
      const [x, y] = P(i);
      const r = relationTo(focus, i);
      return `<g class="wn ${i === focus ? "focus" : ""} ${i === me ? "me" : ""} r-${r}" data-i="${i}" transform="translate(${x - 44} ${y - 44})" tabindex="0" role="button" aria-label="${a.name}">
        <circle class="wn-halo" cx="44" cy="44" r="50"/>
        <g transform="scale(.44)">${emblem(i, "node").replace("<svg", '<svg width="200" height="200"')}</g>
        <text class="wn-t" x="44" y="106" text-anchor="middle">${a.name}${i === me ? " ★" : ""}</text></g>`;
    }).join("");
    const centre = theme === "jca"
      ? `<g class="wc"><circle cx="${C}" cy="${C}" r="70" class="wc-disc"/><text x="${C}" y="${C - 6}" text-anchor="middle" class="wc-big">12</text><text x="${C}" y="${C + 22}" text-anchor="middle" class="wc-small">TALISMANS</text></g>`
      : `<g class="wc" transform="translate(${C} ${C}) scale(1.25)">${taijitu("spin").replace('viewBox="-50 -50 100 100"', 'x="-50" y="-50" width="100" height="100" viewBox="-50 -50 100 100"')}</g>`;
    $("#zWheel", root).innerHTML = `<svg class="wheel" viewBox="0 0 600 640" role="group" aria-label="Zodiac wheel">
      <circle cx="${C}" cy="${C}" r="${R}" class="wheel-ring"/><circle cx="${C}" cy="${C}" r="${R - 50}" class="wheel-ring inner"/>
      ${rel}${centre}${nodes}</svg>`;
    $$(".wn", root).forEach((n) => {
      const pick = () => { sel = +n.dataset.i; renderWheel(); renderDetail(); MA.route(A[sel].id); };
      n.addEventListener("click", pick);
      n.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
  }

  function renderDetail() {
    const a = A[sel], me = myIndex(), box = $("#zDetail", root);
    const best = [...CN.trines.find((t) => t.includes(sel)).filter((k) => k !== sel), CN.harmony[sel]];
    const names = (arr) => arr.map((k) => `<button type="button" class="chip" data-i="${k}">${A[k].zh} ${A[k].name}</button>`).join("");
    const relMe = me != null && me !== sel ? `<p class="zd-rel r-${relationTo(me, sel)}">With your ${A[me].name}: <b>${REL_LABEL[relationTo(me, sel)]}</b></p>` : "";
    const tal = a.talisman;
    const jca = theme === "jca" ? `<div class="zd-tal"><div><span class="lbl">Talisman power</span><b>${tal.power}</b><small>${tal.desc}</small></div>
      <button type="button" class="btn act" data-fx="${tal.fx}">Activate!</button></div>` : "";
    const cult = theme === "cultivation" ? `<p class="zd-cult">Spirit beast of the <b>${EL[a.el].zh} ${a.el}</b> path · guards the hours ${a.hours}</p>` : "";
    box.innerHTML = `<div class="zd-top"><div class="zd-em">${emblem(sel, "detail")}</div>
      <div><h2>${a.name} <span class="zd-zh">${a.zh}</span></h2>
      <p class="zd-sub">Branch ${a.branch} ${a.py} · fixed element ${EL[a.el].zh} ${a.el} · hours ${a.hours}</p>${relMe}</div></div>
      ${jca}${cult}
      <p>${esc(a.about)}</p>
      <div class="zd-traits">${a.traits.map((t) => `<span>${t}</span>`).join("")}</div>
      <div class="zd-cols"><div><h4>Best with</h4>${names(best)}</div><div><h4>Clashes with</h4>${names([MA.mod(sel + 6, 12)])}</div></div>
      <h4>Recent years</h4><div class="zd-years">${yearsOf(sel).map((y) => { const n = MA.cn.yearName(y); return `<span style="--c:${EL[n.el].color}"><b>${y}</b> ${n.el}</span>`; }).join("")}</div>
      <p class="zd-note">Years start at Lunar New Year (late Jan – mid Feb).</p>`;
    $$(".chip", box).forEach((c) => (c.onclick = () => { sel = +c.dataset.i; renderWheel(); renderDetail(); }));
    const act = $(".act", box);
    if (act) act.onclick = () => talismanFx(act.dataset.fx);
  }

  /* ------------------------------------------------------------ element alignment */
  function wuxingSvg(counts, dm) {
    const ang = { Fire: -90, Earth: -18, Metal: 54, Water: 126, Wood: 198 };
    const R = 120, C = 170, at = (deg, r = R) => [C + Math.cos(deg * Math.PI / 180) * r, C + Math.sin(deg * Math.PI / 180) * r];
    const P = (e, r = R) => at(ang[e], r);
    const max = Math.max(1, ...Object.values(counts));
    const rad = (e) => 22 + ((counts[e] || 0) / max) * 14;
    const order = CN.order;
    let gen = "", ctl = "";
    order.forEach((e, i) => {
      // generating: arc along the circle, trimmed so it starts and ends outside the node discs
      const n = order[(i + 1) % 5];
      const a1 = ang[e] + (rad(e) + 6) / R * 180 / Math.PI, a2 = ang[e] + 72 - (rad(n) + 8) / R * 180 / Math.PI;
      const [x1, y1] = at(a1), [x2, y2] = at(a2);
      gen += `<path class="wx-gen" d="M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}" marker-end="url(#wxArrG)"/>`;
      // controlling: chord across the star, trimmed the same way
      const m = order[(i + 2) % 5], [p1, q1] = P(e), [p2, q2] = P(m);
      const len = Math.hypot(p2 - p1, q2 - q1), ux = (p2 - p1) / len, uy = (q2 - q1) / len;
      const s0 = rad(e) + 4, s1 = rad(m) + 8;
      ctl += `<line class="wx-ctl" x1="${p1 + ux * s0}" y1="${q1 + uy * s0}" x2="${p2 - ux * s1}" y2="${q2 - uy * s1}" marker-end="url(#wxArrC)"/>`;
    });
    const nodes = order.map((e) => {
      const [x, y] = P(e), c = counts[e] || 0, r = rad(e);
      return `<g class="wx-node ${e === dm ? "dm" : ""} ${c === 0 ? "empty" : ""}" style="--c:${EL[e].color}">
        <circle cx="${x}" cy="${y}" r="${r}"/><text x="${x}" y="${y + 7}" text-anchor="middle" class="wx-zh">${EL[e].zh}</text>
        <text x="${x}" y="${y + r + 16}" text-anchor="middle" class="wx-l">${e} · ${c}</text>${e === dm ? `<text x="${x}" y="${y - r - 8}" text-anchor="middle" class="wx-you">YOU</text>` : ""}</g>`;
    }).join("");
    return `<svg class="wuxing" viewBox="0 0 340 360" role="img" aria-label="Five elements cycle">
      <defs><marker id="wxArrG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="wx-arr-g"/></marker>
      <marker id="wxArrC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" class="wx-arr-c"/></marker></defs>
      ${ctl}${gen}${nodes}</svg>`;
  }

  function renderAlign() {
    const box = $("#zAlign", root), d = MA.profile.derived();
    const title = themeWord("Element Alignment · 五行 · 陰陽", "Chi Alignment · Five Elements & Yin-Yang", "Dao Heart Alignment · 五行 · 陰陽");
    if (!d) {
      box.innerHTML = `<h2 class="z-h">${title}</h2><div class="za-empty">${wuxingSvg({ Wood: 1, Fire: 1, Earth: 1, Metal: 1, Water: 1 }, null)}
        <div><p>Traditional Chinese philosophy sees everything as a dance of <b>yin</b> and <b>yang</b> moving through five phases —
        Wood feeds Fire, Fire makes Earth (ash), Earth bears Metal, Metal carries Water, and Water nourishes Wood. Each also restrains another:
        Wood parts Earth, Earth dams Water, Water quenches Fire, Fire melts Metal, Metal cuts Wood.</p>
        <p>Your birth moment gives you a <b>Four Pillars</b> chart — eight characters of stems and branches — and their balance shows
        which elements you carry and which you seek.</p><button type="button" class="btn">Reveal my alignment</button></div></div>`;
      $("button", box).onclick = MA.openProfile;
      return;
    }
    const { pillars, solarYear } = d.bazi;
    const chars = [];
    pillars.forEach((p) => { chars.push({ el: CN.stems[p.s].el, yang: CN.stems[p.s].yang }); chars.push({ el: A[p.b].el, yang: p.b % 2 === 0 }); });
    const counts = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
    chars.forEach((c) => counts[c.el]++);
    const yang = chars.filter((c) => c.yang).length, yin = chars.length - yang;
    const dayStem = pillars[2].s, dm = CN.stems[dayStem].el;
    const order = CN.order, iDM = order.indexOf(dm);
    const mother = order[MA.mod(iDM - 1, 5)], child = order[(iDM + 1) % 5], wealth = order[(iDM + 2) % 5], power = order[MA.mod(iDM - 2, 5)];
    const support = counts[dm] + counts[mother];
    const strong = support > chars.length / 2;
    const fav = strong ? [child, wealth, power] : [mother, dm];
    fav.sort((a, b) => counts[a] - counts[b]);
    const missing = order.filter((e) => counts[e] === 0);
    const dominant = order.filter((e) => counts[e] === Math.max(...Object.values(counts)));

    const pillarCols = pillars.map((p) => {
      const st = CN.stems[p.s], br = A[p.b];
      return `<div class="pl"><div class="pl-k">${p.key}</div>
        <div class="pl-c" style="--c:${EL[st.el].color}">${st.zh}<small>${st.py} · ${st.yang ? "Yang" : "Yin"} ${st.el}</small></div>
        <div class="pl-c" style="--c:${EL[br.el].color}">${br.branch}<small>${br.name} · ${br.el}</small></div></div>`;
    }).join("");

    const yb = MA.cn.yearName(MA.cn.lunarYear(new Date()));
    const relYear = relationTo(d.year.b, yb.b);
    const yearMsg = {
      same: `It is your own year (本命年 · ben ming nian). Tradition says wear red and move carefully.`,
      trine: `The ${yb.animal.name} is a trine ally of the ${d.year.animal.name} — doors open easily this year.`,
      harmony: `The ${yb.animal.name} is your secret friend — expect quiet help and good partnerships.`,
      clash: `The ${yb.animal.name} clashes with the ${d.year.animal.name} (冲太岁) — a year of change; stay flexible.`,
      harm: `The ${yb.animal.name} harms the ${d.year.animal.name} — guard against small misunderstandings.`,
      neutral: `The ${yb.animal.name} is neutral to the ${d.year.animal.name} — the year is what you make of it.`,
    }[relYear];
    const ry = MA.cn.relation(yb.el, dm);
    const kua = MA.cn.kua(solarYear, MA.profile.get().gender);

    box.innerHTML = `<h2 class="z-h">${title}</h2>
      <div class="za-pillars">${pillarCols}${pillars.length < 4 ? `<div class="pl pl-missing"><div class="pl-k">Hour</div><p>Add a birth time for the hour pillar.</p></div>` : ""}</div>
      <div class="za-grid">
        <div class="za-wx">${wuxingSvg(counts, dm)}<p class="za-cap"><span class="k gen">→</span> generating cycle 相生 <span class="k ctl">⇢</span> controlling cycle 相克</p></div>
        <div class="za-read">
          <h3>Day Master · ${CN.stems[dayStem].zh} ${CN.stems[dayStem].yang ? "Yang" : "Yin"} ${dm}</h3>
          <p>Your day stem is your core self. You are ${DAY_MASTER[dayStem]}.</p>
          <ul class="za-rel">
            <li><b style="color:${EL[mother].color}">${mother}</b> ${REL_TEXT.generates} you <small>(resource)</small></li>
            <li>You nourish <b style="color:${EL[child].color}">${child}</b> <small>(expression)</small></li>
            <li>You restrain <b style="color:${EL[wealth].color}">${wealth}</b> <small>(wealth)</small></li>
            <li><b style="color:${EL[power].color}">${power}</b> restrains you <small>(discipline)</small></li>
          </ul>
          <p>Your chart is <b>${strong ? "strong" : "gentle"}</b> in ${dm} (${support} of ${chars.length} characters support it), and ${dominant.join(" & ")} ${dominant.length > 1 ? "lead" : "leads"} the mix.
          Favourable element${fav.length > 1 ? "s" : ""}: <b>${fav.slice(0, 2).join(" & ")}</b> — ${REMEDY[fav[0]]}.</p>
          ${missing.length ? `<p>Missing: <b>${missing.join(", ")}</b>. ${missing.map((m) => `For ${m}, ${REMEDY[m]}.`).join(" ")}</p>` : `<p>All five elements are present — a well-rounded chart.</p>`}
        </div>
        <div class="za-yy">
          ${taijitu("tilt")}
          <div class="yy-bar"><span class="yy-yang" style="flex-grow:${yang}">Yang ${yang}</span><span class="yy-yin" style="flex-grow:${yin}">Yin ${yin}</span></div>
          <p>${yang > yin + 1 ? "Yang-leaning: active, outward, initiating. Balance it with stillness." : yin > yang + 1 ? "Yin-leaning: receptive, inward, intuitive. Balance it with movement." : "Yin and yang are close to balanced — the middle way suits you."}</p>
          <p class="za-small">Your year ${d.year.zh}: ${d.year.yang ? "yang" : "yin"} ${d.year.el} over the ${d.year.animal.name}'s ${d.year.animal.el}
            — ${d.year.el} ${REL_TEXT[MA.cn.relation(d.year.el, d.year.animal.el)]} ${d.year.animal.el}.</p>
        </div>
      </div>
      <div class="za-foot">
        <div><h3>${yb.zh} ${yb.label} · ${yb.py}</h3><p>${yearMsg} Its ${yb.el} ${REL_TEXT[ry]} your ${dm} Day Master.</p></div>
        <div><h3>Kua number ${kua.join(" / ")}</h3>
          ${kua.map((k) => `<p>${kua.length > 1 ? `<b>Kua ${k}:</b> ` : ""}${[1, 3, 4, 9].includes(k) ? "East" : "West"} group · ${CN.kua[k].map((dir, j) => `${dir} <small>${CN.kuaNames[j]}</small>`).join(" · ")}</p>`).join("")}
          ${kua.length > 1 ? `<p class="za-small">Feng shui Kua uses a binary gender; both are shown.</p>` : ""}</div>
      </div>
      <p class="za-small">Pillars use solar-term months (sun position) and the ${solarYear} solar year starting at 立春 Start of Spring. A fun tradition, not a destiny.</p>`;
  }

  /* ------------------------------------------------------------ theme extras */
  function renderExtra() {
    const box = $("#zExtra", root), p = MA.profile.get(), d = MA.profile.derived();
    if (theme === "jca") {
      const r = MA.rng(MA.todayKey() + (d ? d.seed : ""));
      const a = d ? d.year.animal : A[sel];
      box.innerHTML = `<div class="jca-file"><div class="jf-head"><span>SECTION 13</span><span class="jf-stamp">CLASSIFIED</span></div>
        <div class="jf-body"><div class="jf-photo">${emblem(A.indexOf(a), "file")}</div>
        <dl><dt>Agent</dt><dd>${esc(p ? p.name : "Unknown civilian")}</dd>
          <dt>Origin</dt><dd>${esc(p && p.place ? p.place : "Classified")}</dd>
          <dt>Assigned talisman</dt><dd>${a.name}${a.talisman.alias ? ` (${a.talisman.alias})` : ""} — ${a.talisman.power}</dd>
          <dt>Threat level</dt><dd>${((n) => "▮".repeat(n) + "▯".repeat(5 - n))(1 + Math.floor(r() * 5))}</dd></dl></div>
        <div class="jf-uncle"><b>${esc(MA.pick(r, MA.JCA.quotes))}</b> ${esc(MA.pick(r, MA.JCA.tips))}</div>
        <button type="button" class="btn act">Activate my talisman</button></div>`;
      $(".act", box).onclick = () => talismanFx(a.talisman.fx);
    } else if (theme === "cultivation") {
      if (!d) { box.innerHTML = `<h2 class="z-h">Cultivator's Record · 修仙录</h2><p>${esc(currentSect().about)}</p><p>Enter your birth data to receive your Dao name, spiritual root and realm.</p>`; return; }
      const r = MA.rng("dao|" + d.seed);
      const [c1, m1] = MA.pick(r, MA.CULT.dao), [c2, m2] = MA.pick(r, MA.CULT.dao.filter((x) => x[0] !== c1));
      const chars = [];
      d.bazi.pillars.forEach((pl) => { chars.push(CN.stems[pl.s].el, A[pl.b].el); });
      const cnt = {}; chars.forEach((e) => (cnt[e] = (cnt[e] || 0) + 1));
      const roots = Object.keys(cnt).filter((e) => cnt[e] >= 2).sort((a, b) => cnt[b] - cnt[a]);
      const rootName = roots.length === 1 ? "Heavenly Spirit Root" : roots.length === 2 ? "Earth Spirit Root" : roots.length === 3 ? "Human Spirit Root" : "Mixed Spirit Root";
      const realmI = MA.CULT.realms.findLastIndex((x) => d.age >= x[0]);
      const realm = MA.CULT.realms[realmI], next = MA.CULT.realms[realmI + 1];
      const span = next ? next[0] - realm[0] : 20, layer = Math.min(9, 1 + Math.floor(((d.age - realm[0]) / span) * 9));
      const born = d.date, now = new Date();
      let nb = new Date(now.getFullYear(), born.getMonth(), born.getDate()); if (nb < now) nb.setFullYear(nb.getFullYear() + 1);
      const days = Math.floor((now - born) / 864e5), toTrib = Math.ceil((nb - now) / 864e5);
      const sect = currentSect();
      box.innerHTML = `<h2 class="z-h">Cultivator's Record · 修仙录</h2>
        <p class="cult-about">${esc(sect.about)}</p>
        <div class="cult-grid">
          <div class="cult-name"><span class="cn-zh">${c1}${c2}</span><span>Dao name · ${m1} ${m2}</span></div>
          <dl>
            <dt>Spiritual root</dt><dd>${rootName} <small>${(roots.length ? roots : Object.keys(cnt)).map((e) => EL[e].zh + " " + e).join(" · ")}</small></dd>
            <dt>Realm</dt><dd>${realm[1]} <span class="cz">${realm[2]}</span> · layer ${layer}${next ? ` <small>(next: ${next[1]} at ${next[0]})</small>` : ""}</dd>
            <dt>Sect</dt><dd>${sect.name} <span class="cz">${sect.zh}</span> <small>${esc(sect.place)}</small></dd>
            <dt>Secret art</dt><dd>${MA.pick(MA.rng("art|" + d.seed + sect.id), sect.arts)}</dd>
            <dt>Qi gathered</dt><dd>${days.toLocaleString()} days of breathing practice</dd>
            <dt>Next heavenly tribulation</dt><dd>${toTrib === 0 ? "Today! Brace for lightning (and cake)." : `in ${toTrib} days (your birthday)`}</dd>
          </dl></div>
        <div class="qi-bar"><span style="width:${((layer / 9) * 100).toFixed(0)}%"></span></div>`;
    } else {
      const r = MA.rng("slip|" + MA.todayKey() + (d ? d.seed : ""));
      const n = 1 + Math.floor(r() * 100), slip = MA.pick(r, MA.FORTUNE_SLIPS);
      const seal = p ? esc((p.name.trim()[0] || "?").toUpperCase()) : "福";
      box.innerHTML = `<h2 class="z-h">Fortune Sticks · 求籤</h2>
        <div class="slip-wrap"><button type="button" class="cyl" aria-label="Shake the fortune cylinder"><span class="sticks">${"<i></i>".repeat(9)}</span><span class="cyl-body">籤</span></button>
          <div class="slip hidden"><div class="slip-n">第 ${n} 籤</div><div class="slip-grade">${slip[0]}</div><b>${slip[1]}</b><p>${slip[2]}</p><div class="seal">${seal}</div></div>
          <p class="slip-hint">Hold a question in mind and shake the cylinder. One stick a day.</p></div>`;
      const cyl = $(".cyl", box), sl = $(".slip", box);
      cyl.onclick = () => { cyl.classList.add("shake"); setTimeout(() => { cyl.classList.remove("shake"); sl.classList.remove("hidden"); }, 1100); };
    }
  }

  function talismanFx(fx) {
    const el = $(".hero-emblem", root) || $(".zd-em .emblem", root);
    const targets = [$(".zd-em", root), $(".zh-art", root), $(".jf-photo", root)].filter(Boolean);
    targets.forEach((t) => { t.classList.remove("fx-" + t.dataset.fx); void t.offsetWidth; t.dataset.fx = fx; t.classList.add("fx-" + fx); setTimeout(() => t.classList.remove("fx-" + fx), 2200); });
    const msgs = { alive: "Objects stir to life!", strength: "Super strength!", balance: "Yin and yang split apart!", speed: "Zoom!",
      fire: "Dragon fire!", invisible: "Now you see me…", heal: "Wounds mend.", astral: "Spirit leaves body!", morph: "Monkey business!",
      float: "Levitation!", immortal: "Immortal — for now.", laser: "Pig-eye lasers!" };
    MA.toast(msgs[fx] || "Magic!");
    return el;
  }

  /* ------------------------------------------------------------ view api */
  MA.views.zodiac = {
    init(el) { root = el; shell(); },
    show(arg) {
      if (arg) { const i = A.findIndex((a) => a.id === arg); if (i >= 0) sel = i; }
      renderAll();
    },
    hide() {},
    setSkin(s) { theme = s; root.dataset.theme = s; if (root.querySelector("#zHero")) renderAll(); },
    onProfile() { sel = myIndex() ?? sel; renderAll(); },
  };
})(window.MA);
