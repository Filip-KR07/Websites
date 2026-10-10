# Prompt: Lead-Liste Hamburg (Webseiten-Verkauf)

Alles unterhalb der Linie in einen neuen Chat kopieren. Der Chat braucht Websuche.
Am Ende die Zeile `BATCH:` anpassen, z. B. `BATCH: Zahnärzte, Wandsbek`.

---

Du bist mein Research-Assistent für Kaltakquise. Ich verkaufe Webseiten an Unternehmen in Hamburg.
Erstelle mir eine Lead-Liste, die ich direkt in Google Sheets einfügen kann.

## Ziel
Hamburger Unternehmen, die (a) Geld haben und (b) eine schlechte, veraltete oder gar keine Webseite haben.
Lieber 25 starke Leads als 100 schwache.

## Pflicht-Kriterien (alle müssen erfüllt sein)
1. Sitz oder Hauptstandort in Hamburg (Bezirke: Hamburg-Mitte, Altona, Eimsbüttel, Hamburg-Nord, Wandsbek, Bergedorf, Harburg).
2. Mindestens 5 Mitarbeiter. Belege dafür: Teamseite, Stellenanzeigen, Northdata, LinkedIn, Anzahl Behandler/Monteure/Fahrzeuge.
3. Zahlungskräftig. Mindestens zwei dieser Signale:
   - Rechtsform GmbH, GmbH & Co. KG, AG oder Partnerschaft (keine Einzelkämpfer, keine UG mit 1 Person)
   - Umsatz oder Bilanzsumme laut Northdata / Bundesanzeiger / Unternehmensregister
   - Mehr als ein Standort, eigene Fahrzeugflotte, eigene Gewerbeimmobilie
   - Aktuell offene Stellen (wer einstellt, hat Geld und braucht eine gute Seite fürs Recruiting)
   - Mindestens 50 Google-Bewertungen
   - Seit mindestens 5 Jahren am Markt
4. Die Webseite ist verbesserungswürdig. Mindestens eins davon:
   - keine Webseite, nur Facebook/Instagram oder nur Google-Eintrag
   - nicht mobil-tauglich, kein HTTPS, Copyright-Jahr 2020 oder älter
   - Standard-Baukasten-Optik (Jimdo, Wix, alte WordPress-Themes), langsam, kaputte Links oder Bilder
   - kein Online-Termin bzw. keine Online-Anfrage, obwohl die Branche das braucht
   - keine Karriereseite, obwohl Stellen offen sind

## Ausschließen
- Konzerne, Ketten, Franchise-Filialen (haben eigene Marketingabteilung)
- Firmen mit bereits moderner, guter Webseite
- Firmen in Insolvenz oder Liquidation (auf insolvenzbekanntmachungen.de bzw. Northdata prüfen)
- Doppelte Einträge

## Gute Branchen (hohe Marge, brauchen Vertrauen online)
Zahnärzte und Kieferorthopäden, Physiotherapie-Praxen mit mehreren Therapeuten, Steuerberater, Anwaltskanzleien,
Immobilienmakler und Hausverwaltungen, Handwerk (SHK, Elektro, Dachdecker, Maler, Tischler, Fensterbau),
Autohäuser und Kfz-Werkstätten, Umzugsunternehmen, Gebäudereinigung, Architekten und Ingenieurbüros,
Restaurants und Cafés mit mehreren Standorten, Hotels und Pensionen, Fitnessstudios, Kosmetik- und Ästhetik-Praxen.

## Ansprechpartner und Telefonnummer
- Name des Geschäftsführers bzw. Inhabers aus Impressum, Handelsregister oder Northdata.
- Telefonnummer: nur öffentlich veröffentlichte Geschäftsnummern (Impressum, Webseite, Google-Unternehmensprofil, Branchenbuch).
  Wenn im Impressum eine Durchwahl oder Mobilnummer des Geschäftsführers steht, nimm die. Sonst die Zentrale.
- Keine privaten Nummern, nichts aus Leaks oder Personensuchmaschinen.
- **Niemals Nummern, Namen oder Zahlen erfinden oder raten.** Was du nicht findest, bleibt leer oder bekommt "?".
  Lieber eine Lücke als eine falsche Nummer.
- In der Spalte "Telefon-Typ" angeben, was es ist: `GF direkt`, `GF mobil (Impressum)` oder `Zentrale`.

## Aufhänger
Für jeden Lead ein konkreter Grund, warum ich anrufe, bezogen auf genau diese Firma
(z. B. "Seite auf dem Handy nicht nutzbar, 3 offene Azubi-Stellen ohne Karriereseite").
Das ist wichtig: Kaltakquise bei Firmen ist nach § 7 UWG nur zulässig, wenn ein mutmaßliches Interesse
nachvollziehbar ist. Der Aufhänger muss das belegen.

## Lead-Score
- **A**: viel Geld + sehr schlechte oder keine Webseite + GF-Direktnummer gefunden
- **B**: zwei von drei
- **C**: Rest (nur aufnehmen, wenn die Liste sonst zu kurz ist)

Sortiere die Liste nach Score (A zuerst).

## Ausgabeformat
Gib die Liste als **CSV in einem einzigen Codeblock** aus:
- Trennzeichen Komma, jedes Feld in doppelten Anführungszeichen, erste Zeile = Spaltenköpfe.
- Telefonnummern im Format `'+49 40 1234567` (mit Apostroph vorne, damit Sheets keine Zahl daraus macht).
- Keine Erklärungen innerhalb des Codeblocks.

Spalten genau in dieser Reihenfolge:

```
"Score","Firma","Rechtsform","Branche","Bezirk","Adresse","Webseite","Webseiten-Note (1-5)","Webseiten-Probleme","Mitarbeiter (ca.)","Umsatz / Geld-Signal","Google-Bewertungen","Geschäftsführer","Telefon","Telefon-Typ","E-Mail","Aufhänger","Quellen","Geprüft am"
```

- "Webseiten-Note": 1 = top, 5 = katastrophal bzw. keine Seite.
- "Quellen": die URLs, wo du Mitarbeiter, Umsatz und Telefonnummer gefunden hast.
- "Geprüft am": heutiges Datum.

Nach dem Codeblock, außerhalb davon, kurz:
1. Wie viele Firmen du geprüft und wie viele du aussortiert hast (mit Hauptgründen).
2. Welche Werte unsicher sind.
3. Drei Vorschläge für den nächsten Batch (Branche + Bezirk).

## Vorgehen
"Ganz Hamburg" geht nicht in einem Durchlauf. Arbeite in Batches: eine Branche in einem oder zwei Bezirken,
Ziel 25 geprüfte Leads pro Batch. Prüfe jede Firma einzeln per Websuche (Webseite öffnen, Impressum lesen,
Northdata/Handelsregister checken). Wenn ich "weiter" schreibe, machst du den nächsten Batch und
wiederholst keine Firma aus früheren Batches.

BATCH: Handwerk (SHK und Elektro), Wandsbek und Hamburg-Nord
