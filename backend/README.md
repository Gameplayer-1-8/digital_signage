# ⚙️ Backend | Digital Signage System

Das Backend des Digital Signage Systems ist eine performante und leichtgewichtige API, die für die Verwaltung von Inhalten und die Echtzeit-Kommunikation mit den Clients zuständig ist.

## 🛠 Technologien

- **Framework:** [Nitro.js](https://nitro.unjs.io/)
- **Datenbank-ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Datenbank:** MySQL / MariaDB
- **Echtzeit:** WebSockets

## 🚀 Entwicklung

### Voraussetzungen
Stelle sicher, dass die Abhängigkeiten im Root-Verzeichnis mit `pnpm install` installiert wurden und die Datenbank via Docker läuft.

### Befehle

Im `backend`-Verzeichnis stehen folgende Befehle zur Verfügung:

| Befehl | Beschreibung |
| :--- | :--- |
| `pnpm dev` | Startet den Entwicklungsserver mit Hot-Reloading (`nitro dev --host`). |
| `pnpm build` | Kompiliert das Backend für die Produktion. |
| `pnpm preview` | Startet den kompilierten Produktionsserver lokal. |
| `pnpm db:push` | Synchronisiert das Drizzle-Schema mit der Datenbank (MariaDB/MySQL). |

### Datenbank-Schema aktualisieren
Wenn du Änderungen am Datenbank-Schema vornimmst, führe folgenden Befehl aus, um die Datenbank zu aktualisieren:
```bash
pnpm db:push
```

Weitere Informationen zur Gesamtarchitektur findest du im [Root README](../README.md).
