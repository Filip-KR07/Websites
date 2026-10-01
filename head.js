/* Laeuft blockierend im <head>, damit die js-Klasse vor dem ersten Zeichnen steht.
   Ausgelagert statt inline, damit die Content-Security-Policy Inline-Skripte komplett verbieten kann. */
document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');
