#!/usr/bin/env bash
# Health checker for RockNDogs on Kubernetes
# - Verifies pods/deployments and key service endpoints in-cluster
# - Requires: kubectl, access to the cluster

set -u

NS="${NS:-rockndogs}"
LOGGING_NS="${LOGGING_NS:-logging}"
TIMEOUT="${TIMEOUT:-10}"
CURL_IMG="curlimages/curl:8.10.1"
BUSYBOX_IMG="busybox:1.36"
FALLBACK_IN_POD="${FALLBACK_IN_POD:-1}"

PASS=0
FAIL=0
WARN=0

hr() { printf '%*s\n' "${COLUMNS:-80}" '' | tr ' ' '-'; }
status() {
  local code="$1"; shift
  local msg="$*"
  case "$code" in
    0) echo "✅ PASS: $msg"; PASS=$((PASS+1));;
    1) echo "❌ FAIL: $msg"; FAIL=$((FAIL+1));;
    2) echo "⚠️  WARN: $msg"; WARN=$((WARN+1));;
  esac
}

kubectl_ok() {
  kubectl cluster-info >/dev/null 2>&1
}

ns_ok() {
  kubectl get ns "$1" >/dev/null 2>&1
}

check_rollout() {
  local deploy="$1" ns="$2"
  if kubectl rollout status -n "$ns" deploy/"$deploy" --timeout=${TIMEOUT}s >/dev/null 2>&1; then
    status 0 "Deployment $deploy is rolled out in namespace $ns"
  else
    status 1 "Deployment $deploy NOT rolled out in namespace $ns"
  fi
}

in_cluster_http() {
  local ns="$1" url="$2" allowed="$3"
  # run ephemeral curl pod
  local out
  out=$(kubectl run -n "$ns" curl-check-$(date +%s%N | cut -b1-13) \
    --image="$CURL_IMG" --restart=Never --rm -i --quiet -- \
    curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null)
  local rc=$?
  if [ $rc -ne 0 ] || [ -z "$out" ]; then
    if [ "$FALLBACK_IN_POD" = "1" ]; then
      # fallback: exec into app pod and use node http/https to query
      local appPod
      appPod=$(kubectl get pods -n "$ns" -l app=rockndogs -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
      if [ -n "$appPod" ]; then
        out=$(kubectl exec -n "$ns" "$appPod" -- node -e '
          const u = new URL(process.argv[1]);
          const mod = u.protocol === "https:" ? require("https") : require("http");
          const req = mod.request(u, { method: "GET", timeout: Number(process.env.TIMEOUT || 10000) }, res => { process.stdout.write(String(res.statusCode)); process.exit(0); });
          req.on("error", () => { process.stdout.write("000"); process.exit(0); });
          req.end();
        ' "$url" 2>/dev/null)
        echo "${out:-000}"
        return
      fi
    fi
    echo "000"
  else
    echo "$out"
  fi
}

in_cluster_tcp() {
  local ns="$1" host="$2" port="$3"
  kubectl run -n "$ns" nc-check-$(date +%s%N | cut -b1-13) \
    --image="$BUSYBOX_IMG" --restart=Never --rm -i --quiet -- \
    sh -c "nc -z -w ${TIMEOUT} $host $port && echo ok || echo fail" 2>/dev/null
}

in_pod_tcp() {
  local ns="$1" host="$2" port="$3"
  local appPod
  appPod=$(kubectl get pods -n "$ns" -l app=rockndogs -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
  if [ -z "$appPod" ]; then echo fail; return; fi
  kubectl exec -n "$ns" "$appPod" -- node -e '
    const net = require("net");
    const host = process.argv[1];
    const port = Number(process.argv[2]);
    const sock = net.createConnection({ host, port }, () => { console.log("ok"); process.exit(0); });
    sock.setTimeout(Number(process.env.TIMEOUT || 10000));
    sock.on("timeout", () => { console.log("fail"); process.exit(0); });
    sock.on("error", () => { console.log("fail"); process.exit(0); });
  ' "$host" "$port" 2>/dev/null
}

check_http() {
  local name="$1" ns="$2" url="$3" allowed_codes="$4"
  local code
  code=$(in_cluster_http "$ns" "$url" "$allowed_codes")
  if echo "$allowed_codes" | grep -q "$code"; then
    status 0 "$name HTTP $code ($url)"
  else
    status 1 "$name HTTP $code ($url) expected [$allowed_codes]"
  fi
}

check_tcp() {
  local name="$1" ns="$2" host="$3" port="$4"
  local res
  res=$(in_cluster_tcp "$ns" "$host" "$port")
  if [ "$res" != "ok" ] && [ "$FALLBACK_IN_POD" = "1" ]; then
    res=$(in_pod_tcp "$ns" "$host" "$port")
  fi
  if [ "$res" = "ok" ]; then
    status 0 "$name TCP $host:$port reachable"
  else
    status 1 "$name TCP $host:$port unreachable"
  fi
}

main() {
  echo "== RockNDogs Kubernetes Health Check =="
  echo "Namespace: $NS  (logging: $LOGGING_NS)"
  hr

  if ! kubectl_ok; then
    status 1 "kubectl not configured or cluster unreachable"
    exit 1
  fi

  if ! ns_ok "$NS"; then
    status 1 "Namespace $NS not found"
    exit 1
  fi

  echo "-- Deployments rollout --"
  check_rollout rockndogs-app "$NS"
  check_rollout mongodb "$NS"
  check_rollout elasticsearch "$NS"
  check_rollout redis "$NS"
  check_rollout kibana "$NS"
  hr

  echo "-- Service endpoints (in-cluster) --"
  # App: / should 302 to /home; /home should 200
  check_http "rockndogs-service root" "$NS" "http://rockndogs-service/" "200|301|302"
  check_http "rockndogs-service home" "$NS" "http://rockndogs-service/home" "200"

  # Elasticsearch
  check_http "elasticsearch" "$NS" "http://elasticsearch:9200" "200|401"

  # Kibana: prefer status API to avoid transient 500s during migrations
  check_http "kibana status" "$NS" "http://kibana:5601/api/status" "200"

  # MongoDB/Redis TCP checks
  check_tcp "mongodb" "$NS" mongodb 27017
  check_tcp "redis" "$NS" redis 6379
  hr

  # Logging namespace checks (optional)
  if ns_ok "$LOGGING_NS"; then
    local fb
    fb=$(kubectl get pods -n "$LOGGING_NS" -l app=fluent-bit --no-headers 2>/dev/null | awk '{print $3}' | sort -u)
    if echo "$fb" | grep -q "Running"; then
      status 0 "Fluent Bit DaemonSet running in $LOGGING_NS"
    else
      status 2 "Fluent Bit not fully running in $LOGGING_NS (states: $fb)"
    fi
  else
    status 2 "Logging namespace $LOGGING_NS not found (skip)"
  fi

  hr
  echo "Summary: PASS=$PASS WARN=$WARN FAIL=$FAIL"
  [ "$FAIL" -eq 0 ]
}

main "$@"
