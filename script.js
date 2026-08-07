/* Ashborne Partners — shared behavior (unchanged from the original build)
   Every block below checks for its target elements before running, so this
   one file is safe to include on every page even if a section isn't present. */





    /* ── 1. Ambient field ──
       Drifting nodes; an edge is drawn only where two fall close
       enough to relate. Paused when off-screen or when the tab is
       hidden, so it costs nothing when unseen. */
    (function () {
      var cv = document.getElementById('field');
      if (!cv) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      var ctx = cv.getContext('2d');
      var nodes = [];
      var raf = null;
      var running = false;
      var w = 0, h = 0, dpr = 1;

      function size() {
        var host = cv.parentElement;
        if (!host) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = host.offsetWidth;
        h = host.offsetHeight;
        cv.width = w * dpr;
        cv.height = h * dpr;
        cv.style.width = w + 'px';
        cv.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function seed() {
        // Density scales with area but stays modest on phones.
        var n = Math.round(Math.min(Math.max((w * h) / 26000, 22), 62));
        nodes = [];
        for (var i = 0; i < n; i++) {
          nodes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.16,
            vy: (Math.random() - 0.5) * 0.16,
            r: Math.random() * 1.5 + 0.7
          });
        }
      }

      function frame() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);

        var LINK = Math.min(w, h) * 0.17;

        for (var i = 0; i < nodes.length; i++) {
          var a = nodes[i];
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;

          for (var j = i + 1; j < nodes.length; j++) {
            var bn = nodes[j];
            var dx = a.x - bn.x, dy = a.y - bn.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < LINK) {
              var o = (1 - d / LINK) * 0.16;
              ctx.strokeStyle = 'rgba(143,166,142,' + o.toFixed(3) + ')';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(bn.x, bn.y);
              ctx.stroke();
            }
          }

          ctx.fillStyle = 'rgba(143,166,142,0.30)';
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
          ctx.fill();
        }

        raf = requestAnimationFrame(frame);
      }

      function start() {
        if (running) return;
        running = true;
        raf = requestAnimationFrame(frame);
      }
      function stop() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      }

      size(); seed();
      cv.classList.add('on');
      start();

      var rt;
      window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () { size(); seed(); }, 220);
      }, { passive: true });

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });

      // Stop once the hero has scrolled away.
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
        }, { threshold: 0 });
        io.observe(cv);
      }
    })();


    /* ── 2. Search shape ──
       Redraws the ledger for the selected practice. Figures are
       representative funnel shapes, not published placement counts. */
    (function () {
      var btns = document.querySelectorAll('.shape-btn');
      var rows = document.querySelectorAll('.ledger-row');
      var label = document.getElementById('shapeLabel');
      var note = document.getElementById('shapeNote');
      if (!btns.length || !rows.length) return;

      var SHAPES = {
        cro: {
          label: 'CRO &middot; Enterprise SaaS',
          note: 'The narrower the seat, the deeper the read.',
          counts: [1840, 612, 74, 6, 1],
          fills:  [100, 34, 12, 4, 1]
        },
        vp: {
          label: 'VP Sales &middot; Growth Stage',
          note: 'A larger field, and a longer shortlist to earn.',
          counts: [2260, 780, 96, 8, 1],
          fills:  [100, 36, 13, 5, 1]
        },
        ae: {
          label: 'Enterprise AE &middot; Named Accounts',
          note: 'Volume rises; the bar for a first call does not.',
          counts: [3410, 1120, 148, 11, 2],
          fills:  [100, 33, 14, 6, 2]
        },
        sc: {
          label: 'Solutions Consulting &middot; Pre-Sales',
          note: 'The scarcest field we work. Fewer names, read harder.',
          counts: [960, 402, 58, 5, 1],
          fills:  [100, 42, 16, 6, 2]
        }
      };

      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function paint(key) {
        var s = SHAPES[key];
        if (!s) return;

        if (label) label.innerHTML = s.label;
        if (note) {
          note.style.opacity = '0';
          setTimeout(function () {
            note.textContent = s.note;
            note.style.opacity = '';
          }, 200);
        }

        rows.forEach(function (row, i) {
          var countEl = row.querySelector('.ledger-count');
          var barEl = row.querySelector('.ledger-bar span');
          var target = s.counts[i];
          var fill = s.fills[i];
          if (countEl) countEl.setAttribute('data-to', target);
          row.setAttribute('data-fill', fill);

          if (reduce) {
            if (countEl) countEl.textContent = target.toLocaleString();
            if (barEl) barEl.style.width = fill + '%';
            return;
          }

          if (barEl) barEl.style.width = fill + '%';
          if (!countEl) return;

          countEl.classList.add('swap');
          setTimeout(function () {
            var from = parseInt(String(countEl.textContent).replace(/[^0-9]/g, ''), 10) || 0;
            countEl.classList.remove('swap');
            var dur = 620, start = null;
            function step(ts) {
              if (!start) start = ts;
              var p = Math.min((ts - start) / dur, 1);
              var eased = 1 - Math.pow(1 - p, 3);
              countEl.textContent = Math.round(from + (target - from) * eased).toLocaleString();
              if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          }, 180 + i * 45);
        });
      }

      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          paint(b.getAttribute('data-shape'));
        });
      });
    })();

    /* ── Scroll reveal engine ──
       Marks elements, observes them, releases them in reading
       order with a small stagger inside each group. */
    (function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // [selector, stagger step in ms]
      var groups = [
        ['.section-eyebrow', 0],
        ['.about-headline', 0],
        ['.about-body p', 90],
        ['.stat-item', 110],
        ['.practice-headline', 0],
        ['.practice-card', 70],
        ['.industries-headline', 0],
        ['.industries-intro', 0],
        ['.industry-pill', 45],
        ['.intel-headline', 0],
        ['.intel-intro', 0],
        ['.intel-cell', 110],
        ['.intel-note', 0],
        ['.approach-quote', 0],
        ['.approach-body > div', 130],
        ['.proof-headline', 0],
        ['.proof-sub', 0],
        ['.contact-headline', 0],
        ['.contact-body', 0],
        ['.contact-detail', 80],
        ['.coverage-intro', 0],
        ['.coverage-map', 0],
        ['.coverage-pill', 60],
        ['.contact-form .form-group', 70],
        ['.contact-form .btn-primary', 0]
      ];

      var marked = [];

      groups.forEach(function (g) {
        var sel = g[0], step = g[1];
        // Scope each group per-section so staggers restart naturally.
        document.querySelectorAll(sel).forEach(function (el) {
          // Never touch anything already animating in the hero.
          if (el.closest('.hero')) return;
          if (el.classList.contains('js-reveal')) return;
          el.classList.add('js-reveal');
          el.setAttribute('data-stagger', step);
          marked.push(el);
        });
      });

      if (!marked.length) return;

      if (reduce) {
        marked.forEach(function (el) { el.classList.add('is-in'); });
        return;
      }

      // Assign a delay based on position among same-class siblings
      // that share a parent, so a grid staggers but a lone heading
      // does not wait.
      marked.forEach(function (el) {
        var step = parseInt(el.getAttribute('data-stagger'), 10) || 0;
        if (!step) { el.style.setProperty('--reveal-delay', '0ms'); return; }
        var parent = el.parentElement;
        if (!parent) { el.style.setProperty('--reveal-delay', '0ms'); return; }
        var sibs = Array.prototype.filter.call(parent.children, function (c) {
          return c.classList.contains('js-reveal');
        });
        var idx = sibs.indexOf(el);
        el.style.setProperty('--reveal-delay', (Math.max(idx, 0) * step) + 'ms');
      });

      function countUp(el) {
        var target = parseInt(el.getAttribute('data-count-to'), 10);
        if (isNaN(target)) return;
        var suffix = el.getAttribute('data-count-suffix') || '';
        var dur = 1100, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }

      if (!('IntersectionObserver' in window)) {
        marked.forEach(function (el) { el.classList.add('is-in'); });
        document.querySelectorAll('[data-count-to]').forEach(countUp);
        return;
      }

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add('is-in');

          var num = el.querySelector ? el.querySelector('[data-count-to]') : null;
          if (num && !num.hasAttribute('data-counted')) {
            num.setAttribute('data-counted', '1');
            var d = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
            setTimeout(function () { countUp(num); }, d + 120);
          }

          io.unobserve(el);
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

      marked.forEach(function (el) { io.observe(el); });

      // Safety sweep. IntersectionObserver can miss elements when the
      // user scrolls faster than it samples, or jumps via an anchor
      // link. Anything already at or above the fold gets released.
      function sweep() {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        marked.forEach(function (el) {
          if (el.classList.contains('is-in')) return;
          var r = el.getBoundingClientRect();
          if (r.top < vh * 0.95) {
            el.classList.add('is-in');
            var num = el.querySelector && el.querySelector('[data-count-to]');
            if (num && !num.hasAttribute('data-counted')) {
              num.setAttribute('data-counted', '1');
              countUp(num);
            }
            io.unobserve(el);
          }
        });
      }

      var ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { sweep(); ticking = false; });
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      window.addEventListener('hashchange', function () { setTimeout(sweep, 60); });
      window.addEventListener('load', function () { setTimeout(sweep, 80); });
      sweep();
    })();

    /* Search ledger: count up + bar fill, once, on load. */
    (function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var rows = document.querySelectorAll('.ledger-row');
      if (!rows.length) return;

      function run() {
        rows.forEach(function (row, i) {
          var countEl = row.querySelector('.ledger-count');
          var barEl = row.querySelector('.ledger-bar span');
          var target = parseInt(countEl.getAttribute('data-to'), 10) || 0;
          var fill = row.getAttribute('data-fill') || '0';
          var delay = 220 * i;

          if (reduce) {
            countEl.textContent = target.toLocaleString();
            barEl.style.width = fill + '%';
            return;
          }

          setTimeout(function () {
            barEl.style.width = fill + '%';
            var dur = 900, start = null;
            function step(ts) {
              if (!start) start = ts;
              var p = Math.min((ts - start) / dur, 1);
              var eased = 1 - Math.pow(1 - p, 3);
              countEl.textContent = Math.round(target * eased).toLocaleString();
              if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          }, delay);
        });
      }

      var wrap = document.querySelector('.ledger-wrap');
      var fired = false;
      function trigger() {
        if (fired) return;
        fired = true;
        if (wrap) wrap.classList.add('in');
        setTimeout(run, 260);
      }
      if (!wrap) return;
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { trigger(); io.disconnect(); } });
        }, { threshold: 0.35 });
        io.observe(wrap);
      } else {
        trigger();
      }
    })();

    // Scroll handling:
    //  - Fresh visit / reload with no hash  -> start at the top.
    //  - Anchor link (e.g. #practice)        -> jump to that section.
    //  - Back/forward navigation             -> let the browser restore
    //    the exact position you were at (so returning from a practice
    //    page lands you back where you clicked, not at the top).
    (function () {
      if (!('scrollRestoration' in history)) return;

      // Detect whether this pageview is a back/forward navigation.
      function isBackForward() {
        var nav = performance.getEntriesByType &&
                  performance.getEntriesByType('navigation')[0];
        if (nav && nav.type) return nav.type === 'back_forward';
        // Fallback for older browsers
        if (performance.navigation) return performance.navigation.type === 2;
        return false;
      }

      if (isBackForward()) {
        // Browser will restore the previous scroll position itself.
        history.scrollRestoration = 'auto';
      } else {
        history.scrollRestoration = 'manual';
        window.addEventListener('load', function () {
          if (!window.location.hash) window.scrollTo(0, 0);
        });
      }
    })();

    (function () {
      var toggle = document.getElementById('navToggle');
      var links = document.getElementById('navLinks');
      if (!toggle || !links) return;

      function closeMenu() {
        links.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }

      toggle.addEventListener('click', function () {
        var isOpen = links.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeMenu);
      });
    })();
  </script>

