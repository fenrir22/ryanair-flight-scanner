# Multi-stage build per Ryanair Flight Scanner
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage finale con nginx
FROM nginx:alpine
# Copia il frontend buildato
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
# Copia la configurazione nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
# Copia il backend
COPY --from=backend-builder /app/backend /app/backend
WORKDIR /app/backend
RUN npm ci --only=production
EXPOSE 80
CMD ["sh", "-c", "node dist/index.js & nginx -g 'daemon off;'"]
