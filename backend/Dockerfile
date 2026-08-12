FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache python3 make g++
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
CMD ["node", "dist/index.js"]
