"use strict";

// ─────────────────────────────────────────────
//  APP: Settings
// ─────────────────────────────────────────────
const SETTINGS_NAV = [
  { id:'appearance',    ic:'ti-palette',     label:'Appearance'    },
  { id:'display',       ic:'ti-screen',      label:'Display'       },
  { id:'notifications', ic:'ti-bell',        label:'Notifications' },
  { id:'security',      ic:'ti-lock',        label:'Security'      },
  { id:'about',         ic:'ti-info-circle', label:'About'         },
];

let activeSettingsPanel = 'appearance';

function buildSettings() {
  const nav = SETTINGS_NAV.map(n => `
    <div class="settings-nav-item ${n.id===activeSettingsPanel?'active':''}"
         onclick="switchSettingsPanel('${n.id}',this)">
      <i class="ti ${n.ic}"></i> ${n.label}
    </div>
  `).join('');

  return `
    <div class="settings-wrap">
      <div class="settings-sidebar">${nav}</div>
      <div class="settings-content" id="settings-panel" onmousedown="event.stopPropagation()">
        ${buildSettingsPanel(activeSettingsPanel)}
      </div>
    </div>`;
}

function switchSettingsPanel(id, el) {
  activeSettingsPanel = id;
  el.closest('.settings-sidebar').querySelectorAll('.settings-nav-item')
    .forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  clearInterval(uptimeInterval);
  const panel = el.closest('.settings-wrap').querySelector('#settings-panel');
  if (panel) {
    panel.innerHTML = buildSettingsPanel(id);
    if (id === 'about') startUptimeTicker();
  }
}

function buildSettingsPanel(id) {
  switch (id) {
    case 'appearance':    return panelAppearance();
    case 'display':       return panelDisplay();
    case 'notifications': return panelNotifications();
    case 'security':      return panelSecurity();
    case 'about':         return panelAbout();
    default:              return panelAppearance();
  }
}

// ── Appearance ──
function panelAppearance() {
  const ACCENTS = [
    { color:'#6366f1', label:'Indigo'  },
    { color:'#ec4899', label:'Pink'    },
    { color:'#0ea5e9', label:'Sky'     },
  ];
  const toggleRow = (key, label, desc) => {
    const on = OS_SETTINGS[key];
    return `
      <div class="settings-row">
        <div class="settings-row-info">
          <div class="settings-row-label">${label}</div>
          <div class="settings-row-desc">${desc}</div>
        </div>
        <div class="toggle-sw ${on?'on':''}" data-key="${key}" data-on="${on?1:0}"
             onclick="settingToggle(this)" role="switch" aria-checked="${on}" aria-label="${label}">
          <div class="toggle-knob" style="left:${on?'auto':'3px'};right:${on?'3px':'auto'}"></div>
        </div>
      </div>`;
  };

  return `
    <div class="settings-section-title">Appearance</div>
    ${toggleRow('transparency','Transparency','Window blur & glass effects')}
    ${toggleRow('darkMode','Dark Mode','System-wide dark theme')}
    ${toggleRow('animations','Animations','Motion & transition effects')}
    ${toggleRow('particles', 'Particles', 'Drifting stars on the desktop')}

    <div style="margin-top:14px">
      <div class="settings-row-label" style="margin-bottom:8px">Accent Color</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${ACCENTS.map(a => `
          <div class="color-swatch" title="${a.label}"
               style="background:${a.color};border:2px solid ${a.color===OS_SETTINGS.accent?'white':'transparent'}"
               onclick="applyAccent('${a.color}',true);
                        this.closest('.settings-content').querySelectorAll('.color-swatch')
                            .forEach(s=>s.style.border='2px solid transparent');
                        this.style.border='2px solid white'">
          </div>
        `).join('')}
      </div>
    </div>

    <div style="margin-top:18px">
      <div class="settings-row-label" style="margin-bottom:8px">Wallpaper</div>
      <div class="wp-grid">
        ${WALLPAPERS.map(w => `
          <div class="wp-swatch ${OS_SETTINGS.wallpaper===w.id?'wp-active':''}"
               title="${w.label}" style="background:${w.css}"
               onclick="applyWallpaper('${w.id}');
                        this.closest('.wp-grid').querySelectorAll('.wp-swatch')
                            .forEach(s=>s.classList.remove('wp-active'));
                        this.classList.add('wp-active')">
            <span class="wp-label">${w.label}</span>
          </div>
        `).join('')}
        <label class="wp-swatch wp-upload" title="Custom image">
          <input type="file" accept="image/*" style="display:none"
                 onchange="const f=this.files[0]; if(!f) return;
                   const r=new FileReader();
                   r.onload=e=>{ applyWallpaper(null, e.target.result);
                     this.closest('.wp-grid').querySelectorAll('.wp-swatch').forEach(s=>s.classList.remove('wp-active'));
                     this.closest('.wp-swatch').classList.add('wp-active'); };
                   r.readAsDataURL(f)">
          <i class="ti ti-photo-up" style="font-size:18px;opacity:0.5"></i>
          <span class="wp-label">Custom</span>
        </label>
      </div>
    </div>`;
}

