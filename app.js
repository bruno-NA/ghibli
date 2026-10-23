/* Ghibli Guide
   - Films: Studio Ghibli API (https://ghibliapi.vercel.app)  – no key
   - TV:    TVMaze API (https://api.tvmaze.com)               – no key
   - Watched list + ratings are saved in this browser (localStorage).
   The Ghibli API has no mood data, so each film's "feel" scores live in PROFILES below. */
'use strict';

/* =====================================================================
   Config
   ===================================================================== */
const API_FILMS = 'https://ghibliapi.vercel.app/films';
const API_TV = 'https://api.tvmaze.com';
const KEY_STORE = 'ghibliGuide.v1';
const KEY_FILMS = 'ghibliGuide.films.v1';
const KEY_TV = 'ghibliGuide.tv.v1';
const DAY = 864e5;

/* Feel dimensions, each scored 0–5 per film */
const DIMS = ['bg', 'cry', 'deep', 'cozy', 'fun', 'adv'];
const DIM_NAME = {
  bg: 'Great background', cry: 'Tearjerker', deep: 'Thought-provoking',
  cozy: 'Cozy comfort', fun: 'Fun & light', adv: 'Adventure'
};
const WHY = {
  bg: 'it slips easily into the background without demanding your full attention',
  cry: 'it is known for hitting right in the heart',
  deep: 'it gives you a lot to think about and look at',
  cozy: 'it feels like a warm blanket',
  fun: 'it is playful and light on its feet',
  adv: 'it is packed with adventure'
};
const TV_REASON = {
  bg: 'a gentle watch that pairs well with your day',
  cry: 'a story that hits just as deep',
  deep: 'another one with layers to think about',
  cozy: 'the same warm, comforting feeling',
  fun: 'the same playful spirit',
  adv: 'another big adventure'
};

/* [background, tearjerker, thought-provoking, cozy, fun, adventure], plus a one-line vibe */
const PROFILE_LIST = [
  ['Castle in the Sky', [3, 2, 2, 2, 3, 5], 'A soaring sky-pirate treasure hunt with a gorgeous score.'],
  ['Grave of the Fireflies', [0, 5, 4, 0, 0, 0], 'Devastating and unforgettable. Have tissues ready; this one is very heavy.'],
  ['My Neighbor Totoro', [5, 1, 1, 5, 4, 2], 'Pure comfort: forest spirits, rain showers and a catbus.'],
  ["Kiki's Delivery Service", [5, 2, 2, 5, 3, 3], 'A gentle coming-of-age story about finding your confidence.'],
  ['Only Yesterday', [4, 3, 4, 4, 2, 0], 'A quiet, nostalgic look at growing up and choosing your own path.'],
  ['Porco Rosso', [4, 2, 3, 3, 4, 4], 'A grumpy pig pilot, Adriatic sunshine and sky-high swagger.'],
  ['Pom Poko', [3, 3, 4, 2, 4, 2], 'Shape-shifting tanuki fight for their forest: funny, strange and bittersweet.'],
  ['Whisper of the Heart', [4, 3, 2, 5, 3, 1], 'A cozy story about creativity, first love and chasing a dream.'],
  ['Princess Mononoke', [1, 3, 5, 0, 0, 5], 'An epic, serious fable about nature versus industry.'],
  ['My Neighbors the Yamadas', [5, 1, 2, 4, 5, 0], 'Comic-strip vignettes of a lovably chaotic family.'],
  ['Spirited Away', [2, 2, 5, 2, 2, 5], 'A dreamlike bathhouse for spirits that rewards close watching.'],
  ['The Cat Returns', [5, 0, 1, 4, 5, 3], 'A short, silly fantasy that is easy to put on and enjoy.'],
  ["Howl's Moving Castle", [3, 2, 4, 4, 3, 4], 'A romantic, whimsical fantasy with a moving castle and a cranky wizard.'],
  ['Tales from Earthsea', [1, 2, 3, 0, 0, 4], 'A darker, slower fantasy quest with a mixed reception.'],
  ['Ponyo', [5, 1, 1, 5, 5, 3], 'A sweet, bright story of a fish girl who wants to be human.'],
  ['Arrietty', [4, 3, 2, 5, 2, 3], 'A hushed, tender adventure about tiny people under the floorboards.'],
  ['From Up on Poppy Hill', [4, 3, 2, 4, 2, 0], 'A gentle 1960s slice of life about a school club and first love.'],
  ['The Wind Rises', [1, 5, 5, 1, 0, 1], 'A reflective, bittersweet portrait of an aircraft designer.'],
  ['The Tale of the Princess Kaguya', [2, 5, 5, 3, 1, 1], 'Hand-painted, moving and unforgettable. Prepare to cry.'],
  ['When Marnie Was There', [2, 5, 4, 3, 0, 1], 'A mysterious, emotional story of friendship and secrets.'],
  ['The Red Turtle', [4, 4, 5, 2, 0, 2], 'A wordless, meditative tale of life on a desert island.'],
  ['Earwig and the Witch', [4, 0, 1, 3, 4, 2], 'A light, quirky CG fantasy about a girl and her witch guardian.']
];
const NEUTRAL = { p: [2, 2, 2, 2, 2, 2], vibe: '' };

