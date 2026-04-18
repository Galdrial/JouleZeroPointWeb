# --- STAGE 1: Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install ALL dependencies (including devDependencies like tsc)
RUN npm ci

# Copy the source code and configuration
COPY . .

# Build the project (TypeScript -> JavaScript)
RUN npm run build

# --- STAGE 2: Run Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled code and assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
# Copy config files if any were not in dist (just in case they were modified)
COPY --from=builder /app/config ./config

# The app listens on PORT env var (fallback 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
