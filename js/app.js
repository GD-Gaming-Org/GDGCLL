const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fix = n => (Math.round(n*100)/100).toFixed(2);
const ytid = u => (String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)||[])[1]||null;

let LEVELS = [];
let ME = { loggedIn: false };
let PEOPLE = [];
let active = 0;

const THEMES=[
  ['purple','Purple'], ['blue','Blue'], ['cyan','Cyan'],
  ['green','Green'], ['classic','GD Classic'], ['gold','Gold'],
  ['orange','Orange'], ['red','Red'], ['pink','Pink'],
  ['mono','Mono'], ['light','Light'], ['bluewhite','Blue & White']
];

function levelValue(r){ return 200*Math.pow(0.97,r-1) }
function score(r,p,m){
  const f = levelValue(r);
  if(p>=100) return f;
  const fl = Math.min(m,99);
  if(p<fl) return 0;
  return f*0.5*((p-fl)/(100-fl));
}

function person(name){
  return PEOPLE.find(p=>p.username.toLowerCase()===String(name).toLowerCase()) || null;
}

function avatar(name){
  const p = person(name);
  if(p && p.avatar) return '<span class="pfp"><img src="'+esc(p.avatar)+'" style="width:100%;height:100%;object-fit:cover"></span>';
  let n=0;
  for(let i=0;i<name.length;i++) n=(n+name.charCodeAt(i)*(i+3))%360;
  return '<span class="pfp" style="background:linear-gradient(150deg,hsl('+n+',58%,54%),hsl('+n+',52%,30%))">'+esc(name[0].toUpperCase())+'</span>';
}

function vipTag(name){
  const p = person(name);
  return (p && p.vip == 1) ? '<span class="tag tag-vip">VIP</span>' : '';
}

function titleTag(name){
  const p = person(name);
  return (p && p.title) ? '<b class="lb-title">'+esc(p.title)+'</b><br>' : '';
}

function roleOf(name){
  const p = person(name);
  return p ? p.role : 'player';
}

async function api(path, opts){
  try {
    const res = await fetch(path, Object.assign({ credentials:'include' }, opts||{}));
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'network_error' };
  }
}

// Fixed: Loads user straight from local storage so we don't need me.php
async function loadMe(){ 
  try {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      ME = JSON.parse(stored);
      ME.loggedIn = true;
    } else {
      ME = { loggedIn: false };
    }
  } catch (e) {
    ME = { loggedIn: false };
  }
}
async function loadLevels(){ LEVELS = (await api('/levels.php')).data || []; }
async function loadPeople(){ PEOPLE = (await api('/people.php')).data || []; }

async function apiRegister(username, password){
  return api('/register.php', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username, password})
  });
}

async function apiLogin(username, password){
  return api('/login.php', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username, password})
  });
}

async function apiLogout(){ 
  return api('/logout.php', { method:'POST' }); 
}

async function apiPostComment(levelId, text){
  return api('/comments.php', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ level_id: levelId, text })
  });
}

async function loadComments(levelId){
  const res = await api('/comments.php?level_id='+levelId);
  return res.data || [];
}

function renderRows(){
  if(!$('rows')) return;
  $('rows').innerHTML = LEVELS.map((lv,i)=>{
    const vid = ytid(lv.verification);
    const min = score(i+1, lv.percent_to_qualify, lv.percent_to_qualify);
    return '<button class="card" data-i="'+i+'" aria-current="'+(i===active)+'">'+
      (vid?'<img class="card-banner" src="https://img.youtube.com/vi/'+vid+'/hqdefault.jpg" alt="">':'')+
      '<div class="card-title"><em>#'+(i+1)+'</em> &ndash; '+esc(lv.name)+'</div>'+
      '<div class="card-by"><span>published by</span> <b>'+esc(lv.creators)+'</b></div>'+
      '<div class="card-pts">'+fix(min)+' ('+lv.percent_to_qualify+'%) &mdash; <b>'+fix(levelValue(i+1))+'</b> (100%) points</div>'+
    '</button>';
  }).join('');
  document.querySelectorAll('.card').forEach(b=>{
    b.addEventListener('click', ()=>{ active=+b.dataset.i; renderRows(); renderDetail(); });
  });
}

