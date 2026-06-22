"use strict";

// ─────────────────────────────────────────────
//  APP: Paint — Canvas Drawing Application
// ─────────────────────────────────────────────

const PAINT_COLORS = [
  '#000000','#ffffff','#ff0000','#ff6600','#ffcc00','#00ff00','#00ccff','#0033ff',
  '#6600ff','#ff00ff','#cc6600','#808080','#000080','#800000','#008000','#00ffff',
  '#ff99cc','#cc99ff','#99ccff','#99ff99','#ffcc99','#cccccc',
];

const PAINT_TOOLS = ['brush','eraser','fill','line','rect','circle'];

let paintState = {
  tool: 'brush',
  color: '#000000',
  size: 4,
  drawing: false,
  lastX: 0, lastY: 0,
  path: [],
  redo: [],
};

function buildPaint() {
  const colors = PAINT_COLORS.map(c =>
    `<div class="paint-color-swatch ${c===paintState.color?'active':''}"
         style="background:${c}" onclick="paintSetColor('${c}',this)"></div>`
  ).join('');

  const tools = PAINT_TOOLS.map(t =>
    `<button class="app-btn ${t===paintState.tool?'active':''}"
       onclick="paintSetTool('${t}',this)" title="${t.charAt(0).toUpperCase()+t.slice(1)}">
      <i class="ti ${paintToolIcon(t)}"></i>
    </button>`
  ).join('');

  return `
    <div class="paint-wrap" onmousedown="event.stopPropagation()">
      <div class="paint-toolbar">
        ${tools}
        <div class="paint-separator"></div>
        <span class="paint-tool-label">Color</span>
        <div class="paint-color-input-wrap">
          <input type="color" value="${paintState.color}"
                 onchange="paintSetColor(this.value,this.closest('.paint-color-input-wrap').nextElementSibling?.querySelector?.('[data-color='+this.value+']'))">
        </div>
        <div class="paint-color-palette" style="display:flex;gap:3px;flex-wrap:wrap">${colors}</div>
        <div class="paint-separator"></div>
        <span class="paint-tool-label">Size</span>
        <input type="range" class="paint-size-slider" min="1" max="40" value="${paintState.size}"
               oninput="paintSetSize(this.value)">
        <div class="paint-size-preview">
          <div class="paint-size-dot" id="paint-size-dot"
               style="width:${Math.min(paintState.size*1.6,32)}px;height:${Math.min(paintState.size*1.6,32)}px"></div>
        </div>
        <div class="paint-separator"></div>
        <button class="app-btn" onclick="paintClear()" title="Clear Canvas"><i class="ti ti-trash"></i></button>
        <button class="app-btn" onclick="paintUndo()" title="Undo"><i class="ti ti-arrow-back-up"></i></button>
        <button class="app-btn" onclick="paintRedo()" title="Redo"><i class="ti ti-arrow-forward-up"></i></button>
        <button class="app-btn" onclick="paintSave()" title="Save as PNG"><i class="ti ti-download"></i></button>
      </div>
      <div class="paint-canvas-wrap">
        <canvas id="paint-canvas"></canvas>
      </div>
      <div class="paint-statusbar">
        <span id="paint-coords">—, —</span>
        <span id="paint-info">Brush · ${paintState.size}px</span>
      </div>
    </div>`;
}

function paintToolIcon(tool) {
  const map = {
    brush: 'ti-pencil',
    eraser: 'ti-eraser',
    fill: 'ti-bucket',
    line: 'ti-minus',
    rect: 'ti-square',
    circle: 'ti-circle',
  };
  return map[tool] || 'ti-pencil';
}

function paintSetColor(hex, el) {
  paintState.color = hex;
  const wrap = el?.closest('.paint-wrap');
  if (wrap) {
    wrap.querySelectorAll('.paint-color-swatch').forEach(s => s.classList.remove('active'));
    if (el) el.classList.add('active');
  }
  // Also update the color picker input
  const picker = document.querySelector('#paint-canvas')?.closest('.paint-wrap')
    ?.querySelector('input[type="color"]');
  if (picker) picker.value = hex;
}

