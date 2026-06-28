"use strict";

const BROWSER_HOME_URL = 'https://duckduckgo.com/';
const BROWSER_SEARCH_URL = 'https://duckduckgo.com/?q=';
const BROWSER_PROXY_PREFIX = '/proxy?url=';

const browserState = {
  history: [],
  index: -1,
  currentUrl: BROWSER_HOME_URL,
  initialized: false,
};

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
        <iframe src="about:blank" class="browser-iframe" id="browser-iframe"></iframe>
      </div>
    </div>
  `;
}

function browserInit(wid) {
  const searchInput = document.querySelector(`#${wid} #browser-search-input`);
  const iframe = document.querySelector(`#${wid} #browser-iframe`);

  if (browserState.initialized) {
    return;
  }

  browserState.initialized = true;

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        browserSearch();
      }
    });
  }
  
  if (iframe) {
    iframe.addEventListener('load', () => {
      browserSetLoading(false);

      if (browserHasProxy() && iframe.contentWindow) {
        const loadedUrl = browserDisplayValueFor(iframe.contentWindow.location.href);
        const activeUrl = browserResolveInput(loadedUrl);
        browserCommitHistory(activeUrl);

        if (searchInput) {
          searchInput.value = browserDisplayValueFor(activeUrl);
        }
      }
    });
  }

  browserNavigate(browserState.currentUrl, { replace: true });
}

function browserSearch() {
  const searchInput = document.getElementById('browser-search-input');
  if (!searchInput) return;
  
  const query = searchInput.value.trim();
  browserNavigate(query || BROWSER_HOME_URL);
}

function browserBack() {
  if (browserState.index > 0) {
    browserState.index -= 1;
    browserNavigate(browserState.history[browserState.index], { replace: true });
  }
}

function browserForward() {
  if (browserState.index < browserState.history.length - 1) {
    browserState.index += 1;
    browserNavigate(browserState.history[browserState.index], { replace: true });
  }
}

function browserRefresh() {
  if (browserState.currentUrl) {
    browserNavigate(browserState.currentUrl, { replace: true });
  }
}

function browserHome() {
  browserNavigate(BROWSER_HOME_URL);
}