async function renderDetail(){
  if(!$('detail')) return;
  const lv = LEVELS[active];
  if(!lv) return;
  const vid = ytid(lv.verification);
  const vics = lv.records ? lv.records.filter(r=>r.percent>=100).length : 0;
  const comments = await loadComments(lv.id);
  const recs = lv.records || [];

  $('detail').innerHTML =
    (vid?'<a class="d-banner" href="'+esc(lv.verification)+'" target="_blank" rel="noopener"><img src="https://img.youtube.com/vi/'+vid+'/hqdefault.jpg" alt=""><span class="d-play"><i></i></span></a>':'')+
    '<div class="d-body">'+
      '<div class="d-title">'+esc(lv.name)+'</div>'+
      '<div class="d-sub">Verified by <b>'+esc(lv.verifier)+'</b></div>'+
      '<div class="d-stats">'+
        '<div class="d-stat"><b>#'+(active+1)+'</b><span>RANK</span></div>'+
        '<div class="d-stat"><b>'+vics+'</b><span>VICTORS</span></div>'+
        '<div class="d-stat"><b>'+lv.percent_to_qualify+'%</b><span>QUALIFY</span></div>'+
      '</div>'+
      '<div class="d-label">LEVEL INFO</div>'+
      '<div class="chips"><span class="chip"><b>ID</b>'+lv.gd_id+'</span><span class="chip"><b>PASS</b>'+esc(lv.password)+'</span></div>'+
      '<div class="d-label">RECORDS ('+recs.length+')</div>'+
      (recs.length ? recs.map((r,idx)=>
        '<div class="rec">'+avatar(r.username)+
          '<span class="rec-name" data-player="'+esc(r.username)+'">'+esc(r.username)+'</span>'+vipTag(r.username)+
          (idx===0&&r.percent>=100?'<span class="tag tag-first">FIRST</span>':'')+
          (r.mobile?'<span class="tag tag-mob">MOBILE</span>':'')+
          '<span class="rec-pct">'+r.percent+'%</span>'+
          '<a class="rec-watch" href="'+esc(r.link)+'" target="_blank" rel="noopener">Watch</a>'+
        '</div>').join('') : '<div class="rec"><span class="rec-name">No records yet.</span></div>')+
      '<div class="d-label">COMMENTS ('+comments.length+')</div>'+
      (ME.loggedIn?
        '<textarea id="cText" maxlength="500" placeholder="Say something about this level..."></textarea>'+
        '<button class="go" id="cSend" style="margin-top:8px">Post</button>'
        :'<p class="hint">Log in to comment.</p>')+
      (comments.length ? comments.map(c=>
        '<div class="rec">'+avatar(c.username)+
          '<span class="rec-name" data-player="'+esc(c.username)+'">'+esc(c.username)+'</span>'+
          '<span style="flex:1;min-width:0;font-size:12.5px;font-weight:600;color:#DCDCE4">'+esc(c.text)+'</span>'+
        '</div>').join('') : '')+
    '</div>';

  document.querySelectorAll('.rec-name').forEach(n=>{
    n.addEventListener('click', ()=>showProfile(n.dataset.player));
  });

  const send = $('cSend');
  if(send) send.addEventListener('click', async ()=>{
    const text = $('cText').value.trim();
    if(!text) return;
    const result = await apiPostComment(lv.id, text);
    if(result.ok) renderDetail();
  });
}

function buildBoard(){
  const p = {};
  const slot = n => (p[n] = p[n] || {beaten:0,progress:0,verified:0,total:0});
  LEVELS.forEach((lv,i)=>{
    const rank = i+1;
    if(lv.verifier){
      const s = slot(lv.verifier);
      s.verified++;
      s.total += score(rank,100,lv.percent_to_qualify);
    }
    if(lv.records) {
        lv.records.forEach(r=>{
        const s = slot(r.username);
        if(r.percent>=100) s.beaten++; else s.progress++;
        s.total += score(rank,r.percent,lv.percent_to_qualify);
        });
    }
  });
  return Object.entries(p).map(([user,v])=>({user,...v}))
    .filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
}