/* What the user is after (goal) and how they feel (mood): weights on the dimensions */
const GOALS = [
  { id: 'bg', icon: '🎧', label: 'Good background', hint: 'Something to have on while I work, study or tidy', w: { bg: 3, cozy: 1 } },
  { id: 'cry', icon: '😢', label: 'A tearjerker', hint: 'I want to feel something deeply', w: { cry: 3, deep: 0.5 } },
  { id: 'deep', icon: '🔍', label: 'Something interesting', hint: 'Make me think, wonder and look closely', w: { deep: 3, adv: 0.5 } },
  { id: 'cozy', icon: '🧣', label: 'Comfort', hint: 'A warm hug in movie form', w: { cozy: 3 } },
  { id: 'fun', icon: '😄', label: 'Something fun', hint: 'Light, playful and cheerful', w: { fun: 3, cozy: 1 } },
  { id: 'adv', icon: '🗺️', label: 'An adventure', hint: 'Take me somewhere big and exciting', w: { adv: 3, fun: 0.5 } }
];
const MOODS = [
  { id: 'none', icon: '🌤️', label: 'No particular mood', w: {} },
  { id: 'stressed', icon: '🌧️', label: 'Stressed or overwhelmed', w: { cozy: 2, bg: 1 } },
  { id: 'tired', icon: '🌙', label: 'Tired', w: { cozy: 2, bg: 1.5 } },
  { id: 'sad', icon: '💧', label: 'Sad or heavy', w: { cry: 1.5, cozy: 1 } },
  { id: 'lonely', icon: '🍵', label: 'Lonely', w: { cozy: 1.5, fun: 1, cry: 0.5 } },
  { id: 'nostalgic', icon: '🍂', label: 'Nostalgic', w: { cozy: 1, cry: 0.5, deep: 1 } },
  { id: 'curious', icon: '✨', label: 'Curious', w: { deep: 2 } },
  { id: 'energetic', icon: '⚡', label: 'Energetic', w: { adv: 2, fun: 1 } }
];
const TIMES = [
  { id: 'any', icon: '♾️', label: 'No limit', max: 0 },
  { id: 'short', icon: '⏱️', label: 'Under 100 minutes', max: 100 },
  { id: 'mid', icon: '🕒', label: 'Under 2 hours', max: 120 }
];

/* Curated TV suggestions per dimension. `q` is the TVMaze search; `alt` are other names the show goes by. */
const SHOWS = {
  bg: [
    { q: 'Mushishi', alt: ['Mushi-Shi'] }, { q: 'Laid-Back Camp', alt: ['Yuru Camp'] }, { q: 'Flying Witch' },
    { q: 'Barakamon' }, { q: "Natsume's Book of Friends", alt: ['Natsume Yuujinchou'] },
    { q: 'Midnight Diner', alt: ['Shinya Shokudo'] }, { q: 'Aggretsuko' }
  ],
  cry: [
    { q: 'Violet Evergarden' }, { q: 'Anohana', alt: ['Ano Hi Mita Hana'] },
    { q: 'Your Lie in April', alt: ['Shigatsu wa Kimi no Uso'] }, { q: 'March Comes in Like a Lion', alt: ['Sangatsu no Lion'] },
    { q: 'Clannad' }, { q: 'Frieren', alt: ['Sousou no Frieren'] }, { q: 'Haibane Renmei' }
  ],
  deep: [
    { q: 'Over the Garden Wall' }, { q: 'Haibane Renmei' }, { q: 'Made in Abyss' }, { q: 'Vinland Saga' },
    { q: 'Fullmetal Alchemist: Brotherhood', alt: ['Hagane no Renkinjutsushi'] }, { q: 'Mob Psycho 100' }, { q: 'Paranoia Agent' }
  ],
  cozy: [
    { q: 'Flying Witch' }, { q: 'Laid-Back Camp', alt: ['Yuru Camp'] }, { q: "Natsume's Book of Friends", alt: ['Natsume Yuujinchou'] },
    { q: 'Hilda' }, { q: 'Little Witch Academia' }, { q: 'Barakamon' },
    { q: 'Restaurant to Another World', alt: ['Isekai Shokudou'] }, { q: 'Midnight Diner', alt: ['Shinya Shokudo'] }
  ],
  fun: [
    { q: 'Spy x Family' }, { q: 'Kaguya-sama: Love Is War', alt: ['Kaguya-sama wa Kokurasetai'] }, { q: 'Nichijou' },
    { q: 'Gravity Falls' }, { q: 'Adventure Time' }, { q: 'Hilda' }, { q: 'Aggretsuko' }, { q: 'Steven Universe' }
  ],
  adv: [
    { q: 'Avatar: The Last Airbender' }, { q: 'The Dragon Prince' }, { q: 'Made in Abyss' },
    { q: 'Delicious in Dungeon', alt: ['Dungeon Meshi'] }, { q: 'Hunter x Hunter' },
    { q: 'Fullmetal Alchemist: Brotherhood' }, { q: 'Frieren', alt: ['Sousou no Frieren'] }, { q: 'Hilda' }, { q: 'Little Witch Academia' }
  ]
};

