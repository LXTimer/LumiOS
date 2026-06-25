"use strict";

// ─────────────────────────────────────────────
//  APP: Notes — Rich Text + Markdown
// ─────────────────────────────────────────────

let notesMode = 'richtext';
let notesContent = '';
let notesFilename = '';

// ─── Load external content (called from Files app) ───
function notesLoadContent(content, filename) {
  notesContent = content;
  notesFilename = filename;
  // Switch to markdown mode if it looks like markdown, otherwise richtext
  if (content.includes('# ') || content.includes('```') || content.includes('**')) {
    notesSetMode('markdown');
  } else {
    notesSetMode('richtext');
  }
  const editor = document.getElementById('notes-editor');
  if (editor) {
    editor.innerText = content;
  }
}

// ─── Build ───
function buildNotes() {
  notesContent = '';
  notesFilename = '';
  return `
    <div class="notes-wrap">
      <div class="app-toolbar" id="notes-toolbar">
        <button class="app-btn ${notesMode==='richtext'?'active':''}" id="notes-btn-richtext"
                onclick="notesSetMode('richtext')" title="Rich Text">
          <i class="ti ti-edit"></i>
        </button>
        <button class="app-btn ${notesMode==='markdown'?'active':''}" id="notes-btn-markdown"
                onclick="notesSetMode('markdown')" title="Markdown">
          <i class="ti ti-markdown"></i>
        </button>
        <button class="app-btn ${notesMode==='preview'?'active':''}" id="notes-btn-preview"
                onclick="notesSetMode('preview')" title="Preview">
          <i class="ti ti-eye"></i>
        </button>
        <div class="app-toolbar-sep"></div>
        <span id="notes-rt-buttons">
          <button class="app-btn notes-btn-bold"      onclick="document.execCommand('bold',false,null)" title="Bold"><b>B</b></button>
          <button class="app-btn notes-btn-italic"    onclick="document.execCommand('italic',false,null)" title="Italic"><i>I</i></button>
          <button class="app-btn notes-btn-underline" onclick="document.execCommand('underline',false,null)" title="Underline"><u>U</u></button>
          <button class="app-btn notes-btn-list"      onclick="document.execCommand('insertUnorderedList',false,null)" title="List"><i class="ti ti-list"></i></button>
          <button class="app-btn" onclick="document.execCommand('formatBlock',false,'h3')" title="Heading">H</button>
          <button class="app-btn" onclick="document.execCommand('formatBlock',false,'p')" title="Body">P</button>
        </span>
        <span id="notes-md-buttons" style="display:none">
          <button class="app-btn" onclick="notesInsertMarkdown('# ')"># H</button>
          <button class="app-btn" onclick="notesInsertMarkdown('**','**')"><b>B</b></button>
          <button class="app-btn" onclick="notesInsertMarkdown('*','*')"><i>I</i></button>
          <button class="app-btn" onclick="notesInsertMarkdown('- ')">List</button>
          <button class="app-btn" onclick="notesInsertLink()"><i class="ti ti-link"></i></button>
          <button class="app-btn" onclick="notesInsertCodeBlock()"><i class="ti ti-code"></i></button>
        </span>
        <div class="app-toolbar-sep"></div>
        <button class="app-btn" onclick="notesDownloadTxt()" title="Download as .txt">
          <i class="ti ti-download"></i> Download
        </button>
        <button class="app-btn" onclick="notesCopyContent()" title="Copy to clipboard">
          <i class="ti ti-copy"></i>
        </button>
        <button class="app-btn" onclick="notesClear()" title="Clear">
          <i class="ti ti-trash"></i>
        </button>
      </div>
      <div id="notes-editor" contenteditable="true"
           onmousedown="event.stopPropagation()" aria-label="Notes editor">
      </div>
      <div id="notes-preview" style="display:none">
        <div class="notes-preview-empty">Nothing to preview</div>
      </div>
      <div class="notes-statusbar" id="notes-statusbar">
        <span id="notes-cursor-pos">Ln 1, Col 1</span>
        <span id="notes-word-count">0 words</span>
      </div>
    </div>`;
}

