import http from 'node:http';
import fs from 'node:fs/promises';
export const scenarios = [
  'success',
  'empty',
  'slow',
  'unauthorized',
  'rate-limit',
  'server-error',
  'malformed',
  'flaky',
  'disconnect',
];
export function createPlayground({ delayMs = 1500 } = {}) {
  if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 30000)
    throw new RangeError('delayMs must be 0..30000');
  let flakyCalls = 0;
  const server = http.createServer(async (req, res) => {
    const send = (status, body, headers = {}) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...headers,
      });
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'GET') return send(405, { error: 'Use GET' }, { Allow: 'GET' });
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      return send(400, { error: 'Invalid URL' });
    }
    if (url.pathname === '/') {
      try {
        const html = await fs.readFile(new URL('../public/index.html', import.meta.url));
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'",
        });
        return res.end(html);
      } catch {
        return send(500, { error: 'Demo page unavailable' });
      }
    }
    if (url.pathname === '/app.js' || url.pathname === '/style.css') {
      const file = url.pathname === '/app.js' ? 'app.js' : 'style.css';
      res.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : 'text/css' });
      return res.end(await fs.readFile(new URL('../public/' + file, import.meta.url)));
    }
    if (url.pathname === '/health') return send(200, { ok: true });
    if (url.pathname === '/scenarios') return send(200, { scenarios });
    if (url.pathname !== '/api/items') return send(404, { error: 'Not found' });
    const scenario = url.searchParams.get('scenario') ?? 'success';
    if (!scenarios.includes(scenario)) return send(400, { error: 'Unknown scenario', scenarios });
    if (scenario === 'disconnect') {
      req.socket.destroy();
      return;
    }
    if (scenario === 'slow')
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, delayMs);
        res.once('close', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    if (res.destroyed) return;
    if (scenario === 'unauthorized')
      return send(
        401,
        { error: 'Session expired' },
        { 'WWW-Authenticate': 'Bearer realm="playground"' },
      );
    if (scenario === 'rate-limit')
      return send(429, { error: 'Too many requests' }, { 'Retry-After': '2' });
    if (scenario === 'server-error') return send(503, { error: 'Service temporarily unavailable' });
    if (scenario === 'flaky' && ++flakyCalls % 3 !== 0)
      return send(503, { error: 'Synthetic transient failure', attempt: flakyCalls });
    if (scenario === 'malformed') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end('{invalid JSON');
    }
    return send(200, {
      items:
        scenario === 'empty'
          ? []
          : [
              { id: 'item-1', name: 'Synthetic notebook' },
              { id: 'item-2', name: 'Synthetic pencil' },
            ],
      scenario,
    });
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  return server;
}
