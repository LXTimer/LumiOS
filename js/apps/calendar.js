"use strict";

// ─────────────────────────────────────────────
//  APP: Calendar
// ─────────────────────────────────────────────
let CAL_EVENTS = {};
let calEventsSeeded = false;
const CAL_COLORS = ['#6366f1','#ec4899','#10b981','#f97316','#0ea5e9'];
let capp = { year: 0, month: 0, selectedDate: null, tab: 'month' };

function calKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function calParse(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function cappEsc(s) {
  return String(s).replace(/&/g,'\x26amp;').replace(/</g,'\x26lt;').replace(/>/g,'\x26gt;').replace(/"/g,'\x26quot;');
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
    { id: 1, title: 'Example: Team Standup',  time: '09:00', color: CAL_COLORS[0] },
  ];
  CAL_EVENTS[calKey(addDays(2))]  = [{ id: 3, title: 'Example: Appointment', time: '11:00', color: CAL_COLORS[1] }];
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

function cappRenderMonth() {
  const panel = document.getElementById('capp-month-panel');
  if (!panel) return;
  const now = new Date();
  const firstDay = new Date(capp.year, capp.month, 1).getDay();
  const daysInMonth = new Date(capp.year, capp.month + 1, 0).getDate();

  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += '<div class="capp-cell capp-cell-empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(capp.year, capp.month, d);
    const key = calKey(dateObj);
    const isToday = d === now.getDate() && capp.month === now.getMonth() && capp.year === now.getFullYear();
    const isSelected = key === capp.selectedDate;
    const evts = CAL_EVENTS[key] || [];
    const dots = evts.slice(0, 3).map(e => `<span class="capp-dot" style="background:${e.color}"></span>`).join('');
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
  const key = capp.selectedDate;
  const dateObj = calParse(key);
  const label = dateObj.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const evts = (CAL_EVENTS[key] || []).slice().sort((a, b) => a.time.localeCompare(b.time));

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
      <input type="text" class="capp-input" id="capp-new-title" placeholder="Event title…" onmousedown="event.stopPropagation()" onkeydown="if(event.key==='Enter')cappAddEvent()">
      <div class="capp-add-row">
        <input type="time" class="capp-input capp-input-time" id="capp-new-time" value="09:00" onmousedown="event.stopPropagation()">
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
  const timeInput = document.getElementById('capp-new-time');
  const colorEl = document.querySelector('#capp-new-color-picker .capp-color-active');
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

function cappRenderAgenda() {
  const panel = document.getElementById('capp-agenda-panel');
  if (!panel) return;
  const keys = Object.keys(CAL_EVENTS).sort();
  if (keys.length === 0) {
    panel.innerHTML = `<div class="capp-agenda-empty"><i class="ti ti-calendar-off"></i><div>No upcoming events</div></div>`;
    return;
  }
  const todayKey = calKey(new Date());
  panel.innerHTML = keys.map(key => {
    const dateObj = calParse(key);
    const label = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const isToday = key === todayKey;
    const evts = CAL_EVENTS[key].slice().sort((a, b) => a.time.localeCompare(b.time));
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