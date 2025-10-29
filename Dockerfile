# Use Bun's official Alpine-based image for smaller size
FROM oven/bun:1-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies (production only for smaller image)
RUN bun install --production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Set environment to production
ENV NODE_ENV=production

# Run the application
CMD ["bun", "run", "src/index.ts"]
