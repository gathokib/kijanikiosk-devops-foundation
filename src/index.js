
'use strict';

const http = require('node:http');
const {
  S3Client,
  PutObjectCommand
} = require('@aws-sdk/client-s3');

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

function createServer(config = loadConfig(), dependencies = {}) {
  const bucket = process.env.RECEIPTS_BUCKET || '';
  const endpoint = process.env.AWS_ENDPOINT_URL || '';

  const s3 = dependencies.s3Client || new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    ...(endpoint ? {
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
      }
    } : {})
  });

  return http.createServer(async (req, res) => {
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

    if (req.url === '/' && req.method === 'GET') {
      res.writeHead(200);
      return res.end(JSON.stringify({
        service: 'kijanikiosk-payments',
        version: config.version,
        environment: config.environment
      }));
    }

    if (req.url === '/payments' && req.method === 'POST') {
      try {
        if (!bucket) {
          res.writeHead(503);
          return res.end(JSON.stringify({
            error: 'Receipt storage is not configured'
          }));
        }

        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 10000) {
            throw new Error('Request body too large');
          }
        }

        const payment = validatePayment(JSON.parse(raw));

        const receipt = {
          ...payment,
          service: 'kijanikiosk-payments',
          environment: config.environment,
          createdAt: new Date().toISOString(),
          status: 'received'
        };

        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: `${payment.reference}.json`,
          Body: JSON.stringify(receipt),
          ContentType: 'application/json'
        }));

        res.writeHead(201);
        return res.end(JSON.stringify({
          message: 'Payment receipt stored successfully',
          receipt
        }));
      } catch (error) {
        const status = error instanceof TypeError ||
          error instanceof SyntaxError ? 400 : 500;

        res.writeHead(status);
        return res.end(JSON.stringify({
          error: status === 400 ? error.message : 'Payment processing failed'
        }));
      }
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
