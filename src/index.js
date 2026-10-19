'use strict';

function validatePayment(payment) {
  if (!payment || typeof payment !== 'object') {
    throw new TypeError('Payment must be an object');
  }

  if (typeof payment.reference !== 'string' ||
      payment.reference.trim().length === 0) {
    throw new TypeError('Payment reference is required');
  }

  if (!Number.isSafeInteger(payment.amount) || payment.amount <= 0) {
    throw new TypeError('Amount must be a positive integer in minor units');
  }

  if (typeof payment.currency !== 'string' ||
      !/^[A-Z]{3}$/.test(payment.currency)) {
    throw new TypeError('Currency must be a three-letter uppercase code');
  }

  return {
    reference: payment.reference.trim(),
    amount: payment.amount,
    currency: payment.currency
  };
}

module.exports = { validatePayment };
