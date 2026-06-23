"use strict";

const TERM_CMDS = {
  help:   () => 'Commands:\n  help        Show this help\n  whoami      Current user\n  date        Date & time\n  pwd         Working directory\n  ls          List files\n  uname       System info\n  echo [txt]  Print text\n  clear       Clear screen\n version       OS version\n apps       Show apps installed',
  whoami: () => 'lumi-user',
  date:   () => new Date().toLocaleString(),
  pwd:    () => '/home/lumi-user',
  ls:     () => 'Documents/  Downloads/  Desktop/  Pictures/  Music/\nnotes.md   config.json   README.txt',
  uname:  () => 'LumiOS 1.0.0 LumiCore x86_64',
  echo:   args => args.join(' ') || '',
  clear:  () => '__CLEAR__',
  cd:     () => '',
  version: () => 'LumiOS 1.3.3',
  apps:   () => 'Calculator \n Calendar \n Clock \n Files \n Notes \n Paint \n Settings \n Terminal \n Widgets'
};

function buildTerminal() {
  return `
    <div class="term-wrap">
      <div class="term-output">
        <div class="term-welcome">LumiOS Terminal v1.0.0</div>
        <div class="term-hint">Type <span style="color:#4ade80">'help'</span> for commands.</div>
      </div>
      <div class="term-input-row">
        <span class="term-prompt">lumi@os:~$</span>
        <input type="text" class="tin" aria-label="Terminal input"
               onmousedown="event.stopPropagation()"
               onkeydown="if(event.key==='Enter'){termExec(this);this.value=''}">
      </div>
    </div>`;
}

function termExec(el) {
  const raw = el.value.trim(); if (!raw) return;
  const out = el.closest('.wc').querySelector('.term-output'); if (!out) return;
  const cmdLine = document.createElement('div');
  cmdLine.className = 'term-cmd'; cmdLine.textContent = 'lumi@os:~$ ' + raw;
  out.appendChild(cmdLine);
  const [cmd, ...args] = raw.split(' ');
  const fn = TERM_CMDS[cmd];
  if (fn) {
    const res = fn(args);
    if (res === '__CLEAR__') { out.innerHTML = ''; }
    else res.split('\n').forEach(line => {
      const d=document.createElement('div'); d.className='term-out'; d.textContent=line; out.appendChild(d);
    });
  } else {
    const e=document.createElement('div'); e.className='term-err';
    e.textContent=`lumish: ${cmd}: command not found`; out.appendChild(e);
  }
  out.scrollTop = out.scrollHeight;
}