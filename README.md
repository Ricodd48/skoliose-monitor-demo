# Skoliose-Monitor (Demo)

Klickbarer Prototyp: Verlauf des Cobb-Winkels über die Behandlung – als Arbeitsansicht für die Ärztin und als reduzierte Ansicht für das Elterngespräch.

**Nur fiktive Daten. Kein Medizinprodukt. Bitte keine echten Patientendaten eingeben.**

## Starten

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Tests der Fachlogik
npm run build    # statischer Build nach dist/
```

`dist/` ist rein statisch (kein Backend) und läuft auf Cloudflare Pages ebenso wie auf jedem internen Webserver, auch in einem Unterordner.

## Was die Demo kann

- Patientenübersicht mit fünf erfundenen Verläufen (rückläufig, stabil, zunehmend, doppelbogig, Erstvorstellung)
- Ärzteansicht: Kennzahlen, Verlaufsdiagramm, Untersuchungen erfassen / bearbeiten / löschen
- Diagramm-Optionen: Orientierungsbereiche, Messunsicherheit, individuelle Ziellinie, Zeitachse nach Datum oder Alter
- Elternansicht mit Erklärung in Alltagssprache, druckbar bzw. als PDF speicherbar
- „Demo zurücksetzen“ stellt die Beispieldaten wieder her

## Fachliche Annahmen (anpassbar in `src/domain/config.ts`)

- Messunsicherheit ±5°: Veränderungen darunter gelten als „stabil“
- Orientierungsbereiche (< 10° / 10–25° / 25–45° / > 45°) sind grobe Orientierung, keine Therapieempfehlung
- Aufnahmen im Korsett werden markiert und nicht in den Verlaufsvergleich einbezogen
- Jede Messung gehört zu genau einer Krümmung; verglichen wird nur innerhalb derselben Krümmung

Diese Werte sind Platzhalter und müssen vor einem echten Einsatz ärztlich festgelegt werden.

## Aufbau

- `src/domain/` – Typen, Trendlogik (getestet), Konfiguration
- `src/data/` – Beispieldaten und Speicherschnittstelle `PatientRepository`
- `src/components/`, `src/views/` – Oberfläche

## Vor einem Einsatz mit echten Daten

Die Demo speichert im `localStorage` des Browsers – das ist für Patientendaten nicht geeignet. Für einen Klinikbetrieb:

- eigene Implementierung von `PatientRepository` (interne Datenbank, Dienst oder KIS-Anbindung)
- Anmeldung, Rollen und Zugriffsprotokollierung
- Verschlüsselung, Backups, Löschkonzept, Freigabe durch IT und Datenschutz
- Prüfung, ob die Anwendung als Medizinprodukt einzustufen ist
