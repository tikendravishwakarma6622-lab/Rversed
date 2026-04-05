#!/bin/bash
set -e

echo "=== Rversed Deployment Script ==="
echo ""

# Build the frontend
echo "[1/3] Building frontend..."
cd apps/web
npm run build
cd ../..

echo "[2/3] Frontend built successfully -> apps/web/dist"

# Verify API starts
echo "[3/3] Verifying API..."
NODE_ENV=production timeout 5 node apps/api/src/index.js &
sleep 2
curl -sf http://localhost:4000/health > /dev/null && echo "Health check passed!" || echo "Warning: health check failed"
kill %1 2>/dev/null || true

echo ""
echo "=== Build complete! ==="
echo ""
echo "Deploy options:"
echo "  Railway:  railway up"
echo "  Render:   git push (auto-deploys from render.yaml)"
echo "  Docker:   docker build -t rversed . && docker run -p 4000:4000 rversed"
echo ""
echo "Required env vars for production:"
echo "  DATABASE_URL          - PostgreSQL connection string"
echo "  STRIPE_SECRET_KEY     - Stripe secret key"
echo "  STRIPE_WEBHOOK_SECRET - Stripe webhook signing secret"
echo "  FRONTEND_URL          - https://rversed.com"
echo "  NODE_ENV              - production"
