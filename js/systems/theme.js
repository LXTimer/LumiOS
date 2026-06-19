"use strict";

// ─────────────────────────────────────────────
//  Theme Engine
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
  const ov = document.getElementById('brightness-overlay');
  if (!ov) return;
  ov.style.opacity = ((100 - OS_SETTINGS.brightness) / 100 * 0.85).toFixed(2);
}

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