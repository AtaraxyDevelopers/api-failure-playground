import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayground } from '../src/server.mjs';
test('all HTTP contracts including failures and flaky recovery', async (t) => {
  const server = createPlayground({ delayMs: 40 });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((r) => server.close(r));
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  for (const [scenario, status] of [
    ['success', 200],
    ['empty', 200],
    ['unauthorized', 401],
    ['rate-limit', 429],
    ['server-error', 503],
    ['unknown', 400],
  ]) {
    const r = await fetch(base + '/api/items?scenario=' + scenario);
    assert.equal(r.status, status);
    if (scenario === 'empty') assert.deepEqual((await r.json()).items, []);
    if (scenario === 'rate-limit') assert.equal(r.headers.get('retry-after'), '2');
  }
  const started = performance.now();
  await fetch(base + '/api/items?scenario=slow');
  assert.ok(performance.now() - started >= 30);
  const malformed = await fetch(base + '/api/items?scenario=malformed');
  await assert.rejects(malformed.json());
  for (const expected of [503, 503, 200])
    assert.equal((await fetch(base + '/api/items?scenario=flaky')).status, expected);
  await assert.rejects(fetch(base + '/api/items?scenario=disconnect'));
  assert.equal((await fetch(base + '/api/items', { method: 'POST' })).status, 405);
  assert.equal((await fetch(base + '/absent')).status, 404);
  assert.match(await (await fetch(base)).text(), /Make failure predictable/);
});
