(function () {
  const scriptEl = document.currentScript || document.querySelector("script[data-pancake]");
  const BASE = new URL("./", (scriptEl && scriptEl.src) || location.href).href;
  const asset = (name) => BASE + "assets/" + name;
  const SCENE_VERSION = "seamless-v1";
  const PICTURE = asset("coast.jpg") + "?v=" + SCENE_VERSION;
  const IMG_W = 1884;
  const IMG_H = 835;
  // Landmarks are regions of one illustration, rather than separate panels.
  const MAP_AREAS = [
    { name: "The harbour", x: 0.14, y: 0.3 },
    { name: "The beach", x: 0.47, y: 0.26 },
    { name: "The seaside market", x: 0.81, y: 0.3 },
    { name: "The dune gardens", x: 0.17, y: 0.76 },
    { name: "The fairground", x: 0.53, y: 0.76 },
    { name: "The picnic meadow", x: 0.86, y: 0.75 },
  ];
  const SCALE = 13440 / IMG_W;
  const WORLD_W = IMG_W * SCALE;
  const WORLD_H = IMG_H * SCALE;
  // Finds and camera positions belong to this exact illustration.
  const STORE = "daddy-pancake-hunt-v5";

  // Bounds measured directly in the single coast illustration.
  const TARGETS = [
    { id: "daddy", name: "Daddy Pancake", x: 296, y: 253, w: 46, h: 54 },
    { id: "sunday", name: "Top-Hat Daddy", x: 1122, y: 690, w: 44, h: 60 },
    { id: "mama", name: "Mama Maple", x: 1428, y: 653, w: 42, h: 56 },
    { id: "baby", name: "Baby Batter", x: 818, y: 271, w: 34, h: 44 },
    { id: "auntie", name: "Auntie Amber", x: 1801, y: 289, w: 40, h: 52 },
    { id: "uncle", name: "Uncle Crumble", x: 1714, y: 516, w: 44, h: 60 },
    { id: "nana", name: "Nana Nutmeg", x: 476, y: 532, w: 42, h: 52 },
    { id: "bess", name: "Blueberry Bess", x: 242, y: 705, w: 40, h: 54 },
    { id: "chef", name: "Chef Whisk", x: 1478, y: 195, w: 44, h: 56 },
    { id: "pat", name: "Pat Butter", x: 795, y: 577, w: 36, h: 48 },
    { id: "captain", name: "Captain Crepe", x: 403, y: 193, w: 40, h: 52 },
    { id: "pip", name: "Strawberry Pip", x: 1052, y: 276, w: 32, h: 46 },
  ];

  function placeName(imageX, imageY) {
    const x = imageX / IMG_W;
    const y = imageY / IMG_H;
    return MAP_AREAS.reduce((closest, area) =>
      Math.hypot(x - area.x, y - area.y) < Math.hypot(x - closest.x, y - closest.y)
        ? area : closest).name;
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
    const saved = loadState();
    const found = new Set(Array.isArray(saved.found)
      ? saved.found.filter((id) => TARGETS.some((t) => t.id === id)) : []);
    let zoom = clamp(saved.zoom || 0.32, 0.02, 1.05);
    let keyHidden = !!saved.keyHidden;
    let miniHidden = !!saved.miniHidden;
    let muted = !!saved.muted;
    let introOn = !saved.introSeen;
    let audioCtx = null;
    let blockClick = false;
    let sceneReady = false;
    let disposed = false;
    const cleanups = [];
    const rings = new Map();

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
            <p class="where" id="where">Open water</p>
          </div>
        </div>
        <div class="spacer"></div>
        <div class="progress" id="progress">0 of ${TARGETS.length}</div>
        <div class="tools">
          <button class="icon-btn" id="zoom-out" type="button" aria-label="Zoom out">${ICONS.minus}</button>
          <span class="zoom-label" id="zoom-label">32%</span>
          <button class="icon-btn" id="zoom-in" type="button" aria-label="Zoom in">${ICONS.plus}</button>
          <button class="icon-btn" id="mute" type="button" aria-label="Mute sound" aria-pressed="false">${ICONS.vol}</button>
          <button class="icon-btn" id="toggle-mini" type="button" aria-label="Hide map" aria-pressed="true">${ICONS.map}</button>
          <button class="icon-btn" id="toggle-key" type="button" aria-label="Hide key" aria-pressed="true">${ICONS.key}</button>
        </div>
      </header>
      <div class="stage">
        <div class="viewport" id="viewport" tabindex="0" aria-label="The pancake coast. Scroll in every direction and click the character you find.">
          <div class="world" id="world">
            <canvas class="picture" width="${IMG_W}" height="${IMG_H}" role="img" aria-label="One sprawling pancake coast, with a harbour, beach, market, dune gardens, fairground and picnic meadow. Twelve family members are hidden among the crowds."></canvas>
          </div>
        </div>
        <p class="scene-status" id="scene-status" role="status">Loading the map…</p>
        <aside class="key" id="key">
          <div class="key-head">
            <h2>The key</h2>
            <button class="icon-btn" id="hide-key" type="button" aria-label="Hide key">${ICONS.hide}</button>
          </div>
          <p class="key-note">They are hidden across the whole coast. Match the close-up, then click the character you find.</p>
          <ol class="key-list" id="key-list"></ol>
          <div class="key-foot">
            <button class="text-btn" id="clear" type="button">Clear finds</button>
          </div>
        </aside>
        <button class="tab" id="show-key" type="button" hidden>Show key</button>
        <div class="mini" id="mini">
          <div class="mini-head">
            <span>The whole coast</span>
            <button class="text-btn" id="hide-mini" type="button">Hide</button>
          </div>
          <div class="mini-shot" id="mini-shot">
            <canvas width="420" height="${Math.round(420 * IMG_H / IMG_W)}" aria-hidden="true"></canvas>
          </div>
        </div>
        <div class="intro" id="intro">
          <div class="card">
            <h2>Daddy Pancake wandered off.</h2>
            <p>A whole pancake coast. Twelve missing pancakes. Explore the harbour, beach, market, gardens, fairground and picnic meadow. Daddy and the family are scattered across the crowds. Scroll or drag in every direction, zoom in, and match the close-ups on the key.</p>
            <div class="portraits">
              <div class="portrait"><span class="scene-portrait" data-portrait="daddy"></span><span>Daddy Pancake</span></div>
              <div class="portrait"><span class="scene-portrait" data-portrait="sunday"></span><span>Top-Hat Daddy</span></div>
            </div>
            <button class="primary" id="start" type="button" disabled>Loading the map…</button>
          </div>
        </div>
        <div class="banner" id="banner" hidden>
          <h3>The whole coast.</h3>
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
    const shot = hunt.querySelector("#mini-shot");
    const intro = hunt.querySelector("#intro");
    const banner = hunt.querySelector("#banner");
    const progress = hunt.querySelector("#progress");
    const where = hunt.querySelector("#where");
    const zoomLabel = hunt.querySelector("#zoom-label");
    const live = hunt.querySelector("#live");
    const muteBtn = hunt.querySelector("#mute");
    const miniBtn = hunt.querySelector("#toggle-mini");
    const keyBtn = hunt.querySelector("#toggle-key");
    const viewbox = el("div", "viewbox");
    shot.appendChild(viewbox);
    const miss = el("div", "miss");
    miss.hidden = true;
    world.appendChild(miss);

    const keyList = hunt.querySelector("#key-list");
    // The key shows the actual painted character, never a mismatched sprite.
    function paintPortrait(node, t) {
      const size = Math.max(t.w, t.h) + 8;
      node.style.backgroundImage = `url("${PICTURE}")`;
      node.style.backgroundSize = `${IMG_W / size * 100}% ${IMG_H / size * 100}%`;
      node.style.backgroundPosition = `${(t.x - size / 2) / (IMG_W - size) * 100}% ${(t.y - size / 2) / (IMG_H - size) * 100}%`;
      node.setAttribute("role", "img");
      node.setAttribute("aria-label", t.name);
    }
    hunt.querySelectorAll("[data-portrait]").forEach((node) => {
      paintPortrait(node, TARGETS.find((t) => t.id === node.dataset.portrait));
    });
    for (const t of TARGETS) {
      const li = document.createElement("li");
      li.className = "key-item" + (found.has(t.id) ? " is-found" : "");
      li.dataset.key = t.id;
      li.innerHTML = `<span class="thumb scene-portrait"></span><span class="name"></span>`;
      paintPortrait(li.querySelector(".thumb"), t);
      li.querySelector(".name").textContent = t.name;
      keyList.appendChild(li);
      if (found.has(t.id)) ensureRing(t);
    }

    function ensureRing(t) {
      if (rings.has(t.id)) return rings.get(t.id);
      const ring = el("div", "ring");
      ring.dataset.ring = t.id;
      world.appendChild(ring);
      rings.set(t.id, ring);
      return ring;
    }

    function layout() {
      world.style.width = WORLD_W * zoom + "px";
      world.style.height = WORLD_H * zoom + "px";
      for (const t of TARGETS) {
        const ring = rings.get(t.id);
        if (!ring) continue;
        ring.style.width = (t.w + 8) * SCALE * zoom + "px";
        ring.style.height = (t.h + 8) * SCALE * zoom + "px";
        ring.style.left = t.x * SCALE * zoom + "px";
        ring.style.top = t.y * SCALE * zoom + "px";
      }
      zoomLabel.textContent = Math.round(zoom * 100) + "%";
      updateChrome();
    }

    function zoomFloor() {
      const fitW = viewport.clientWidth / WORLD_W;
      const fitH = viewport.clientHeight / WORLD_H;
      if (!isFinite(fitW) || !isFinite(fitH)) return 0.16;
      return Math.max(0.02, Math.min(fitW, fitH));
    }

    function setZoom(next, clientX, clientY) {
      const rect = viewport.getBoundingClientRect();
      const cx = (clientX == null ? rect.left + rect.width / 2 : clientX) - rect.left;
      const cy = (clientY == null ? rect.top + rect.height / 2 : clientY) - rect.top;
      const worldX = (viewport.scrollLeft + cx) / zoom;
      const worldY = (viewport.scrollTop + cy) / zoom;
      zoom = clamp(next, zoomFloor(), 1.05);
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
      const cx = (viewport.scrollLeft + viewport.clientWidth / 2) / zoom / SCALE;
      const cy = (viewport.scrollTop + viewport.clientHeight / 2) / zoom / SCALE;
      where.textContent = WORLD_W * zoom <= viewport.clientWidth + 1 && WORLD_H * zoom <= viewport.clientHeight + 1
        ? "The whole coast" : placeName(cx, cy);
      const mw = shot.clientWidth || 1;
      const mh = shot.clientHeight || 1;
      viewbox.style.left = (viewport.scrollLeft / (WORLD_W * zoom)) * mw + "px";
      viewbox.style.top = (viewport.scrollTop / (WORLD_H * zoom)) * mh + "px";
      viewbox.style.width = Math.max(8, (viewport.clientWidth / (WORLD_W * zoom)) * mw) + "px";
      viewbox.style.height = Math.max(8, (viewport.clientHeight / (WORLD_H * zoom)) * mh) + "px";
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

    function tone(freq, delay, dur, gain) {
      if (muted) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime + delay;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    }

    function chime() {
      tone(523, 0, 0.22, 0.07);
      tone(784, 0.08, 0.2, 0.05);
    }

    function celebrate() {
      [523, 659, 784, 1046].forEach((freq, i) => tone(freq, i * 0.09, 0.2, 0.06));
    }

    function markFound(person) {
      if (found.has(person.id)) return;
      found.add(person.id);
      ensureRing(person);
      layout();
      const row = keyList.querySelector('[data-key="' + person.id + '"]');
      if (row) row.classList.add("is-found");
      const pop = el("div", "pop");
      pop.textContent = person.name;
      pop.style.left = person.x * SCALE * zoom + "px";
      pop.style.top = person.y * SCALE * zoom + "px";
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
      rings.forEach((ring) => ring.remove());
      rings.clear();
      keyList.querySelectorAll(".key-item").forEach((row) => row.classList.remove("is-found"));
      live.textContent = "Finds cleared.";
      updateChrome();
      persist();
    }

    function imagePoint(clientX, clientY) {
      const rect = world.getBoundingClientRect();
      const ix = (clientX - rect.left) / rect.width * IMG_W;
      const iy = (clientY - rect.top) / rect.height * IMG_H;
      return { ix, iy };
    }

    function showMiss(ix, iy) {
      miss.hidden = false;
      miss.style.left = ix * SCALE * zoom + "px";
      miss.style.top = iy * SCALE * zoom + "px";
      miss.classList.remove("go");
      void miss.offsetWidth;
      miss.classList.add("go");
    }

    let pan = null;
    let gesture = null;
    const onPointerDown = (e) => {
      gesture = {
        x: e.clientX,
        y: e.clientY,
        sl: viewport.scrollLeft,
        st: viewport.scrollTop,
      };
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
      if (!sceneReady) return;
      if (blockClick) {
        blockClick = false;
        return;
      }
      if (gesture) {
        const moved = Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y);
        const scrolled = Math.hypot(viewport.scrollLeft - gesture.sl, viewport.scrollTop - gesture.st);
        if (moved > 10 || scrolled > 8) return;
      }
      const { ix, iy } = imagePoint(e.clientX, e.clientY);
      let best = null;
      let bestD = Infinity;
      for (const t of TARGETS) {
        // Never grow the hit area into neighboring people when zoomed out.
        const d = Math.hypot((t.x - ix) / (t.w / 2), (t.y - iy) / (t.h / 2));
        if (d <= 1 && d < bestD) {
          best = t;
          bestD = d;
        }
      }
      if (!best) {
        showMiss(ix, iy);
        live.textContent = "Not quite.";
        return;
      }
      if (found.has(best.id)) return;
      markFound(best);
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
    shot.addEventListener("click", (e) => {
      const rect = shot.getBoundingClientRect();
      const nx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const ny = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      centerOn(nx * WORLD_W, ny * WORLD_H);
    });
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

    // One source image means the game, key, and overview share identical art.
    const picture = world.querySelector(".picture");
    const status = hunt.querySelector("#scene-status");
    const start = hunt.querySelector("#start");
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      picture.getContext("2d").drawImage(image, 0, 0, IMG_W, IMG_H);
      const miniCanvas = shot.querySelector("canvas");
      miniCanvas.getContext("2d").drawImage(picture, 0, 0, miniCanvas.width, miniCanvas.height);
      sceneReady = true;
      picture.dataset.ready = "true";
      status.hidden = true;
      start.disabled = false;
      start.textContent = "Start looking";
    };
    image.onerror = () => {
      if (disposed) return;
      status.textContent = "The map couldn't load. Refresh to try again.";
      start.textContent = "Refresh to load the map";
    };
    image.src = PICTURE;

    let placeTries = 0;
    const placeCamera = () => {
      if (viewport.clientWidth < 40 || viewport.clientHeight < 40 || placeTries > 40) {
        if (placeTries++ <= 40) requestAnimationFrame(placeCamera);
        return;
      }
      if (zoom < zoomFloor()) {
        zoom = zoomFloor();
        layout();
      }
      const targetLeft = Number.isFinite(saved.scrollLeft) && saved.introSeen
        ? saved.scrollLeft
        : IMG_W * 0.17 * SCALE * zoom - viewport.clientWidth / 2;
      const targetTop = Number.isFinite(saved.scrollTop) && saved.introSeen
        ? saved.scrollTop
        : IMG_H * 0.34 * SCALE * zoom - viewport.clientHeight / 2;
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
      disposed = true;
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
