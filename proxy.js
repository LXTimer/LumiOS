const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const URL = require('url').URL;

const app = express();
const PORT = process.env.PORT || 3000;

// Basic whitelist to avoid open proxy abuse (adjust as needed)
const ALLOWED_HOSTS = null; // null = allow all (for dev). Set to array of hostnames to restrict.

function isAllowed(urlStr) {
  if (!ALLOWED_HOSTS) return true;
  try {
    const u = new URL(urlStr);
    return ALLOWED_HOSTS.includes(u.hostname);
  } catch (e) {
    return false;
  }
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/proxy', async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send('missing url');
  if (!isAllowed(target)) return res.status(403).send('host not allowed');

  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': req.get('User-Agent') || 'LumiOS-proxy' }
    });

    // Clone headers and remove framing/security headers
    upstream.headers.forEach((value, name) => {
      const lc = name.toLowerCase();
      if ([
        'content-security-policy',
        'content-security-policy-report-only',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy'
      ].includes(lc)) {
        return;
      }
      res.set(name, value);
    });

    const contentType = upstream.headers.get('content-type') || '';
    const body = await upstream.buffer();

    if (contentType.includes('text/html')) {
      // Rewrite HTML: change links/src/href/action to route through proxy
      const html = body.toString('utf8');
      const $ = cheerio.load(html);
      const base = upstream.url; // resolved URL

      const proxyify = (attr, elem) => {
        const v = $(elem).attr(attr);
        if (!v) return;
        // ignore data: and mailto: and javascript:
        if (/^(data:|mailto:|javascript:|#)/i.test(v)) return;
        try {
          const abs = new URL(v, base).toString();
          $(elem).attr(attr, '/proxy?url=' + encodeURIComponent(abs));
        } catch (e) {
          // skip
        }
      };

      $('a').each((i, el) => proxyify('href', el));
      $('img').each((i, el) => proxyify('src', el));
      $('script').each((i, el) => proxyify('src', el));
      $('link').each((i, el) => proxyify('href', el));
      $('iframe').each((i, el) => proxyify('src', el));
      $('form').each((i, el) => {
        // change form action to proxy; set method to get for simplicity
        proxyify('action', el);
        $(el).attr('method', 'get');
      });

      // inject a small base tag to ensure relative URLs are resolved by proxyified links
      // not strictly necessary since we rewrote many attributes, but helpful
      if ($('head').length) {
        $('head').prepend(`<meta name="x-proxy" content="lumios-proxy">`);
      }

      return res.send($.html());
    }

    // binary or other content - pipe as-is
    res.send(body);
  } catch (err) {
    console.error('proxy error', err);
    res.status(502).send('bad gateway');
  }
});

app.listen(PORT, () => console.log(`LumiOS proxy running on http://localhost:${PORT}`));

// Simple health
app.get('/', (req, res) => res.send('LumiOS proxy running'));
