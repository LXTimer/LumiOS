"use strict";

let clockState = { activeTab: 'time', stopwatchRunning: false, stopwatchMs: 0, alarms: [] };
let clockIntervals = {};

function buildClock() {
  return `
    <div class="clock-wrap">
      <div class="clock-tabs">
        <button class="clock-tab active" data-tab="time" onclick="switchClockTab('time',this)">
          <i class="ti ti-clock"></i> Time
        </button>
        <button class="clock-tab" data-tab="stopwatch" onclick="switchClockTab('stopwatch',this)">
          <i class="ti ti-player-stop"></i> Stopwatch
        </button>
        <button class="clock-tab" data-tab="alarm" onclick="switchClockTab('alarm',this)">
          <i class="ti ti-alarm"></i> Alarm
        </button>
      </div>
      <div class="clock-content">
        <div id="clock-time-panel" class="clock-panel active">
          <div class="clock-analog-wrap">
            <canvas id="clock-canvas" width="280" height="280" style="max-width:100%;height:auto;border-radius:50%"></canvas>
          </div>
          <div class="clock-digital">
            <div id="clock-time-display">00:00:00.000</div>
            <div id="clock-date-display">Loading...</div>
          </div>
        </div>
        <div id="clock-stopwatch-panel" class="clock-panel">
          <div class="stopwatch-display">
            <div id="stopwatch-time">00:00:00:000</div>
          </div>
          <div class="stopwatch-controls">
            <button class="stopwatch-btn" id="stopwatch-start-btn" onclick="toggleStopwatch()">
              <i class="ti ti-player-play"></i> Start
            </button>
            <button class="stopwatch-btn stopwatch-btn-secondary" onclick="resetStopwatch()">
              <i class="ti ti-refresh"></i> Reset
            </button>
          </div>
          <div class="stopwatch-laps">
            <div id="stopwatch-laps-list" style="font-size:11px;color:rgba(255,255,255,0.6);max-height:140px;overflow-y:auto">
              <div style="text-align:center;padding:20px 0">No laps recorded</div>
            </div>
          </div>
        </div>
        <div id="clock-alarm-panel" class="clock-panel">
          <div class="alarm-controls">
            <div class="alarm-time-input">
              <input type="time" id="alarm-time-input" value="07:00" onmousedown="event.stopPropagation()">
              <button class="alarm-btn-add" onclick="addAlarm()">
                <i class="ti ti-plus"></i> Add Alarm
              </button>
            </div>
          </div>
          <div id="alarms-list" class="alarms-list">
            <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);font-size:12px">
              No alarms set. Add one to get started!
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function switchClockTab(tab, el) {
  clockState.activeTab = tab;
  el.closest('.clock-tabs').querySelectorAll('.clock-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  el.closest('.clock-wrap').querySelectorAll('.clock-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`clock-${tab}-panel`);
  if (panel) panel.classList.add('active');
}

function startClockApp(wid) {
  drawAnalogClock();
  updateClockDisplay();
  if (clockIntervals.main) clearInterval(clockIntervals.main);
  clockIntervals.main = setInterval(() => {
    drawAnalogClock();
    updateClockDisplay();
  }, 10);

  if (clockIntervals.stopwatch) clearInterval(clockIntervals.stopwatch);
  if (clockState.stopwatchRunning) {
    clockIntervals.stopwatch = setInterval(updateStopwatch, 10);
  }
  renderAlarmsList();
}

function updateClockDisplay() {
  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2,'0') + ':' +
                  String(now.getMinutes()).padStart(2,'0') + ':' +
                  String(now.getSeconds()).padStart(2,'0') + '.' +
                  String(now.getMilliseconds()).padStart(3,'0');
  const dateStr = now.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' });
  const timeEl = document.getElementById('clock-time-display');
  const dateEl = document.getElementById('clock-date-display');
  if (timeEl) timeEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = dateStr;
}

function drawAnalogClock() {
  const canvas = document.getElementById('clock-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const radius = canvas.width / 2;
  const cx = radius, cy = radius;
  const now = new Date();
  const hours = now.getHours() % 12, minutes = now.getMinutes(), seconds = now.getSeconds();

  ctx.fillStyle = 'rgba(14, 14, 32, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(ang) * (radius - 20), y1 = cy + Math.sin(ang) * (radius - 20);
    const x2 = cx + Math.cos(ang) * (radius - 8),  y2 = cy + Math.sin(ang) * (radius - 8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = i % 3 === 0 ? 3 : 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 4;
  const hA = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(hA) * (radius - 80), cy + Math.sin(hA) * (radius - 80)); ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.lineWidth = 3;
  const mA = ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(mA) * (radius - 50), cy + Math.sin(mA) * (radius - 50)); ctx.stroke();

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)'; ctx.lineWidth = 1.5;
  const sA = (seconds / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sA) * (radius - 40), cy + Math.sin(sA) * (radius - 40)); ctx.stroke();
}

// ── Stopwatch ──
function toggleStopwatch() {
  clockState.stopwatchRunning = !clockState.stopwatchRunning;
  const btn = document.getElementById('stopwatch-start-btn');
  if (!btn) return;
  if (clockState.stopwatchRunning) {
    btn.innerHTML = '<i class="ti ti-player-pause"></i> Pause';
    btn.classList.add('running');
    if (clockIntervals.stopwatch) clearInterval(clockIntervals.stopwatch);
    clockIntervals.stopwatch = setInterval(updateStopwatch, 10);
  } else {
    btn.innerHTML = '<i class="ti ti-player-play"></i> Start';
    btn.classList.remove('running');
    if (clockIntervals.stopwatch) clearInterval(clockIntervals.stopwatch);
  }
}

function updateStopwatch() {
  clockState.stopwatchMs += 10;
  const totalMs = clockState.stopwatchMs;
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const miliseconds = totalMs % 1000;
  const display = String(hours).padStart(2,'0') + ':' + String(minutes).padStart(2,'0') + ':' +
                  String(seconds).padStart(2,'0') + ':' + String(miliseconds).padStart(3,'0');
  const el = document.getElementById('stopwatch-time');
  if (el) el.textContent = display;
}

function resetStopwatch() {
  clockState.stopwatchRunning = false;
  clockState.stopwatchMs = 0;
  if (clockIntervals.stopwatch) clearInterval(clockIntervals.stopwatch);
  const btn = document.getElementById('stopwatch-start-btn');
  if (btn) { btn.innerHTML = '<i class="ti ti-player-play"></i> Start'; btn.classList.remove('running'); }
  const display = document.getElementById('stopwatch-time');
  if (display) display.textContent = '00:00:00:000';
  const lapsList = document.getElementById('stopwatch-laps-list');
  if (lapsList) lapsList.innerHTML = '<div style="text-align:center;padding:20px 0">No laps recorded</div>';
}

// ── Alarm ──
function addAlarm() {
  const input = document.getElementById('alarm-time-input');
  if (!input) return;
  const timeStr = input.value;
  if (!timeStr) { notify('Please select a time'); return; }
  clockState.alarms.push({ id: Date.now(), time: timeStr, enabled: true, label: 'Alarm' });
  input.value = '';
  renderAlarmsList();
  notify('Alarm set for ' + timeStr);
}

function deleteAlarm(alarmId) {
  clockState.alarms = clockState.alarms.filter(a => a.id !== alarmId);
  renderAlarmsList();
  notify('Alarm deleted');
}

function toggleAlarm(alarmId) {
  const alarm = clockState.alarms.find(a => a.id === alarmId);
  if (alarm) { alarm.enabled = !alarm.enabled; renderAlarmsList(); }
}

function renderAlarmsList() {
  const list = document.getElementById('alarms-list');
  if (!list) return;
  if (clockState.alarms.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);font-size:12px">No alarms set. Add one to get started!</div>';
    return;
  }
  list.innerHTML = clockState.alarms.map(alarm => `
    <div class="alarm-item ${alarm.enabled ? '' : 'disabled'}">
      <div class="alarm-item-time">${alarm.time}</div>
      <div class="alarm-item-label">${alarm.label}</div>
      <div class="alarm-item-controls">
        <button class="alarm-toggle" onclick="toggleAlarm(${alarm.id})" title="Toggle alarm">
          <i class="ti ${alarm.enabled ? 'ti-bell' : 'ti-bell-off'}"></i>
        </button>
        <button class="alarm-delete" onclick="deleteAlarm(${alarm.id})" title="Delete alarm">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}