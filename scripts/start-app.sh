#!/bin/bash

# Start port-forward for the app on localhost:3000
# This script will keep running until you press Ctrl+C

echo "🚀 Starting RockNDogs on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

kubectl port-forward -n rockndogs svc/rockndogs-service 3000:3000
