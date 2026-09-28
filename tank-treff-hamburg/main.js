(function () {
  // Öffnungszeiten in Minuten ab Mitternacht, Index = Wochentag (0 = So)
  var HOURS = [null, [330, 1200], [330, 1200], [330, 1200], [330, 1200], [330, 1200], [420, 1140]];
  var fmt = function (m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

  function updateStatus() {
    var now = new Date(), day = now.getDay(), min = now.getHours() * 60 + now.getMinutes();
    var h = HOURS[day], open = h && min >= h[0] && min < h[1], text;
    if (open) {
      text = 'Jetzt geöffnet · bis ' + fmt(h[1]) + ' Uhr';
    } else {
      var d = day, next = h && min < h[0] ? h : null, add = 0;
      while (!next) { d = (d + 1) % 7; add++; next = HOURS[d]; }
      var names = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      text = 'Geschlossen · öffnet ' + (add === 0 ? 'heute' : add === 1 ? 'morgen' : names[d]) + ' ' + fmt(next[0]) + ' Uhr';
    }
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.textContent = text;
      el.classList.toggle('is-open', !!open);
      el.classList.toggle('is-closed', !open);
    });
    var today = document.querySelector('[data-hours] [data-day="' + day + '"]');
    if (today) today.classList.add('is-today');
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  // Einblenden beim Scrollen – einmalig, mit kurzem Versatz innerhalb einer Gruppe
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
  document.documentElement.classList.add('js');
  var io = new IntersectionObserver(function (entries) {
    var i = 0;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = Math.min(i++ * 50, 300) + 'ms';
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -60px 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
