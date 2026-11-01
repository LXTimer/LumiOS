"use strict";

// Bing allows its results page to be embedded in an iframe; Google/DuckDuckGo
// send X-Frame-Options and refuse to load inside the app.
const BROWSER_SEARCH_URL = 'https://www.bing.com/search?q=';

const BROWSER_START_URL = 'lumios://start';
const BROWSER_START_HTML =
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
  'html,body{height:100%;margin:0}' +
  'body{display:flex;flex-direction:column;align-items:center;justify-content:center;' +
  'gap:8px;background:#f7f8fb;color:#1f2937;font-family:system-ui,sans-serif}' +
  'h1{margin:0;font-size:20px;font-weight:600}' +
  'p{margin:0;font-size:13px;color:#6b7280}' +
  '</style></head><body>' +
  '<h1>LumiOS Browser</h1>' +
  '<p>Type a search query or a URL in the address bar above.</p>' +
  '</body></html>';

const browserState = {
  history: [],
  index: -1,
  currentUrl: BROWSER_START_URL,
};

let browserLoadTimer = null;

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
          <input type="text" class="browser-search" placeholder="Search Bing or enter a URL..."
                 id="browser-search-input" autocomplete="off" spellcheck="false">
          <button class="browser-go-btn" onclick="browserSearch()">Go</button>
        </div>
        <div class="browser-logo">
          <i class="ti ti-globe"></i>
        </div>
      </div>
      <div class="browser-content" id="browser-content">
        <iframe class="browser-iframe" id="browser-iframe"></iframe>
      </div>
    </div>
  `;
}

function browserInit(wid) {
  const root = document.getElementById(wid);
  if (!root) return;
  const searchInput = root.querySelector('#browser-search-input');
  const iframe = root.querySelector('#browser-iframe');

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        browserSearch();
      }
    });
  }

  if (iframe) {
    iframe.addEventListener('load', () => browserSetLoading(false));
  }

  browserLoad(browserState.currentUrl, browserDisplayFor(browserState.currentUrl), true);
}

function browserSearch() {
  const searchInput = document.getElementById('browser-search-input');
  if (!searchInput) return;
  browserNavigate(searchInput.value.trim());
}

function browserNavigate(input) {
  const { url, display } = browserResolveInput(input);
  browserLoad(url, display, false);
}

function browserResolveInput(input) {
  const value = input.trim();
  if (!value) {
    return { url: BROWSER_START_URL, display: '' };
  }

  const isUrl = /^https?:\/\//i.test(value) ||
    (!/\s/.test(value) && /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/\S*)?$/i.test(value));

  if (isUrl) {
    const url = /^https?:\/\//i.test(value) ? value : 'https://' + value;
    return { url, display: url };
  }

  return { url: BROWSER_SEARCH_URL + encodeURIComponent(value), display: value };
}

function browserDisplayFor(url) {
  if (!url || url === BROWSER_START_URL) return '';
  if (url.startsWith(BROWSER_SEARCH_URL)) {
    try {
      return new URL(url).searchParams.get('q') || '';
    } catch (e) {
      return '';
    }
  }
  return url;
}

function browserLoad(url, display, replace) {
  const iframe = document.getElementById('browser-iframe');
  const searchInput = document.getElementById('browser-search-input');
  if (!iframe) return;

  browserState.currentUrl = url;

  if (replace) {
    if (browserState.index < 0) {
      browserState.history = [url];
      browserState.index = 0;
    } else {
      browserState.history[browserState.index] = url;
    }
  } else {
    browserState.history = browserState.history.slice(0, browserState.index + 1);
    browserState.history.push(url);
    browserState.index = browserState.history.length - 1;
  }

  if (searchInput) searchInput.value = display;
  browserSetLoading(true);
  if (url === BROWSER_START_URL) {
    iframe.removeAttribute('src');
    iframe.srcdoc = BROWSER_START_HTML;
  } else {
    iframe.removeAttribute('srcdoc');
    iframe.src = url;
  }
}

function browserSetLoading(on) {
  const content = document.getElementById('browser-content');
  if (!content) return;
  content.classList.toggle('loading', on);

  clearTimeout(browserLoadTimer);
  if (on) {
    // Some sites refuse to load inside a frame and never fire "load".
    browserLoadTimer = setTimeout(() => browserSetLoading(false), 15000);
  }
}

function browserBack() {
  if (browserState.index > 0) {
    browserState.index -= 1;
    const url = browserState.history[browserState.index];
    browserLoad(url, browserDisplayFor(url), true);
  }
}

function browserForward() {
  if (browserState.index < browserState.history.length - 1) {
    browserState.index += 1;
    const url = browserState.history[browserState.index];
    browserLoad(url, browserDisplayFor(url), true);
  }
}

function browserRefresh() {
  if (browserState.currentUrl) {
    browserLoad(browserState.currentUrl, browserDisplayFor(browserState.currentUrl), true);
  }
}

function browserHome() {
  browserLoad(BROWSER_START_URL, '', false);
}