function renderBoard(){
  if(!$('lb')) return;
  $('lb').innerHTML = buildBoard().map((x,i)=>
    '<div class="lb-row" data-player="'+esc(x.user)+'">'+
      '<span class="lb-rank '+(i<3?'top':'')+'">#'+(i+1)+'</span>'+
      avatar(x.user)+
      '<span class="lb-name">'+esc(x.user)+vipTag(x.user)+
        '<span class="lb-meta">'+titleTag(x.user)+
          x.beaten+' beaten &middot; '+x.progress+' progress &middot; '+x.verified+' verified</span>'+
      '</span>'+
      '<span class="lb-pts">'+fix(x.total)+'</span>'+
    '</div>').join('');
  document.querySelectorAll('.lb-row').forEach(r=>{
    r.addEventListener('click', ()=>showProfile(r.dataset.player));
  });
}

function renderStaff(){
  if(!$('staff')) return;
  const staffList = PEOPLE.filter(p=>p.role!=='player');
  $('staff').innerHTML = staffList.map(s=>
    '<div class="staff-card">'+avatar(s.username)+
      '<div><div class="staff-name">'+esc(s.username)+(s.vip==1?'<span class="tag tag-vip">VIP</span>':'')+'</div>'+
      '<span class="staff-role">'+esc(s.role.toUpperCase())+'</span></div>'+
    '</div>').join('');
}

function playerCard(name){
  const out = {beaten:[], progress:[], verified:[], total:0, firsts:0};
  LEVELS.forEach((lv,i)=>{
    const rank = i+1;
    if(lv.verifier && lv.verifier.toLowerCase()===name.toLowerCase()){
      out.verified.push({level:lv.name, rank, link:lv.verification});
      out.total += score(rank,100,lv.percent_to_qualify);
    }
    if(lv.records) {
        lv.records.forEach((r,idx)=>{
        if(r.username.toLowerCase()!==name.toLowerCase()) return;
        const e = {level:lv.name, rank, percent:r.percent, link:r.link, mobile:r.mobile, first: idx===0 && r.percent>=100};
        if(e.first) out.firsts++;
        (r.percent>=100?out.beaten:out.progress).push(e);
        out.total += score(rank,r.percent,lv.percent_to_qualify);
        });
    }
  });
  return out;
}

function recLine(r){
  return '<div class="rec">'+
    '<span class="rec-pct">'+r.percent+'%</span>'+
    '<span class="rec-name">#'+r.rank+' '+esc(r.level)+'</span>'+
    (r.first?'<span class="tag tag-first">FIRST</span>':'')+
    (r.mobile?'<span class="tag tag-mob">MOBILE</span>':'')+
    '<a class="rec-watch" href="'+esc(r.link)+'" target="_blank" rel="noopener">Watch</a>'+
  '</div>';
}

