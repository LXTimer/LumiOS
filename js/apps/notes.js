"use strict";

function buildNotes() {
  return `
    <div class="notes-wrap">
      <div class="app-toolbar">
        <button class="app-btn notes-btn-bold"      onclick="document.execCommand('bold',false,null)">B</button>
        <button class="app-btn notes-btn-italic"    onclick="document.execCommand('italic',false,null)">I</button>
        <button class="app-btn notes-btn-underline" onclick="document.execCommand('underline',false,null)">U</button>
        <div class="app-toolbar-sep"></div>
        <button class="app-btn" onclick="document.execCommand('insertUnorderedList',false,null)">• List</button>
        <button class="app-btn" onclick="document.execCommand('formatBlock',false,'h3')">Heading</button>
        <button class="app-btn" onclick="document.execCommand('formatBlock',false,'p')">Body</button>
      </div>
      <div id="notes-editor" contenteditable="true"
           onmousedown="event.stopPropagation()" aria-label="Notes editor">
        <p style="color:rgba(255,255,255,.3);font-style:italic">Start typing your notes here&hellip;</p>
      </div>
    </div>`;
}