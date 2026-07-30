let LEVELS = [];

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

function rankClass(i) {
  if (i === 0) return 'gold';
  if (i === 1) return 'silver';
  if (i === 2) return 'bronze';
  return '';
}

function normalize(raw, path) {
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
      const link = r.link || '';
      return {
        user: r.user || 'Unknown',
        percent: Number(r.percent) || 0,
        link: link,
        proof: link !== '',
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

function loadLevels() {
  const out = [];
  const missing = [];

  LIST.forEach(function (path) {
    const raw = LEVELS_DATA[path];
    if (!raw) {
      missing.push(path);
      return;
    }
    out.push(normalize(raw, path));
  });

  if (missing.length && $('msg')) {
    $('msg').innerHTML =
      '<div class="note"><b>Missing level data</b>' +
      missing.map(esc).join('<br>') +
      '<br><br>Add them to data/data.js</div>';
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

  function slot(name) {
    const u = key(name);
    if (!players[u]) {
      players[u] = { verified: 0, beaten: 0, progress: 0, pending: 0, total: 0 };
    }
    return players[u];
  }

  LEVELS.forEach(function (lv, i) {
    const rank = i + 1;

    // Verifying only counts if there is a verification video.
    if (lv.verifier) {
      const p = slot(lv.verifier);
      if (lv.verification) {
        p.verified++;
        p.total += score(rank, 100, lv.percentToQualify);
      } else {
        p.pending++;
      }
    }

    lv.records.forEach(function (r) {
      const p = slot(r.user);

      // No proof video, no points.
      if (!r.proof) {
        p.pending++;
        return;
      }

      if (r.percent >= 100) p.beaten++;
      else p.progress++;

      p.total += score(rank, r.percent, lv.percentToQualify);
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
        pending: p.pending,
        total: round(p.total)
      };
    })
    .filter(function (p) {
      return p.total > 0;
    })
    .sort(function (a, b) { return b.total - a.total; });
}

function renderLevels() {
  const el = $('levels');
  if (!el) return;

  if (!LEVELS.length) {
    el.innerHTML = '<div class="empty">No levels yet. Add one to data/data.js</div>';
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
  if (!lv || !el) return;

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
      : '<div class="note-small">No verification video yet &mdash; this level gives no points.</div>') +
    '<div class="facts">' +
      '<div class="fact"><b>Level ID</b>' + (lv.id || '-') + '</div>' +
      '<div class="fact"><b>Password</b>' + esc(lv.password) + '</div>' +
      '<div class="fact"><b>Qualify at</b>' + lv.percentToQualify + '%</div>' +
      '<div class="fact"><b>Points</b>' + round(levelValue(i + 1)) + '</div>' +
    '</div>' +
    '<p class="detail-sub">Records (' + lv.records.length + ')</p>' +
    (lv.records.length
      ? lv.records.map(function (r) {
          return '<div class="rec' + (r.proof ? '' : ' no-proof') + '">' +
            '<span class="rec-pct">' + r.percent + '%</span>' +
            '<span class="rec-who">' + esc(r.user) + '</span>' +
            (r.mobile ? '<span class="rec-mob">MOBILE</span>' : '') +
            (r.proof
              ? '<a href="' + esc(r.link) + '" target="_blank" rel="noopener">Watch</a>'
              : '<span class="rec-none">NO PROOF</span>') +
          '</div>';
        }).join('')
      : '<div class="rec"><span class="rec-who">No records yet.</span></div>');

  el.hidden = false;
  onClick('closeDetail', function () { el.hidden = true; });
}

function renderScores() {
  const el = $('scores');
  if (!el) return;

  const board = buildLeaderboard();

  if (!board.length) {
    el.innerHTML =
      '<div class="empty">No proven records yet.<br>' +
      'A record needs a video link before it counts.</div>';
    return;
  }

  el.innerHTML = board.map(function (p, i) {
    const extra = p.pending
      ? ' &middot; <span class="pending">' + p.pending + ' unproven</span>'
      : '';

    return '' +
      '<div class="level">' +
        '<span class="rank ' + rankClass(i) + '">' + (i + 1) + '</span>' +
        '<span class="level-info">' +
          '<span class="level-name">' + esc(p.user) + '</span>' +
          '<span class="level-by">' + p.verified + ' verified &middot; ' +
            p.beaten + ' beaten &middot; ' + p.progress + ' in progress' + extra + '</span>' +
        '</span>' +
        '<span class="level-pct">' + p.total + '</span>' +
      '</div>';
  }).join('');
}

function renderStaff() {
  const el = $('staff');
  if (!el) return;

  el.innerHTML = STAFF.map(function (s) {
    const name = s.link
      ? '<a href="' + esc(s.link) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>'
      : esc(s.name);

    return '' +
      '<div class="level">' +
        '<span class="level-info">' +
          '<span class="level-name">' + name + '</span>' +
          '<span class="level-by">' + esc(s.role) + '</span>' +
        '</span>' +
      '</div>';
  }).join('');
}

function setTab(name) {
  if (!$('tabList')) return;
  $('tabList').classList.toggle('active', name === 'list');
  $('tabScores').classList.toggle('active', name === 'scores');
  $('tabStaff').classList.toggle('active', name === 'staff');
  $('levels').hidden = name !== 'list';
  $('scores').hidden = name !== 'scores';
  $('staff').hidden = name !== 'staff';
  $('detail').hidden = true;
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('gd_users') || '{}');
  } catch (e) {
    return {};
  }
}

function showUser() {
  const name = localStorage.getItem('gd_user');
  const btn = $('profile');
  if (name && btn) btn.textContent = name;
}

onClick('login', function () {
  window.location.href = 'html/login.html';
});

onClick('register', function () {
  window.location.href = 'html/register.html';
});

onClick('profile', function () {
  const name = localStorage.getItem('gd_user');
  if (!name) {
    window.location.href = 'html/login.html';
    return;
  }
  if (confirm('Logged in as ' + name + '. Log out?')) {
    localStorage.removeItem('gd_user');
    location.reload();
  }
});

onClick('back', function () {
  window.location.href = '../index.html';
});

onClick('tabList', function () { setTab('list'); });
onClick('tabScores', function () { setTab('scores'); });
onClick('tabStaff', function () { setTab('staff'); });

onClick('loginGo', function () {
  const user = $('userInput').value.trim();
  const pass = $('passInput').value;
  const msg = $('loginMsg');
  const users = getUsers();

  if (user === '') {
    msg.textContent = 'Enter your username.';
    return;
  }
  if (!users[user]) {
    msg.textContent = 'No account with that name. Register first.';
    return;
  }
  if (users[user] !== pass) {
    msg.textContent = 'Wrong password.';
    return;
  }

  localStorage.setItem('gd_user', user);
  msg.textContent = 'Logged in as ' + user;
  setTimeout(function () {
    window.location.href = '../index.html';
  }, 800);
});

onClick('regGo', function () {
  const user = $('regUser').value.trim();
  const pass = $('regPass').value;
  const pass2 = $('regPass2').value;
  const msg = $('regMsg');

  if (user.length < 3) {
    msg.textContent = 'Username must be at least 3 letters.';
    return;
  }
  if (pass.length < 6) {
    msg.textContent = 'Password must be at least 6 characters.';
    return;
  }
  if (pass !== pass2) {
    msg.textContent = 'Passwords do not match.';
    return;
  }

  const users = getUsers();
  if (users[user]) {
    msg.textContent = 'That username is taken.';
    return;
  }

  users[user] = pass;
  localStorage.setItem('gd_users', JSON.stringify(users));
  localStorage.setItem('gd_user', user);
  msg.textContent = 'Registered as ' + user;
  setTimeout(function () {
    window.location.href = '../index.html';
  }, 800);
});

function init() {
  showUser();

  if (!$('levels')) return;

  LEVELS = loadLevels();
  renderLevels();
  renderScores();
  renderStaff();
  setTab('list');
}

init();
