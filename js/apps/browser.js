"use strict";

function buildBrowser() {
  return `
    <div class="browser-app">
      <div class="browser-toolbar">
        <div class="browser-nav">
          <button class="browser-btn" onclick="browserBack()" title="Back">
            <i class="ti ti-arrow-left"></i>
          </button>
          <button class="browser-btn" onclick="browserForward()" title="Forward">
            <i class="ti ti-arrow-right"></i>
          </button>
          <button class="browser-btn" onclick="browserRefresh()" title="Refresh">
            <i class="ti ti-refresh"></i>
          </button>
          <button class="browser-btn" onclick="browserHome()" title="Home">
            <i class="ti ti-home"></i>
          </button>
        </div>
        <div class="browser-search-wrap">
          <i class="ti ti-search"></i>
          <input type="text" class="browser-search" placeholder="Search the web..." id="browser-search-input">
          <button class="browser-go-btn" onclick="browserSearch()">Go</button>
        </div>
        <div class="browser-logo">
          <i class="ti ti-globe"></i>
        </div>
      </div>
      <div class="browser-content" id="browser-content">
        <iframe src="https://duckduckgo.com" class="browser-iframe" id="browser-iframe"></iframe>
      </div>
    </div>
  `;
}

function browserInit(wid) {
  const searchInput = document.querySelector(`#${wid} #browser-search-input`);
  const iframe = document.querySelector(`#${wid} #browser-iframe`);
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        browserSearch();
      }
    });
  }
  
  if (iframe) {
    iframe.addEventListener('load', () => {
      console.log('Page loaded');
    });
  }
}

function browserSearch() {
  const searchInput = document.getElementById('browser-search-input');
  const iframe = document.getElementById('browser-iframe');
  
  if (!searchInput || !iframe) return;
  
  const query = searchInput.value.trim();
  if (query) {
    iframe.src = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  } else {
    iframe.src = 'https://duckduckgo.com';
  }
}

function browserBack() {
  const iframe = document.getElementById('browser-iframe');
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.history.back();
    } catch (e) {
      console.log('Cannot go back');
    }
  }
}

function browserForward() {
  const iframe = document.getElementById('browser-iframe');
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.history.forward();
    } catch (e) {
      console.log('Cannot go forward');
    }
  }
}

function browserRefresh() {
  const iframe = document.getElementById('browser-iframe');
  if (iframe) {
    iframe.src = iframe.src;
  }
}

function browserHome() {
  const iframe = document.getElementById('browser-iframe');
  if (iframe) {
    iframe.src = 'https://duckduckgo.com';
  }
}