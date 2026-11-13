import { createPlayground } from './server.mjs';
try {
  const args = process.argv.slice(2);
  let port = 4310,
    delayMs = 1500;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port') port = Number(args[++i]);
    else if (args[i] === '--delay') delayMs = Number(args[++i]);
    else if (args[i] === '--help') {
      console.log('npm start -- [--port 4310] [--delay 1500]');
      process.exit(0);
    } else throw new Error('Unknown option');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  const server = createPlayground({ delayMs });
  server.on('error', (e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () =>
    console.log('API Failure Playground: http://127.0.0.1:' + port),
  );
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
} catch (e) {
  console.error(e.message);
  process.exitCode = 2;
}
