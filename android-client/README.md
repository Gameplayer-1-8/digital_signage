# 📱 Android Client | Digital Signage System

Der Android Client ist eine spezialisierte Applikation für Android TVs und Displays, die im Kiosk-Modus läuft. Sie lädt die Inhalte vom Server und stellt diese zuverlässig im Vollbild dar.

## 🛠 Technologien

- **Framework:** [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/)
- **WebView:** React Native WebView (zur Darstellung des Web-Players)
- **Netzwerk:** React Native UDP (für Netzwerk-Erkennung)
- **Speicher:** Async Storage

## 🚀 Entwicklung

### Voraussetzungen
Um den Android Client lokal zu entwickeln, benötigst du **Android Studio** und die entsprechenden **Android Build-Tools**. Stelle zudem sicher, dass die Pakete installiert sind (`pnpm install` im Root-Verzeichnis).

### Befehle

Im `android-client`-Verzeichnis stehen folgende Befehle zur Verfügung:

| Befehl | Beschreibung |
| :--- | :--- |
| `pnpm start` | Startet den Expo-Metro-Bundler. |
| `pnpm android` | Startet die App auf einem verbundenen Android-Gerät oder Emulator. |
| `pnpm ios` | Startet die App auf einem iOS-Simulator (falls unterstützt). |
| `pnpm web` | Startet die App im Web-Browser. |

### 📦 APK erstellen (Release)

Für die Installation auf Android-Geräten wie TVs kann eine Release-APK generiert werden. Führe dazu das bereitgestellte PowerShell-Skript aus:

```bash
.\build-apk.ps1
```
*(Die Ausführung erfordert installierte Android Build-Tools in deinen System-Umgebungsvariablen).*

Die kompilierte APK-Datei findest du anschließend unter:
`android\app\build\outputs\apk\release\app-release.apk`

Weitere Informationen zur Gesamtarchitektur findest du im [Root README](../README.md).