/* =====================================================================
   Helpers
   ===================================================================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const compact = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const normTitle = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function lsGet(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage blocked or full */ } }

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* A tiny original mascot used on loading / empty screens */
const SPROUT = '<div class="sprout" aria-hidden="true"><i></i><i></i></div>';

function starsHTML(n) {
  n = clamp(Math.round(n || 0), 0, 5);
  return `<span class="stars" aria-label="${n} out of 5 stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;
}

/* Broken images (poster/banner) just disappear and the gradient behind them shows */
document.addEventListener('error', e => {
  if (e.target && e.target.tagName === 'IMG') e.target.classList.add('broken');
}, true);

/* =====================================================================
   State
   ===================================================================== */
const PROFILES = new Map(PROFILE_LIST.map(([t, p, v]) => [normTitle(t), { p, vibe: v }]));

let store = sanitizeStore(lsGet(KEY_STORE));
let films = [];
let filmsError = '';
let currentTab = 'find';
let currentFilmId = null;
let tvToken = 0;
let tvStale = true;

const finder = { step: 'goal', goal: null, mood: null, time: 'any', ranked: [], idx: 0 };
const view = { filter: 'all', sort: 'year' };

function sanitizeStore(s) {
  const out = { watched: {}, dismissed: [], shuffle: 0 };
  if (!s || typeof s !== 'object') return out;
  if (s.watched && typeof s.watched === 'object') {
    for (const [id, r] of Object.entries(s.watched)) {
      if (r && typeof r === 'object') out.watched[id] = { rating: clamp(Math.round(+r.rating) || 0, 0, 5), date: String(r.date || '') };
    }
  }
  if (Array.isArray(s.dismissed)) out.dismissed = s.dismissed.filter(x => typeof x === 'string').slice(0, 200);
  out.shuffle = Math.max(0, Math.round(+s.shuffle) || 0);
  return out;
}
const saveStore = () => lsSet(KEY_STORE, store);

/* =====================================================================
   Films (Studio Ghibli API)
   ===================================================================== */
function shapeFilm(f) {
  const prof = PROFILES.get(normTitle(f.title)) || NEUTRAL;
  return {
    id: String(f.id),
    title: f.title || 'Untitled',
    romaji: f.original_title_romanised || '',
    japanese: f.original_title || '',
    image: f.image || '',
    banner: f.movie_banner || f.image || '',
    description: f.description || '',
    director: f.director || '',
    year: f.release_date || '',
    runtime: Number(f.running_time) || 0,
    rt: Number(f.rt_score) || 0,
    p: prof.p,
    vibe: prof.vibe
  };
}

async function loadFilms() {
  filmsError = '';
  try {
    const res = await fetch(API_FILMS);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error('empty');
    films = data.map(shapeFilm);
    lsSet(KEY_FILMS, { t: Date.now(), films: data });
  } catch (err) {
    console.warn('Could not load films:', err);
    const cached = lsGet(KEY_FILMS);
    if (cached && Array.isArray(cached.films) && cached.films.length) {
      films = cached.films.map(shapeFilm);
      toast('You appear to be offline. Showing saved film data.');
    } else {
      films = [];
      filmsError = 'Could not load the Studio Ghibli film list. Check your connection and try again.';
    }
  }
}

const filmById = id => films.find(f => f.id === id);
const recOf = id => store.watched[id];
const ratedFilms = () => films.filter(f => recOf(f.id) && recOf(f.id).rating > 0);

/* =====================================================================
   Matching engine: mood/goal -> best film
   ===================================================================== */
function rankFilms(sel) {
  const goal = GOALS.find(g => g.id === sel.goal) || GOALS[0];
  const mood = MOODS.find(m => m.id === sel.mood) || MOODS[0];
  const time = TIMES.find(t => t.id === sel.time) || TIMES[0];

  const w = {};
  for (const [d, v] of Object.entries(goal.w)) w[d] = (w[d] || 0) + v;
  for (const [d, v] of Object.entries(mood.w)) w[d] = (w[d] || 0) + v * 0.7;
  const maxScore = Object.values(w).reduce((a, v) => a + v * 5, 0) || 1;
  const comfort = goal.id === 'bg' || goal.id === 'cozy';

  const ranked = films.map(f => {
    let s = 0;
    for (const [d, v] of Object.entries(w)) s += v * f.p[DIMS.indexOf(d)];
    const rec = recOf(f.id);
    let rewatch = false;
    if (rec) {
      if (comfort) { s += rec.rating >= 4 ? 1.5 : (rec.rating > 0 && rec.rating <= 2 ? -2 : 0.5); rewatch = true; }
      else s -= 4;                                  // already seen: prefer something new
    }
    if (time.max && f.runtime > time.max) s -= 6;   // too long for tonight
    s += f.rt / 1000;                               // tiny tie-breaker: critics' score
    return { film: f, score: s, pct: clamp(Math.round(100 * s / maxScore), 1, 99), rewatch, w };
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

function whyText(entry) {
  const { film, w } = entry;
  const top = Object.keys(w)
    .map(d => ({ d, v: w[d] * film.p[DIMS.indexOf(d)], p: film.p[DIMS.indexOf(d)] }))
    .filter(x => x.p >= 4)
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map(x => WHY[x.d]);
  if (!top.length) return 'It is the closest match in the lineup for what you asked for.';
  return 'Picked because ' + top.join(' and ') + '.';
}

/* =====================================================================
   Finder UI
   ===================================================================== */
function stepDots() {
  const order = ['goal', 'mood', 'time', 'result'];
  const at = order.indexOf(finder.step);
  return `<div class="steps" aria-hidden="true">${order.map((_, i) => `<span class="dot ${i <= at ? 'on' : ''}"></span>`).join('')}</div>`;
}

function renderFinder() {
  const box = $('#finder');
  if (filmsError) {
    box.innerHTML = `<div class="card notice">${SPROUT}<h2>Oh no, the films didn't load</h2><p>${esc(filmsError)}</p><button class="btn primary" data-act="reload" type="button">Try again</button></div>`;
    return;
  }
  if (!films.length) {
    box.innerHTML = `<div class="card notice">${SPROUT}<h2>Loading films…</h2><p>Fetching the Studio Ghibli lineup.</p></div>`;
    return;
  }

  if (finder.step === 'goal') {
    box.innerHTML = `${stepDots()}<div class="card finder-card">
      <h2>What do you want from tonight's movie?</h2>
      <p class="q-sub">Pick the one that fits best.</p>
      <div class="chips">${GOALS.map(g => chip('goal', g.id, g.icon, g.label, g.hint)).join('')}</div>
    </div>`;
  } else if (finder.step === 'mood') {
    box.innerHTML = `${stepDots()}<div class="card finder-card">
      <h2>How are you feeling right now?</h2>
      <p class="q-sub">Optional, but it helps me fine-tune the pick.</p>
      <div class="chips">${MOODS.map(m => chip('mood', m.id, m.icon, m.label, '')).join('')}</div>
      <div class="nav-row"><button class="btn ghost" data-act="back" type="button">← Back</button></div>
    </div>`;
  } else if (finder.step === 'time') {
    box.innerHTML = `${stepDots()}<div class="card finder-card">
      <h2>How much time do you have?</h2>
      <p class="q-sub">Ghibli films run from about 75 to 137 minutes.</p>
      <div class="chips">${TIMES.map(t => chip('time', t.id, t.icon, t.label, '')).join('')}</div>
      <div class="nav-row"><button class="btn ghost" data-act="back" type="button">← Back</button></div>
    </div>`;
  } else {
    renderResult(box);
  }
}