// ─── Mode Switching ───
function notesSetMode(mode) {
  const prevMode = notesMode;
  notesMode = mode;

  // Update toolbar active states
  ['richtext', 'markdown', 'preview'].forEach(m => {
    const btn = document.getElementById('notes-btn-' + m);
    if (btn) btn.classList.toggle('active', m === mode);
  });

  const editor = document.getElementById('notes-editor');
  const preview = document.getElementById('notes-preview');
  const rtBtns = document.getElementById('notes-rt-buttons');
  const mdBtns = document.getElementById('notes-md-buttons');

  if (!editor) return;

  // Save content when switching FROM richtext
  if (prevMode === 'richtext' && mode !== 'richtext') {
    const text = editor.innerText || editor.textContent || '';
    notesContent = text;
  }

  // Save content when switching FROM markdown
  if (prevMode === 'markdown') {
    const text = editor.innerText || editor.textContent || '';
    notesContent = text;
  }

  // Show/hide editor
  if (mode === 'preview') {
    editor.style.display = 'none';
    editor.contentEditable = 'false';
  } else {
    editor.style.display = 'block';
    editor.contentEditable = 'true';

    if (mode === 'richtext') {
      if (prevMode === 'markdown' && notesContent) {
        // Coming from markdown, show plain text in richtext
        editor.innerText = notesContent;
      } else if (!notesContent) {
        editor.innerHTML = '';
      }
    } else if (mode === 'markdown') {
      if (prevMode === 'richtext') {
        editor.innerText = notesContent || '';
      }
      if (!notesContent && !editor.innerText) {
        editor.innerText = '';
      }
    }
  }

  // Show/hide toolbar buttons
  if (rtBtns) rtBtns.style.display = (mode === 'richtext') ? '' : 'none';
  if (mdBtns) mdBtns.style.display = (mode === 'markdown') ? '' : 'none';

  // Update preview
  if (preview) {
    if (mode === 'preview' && notesContent && notesContent.trim()) {
      preview.style.display = 'block';
      preview.innerHTML = notesRenderMarkdown(notesContent);
    } else if (mode === 'preview') {
      preview.style.display = 'block';
      preview.innerHTML = '<div class="notes-preview-empty">Nothing to preview — write some markdown first!</div>';
    } else {
      preview.style.display = 'none';
    }
  }

  // Focus editor
  if (editor && mode !== 'preview') {
    setTimeout(() => {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.focus();
    }, 50);
  }
}

// ─── Markdown Insert Helpers ───
function notesInsertMarkdown(prefix, suffix) {
  const editor = document.getElementById('notes-editor');
  if (!editor) return;

  editor.focus();
  const sel = window.getSelection();
  let text = '';
  if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
    text = sel.toString();
  }

  const range = sel.getRangeAt(0);
  const wrapped = text
    ? prefix + text + (suffix || '')
    : prefix + (suffix || '');
  range.deleteContents();
  range.insertNode(document.createTextNode(wrapped));
  range.collapse(false);

  // Save content
  notesContent = editor.innerText || editor.textContent || '';
}

function notesInsertLink() {
  const editor = document.getElementById('notes-editor');
  if (!editor) return;

  editor.focus();
  const sel = window.getSelection();
  let text = '';
  if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
    text = sel.toString();
  }

  const range = sel.getRangeAt(0);
  const wrapped = text ? '[' + text + '](url)' : '[link](url)';
  range.deleteContents();
  range.insertNode(document.createTextNode(wrapped));
  range.collapse(false);
  notesContent = editor.innerText || editor.textContent || '';
}

function notesInsertCodeBlock() {
  const editor = document.getElementById('notes-editor');
  if (!editor) return;

  editor.focus();
  const sel = window.getSelection();
  let text = '';
  if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
    text = sel.toString();
  }

  const range = sel.getRangeAt(0);
  const wrapped = text ? '```\n' + text + '\n```' : '```\ncode\n```';
  range.deleteContents();
  range.insertNode(document.createTextNode(wrapped));
  range.collapse(false);
  notesContent = editor.innerText || editor.textContent || '';
}

// ─── Download as .txt ───
function notesDownloadTxt() {
  const editor = document.getElementById('notes-editor');
  if (!editor) return;

  let content = '';
  if (notesMode === 'richtext') {
    content = editor.innerText || editor.textContent || '';
  } else {
    content = notesContent || editor.innerText || editor.textContent || '';
  }

  if (!content || content.trim() === '') {
    notify('Nothing to download!');
    return;
  }

  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const name = (notesFilename ? notesFilename.replace(/\.(md|html)$/, '') : 'note-' + dateStr) + '.txt';

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  notify('Downloaded "' + name + '"');
}

