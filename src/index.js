'use strict';

const http = require('node:http');

function loadConfig(env = process.env) {
  return {
    version: env.APP_VERSION || '1.0.0',
    environment: env.APP_ENV || 'development',
    dbHost: env.DB_HOST || ''
  };
}

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

function createServer(config = loadConfig()) {
  return http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/health') {
      res.writeHead(200);
      return res.end(JSON.stringify({
        status: 'healthy',
        service: 'kijanikiosk-payments',
        version: config.version,
        environment: config.environment,
        databaseConfigured: Boolean(config.dbHost)
      }));
    }

    if (req.url === '/') {
      res.writeHead(200);
      return res.end(JSON.stringify({
        service: 'kijanikiosk-payments',
        version: config.version,
        environment: config.environment
      }));
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}

if (require.main === module) {
  const config = loadConfig();
  const port = Number(process.env.PORT || 3000);

  createServer(config).listen(port, '0.0.0.0', () => {
    console.log(
      `KijaniKiosk v${config.version} (${config.environment}) listening on ${port}`
    );
  });
}

module.exports = { validatePayment, loadConfig, createServer };
