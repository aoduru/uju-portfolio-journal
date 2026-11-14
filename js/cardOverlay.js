/* ============================================================
   cardOverlay — the lifted card that case studies and art open into
   One behaviour, used twice. bookEngine owns the book; this owns the
   card; main.js introduces them.
   ============================================================ */
(function (global) {
  'use strict';

  var FLY_MS   = 420;
  var FADE_MS  = 220;
  var reduced  = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The card flies from the plate's box to its own. Three keyframes, not two:
     the middle one keeps the 3D tilt the plate had under the cursor, so the
     card reads as the same object peeling off the page and flattening out
     rather than a rectangle that merely grew. */
  function flyFrames(from, to) {
    var dx = (from.left + from.width  / 2) - (to.left + to.width  / 2);
    var dy = (from.top  + from.height / 2) - (to.top  + to.height / 2);
    var sx = from.width / to.width, sy = from.height / to.height;
    var mid = function (v) { return v + (1 - v) * 0.55; };
    return [
      { offset: 0, opacity: 0.2,
        transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) ' +
                   'scale(' + sx + ',' + sy + ') perspective(900px) rotate3d(1,-1,0,24deg)' },
      { offset: 0.45, opacity: 0.9,
        transform: 'translate(-50%,-50%) translate(' + (dx * 0.4) + 'px,' + (dy * 0.4) + 'px) ' +
                   'scale(' + mid(sx) + ',' + mid(sy) + ') perspective(900px) rotate3d(1,-1,0,10deg)' },
      { offset: 1, opacity: 1,
        transform: 'translate(-50%,-50%) scale(1) perspective(900px) rotate3d(1,-1,0,0deg)' }
    ];
  }

  var FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

  function CardOverlay(cfg) {
    this.card   = document.getElementById(cfg.card);
    this.scrim  = document.getElementById(cfg.scrim);
    this.body   = document.getElementById(cfg.body);
    this.closeB = document.getElementById(cfg.close);
    this.key    = null;    // 'case-studies/portal-redux' while open
    this.source = null;    // the plate it came from, to restore and refocus
    this.prevFocus = null;
    this._bind();
  }

  CardOverlay.prototype.isOpen = function () { return this.key !== null; };

  /* ---------- building a card body ----------
     Case studies: the text already exists in the markup next to its plate, so
     it is cloned rather than rebuilt. Art: the piece shown large IS the
     content, and the card carries the title and nothing else. */
  CardOverlay.prototype._caseBody = function (btn) {
    var src = document.getElementById('case-' + btn.dataset.case);
    if (!src) return null;
    var frag = document.createDocumentFragment();
    var h = document.createElement('h2');
    h.className = 'insert__title';
    h.id = 'insertTitle';
    h.textContent = btn.querySelector('.plate__title').textContent;
    frag.appendChild(h);
    var clone = src.cloneNode(true);
    clone.removeAttribute('hidden');
    clone.removeAttribute('id');
    frag.appendChild(clone);
    return frag;
  };

  CardOverlay.prototype._artBody = function (btn) {
    var frag = document.createDocumentFragment();
    var thumb = btn.querySelector('.art-piece__shot');
    var alt = thumb.getAttribute('alt') || '';

    /* The card swaps the thumbnail for the full-size file, so the grid stays
       cheap: 25 thumbnails are ~620KB together, and the ~180KB original is
       only fetched when someone actually asks to see the piece. */
    var img = document.createElement('img');
    img.className = 'insert__art';
    img.src = thumb.getAttribute('src').replace('/thumb/', '/display/');
    img.alt = alt;
    frag.appendChild(img);

    /* No caption, by decision -- the piece shown large is the content. The
       dialog still needs a name, so the alt text labels it for screen
       readers without putting a wall label on the page. */
    var h = document.createElement('h2');
    h.className = 'sr-only';
    h.id = 'insertTitle';
    h.textContent = alt;
    frag.appendChild(h);
    return frag;
  };

  /* ---------- open ---------- */
  CardOverlay.prototype.open = function (btn, opts) {
    opts = opts || {};
    if (this.isOpen()) this.close(true);

    var isCase = !!btn.dataset.case;
    var slug   = isCase ? btn.dataset.case : btn.dataset.art;
    var body   = isCase ? this._caseBody(btn) : this._artBody(btn);
    if (!body) return;

    this.body.innerHTML = '';
    this.body.appendChild(body);
    this.card.classList.toggle('insert--art', !isCase);

    this.prevFocus = document.activeElement;
    this.source = btn;
    btn.classList.add('is-source');
    this.key = (isCase ? 'case-studies/' : 'art/') + slug;

    this.scrim.hidden = false;
    this.card.hidden  = false;
    this.card.setAttribute('aria-labelledby', 'insertTitle');

    if (!reduced && opts.animate !== false) {
      var from = btn.getBoundingClientRect();
      var to   = this.card.getBoundingClientRect();
      try { this.card.animate(flyFrames(from, to), { duration: FLY_MS, easing: 'cubic-bezier(.22,.7,.3,1)' }); }
      catch (err) { /* no WAAPI: the card is already in place and visible */ }
      try { this.scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FLY_MS, easing: 'ease-out' }); }
      catch (err) {}
    }

    this.closeB.focus();
    if (opts.push !== false) this._push();
  };

  /* ---------- close ----------
     Teardown used to hang off anim.onfinish alone. If the animation never
     finished -- a cancelled effect, a throttled background tab, reduced
     motion -- the card stayed up with no way out. So the teardown is
     idempotent and three things call it: finish, cancel, and a timeout that
     fires regardless. */
  CardOverlay.prototype.close = function (immediate) {
    if (!this.isOpen()) return;
    var self = this, card = this.card, scrim = this.scrim;
    var src = this.source, prev = this.prevFocus;

    this.key = null;
    this.source = null;
    this.prevFocus = null;

    var done = false;
    function teardown() {
      if (done) return;
      done = true;
      card.hidden = true;
      scrim.hidden = true;
      self.body.innerHTML = '';
      if (src) src.classList.remove('is-source');
      if (prev && prev.isConnected) prev.focus();
    }

    if (immediate || reduced) { teardown(); return; }
    try {
      var a = card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-in' });
      a.onfinish = teardown;
      a.oncancel = teardown;
      scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-in' });
    } catch (err) { /* no WAAPI: the timeout below still closes it */ }
    setTimeout(teardown, FADE_MS + 40);
  };

  /* ---------- history ----------
     Making Back close the card gives deep links for free: every case study
     and every piece gets an address someone can be sent. */
  CardOverlay.prototype._push = function () {
    if (!global.history || !global.history.pushState) return;
    /* The entry underneath has to be a real "card closed" state, or Back from
       a card opened on a fresh load walks off the site instead of closing it.
       Its hash is the PAGE, not whatever is in the bar: on a deep link the bar
       already reads "#case-studies/forty-tickets", and reusing that would leave
       two entries claiming the card is open, so Back closed nothing. */
    var page = String(this.key).split('/')[0];
    if (!history.state || history.state.card === undefined) {
      history.replaceState({ card: null }, '', '#' + page);
    }
    history.pushState({ card: this.key }, '', '#' + this.key);
  };

  CardOverlay.prototype.openBySlug = function (page, slug, opts) {
    var sel = page === 'art'
      ? '.art-piece[data-art="' + slug + '"]'
      : '.plate[data-case="' + slug + '"]';
    var btn = document.querySelector(sel);
    if (btn) this.open(btn, opts);
    return !!btn;
  };

  CardOverlay.prototype._bind = function () {
    var self = this;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.plate, .art-piece');
      if (btn) { self.open(btn); return; }
      if (e.target === self.scrim) self.close();
    });

    this.closeB.addEventListener('click', function () { self._dismiss(); });

    document.addEventListener('keydown', function (e) {
      if (!self.isOpen()) return;
      if (e.key === 'Escape') { self._dismiss(); e.preventDefault(); return; }
      if (e.key === 'Tab') self._trap(e);
    });

    global.addEventListener('popstate', function (e) {
      var wants = e.state && e.state.card;
      if (!wants) { if (self.isOpen()) self.close(); return; }
      if (wants === self.key) return;
      var parts = String(wants).split('/');
      self.openBySlug(parts[0], parts[1], { push: false });
    });
  };

  /* A close the USER asked for rewinds history, so the card's entry does not
     linger in front of the page it came from. A close driven BY popstate must
     not, or the two fight. */
  CardOverlay.prototype._dismiss = function () {
    var hadEntry = global.history && history.state && history.state.card;
    this.close();
    if (hadEntry) history.back();
  };

  CardOverlay.prototype._trap = function (e) {
    var items = this.card.querySelectorAll(FOCUSABLE);
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus();  e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  };

  global.CardOverlay = CardOverlay;
}(window));
