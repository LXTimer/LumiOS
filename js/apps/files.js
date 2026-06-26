"use strict";

// ─────────────────────────────────────────────
//  APP: Files
// ─────────────────────────────────────────────

const FS = {
  "/": { type: "folder", children: ["Download", "Notes"] },
  "/Download": { type: "folder", children: ["download.txt"] },
  "/Download/download.txt": {
    type: "file", ext: "txt", size: "---",
    src: "assets/demo/Download/download.txt",
    content: "Download"
  },
  "/Notes": { type: "folder", children: ["Welcome To LumiOS.txt"] },
  "/Notes/Welcome To LumiOS.txt": {
    type: "file", ext: "txt", size: "---",
    src: "assets/demo/Notes/Welcome To LumiOS.txt",
    content: "Welcome to LumiOS!!!\nThank you for using this OS!!\nFreely explore this OS!"
  }
};

const FILES_STATE = {};

function fsGetIcon(name, node) {
  if (node.type === 'folder') return { ic: 'ti-folder', color: 'rgba(250,185,10,.85)' };
  const ext = (node.ext || name.split('.').pop() || '').toLowerCase();
  const map = {
    md:   { ic:'ti-file-text',    color:'rgba(110,210,110,.85)' },
    txt:  { ic:'ti-file-text',    color:'rgba(200,200,200,.7)'  },
    json: { ic:'ti-braces',       color:'rgba(100,160,255,.85)' },
    pdf:  { ic:'ti-file-type-pdf',color:'rgba(240,80,80,.85)'   },
    xlsx:  { ic:'ti-table',        color:'rgba(60,200,100,.85)'  },
    docx: { ic:'ti-file-word',    color:'rgba(80,140,240,.85)'  },
    png:  { ic:'ti-photo',        color:'rgba(255,120,180,.85)' },
    jpg:  { ic:'ti-photo',        color:'rgba(255,120,180,.85)' },
    mp3:  { ic:'ti-music',        color:'rgba(200,100,255,.85)' },
    m3u:  { ic:'ti-playlist',     color:'rgba(200,100,255,.75)' },
    zip:  { ic:'ti-file-zip',     color:'rgba(255,170,50,.85)'  },
    iso:  { ic:'ti-disc',         color:'rgba(150,180,255,.85)' },
    lnk:  { ic:'ti-link',         color:'rgba(180,180,180,.7)'  },
  };
  return map[ext] || { ic:'ti-file', color:'rgba(200,200,200,.5)' };
}

function fsBreadcrumbs(path) {
  if (path === '/') return [{ label: 'Root', path: '/' }];
  const parts = path.split('/').filter(Boolean);
  const crumbs = [{ label: 'Root', path: '/' }];
  let cur = '';
  parts.forEach(p => { cur += '/' + p; crumbs.push({ label: p, path: cur }); });
  return crumbs;
}

function buildFiles() {
  return `
    <div class="files-wrap" id="files-root">
      <div class="files-toolbar">
        <button class="app-btn" id="files-back"    onclick="filesBack(this)"    title="Back"><i class="ti ti-chevron-left"></i></button>
        <button class="app-btn" id="files-forward" onclick="filesForward(this)" title="Forward"><i class="ti ti-chevron-right"></i></button>
        <button class="app-btn" onclick="filesUp(this)" title="Up"><i class="ti ti-arrow-up"></i></button>
        <div class="files-path" id="files-breadcrumb"></div>
        <div class="files-toolbar-spacer"></div>
        <button class="app-btn files-view-btn active" id="files-view-list" onclick="filesSetView(this,'list')" title="List view"><i class="ti ti-list"></i></button>
        <button class="app-btn files-view-btn"        id="files-view-grid" onclick="filesSetView(this,'grid')" title="Grid view"><i class="ti ti-layout-grid"></i></button>
      </div>
      <div class="files-body" onmousedown="event.stopPropagation()">
        <div class="files-sidebar">
          <div class="files-sidebar-label">Favourites</div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/')"><i class="ti ti-folder"></i> Demo Root</div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/Download')"><i class="ti ti-download"></i> Download</div>
          <div class="files-sidebar-item" onclick="filesNavigate(this,'/Notes')"><i class="ti ti-file-text"></i> Notes</div>
        </div>
        <div class="files-main">
          <div class="files-list" id="files-pane"></div>
          <div class="files-status-bar" id="files-status"></div>
        </div>
      </div>
      <div class="files-preview" id="files-preview" style="display:none" onmousedown="event.stopPropagation()">
        <div class="files-preview-header">
          <span id="files-preview-title"></span>
          <button class="app-btn" onclick="filesClosePreview(this)"><i class="ti ti-x"></i></button>
        </div>
        <pre class="files-preview-content" id="files-preview-content"></pre>
      </div>
    </div>`;
}

function filesGetState(el) {
  const root = el.closest('.files-wrap');
  if (!root) return null;
  let state = root._filesState;
  if (!state) {
    state = { path: '/', history: ['/'], histIdx: 0, view: 'list' };
    root._filesState = state;
  }
  return state;
}

function filesInit(wid) {
  const winEl = document.getElementById(wid);
  if (!winEl) return;
  const root = winEl.querySelector('.files-wrap');
  if (!root) return;
  root._filesState = { path: '/', history: ['/'], histIdx: 0, view: 'list' };
  filesRender(root);
}

