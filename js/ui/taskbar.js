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
// Taskbar Search (beside Start button)
// ─────────────────────────────────────────────
function openStartMenuFromTaskbarSearch() {
  const m = document.getElementById('smenu');
  const btn = document.getElementById('smbtn');
  const s = document.getElementById('tbsearch');
  if (!m || !s) return;

  m.style.display = 'block';
  if (btn) btn.setAttribute('aria-expanded', 'true');

  // Keep cursor in taskbar search
  setTimeout(() => { s.focus(); s.select(); }, 0);

  // Sync results immediately
  filterStartMenuFromTaskbar(s.value || '');
}

function filterStartMenuFromTaskbar(q) {
  const m = document.getElementById('smenu');
  if (m && m.style.display !== 'block') m.style.display = 'block';
  filterStartMenu(q || '');
}

function handleTaskbarSearchKey(e) {
  const key = e.key;
  if (key === 'Escape') {
    closeStartMenu();
    return;
  }

  if (key !== 'Enter') return;

  const grid = document.getElementById('smgrid');
  if (!grid) return;

  const first = grid.querySelector('.sm-app');
  if (!first) {
    notify('No matching apps');
    return;
  }

  // Activate the first match
  const onclick = first.getAttribute('onclick') || '';
  // onclick is like: openApp('id'); closeStartMenu();
  const match = onclick.match(/openApp\('([^']+)'\)/);
  if (match && match[1]) {
    openApp(match[1]);
    closeStartMenu();
  } else {
    // fallback: click
    first.click();
  }
}

// ─────────────────────────────────────────────
//  Tray — Wi-Fi
// ─────────────────────────────────────────────
let wifiOn = true;
function toggleWifi() {
  wifiOn = !wifiOn;
  const icon = document.getElementById('tray-wifi-icon');
  if (icon) icon.className = wifiOn ? 'ti ti-wifi' : 'ti ti-wifi-off';
  const btn = document.getElementById('tray-wifi-btn');
  if (btn) btn.classList.toggle('tray-active', wifiOn);
  notify(wifiOn ? 'Wi-Fi connected' : 'Wi-Fi disconnected');
}

// ─────────────────────────────────────────────
//  Tray — Volume (icons in tray now open Quick Settings)
// ─────────────────────────────────────────────
let currentVolume = 80;

