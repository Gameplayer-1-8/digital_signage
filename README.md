# Digital Signage System

Ein modernes System zur Verwaltung und Anzeige von Medieninhalten (Bilder, Videos) auf digitalen Bildschirmen und Android TVs. 

Dieses System besteht aus einer zentralen Server-Lösung (Backend + Admin-Frontend) und verschiedenen Clients, die Inhalte abrufen und im Vollbild darstellen.

## Architektur

Das Projekt basiert auf einer Monorepo-Struktur:

- **Backend** (`/backend`): Schnelles, leichtgewichtiges Backend, geschrieben in TypeScript mit **Nitro.js**, **Drizzle ORM** und WebSocket-Unterstützung für Echtzeit-Updates.
- **Frontend** (`/frontend`): Verwaltungsoberfläche (Admin Dashboard) und Web-Player. Gebaut mit **Vite, React, TailwindCSS**.
- **Android Client** (`/android-client`): Eine Android-Anwendung (Expo/React Native) im Kiosk-Modus für TV-Geräte, um die Signage-Inhalte zuverlässig im Vollbild und mit Auto-Start wiederzugeben.

## Voraussetzungen

- Node.js (v20+)
- pnpm (Paketmanager)
- Docker & Docker Compose (für die Datenbank)

## Schnellstart

### 1. Datenbank starten
Im Hauptverzeichnis des Projekts die Datenbankcontainer starten:
```bash
docker-compose up -d
```
Dies startet MariaDB (Port 3306) und phpMyAdmin (Port 8080).

### 2. Abhängigkeiten installieren
Im Hauptverzeichnis:
```bash
pnpm install
```

### 3. Entwicklungsserver starten
Öffne Terminals für Backend und Frontend:

**Backend:**
```bash
cd backend
pnpm dev
```

**Frontend:**
```bash
cd frontend
pnpm dev
```

### 4. Android APK kompilieren (Optional)
Für den Einsatz auf Android TVs kann eine Release-APK gebaut werden (dafür müssen entsprechende Android Build-Tools auf dem System installiert sein):
```bash
cd android-client
.\build-apk.ps1
```
Die fertig kompilierte Datei liegt danach unter `android\app\build\outputs\apk\release\app-release.apk`.

## Datenbank-Zugang (phpMyAdmin)
- **URL:** http://localhost:8080
- **Server:** mariadb
- **Benutzer:** signage_user (oder root)
- **Passwort:** signage_password (oder root)

## Produktion Deployment (Docker)

Für das finale Deployment auf einem Server existiert eine separate Docker-Compose Konfiguration, die das Backend und das Frontend (inkl. Nginx-Proxy) vollständig baut und bereitstellt. Eine Datenbank wird in diesem Setup extern vorausgesetzt.

```bash
# Baue und starte die Container im Hintergrund
DB_HOST=deine-db-ip DB_PASSWORD=dein-passwort docker-compose -f docker-compose.prod.yml up -d --build
```
Das Frontend ist dann auf Port 80 erreichbar. Die API und WebSockets werden automatisch vom Nginx an das Backend weitergeleitet.
