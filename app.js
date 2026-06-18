/* =============================================
   LumiOS — app.js  (full rewrite)
   ============================================= */
"use strict";

// ─────────────────────────────────────────────
//  App Registry
// ─────────────────────────────────────────────
const APPS = [
  { id:'welcome',    name:'Welcome',    ic:'ti-sparkles',  gr:'linear-gradient(135deg,#9333ea,#e11d9c)', w:472, h:328 },
  { id:'clock',      name:'Clock',      ic:'ti-clock',     gr:'linear-gradient(135deg,#f59e0b,#f97316)', w:380, h:420 },
  { id:'calendar',   name:'Calendar',   ic:'ti-calendar',  gr:'linear-gradient(135deg,#06b6d4,#3b82f6)', w:580, h:460 },
  { id:'calculator', name:'Calculator', ic:'ti-calculator', gr:'linear-gradient(135deg,#0077ff,#00c2ff)', w:252, h:382 },
  { id:'notes',      name:'Notes',      ic:'ti-notebook',   gr:'linear-gradient(135deg,#f59e0b,#fbbf24)', w:374, h:308 },
  { id:'terminal',   name:'Terminal',   ic:'ti-terminal-2', gr:'linear-gradient(135deg,#059669,#34d399)', w:442, h:286 },
  { id:'files',      name:'Files',      ic:'ti-folder',     gr:'linear-gradient(135deg,#e11d48,#f97316)', w:420, h:325 },
  { id:'settings',   name:'Settings',   ic:'ti-settings',   gr:'linear-gradient(135deg,#0ea5e9,#6366f1)', w:420, h:390 },
  { id:'widgets', name:'Widgets', ic:'ti-layout-dashboard', gr:'linear-gradient(135deg,#7c3aed,#0ea5e9)', w:460, h:400 },
];

// ─────────────────────────────────────────────
//  Global OS Settings State
// ─────────────────────────────────────────────
const OS_SETTINGS = {
  particles: true,
  transparency:  true,
  darkMode:      true,
  animations:    true,
  accent:        '#6366f1',
  accentRgb:     '99,102,241',
  brightness:    100,
  notifications: true,
  notifDuration: 3200,
  autoLock:      false,
  screensaver:   5,
  widgets: true,
  wallpaper:     'default',  // ← add this
};


// ─────────────────────────────────────────────
//  Particle System
// ─────────────────────────────────────────────
const PARTICLE_COUNT = 100;
let particles = [];
let particleRaf = null;
let particleCanvas = null;
let particleCtx = null;

function initParticles() {
  particleCanvas = document.getElementById('particle-canvas');
  if (!particleCanvas) return;
  particleCtx = particleCanvas.getContext('2d');

  sizeParticleCanvas();
  window.addEventListener('resize', sizeParticleCanvas);

  spawnParticles();
  tickParticles();
}

function sizeParticleCanvas() {
  if (!particleCanvas) return;
  // Match physical pixels on HiDPI screens
  const dpr = window.devicePixelRatio || 1;
  particleCanvas.width  = window.innerWidth  * dpr;
  particleCanvas.height = window.innerHeight * dpr;
  if (particleCtx) particleCtx.scale(dpr, dpr);
}

function spawnParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(makeParticle(true));
  }
}

function makeParticle(randomY = false) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  return {
    x:       Math.random() * W,
    y:       randomY ? Math.random() * H : H + 4,
    r:       0.8 + Math.random() * 2.2,      // radius
    opacity: 0.1 + Math.random() * 0.45,     // subtle range
    speed:   0.12 + Math.random() * 0.28,    // very slow upward drift
    drift:   (Math.random() - 0.5) * 0.08,  // gentle horizontal wander
    wobble:  Math.random() * Math.PI * 2,    // phase offset for sine wobble
  };
}

function tickParticles() {
  // Pause cleanly when animations are disabled
  if (document.getElementById('os').classList.contains('no-animations')) {
    particleCanvas.style.opacity = '0';
    particleRaf = requestAnimationFrame(tickParticles);
    return;
  }

  particleCanvas.style.opacity = '1';
  const ctx = particleCtx;
  const W = window.innerWidth;
  const H = window.innerHeight;

  ctx.clearRect(0, 0, W, H);

  const time = performance.now() * 0.0006; // slow time base for wobble

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // Update position
    p.y -= p.speed;
    p.x += p.drift + Math.sin(time + p.wobble) * 0.06; // gentle sine wander

    // Respawn at bottom when particle exits top
    if (p.y < -4) particles[i] = makeParticle(false);

    // Draw
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
    ctx.fill();
  }

  particleRaf = requestAnimationFrame(tickParticles);
}
// ─────────────────────────────────────────────
//  Window / Drag State
// ─────────────────────────────────────────────
let wins = {}, zz = 100, aw = null, drag = null;

// ─────────────────────────────────────────────
//  Uptime tracker
// ─────────────────────────────────────────────
const OS_BOOT_TIME = Date.now();
let uptimeInterval = null;

// ─────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────
function init() {
  applyAccent(OS_SETTINGS.accent, false);
  renderDesktopIcons();
  renderStartMenuApps(APPS);
  renderPinnedDock();
  updateClock();
  setInterval(updateClock, 1000);
  initParticles();
  initWidgets();


  setTimeout(() => openApp('welcome'), 200);

  // Close overlays on desktop click
  document.getElementById('osbg').addEventListener('mousedown', e => {
    if (!e.target.closest('#smenu')      && !e.target.closest('#smbtn'))          closeStartMenu();
    if (!e.target.closest('#volume-popup') && !e.target.closest('#vol-btn'))      closeVolumePopup();
    if (!e.target.closest('#calendar-popup') && !e.target.closest('.tray-clock-btn')) closeCalendar();
    if (!e.target.closest('#ctx-menu'))                                            closeContextMenu(); // ← add
  });

  // Right-click on desktop background opens context menu
  document.getElementById('osbg').addEventListener('contextmenu', e => {
    // Only trigger on the background itself, not on windows or desktop icons
    if (e.target.closest('#wlayer') || e.target.closest('#tbar') || e.target.closest('#smenu')) return;
    e.preventDefault();
    closeStartMenu();
    closeVolumePopup();
    closeCalendar();
    showContextMenu(e.clientX, e.clientY);
  });

  // Also close on right-click elsewhere, and on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeContextMenu();
  });

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   () => { drag = null; });
}

// ─────────────────────────────────────────────
//  Clock
// ─────────────────────────────────────────────
function updateClock() {
  const now = new Date();

  const time = now.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const trayDate = now.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const bigDate = now.toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const el = id => document.getElementById(id);

  if (el('tclk')) {
    el('tclk').textContent = time;
  }

  if (el('tdate')) {
    el('tdate').textContent = trayDate;
  }

  if (el('big-time')) {
    el('big-time').textContent = time;
  }

  if (el('big-date')) {
    el('big-date').textContent = bigDate;
  }
}

// ─────────────────────────────────────────────
//  Notifications
// ─────────────────────────────────────────────
let notifTimer;
function notify(msg) {
  if (!OS_SETTINGS.notifications) return;
  document.getElementById('nmsg').textContent = msg;
  const el = document.getElementById('notif');
  el.style.display = 'block';
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => { el.style.display = 'none'; }, OS_SETTINGS.notifDuration);
}