// ── Display ──
function panelDisplay() {
  const brt = OS_SETTINGS.brightness;
  return `
    <div class="settings-section-title">Display</div>
    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Brightness</div>
        <div class="settings-row-desc">Screen brightness level</div>
      </div>
      <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Taskbar Opacity</div>
        <div class="settings-row-desc">Adjust taskbar transparency</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <i class="ti ti-eye-off" style="font-size:13px;color:rgba(255,255,255,.4)"></i>
        <input type="range" class="settings-slider" min="10" max="100" value="${OS_SETTINGS.taskbarOpacity}"
               oninput="applyTaskbarOpacity(this.value);document.getElementById('tbo-val').textContent=this.value+'%'">
        <i class="ti ti-eye" style="font-size:13px;color:rgba(255,255,255,.6)"></i>
        <span id="tbo-val" style="font-size:11px;color:rgba(255,255,255,.5);width:32px">${OS_SETTINGS.taskbarOpacity}%</span>
      </div>
    </div>
      <div style="display:flex;align-items:center;gap:8px">
        <i class="ti ti-sun-low" style="font-size:13px;color:rgba(255,255,255,.4)"></i>
        <input type="range" class="settings-slider" min="20" max="100" value="${brt}"
               oninput="applyBrightness(this.value);document.getElementById('brt-val').textContent=this.value+'%'">
        <i class="ti ti-sun" style="font-size:13px;color:rgba(255,255,255,.6)"></i>
        <span id="brt-val" style="font-size:11px;color:rgba(255,255,255,.5);width:32px">${brt}%</span>
      </div>
    </div>
    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Resolution</div>
        <div class="settings-row-desc">Display resolution</div>
      </div>
      <select class="settings-select" onchange="notify('Resolution change requires restart')">
        <option>1920 × 1080</option>
        <option>2560 × 1440</option>
        <option>3840 × 2160</option>
      </select>
    </div>
    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Refresh Rate</div>
        <div class="settings-row-desc">Display refresh rate</div>
      </div>
      <select class="settings-select" onchange="notify('Refresh rate updated to '+this.value)">
        <option>60 Hz</option>
        <option>120 Hz</option>
        <option>144 Hz</option>
      </select>
    </div>
    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Night Mode</div>
        <div class="settings-row-desc">Reduce blue light after sunset</div>
      </div>
      <div class="toggle-sw" data-on="0"
           onclick="var on=this.dataset.on==='1';this.dataset.on=on?'0':'1';this.classList.toggle('on',!on);
                    var k=this.querySelector('.toggle-knob');k.style.left=on?'auto':'3px';k.style.right=on?'3px':'auto';
                    notify(!on?'Night Mode enabled':'Night Mode disabled')" role="switch">
        <div class="toggle-knob" style="left:3px;right:auto"></div>
      </div>
    </div>`;
}

// ── Notifications ──
function panelNotifications() {
  const dur = OS_SETTINGS.notifDuration / 1000;
  return `
    <div class="settings-section-title">Notifications</div>
    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Show Notifications</div>
        <div class="settings-row-desc">Display system notifications</div>
      </div>
      <div class="toggle-sw ${OS_SETTINGS.notifications?'on':''}"
           data-on="${OS_SETTINGS.notifications?1:0}"
           onclick="OS_SETTINGS.notifications=this.dataset.on!=='1';this.dataset.on=OS_SETTINGS.notifications?'1':'0';
                    this.classList.toggle('on',OS_SETTINGS.notifications);
                    var k=this.querySelector('.toggle-knob');
                    k.style.left=OS_SETTINGS.notifications?'auto':'3px';k.style.right=OS_SETTINGS.notifications?'3px':'auto';
                    if(OS_SETTINGS.notifications)notify('Notifications enabled')" role="switch">
        <div class="toggle-knob" style="left:${OS_SETTINGS.notifications?'auto':'3px'};right:${OS_SETTINGS.notifications?'3px':'auto'}"></div>
      </div>
    </div>
    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Duration</div>
        <div class="settings-row-desc">How long notifications stay visible</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="range" class="settings-slider" min="1" max="10" value="${dur}"
               oninput="OS_SETTINGS.notifDuration=this.value*1000;document.getElementById('ndur-val').textContent=this.value+'s'">
        <span id="ndur-val" style="font-size:11px;color:rgba(255,255,255,.5);width:24px">${dur}s</span>
      </div>
    </div>
    <div style="margin-top:14px">
      <button class="settings-btn" onclick="notify('This is a test notification from LumiOS!')">
        <i class="ti ti-bell" style="font-size:12px"></i> Send Test Notification
      </button>
    </div>`;
}

