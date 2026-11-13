const button = document.querySelector('#run'),
  status = document.querySelector('#status'),
  result = document.querySelector('#result');
button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Request in progress…';
  const started = performance.now();
  try {
    const response = await fetch(
      '/api/items?scenario=' + encodeURIComponent(document.querySelector('#scenario').value),
    );
    result.textContent = await response.text();
    status.textContent =
      'HTTP ' +
      response.status +
      ' · ' +
      Math.round(performance.now() - started) +
      ' ms' +
      (response.headers.get('retry-after')
        ? ' · Retry-After: ' + response.headers.get('retry-after') + ' seconds'
        : '');
  } catch {
    status.textContent = 'Network connection failed as requested.';
    result.textContent = 'Handle this in your client catch block.';
  } finally {
    button.disabled = false;
  }
});
