window.MA = window.MA || {};
MA.views = MA.views || {};

(function (MA) {
  "use strict";
  const { $, $$, esc } = MA;
  const SKY = MA.SKY;
  const wrap = (d) => ((d + 540) % 360) - 180;          // -> [-180, 180)
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let root, canvas, ctx, W = 0, H = 0, dpr = 1;
  const cam = { x: 30, y: 0, z: 8 };
  let z0 = 8, anim = null, running = false, raf = 0;
  let selected = null, hover = null, selT = 0;
  const opts = MA.store.get("sky.opts", { lines: true, art: true, names: true });
  let shooting = null, nextShoot = 0;

  const ZOD = {}, SIGN_BY_CON = {};
  MA.SIGNS.forEach((s) => (SIGN_BY_CON[s.con] = s));
  SKY.cons.forEach((c) => { if (SIGN_BY_CON[c.id]) ZOD[c.id] = c; });

  /* ------------------------------------------------------------ prepared data */
  const COLORS = (bv) => bv < 0 ? [170, 191, 255] : bv < 0.3 ? [202, 216, 255] : bv < 0.6 ? [248, 247, 255]
    : bv < 1.0 ? [255, 238, 206] : bv < 1.4 ? [255, 214, 165] : [255, 189, 130];
  const stars = SKY.stars.map((s, i) => ({ l: s[0], b: s[1], m: s[2], c: COLORS(s[3]).join(","), ph: (i * 2.399) % 6.283 }));
  const dust = [];
  { const r = MA.rng(7); for (let i = 0; i < 2600; i++) dust.push({ l: r() * 360, b: (r() * 2 - 1) * 64, a: 0.15 + r() * 0.35 }); }
  const milky = [];
  { const r = MA.rng(11);
    SKY.milky.forEach(([l, b, g]) => { for (let k = 0; k < 5; k++) milky.push({ l: l + (r() - 0.5) * 8, b: b + (r() - 0.5) * 12, rad: 5 + r() * 9, a: 0.05 * g * (0.5 + r()), hue: r() }); }); }

  function sprite(inner, outer, size = 64) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const g = c.getContext("2d"), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    return c;
  }
  const GLOW = sprite("rgba(255,255,255,0.9)", "rgba(255,255,255,0)");
  const NEB_A = sprite("rgba(150,170,255,0.9)", "rgba(120,140,255,0)");
  const NEB_B = sprite("rgba(255,170,220,0.7)", "rgba(200,120,255,0)");
  const SUNGLOW = sprite("rgba(255,214,120,1)", "rgba(255,170,60,0)");

  const figImgs = {};
  function buildFigures() {
    MA.SIGNS.forEach((s) => {
      const paths = (MA.ICONS[s.id] || []).map((d) => `<path d="${d}"/>`).join("");
      const flip = s.fig.fx ? `transform="translate(512 0) scale(-1 1)"` : "";
      const mask = s.fig.mask ? `<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512"><rect width="512" height="512" fill="#fff"/>${
        s.fig.mask.map((m) => m.length > 4 ? `<polygon points="${m.join(" ")}" fill="#000"/>`
          : `<rect x="${m[0]}" y="${m[1]}" width="${m[2]}" height="${m[3]}" fill="#000"/>`).join("")}</mask>` : "";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e4eeff"/><stop offset="1" stop-color="#8fb0ff"/></linearGradient>${mask}</defs>
        <g fill="url(#g)" ${flip} ${mask ? 'mask="url(#m)"' : ""}>${paths}</g></svg>`;
      const custom = MA.OVERRIDES && MA.OVERRIDES["figure/" + s.id];
      const img = new Image();
      img.src = custom ? "assets/overrides/" + custom : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      figImgs[s.con] = img;
    });
  }

  /* ------------------------------------------------------------ projection */
  const sx = (l) => W / 2 - wrap(l - cam.x) * cam.z;
  const sy = (b) => H / 2 - (b - cam.y) * cam.z;
  const toWorld = (px, py) => ({ l: MA.mod(cam.x - (px - W / 2) / cam.z, 360), b: cam.y - (py - H / 2) / cam.z });
  const zMin = () => Math.max(W / 220, H / 125);
  const zMax = () => Math.max(W, H) / 9;
  function clampCam() {
    cam.z = clamp(cam.z, zMin(), zMax());
    const lim = Math.max(0, 64 - H / 2 / cam.z);
    cam.y = clamp(cam.y, -lim, lim);
    cam.x = MA.mod(cam.x, 360);
  }

  /* ------------------------------------------------------------ drawing */
  function frame(t) {
    raf = 0;
    if (!running) return;
    if (anim) stepAnim(t);
    draw(t);
    raf = requestAnimationFrame(frame);
  }

  function draw(t) {
    const z = cam.z, zf = clamp(Math.sqrt(z / z0), 0.75, 2.4);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background
    const yE = sy(0);
    const bg = ctx.createLinearGradient(0, yE - H, 0, yE + H);
    bg.addColorStop(0, "#02030a"); bg.addColorStop(0.45, "#0a1030"); bg.addColorStop(0.5, "#0d1438");
    bg.addColorStop(0.55, "#0a1030"); bg.addColorStop(1, "#02030a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // milky way
    ctx.globalCompositeOperation = "lighter";
    for (const m of milky) {
      const x = sx(m.l), y = sy(m.b), r = m.rad * z;
      if (x < -r || x > W + r || y < -r || y > H + r) continue;
      ctx.globalAlpha = m.a;
      ctx.drawImage(m.hue > 0.8 ? NEB_B : NEB_A, x - r, y - r, r * 2, r * 2);
    }
    // dust of faint stars
    ctx.fillStyle = "#cfd8ff";
    for (const d of dust) {
      const x = sx(d.l), y = sy(d.b);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      ctx.globalAlpha = d.a; ctx.fillRect(x, y, 0.8, 0.8);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // ecliptic
    ctx.save();
    ctx.strokeStyle = "rgba(255,210,120,0.22)"; ctx.setLineDash([2, 7]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, yE); ctx.lineTo(W, yE); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,210,120,0.35)"; ctx.font = "italic 12px 'Cormorant Garamond', serif";
    if (yE > 70 && yE < H - 20) ctx.fillText("ecliptic — the Sun's yearly path", 16, yE - 6);
    ctx.restore();

    // constellation art for the selected sign
    const age = selected ? (t - selT) / 1000 : 0;
    if (selected && ZOD[selected.id] && opts.art) drawFigure(ZOD[selected.id], clamp((age - 0.6) / 1.4, 0, 1));
    if (opts.art && hover && hover !== selected && ZOD[hover.id]) drawFigure(ZOD[hover.id], 0.35);

    // lines
    if (opts.lines) {
      for (const c of SKY.cons) {
        const isZ = !!ZOD[c.id], isSel = c === selected, isHov = c === hover;
        let a = isZ ? 0.3 : 0.09;
        if (isHov) a = isZ ? 0.65 : 0.35;
        if (isSel) a = 0.95;
        ctx.strokeStyle = isSel ? "rgba(180,210,255," + a + ")" : `rgba(150,180,255,${a})`;
        ctx.lineWidth = isSel ? 1.8 : isZ ? 1.1 : 0.8;
        if (isSel) { ctx.shadowColor = "rgba(140,190,255,0.9)"; ctx.shadowBlur = 10; }
        drawLines(c, isSel ? clamp(age / 1.4, 0, 1) : 1);
        ctx.shadowBlur = 0;
      }
    }

    // stars
    const tw = reduceMotion ? 0 : t / 1000;
    for (const s of stars) {
      const x = sx(s.l), y = sy(s.b);
      if (x < -8 || x > W + 8 || y < -8 || y > H + 8) continue;
      let r = clamp((6.3 - s.m) * 0.4, 0.35, 4) * zf;
      const a = s.m < 4.2 ? 0.78 + 0.22 * Math.sin(tw * (1.3 + (s.ph % 1.7)) + s.ph) : 0.75;
      if (s.m < 2.6) {
        ctx.globalAlpha = 0.35 * a;
        const g = r * 7; ctx.drawImage(GLOW, x - g / 2, y - g / 2, g, g);
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${s.c})`;
      if (r < 0.9) ctx.fillRect(x - r, y - r, r * 2, r * 2);
      else { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
    }
    ctx.globalAlpha = 1;

    // highlighted stars of the selected constellation
    if (selected && ZOD[selected.id]) drawStarHighlights(ZOD[selected.id], age);

    // labels
    if (opts.names) drawLabels();

    drawSunMoon();
    drawUserMarks();
    drawShootingStar(t);
  }

  function conOffset(c) { return wrap(c.c[0] - cam.x); }

  function drawLines(c, progress) {
    const off = conOffset(c);
    if (Math.abs(off) * cam.z > W / 2 + 60 * cam.z) return;
    const X = (l) => W / 2 - (off + (l - c.c[0])) * cam.z;
    let total = 0;
    if (progress < 1) c.l.forEach((seg) => { for (let i = 1; i < seg.length; i++) total += Math.hypot(seg[i][0] - seg[i - 1][0], seg[i][1] - seg[i - 1][1]); });
    let budget = total * progress;
    ctx.beginPath();
    for (const seg of c.l) {
      ctx.moveTo(X(seg[0][0]), sy(seg[0][1]));
      for (let i = 1; i < seg.length; i++) {
        const [l0, b0] = seg[i - 1], [l1, b1] = seg[i];
        if (progress < 1) {
          const len = Math.hypot(l1 - l0, b1 - b0);
          if (budget <= 0) break;
          if (budget < len) { const f = budget / len; ctx.lineTo(X(l0 + (l1 - l0) * f), sy(b0 + (b1 - b0) * f)); budget = 0; break; }
          budget -= len;
        }
        ctx.lineTo(X(l1), sy(b1));
      }
    }
    ctx.stroke();
  }

  function figRect(c) {
    const s = SIGN_BY_CON[c.id], f = s.fig;
    const [l0, b0, l1, b1] = c.box;
    const size = Math.max(l1 - l0, b1 - b0) * f.s * cam.z;
    const off = conOffset(c);
    const cx = W / 2 - (off + ((l0 + l1) / 2 - c.c[0])) * cam.z + (f.dx || 0) * cam.z;
    const cy = sy((b0 + b1) / 2) - (f.dy || 0) * cam.z;
    return { cx, cy, size, rot: ((f.r || 0) * Math.PI) / 180 };
  }

  function drawFigure(c, alpha) {
    const img = figImgs[c.id];
    if (!img || !img.complete || alpha <= 0) return;
    const { cx, cy, size, rot } = figRect(c);
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.globalAlpha = 0.3 * alpha;
    ctx.shadowColor = "rgba(150,190,255,0.9)"; ctx.shadowBlur = 24;
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  function drawStarHighlights(c, age) {
    const off = conOffset(c);
    const X = (l) => W / 2 - (off + (l - c.c[0])) * cam.z;
    const pulse = reduceMotion ? 1 : 0.8 + 0.2 * Math.sin(age * 3);
    ctx.font = "italic 13px 'Cormorant Garamond', serif";
    ctx.textAlign = "left";
    c.v.forEach(([l, b, m, name], i) => {
      const k = clamp((age * 1.6 - i * 0.06), 0, 1);
      if (k <= 0) return;
      const x = X(l), y = sy(b), r = clamp((6 - m) * 0.9, 1.6, 6) * (0.6 + 0.4 * k);
      ctx.globalAlpha = 0.55 * k * pulse;
      const g = r * 8; ctx.drawImage(GLOW, x - g / 2, y - g / 2, g, g);
      ctx.globalAlpha = k;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, 6.283); ctx.fill();
      if (name && m < 3.6 && k >= 1) { ctx.fillStyle = "rgba(220,232,255,0.85)"; ctx.fillText(name, x + r + 6, y - r - 2); }
    });
    ctx.globalAlpha = 1;
  }

  function drawLabels() {
    ctx.textAlign = "center";
    for (const c of SKY.cons) {
      const isZ = !!ZOD[c.id];
      const off = conOffset(c);
      const x = W / 2 - off * cam.z;
      if (x < -200 || x > W + 200) continue;
      if (isZ) {
        const s = SIGN_BY_CON[c.id];
        const y = sy(c.box[1]) + 26;
        const on = c === selected || c === hover;
        ctx.font = `${on ? 700 : 400} ${on ? 18 : 15}px Cinzel, serif`;
        ctx.fillStyle = on ? "rgba(255,226,160,0.95)" : "rgba(210,220,255,0.55)";
        ctx.fillText(`${s.glyph}  ${s.name.toUpperCase()}`, x, y);
      } else if (cam.z > z0 * 1.25 || c === hover) {
        ctx.font = "italic 12px 'Cormorant Garamond', serif";
        ctx.fillStyle = c === hover ? "rgba(200,215,255,0.8)" : "rgba(170,185,230,0.32)";
        ctx.fillText(c.name, x, sy(c.c[1]));
      }
    }
  }

  function drawSunMoon() {
    const now = new Date();
    const sl = MA.astro.sunLon(now), mo = MA.astro.moon(now), ph = MA.astro.moonPhase(now);
    // sun
    let x = sx(sl), y = sy(0);
    if (x > -60 && x < W + 60) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.9; const g = 90; ctx.drawImage(SUNGLOW, x - g / 2, y - g / 2, g, g);
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffe7a8"; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.fill();
      tag(x, y + 24, "☉ Sun today", "rgba(255,214,140,0.9)");
    }
    // moon with phase
    x = sx(mo.lon); y = sy(mo.lat);
    if (x > -40 && x < W + 40) {
      const r = 8, e = ph.elong * Math.PI / 180, waxing = ph.elong < 180, crescent = Math.cos(e) > 0;
      ctx.globalAlpha = 0.35; const g = 50; ctx.drawImage(GLOW, x - g / 2, y - g / 2, g, g); ctx.globalAlpha = 1;
      ctx.fillStyle = "#2a3150"; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#f2f0e6"; ctx.beginPath();
      ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !waxing);
      ctx.ellipse(x, y, r * Math.abs(Math.cos(e)), r, 0, Math.PI / 2, -Math.PI / 2, waxing ? crescent : !crescent);
      ctx.fill();
      tag(x, y + 24, `☽ Moon today · ${ph.name}`, "rgba(230,230,255,0.85)");
    }
  }

  function drawUserMarks() {
    const d = MA.profile.derived();
    if (!d) return;
    const mark = (l, b, label, col) => {
      const x = sx(l), y = sy(b);
      if (x < -40 || x > W + 40) return;
      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.stroke();
      tag(x, y - 16, label, col);
    };
    mark(d.sunLon, 0, `Your birth Sun`, "rgba(255,200,90,0.95)");
    mark(d.moon.lon, d.moon.lat, `Your birth Moon`, "rgba(200,210,255,0.9)");
  }

  function tag(x, y, text, col) {
    ctx.font = "600 12px 'Cormorant Garamond', serif"; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(5,8,20,0.55)";
    const w = ctx.measureText(text).width + 12;
    ctx.fillRect(x - w / 2, y - 11, w, 16);
    ctx.fillStyle = col; ctx.fillText(text, x, y + 1);
  }

  function drawShootingStar(t) {
    if (reduceMotion) return;
    if (!shooting && t > nextShoot) {
      const r = Math.random;
      shooting = { x: r() * W, y: r() * H * 0.5, vx: (r() < 0.5 ? -1 : 1) * (380 + r() * 300), vy: 160 + r() * 140, t0: t };
      nextShoot = t + 5000 + r() * 9000;
    }
    if (!shooting) return;
    const k = (t - shooting.t0) / 1000;
    if (k > 0.9) { shooting = null; return; }
    const x = shooting.x + shooting.vx * k, y = shooting.y + shooting.vy * k;
    const g = ctx.createLinearGradient(x, y, x - shooting.vx * 0.15, y - shooting.vy * 0.15);
    g.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = g; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - shooting.vx * 0.15, y - shooting.vy * 0.15); ctx.stroke();
  }

  /* ------------------------------------------------------------ camera animation */
  function flyTo(target, dur) {
    const from = { ...cam };
    const dist = Math.hypot(wrap(target.x - from.x), target.y - from.y);
    dur = dur || (reduceMotion ? 300 : clamp(900 + dist * 9, 1100, 2600));
    anim = { from, to: target, t0: performance.now(), dur, bump: clamp(dist / 160, 0, 0.55) };
  }
  function stepAnim(t) {
    const k = clamp((t - anim.t0) / anim.dur, 0, 1), e = ease(k), { from, to } = anim;
    cam.x = from.x + wrap(to.x - from.x) * e;
    cam.y = from.y + (to.y - from.y) * e;
    cam.z = Math.exp(Math.log(from.z) + (Math.log(to.z) - Math.log(from.z)) * e) * (1 - anim.bump * Math.sin(Math.PI * e));
    if (k >= 1) anim = null;
    clampCam();
  }

  function focusRect() {           // area of the canvas not covered by the info panel
    const panel = $(".sky-panel", root);
    const open = panel && panel.classList.contains("open");
    if (!open) return { x: W / 2, y: H / 2, w: W, h: H };
    if (W > 760) { const pw = panel.offsetWidth + 24; return { x: pw + (W - pw) / 2, y: H / 2, w: W - pw, h: H }; }
    const ph = panel.offsetHeight; return { x: W / 2, y: (H - ph) / 2 + 40, w: W, h: H - ph - 40 };
  }

  function select(c, fly = true) {
    selected = c;
    selT = performance.now() + (fly ? 700 : 0);
    renderPanel();
    paintRibbon();
    if (c) {
      if (fly) {
        const f = focusRect();
        const bw = c.box ? c.box[2] - c.box[0] : 20, bh = c.box ? c.box[3] - c.box[1] : 15;
        const z = clamp(Math.min((f.w * 0.62) / (bw + 10), (f.h * 0.6) / (bh + 12)), zMin(), zMax());
        const cl = c.box ? c.c[0] + wrap((c.box[0] + c.box[2]) / 2 - c.c[0]) : c.c[0];
        const cb = c.box ? (c.box[1] + c.box[3]) / 2 : c.c[1];
        flyTo({ x: cl + (f.x - W / 2) / z, y: cb + (f.y - H / 2) / z, z });
      }
      MA.route(SIGN_BY_CON[c.id] ? SIGN_BY_CON[c.id].id : c.id.toLowerCase());
    } else MA.route("");
    hideHint();
  }

  function selectSign(id) {
    const s = MA.SIGNS.find((x) => x.id === id);
    if (s) select(ZOD[s.con]);
  }

  /* ------------------------------------------------------------ hit testing */
  function hit(px, py) {
    const w = toWorld(px, py);
    let best = null, bestD = 1e9;
    for (const id in ZOD) {
      const c = ZOD[id], [l0, b0, l1, b1] = c.box;
      const lu = c.c[0] + wrap(w.l - c.c[0]), m = 3;
      if (lu >= l0 - m && lu <= l1 + m && w.b >= b0 - m && w.b <= b1 + m) {
        const d = Math.hypot(lu - (l0 + l1) / 2, w.b - (b0 + b1) / 2);
        if (d < bestD) { bestD = d; best = c; }
      }
    }
    if (best) return best;
    const tol = 14 / cam.z;
    for (const c of SKY.cons) {
      if (ZOD[c.id]) continue;
      for (const seg of c.l) for (const [l, b] of seg) {
        if (Math.abs(wrap(l - w.l)) < tol && Math.abs(b - w.b) < tol) return c;
      }
    }
    return null;
  }

  /* ------------------------------------------------------------ input */
  const pointers = new Map();
  let drag = null, vel = { x: 0, y: 0 }, inertia = 0;

  function bindInput() {
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      drag = { x: e.offsetX, y: e.offsetY, moved: 0, t: performance.now() };
      anim = null; cancelAnimationFrame(inertia); inertia = 0;
      if (pointers.size === 2) drag.pinch = pinchDist();
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) {                                      // hover
        const h = hit(e.offsetX, e.offsetY);
        if (h !== hover) { hover = h; canvas.style.cursor = h ? "pointer" : "grab"; }
        return;
      }
      const dx = e.offsetX - p.x, dy = e.offsetY - p.y;
      p.x = e.offsetX; p.y = e.offsetY;
      if (pointers.size === 2) {
        const d = pinchDist();
        if (drag.pinch) { const c = pinchCentre(); zoomAt(c.x, c.y, d / drag.pinch); }
        drag.pinch = d; drag.moved += 10;
        return;
      }
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.moved > 4) {
        canvas.style.cursor = "grabbing";
        cam.x += dx / cam.z; cam.y += dy / cam.z; clampCam();
        const now = performance.now(), dt = Math.max(8, now - drag.t);
        vel = { x: dx / dt, y: dy / dt }; drag.t = now;
        hideHint();
      }
    });
    const up = (e) => {
      const was = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (!was || !drag) return;
      if (pointers.size > 0) return;
      canvas.style.cursor = hover ? "pointer" : "grab";
      if (drag.moved <= 4) { const h = hit(e.offsetX, e.offsetY); if (h || selected) select(h); }
      else if (!reduceMotion && performance.now() - drag.t < 80) glide();
      drag = null;
    };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", () => { if (!drag) hover = null; });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      anim = null;
      zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
      hideHint();
    }, { passive: false });
    window.addEventListener("keydown", (e) => {
      if (!running || e.target.closest("input,select,textarea,dialog")) return;
      const cur = selected && SIGN_BY_CON[selected.id] ? MA.SIGNS.indexOf(SIGN_BY_CON[selected.id]) : -1;
      if (e.key === "ArrowRight") { e.preventDefault(); selectSign(MA.SIGNS[MA.mod(cur + 1, 12)].id); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); selectSign(MA.SIGNS[MA.mod(cur < 0 ? 0 : cur - 1, 12)].id); }
      else if (e.key === "Escape" && selected) select(null);
      else if (e.key === "+" || e.key === "=") zoomAt(W / 2, H / 2, 1.25);
      else if (e.key === "-") zoomAt(W / 2, H / 2, 0.8);
    });
  }
  const pinchDist = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const pinchCentre = () => { const [a, b] = [...pointers.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };

  function zoomAt(px, py, f) {
    const w = toWorld(px, py);
    const wl = cam.x + wrap(w.l - cam.x);
    cam.z = clamp(cam.z * f, zMin(), zMax());
    cam.x = wl + (px - W / 2) / cam.z;
    cam.y = w.b + (py - H / 2) / cam.z;
    clampCam();
  }
  function glide() {
    const step = () => {
      vel.x *= 0.93; vel.y *= 0.93;
      cam.x += (vel.x * 16) / cam.z; cam.y += (vel.y * 16) / cam.z; clampCam();
      inertia = Math.hypot(vel.x, vel.y) > 0.02 ? requestAnimationFrame(step) : 0;
    };
    inertia = requestAnimationFrame(step);
  }

  function resize() {
    const r = root.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    z0 = W / 110;
    clampCam();
  }

  /* ------------------------------------------------------------ html overlay */
  function shell() {
    root.innerHTML = `
      <canvas class="sky-canvas" aria-label="Star map — drag to explore, click a constellation"></canvas>
      <div class="sky-hint" id="skyHint">Drag to travel the stars · scroll or pinch to zoom · click a constellation</div>
      <div class="sky-me" id="skyMe"></div>
      <div class="sky-tools">
        <button type="button" data-opt="lines" title="Constellation lines">✦ Lines</button>
        <button type="button" data-opt="art" title="Constellation art">◈ Figures</button>
        <button type="button" data-opt="names" title="Names">Aa Names</button>
        <button type="button" data-act="out" title="Zoom out to the whole band">⤢</button>
      </div>
      <aside class="sky-panel" id="skyPanel" aria-live="polite"></aside>
      <nav class="sky-ribbon" id="skyRibbon" aria-label="Zodiac constellations">${MA.SIGNS.map((s) =>
        `<button type="button" data-sign="${s.id}" title="${s.name}">${MA.icon("g-" + s.id)}<span>${s.name}</span></button>`).join("")}</nav>`;
    canvas = $("canvas", root);
    ctx = canvas.getContext("2d");
    $$(".sky-ribbon button", root).forEach((b) => (b.onclick = () => selectSign(b.dataset.sign)));
    $$(".sky-tools [data-opt]", root).forEach((b) => {
      b.classList.toggle("on", opts[b.dataset.opt]);
      b.onclick = () => { opts[b.dataset.opt] = !opts[b.dataset.opt]; b.classList.toggle("on"); MA.store.set("sky.opts", opts); };
    });
    $(".sky-tools [data-act=out]", root).onclick = () => { select(null, false); flyTo({ x: cam.x, y: 0, z: zMin() * 1.15 }); };
    bindInput();
    new ResizeObserver(() => { if (running) resize(); }).observe(root);
  }

  function hideHint() { const h = $("#skyHint", root); if (h) h.classList.add("gone"); }

  function paintRibbon() {
    const mine = MA.profile.derived();
    $$(".sky-ribbon button", root).forEach((b) => {
      b.classList.toggle("on", !!selected && SIGN_BY_CON[selected.id] && SIGN_BY_CON[selected.id].id === b.dataset.sign);
      b.classList.toggle("mine", !!mine && mine.sun.id === b.dataset.sign);
    });
  }

  function daily(sign, dateKey) {
    const r = MA.rng(`horo|${sign.id}|${dateKey}`), H_ = MA.HORO;
    return { text: [MA.pick(r, H_.open), MA.pick(r, H_.love), MA.pick(r, H_.work), MA.pick(r, H_.well), MA.pick(r, H_.close)],
      mood: MA.pick(r, H_.moods), num: 1 + Math.floor(r() * 99), ally: MA.pick(r, MA.SIGNS.filter((s) => s !== sign)),
      stars: 2 + Math.floor(r() * 4) };
  }

  function renderPanel() {
    const panel = $("#skyPanel", root);
    if (!selected) { panel.classList.remove("open"); return; }
    const s = SIGN_BY_CON[selected.id];
    const d = MA.profile.derived();
    let html;
    if (!s) {
      const oph = selected.id === "Oph";
      html = `<button class="sp-x" type="button" aria-label="Close">×</button>
        <div class="sp-glyph small">✧</div><h2>${esc(selected.name)}</h2>
        <p class="sp-sub">${oph ? "The Serpent Bearer — the “13th sign”" : "A neighbour of the zodiac"}</p>
        <p>${oph ? "The Sun really does cross Ophiuchus every year, roughly Nov 29 – Dec 17. Astrology kept twelve equal signs, so Ophiuchus never got a horoscope — but astronomers know." :
          "This constellation lies near the Sun's path but is not one of the twelve zodiac signs. Use it as a stepping stone while you travel the sky."}</p>`;
    } else {
      const today = MA.todayKey(), h = daily(s, today);
      const mine = d && d.sun.id === s.id, moonMine = d && d.moonSign.id === s.id;
      const con = ZOD[s.con];
      const sunNow = MA.astro.signAt(MA.astro.sunLon(new Date()));
      html = `<button class="sp-x" type="button" aria-label="Close">×</button>
        <div class="sp-glyph">${MA.icon("g-" + s.id)}</div>
        <h2>${s.name}</h2>
        <p class="sp-sub">${s.symbol} · ${s.dates}</p>
        ${mine ? `<div class="sp-badge">☉ Your Sun sign, ${esc(d.first)}</div>` : ""}
        ${moonMine ? `<div class="sp-badge moon">☽ Your Moon sign</div>` : ""}
        <div class="sp-facts"><span>${s.el}</span><span>${s.mode}</span><span>Ruler · ${s.ruler}</span></div>
        <p>${esc(s.about)}</p>
        <div class="sp-chips">${s.traits.map((x) => `<span>${x}</span>`).join("")}${s.shadow.map((x) => `<span class="dim">${x}</span>`).join("")}</div>
        <h3>Today · ${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</h3>
        <p class="sp-horo">${mine ? `<b>${esc(d.first)},</b> ` : ""}${h.text.map(esc).join(" ")}</p>
        <div class="sp-lucky"><span>Mood <b>${h.mood}</b></span><span>Lucky number <b>${h.num}</b></span>
          <span>Energy <b>${"★".repeat(h.stars)}${"☆".repeat(5 - h.stars)}</b></span><span>Ally today <b>${h.ally.glyph} ${h.ally.name}</b></span></div>
        <h3>In the sky</h3>
        <p class="sp-small">Brightest star <b>${esc(con.bright[0])}</b> (mag ${con.bright[1]}). ${MA.ELEMENT_INFO[s.el]}
          ${sunNow === s ? " The Sun is in this sign right now." : ""}</p>
        <h3>Best matches</h3>
        <div class="sp-match">${s.match.map((id) => { const m = MA.SIGNS.find((x) => x.id === id); return `<button type="button" data-sign="${id}">${m.glyph} ${m.name}</button>`; }).join("")}</div>`;
    }
    panel.innerHTML = html;
    panel.classList.add("open");
    panel.scrollTop = 0;
    $(".sp-x", panel).onclick = () => select(null);
    $$(".sp-match button", panel).forEach((b) => (b.onclick = () => selectSign(b.dataset.sign)));
  }

  function renderMe() {
    const box = $("#skyMe", root), d = MA.profile.derived();
    if (!d) {
      box.innerHTML = `<button type="button" class="sm-cta">✦ Add your birth data to find your stars</button>`;
      $("button", box).onclick = MA.openProfile;
      return;
    }
    const real = SKY.cons.find((c) => c.id === MA.astro.sunConstellation(d.sunLon));
    const differs = real && real.id !== d.sun.con;
    box.innerHTML = `<div class="sm-card">
      <div class="sm-row"><span class="sm-g">☉</span><span>Sun in <b>${d.sun.name}</b></span></div>
      <div class="sm-row"><span class="sm-g">☽</span><span>Moon in <b>${d.moonSign.name}</b>${d.moonUnsure ? " <small>(add birth time to be sure)</small>" : ""}</span></div>
      ${differs ? `<p class="sm-fact">Star fact: on your birthday the Sun actually stood in front of <b>${esc(real.name)}</b> — the signs have drifted ~24° since antiquity.</p>` : ""}
      <button type="button" class="sm-go">Find my stars ✦</button></div>`;
    $(".sm-go", box).onclick = () => selectSign(d.sun.id);
  }

  /* ------------------------------------------------------------ view api */
  let initialised = false, firstShow = true;
  MA.views.horoscope = {
    skins: [],
    init(el) { root = el; },
    show(arg) {
      if (!initialised) { shell(); buildFigures(); initialised = true; }
      running = true;
      resize();
      renderMe(); paintRibbon();
      const d = MA.profile.derived();
      if (firstShow) {
        cam.z = z0; cam.y = 0;
        cam.x = d ? d.sunLon + 40 : MA.astro.sunLon(new Date());
        firstShow = false;
        const target = arg || (d && d.sun.id);
        if (target) setTimeout(() => { const s = MA.SIGNS.find((x) => x.id === target); if (s) selectSign(s.id); else { const c = SKY.cons.find((k) => k.id.toLowerCase() === target); if (c) select(c); } }, 350);
      } else if (arg) {
        const s = MA.SIGNS.find((x) => x.id === arg);
        if (s && (!selected || selected.id !== s.con)) selectSign(arg);
      }
      if (!raf) raf = requestAnimationFrame(frame);
    },
    hide() { running = false; cancelAnimationFrame(raf); raf = 0; },
    onProfile() { if (initialised) { renderMe(); paintRibbon(); renderPanel(); } },
  };
})(window.MA);