function paintSetTool(tool, btn) {
  paintState.tool = tool;
  const wrap = btn?.closest('.paint-wrap');
  if (wrap) {
    wrap.querySelectorAll('.paint-toolbar .app-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }
  const info = document.getElementById('paint-info');
  if (info) {
    const label = tool.charAt(0).toUpperCase() + tool.slice(1);
    info.textContent = `${label} · ${paintState.size}px`;
  }
}

function paintSetSize(val) {
  paintState.size = parseInt(val, 10);
  const dot = document.getElementById('paint-size-dot');
  if (dot) {
    const s = Math.min(val * 1.6, 32);
    dot.style.width = s + 'px';
    dot.style.height = s + 'px';
  }
  const info = document.getElementById('paint-info');
  if (info) info.textContent = `${paintState.tool.charAt(0).toUpperCase()+paintState.tool.slice(1)} · ${val}px`;
}

function paintInit(wid) {
  const winEl = document.getElementById(wid);
  if (!winEl) return;
  const canvas = winEl.querySelector('#paint-canvas');
  if (!canvas) return;

  // Wait for the canvas to be in the DOM
  requestAnimationFrame(() => {
    setupPaintCanvas(canvas, winEl);
  });
}

function setupPaintCanvas(canvas, winEl) {
  const wrap = canvas.closest('.paint-canvas-wrap');
  if (!wrap) return;

  const rect = wrap.getBoundingClientRect();
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Save initial blank state
  paintState.path = [canvas.toDataURL()];
  paintState.redo = [];

  // ── Mouse Events ──
  canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    const pos = getCanvasPos(canvas, e);
    paintState.drawing = true;
    paintState.lastX = pos.x;
    paintState.lastY = pos.y;

    if (paintState.tool === 'fill') {
      paintFloodFill(canvas, pos.x, pos.y);
      paintSaveState(canvas);
      return;
    }

    // Start a path for line/rect/circle tools
    paintState.pathStart = { x: pos.x, y: pos.y };
    paintState.drawing = true;
  });

  canvas.addEventListener('mousemove', e => {
    const pos = getCanvasPos(canvas, e);
    const coords = document.getElementById('paint-coords');
    if (coords) coords.textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}`;

    if (!paintState.drawing) return;
    e.preventDefault();

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (paintState.tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = paintState.size;
      ctx.beginPath();
      ctx.moveTo(paintState.lastX, paintState.lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (paintState.tool === 'brush') {
      ctx.strokeStyle = paintState.color;
      ctx.lineWidth = paintState.size;
      ctx.beginPath();
      ctx.moveTo(paintState.lastX, paintState.lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (paintState.tool === 'line') {
      // Preview line while dragging
      paintPreviewLine(canvas, paintState.pathStart.x, paintState.pathStart.y, pos.x, pos.y);
    } else if (paintState.tool === 'rect') {
      paintPreviewRect(canvas, paintState.pathStart.x, paintState.pathStart.y, pos.x, pos.y);
    } else if (paintState.tool === 'circle') {
      paintPreviewCircle(canvas, paintState.pathStart.x, paintState.pathStart.y, pos.x, pos.y);
    }

    paintState.lastX = pos.x;
    paintState.lastY = pos.y;
  });

  document.addEventListener('mouseup', () => {
    if (!paintState.drawing) return;
    paintState.drawing = false;

    if (['line','rect','circle'].includes(paintState.tool) && paintState.pathStart) {
      // Commit the final shape
      const ctx = canvas.getContext('2d');
      const sx = paintState.pathStart.x;
      const sy = paintState.pathStart.y;
      const ex = paintState.lastX;
      const ey = paintState.lastY;

      if (paintState.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else if (paintState.tool === 'rect') {
        const w = Math.abs(ex - sx);
        const h = Math.abs(ey - sy);
        ctx.strokeRect(Math.min(sx, ex), Math.min(sy, ey), w, h);
      } else if (paintState.tool === 'circle') {
        const cx = (sx + ex) / 2;
        const cy = (sy + ey) / 2;
        const r = Math.sqrt((ex-sx)**2 + (ey-sy)**2) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      paintSaveState(canvas);
    }

    paintState.pathStart = null;
  });

  // ── Touch Support ──
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(canvas, { clientX: touch.clientX, clientY: touch.clientY });
    paintState.drawing = true;
    paintState.lastX = pos.x;
    paintState.lastY = pos.y;
    paintState.pathStart = { x: pos.x, y: pos.y };
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getCanvasPos(canvas, { clientX: touch.clientX, clientY: touch.clientY });
    if (!paintState.drawing) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = paintState.tool === 'eraser' ? '#ffffff' : paintState.color;
    ctx.lineWidth = paintState.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(paintState.lastX, paintState.lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    paintState.lastX = pos.x;
    paintState.lastY = pos.y;
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    paintState.drawing = false;
    paintSaveState(canvas);
    paintState.pathStart = null;
  });
}

function getCanvasPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function paintPreviewLine(canvas, sx, sy, ex, ey) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  // Restore to last saved state
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = paintState.color;
    ctx.lineWidth = paintState.size;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();
  };
  img.src = paintState.path[paintState.path.length - 1] || canvas.toDataURL();
  // If the image hasn't loaded yet, just draw directly
  if (!img.complete) {
    canvas.getContext('2d').strokeStyle = paintState.color;
    canvas.getContext('2d').lineWidth = paintState.size;
    canvas.getContext('2d').beginPath();
    canvas.getContext('2d').moveTo(sx, sy);
    canvas.getContext('2d').lineTo(ex, ey);
    canvas.getContext('2d').stroke();
  }
}

function paintPreviewRect(canvas, sx, sy, ex, ey) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = paintState.color;
    ctx.lineWidth = paintState.size;
    const w = Math.abs(ex - sx);
    const h = Math.abs(ey - sy);
    ctx.strokeRect(Math.min(sx, ex), Math.min(sy, ey), w, h);
    ctx.restore();
  };
  img.src = paintState.path[paintState.path.length - 1] || canvas.toDataURL();
}

function paintPreviewCircle(canvas, sx, sy, ex, ey) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const cx = (sx + ex) / 2;
    const cy = (sy + ey) / 2;
    const r = Math.sqrt((ex-sx)**2 + (ey-sy)**2) / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };
  img.src = paintState.path[paintState.path.length - 1] || canvas.toDataURL();
}

function paintSaveState(canvas) {
  if (!canvas) return;
  const data = canvas.toDataURL();
  paintState.path.push(data);
  paintState.redo = [];
}

function paintUndo() {
  if (paintState.path.length <= 1) return;
  const last = paintState.path.pop();
  paintState.redo.push(last);
  const prev = paintState.path[paintState.path.length - 1];
  const canvas = document.getElementById('paint-canvas');
  if (!canvas || !prev) return;
  restoreCanvas(canvas, prev);
}

function paintRedo() {
  if (paintState.redo.length === 0) return;
  const next = paintState.redo.pop();
  paintState.path.push(next);
  const canvas = document.getElementById('paint-canvas');
  if (!canvas || !next) return;
  restoreCanvas(canvas, next);
}

function restoreCanvas(canvas, data) {
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = data;
}

function paintClear() {
  const canvas = document.getElementById('paint-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  paintSaveState(canvas);
}

function paintFloodFill(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;

  const targetColor = getPixelColor(imgData, Math.round(x), Math.round(y), w);
  const fillColor = hexToRgba(paintState.color);

  // Convert to integer array for fast equality check
  const target = [
    Math.round(targetColor[0]),
    Math.round(targetColor[1]),
    Math.round(targetColor[2]),
    Math.round(targetColor[3]),
  ];

  if (target[0] === fillColor[0] && target[1] === fillColor[1] &&
      target[2] === fillColor[2] && target[3] === fillColor[3]) return;

  const fill = [
    Math.round(fillColor[0]),
    Math.round(fillColor[1]),
    Math.round(fillColor[2]),
    Math.round(fillColor[3]),
  ];

  const visited = new Uint8Array(w * h);
  const stack = [{ x: Math.round(x), y: Math.round(y) }];

  while (stack.length > 0) {
    const p = stack.pop();
    const idx = p.y * w + p.x;
    if (p.x < 0 || p.x >= w || p.y < 0 || p.y >= h) continue;
    if (visited[idx]) continue;

    const px = getPixelColor(imgData, p.x, p.y, w);
    const match = Math.abs(px[0] - target[0]) <= 5 &&
                  Math.abs(px[1] - target[1]) <= 5 &&
                  Math.abs(px[2] - target[2]) <= 5;

    if (!match) continue;

    visited[idx] = 1;
    setPixelColor(imgData, p.x, p.y, w, fill);
    stack.push({ x: p.x + 1, y: p.y });
    stack.push({ x: p.x - 1, y: p.y });
    stack.push({ x: p.x, y: p.y + 1 });
    stack.push({ x: p.x, y: p.y - 1 });
  }

  ctx.putImageData(imgData, 0, 0);
}

function getPixelColor(imgData, x, y, w) {
  const i = (y * w + x) * 4;
  return [imgData.data[i], imgData.data[i+1], imgData.data[i+2], imgData.data[i+3]];
}

function setPixelColor(imgData, x, y, w, color) {
  const i = (y * w + x) * 4;
  imgData.data[i] = color[0];
  imgData.data[i+1] = color[1];
  imgData.data[i+2] = color[2];
  imgData.data[i+3] = color[3];
}

function hexToRgba(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r, g, b, 255];
}

function paintSave() {
  const canvas = document.getElementById('paint-canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'LumiOS-painting-' + Date.now() + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  notify('Drawing saved!');
}