/* ============================================================
   bookEngine — state, turn geometry, pose, input, history
   Knows nothing about content. main.js supplies that.

   Side-bound. A leaf is hinged on its LEFT edge, which is the spine at the
   book's centre: rotateY(0) rests it on the right half, rotateY(-180deg) on
   the left. N leaves give N+1 states, because the shut book counts twice --
   shut on the front cover (index 0) and shut on the back (index N).

   Index 0 is the LANDING, not a section. It has no route and no tab; the
   route for state k comes from leaf k-1's data-opens, which is to say "the
   section that turning this leaf reveals".
   ============================================================ */
(function (global) {
  'use strict';

  var LIFT     = 2;     // px of z-separation between leaves in a pile
  var ARC      = 26;    // how far a turning leaf rises clear of the stack
  var ARC_STEP = 9;     // extra arc per leaf in a riffle, so they cannot z-fight
  var STAGGER  = 120;   // delay between successive leaves in a riffle
  var APPROACH = 620;   // the book coming at you: scale + slide
  var STANDUP  = 280;   // the book tilting up off the desk
  var TURN     = 620;   // one leaf going over
  var LEAD     = 0;     // head start for the book over the page
  var SETTLE   = 200;   // on closing, the page lands and the book follows it down
  /* The shut book as a fraction of the open one. A FRACTION, not an absolute
     scale: the previous version used 1.0 shut and a fitted scale open, which
     meant that on any viewport where the fit came out below 1 -- 1024x768 and
     everything narrower -- the book SHRANK as it opened. Measured 0.978 at
     1024x768 and 0.900 at 768x1024. Expressed as a ratio the approach is the
     same gesture at every size. */
  var SHUT_K   = 0.65;
  var MIN_FIT  = 0.30;
  var MAX_FIT  = 1.45;

  /* All of the above are overridable from the query string, which is how the
     timing was dialled in the greybox and how it gets re-dialled if the feel
     ever drifts: ?approach=620&standup=280&turn=620&stagger=120&lead=0&settle=200 */
  var Q = new URLSearchParams(global.location.search);
  function q(k, d) { var v = parseInt(Q.get(k), 10); return isNaN(v) ? d : v; }
  STAGGER  = q('stagger',  STAGGER);
  ARC_STEP = q('arcstep',  ARC_STEP);
  APPROACH = q('approach', APPROACH);
  STANDUP  = q('standup',  STANDUP);
  TURN     = q('turn',     TURN);
  LEAD     = q('lead',     LEAD);
  SETTLE   = q('settle',   SETTLE);

  function BookEngine(root, opts) {
    this.root   = root;                     // #book
    this.pos    = root.parentElement;        // #bookpos -- carries the approach
    this.stage  = root.closest('.stage');
    this.shadow = this.stage.querySelector('.shadow');
    this.leaves = Array.prototype.slice.call(root.querySelectorAll('.leaf'));
    this.N      = this.leaves.length;
    /* Index 0 is the shut book and has no route of its own. */
    this.pages  = [''].concat(this.leaves.map(function (l) { return l.dataset.opens || ''; }));
    this.index  = 0;
    this.opts   = opts || {};
    this.reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._posedShut  = true;    // what the book's pose currently IS
    this._blockTimers = [];

    this._bind();
    this.layout(false);

    /* Everything _calibrate measures hangs off the stage's height, and the
       stage's height hangs off the bar above it -- which is set in Rock Salt
       and changes height the moment the webfont lands. Calibrating at boot
       therefore measures a layout that is about to change. The ResizeObserver
       catches a later window resize but not this, so it is caught explicitly.
       Harmless if the font was already cached: the numbers just come out the
       same. */
    var self = this;
    if (global.document.fonts && global.document.fonts.ready) {
      global.document.fonts.ready.then(function () {
        self._calibrate();
        self._placeShadow(self._posedShut);
      });
    }
  }

  /* How big the OPEN book gets. Measured against the stage rather than fixed,
     so a 27" monitor gets a genuinely large spread and a laptop gets what it
     can fit. offsetWidth/Height are LAYOUT sizes, untouched by the transform,
     so this cannot feed back on itself.

     The gutter is measured off the tab column rather than guessed, so a longer
     tab label cannot end up sitting on top of the book. It is reserved on both
     sides, which keeps the book optically centred. */
  BookEngine.prototype.fitScale = function () {
    var r    = this.stage.getBoundingClientRect();
    var pw   = this.root.offsetWidth / 2;    // the element is two pages wide
    var ph   = this.root.offsetHeight;
    if (!pw || !ph) return 1;
    var tabs = this.stage.querySelector('.tabs');
    var gut  = tabs ? tabs.offsetWidth + 28 : 24;
    /* 0.96, not 0.94. The margin used to be absorbing the vertical drift
       described in _calibrate as well as doing its own job; now that the
       drift is corrected the margin only has to cover the perspective's
       effect on HEIGHT, which is small -- measured growth is 0.996 of the
       flat height at a 10deg tilt. */
    var k    = Math.min((r.width - gut * 2) / (pw * 2), (r.height * 0.96) / ph);
    k = Math.max(MIN_FIT, Math.min(k, MAX_FIT));
    return Math.round(k * 1000) / 1000;
  };

  /* ---------- where the ground shadow goes ----------
     The shadow has to sit under the book's RENDERED bottom edge, and that edge
     cannot be derived from the book's size: it is the result of rotateX, the
     scale, and a perspective projection about an origin at 42% of the STAGE's
     height. Change the stage's height and the origin moves relative to the
     book, so the projected edge moves too. Fixed percentages were tried and
     drifted -- correct at 1440x900, 66px out at 1024x768.

     So it is measured rather than modelled, once per pose, and cached. The
     measurement runs with transitions suppressed and entirely within one task,
     so no frame is ever painted in the probe pose and none of it is visible.
     The result is in UNSCALED px, because --shy is applied inside the scale. */
  BookEngine.prototype._calibrate = function () {
    var wasBooting = this.stage.classList.contains('is-booting');
    var wasOpen    = this.root.classList.contains('is-open');
    var prevScale  = this.stage.style.getPropertyValue('--scale');
    var prevVoff   = this.pos.style.getPropertyValue('--voff');
    this.stage.classList.add('is-booting');

    var fit = this.fitScale();
    var self = this;

    function probe(openPose) {
      var sc = openPose ? fit : Math.round(fit * SHUT_K * 1000) / 1000;
      self.stage.style.setProperty('--scale', sc);
      self.root.classList.toggle('is-open', openPose);

      /* Recentring is ITERATED to convergence rather than solved, because the
         gain is not quite 1. A Y translation moves every point of the book by
         the same layout amount, but each point's PROJECTED movement is scaled
         by d/(d-z), and z varies across a tilted book -- the near edge moves
         further than the far one. The bounding box's centre therefore moves by
         a weighted average that is close to --scale but not equal to it.

         Close enough that it converges in two or three passes; fixed enough
         that a single divide overshot by 25px when this was first written. The
         loop stops on the measurement, not on a pass count. */
      var voff = 0, b, r, drift, i;
      for (i = 0; i < 5; i++) {
        self.pos.style.setProperty('--voff', voff.toFixed(2) + 'px');
        b = self.root.getBoundingClientRect();
        r = self.stage.getBoundingClientRect();
        drift = (b.top + b.height / 2) - (r.top + r.height / 2);
        if (Math.abs(drift) < 0.5) break;
        voff -= drift / sc;
      }

      /* The shadow is measured AFTER the recentre, or it would be placed
         under where the book used to be. */
      b = self.root.getBoundingClientRect();
      r = self.stage.getBoundingClientRect();
      /* How far the bottom edge falls below the stage centre, de-scaled. The
         8px tuck is taken off in the same unscaled space so it grows and
         shrinks with the book instead of staying a fixed screen gap. */
      return { voff: voff, shy: (b.bottom - (r.top + r.height / 2)) / sc - 8 };
    }

    var open = probe(true), shut = probe(false);
    this._voffOpen = open.voff; this._shyOpen = open.shy;
    this._voffShut = shut.voff; this._shyShut = shut.shy;

    /* Put everything back exactly as it was before anything can paint. */
    this.root.classList.toggle('is-open', wasOpen);
    if (prevScale) this.stage.style.setProperty('--scale', prevScale);
    else this.stage.style.removeProperty('--scale');
    if (prevVoff) this.pos.style.setProperty('--voff', prevVoff);
    else this.pos.style.removeProperty('--voff');
    if (!wasBooting) this.stage.classList.remove('is-booting');
  };

  /* Both measured offsets are applied together, because they come from the
     same projection and must never disagree about where the book is. */
  BookEngine.prototype._placeShadow = function (shut) {
    if (this._shyShut === undefined) this._calibrate();
    this.pos.style.setProperty('--voff',
      Math.round(shut ? this._voffShut : this._voffOpen) + 'px');
    if (!this.shadow) return;
    var y = shut ? this._shyShut : this._shyOpen;
    this.shadow.style.setProperty('--shsc', shut ? 0.55 : 1);
    this.shadow.style.setProperty('--shy', Math.round(y) + 'px');
  };

  /* z-index is IGNORED inside preserve-3d -- depth decides paint order AND
     hit-testing. Ordering here is done entirely with translateZ and never with
     z-index, which is the trap the spiral build kept falling into. */
  BookEngine.prototype._zFor = function (i, turned) {
    return turned ? i * LIFT                    // left pile: last turned on top
                  : (this.N - 1 - i) * LIFT;    // right pile: next to turn on top
  };
  BookEngine.prototype._tf = function (i, turned) {
    return 'translateZ(' + this._zFor(i, turned) + 'px) rotateY(' + (turned ? -180 : 0) + 'deg)';
  };

  BookEngine.prototype.layout = function (animate) {
    var self = this;
    var shut = (this.index === 0 || this.index === this.N);
    var turning = this.leaves.some(function (l, i) {
      return (l.dataset.turned === 'true') !== (i < self.index);
    });
    var moving = (animate !== false) && turning && !this.reduced;

    /* Simultaneous. Opening: the book and the page leave together (LEAD is a
       tunable head start, zero by default -- the looming is handled by
       splitting the approach from the stand-up in CSS, not by delaying).
       Closing: the page lands first and the book follows it down. Turning
       between two open spreads changes no pose at all, so both are zero and it
       is a single movement either way. */
    var leafDelay = (moving && this._posedShut && !shut) ? LEAD   : 0;
    var poseDelay = (moving && !this._posedShut && shut) ? SETTLE : 0;

    /* Which leaves move, and in what order they leave. Forwards, the front
       cover goes first; backwards, the leaf nearest the spine on the left goes
       first. A leaf that is becoming turned tells us which way we are going
       without having to remember the previous index.

       A jump of more than one spread RIFFLES: the leaves leave in succession
       rather than in lockstep, several in the air at once. Turned together they
       read as one thick slab, and a slab flipping once is over as fast as a
       single page -- which is why About to Contact felt instant despite moving
       four leaves. */
    var order = {};
    var queue = [];
    this.leaves.forEach(function (l, i) {
      if ((l.dataset.turned === 'true') !== (i < self.index)) queue.push(i);
    });
    var forward = queue.length ? (queue[0] < this.index) : true;
    if (!forward) queue.reverse();
    queue.forEach(function (i, k) { order[i] = k; });

    this.leaves.forEach(function (leaf, i) {
      var turned = i < self.index;
      var was    = leaf.dataset.turned === 'true';
      var to     = self._tf(i, turned);
      var k      = order[i] || 0;

      if (animate !== false && was !== turned && !self.reduced) {
        /* Three keyframes, not two. A straight interpolation drags the leaf
           THROUGH the other pile; the middle frame lifts it clear, which is
           also what makes the turn read as paper rather than as a hinge.
           ARC_STEP lifts each successive leaf in a riffle higher than the
           last, so overlapping leaves cannot z-fight at their apexes and they
           land on the pile in the right order. */
        var top = Math.max(self._zFor(i, true), self._zFor(i, false)) + ARC + k * ARC_STEP;
        /* Easing goes on the SEGMENTS, not on the animation. One easing across
           the whole thing moves the 50% keyframe off the 50% mark in TIME --
           measured, the leaf hit 90deg at ~230ms of 760 and then took the
           remaining 530ms to lower the last 90deg. It whipped, then crept, and
           the creep read as a second page coming down. Linear overall puts
           edge-on at exactly half time; the two curves give the lift and the
           landing their own shapes. */
        leaf.animate([
          { transform: self._tf(i, was), easing: 'cubic-bezier(.45,0,.75,.5)' },
          { transform: 'translateZ(' + top + 'px) rotateY(-90deg)', offset: 0.5,
            easing: 'cubic-bezier(.25,.5,.55,1)' },
          { transform: to }
        ], { duration: TURN, delay: leafDelay + k * STAGGER,
             easing: 'linear', fill: 'backwards' });
      }
      leaf.style.transform = to;
      leaf.dataset.turned  = String(turned);
      /* A turned leaf's pages are behind the reader. Hiding them keeps the
         tab order and the screen-reader pass to the spread actually on show,
         which is also what stops a hidden .plate taking a Tab stop. */
      Array.prototype.forEach.call(leaf.querySelectorAll('.face'), function (f) {
        var visible = f.classList.contains('face--verso') ? turned : !turned;
        f.setAttribute('aria-hidden', String(!visible));
        Array.prototype.forEach.call(
          f.querySelectorAll('a, button, [tabindex]'),
          function (el) { el.tabIndex = visible ? 0 : -1; });
      });
    });

    this.root.classList.toggle('is-open', !shut);

    /* The blocks flip at a crossover, MID-TURN -- see the stylesheet. Each
       side's flag belongs to one specific leaf: the left block appears or
       vanishes when the FRONT cover passes 90deg, the right one when the BACK
       cover does. In a riffle those are different moments, so they get their
       own timers rather than one shared with whatever leaf happened to be
       last. */
    this._blockTimers.forEach(clearTimeout);
    this._blockTimers.length = 0;
    function cross(i) { return leafDelay + (order[i] || 0) * STAGGER + TURN * 0.5; }
    function flip(cls, on, i) {
      if (moving && (i in order)) {
        self._blockTimers.push(setTimeout(function () {
          self.root.classList.toggle(cls, on);
        }, cross(i)));
      } else {
        self.root.classList.toggle(cls, on);
      }
    }
    flip('is-shut-front', this.index === 0, 0);
    flip('is-shut-back',  this.index === this.N, this.N - 1);

    /* Shut on the front -> everything is stacked right, so slide left to
       centre the visible object. Shut on the back -> stacked left, slide right.
       Set on the STAGE, not on .book: the slide lives on .book-pos, which is
       .book's PARENT, and custom properties only cascade downwards. */
    var fit = this.fitScale();
    this.stage.style.setProperty('--shift', this.index === 0 ? -1 : (this.index === this.N ? 1 : 0));
    this.stage.style.setProperty('--scale', shut ? Math.round(fit * SHUT_K * 1000) / 1000 : fit);
    this.stage.style.setProperty('--posedelay', poseDelay + 'ms');
    this.stage.style.setProperty('--standup', STANDUP + 'ms');
    /* The book's own move spans the WHOLE riffle, however many leaves are in
       it. Left at a fixed length it finished 360ms before the last page landed
       on a four-leaf jump -- the book arriving while pages are still in the air
       is the same desync that made the open feel wrong. */
    var span = queue.length > 1 ? (queue.length - 1) * STAGGER : 0;
    this.stage.style.setProperty('--approach', (APPROACH + span) + 'ms');
    /* Measured per pose, not guessed -- see _calibrate. Set to the TARGET pose's
       value at the start of the move, so the shadow travels with the book on
       the same transition instead of being corrected after it lands. */
    this._placeShadow(shut);
    this._posedShut = shut;

    this.root.dispatchEvent(new CustomEvent('book:change', {
      detail: { index: this.index, page: this.pages[this.index], total: this.N + 1 }
    }));
  };

  BookEngine.prototype.goTo = function (index, push, animate) {
    index = Math.max(0, Math.min(index, this.N));
    if (index === this.index) return;
    /* Any deliberate move means the boot suppression has done its job. */
    this.stage.classList.remove('is-booting');
    this.root.classList.remove('is-fresh');
    this.index = index;
    this.layout(animate);
    if (push !== false) this._push();
  };
  BookEngine.prototype.next = function () { this.goTo(this.index + 1); };
  BookEngine.prototype.prev = function () { this.goTo(this.index - 1); };
  BookEngine.prototype.goToPage = function (name, push, animate) {
    var i = name ? this.pages.indexOf(name) : 0;
    if (i > -1) this.goTo(i, push, animate);
  };

  /* A book has no URLs of its own, so we give it some. Each spread writes a
     hash; back and forward replay the turns. Without this the whole portfolio
     is one address and nothing is shareable.
     The cover has no route, so it gets the bare path rather than an empty "#",
     which would otherwise leave a dangling fragment in the bar. */
  BookEngine.prototype._push = function () {
    if (!global.history || !global.history.pushState) return;
    var name = this.pages[this.index];
    global.history.pushState(
      { page: name, i: this.index }, '',
      name ? '#' + name : global.location.pathname + global.location.search);
  };

  BookEngine.prototype._bind = function () {
    var self = this;

    /* Clicking the book. Shut, this is the whole affordance -- the cover is an
       invitation and anywhere on it opens the book. Open, a click still turns
       the page, EXCEPT on anything interactive: the pages now carry case-study
       plates and art pieces, and without this guard every click meant to open
       a card would also turn the spread out from under it. */
    this.root.addEventListener('click', function (e) {
      if (self.opts.blocked && self.opts.blocked()) return;
      if (e.target.closest('a, button, [tabindex], input, select, textarea')) return;
      self.next();
    });

    /* On the document, so it fires even when something else is on top. An open
       card would otherwise riffle the book behind itself. The engine is not
       told what a card is -- the owner passes a predicate, and this file stays
       ignorant of content as advertised above. */
    document.addEventListener('keydown', function (e) {
      /* blocked() is not enough on its own for a key the card also handles.
         Both listeners sit on document, and the card's runs first and closes
         SYNCHRONOUSLY -- so by the time this one asks whether a card is open,
         the answer has already flipped to no and one Escape would close the
         card and shut the book together. The card marks what it consumed with
         preventDefault, so that is what gets honoured here. */
      if (e.defaultPrevented) return;
      if (self.opts.blocked && self.opts.blocked()) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') self.next();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   self.prev();
      /* Escape shuts the book, the same thing clicking the surface does.
         The blocked() guard above is what gives it the right precedence
         without either file knowing about the other: while a card is up the
         engine ignores Escape entirely and the card's own handler takes it,
         so one press closes the card and a second shuts the book. Guarded on
         index so Escape on an already-shut book does not push history. */
      if (e.key === 'Escape' && self.index !== 0) { self.goTo(0); e.preventDefault(); }
    });

    global.addEventListener('popstate', function (e) {
      var i = (e.state && typeof e.state.i === 'number') ? e.state.i : null;
      if (i === null) {
        var h = (global.location.hash || '').slice(1).split('/')[0];
        i = h ? self.pages.indexOf(h) : 0;
      }
      if (i < 0) i = 0;
      self.index = Math.max(0, Math.min(i, self.N));
      self.layout(true);
    });

    /* Belt and braces: a hash typed into the bar, or a link the browser treats
       as a plain fragment jump, does not always reach the popstate handler. */
    global.addEventListener('hashchange', function () {
      var h = (global.location.hash || '').slice(1).split('/')[0];
      var i = h ? self.pages.indexOf(h) : 0;
      if (i < 0 || i === self.index) return;
      self.index = i;
      self.root.classList.remove('is-fresh');
      self.layout(true);
    });

    /* Wheel and swipe both map to the axis the pages move on. Bound to the
       stage rather than the book: the book is a small target when shut, and a
       scroll aimed just past its edge should still turn the page. */
    var acc = 0, lock = false;
    this.stage.addEventListener('wheel', function (e) {
      if (lock) return;
      if (self.opts.blocked && self.opts.blocked()) return;
      acc += e.deltaY;
      if (Math.abs(acc) > 110) {
        (acc > 0 ? self.next() : self.prev());
        acc = 0; lock = true;
        setTimeout(function () { lock = false; }, TURN - 100);
      }
    }, { passive: true });

    /* Horizontal, because the pages now move sideways. A side-bound book swipes
       left and right; the old top-bound pad swiped up and down. */
    var x0 = null;
    this.stage.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX;
    }, { passive: true });
    this.stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      if (!(self.opts.blocked && self.opts.blocked())) {
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 60) (dx < 0 ? self.next() : self.prev());
      }
      x0 = null;
    }, { passive: true });

    /* The open size is viewport-dependent, so it has to be recomputed when the
       window changes -- otherwise dragging a window smaller leaves the spread
       overflowing its stage. Observe the stage itself rather than listening for
       resize, which misses everything else that changes the box: fonts
       swapping in, a pane being dragged, the device rotating. */
    if (global.ResizeObserver) {
      new ResizeObserver(function () {
        var shut = (self.index === 0 || self.index === self.N);
        var fit  = self.fitScale();
        self.stage.style.setProperty('--scale',
          shut ? Math.round(fit * SHUT_K * 1000) / 1000 : fit);
        /* The projected bottom edge depends on the stage's height, so a resize
           invalidates both cached offsets. */
        self._calibrate();
        self._placeShadow(shut);
      }).observe(this.stage);
    }
  };

  global.BookEngine = BookEngine;
}(window));
