# Fluent Bit + Elasticsearch + Kibana Setup

This guide shows how to install Fluent Bit in the cluster to ship container logs (stdout) to Elasticsearch and explore them in Kibana.

## Prerequisites

- Kubernetes cluster (minikube or similar)
- Elasticsearch running in namespace `rockndogs` (see `k8s/elasticsearch.yaml`)
- Optional: Kibana in namespace `rockndogs` (see `k8s/kibana.yaml`)

## Install Fluent Bit

Apply the manifests:

```bash
kubectl apply -f k8s/logging/fluent-bit.yaml
```

What gets created:

- Namespace `logging`
- ServiceAccount + RBAC to read Pod metadata
- ConfigMap with `fluent-bit.conf` (tail /var/log/containers, CRI parser, k8s filter)
- DaemonSet `fluent-bit` (one pod per node) shipping to `elasticsearch.rockndogs.svc.cluster.local:9200` into index `rockndogs-logs`

Verify:

```bash
kubectl -n logging get pods -l app=fluent-bit
kubectl -n logging logs -l app=fluent-bit --tail=50
```

## Install Kibana (optional)

```bash
kubectl apply -f k8s/kibana.yaml
kubectl -n rockndogs port-forward svc/kibana 5601:5601
# Visit http://localhost:5601
```

Create an index pattern:

- Open Kibana → Stack Management → Kibana → Index Patterns → Create index pattern
- Name: `rockndogs-logs*`
- Time field: `@timestamp`

## Notes

- The app logs are emitted in JSON via Pino to stdout; Fluent Bit adds Kubernetes metadata and forwards to Elasticsearch.
- If Elasticsearch requires auth/TLS, adjust the OUTPUT section in `fluent-bit.conf` accordingly (user/password or TLS settings).
- Retention: configure ILM (Index Lifecycle Management) in Elasticsearch or use Curator to manage indices.

## Troubleshooting

- No logs in ES:
  - Check Fluent Bit logs for output errors
  - Ensure `elasticsearch.rockndogs.svc.cluster.local:9200` resolves and is reachable
  - Validate ES is accepting connections (no auth/TLS mismatch)
- Parsing issues:
  - Ensure `Parser cri` is used and that container runtime writes to `/var/log/containers/*.log`
- High volume:
  - Consider adjusting `Mem_Buf_Limit` and `Flush` interval, or lower app log level in production (LOG_LEVEL=info/warn)