// ─── Copy to Clipboard ───
function notesCopyContent() {
  const editor = document.getElementById('notes-editor');
  if (!editor) return;

  const text = notesContent || editor.innerText || editor.textContent || '';
  if (!text || text.trim() === '') {
    notify('Nothing to copy!');
    return;
  }

  navigator.clipboard.writeText(text).then(function () {
    notify('Content copied to clipboard');
  }).catch(function () {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    notify('Content copied to clipboard');
  });
}

// ─── Clear ───
function notesClear() {
  const editor = document.getElementById('notes-editor');
  if (!editor) return;
  notesContent = '';
  notesFilename = '';

  if (notesMode === 'richtext') {
    editor.innerHTML = '';
  } else {
    editor.innerText = '';
  }

  const preview = document.getElementById('notes-preview');
  if (preview) {
    preview.innerHTML = '<div class="notes-preview-empty">Nothing to preview — write some markdown first!</div>';
  }

  notify('Notes cleared');
}

// ─── Status Bar — Cursor Position & Word Count ───
function notesUpdateStatusbar() {
  const editor = document.getElementById('notes-editor');
  if (!editor) return;

  const text = editor.innerText || editor.textContent || '';
  notesContent = text;

  // Word count
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.getElementById('notes-word-count').textContent = words + ' word' + (words !== 1 ? 's' : '');

  // Cursor line / column
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !editor.contains(sel.anchorNode)) {
    document.getElementById('notes-cursor-pos').textContent = 'Ln 1, Col 1';
    return;
  }

  const node = sel.anchorNode;
  const offset = sel.anchorOffset;

  // If the node is a text node, walk previous siblings to count lines
  let line = 1;
  let col = 1;

  if (node === editor) {
    // Cursor is directly on the editor element (empty or at start)
    line = 1;
    col = 1;
  } else {
    // Walk up and count previous siblings + text before cursor
    let targetNode = node;
    let targetOffset = offset;

    // Count newlines in the full text before the cursor position
    const fullText = text;
    if (targetNode.nodeType === 3) {
      // text node: calculate partial text before cursor
      const beforeText = fullText.substring(0, getTextOffset(editor, targetNode, targetOffset));
      const lines = beforeText.split('\n');
      line = lines.length;
      col = lines[lines.length - 1].length + 1;
    }
  }

  document.getElementById('notes-cursor-pos').textContent = 'Ln ' + line + ', Col ' + col;
}

function getTextOffset(root, targetNode, targetOffset) {
  let offset = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n === targetNode) {
      return offset + targetOffset;
    }
    offset += (n.textContent || '').length;
  }
  return offset;
}

// ─── Input Tracking ───
document.addEventListener('input', function(e) {
  const editor = document.getElementById('notes-editor');
  if (!editor || !editor.contains(e.target)) return;

  const text = editor.innerText || editor.textContent || '';
  notesContent = text;

  const preview = document.getElementById('notes-preview');
  if (preview && notesMode === 'preview' && notesContent && notesContent.trim()) {
    preview.innerHTML = notesRenderMarkdown(notesContent);
  }

  notesUpdateStatusbar();
});

document.addEventListener('selectionchange', function() {
  const editor = document.getElementById('notes-editor');
  if (editor && editor.style.display !== 'none') {
    notesUpdateStatusbar();
  }
});

// ─── Markdown Renderer ───
function notesRenderMarkdown(md) {
  if (!md || md.trim() === '') return '<div class="notes-preview-empty">Nothing to preview</div>';

  let html = md;
  html = html.split('&').join('&').split('<').join('<').split('>').join('>');

  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Inline code (must be after code blocks)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">');

  html = html.replace(/^---$/gm, '<hr>');

  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, function(m) { return '<ul>' + m + '</ul>'; });

  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, function(m) {
    if (m.indexOf('<ul>') !== -1) return m;
    return '<ol>' + m + '</ol>';
  });

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  if (html.indexOf('<p>') === -1 && html.indexOf('<h') === -1 && html.indexOf('<pre') === -1 && html.indexOf('<ul') === -1 && html.indexOf('<ol') === -1 && html.indexOf('<blockquote') === -1) {
    html = '<p>' + html + '</p>';
  }

  // Cleanup
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<br><\/p>/g, '</p>');
  html = html.replace(/<p><br>/g, '<p>');

  return html;
}