function chip(act, id, icon, label, hint) {
  return `<button class="chip" type="button" data-act="${act}" data-id="${id}">
    <span class="ico" aria-hidden="true">${icon}</span><span><b>${esc(label)}</b>${hint ? `<small>${esc(hint)}</small>` : ''}</span></button>`;
}

function renderResult(box) {
  const n = finder.ranked.length;
  const top = finder.ranked[finder.idx % n];
  const f = top.film;
  const watched = recOf(f.id);
  const next = [1, 2].map(i => finder.ranked[(finder.idx + i) % n]).filter((e, i, arr) => e && e.film.id !== f.id && arr.findIndex(x => x.film.id === e.film.id) === i);
  const goal = GOALS.find(g => g.id === finder.goal);
  const meta = [f.year, f.runtime ? f.runtime + ' min' : '', f.director ? 'Directed by ' + f.director : '', f.rt ? '🍅 ' + f.rt + '%' : ''].filter(Boolean).join(' · ');

  box.innerHTML = `${stepDots()}
  <article class="card result">
    <div class="result-banner">${f.banner ? `<img src="${esc(f.banner)}" alt="Scene from ${esc(f.title)}">` : ''}</div>
    <div class="result-body">
      <div class="badges">
        <span class="badge">${finder.idx === 0 ? '✨ Your perfect match' : '🌿 Another good fit'} · ${top.pct}%</span>
        ${top.rewatch ? '<span class="badge alt">Rewatch ' + (watched.rating ? '· you gave it ' + watched.rating + '★' : '') + '</span>' : ''}
        ${goal ? `<span class="badge alt">${goal.icon} ${esc(goal.label)}</span>` : ''}
      </div>
      <h2>${esc(f.title)}</h2>
      <p class="jp">${esc([f.japanese, f.romaji].filter(Boolean).join(' · '))}</p>
      <p class="meta">${esc(meta)}</p>
      ${f.vibe ? `<p class="vibe">${esc(f.vibe)}</p>` : ''}
      <p class="why">${esc(whyText(top))}</p>
      <p class="desc">${esc(f.description)}</p>
      <div class="actions">
        <button class="btn primary" type="button" data-act="open" data-id="${esc(f.id)}">${watched ? '✓ Watched · update rating' : '✓ I watched it · rate it'}</button>
        <button class="btn" type="button" data-act="another">🎲 Show me another</button>
        <button class="btn ghost" type="button" data-act="restart">↺ Start over</button>
      </div>
    </div>
  </article>
  ${next.length ? `<h3 class="alts-title">Also great for you</h3><div class="alts">${next.map(e => `
    <button class="alt-card" type="button" data-act="open" data-id="${esc(e.film.id)}">
      <img src="${esc(e.film.image)}" alt="" loading="lazy">
      <span><h3>${esc(e.film.title)}</h3><p>${e.pct}% match · ${esc(e.film.year)}${e.film.runtime ? ' · ' + e.film.runtime + ' min' : ''}</p></span>
    </button>`).join('')}</div>` : ''}`;
}

