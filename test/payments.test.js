'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePayment } = require('../src/index');

test('accepts a valid payment', () => {
  assert.deepEqual(
    validatePayment({
      reference: ' KK-001 ',
      amount: 1500,
      currency: 'KES'
    }),
    {
      reference: 'KK-001',
      amount: 1500,
      currency: 'KES'
    }
  );
});

test('rejects a missing payment reference', () => {
  assert.throws(
    () => validatePayment({ amount: 1500, currency: 'KES' }),
    /reference is required/
  );
});

test('rejects zero or negative amounts', () => {
  assert.throws(
    () => validatePayment({
      reference: 'KK-002',
      amount: 0,
      currency: 'KES'
    }),
    /positive integer/
  );
});

test('rejects malformed currency codes', () => {
  assert.throws(
    () => validatePayment({
      reference: 'KK-003',
      amount: 1500,
      currency: 'kes'
    }),
    /three-letter uppercase code/
  );
});

const { loadConfig, createServer } = require('../src/index');

test('loads staging environment configuration', () => {
  const config = loadConfig({
    APP_VERSION: '1.0.0',
    APP_ENV: 'staging',
    DB_HOST: 'staging-db.internal'
  });

  assert.deepEqual(config, {
    version: '1.0.0',
    environment: 'staging',
    dbHost: 'staging-db.internal'
  });
});

test('uses safe defaults when environment variables are absent', () => {
  const config = loadConfig({});

  assert.deepEqual(config, {
    version: '1.0.0',
    environment: 'development',
    dbHost: ''
  });
});

test('health endpoint reports environment without exposing DB host', async (t) => {
  const server = createServer({
    version: '1.0.0',
    environment: 'staging',
    dbHost: 'staging-db.internal'
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/health`
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.environment, 'staging');
  assert.equal(body.databaseConfigured, true);
  assert.equal(JSON.stringify(body).includes('staging-db.internal'), false);
});
