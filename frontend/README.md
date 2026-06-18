# 🖥️ Frontend | Digital Signage System

Das Frontend beinhaltet das Admin-Dashboard zur Inhaltsverwaltung sowie den Web-Player für die Anzeige auf digitalen Bildschirmen.

## 🛠 Technologien

- **Framework:** [React](https://react.dev/)
- **Build-Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [TailwindCSS](https://tailwindcss.com/)
- **Routing:** React Router DOM
- **Icons:** Lucide React

## 🚀 Entwicklung

### Voraussetzungen
Stelle sicher, dass die Abhängigkeiten im Root-Verzeichnis mit `pnpm install` installiert wurden.

### Befehle

Im `frontend`-Verzeichnis stehen folgende Befehle zur Verfügung:

| Befehl | Beschreibung |
| :--- | :--- |
| `pnpm dev` | Startet den Vite-Entwicklungsserver mit Hot-Module-Replacement (`vite --host`). |
| `pnpm build` | Prüft die Typen (`tsc -b`) und baut die produktionsbereite App (`vite build`). |
| `pnpm lint` | Führt ESLint aus, um Code-Probleme zu finden. |
| `pnpm preview` | Startet einen lokalen Webserver, um den Produktions-Build zu testen. |

### Projektstruktur

Die Struktur des Frontends ist darauf ausgelegt, sowohl die Verwaltungsoberfläche als auch den Web-Player in einer einzigen Applikation zu bündeln, die je nach Route die entsprechenden Komponenten lädt.

Weitere Informationen zur Gesamtarchitektur findest du im [Root README](../README.md).
