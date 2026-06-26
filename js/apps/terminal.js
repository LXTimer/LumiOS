"use strict";

// ─────────────────────────────────────────────
//  APP: Terminal — Extended
// ─────────────────────────────────────────────

let termCwd = '/';
let termHistory = [];
let termHistIdx = -1;
let termHistoryTemp = '';

// ─── Command Registry ───
const TERM_CMDS = {};

// ─── Help ───
TERM_CMDS.help = () => `
Commands:
  File System:
    ls [path]          List directory contents
    cd [dir]           Change directory
    pwd                Print working directory
    cat <file>         Display file contents
    mkdir <name>       Create directory
    rm <path>          Remove file/directory

  Text & Utilities:
    echo [text...]     Print text
    clear              Clear terminal screen
`.trim();

// ─── File System Commands ───
TERM_CMDS.ls = (args) => {
  const target = args[0] ? resolvePath(args[0], termCwd) : termCwd;
  const node = FS[target];
  if (!node) return `ls: cannot access '${target}': No such file or directory`;
  if (node.type !== 'folder') return target.split('/').pop();
  const children = node.children || [];
  if (children.length === 0) return '(empty)';
  // Format in columns
  const lines = [];
  let currentLine = '';
  children.forEach((name, i) => {
    const childPath = target === '/' ? '/' + name : target + '/' + name;
    const childNode = FS[childPath];
    const suffix = childNode?.type === 'folder' ? '/' : '';
    const entry = name + suffix;
    if (currentLine.length + entry.length + 1 > 50) {
      lines.push(currentLine);
      currentLine = entry;
    } else {
      currentLine += (currentLine ? '  ' : '') + entry;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
};

TERM_CMDS.cd = (args) => {
  if (!args.length) { termCwd = '/'; return ''; }
  const target = args[0] === '~' ? '/'
    : args[0].startsWith('/') ? args[0]
    : termCwd === '/' ? '/' + args[0]
    : termCwd + '/' + args[0];
  const clean = normalizePath(target);
  const node = FS[clean];
  if (!node) return `cd: no such directory: ${args[0]}`;
  if (node.type !== 'folder') return `cd: not a directory: ${args[0]}`;
  termCwd = clean;
  return '';
};

TERM_CMDS.pwd = () => termCwd;

TERM_CMDS.cat = (args) => {
  if (!args.length) return 'cat: missing operand';
  const path = resolvePath(args[0], termCwd);
  const node = FS[path];
  if (!node) return `cat: ${args[0]}: No such file or directory`;
  if (node.type === 'folder') return `cat: ${args[0]}: Is a directory`;
  return node.content || `(binary file, ${node.size || 'unknown size'})`;
};

TERM_CMDS.mkdir = (args) => {
  if (!args.length) return 'mkdir: missing operand';
  const name = args[0].replace(/\/$/, '');
  const parentPath = termCwd;
  const parent = FS[parentPath];
  if (!parent || parent.type !== 'folder') return 'mkdir: cannot create: invalid path';
  const newPath = parentPath === '/' ? '/' + name : parentPath + '/' + name;
  if (FS[newPath]) return `mkdir: cannot create '${name}': File exists`;
  FS[newPath] = { type: 'folder', children: [] };
  parent.children.push(name);
  return '';
};

TERM_CMDS.rm = (args) => {
  if (!args.length) return 'rm: missing operand';
  const flags = { recursive: false };
  const targets = [];
  args.forEach(a => {
    if (a === '-r' || a === '-rf' || a === '-fr') flags.recursive = true;
    else targets.push(a);
  });
  if (!targets.length) return 'rm: missing operand';
  const results = targets.map(t => {
    const path = resolvePath(t, termCwd);
    const node = FS[path];
    if (!node) return `rm: cannot remove '${t}': No such file or directory`;
    if (node.type === 'folder' && !flags.recursive)
      return `rm: cannot remove '${t}': Is a directory (use -r)`;
    return removeFromFS(t, path) ? '' : `rm: failed to remove '${t}'`;
  });
  return results.filter(r => r).join('\n');
};

// ─── System Commands ───
// ─── Text & Utility Commands ───
TERM_CMDS.echo = (args) => args.join(' ') || '';

TERM_CMDS.clear = () => '__CLEAR__';

// ─── Network Commands ───
// ─── System Control ───

// ─── Helpers ───
function resolvePath(input, cwd) {
  if (input === '~') return '/';
  if (input === '.' || input === '') return cwd;
  if (input === '..') {
    if (cwd === '/') return '/';
    const parts = cwd.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/') || '/';
  }
  if (input.startsWith('/')) return normalizePath(input);
  if (input.startsWith('~')) return normalizePath('/' + input.slice(1));
  return normalizePath(cwd + '/' + input);
}

function normalizePath(path) {
  const parts = path.split('/').filter(Boolean);
  const result = [];
  parts.forEach(p => {
    if (p === '..') { if (result.length) result.pop(); }
    else if (p !== '.' && p !== '') result.push(p);
  });
  return '/' + result.join('/') || '/';
}

function removeFromFS(input, fullPath) {
  // Get the parent directory
  const parts = fullPath.split('/').filter(Boolean);
  const name = parts.pop();
  const parentPath = '/' + parts.join('/') || '/';
  const parent = FS[parentPath];
  if (!parent || parent.type !== 'folder') return false;
  const idx = parent.children.indexOf(name);
  if (idx !== -1) parent.children.splice(idx, 1);
  delete FS[fullPath];
  return true;
}

// ─── Build Terminal UI ───
function buildTerminal() {
  return `
    <div class="term-wrap">
      <div class="term-output" id="term-output-${Date.now()}">
        <div class="term-welcome">LumiOS Terminal v2.0 — Extended</div>
        <div class="term-hint">Type <span style="color:#4ade80">'help'</span> for all commands.</div>
      </div>
      <div class="term-input-row">
        <span class="term-prompt" id="term-prompt">lumi@os:${termCwd}$</span>
        <input type="text" class="tin" id="term-input" aria-label="Terminal input"
               spellcheck="false" autocomplete="off"
               onmousedown="event.stopPropagation()"
               onkeydown="termKeydown(event, this)">
      </div>
    </div>`;
}

// ─── Key handler with history ───
function termKeydown(e, el) {
  if (e.key === 'Enter') {
    termExec(el);
    el.value = '';
    termHistIdx = -1;
    termHistoryTemp = '';
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (termHistory.length === 0) return;
    if (termHistIdx === -1) termHistoryTemp = el.value;
    termHistIdx = Math.min(termHistIdx + 1, termHistory.length - 1);
    el.value = termHistory[termHistory.length - 1 - termHistIdx];
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (termHistIdx === -1) return;
    termHistIdx--;
    if (termHistIdx === -1) {
      el.value = termHistoryTemp;
      termHistoryTemp = '';
    } else {
      el.value = termHistory[termHistory.length - 1 - termHistIdx];
    }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    // Simple filename completion
    const val = el.value.trim();
    if (!val) return;
    const parts = val.split(' ');
    const last = parts[parts.length - 1];
    // Try to complete as a path
    const dir = last.includes('/') ? resolvePath(last.substring(0, last.lastIndexOf('/')), termCwd) : termCwd;
    const prefix = last.includes('/') ? last.substring(last.lastIndexOf('/') + 1) : last;
    const node = FS[dir];
    if (node && node.type === 'folder') {
      const matches = (node.children || []).filter(c => c.startsWith(prefix));
      if (matches.length === 1) {
        parts[parts.length - 1] = last.includes('/')
          ? last.substring(0, last.lastIndexOf('/') + 1) + matches[0]
          : matches[0];
        el.value = parts.join(' ') + ' ';
      } else if (matches.length > 1) {
        // Show matches
        const out = el.closest('.wc')?.querySelector('.term-output');
        if (out) {
          const d = document.createElement('div');
          d.className = 'term-out';
          d.textContent = matches.join('  ');
          out.appendChild(d);
          out.scrollTop = out.scrollHeight;
        }
      }
    }
  }
}

// ─── Execute command ───
function termExec(el) {
  const raw = el.value.trim();
  if (!raw) return;
  const win = el.closest('.wc');
  const out = win?.querySelector('.term-output');
  if (!out) return;

  // Add to history
  termHistory.push(raw);
  if (termHistory.length > 100) termHistory.shift();

  // Update prompt with current cwd
  const prompt = win.querySelector('.term-prompt');
  if (prompt) prompt.textContent = `lumi@os:${termCwd}$`;

  // Command echo
  const cmdLine = document.createElement('div');
  cmdLine.className = 'term-cmd';
  cmdLine.textContent = 'lumi@os:~$ ' + raw;
  out.appendChild(cmdLine);

  const [cmd, ...args] = raw.split(/\s+/);
  const fn = TERM_CMDS[cmd];

  if (fn) {
    const res = fn(args);
    if (res === '__CLEAR__') {
      out.innerHTML = '';
    } else if (res) {
      const isHtml = typeof res === 'string' && res.includes('<span');
      res.split('\n').forEach(line => {
        const d = document.createElement('div');
        d.className = 'term-out';
        if (isHtml) {
          d.innerHTML = line;
        } else {
          d.textContent = line;
        }
        out.appendChild(d);
      });
    }
  } else {
    const e = document.createElement('div');
    e.className = 'term-err';
    e.textContent = `lumish: ${cmd}: command not found`;
    out.appendChild(e);
  }

  out.scrollTop = out.scrollHeight;

  // Update prompt after cwd changes
  const prompt2 = win.querySelector('.term-prompt');
  if (prompt2) prompt2.textContent = `lumi@os:${termCwd}$`;
}