#!/usr/bin/env node
/* security/check.mjs — universeller Security-Check für Web-Projekte (siehe security/KONZEPT.md).
   Ohne Abhängigkeiten, Node 18+. Aufruf im Projekt-Hauptordner:  node security/check.mjs [ordner]
   Exit-Code 1, sobald ein FEHLER gefunden wird – damit taugt das Skript auch für CI oder einen Git-Hook. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, extname, basename } from 'node:path';

const ROOT = process.argv[2] || process.cwd();
const SELF = relative(ROOT, new URL(import.meta.url).pathname);
const results = { FEHLER: [], WARNUNG: [], INFO: [] };
const report = (level, file, msg) => results[level].push(file ? `${file}: ${msg}` : msg);

/* ---------- Dateien sammeln ---------- */
const SKIP_DIRS = new Set(['.git', 'node_modules', '.vercel', '.next', 'dist', 'build', '.cache', 'coverage']);
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.pdf', '.zip', '.mp4', '.webm', '.mp3']);

function listFiles() {
  // Bevorzugt nur das, was Git kennt (getrackt + neu, ohne .gitignore-Treffer).
  try {
    const out = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split('\n').filter(Boolean).filter((f) => existsSync(join(ROOT, f)));
  } catch {
    const files = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(full); } else files.push(relative(ROOT, full));
      }
    };
    walk(ROOT);
    return files;
  }
}

