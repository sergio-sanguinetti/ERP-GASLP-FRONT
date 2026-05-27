# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para el build
ENV NEXT_PUBLIC_API_URL=https://api.prometeogp.com/api
ENV BACKEND_API_URL=http://express_api:3001/api
ENV NEXT_TELEMETRY_DISABLED=1

# Build icons primero (postinstall script)
RUN npx tsx src/assets/iconify-icons/bundle-icons-css.ts 2>/dev/null || touch src/assets/iconify-icons/generated-icons.css
# Build Next.js
RUN npm run build

# ---- Stage 3: Production ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copiar lo necesario del build standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
