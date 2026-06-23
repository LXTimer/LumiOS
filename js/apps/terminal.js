"use strict";

// ─────────────────────────────────────────────
//  APP: Terminal — Extended
// ─────────────────────────────────────────────

let termCwd = '/home/lumi-user';
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
    touch <file>       Create empty file
    rm <path>          Remove file/directory
    rmdir <dir>        Remove empty directory
    mv <src> <dst>     Move/rename file
    cp <src> <dst>     Copy file
    head <file> [n]    Show first n lines
    tail <file> [n]    Show last n lines
    wc <file>          Count lines/words/chars
    find <name>        Search for files by name

  System:
    uname [-a]         System information
    neofetch           Display system info (fancy)
    uptime             Show OS uptime
    hostname           Display hostname
    df                 Disk free space
    ps                 Process list
    date               Current date & time
    version            OS version
    whoami             Current user
    id                 User identity
    users              Logged-in users
    env                Environment variables
    which <cmd>        Locate a command

  Text & Utilities:
    echo [text...]     Print text
    clear              Clear terminal screen
    grep <pattern>     Search text (demo)
    sort [text...]     Sort lines
    uniq [text...]     Remove adjacent duplicates
    banner <text>      Print ASCII banner
    cowsay <text>      Cow says...
    fortune            Random wisdom
    yes [text]         Repeat text

  Network:
    ping <host>        Ping a host (demo)
    curl <url>         Fetch URL (demo)

  System Control:
    reboot             Reboot (demo)
    shutdown           Shutdown (demo)
    apps               List installed apps
    colors             Show terminal color palette
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
  if (!args.length) { termCwd = '/home/lumi-user'; return ''; }
  const target = args[0] === '~' ? '/home/lumi-user'
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