function filesRender(root) {
  const state = root._filesState;
  const node  = FS[state.path];
  if (!node) return;

  const bc = root.querySelector('#files-breadcrumb');
  if (bc) {
    bc.innerHTML = fsBreadcrumbs(state.path).map((c, i, arr) => `
      <span class="files-crumb ${i===arr.length-1?'files-crumb-active':''}"
            onclick="filesNavigate(this,'${c.path}')">${c.label}</span>
      ${i < arr.length-1 ? '<i class="ti ti-chevron-right" style="font-size:9px;opacity:0.35"></i>' : ''}
    `).join('');
  }

  const btnBack = root.querySelector('#files-back');
  const btnFwd  = root.querySelector('#files-forward');
  if (btnBack) btnBack.style.opacity = state.histIdx > 0 ? '1' : '0.3';
  if (btnFwd)  btnFwd.style.opacity  = state.histIdx < state.history.length - 1 ? '1' : '0.3';

  const pane = root.querySelector('#files-pane');
  if (!pane) return;

  const children = node.children || [];
  if (children.length === 0) {
    pane.innerHTML = `<div class="files-empty"><i class="ti ti-folder-off"></i><span>This folder is empty</span></div>`;
  } else {
    const isGrid = state.view === 'grid';
    pane.className = 'files-list' + (isGrid ? ' files-grid-view' : '');
    pane.innerHTML = children.map(name => {
      const childPath = state.path === '/' ? '/' + name : state.path + '/' + name;
      const childNode = FS[childPath] || { type:'file', ext:'', size:'?', content:null };
      const { ic, color } = fsGetIcon(name, childNode);
      const isFolder = childNode.type === 'folder';
      const meta = isFolder
        ? `${(childNode.children||[]).length} item${(childNode.children||[]).length !== 1 ? 's' : ''}`
        : childNode.size;

      if (isGrid) {
        return `<div class="file-grid-item" ondblclick="filesOpen(this,'${childPath}')" title="${name}">
          <div class="file-grid-icon"><i class="ti ${ic}" style="color:${color}"></i></div>
          <span class="file-grid-name">${name}</span>
        </div>`;
      } else {
        return `<div class="file-row" ondblclick="filesOpen(this,'${childPath}')">
          <div class="file-row-icon"><i class="ti ${ic}" style="color:${color}"></i></div>
          <span class="file-row-name">${name}</span>
          <span class="file-row-type">${isFolder ? 'Folder' : (childNode.ext||'File').toUpperCase()}</span>
          <span class="file-row-meta">${meta}</span>
        </div>`;
      }
    }).join('');
  }

  const status = root.querySelector('#files-status');
  if (status) {
    const folders = children.filter(n => {
      const p = state.path === '/' ? '/' + n : state.path + '/' + n;
      return (FS[p]||{}).type === 'folder';
    }).length;
    const files = children.length - folders;
    status.textContent = `${children.length} item${children.length !== 1 ? 's' : ''} — ${folders} folder${folders !== 1 ? 's' : ''}, ${files} file${files !== 1 ? 's' : ''}`;
  }
}

function filesNavigate(el, path) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  const state = root._filesState;
  if (state.path === path) return;
  state.history = state.history.slice(0, state.histIdx + 1);
  state.history.push(path);
  state.histIdx = state.history.length - 1;
  state.path = path;
  filesRender(root);
}

function filesBack(el) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  const state = root._filesState;
  if (state.histIdx <= 0) return;
  state.histIdx--;
  state.path = state.history[state.histIdx];
  filesRender(root);
}

function filesForward(el) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  const state = root._filesState;
  if (state.histIdx >= state.history.length - 1) return;
  state.histIdx++;
  state.path = state.history[state.histIdx];
  filesRender(root);
}

function filesUp(el) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  const state = root._filesState;
  if (state.path === '/') return;
  const parent = state.path.substring(0, state.path.lastIndexOf('/')) || '/';
  filesNavigate(el, parent);
}

function filesSetView(el, view) {
  const root = el.closest('.files-wrap');
  if (!root) return;
  root._filesState.view = view;
  root.querySelectorAll('.files-view-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  filesRender(root);
}

function filesOpen(el, path) {
  const node = FS[path];
  if (!node) return;
  if (node.type === 'folder') { filesNavigate(el, path); return; }
  const name = path.split('/').pop();
  const ext = (node.ext || name.split('.').pop() || '').toLowerCase();

  const root = el.closest('.files-wrap');
  if (!root) return;

  const loadContent = (text) => {
    if (ext === 'txt' || ext === 'md') {
      notesLoadContent(text, name);
      openApp('notes');
    } else {
      const preview = root.querySelector('#files-preview');
      if (preview) {
        preview.querySelector('#files-preview-title').textContent = name;
        preview.querySelector('#files-preview-content').textContent = text;
        preview.style.display = 'flex';
      }
    }
  };

  if (node.src) {
    fetch(node.src)
      .then(r => r.ok ? r.text() : Promise.reject('fetch failed'))
      .then(loadContent)
      .catch(() => {
        if (node.content !== null && node.content !== undefined) {
          loadContent(node.content);
        } else {
          notify(`Error loading "${name}"`);
        }
      });
  } else if (node.content !== null && node.content !== undefined) {
    loadContent(node.content);
  } else {
    notify(`No source path or content for "${name}"`);
  }
}

function filesClosePreview(el) {
  const preview = el.closest('.files-preview');
  if (preview) preview.style.display = 'none';
}