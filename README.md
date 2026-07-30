# Stretch24 🧘

**Dehnen für alle. Gratis, offen, ohne Schnickschnack.**

Stretch24 ist eine freie Web-App mit 24 geführten Dehnübungen – inspiriert von
Apps wie stretch15.com, aber komplett kostenlos, ohne Account, ohne Werbung und
ohne Datensammlung. Alles läuft direkt im Browser.

## Features

- 🧘 **24 Übungen** mit Anleitung und schlichten SVG-Illustrationen – von Nacken
  bis Wade, sortiert nach Körperregion
- ▶️ **Geführter Player** mit Countdown-Ring, automatischem Seitenwechsel
  (links/rechts), Sprachansagen und Signaltönen
- 📋 **6 fertige Routinen**: Guten Morgen, Schreibtisch-Pause, Full Body 15,
  Rücken-Reset, Hüft-Öffner, Nach dem Sport
- ⭐ **Eigene Routinen** zusammenstellen (Übungen + Sekunden pro Übung)
- 🔥 **Streak & Statistik** – bleibt komplett auf deinem Gerät (localStorage)
- 📱 **PWA**: installierbar und offline nutzbar, Bildschirm bleibt während der
  Session an (Wake Lock)
- 🌙 Automatischer Dark Mode, responsive, barrierearm, `prefers-reduced-motion`
  wird respektiert

## Technik

Bewusst simpel gehalten:

- Reines HTML, CSS und Vanilla-JavaScript – **kein Framework, kein Build-Schritt,
  keine Abhängigkeiten**
- Keine Server-Komponente: statisches Hosting genügt (GitHub Pages, Netlify,
  eigener Webspace, …)
- Service Worker für Offline-Betrieb

## Lokal ausprobieren

```bash
# beliebiger statischer Server, z. B.:
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

(Direktes Öffnen von `index.html` per Doppelklick funktioniert auch – nur der
Service Worker bleibt dann inaktiv.)

## Deployment auf GitHub Pages

Repo-Einstellungen → *Pages* → Branch auswählen → fertig. Es wird nichts
gebaut, der Repo-Inhalt ist die App.

## Illustrationen generieren (optional)

Die Übungs-Illustrationen liegen in `assets/img/` (eine PNG pro Übungs-ID,
transparenter Hintergrund). Übungen ohne Bild zeigen automatisch eine
SVG-Strichfigur als Fallback.

Zum Generieren per OpenAI-API (`gpt-image-1`) gibt es
[`tools/generate-images.mjs`](tools/generate-images.mjs) und den
GitHub-Actions-Workflow **„Generate exercise images"** (manuell startbar
unter *Actions*). Voraussetzung: Repo-Secret `OPENAI_API_KEY`
(*Settings → Secrets and variables → Actions*). Der Workflow generiert nur
fehlende Bilder, committet sie und stösst das Pages-Deployment an.
Optional sorgt eine Stil-Referenz unter `assets/img/_reference.png` für
konsistente Figuren über alle Bilder.

## Mitmachen

Neue Übungen, bessere Illustrationen, Übersetzungen – Pull Requests sind
willkommen! Übungen liegen als einfache Datenobjekte in
[`assets/data.js`](assets/data.js).

## Hinweis

Stretch24 ist kein Ersatz für medizinischen Rat. Dehne nur bis zu einem
angenehmen Zug, nie in den Schmerz.

## Lizenz

[MIT](LICENSE) – nutze, kopiere und verändere die App, wie du magst.

UI-Icons: [Lucide](https://lucide.dev) (ISC-Lizenz), als Inline-SVG eingebettet.
