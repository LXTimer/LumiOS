"use strict";

// ─────────────────────────────────────────────
//  App content router (bridges apps to windows)
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
  if (aid === 'widgets')  refreshWidgetsApp();
}

// ─────────────────────────────────────────────
//  Boot / Init
// ─────────────────────────────────────────────
function init() {
  applyAccent(OS_SETTINGS.accent, false);
  renderDesktopIcons();
  renderStartMenuApps(APPS);
  applyTaskbarOpacity(OS_SETTINGS.taskbarOpacity);
  renderPinnedDock();
  updateClock();
  setInterval(updateClock, 1000);
  initParticles();
  initWidgets();

  setTimeout(() => openApp('welcome'), 200);

  // Close overlays on desktop click
  document.getElementById('osbg').addEventListener('mousedown', e => {
    if (!e.target.closest('#smenu')        && !e.target.closest('#smbtn'))          closeStartMenu();
    if (!e.target.closest('#volume-popup') && !e.target.closest('#vol-btn'))        closeVolumePopup();
    if (!e.target.closest('#calendar-popup') && !e.target.closest('.tray-clock-btn')) closeCalendar();
    if (!e.target.closest('#ctx-menu'))                                              closeContextMenu();
  });

  // Right-click on desktop background opens context menu
  document.getElementById('osbg').addEventListener('contextmenu', e => {
    if (e.target.closest('#wlayer') || e.target.closest('#tbar') || e.target.closest('#smenu')) return;
    e.preventDefault();
    closeStartMenu();
    closeVolumePopup();
    closeCalendar();
    showContextMenu(e.clientX, e.clientY);
  });

  // Escape closes context menu
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeContextMenu();
  });

  document.addEventListener('mousedown', e => {
    if (ctxOpen && ! e.target.closest('#ctx-menu')) {
      closeContextMenu();
    }
  });

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   () => { drag = null; });
}

document.addEventListener('DOMContentLoaded', init);