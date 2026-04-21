# --- STAGE 1: Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Force NODE_ENV to development to ensure devDependencies (like tsc) are installed
ENV NODE_ENV=development

# Install ALL dependencies
RUN npm ci --legacy-peer-deps

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
RUN npm ci --legacy-peer-deps --omit=dev

# Copy compiled code and assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
# Copy config files if any were not in dist (just in case they were modified)
COPY --from=builder /app/config ./config
COPY --from=builder /app/scripts ./scripts

# The app listens on PORT env var (fallback 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
