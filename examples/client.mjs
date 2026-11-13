import { createPlayground, scenarios } from '../src/server.mjs';
const server = createPlayground({ delayMs: 20 });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
try {
  for (const scenario of scenarios)
    try {
      const response = await fetch(
        'http://127.0.0.1:' + server.address().port + '/api/items?scenario=' + scenario,
      );
      console.log(scenario, response.status, await response.text());
    } catch {
      console.log(scenario, 'network failure handled');
    }
} finally {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
