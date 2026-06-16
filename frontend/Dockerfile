FROM node:22-alpine3.19 AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Kopiere Root-Dateien für den Workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# Installiere Abhängigkeiten
RUN pnpm install --frozen-lockfile

# Kopiere den restlichen Code
COPY frontend ./frontend

# Setze die API Base URL auf leer, damit API-Requests relativ (/api/...) gemacht werden 
# und vom Nginx-Proxy abgefangen werden können.
ENV VITE_API_BASE_URL=""

# Baue das Frontend
RUN cd frontend && pnpm build

FROM nginx:alpine

# Eigene Nginx-Konfiguration kopieren
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Frontend-Build kopieren
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
