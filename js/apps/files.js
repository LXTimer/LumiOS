"use strict";

//----------------
// File System App
//----------------


let currentPath = "/home/lumi-user";

const mockFileSystem = {
  "/home/lumi-user": [
    { name: "Documents", type: "folder", icon: "ti-folder" },
    { name: "Downloads", type: "folder", icon: "ti-folder" }
  ],
  "/home/lumi-user/Documents": [
    { name: ".. (Go Back)", type: "back", icon: "ti-arrow-left" },
    { name: "report.pdf", type: "file", icon: "ti-file-text" },
    { name: "budget.xlsx", type: "file", icon: "ti-file-spreadsheet" }
  ],
  "/home/lumi-user/Downloads": [
    { name: ".. (Go Back)", type: "back", icon: "ti-arrow-left" },
    { name: "LumiOS-1.0.iso", type: "file", icon: "ti-disc" }
  ]
};

function filesInit(wid) {
  console.log(`Files app ready in window: ${wid}`);
}

function buildFiles() {
  const items = mockFileSystem[currentPath] || [];
  
  const itemsHtml = items.map(item => `
    <div onclick="filesInteract('${item.name}', '${item.type}')" 
         style="padding: 10px; margin-bottom: 5px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
      <i class="ti ${item.icon}" style="font-size: 18px; color: ${item.type === 'folder' ? '#fab90a' : '#aaa'};"></i>
      <span style="color: #eee; font-size: 13px;">${item.name}</span>
    </div>
  `).join('');

  return `
    <div class="files-wrap" id="mock-files-app">
      <div class="files-toolbar">
        <div class="files-path">${currentPath}</div>
      </div>
      <div style="padding: 15px; overflow-y: auto; flex: 1;">
        ${itemsHtml}
      </div>
    </div>`;
}

function filesInteract(name, type) {
  if (type === 'folder') {
    currentPath = `${currentPath}/${name}`;
  } else if (type === 'back') {
    currentPath = "/home/lumi-user";
  } else {
    alert(`Opening file: ${name}`);
    return; // Don't re-render for files
  }
  
  // Re-render the app interface to show the new path
  const container = document.getElementById('mock-files-app');
  if (container) {
    container.outerHTML = buildFiles();
  }
}