async function showProfile(name){
  const who = name || (ME.loggedIn ? ME.username : '');
  const el = $('p-profile');
  if(!el) return;
  if(!who){
    el.innerHTML = '<div class="box"><h2>Not logged in</h2><p class="lead">Log in to see your profile.</p><button class="go" data-go="login">Log in</button></div>';
    go('profile'); wireGo(); return;
  }

  const p = playerCard(who);
  const pr = person(who);
  const mine = ME.loggedIn && who.toLowerCase() === ME.username.toLowerCase();

  el.innerHTML =
    '<div class="pf-head">'+avatar(who)+
      '<div><div class="pf-name">'+esc(who)+vipTag(who)+'</div>'+
      '<span class="pf-role">'+(pr?esc(pr.role.toUpperCase()):'PLAYER')+
        (p.firsts?' &middot; '+p.firsts+' FIRST':'')+'</span>'+
      ((pr&&pr.title)?'<div class="pf-title">'+esc(pr.title)+'</div>':'')+
      '</div>'+
    '</div>'+
    '<div class="pf-stats">'+
      '<div class="pf-stat"><b>'+fix(p.total)+'</b><span>POINTS</span></div>'+
      '<div class="pf-stat"><b>'+p.beaten.length+'</b><span>BEATEN</span></div>'+
      '<div class="pf-stat"><b>'+p.progress.length+'</b><span>PROGRESS</span></div>'+
      '<div class="pf-stat"><b>'+p.verified.length+'</b><span>VERIFIED</span></div>'+
    '</div>'+
    (p.beaten.length?'<div class="pf-sec"><h3>BEATEN ('+p.beaten.length+')</h3>'+p.beaten.map(recLine).join('')+'</div>':'')+
    (p.progress.length?'<div class="pf-sec"><h3>PROGRESS ('+p.progress.length+')</h3>'+p.progress.map(recLine).join('')+'</div>':'')+
    (p.verified.length?'<div class="pf-sec"><h3>VERIFIED ('+p.verified.length+')</h3>'+
      p.verified.map(v=>'<div class="rec"><span class="rec-pct">V</span><span class="rec-name">#'+v.rank+' '+esc(v.level)+'</span><a class="rec-watch" href="'+esc(v.link)+'" target="_blank" rel="noopener">Watch</a></div>').join('')+'</div>':'')+
    (!p.beaten.length&&!p.progress.length&&!p.verified.length?'<div class="pf-sec"><h3>RECORDS</h3><p class="lead" style="margin:0">No proven records yet.</p></div>':'')+
    (mine?
      '<div class="pf-sec"><h3>THEME</h3><div class="themes">'+
        THEMES.map(t=>'<button class="sw sw-'+t[0]+'" data-theme="'+t[0]+'" title="'+t[1]+'"></button>').join('')+
      '</div></div>'+
      '<div class="pf-sec"><button class="go go-alt" id="doLogout">Log out</button></div>'
    :'');

  go('profile');
  el.querySelectorAll('.sw').forEach(b=>b.addEventListener('click',()=>applyTheme(b.dataset.theme)));
  applyTheme();

  const lo = $('doLogout');
  if(lo) lo.addEventListener('click', async ()=>{
    await apiLogout();
    localStorage.removeItem('currentUser'); // Fixed: Clear local cache
    ME = { loggedIn:false };
    refreshNav(); go('home');
  });
}

function isAdmin(){
  return ME.loggedIn && ['admin','owner','developer'].includes(ME.role);
}

