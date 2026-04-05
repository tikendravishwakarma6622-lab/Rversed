FROM node:24-alpine AS base
WORKDIR /app

# ── Build stage ──
FROM base AS build
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
RUN npm install

COPY . .
RUN cd apps/web && npm run build

# ── Production stage ──
FROM base AS production
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/node_modules ./node_modules

# Serve both API and static files from one process
EXPOSE 4000

CMD ["node", "apps/api/src/index.js"]