// ── Security ──
function panelSecurity() {
  return `
    <div class="settings-section-title">Security</div>
    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Auto-Lock</div>
        <div class="settings-row-desc">Lock screen when idle</div>
      </div>
      <div class="toggle-sw ${OS_SETTINGS.autoLock?'on':''}"
           data-on="${OS_SETTINGS.autoLock?1:0}"
           onclick="OS_SETTINGS.autoLock=this.dataset.on!=='1';this.dataset.on=OS_SETTINGS.autoLock?'1':'0';
                    this.classList.toggle('on',OS_SETTINGS.autoLock);
                    var k=this.querySelector('.toggle-knob');
                    k.style.left=OS_SETTINGS.autoLock?'auto':'3px';k.style.right=OS_SETTINGS.autoLock?'3px':'auto';
                    notify('Auto-lock '+(OS_SETTINGS.autoLock?'enabled':'disabled'))" role="switch">
        <div class="toggle-knob" style="left:${OS_SETTINGS.autoLock?'auto':'3px'};right:${OS_SETTINGS.autoLock?'3px':'auto'}"></div>
      </div>
    </div>
    <div class="settings-row">
      <div class="settings-row-info">
        <div class="settings-row-label">Lock After</div>
        <div class="settings-row-desc">Minutes of idle before locking</div>
      </div>
      <select class="settings-select"
              onchange="OS_SETTINGS.screensaver=parseInt(this.value);notify('Lock timeout set to '+this.value+' min')">
        <option value="1" ${OS_SETTINGS.screensaver===1?'selected':''}>1 minute</option>
        <option value="5" ${OS_SETTINGS.screensaver===5?'selected':''}>5 minutes</option>
        <option value="10" ${OS_SETTINGS.screensaver===10?'selected':''}>10 minutes</option>
        <option value="30" ${OS_SETTINGS.screensaver===30?'selected':''}>30 minutes</option>
      </select>
    </div>
    <div style="margin-top:14px;display:flex;gap:8px">
      <button class="settings-btn" onclick="notify('Password management requires server-side support')">
        <i class="ti ti-key" style="font-size:12px"></i> Change Password
      </button>
      <button class="settings-btn settings-btn-danger" onclick="notify('Screen locked (demo)')">
        <i class="ti ti-lock" style="font-size:12px"></i> Lock Now
      </button>
    </div>`;
}

// ── About ──
function panelAbout() {
  const ua = navigator.userAgent;
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown';
  const cores = navigator.hardwareConcurrency || '—';
  const mem = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—';

  return `
    <div class="settings-section-title">About LumiOS</div>
    <div class="settings-info-box" style="margin-bottom:12px">
      <div><span>Version</span> LumiOS 1.3.3</div>
      <div><span>Build</span> 2025.06.16</div>
      <div><span>Kernel</span> LumiCore 1.0</div>
      <div><span>Platform</span> Web-based</div>
      <div><span>Browser</span> ${browser}</div>
      <div><span>Uptime</span> <span id="uptime-val">${getUptime()}</span></div>
    </div>
    <div class="settings-section-title">System Resources</div>
    <div class="settings-resource">
      <div class="settings-resource-label">CPU Cores</div>
      <div class="settings-resource-bar"><div class="settings-resource-fill" style="width:${Math.min(cores*12,95)}%"></div></div>
      <div class="settings-resource-value">${cores} cores</div>
    </div>
    <div class="settings-resource">
      <div class="settings-resource-label">Device Memory</div>
      <div class="settings-resource-bar"><div class="settings-resource-fill" style="width:60%"></div></div>
      <div class="settings-resource-value">${mem}</div>
    </div>
    <div class="settings-resource">
      <div class="settings-resource-label">Storage</div>
      <div class="settings-resource-bar"><div class="settings-resource-fill" style="width:42%"></div></div>
      <div class="settings-resource-value">42% used</div>
    </div>
    <div style="margin-top:14px">
      <button class="settings-btn" onclick="notify('Checking for updates… LumiOS is up to date!')">
        <i class="ti ti-refresh" style="font-size:12px"></i> Check for Updates
      </button>
    </div>`;
}

// ── Settings toggle helper ──
function settingToggle(el) {
  const on = el.dataset.on === '1';
  const newOn = !on;
  el.dataset.on = newOn ? '1' : '0';
  el.classList.toggle('on', newOn);
  el.setAttribute('aria-checked', newOn);
  const knob = el.querySelector('.toggle-knob');
  knob.style.left = newOn ? 'auto' : '3px';
  knob.style.right = newOn ? '3px' : 'auto';

  const key = el.dataset.key;
  OS_SETTINGS[key] = newOn;
  if (key === 'transparency') applyTransparency(newOn);
  if (key === 'darkMode')     applyDarkMode(newOn);
  if (key === 'animations')   applyAnimations(newOn);
  if (key === 'particles') applyParticles(newOn);
}