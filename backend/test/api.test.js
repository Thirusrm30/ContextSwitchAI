const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('GET /api/health returns status ok and timestamp', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.ok(data.timestamp);
});

test('POST /api/sessions validation error when userId is missing', async () => {
  const res = await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName: 'Test' }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'Validation Error');
});

test('POST /api/projects validation error when name is missing', async () => {
  const res = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: '64f1a2b3c4d5e6f7a8b9c0d1' }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'Validation Error');
});

test('GET /api/settings requires userId query parameter', async () => {
  const res = await fetch(`${baseUrl}/api/settings`);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'userId is required');
});
