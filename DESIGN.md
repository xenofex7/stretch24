# Stretch24 - Design-System

Alle Design-Entscheide leben als CSS-Custom-Properties in
`assets/style.css` (`:root`). Dieses Dokument erklärt, was es gibt und wann
man was nimmt. Regel: **kein neuer Wert ohne Token.** Wer einen Abstand,
eine Schriftgrösse oder einen Radius braucht, nimmt die nächstliegende
Stufe, statt einen Zwischenwert zu erfinden.

Sprache: Deutsch, konsistent mit `CLAUDE.md` und den Code-Kommentaren
(das README ist Englisch, weil es das öffentliche Aushängeschild ist).

## Farben

| Token | Light | Dark | Verwendung |
| --- | --- | --- | --- |
| `--accent` | `#10b981` | `#34d399` | Primärflächen, aktive Zustände |
| `--accent-soft` | `#10b98122` | `#34d39922` | Hinterlegte Pillen und Icon-Flächen |
| `--accent-strong` | `#047857` | `#6ee7b7` | Akzent-Text, Fokus-Ring, Fortschritt |
| `--accent-ink` | `#05281c` | `#05281c` | Text **auf** Akzentflächen |
| `--danger` | `#e11d48` | `#fb7185` | Löschen-Aktionen |
| `--bg` | `#f6faf8` | `#0d1614` | Seitenhintergrund |
| `--surface` | `#ffffff` | `#16211d` | Karten, Dialoge, Felder |
| `--text` | `#17332a` | `#e5f2ec` | Fliesstext |
| `--muted` | `#566e64` | `#8aa79b` | Sekundärtext |
| `--border` | `#dcebe4` | `#223730` | Trennlinien, Kartenrand |
| `--border-strong` | `#6f8d80` | `#8aa79b` | Formularfeld-Rahmen (mind. 3:1) |

Kontrast-Regeln, die nicht verhandelbar sind:

- Text auf Akzentflächen ist **immer** `--accent-ink`, nie `#fff`. Weiss
  auf Grün erreicht in keinem der beiden Themes AA.
- Bedienelement-Rahmen und Fortschrittsanzeigen brauchen 3:1 gegen ihre
  Fläche, deshalb `--border-strong` bzw. `--accent-strong`.
- Neue Farbwerte kommen als Token dazu, inklusive Dark-Variante. Direkte
  Hex-Werte in Regeln sind ein Fehler (Ausnahme: der Dialog-Backdrop, der
  in beiden Themes gleich dunkel sein soll).

Das Dark-Theme hängt an `prefers-color-scheme`, es gibt bewusst keinen
manuellen Umschalter. `color-scheme: light dark` sorgt dafür, dass auch
Scrollbars und Formular-Chrome mitziehen.

## Abstände

4-px-Raster. Die Zahl im Namen ist der Faktor: `--space-3` = 3 × 4 px = 12 px.

| Token | Wert | Typisch für |
| --- | --- | --- |
| `--space-1` | 4 px | Pillen-Innenabstand, Mikro-Abstände |
| `--space-2` | 8 px | Icon-zu-Text, kleine Innenabstände |
| `--space-3` | 12 px | Raster-Gaps, Feld-Innenabstand |
| `--space-4` | 16 px | Standard-Abstand zwischen Elementen |
| `--space-5` | 20 px | Seiten-Innenabstand (Sections, Builder) |
| `--space-6` | 24 px | Dialog-Innenabstand, grössere Blöcke |
| `--space-8` | 32 px | Sektions-Abstand |
| `--space-12` | 48 px | Hero oben, Footer unten |

## Typografie

Ein Font-Stack (`system-ui`), keine Webfonts. Zeilenhöhe 1.55 im Fliesstext,
1.2 in Überschriften.

| Token | Wert | Verwendung |
| --- | --- | --- |
| `--text-xs` | 0.8 rem | Pillen, Kategorien, Zähler |
| `--text-sm` | 0.875 rem | Sekundärtext, Karten-Beschreibung, Footer |
| `--text-base` | 1 rem | Fliesstext (Body-Default) |
| `--text-md` | 1.125 rem | Kartentitel, Tagline |
| `--text-lg` | 1.375 rem | Sektions- und Dialog-Überschriften |
| `--text-xl` | 1.5 rem | Player-Titel, Countdown |
| `--text-2xl` | 2 rem | Abschluss-Screen |
| `--text-hero` | `clamp(2rem, 6vw, 3rem)` | Nur der Hero-Titel |

Kleiner als `--text-xs` wird nichts gesetzt. Wenn etwas kleiner wirken
soll, ist es meist eine Frage von Farbe (`--muted`) oder Gewicht.

## Radien

| Token | Wert | Verwendung |
| --- | --- | --- |
| `--radius-xs` | 4 px | Fortschrittssegmente |
| `--radius-sm` | 8 px | Kleine Icon-Buttons |
| `--radius-md` | 12 px | Buttons, Eingabefelder, Skip-Link |
| `--radius-lg` | 18 px | Karten, Dialoge |
| `--radius-pill` | 999 px | Pillen und Badges |

`border-radius: 50%` bleibt als Literal stehen, wo ein echter Kreis
gemeint ist (runde Buttons, Illustrations-Zuschnitt): das ist eine
Form-Aussage, keine Stilstufe.

## Layout

- `--width-content` (900 px) ist die Lesebreite für Hero, Sections,
  Builder und Footer.
- Der Player ist bewusst schmaler (480 px), damit die Illustration im
  Blickzentrum bleibt.
- Volle Höhe immer über `100dvh`, plus `env(safe-area-inset-bottom)` bei
  allem, was am unteren Bildschirmrand klebt.

## Grössen von Icons und Illustrationen

Diese Werte sind absichtlich **nicht** tokenisiert, sie gehören zur
jeweiligen Komponente:

- `.icon` ist mit `1.25em` an die Textgrösse gekoppelt und skaliert
  automatisch mit. Nur wo ein Icon unabhängig vom Text eine feste Grösse
  braucht (runde Buttons, Routinen-Icon, Abschluss-Icon), wird in `rem`
  überschrieben.
- Illustrationen: 82 px im Raster (256er-Thumb), 110 px im Dialog,
  bis 300 px im Player (jeweils 512er-Bild).
- Alles, was angetippt wird, ist mindestens 44 × 44 px (`2.75rem`).

## Bewegung

- Übergänge sind kurz (0.1 - 0.15 s) und beschränken sich auf `transform`
  und Farben.
- Die Atem-Animation im Player läuft 4 s pro Zyklus und pausiert, sobald
  der Player pausiert.
- `prefers-reduced-motion: reduce` schaltet **alle** Animationen und
  Transitions ab, inklusive Pseudoelemente.

## Fokus

Ein einziger Fokus-Stil für die ganze App: `3px solid var(--accent-strong)`
mit 2 px Abstand, gesetzt über `:focus-visible`. Hover-Effekte dürfen den
Fokus nie ersetzen, sie sind zusätzlich.
