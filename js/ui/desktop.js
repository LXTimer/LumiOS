"use strict";

// ─────────────────────────────────────────────
//  Desktop Icons — Draggable
// ─────────────────────────────────────────────
const DESKTOP_ICON_POSITIONS = {};

function loadDesktopIconPositions() {
  try {
    const saved = localStorage.getItem('lumios_desktop_icons');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(DESKTOP_ICON_POSITIONS, parsed);
    }
  } catch (e) { /* ignore */ }
}

function saveDesktopIconPositions() {
  try {
    localStorage.setItem('lumios_desktop_icons', JSON.stringify(DESKTOP_ICON_POSITIONS));
  } catch (e) { /* ignore */ }
}

function renderDesktopIcons() {
  const container = document.getElementById('dkicons');
  if (!container) return;
  loadDesktopIconPositions();
  container.innerHTML = APPS.map((a, idx) => {
    let pos = DESKTOP_ICON_POSITIONS[a.id];
    if (!pos) {
      // Default staggered layout: 14px top padding, icons flow left->right
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      pos = { x: 10 + col * 84, y: 14 + row * 90 };
    }
    return `
      <div class="dki" data-app-id="${a.id}"
           style="left:${pos.x}px;top:${pos.y}px;"
           ondblclick="openApp('${a.id}')"
           title="Double-click to open ${a.name}"
           role="listitem">
        <div class="dki-icon" style="background:${a.gr}">
          <i class="ti ${a.ic}" aria-hidden="true"></i>
        </div>
        <span class="dki-label">${a.name}</span>
      </div>`;
  }).join('');
  makeDesktopIconsDraggable();
}

function makeDesktopIconsDraggable() {
  const container = document.getElementById('dkicons');
  if (!container) return;

  let dragIcon = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let wasDragged = false;

  container.querySelectorAll('.dki').forEach(icon => {
    icon.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      // Don't start drag if double-click would fire
      const rect = icon.getBoundingClientRect();
      dragIcon = icon;
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      wasDragged = false;
      icon.style.cursor = 'grabbing';
      icon.style.transition = 'none';
      icon.style.zIndex = '10';
      e.preventDefault();
    });
  });

  document.addEventListener('mousemove', e => {
    if (!dragIcon) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      wasDragged = true;
    }
    const containerRect = container.getBoundingClientRect();
    const iconRect = dragIcon.getBoundingClientRect();
    // Position relative to #dkicons container
    let newLeft = e.clientX - containerRect.left - dragOffsetX;
    let newTop  = e.clientY - containerRect.top - dragOffsetY;
    // Clamp within bounds (allow some overflow for centering)
    const maxX = container.clientWidth - iconRect.width;
    const maxY = container.clientHeight - iconRect.height;
    newLeft = Math.max(0, Math.min(newLeft, maxX > 0 ? maxX : container.clientWidth));
    newTop  = Math.max(0, Math.min(newTop, maxY > 0 ? maxY : container.clientHeight));
    dragIcon.style.left = newLeft + 'px';
    dragIcon.style.top  = newTop + 'px';
  });

  document.addEventListener('mouseup', e => {
    if (!dragIcon) return;
    dragIcon.style.cursor = '';
    dragIcon.style.transition = '';
    dragIcon.style.zIndex = '';
    const appId = dragIcon.dataset.appId;
    if (appId && wasDragged) {
      const left = parseInt(dragIcon.style.left) || 0;
      const top  = parseInt(dragIcon.style.top)  || 0;
      DESKTOP_ICON_POSITIONS[appId] = { x: left, y: top };
      saveDesktopIconPositions();
    }
    // If it wasn't actually dragged, allow the click to pass through (for double-click)
    dragIcon = null;
  });
}

// ─────────────────────────────────────────────
//  Context Menu
// ─────────────────────────────────────────────
let ctxOpen = false;

function showContextMenu(x, y) {
  const menu = document.getElementById('ctx-menu');
  if (!menu) return;
  menu.classList.remove('visible');

  const menuW = menu.offsetWidth;
  const menuH = menu.offsetHeight;
  const pad   = 6;

  const left = (x + menuW + pad > window.innerWidth)  ? x - menuW : x;
  const top  = (y + menuH + pad > window.innerHeight - 48) ? y - menuH : y;

  menu.style.left = Math.max(pad, left) + 'px';
  menu.style.top  = Math.max(pad, top)  + 'px';
  menu.classList.add('visible');
  ctxOpen = true;
}

function closeContextMenu() {
  if (!ctxOpen) return;
  const menu = document.getElementById('ctx-menu');
  if (menu) {
    menu.classList.remove('visible');
  }
  ctxOpen = false;
}

function ctxAction(action) {
  closeContextMenu();
  switch (action) {
    case 'wallpaper':
      openApp('settings');
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