TERM_CMDS.touch = (args) => {
  if (!args.length) return 'touch: missing operand';
  const name = args[0];
  const parentPath = termCwd;
  const parent = FS[parentPath];
  if (!parent || parent.type !== 'folder') return 'touch: invalid path';
  const newPath = parentPath === '/' ? '/' + name : parentPath + '/' + name;
  if (FS[newPath]) return '';
  FS[newPath] = { type: 'file', ext: name.includes('.') ? name.split('.').pop() : '', size: '0 KB', content: '' };
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

TERM_CMDS.rmdir = (args) => {
  if (!args.length) return 'rmdir: missing operand';
  const path = resolvePath(args[0], termCwd);
  const node = FS[path];
  if (!node) return `rmdir: failed to remove '${args[0]}': No such file or directory`;
  if (node.type !== 'folder') return `rmdir: failed to remove '${args[0]}': Not a directory`;
  if (node.children && node.children.length > 0)
    return `rmdir: failed to remove '${args[0]}': Directory not empty`;
  return removeFromFS(args[0], path) ? '' : `rmdir: failed to remove '${args[0]}'`;
};

TERM_CMDS.mv = (args) => {
  if (args.length < 2) return 'mv: missing operand';
  const srcPath = resolvePath(args[0], termCwd);
  const srcNode = FS[srcPath];
  if (!srcNode) return `mv: cannot stat '${args[0]}': No such file or directory`;
  const name = args[1].split('/').pop() || args[1];
  const dstParent = args[1].includes('/')
    ? normalizePath(termCwd + '/' + args[1].split('/').slice(0,-1).join('/'))
    : termCwd;
  const dstPath = dstParent === '/' ? '/' + name : dstParent + '/' + name;
  if (FS[dstPath]) return `mv: cannot move '${args[0]}' to '${name}': File exists`;
  FS[dstPath] = JSON.parse(JSON.stringify(srcNode));
  removeFromFS(args[0], srcPath);
  const dstNode = FS[dstParent];
  if (dstNode && dstNode.children && !dstNode.children.includes(name)) {
    dstNode.children.push(name);
  }
  return '';
};

TERM_CMDS.cp = (args) => {
  if (args.length < 2) return 'cp: missing operand';
  const srcPath = resolvePath(args[0], termCwd);
  const srcNode = FS[srcPath];
  if (!srcNode) return `cp: cannot stat '${args[0]}': No such file or directory`;
  const name = args[1].split('/').pop() || args[1];
  const dstParent = args[1].includes('/')
    ? normalizePath(termCwd + '/' + args[1].split('/').slice(0,-1).join('/'))
    : termCwd;
  const dstPath = dstParent === '/' ? '/' + name : dstParent + '/' + name;
  if (FS[dstPath]) return `cp: cannot create '${name}': File exists`;
  FS[dstPath] = JSON.parse(JSON.stringify(srcNode));
  const dstNode = FS[dstParent];
  if (dstNode && dstNode.children && !dstNode.children.includes(name)) {
    dstNode.children.push(name);
  }
  return '';
};

TERM_CMDS.head = (args) => {
  if (!args.length) return 'head: missing operand';
  let n = 10;
  let fileArg = args[0];
  if (args[1] && !isNaN(args[1])) { n = parseInt(args[1]); }
  else if (args[0] === '-n' && args[1]) { n = parseInt(args[1]); fileArg = args[2] || args[1]; }
  const path = resolvePath(fileArg, termCwd);
  const node = FS[path];
  if (!node) return `head: ${fileArg}: No such file or directory`;
  if (node.type === 'folder') return `head: ${fileArg}: Is a directory`;
  if (!node.content) return '';
  const lines = node.content.split('\n');
  return lines.slice(0, n).join('\n');
};

TERM_CMDS.tail = (args) => {
  if (!args.length) return 'tail: missing operand';
  let n = 10;
  let fileArg = args[0];
  if (args[1] && !isNaN(args[1])) { n = parseInt(args[1]); }
  else if (args[0] === '-n' && args[1]) { n = parseInt(args[1]); fileArg = args[2] || args[1]; }
  const path = resolvePath(fileArg, termCwd);
  const node = FS[path];
  if (!node) return `tail: ${fileArg}: No such file or directory`;
  if (node.type === 'folder') return `tail: ${fileArg}: Is a directory`;
  if (!node.content) return '';
  const lines = node.content.split('\n');
  return lines.slice(Math.max(0, lines.length - n)).join('\n');
};

TERM_CMDS.wc = (args) => {
  if (!args.length) return 'wc: missing operand';
  const path = resolvePath(args[0], termCwd);
  const node = FS[path];
  if (!node) return `wc: ${args[0]}: No such file or directory`;
  if (!node.content) return '0 0 0 ' + args[0];
  const lines = node.content.split('\n');
  const words = node.content.split(/\s+/).filter(Boolean).length;
  const chars = node.content.length;
  return `${lines.length} ${words} ${chars} ${args[0]}`;
};

TERM_CMDS.find = (args) => {
  if (!args.length) return 'find: missing operand';
  const pattern = args[0].toLowerCase();
  const results = [];
  function searchDir(dirPath) {
    const node = FS[dirPath];
    if (!node || node.type !== 'folder') return;
    (node.children || []).forEach(child => {
      const childPath = dirPath === '/' ? '/' + child : dirPath + '/' + child;
      if (child.toLowerCase().includes(pattern)) results.push(childPath);
      const childNode = FS[childPath];
      if (childNode?.type === 'folder') searchDir(childPath);
    });
  }
  searchDir(termCwd);
  return results.length ? results.join('\n') : `find: no matches for '${args[0]}'`;
};

// ─── System Commands ───
TERM_CMDS.uname = (args) => {
  if (args.includes('-a')) return 'LumiOS 1.3.3 LumiCore web x86_64 GNU/Linux';
  return 'LumiOS';
};

TERM_CMDS.neofetch = () => {
  const ua = navigator.userAgent;
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Unknown';
  const cores = navigator.hardwareConcurrency || 'N/A';
  const mem = navigator.deviceMemory ? navigator.deviceMemory + ' GiB' : 'N/A';
  return `
         ██████████          lumi-user@LumiOS
       ██          ██        ──────────────────────
      ██   ▀▀  ▀▀   ██       OS: LumiOS 1.3.3 LumiCore
     ██              ██      Host: Web Browser
     ██    ▀▀▀▀▀▀    ██      Kernel: LumiCore 1.0
     ██              ██      Browser: ${browser}
      ██   ██████   ██       Shell: Lumish 1.0
       ██          ██        CPU: (${cores}) @ WebAssembly
         ██████████          Memory: ${mem}
                              Uptime: ${getUptime()}
  `.trim();
};

TERM_CMDS.uptime = () => `up ${getUptime()}`;

TERM_CMDS.hostname = () => 'LumiOS';

TERM_CMDS.df = () => {
  let totalItems = 0;
  let totalSize = 0;
  function countDir(path) {
    const node = FS[path];
    if (!node) return;
    if (node.type === 'file') {
      totalItems++;
      const sz = node.size ? parseInt(node.size) || 0 : 0;
      totalSize += sz;
    }
    if (node.type === 'folder') {
      (node.children || []).forEach(child => {
        const cp = path === '/' ? '/' + child : path + '/' + child;
        countDir(cp);
      });
    }
  }
  countDir('/');
  return `Filesystem      Size  Used  Avail  Use%
LumiOS-FS       ${totalSize || '16'}K   ${Math.round(totalSize * 0.42) || '6'}K   ${Math.round(totalSize * 0.58) || '10'}K   ${totalSize ? '42' : '0'}%`;
};

TERM_CMDS.ps = () => {
  const processes = ['kernel', 'lumi-desktop', 'lumi-window-manager', 'lumi-taskbar', 'lumi-session'];
  // Add any open apps as processes
  Object.entries(wins || {}).forEach(([wid, w]) => {
    const app = APPS.find(a => a.id === w.aid);
    if (app) processes.push(app.name.toLowerCase().replace(/\s+/g, '-') + ' [' + wid + ']');
  });
  const lines = processes.map((p, i) => {
    const pid = String(100 + i).padStart(5);
    const cpu = (Math.random() * 3 + 0.1).toFixed(1);
    const mem = (Math.random() * 20 + 2).toFixed(1);
    return `${pid}  ${cpu.padStart(4)}  ${mem.padStart(4)}  ${p}`;
  });
  return '  PID   CPU%  MEM%  COMMAND\n' + lines.join('\n');
};

TERM_CMDS.id = () => 'uid=1000(lumi-user) gid=1000(lumi-user) groups=1000(lumi-user)';

TERM_CMDS.users = () => 'lumi-user';

TERM_CMDS.env = () => {
  return `SHELL=/bin/lumish
USER=lumi-user
HOME=/home/lumi-user
PATH=/usr/bin:/usr/local/bin:/bin
PWD=${termCwd}
TERM=xterm-256color
LANG=en_US.UTF-8
DISPLAY=:0
OS=LumiOS`;
};

TERM_CMDS.which = (args) => {
  if (!args.length) return '';
  const cmd = args[0];
  if (TERM_CMDS[cmd]) return `/usr/bin/${cmd}`;
  return `which: no ${cmd} in (/usr/bin:/usr/local/bin:/bin)`;
};

// ─── Text & Utility Commands ───
TERM_CMDS.echo = (args) => args.join(' ') || '';

TERM_CMDS.clear = () => '__CLEAR__';

TERM_CMDS.grep = (args) => {
  if (!args.length) return 'grep: missing pattern';
  const pattern = args[0];
  const input = args.slice(1).join(' ') || '(no input provided)';
  const lines = input.split('\n');
  const matches = lines.filter(l => l.includes(pattern));
  return matches.length ? matches.join('\n') : '(no matches)';
};

TERM_CMDS.sort = (args) => {
  const input = args.join(' ') || 'nothing to sort';
  return input.split(' ').sort().join(' ');
};

TERM_CMDS.uniq = (args) => {
  const input = args.join(' ') || '';
  if (!input) return '';
  return input.split(' ').filter((w, i, arr) => i === 0 || w !== arr[i-1]).join(' ');
};

TERM_CMDS.banner = (args) => {
  const text = args.join(' ') || 'LumiOS';
  const lines = text.split('').map(c => {
    const code = c.toUpperCase().charCodeAt(0);
    const size = Math.max(3, text.length);
    return c + ' '.repeat(2);
  });
  // Simple ASCII banner
  const border = '='.repeat(text.length * 3 + 4);
  return `${border}\n= ${text.toUpperCase().split('').join(' | ')} =\n${border}`;
};

TERM_CMDS.cowsay = (args) => {
  const text = args.join(' ') || 'Moo!';
  const len = text.length;
  const border = ' ' + '_'.repeat(len + 2) + ' ';
  const msg = '< ' + text + ' >';
  const border2 = ' ' + '-'.repeat(len + 2) + ' ';
  const cow = `
${border}
${msg}
${border2}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
  `;
  return cow.trim();
};

TERM_CMDS.fortune = () => {
  const fortunes = [
    "The best way to predict the future is to create it.",
    "A journey of a thousand miles begins with a single step.",
    "In the middle of difficulty lies opportunity.",
    "Code is poetry in motion.",
    "LumiOS: A luminous computing experience.",
    "The only limit is your imagination.",
    "Why write a novel when you can write code?",
    "Have you tried turning it off and on again?",
    "There are 10 types of people in the world: those who understand binary, and those who don't.",
    "I find your lack of faith in the LumiOS disturbing.",
    "To Infinity and Beyond!",
    "Let there be light — LumiOS!",
    "A smooth sea never made a skilled sailor.",
    "The best error message is the one that never shows up.",
  ];
  return fortunes[Math.floor(Math.random() * fortunes.length)];
};

TERM_CMDS.yes = (args) => {
  const text = args.join(' ') || 'y';
  return (text + ' '.repeat(5)).repeat(10).trim();
};

// ─── Colors ───
TERM_CMDS.colors = () => {
  const cols = [
    ['30','black'], ['31','red'], ['32','green'], ['33','yellow'],
    ['34','blue'], ['35','magenta'], ['36','cyan'], ['37','white'],
    ['90','bright black'], ['91','bright red'], ['92','bright green'], ['93','bright yellow'],
    ['94','bright blue'], ['95','bright magenta'], ['96','bright cyan'], ['97','bright white'],
  ];
  return cols.map(([code, name]) => {
    const color = {
      '31':'#f87171','32':'#4ade80','33':'#fbbf24','34':'#60a5fa',
      '35':'#c084fc','36':'#22d3ee','37':'#e5e7eb','90':'#6b7280',
      '91':'#fca5a5','92':'#86efac','93':'#fde047','94':'#93c5fd',
      '95':'#d8b4fe','96':'#67e8f9','97':'#f9fafb',
    }[code] || '#ccc';
    return `<span style="color:${color}">\\e[${code}m</span>  ${name.padEnd(16)}`;
  }).join('');
};

// ─── Network Commands ───
TERM_CMDS.ping = (args) => {
  if (!args.length) return 'ping: missing host';
  const host = args[0];
  return `PING ${host} (127.0.0.1) 56(84) bytes of data.
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.42ms
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.38ms
64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=0.41ms
--- ${host} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 0.38/0.40/0.42/0.02 ms`;
};

TERM_CMDS.curl = (args) => {
  if (!args.length) return 'curl: try \'curl --help\' for more information';
  const url = args.filter(a => !a.startsWith('-')).pop() || 'https://example.com';
  return `<!DOCTYPE html>
<html><head><title>${url}</title></head>
<body><h1>LumiOS cURL</h1><p>Mock response for ${url}</p>
<p>Status: 200 OK</p><p>Content-Type: text/html</p></body></html>`;
};

// ─── System Control ───
TERM_CMDS.reboot = () => {
  setTimeout(() => location.reload(), 500);
  return 'Rebooting LumiOS...';
};

TERM_CMDS.shutdown = () => {
  document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#4ade80;font-family:monospace;font-size:18px">
    <div>System halted.<br><br><span style="color:#6b7280;font-size:13px">You may close this tab.</span></div>
  </div>`;
  return '';
};

TERM_CMDS.apps = () => {
  return APPS.map(a => `  ${a.name}`).join('\n');
};

TERM_CMDS.version = () => 'LumiOS 1.3.3 (LumiCore 1.0)';

// ─── Helpers ───
function resolvePath(input, cwd) {
  if (input === '~') return '/home/lumi-user';
  if (input === '.' || input === '') return cwd;
  if (input === '..') {
    if (cwd === '/') return '/';
    const parts = cwd.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/') || '/';
  }
  if (input.startsWith('/')) return normalizePath(input);
  if (input.startsWith('~')) return normalizePath('/home/lumi-user' + input.slice(1));
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