# Security-Konzept für Websites und Web-Apps

Ein Konzept für alle Projekte – von der statischen Visitenkarte bis zum Shop mit Zahlungen.
Es ist so geschrieben, dass du den Ordner `security/` in jedes neue Projekt kopieren kannst.

**Inhalt**

1. Grundsätze
2. Schutzstufen: Welche Stufe hat mein Projekt?
3. Maßnahmen je Stufe
4. Bausteine im Detail
5. Vor dem Go-live
6. Laufender Betrieb
7. Notfallplan
8. Einsatz in einem neuen Projekt

---

## 1. Grundsätze

| Grundsatz | Bedeutet konkret |
|---|---|
| **Der Browser ist feindliches Gebiet** | Alles im Frontend (HTML, JS, versteckte Felder, „verschlüsselte“ Keys) kann jeder lesen und verändern. Geheimnisse und Entscheidungen über Geld, Rechte und Daten gehören auf den Server. |
| **So wenig wie möglich** | Nur die Daten erheben, Dienste einbinden und Rechte vergeben, die wirklich gebraucht werden. Was nicht da ist, kann nicht gestohlen werden. |
| **Mehrere Schichten** | Keine Maßnahme ist perfekt. Header, Validierung, Rechte und Monitoring fangen sich gegenseitig auf. |
| **Standard statt Eigenbau** | Für Login, Zahlung und Kryptografie bewährte Anbieter und Bibliotheken nutzen, nie selbst erfinden. |
| **Sicher als Voreinstellung** | Erst alles sperren, dann gezielt öffnen (z. B. CSP mit `default-src 'none'`). |
| **Prüfen und dokumentieren** | Jede Änderung, die eine neue Stufe auslöst, bekommt einen Check (Abschnitt 5) und einen Eintrag in der Datenschutzerklärung. |

---

## 2. Schutzstufen

Die Stufe richtet sich nach der **höchsten** Funktion, die das Projekt hat.

| Stufe | Typisch | Hauptrisiken |
|---|---|---|
| **0 – Statisch** | Portfolio, Visitenkarte, Landingpage ohne Eingaben | Verunstaltung, eingeschleuste Skripte, Datenschutzverstöße durch Fremd-Dienste |
| **1 – Eingaben** | Kontaktformular, Newsletter, eingebettete Dienste (Karte, Video, Chat), API-Aufrufe über eigene Funktion | Spam, XSS, geleakte API-Keys, Daten an Dritte |
| **2 – Konten** | Login, Kundenbereich, Datenbank, Uploads | Kontoübernahme, Datenleck, Zugriff auf fremde Daten |
| **3 – Transaktionen** | Shop, Buchungen mit Bezahlung, Abos | Betrug, manipulierte Preise, Zahlungsdaten, Haftung |

Jede Stufe enthält alle Maßnahmen der Stufen darunter.

---

## 3. Maßnahmen je Stufe

### Stufe 0 – Statisch (Pflicht für jedes Projekt)

- [ ] HTTPS überall, HSTS-Header gesetzt
- [ ] Security-Header komplett (Vorlage in 4.1)
- [ ] Keine Inline-Skripte und keine `onclick=`-Attribute, damit die CSP streng bleiben kann
- [ ] Schriften, Skripte und Bilder selbst gehostet, keine CDNs ohne Grund
- [ ] Externe Links mit `rel="noopener noreferrer"`
- [ ] Text nie ungeprüft per `innerHTML` einsetzen
- [ ] Keine Geheimnisse im Repo (`check.mjs` prüft das)
- [ ] Impressum und Datenschutzerklärung passen zum tatsächlichen Stand
- [ ] 2FA auf GitHub, beim Hoster und beim Domain-Registrar

### Stufe 1 – Eingaben und externe Dienste

- [ ] API-Keys nur als Umgebungsvariable in einer Serverless-Funktion (4.2)
- [ ] Jede Eingabe serverseitig prüfen: Typ, Länge, Format (4.3)
- [ ] Spam-Schutz für Formulare: Honeypot-Feld und Rate-Limit, Captcha nur wenn nötig und datenschutzfreundlich
- [ ] Fremd-Dienste erst nach Einwilligung laden (Zwei-Klick-Lösung), in der CSP nur deren Domain freigeben
- [ ] Jeden Dienst in `datenschutz.html` beschreiben, AV-Vertrag abschließen, wo nötig
- [ ] Fehlermeldungen ohne technische Details an den Nutzer

