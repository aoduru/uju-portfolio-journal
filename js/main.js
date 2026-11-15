/* ============================================================
   main — starts the engine and the card, keeps the chrome in sync

   The spiral lives here no longer. A side-bound book has no coil, so
   spiral(), coilPaths(), buildPaper(), BAND_W and syncBandHeight() went with
   it -- roughly 120 lines, plus the SVG wobble filters in the markup. The
   paper no longer bends either: a leaf turning about the spine is a rigid
   rectangle, and the band chain existed only to curve a sheet hinged at the
   top. buildFace() is gone too; .face__flat is authored in the HTML now,
   because there is nothing left for JS to decide about it.
   ============================================================ */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var book  = document.getElementById('book');

  /* ---------- engine and card ---------- */
  var card = new CardOverlay({
    card:  'insert',
    scrim: 'scrim',
    body:  'insertBody',
    close: 'insertClose'
  });
  var engine = new BookEngine(book, {
    blocked: function () { return card.isOpen(); }
  });
  window.book = engine;
  window.card = card;

  /* ---------- the tabs, and the wordmark ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-goto]'));
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      engine.goToPage(a.dataset.goto);
    });
  });

  /* The cover has no tab, so the wordmark is what points at it. */
  var home = document.getElementById('home');
  if (home) home.addEventListener('click', function () { engine.goTo(0); });

  /* Click the surface around the book to shut it. The book sits on a desk, so
     clicking the desk to put it down is behaviour people already expect -- and
     it means getting out never requires finding a control.
     Checked against #bookpos rather than #book: a click on the book itself
     bubbles up to here, and without this the book would turn a page AND close
     on the same click. The tabs live inside the stage too, so they are excluded
     as well, or jumping to a section would immediately undo itself. */
  stage.addEventListener('click', function (e) {
    if (card.isOpen()) return;
    if (e.target.closest('#bookpos, #tabs')) return;
    engine.goTo(0);
  });

  /* ---------- "where am I" ----------
     The book's own edges do not answer that, and position being legible is one
     of the four things that keep an unhurried book from becoming a maze.
     Labels come off the tabs that are already in the DOM, so the engine stays
     content-free and there is one list of section names, not two. */
  var LABELS = { '': 'Cover' };
  links.forEach(function (a) {
    if (a.dataset.goto) LABELS[a.dataset.goto] = a.textContent.trim();
  });
  var where = document.getElementById('where');

  book.addEventListener('book:change', function (e) {
    var page = e.detail.page;
    links.forEach(function (a) {
      if (a.dataset.goto === page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (where) {
      where.textContent = (LABELS[page] || 'Cover') +
                          '  ·  ' + (e.detail.index + 1) + ' / ' + e.detail.total;
    }
  });

  /* ---------- deep link on load ----------
     A card's address is "<page>/<slug>", so the hash is split: the book jumps
     to the spread without animating, then the card opens on top of it. That is
     what makes a single case study linkable. */
  var start = (location.hash || '').slice(1);
  if (start) {
    var parts = start.split('/');
    engine.goToPage(parts[0], false, false);
    if (parts[1]) card.openBySlug(parts[0], parts[1], { animate: false });
  }

  /* ---------- deep link while already here ----------
     The block above only runs at load, and the card's own popstate handler
     only runs on Back and Forward, so pasting "#art/<slug>" into the bar of a
     page that is ALREADY open moved the book and left the card shut. The
     engine has its own hashchange listener for the spread; this is the other
     half of that address.

     The hash is already what it should be, so the open must not push again --
     that is what { push: false } is for, and it is the same call the popstate
     path makes for the same reason. */
  window.addEventListener('hashchange', function () {
    var parts = (location.hash || '').slice(1).split('/');
    var slug  = parts[1];
    if (!slug) { if (card.isOpen()) card.close(); return; }
    if (card.isOpen() && card.key === parts[0] + '/' + slug) return;
    card.openBySlug(parts[0], slug, { push: false });
  });

  /* Deep-linking straight to an open spread measured the stage before it had
     settled, so the fit sometimes came back at the floor and the book loaded at
     shut size while claiming to be open. Re-measure once the frame and then the
     load have gone by; the ResizeObserver only fires on a size CHANGE, so it
     never caught this. */
  function remeasure() { engine.layout(false); }
  requestAnimationFrame(remeasure);
  window.addEventListener('load', remeasure);

  /* Two frames: one for the pose to be computed, one for it to paint. Belt and
     braces with the timeout, because requestAnimationFrame does not run in a
     backgrounded tab -- and if it never fires, is-booting never clears and the
     book's approach and stand-up stay suppressed for the whole session. Page
     turns would still animate (those are Web Animations, not CSS transitions),
     so it fails silently and looks like the book is snapping open rather than
     like something is broken. */
  function booted() { stage.classList.remove('is-booting'); }
  requestAnimationFrame(function () { requestAnimationFrame(booted); });
  setTimeout(booted, 120);
}());
