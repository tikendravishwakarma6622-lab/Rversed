# rversed — minimal prototype

This is a minimal, runnable prototype of the `rversed` project (API + web client). It uses in-memory storage and provider stubs so you can run and test locally without external provider keys.

Quick start (PowerShell):

1) API
cd apps\api
npm install
npm run dev

2) Web
cd apps\web
npm install
npm run dev

Open http://localhost:3000 — API runs on http://localhost:4000

Notes:
- Payments are simulated (stubs) unless you wire real provider keys.
- A seeded test user is available: `dev@rversed.test` (verified).
- Persistence is memory-only in this prototype; restart will clear transactions.
