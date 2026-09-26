# Hamburg-Leads: Betriebe ohne Webseite

```
python3 leads/hamburg_leads.py --limit 500
```

Erzeugt `leads/hamburg_leads.csv` (Semikolon, öffnet direkt in Excel) mit Kategorie,
Name, Adresse, PLZ, Telefon, Öffnungszeiten, Google-Maps-Link und leeren Spalten
`status`/`notiz` fürs Abhaken. Sortiert nach PLZ, damit du Straßenzüge ablaufen kannst.

Quelle: OpenStreetMap. Fehlender Webseiten-Eintrag in OSM ist nur ein Indiz –
vor dem Besuch kurz googeln. Kategorien in `CATEGORIES` im Skript anpassen.
