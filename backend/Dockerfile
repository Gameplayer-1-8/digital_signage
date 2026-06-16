FROM node:22-slim AS builder

RUN npm install -g pnpm
WORKDIR /app

# Kopiere Root-Dateien für den Workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Installiere Abhängigkeiten
RUN pnpm install --frozen-lockfile

# Kopiere den restlichen Code
COPY backend ./backend

# Baue das Backend
RUN cd backend && pnpm build

FROM node:22-slim AS runner

WORKDIR /app

# Kopiere nur den fertigen Build
COPY --from=builder /app/backend/.output ./.output

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", ".output/server/index.mjs"]
