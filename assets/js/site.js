/* ZulfatSuara.com 2027 */
/* ======== CAMPAIGN SETTINGS: update these when official ======== */
const CONFIG = {
  // ActBlue page. Swap to the Vice Mayor committee's page when it exists.
  ACTBLUE: 'https://secure.actblue.com/donate/zulfatwebsite',
  // Where the volunteer / host / sign / speaker forms go.
  // Leave FORM_ENDPOINT empty to send by email (EMAIL) or fall back to the Google Form.
  FORM_ENDPOINT: '',            // e.g. https://formspree.io/f/xxxx
  EMAIL: '',                    // e.g. team@zulfatsuara.com (campaign inbox, NOT a Metro address)
  GOOGLE_FORM: 'https://docs.google.com/forms/d/e/1FAIpQLSdNloBu681NutP1zCy3ZX6rln2zbEMJixQVA7uWPqcX4b5NAQ/viewform',
  // Key dates (Central Time). Election day is set by the Metro Charter (first Thursday in August).
  ELECTION: '2027-08-05T07:00:00-05:00',  // polls open 7am
  ELECTION_CLOSE: '2027-08-05T19:00:00-05:00',
  EARLY_START: '2027-07-16T08:00:00-05:00', // ESTIMATE: 20 days before (TCA 2-6-102)
  EARLY_END: '2027-07-31T16:30:00-05:00'    // ESTIMATE: 5 days before
};
/* =============================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* donate links */
$$('[data-actblue]').forEach(a => {
  const amt = a.dataset.actblue;
  a.href = CONFIG.ACTBLUE + (amt ? (CONFIG.ACTBLUE.includes('?') ? '&' : '?') + 'amount=' + amt : '') + (CONFIG.ACTBLUE.includes('?') || amt ? '&' : '?') + 'refcode=website';
  a.target = '_blank'; a.rel = 'noopener';
});

/* text size toggle */
const aa = $('#aa');
const setBig = on => { document.documentElement.classList.toggle('big', on); aa && aa.setAttribute('aria-pressed', on ? 'true' : 'false'); };
setBig(store.get('zs-big') === '1');
aa && aa.addEventListener('click', () => { const on = !document.documentElement.classList.contains('big'); setBig(on); store.set('zs-big', on ? '1' : '0'); });

/* drawer */
const drawer = $('#drawer');
$('#menuBtn')?.addEventListener('click', () => { drawer.classList.add('open'); drawer.querySelector('.x').focus(); });
drawer?.querySelector('.x').addEventListener('click', () => drawer.classList.remove('open'));
$$('#drawer a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));
addEventListener('keydown', e => { if (e.key === 'Escape') drawer?.classList.remove('open'); });

/* name letters */
$$('.name .w').forEach((w, wi) => {
  const t = w.textContent; w.textContent = '';
  [...t].forEach((c, i) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i + wi * 6); s.textContent = c; w.appendChild(s); });
});

/* triptych */
(() => {
  const trip = $('.trip'); if (!trip) return;
  const panels = $$('.panel', trip); let idx = 0, timer = null;
  const vid = p => p.querySelector('video');
  const load = v => { if (v && !v.src && v.dataset.src) { v.src = v.dataset.src; } };
  function activate(i, user) {
    idx = i;
    panels.forEach((p, k) => {
      const on = k === i; p.classList.toggle('on', on); p.setAttribute('aria-expanded', on);
      const v = vid(p);
      if (v) { if (on && !reduced) { load(v); v.play().catch(() => {}); } else v.pause(); }
    });
    clearTimeout(timer);
    if (!reduced) timer = setTimeout(() => activate((idx + 1) % panels.length), user ? 14000 : 7000);
  }
  panels.forEach((p, k) => {
    p.addEventListener('click', () => { if (!p.classList.contains('on')) activate(k, true); });
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(k, true); } });
  });
  trip.addEventListener('mouseenter', () => { trip.classList.add('paused'); clearTimeout(timer); });
  trip.addEventListener('mouseleave', () => { trip.classList.remove('paused'); if (!reduced) timer = setTimeout(() => activate((idx + 1) % panels.length), 4000); });
  new IntersectionObserver(es => es.forEach(e => { const v = vid(panels[idx]); if (!v) return; e.isIntersecting && !reduced ? v.play().catch(() => {}) : v.pause(); })).observe(trip);
  activate(0);
})();

/* countdowns */
(() => {
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    const now = Date.now();
    $$('[data-count]').forEach(el => {
      const key = el.dataset.count;
      const target = new Date(CONFIG[key]).getTime();
      const endKey = key === 'ELECTION' ? 'ELECTION_CLOSE' : 'EARLY_END';
      const end = new Date(CONFIG[endKey]).getTime();
      let d = Math.max(0, target - now);
      const vals = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];
      $$('b', el.querySelector('.clock')).forEach((b, i) => { b.textContent = i ? pad(vals[i]) : vals[0]; });
      const st = el.querySelector('[data-state]');
      if (st) {
        if (now >= target && now < end) st.textContent = key === 'ELECTION' ? 'Polls are open until 7 p.m.' : 'Early voting is open now';
        else if (now >= end) st.textContent = key === 'ELECTION' ? 'Thank you, Nashville' : 'Early voting has closed';
      }
    });
  }
  tick(); setInterval(tick, 1000);
  // calendar files
  const ics = (title, start, end, loc, desc) => {
    const f = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ZulfatSuara.com//2027//EN', 'BEGIN:VEVENT',
      'UID:' + f(start) + '@zulfatsuara.com', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(start), 'DTEND:' + f(end),
      'SUMMARY:' + title, 'LOCATION:' + loc, 'DESCRIPTION:' + desc, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + title, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  };
  const e1 = $('#icsElection'), e2 = $('#icsEarly');
  if (e1) { e1.href = ics('Vote Zulfat Suara for Vice Mayor (Election Day)', CONFIG.ELECTION, CONFIG.ELECTION_CLOSE, 'Your Davidson County polling place', 'Polls open 7am-7pm. Find your polling place at nashville.gov/vote. Bring a TN or federal photo ID.'); e1.download = 'election-day-2027.ics'; }
  if (e2) { e2.href = ics('Early voting starts: Vote Zulfat Suara for Vice Mayor', CONFIG.EARLY_START, CONFIG.EARLY_END, 'Any Davidson County early voting site', 'Estimated dates; confirm at nashville.gov/vote. Vote at any early voting site in Davidson County.'); e2.download = 'early-voting-2027.ics'; }
})();

