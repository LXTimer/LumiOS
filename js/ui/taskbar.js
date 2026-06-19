"use strict";

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
  const grid = document.getElementById('smgrid');
  if (!grid) return;
  grid.innerHTML = list.map(a => `
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
  const btn = document.getElementById('smbtn');
  if (btn) btn.setAttribute('aria-expanded', !open);
  if (!open) setTimeout(() => { const s = document.getElementById('srch'); if (s) s.focus(); }, 50);
}

function closeStartMenu() {
  const m = document.getElementById('smenu');
  if (m) m.style.display = 'none';
}

// ─────────────────────────────────────────────
//  Tray — Wi-Fi
// ─────────────────────────────────────────────
let wifiOn = true;
function toggleWifi() {
  wifiOn = !wifiOn;
  const icon = document.getElementById('wifi-icon');
  if (icon) icon.className = wifiOn ? 'ti ti-wifi' : 'ti ti-wifi-off';
  const btn = document.getElementById('wifi-btn');
  if (btn) btn.classList.toggle('tray-active', wifiOn);
  notify(wifiOn ? 'Wi-Fi connected' : 'Wi-Fi disconnected');
}

// ─────────────────────────────────────────────
//  Tray — Volume
// ─────────────────────────────────────────────
let volOpen = false;
let currentVolume = 80;

function toggleVolume() {
  volOpen = !volOpen;
  const popup = document.getElementById('volume-popup');
  if (popup) popup.classList.toggle('visible', volOpen);
  const btn = document.getElementById('vol-btn');
  if (btn) btn.classList.toggle('tray-active', volOpen);
}

function closeVolumePopup() {
  volOpen = false;
  const popup = document.getElementById('volume-popup');
  if (popup) popup.classList.remove('visible');
  const btn = document.getElementById('vol-btn');
  if (btn) btn.classList.remove('tray-active');
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

  document.querySelectorAll('audio, video').forEach(m => { m.volume = currentVolume / 100; });
}

// ─────────────────────────────────────────────
//  Tray — Calendar
// ─────────────────────────────────────────────
let calOpen = false, calYear, calMonth;

function showCalendar() {
  calOpen = !calOpen;
  const popup = document.getElementById('calendar-popup');
  if (popup) popup.classList.toggle('visible', calOpen);
  const btn = document.querySelector('.tray-clock-btn');
  if (btn) btn.classList.toggle('tray-active', calOpen);
  if (calOpen) {
    const now = new Date();
    calYear = now.getFullYear(); calMonth = now.getMonth();
    renderCalendar();
  }
}

function closeCalendar() {
  calOpen = false;
  const popup = document.getElementById('calendar-popup');
  if (popup) popup.classList.remove('visible');
  const btn = document.querySelector('.tray-clock-btn');
  if (btn) btn.classList.remove('tray-active');
}

function renderCalendar() {
  const popup = document.getElementById('calendar-popup');
  if (!popup) return;
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