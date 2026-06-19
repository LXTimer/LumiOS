"use strict";

// ─────────────────────────────────────────────
//  App Registry
// ─────────────────────────────────────────────
const APPS = [
  { id:'welcome',    name:'Welcome',    ic:'ti-sparkles',  gr:'linear-gradient(135deg,#9333ea,#e11d9c)', w:472, h:328 },
  { id:'clock',      name:'Clock',      ic:'ti-clock',     gr:'linear-gradient(135deg,#f59e0b,#f97316)', w:475, h:525 },
  { id:'calendar',   name:'Calendar',   ic:'ti-calendar',  gr:'linear-gradient(135deg,#06b6d4,#3b82f6)', w:580, h:460 },
  { id:'calculator', name:'Calculator', ic:'ti-calculator', gr:'linear-gradient(135deg,#0077ff,#00c2ff)', w:252, h:382 },
  { id:'notes',      name:'Notes',      ic:'ti-notebook',   gr:'linear-gradient(135deg,#f59e0b,#fbbf24)', w:374, h:308 },
  { id:'terminal',   name:'Terminal',   ic:'ti-terminal-2', gr:'linear-gradient(135deg,#059669,#34d399)', w:442, h:286 },
  { id:'files',      name:'Files',      ic:'ti-folder',     gr:'linear-gradient(135deg,#e11d48,#f97316)', w:420, h:325 },
  { id:'settings',   name:'Settings',   ic:'ti-settings',   gr:'linear-gradient(135deg,#0ea5e9,#6366f1)', w:825, h:488 },
  { id:'widgets', name:'Widgets', ic:'ti-layout-dashboard', gr:'linear-gradient(135deg,#7c3aed,#0ea5e9)', w:460, h:400 },
];

// ─────────────────────────────────────────────
//  OS Settings / Global State
// ─────────────────────────────────────────────
const OS_SETTINGS = {
  particles: true,
  transparency: true,
  darkMode: true,
  animations: true,
  accent: '#6366f1',
  accentRgb: '99,102,241',
  brightness: 100,
  taskbarOpacity: 80,   // ← Add this (default 80%)
  notifications: true,
  notifDuration: 3200,
  autoLock: false,
  screensaver: 5,
  widgets: true,
  wallpaper: 'default',
};

// ─────────────────────────────────────────────
//  Date helpers
// ─────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─────────────────────────────────────────────
//  Wallpaper presets
// ─────────────────────────────────────────────
const WALLPAPERS = [
  {
    id: 'default',
    label: 'Aurora',
    css: `
      radial-gradient(ellipse 55% 55% at 18% 22%, rgba(90,18,200,0.45), transparent),
      radial-gradient(ellipse 45% 45% at 82% 78%, rgba(18,60,200,0.35), transparent),
      radial-gradient(ellipse 38% 38% at 62% 16%, rgba(200,18,85,0.2), transparent),
      linear-gradient(148deg, #050510, #0a0520 45%, #040919)
    `,
  },
  {
    id: 'midnight',
    label: 'Midnight',
    css: `
      radial-gradient(ellipse 60% 50% at 50% 100%, rgba(30,10,80,0.9), transparent),
      linear-gradient(180deg, #000005, #05010f)
    `,
  },
  {
    id: 'nebula',
    label: 'Nebula',
    css: `
      radial-gradient(ellipse 70% 60% at 20% 80%, rgba(20,180,120,0.3), transparent),
      radial-gradient(ellipse 50% 50% at 80% 20%, rgba(180,20,200,0.35), transparent),
      radial-gradient(ellipse 40% 40% at 50% 50%, rgba(0,60,160,0.25), transparent),
      linear-gradient(135deg, #020c14, #060818)
    `,
  },
  {
    id: 'ember',
    label: 'Ember',
    css: `
      radial-gradient(ellipse 36% 48% at 15% 85%, rgba(220,60,10,0.5), transparent),
      radial-gradient(ellipse 45% 45% at 85% 20%, rgba(200,120,0,0.35), transparent),
      linear-gradient(148deg, #0e0500, #1a0800 45%, #0a0300)
    `,
  },
  {
    id: 'ocean',
    label: 'Ocean',
    css: `
      radial-gradient(ellipse 60% 60% at 30% 30%, rgba(0,100,200,0.4), transparent),
      radial-gradient(ellipse 50% 50% at 70% 70%, rgba(0,180,160,0.3), transparent),
      linear-gradient(148deg, #000d1a, #001a2e 45%, #000f1f)
    `,
  },
  {
    id: 'rose',
    label: 'Rose',
    css: `
      radial-gradient(ellipse 55% 55% at 20% 30%, rgba(200,20,100,0.4), transparent),
      radial-gradient(ellipse 45% 45% at 75% 70%, rgba(120,0,180,0.35), transparent),
      linear-gradient(148deg, #100008, #1a000e 45%, #0d0008)
    `,
  },
  {
    id: 'wallpaper_nature_1',
    label: 'Nature 1',
    css: `url('assets/wallpaper/wallpaper_nature_1.jpg') center/cover no-repeat`,
  },
  {
    id: 'wallpaper_nature_2',
    label: 'Nature 2',
    css: `url('assets/wallpaper/wallpaper_nature_2.jpg') center/cover no-repeat`,
  },
  {
    id: 'wallpaper_nature_3',
    label: 'Nature 3',
    css: `url('assets/wallpaper/wallpaper_nature_3.jpg') center/cover no-repeat`,
  },
];