### Stufe 2 – Konten, Datenbank, Uploads

- [ ] Login über einen etablierten Anbieter (z. B. Auth.js, Clerk, Supabase Auth) statt Eigenbau
- [ ] Passwörter nur mit argon2 oder bcrypt gehasht; 2FA anbieten
- [ ] Rate-Limit und Sperre nach Fehlversuchen bei Login und Passwort-Reset
- [ ] Session-Cookies mit `HttpOnly`, `Secure`, `SameSite=Lax` oder `Strict`; CSRF-Schutz bei Formularen
- [ ] Bei **jeder** Anfrage serverseitig prüfen, ob der Nutzer genau diesen Datensatz sehen oder ändern darf
- [ ] Datenbank: nur parametrisierte Abfragen oder ein ORM, eigener DB-Nutzer mit minimalen Rechten, Row-Level-Security wo verfügbar
- [ ] Uploads: Dateityp und Größe serverseitig prüfen, getrennt vom Code speichern, nie direkt ausführbar ausliefern
- [ ] Backups, verschlüsselt, und die Wiederherstellung einmal ausprobiert
- [ ] Löschkonzept: Wie lange werden welche Daten gespeichert?

### Stufe 3 – Transaktionen und Zahlungen

- [ ] Zahlung nur über einen Anbieter (Stripe, PayPal, Mollie …) mit dessen Checkout. Kartendaten berühren nie den eigenen Server.
- [ ] Preise, Rabatte und Mengen **nur** auf dem Server berechnen. Der Browser schickt höchstens Produkt-IDs.
- [ ] Bestellung erst als bezahlt markieren, wenn der **signierte Webhook** des Anbieters das bestätigt, nicht wenn der Browser auf der Danke-Seite landet
- [ ] Webhook-Signatur prüfen und jede Zahlung nur einmal verarbeiten (Idempotenz)
- [ ] Getrennte Test- und Live-Keys; Live-Keys nur in der Produktions-Umgebung
- [ ] Restricted Keys mit minimalen Rechten statt Haupt-Secret, wo der Anbieter das anbietet
- [ ] Logging aller Zahlungsvorgänge (ohne Kartendaten) und Benachrichtigung bei Auffälligkeiten
- [ ] Rechtliches: AGB, Widerrufsbelehrung, Preisangaben, Button „zahlungspflichtig bestellen“

---

## 4. Bausteine im Detail

### 4.1 Security-Header (Vercel)

Vorlage für `vercel.json`. Für Stufe 0 passt sie unverändert, jede externe Quelle muss gezielt ergänzt werden.

```json
{
  "source": "/(.*)",
  "headers": [
    { "key": "Content-Security-Policy", "value": "default-src 'none'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests" },
    { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "Referrer-Policy", "value": "no-referrer" },
    { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
    { "key": "Cross-Origin-Resource-Policy", "value": "same-origin" },
    { "key": "Permissions-Policy", "value": "accelerometer=(), autoplay=(), browsing-topics=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), hid=(), magnetometer=(), microphone=(), midi=(), payment=(), publickey-credentials-get=(), serial=(), usb=(), xr-spatial-tracking=()" }
  ]
}
```

Anpassen, wenn das Projekt wächst:

| Neu im Projekt | Änderung in der CSP |
|---|---|
| Formular, das an die eigene API sendet | `form-action 'self'` |
| Eigene API unter derselben Domain | nichts, `connect-src 'self'` reicht |
| Stripe Checkout per Weiterleitung (empfohlen) | `form-action 'self' https://checkout.stripe.com`, falls ein Formular den Checkout startet; sonst nichts |
| Stripe Elements (Zahlungsformular eingebettet) | `script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; connect-src 'self' https://api.stripe.com`, dazu `payment=(self "https://js.stripe.com")` in der Permissions-Policy |
| YouTube nach Einwilligung | `frame-src https://www.youtube-nocookie.com` |
| Analyse-Tool | dessen Domain in `script-src` und `connect-src`, vorher Einwilligung und Datenschutzerklärung |