function renderAdmin(){
  if(!isAdmin() || !$('p-admin')) return;

  $('p-admin').innerHTML =
    '<div class="head"><h1>Admin</h1><p>Signed in as '+esc(ME.username)+' &middot; '+esc(ME.role)+'</p></div>'+
    '<div class="adm">'+
      '<h3>Add a record</h3>'+
      '<label class="field"><span>LEVEL</span><select id="rLevel">'+
        LEVELS.map(lv=>'<option value="'+lv.id+'">'+esc(lv.name)+'</option>').join('')+
      '</select></label>'+
      '<label class="field"><span>PLAYER</span><input type="text" id="rUser" placeholder="Username"></label>'+
      '<label class="field"><span>PERCENT</span><input type="number" id="rPct" value="100" min="1" max="100"></label>'+
      '<label class="field"><span>PROOF VIDEO</span><input type="text" id="rLink" placeholder="https://youtu.be/..."></label>'+
      '<label class="field"><span>MOBILE?</span><select id="rMob"><option value="false">No &mdash; PC</option><option value="true">Yes &mdash; Mobile</option></select></label>'+
      '<button class="go" id="genRec">Add record</button>'+
      '<p class="hint" id="rMsg"></p>'+
    '</div>'+
    '<div class="adm">'+
      '<h3>Add a level</h3>'+
      '<label class="field"><span>LEVEL ID</span><input type="number" id="aId"></label>'+
      '<label class="field"><span>NAME</span><input type="text" id="aName"></label>'+
      '<label class="field"><span>CREATORS</span><input type="text" id="aCreators" placeholder="Comma separated"></label>'+
      '<label class="field"><span>VERIFIER</span><input type="text" id="aVerifier"></label>'+
      '<label class="field"><span>VERIFICATION VIDEO</span><input type="text" id="aVideo"></label>'+
      '<label class="field"><span>QUALIFY %</span><input type="number" id="aPct" value="50"></label>'+
      '<label class="field"><span>PASSWORD</span><input type="text" id="aPass" value="Free To Copy"></label>'+
      '<label class="field"><span>RANK</span><input type="number" id="aRank" value="'+(LEVELS.length+1)+'"></label>'+
      '<button class="go" id="genLevel">Add level</button>'+
      '<p class="hint" id="aMsg"></p>'+
    '</div>'+
    '<div class="adm">'+
      '<h3>Set role / title / VIP</h3>'+
      '<label class="field"><span>USERNAME</span><input type="text" id="pUser"></label>'+
      '<label class="field"><span>ROLE</span><select id="pRole">'+
        '<option value="player">Player</option><option value="helper">Helper</option>'+
        '<option value="admin">Admin</option><option value="developer">Developer</option>'+
        '<option value="owner">Owner</option></select></label>'+
      '<label class="field"><span>TITLE</span><input type="text" id="pTitle" placeholder="Optional"></label>'+
      '<label class="field"><span>VIP?</span><select id="pVip"><option value="0">No</option><option value="1">Yes</option></select></label>'+
      '<button class="go" id="genPerson">Save</button>'+
      '<p class="hint" id="pMsg"></p>'+
    '</div>';

  $('genRec').addEventListener('click', async ()=>{
    const msg = $('rMsg');
    const user = $('rUser').value.trim();
    const link = $('rLink').value.trim();
    if(!user){ msg.textContent='Player name is required.'; return }
    if(!link){ msg.textContent='Proof video is required.'; return }
    const result = await api('/records.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        level_id: Number($('rLevel').value),
        username: user,
        percent: Number($('rPct').value)||100,
        link: link,
        mobile: $('rMob').value === 'true'
      })
    });
    if(result.ok){ msg.textContent='Added.'; await loadLevels(); await loadPeople(); renderRows(); renderBoard(); }
    else msg.textContent = result.error || 'Failed.';
  });

  $('genLevel').addEventListener('click', async ()=>{
    const msg = $('aMsg');
    const name = $('aName').value.trim();
    const verifier = $('aVerifier').value.trim();
    const video = $('aVideo').value.trim();
    if(!name||!verifier||!video){ msg.textContent='Name, verifier and video are required.'; return }
    const result = await api('/levels.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        gd_id: Number($('aId').value)||0,
        name: name,
        creators: $('aCreators').value.trim(),
        verifier: verifier,
        verification: video,
        percent_to_qualify: Number($('aPct').value)||50,
        password: $('aPass').value.trim()||'Free To Copy',
        rank_order: Number($('aRank').value)||999
      })
    });
    if(result.ok){ msg.textContent='Added.'; await loadLevels(); renderRows(); renderBoard(); renderAdmin(); }
    else msg.textContent = result.error || 'Failed.';
  });

  $('genPerson').addEventListener('click', async ()=>{
    const msg = $('pMsg');
    const user = $('pUser').value.trim();
    if(!user){ msg.textContent='Username is required.'; return }
    const result = await api('/people.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        username: user,
        role: $('pRole').value,
        title: $('pTitle').value.trim(),
        vip: $('pVip').value === '1'
      })
    });
    if(result.ok){ msg.textContent='Saved.'; await loadPeople(); renderStaff(); renderBoard(); }
    else msg.textContent = result.error || 'Failed.';
  });
}

function applyTheme(k){
  const t = k || localStorage.getItem('gd_theme') || 'purple';
  document.body.setAttribute('data-theme', t);
  localStorage.setItem('gd_theme', t);
  document.querySelectorAll('.sw').forEach(b=>b.classList.toggle('on', b.dataset.theme===t));
}

function ico(kind){
  const paths={
    ranking:'<path class="acc" d="M8 18h4M8 32h4M8 46h4"/><path d="M22 18h34M22 32h34M22 46h34"/>',
    trophy:'<path class="acc" d="M20 10h24v16a12 12 0 0 1-24 0z"/><path d="M20 14H12v6a8 8 0 0 0 8 8M44 14h8v6a8 8 0 0 1-8 8"/><path d="M32 38v10M22 54h20"/>',
    staff:'<circle class="acc" cx="32" cy="22" r="10"/><path d="M12 54a20 20 0 0 1 40 0"/>',
    info:'<circle cx="32" cy="32" r="24"/><path d="M32 28v16M32 20v.5"/>'
  };
  return '<svg viewBox="0 0 64 64" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">'+paths[kind]+'</svg>';
}

const PAGES=['home','list','board','staff','login','register','profile','admin'];

