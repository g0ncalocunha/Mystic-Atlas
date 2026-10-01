window.MA = window.MA || {};

/* Procedural ink-wash (水墨) landscapes for the murim sects of the Cultivation theme.
   MA.landscape(id, { thumb }) returns an <svg> string; thumbs skip the expensive filters. */
(function (MA) {
  "use strict";
  const W = 1600, H = 900;
  const f = (n) => n.toFixed(1);

  /* ---------------------------------------------------------- terrain */
  // A ridge is the upper envelope of peaks; shape "spire" = sharp concave flanks, "bell" = rounded hills.
  function ridge(r, o) {
    const peaks = (o.at || []).slice();
    for (let i = 0; i < o.n; i++) peaks.push([o.x0 + r() * (o.x1 - o.x0), o.hMin + r() * (o.hMax - o.hMin), o.wMin + r() * (o.wMax - o.wMin)]);
    const pts = [];
    let jit = 0;
    for (let x = o.x0; x <= o.x1; x += 5) {
      let y = 0;
      for (const [px, ph, pw] of peaks) {
        const t = Math.abs(x - px) / pw;
        if (t >= 1) continue;
        const v = o.shape === "bell" ? ph * (Math.cos(t * Math.PI) + 1) / 2 : ph * Math.pow(1 - t, o.k || 1.4);
        if (v > y) y = v;
      }
      jit = jit * 0.75 + (r() - 0.5) * (o.jag ?? 5);
      pts.push([x, o.base - y + jit]);
    }
    return { pts, peaks };
  }
  const topOf = (pts, x) => pts.reduce((b, p) => (Math.abs(p[0] - x) < Math.abs(b[0] - x) ? p : b))[1];
  const pathOf = (pts, bottom = H + 20) => `M${pts[0][0]} ${bottom}` + pts.map((p) => `L${f(p[0])} ${f(p[1])}`).join("") + `L${pts[pts.length - 1][0]} ${bottom}Z`;
  const lineOf = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join("");

  function layer(g, pts, o) {
    // ink body, darker brushed ridge line, then mist rising from below to wash out the foot of the mountains
    g.push(`<path d="${pathOf(pts)}" fill="${o.fill || o.ink}" fill-opacity="${o.a}" ${o.filter}/>`);
    g.push(`<path d="${lineOf(pts)}" fill="none" stroke="${o.ink}" stroke-opacity="${Math.min(1, o.a * 1.5)}" stroke-width="${o.sw || 2.5}"
      stroke-dasharray="60 5 22 7 90 4" stroke-linecap="round" ${o.filter}/>`);
    if (o.mist !== false) {
      const top = Math.min(...pts.map((p) => p[1]));
      const y0 = o.mistTop ?? top + (o.base - top) * 0.35;
      g.push(`<rect x="-20" y="${f(y0)}" width="${W + 40}" height="${f(H - y0 + 20)}" fill="url(#mist)" />`);
      o.mistRect = y0;
    }
  }

  /* ---------------------------------------------------------- props (all ink silhouettes) */
  const eave = (w, y, h) => `M${-w * 0.55} ${y}L${w * 0.55} ${y}Q${w * 0.82} ${y + h * 0.55} ${w} ${y + h * 0.45}Q${w * 0.62} ${y + h} 0 ${y + h}Q${-w * 0.62} ${y + h} ${-w} ${y + h * 0.45}Q${-w * 0.82} ${y + h * 0.55} ${-w * 0.55} ${y}Z`;
  function hall(x, y, s, ink, roof) {
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-30" y="-24" width="60" height="24" fill="${ink}"/>
      <path d="${eave(50, -40, 18)}" fill="${roof || ink}"/><rect x="-20" y="-50" width="40" height="11" fill="${ink}"/>
      <path d="${eave(34, -64, 15)}" fill="${roof || ink}"/><rect x="-1.5" y="-72" width="3" height="9" fill="${ink}"/></g>`;
  }
  function pagoda(x, y, s, ink, tiers = 7) {
    let g = "", yy = 0;
    for (let i = 0; i < tiers; i++) {
      const w = 26 - i * 2.6;
      g += `<rect x="${f(-w * 0.55)}" y="${f(yy - 12)}" width="${f(w * 1.1)}" height="12" fill="${ink}"/><path d="${eave(w, yy - 18, 7)}" fill="${ink}"/>`;
      yy -= 18;
    }
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">${g}<rect x="-1.5" y="${yy - 16}" width="3" height="16" fill="${ink}"/></g>`;
  }
  function pine(x, y, s, ink, r) {
    // gnarled trunk with flat needle clusters, drawn as fans of short strokes over a pale wash
    const lean = (r() - 0.5) * 40, top = [lean, -150];
    let g = `<path d="M-6 0 C0 -50 ${f(lean * 0.2 - 12)} -80 ${f(lean * 0.5)} -110 S${f(lean)} -140 ${f(top[0])} ${f(top[1])}" stroke="${ink}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 5; i++) {
      const t = i / 4, side = i % 2 ? 1 : -1;
      const bx = lean * t * 0.9, by = -55 - t * 95;
      const px = bx + side * (26 + r() * 22) * (1 - t * 0.4), py = by - 6;
      g += `<path d="M${f(bx)} ${f(by)} Q${f((bx + px) / 2)} ${f(by - 10)} ${f(px)} ${f(py)}" stroke="${ink}" stroke-width="3.5" fill="none"/>`;
      const rw = 40 - t * 14;
      g += `<ellipse cx="${f(px)}" cy="${f(py - 3)}" rx="${f(rw)}" ry="${f(rw * 0.28)}" fill="${ink}" fill-opacity=".22"/>`;
      for (let k = 0; k < 4; k++) {
        const cx = px + (k - 1.5) * rw * 0.42, cy = py - 2 + (r() - 0.5) * 4;
        for (let n = 0; n < 9; n++) {
          const ang = Math.PI * (1.05 + n * 0.1), len = 9 + r() * 6;
          g += `<path d="M${f(cx)} ${f(cy)}l${f(Math.cos(ang) * len)} ${f(Math.sin(ang) * len * 0.75)}" stroke="${ink}" stroke-width="1.4"/>`;
        }
      }
    }
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})" stroke-linecap="round">${g}</g>`;
  }
  function bamboo(x, y, h, ink, r, lean = 0) {
    let g = "", yy = y;
    const seg = 34 + r() * 14, w = 6 + r() * 3;
    let i = 0;
    while (yy > y - h) {
      const dx = (lean * (y - yy)) / h;
      g += `<rect x="${f(x + dx - w / 2)}" y="${f(yy - seg + 2)}" width="${f(w)}" height="${f(seg - 4)}" rx="2" fill="${ink}"/>`;
      if (i % 2 === 1 && r() < 0.8) {
        const side = r() < 0.5 ? -1 : 1;
        for (let k = 0; k < 3; k++) {
          const ang = side * (20 + k * 18 + r() * 10);
          g += `<path d="M0 0Q14 -5 46 0Q14 4 0 0Z" fill="${ink}" transform="translate(${f(x + dx)} ${f(yy - seg)}) rotate(${f(side > 0 ? ang : 180 + ang)}) scale(${f(0.8 + r() * 0.5)})"/>`;
        }
      }
      yy -= seg; i++;
    }
    return g;
  }
  function plumBranch(x, y, s, ink, blossom, r) {
    // gnarled branch from (x, y) reaching right/up, five-petal blossoms along it
    const pts = [[0, 0]];
    let a = -0.35, px = 0, py = 0;
    for (let i = 0; i < 9; i++) { a += (r() - 0.55) * 0.5; px += Math.cos(a) * 46; py += Math.sin(a) * 46; pts.push([px, py]); }
    let g = `<path d="${lineOf(pts)}" stroke="${ink}" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    g += `<path d="${lineOf(pts.slice(0, 6))}" stroke="${ink}" stroke-width="20" fill="none" stroke-linecap="round" opacity=".85"/>`;
    let flowers = "";
    pts.forEach(([bx, by], i) => {
      if (i < 2) return;
      const tw = [[bx, by]];
      let ta = (r() < 0.5 ? -1 : 1) * (0.6 + r()), tx = bx, ty = by;
      for (let k = 0; k < 3; k++) { tx += Math.cos(ta) * 22; ty += Math.sin(ta) * 22 - 6; tw.push([tx, ty]); ta += (r() - 0.5) * 0.6; }
      g += `<path d="${lineOf(tw)}" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      [[bx, by], ...tw.slice(1)].forEach(([fx, fy]) => {
        if (r() < 0.45) return;
        const rr = 7 + r() * 5;
        let pet = "";
        for (let p = 0; p < 5; p++) { const pa = p * 1.2566 + r() * 0.2; pet += `<circle cx="${f(fx + Math.cos(pa) * rr * 0.62)}" cy="${f(fy + Math.sin(pa) * rr * 0.62)}" r="${f(rr * 0.52)}"/>`; }
        flowers += `<g fill="${blossom}" fill-opacity="${f(0.7 + r() * 0.3)}">${pet}</g><circle cx="${f(fx)}" cy="${f(fy)}" r="${f(rr * 0.22)}" fill="#5a1020"/>`;
      });
    });
    return `<g transform="translate(${x} ${y}) scale(${s})">${g}${flowers}</g>`;
  }
  function birds(x, y, n, ink, r, s = 1) {
    let g = "";
    for (let i = 0; i < n; i++) {
      const bx = x + r() * 220 * s, by = y + r() * 90 * s, w = (8 + r() * 8) * s;
      g += `<path d="M${f(bx - w)} ${f(by - w * 0.3)}Q${f(bx - w * 0.4)} ${f(by - w * 0.5)} ${f(bx)} ${f(by)}Q${f(bx + w * 0.4)} ${f(by - w * 0.5)} ${f(bx + w)} ${f(by - w * 0.35)}" stroke="${ink}" stroke-width="${f(1.6 * s)}" fill="none" stroke-linecap="round"/>`;
    }
    return g;
  }
  function crane(x, y, s, ink) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${ink}" stroke-linecap="round">
      <path d="M-60 -10Q-30 -40 0 -6Q30 -44 64 -16" stroke-width="5"/><path d="M0 -6L-6 22" stroke-width="3"/>
      <path d="M2 -4Q30 -2 56 6" stroke-width="3"/><circle cx="58" cy="6" r="3" fill="#b3241a" stroke="none"/></g>`;
  }
  function clouds(y, ink, r, n = 7, paper = "#f4ecdc") {
    let g = "";
    for (let i = 0; i < n; i++) {
      const cx = -100 + (i + r() * 0.6) * (W + 200) / n, cy = y + (r() - 0.5) * 40, rw = 120 + r() * 120;
      g += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rw)}" ry="${f(26 + r() * 22)}" fill="${paper}"/>`;
      g += `<path d="M${f(cx - rw * 0.7)} ${f(cy - 4)}q${f(rw * 0.2)} -24 ${f(rw * 0.4)} -6q${f(rw * 0.2)} -30 ${f(rw * 0.45)} -4q${f(rw * 0.2)} -20 ${f(rw * 0.35)} 4" fill="none" stroke="${ink}" stroke-opacity=".35" stroke-width="2"/>`;
    }
    return g;
  }
  function house(x, y, s, ink) {
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-22" y="-18" width="44" height="18" fill="${ink}"/><path d="${eave(34, -32, 15)}" fill="${ink}"/></g>`;
  }

  /* ---------------------------------------------------------- sect scenes */
  const SCENES = {
    hua(g, r, c) {          // 華山: knife-edge granite spires, red sun, plum blossoms
      g.push(`<circle cx="1180" cy="210" r="70" fill="#c8402f" fill-opacity=".75"/>`);
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 560, n: 9, hMin: 120, hMax: 300, wMin: 70, wMax: 140, k: 1.7, jag: 6 }).pts, { ...c, a: 0.22, base: 560 });
      const mid = ridge(r, { x0: -60, x1: 1660, base: 740, n: 6, hMin: 220, hMax: 470, wMin: 60, wMax: 120, k: 1.9, jag: 8, at: [[1020, 560, 110]] });
      layer(g, mid.pts, { ...c, a: 0.55, base: 740 });
      g.push(hall(1020, topOf(mid.pts, 1020) + 6, 0.55, c.ink));
      g.push(`<path d="M840 ${f(topOf(mid.pts, 840) + 60)} l14 120 l-6 140" stroke="#f4ecdc" stroke-width="5" stroke-opacity=".8" fill="none"/>`);
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 930, n: 7, hMin: 80, hMax: 200, wMin: 120, wMax: 220, k: 1.3 }).pts, { ...c, a: 0.85, base: 930, mist: false });
      g.push(birds(380, 160, 6, c.ink, r));
      g.push(plumBranch(-30, 250, 1.25, c.ink, "#d6475f", r));
      g.push(`<g transform="translate(1660 120) scale(-1 1)">${plumBranch(0, 0, 0.9, c.ink, "#e0607a", r)}</g>`);
    },
    shaolin(g, r, c) {      // 少林寺: rounded Mount Song, temple halls, pagoda forest, pines
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 560, n: 8, hMin: 120, hMax: 230, wMin: 180, wMax: 320, shape: "bell", jag: 3 }).pts, { ...c, a: 0.2, base: 560 });
      const mid = ridge(r, { x0: -60, x1: 1660, base: 700, n: 6, hMin: 120, hMax: 260, wMin: 200, wMax: 340, shape: "bell", jag: 3 });
      layer(g, mid.pts, { ...c, a: 0.45, base: 700 });
      g.push(hall(800, 690, 1.6, c.ink), hall(610, 700, 1.0, c.ink), hall(990, 700, 1.0, c.ink));
      g.push(`<rect x="560" y="690" width="480" height="14" fill="${c.ink}" fill-opacity=".8"/>`);
      g.push(`<rect x="-20" y="700" width="${W + 40}" height="220" fill="url(#mist)"/>`);
      for (let i = 0; i < 9; i++) g.push(pagoda(80 + i * 46 + r() * 20, 860 + r() * 20, 0.7 + r() * 0.5, c.ink, 3 + Math.floor(r() * 5)));
      g.push(pagoda(1380, 870, 1.6, c.ink, 9));
      g.push(pine(1180, 900, 1.6, c.ink, r), pine(1520, 900, 1.9, c.ink, r), pine(520, 900, 1.2, c.ink, r));
      g.push(birds(1000, 150, 5, c.ink, r));
    },
    wudang(g, r, c) {       // 武當: misty Taoist peaks, golden summit temple, cranes
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 520, n: 10, hMin: 120, hMax: 280, wMin: 90, wMax: 170, k: 1.25 }).pts, { ...c, a: 0.18, base: 520 });
      const mid = ridge(r, { x0: -60, x1: 1660, base: 700, n: 7, hMin: 160, hMax: 340, wMin: 90, wMax: 180, k: 1.35, at: [[760, 520, 170]] });
      layer(g, mid.pts, { ...c, a: 0.42, base: 700 });
      g.push(hall(760, topOf(mid.pts, 760) + 8, 0.75, c.ink, "#b8902f"));
      g.push(clouds(640, c.ink, r, 6, c.paper));
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 920, n: 6, hMin: 120, hMax: 260, wMin: 120, wMax: 220, k: 1.3 }).pts, { ...c, a: 0.8, base: 920, mist: false });
      g.push(pine(140, 880, 1.6, c.ink, r), pine(1450, 860, 1.4, c.ink, r));
      g.push(crane(420, 230, 0.9, c.ink), crane(560, 300, 0.6, c.ink), crane(1240, 180, 0.7, c.ink));
    },
    emei(g, r, c) {         // 峨嵋: golden summit above a sea of clouds, Buddha's light halo
      g.push(`<circle cx="1050" cy="250" r="120" fill="none" stroke="#d9a74a" stroke-opacity=".35" stroke-width="14"/><circle cx="1050" cy="250" r="100" fill="none" stroke="#9fb6c9" stroke-opacity=".3" stroke-width="10"/>`);
      const mid = ridge(r, { x0: -60, x1: 1660, base: 620, n: 6, hMin: 140, hMax: 260, wMin: 140, wMax: 240, k: 1.15, at: [[1050, 380, 300]] });
      layer(g, mid.pts, { ...c, a: 0.5, base: 620 });
      g.push(hall(1050, topOf(mid.pts, 1050) + 4, 0.8, c.ink, "#b8902f"));
      g.push(`<rect x="1043" y="${f(topOf(mid.pts, 1050) - 80)}" width="14" height="30" fill="#b8902f"/>`);
      g.push(clouds(600, c.ink, r, 8, c.paper), clouds(680, c.ink, r, 7, c.paper));
      g.push(`<rect x="-20" y="640" width="${W + 40}" height="300" fill="${c.paper}" fill-opacity=".9"/>`);
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 960, n: 5, hMin: 100, hMax: 220, wMin: 160, wMax: 260, k: 1.2 }).pts, { ...c, a: 0.75, base: 960, mist: false });
      g.push(pine(230, 900, 1.5, c.ink, r));
      g.push(birds(300, 200, 4, c.ink, r));
    },
    kunlun(g, r, c) {       // 崑崙: snow-capped ranges at the roof of the world
      g.push(`<circle cx="380" cy="190" r="56" fill="#dfe8f0"/>`);
      const far = ridge(r, { x0: -60, x1: 1660, base: 600, n: 9, hMin: 200, hMax: 380, wMin: 120, wMax: 220, k: 1.1, jag: 9 });
      layer(g, far.pts, { ...c, a: 0.28, base: 600 });
      const mid = ridge(r, { x0: -60, x1: 1660, base: 760, n: 7, hMin: 220, hMax: 420, wMin: 120, wMax: 220, k: 1.15, jag: 9 });
      layer(g, mid.pts, { ...c, a: 0.6, base: 760, mist: false });
      // snow: the same ridge again, white at the summits and melting into the rock below
      const snowTop = Math.min(...mid.pts.map((p) => p[1]));
      g.push(`<linearGradient id="snow" gradientUnits="userSpaceOnUse" x1="0" y1="${f(snowTop)}" x2="0" y2="${f(snowTop + 200)}">
          <stop offset="0" stop-color="#fbfdff"/><stop offset=".45" stop-color="#f4f8fb" stop-opacity=".9"/><stop offset="1" stop-color="#f4f8fb" stop-opacity="0"/></linearGradient>
        <path d="${pathOf(mid.pts.map(([x, y]) => [x, y + 3]))}" fill="url(#snow)" ${c.filter}/>
        <rect x="-20" y="${f(snowTop + 150)}" width="${W + 40}" height="400" fill="url(#mist)"/>`);
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 940, n: 6, hMin: 100, hMax: 240, wMin: 140, wMax: 240, k: 1.2 }).pts, { ...c, a: 0.75, base: 940, mist: false });
      g.push(hall(1300, 880, 0.9, c.ink), pine(1460, 900, 1.4, c.ink, r));
    },
    tang(g, r, c) {         // 唐門: Sichuan hills, clan manor walls, dense bamboo
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 560, n: 8, hMin: 110, hMax: 220, wMin: 160, wMax: 260, shape: "bell", jag: 3 }).pts, { ...c, a: 0.22, base: 560 });
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 700, n: 6, hMin: 90, hMax: 200, wMin: 180, wMax: 280, shape: "bell", jag: 3 }).pts, { ...c, a: 0.4, base: 700 });
      g.push(`<rect x="420" y="700" width="760" height="40" fill="${c.ink}" fill-opacity=".75"/><path d="${eave(400, 684, 22)}" transform="translate(800 0)" fill="${c.ink}" fill-opacity=".85"/>`);
      g.push(hall(800, 690, 1.2, c.ink), hall(560, 692, 0.8, c.ink), hall(1040, 692, 0.8, c.ink));
      g.push(`<rect x="-20" y="720" width="${W + 40}" height="200" fill="url(#mist)"/>`);
      for (let i = 0; i < 9; i++) g.push(bamboo(20 + i * 38 + r() * 20, 920, 600 + r() * 300, c.ink, r, (r() - 0.3) * 60));
      for (let i = 0; i < 9; i++) g.push(bamboo(1280 + i * 38 + r() * 20, 920, 600 + r() * 300, c.ink, r, (r() - 0.7) * 60));
    },
    beggar(g, r, c) {       // 丐幫: river town, arched bridge, willows
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 560, n: 7, hMin: 80, hMax: 180, wMin: 200, wMax: 320, shape: "bell", jag: 3 }).pts, { ...c, a: 0.2, base: 560 });
      for (let i = 0; i < 14; i++) g.push(house(80 + i * 110 + r() * 40, 640 + r() * 16, 0.9 + r() * 0.5, c.ink));
      g.push(`<rect x="-20" y="630" width="${W + 40}" height="300" fill="url(#mist)"/>`);
      let water = "";
      for (let i = 0; i < 26; i++) { const y = 760 + r() * 130, x = r() * W; water += `<path d="M${f(x)} ${f(y)}h${f(40 + r() * 120)}" stroke="${c.ink}" stroke-opacity=".25" stroke-width="2"/>`; }
      g.push(water);
      g.push(`<path d="M520 780 Q800 560 1080 780" stroke="${c.ink}" stroke-width="18" fill="none"/><path d="M500 780 Q800 590 1100 780" stroke="${c.ink}" stroke-width="5" fill="none"/>
        <path d="M520 780 Q800 1000 1080 780" stroke="${c.ink}" stroke-opacity=".15" stroke-width="16" fill="none"/>`);
      for (let k = 0; k < 2; k++) {
        const wx = k ? 1420 : 180;
        let wl = `<path d="M${wx} 900 C${wx + 10} 700 ${wx - 10} 520 ${wx + 20} 360" stroke="${c.ink}" stroke-width="16" fill="none"/>`;
        for (let i = 0; i < 26; i++) { const sx = wx - 160 + r() * 340, sy = 330 + r() * 120; wl += `<path d="M${f(sx)} ${f(sy)}q${f((r() - 0.5) * 30)} 120 ${f((r() - 0.5) * 40)} ${f(220 + r() * 160)}" stroke="${c.ink}" stroke-opacity=".7" stroke-width="2" fill="none"/>`; }
        g.push(wl);
      }
      g.push(`<g transform="translate(1180 800)"><ellipse cx="0" cy="0" rx="14" ry="18" fill="#9b6b2c"/><ellipse cx="0" cy="-22" rx="9" ry="10" fill="#9b6b2c"/></g>`);
      g.push(birds(900, 220, 5, c.ink, r));
    },
    demon(g, r, c) {        // 天魔神教: Ten Thousand Mountains under a blood moon
      g.push(`<circle cx="1000" cy="300" r="190" fill="#9e1b1b" fill-opacity=".85"/><circle cx="1000" cy="300" r="240" fill="#9e1b1b" fill-opacity=".12"/>`);
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 580, n: 12, hMin: 160, hMax: 340, wMin: 50, wMax: 110, k: 1.9, jag: 10 }).pts, { ...c, a: 0.4, base: 580 });
      const mid = ridge(r, { x0: -60, x1: 1660, base: 760, n: 9, hMin: 200, hMax: 400, wMin: 50, wMax: 110, k: 2.0, jag: 12, at: [[620, 470, 120]] });
      layer(g, mid.pts, { ...c, a: 0.75, base: 760 });
      const t = topOf(mid.pts, 620);
      g.push(hall(620, t + 10, 0.9, c.ink), hall(570, t + 40, 0.5, c.ink), hall(672, t + 40, 0.5, c.ink));
      g.push(`<linearGradient id="redmist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9e1b1b" stop-opacity="0"/>
        <stop offset=".5" stop-color="#9e1b1b" stop-opacity=".18"/><stop offset="1" stop-color="#9e1b1b" stop-opacity="0"/></linearGradient>
        <rect x="-20" y="560" width="${W + 40}" height="240" fill="url(#redmist)"/>`);
      layer(g, ridge(r, { x0: -60, x1: 1660, base: 940, n: 9, hMin: 120, hMax: 260, wMin: 60, wMax: 140, k: 1.8, jag: 10 }).pts, { ...c, a: 0.95, base: 940, mist: false });
      g.push(birds(1100, 360, 9, c.ink, r, 1.2));
    },
  };

  MA.landscape = function (id, opt = {}) {
    const sect = (MA.SECTS || []).find((s) => s.id === id) || MA.SECTS[0];
    const r = MA.rng("ls-" + sect.id);
    const thumb = !!opt.thumb;
    const c = { ink: sect.ink, paper: sect.paper, filter: thumb ? "" : 'filter="url(#lsRough)"' };
    const g = [];
    SCENES[sect.id](g, r, c);
    const defs = `<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sect.paper}" stop-opacity="0"/>
        <stop offset=".55" stop-color="${sect.paper}" stop-opacity=".92"/><stop offset="1" stop-color="${sect.paper}"/></linearGradient>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sect.sky || sect.paper}"/><stop offset="1" stop-color="${sect.paper}"/></linearGradient>
      ${thumb ? "" : `<filter id="lsRough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".018 .03" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="12"/></filter>
      <filter id="lsPaper"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="9"/><feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 .09"/></feComponentTransfer></filter>`}`;
    // thumbnails share one document, so give their ids a unique prefix
    let body = `<defs>${defs}</defs><rect width="${W}" height="${H}" fill="url(#sky)"/>${g.join("")}${thumb ? "" : `<rect width="${W}" height="${H}" filter="url(#lsPaper)"/>`}`;
    if (thumb) body = body.replace(/id="(mist|sky|snow|redmist)"/g, `id="$1-${sect.id}"`).replace(/url\(#(mist|sky|snow|redmist)\)/g, `url(#$1-${sect.id})`);
    return `<svg class="landscape" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${body}</svg>`;
  };
})(window.MA);
