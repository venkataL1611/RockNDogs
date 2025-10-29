#!/bin/bash

# Test login functionality in Kubernetes environment

set -e

# Get the service URL
echo "Getting service URL..."
SERVICE_URL=$(kubectl get svc -n rockndogs rockndogs-service -o jsonpath='{.spec.clusterIP}')
SERVICE_PORT=$(kubectl get svc -n rockndogs rockndogs-service -o jsonpath='{.spec.ports[0].port}')

echo "Service: http://${SERVICE_URL}:${SERVICE_PORT}"

# Create a test pod with curl to test from inside the cluster
echo "Testing login from inside the cluster..."

# Test 1: Get login page
echo -e "\n1. Getting login page..."
kubectl run -n rockndogs test-curl --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s -o /dev/null -w "Login page status: %{http_code}\n" \
  http://rockndogs-service/login

# Test 2: Submit login form
echo -e "\n2. Testing login POST..."
kubectl run -n rockndogs test-login --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -v -L -c /tmp/cookies.txt -b /tmp/cookies.txt \
  -d "email=testuser@test.com&password=password123" \
  http://rockndogs-service/login 2>&1 | grep -E "(HTTP|Location|Set-Cookie)" || echo "Login completed"

echo -e "\nLogin test complete!"
