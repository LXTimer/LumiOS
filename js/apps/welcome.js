"use strict";

function buildWelcome() {
  return `
    <div class="welcome-wrap">
      <div class="welcome-header">
        <div class="welcome-logo">
          <i class="ti ti-sparkles" aria-hidden="true"></i>
        </div>
        <div>
          <div class="welcome-title">Welcome to LumiOS!!!</div>
          <div class="welcome-sub">A luminous computing experience</div>
        </div>
      </div>
      <div class="welcome-tips">
        <strong>Tips:</strong> Click taskbar icons to open apps &middot;
        Use the system settings to adjust the look & feel of the OS &middot;
        Explore different apps to help you familiarize with this aesthetic OS! 
      </div>
      <div class="welcome-grid">
        ${APPS.filter(a => a.id !== 'welcome').map(a => `
          <div class="welcome-app-btn" onclick="openApp('${a.id}')">
            <div class="welcome-app-icon" style="background:${a.gr}">
              <i class="ti ${a.ic}" aria-hidden="true"></i>
            </div>
            <div>
              <div class="welcome-app-name">${a.name}</div>
              <div class="welcome-app-hint">Open app</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}