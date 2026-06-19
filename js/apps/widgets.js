"use strict";

// ─────────────────────────────────────────────
//  Widgets State
// ─────────────────────────────────────────────
const WIDGET_DEFS = [
  { id:'clock-digital', label:'Digital Clock', ic:'ti-clock',    gr:'linear-gradient(135deg,#f59e0b,#f97316)'},
  { id:'clock-analog',  label:'Analog Clock',  ic:'ti-clock-2',  gr:'linear-gradient(135deg,#f59e0b,#f97316)'},
  { id:'calendar',      label:'Calendar',      ic:'ti-calendar',  gr:'linear-gradient(135deg,#0ea5e9,#6366f1)'},
  { id:'weather',       label:'Weather',       ic:'ti-cloud',     gr:'linear-gradient(135deg,#0ea5e9,#34d399)'},
  { id:'notes-peek',    label:'Notes Peek',    ic:'ti-notebook',  gr:'linear-gradient(135deg,#f59e0b,#fbbf24)'},
  { id:'system-stats',  label:'System Stats',  ic:'ti-cpu',       gr:'linear-gradient(135deg,#059669,#34d399)'},
];

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

  if (inst.anchorRight) {
    el.style.right = Math.abs(inst.x) + 'px';
    el.style.top   = inst.y + 'px';
  } else {
    el.style.left = inst.x + 'px';
    el.style.top  = inst.y + 'px';
  }

  el.innerHTML = widgetInnerHTML(inst, def);

  el.addEventListener('mousedown', e => {
    if (e.button !== 0 || e.target.closest('.dw-close')) return;
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const origLeft = el.offsetLeft, origTop = el.offsetTop;
    if (inst.anchorRight) {
      el.style.left = origLeft + 'px';
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
         <i class="ti ti-arrow-up-right"></i></button>`
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

// ── Widget bodies ──
function widgetClockDigital() {
  const now  = new Date();
  const time = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const date = now.toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });
  return `<div class="dw-clock-time" id="dw-digital-time">${time}</div>
          <div class="dw-clock-date" id="dw-digital-date">${date}</div>`;
}

function widgetClockAnalog(iid) {
  return `<canvas class="dw-analog-canvas" id="${iid}-canvas" width="110" height="110"></canvas>`;
}

function widgetCalendar() {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth(), today = now.getDate();
  const monthName = now.toLocaleDateString([], { month:'long', year:'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let cells = '';
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => { cells += `<div class="dw-cal-head">${d}</div>`; });
  for (let i = 0; i < firstDay; i++) cells += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    cells += `<div class="dw-cal-day ${d === today ? 'dw-cal-today' : ''}">${d}</div>`;
  }
  return `<div class="dw-cal-month">${monthName}</div><div class="dw-cal-grid">${cells}</div>`;
}

function widgetWeather() {
  return `<div class="dw-weather-main">
      <i class="ti ti-cloud-sun dw-weather-icon"></i>
      <div><div class="dw-weather-temp">--°</div><div class="dw-weather-desc">Location unavailable</div></div>
    </div>
    <div class="dw-weather-hint">Enable location to show live weather</div>`;
}

function widgetNotesPeek() {
  const el = document.getElementById('notes-editor');
  const text = el ? (el.innerText.trim() || 'No notes yet.') : 'Open Notes to start writing.';
  return `<div class="dw-notes-peek" onclick="openApp('notes')">${text.slice(0, 120)}${text.length > 120 ? '…' : ''}</div>
    <button class="dw-notes-btn" onclick="openApp('notes')"><i class="ti ti-pencil"></i> Open Notes</button>`;
}

function widgetSystemStats() {
  const cores = navigator.hardwareConcurrency || '—';
  const mem = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—';
  const upMs = Date.now() - OS_BOOT_TIME;
  const upMin = Math.floor(upMs / 60000);
  return `<div class="dw-stat-row"><span>CPU Cores</span><span>${cores}</span></div>
    <div class="dw-stat-row"><span>Memory</span><span>${mem}</span></div>
    <div class="dw-stat-row"><span>Uptime</span><span id="dw-uptime">${upMin}m</span></div>
    <div class="dw-stat-row"><span>Windows</span><span id="dw-wincount">${Object.keys(wins).length}</span></div>
    <button class="dw-notes-btn" style="margin-top:6px" onclick="openApp('settings')"><i class="ti ti-settings"></i> Open Settings</button>`;
}

// ── Tick ──
function tickWidgets() {
  const timeEl = document.getElementById('dw-digital-time');
  const dateEl = document.getElementById('dw-digital-date');
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });

  WIDGET_INSTANCES.forEach(inst => {
    if (inst.defId !== 'clock-analog' || !inst.visible) return;
    drawWidgetAnalog(inst.iid);
  });

  const uptEl = document.getElementById('dw-uptime');
  if (uptEl) uptEl.textContent = Math.floor((Date.now() - OS_BOOT_TIME) / 60000) + 'm';
  const wcEl = document.getElementById('dw-wincount');
  if (wcEl) wcEl.textContent = Object.keys(wins).length;
}

function drawWidgetAnalog(iid) {
  const canvas = document.getElementById(iid + '-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const r = canvas.width / 2;
  const now = new Date();
  const H = now.getHours() % 12, M = now.getMinutes(), S = now.getSeconds();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(r, r, r - 4, 0, Math.PI * 2); ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 3 === 0;
    ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(r + Math.cos(a) * (r - 12), r + Math.sin(a) * (r - 12));
    ctx.lineTo(r + Math.cos(a) * (r - 5), r + Math.sin(a) * (r - 5));
    ctx.stroke();
  }

  const hA = ((H + M / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r, r); ctx.lineTo(r + Math.cos(hA) * (r * 0.5), r + Math.sin(hA) * (r * 0.5)); ctx.stroke();

  const mA = ((M + S / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r, r); ctx.lineTo(r + Math.cos(mA) * (r * 0.72), r + Math.sin(mA) * (r * 0.72)); ctx.stroke();

  const sA = (S / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = 'rgba(245,158,11,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(r, r); ctx.lineTo(r + Math.cos(sA) * (r * 0.8), r + Math.sin(sA) * (r * 0.8)); ctx.stroke();

  ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(r, r, 3, 0, Math.PI * 2); ctx.fill();
}

// ── Widget instance management ──
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
    } else { el.remove(); }
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

function refreshWidgetsApp() {
  const panel = document.querySelector('.widgets-instance-list');
  if (panel) panel.innerHTML = buildWidgetInstanceList();
}

// ── APP: Widgets ──
function buildWidgets() {
  return `
    <div class="widgets-wrap" onmousedown="event.stopPropagation()">
      <div class="widgets-sidebar">
        <div class="widgets-sidebar-label">Available Widgets</div>
        ${WIDGET_DEFS.map(def => {
          const isActive = WIDGET_INSTANCES.some(i => i.defId === def.id && i.visible);
          return `<div class="widget-card ${isActive ? 'widget-card-active' : ''}">
            <div class="widget-card-icon" style="background:${def.gr}"><i class="ti ${def.ic}"></i></div>
            <div class="widget-card-info">
              <div class="widget-card-name">${def.label}</div>
              ${def.relatedApp ? `<div class="widget-card-related" onclick="openApp('${def.relatedApp}')"><i class="ti ti-arrow-up-right"></i> Related: ${def.relatedApp.charAt(0).toUpperCase()+def.relatedApp.slice(1)}</div>` : ''}
            </div>
            <button class="widget-card-add" onclick="addWidgetInstance('${def.id}')" title="Add to desktop"><i class="ti ti-plus"></i></button>
          </div>`;
        }).join('')}
      </div>
      <div class="widgets-main">
        <div class="widgets-sidebar-label">On Desktop</div>
        <div class="widgets-instance-list">${buildWidgetInstanceList()}</div>
        <div class="widgets-divider"></div>
        <div class="widgets-sidebar-label" style="margin-top:8px">Quick Actions</div>
        <div class="widgets-actions">
          <button class="settings-btn" onclick="renderAllWidgets();notify('Widgets refreshed')"><i class="ti ti-refresh" style="font-size:11px"></i> Refresh All</button>
          <button class="settings-btn settings-btn-danger" onclick="widgetsClearAll()"><i class="ti ti-trash" style="font-size:11px"></i> Clear All</button>
        </div>
        <div class="widgets-hint"><i class="ti ti-drag-drop"></i> Drag any widget on the desktop to reposition it.</div>
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
    return `<div class="widget-instance-row">
      <div class="widget-instance-icon" style="background:${def.gr}"><i class="ti ${def.ic}"></i></div>
      <span class="widget-instance-name">${def.label}</span>
      <div class="widget-instance-actions">
        <button class="dw-action-btn" onclick="toggleWidgetVisibility('${inst.iid}')" title="${inst.visible ? 'Hide' : 'Show'}"><i class="ti ${inst.visible ? 'ti-eye' : 'ti-eye-off'}"></i></button>
        <button class="dw-action-btn dw-action-danger" onclick="removeWidgetInstance('${inst.iid}')" title="Remove"><i class="ti ti-trash"></i></button>
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