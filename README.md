# Tattoo Einverständnis · Consent App

Eine **installierbare Web-App (PWA)** für Tattoo-Studios, mit der Kund:innen direkt auf dem iPad
eine **EU-/DSGVO-orientierte Einverständniserklärung** ausfüllen und **unterschreiben**.
Alles läuft **offline** und wird **lokal auf dem Gerät** gespeichert.

> An installable PWA for tattoo studios: customers fill in and sign a GDPR-oriented consent form
> directly on the iPad. Works fully offline, data stays on the device.

---

## ⚖️ Rechtlicher Hinweis / Legal notice

Die enthaltenen Texte wurden sorgfältig nach den Grundsätzen der **DSGVO** aufgebaut, sind aber
**kein Rechtsrat**. Lass die Erklärung vor dem produktiven Einsatz von einer Rechtsanwältin/einem
Rechtsanwalt oder einer/einem Datenschutzbeauftragten prüfen und an die für dich geltenden
**nationalen Vorschriften** anpassen. Studio-/Verantwortlichendaten trägst du in den **Einstellungen**
ein — sie erscheinen in Erklärung und PDF.

---

## Funktionen

- **Geführter Ablauf** in 8 Schritten: Sprache → Person (inkl. 18+-Prüfung) → Gesundheit
  (Krankheiten, Medikamente, Allergien, Schwangerschaft …) → Tattoo-Details →
  **Aufklärung + ausdrückliche Einwilligung zur Körperverletzung** → **Ergänzungen** →
  **separate DSGVO-Einwilligung** → **Unterschrift** von Kund:in & Artist.
- **4 Sprachen:** Deutsch, English, Español, Português — umschaltbar inkl. aller Rechtstexte und im PDF.
- **Ergänzungsabschnitt:** wiederverwendbare Klausel-Vorlagen (in den Einstellungen pflegbar) plus
  ein freies Zusatzfeld je Kund:in.
- **Strukturierte, lokale Speicherung:** durchsuchbare Kundenliste in der App (IndexedDB),
  **PDF-Export pro Kund:in** in die Dateien-App (`JJJJ-MM-TT_Nachname_Vorname.pdf`) und
  **JSON-Voll-Backup** (Export/Import).
- **Offline-fähig** und als App auf dem Home-Bildschirm installierbar.
- Ansprechendes, touch-optimiertes Design.

## Datenschutz by design

Es gibt **keinen Server**. Alle Daten — einschließlich Gesundheitsdaten (besondere Kategorie nach
Art. 9 DSGVO) — bleiben ausschließlich im Browser-Speicher des Geräts. Backups erstellst du bewusst
selbst per Export.

---

## Entwicklung

```bash
npm install
npm run dev       # Dev-Server (http://localhost:5173/einverst-ndniss-erkl-rung-tattoo/)
npm run build     # Typecheck + Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
```

**Stack:** Vite · React · TypeScript · Tailwind CSS · vite-plugin-pwa (Workbox) · Dexie (IndexedDB) ·
signature_pad · pdf-lib · react-i18next.

## Deployment (GitHub Pages)

Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht die App automatisch.

1. In GitHub: **Settings → Pages → Build and deployment → Source: „GitHub Actions"**.
2. Auf `main` oder `claude/tattoo-consent-app-srnu76` pushen → der Workflow deployt.
3. Die App ist dann erreichbar unter
   `https://<user>.github.io/einverst-ndniss-erkl-rung-tattoo/`.

Für ein anderes Hosting (Root-Domain, Netlify, Vercel …) den Basis-Pfad setzen:
`VITE_BASE=/ npm run build`.

## Auf dem iPad installieren

1. Die veröffentlichte URL in **Safari** öffnen.
2. **Teilen → Zum Home-Bildschirm**.
3. Die App startet dann im Vollbild und funktioniert offline.

## Einstellungen ausfüllen (wichtig)

Unter **Einstellungen** hinterlegst du:

- Studio-/Künstlername, Anschrift, Kontakt, USt-IdNr./Registernummer, Logo → **Verantwortlicher** i. S. d. DSGVO.
- Standardsprache und Angabe zur **Speicherdauer** (erscheint in der Datenschutzerklärung).
- Deine **Ergänzungs-Vorlagen**.
- **Backup**-Export/-Import sowie „Alle Daten löschen".
