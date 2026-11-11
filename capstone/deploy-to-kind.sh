#!/bin/sh
set -eu

TARGET="${1:?Usage: deploy-to-kind.sh staging|production}"
IMAGE="kk-payments:build-${BUILD_NUMBER:?BUILD_NUMBER missing}"

case "$TARGET" in
  staging)
    NAMESPACE="kijani-staging"
    PORT=18080
    EXPECTED_ENV="staging"

    echo "Building production image: $IMAGE"
    docker build -f week8/friday/Dockerfile.production -t "$IMAGE" .
    kind load docker-image "$IMAGE" --name kijani
    ;;
  production)
    NAMESPACE="kijani-production"
    PORT=18081
    EXPECTED_ENV="production"
    ;;
  *)
    echo "Unknown environment: $TARGET"
    exit 1
    ;;
esac

kubectl apply -f "capstone/kubernetes/configmap-${TARGET}.yaml"

sed "s#image: .*#image: ${IMAGE}#" capstone/kubernetes/deployment.yaml |
  kubectl apply -n "$NAMESPACE" -f -

kubectl apply -n "$NAMESPACE" -f capstone/kubernetes/service.yaml

kubectl rollout status deployment/kk-payments \
  -n "$NAMESPACE" --timeout=120s

PORT_FORWARD_LOG="/tmp/${TARGET}-port-forward.log"

kubectl port-forward service/kk-payments "${PORT}:3000" \
  -n "$NAMESPACE" >"$PORT_FORWARD_LOG" 2>&1 &
PF_PID=$!
trap 'kill "$PF_PID" 2>/dev/null || true' EXIT

READY=0
for attempt in $(seq 1 15); do
  if ! kill -0 "$PF_PID" 2>/dev/null; then
    echo "Port-forward exited unexpectedly:"
    cat "$PORT_FORWARD_LOG"
    exit 1
  fi

  if grep -q "Forwarding from" "$PORT_FORWARD_LOG"; then
    READY=1
    break
  fi

  sleep 1
done

if [ "$READY" -ne 1 ]; then
  echo "Port-forward did not become ready:"
  cat "$PORT_FORWARD_LOG"
  exit 1
fi

node --input-type=module - "$PORT" "$EXPECTED_ENV" <<'NODE'
const port = Number(process.argv[2]);
const expected = process.argv[3];

for (let attempt = 1; attempt <= 20; attempt++) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();

    if (response.ok && body.status === 'healthy' &&
        body.environment === expected) {
      console.log('Smoke test passed:', JSON.stringify(body));
      process.exit(0);
    }

    console.log(`Attempt ${attempt}: HTTP ${response.status}, environment=${body.environment}`);
  } catch (error) {
    console.log(`Attempt ${attempt}: ${error.message}`);
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
}

console.error('Smoke test failed');
process.exit(1);
NODE