// ─────────────────────────────────────────────
//  Desktop Icons  (single-click to open)
// ─────────────────────────────────────────────
function renderDesktopIcons() {
  document.getElementById('dkicons').innerHTML = APPS.map(a => `
    <div class="dki" onclick="openApp('${a.id}')" title="${a.name}" role="listitem">
      <div class="dki-icon" style="background:${a.gr}">
        <i class="ti ${a.ic}" aria-hidden="true"></i>
      </div>
      <span class="dki-label">${a.name}</span>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
//  Pinned Dock
// ─────────────────────────────────────────────
function renderPinnedDock() {
  const dock = document.getElementById('tb-dock');
  if (!dock) return;
  dock.innerHTML = APPS.map(a => `
    <button class="tb-dock-btn" data-app="${a.id}" onclick="openApp('${a.id}')" title="${a.name}">
      <div class="tb-dock-icon" style="background:${a.gr}">
        <i class="ti ${a.ic}" aria-hidden="true"></i>
      </div>
    </button>
  `).join('');
}

// ─────────────────────────────────────────────
//  Start Menu
// ─────────────────────────────────────────────
function renderStartMenuApps(list) {
  document.getElementById('smgrid').innerHTML = list.map(a => `
    <div class="sm-app" onclick="openApp('${a.id}'); closeStartMenu();" role="listitem">
      <div class="sm-app-icon" style="background:${a.gr}">
        <i class="ti ${a.ic}" aria-hidden="true"></i>
      </div>
      <span>${a.name}</span>
    </div>
  `).join('');
}

function filterStartMenu(q) {
  renderStartMenuApps(APPS.filter(a => a.name.toLowerCase().includes(q.toLowerCase())));
}

function toggleStartMenu() {
  const m = document.getElementById('smenu');
  const open = m.style.display === 'block';
  m.style.display = open ? 'none' : 'block';
  document.getElementById('smbtn').setAttribute('aria-expanded', !open);
  if (!open) setTimeout(() => document.getElementById('srch').focus(), 50);
}
function closeStartMenu() { document.getElementById('smenu').style.display = 'none'; }

// ─────────────────────────────────────────────
//  Tray — Wi-Fi
// ─────────────────────────────────────────────
let wifiOn = true;
function toggleWifi() {
  wifiOn = !wifiOn;
  const icon = document.getElementById('wifi-icon');
  icon.className = wifiOn ? 'ti ti-wifi' : 'ti ti-wifi-off';
  document.getElementById('wifi-btn').classList.toggle('tray-active', wifiOn);
  notify(wifiOn ? 'Wi-Fi connected' : 'Wi-Fi disconnected');
}

// ─────────────────────────────────────────────
//  Tray — Volume
// ─────────────────────────────────────────────
let volOpen = false;
let currentVolume = 80;

function toggleVolume() {
  volOpen = !volOpen;
  document.getElementById('volume-popup').classList.toggle('visible', volOpen);
  document.getElementById('vol-btn').classList.toggle('tray-active', volOpen);
}

function closeVolumePopup() {
  volOpen = false;
  document.getElementById('volume-popup').classList.remove('visible');
  document.getElementById('vol-btn').classList.remove('tray-active');
}

function setVolume(val) {
  currentVolume = parseInt(val, 10);
  const slider    = document.getElementById('vol-slider');
  const pct       = document.getElementById('vol-pct');
  const trayIcon  = document.getElementById('volume-icon');
  const popupIcon = document.getElementById('vol-popup-icon');
  if (slider) slider.value = currentVolume;
  if (pct)    pct.textContent = currentVolume + '%';

  const cls = currentVolume === 0 ? 'ti ti-volume-off'
            : currentVolume < 40  ? 'ti ti-volume-2'
                                  : 'ti ti-volume';
  if (trayIcon)  trayIcon.className  = cls;
  if (popupIcon) popupIcon.className = cls;

  // Apply to any real media on the page
  document.querySelectorAll('audio, video').forEach(m => { m.volume = currentVolume / 100; });
}

// ─────────────────────────────────────────────
//  Tray — Calendar
// ─────────────────────────────────────────────
let calOpen = false, calYear, calMonth;
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function showCalendar() {
  calOpen = !calOpen;
  const popup = document.getElementById('calendar-popup');
  popup.classList.toggle('visible', calOpen);
  document.querySelector('.tray-clock-btn').classList.toggle('tray-active', calOpen);
  if (calOpen) {
    const now = new Date();
    calYear = now.getFullYear(); calMonth = now.getMonth();
    renderCalendar();
  }
}

function closeCalendar() {
  calOpen = false;
  document.getElementById('calendar-popup').classList.remove('visible');
  const btn = document.querySelector('.tray-clock-btn');
  if (btn) btn.classList.remove('tray-active');
}

function renderCalendar() {
  const popup       = document.getElementById('calendar-popup');
  const now         = new Date();
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let cells = '';
  for (let i = 0; i < firstDay; i++)
    cells += '<div class="cal-cell empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const today = d === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
    cells += `<div class="cal-cell${today ? ' today' : ''}">${d}</div>`;
  }

  popup.innerHTML = `
    <div class="cal-header">
      <button class="cal-nav" onclick="calNav(-1)"><i class="ti ti-chevron-left"></i></button>
      <span class="cal-month">${MONTH_NAMES[calMonth]} ${calYear}</span>
      <button class="cal-nav" onclick="calNav(1)"><i class="ti ti-chevron-right"></i></button>
    </div>
    <div class="cal-day-names">${DAY_NAMES.map(d => `<div>${d}</div>`).join('')}</div>
    <div class="cal-grid">${cells}</div>
    <div class="cal-footer">
      ${now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
    </div>
  `;
}

function calNav(dir) {
  calMonth += dir;
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0;  calYear++; }
  renderCalendar();
}

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
  // Reset all dock buttons first
  document.querySelectorAll('#tb-dock .tb-dock-btn').forEach(b => {
    b.classList.remove('open', 'focused');
  });
  // Then reapply based on current window state
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
    // Capture geometry from actual rendered position, relative to the layer —
    // not from parsing inline style strings, which can be stale or unitless.
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
  // Offset captured from real rendered position, not parsed inline style strings
  drag = {
    t: 'drag',
    wid,
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
//  App content router
// ─────────────────────────────────────────────
function buildAppContent(id) {
  switch (id) {
    case 'welcome':    return buildWelcome();
    case 'clock':      return buildClock();
    case 'calendar':   return buildCalendarApp();
    case 'calculator': return buildCalculator();
    case 'notes':      return buildNotes();
    case 'terminal':   return buildTerminal();
    case 'files':      return buildFiles();
    case 'widgets':    return buildWidgets();
    case 'settings':   return buildSettings();
    default: return '<div style="padding:20px;color:rgba(255,255,255,.5)">App not found.</div>';
  }
}

function postInitApp(aid, wid) {
  if (aid === 'terminal') {
    const inp = document.querySelector('#' + wid + ' .tin');
    if (inp) inp.focus();
  }
  if (aid === 'settings') startUptimeTicker();
  if (aid === 'clock')    startClockApp(wid);
  if (aid === 'calendar') initCalendarApp(wid);
  if (aid === 'files')    filesInit(wid);
  if (aid === 'widgets') refreshWidgetsApp();
}

// ─────────────────────────────────────────────
//  APP: Welcome
// ─────────────────────────────────────────────
function buildWelcome() {
  return `
    <div class="welcome-wrap">
      <div class="welcome-header">
        <div class="welcome-logo">
          <i class="ti ti-sparkles" aria-hidden="true"></i>
        </div>
        <div>
          <div class="welcome-title">Welcome to LumiOS</div>
          <div class="welcome-sub">A luminous computing experience</div>
        </div>
      </div>
      <div class="welcome-tips">
        <strong>Tips:</strong> Click desktop icons to open apps &middot;
        Drag windows by their title bar &middot;
        Resize from any edge or corner &middot;
        Use the dock icons in the taskbar for quick launch
      </div>
      <div class="welcome-grid">
        ${APPS.filter(a => a.id !== 'welcome').map(a => `
          <div class="welcome-app-btn" onclick="openApp('${a.id}')">
            <div class="welcome-app-icon" style="background:${a.gr}">
              <i class="ti ${a.ic}" aria-hidden="true"></i>
            </div>
            <div>
              <div class="welcome-app-name">${a.name}</div>
              <div class="welcome-app-hint">Open app</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
//  APP: Clock (Time, Stopwatch, Alarm)
// ─────────────────────────────────────────────
let clockState = { activeTab: 'time', stopwatchRunning: false, stopwatchMs: 0, alarms: [] };
let clockIntervals = {};

function buildClock() {
  return `
    <div class="clock-wrap">
      <div class="clock-tabs">
        <button class="clock-tab active" data-tab="time" onclick="switchClockTab('time',this)">
          <i class="ti ti-clock"></i> Time
        </button>
        <button class="clock-tab" data-tab="stopwatch" onclick="switchClockTab('stopwatch',this)">
          <i class="ti ti-player-stop"></i> Stopwatch
        </button>
        <button class="clock-tab" data-tab="alarm" onclick="switchClockTab('alarm',this)">
          <i class="ti ti-alarm"></i> Alarm
        </button>
      </div>

      <div class="clock-content">
        <!-- TIME TAB -->
        <div id="clock-time-panel" class="clock-panel active">
          <div class="clock-analog-wrap">
            <canvas id="clock-canvas" width="280" height="280" style="max-width:100%;height:auto;border-radius:50%"></canvas>
          </div>
          <div class="clock-digital">
            <div id="clock-time-display">00:00:00</div>
            <div id="clock-date-display">Loading...</div>
          </div>
        </div>

        <!-- STOPWATCH TAB -->
        <div id="clock-stopwatch-panel" class="clock-panel">
          <div class="stopwatch-display">
            <div id="stopwatch-time">00:00:00</div>
          </div>
          <div class="stopwatch-controls">
            <button class="stopwatch-btn" id="stopwatch-start-btn" onclick="toggleStopwatch()">
              <i class="ti ti-player-play"></i> Start
            </button>
            <button class="stopwatch-btn stopwatch-btn-secondary" onclick="resetStopwatch()">
              <i class="ti ti-refresh"></i> Reset
            </button>
          </div>
          <div class="stopwatch-laps">
            <div id="stopwatch-laps-list" style="font-size:11px;color:rgba(255,255,255,0.6);max-height:140px;overflow-y:auto">
              <div style="text-align:center;padding:20px 0">No laps recorded</div>
            </div>
          </div>
        </div>

        <!-- ALARM TAB -->
        <div id="clock-alarm-panel" class="clock-panel">
          <div class="alarm-controls">
            <div class="alarm-time-input">
              <input type="time" id="alarm-time-input" value="07:00" onmousedown="event.stopPropagation()">
              <button class="alarm-btn-add" onclick="addAlarm()">
                <i class="ti ti-plus"></i> Add Alarm
              </button>
            </div>
          </div>
          <div id="alarms-list" class="alarms-list">
            <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);font-size:12px">
              No alarms set. Add one to get started!
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function switchClockTab(tab, el) {
  clockState.activeTab = tab;
  // Update tab buttons
  el.closest('.clock-tabs').querySelectorAll('.clock-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  // Update panels
  el.closest('.clock-wrap').querySelectorAll('.clock-panel').forEach(p => p.classList.remove('active'));
  const panelId = `clock-${tab}-panel`;
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
}

function startClockApp(wid) {
  // Draw analog clock
  drawAnalogClock();
  // Update digital time
  updateClockDisplay();
  // Start intervals
  if (clockIntervals.main) clearInterval(clockIntervals.main);
  clockIntervals.main = setInterval(() => {
    drawAnalogClock();
    updateClockDisplay();
  }, 1000);

  if (clockIntervals.stopwatch) clearInterval(clockIntervals.stopwatch);
  if (clockState.stopwatchRunning) {
    clockIntervals.stopwatch = setInterval(updateStopwatch, 10);
  }

  renderAlarmsList();
}

function updateClockDisplay() {
  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2,'0') + ':' +
                  String(now.getMinutes()).padStart(2,'0') + ':' +
                  String(now.getSeconds()).padStart(2,'0');
  const dateStr = now.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' });
  
  const timeEl = document.getElementById('clock-time-display');
  const dateEl = document.getElementById('clock-date-display');
  if (timeEl) timeEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = dateStr;
}

function drawAnalogClock() {
  const canvas = document.getElementById('clock-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const radius = canvas.width / 2;
  const centerX = radius;
  const centerY = radius;
  
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  // Clear canvas
  ctx.fillStyle = 'rgba(14, 14, 32, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw clock face
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw hour markers
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x1 = centerX + Math.cos(ang) * (radius - 20);
    const y1 = centerY + Math.sin(ang) * (radius - 20);
    const x2 = centerX + Math.cos(ang) * (radius - 8);
    const y2 = centerY + Math.sin(ang) * (radius - 8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = i % 3 === 0 ? 3 : 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Draw center dot
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Hour hand
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 4;
  const hourAng = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + Math.cos(hourAng) * (radius - 80), centerY + Math.sin(hourAng) * (radius - 80));
  ctx.stroke();
  
  // Minute hand
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  const minAng = ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + Math.cos(minAng) * (radius - 50), centerY + Math.sin(minAng) * (radius - 50));
  ctx.stroke();
  
  // Second hand
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
  ctx.lineWidth = 1.5;
  const secAng = (seconds / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + Math.cos(secAng) * (radius - 40), centerY + Math.sin(secAng) * (radius - 40));
  ctx.stroke();
}

// ── Stopwatch Functions ──
function toggleStopwatch() {
  clockState.stopwatchRunning = !clockState.stopwatchRunning;
  const btn = document.getElementById('stopwatch-start-btn');
  if (!btn) return;
  
  if (clockState.stopwatchRunning) {
    btn.innerHTML = '<i class="ti ti-player-pause"></i> Pause';
    btn.classList.add('running');
    if (clockIntervals.stopwatch) clearInterval(clockIntervals.stopwatch);
    clockIntervals.stopwatch = setInterval(updateStopwatch, 10);
  } else {
    btn.innerHTML = '<i class="ti ti-player-play"></i> Start';
    btn.classList.remove('running');
    if (clockIntervals.stopwatch) clearInterval(clockIntervals.stopwatch);
  }
}

function updateStopwatch() {
  clockState.stopwatchMs += 10;
  const totalSecs = Math.floor(clockState.stopwatchMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const ms = Math.floor((clockState.stopwatchMs % 1000) / 10);
  
  const display = String(hours).padStart(2, '0') + ':' +
                  String(minutes).padStart(2, '0') + ':' +
                  String(seconds).padStart(2, '0');
  
  const el = document.getElementById('stopwatch-time');
  if (el) el.textContent = display;
}

function resetStopwatch() {
  clockState.stopwatchRunning = false;
  clockState.stopwatchMs = 0;
  if (clockIntervals.stopwatch) clearInterval(clockIntervals.stopwatch);
  
  const btn = document.getElementById('stopwatch-start-btn');
  if (btn) {
    btn.innerHTML = '<i class="ti ti-player-play"></i> Start';
    btn.classList.remove('running');
  }
  
  const display = document.getElementById('stopwatch-time');
  if (display) display.textContent = '00:00:00';
  
  const lapsList = document.getElementById('stopwatch-laps-list');
  if (lapsList) lapsList.innerHTML = '<div style="text-align:center;padding:20px 0">No laps recorded</div>';
}

// ── Alarm Functions ──
function addAlarm() {
  const input = document.getElementById('alarm-time-input');
  if (!input) return;
  
  const timeStr = input.value;
  if (!timeStr) {
    notify('Please select a time');
    return;
  }
  
  const alarm = {
    id: Date.now(),
    time: timeStr,
    enabled: true,
    label: 'Alarm'
  };
  
  clockState.alarms.push(alarm);
  input.value = '';
  renderAlarmsList();
  notify('Alarm set for ' + timeStr);
}

function deleteAlarm(alarmId) {
  clockState.alarms = clockState.alarms.filter(a => a.id !== alarmId);
  renderAlarmsList();
  notify('Alarm deleted');
}

function toggleAlarm(alarmId) {
  const alarm = clockState.alarms.find(a => a.id === alarmId);
  if (alarm) {
    alarm.enabled = !alarm.enabled;
    renderAlarmsList();
  }
}

function renderAlarmsList() {
  const list = document.getElementById('alarms-list');
  if (!list) return;
  
  if (clockState.alarms.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);font-size:12px">No alarms set. Add one to get started!</div>';
    return;
  }
  
  list.innerHTML = clockState.alarms.map(alarm => `
    <div class="alarm-item ${alarm.enabled ? '' : 'disabled'}">
      <div class="alarm-item-time">${alarm.time}</div>
      <div class="alarm-item-label">${alarm.label}</div>
      <div class="alarm-item-controls">
        <button class="alarm-toggle" onclick="toggleAlarm(${alarm.id})" title="Toggle alarm">
          <i class="ti ${alarm.enabled ? 'ti-bell' : 'ti-bell-off'}"></i>
        </button>
        <button class="alarm-delete" onclick="deleteAlarm(${alarm.id})" title="Delete alarm">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}


// ─────────────────────────────────────────────
//  APP: Calendar  (Month view + Agenda, with events)
// ─────────────────────────────────────────────

// Event store: { 'YYYY-MM-DD': [{id, title, time, color}, ...] }
let CAL_EVENTS = {};
let calEventsSeeded = false;
const CAL_COLORS = ['#6366f1','#ec4899','#10b981','#f97316','#0ea5e9','#f59e0b'];

// Per-window-instance view state (single Calendar window at a time, like Clock/Settings)
let capp = { year: 0, month: 0, selectedDate: null, tab: 'month' };

function calKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function calParse(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function cappEsc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function cappFormatTime(t) {
  const [h, m] = (t || '09:00').split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2,'0')} ${period}`;
}

function calSeedEvents() {
  if (calEventsSeeded) return;
  calEventsSeeded = true;
  const now = new Date();
  const addDays = n => { const d = new Date(now); d.setDate(d.getDate() + n); return d; };
  CAL_EVENTS[calKey(now)] = [
    { id: 1, title: 'Team Standup',  time: '09:00', color: CAL_COLORS[0] },
    { id: 2, title: 'Design Review', time: '14:30', color: CAL_COLORS[2] },
  ];
  CAL_EVENTS[calKey(addDays(2))]  = [{ id: 3, title: 'Dentist Appointment', time: '11:00', color: CAL_COLORS[1] }];
  CAL_EVENTS[calKey(addDays(5))]  = [{ id: 4, title: 'Project Deadline',   time: '17:00', color: CAL_COLORS[3] }];
  CAL_EVENTS[calKey(addDays(-3))] = [{ id: 5, title: 'Budget Review',      time: '10:00', color: CAL_COLORS[4] }];
}

function buildCalendarApp() {
  return `
    <div class="capp-wrap">
      <div class="capp-tabs">
        <button class="capp-tab active" data-tab="month" onclick="cappSwitchTab('month',this)">
          <i class="ti ti-calendar"></i> Month
        </button>
        <button class="capp-tab" data-tab="agenda" onclick="cappSwitchTab('agenda',this)">
          <i class="ti ti-list-details"></i> Agenda
        </button>
      </div>
      <div class="capp-content">
        <div id="capp-month-panel" class="capp-panel active"></div>
        <div id="capp-agenda-panel" class="capp-panel"></div>
      </div>
    </div>`;
}

function initCalendarApp(wid) {
  calSeedEvents();
  const now = new Date();
  capp.year = now.getFullYear();
  capp.month = now.getMonth();
  capp.selectedDate = calKey(now);
  capp.tab = 'month';
  cappRenderMonth();
  cappRenderAgenda();
}

function cappSwitchTab(tab, el) {
  capp.tab = tab;
  el.closest('.capp-tabs').querySelectorAll('.capp-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  el.closest('.capp-wrap').querySelectorAll('.capp-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`capp-${tab}-panel`);
  if (panel) panel.classList.add('active');
  if (tab === 'agenda') cappRenderAgenda();
}

// ── Month view ──
function cappRenderMonth() {
  const panel = document.getElementById('capp-month-panel');
  if (!panel) return;

  const now = new Date();
  const firstDay    = new Date(capp.year, capp.month, 1).getDay();
  const daysInMonth = new Date(capp.year, capp.month + 1, 0).getDate();

  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += '<div class="capp-cell capp-cell-empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj    = new Date(capp.year, capp.month, d);
    const key        = calKey(dateObj);
    const isToday    = d === now.getDate() && capp.month === now.getMonth() && capp.year === now.getFullYear();
    const isSelected = key === capp.selectedDate;
    const evts       = CAL_EVENTS[key] || [];
    const dots       = evts.slice(0, 3).map(e => `<span class="capp-dot" style="background:${e.color}"></span>`).join('');
    cells += `
      <div class="capp-cell${isToday ? ' capp-today' : ''}${isSelected ? ' capp-selected' : ''}" onclick="cappSelectDay('${key}')">
        <span class="capp-cell-num">${d}</span>
        ${evts.length ? `<div class="capp-dots">${dots}</div>` : ''}
      </div>`;
  }

  panel.innerHTML = `
    <div class="capp-month-layout">
      <div class="capp-grid-col">
        <div class="capp-grid-header">
          <button class="app-btn" onclick="cappNavMonth(-1)" title="Previous month"><i class="ti ti-chevron-left"></i></button>
          <span class="capp-grid-title">${MONTH_NAMES[capp.month]} ${capp.year}</span>
          <button class="app-btn" onclick="cappNavMonth(1)" title="Next month"><i class="ti ti-chevron-right"></i></button>
          <button class="app-btn capp-today-btn" onclick="cappGoToday()">Today</button>
        </div>
        <div class="capp-day-names">${DAY_NAMES.map(d => `<div>${d}</div>`).join('')}</div>
        <div class="capp-grid">${cells}</div>
      </div>
      <div class="capp-detail-col" id="capp-detail-col"></div>
    </div>`;

  cappRenderDetail();
}

function cappRenderDetail() {
  const col = document.getElementById('capp-detail-col');
  if (!col) return;

  const key     = capp.selectedDate;
  const dateObj = calParse(key);
  const label   = dateObj.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const evts    = (CAL_EVENTS[key] || []).slice().sort((a, b) => a.time.localeCompare(b.time));

  col.innerHTML = `
    <div class="capp-detail-date">${label}</div>
    <div class="capp-detail-list">
      ${evts.length ? evts.map(e => `
        <div class="capp-event-item">
          <span class="capp-event-dot" style="background:${e.color}"></span>
          <div class="capp-event-info">
            <div class="capp-event-title">${cappEsc(e.title)}</div>
            <div class="capp-event-time">${cappFormatTime(e.time)}</div>
          </div>
          <button class="capp-event-del" onclick="cappDeleteEvent('${key}',${e.id})" title="Delete">
            <i class="ti ti-x"></i>
          </button>
        </div>`).join('') : '<div class="capp-no-events">No events on this day</div>'}
    </div>
    <div class="capp-add-form">
      <input type="text" class="capp-input" id="capp-new-title" placeholder="Event title…"
             onmousedown="event.stopPropagation()" onkeydown="if(event.key==='Enter')cappAddEvent()">
      <div class="capp-add-row">
        <input type="time" class="capp-input capp-input-time" id="capp-new-time" value="09:00"
               onmousedown="event.stopPropagation()">
        <div class="capp-color-picker" id="capp-new-color-picker">
          ${CAL_COLORS.map((c, i) => `<div class="capp-color-dot${i === 0 ? ' capp-color-active' : ''}" style="background:${c}" data-color="${c}" onclick="cappPickColor(this)"></div>`).join('')}
        </div>
      </div>
      <button class="settings-btn" style="width:100%;justify-content:center;margin-top:4px" onclick="cappAddEvent()">
        <i class="ti ti-plus" style="font-size:12px"></i> Add Event
      </button>
    </div>`;
}

function cappSelectDay(key) {
  capp.selectedDate = key;
  cappRenderMonth();
}

function cappNavMonth(dir) {
  capp.month += dir;
  if (capp.month < 0)  { capp.month = 11; capp.year--; }
  if (capp.month > 11) { capp.month = 0;  capp.year++; }
  cappRenderMonth();
}

function cappGoToday() {
  const now = new Date();
  capp.year = now.getFullYear();
  capp.month = now.getMonth();
  capp.selectedDate = calKey(now);
  cappRenderMonth();
}

function cappPickColor(el) {
  el.parentElement.querySelectorAll('.capp-color-dot').forEach(d => d.classList.remove('capp-color-active'));
  el.classList.add('capp-color-active');
}

function cappAddEvent() {
  const titleInput = document.getElementById('capp-new-title');
  const timeInput  = document.getElementById('capp-new-time');
  const colorEl    = document.querySelector('#capp-new-color-picker .capp-color-active');
  const title = (titleInput?.value || '').trim();
  if (!title) { titleInput?.focus(); return; }

  const key = capp.selectedDate;
  if (!CAL_EVENTS[key]) CAL_EVENTS[key] = [];
  CAL_EVENTS[key].push({
    id: Date.now(),
    title,
    time: timeInput?.value || '09:00',
    color: colorEl?.dataset.color || CAL_COLORS[0],
  });

  notify(`Added "${title}"`);
  cappRenderMonth();
  cappRenderAgenda();
}

function cappDeleteEvent(key, id) {
  if (!CAL_EVENTS[key]) return;
  CAL_EVENTS[key] = CAL_EVENTS[key].filter(e => e.id !== id);
  if (CAL_EVENTS[key].length === 0) delete CAL_EVENTS[key];
  notify('Event deleted');
  cappRenderMonth();
  cappRenderAgenda();
}

// ── Agenda view ──
function cappRenderAgenda() {
  const panel = document.getElementById('capp-agenda-panel');
  if (!panel) return;

  const keys = Object.keys(CAL_EVENTS).sort(); // 'YYYY-MM-DD' sorts chronologically as text
  if (keys.length === 0) {
    panel.innerHTML = `<div class="capp-agenda-empty"><i class="ti ti-calendar-off"></i><div>No upcoming events</div></div>`;
    return;
  }

  const todayKey = calKey(new Date());
  panel.innerHTML = keys.map(key => {
    const dateObj = calParse(key);
    const label   = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const isToday = key === todayKey;
    const evts    = CAL_EVENTS[key].slice().sort((a, b) => a.time.localeCompare(b.time));
    return `
      <div class="capp-agenda-group">
        <div class="capp-agenda-date${isToday ? ' capp-agenda-today' : ''}">${label}${isToday ? ' · Today' : ''}</div>
        ${evts.map(e => `
          <div class="capp-agenda-item" onclick="cappJumpTo('${key}')">
            <span class="capp-event-dot" style="background:${e.color}"></span>
            <div class="capp-event-info">
              <div class="capp-event-title">${cappEsc(e.title)}</div>
              <div class="capp-event-time">${cappFormatTime(e.time)}</div>
            </div>
          </div>`).join('')}
      </div>`;
  }).join('');
}

function cappJumpTo(key) {
  const d = calParse(key);
  capp.year = d.getFullYear();
  capp.month = d.getMonth();
  capp.selectedDate = key;

  const wrap = document.querySelector('.capp-wrap');
  if (wrap) {
    wrap.querySelectorAll('.capp-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'month'));
    wrap.querySelectorAll('.capp-panel').forEach(p => p.classList.toggle('active', p.id === 'capp-month-panel'));
  }
  cappRenderMonth();
}

// ─────────────────────────────────────────────
//  APP: Calculator
// ─────────────────────────────────────────────
const CALC_BTNS = [
  ['AC','fn'],['±','fn'],['%','fn'],['÷','op'],
  ['7',''],['8',''],['9',''],['×','op'],
  ['4',''],['5',''],['6',''],['−','op'],
  ['1',''],['2',''],['3',''],['+','op'],
  ['0','wide'],['.',''],['=','eq'],
];
let cVal='0', cExpr='', cOp=null, cFirst=null, cJustOp=false;

function buildCalculator() {
  return `
    <div class="calc-wrap">
      <div class="calc-display">
        <div id="cexd"></div>
        <div id="cvd">0</div>
      </div>
      <div class="calc-grid">
        ${CALC_BTNS.map(([l,t]) =>
          `<button class="calc-btn ${t}" onclick="calcPress('${l}')">${l}</button>`
        ).join('')}
      </div>
    </div>`;
}

function calcPress(k) {
  const dv=document.getElementById('cvd'), de=document.getElementById('cexd');
  if (!dv) return;
  if (k==='AC')  { cVal='0'; cExpr=''; cOp=null; cFirst=null; cJustOp=false; }
  else if (k==='±') { const n=-parseFloat(cVal); cVal=isNaN(n)?'0':String(n); }
  else if (k==='%')  cVal=String(parseFloat(cVal)/100);
  else if ('÷×−+'.includes(k)) { cFirst=parseFloat(cVal); cOp=k; cExpr=cVal+' '+k; cJustOp=true; }
  else if (k==='=') {
    if (cOp && cFirst!==null) {
      const s=parseFloat(cVal);
      let r = cOp==='+'?cFirst+s:cOp==='−'?cFirst-s:cOp==='×'?cFirst*s:s!==0?cFirst/s:NaN;
      cExpr += (cJustOp?' '+cVal:'')+' =';
      cVal = isNaN(r)?'Error':String(parseFloat(r.toFixed(10)));
      cOp=null; cFirst=null; cJustOp=false;
    }
  } else if (k==='.') {
    if (cJustOp) { cVal='0.'; cJustOp=false; }
    else if (!cVal.includes('.')) cVal+='.';
  } else {
    if (cJustOp||cVal==='0'||cVal==='Error') { cVal=k; cJustOp=false; }
    else if (cVal.length<12) cVal+=k;
  }
  dv.textContent  = cVal.length>11 ? parseFloat(cVal).toExponential(3) : cVal;
  de.textContent  = cExpr;
}

// ─────────────────────────────────────────────
//  APP: Notes
// ─────────────────────────────────────────────
function buildNotes() {
  return `
    <div class="notes-wrap">
      <div class="app-toolbar">
        <button class="app-btn notes-btn-bold"      onclick="document.execCommand('bold',false,null)">B</button>
        <button class="app-btn notes-btn-italic"    onclick="document.execCommand('italic',false,null)">I</button>
        <button class="app-btn notes-btn-underline" onclick="document.execCommand('underline',false,null)">U</button>
        <div class="app-toolbar-sep"></div>
        <button class="app-btn" onclick="document.execCommand('insertUnorderedList',false,null)">• List</button>
        <button class="app-btn" onclick="document.execCommand('formatBlock',false,'h3')">Heading</button>
        <button class="app-btn" onclick="document.execCommand('formatBlock',false,'p')">Body</button>
      </div>
      <div id="notes-editor" contenteditable="true"
           onmousedown="event.stopPropagation()" aria-label="Notes editor">
        <p style="color:rgba(255,255,255,.3);font-style:italic">Start typing your notes here&hellip;</p>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
//  APP: Terminal
// ─────────────────────────────────────────────
const TERM_CMDS = {
  help:   () => 'Commands:\n  help        Show this help\n  whoami      Current user\n  date        Date & time\n  pwd         Working directory\n  ls          List files\n  uname       System info\n  echo [txt]  Print text\n  clear       Clear screen',
  whoami: () => 'lumi-user',
  date:   () => new Date().toLocaleString(),
  pwd:    () => '/home/lumi-user',
  ls:     () => 'Documents/  Downloads/  Desktop/  Pictures/  Music/\nnotes.md   config.json   README.txt',
  uname:  () => 'LumiOS 1.0.0 LumiCore x86_64',
  echo:   args => args.join(' ') || '',
  clear:  () => '__CLEAR__',
};

function buildTerminal() {
  return `
    <div class="term-wrap">
      <div class="term-output">
        <div class="term-welcome">LumiOS Terminal v1.0.0</div>
        <div class="term-hint">Type <span style="color:#4ade80">'help'</span> for commands.</div>
      </div>
      <div class="term-input-row">
        <span class="term-prompt">lumi@os:~$</span>
        <input type="text" class="tin" aria-label="Terminal input"
               onmousedown="event.stopPropagation()"
               onkeydown="if(event.key==='Enter'){termExec(this);this.value=''}">
      </div>
    </div>`;
}

function termExec(el) {
  const raw = el.value.trim(); if (!raw) return;
  const out = el.closest('.wc').querySelector('.term-output'); if (!out) return;
  const cmdLine = document.createElement('div');
  cmdLine.className = 'term-cmd'; cmdLine.textContent = 'lumi@os:~$ ' + raw;
  out.appendChild(cmdLine);
  const [cmd, ...args] = raw.split(' ');
  const fn = TERM_CMDS[cmd];
  if (fn) {
    const res = fn(args);
    if (res === '__CLEAR__') { out.innerHTML = ''; }
    else res.split('\n').forEach(line => {
      const d=document.createElement('div'); d.className='term-out'; d.textContent=line; out.appendChild(d);
    });
  } else {
    const e=document.createElement('div'); e.className='term-err';
    e.textContent=`lumish: ${cmd}: command not found`; out.appendChild(e);
  }
  out.scrollTop = out.scrollHeight;
}

// ─────────────────────────────────────────────
//  APP: Files
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  APP: Files
// ─────────────────────────────────────────────
const FS = {
  '/': {
    type: 'folder',
    children: ['home', 'usr', 'etc'],
  },
  '/home': {
    type: 'folder',
    children: ['lumi-user'],
  },
  '/home/lumi-user': {
    type: 'folder',
    children: ['Documents', 'Downloads', 'Pictures', 'Music', 'Desktop', 'notes.md', 'README.txt'],
  },
  '/home/lumi-user/Documents': {
    type: 'folder',
    children: ['report.pdf', 'budget.xlsx', 'resume.docx'],
  },
  '/home/lumi-user/Downloads': {
    type: 'folder',
    children: ['LumiOS-1.0.iso', 'photo-pack.zip', 'song.mp3'],
  },
  '/home/lumi-user/Pictures': {
    type: 'folder',
    children: ['wallpaper.png', 'screenshot.png', 'avatar.jpg'],
  },
  '/home/lumi-user/Music': {
    type: 'folder',
    children: ['track01.mp3', 'track02.mp3', 'playlist.m3u'],
  },
  '/home/lumi-user/Desktop': {
    type: 'folder',
    children: ['LumiOS.lnk'],
  },
  '/home/lumi-user/notes.md': {
    type: 'file', ext: 'md', size: '5 KB',
    content: '# My Notes\n\nWelcome to LumiOS!\n\n- Fast\n- Beautiful\n- Yours',
  },
  '/home/lumi-user/README.txt': {
    type: 'file', ext: 'txt', size: '2 KB',
    content: 'LumiOS — a luminous computing experience.\nBuilt with love.\n\nVersion 1.0.0',
  },
  '/home/lumi-user/Documents/report.pdf':   { type:'file', ext:'pdf',  size:'142 KB', content:null },
  '/home/lumi-user/Documents/budget.xlsx':  { type:'file', ext:'xlsx', size:'38 KB',  content:null },
  '/home/lumi-user/Documents/resume.docx':  { type:'file', ext:'docx', size:'55 KB',  content:null },
  '/home/lumi-user/Downloads/LumiOS-1.0.iso':  { type:'file', ext:'iso',  size:'2.1 GB', content:null },
  '/home/lumi-user/Downloads/photo-pack.zip':  { type:'file', ext:'zip',  size:'84 MB',  content:null },
  '/home/lumi-user/Downloads/song.mp3':        { type:'file', ext:'mp3',  size:'7.2 MB', content:null },
  '/home/lumi-user/Pictures/wallpaper.png':    { type:'file', ext:'png',  size:'4.1 MB', content:null },
  '/home/lumi-user/Pictures/screenshot.png':   { type:'file', ext:'png',  size:'1.8 MB', content:null },
  '/home/lumi-user/Pictures/avatar.jpg':       { type:'file', ext:'jpg',  size:'320 KB', content:null },
  '/home/lumi-user/Music/track01.mp3':         { type:'file', ext:'mp3',  size:'6.8 MB', content:null },
  '/home/lumi-user/Music/track02.mp3':         { type:'file', ext:'mp3',  size:'7.1 MB', content:null },
  '/home/lumi-user/Music/playlist.m3u':        { type:'file', ext:'m3u',  size:'1 KB',   content:null },
  '/home/lumi-user/Desktop/LumiOS.lnk':        { type:'file', ext:'lnk',  size:'1 KB',   content:null },
  '/usr': { type:'folder', children:['bin', 'lib'] },
  '/usr/bin': { type:'folder', children:['bash', 'ls', 'cat'] },
  '/usr/lib': { type:'folder', children:[] },
  '/usr/bin/bash': { type:'file', ext:'', size:'1.2 MB', content:null },
  '/usr/bin/ls':   { type:'file', ext:'', size:'148 KB', content:null },
  '/usr/bin/cat':  { type:'file', ext:'', size:'52 KB',  content:null },
  '/etc': { type:'folder', children:['config.json', 'hosts'] },
  '/etc/config.json': {
    type:'file', ext:'json', size:'1 KB',
    content: '{\n  "os": "LumiOS",\n  "version": "1.0.0",\n  "theme": "dark"\n}',
  },
  '/etc/hosts': {
    type:'file', ext:'', size:'1 KB',
    content: '127.0.0.1   localhost\n::1         localhost',
  },
};

// State per files window (keyed by wid)
const FILES_STATE = {};

function fsGetIcon(name, node) {
  if (node.type === 'folder') return { ic: 'ti-folder', color: 'rgba(250,185,10,.85)' };
  const ext = (node.ext || name.split('.').pop() || '').toLowerCase();
  const map = {
    md:   { ic:'ti-file-text',    color:'rgba(110,210,110,.85)' },
    txt:  { ic:'ti-file-text',    color:'rgba(200,200,200,.7)'  },
    json: { ic:'ti-braces',       color:'rgba(100,160,255,.85)' },
    pdf:  { ic:'ti-file-type-pdf',color:'rgba(240,80,80,.85)'   },
    xlsx: { ic:'ti-table',        color:'rgba(60,200,100,.85)'  },
    docx: { ic:'ti-file-word',    color:'rgba(80,140,240,.85)'  },
    png:  { ic:'ti-photo',        color:'rgba(255,120,180,.85)' },
    jpg:  { ic:'ti-photo',        color:'rgba(255,120,180,.85)' },
    mp3:  { ic:'ti-music',        color:'rgba(200,100,255,.85)' },
    m3u:  { ic:'ti-playlist',     color:'rgba(200,100,255,.75)' },
    zip:  { ic:'ti-file-zip',     color:'rgba(255,170,50,.85)'  },
    iso:  { ic:'ti-disc',         color:'rgba(150,180,255,.85)' },
    lnk:  { ic:'ti-link',         color:'rgba(180,180,180,.7)'  },
  };
  return map[ext] || { ic:'ti-file', color:'rgba(200,200,200,.5)' };
}

function fsBreadcrumbs(path) {
  if (path === '/') return [{ label: 'Root', path: '/' }];
  const parts = path.split('/').filter(Boolean);
  const crumbs = [{ label: 'Root', path: '/' }];
  let cur = '';
  parts.forEach(p => { cur += '/' + p; crumbs.push({ label: p, path: cur }); });
  return crumbs;
}

function buildFiles() {
  const wid = 'files-tmp-' + Date.now();
  // State is initialised in postInitApp via filesInit()
  return `
    <div class="files-wrap" id="files-root">
      <div class="files-toolbar">
        <button class="app-btn" id="files-back"    onclick="filesBack(this)"    title="Back"><i class="ti ti-chevron-left"></i></button>
        <button class="app-btn" id="files-forward" onclick="filesForward(this)" title="Forward"><i class="ti ti-chevron-right"></i></button>
        <button class="app-btn" onclick="filesUp(this)" title="Up"><i class="ti ti-arrow-up"></i></button>
        <div class="files-path" id="files-breadcrumb"></div>
        <div class="files-toolbar-spacer"></div>
        <button class="app-btn files-view-btn active" id="files-view-list" onclick="filesSetView(this,'list')" title="List view"><i class="ti ti-list"></i></button>
        <button class="app-btn files-view-btn"        id="files-view-grid" onclick="filesSetView(this,'grid')" title="Grid view"><i class="ti ti-layout-grid"></i></button>
      </div>

      <div class="files-body" onmousedown="event.stopPropagation()">
        <div class="files-sidebar">
          <div class="files-sidebar-label">Favourites</div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/home/lumi-user')">
            <i class="ti ti-home"></i> Home
          </div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/home/lumi-user/Documents')">
            <i class="ti ti-file-text"></i> Documents
          </div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/home/lumi-user/Downloads')">
            <i class="ti ti-download"></i> Downloads
          </div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/home/lumi-user/Pictures')">
            <i class="ti ti-photo"></i> Pictures
          </div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/home/lumi-user/Music')">
            <i class="ti ti-music"></i> Music
          </div>
          <div class="files-sidebar-label" style="margin-top:10px">System</div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/')">
            <i class="ti ti-device-desktop"></i> Root
          </div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/etc')">
            <i class="ti ti-settings"></i> etc
          </div>
        </div>

        <div class="files-main">
          <div class="files-list" id="files-pane"></div>
          <div class="files-status-bar" id="files-status"></div>
        </div>
      </div>

      <!-- File preview modal -->
      <div class="files-preview" id="files-preview" style="display:none" onmousedown="event.stopPropagation()">
        <div class="files-preview-header">
          <span id="files-preview-title"></span>
          <button class="app-btn" onclick="filesClosePreview(this)"><i class="ti ti-x"></i></button>
        </div>
        <pre class="files-preview-content" id="files-preview-content"></pre>
      </div>
    </div>`;
}

function filesGetState(el) {
  const root = el.closest('.files-wrap');
  if (!root) return null;
  let state = root._filesState;
  if (!state) {
    state = { path: '/home/lumi-user', history: ['/home/lumi-user'], histIdx: 0, view: 'list' };
    root._filesState = state;
  }
  return state;
}

function filesInit(wid) {
  // Called from postInitApp — find the files-wrap inside this window
  const winEl = document.getElementById(wid);
  if (!winEl) return;
  const root = winEl.querySelector('.files-wrap');
  if (!root) return;
  root._filesState = { path: '/home/lumi-user', history: ['/home/lumi-user'], histIdx: 0, view: 'list' };
  filesRender(root);
}

function filesRender(root) {
  const state = root._filesState;
  const node  = FS[state.path];
  if (!node) return;

  // Breadcrumbs
  const bc = root.querySelector('#files-breadcrumb');
  if (bc) {
    bc.innerHTML = fsBreadcrumbs(state.path).map((c, i, arr) => `
      <span class="files-crumb ${i===arr.length-1?'files-crumb-active':''}"
            onclick="filesNavigate(this,'${c.path}')">${c.label}</span>
      ${i < arr.length-1 ? '<i class="ti ti-chevron-right" style="font-size:9px;opacity:0.35"></i>' : ''}
    `).join('');
  }

  // Back/forward button states
  const btnBack = root.querySelector('#files-back');
  const btnFwd  = root.querySelector('#files-forward');
  if (btnBack) btnBack.style.opacity = state.histIdx > 0 ? '1' : '0.3';
  if (btnFwd)  btnFwd.style.opacity  = state.histIdx < state.history.length - 1 ? '1' : '0.3';

  // File pane
  const pane = root.querySelector('#files-pane');
  if (!pane) return;

  const children = node.children || [];
  if (children.length === 0) {
    pane.innerHTML = `<div class="files-empty"><i class="ti ti-folder-off"></i><span>This folder is empty</span></div>`;
  } else {
    const isGrid = state.view === 'grid';
    pane.className = 'files-list' + (isGrid ? ' files-grid-view' : '');
    pane.innerHTML = children.map(name => {
      const childPath = state.path === '/' ? '/' + name : state.path + '/' + name;
      const childNode = FS[childPath] || { type:'file', ext:'', size:'?', content:null };
      const { ic, color } = fsGetIcon(name, childNode);
      const isFolder = childNode.type === 'folder';
      const meta = isFolder
        ? `${(childNode.children||[]).length} item${(childNode.children||[]).length !== 1 ? 's' : ''}`
        : childNode.size;

      if (isGrid) {
        return `
          <div class="file-grid-item" ondblclick="filesOpen(this,'${childPath}')"
               title="${name}">
            <div class="file-grid-icon"><i class="ti ${ic}" style="color:${color}"></i></div>
            <span class="file-grid-name">${name}</span>
          </div>`;
      } else {
        return `
          <div class="file-row" ondblclick="filesOpen(this,'${childPath}')">
            <div class="file-row-icon"><i class="ti ${ic}" style="color:${color}"></i></div>
            <span class="file-row-name">${name}</span>
            <span class="file-row-type">${isFolder ? 'Folder' : (childNode.ext||'File').toUpperCase()}</span>
            <span class="file-row-meta">${meta}</span>
          </div>`;
      }
    }).join('');
  }

  // Status bar
  const status = root.querySelector('#files-status');
  if (status) {
    const folders = children.filter(n => {
      const p = state.path === '/' ? '/' + n : state.path + '/' + n;
      return (FS[p]||{}).type === 'folder';
    }).length;
    const files = children.length - folders;
    status.textContent = `${children.length} item${children.length !== 1 ? 's' : ''} — ${folders} folder${folders !== 1 ? 's' : ''}, ${files} file${files !== 1 ? 's' : ''}`;
  }
}

function filesNavigate(el, path) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  const state = root._filesState;
  if (state.path === path) return;
  // Trim forward history when navigating new path
  state.history = state.history.slice(0, state.histIdx + 1);
  state.history.push(path);
  state.histIdx = state.history.length - 1;
  state.path = path;
  filesRender(root);
}

function filesBack(el) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  const state = root._filesState;
  if (state.histIdx <= 0) return;
  state.histIdx--;
  state.path = state.history[state.histIdx];
  filesRender(root);
}

function filesForward(el) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  const state = root._filesState;
  if (state.histIdx >= state.history.length - 1) return;
  state.histIdx++;
  state.path = state.history[state.histIdx];
  filesRender(root);
}

function filesUp(el) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  const state = root._filesState;
  if (state.path === '/') return;
  const parent = state.path.substring(0, state.path.lastIndexOf('/')) || '/';
  filesNavigate(el, parent);
}

function filesSetView(el, view) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  root._filesState.view = view;
  root.querySelectorAll('.files-view-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  filesRender(root);
}

function filesOpen(el, path) {
  const node = FS[path];
  if (!node) return;
  if (node.type === 'folder') {
    filesNavigate(el, path);
    return;
  }
  // Show preview for text files
  const root = el.closest('.files-wrap');
  if (!root) return;
  const preview = root.querySelector('#files-preview');
  if (!preview) return;
  const name = path.split('/').pop();
  if (node.content !== null) {
    preview.querySelector('#files-preview-title').textContent = name;
    preview.querySelector('#files-preview-content').textContent = node.content;
    preview.style.display = 'flex';
  } else {
    notify(`Cannot preview "${name}" — binary file`);
  }
}

function filesClosePreview(el) {
  const preview = el.closest('.files-preview');
  if (preview) preview.style.display = 'none';
}

// ─────────────────────────────────────────────
//  APP: Settings  (fully functional)
// ─────────────────────────────────────────────
const SETTINGS_NAV = [
  { id:'appearance',    ic:'ti-palette',     label:'Appearance'    },
  { id:'display',       ic:'ti-screen',      label:'Display'       },
  { id:'notifications', ic:'ti-bell',        label:'Notifications' },
  { id:'security',      ic:'ti-lock',        label:'Security'      },
  { id:'about',         ic:'ti-info-circle', label:'About'         },
];

let activeSettingsPanel = 'appearance';

function buildSettings() {
  const nav = SETTINGS_NAV.map(n => `
    <div class="settings-nav-item ${n.id===activeSettingsPanel?'active':''}"
         onclick="switchSettingsPanel('${n.id}',this)">
      <i class="ti ${n.ic}"></i> ${n.label}
    </div>
  `).join('');

  return `
    <div class="settings-wrap">
      <div class="settings-sidebar">${nav}</div>
      <div class="settings-content" id="settings-panel" onmousedown="event.stopPropagation()">
        ${buildSettingsPanel(activeSettingsPanel)}
      </div>
    </div>`;
}

function switchSettingsPanel(id, el) {
  activeSettingsPanel = id;
  el.closest('.settings-sidebar').querySelectorAll('.settings-nav-item')
    .forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  clearInterval(uptimeInterval);
  const panel = el.closest('.settings-wrap').querySelector('#settings-panel');
  if (panel) {
    panel.innerHTML = buildSettingsPanel(id);
    if (id === 'about') startUptimeTicker();
  }
}

function buildSettingsPanel(id) {
  switch (id) {
    case 'appearance':    return panelAppearance();
    case 'display':       return panelDisplay();
    case 'notifications': return panelNotifications();
    case 'security':      return panelSecurity();
    case 'about':         return panelAbout();
    default:              return panelAppearance();
  }
}

// ── Appearance panel ──────────────────────────
function panelAppearance() {
  const ACCENTS = [
    { color:'#6366f1', label:'Indigo'  },
    { color:'#8b5cf6', label:'Violet'  },
    { color:'#ec4899', label:'Pink'    },
    { color:'#0ea5e9', label:'Sky'     },
    { color:'#10b981', label:'Emerald' },
    { color:'#f97316', label:'Orange'  },
  ];
  const toggleRow = (key, label, desc) => {
    const on = OS_SETTINGS[key];
    return `
      <div class="settings-row">
        <div class="settings-row-info">
          <div class="settings-row-label">${label}</div>
          <div class="settings-row-desc">${desc}</div>
        </div>
        <div class="toggle-sw ${on?'on':''}" data-key="${key}" data-on="${on?1:0}"
             onclick="settingToggle(this)" role="switch" aria-checked="${on}" aria-label="${label}">
          <div class="toggle-knob" style="left:${on?'auto':'3px'};right:${on?'3px':'auto'}"></div>
        </div>
      </div>`;
  };

  return `
    <div class="settings-section-title">Appearance</div>
    ${toggleRow('transparency','Transparency','Window blur & glass effects')}
    ${toggleRow('darkMode','Dark Mode','System-wide dark theme')}
    ${toggleRow('animations','Animations','Motion & transition effects')}
    ${toggleRow('particles', 'Particles', 'Drifting stars on the desktop')}

    <div style="margin-top:14px">
      <div class="settings-row-label" style="margin-bottom:8px">Accent Color</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${ACCENTS.map(a => `
          <div class="color-swatch" title="${a.label}"
               style="background:${a.color};border:2px solid ${a.color===OS_SETTINGS.accent?'white':'transparent'}"
               onclick="applyAccent('${a.color}',true);
                        this.closest('.settings-content').querySelectorAll('.color-swatch')
                            .forEach(s=>s.style.border='2px solid transparent');
                        this.style.border='2px solid white'">
          </div>
        `).join('')}
      </div>
    </div>

    <div style="margin-top:18px">
      <div class="settings-row-label" style="margin-bottom:8px">Wallpaper</div>
      <div class="wp-grid">
        ${WALLPAPERS.map(w => `
          <div class="wp-swatch ${OS_SETTINGS.wallpaper===w.id?'wp-active':''}"
               title="${w.label}"
               style="background:${w.css}"
               onclick="applyWallpaper('${w.id}');
                        this.closest('.wp-grid').querySelectorAll('.wp-swatch')
                            .forEach(s=>s.classList.remove('wp-active'));
                        this.classList.add('wp-active')">
            <span class="wp-label">${w.label}</span>
          </div>
        `).join('')}
        <label class="wp-swatch wp-upload" title="Custom image">
          <input type="file" accept="image/*" style="display:none"
                 onchange="
                   const f=this.files[0]; if(!f) return;
                   const r=new FileReader();
                   r.onload=e=>{
                     applyWallpaper(null, e.target.result);
                     this.closest('.wp-grid').querySelectorAll('.wp-swatch')
                         .forEach(s=>s.classList.remove('wp-active'));
                     this.closest('.wp-swatch').classList.add('wp-active');
                   };
                   r.readAsDataURL(f)">
          <i class="ti ti-photo-up" style="font-size:18px;opacity:0.5"></i>
          <span class="wp-label">Custom</span>
        </label>
      </div>
    </div>`;
}

// ── Display panel ─────────────────────────────
function panelDisplay() {
  const brt = OS_SETTINGS.brightness;
  return `
    <div class="settings-section-title">Display</div>

    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Brightness</div>
        <div class="settings-row-desc">Screen brightness level</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <i class="ti ti-sun-low" style="font-size:13px;color:rgba(255,255,255,.4)"></i>
        <input type="range" class="settings-slider" min="20" max="100" value="${brt}"
               oninput="applyBrightness(this.value);document.getElementById('brt-val').textContent=this.value+'%'">
        <i class="ti ti-sun" style="font-size:13px;color:rgba(255,255,255,.6)"></i>
        <span id="brt-val" style="font-size:11px;color:rgba(255,255,255,.5);width:32px">${brt}%</span>
      </div>
    </div>

    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Resolution</div>
        <div class="settings-row-desc">Display resolution</div>
      </div>
      <select class="settings-select" onchange="notify('Resolution change requires restart')">
        <option>1920 × 1080</option>
        <option>2560 × 1440</option>
        <option>3840 × 2160</option>
      </select>
    </div>

    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Refresh Rate</div>
        <div class="settings-row-desc">Display refresh rate</div>
      </div>
      <select class="settings-select" onchange="notify('Refresh rate updated to '+this.value)">
        <option>60 Hz</option>
        <option>120 Hz</option>
        <option>144 Hz</option>
      </select>
    </div>

    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Night Mode</div>
        <div class="settings-row-desc">Reduce blue light after sunset</div>
      </div>
      <div class="toggle-sw" data-on="0"
           onclick="var on=this.dataset.on==='1';this.dataset.on=on?'0':'1';
                    this.classList.toggle('on',!on);
                    var k=this.querySelector('.toggle-knob');
                    k.style.left=on?'auto':'3px';k.style.right=on?'3px':'auto';
                    notify(!on?'Night Mode enabled':'Night Mode disabled')" role="switch">
        <div class="toggle-knob" style="left:3px;right:auto"></div>
      </div>
    </div>`;
}

// ── Notifications panel ───────────────────────
function panelNotifications() {
  const dur = OS_SETTINGS.notifDuration / 1000;
  return `
    <div class="settings-section-title">Notifications</div>

    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Show Notifications</div>
        <div class="settings-row-desc">Display system notifications</div>
      </div>
      <div class="toggle-sw ${OS_SETTINGS.notifications?'on':''}"
           data-on="${OS_SETTINGS.notifications?1:0}"
           onclick="OS_SETTINGS.notifications=this.dataset.on!=='1';
                    this.dataset.on=OS_SETTINGS.notifications?'1':'0';
                    this.classList.toggle('on',OS_SETTINGS.notifications);
                    var k=this.querySelector('.toggle-knob');
                    k.style.left=OS_SETTINGS.notifications?'auto':'3px';
                    k.style.right=OS_SETTINGS.notifications?'3px':'auto';
                    if(OS_SETTINGS.notifications)notify('Notifications enabled')" role="switch">
        <div class="toggle-knob" style="left:${OS_SETTINGS.notifications?'auto':'3px'};right:${OS_SETTINGS.notifications?'3px':'auto'}"></div>
      </div>
    </div>

    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Duration</div>
        <div class="settings-row-desc">How long notifications stay visible</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="range" class="settings-slider" min="1" max="10" value="${dur}"
               oninput="OS_SETTINGS.notifDuration=this.value*1000;document.getElementById('ndur-val').textContent=this.value+'s'">
        <span id="ndur-val" style="font-size:11px;color:rgba(255,255,255,.5);width:24px">${dur}s</span>
      </div>
    </div>

    <div style="margin-top:14px">
      <button class="settings-btn" onclick="notify('This is a test notification from LumiOS!')">
        <i class="ti ti-bell" style="font-size:12px"></i> Send Test Notification
      </button>
    </div>`;
}

// ── Security panel ────────────────────────────
function panelSecurity() {
  return `
    <div class="settings-section-title">Security</div>

    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Auto-Lock</div>
        <div class="settings-row-desc">Lock screen when idle</div>
      </div>
      <div class="toggle-sw ${OS_SETTINGS.autoLock?'on':''}"
           data-on="${OS_SETTINGS.autoLock?1:0}"
           onclick="OS_SETTINGS.autoLock=this.dataset.on!=='1';
                    this.dataset.on=OS_SETTINGS.autoLock?'1':'0';
                    this.classList.toggle('on',OS_SETTINGS.autoLock);
                    var k=this.querySelector('.toggle-knob');
                    k.style.left=OS_SETTINGS.autoLock?'auto':'3px';
                    k.style.right=OS_SETTINGS.autoLock?'3px':'auto';
                    notify('Auto-lock '+(OS_SETTINGS.autoLock?'enabled':'disabled'))" role="switch">
        <div class="toggle-knob" style="left:${OS_SETTINGS.autoLock?'auto':'3px'};right:${OS_SETTINGS.autoLock?'3px':'auto'}"></div>
      </div>
    </div>

    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Lock After</div>
        <div class="settings-row-desc">Minutes of idle before locking</div>
      </div>
      <select class="settings-select"
              onchange="OS_SETTINGS.screensaver=parseInt(this.value);notify('Lock timeout set to '+this.value+' min')">
        <option value="1" ${OS_SETTINGS.screensaver===1?'selected':''}>1 minute</option>
        <option value="5" ${OS_SETTINGS.screensaver===5?'selected':''}>5 minutes</option>
        <option value="10" ${OS_SETTINGS.screensaver===10?'selected':''}>10 minutes</option>
        <option value="30" ${OS_SETTINGS.screensaver===30?'selected':''}>30 minutes</option>
      </select>
    </div>

    <div style="margin-top:14px;display:flex;gap:8px">
      <button class="settings-btn" onclick="notify('Password management requires server-side support')">
        <i class="ti ti-key" style="font-size:12px"></i> Change Password
      </button>
      <button class="settings-btn settings-btn-danger" onclick="notify('Screen locked (demo)')">
        <i class="ti ti-lock" style="font-size:12px"></i> Lock Now
      </button>
    </div>`;
}

// ── About panel ───────────────────────────────
function getUptime() {
  const ms   = Date.now() - OS_BOOT_TIME;
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hrs  = Math.floor(mins / 60);
  return `${String(hrs).padStart(2,'0')}h ${String(mins%60).padStart(2,'0')}m ${String(secs%60).padStart(2,'0')}s`;
}

function startUptimeTicker() {
  clearInterval(uptimeInterval);
  uptimeInterval = setInterval(() => {
    const el = document.getElementById('uptime-val');
    if (el) el.textContent = getUptime();
    else clearInterval(uptimeInterval);
  }, 1000);
}

function panelAbout() {
  const ua     = navigator.userAgent;
  const browser= ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown';
  const cores  = navigator.hardwareConcurrency || '—';
  const mem    = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—';

  return `
    <div class="settings-section-title">About LumiOS</div>
    <div class="settings-info-box" style="margin-bottom:12px">
      <div><span>Version</span> LumiOS 1.0.0</div>
      <div><span>Build</span> 2025.06.16</div>
      <div><span>Kernel</span> LumiCore 1.0</div>
      <div><span>Platform</span> Web-based</div>
      <div><span>Browser</span> ${browser}</div>
      <div><span>Uptime</span> <span id="uptime-val">${getUptime()}</span></div>
    </div>

    <div class="settings-section-title">System Resources</div>
    <div class="settings-resource">
      <div class="settings-resource-label">CPU Cores</div>
      <div class="settings-resource-bar">
        <div class="settings-resource-fill" style="width:${Math.min(cores*12,95)}%"></div>
      </div>
      <div class="settings-resource-value">${cores} cores</div>
    </div>
    <div class="settings-resource">
      <div class="settings-resource-label">Device Memory</div>
      <div class="settings-resource-bar">
        <div class="settings-resource-fill" style="width:60%"></div>
      </div>
      <div class="settings-resource-value">${mem}</div>
    </div>
    <div class="settings-resource">
      <div class="settings-resource-label">Storage</div>
      <div class="settings-resource-bar">
        <div class="settings-resource-fill" style="width:42%"></div>
      </div>
      <div class="settings-resource-value">42% used</div>
    </div>

    <div style="margin-top:14px">
      <button class="settings-btn" onclick="notify('Checking for updates… LumiOS is up to date!')">
        <i class="ti ti-refresh" style="font-size:12px"></i> Check for Updates
      </button>
    </div>`;
}

// ─────────────────────────────────────────────
//  Settings helpers
// ─────────────────────────────────────────────
function settingToggle(el) {
  const on    = el.dataset.on === '1';
  const newOn = !on;
  el.dataset.on = newOn ? '1' : '0';
  el.classList.toggle('on', newOn);
  el.setAttribute('aria-checked', newOn);
  const knob = el.querySelector('.toggle-knob');
  knob.style.left = newOn ? 'auto' : '3px';
  knob.style.right = newOn ? '3px' : 'auto';

  const key = el.dataset.key;
  OS_SETTINGS[key] = newOn;
  if (key === 'transparency') applyTransparency(newOn);
  if (key === 'darkMode')     applyDarkMode(newOn);
  if (key === 'animations')   applyAnimations(newOn);
  if (key === 'particles') applyParticles(newOn);
}

// ─────────────────────────────────────────────
//  OS Setting Appliers  (the actual effects)
// ─────────────────────────────────────────────
function applyTransparency(on) {
  document.getElementById('os').classList.toggle('no-transparency', !on);
  notify(on ? 'Transparency enabled' : 'Transparency disabled');
}

function applyDarkMode(on) {
  document.getElementById('os').classList.toggle('light-mode', !on);
  notify(on ? 'Dark mode enabled' : 'Light mode enabled');
}

function applyAnimations(on) {
  document.getElementById('os').classList.toggle('no-animations', !on);
  notify(on ? 'Animations enabled' : 'Animations disabled');
}

function applyAccent(hex, showNotif) {
  OS_SETTINGS.accent = hex;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  OS_SETTINGS.accentRgb = `${r},${g},${b}`;
  const root = document.documentElement;
  root.style.setProperty('--accent-color', hex);
  root.style.setProperty('--accent-rgb',   OS_SETTINGS.accentRgb);
  if (showNotif) notify('Accent color updated');
}

function applyBrightness(val) {
  OS_SETTINGS.brightness = parseInt(val, 10);
  let ov = document.getElementById('brightness-overlay');
  if (!ov) return;
  ov.style.opacity = ((100 - OS_SETTINGS.brightness) / 100 * 0.85).toFixed(2);
}

const WALLPAPERS = [
  {
    id: 'default',
    label: 'Aurora',
    css: `
      radial-gradient(ellipse 55% 55% at 18% 22%, rgba(90,18,200,0.45), transparent),
      radial-gradient(ellipse 45% 45% at 82% 78%, rgba(18,60,200,0.35), transparent),
      radial-gradient(ellipse 38% 38% at 62% 16%, rgba(200,18,85,0.2), transparent),
      linear-gradient(148deg, #050510, #0a0520 45%, #040919)
    `,
  },
  {
    id: 'midnight',
    label: 'Midnight',
    css: `
      radial-gradient(ellipse 60% 50% at 50% 100%, rgba(30,10,80,0.9), transparent),
      linear-gradient(180deg, #000005, #05010f)
    `,
  },
  {
    id: 'nebula',
    label: 'Nebula',
    css: `
      radial-gradient(ellipse 70% 60% at 20% 80%, rgba(20,180,120,0.3), transparent),
      radial-gradient(ellipse 50% 50% at 80% 20%, rgba(180,20,200,0.35), transparent),
      radial-gradient(ellipse 40% 40% at 50% 50%, rgba(0,60,160,0.25), transparent),
      linear-gradient(135deg, #020c14, #060818)
    `,
  },
  {
    id: 'ember',
    label: 'Ember',
    css: `
      radial-gradient(ellipse 55% 55% at 15% 85%, rgba(220,60,10,0.5), transparent),
      radial-gradient(ellipse 45% 45% at 85% 20%, rgba(200,120,0,0.35), transparent),
      linear-gradient(148deg, #0e0500, #1a0800 45%, #0a0300)
    `,
  },
  {
    id: 'ocean',
    label: 'Ocean',
    css: `
      radial-gradient(ellipse 60% 60% at 30% 30%, rgba(0,100,200,0.4), transparent),
      radial-gradient(ellipse 50% 50% at 70% 70%, rgba(0,180,160,0.3), transparent),
      linear-gradient(148deg, #000d1a, #001a2e 45%, #000f1f)
    `,
  },
  {
    id: 'rose',
    label: 'Rose',
    css: `
      radial-gradient(ellipse 55% 55% at 20% 30%, rgba(200,20,100,0.4), transparent),
      radial-gradient(ellipse 45% 45% at 75% 70%, rgba(120,0,180,0.35), transparent),
      linear-gradient(148deg, #100008, #1a000e 45%, #0d0008)
    `,
  },
];

function applyWallpaper(id, customUrl) {
  const osbg = document.getElementById('osbg');

  if (customUrl) {
    OS_SETTINGS.wallpaper = 'custom';
    osbg.style.background = `url('${customUrl}') center/cover no-repeat`;
    return;
  }

  const wp = WALLPAPERS.find(w => w.id === id);
  if (!wp) return;
  OS_SETTINGS.wallpaper = id;
  osbg.style.background = wp.css;
  notify(`Wallpaper set to ${wp.label}`);
}
// ─────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

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

  // ── Animate in ──
  el.classList.add('win-entering');
  el.addEventListener('animationend', () => el.classList.remove('win-entering'), { once: true });

  wins[wid] = { id: wid, el, aid: app.id, min: false, max: false, sv: null };
  addTaskbarButton(wid, app);
  focusWindow(wid);
  setTimeout(() => postInitApp(app.id, wid), 90);
}

// ─────────────────────────────────────────────
//  Context Menu
// ─────────────────────────────────────────────
let ctxOpen = false;

function showContextMenu(x, y) {
  const menu = document.getElementById('ctx-menu');
  menu.style.display = 'block'; // measure before positioning
  menu.classList.remove('visible');

  const menuW = menu.offsetWidth;
  const menuH = menu.offsetHeight;
  const pad   = 6; // minimum gap from viewport edges

  // Flip horizontally if too close to right edge
  const left = (x + menuW + pad > window.innerWidth)  ? x - menuW : x;
  // Flip vertically if too close to bottom (account for taskbar height ~48px)
  const top  = (y + menuH + pad > window.innerHeight - 48) ? y - menuH : y;

  menu.style.left = Math.max(pad, left) + 'px';
  menu.style.top  = Math.max(pad, top)  + 'px';
  menu.classList.add('visible');
  ctxOpen = true;
}

function closeContextMenu() {
  if (!ctxOpen) return;
  const menu = document.getElementById('ctx-menu');
  menu.classList.remove('visible');
  ctxOpen = false;
}

function ctxAction(action) {
  closeContextMenu();
  switch (action) {
    case 'wallpaper':
      openApp('settings');
      // Give the settings window time to render, then switch to appearance panel
      setTimeout(() => {
        const item = document.querySelector('.settings-nav-item[onclick*="appearance"]');
        if (item) item.click();
      }, 120);
      break;
    case 'new-note':
      openApp('notes');
      break;
    case 'new-folder':
      notify('New Folder created on desktop');
      break;
    case 'sort':
      notify('Icons sorted');
      break;
    case 'settings':
      openApp('settings');
      break;
    case 'refresh':
      renderDesktopIcons();
      notify('Desktop refreshed');
      break;
    case 'widgets':
      openApp('widgets');
      break;
  }
}

// ─────────────────────────────────────────────
// Particles
// ─────────────────────────────────────────────
function applyParticles(on) {
  if (particleCanvas) particleCanvas.style.opacity = on ? '1' : '0';
  notify(on ? 'Particles enabled' : 'Particles disabled');
}   

// ─────────────────────────────────────────────
// Widgets State
// ─────────────────────────────────────────────
const WIDGET_DEFS = [
  { id:'clock-digital', label:'Digital Clock', ic:'ti-clock',    gr:'linear-gradient(135deg,#f59e0b,#f97316)', relatedApp:'clock'    },
  { id:'clock-analog',  label:'Analog Clock',  ic:'ti-clock-2',  gr:'linear-gradient(135deg,#f59e0b,#f97316)', relatedApp:'clock'    },
  { id:'calendar',      label:'Calendar',      ic:'ti-calendar',  gr:'linear-gradient(135deg,#0ea5e9,#6366f1)', relatedApp:'calendar' },
  { id:'weather',       label:'Weather',       ic:'ti-cloud',     gr:'linear-gradient(135deg,#0ea5e9,#34d399)', relatedApp:null       },
  { id:'notes-peek',    label:'Notes Peek',    ic:'ti-notebook',  gr:'linear-gradient(135deg,#f59e0b,#fbbf24)', relatedApp:'notes'    },
  { id:'system-stats',  label:'System Stats',  ic:'ti-cpu',       gr:'linear-gradient(135deg,#059669,#34d399)', relatedApp:'settings' },
];

// Default widget instances: analog clock top-right, calendar below
let WIDGET_INSTANCES = [
  { iid:'wi-1', defId:'clock-analog', x:-16, y:10,  visible:true, anchorRight:true },
  { iid:'wi-2', defId:'calendar',     x:-8,  y:185, visible:true, anchorRight:true },
];

let widgetRaf = null;

// ─────────────────────────────────────────────
//  Desktop Widgets
// ─────────────────────────────────────────────

function initWidgets() {
  renderAllWidgets();
  // Tick widgets every second
  setInterval(tickWidgets, 1000);
  tickWidgets();
}

function renderAllWidgets() {
  const layer = document.getElementById('widget-layer');
  if (!layer) return;
  layer.innerHTML = '';
  WIDGET_INSTANCES.forEach(inst => {
    if (!inst.visible) return;
    const el = buildWidgetEl(inst);
    if (el) layer.appendChild(el);
  });
  tickWidgets();
}

function buildWidgetEl(inst) {
  const def = WIDGET_DEFS.find(d => d.id === inst.defId);
  if (!def) return null;

  const el = document.createElement('div');
  el.className = 'dw';
  el.id = inst.iid;

  // Position — anchorRight uses right edge so it survives resize
  if (inst.anchorRight) {
    el.style.right = Math.abs(inst.x) + 'px';
    el.style.top   = inst.y + 'px';
  } else {
    el.style.left = inst.x + 'px';
    el.style.top  = inst.y + 'px';
  }

  el.innerHTML = widgetInnerHTML(inst, def);

  // Drag to reposition
  el.addEventListener('mousedown', e => {
    if (e.button !== 0 || e.target.closest('.dw-close')) return;
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const origLeft = el.offsetLeft, origTop = el.offsetTop;
    // Resolve anchored position to absolute
    if (inst.anchorRight) {
      el.style.left  = origLeft + 'px';
      el.style.right = 'auto';
      inst.anchorRight = false;
    }
    function onMove(e) {
      const nx = origLeft + (e.clientX - startX);
      const ny = origTop  + (e.clientY - startY);
      el.style.left = Math.max(0, Math.min(nx, window.innerWidth  - el.offsetWidth))  + 'px';
      el.style.top  = Math.max(0, Math.min(ny, window.innerHeight - el.offsetHeight - 48)) + 'px';
      inst.x = parseInt(el.style.left);
      inst.y = parseInt(el.style.top);
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  return el;
}

function widgetInnerHTML(inst, def) {
  const relBtn = def.relatedApp
    ? `<button class="dw-related" onclick="openApp('${def.relatedApp}')" title="Open ${def.relatedApp}">
         <i class="ti ti-arrow-up-right"></i>
       </button>`
    : '';
  return `
    <div class="dw-header">
      <div class="dw-icon" style="background:${def.gr}">
        <i class="ti ${def.ic}"></i>
      </div>
      <span class="dw-title">${def.label}</span>
      <div class="dw-actions">
        ${relBtn}
        <button class="dw-close" onclick="removeWidgetInstance('${inst.iid}')" title="Remove widget">
          <i class="ti ti-x"></i>
        </button>
      </div>
    </div>
    <div class="dw-body" id="${inst.iid}-body">
      ${widgetBodyHTML(inst)}
    </div>`;
}

function widgetBodyHTML(inst) {
  switch (inst.defId) {
    case 'clock-digital': return widgetClockDigital();
    case 'clock-analog':  return widgetClockAnalog(inst.iid);
    case 'calendar':      return widgetCalendar();
    case 'weather':       return widgetWeather();
    case 'notes-peek':    return widgetNotesPeek();
    case 'system-stats':  return widgetSystemStats();
    default: return '';
  }
}

// ── Widget bodies ──────────────────────────────

function widgetClockDigital() {
  const now  = new Date();
  const time = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const date = now.toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });
  return `
    <div class="dw-clock-time" id="dw-digital-time">${time}</div>
    <div class="dw-clock-date" id="dw-digital-date">${date}</div>`;
}

function widgetClockAnalog(iid) {
  return `<canvas class="dw-analog-canvas" id="${iid}-canvas" width="110" height="110"></canvas>`;
}

function widgetCalendar() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthName = now.toLocaleDateString([], { month:'long', year:'numeric' });
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let cells = '';
  // Day headers
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
    cells += `<div class="dw-cal-head">${d}</div>`;
  });
  // Blank cells before month start
  for (let i = 0; i < firstDay; i++) cells += '<div></div>';
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells += `<div class="dw-cal-day ${d === today ? 'dw-cal-today' : ''}">${d}</div>`;
  }
  return `
    <div class="dw-cal-month">${monthName}</div>
    <div class="dw-cal-grid">${cells}</div>`;
}

function widgetWeather() {
  return `
    <div class="dw-weather-main">
      <i class="ti ti-cloud-sun dw-weather-icon"></i>
      <div>
        <div class="dw-weather-temp">--°</div>
        <div class="dw-weather-desc">Location unavailable</div>
      </div>
    </div>
    <div class="dw-weather-hint">Enable location to show live weather</div>`;
}

function widgetNotesPeek() {
  const el = document.getElementById('notes-editor');
  const text = el ? (el.innerText.trim() || 'No notes yet.') : 'Open Notes to start writing.';
  return `
    <div class="dw-notes-peek" onclick="openApp('notes')">${text.slice(0, 120)}${text.length > 120 ? '…' : ''}</div>
    <button class="dw-notes-btn" onclick="openApp('notes')">
      <i class="ti ti-pencil"></i> Open Notes
    </button>`;
}

function widgetSystemStats() {
  const cores = navigator.hardwareConcurrency || '—';
  const mem   = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—';
  const upMs  = Date.now() - OS_BOOT_TIME;
  const upMin = Math.floor(upMs / 60000);
  return `
    <div class="dw-stat-row"><span>CPU Cores</span><span>${cores}</span></div>
    <div class="dw-stat-row"><span>Memory</span><span>${mem}</span></div>
    <div class="dw-stat-row"><span>Uptime</span><span id="dw-uptime">${upMin}m</span></div>
    <div class="dw-stat-row"><span>Windows</span><span id="dw-wincount">${Object.keys(wins).length}</span></div>
    <button class="dw-notes-btn" style="margin-top:6px" onclick="openApp('settings')">
      <i class="ti ti-settings"></i> Open Settings
    </button>`;
}

// ── Tick (update live content every second) ────

function tickWidgets() {
  // Digital clock
  const timeEl = document.getElementById('dw-digital-time');
  const dateEl = document.getElementById('dw-digital-date');
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });

  // Analog clocks
  WIDGET_INSTANCES.forEach(inst => {
    if (inst.defId !== 'clock-analog' || !inst.visible) return;
    drawWidgetAnalog(inst.iid);
  });

  // Stats uptime
  const uptEl = document.getElementById('dw-uptime');
  if (uptEl) uptEl.textContent = Math.floor((Date.now() - OS_BOOT_TIME) / 60000) + 'm';
  const wcEl  = document.getElementById('dw-wincount');
  if (wcEl)  wcEl.textContent  = Object.keys(wins).length;
}

function drawWidgetAnalog(iid) {
  const canvas = document.getElementById(iid + '-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const r   = canvas.width / 2;
  const now = new Date();
  const H   = now.getHours() % 12, M = now.getMinutes(), S = now.getSeconds();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Face
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.arc(r, r, r - 4, 0, Math.PI * 2); ctx.stroke();

  // Hour ticks
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 3 === 0;
    ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth   = isMajor ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(r + Math.cos(a) * (r - 12), r + Math.sin(a) * (r - 12));
    ctx.lineTo(r + Math.cos(a) * (r - 5),  r + Math.sin(a) * (r - 5));
    ctx.stroke();
  }

  // Hour hand
  const hA = ((H + M / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r, r); ctx.lineTo(r + Math.cos(hA) * (r * 0.5), r + Math.sin(hA) * (r * 0.5)); ctx.stroke();

  // Minute hand
  const mA = ((M + S / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r, r); ctx.lineTo(r + Math.cos(mA) * (r * 0.72), r + Math.sin(mA) * (r * 0.72)); ctx.stroke();

  // Second hand
  const sA = (S / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = 'rgba(245,158,11,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(r, r); ctx.lineTo(r + Math.cos(sA) * (r * 0.8), r + Math.sin(sA) * (r * 0.8)); ctx.stroke();

  // Centre dot
  ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(r, r, 3, 0, Math.PI * 2); ctx.fill();
}

// ── Widget instance management ─────────────────

function addWidgetInstance(defId) {
  const def = WIDGET_DEFS.find(d => d.id === defId);
  if (!def) return;
  const iid = 'wi-' + Date.now();
  WIDGET_INSTANCES.push({ iid, defId, x: 80 + Math.random() * 120, y: 80 + Math.random() * 80, visible: true });
  renderAllWidgets();
  notify(`${def.label} widget added`);
  refreshWidgetsApp();
}

function removeWidgetInstance(iid) {
  const inst = WIDGET_INSTANCES.find(i => i.iid === iid);
  WIDGET_INSTANCES = WIDGET_INSTANCES.filter(i => i.iid !== iid);
  const el = document.getElementById(iid);
  const animOff = document.getElementById('os').classList.contains('no-animations');
  if (el) {
    if (!animOff) {
      el.style.animation = 'win-close 140ms ease forwards';
      el.addEventListener('animationend', () => el.remove(), { once: true });
    } else {
      el.remove();
    }
  }
  if (inst) notify(`Widget removed`);
  refreshWidgetsApp();
}

function toggleWidgetVisibility(iid) {
  const inst = WIDGET_INSTANCES.find(i => i.iid === iid);
  if (!inst) return;
  inst.visible = !inst.visible;
  renderAllWidgets();
  refreshWidgetsApp();
}

// Re-renders just the widget list inside an open Widgets window
function refreshWidgetsApp() {
  const panel = document.querySelector('.widgets-instance-list');
  if (panel) panel.innerHTML = buildWidgetInstanceList();
}

// ── APP: Widgets ───────────────────────────────

function buildWidgets() {
  return `
    <div class="widgets-wrap" onmousedown="event.stopPropagation()">

      <!-- Left: widget catalogue -->
      <div class="widgets-sidebar">
        <div class="widgets-sidebar-label">Available Widgets</div>
        ${WIDGET_DEFS.map(def => {
          const isActive = WIDGET_INSTANCES.some(i => i.defId === def.id && i.visible);
          return `
            <div class="widget-card ${isActive ? 'widget-card-active' : ''}">
              <div class="widget-card-icon" style="background:${def.gr}">
                <i class="ti ${def.ic}"></i>
              </div>
              <div class="widget-card-info">
                <div class="widget-card-name">${def.label}</div>
                ${def.relatedApp ? `
                  <div class="widget-card-related" onclick="openApp('${def.relatedApp}')">
                    <i class="ti ti-arrow-up-right"></i> Related: ${def.relatedApp.charAt(0).toUpperCase()+def.relatedApp.slice(1)}
                  </div>` : ''}
              </div>
              <button class="widget-card-add" onclick="addWidgetInstance('${def.id}')" title="Add to desktop">
                <i class="ti ti-plus"></i>
              </button>
            </div>`;
        }).join('')}
      </div>

      <!-- Right: active instances -->
      <div class="widgets-main">
        <div class="widgets-sidebar-label">On Desktop</div>
        <div class="widgets-instance-list">
          ${buildWidgetInstanceList()}
        </div>

        <div class="widgets-divider"></div>

        <div class="widgets-sidebar-label" style="margin-top:8px">Quick Actions</div>
        <div class="widgets-actions">
          <button class="settings-btn" onclick="renderAllWidgets();notify('Widgets refreshed')">
            <i class="ti ti-refresh" style="font-size:11px"></i> Refresh All
          </button>
          <button class="settings-btn settings-btn-danger" onclick="widgetsClearAll()">
            <i class="ti ti-trash" style="font-size:11px"></i> Clear All
          </button>
        </div>

        <div class="widgets-hint">
          <i class="ti ti-drag-drop"></i>
          Drag any widget on the desktop to reposition it.
        </div>
      </div>
    </div>`;
}

function buildWidgetInstanceList() {
  if (WIDGET_INSTANCES.length === 0) {
    return `<div class="widgets-empty"><i class="ti ti-layout-off"></i> No widgets on desktop</div>`;
  }
  return WIDGET_INSTANCES.map(inst => {
    const def = WIDGET_DEFS.find(d => d.id === inst.defId);
    if (!def) return '';
    return `
      <div class="widget-instance-row">
        <div class="widget-instance-icon" style="background:${def.gr}">
          <i class="ti ${def.ic}"></i>
        </div>
        <span class="widget-instance-name">${def.label}</span>
        <div class="widget-instance-actions">
          <button class="dw-action-btn" onclick="toggleWidgetVisibility('${inst.iid}')" title="${inst.visible ? 'Hide' : 'Show'}">
            <i class="ti ${inst.visible ? 'ti-eye' : 'ti-eye-off'}"></i>
          </button>
          <button class="dw-action-btn dw-action-danger" onclick="removeWidgetInstance('${inst.iid}')" title="Remove">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}

function widgetsClearAll() {
  WIDGET_INSTANCES = [];
  renderAllWidgets();
  refreshWidgetsApp();
  notify('All widgets removed');
}