function startRanking() {
  finder.ranked = rankFilms(finder);
  finder.idx = 0;
  finder.step = 'result';
}

/* =====================================================================
   My films
   ===================================================================== */
function renderFilms() {
  const grid = $('#filmGrid');
  if (filmsError) { grid.innerHTML = `<p class="empty">${esc(filmsError)} <button class="link-btn" data-act="reload" type="button">Try again</button></p>`; return; }
  if (!films.length) { grid.innerHTML = '<p class="empty">Loading films…</p>'; return; }

  let list = films.filter(f => {
    const r = recOf(f.id);
    if (view.filter === 'unwatched') return !r;
    if (view.filter === 'watched') return !!r;
    if (view.filter === 'loved') return r && r.rating >= 4;
    return true;
  });
  const by = {
    year: (a, b) => a.year.localeCompare(b.year) || a.title.localeCompare(b.title),
    title: (a, b) => a.title.localeCompare(b.title),
    mine: (a, b) => ((recOf(b.id) || {}).rating || -1) - ((recOf(a.id) || {}).rating || -1) || a.title.localeCompare(b.title),
    rt: (a, b) => b.rt - a.rt,
    runtime: (a, b) => a.runtime - b.runtime
  };
  list = list.slice().sort(by[view.sort] || by.year);

  if (!list.length) {
    grid.innerHTML = '<p class="empty">Nothing on this shelf yet. Try a different filter 🌿</p>';
    return;
  }
  grid.innerHTML = list.map(f => {
    const r = recOf(f.id);
    const status = r ? (r.rating ? starsHTML(r.rating) : '<span>Watched · not rated</span>') : '<span>Not watched</span>';
    return `<button class="film" type="button" data-act="open" data-id="${esc(f.id)}">
      <div class="poster"><img src="${esc(f.image)}" alt="Poster for ${esc(f.title)}" loading="lazy">${r ? '<span class="seen" aria-label="Watched">Seen ✓</span>' : ''}</div>
      <div><h3>${esc(f.title)}</h3><p>${esc(f.year)}${f.runtime ? ' · ' + f.runtime + ' min' : ''}</p><p>${status}</p></div>
    </button>`;
  }).join('');
}

function renderStats() {
  const el = $('#stats');
  if (!films.length) { el.innerHTML = ''; return; }
  const recs = films.map(f => recOf(f.id)).filter(Boolean);
  const rated = recs.filter(r => r.rating > 0);
  const avg = rated.length ? (rated.reduce((a, r) => a + r.rating, 0) / rated.length).toFixed(1) : '–';
  el.innerHTML = `<span class="pill"><b>${recs.length}</b> of ${films.length} watched</span><span class="pill">Average rating <b>${avg}</b> ★</span>`;
}

