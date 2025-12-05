# Multi-stage Dockerfile for Next.js Frontend

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (no lockfile present)
RUN npm install

# Stage 2: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1

# Build application
RUN npm run build

# Stage 3: Development
FROM node:18-alpine AS development

WORKDIR /app

# Copy dependencies and source
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Expose port
EXPOSE 3000

ENV NODE_ENV=development

# Run development server with hot reload
CMD ["npm", "run", "dev"]

# Stage 4: Production Runner
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run application
CMD ["node", "server.js"]
