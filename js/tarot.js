window.MA = window.MA || {};
MA.views = MA.views || {};

(function (MA) {
  "use strict";
  const { $, $$, esc } = MA;
  const T = MA.TAROT;

  let root, skin = "classic", reading = null, dealing = 0;

  const SPREADS = [
    { id: "daily", label: "Card of the Day", icon: "☀" },
    { id: "three", label: "Past · Present · Future", icon: "☽" },
    { id: "birth", label: "Birth Cards", icon: "✦" },
  ];

  /* ------------------------------------------------------------ numerology */
  const reduce22 = (n) => { while (n > 22) n = MA.digitSum(n); return n === 22 ? 0 : n; };
  const single = (n) => { while (n > 9) n = MA.digitSum(n); return n; };
  function birthCards(p) {
    const [y, m, d] = p.birth.split("-").map(Number);
    const pers = reduce22(y + m + d);
    const soul = pers >= 10 ? single(pers) : pers;
    const letters = (p.name || "").toLowerCase().replace(/[^a-z]/g, "");
    let nm = [...letters].reduce((a, c) => a + ((c.charCodeAt(0) - 97) % 9) + 1, 0);
    while (nm > 21) nm = MA.digitSum(nm);
    const year = reduce22(new Date().getFullYear() + m + d);
    return { pers, soul, name: nm, year };
  }

  /* ------------------------------------------------------------ skin pieces */
  const RANSOM_FONTS = ["Anton", "Permanent Marker", "Special Elite", "Bangers", "Cinzel", "Georgia"];
  function ransom(text, seed = text) {
    const r = MA.rng("ransom" + seed);
    let first = true;
    const letter = (ch) => {
      const f = RANSOM_FONTS[Math.floor(r() * RANSOM_FONTS.length)];
      const kind = ["w", "b", "r"][Math.floor(r() * 3)];
      const rot = (r() * 16 - 8).toFixed(1), sz = (0.85 + r() * 0.45).toFixed(2);
      const cls = first ? " first" : "";
      first = false;
      return `<b class="rn ${kind}${cls}" style="font-family:'${f}';transform:rotate(${rot}deg);font-size:${sz}em">${esc(ch)}</b>`;
    };
    return `<span class="ransom">${text.split(" ").map((w) => `<span class="rw">${[...w].map(letter).join("")}</span>`).join("")}</span>`;
  }
  MA.ransom = ransom;

  const STAT_NAMES = ["Power", "Speed", "Range", "Durability", "Precision", "Potential"];
  function statHex(stats, size = 150) {
    const c = size / 2, R = size * 0.34;
    const pt = (i, f) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [c + Math.cos(a) * R * f, c + Math.sin(a) * R * f]; };
    const grid = [1, 0.8, 0.6, 0.4, 0.2].map((f) => `<polygon points="${[0, 1, 2, 3, 4, 5].map((i) => pt(i, f).join(",")).join(" ")}"/>`).join("");
    const vals = [...stats].map((ch) => (70 - ch.charCodeAt(0)) / 5);         // A=1 … E=0.2
    const poly = vals.map((v, i) => pt(i, v).join(",")).join(" ");
    const labels = STAT_NAMES.map((n, i) => {
      const [x, y] = pt(i, 1.32);
      return `<text x="${x}" y="${y}" class="hx-l">${n}</text><text x="${x}" y="${y + 11}" class="hx-v">${stats[i]}</text>`;
    }).join("");
    return `<svg class="stathex" viewBox="0 0 ${size} ${size}" role="img" aria-label="Stand stats ${stats}">
      <g class="hx-grid">${grid}</g><polygon class="hx-val" points="${poly}"/>${labels}</svg>`;
  }

  function cardBack() {
    if (skin === "p5") return `<div class="cb-p5"><div class="cb-p5-stripe"></div>${MA.icon("tophat", "cb-hat")}${MA.icon("mask", "cb-mask")}
      <div class="cb-p5-txt">TAKE<br>YOUR<br>HEART</div></div>`;
    if (skin === "jojo") return `<div class="cb-jojo"><svg viewBox="0 0 100 160" class="cb-arrow" aria-hidden="true">
      <path d="M50 8 L72 60 L58 56 L58 150 L42 150 L42 56 L28 60 Z"/><circle cx="50" cy="40" r="6" class="eye"/></svg>
      <div class="cb-jojo-txt">ゴ ゴ ゴ</div></div>`;
    return `<div class="cb-classic"><div class="cb-c-ring"></div><div class="cb-c-eye">☾✦☽</div></div>`;
  }

  function cardFront(c) {
    const art = MA.override(`tarot/${skin}/${c.n}`, MA.icon("t" + c.n, "tc-icon"), c.name);
    if (skin === "p5") return `<div class="cf-p5"><div class="cf-p5-num">${MA.ROMAN[c.n]}</div>
      <div class="cf-p5-art">${art}</div><div class="cf-p5-name">${ransom(c.name.replace(/^The /, ""), c.n)}</div>
      <div class="cf-p5-conf">${esc(c.p5.conf)}</div></div>`;
    if (skin === "jojo") return `<div class="cf-jojo" style="--h:${(c.n * 47) % 360}"><div class="cf-jojo-num">${MA.ROMAN[c.n]}</div>
      <div class="cf-jojo-art">${art}</div><div class="cf-jojo-stand">「${esc(c.jojo.stand)}」</div>
      <div class="cf-jojo-name">${esc(c.name)}</div></div>`;
    return `<div class="cf-classic"><div class="cf-c-num">${MA.ROMAN[c.n]}</div><div class="cf-c-art">${art}</div>
      <div class="cf-c-name">${esc(c.name.toUpperCase())}</div></div>`;
  }

  /* ------------------------------------------------------------ layout */
  function shell() {
    root.innerHTML = `
      <div class="t-bg" aria-hidden="true"></div>
      <div class="t-fx" aria-hidden="true"></div>
      <div class="t-wrap">
        <div class="t-head">
          <h1 class="t-title"></h1>
          <p class="t-sub"></p>
        </div>
        <div class="t-spreads">${SPREADS.map((s) => `<button type="button" data-spread="${s.id}"><span>${s.icon}</span> ${s.label}</button>`).join("")}</div>
        <div class="t-table" id="tTable"></div>
        <div class="t-reading" id="tReading" aria-live="polite"></div>
        <div class="t-me" id="tMe"></div>
      </div>`;
    $$(".t-spreads button", root).forEach((b) => (b.onclick = () => draw(b.dataset.spread)));
    $("#tTable", root).addEventListener("click", (e) => {
      const card = e.target.closest(".tcard");
      if (card && !card.classList.contains("flipped")) flip(card);
      else if (card) focusCard(+card.dataset.i);
    });
  }

  function paintHead() {
    const t = $(".t-title", root), s = $(".t-sub", root);
    if (skin === "p5") { t.innerHTML = ransom("VELVET TAROT", "title"); s.textContent = "Steal a glimpse of your future. Pick a spread, Phantom Thief."; }
    else if (skin === "jojo") { t.innerHTML = `<span class="jj-title">BIZARRE TAROT</span>`; s.innerHTML = `Every card is a Stand. Draw if you dare… <span class="menace">ゴゴゴゴ</span>`; }
    else { t.textContent = "✦ MYSTIC TAROT ✦"; s.textContent = "Focus on your question… then draw."; }
  }

  /* ------------------------------------------------------------ drawing */
  function draw(spread) {
    const p = MA.profile.get();
    if (spread === "birth" && !p) { MA.openProfile(); return; }
    let cards;
    if (spread === "daily") {
      const r = MA.rng(`daily|${p ? MA.profile.derived().seed : "anon"}|${MA.todayKey()}`);
      cards = [{ n: Math.floor(r() * 22), rev: r() < 0.25, pos: "Today" }];
    } else if (spread === "three") {
      const deck = [...Array(22).keys()].sort(() => Math.random() - 0.5);
      cards = ["Past", "Present", "Future"].map((pos, i) => ({ n: deck[i], rev: Math.random() < 0.3, pos }));
    } else {
      const b = birthCards(p);
      cards = [{ n: b.pers, pos: "Personality" }, { n: b.soul, pos: "Soul" }, { n: b.name, pos: "Name" },
        { n: b.year, pos: `Year ${new Date().getFullYear()}` }].map((c) => ({ ...c, rev: false }));
      if (b.pers === b.soul) cards.splice(1, 1);
    }
    reading = { spread, cards, cat: spread !== "birth" && Math.random() < 0.03 };
    $$(".t-spreads button", root).forEach((b) => b.classList.toggle("on", b.dataset.spread === spread));
    renderTable(true);
    fxDraw();
  }

  function renderTable(animate) {
    const table = $("#tTable", root);
    const token = ++dealing;
    $("#tReading", root).innerHTML = "";
    if (!reading) {
      table.innerHTML = `<div class="t-deck" title="Draw">${[0, 1, 2, 3].map((i) => `<div class="tcard deck-card" style="--k:${i}"><div class="tc-inner"><div class="tc-face tc-back">${cardBack()}</div></div></div>`).join("")}</div>`;
      $(".t-deck", table).onclick = () => draw("daily");
      return;
    }
    table.innerHTML = reading.cards.map((c, i) => `
      <div class="tcard ${c.rev ? "reversed" : ""} ${animate ? "dealing" : "flipped"}" data-i="${i}" style="--i:${i}">
        <div class="tc-inner">
          <div class="tc-face tc-back">${cardBack()}</div>
          <div class="tc-face tc-front"><div class="tc-rot">${cardFront(T[c.n])}</div></div>
        </div>
        <div class="tc-pos">${esc(c.pos)}${c.rev ? " · reversed" : ""}</div>
      </div>`).join("");
    if (animate) {
      requestAnimationFrame(() => $$(".tcard", table).forEach((el) => el.classList.remove("dealing")));
      $$(".tcard", table).forEach((el, i) => setTimeout(() => token === dealing && flip(el), 650 + i * 520));
    } else renderReading();
  }

  function flip(el) {
    el.classList.add("flipped");
    if ($$(".tcard", root).every((c) => c.classList.contains("flipped"))) setTimeout(renderReading, 450);
  }

  function focusCard(i) {
    const el = $$(".t-read-item", root)[i];
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("pulse"); setTimeout(() => el.classList.remove("pulse"), 900); }
  }

  function renderReading() {
    if (!reading) return;
    const box = $("#tReading", root);
    const intro = skin === "p5" ? `<div class="rd-intro p5-intro">${ransom("THE CARDS HAVE SPOKEN", "intro")}</div>`
      : skin === "jojo" ? `<div class="rd-intro jj-intro">「STAND READING」 <span class="menace">ドドドド</span></div>`
        : `<div class="rd-intro">The spirits are whispering…</div>`;
    const items = reading.cards.map((c, i) => {
      const k = T[c.n];
      const meaning = c.rev ? k.rev : k.up;
      let extra = "";
      if (skin === "p5") {
        const rank = 1 + (MA.hash(k.name + MA.todayKey()) % 10);
        extra = `<div class="rd-p5">Confidant: <b>${esc(k.p5.conf)}</b> <small>${esc(k.p5.note)}</small>
          ${k.p5.persona ? `<br>Persona: <b>${esc(k.p5.persona)}</b>` : ""}
          <div class="rank">RANK ${rank} ${"★".repeat(rank)}${"☆".repeat(10 - rank)}</div></div>`;
      } else if (skin === "jojo") {
        extra = `<div class="rd-jojo"><div>Stand: <b>「${esc(k.jojo.stand)}」</b><br>Stand user: <b>${esc(k.jojo.user)}</b></div>${statHex(k.jojo.stats, 160)}</div>`;
      }
      return `<article class="t-read-item" style="--i:${i}">
        <div class="rd-pos">${esc(c.pos)}</div>
        <h3>${esc(k.name)}${c.rev ? ' <span class="rev">reversed</span>' : ""}</h3>
        <div class="rd-keys">${k.key.map((x) => `<span>${esc(x)}</span>`).join("")}</div>
        <p>${esc(meaning)}</p>${extra}</article>`;
    }).join("");
    const cat = reading.cat ? `<p class="rd-cat">…and one more thing: your ex's cat is locked in his balcony. 🐈🔒</p>` : "";
    const tbc = skin === "jojo" ? `<div class="tbc" aria-hidden="true"><span>To Be Continued</span><svg viewBox="0 0 60 24"><path d="M0 12 L18 0 L18 7 L60 7 L60 17 L18 17 L18 24 Z"/></svg></div>` : "";
    box.innerHTML = intro + `<div class="rd-items">${items}</div>` + cat + tbc;
    if (skin === "jojo") { root.classList.add("sepia"); setTimeout(() => root.classList.remove("sepia"), 1600); }
  }

  /* ------------------------------------------------------------ fx */
  function fxDraw() {
    const fx = $(".t-fx", root);
    fx.innerHTML = "";
    if (skin === "p5") {
      fx.innerHTML = `<div class="p5-wipe"><i></i><i></i><i></i></div><div class="p5-callout">${ransom("TAKE YOUR TIME", "callout")}</div>`;
    } else if (skin === "jojo") {
      const r = MA.rng(Date.now());
      fx.innerHTML = Array.from({ length: 14 }, (_, i) =>
        `<span class="go" style="left:${(r() * 92).toFixed(1)}%;top:${(15 + r() * 70).toFixed(1)}%;--d:${(i * 0.08).toFixed(2)}s;--s:${(0.8 + r() * 1.4).toFixed(2)}">${r() < 0.5 ? "ゴ" : "ド"}</span>`).join("");
    } else {
      const r = MA.rng(Date.now());
      fx.innerHTML = Array.from({ length: 24 }, (_, i) =>
        `<span class="spark" style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;--d:${(r() * 1.2).toFixed(2)}s">✦</span>`).join("");
    }
    clearTimeout(fx._t);
    fx._t = setTimeout(() => (fx.innerHTML = ""), 2600);
  }

  /* ------------------------------------------------------------ "me" panel */
  function renderMe() {
    const box = $("#tMe", root), p = MA.profile.get();
    if (!p) {
      const what = skin === "p5" ? "Phantom Thief dossier" : skin === "jojo" ? "personal Stand" : "Birth Cards";
      box.innerHTML = `<div class="me-cta"><p>Enter your birth data to reveal your <b>${what}</b>.</p>
        <button type="button" class="btn">Enter my data</button></div>`;
      $("button", box).onclick = MA.openProfile;
      return;
    }
    const d = MA.profile.derived(), b = birthCards(p), pc = T[b.pers];
    const r = MA.rng("me|" + d.seed);
    if (skin === "p5") {
      const code = MA.pick(r, MA.P5.codenames), [per, perDesc] = MA.pick(r, MA.P5.personas), heist = MA.pick(r, MA.P5.heists);
      box.innerHTML = `<div class="me-p5">
        <div class="calling-card">${MA.icon("tophat", "cc-hat")}
          <p class="cc-to">${esc(p.name)},</p>
          <p>the sinner of <b>${esc(heist)}</b>. We have decided to make you confess your crimes with your own mouth.
          We will take your distorted desires without fail.</p>
          <p class="cc-sign">— The Phantom Thieves</p></div>
        <div class="dossier">
          <div class="ds-row"><span>Codename</span><b>${ransom(code.toUpperCase(), code)}</b></div>
          <div class="ds-row"><span>Persona</span><b>${esc(per)}</b><small>${esc(perDesc)}</small></div>
          <div class="ds-row"><span>Arcana</span><b>${MA.ROMAN[pc.n]} · ${esc(pc.name)}</b><small>Confidant: ${esc(pc.p5.conf)}</small></div>
          <div class="ds-row"><span>Sun / Moon</span><b>${d.sun.glyph} ${d.sun.name} · ${d.moonSign.glyph} ${d.moonSign.name}</b></div>
        </div></div>`;
    } else if (skin === "jojo") {
      const stand = MA.pick(r, MA.JOJO.stands);
      const stats = Array.from({ length: 6 }, () => "ABCDE"[Math.floor(r() * 5)]).join("");
      const cry = MA.pick(r, ["ORA", "MUDA", "ARI", "DORA", "BALA", "WRYY", "YOSH", "NYO"]);
      const ability = `Can ${MA.pick(r, MA.JOJO.verbs)} ${MA.pick(r, MA.JOJO.targets)}, ${MA.pick(r, MA.JOJO.limits)}.`;
      box.innerHTML = `<div class="me-jojo">
        <div class="mj-head"><span class="mj-user">STAND USER: ${esc(p.name.toUpperCase())}</span>
          <h2>「${esc(stand)}」</h2><span class="menace">ゴゴゴゴ</span></div>
        <div class="mj-body">${statHex(stats, 210)}
          <div><p class="mj-ab"><b>Ability.</b> ${esc(ability)}</p>
          <p>Tarot of your Stand: <b>${MA.ROMAN[pc.n]} ${esc(pc.name)}</b> — the same arcana as ${esc(pc.jojo.user)}'s 「${esc(pc.jojo.stand)}」.</p>
          <p class="mj-small">Born under ${d.sun.glyph} ${d.sun.name} in the Year of the ${d.year.animal.name}. Your battle cry: <b>${cry} ${cry} ${cry}!</b></p></div>
        </div></div>`;
    } else {
      const mini = (n, lbl) => `<button type="button" class="mini" data-n="${n}"><span class="mini-n">${MA.ROMAN[n]}</span>
        ${MA.icon("t" + n)}<span class="mini-t">${esc(T[n].name)}</span><span class="mini-l">${lbl}</span></button>`;
      box.innerHTML = `<div class="me-classic"><h2>${esc(d.first)}'s Birth Cards</h2>
        <p class="me-sub">From ${esc(p.birth)} and the letters of your name.</p>
        <div class="minis">${mini(b.pers, "Personality")}${b.soul !== b.pers ? mini(b.soul, "Soul") : ""}${mini(b.name, "Name")}${mini(b.year, "This year")}</div></div>`;
      $$(".mini", box).forEach((m) => (m.onclick = () => draw("birth")));
    }
  }

  /* ------------------------------------------------------------ view api */
  MA.views.tarot = {
    init(el) { root = el; shell(); },
    show() { paintHead(); renderTable(false); renderMe(); },
    hide() {},
    setSkin(s) { skin = s; root.dataset.skin = s; paintHead(); renderTable(false); renderMe(); },
    onProfile() { renderMe(); },
  };
})(window.MA);
