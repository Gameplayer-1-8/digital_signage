# Projektplan: Digital Signage System

## 1. Architekturübersicht

Das Digital Signage System besteht aus einer zentralen Server-Anwendung (Backend + Frontend) und verschiedenen Clients (Web-Browser oder Android TV App), die die Inhalte im Vollbildmodus abrufen und darstellen.

### 1.1 Technologie-Stack
*   **Backend (API & Server):** [Nitro.js](https://nitro.unjs.io/) (leichtgewichtig, schnell, ideal für API-Entwicklung).
*   **Datenbank:** MariaDB (für persistente Speicherung von Medien-Metadaten, Playlists, Gerätekonfigurationen).
*   **Frontend (Admin Dashboard & Web-Client):** Vite + React + React Router + TailwindCSS + Radix UI.
*   **Android Client:** Eine Android App (Kotlin/Java oder React Native WebView), optimiert für Android TV (Kiosk-Modus, Auto-Start).

---

## 2. Komponenten-Details

### 2.1 Backend (Nitro.js + MariaDB)
Das Backend dient als zentrale Datenquelle und verwaltet die Logik.

*   **Aufgaben:**
    *   Bereitstellung einer REST API (oder GraphQL/RPC) für das Frontend und die Clients.
    *   Verwaltung von Geräten (Clients), Medien (Bilder, Videos, Webseiten) und Playlists (Werbekampagnen, Zeitpläne).
    *   Medien-Upload und Speicherung (lokal im Dateisystem oder via S3-kompatiblem Storage).
    *   Authentifizierung und Autorisierung (z.B. JWT) für das Admin Dashboard.
    *   *Optional aber empfohlen:* Echtzeit-Kommunikation via WebSockets oder Server-Sent Events (SSE), um Clients sofort zu aktualisieren, wenn sich eine Playlist ändert.
*   **ORM:** Einsatz eines ORMs wie Prisma oder Drizzle ORM zur einfachen und typsicheren Kommunikation mit der MariaDB.

### 2.2 Frontend (Vite + React)
Das Frontend erfüllt zwei völlig unterschiedliche Zwecke und wird über das Routing (`react-router`) getrennt:

*   **Routen-Struktur:**
    *   `/admin/*` -> Admin Dashboard
    *   `/display/:deviceId` -> Digital Signage Web-Client

#### 2.2.1 Admin Dashboard (`/admin`)
*   **Zweck:** Verwaltungsoberfläche für Administratoren.
*   **UI/UX:** Modernes und responsives Design mit TailwindCSS und zugänglichen Komponenten von Radix UI.
*   **Funktionen:**
    *   Login-Screen.
    *   **Dashboard-Übersicht:** Status aller verbundenen Bildschirme (Online/Offline).
    *   **Medien-Bibliothek:** Hochladen, Löschen und Verwalten von Werbebildern/-videos.
    *   **Playlist-Management:** Erstellen von Abläufen (z.B. Bild A für 10s, Video B für 30s) und Zuweisung zu bestimmten Geräten oder Gerätegruppen.
    *   **Zeitplanung:** Festlegen, wann welche Werbung auf welchen Bildschirmen laufen soll.

#### 2.2.2 Web-Client (`/display/:deviceId`)
*   **Zweck:** Die eigentliche Vollbild-Anzeige der Werbung.
*   **Funktionen:**
    *   Versteckt alle UI-Elemente (kein Menü, keine Scrollbars).
    *   Fragt das Backend nach der aktuellen Playlist für seine `deviceId`.
    *   Wechselt die Medien nahtlos in einer Endlosschleife.
    *   Lädt Inhalte im Hintergrund vor (Preloading), um schwarze Bildschirme zwischen den Wechseln zu vermeiden.
    *   Automatischer Reload/Reconnect bei Verbindungsabbruch.

### 2.3 Android Client (Android TV App)
Die Android-App dient als robuster "Wrapper" um den Web-Client, um die Hardware besser kontrollieren zu können.

*   **Zweck:** Zuverlässige Anzeige auf Android TVs ohne Nutzerinteraktion.
*   **Funktionen:**
    *   **WebView:** Lädt die URL `http://<server-ip>/display/<deviceId>` im Vollbild.
    *   **Kiosk-Modus (Immersive Mode):** Versteckt die Android-Statusleiste und Navigationsleiste permanent.
    *   **Boot-to-App (Auto-Start):** Die App startet automatisch, sobald der Fernseher eingeschaltet wird (`RECEIVE_BOOT_COMPLETED` Intent).
    *   **Wake Lock:** Verhindert, dass der Fernseher in den Standby-Modus wechselt (`FLAG_KEEP_SCREEN_ON`).
    *   **Konfiguration:** Ein simpler, versteckter Einstellungsbildschirm beim ersten Start, um die Server-IP und die Device-ID einzugeben und lokal abzuspeichern.

---

## 3. Datenbank-Schema (Entwurf für MariaDB)

*   **`users`**: Für Admin-Logins (id, username, password_hash, role).
*   **`devices`**: Registrierte Bildschirme (id, name, location, last_ping, is_online).
*   **`media`**: Hochgeladene Dateien (id, filename, filepath, type [image, video], duration_default).
*   **`playlists`**: Gruppierung von Medien (id, name, description).
*   **`playlist_items`**: Mapping-Tabelle (id, playlist_id, media_id, order_index, duration_seconds).
*   **`schedules`**: Wann was läuft (id, device_id, playlist_id, start_time, end_time).

---

## 4. Vorgeschlagene Projektstruktur (Monorepo)

```text
digital-signage/
├── backend/                  # Nitro.js Server
│   ├── routes/               # API Endpunkte
│   ├── database/             # MariaDB Connection & ORM Schema
│   ├── public/               # Uploads (Bilder/Videos)
│   └── nitro.config.ts
├── frontend/                 # Vite + React App
│   ├── src/
│   │   ├── components/       # Radix UI + Tailwind Komponenten
│   │   ├── pages/
│   │   │   ├── admin/        # Admin Views
│   │   │   └── display/      # Signage Player View
│   │   ├── hooks/            # API & Websocket Hooks
│   │   └── App.tsx
│   ├── tailwind.config.js
│   └── vite.config.ts
└── android-client/           # Android Studio Projekt (Kotlin/Java)
    └── app/src/main/...
```

---

## 5. Implementierungs-Schritte

1.  **Setup & Infrastruktur:**
    *   Git-Repository initialisieren.
    *   Ordnerstruktur für Backend und Frontend anlegen.
    *   MariaDB-Datenbank lokal (z.B. via Docker) aufsetzen.
2.  **Backend Basis:**
    *   Nitro.js initialisieren.
    *   Datenbank-Schema mit ORM erstellen und migrieren.
    *   Einfache CRUD-API für Medien und Geräte schreiben.
3.  **Frontend Basis & Admin Dashboard:**
    *   Vite + React Projekt aufsetzen.
    *   TailwindCSS und Radix UI installieren.
    *   React Router einrichten.
    *   Admin-Interface zur Medien- und Geräteverwaltung bauen.
4.  **Der Player (Web-Client):**
    *   Die Player-Route implementieren, die eine Playlist abspielt.
    *   Vollbild-Logik und sanfte Übergänge zwischen Medien implementieren.
5.  **Echtzeit-Synchronisation (Optional aber wichtig):**
    *   Server-Sent Events oder WebSockets hinzufügen, damit Player Änderungen vom Admin-Dashboard sofort übernehmen.
6.  **Android App:**
    *   Android Studio Projekt anlegen.
    *   WebView und Kiosk-Modus-Einstellungen implementieren.
    *   Boot-Receiver für Autostart hinzufügen.