/* films */
(() => {
  const main = $('.film-main'); if (!main) return;
  const v = main.querySelector('video'), cap = main.querySelector('.cap');
  const play = () => { main.classList.add('playing'); v.controls = true; v.play().catch(() => {}); };
  main.querySelector('.film-play').addEventListener('click', play);
  v.addEventListener('pause', () => { if (v.ended) main.classList.remove('playing'); });
  $$('.ft').forEach(b => b.addEventListener('click', () => {
    $$('.ft').forEach(x => x.classList.toggle('on', x === b));
    v.pause(); v.src = b.dataset.src; v.poster = b.dataset.poster; cap.textContent = b.dataset.cap;
    play(); main.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  }));
})();

/* photo wall */
(async () => {
  const wall = $('.wall'); if (!wall) return;
  let list = [];
  try { list = await (await fetch('assets/data/wall.json')).json(); } catch (e) { return; }
  const half = Math.ceil(list.length / 2);
  [list.slice(0, half), list.slice(half)].forEach((set, r) => {
    const row = document.createElement('div'); row.className = 'row' + (r ? ' rev' : '');
    [...set, ...set].forEach((src, i) => { const im = new Image(); im.src = 'assets/img/' + src; im.loading = 'lazy'; im.alt = i < set.length ? 'Zulfat Suara with Nashville neighbors' : ''; if (i >= set.length) im.setAttribute('aria-hidden', 'true'); row.appendChild(im); });
    wall.appendChild(row);
  });
})();

/* early voting site filter */
$('#siteFind')?.addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  $$('.sites li').forEach(li => { li.hidden = q && !li.textContent.toLowerCase().includes(q); });
});

/* get involved tabs */
(() => {
  const tabs = $$('.inv-tabs [role="tab"]');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); $('#' + x.getAttribute('aria-controls')).hidden = !on; });
  }));
  // deep links like #host
  const map = { '#host': 'tab-host', '#signs': 'tab-sign', '#speak': 'tab-speak', '#volunteer': 'tab-vol' };
  const go = () => { const id = map[location.hash]; if (id) $('#' + id)?.click(); };
  addEventListener('hashchange', go); go();
  $$('[data-tab]').forEach(a => a.addEventListener('click', () => $('#' + a.dataset.tab)?.click()));
})();

/* forms */
$$('form.form').forEach(f => f.addEventListener('submit', async e => {
  e.preventDefault();
  const data = new FormData(f);
  const kind = f.dataset.kind;
  if (CONFIG.FORM_ENDPOINT) {
    data.append('_subject', 'Website: ' + kind);
    try {
      const r = await fetch(CONFIG.FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (r.ok) { f.classList.add('sent'); f.reset(); return; }
    } catch (err) {}
  }
  if (CONFIG.EMAIL) {
    const lines = []; for (const [k, v] of data.entries()) lines.push(k + ': ' + v);
    location.href = 'mailto:' + CONFIG.EMAIL + '?subject=' + encodeURIComponent('Website: ' + kind) + '&body=' + encodeURIComponent(lines.join('\n'));
    f.classList.add('sent'); return;
  }
  window.open(CONFIG.GOOGLE_FORM, '_blank', 'noopener');
  f.classList.add('sent');
}));

/* reveal */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.rv').forEach(el => io.observe(el));
if (!('IntersectionObserver' in window)) $$('.rv').forEach(el => el.classList.add('in'));

/* year */
$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

/* intro film: plays muted when on screen; the red button restarts it with sound */
(() => {
  const reel = document.querySelector('[data-reel]'); if (!reel) return;
  const v = reel.querySelector('video'), btn = reel.querySelector('[data-sound]');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const big = innerWidth * (devicePixelRatio || 1) > 1400;
  const load = () => { if (!v.src) v.src = big ? v.dataset.src : v.dataset.srcSm; };
  let withSound = false;
  if (!still) new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { load(); v.play().catch(() => {}); } else if (!withSound) v.pause();
  }), { threshold: .35 }).observe(reel);
  v.addEventListener('ended', () => { reel.classList.add('ended'); if (!withSound) { v.currentTime = 0; v.play().catch(() => {}); } });
  btn.addEventListener('click', () => {
    load(); withSound = true; reel.classList.remove('ended'); reel.classList.add('playing-sound');
    v.muted = false; v.currentTime = 0; v.controls = true; v.play().catch(() => {});
  });
})();