/* =====================================================================
   Film dialog (mark watched + rate)
   ===================================================================== */
function openFilm(id) {
  const f = filmById(id);
  if (!f) return;
  currentFilmId = id;
  renderDialog();
  const dlg = $('#filmDialog');
  if (!dlg.open) dlg.showModal();
}

function renderDialog() {
  const f = filmById(currentFilmId);
  if (!f) return;
  const r = recOf(f.id);
  const meta = [f.year, f.runtime ? f.runtime + ' min' : '', f.director ? 'Directed by ' + f.director : '', f.rt ? '🍅 ' + f.rt + '%' : ''].filter(Boolean).join(' · ');
  const feel = DIMS.map((d, i) => [d, f.p[i]]).filter(([, v]) => v >= 4).map(([d]) => DIM_NAME[d]);
  const NOTES = ['', 'Not for me', 'It was okay', 'Liked it', 'Loved it', 'An all-time favorite'];
  $('#filmDialogBody').innerHTML = `
    <div class="dlg-banner">${f.banner ? `<img src="${esc(f.banner)}" alt="">` : ''}</div>
    <div class="dlg-body">
      <button class="dlg-close" type="button" data-act="close" aria-label="Close">×</button>
      <h2>${esc(f.title)}</h2>
      <p class="jp">${esc([f.japanese, f.romaji].filter(Boolean).join(' · '))}</p>
      <p class="meta">${esc(meta)}</p>
      ${f.vibe ? `<p class="vibe">${esc(f.vibe)}</p>` : ''}
      ${feel.length ? `<div class="badges">${feel.map(x => `<span class="badge alt">${esc(x)}</span>`).join('')}</div>` : ''}
      <p class="desc">${esc(f.description)}</p>
      <div class="rate">
        <p class="rate-label">${r ? 'Your rating' : 'Watched it? Rate it to save it'}</p>
        <div class="star-row" role="group" aria-label="Rate ${esc(f.title)}">
          ${[1, 2, 3, 4, 5].map(n => `<button class="star-btn ${r && r.rating >= n ? 'on' : ''}" type="button" data-act="star" data-n="${n}" aria-label="${n} star${n > 1 ? 's' : ''}" aria-pressed="${!!(r && r.rating === n)}">★</button>`).join('')}
        </div>
        <p class="rate-note">${r ? (r.rating ? NOTES[r.rating] : 'Watched, not rated yet') : ''}</p>
      </div>
      <div class="actions">
        ${r ? '<button class="btn" type="button" data-act="unwatch">Remove from watched</button>' : '<button class="btn primary" type="button" data-act="watch">✓ Mark as watched</button>'}
        <button class="btn ghost" type="button" data-act="close">Close</button>
      </div>
    </div>`;
}

function setWatched(id, on) {
  if (on) store.watched[id] = store.watched[id] || { rating: 0, date: new Date().toISOString().slice(0, 10) };
  else delete store.watched[id];
  afterChange();
}
function setRating(id, n) {
  const rec = store.watched[id] || { rating: 0, date: new Date().toISOString().slice(0, 10) };
  rec.rating = rec.rating === n ? 0 : n;
  store.watched[id] = rec;
  const f = filmById(id);
  toast(rec.rating ? `Saved ${rec.rating}★ for ${f ? f.title : 'this film'}` : 'Rating cleared');
  afterChange();
}

function afterChange() {
  saveStore();
  tvStale = true;
  renderStats();
  renderFilms();
  if (currentFilmId && $('#filmDialog').open) renderDialog();
  if (currentTab === 'find' && finder.step === 'result') {
    // keep the same pick on screen, just refresh its button labels
    renderFinder();
  }
  if (currentTab === 'tv') renderTV();
}

/* =====================================================================
   TV suggestions (TVMaze)
   ===================================================================== */
let tvCache = (() => { const c = lsGet(KEY_TV); return c && typeof c === 'object' ? c : {}; })();

function stripHTML(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').trim();
}
function slimShow(s) {
  return {
    id: s.id, name: s.name, url: s.url, genres: Array.isArray(s.genres) ? s.genres : [],
    premiered: s.premiered || '', rating: s.rating && s.rating.average ? s.rating.average : 0,
    image: s.image ? (s.image.medium || s.image.original || '') : '',
    summary: stripHTML(s.summary), status: s.status || '',
    network: (s.network && s.network.name) || (s.webChannel && s.webChannel.name) || ''
  };
}
const nameMatches = (name, c) => {
  const a = compact(name);
  return [c.q, ...(c.alt || [])].some(n => { const k = compact(n); return k && (a.includes(k) || k.includes(a)); });
};

