#!/usr/bin/env python3
"""Sucht Hamburger Betriebe ohne eingetragene Webseite (OpenStreetMap / Overpass).

Aufruf:  python3 leads/hamburg_leads.py            -> leads/hamburg_leads.csv
         python3 leads/hamburg_leads.py --limit 500

Nur Python-Standardbibliothek. Braucht Internetzugang zu overpass-api.de.
Hinweis: "keine Webseite in OSM" heißt nicht sicher "keine Webseite" -
vor dem Besuch kurz googeln.
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# Kategorie -> Overpass-Filter
CATEGORIES = {
    "Döner/Imbiss": '["amenity"~"^(fast_food|restaurant)$"]["cuisine"~"kebab|doner|turkish|falafel|lebanese|arab|syrian",i]',
    "Pizza": '["amenity"~"^(fast_food|restaurant)$"]["cuisine"~"pizza",i]',
    "Imbiss sonstige": '["amenity"="fast_food"][!"cuisine"]',
    "Umzug": '["office"="moving_company"]',
    "Umzug (Name)": '["name"~"umz(u|ü)g|entrümpel",i]["office"]',
    "Friseur/Barber": '["shop"="hairdresser"]',
    "Kiosk": '["shop"="kiosk"]',
    "Handwerker": '["craft"]',
}

QUERY = """[out:json][timeout:180];
area["name"="Hamburg"]["admin_level"="4"]->.hh;
({parts});
out center tags;"""


def build_query(flt):
    return QUERY.format(parts=f'nwr(area.hh){flt}["name"][!"website"][!"contact:website"][!"url"];')


def fetch(query):
    data = urllib.parse.urlencode({"data": query}).encode()
    last = None
    for url in ENDPOINTS * 3:
        try:
            req = urllib.request.Request(url, data=data, headers={"User-Agent": "hamburg-leads/1.0"})
            with urllib.request.urlopen(req, timeout=240) as r:
                return json.load(r)["elements"]
        except Exception as e:  # nächsten Server probieren
            last = e
            print(f"{url} fehlgeschlagen: {e}", file=sys.stderr)
            time.sleep(15)
    print(f"Übersprungen, kein Server erreichbar: {last}", file=sys.stderr)
    return []


def category(tags):
    for name, flt in CATEGORIES.items():
        # grobe Zuordnung über die Schlüsselwörter
        if name.startswith("Döner") and any(k in tags.get("cuisine", "").lower() for k in ("kebab", "doner", "turkish", "falafel", "lebanese", "arab", "syrian")):
            return name
        if name == "Pizza" and "pizza" in tags.get("cuisine", "").lower():
            return name
        if name.startswith("Umzug") and (tags.get("office") == "moving_company" or any(w in tags.get("name", "").lower() for w in ("umzug", "umzüg", "transport", "entrümpel"))):
            return "Umzug"
        if name == "Friseur/Barber" and tags.get("shop") == "hairdresser":
            return name
        if name == "Kiosk" and tags.get("shop") == "kiosk":
            return name
        if name == "Handwerker" and "craft" in tags:
            return f"Handwerk ({tags['craft']})"
    return "Imbiss"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=500)
    ap.add_argument("--out", default="leads/hamburg_leads.csv")
    args = ap.parse_args()

    rows, seen = [], set()
    elements = []
    for name, flt in CATEGORIES.items():
        cache = os.path.join(os.path.dirname(__file__), ".cache", name.replace("/", "_") + ".json")
        if os.path.exists(cache):
            found = json.load(open(cache, encoding="utf-8"))
        else:
            found = fetch(build_query(flt))
            if found:  # nur Erfolge merken, damit ein Neustart dort weitermacht
                os.makedirs(os.path.dirname(cache), exist_ok=True)
                json.dump(found, open(cache, "w", encoding="utf-8"))
        print(f"{name}: {len(found)}", file=sys.stderr)
        elements += found
    for el in elements:
        t = el.get("tags", {})
        key = (t.get("name", "").lower(), t.get("addr:street", ""), t.get("addr:housenumber", ""))
        if key in seen:
            continue
        seen.add(key)
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        rows.append({
            "kategorie": category(t),
            "name": t.get("name", ""),
            "strasse": f'{t.get("addr:street", "")} {t.get("addr:housenumber", "")}'.strip(),
            "plz": t.get("addr:postcode", ""),
            "stadtteil": t.get("addr:suburb", ""),
            "telefon": t.get("phone") or t.get("contact:phone", ""),
            "oeffnungszeiten": t.get("opening_hours", ""),
            "maps": f"https://www.google.com/maps/search/?api=1&query={lat},{lon}",
            "status": "",  # offen / besucht / Chef nicht da / Zusage / Absage
            "notiz": "",
        })

    # Mit Adresse zuerst, dann nach PLZ -> gut für Laufrouten
    rows.sort(key=lambda r: (r["strasse"] == "", r["plz"] or "99999", r["strasse"]))
    rows = rows[: args.limit]

    with open(args.out, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else ["name"], delimiter=";")
        w.writeheader()
        w.writerows(rows)
    print(f"{len(rows)} Betriebe -> {args.out}")


if __name__ == "__main__":
    main()
