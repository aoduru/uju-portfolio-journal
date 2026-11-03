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
  var H = 110, EDGE = 34, HOLE = 64, RX = 13, RY = 7.5;
  /* The artwork is authored against a 1000-unit span holding 13 rings, so its
     natural pitch is 1000/13. Every other size here is derived from that. */
  var AUTHORED_W = 1000, AUTHORED_RINGS = 13, BASE_PITCH = AUTHORED_W / AUTHORED_RINGS;
  /* The one tuned number. Below roughly this spacing the wire stops reading as
     a coil, so a narrow screen drops rings rather than shrinking them further. */
  var MIN_PITCH = 48;

  function r2(v) { return Math.round(v * 100) / 100; }

  /* k scales a ring about the PAPER'S TOP EDGE (y = EDGE) -- the thing the coil
     physically wraps over, and the one y that never moves: the spine is pinned
     at top:-34px, so the paper's edge is y=34 at every width.

     It was anchored at the punch line first, which is wrong in a way that only
     shows once k drops. Shrinking about y=HOLE drags the wire's top end DOWN
     toward the hole, while the paper edge stays at 34 -- so at k=0.62 the whole
     coil sat 2.2 units BELOW the edge, nothing wrapped over it, and the rings
     read as lying flat on the page instead of threading through it. Anchored at
     the edge, the wire keeps the same share of itself above the paper at any
     size. Stroke widths scale with k too, or small coils keep fat wire. */
  function scaleY(v, k) { return r2(EDGE + (v - EDGE) * k); }

  function coilPaths(cx, k) {
    function X(d) { return r2(cx + d * k); }
    function Y(v) { return scaleY(v, k); }
    return {
      over: 'M' + X(0) + ' ' + Y(HOLE + 3) +
            ' C ' + X(3) + ' ' + Y(EDGE - 12) + ', ' + X(-40) + ' ' + Y(EDGE - 28) +
            ', ' + X(-45) + ' ' + Y(EDGE - 2),
      lit:  'M' + X(0) + ' ' + Y(HOLE + 2) +
            ' C ' + X(3) + ' ' + Y(EDGE - 11) + ', ' + X(-39) + ' ' + Y(EDGE - 26) +
            ', ' + X(-44) + ' ' + Y(EDGE - 3),
      gloss:'M' + X(-5) + ' ' + Y(EDGE - 16) +
            ' C ' + X(-15) + ' ' + Y(EDGE - 26) + ', ' + X(-33) + ' ' + Y(EDGE - 24) +
            ', ' + X(-39) + ' ' + Y(EDGE - 11)
    };
  }

  /* One ring per `pitch` of real width, drawn 1:1 in CSS pixels. This SVG used
     to be stretched across the spine with preserveAspectRatio="none", which at
     phone width crushed the 1000-unit span into 345px -- a 3.9x horizontal
     squeeze that left every round punch hole more than twice as tall as wide.
     The COUNT absorbs the width now instead, so a ring is the same shape at
     every size and a narrow screen simply has fewer of them, like a smaller
     physical pad. At the full 950px this still resolves to 13 rings at k=0.95,
     which is exactly the scale the old stretched version drew them at. */
  function spiral(W) {
    var pitch = Math.max(MIN_PITCH, W / AUTHORED_RINGS);
    var count = Math.max(3, Math.round(W / pitch));
    var k     = pitch / BASE_PITCH;
    var step  = W / count;
    /* The punch line rides the same scale, so the hole stays the same distance
       below the edge in proportion -- closer to it on a smaller pad, as on a
       real one. */
    var cy = scaleY(HOLE, k);
    var rx = r2(RX * k), ry = r2(RY * k), lip = r2(cy + 9 * k);
    function sw(v) { return r2(v * k); }
    var out = '', i, cx, p, f;
    for (i = 0; i < count; i++) {
      cx = r2(step * (i + 0.5));
      p  = coilPaths(cx, k);
      f  = 'url(#wobble-' + ['fine', 'mid', 'loose'][i % 3] + ')';
      out += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#8E6F69"/>';
      out += '<g filter="' + f + '">' +
             '<path d="' + p.over + '" fill="none" stroke="rgba(99,67,67,.16)" stroke-width="' + sw(12) + '" stroke-linecap="round" transform="translate(' + sw(3) + ',' + sw(7) + ')"/>' +
             '<path d="' + p.over + '" fill="none" stroke="var(--coil-dk)" stroke-width="' + sw(13) + '" stroke-linecap="round"/>' +
             '<path d="' + p.lit  + '" fill="none" stroke="var(--coil)" stroke-width="' + sw(8) + '" stroke-linecap="round"/>' +
             '<path d="' + p.gloss+ '" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="' + sw(2.6) + '" stroke-linecap="round"/>' +
             '</g>';
      // near rim, over the wire
      out += '<path d="M' + r2(cx - rx) + ' ' + cy + ' A ' + rx + ' ' + ry + ' 0 0 0 ' + r2(cx + rx) + ' ' + cy +
             ' L ' + r2(cx + rx) + ' ' + lip + ' L ' + r2(cx - rx) + ' ' + lip + ' Z" fill="#C9ABA4"/>' +
             '<path d="M' + r2(cx - rx) + ' ' + cy + ' A ' + rx + ' ' + ry + ' 0 0 0 ' + r2(cx + rx) + ' ' + cy +
             '" fill="none" stroke="rgba(99,67,67,.3)" stroke-width="' + sw(1.6) + '"/>';
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + out + '</svg>';
  }

  /* Redraw only when the WIDTH changes. The observer below also fires on
     height, and rebuilding sixty paths because the page got taller is waste. */
  var spine = document.querySelector('.spine--front');
  var spiralW = -1;
  function syncSpiral() {
    var W = Math.round(spine.getBoundingClientRect().width);
    if (W <= 0 || W === spiralW) return;
    spiralW = W;
    spine.innerHTML = spiral(W);
  }

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
     sheet. That needs a real pixel height, which only measurement gives.

     Measure the VIEWPORT, never a band. Two traps, and the old version hit
     both: querySelector('.bend > .band') returns the FIRST band in the
     document, which belongs to a sheet that is usually turned, and
     getBoundingClientRect() reports the perspective-SCALED size of anything
     with a 3D transform. Together they reported 95.51px for a band that is
     really 92.93px, drifting the grid 2.58px at every seam and 12.91px by the
     bottom of the page -- a visible line across the paper at each seam.
     .journal-viewport is the perspective parent, so it carries no transform
     of its own and its height is the true one. */
  function syncBandHeight() {
    var vp = document.querySelector('.journal-viewport');
    if (!vp) return;
    var n = parseInt(getComputedStyle(document.documentElement)
              .getPropertyValue('--bands'), 10) || 6;
    document.documentElement.style.setProperty(
      '--band-h', (vp.getBoundingClientRect().height / n) + 'px');
  }

  Array.prototype.forEach.call(document.querySelectorAll('.paper'), buildPaper);
  Array.prototype.forEach.call(document.querySelectorAll('.face'),  buildFace);
  /* The band grid and the ring count both key off the viewport box, so they
     resync together. */
  function syncGeometry() { syncBandHeight(); syncSpiral(); }
  syncGeometry();
  /* A window resize listener misses everything else that changes the box --
     fonts swapping in, the media query at 60vh, the pane being dragged.
     Observe the element itself and neither can go stale. */
  if (window.ResizeObserver) {
    new ResizeObserver(syncGeometry).observe(document.querySelector('.journal-viewport'));
  } else {
    window.addEventListener('resize', syncGeometry);
  }

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
