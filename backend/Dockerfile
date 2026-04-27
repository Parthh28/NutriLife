# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

# Copy package files and install ALL deps (including devDeps for tsc)
COPY package*.json ./
COPY prisma ./prisma/

# Set dummy DATABASE_URL so prisma generate doesn't fail at build time
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
ENV DIRECT_URL="postgresql://user:password@localhost:5432/db"

RUN npm ci

# Generate Prisma client (uses schema only, not a live DB)
RUN npx prisma generate

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

WORKDIR /app

# Install openssl for Prisma runtime on Alpine
RUN apk add --no-cache openssl

# Copy package files and install ONLY production deps
COPY package*.json ./
COPY prisma ./prisma/

# Set dummy DATABASE_URL for prisma generate step only
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
ENV DIRECT_URL="postgresql://user:password@localhost:5432/db"

RUN npm ci --omit=dev

# Generate Prisma client for production image
RUN npx prisma generate

# Unset dummy env vars - real ones will be injected by Cloud Run
ENV DATABASE_URL=""
ENV DIRECT_URL=""

# Copy compiled JS output from builder stage
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT=8080
ENV PORT=8080
EXPOSE 8080

# Run as non-root for security
USER node

CMD ["node", "dist/server.js"]