function setVolume(val) {
  currentVolume = parseInt(val, 10);
  const slider    = document.getElementById('vol-slider');
  const pct       = document.getElementById('vol-pct');
  const trayIcon  = document.getElementById('tray-vol-icon');
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

function closeVolumePopup() {
  const popup = document.getElementById('volume-popup');
  if (popup) popup.classList.remove('visible');
}

function closeBatteryPopup() {
  const popup = document.getElementById('battery-popup');
  if (popup) popup.classList.remove('visible');
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

// ─────────────────────────────────────────────
//  Tray — Battery
// ─────────────────────────────────────────────
let batManager = null;
let batSaverOn = false;
let batUnsupported = false;

function initBattery() {
  if (!navigator.getBattery) {
    batUnsupported = true;
    const icon = document.getElementById('tray-bat-icon');
    if (icon) icon.className = 'ti ti-battery-off';
    return;
  }

  navigator.getBattery().then(battery => {
    batManager = battery;
    updateBatteryTrayIcon(battery);

    battery.addEventListener('levelchange', () => updateBatteryTrayIcon(battery));
    battery.addEventListener('chargingchange', () => updateBatteryTrayIcon(battery));
  }).catch(() => {
    batUnsupported = true;
    const icon = document.getElementById('tray-bat-icon');
    if (icon) icon.className = 'ti ti-battery-off';
  });
}

function updateBatteryTrayIcon(battery) {
  const icon = document.getElementById('tray-bat-icon');
  if (!icon) return;
  const batteryObj = battery || batManager;
  if (!batteryObj) return;
  const level = batteryObj.level * 100;
  const charging = batteryObj.charging;

  if (charging) {
    icon.className = 'ti ti-battery-charging';
    icon.style.color = '#34d399';
  } else if (level <= 10) {
    icon.className = 'ti ti-battery-1';
    icon.style.color = '#ef4444';
  } else if (level <= 30) {
    icon.className = 'ti ti-battery-2';
    icon.style.color = '#f59e0b';
  } else if (level <= 60) {
    icon.className = 'ti ti-battery-3';
    icon.style.color = 'rgba(255,255,255,0.75)';
  } else {
    icon.className = 'ti ti-battery-4';
    icon.style.color = 'rgba(255,255,255,0.75)';
  }
}

// ─────────────────────────────────────────────
//  Quick Settings Panel
// ─────────────────────────────────────────────
let qsOpen = false;
let bluetoothOn = false;
let nightMode = false;
let dndOn = false;

function toggleQuickSettings() {
  qsOpen = !qsOpen;
  const panel = document.getElementById('quick-settings');
  if (panel) panel.classList.toggle('visible', qsOpen);
  if (qsOpen) {
    updateQuickSettings();
    // Mark all tray buttons as active
    document.querySelectorAll('.tray-btn').forEach(b => {
      if (b.id && b.id.startsWith('tray-')) b.classList.add('tray-active');
    });
  } else {
    document.querySelectorAll('.tray-btn').forEach(b => {
      if (b.id && b.id.startsWith('tray-')) b.classList.remove('tray-active');
    });
  }
}

function closeQuickSettings() {
  qsOpen = false;
  const panel = document.getElementById('quick-settings');
  if (panel) panel.classList.remove('visible');
  document.querySelectorAll('.tray-btn').forEach(b => {
    if (b.id && b.id.startsWith('tray-')) b.classList.remove('tray-active');
  });
}

function updateQuickSettings() {
  const volSlider = document.getElementById('qs-vol-slider');
  const volPct = document.getElementById('qs-vol-pct');
  if (volSlider) volSlider.value = currentVolume;
  if (volPct) volPct.textContent = currentVolume;

  const brtSlider = document.getElementById('qs-brightness-slider');
  const brtPct = document.getElementById('qs-brightness-pct');
  if (brtSlider) brtSlider.value = OS_SETTINGS.brightness;
  if (brtPct) brtPct.textContent = OS_SETTINGS.brightness;

  const wifiTile = document.getElementById('qs-wifi');
  if (wifiTile) wifiTile.classList.toggle('active', wifiOn);

  const btTile = document.getElementById('qs-bluetooth');
  if (btTile) btTile.classList.toggle('active', bluetoothOn);

  const nightTile = document.getElementById('qs-night');
  if (nightTile) nightTile.classList.toggle('active', nightMode);

  const dndTile = document.getElementById('qs-dnd');
  if (dndTile) dndTile.classList.toggle('active', dndOn);

  const batText = document.getElementById('qs-bat-text');
  const batIcon = document.getElementById('qs-bat-icon');
  if (batManager) {
    const level = Math.round(batManager.level * 100);
    if (batText) batText.textContent = 'Battery: ' + level + '%';
    if (batIcon) {
      if (batManager.charging) batIcon.className = 'ti ti-battery-charging';
      else if (level <= 10) batIcon.className = 'ti ti-battery-1';
      else if (level <= 30) batIcon.className = 'ti ti-battery-2';
      else if (level <= 60) batIcon.className = 'ti ti-battery-3';
      else batIcon.className = 'ti ti-battery-4';
    }
  } else {
    if (batText) batText.textContent = 'Battery: --%';
  }
}

function toggleBluetooth() {
  bluetoothOn = !bluetoothOn;
  updateQuickSettings();
  notify(bluetoothOn ? 'Bluetooth enabled' : 'Bluetooth disabled');
}

function toggleNightMode() {
  nightMode = !nightMode;
  if (nightMode) {
    applyBrightness(40);
    const s = document.getElementById('qs-brightness-slider');
    if (s) s.value = 40;
  } else {
    applyBrightness(100);
    const s = document.getElementById('qs-brightness-slider');
    if (s) s.value = 100;
  }
  updateQuickSettings();
  notify(nightMode ? 'Night mode enabled' : 'Night mode disabled');
}

function toggleDnD() {
  dndOn = !dndOn;
  OS_SETTINGS.notifications = !dndOn;
  updateQuickSettings();
  notify(dndOn ? 'Do Not Disturb enabled' : 'Do Not Disturb disabled');
}