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
  taskbarOpacity: 60, 
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
