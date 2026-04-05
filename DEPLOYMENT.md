# rversed — Production Deployment Guide

## Quick Start (Local / Dev)

```bash
# Using Docker Compose
docker-compose up -d

# Seeds a test user + initializes DB
docker-compose run --rm rversed-api npm run seed

# Access:
# Frontend: http://localhost:3000
# API: http://localhost:4000
# Admin: http://localhost:3000/admin
```

## Deployment Options

### Option 1: Heroku (Recommended for MVP)
```bash
heroku create rversed-app
heroku addons:create heroku-postgresql:standard-0
heroku buildpacks:add heroku/nodejs
git push heroku main
heroku run npm run migrate
```

### Option 2: AWS (ECS + RDS)
```bash
# Create ECR repos
aws ecr create-repository --repository-name rversed-api
aws ecr create-repository --repository-name rversed-web

# Push images
docker tag rversed-api:latest <account>.dkr.ecr.<region>.amazonaws.com/rversed-api:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/rversed-api:latest

# Deploy via ECS/CloudFormation
# (See infrastructure/ folder for templates)
```

### Option 3: DigitalOcean App Platform
```bash
# Commit code, push to GitHub
# Link GitHub repo to DigitalOcean App Platform
# Configure env vars
# Deploy
```

## Environment Variables (Production)

```bash
# Payment Providers
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_RETURN_URL=https://rversed.app/checkout/success

PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=production

ADYEN_API_KEY=...
ADYEN_MERCHANT_ACCOUNT=...

# Database
DATABASE_URL=postgres://user:pass@host:5432/rversed
REDIS_URL=redis://...

# Security
JWT_SECRET=<random_32_char_string>
SESSION_SECRET=<random_32_char_string>

# Features
NODE_ENV=production
DAILY_BUY_LIMIT_CENTS=10000000  # $100k
LOG_LEVEL=info
ENABLE_RATE_LIMITING=true
ENABLE_FRAUD_CHECKS=true
```

## Monitoring & Logs

```bash
# View logs
docker-compose logs -f rversed-api
docker-compose logs -f rversed-web

# Health check
curl http://localhost:4000/health
curl http://localhost:3000

# Metrics endpoint (optional)
curl http://localhost:4000/metrics
```

## Scaling

```bash
# Scale API workers (with load balancer)
docker-compose up -d --scale rversed-api=3

# Use Redis for session store (if needed)
# Configure sticky sessions on load balancer
```

## Backup & Recovery

```bash
# Backup database
docker-compose exec postgres pg_dump -U rversed rversed > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U rversed rversed
```

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set strong DATABASE_URL password
- [ ] Rotate JWT_SECRET regularly
- [ ] Enable 2FA for admin users
- [ ] Configure firewall rules
- [ ] Enable DDoS protection
- [ ] Set up PagerDuty alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated
