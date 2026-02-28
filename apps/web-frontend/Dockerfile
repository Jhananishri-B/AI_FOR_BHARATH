# ── Stage 1: Build ADMIN frontend ────────────────────────────────────────────
FROM node:20-alpine AS admin-build
WORKDIR /app
# Copy from root context (build context is the repo root)
COPY apps/admin-frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY apps/admin-frontend .
RUN npm run build

# ── Stage 2: Build WEB frontend ──────────────────────────────────────────────
FROM node:20-alpine AS web-build
WORKDIR /app
COPY apps/web-frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY apps/web-frontend .
RUN npm run build

# ── Stage 3: Serve BOTH with nginx on port 80 ─────────────────────────────────
FROM nginx:alpine
# Web frontend served at /
COPY --from=web-build /app/dist /usr/share/nginx/html
# Admin frontend served at /admin
COPY --from=admin-build /app/dist /usr/share/nginx/admin
# Nginx config with /admin routing
COPY apps/web-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]