const files = listFiles().filter((f) => !BINARY.has(extname(f).toLowerCase()));
const read = (f) => { try { return readFileSync(join(ROOT, f), 'utf8'); } catch { return ''; } };
const isVendor = (f) => /(^|\/)(vendor|vendors|third[-_]?party)\//.test(f) || /\.min\.(js|css)$/.test(f);
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/* ---------- 1. Geheimnisse ---------- */
const SECRET_PATTERNS = [
  ['Privater Schlüssel', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['AWS Access Key', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub Token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/],
  ['Stripe Live Secret', /\b[rs]k_live_[0-9a-zA-Z]{20,}\b/],
  ['Stripe Webhook Secret', /\bwhsec_[0-9a-zA-Z]{20,}\b/],
  ['Anthropic API Key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['OpenAI API Key', /\bsk-(proj-)?[A-Za-z0-9_-]{32,}/],
  ['Google API Key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Slack Token', /\bxox[abprs]-[0-9A-Za-z-]{10,}/],
  ['SendGrid Key', /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/],
  ['Datenbank-URL mit Passwort', /\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis):\/\/[^\s:/'"]+:[^\s@/'"]{6,}@/],
];
const GENERIC_SECRET = /\b(api[_-]?key|secret|token|passw(or)?d|client[_-]?secret)\b["']?\s*[:=]\s*["']([^"'\s]{12,})["']/gi;

for (const f of files) {
  const name = basename(f);
  if (/^\.env(\..+)?$/.test(name) && !/\.(example|sample|template)$/.test(name)) {
    report('FEHLER', f, 'Umgebungsdatei mit möglichen Geheimnissen liegt im Projekt. In .gitignore eintragen und Werte beim Hoster hinterlegen.');
  }
  if (f === SELF) continue;
  const text = read(f);
  for (const [label, re] of SECRET_PATTERNS) {
    const m = re.exec(text);
    if (m) report('FEHLER', `${f}:${lineOf(text, m.index)}`, `${label} gefunden. Sofort widerrufen, neu erzeugen und nur als Umgebungsvariable speichern.`);
  }
  if (isVendor(f)) continue;
  for (const m of text.matchAll(GENERIC_SECRET)) {
    if (/^(process\.env|import\.meta\.env|\$\{|<|\[\[|x{4,}|\*{4,}|your|dein|example|changeme)/i.test(m[3])) continue;
    report('WARNUNG', `${f}:${lineOf(text, m.index)}`, `"${m[1]}" mit festem Wert. Falls echt: ins Backend als Umgebungsvariable verschieben.`);
  }
}

if (existsSync(join(ROOT, '.gitignore'))) {
  const gi = read('.gitignore');
  if (!/^\s*\.env/m.test(gi)) report('WARNUNG', '.gitignore', '".env" fehlt. Eintragen, bevor jemand eine .env-Datei anlegt.');
} else {
  report('WARNUNG', null, 'Keine .gitignore vorhanden. Mindestens ".env" und "node_modules" eintragen.');
}

/* ---------- 2. Security-Header ---------- */
const REQUIRED_HEADERS = {
  'content-security-policy': 'Content-Security-Policy',
  'strict-transport-security': 'Strict-Transport-Security',
  'x-content-type-options': 'X-Content-Type-Options',
  'referrer-policy': 'Referrer-Policy',
  'permissions-policy': 'Permissions-Policy',
};

function headersFromVercel() {
  if (!existsSync(join(ROOT, 'vercel.json'))) return null;
  let cfg;
  try { cfg = JSON.parse(read('vercel.json')); } catch { report('FEHLER', 'vercel.json', 'Kein gültiges JSON.'); return {}; }
  const all = {};
  for (const block of cfg.headers || []) {
    // Nur Regeln, die für alle Seiten gelten, zählen als Basis-Schutz.
    if (!/^\/\(\.\*\)$|^\/:path\*$|^\/\(\.\*\)\?$/.test(block.source || '')) continue;
    for (const h of block.headers || []) all[h.key.toLowerCase()] = h.value;
  }
  return all;
}

function headersFromNetlify() {
  if (!existsSync(join(ROOT, '_headers'))) return null;
  const all = {};
  let global = false;
  for (const line of read('_headers').split('\n')) {
    if (/^\S/.test(line)) { global = line.trim() === '/*'; continue; }
    const m = line.match(/^\s+([\w-]+):\s*(.+)$/);
    if (m && global) all[m[1].toLowerCase()] = m[2].trim();
  }
  return all;
}

const headers = headersFromVercel() ?? headersFromNetlify();
if (!headers) {
  report('WARNUNG', null, 'Keine Header-Konfiguration gefunden (vercel.json oder _headers). Header beim Hoster setzen und mit securityheaders.com prüfen.');
} else {
  const src = existsSync(join(ROOT, 'vercel.json')) ? 'vercel.json' : '_headers';
  for (const [key, label] of Object.entries(REQUIRED_HEADERS)) {
    if (!headers[key]) report('FEHLER', src, `${label} fehlt (Vorlage: KONZEPT.md, Abschnitt 4.1).`);
  }
  const csp = headers['content-security-policy'] || '';
  if (csp) {
    const directive = (name) => (csp.match(new RegExp(`(?:^|;)\\s*${name}\\s+([^;]*)`, 'i')) || [])[1];
    const scriptSrc = directive('script-src') ?? directive('default-src') ?? '';
    if (/'unsafe-inline'/.test(scriptSrc)) report('FEHLER', src, "CSP erlaubt Inline-Skripte ('unsafe-inline' in script-src). Damit schützt sie kaum vor XSS.");
    if (/'unsafe-eval'/.test(scriptSrc)) report('WARNUNG', src, "CSP erlaubt eval ('unsafe-eval').");
    if (/(^|\s)(\*|https:|http:)(\s|$)/.test(scriptSrc)) report('FEHLER', src, 'CSP erlaubt Skripte von beliebigen Domains.');
    if (!directive('default-src')) report('WARNUNG', src, 'CSP ohne default-src. Mit "default-src \'none\'" starten und gezielt öffnen.');
    if (!directive('frame-ancestors') && !headers['x-frame-options']) report('FEHLER', src, 'Kein Schutz vor Einbetten in fremde Seiten (frame-ancestors oder X-Frame-Options).');
    if (!directive('base-uri')) report('WARNUNG', src, "CSP ohne base-uri. \"base-uri 'none'\" ergänzen.");
    if (!directive('object-src') && !/default-src\s+'none'/.test(csp)) report('WARNUNG', src, "CSP ohne object-src 'none'.");
  }
  const hsts = headers['strict-transport-security'] || '';
  const maxAge = Number((hsts.match(/max-age=(\d+)/) || [])[1] || 0);
  if (hsts && maxAge < 15552000) report('WARNUNG', src, 'HSTS max-age unter 6 Monaten.');
}

/* ---------- 3. HTML ---------- */
const htmlFiles = files.filter((f) => /\.html?$/.test(f) && !isVendor(f));
const externalHosts = new Map();

for (const f of htmlFiles) {
  const html = read(f);
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/type\s*=\s*["']?(application\/(ld\+)?json|text\/template|importmap)/i.test(attrs)) continue;
    if (!m[2].trim()) continue;
    report('WARNUNG', `${f}:${lineOf(html, m.index)}`, 'Inline-Skript. In eine .js-Datei auslagern, damit die CSP Inline-Code verbieten kann.');
  }
  for (const m of html.matchAll(/<[a-z][^>]*\s(on[a-z]+)\s*=\s*["']/gi)) {
    report('WARNUNG', `${f}:${lineOf(html, m.index)}`, `Event-Handler-Attribut "${m[1]}=". Per addEventListener in einer .js-Datei lösen.`);
  }
  for (const m of html.matchAll(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi)) {
    const rel = (m[0].match(/rel\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    if (!/noopener/.test(rel)) report('WARNUNG', `${f}:${lineOf(html, m.index)}`, 'Link mit target="_blank" ohne rel="noopener".');
  }
  for (const m of html.matchAll(/<(script|link|img|iframe|source|video|audio|embed|object)\b[^>]*\s(?:src|href|data)\s*=\s*["'](https?:)?\/\/([^/"']+)/gi)) {
    const tag = m[1].toLowerCase();
    if (tag === 'link' && !/rel\s*=\s*["'][^"']*(stylesheet|preload|modulepreload|icon|manifest)/i.test(m[0])) continue;
    if (m[2] === 'http:') report('FEHLER', `${f}:${lineOf(html, m.index)}`, `<${tag}> lädt über unverschlüsseltes http://${m[3]}.`);
    const list = externalHosts.get(m[3]) || new Set();
    list.add(f); externalHosts.set(m[3], list);
  }
  for (const m of html.matchAll(/<form\b[^>]*>/gi)) {
    const action = (m[0].match(/action\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    if (/^http:/.test(action)) report('FEHLER', `${f}:${lineOf(html, m.index)}`, 'Formular sendet über unverschlüsseltes http://.');
    else if (/^https:/.test(action)) report('INFO', `${f}:${lineOf(html, m.index)}`, `Formular sendet an ${action}. In CSP (form-action) und Datenschutzerklärung aufnehmen.`);
  }
}

for (const [host, where] of externalHosts) {
  report('INFO', null, `Externe Quelle ${host} (in ${[...where].join(', ')}). Bekommt die IP der Besucher: in CSP und Datenschutzerklärung aufnehmen, besser selbst hosten.`);
}

/* ---------- 4. JavaScript ---------- */
const jsFiles = files.filter((f) => /\.(m?js|cjs|jsx|ts|tsx)$/.test(f) && !isVendor(f) && f !== SELF);
for (const f of jsFiles) {
  const js = read(f);
  for (const m of js.matchAll(/\beval\s*\(|\bnew\s+Function\s*\(|\bdocument\.write(ln)?\s*\(/g)) {
    report('WARNUNG', `${f}:${lineOf(js, m.index)}`, `${m[0].replace(/\s*\($/, '')} führt Text als Code aus bzw. schreibt ungeprüft HTML. Vermeiden.`);
  }
  for (const m of js.matchAll(/\b(innerHTML|outerHTML)\s*\+?=|insertAdjacentHTML\s*\(/g)) {
    report('INFO', `${f}:${lineOf(js, m.index)}`, `${m[0].replace(/\s*[+=(]+$/, '')}: Prüfen, dass kein ungeprüfter Text (Nutzereingabe, URL, API-Antwort, textContent) hineinfließt.`);
  }
  for (const m of js.matchAll(/(localStorage|sessionStorage)\.setItem\(\s*["'`][^"'`]*(token|auth|session|passw|secret)/gi)) {
    report('WARNUNG', `${f}:${lineOf(js, m.index)}`, `Zugangsdaten im ${m[1]}. Per XSS auslesbar: besser HttpOnly-Cookie.`);
  }
}

/* ---------- 5. Abhängigkeiten ---------- */
if (existsSync(join(ROOT, 'package.json'))) {
  const hasLock = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'].some((l) => existsSync(join(ROOT, l)));
  if (!hasLock) report('WARNUNG', 'package.json', 'Keine Lock-Datei. Versionen sind nicht festgelegt.');
  report('INFO', null, 'npm-Projekt: zusätzlich "npm audit" ausführen und Dependabot einschalten.');
}
const vendorFiles = files.filter((f) => /(^|\/)vendor\/.*\.js$/.test(f));
if (vendorFiles.length) report('INFO', null, `${vendorFiles.length} lokal gespeicherte Bibliothek(en) (${vendorFiles.map((f) => basename(f)).join(', ')}): vierteljährlich auf neue Versionen prüfen.`);

/* ---------- Ausgabe ---------- */
const color = process.stdout.isTTY ? { FEHLER: '\x1b[31m', WARNUNG: '\x1b[33m', INFO: '\x1b[36m', end: '\x1b[0m' } : { FEHLER: '', WARNUNG: '', INFO: '', end: '' };
console.log(`Security-Check: ${ROOT} (${files.length} Dateien geprüft)\n`);
for (const level of ['FEHLER', 'WARNUNG', 'INFO']) {
  for (const line of results[level]) console.log(`${color[level]}${level.padEnd(7)}${color.end}  ${line}`);
}
const n = (k) => results[k].length;
console.log(`\n${n('FEHLER')} Fehler, ${n('WARNUNG')} Warnungen, ${n('INFO')} Hinweise.`);
if (!n('FEHLER')) console.log('Keine Fehler. Die Checkliste der eigenen Schutzstufe (KONZEPT.md, Abschnitt 3) ersetzt das nicht.');
process.exit(n('FEHLER') ? 1 : 0);