`style-src-attr 'unsafe-inline'` erlaubt nur `style="…"`-Attribute (für Animations-Bibliotheken). Das Risiko ist gering, weil darüber kein Code ausgeführt wird. `'unsafe-inline'` oder `'unsafe-eval'` in `script-src` sind dagegen tabu.

Andere Hoster: Bei Netlify kommen die gleichen Header in die Datei `_headers`, bei Apache in `.htaccess`, bei nginx per `add_header`.

### 4.2 Geheimnisse (API-Keys, Tokens, Passwörter)

1. **Nie im Frontend.** Ein Key im Browser-Code ist öffentlich, auch „verschlüsselt“ oder „versteckt“: Der Browser muss ihn zum Benutzen entschlüsseln, also kann es jeder Besucher auch.
2. **Nie im Repo.** Auch nicht kurz zum Testen. Git vergisst nichts. `.env` gehört in `.gitignore`. Für andere Entwickler gibt es nur eine `.env.example` ohne echte Werte.
3. **Richtig:** Key als Umgebungsvariable beim Hoster (Vercel → Settings → Environment Variables). Eine Serverless-Funktion unter `/api/…` liest ihn mit `process.env.NAME` und ruft den Dienst auf. Der Browser spricht nur mit deiner Funktion.
4. **Minimal-Rechte:** Wenn der Anbieter es erlaubt, Keys auf Domain, IP oder einzelne Funktionen beschränken. Ausgabe-Limits setzen.
5. **Getrennt:** Eigene Keys für Entwicklung und Produktion.
6. **Geleakt?** Sofort beim Anbieter widerrufen und neu erzeugen (Abschnitt 7). Aus der Git-Historie löschen reicht nicht: Der Key ist verbrannt.

### 4.3 Eingaben und Ausgaben

- **Serverseitig validieren**, Browser-Validierung ist nur Komfort. Erlaubte Werte festlegen (Allowlist) statt Verbotenes zu suchen.
- **Ausgaben passend escapen:** In HTML Text mit `textContent` statt `innerHTML` einsetzen. In SQL nur Platzhalter, nie zusammengesetzte Strings.
- **Längen begrenzen**, damit niemand Megabytes durch ein Namensfeld schickt.
- **Weiterleitungen** (`?next=…`) nur auf eigene Pfade zulassen.

### 4.4 Abhängigkeiten und Code

- Bibliotheken bewusst wählen: aktiv gepflegt, verbreitet, möglichst wenige.
- Bei npm-Projekten: `package-lock.json` committen, regelmäßig `npm audit`, GitHub Dependabot einschalten.
- Lokal gespeicherte Bibliotheken (wie hier unter `assets/vendor/`) einmal im Quartal auf neue Versionen prüfen.
- Kein `eval()` und kein `new Function()`.

### 4.5 Konten und Zugänge des Betreibers

Die meisten Websites werden nicht über ihren Code gehackt, sondern über die Konten dahinter.

- 2FA (am besten per App oder Passkey, nicht per SMS) für GitHub, Hoster, Domain-Registrar, E-Mail, Zahlungsanbieter
- Passwort-Manager, für jeden Dienst ein eigenes Passwort
- Für die Website eine eigene Kontakt-Adresse (z. B. `kontakt@deinedomain.de`), damit die private Adresse nicht im Netz steht
- Zugänge von Helfern nach Projektende entfernen
- GitHub: Branch-Schutz für `main`, Secret Scanning und Push-Protection einschalten

### 4.6 Datenschutz (DSGVO)

- Jeder Dienst, der Daten von Besuchern bekommt, steht in der Datenschutzerklärung, mit Zweck und Rechtsgrundlage.
- Hoster außerhalb der EU: Drittland-Übermittlung nennen, AV-Vertrag abschließen.
- Einwilligung **vor** dem Laden von Tracking, Karten, Videos und Chat-Widgets.
- Nur speichern, was nötig ist, und Löschfristen festlegen.
- Datenpanne mit Risiko für Betroffene: Meldung an die Aufsichtsbehörde innerhalb von 72 Stunden (Art. 33 DSGVO).

