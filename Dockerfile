# Multi-Stage Dockerfile for Sleeper Draft Assistant

# --- Stage 1: Build Frontend Assets ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy application source code
COPY . .

# Build Vite frontend assets (outputs to /app/dist)
RUN npm run build

# --- Stage 2: Production Server ---
FROM node:20-alpine AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3001

# Copy dependency manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled frontend build, server, rankings CSV, and config from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/rankings.csv ./rankings.csv
COPY --from=builder /app/src/config ./src/config

# Expose port 3001
EXPOSE 3001

# Start Express server (serves both API and static frontend)
CMD ["node", "server.js"]
