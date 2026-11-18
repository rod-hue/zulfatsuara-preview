/* ZulfatSuara.com motion layer. Content stays fully visible if this file or GSAP fails. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* count-up numbers (no library needed) */
  const fmt = (el, v) => {
    const dec = +el.dataset.dec || 0, f = el.dataset.fmt || '{}';
    const n = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
    return f.replace('{:,}', n).replace('{}', n);
  };
  const counters = $$('[data-to]');
  if (!reduce) {
    counters.forEach(el => { el.textContent = fmt(el, 0); });
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      const el = e.target, to = +el.dataset.to, t0 = performance.now(), dur = 1800;
      const step = t => { const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4); el.textContent = fmt(el, to * k); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: .4 });
    counters.forEach(el => cio.observe(el));
  }

  /* signature draw */
  const sig = document.querySelector('.sig');
  if (sig) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { sig.classList.add('draw'); o.disconnect(); } }), { threshold: .6 }).observe(sig);

  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);

  /* photo deck: always laid out (final grid), animated only when motion is allowed */
  const fan = document.querySelector('.fan');
  const deck = fan ? $$('img', fan) : [];
  function deckTargets() {
    const W = fan.clientWidth, H = fan.clientHeight, small = W < 640;
    const drop = small && deck.length % 2 ? 1 : 0;   // phones: keep an even count for the 2-column grid
    deck.forEach((img, i) => { img.style.display = drop && i === deck.length - 1 ? 'none' : ''; });
    const n = deck.length - drop;
    const cols = W < 640 ? 2 : 4, rows = Math.ceil(n / cols), gap = W < 640 ? 10 : 16;
    let w = (W - gap * (cols - 1)) / cols, h = w * 1.2;
    if (h * rows + gap * (rows - 1) > H) { h = (H - gap * (rows - 1)) / rows; w = h / 1.2; }
    return deck.map((img, i) => { if (i >= n) return { x: 0, y: 0, w, h };
      const r = Math.floor(i / cols), inRow = Math.min(cols, n - r * cols), c = i - r * cols;
      const rowW = inRow * w + (inRow - 1) * gap;
      const x = -rowW / 2 + c * (w + gap) + w / 2;
      const y = -(rows * h + (rows - 1) * gap) / 2 + r * (h + gap) + h / 2;
      return { x, y, w, h };
    });
  }
  if (fan && !reduce) {
    let tl;
    const build = () => {
      tl && tl.scrollTrigger && tl.scrollTrigger.kill(); tl && tl.kill();
      const T = deckTargets();
      deck.forEach((img, i) => { img.style.setProperty('--w', T[i].w + 'px'); img.style.setProperty('--h', T[i].h + 'px'); });
      tl = gsap.timeline({ scrollTrigger: { trigger: '.fan-sec', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
      deck.forEach((img, i) => {
        tl.fromTo(img,
          { xPercent: -50, yPercent: -50, x: (i - 3) * 6, y: 40 + i * -4, rotation: (i - 3) * 5, scale: .82 },
          { xPercent: -50, yPercent: -50, x: T[i].x, y: T[i].y, rotation: 0, scale: 1, ease: 'power2.inOut', duration: 1 }, i * 0.06);
      });
    };
    build();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); ST.refresh(); }, 250); });
  }

  if (reduce) return;

  /* headings rise word by word */
  $$('.h2.split').forEach(h => {
    const out = [];
    h.childNodes.forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(w => out.push(/^\s+$/.test(w) ? ' ' : w ? `<span class="wd"><span>${w}</span></span>` : ''));
      else if (n.nodeType === 1) n.textContent.split(/(\s+)/).forEach(w => out.push(/^\s+$/.test(w) ? ' ' : w ? `<span class="wd"><span><${n.tagName.toLowerCase()}>${w}</${n.tagName.toLowerCase()}></span></span>` : ''));
    });
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    h.innerHTML = out.join('');
    $$('.wd', h).forEach(w => w.setAttribute('aria-hidden', 'true'));
    gsap.from($$('.wd>span', h), { yPercent: 115, duration: 1, ease: 'power4.out', stagger: .07, scrollTrigger: { trigger: h, start: 'top 88%' } });
  });

  /* staggered card entrances */
  const groups = ['.st-item', '.firsts .first', '.rec .bill', '.roles span', '.awards .aw', '.pri .pr', '.press .pi', '.vote-top .vt-card', '.faq details', '.films .ft', '.facts li', '.cd'];
  groups.forEach(sel => {
    const els = $$(sel); if (!els.length) return;
    els.forEach(el => { el.style.transition = 'none'; });
    gsap.set(els, { y: 36, opacity: 0 });
    ST.batch(els, { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .08, overwrite: true,
      onComplete: () => b.forEach(el => { gsap.set(el, { clearProps: 'transform,opacity' }); el.style.transition = ''; }) }) });
  });

  /* flag stripes slide in */
  $$('.slash').forEach(s => gsap.from($$('i', s), { scaleX: 0, duration: 1.1, ease: 'power3.inOut', stagger: .12, scrollTrigger: { trigger: s, start: 'top 98%' } }));

  /* parallax depth */
  $$('[data-speed]').forEach(el => gsap.to(el, { yPercent: +el.dataset.speed * 100, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.from('.collage .frame', { opacity: 0, y: 60, scale: .94, duration: 1.2, ease: 'power3.out', stagger: .15, scrollTrigger: { trigger: '.collage', start: 'top 80%' } });

  /* hero: logo eases back as you scroll away */
  gsap.to('.lockup', { yPercent: 10, scale: .95, opacity: .6, ease: 'none', scrollTrigger: { trigger: '.mast', start: 'top top', end: 'bottom top', scrub: true } });

  /* film grows into place */
  gsap.fromTo('.film-main', { scale: .88 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.film-main', start: 'top 100%', end: 'top 40%', scrub: true } });

  /* timeline: line draws, dots light, photos slide */
  gsap.fromTo('.tl-line i', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 70%', end: 'bottom 70%', scrub: true } });
  $$('.tli').forEach(t => {
    ST.create({ trigger: t, start: 'top 70%', onEnter: () => t.classList.add('on'), onLeaveBack: () => t.classList.remove('on') });
    const img = t.querySelector('.tl-img');
    gsap.from(t.querySelector('.tl-card'), { x: -30, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: t, start: 'top 85%' } });
    if (img) gsap.from(img, { x: 60, rotation: 8, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: t, start: 'top 85%' } });
  });

  /* priority photos: gentle inner parallax */
  $$('.pr .ph img').forEach(img => gsap.fromTo(img, { yPercent: -8, scale: 1.12 }, { yPercent: 8, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.closest('.pr'), start: 'top bottom', end: 'bottom top', scrub: true } }));

  addEventListener('load', () => ST.refresh());
})();