---

## 5. Vor dem Go-live

1. Automatischen Check ausführen, er muss ohne `FEHLER` durchlaufen:
   ```bash
   node security/check.mjs
   ```
2. Checkliste der eigenen Stufe (Abschnitt 3) vollständig abhaken.
3. Nach dem Deploy die Header prüfen: securityheaders.com sollte A oder A+ zeigen, Mozilla HTTP Observatory mindestens B+.
4. Browser-Konsole auf allen Seiten offen lassen: keine CSP-Verstöße, keine Fehler.
5. Ab Stufe 2: mit zwei Testkonten prüfen, dass Konto A keine Daten von Konto B sieht oder ändern kann.
6. Ab Stufe 3: Testzahlung, abgebrochene Zahlung und manipulierten Preis im Browser durchspielen (DevTools). Der Server muss den manipulierten Preis ignorieren.

---

## 6. Laufender Betrieb

| Wann | Was |
|---|---|
| Bei jeder Änderung | `node security/check.mjs`; neue Dienste in CSP und Datenschutzerklärung eintragen |
| Monatlich | Dependabot-/`npm audit`-Meldungen abarbeiten (ab Stufe 1) |
| Vierteljährlich | Bibliotheken aktualisieren, Header neu testen, Zugänge und Keys durchsehen, nicht mehr genutzte löschen |
| Jährlich | Konzept und Datenschutzerklärung überprüfen; ab Stufe 2 Backup-Wiederherstellung testen; Keys rotieren |

Ab Stufe 2 zusätzlich: Fehler- und Uptime-Monitoring mit Benachrichtigung (z. B. die Logs des Hosters, ein Uptime-Dienst).

---

## 7. Notfallplan

Wenn etwas passiert ist (Key geleakt, Seite verändert, Konto übernommen):

1. **Eindämmen:** Betroffenen Key widerrufen, Passwort ändern, alle Sitzungen abmelden. Im Zweifel die Seite vorübergehend offline nehmen oder auf den letzten guten Stand zurücksetzen (bei Vercel: älteres Deployment wieder aktivieren).
2. **Neu absichern:** Neue Keys erzeugen und nur als Umgebungsvariable hinterlegen. 2FA prüfen.
3. **Verstehen:** Wie ist es passiert? Logs, Git-Historie und Zugänge prüfen. Die Lücke schließen, bevor die Seite wieder online geht.
4. **Melden:** Sind personenbezogene Daten betroffen: Aufsichtsbehörde innerhalb von 72 Stunden. Bei hohem Risiko auch die Betroffenen. Bei Zahlungen den Zahlungsanbieter informieren.
5. **Lernen:** Kurz aufschreiben, was passiert ist, und das Konzept ergänzen.

Wichtige Links für den Notfall (pro Projekt ausfüllen):

| Dienst | Wo Keys widerrufen / Zugang sperren |
|---|---|
| Hoster | [[ausfüllen]] |
| Domain-Registrar | [[ausfüllen]] |
| Zahlungsanbieter | [[ausfüllen]] |
| Weitere API-Dienste | [[ausfüllen]] |

---

## 8. Einsatz in einem neuen Projekt

1. Ordner `security/` ins Projekt kopieren.
2. Schutzstufe festlegen und unten eintragen.
3. Header-Vorlage aus 4.1 in die Hoster-Konfiguration übernehmen und an die Stufe anpassen.
4. In die `CLAUDE.md` des Projekts schreiben: „Security-Konzept in `security/KONZEPT.md` beachten, vor jedem Commit `node security/check.mjs` ausführen.“
5. Notfall-Links in Abschnitt 7 ausfüllen.

### Dieses Projekt

| | |
|---|---|
| Projekt | filipkramar.de |
| Schutzstufe | **0 – Statisch** |
| Hoster | Vercel (USA → Drittland-Hinweis und AV-Vertrag nötig) |
| Externe Dienste | keine (nur Links zu GitHub, LinkedIn, Instagram) |
| Offene Punkte | Hoster in der Datenschutzerklärung eintragen; eigene Kontakt-Adresse statt privater Gmail-Adresse erwägen |
