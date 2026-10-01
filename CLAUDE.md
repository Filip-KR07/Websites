# Hinweise für Claude

## Cyber-Security: immer erinnern, nichts ungefragt einbauen

Filip möchte bei jeder Arbeit an Websites an Cyber-Security erinnert werden.

- **Erinnern, nicht umsetzen:** Sicherheitsmaßnahmen nur vorschlagen. Eingebaut wird erst, wenn Filip es ausdrücklich sagt.
- **Kurz halten:** Am Ende der Antwort ein kurzer Abschnitt „Security-Erinnerung“ mit den 1–3 Punkten, die zur aktuellen Änderung passen. Keine lange Liste, wenn nichts Relevantes dabei ist.
- **Besonders deutlich**, sobald eine Seite eines davon bekommt: Zahlungen/Transaktionen, Login/Konten, Formulare, API-Keys oder Tokens, Datenbank, Nutzer-Uploads, externe Dienste (Tracking, Karten, Videos, Chat).

Das ausführliche Konzept mit Schutzstufen, Header-Vorlage und Notfallplan steht in `security/KONZEPT.md`. Dieses Projekt ist **Stufe 0 – Statisch**. Bekommt es Formulare, Login oder Zahlungen, auf die neue Stufe hinweisen.

Nach Änderungen an HTML, JS oder `vercel.json` `node security/check.mjs` ausführen und das Ergebnis kurz nennen. Der Check ändert nichts, er meldet nur.

Checkliste, aus der die passenden Punkte gewählt werden:

- **Geheimnisse:** API-Keys nie ins Frontend oder ins Repo. Sie gehören als Umgebungsvariable in eine Server-/Serverless-Funktion. Im Browser verschlüsseln schützt nicht.
- **Zahlungen:** Nur über einen Zahlungsanbieter (z. B. Stripe, PayPal), Kartendaten nie selbst verarbeiten. Beträge serverseitig prüfen, nie dem Browser glauben. Webhooks mit Signatur prüfen.
- **Header:** Content-Security-Policy, HSTS, Referrer-Policy, Permissions-Policy, X-Frame-Options (in `vercel.json`).
- **Eingaben:** Alles vom Nutzer serverseitig validieren. Text nie ungeprüft per `innerHTML` einsetzen (XSS).
- **Login:** Passwörter nur gehasht (bcrypt/argon2), 2FA, Rate-Limiting, sichere Cookies (`HttpOnly`, `Secure`, `SameSite`), CSRF-Schutz.
- **Abhängigkeiten:** Bibliotheken aktuell halten und bekannte Lücken prüfen (`npm audit`).
- **Datenschutz:** Jeder neue externe Dienst muss in `datenschutz.html` beschrieben werden. AV-Vertrag mit dem Hoster.
