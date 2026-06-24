"use strict";

let clockState = { activeTab: 'time', stopwatchRunning: false, stopwatchMs: 0, alarms: [], timerRunning: false, timerTotalSec: 0, timerRemainingSec: 0 };
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
        <button class="clock-tab" data-tab="timer" onclick="switchClockTab('timer',this)">
          <i class="ti ti-hourglass"></i> Timer
        </button>
      </div>
      <div class="clock-content">
        <div id="clock-time-panel" class="clock-panel active">
          <div class="clock-analog-wrap">
            <canvas id="clock-canvas" width="280" height="280" style="max-width:100%;height:auto;border-radius:50%"></canvas>
          </div>
          <div class="clock-digital">
            <div id="clock-time-display">00:00:00</div>
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
        <div id="clock-timer-panel" class="clock-panel">
          <div class="timer-setup" id="timer-setup">
            <div class="timer-input-group">
              <label>Min</label>
              <input type="number" class="timer-input" id="timer-min-input" min="0" max="999" value="5">
            </div>
            <span class="timer-separator">:</span>
            <div class="timer-input-group">
              <label>Sec</label>
              <input type="number" class="timer-input" id="timer-sec-input" min="0" max="59" value="0">
            </div>
            <button class="timer-btn" onclick="startTimer()">
              <i class="ti ti-player-play"></i> Start
            </button>
          </div>
          <div class="timer-ring" id="timer-ring">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle class="timer-ring-bg" cx="90" cy="90" r="82"></circle>
              <circle class="timer-ring-progress" id="timer-progress" cx="90" cy="90" r="82"
                      stroke-dasharray="515.22" stroke-dashoffset="0"></circle>
            </svg>
            <div class="timer-ring-text" id="timer-ring-text">05:00</div>
          </div>
          <div class="timer-display" id="timer-display" style="display:none">05:00</div>
          <div class="timer-controls" id="timer-controls" style="display:none">
            <button class="timer-btn" id="timer-pause-btn" onclick="toggleTimer()">
              <i class="ti ti-player-pause"></i> Pause
            </button>
            <button class="timer-btn timer-btn-secondary" onclick="resetTimer()">
              <i class="ti ti-refresh"></i> Reset
            </button>
          </div>
          <div class="timer-presets">
            <button class="timer-preset" onclick="setTimerPreset(1,0)">1 min</button>
            <button class="timer-preset" onclick="setTimerPreset(5,0)">5 min</button>
            <button class="timer-preset" onclick="setTimerPreset(10,0)">10 min</button>
            <button class="timer-preset" onclick="setTimerPreset(15,0)">15 min</button>
            <button class="timer-preset" onclick="setTimerPreset(25,0)">25 min</button>
            <button class="timer-preset" onclick="setTimerPreset(30,0)">30 min</button>
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
                  String(now.getSeconds()).padStart(2,'0');
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

// ── Timer ──
function setTimerPreset(min, sec) {
  const minInput = document.getElementById('timer-min-input');
  const secInput = document.getElementById('timer-sec-input');
  if (minInput) minInput.value = min;
  if (secInput) secInput.value = sec;
  updateTimerDisplayFromInputs();
}

function updateTimerDisplayFromInputs() {
  const minInput = document.getElementById('timer-min-input');
  const secInput = document.getElementById('timer-sec-input');
  const ringText = document.getElementById('timer-ring-text');
  const display = document.getElementById('timer-display');
  const min = parseInt(minInput?.value || 0, 10);
  const sec = parseInt(secInput?.value || 0, 10);
  const totalSec = Math.max(0, min * 60 + sec);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  if (ringText) ringText.textContent = mm + ':' + ss;
  if (display) display.textContent = mm + ':' + ss;
}

function startTimer() {
  const minInput = document.getElementById('timer-min-input');
  const secInput = document.getElementById('timer-sec-input');
  const min = parseInt(minInput?.value || 0, 10);
  const sec = parseInt(secInput?.value || 0, 10);
  const totalSec = min * 60 + sec;
  if (totalSec <= 0) { notify('Please set a time'); return; }

  clockState.timerTotalSec = totalSec;
  clockState.timerRemainingSec = totalSec;
  clockState.timerRunning = true;

  // Switch UI
  const setup = document.getElementById('timer-setup');
  const ring = document.getElementById('timer-ring');
  const display = document.getElementById('timer-display');
  const controls = document.getElementById('timer-controls');
  if (setup) setup.style.display = 'none';
  if (display) display.style.display = 'block';
  if (controls) controls.style.display = 'flex';

  updateTimerProgress();
  if (clockIntervals.timer) clearInterval(clockIntervals.timer);
  clockIntervals.timer = setInterval(tickTimer, 1000);
}

function tickTimer() {
  if (!clockState.timerRunning) return;
  clockState.timerRemainingSec--;
  if (clockState.timerRemainingSec <= 0) {
    clockState.timerRemainingSec = 0;
    timerComplete();
  }
  updateTimerProgress();
}

function updateTimerProgress() {
  const remaining = clockState.timerRemainingSec;
  const total = clockState.timerTotalSec;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const ringText = document.getElementById('timer-ring-text');
  const display = document.getElementById('timer-display');
  const progress = document.getElementById('timer-progress');
  const ring = document.getElementById('timer-ring');

  if (ringText) ringText.textContent = mm + ':' + ss;
  if (display) display.textContent = mm + ':' + ss;

  // Update ring progress
  if (progress && total > 0) {
    const circumference = 2 * Math.PI * 82; // r=82
    const offset = circumference * (1 - remaining / total);
    progress.style.strokeDashoffset = offset;
  }

  // Pulse animation when done
  if (ring && remaining === 0) {
    ring.classList.add('timer-done');
  } else if (ring) {
    ring.classList.remove('timer-done');
  }
}

function toggleTimer() {
  clockState.timerRunning = !clockState.timerRunning;
  const btn = document.getElementById('timer-pause-btn');
  if (btn) {
    btn.innerHTML = clockState.timerRunning
      ? '<i class="ti ti-player-pause"></i> Pause'
      : '<i class="ti ti-player-play"></i> Resume';
  }
  if (clockState.timerRunning) {
    if (clockIntervals.timer) clearInterval(clockIntervals.timer);
    clockIntervals.timer = setInterval(tickTimer, 1000);
  } else {
    if (clockIntervals.timer) clearInterval(clockIntervals.timer);
  }
}

function resetTimer() {
  clockState.timerRunning = false;
  clockState.timerRemainingSec = 0;
  clockState.timerTotalSec = 0;
  if (clockIntervals.timer) clearInterval(clockIntervals.timer);

  // Reset UI
  const setup = document.getElementById('timer-setup');
  const ring = document.getElementById('timer-ring');
  const display = document.getElementById('timer-display');
  const controls = document.getElementById('timer-controls');
  if (setup) setup.style.display = 'flex';
  if (ring) ring.classList.remove('timer-done');
  if (display) display.style.display = 'none';
  if (controls) controls.style.display = 'none';

  const progress = document.getElementById('timer-progress');
  if (progress) progress.style.strokeDashoffset = '0';

  updateTimerDisplayFromInputs();
}

function timerComplete() {
  clockState.timerRunning = false;
  if (clockIntervals.timer) clearInterval(clockIntervals.timer);
  notify('Timer finished!');
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 300);
  } catch (e) {}
}

