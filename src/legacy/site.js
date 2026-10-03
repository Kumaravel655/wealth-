/* Wealth Bridge: navigation, due dates, motion, Tamil Nadu map and enquiry form */
(function () {
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* ---------- mobile navigation */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function setNav(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    body.classList.toggle('nav-open', open);
    toggle.querySelector('.toggle-label').textContent = open ? 'Close' : 'Menu';
  }
  if (toggle && nav) toggle.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });

  /* ---------- services mega menu */
  var megaBtn = document.querySelector('.nav-btn[aria-controls="mega"]');
  var mega = document.getElementById('mega');
  var hoverable = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 921px)');
  var closeTimer;
  function setMega(open) {
    if (!megaBtn || !mega) return;
    mega.classList.toggle('open', open);
    megaBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (megaBtn && mega) {
    var li = megaBtn.parentElement;
    megaBtn.addEventListener('click', function () { setMega(megaBtn.getAttribute('aria-expanded') !== 'true'); });
    li.addEventListener('mouseenter', function () { if (hoverable.matches) { clearTimeout(closeTimer); setMega(true); } });
    li.addEventListener('mouseleave', function () { if (hoverable.matches) closeTimer = setTimeout(function () { setMega(false); }, 160); });
    li.addEventListener('focusout', function (ev) { if (hoverable.matches && !li.contains(ev.relatedTarget)) setMega(false); });
    document.addEventListener('click', function (ev) { if (hoverable.matches && !li.contains(ev.target)) setMega(false); });
  }
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (mega && mega.classList.contains('open')) { setMega(false); megaBtn.focus(); }
    else if (nav && nav.classList.contains('open')) { setNav(false); toggle.focus(); }
  });

  /* ---------- statutory due dates (as generally applicable; extensions are not reflected) */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function dueEvents(count) {
    var ev = [];
    function add(y, m, d, title, sub) { ev.push({ date: new Date(y, m, d), title: title, sub: sub }); }
    for (var k = 0; k < 4; k++) {
      var base = new Date(today.getFullYear(), today.getMonth() + k, 1);
      var y = base.getFullYear(), m = base.getMonth(), prev = FULL[(m + 11) % 12];
      if (m === 3) add(y, 3, 30, 'TDS & TCS deposit', 'Tax deducted in March');
      else add(y, m, 7, 'TDS & TCS deposit', 'Tax deducted in ' + prev);
      add(y, m, 11, 'GSTR-1', 'Outward supplies for ' + prev + ' (monthly filers)');
      add(y, m, 15, 'PF & ESI contributions', 'Wages for ' + prev);
      add(y, m, 20, 'GSTR-3B', 'Return and tax for ' + prev + ' (monthly filers)');
      if (m % 3 === 0) add(y, m, 22, 'GSTR-3B (QRMP)', 'Quarter ' + FULL[(m + 9) % 12] + ' to ' + FULL[(m + 11) % 12] + ', Tamil Nadu');
      var adv = { 5: '15% of the year’s tax', 8: '45% of the year’s tax', 11: '75% of the year’s tax', 2: '100% of the year’s tax' };
      if (adv[m]) add(y, m, 15, 'Advance tax instalment', adv[m]);
      if (m === 6) add(y, 6, 31, 'Income tax return', 'Individuals and others without audit');
      if (m === 8) add(y, 8, 30, 'Tax audit report', 'Where accounts must be audited');
      if (m === 9) add(y, 9, 31, 'Income tax return', 'Cases requiring audit');
      var tdsQ = { 6: 'April to June', 9: 'July to September', 0: 'October to December', 4: 'January to March' };
      if (tdsQ[m]) add(y, m, 31, 'TDS & TCS quarterly returns', tdsQ[m]);
    }
    return ev.filter(function (x) { return x.date >= today; })
      .sort(function (a, b) { return a.date - b.date; })
      .slice(0, count)
      .map(function (x) { x.days = Math.round((x.date - today) / 86400000); return x; });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var list = document.querySelector('[data-due]');
  if (list) {
    var items = dueEvents(5);
    if (items.length) {
      var ring = '<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="ring-bg" cx="22" cy="22" r="19"/><circle class="ring-fg" cx="22" cy="22" r="19" pathLength="100"/></svg>';
      list.innerHTML = items.map(function (x) {
        var left = x.days === 0 ? 'today' : x.days === 1 ? 'tomorrow' : 'in ' + x.days + ' days';
        var iso = x.date.getFullYear() + '-' + pad(x.date.getMonth() + 1) + '-' + pad(x.date.getDate());
        var fill = Math.max(6, Math.round(100 - x.days / 31 * 100));
        return '<li class="due' + (x.days <= 3 ? ' is-near' : '') + '" data-fill="' + fill + '">' +
          '<span class="ring">' + ring + '<b>' + x.days + '</b><span class="sr-only"> days left</span></span>' +
          '<span class="due-what"><strong>' + esc(x.title) + '</strong><span>' + esc(x.sub) + '</span></span>' +
          '<time class="due-date" datetime="' + iso + '">' + pad(x.date.getDate()) + ' ' + MON[x.date.getMonth()] + ' · ' + left + '</time></li>';
      }).join('');
      var stamp = document.querySelector('[data-today]');
      if (stamp) stamp.textContent = DAYS[today.getDay()] + ', ' + today.getDate() + ' ' + MON[today.getMonth()] + ' ' + today.getFullYear();
      var fillRings = function () {
        list.querySelectorAll('.due').forEach(function (li, i) {
          setTimeout(function () { li.querySelector('.ring-fg').style.setProperty('--off', 100 - li.dataset.fill); }, reduce ? 0 : 700 + i * 90);
        });
      };
      raf(function () { raf(fillRings); });
    }
  }

  /* ---------- ticker */
  var tick = document.querySelector('[data-ticker]');
  if (tick) {
    var tItems = dueEvents(10);
    if (tItems.length) {
      tick.innerHTML = tItems.map(function (x) {
        return '<li' + (x.days <= 3 ? ' class="near"' : '') + '><b>' + pad(x.date.getDate()) + ' ' + MON[x.date.getMonth()] + '</b>' + esc(x.title) + ' · ' + esc(x.sub) + '</li>';
      }).join('');
    }
    var mover = tick.parentElement;
    var tickerEl = document.querySelector('.ticker');
    var pauseBtn = document.querySelector('.ticker-pause');
    if (!reduce) {
      var copy = tick.cloneNode(true); copy.removeAttribute('data-ticker'); copy.setAttribute('aria-hidden', 'true');
      mover.appendChild(copy);
      mover.style.setProperty('--ticker-dur', Math.max(30, Math.round(tick.scrollWidth / 45)) + 's');
      mover.classList.add('run');
    }
    if (pauseBtn) pauseBtn.addEventListener('click', function () {
      var paused = tickerEl.classList.toggle('paused');
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      pauseBtn.querySelector('.sr-only').textContent = paused ? 'Play the due dates ticker' : 'Pause the due dates ticker';
    });
  }

  var mqBtn = document.querySelector('.marquee-pause');
  if (mqBtn) mqBtn.addEventListener('click', function () {
    var paused = mqBtn.closest('.audience').classList.toggle('paused');
    mqBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    mqBtn.querySelector('.sr-only').textContent = paused ? 'Play the scrolling list' : 'Pause the scrolling list';
  });

  /* ---------- open / closed status, Indian Standard Time (holidays not reflected) */
  var openEl = document.querySelector('[data-open]');
  if (openEl) {
    var now = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
    var mins = now.getHours() * 60 + now.getMinutes(), day = now.getDay();
    var openDay = day >= 1 && day <= 6, OPEN = 570, CLOSE = 1110;
    var msg;
    if (openDay && mins >= OPEN && mins < CLOSE) msg = 'Open now · until 6:30 pm';
    else if (openDay && mins < OPEN) msg = 'Opens today at 9:30 am';
    else msg = 'Opens ' + (day === 6 || day === 0 ? 'Monday' : 'tomorrow') + ' at 9:30 am';
    if (day === 6 && mins >= CLOSE) msg = 'Opens Monday at 9:30 am';
    openEl.textContent = msg;
    var dot = openEl.previousElementSibling;
    if (dot) dot.classList.toggle('closed', !/^Open now/.test(msg));
  }

  /* ---------- reveals, counters, bridge, map entrance */
  var targets = document.querySelectorAll('.reveal, .span, .tnmap, [data-count]');
  function countUp(el) {
    var to = +el.dataset.count, t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 4)));
      el.textContent = v.toLocaleString('en-IN');
      if (k < 1) raf(step);
    }
    raf(step);
  }
  function enter(el) {
    el.classList.add('in');
    if (el.dataset && el.dataset.count && !reduce) countUp(el);
    if (el.classList.contains('tnmap')) { var arc = el.querySelector('.map-arc'); if (arc && !reduce) setTimeout(function () { arc.classList.add('flow'); }, 2700); }
  }
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { enter(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  /* ---------- process timeline: light each step as it enters (the line itself is a CSS view timeline) */
  var steps = document.querySelectorAll('[data-progress] > li');
  if (steps.length) {
    if (!reduce && 'IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('on'); sio.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -25% 0px', threshold: 0.6 });
      steps.forEach(function (s) { sio.observe(s); });
    } else {
      steps.forEach(function (s) { s.classList.add('on'); });
    }
  }

  /* ---------- Tamil Nadu map */
  var dataEl = document.getElementById('tn-data');
  var mapG = document.querySelector('.districts[data-src]');
  function loadMap() {
    if (!mapG || mapG.dataset.loaded) return;
    mapG.dataset.loaded = '1';
    fetch(mapG.dataset.src).then(function (r) { return r.json(); }).then(function (d) { mapG.innerHTML = d.paths; initMap(); });
  }
  if (mapG) {
    if ('IntersectionObserver' in window) {
      var mio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { mio.disconnect(); loadMap(); } }, { rootMargin: '900px 0px' });
      mio.observe(mapG.closest('.tnmap'));
    } else loadMap();
  }
  function initMap() {
    var D = JSON.parse(dataEl.textContent);
    var fig = document.querySelector('.tnmap');
    var svg = fig.querySelector('svg');
    var tip = fig.querySelector('.map-tip');
    var select = document.getElementById('district');
    var card = document.querySelector('.district-card');
    var tourBtn = document.querySelector('.tour-btn');
    var paths = {};
    svg.querySelectorAll('.d').forEach(function (p) { paths[p.dataset.name] = p; });

    function nearest(name) {
      var c = D.c[name], best = null;
      Object.keys(D.offices).forEach(function (k) {
        var o = D.offices[k], dx = o.xy[0] - c[0], dy = o.xy[1] - c[1];
        var km = Math.sqrt(dx * dx + dy * dy) * D.km;
        if (!best || km < best.km) best = { key: k, km: km, label: o.label };
      });
      return best;
    }
    function kmText(n, office) {
      if (D.inPerson.indexOf(n) >= 0 && (n === 'Vellore' || n === 'Chennai')) return 'Office in district';
      var km = Math.round(office.km / 5) * 5;
      return 'About ' + Math.max(10, km) + ' km';
    }
    function show(name, fromUser) {
      if (!paths[name]) return;
      Object.keys(paths).forEach(function (n) { paths[n].classList.toggle('sel', n === name); });
      var p = paths[name]; p.parentNode.appendChild(p);
      if (select.value !== name) select.value = name;
      var o = nearest(name), inP = D.inPerson.indexOf(name) >= 0;
      card.querySelector('.dc-name').textContent = name;
      var pill = card.querySelector('.pill');
      pill.textContent = inP ? 'In person' : 'Online';
      pill.className = 'pill ' + (inP ? 'pill-in' : 'pill-online');
      card.querySelector('.dc-mode-text').textContent =
        name === 'Vellore' ? 'Our head office is in Katpadi, Vellore.' :
        name === 'Chennai' ? 'Our Chennai office is on 100 Feet Road, Vadapalani.' :
        inP ? 'Visit our ' + (o.key === 'vellore' ? 'Vellore' : 'Chennai') + ' office, or work with us online.' :
        'Documents on WhatsApp or email; visit either office when you prefer.';
      card.querySelector('.dc-office').textContent = o.label;
      card.querySelector('.dc-km').textContent = kmText(name, o);
      var wa = card.querySelector('.dc-wa');
      wa.href = 'https://wa.me/918667753901?text=' + encodeURIComponent('Hello Wealth Bridge, I am in ' + name + ' district and need help with ');
      wa.querySelector('span').textContent = 'WhatsApp us from ' + name;
      if (fromUser !== 'tour' && !reduce) { card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap'); }
    }
    function tipAt(name, evX, evY) {
      var o = nearest(name), inP = D.inPerson.indexOf(name) >= 0;
      tip.innerHTML = esc(name) + '<small>' + (inP ? 'In person · ' : 'Online · ') + 'nearest office ' + esc(o.label.split(' (')[0]) + '</small>';
      var r = fig.getBoundingClientRect();
      tip.style.left = (evX - r.left) + 'px'; tip.style.top = (evY - r.top) + 'px';
      tip.classList.add('show');
    }

    var tourTimer = null, tourIdx = 0, touring = false, inView = false;
    function stopTour() { touring = false; clearInterval(tourTimer); tourTimer = null; if (tourBtn) { tourBtn.setAttribute('aria-pressed', 'false'); tourBtn.querySelector('.tour-label').textContent = 'Tour districts'; } }
    function startTour() {
      if (reduce) return;
      touring = true; clearInterval(tourTimer);
      if (tourBtn) { tourBtn.setAttribute('aria-pressed', 'true'); tourBtn.querySelector('.tour-label').textContent = 'Touring districts'; }
      tourTimer = setInterval(function () {
        if (!inView || document.hidden) return;
        tourIdx = (tourIdx + 1) % D.tour.length; show(D.tour[tourIdx], 'tour');
      }, 2400);
    }

    svg.addEventListener('pointermove', function (ev) {
      var t = ev.target.closest('.d'); if (!t) { tip.classList.remove('show'); return; }
      tipAt(t.dataset.name, ev.clientX, ev.clientY);
    });
    svg.addEventListener('pointerleave', function () { tip.classList.remove('show'); });
    svg.addEventListener('click', function (ev) {
      var t = ev.target.closest('.d'); if (!t) return;
      stopTour(); show(t.dataset.name, true);
    });
    select.addEventListener('change', function () { stopTour(); show(select.value, true); });
    if (tourBtn && !reduce) {
      tourBtn.hidden = false;
      tourBtn.addEventListener('click', function () { touring ? stopTour() : startTour(); });
    }
    show('Vellore');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        inView = en[0].isIntersecting;
        if (inView && !touring && tourTimer === null && !fig.dataset.toured && !reduce) { fig.dataset.toured = '1'; setTimeout(startTour, 2600); }
      }, { threshold: 0.35 }).observe(fig);
    }
  }

  /* ---------- on-page contents highlight (service pages) */
  var toc = document.querySelectorAll('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var map = {};
    toc.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          toc.forEach(function (a) { a.classList.remove('active'); });
          var a = map[en.target.id]; if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) tio.observe(s); });
  }

  /* ---------- enquiry form → WhatsApp */
  var form = document.getElementById('enquiry');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = document.getElementById('f-err');
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var consent = document.getElementById('f-consent').checked;
      var msg = '', field = null;
      if (!name) { msg = 'Enter your name.'; field = form.name; }
      else if (!/^[+0-9 ()-]{8,}$/.test(phone)) { msg = 'Enter a valid phone number.'; field = form.phone; }
      else if (!consent) { msg = 'Tick the consent box so we can contact you.'; field = document.getElementById('f-consent'); }
      [form.name, form.phone].forEach(function (f) { f.removeAttribute('aria-invalid'); });
      if (msg) {
        err.textContent = msg; err.hidden = false;
        if (field && field.type !== 'checkbox') field.setAttribute('aria-invalid', 'true');
        if (field) field.focus();
        return;
      }
      err.hidden = true;
      var text = 'Hello Wealth Bridge,\n' +
        'Name: ' + name + '\nPhone: ' + phone +
        '\nNearest office: ' + form.city.value +
        '\nService: ' + form.service.value +
        (form.message.value.trim() ? '\nDetails: ' + form.message.value.trim() : '');
      window.open('https://wa.me/918667753901?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }
})();
