(function (MA) {
  "use strict";
  const { $, $$ } = MA;

  const MODES = [
    { id: "tarot", label: "Tarot", icon: "☾", title: "Mystic Tarot", view: MA.views.tarot, skins: MA.TAROT_SKINS },
    { id: "horoscope", label: "Horoscope", icon: "✶", title: "Celestial Atlas", view: MA.views.horoscope, skins: MA.views.horoscope.skins },
    { id: "zodiac", label: "Chinese Zodiac", icon: "☯", title: "生肖 · Chinese Zodiac", view: MA.views.zodiac, skins: MA.CN_THEMES },
  ];
  let mode = null;
  const credits = $(".credits");

  /* ------------------------------------------------------------ dropdowns */
  function dropdown(root, onPick) {
    const btn = $(".dd-btn", root), menu = $(".dd-menu", root);
    const open = (v) => {
      root.classList.toggle("open", v);
      btn.setAttribute("aria-expanded", v);
      if (v) (menu.querySelector("[aria-selected=true]") || menu.firstElementChild)?.focus();
    };
    btn.addEventListener("click", () => open(!root.classList.contains("open")));
    menu.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (li) { open(false); if (e.detail === 0) btn.focus(); onPick(li.dataset.id); }
    });
    menu.addEventListener("keydown", (e) => {
      const items = $$("li", menu), i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.activeElement.click(); }
      else if (e.key === "Escape") { open(false); btn.focus(); }
    });
    document.addEventListener("pointerdown", (e) => { if (!root.contains(e.target)) open(false); });
    return {
      set(items, current) {
        menu.innerHTML = items.map((it) => `<li role="option" tabindex="-1" data-id="${it.id}" aria-selected="${it.id === current}">
          <span class="dd-ico">${it.icon}</span><span>${MA.esc(it.label)}</span></li>`).join("");
        root.hidden = items.length === 0;
        const cur = items.find((it) => it.id === current) || items[0];
        if (!cur) return;
        $(".dd-ico", btn).textContent = cur.icon;
        $(".dd-label", btn).textContent = cur.label;
      },
    };
  }

  const modeDD = dropdown($("#modeDD"), (id) => go(id));
  const skinDD = dropdown($("#skinDD"), (id) => setSkin(id));

  /* ------------------------------------------------------------ routing */
  function setSkin(id) {
    const m = MODES.find((x) => x.id === mode);
    if (!m.skins.length) { document.body.dataset.skin = "none"; skinDD.set([]); return; }
    if (!m.skins.some((s) => s.id === id)) id = m.skins[0].id;
    MA.store.set("skin." + mode, id);
    document.body.dataset.skin = id;
    skinDD.set(m.skins, id);
    m.view.setSkin && m.view.setSkin(id);
  }

  function go(id, arg, push = true) {
    const m = MODES.find((x) => x.id === id) || MODES[0];
    if (mode !== m.id) {
      if (mode) MODES.find((x) => x.id === mode).view.hide();
      mode = m.id;
      MA.store.set("mode", mode);
      document.body.dataset.mode = mode;
      $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + mode));
      modeDD.set(MODES, mode);
      $("#tbTitle").textContent = m.title;
      setSkin(MA.store.get("skin." + mode, m.skins[0] && m.skins[0].id));
      m.view.show(arg);
      $("#view-" + mode).appendChild(credits);
    } else if (arg) {
      m.view.show(arg);
    }
    if (push) {
      const h = "#" + mode + (arg ? "/" + arg : "");
      if (location.hash !== h) history.replaceState(null, "", h + location.search);
    }
  }
  MA.go = go;
  MA.route = (arg) => {        // views call this so deep links follow what's on screen
    const h = "#" + mode + (arg ? "/" + arg : "");
    if (location.hash !== h) history.replaceState(null, "", h + location.search);
  };

  function fromHash() {
    const [id, arg] = location.hash.replace(/^#/, "").split("/");
    go(MODES.some((m) => m.id === id) ? id : MA.store.get("mode", "tarot"), arg, false);
  }
  window.addEventListener("hashchange", fromHash);

  /* ------------------------------------------------------------ profile */
  const dlg = $("#profileDlg"), form = $("#profileForm");

  function openProfile() {
    const p = MA.profile.get() || {};
    form.name.value = p.name || "";
    form.birth.value = p.birth || "";
    form.time.value = p.time || "";
    form.gender.value = p.gender || "unspecified";
    form.place.value = p.place || "";
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
  }
  MA.openProfile = openProfile;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const p = { name: form.name.value.trim(), birth: form.birth.value, time: form.time.value,
      gender: form.gender.value, place: form.place.value.trim() };
    if (!p.name || !p.birth) return;
    MA.profile.set(p);
    dlg.close();
    MA.toast(`Welcome, ${MA.profile.derived().first}. The cosmos has been notified.`);
  });
  $("#pfCancel").onclick = () => dlg.close();
  $("#pfDemo").onclick = () => { MA.profile.demo(); dlg.close(); MA.toast("Demo profile loaded — enter your own any time."); };
  $("#pfClear").onclick = () => { MA.profile.set(null); dlg.close(); MA.toast("Forgotten. Your secrets are safe."); };
  $("#profileBtn").onclick = openProfile;

  function paintProfileBtn() {
    const p = MA.profile.get(), d = MA.profile.derived();
    $("#avatar").textContent = p ? (p.name.trim()[0] || "?").toUpperCase() : "?";
    $("#pname").textContent = d ? `${d.first} · ${d.sun.glyph} ${d.year.animal.zh}` : "Your data";
  }
  MA.on("profile", (p) => { paintProfileBtn(); MODES.forEach((m) => m.view.onProfile && m.view.onProfile(p)); });

  /* ------------------------------------------------------------ boot */
  const qs = new URLSearchParams(location.search);
  MODES.forEach((m) => m.view.init($("#view-" + m.id)));
  if (qs.has("demo") && !MA.profile.get()) MA.profile.demo();
  paintProfileBtn();
  fromHash();
  if (qs.has("skin")) setSkin(qs.get("skin"));
  if (!MA.profile.get() && !MA.store.get("seenIntro", false)) {
    MA.store.set("seenIntro", true);
    setTimeout(openProfile, 600);
  }
})(window.MA);
