/* Impressum + Datenschutz: aktuelles Jahr im Footer. Ausgelagert wegen der Content-Security-Policy. */
document.querySelectorAll('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