function go(name){
  PAGES.forEach(p=>{ const el=$('p-'+p); if(el) el.hidden = (p!==name) });
  document.querySelectorAll('.nav button').forEach(b=>b.setAttribute('aria-selected', b.dataset.go===name));
  window.scrollTo({top:0, behavior:'smooth'});
}

function wireGo(){
  document.querySelectorAll('[data-go]').forEach(el=>{
    if(el.dataset.wired) return;
    el.dataset.wired='1';
    el.addEventListener('click', ()=>{
      const t = el.dataset.go;
      if(t==='profile') showProfile();
      else if(t==='admin'){ renderAdmin(); go('admin') }
      else go(t);
    });
  });
}

function refreshNav(){
  const u = ME.loggedIn ? ME.username : '';
  if($('navLogin')) $('navLogin').hidden = !!u;
  if($('navProfile')) {
      $('navProfile').hidden = !u;
      if(u) $('navProfile').textContent = u;
  }
  if($('navAdmin')) $('navAdmin').hidden = !isAdmin();
}

function onClick(id, fn){ const el = $(id); if(el) el.addEventListener('click', fn); }

function setupLogo(){
  const img = $('logoImg');
  const text = $('logoText');
  if(!img) return;
  const names = ['image.png','nevlo.png'];
  let n = 0;
  img.onerror = function(){
    n++;
    if(n < names.length) img.src = names[n];
    else { img.onerror = null; img.hidden = true; if(text) text.hidden = false }
  };
  img.src = names[0];
}

onClick('login', ()=>{ window.location.href = 'html/login.html' });
onClick('register', ()=>{ window.location.href = 'html/register.html' });
onClick('back', ()=>{ window.location.href = '../index.html' });

onClick('loginGo', async ()=>{
  const user = $('loginUser').value.trim();
  const pass = $('loginPass').value;
  const msg = $('loginMsg');
  if(!user||!pass){ msg.textContent='Enter your username and password.'; return }
  const result = await apiLogin(user, pass);
  if(result.ok){
    // Fixed: Save the returned user object directly into local storage!
    localStorage.setItem('currentUser', JSON.stringify(result.user));
    msg.textContent = 'Logged in as ' + result.user.username;
    setTimeout(()=>{ window.location.href = '../index.html' }, 800);
  } else if(result.error==='no_account'){ msg.textContent='No account with that name.'; }
  else if(result.error==='wrong_password'){ msg.textContent='Wrong password.'; }
  else { msg.textContent='Something went wrong.'; }
});

onClick('regGo', async ()=>{
  const user = $('regUser').value.trim();
  const pass = $('regPass').value;
  const pass2 = $('regPass2').value;
  const msg = $('regMsg');
  if(user.length<3){ msg.textContent='Username must be at least 3 letters.'; return }
  if(pass.length<6){ msg.textContent='Password must be at least 6 characters.'; return }
  if(pass!==pass2){ msg.textContent='Passwords do not match.'; return }
  const result = await apiRegister(user, pass);
  if(result.ok){
    msg.textContent = 'Registered. You can log in now.';
    setTimeout(()=>{ window.location.href = 'login.html' }, 800);
  } else if(result.error==='username_taken'){ msg.textContent='That username is taken.'; }
  else if(result.error==='invalid_input'){ msg.textContent='Username 3+ letters, password 6+ characters.'; }
  else { msg.textContent='Something went wrong.'; }
});

onClick('profile', async ()=>{
  if(!ME.loggedIn){ window.location.href = 'html/login.html'; return }
  if(confirm('Logged in as ' + ME.username + '. Log out?')){
    await apiLogout();
    localStorage.removeItem('currentUser'); // Fixed: Clear local cache on logout
    ME = { loggedIn:false };
    location.reload();
  }
});

document.querySelectorAll('[data-ico]').forEach(el=>{ el.innerHTML = ico(el.dataset.ico) });

async function init(){
  setupLogo();
  await loadMe();
  await loadPeople();
  refreshNav();
  wireGo();
  if(!$('rows')) return;
  applyTheme();
  await loadLevels();
  renderRows();
  renderDetail();
  renderBoard();
  renderStaff();
  go('home');
}

init();
