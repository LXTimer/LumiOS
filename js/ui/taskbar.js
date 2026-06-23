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

// ─────────────────────────────────────────────
//  Tray — Battery
// ─────────────────────────────────────────────
let batOpen = false;
let batManager = null;
let batSaverOn = false;
let batUnsupported = false;

function toggleBatteryPopup() {
  batOpen = !batOpen;
  const popup = document.getElementById('battery-popup');
  if (popup) popup.classList.toggle('visible', batOpen);
  const btn = document.getElementById('battery-btn');
  if (btn) btn.classList.toggle('tray-active', batOpen);
  if (batOpen && batManager) updateBatteryUI(batManager);
}

function closeBatteryPopup() {
  batOpen = false;
  const popup = document.getElementById('battery-popup');
  if (popup) popup.classList.remove('visible');
  const btn = document.getElementById('battery-btn');
  if (btn) btn.classList.remove('tray-active');
}

function initBattery() {
  if (!navigator.getBattery) {
    batUnsupported = true;
    const icon = document.getElementById('battery-icon');
    if (icon) icon.className = 'ti ti-battery-off';
    const pct = document.getElementById('bat-percentage');
    if (pct) pct.textContent = 'N/A';
    const status = document.getElementById('bat-status');
    if (status) status.textContent = 'Battery API not available';
    return;
  }

  navigator.getBattery().then(battery => {
    batManager = battery;
    updateBatteryUI(battery);
    updateBatteryTrayIcon(battery);

    battery.addEventListener('levelchange', () => {
      updateBatteryUI(battery);
      updateBatteryTrayIcon(battery);
    });
    battery.addEventListener('chargingchange', () => {
      updateBatteryUI(battery);
      updateBatteryTrayIcon(battery);
    });
    battery.addEventListener('chargingtimechange', () => updateBatteryUI(battery));
    battery.addEventListener('dischargingtimechange', () => updateBatteryUI(battery));
  }).catch(() => {
    batUnsupported = true;
    const icon = document.getElementById('battery-icon');
    if (icon) icon.className = 'ti ti-battery-off';
  });
}

function updateBatteryTrayIcon(battery) {
  const icon = document.getElementById('battery-icon');
  if (!icon) return;
  const level = battery.level * 100;
  const charging = battery.charging;

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

function updateBatteryUI(battery) {
  const level = Math.round(battery.level * 100);
  const charging = battery.charging;
  const pctEl = document.getElementById('bat-percentage');
  const statusEl = document.getElementById('bat-status');
  const sourceEl = document.getElementById('bat-source');
  const timeEl = document.getElementById('bat-time');
  const healthEl = document.getElementById('bat-health');
  const barFill = document.getElementById('bat-bar-fill');
  const popupIcon = document.getElementById('bat-popup-icon');

  if (pctEl) pctEl.textContent = level + '%';
  if (barFill) {
    barFill.style.width = level + '%';
    if (charging) {
      barFill.style.background = 'linear-gradient(90deg,#34d399,#10b981)';
    } else if (level <= 10) {
      barFill.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)';
    } else if (level <= 30) {
      barFill.style.background = 'linear-gradient(90deg,#f59e0b,#d97706)';
    } else {
      barFill.style.background = 'linear-gradient(90deg,var(--accent-color),#818cf8)';
    }
  }

  if (popupIcon) {
    if (charging) {
      popupIcon.className = 'ti ti-battery-charging';
      popupIcon.style.color = '#34d399';
    } else if (level <= 10) {
      popupIcon.className = 'ti ti-battery-1';
      popupIcon.style.color = '#ef4444';
    } else if (level <= 30) {
      popupIcon.className = 'ti ti-battery-2';
      popupIcon.style.color = '#f59e0b';
    } else if (level <= 60) {
      popupIcon.className = 'ti ti-battery-3';
      popupIcon.style.color = 'var(--accent-color)';
    } else {
      popupIcon.className = 'ti ti-battery-4';
      popupIcon.style.color = 'var(--accent-color)';
    }
  }

  if (statusEl) {
    if (charging && level === 100) statusEl.textContent = 'Fully Charged';
    else if (charging) statusEl.textContent = 'Charging…';
    else if (level <= 10) statusEl.textContent = 'Critical — Plug in soon';
    else if (level <= 20) statusEl.textContent = 'Low battery';
    else statusEl.textContent = 'Power status: OK';
  }

  if (sourceEl) {
    sourceEl.textContent = charging ? 'AC Power' : 'Battery';
  }

  if (timeEl) {
    if (charging && battery.chargingTime !== Infinity) {
      const min = Math.round(battery.chargingTime / 60);
      if (min >= 60) timeEl.textContent = Math.floor(min / 60) + 'h ' + (min % 60) + 'm until full';
      else timeEl.textContent = min + 'm until full';
    } else if (!charging && battery.dischargingTime !== Infinity) {
      const min = Math.round(battery.dischargingTime / 60);
      if (min >= 60) timeEl.textContent = Math.floor(min / 60) + 'h ' + (min % 60) + 'm remaining';
      else timeEl.textContent = min + 'm remaining';
    } else {
      timeEl.textContent = charging ? 'Calculating…' : 'Not available';
    }
  }

  if (healthEl) {
    // Browser API doesn't give health, so we estimate based on cycles / level behavior
    if (level >= 80) healthEl.textContent = 'Good';
    else if (level >= 50) healthEl.textContent = 'Fair';
    else healthEl.textContent = 'Unknown';
  }
}

function toggleBatterySaver(el) {
  batSaverOn = !batSaverOn;
  el.dataset.on = batSaverOn ? '1' : '0';
  el.classList.toggle('on', batSaverOn);
  el.setAttribute('aria-checked', batSaverOn);
  const knob = el.querySelector('.toggle-knob');
  knob.style.left = batSaverOn ? 'auto' : '3px';
  knob.style.right = batSaverOn ? '3px' : 'auto';
  notify(batSaverOn ? 'Battery Saver enabled' : 'Battery Saver disabled');
}
