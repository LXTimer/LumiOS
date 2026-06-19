"use strict";

// ─────────────────────────────────────────────
//  Desktop Icons
// ─────────────────────────────────────────────
function renderDesktopIcons() {
  const container = document.getElementById('dkicons');
  if (!container) return;
  container.innerHTML = APPS.map(a => `
    <div class="dki" onclick="openApp('${a.id}')" title="${a.name}" role="listitem">
      <div class="dki-icon" style="background:${a.gr}">
        <i class="ti ${a.ic}" aria-hidden="true"></i>
      </div>
      <span class="dki-label">${a.name}</span>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
//  Context Menu
// ─────────────────────────────────────────────
let ctxOpen = false;

function showContextMenu(x, y) {
  const menu = document.getElementById('ctx-menu');
  if (!menu) return;
  menu.style.display = 'block';
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
  if (menu) menu.classList.remove('visible');
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