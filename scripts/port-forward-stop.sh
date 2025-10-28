#!/usr/bin/env bash
set -euo pipefail

# Stop all kubectl port-forward processes
pkill -f "kubectl port-forward" || true

echo "Stopped all kubectl port-forward processes."
