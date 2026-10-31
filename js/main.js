/* ============================================================
   main — draws the spiral, starts the engine, keeps nav in sync
   ============================================================ */
(function () {
  'use strict';

  /* ---------- the spiral ----------
     Only the half of each loop that is genuinely in front of the paper gets
     drawn: the arc wraps over the top edge and descends into the punch hole,
     and the near rim of the hole is painted back over the wire. The return
     leg is omitted — on a real pad it is behind the stack and invisible. */
  var W = 1000, H = 110, EDGE = 34, HOLE = 64, RX = 13, RY = 7.5, COUNT = 13;

  function coilPaths(cx) {
    return {
      over: 'M' + cx + ' ' + (HOLE + 3) +
            ' C ' + (cx + 3) + ' ' + (EDGE - 12) + ', ' + (cx - 40) + ' ' + (EDGE - 28) +
            ', ' + (cx - 45) + ' ' + (EDGE - 2),
      lit:  'M' + cx + ' ' + (HOLE + 2) +
            ' C ' + (cx + 3) + ' ' + (EDGE - 11) + ', ' + (cx - 39) + ' ' + (EDGE - 26) +
            ', ' + (cx - 44) + ' ' + (EDGE - 3),
      gloss:'M' + (cx - 5) + ' ' + (EDGE - 16) +
            ' C ' + (cx - 15) + ' ' + (EDGE - 26) + ', ' + (cx - 33) + ' ' + (EDGE - 24) +
            ', ' + (cx - 39) + ' ' + (EDGE - 11)
    };
  }

  function spiral() {
    var step = W / COUNT, out = '', i, cx, p, f;
    for (i = 0; i < COUNT; i++) {
      cx = Math.round(step * (i + 0.5));
      p  = coilPaths(cx);
      f  = 'url(#wobble-' + ['fine', 'mid', 'loose'][i % 3] + ')';
      out += '<ellipse cx="' + cx + '" cy="' + HOLE + '" rx="' + RX + '" ry="' + RY + '" fill="#8E6F69"/>';
      out += '<g filter="' + f + '">' +
             '<path d="' + p.over + '" fill="none" stroke="rgba(99,67,67,.16)" stroke-width="12" stroke-linecap="round" transform="translate(3,7)"/>' +
             '<path d="' + p.over + '" fill="none" stroke="var(--coil-dk)" stroke-width="13" stroke-linecap="round"/>' +
             '<path d="' + p.lit  + '" fill="none" stroke="var(--coil)" stroke-width="8" stroke-linecap="round"/>' +
             '<path d="' + p.gloss+ '" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2.6" stroke-linecap="round"/>' +
             '</g>';
      // near rim, over the wire
      out += '<path d="M' + (cx - RX) + ' ' + HOLE + ' A ' + RX + ' ' + RY + ' 0 0 0 ' + (cx + RX) + ' ' + HOLE +
             ' L ' + (cx + RX) + ' ' + (HOLE + 9) + ' L ' + (cx - RX) + ' ' + (HOLE + 9) + ' Z" fill="#C9ABA4"/>' +
             '<path d="M' + (cx - RX) + ' ' + HOLE + ' A ' + RX + ' ' + RY + ' 0 0 0 ' + (cx + RX) + ' ' + HOLE +
             '" fill="none" stroke="rgba(99,67,67,.3)" stroke-width="1.6"/>';
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + out + '</svg>';
  }

  document.querySelector('.spine--front').innerHTML = spiral();

  /* ---------- paper ----------
     Each .paper placeholder in the markup is swapped for a chain of nested
     bands. Weights run hinge -> free edge and sum to 1, so --curl is simply
     the total degrees of bend; the middle bands take the most, which is where
     a sheet held at the top and lifted at the bottom actually arches.
     Built here rather than in the HTML so the markup stays readable. */
  var BAND_W = [0.06, 0.14, 0.22, 0.24, 0.20, 0.14];

  function buildPaper(paper) {
    var bend = document.createElement('div');
    bend.className = 'bend' + (paper.classList.contains('paper--inner') ? ' bend--inner' : '');
    var host = bend, depth = 0;
    BAND_W.forEach(function (w, i) {
      var band = document.createElement('div');
      band.className = 'band' + (i === BAND_W.length - 1 ? ' band--last' : '');
      band.style.setProperty('--w', w);
      band.style.setProperty('--i', i);
      band.style.setProperty('--d0', depth.toFixed(3)); // cumulative tilt at this band's top
      depth += w;
      band.style.setProperty('--d', depth.toFixed(3));  // ...and at its bottom, so shading blends
      host.appendChild(band);
      host = band;
    });
    paper.replaceWith(bend);
  }

  /* Clipping and the grain filter both force transform-style back to flat, so
     the content moves into its own flat layer above the bend. */
  function buildFace(face) {
    var flat = document.createElement('div');
    flat.className = 'face__flat';
    var content = face.querySelector('.content');
    if (content) flat.appendChild(content);
    face.appendChild(flat);
  }

  /* The dot grid is shifted per band so the bend reads as one continuous
     sheet. That needs a real pixel height, which only measurement gives. */
  function syncBandHeight() {
    var b = document.querySelector('.bend > .band');
    if (b) document.documentElement.style.setProperty('--band-h', b.getBoundingClientRect().height + 'px');
  }

  Array.prototype.forEach.call(document.querySelectorAll('.paper'), buildPaper);
  Array.prototype.forEach.call(document.querySelectorAll('.face'),  buildFace);
  syncBandHeight();
  window.addEventListener('resize', syncBandHeight);

  /* ---------- engine ---------- */
  var book = new BookEngine(document.getElementById('book'), { lift: 14 });
  window.book = book;

  var links = Array.prototype.slice.call(document.querySelectorAll('[data-goto]'));
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      book.goToPage(a.dataset.goto);
    });
  });

  document.getElementById('book').addEventListener('book:change', function (e) {
    links.forEach(function (a) {
      if (a.dataset.goto === e.detail.page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  });

  // deep link on load
  var start = (location.hash || '').slice(1);
  if (start) book.goToPage(start, false, false);
}());
