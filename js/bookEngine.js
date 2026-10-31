/* ============================================================
   bookEngine — state, flip maths, input, history
   Knows nothing about content. main.js supplies that.
   ============================================================ */
(function (global) {
  'use strict';

  /* Turn geometry. A page hinged at the top must rotate POSITIVELY about X so
     its free edge swings toward the viewer before going over — negative sends
     it backwards behind the stack, where perspective shrinks it and the whole
     turn reads as a vertical squash. */
  var TURN   = 174;   // not 180: paper never lies perfectly flat on the pile
  var MID    = 96;    // just past vertical, the point a real page tips over
  var LIFT_Z = 36;    // how far the free edge arcs clear of the stack

  function BookEngine(root, opts) {
    this.root   = root;
    this.sheets = Array.prototype.slice.call(root.querySelectorAll('.sheet'));
    this.pages  = this.sheets.map(function (s) { return s.dataset.page; });
    this.index  = 0;                       // how many sheets are turned
    this.opts   = opts || {};
    this.lift   = this.opts.lift || 14;    // px of z-separation per sheet
    this.flipMs = this.opts.flipMs || 700;
    this.stagger= this.opts.stagger || 85; // riffle delay on multi-page jumps
    this._bind();
    this.layout(false);
  }

  /* One page turning. Three keyframes, because a transition can only run
     straight between two transforms — the middle frame is what lets the edge
     arc out over the pile instead of scything through it. */
  BookEngine.prototype._turn = function (sheet, toTurned, z, order) {
    var base = 'translate3d(0,0,' + z + 'px) ';
    var apex = 'translate3d(0,0,' + (z + LIFT_Z) + 'px) ';
    var flat = { transform: base + 'rotateX(0deg)',          '--shade': 0,    '--curl': 0 };
    var over = { transform: base + 'rotateX(' + TURN + 'deg)', '--shade': 0,    '--curl': 0 };
    var peak = { transform: apex + 'rotateX(' + MID + 'deg)',  '--shade': 0.34, '--curl': 14,
                 offset: toTurned ? 0.64 : 0.36 };

    /* Easing goes on the KEYFRAMES, not the effect. With one curve across the
       whole turn the page cleared the frame in the first third and the rest of
       the duration was dead air — which is what made it feel like a cut rather
       than a turn. Linear overall means the offsets map straight to time, so
       nearly two thirds of it is now spent where the page is actually on
       screen: slow to lift against gravity, quick once it goes over. */
    flat.easing = over.easing = 'cubic-bezier(.42,0,.72,.4)';
    peak.easing = 'cubic-bezier(.3,.66,.4,1)';

    sheet.animate(toTurned ? [flat, peak, over] : [over, peak, flat], {
      duration: this.flipMs,
      delay: order * this.stagger,
      easing: 'linear',
      fill: 'backwards'
    });
  };

  /* Depth. Every sheet sits a little above the one below so the stack has
     thickness, and a turned sheet lifts clear of the pile instead of
     intersecting it — the usual cause of z-fighting in a card stack. */
  BookEngine.prototype.layout = function (animate) {
    var n = this.sheets.length, order = 0;
    this.sheets.forEach(function (sheet, i) {
      var turned = i < this.index;
      var depth  = turned ? (this.index - i) : (i - this.index);
      var z      = turned ? depth * this.lift : -depth * this.lift;
      var was    = sheet.dataset.turned === 'true';

      sheet.style.zIndex = String(turned ? i : n - i);
      sheet.style.setProperty('--depth', (-depth * this.lift) + 'px');
      sheet.classList.toggle('is-flipped', turned);
      sheet.setAttribute('aria-hidden', String(turned));
      var btn = sheet.querySelector('.flutter-zone');
      if (btn) btn.tabIndex = (i === this.index) ? 0 : -1;

      /* Only the sheets whose state actually changed animate, and they go in
         sequence — jumping four pages should riffle, not flip as one slab. */
      if (animate !== false && was !== turned) this._turn(sheet, turned, z, order++);

      sheet.style.transform = 'translate3d(0,0,' + z + 'px) rotateX(' + (turned ? TURN : 0) + 'deg)';
      sheet.dataset.turned  = String(turned);
    }, this);
    this.root.dispatchEvent(new CustomEvent('book:change', {
      detail: { index: this.index, page: this.pages[Math.min(this.index, this.pages.length - 1)] }
    }));
  };

  BookEngine.prototype.goTo = function (index, push, animate) {
    index = Math.max(0, Math.min(index, this.sheets.length - 1));
    if (index === this.index) return;
    this.index = index;
    this.layout(animate);
    if (push !== false) this._push();
  };
  BookEngine.prototype.next = function () { this.goTo(this.index + 1); };
  BookEngine.prototype.prev = function () { this.goTo(this.index - 1); };
  BookEngine.prototype.goToPage = function (name, push, animate) {
    var i = this.pages.indexOf(name);
    if (i > -1) this.goTo(i, push, animate);
  };

  /* A card stack has no URLs of its own, so we give it some. Each turn writes
     a hash; back and forward replay the flips. Without this the whole portfolio
     is one address and nothing is shareable. */
  BookEngine.prototype._push = function () {
    var name = this.pages[this.index];
    if (global.history && global.history.pushState) {
      global.history.pushState({ page: name }, '', '#' + name);
    }
  };

  BookEngine.prototype._bind = function () {
    var self = this;

    this.sheets.forEach(function (sheet, i) {
      var zone = sheet.querySelector('.flutter-zone');
      if (zone) zone.addEventListener('click', function () { self.goTo(i + 1); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { self.next(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { self.prev(); }
    });

    global.addEventListener('popstate', function (e) {
      var name = (e.state && e.state.page) || (location.hash || '').slice(1) || self.pages[0];
      self.goToPage(name, false);
    });

    /* Belt and braces: a hash typed into the bar, or a link the browser treats
       as a plain fragment jump, does not always reach the popstate handler. */
    global.addEventListener('hashchange', function () {
      self.goToPage((location.hash || '').slice(1) || self.pages[0], false);
    });

    /* Wheel and swipe both map to the same axis the pages move on. */
    var acc = 0, lock = false;
    this.root.addEventListener('wheel', function (e) {
      if (lock) return;
      acc += e.deltaY;
      if (Math.abs(acc) > 120) {
        (acc > 0 ? self.next() : self.prev());
        acc = 0; lock = true;
        setTimeout(function () { lock = false; }, 600);
      }
    }, { passive: true });

    var y0 = null;
    this.root.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true });
    this.root.addEventListener('touchend', function (e) {
      if (y0 === null) return;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dy) > 60) (dy < 0 ? self.next() : self.prev());
      y0 = null;
    }, { passive: true });
  };

  global.BookEngine = BookEngine;
}(window));
