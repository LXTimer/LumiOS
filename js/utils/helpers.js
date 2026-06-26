"use strict";

// ─────────────────────────────────────────────
//  Notification helper
// ─────────────────────────────────────────────
let notifTimer;
function notify(msg) {
  if (!OS_SETTINGS.notifications) return;
  const el = document.getElementById('nmsg');
  if (el) el.textContent = msg;
  const notif = document.getElementById('notif');
  if (!notif) return;
  notif.style.display = 'block';
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => { notif.style.display = 'none'; }, OS_SETTINGS.notifDuration);
}

// ─────────────────────────────────────────────
//  Clock update
// ─────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
  const trayDate = now.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  const bigDate = now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const el = id => document.getElementById(id);
  if (el('tclk'))     el('tclk').textContent = time;
  if (el('tdate'))    el('tdate').textContent = trayDate;
  if (el('big-time')) el('big-time').textContent = time;
  if (el('big-date')) el('big-date').textContent = bigDate;
}

// ─────────────────────────────────────────────
//  Uptime tracker
// ─────────────────────────────────────────────
const OS_BOOT_TIME = Date.now();
let uptimeInterval = null;

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

// ─────────────────────────────────────────────
//  Lock Screen
// ─────────────────────────────────────────────
function setLockScreenVisible(visible) {
  const ls = document.getElementById('lock-screen');
  if (!ls) return;
  ls.classList.toggle('visible', visible);

  if (visible) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeEl = document.querySelector('.lock-time');
    const dateEl = document.querySelector('.lock-date');
    if (timeEl) timeEl.textContent = time;
    if (dateEl) dateEl.textContent = date;

    const osbg = document.getElementById('osbg');
    const lockBg = document.getElementById('lock-bg');
    if (osbg && lockBg) {
      lockBg.style.background = osbg.style.background || getComputedStyle(osbg).background;
    }
  }
}

function unlockOS() {
  setLockScreenVisible(false);
}
