#!/usr/bin/env bash
set -euo pipefail

# Start common port-forwards in background with nohup
# App (Service on port 80 -> localhost:3000)
nohup kubectl port-forward -n rockndogs svc/rockndogs-service 3000:80 > /tmp/app-pf.log 2>&1 & echo "App PF PID: $!"
# MongoDB (Service on 27017)
nohup kubectl port-forward -n rockndogs svc/mongodb 27017:27017 > /tmp/mongo-pf.log 2>&1 & echo "Mongo PF PID: $!"
# Elasticsearch (Service on 9200)
nohup kubectl port-forward -n rockndogs svc/elasticsearch 9200:9200 > /tmp/es-pf.log 2>&1 & echo "ES PF PID: $!"
# Redis (Service on 6379)
nohup kubectl port-forward -n rockndogs svc/redis 6379:6379 > /tmp/redis-pf.log 2>&1 & echo "Redis PF PID: $!"
# ArgoCD (Service 443 -> localhost:8080)
nohup kubectl port-forward -n argocd svc/argocd-server 8080:443 > /tmp/argocd-pf.log 2>&1 & echo "ArgoCD PF PID: $!"

echo "Port-forwards started. Use scripts/port-forward-stop.sh to stop them."
