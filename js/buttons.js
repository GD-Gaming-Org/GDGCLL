const ADMIN_ROLES = ['owner', 'admin', 'developer'];

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
  return 200 * Math.pow(0.97, rank - 1);
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

function currentUser() {
  return localStorage.getItem('gd_user') || '';
}

function staffEntry(name) {
  if (!name) return null;
  return STAFF.find(function (s) {
    return s.name.toLowerCase() === name.toLowerCase();
  }) || null;
}

function h32(str, salt) {
  let h = 2166136261 >>> 0;
  const t = salt + str + salt;
  for (let r = 0; r < 3000; r++) {
    for (let i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h = (h ^ (h >>> 13)) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function hashCode(str) {
  return h32(str, 'gdgcll-a') + h32(str, 'gdgcll-b');
}

function staffByKey(hash) {
  if (!hash) return null;
  return STAFF.find(function (s) {
    return s.key && s.key === hash;
  }) || null;
}

function isAdmin() {
  const s = staffEntry(currentUser());
  if (!s || !s.key) return false;
  if (ADMIN_ROLES.indexOf(s.role.toLowerCase()) === -1) return false;
  return localStorage.getItem('gd_key') === s.key;
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
    banner: raw.banner || '',
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

    if (lv.verifier) {
      const v = slot(lv.verifier);
      v.verified++;
      if (lv.verification) {
        v.total += score(rank, 100, lv.percentToQualify);
      } else {
        v.pending++;
      }
    }

    lv.records.forEach(function (r) {
      const p = slot(r.user);

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
    const vid = ytid(lv.verification);
    const banner = lv.banner
      ? lv.banner
      : (vid ? 'https://img.youtube.com/vi/' + vid + '/mqdefault.jpg' : '');

    return '' +
      '<div class="level' + (banner ? ' has-banner' : '') + '" data-i="' + i + '"' +
        (banner ? ' style="--banner:url(' + banner + ')"' : '') + '>' +
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
      : '') +
    '<div class="facts">' +
      '<div class="fact"><b>Level ID</b>' + (lv.id || '-') + '</div>' +
      '<div class="fact"><b>Password</b>' + esc(lv.password) + '</div>' +
      '<div class="fact"><b>Qualify at</b>' + lv.percentToQualify + '%</div>' +
      '<div class="fact"><b>Points</b>' + round(levelValue(i + 1)) + '</div>' +
    '</div>' +
    '<p class="detail-sub">Records (' + lv.records.length + ')</p>' +
    (lv.records.length
      ? lv.records.map(function (r, idx) {
          return '<div class="rec' + (r.proof ? '' : ' no-proof') + '">' +
            '<span class="rec-pct">' + r.percent + '%</span>' +
            '<span class="pfp pfp-xs">' + avatarFor(r.user) + '</span>' +
            '<span class="rec-who rec-link" data-player="' + esc(r.user) + '">' +
              esc(r.user) + '</span>' +
            (idx === 0 && r.percent >= 100 ? '<span class="first-tag">FIRST</span>' : '') +
            (r.mobile ? '<span class="rec-mob">MOBILE</span>' : '') +
            (r.proof
              ? '<a href="' + esc(r.link) + '" target="_blank" rel="noopener">Watch</a>'
              : '<span class="rec-none">NO PROOF</span>') +
          '</div>';
        }).join('')
      : '<div class="rec"><span class="rec-who">No records yet.</span></div>');

  el.hidden = false;
  onClick('closeDetail', function () { el.hidden = true; });

  el.querySelectorAll('.rec-link').forEach(function (n) {
    n.addEventListener('click', function () {
      showPlayer(n.dataset.player);
    });
  });
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
      '<div class="level player-row" data-player="' + esc(p.user) + '">' +
        '<span class="rank ' + rankClass(i) + '">' + (i + 1) + '</span>' +
        '<span class="pfp pfp-sm">' + avatarFor(p.user) + '</span>' +
        '<span class="level-info">' +
          '<span class="level-name">' + esc(p.user) + '</span>' +
          '<span class="level-by">' + p.verified + ' verified &middot; ' +
            p.beaten + ' beaten &middot; ' + p.progress + ' in progress' + extra + '</span>' +
        '</span>' +
        '<span class="level-pct">' + p.total + '</span>' +
      '</div>';
  }).join('');

  el.querySelectorAll('.player-row').forEach(function (row) {
    row.addEventListener('click', function () {
      showPlayer(row.dataset.player);
    });
  });
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

function renderAdmin() {
  const el = $('admin');
  if (!el) return;

  const who = staffEntry(currentUser());
  if (!who) return;

  el.innerHTML = '' +
    '<div class="admin-box">' +
      '<h3 class="admin-title">Signed in as ' + esc(who.name) + ' &middot; ' + esc(who.role) + '</h3>' +
      '<p class="admin-hint">Fill a form, press Generate, then paste the result into ' +
        '<b>data/data.js</b> and commit it.</p>' +
    '</div>' +

    '<div class="admin-box">' +
      '<h3 class="admin-title">Add a level</h3>' +

      '<label class="field"><span>Key (no spaces, lowercase)</span>' +
        '<input type="text" id="aKey" placeholder="ninecircles"></label>' +

      '<label class="field"><span>Level name</span>' +
        '<input type="text" id="aName" placeholder="Nine Circles"></label>' +

      '<label class="field"><span>Level ID</span>' +
        '<input type="text" id="aId" placeholder="4322194"></label>' +

      '<label class="field"><span>Creators (comma separated)</span>' +
        '<input type="text" id="aCreators" placeholder="Zobros"></label>' +

      '<label class="field"><span>Verifier</span>' +
        '<input type="text" id="aVerifier" placeholder="Zobros"></label>' +

      '<label class="field"><span>Verification video</span>' +
        '<input type="text" id="aVideo" placeholder="https://youtu.be/..."></label>' +

      '<label class="field"><span>Percent to qualify</span>' +
        '<input type="number" id="aPct" value="50"></label>' +

      '<label class="field"><span>Password</span>' +
        '<input type="text" id="aPass" value="Free To Copy"></label>' +

      '<label class="field"><span>Place at rank</span>' +
        '<input type="number" id="aRank" value="1" min="1"></label>' +

      '<button class="login" id="genLevel">Generate level code</button>' +
    '</div>' +

    '<div class="admin-box">' +
      '<h3 class="admin-title">Add a record</h3>' +

      '<label class="field"><span>Level</span>' +
        '<select id="rLevel">' +
          LIST.map(function (k) {
            const lv = LEVELS_DATA[k];
            return '<option value="' + esc(k) + '">' + esc(lv ? lv.name : k) + '</option>';
          }).join('') +
        '</select></label>' +

      '<label class="field"><span>Player name</span>' +
        '<input type="text" id="rUser" placeholder="Pester44"></label>' +

      '<label class="field"><span>Percent</span>' +
        '<input type="number" id="rPct" value="100" min="1" max="100"></label>' +

      '<label class="field"><span>Proof video (required)</span>' +
        '<input type="text" id="rLink" placeholder="https://youtu.be/..."></label>' +

      '<label class="field checkline">' +
        '<input type="checkbox" id="rMobile"> <span>Mobile run</span></label>' +

      '<button class="login" id="genRecord">Generate record code</button>' +
    '</div>' +

    '<div class="admin-box" id="outBox" hidden>' +
      '<h3 class="admin-title">Copy this</h3>' +
      '<pre class="admin-out" id="outCode"></pre>' +
      '<button class="login" id="copyOut">Copy</button>' +
      '<p class="admin-hint" id="outWhere"></p>' +
    '</div>';

  onClick('genLevel', genLevel);
  onClick('genRecord', genRecord);
  onClick('copyOut', function () {
    navigator.clipboard.writeText($('outCode').textContent);
    $('copyOut').textContent = 'Copied';
    setTimeout(function () { $('copyOut').textContent = 'Copy'; }, 1200);
  });
}

function showOutput(code, where) {
  $('outCode').textContent = code;
  $('outWhere').textContent = where;
  $('outBox').hidden = false;
  $('outBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function genLevel() {
  const key = $('aKey').value.trim().toLowerCase().replace(/\s+/g, '');
  const name = $('aName').value.trim();

  if (!key || !name) {
    alert('Key and level name are required.');
    return;
  }

  const creators = $('aCreators').value
    .split(',')
    .map(function (s) { return s.trim(); })
    .filter(Boolean);

  const level = {
    id: Number($('aId').value) || 0,
    name: name,
    author: creators[0] || '',
    creators: creators,
    verifier: $('aVerifier').value.trim(),
    verification: $('aVideo').value.trim(),
    percentToQualify: Number($('aPct').value) || 100,
    password: $('aPass').value.trim() || 'Free To Copy',
    records: []
  };

  const rank = Math.max(1, Number($('aRank').value) || 1);
  const newList = LIST.slice();
  newList.splice(rank - 1, 0, key);

  const code =
    'const LIST = [\n' +
    newList.map(function (k) { return '  "' + k + '"'; }).join(',\n') +
    '\n];\n\n' +
    'Add this inside LEVELS_DATA:\n\n' +
    '  "' + key + '": ' + JSON.stringify(level, null, 2).replace(/\n/g, '\n  ') + ',';

  showOutput(code, 'Replace LIST with the new one, then add the level block inside LEVELS_DATA. Watch the commas.');
}

function genRecord() {
  const key = $('rLevel').value;
  const user = $('rUser').value.trim();
  const link = $('rLink').value.trim();

  if (!user) {
    alert('Player name is required.');
    return;
  }
  if (!link) {
    alert('Proof video is required, or the record scores nothing.');
    return;
  }

  const record = {
    user: user,
    percent: Number($('rPct').value) || 100,
    link: link,
    mobile: $('rMobile').checked
  };

  const existing = (LEVELS_DATA[key] && LEVELS_DATA[key].records) || [];
  const all = existing.concat([record]);

  const code =
    '"records": ' + JSON.stringify(all, null, 2).replace(/\n/g, '\n    ');

  showOutput(code, 'Replace the "records" line inside "' + key + '" with this.');
}

function setTab(name) {
  const map = {
    list:   { tab: 'tabList',   panel: 'levels' },
    scores: { tab: 'tabScores', panel: 'scores' },
    staff:  { tab: 'tabStaff',  panel: 'staff'  },
    admin:  { tab: 'tabAdmin',  panel: 'admin'  }
  };

  Object.keys(map).forEach(function (k) {
    const t = $(map[k].tab);
    const p = $(map[k].panel);
    if (t) t.classList.toggle('active', k === name);
    if (p) p.hidden = k !== name;
  });

  if ($('detail')) $('detail').hidden = true;
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('gd_users') || '{}');
  } catch (e) {
    return {};
  }
}

function showUser() {
  const name = currentUser();
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
  window.location.href = 'html/profile.html';
});

onClick('back', function () {
  window.location.href = '../index.html';
});

onClick('tabList', function () { setTab('list'); });
onClick('tabScores', function () { setTab('scores'); });
onClick('tabStaff', function () { setTab('staff'); });
onClick('tabAdmin', function () { setTab('admin'); });

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
  localStorage.removeItem('gd_key');
  msg.textContent = 'Logged in as ' + user;
  setTimeout(function () {
    window.location.href = '../index.html';
  }, 800);
});

