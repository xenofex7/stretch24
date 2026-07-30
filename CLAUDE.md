# Stretch24 – Projekt-Standards

Verbindliche Konventionen für alle Änderungen an diesem Repo (gelten für
Menschen und KI-Assistenten gleichermassen).

## Sprache & Texte

- **Schweizer Orthografie**: immer `ss` statt `ß` – in App-Texten, Kommentaren,
  README, Workflows und Commit-Messages.
- UI-Sprache ist Deutsch, freundlich und knapp. Du-Form.

## Git

- Commit-Messages auf **Englisch**, kurz und beschreibend (Imperativ),
  **ohne Attribution-Trailer** (kein `Co-Authored-By`, keine Session-Links).
- Commit-Identität: `Pascal Christen <pascal@nextara.ch>` (gilt auch für
  KI-Assistenten; Ausnahme: Workflow-Commits laufen als `github-actions[bot]`).
- Es wird direkt auf `main` gearbeitet – keine Feature-Branches.
  Jeder Push auf `main` deployt automatisch auf GitHub Pages.

## Code

- **Kein Framework, kein Build-Schritt, keine Laufzeit-Abhängigkeiten.**
  Reines HTML/CSS/Vanilla-JS; die App muss als statisches Hosting laufen.
- **Eingaben validieren**: Alles aus Nutzereingaben oder `localStorage`
  läuft durch die Validierungs-Helfer in `assets/app.js` (`esc`,
  `cleanName`, `clampSecs`, `loadCustomRoutines`, `loadStats`,
  `loadStreak`). Nutzerdaten niemals unescaped in `innerHTML`.
- **Cache-Disziplin**: Wenn sich App-Dateien oder Bilder ändern, muss die
  `CACHE`-Version in `sw.js` erhöht werden – sonst sehen Nutzer:innen
  ewig den alten Stand (Cache-first-Service-Worker).
- Icons kommen aus `assets/icons.js` (Lucide, inline), Übungsdaten und
  Illustrations-Zuordnung aus `assets/data.js`.

## Bilder

- Übungs-Illustrationen liegen in `assets/img/<übungs-id>.png`, 512 px,
  flacher Mint-Hintergrund, kein Glow/Verlauf. Generierung über den
  Workflow **Generate exercise images** (Prompts in
  `tools/generate-images.mjs`).
- Bei Links/Rechts-Übungen nur eine Richtung generieren – die App
  spiegelt per CSS.
