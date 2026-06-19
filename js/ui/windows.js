"use strict";

// ─────────────────────────────────────────────
//  Window / Drag State
// ─────────────────────────────────────────────
let wins = {}, zz = 100, aw = null, drag = null;

// ─────────────────────────────────────────────
//  Window Management
// ─────────────────────────────────────────────
function setDockIndicator(appId, open, focused) {
  const btn = document.querySelector(`#tb-dock [data-app="${appId}"]`);
  if (!btn) return;
  btn.classList.toggle('open',    open);
  btn.classList.toggle('focused', open && focused);
}

function refreshDockIndicators() {
  document.querySelectorAll('#tb-dock .tb-dock-btn').forEach(b => {
    b.classList.remove('open', 'focused');
  });
  Object.values(wins).forEach(w => {
    if (!w.min) setDockIndicator(w.aid, true, w.id === aw);
  });
}

function openApp(id) {
  const ex = Object.values(wins).find(w => w.aid === id);
  if (ex) { ex.min ? unminimizeWindow(ex.id) : focusWindow(ex.id); return; }
  const app = APPS.find(a => a.id === id);
  if (!app) return;
  spawnWindow('w' + Date.now(), app, 40 + Math.random() * 160, 20 + Math.random() * 80);
}

function focusWindow(wid) {
  if (aw === wid) return;
  if (aw && wins[aw]) wins[aw].el.classList.remove('foc');
  aw = wid;
  const w = wins[wid]; if (!w) return;
  w.el.classList.add('foc');
  w.el.style.zIndex = ++zz;
  document.querySelectorAll('.tba').forEach(b => b.classList.remove('act'));
  const btn = document.getElementById('tba-' + wid);
  if (btn) btn.classList.add('act');
  refreshDockIndicators();
}

function closeWindow(wid) {
  const w = wins[wid]; if (!w) return;
  delete wins[wid];
  if (aw === wid) aw = null;
  const btn = document.getElementById('tba-' + wid);
  if (btn) btn.remove();

  const animationsOff = document.getElementById('os').classList.contains('no-animations');
  if (animationsOff) {
    w.el.remove();
    return;
  }
  w.el.classList.add('win-closing');
  w.el.addEventListener('animationend', () => w.el.remove(), { once: true });
  refreshDockIndicators();
}

function minimizeWindow(wid) {
  const w = wins[wid]; if (!w) return;
  w.min = true;
  const btn = document.getElementById('tba-' + wid);
  if (btn) btn.classList.remove('act');
  if (aw === wid) aw = null;

  const animationsOff = document.getElementById('os').classList.contains('no-animations');
  if (animationsOff) {
    w.el.style.display = 'none';
    return;
  }
  w.el.classList.add('win-minimizing');
  w.el.addEventListener('animationend', () => {
    w.el.classList.remove('win-minimizing');
    w.el.style.display = 'none';
  }, { once: true });
  refreshDockIndicators();
}

function unminimizeWindow(wid) {
  const w = wins[wid]; if (!w) return;
  w.min = false; w.el.style.display = ''; focusWindow(wid);
  refreshDockIndicators();
}

function maximizeWindow(wid) {
  const w = wins[wid]; if (!w) return;
  const lyr = document.getElementById('wlayer');
  if (w.max) {
    const s = w.sv;
    w.el.style.left = s.l+'px'; w.el.style.top = s.t+'px';
    w.el.style.width = s.w+'px'; w.el.style.height = s.h+'px';
    w.max = false;
  } else {
    const layerRect = lyr.getBoundingClientRect();
    const winRect   = w.el.getBoundingClientRect();
    w.sv = {
      l: winRect.left - layerRect.left,
      t: winRect.top  - layerRect.top,
      w: w.el.offsetWidth,
      h: w.el.offsetHeight,
    };
    w.el.style.left = '0px'; w.el.style.top = '0px';
    w.el.style.width = lyr.clientWidth+'px'; w.el.style.height = lyr.clientHeight+'px';
    w.max = true;
  }
}

