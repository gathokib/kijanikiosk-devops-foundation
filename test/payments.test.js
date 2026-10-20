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
