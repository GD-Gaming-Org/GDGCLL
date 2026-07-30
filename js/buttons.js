const DIR = 'data';

let LEVELS = [];
let BROKEN = [];
let TAB = 'list';

function $(id) {
  return document.getElementById(id);
}

function onClick(id, fn) {
  const el = $(id);
  if (el) el.addEventListener('click', fn);
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function ytid(url) {
  const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function levelValue(rank) {
  return 200 * Math.pow(0.93, rank - 1);
}

function score(rank, percent, minPercent) {
  const full = levelValue(rank);
  if (percent >= 100) return full;
  const floor = Math.min(minPercent, 99);
  if (percent < floor) return 0;
  return full * 0.5 * ((percent - floor) / (100 - floor));
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function normalize(raw, path) {
  if (!raw || typeof raw !== 'object') throw new Error('not an object');

  let creators = [];
  if (Array.isArray(raw.creators)) creators = raw.creators.filter(Boolean);
  else if (raw.creators) creators = [raw.creators];
  else if (Array.isArray(raw.creator)) creators = raw.creator.filter(Boolean);
  else if (raw.creator) creators = [raw.creator];

  const verifier = Array.isArray(raw.verifier)
    ? (raw.verifier[0] || '')
    : (raw.verifier || '');

  const pct = Number(raw.percentToQualify);

  const records = (Array.isArray(raw.records) ? raw.records : [])
    .filter(function (r) { return r && typeof r === 'object'; })
    .map(function (r) {
      return {
        user: r.user || 'Unknown',
        percent: Number(r.percent) || 0,
        link: r.link || '',
        mobile: !!r.mobile
      };
    })
    .sort(function (a, b) { return b.percent - a.percent; });

  return {
    path: path,
    id: raw.id || null,
    name: raw.name || path,
    author: raw.author || creators[0] || 'Unknown',
    creators: creators,
    verifier: verifier,
    verification: raw.verification || '',
    percentToQualify: isFinite(pct) ? pct : 100,
    password: raw.password || 'Not provided',
    records: records
  };
}

async function loadLevels() {
  const res = await fetch(DIR + '/list.json');
  if (!res.ok) throw new Error('list.json not found');

  const index = await res.json();
  if (!Array.isArray(index)) throw new Error('list.json must be a list');

  const out = [];

  for (const path of index) {
    try {
      const r = await fetch(DIR + '/levels/' + path + '.json');
      if (!r.ok) throw new Error('file not found (' + r.status + ')');
      out.push(normalize(await r.json(), path));
    } catch (err) {
      BROKEN.push({ path: path, why: err.message });
    }
  }

  return out;
}

function buildLeaderboard() {
  const players = {};

  function key(name) {
    const found = Object.keys(players).find(function (u) {
      return u.toLowerCase() === String(name).toLowerCase();
    });
    return found || name;
  }

  LEVELS.forEach(function (lv, i) {
    const rank = i + 1;

    if (lv.verifier) {
      const u = key(lv.verifier);
      if (!players[u]) players[u] = { verified: 0, beaten: 0, progress: 0, total: 0 };
      players[u].verified++;
      players[u].total += score(rank, 100, lv.percentToQualify);
    }

    lv.records.forEach(function (r) {
      const u = key(r.user);
      if (!players[u]) players[u] = { verified: 0, beaten: 0, progress: 0, total: 0 };
      if (r.percent >= 100) players[u].beaten++;
      else players[u].progress++;
      players[u].total += score(rank, r.percent, lv.percentToQualify);
    });
  });

  return Object.keys(players)
    .map(function (user) {
      const p = players[user];
      return {
        user: user,
        verified: p.verified,
        beaten: p.beaten,
        progress: p.progress,
        total: round(p.total)
      };
    })
    .sort(function (a, b) { return b.total - a.total; });
}

function rankClass(i) {
  if (i === 0) return 'gold';
  if (i === 1) return 'silver';
  if (i === 2) return 'bronze';
  return '';
}

function renderLevels() {
  const el = $('levels');

  if (!LEVELS.length) {
    el.innerHTML = '<div class="empty">No levels yet. Add a name to data/list.json.</div>';
    return;
  }

  el.innerHTML = LEVELS.map(function (lv, i) {
    return '' +
      '<div class="level" data-i="' + i + '">' +
        '<span class="rank ' + rankClass(i) + '">' + (i + 1) + '</span>' +
        '<span class="level-info">' +
          '<span class="level-name">' + esc(lv.name) + '</span>' +
          '<span class="level-by">by ' + esc(lv.creators.join(', ') || lv.author) + '</span>' +
        '</span>' +
        '<span class="level-pct">' + lv.percentToQualify + '%+</span>' +
      '</div>';
  }).join('');

  el.querySelectorAll('.level').forEach(function (row) {
    row.addEventListener('click', function () {
      showDetail(Number(row.dataset.i));
    });
  });
}

function showDetail(i) {
  const lv = LEVELS[i];
  const el = $('detail');
  if (!lv) return;

  const vid = ytid(lv.verification);

  el.innerHTML = '' +
    '<button class="close" id="closeDetail">Close</button>' +
    '<h2 class="detail-name">' + esc(lv.name) + '</h2>' +
    '<p class="detail-by">Created by ' + esc(lv.creators.join(', ') || lv.author) +
      (lv.verifier ? ' &middot; Verified by ' + esc(lv.verifier) : '') + '</p>' +
    (vid
      ? '<a class="thumb" href="' + esc(lv.verification) + '" target="_blank" rel="noopener">' +
          '<img src="https://img.youtube.com/vi/' + vid + '/hqdefault.jpg" alt="Verification video">' +
        '</a>'
      : '') +
    '<div class="facts">' +
      '<div class="fact"><b>Level ID</b>' + (lv.id || '-') + '</div>' +
      '<div class="fact"><b>Password</b>' + esc(lv.password) + '</div>' +
      '<div class="fact"><b>Qualify at</b>' + lv.percentToQualify + '%</div>' +
      '<div class="fact"><b>Points</b>' + round(levelValue(i + 1)) + '</div>' +
    '</div>' +
    '<p class="detail-sub">Records (' + lv.records.length + ')</p>' +
    (lv.records.length
      ? lv.records.map(function (r) {
          return '<div class="rec">' +
            '<span class="rec-pct">' + r.percent + '%</span>' +
            '<span class="rec-who">' + esc(r.user) + '</span>' +
            (r.mobile ? '<span class="rec-mob">MOBILE</span>' : '') +
            (r.link ? '<a href="' + esc(r.link) + '" target="_blank" rel="noopener">Watch</a>' : '') +
          '</div>';
        }).join('')
      : '<div class="rec"><span class="rec-who">No records yet.</span></div>');

  el.hidden = false;
  onClick('closeDetail', function () { el.hidden = true; });
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderScores() {
  const board = buildLeaderboard();
  const el = $('scores');

  if (!board.length) {
    el.innerHTML = '<div class="empty">No records yet.</div>';
    return;
  }

  el.innerHTML = board.map(function (p, i) {
    return '' +
      '<div class="level">' +
        '<span class="rank ' + rankClass(i) + '">' + (i + 1) + '</span>' +
        '<span class="level-info">' +
          '<span class="level-name">' + esc(p.user) + '</span>' +
          '<span class="level-by">' + p.verified + ' verified &middot; ' +
            p.beaten + ' beaten &middot; ' + p.progress + ' in progress</span>' +
        '</span>' +
        '<span class="level-pct">' + p.total + '</span>' +
      '</div>';
  }).join('');
}

function renderMessages() {
  if (!BROKEN.length) {
    $('msg').innerHTML = '';
    return;
  }

  $('msg').innerHTML =
    '<div class="note">' +
      '<b>' + BROKEN.length + ' level file(s) could not load</b>' +
      BROKEN.map(function (b) {
        return b.path + '.json &mdash; ' + esc(b.why);
      }).join('<br>') +
    '</div>';
}

function setTab(name) {
  TAB = name;
  $('tabList').classList.toggle('active', name === 'list');
  $('tabScores').classList.toggle('active', name === 'scores');
  $('levels').hidden = name !== 'list';
  $('scores').hidden = name !== 'scores';
  $('detail').hidden = true;
}

onClick('login', function () {
  window.location.href = 'html/login.html';
});

onClick('profile', function () {
  window.location.href = 'html/profile.html';
});

onClick('tabList', function () { setTab('list'); });
onClick('tabScores', function () { setTab('scores'); });

onClick('back', function () {
  window.location.href = '../index.html';
});

onClick('loginGo', function () {
  const user = $('userInput').value.trim();
  const msg = $('loginMsg');
  if (user === '') {
    msg.textContent = 'Enter your username first.';
    return;
  }
  localStorage.setItem('gdgcll-user', user);
  msg.textContent = 'Logged in as ' + user;
});

async function init() {
  const saved = localStorage.getItem('gdgcll-user');
  if (saved && $('profile')) $('profile').textContent = saved;

  if (!$('levels')) return;

  try {
    LEVELS = await loadLevels();
  } catch (err) {
    $('msg').innerHTML =
      '<div class="note"><b>Could not read data/list.json</b>' +
      esc(err.message) + '</div>';
  }

  renderMessages();
  renderLevels();
  renderScores();
  setTab('list');
}

init();