// ─────────────────────────────────────────────
//  Spawn Window
// ─────────────────────────────────────────────
function spawnWindow(wid, app, x, y) {
  const el = document.createElement('div');
  el.id = wid; el.className = 'win foc';
  el.style.cssText = `width:${app.w}px;height:${app.h}px;left:${Math.round(x)}px;top:${Math.round(y)}px;z-index:${++zz}`;
  el.innerHTML = `
    <div class="wtb" onmousedown="beginDrag(event,'${wid}')" style="--app-gr:${app.gr}">
      <div class="wbtns">
        <button class="wb wbc" onclick="closeWindow('${wid}')"    title="Close"></button>
        <button class="wb wbm" onclick="minimizeWindow('${wid}')" title="Minimize"></button>
        <button class="wb wbx" onclick="maximizeWindow('${wid}')" title="Maximize"></button>
      </div>
      <div class="wtb-meta">
        <div class="wtb-app-icon" style="background:${app.gr}">
          <i class="ti ${app.ic}" style="font-size:10px;color:white" aria-hidden="true"></i>
        </div>
        <span class="wtb-title">${app.name}</span>
      </div>
    </div>
    <div class="wc">${buildAppContent(app.id)}</div>
    ${['e','w','s','n','se','sw','ne','nw'].map(d =>
      `<div class="rh ${d}" onmousedown="beginResize(event,'${wid}','${d}')"></div>`
    ).join('')}
  `;
  el.addEventListener('mousedown', () => focusWindow(wid));
  document.getElementById('wlayer').appendChild(el);

  el.classList.add('win-entering');
  el.addEventListener('animationend', () => el.classList.remove('win-entering'), { once: true });

  wins[wid] = { id: wid, el, aid: app.id, min: false, max: false, sv: null };
  addTaskbarButton(wid, app);
  focusWindow(wid);
  setTimeout(() => postInitApp(app.id, wid), 90);
}

// ─────────────────────────────────────────────
//  Drag & Resize
// ─────────────────────────────────────────────
function beginDrag(e, wid) {
  if (e.button !== 0 || e.target.closest('.wbtns')) return;
  e.preventDefault();
  const w = wins[wid]; if (!w || w.max) return;
  const lyr = document.getElementById('wlayer');
  const layerRect = lyr.getBoundingClientRect();
  const winRect   = w.el.getBoundingClientRect();
  drag = {
    t: 'drag', wid,
    ox: e.clientX - (winRect.left - layerRect.left),
    oy: e.clientY - (winRect.top  - layerRect.top),
  };
}

function beginResize(e, wid, dir) {
  if (e.button !== 0) return;
  e.preventDefault(); e.stopPropagation();
  const w = wins[wid]; if (!w || w.max) return;
  drag = { t:'resize', wid, dir, sx:e.clientX, sy:e.clientY,
           sw:w.el.offsetWidth, sh:w.el.offsetHeight,
           sl:parseInt(w.el.style.left||0), st:parseInt(w.el.style.top||0) };
}

function onMouseMove(e) {
  if (!drag) return;
  const w = wins[drag.wid]; if (!w) { drag=null; return; }
  const lyr = document.getElementById('wlayer');
  const lw = lyr.clientWidth, lh = lyr.clientHeight;
  if (drag.t === 'drag') {
    w.el.style.left = Math.max(0, Math.min(e.clientX - drag.ox, lw - w.el.offsetWidth))  + 'px';
    w.el.style.top  = Math.max(0, Math.min(e.clientY - drag.oy, lh - w.el.offsetHeight)) + 'px';
  } else {
    const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy, d=drag.dir;
    const MW=200, MH=130;
    let nw=drag.sw, nh=drag.sh, nl=drag.sl, nt=drag.st;
    if (d.includes('e')) nw = Math.max(MW, drag.sw+dx);
    if (d.includes('s')) nh = Math.max(MH, drag.sh+dy);
    if (d.includes('w')) { nw = Math.max(MW, drag.sw-dx); nl = drag.sl+(drag.sw-nw); }
    if (d.includes('n')) { nh = Math.max(MH, drag.sh-dy); nt = drag.st+(drag.sh-nh); }
    w.el.style.width=nw+'px'; w.el.style.height=nh+'px';
    w.el.style.left=nl+'px';  w.el.style.top=nt+'px';
  }
}

// ─────────────────────────────────────────────
//  Taskbar app buttons
// ─────────────────────────────────────────────
function addTaskbarButton(wid, app) {
  const c = document.getElementById('tbapps');
  const b = document.createElement('button');
  b.className = 'tbb tba act'; b.id = 'tba-' + wid;
  b.innerHTML = `
    <div class="tbb-icon" style="background:${app.gr}">
      <i class="ti ${app.ic}" style="font-size:9px;color:white" aria-hidden="true"></i>
    </div>
    <span>${app.name}</span>
  `;
  b.addEventListener('click', () => {
    const w = wins[wid]; if (!w) return;
    if (w.min) unminimizeWindow(wid);
    else if (aw === wid) minimizeWindow(wid);
    else focusWindow(wid);
  });
  c.appendChild(b);
}