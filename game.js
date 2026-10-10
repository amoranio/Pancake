(function () {
  const scriptEl = document.currentScript || document.querySelector("script[data-pancake]");
  const BASE = new URL("./", (scriptEl && scriptEl.src) || location.href).href;
  const asset = (name) => BASE + "assets/" + name;

  const CELL_W = 3200;
  const CELL_H = 2400;
  const COLS = 3;
  const ROWS = 3;
  const WORLD_W = CELL_W * COLS;
  const WORLD_H = CELL_H * ROWS;
  const STORE = "daddy-pancake-hunt-v1";

  const DISTRICTS = [
    { id: "dunes", name: "Flour Dunes", short: "Dunes", col: 0, row: 0, img: "dunes.jpg", tint: "#f0c36a" },
    { id: "shore", name: "Syrup Shore", short: "Shore", col: 1, row: 0, img: "shore.jpg", tint: "#8fd0dc" },
    { id: "woods", name: "Lantern Woods", short: "Woods", col: 2, row: 0, img: "woods.jpg", tint: "#8ea0d8" },
    { id: "bazaar", name: "Berry Bazaar", short: "Bazaar", col: 0, row: 1, img: "bazaar.jpg", tint: "#f0a0a8" },
    { id: "plaza", name: "Butter Plaza", short: "Plaza", col: 1, row: 1, img: "plaza.jpg", tint: "#f6d48a" },
    { id: "tea", name: "Tea Garden", short: "Garden", col: 2, row: 1, img: "tea.jpg", tint: "#b7d39a" },
    { id: "kitchen", name: "Big Kitchen", short: "Kitchen", col: 0, row: 2, img: "kitchen.jpg", tint: "#f0c09a" },
    { id: "midway", name: "Griddle Midway", short: "Midway", col: 1, row: 2, img: "midway.jpg", tint: "#f0b0c8" },
    { id: "falls", name: "Flapjack Falls", short: "Falls", col: 2, row: 2, img: "falls.jpg", tint: "#a9d4ef" },
  ];

  const DECOYS = {
    nightcap: "decoy-nightcap.png",
    grumpy: "decoy-grumpy.png",
    tophat: "decoy-tophat.png",
    party: "decoy-party.png",
    beret: "decoy-beret.png",
    bow: "decoy-bow.png",
    shades: "decoy-shades.png",
    beanie: "decoy-beanie.png",
    plain: "decoy-plain.png",
  };

  const BIAS = {
    woods: ["grumpy", "grumpy", "nightcap", "grumpy", "nightcap", "plain", "beanie"],
    tea: ["tophat", "tophat", "tophat", "nightcap", "beret", "plain"],
    dunes: ["plain", "beanie", "plain", "party", "shades", "beret"],
    shore: ["plain", "party", "shades", "bow", "beret", "beanie"],
    bazaar: ["bow", "party", "beret", "shades", "plain", "beanie"],
    midway: ["party", "beanie", "shades", "bow", "beret", "plain"],
    kitchen: ["plain", "beret", "beanie", "party", "bow"],
    falls: ["plain", "bow", "beret", "beanie", "shades", "party"],
    plaza: ["party", "bow", "plain", "shades", "nightcap", "beret", "grumpy", "beanie"],
  };

  const TARGETS = [
    { id: "daddy", name: "Daddy Pancake", src: "daddy.png", district: "woods", fx: 0.74, fy: 0.66, size: 176 },
    { id: "sunday", name: "Top-Hat Daddy", src: "sunday.png", district: "tea", fx: 0.34, fy: 0.55, size: 188 },
    { id: "mama", name: "Mama Maple", src: "mama.png", district: "midway", fx: 0.18, fy: 0.76, size: 184 },
    { id: "baby", name: "Baby Batter", src: "baby.png", district: "falls", fx: 0.63, fy: 0.3, size: 148 },
    { id: "auntie", name: "Auntie Amber", src: "auntie.png", district: "kitchen", fx: 0.28, fy: 0.24, size: 186 },
    { id: "uncle", name: "Uncle Crumble", src: "uncle.png", district: "kitchen", fx: 0.76, fy: 0.72, size: 192 },
    { id: "nana", name: "Nana Nutmeg", src: "nana.png", district: "shore", fx: 0.52, fy: 0.2, size: 196 },
    { id: "bess", name: "Blueberry Bess", src: "bess.png", district: "bazaar", fx: 0.7, fy: 0.62, size: 180 },
    { id: "chef", name: "Chef Whisk", src: "chef.png", district: "midway", fx: 0.82, fy: 0.38, size: 190 },
    { id: "pat", name: "Pat Butter", src: "pat.png", district: "dunes", fx: 0.58, fy: 0.48, size: 170 },
    { id: "captain", name: "Captain Crepe", src: "captain.png", district: "shore", fx: 0.16, fy: 0.68, size: 182 },
    { id: "pip", name: "Strawberry Pip", src: "pip.png", district: "falls", fx: 0.22, fy: 0.8, size: 132 },
  ];

  const CLUSTERS = [
    { id: "daddy", spots: [
      { v: "grumpy", dx: -130, dy: 30, size: 188 },
      { v: "nightcap", dx: 140, dy: 50, size: 170, flip: true },
      { v: "grumpy", dx: 20, dy: -150, size: 164 },
      { v: "nightcap", dx: -40, dy: 130, size: 200 },
      { v: "grumpy", dx: 160, dy: -70, size: 158, flip: true },
    ]},
    { id: "sunday", spots: [
      { v: "tophat", dx: -150, dy: 20, size: 180, flip: true },
      { v: "tophat", dx: 150, dy: 60, size: 196 },
      { v: "nightcap", dx: 30, dy: -150, size: 160 },
      { v: "tophat", dx: -60, dy: 140, size: 172 },
    ]},
    { id: "mama", spots: [
      { v: "bow", dx: -120, dy: 40, size: 176, flip: true },
      { v: "bow", dx: 130, dy: 20, size: 168 },
    ]},
    { id: "pat", spots: [
      { v: "plain", dx: -110, dy: 36, size: 180 },
      { v: "beanie", dx: 120, dy: 24, size: 166, flip: true },
      { v: "plain", dx: 10, dy: 120, size: 190 },
    ]},
    { id: "pip", spots: [
      { v: "party", dx: 90, dy: 16, size: 170 },
      { v: "bow", dx: -100, dy: 30, size: 160 },
    ]},
    { id: "bess", spots: [
      { v: "bow", dx: 120, dy: 20, size: 174, flip: true },
      { v: "party", dx: -130, dy: 40, size: 168 },
    ]},
  ];

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildPeople() {
    const rand = mulberry32(0x0dadd71);
    const byId = Object.fromEntries(DISTRICTS.map((d) => [d.id, d]));
    const targets = TARGETS.map((t) => {
      const d = byId[t.district];
      return {
        ...t,
        kind: "target",
        x: d.col * CELL_W + t.fx * CELL_W,
        y: d.row * CELL_H + t.fy * CELL_H,
        flip: false,
      };
    });
    const people = targets.slice();

    for (const d of DISTRICTS) {
      const cols = 8;
      const rows = 7;
      const bag = BIAS[d.id];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = d.col * CELL_W + ((c + 0.5) / cols) * CELL_W + (rand() - 0.5) * 180;
          const y = d.row * CELL_H + ((r + 0.5) / rows) * CELL_H + (rand() - 0.5) * 160;
          if (x < d.col * CELL_W + 90 || x > (d.col + 1) * CELL_W - 90) continue;
          if (y < d.row * CELL_H + 110 || y > (d.row + 1) * CELL_H - 80) continue;
          if (targets.some((t) => Math.hypot(t.x - x, t.y - y) < 168)) continue;
          const variant = bag[Math.floor(rand() * bag.length)];
          people.push({
            kind: "decoy",
            src: DECOYS[variant],
            x,
            y,
            size: 164 + Math.floor(rand() * 58),
            flip: rand() < 0.48,
          });
        }
      }
    }

    for (const cluster of CLUSTERS) {
      const t = targets.find((p) => p.id === cluster.id);
      for (const s of cluster.spots) {
        people.push({
          kind: "decoy",
          src: DECOYS[s.v],
          x: Math.max(80, Math.min(WORLD_W - 80, t.x + s.dx)),
          y: Math.max(80, Math.min(WORLD_H - 80, t.y + s.dy)),
          size: s.size,
          flip: !!s.flip,
        });
      }
    }

    people.sort((a, b) => a.y - b.y);
    return people;
  }

  const svg = (body) =>
    `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

  const ICONS = {
    minus: svg('<path d="M5 12h14"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 15h9l-2 2m0-4 2 2"/>'),
    map: svg('<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><path d="M9 3v15M15 6v15"/>'),
    vol: svg('<polygon points="11 5 6 9 3 9 3 15 6 15 11 19 11 5"/><path d="M16 9a4 4 0 0 1 0 6"/>'),
    mute: svg('<polygon points="11 5 6 9 3 9 3 15 6 15 11 19 11 5"/><path d="M22 9l-6 6M16 9l6 6"/>'),
    hide: svg('<path d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>'),
  };

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "{}") || {};
    } catch {
      return {};
    }
  }

  function mountPancakeHunt(root) {
    if (!root) return () => {};
    const people = buildPeople();
    const saved = loadState();
    const found = new Set(Array.isArray(saved.found) ? saved.found : []);
    let zoom = clamp(saved.zoom || 0.48, 0.28, 1.15);
    let keyHidden = !!saved.keyHidden;
    let miniHidden = !!saved.miniHidden;
    let muted = !!saved.muted;
    let introOn = !saved.introSeen;
    let audioCtx = null;
    let blockClick = false;
    const cleanups = [];

    ensureCss();
    root.innerHTML = "";
    root.classList.add("hunt-host");

    const hunt = el("div", "hunt");
    hunt.innerHTML = `
      <header class="topbar">
        <div class="brand">
          <div class="mark" aria-hidden="true"></div>
          <div class="titles">
            <h1>Where's Daddy Pancake</h1>
            <p class="where" id="where">Butter Plaza</p>
          </div>
        </div>
        <div class="spacer"></div>
        <div class="progress" id="progress">0 of ${TARGETS.length}</div>
        <div class="tools">
          <button class="icon-btn" id="zoom-out" type="button" aria-label="Zoom out">${ICONS.minus}</button>
          <span class="zoom-label" id="zoom-label">48%</span>
          <button class="icon-btn" id="zoom-in" type="button" aria-label="Zoom in">${ICONS.plus}</button>
          <button class="icon-btn" id="mute" type="button" aria-label="Mute sound" aria-pressed="false">${ICONS.vol}</button>
          <button class="icon-btn" id="toggle-mini" type="button" aria-label="Hide map" aria-pressed="true">${ICONS.map}</button>
          <button class="icon-btn" id="toggle-key" type="button" aria-label="Hide key" aria-pressed="true">${ICONS.key}</button>
        </div>
      </header>
      <div class="stage">
        <div class="viewport" id="viewport" tabindex="0">
          <div class="world" id="world"></div>
        </div>
        <aside class="key" id="key">
          <div class="key-head">
            <h2>The key</h2>
            <button class="icon-btn" id="hide-key" type="button" aria-label="Hide key">${ICONS.hide}</button>
          </div>
          <p class="key-note">Match the picture, then click them in the town. Lookalikes do not count.</p>
          <ol class="key-list" id="key-list"></ol>
          <div class="key-foot">
            <button class="text-btn" id="clear" type="button">Clear finds</button>
          </div>
        </aside>
        <button class="tab" id="show-key" type="button" hidden>Show key</button>
        <div class="mini" id="mini">
          <div class="mini-head">
            <span>Town</span>
            <button class="text-btn" id="hide-mini" type="button">Hide</button>
          </div>
          <div class="mini-grid" id="mini-grid"></div>
        </div>
        <div class="intro" id="intro">
          <div class="card">
            <h2>Daddy Pancake wandered off.</h2>
            <p>The town is much bigger than this window. Scroll or drag in every direction. Twelve faces are on the key. Hats lie, so zoom in and match the picture before you click.</p>
            <div class="portraits">
              <div class="portrait"><img alt="" src="${asset("daddy.png")}" /><span>Daddy Pancake</span></div>
              <div class="portrait"><img alt="" src="${asset("sunday.png")}" /><span>Top-Hat Daddy</span></div>
            </div>
            <button class="primary" id="start" type="button">Start looking</button>
          </div>
        </div>
        <div class="banner" id="banner" hidden>
          <h3>The whole griddle.</h3>
          <p id="banner-copy">You found all twelve.</p>
          <button class="primary" id="dismiss-win" type="button">Keep wandering</button>
        </div>
        <div class="live" id="live" aria-live="polite"></div>
      </div>
    `;
    root.appendChild(hunt);

    const viewport = hunt.querySelector("#viewport");
    const world = hunt.querySelector("#world");
    const keyEl = hunt.querySelector("#key");
    const showKey = hunt.querySelector("#show-key");
    const mini = hunt.querySelector("#mini");
    const miniGrid = hunt.querySelector("#mini-grid");
    const intro = hunt.querySelector("#intro");
    const banner = hunt.querySelector("#banner");
    const progress = hunt.querySelector("#progress");
    const where = hunt.querySelector("#where");
    const zoomLabel = hunt.querySelector("#zoom-label");
    const live = hunt.querySelector("#live");
    const muteBtn = hunt.querySelector("#mute");
    const miniBtn = hunt.querySelector("#toggle-mini");
    const keyBtn = hunt.querySelector("#toggle-key");

    const districts = DISTRICTS.map((d) => {
      const img = document.createElement("img");
      img.className = "district";
      img.alt = "";
      img.src = asset(d.img);
      img.draggable = false;
      world.appendChild(img);
      const plaque = el("div", "plaque");
      plaque.textContent = d.name;
      world.appendChild(plaque);
      return { d, img, plaque };
    });

    const nodes = people.map((p, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sprite" + (p.flip ? " flip" : "") + (p.kind === "target" && found.has(p.id) ? " is-found" : "");
      btn.dataset.index = String(i);
      if (p.kind === "target") btn.dataset.id = p.id;
      btn.setAttribute("aria-label", p.kind === "target" && found.has(p.id) ? p.name + ", found" : "Someone in the crowd");
      const img = document.createElement("img");
      img.alt = "";
      img.draggable = false;
      img.src = asset(p.src);
      btn.appendChild(img);
      world.appendChild(btn);
      return btn;
    });

    const keyList = hunt.querySelector("#key-list");
    for (const t of TARGETS) {
      const li = document.createElement("li");
      li.className = "key-item" + (found.has(t.id) ? " is-found" : "");
      li.dataset.key = t.id;
      li.innerHTML = `<span class="thumb"><img alt="" src="${asset(t.src)}" /></span><span class="name"></span>`;
      li.querySelector(".name").textContent = t.name;
      keyList.appendChild(li);
    }

    const viewbox = el("div", "viewbox");
    for (const d of DISTRICTS) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.style.background = d.tint;
      cell.textContent = d.short;
      cell.setAttribute("aria-label", "Jump to " + d.name);
      cell.addEventListener("click", () => {
        centerOn((d.col + 0.5) * CELL_W, (d.row + 0.5) * CELL_H);
      });
      miniGrid.appendChild(cell);
    }
    miniGrid.appendChild(viewbox);

    function layout() {
      world.style.width = WORLD_W * zoom + "px";
      world.style.height = WORLD_H * zoom + "px";
      for (const { d, img, plaque } of districts) {
        img.style.left = d.col * CELL_W * zoom + "px";
        img.style.top = d.row * CELL_H * zoom + "px";
        img.style.width = CELL_W * zoom + "px";
        img.style.height = CELL_H * zoom + "px";
        plaque.style.left = (d.col * CELL_W + 28) * zoom + "px";
        plaque.style.top = (d.row * CELL_H + 28) * zoom + "px";
        plaque.style.fontSize = Math.max(12, 18 * zoom) + "px";
      }
      people.forEach((p, i) => {
        const w = p.size * 0.82 * zoom;
        const h = p.size * zoom;
        const node = nodes[i];
        node.style.width = w + "px";
        node.style.height = h + "px";
        node.style.left = (p.x - (p.size * 0.82) / 2) * zoom + "px";
        node.style.top = (p.y - p.size * 0.92) * zoom + "px";
      });
      zoomLabel.textContent = Math.round(zoom * 100) + "%";
      updateChrome();
    }

    function setZoom(next, clientX, clientY) {
      const rect = viewport.getBoundingClientRect();
      const cx = (clientX == null ? rect.left + rect.width / 2 : clientX) - rect.left;
      const cy = (clientY == null ? rect.top + rect.height / 2 : clientY) - rect.top;
      const worldX = (viewport.scrollLeft + cx) / zoom;
      const worldY = (viewport.scrollTop + cy) / zoom;
      zoom = clamp(next, 0.28, 1.15);
      layout();
      viewport.scrollLeft = worldX * zoom - cx;
      viewport.scrollTop = worldY * zoom - cy;
      persist();
    }

    function centerOn(wx, wy) {
      viewport.scrollLeft = wx * zoom - viewport.clientWidth / 2;
      viewport.scrollTop = wy * zoom - viewport.clientHeight / 2;
      updateChrome();
    }

    function updateChrome() {
      const cx = (viewport.scrollLeft + viewport.clientWidth / 2) / zoom;
      const cy = (viewport.scrollTop + viewport.clientHeight / 2) / zoom;
      const col = clamp(Math.floor(cx / CELL_W), 0, COLS - 1);
      const row = clamp(Math.floor(cy / CELL_H), 0, ROWS - 1);
      const here = DISTRICTS.find((d) => d.col === col && d.row === row);
      if (here) where.textContent = here.name;
      const mw = miniGrid.clientWidth || 1;
      const mh = miniGrid.clientHeight || 1;
      viewbox.style.left = (viewport.scrollLeft / (WORLD_W * zoom)) * mw + "px";
      viewbox.style.top = (viewport.scrollTop / (WORLD_H * zoom)) * mh + "px";
      viewbox.style.width = (viewport.clientWidth / (WORLD_W * zoom)) * mw + "px";
      viewbox.style.height = (viewport.clientHeight / (WORLD_H * zoom)) * mh + "px";
      progress.textContent = found.size + " of " + TARGETS.length;
    }

    function applyPanels() {
      keyEl.hidden = keyHidden;
      showKey.hidden = !keyHidden;
      mini.hidden = miniHidden;
      intro.hidden = !introOn;
      keyBtn.setAttribute("aria-pressed", keyHidden ? "false" : "true");
      keyBtn.setAttribute("aria-label", keyHidden ? "Show key" : "Hide key");
      miniBtn.setAttribute("aria-pressed", miniHidden ? "false" : "true");
      miniBtn.setAttribute("aria-label", miniHidden ? "Show map" : "Hide map");
      muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
      muteBtn.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
      muteBtn.innerHTML = muted ? ICONS.mute : ICONS.vol;
    }

    let saveTimer = 0;
    function persist() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(writeState, 200);
    }
    function writeState() {
      const data = {
        found: [...found],
        keyHidden,
        miniHidden,
        muted,
        introSeen: !introOn,
        zoom,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
      };
      try {
        localStorage.setItem(STORE, JSON.stringify(data));
      } catch {
        /* private mode */
      }
    }

    function chime() {
      if (muted) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(523, t);
      o.frequency.exponentialRampToValueAtTime(784, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(t);
      o.stop(t + 0.3);
    }

    function celebrate() {
      if (muted) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      const notes = [523, 659, 784, 1046];
      notes.forEach((freq, i) => {
        const t = audioCtx.currentTime + i * 0.09;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "triangle";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t);
        o.stop(t + 0.24);
      });
    }

    function markFound(person, node) {
      if (found.has(person.id)) return;
      found.add(person.id);
      node.classList.add("is-found");
      node.setAttribute("aria-label", person.name + ", found");
      const row = keyList.querySelector('[data-key="' + person.id + '"]');
      if (row) row.classList.add("is-found");
      const pop = el("div", "pop");
      pop.textContent = person.name;
      const rect = node.getBoundingClientRect();
      const host = viewport.getBoundingClientRect();
      pop.style.left = rect.left - host.left + viewport.scrollLeft + rect.width / 2 + "px";
      pop.style.top = rect.top - host.top + viewport.scrollTop + "px";
      world.appendChild(pop);
      setTimeout(() => pop.remove(), 1000);
      live.textContent = "Found " + person.name + ". " + found.size + " of " + TARGETS.length + ".";
      updateChrome();
      persist();
      if (found.size === TARGETS.length) {
        celebrate();
        banner.hidden = false;
      } else {
        chime();
      }
    }

    function clearFinds() {
      found.clear();
      banner.hidden = true;
      nodes.forEach((node, i) => {
        if (people[i].kind !== "target") return;
        node.classList.remove("is-found");
        node.setAttribute("aria-label", "Someone in the crowd");
      });
      keyList.querySelectorAll(".key-item").forEach((row) => row.classList.remove("is-found"));
      live.textContent = "Finds cleared.";
      updateChrome();
      persist();
    }

    let pan = null;
    const onPointerDown = (e) => {
      if (e.button !== 0 || e.pointerType !== "mouse") return;
      pan = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        sl: viewport.scrollLeft,
        st: viewport.scrollTop,
        moved: false,
      };
    };
    const onPointerMove = (e) => {
      if (!pan || e.pointerId !== pan.id) return;
      const dx = e.clientX - pan.x;
      const dy = e.clientY - pan.y;
      if (!pan.moved && Math.hypot(dx, dy) < 7) return;
      pan.moved = true;
      viewport.classList.add("dragging");
      viewport.scrollLeft = pan.sl - dx;
      viewport.scrollTop = pan.st - dy;
    };
    const onPointerUp = (e) => {
      if (!pan || e.pointerId !== pan.id) return;
      blockClick = pan.moved;
      pan = null;
      viewport.classList.remove("dragging");
    };
    const onClick = (e) => {
      if (blockClick) {
        blockClick = false;
        return;
      }
      const btn = e.target.closest(".sprite");
      if (!btn) return;
      const person = people[Number(btn.dataset.index)];
      if (!person || person.kind !== "target") return;
      markFound(person, btn);
    };
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      setZoom(zoom * factor, e.clientX, e.clientY);
    };
    const onKey = (e) => {
      if (e.target && e.target.closest && e.target.closest("input, textarea")) return;
      const step = e.shiftKey ? 420 : 180;
      if (e.key === "ArrowLeft") viewport.scrollBy({ left: -step });
      else if (e.key === "ArrowRight") viewport.scrollBy({ left: step });
      else if (e.key === "ArrowUp") viewport.scrollBy({ top: -step });
      else if (e.key === "ArrowDown") viewport.scrollBy({ top: step });
      else if (e.key === "+" || e.key === "=") setZoom(zoom * 1.1);
      else if (e.key === "-" || e.key === "_") setZoom(zoom / 1.1);
      else if (e.key === "k" || e.key === "K") {
        keyHidden = !keyHidden;
        applyPanels();
        persist();
      } else return;
      e.preventDefault();
    };
    const onScroll = () => {
      updateChrome();
      persist();
    };

    const pointers = new Map();
    let pinch = null;
    const onPinchDown = (e) => {
      if (e.pointerType === "mouse") return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinch = { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, zoom };
      }
    };
    const onPinchMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinch) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        setZoom(pinch.zoom * (dist / pinch.dist), (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
      }
    };
    const onPinchUp = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
    };

    world.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    world.addEventListener("click", onClick);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    viewport.addEventListener("pointerdown", onPinchDown);
    viewport.addEventListener("pointermove", onPinchMove);
    viewport.addEventListener("pointerup", onPinchUp);
    viewport.addEventListener("pointercancel", onPinchUp);

    hunt.querySelector("#zoom-in").addEventListener("click", () => setZoom(zoom * 1.12));
    hunt.querySelector("#zoom-out").addEventListener("click", () => setZoom(zoom / 1.12));
    muteBtn.addEventListener("click", () => {
      muted = !muted;
      applyPanels();
      persist();
    });
    const toggleKey = () => {
      keyHidden = !keyHidden;
      applyPanels();
      persist();
    };
    const toggleMini = () => {
      miniHidden = !miniHidden;
      applyPanels();
      persist();
    };
    hunt.querySelector("#hide-key").addEventListener("click", toggleKey);
    hunt.querySelector("#toggle-key").addEventListener("click", toggleKey);
    showKey.addEventListener("click", toggleKey);
    hunt.querySelector("#hide-mini").addEventListener("click", toggleMini);
    miniBtn.addEventListener("click", toggleMini);
    hunt.querySelector("#clear").addEventListener("click", clearFinds);
    hunt.querySelector("#start").addEventListener("click", () => {
      introOn = false;
      applyPanels();
      persist();
      viewport.focus();
    });
    hunt.querySelector("#dismiss-win").addEventListener("click", () => {
      banner.hidden = true;
    });

    applyPanels();
    layout();

    let placeTries = 0;
    const placeCamera = () => {
      if (viewport.clientWidth < 40 || viewport.clientHeight < 40 || placeTries > 40) {
        if (placeTries++ <= 40) requestAnimationFrame(placeCamera);
        return;
      }
      const targetLeft = Number.isFinite(saved.scrollLeft) && saved.introSeen
        ? saved.scrollLeft
        : 1.5 * CELL_W * zoom - viewport.clientWidth / 2;
      const targetTop = Number.isFinite(saved.scrollTop) && saved.introSeen
        ? saved.scrollTop
        : 1.5 * CELL_H * zoom - viewport.clientHeight / 2;
      viewport.scrollLeft = targetLeft;
      viewport.scrollTop = targetTop;
      const stuck = Math.abs(viewport.scrollLeft - targetLeft) < 3 && Math.abs(viewport.scrollTop - targetTop) < 3;
      if (!stuck && placeTries++ < 40) requestAnimationFrame(placeCamera);
      else updateChrome();
    };
    if (history.scrollRestoration) history.scrollRestoration = "manual";
    placeCamera();
    window.addEventListener("load", placeCamera);
    if (found.size === TARGETS.length) banner.hidden = false;

    cleanups.push(() => {
      world.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      world.removeEventListener("click", onClick);
      viewport.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("pointerdown", onPinchDown);
      viewport.removeEventListener("pointermove", onPinchMove);
      viewport.removeEventListener("pointerup", onPinchUp);
      viewport.removeEventListener("pointercancel", onPinchUp);
    });

    return function unmount() {
      cleanups.forEach((fn) => fn());
      if (root.contains(hunt)) hunt.remove();
    };
  }

  function ensureCss() {
    if (document.getElementById("pancake-css")) return;
    const link = document.createElement("link");
    link.id = "pancake-css";
    link.rel = "stylesheet";
    link.href = BASE + "styles.css";
    document.head.appendChild(link);
  }

  function el(tag, className) {
    const node = document.createElement(tag);
    node.className = className;
    return node;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  window.mountPancakeHunt = mountPancakeHunt;
})();
