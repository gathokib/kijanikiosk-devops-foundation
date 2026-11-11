# Week 10: Serverless Receipt Processing

## Architecture

The KijaniKiosk payments service uses a local AWS emulator (Floci)
to demonstrate an event-driven receipt processing workflow.

1. The payments API accepts a validated payment.
2. The AWS SDK uploads a JSON receipt to the staging S3 bucket.
3. S3 emits an ObjectCreated event.
4. The event invokes the Lambda function `kk-receipt-processor`.
5. Lambda logs the uploaded receipt's bucket and object key.

## Local infrastructure

- Emulator: Floci 2.4.0
- S3 bucket: kk-payments-receipts-staging
- Lambda: kk-receipt-processor
- Runtime: Node.js 22
- Region: us-east-1
- Local endpoint: http://localhost:4566

## Verification evidence

- Payment KK-001 accepted with HTTP 201.
- KK-001.json retrieved independently from S3.
- Payment KK-002 accepted with HTTP 201.
- Floci logs confirmed Lambda execution for KK-002.json.
- Lambda execution containers started successfully.
- Application tests: 8 passed, 0 failed.
- Production Docker image built successfully.
- Production container health endpoint returned HTTP 200.

## Production image

Image: kk-payments:week10

Reported Docker disk usage: 125 MB.
Content size: 46.2 MB.

The earlier 100 MB image target was not met after adding
the AWS SDK runtime dependencies.

## Limitations

This implementation was demonstrated locally using Floci.
A live AWS deployment has not been verified because AWS account
identity verification is incomplete.

The Lambda currently logs receipt upload metadata; it does not
perform downstream receipt delivery or payment settlement.

The local demonstration must not be represented as a live
AWS production deployment.
