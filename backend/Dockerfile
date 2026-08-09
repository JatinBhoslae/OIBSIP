FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S pizzahub && \
    adduser -S pizzahub -u 1001

# Copy package files first for layer caching
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY src/ ./src/

# Switch to non-root user
USER pizzahub

EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5001/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/app.js"]