onClick('codeGo', function () {
  const raw = $('codeInput').value.trim().toUpperCase();
  const msg = $('loginMsg');

  if (!raw) {
    msg.textContent = 'Enter your account code.';
    return;
  }

  const hash = hashCode(raw);
  const who = staffByKey(hash);

  if (!who) {
    msg.textContent = 'That code is not valid.';
    return;
  }

  localStorage.setItem('gd_user', who.name);
  localStorage.setItem('gd_key', hash);
  msg.textContent = 'Welcome back, ' + who.name + '.';
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
  if (staffEntry(user)) {
    msg.textContent = 'That name belongs to staff. Log in with your account code.';
    return;
  }

  users[user] = pass;
  localStorage.setItem('gd_users', JSON.stringify(users));
  localStorage.setItem('gd_user', user);
  localStorage.removeItem('gd_key');
  msg.textContent = 'Registered as ' + user;
  setTimeout(function () {
    window.location.href = '../index.html';
  }, 800);
});


const THEMES = [
  { key: 'blue',   label: 'Blue',   cls: 'sw-blue'   },
  { key: 'purple', label: 'Purple', cls: 'sw-purple' },
  { key: 'red',    label: 'Red',    cls: 'sw-red'    },
  { key: 'dark',   label: 'Dark',   cls: 'sw-dark'   },
  { key: 'mint',   label: 'Mint',   cls: 'sw-mint'   },
  { key: 'classic', label: 'Classic', cls: 'sw-classic' }
];

function applyTheme(key) {
  const t = key || localStorage.getItem('gd_theme') || 'blue';
  document.body.setAttribute('data-theme', t);
  localStorage.setItem('gd_theme', t);
  document.querySelectorAll('.theme-btn').forEach(function (b) {
    b.classList.toggle('on', b.dataset.theme === t);
  });
}

func