/* Returns a slim show, or null if TVMaze has no good match. Throws on network errors. */
async function fetchShow(c, retry = true) {
  const hit = tvCache[c.q];
  if (hit && Date.now() - hit.t < 7 * DAY) return hit.show;
  const res = await fetch(`${API_TV}/search/shows?q=${encodeURIComponent(c.q)}`);
  if (res.status === 429 && retry) { await new Promise(r => setTimeout(r, 1200)); return fetchShow(c, false); }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const results = await res.json();
  let show = null;
  for (const r of (results || []).slice(0, 5)) {
    if (r && r.show && nameMatches(r.show.name, c)) { show = slimShow(r.show); break; }
  }
  tvCache[c.q] = { t: Date.now(), show };
  return show;
}

async function resolveAll(cands, concurrency = 3) {
  const out = new Array(cands.length).fill(undefined);
  let errors = 0, i = 0;
  async function worker() {
    while (i < cands.length) {
      const k = i++;
      try { out[k] = await fetchShow(cands[k]); } catch (e) { errors++; out[k] = null; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, cands.length) }, worker));
  lsSet(KEY_TV, tvCache);
  return { out, errors };
}

function tasteVector(rated) {
  const v = Object.fromEntries(DIMS.map(d => [d, 0]));
  for (const f of rated) {
    const w = recOf(f.id).rating - 2.5;
    DIMS.forEach((d, i) => { v[d] += w * f.p[i]; });
  }
  return v;
}
function bestFilmFor(d, rated) {
  const i = DIMS.indexOf(d);
  return rated.slice().sort((a, b) => (recOf(b.id).rating - 2.5) * b.p[i] - (recOf(a.id).rating - 2.5) * a.p[i])[0];
}
const rotate = (list, n) => { const k = list.length ? n % list.length : 0; return list.slice(k).concat(list.slice(0, k)); };

function planShows() {
  const rated = ratedFilms();
  if (rated.length < 2) return { need: true, count: rated.length };
  const v = tasteVector(rated);
  const dims = DIMS.slice().sort((a, b) => v[b] - v[a]);
  const top = dims.slice(0, 3);
  const order = [top[0], top[1], top[0], top[2], top[0], top[1], top[2], top[0], top[1], top[2]];
  const used = new Set(store.dismissed.map(compact));
  const cursor = {};
  const cands = [];
  for (const d of order) {
    const list = rotate(SHOWS[d], store.shuffle * 2);
    let i = cursor[d] || 0;
    while (i < list.length && used.has(compact(list[i].q))) i++;
    if (i < list.length) { cands.push({ ...list[i], dim: d }); used.add(compact(list[i].q)); cursor[d] = i + 1; }
    else cursor[d] = i;
  }
  return { candidates: cands, top, v, rated };
}

function tvSkeleton() {
  return `<div class="tv-grid">${'<div class="skeleton"></div>'.repeat(4)}</div>`;
}

async function renderTV() {
  const box = $('#tvBody');
  const token = ++tvToken;
  tvStale = false;

  if (filmsError || !films.length) {
    box.innerHTML = `<div class="card notice">${SPROUT}<h2>Films aren't loaded yet</h2><p>${esc(filmsError || 'Hang on while the film list loads.')}</p></div>`;
    return;
  }

  const plan = planShows();
  if (plan.need) {
    const pct = Math.round(100 * plan.count / 2);
    box.innerHTML = `<div class="card notice">${SPROUT}
      <h2>Rate a couple of films first</h2>
      <p>Once you've rated at least 2 Ghibli films, I'll suggest TV shows that match what you loved.</p>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="2" aria-valuenow="${plan.count}"><i style="width:${pct}%"></i></div>
      <p>${plan.count} of 2 rated</p>
      <button class="btn primary" type="button" data-act="tab" data-tab="films">Go to My films</button>
    </div>`;
    return;
  }

  const likes = plan.top.filter(d => plan.v[d] > 0).slice(0, 2).map(d => DIM_NAME[d]);
  const head = `<div class="card tv-head">
      <h2>📺 Because of your ratings…</h2>
      <p>${likes.length ? `You lean toward <b>${esc(likes.join(' and '))}</b>.` : 'Here are some gentle picks to try.'} Here's what to watch next.</p>
      <div class="actions">
        <button class="btn small" type="button" data-act="shuffle">🔀 Show different shows</button>
        ${store.dismissed.length ? '<button class="btn small ghost" type="button" data-act="unhide">Bring back hidden shows (' + store.dismissed.length + ')</button>' : ''}
      </div>
      <div id="tvList">${tvSkeleton()}</div>
    </div>`;
  box.innerHTML = head;

  const { out, errors } = await resolveAll(plan.candidates);
  if (token !== tvToken) return;   // a newer render started

  const list = $('#tvList');
  const picked = [];
  plan.candidates.forEach((c, i) => { if (out[i] && picked.length < 6) picked.push({ c, show: out[i] }); });

  if (!picked.length) {
    list.innerHTML = errors
      ? `<div class="notice">${SPROUT}<p>Couldn't reach TVMaze right now. Check your connection and try again.</p><button class="btn primary" type="button" data-act="retry-tv">Try again</button></div>
         <p class="hint">Meanwhile, try searching for: ${esc(plan.candidates.slice(0, 6).map(c => c.q).join(', '))}.</p>`
      : '<div class="notice"><p>No matching shows came back. Try "Show different shows".</p></div>';
    // don't cache a failed run so the retry actually refetches
    return;
  }

  list.innerHTML = `<div class="tv-grid">${picked.map(({ c, show }) => {
    const best = bestFilmFor(c.dim, plan.rated);
    const r = best ? recOf(best.id).rating : 0;
    const because = best ? `Because you rated <b>${esc(best.title)}</b> ${r}★: ${esc(TV_REASON[c.dim])}.` : esc(TV_REASON[c.dim]);
    const year = show.premiered ? show.premiered.slice(0, 4) : '';
    const sum = show.summary.length > 230 ? show.summary.slice(0, 227).trimEnd() + '…' : show.summary;
    const meta = [year, show.genres.slice(0, 3).join(', '), show.rating ? '⭐ ' + show.rating.toFixed(1) : ''].filter(Boolean).join(' · ');
    return `<article class="tv">
      <div class="tv-top">
        ${show.image ? `<img src="${esc(show.image)}" alt="Poster for ${esc(show.name)}" loading="lazy">` : '<img alt="" class="broken">'}
        <div><h3>${esc(show.name)}</h3><p class="tv-meta">${esc(meta)}</p><p class="tv-meta">${esc([show.network, show.status].filter(Boolean).join(' · '))}</p></div>
      </div>
      <p class="tv-sum">${esc(sum)}</p>
      <p class="because">${because}</p>
      <div class="tv-actions">
        <a class="btn small primary" href="${esc(show.url)}" target="_blank" rel="noopener">View on TVMaze ↗</a>
        <button class="btn small ghost" type="button" data-act="dismiss" data-q="${esc(c.q)}">Not for me</button>
      </div>
    </article>`;
  }).join('')}</div>`;
}

/* =====================================================================
   Tabs + events
   ===================================================================== */
function showTab(name) {
  currentTab = name;
  $$('.tab').forEach(b => {
    const on = b.dataset.tab === name;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on);
  });
  $$('.view').forEach(v => {
    const on = v.id === 'view-' + name;
    v.classList.toggle('is-active', on);
    v.hidden = !on;
  });
  if (name === 'films') renderFilms();
  if (name === 'tv' && (tvStale || !$('#tvList'))) renderTV();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) { if (e.target === $('#filmDialog')) $('#filmDialog').close(); return; }
  const id = el.dataset.id;
  switch (el.dataset.act) {
    case 'tab': showTab(el.dataset.tab); break;
    case 'goal': finder.goal = id; finder.step = 'mood'; renderFinder(); break;
    case 'mood': finder.mood = id; finder.step = 'time'; renderFinder(); break;
    case 'time': finder.time = id; startRanking(); renderFinder(); break;
    case 'back': finder.step = finder.step === 'time' ? 'mood' : 'goal'; renderFinder(); break;
    case 'restart': Object.assign(finder, { step: 'goal', goal: null, mood: null, time: 'any', ranked: [], idx: 0 }); renderFinder(); break;
    case 'another': finder.idx++; renderFinder(); break;
    case 'open': openFilm(id); break;
    case 'close': $('#filmDialog').close(); break;
    case 'watch': setWatched(currentFilmId, true); break;
    case 'unwatch': setWatched(currentFilmId, false); break;
    case 'star': setRating(currentFilmId, +el.dataset.n); break;
    case 'shuffle': store.shuffle++; saveStore(); renderTV(); break;
    case 'dismiss': store.dismissed.push(el.dataset.q); saveStore(); renderTV(); break;
    case 'unhide': store.dismissed = []; saveStore(); renderTV(); break;
    case 'retry-tv': renderTV(); break;
    case 'reload': init(); break;
  }
});

$('#filterSel').addEventListener('change', e => { view.filter = e.target.value; renderFilms(); });
$('#sortSel').addEventListener('change', e => { view.sort = e.target.value; renderFilms(); });
$('#filmDialog').addEventListener('close', () => { currentFilmId = null; });

/* =====================================================================
   Start
   ===================================================================== */
async function init() {
  renderFinder();
  await loadFilms();
  renderStats();
  renderFinder();
  renderFilms();
  if (currentTab === 'tv') renderTV();
}

init();
