const ADMIN_ROLES = ['owner','admin','developer'];

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fix = n => (Math.round(n*100)/100).toFixed(2);
const ytid = u => (String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)||[])[1]||null;

function levelValue(r){ return 200*Math.pow(0.97,r-1) }
function score(r,p,m){
  const f = levelValue(r);
  if(p>=100) return f;
  const fl = Math.min(m,99);
  if(p<fl) return 0;
  return f*0.5*((p-fl)/(100-fl));
}

function avatarSrc(name){
  const key = Object.keys(AVATARS).find(k=>k.toLowerCase()===String(name).toLowerCase());
  return key ? AVATARS[key] : null;
}

function avatar(name){
  const src = avatarSrc(name);
  if(src) return '<span class="pfp icon"><img src="'+esc(src)+'" style="width:100%;height:100%;object-fit:contain"></span>';
  let n=0;
  for(let i=0;i<name.length;i++) n=(n+name.charCodeAt(i)*(i+3))%360;
  return '<span class="pfp" style="background:linear-gradient(150deg,hsl('+n+',58%,54%),hsl('+n+',52%,30%))">'+esc(name[0].toUpperCase())+'</span>';
}

function staffEntry(name){
  if(!name) return null;
  return STAFF.find(s=>s.name.toLowerCase()===String(name).toLowerCase())||null;
}
function currentUser(){ return localStorage.getItem('gd_user')||'' }
function isAdmin(){
  const s = staffEntry(currentUser());
  if(!s||!s.key) return false;
  if(ADMIN_ROLES.indexOf(s.role.toLowerCase())===-1) return false;
  return localStorage.getItem('gd_key')===s.key;
}

function h32(str,salt){
  let h=2166136261>>>0;
  const t=salt+str+salt;
  for(let r=0;r<3000;r++){
    for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
    h=(h^(h>>>13))>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
function hashCode(s){ return h32(s,'gdgcll-a')+h32(s,'gdgcll-b') }

function shrinkImage(file, cb){
  const reader = new FileReader();
  reader.onload = function(e){
    const img = new Image();
    img.onload = function(){
      const S = 128;
      const c = document.createElement('canvas');
      c.width = S; c.height = S;
      const ctx = c.getContext('2d');
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img,
        (img.width - side)/2, (img.height - side)/2, side, side,
        0, 0, S, S);
      cb(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = function(){ cb(null) };
    img.src = e.target.result;
  };
  reader.onerror = function(){ cb(null) };
  reader.readAsDataURL(file);
}

const THEMES=[
  ['purple','Purple'], ['blue','Blue'], ['cyan','Cyan'],
  ['green','Green'], ['classic','GD Classic'], ['gold','Gold'],
  ['orange','Orange'], ['red','Red'], ['pink','Pink'],
  ['mono','Mono'], ['light','Light'], ['bluewhite','Blue & White']
];
function applyTheme(k){
  const t=k||localStorage.getItem('gd_theme')||'purple';
  document.body.setAttribute('data-theme',t);
  localStorage.setItem('gd_theme',t);
  document.querySelectorAll('.sw').forEach(b=>b.classList.toggle('on',b.dataset.theme===t));
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
document.querySelectorAll('[data-ico]').forEach(el=>{ el.innerHTML=ico(el.dataset.ico) });

let active=0;

function renderRows(){
  $('rows').innerHTML = LIST.map((key,i)=>{
    const lv=LEVELS_DATA[key];
    const vid=ytid(lv.verification);
    const min=score(i+1,lv.percentToQualify,lv.percentToQualify);
    return '<button class="card" data-i="'+i+'" aria-current="'+(i===active)+'">'+
      (vid?'<img class="card-banner" src="https://img.youtube.com/vi/'+vid+'/hqdefault.jpg" alt="">':'')+
      '<div class="card-title"><em>#'+(i+1)+'</em> &ndash; '+esc(lv.name)+'</div>'+
      '<div class="card-by"><span>published by</span> <b>'+esc(lv.creators.join(', '))+'</b></div>'+
      '<div class="card-pts">'+fix(min)+' ('+lv.percentToQualify+'%) &mdash; <b>'+fix(levelValue(i+1))+'</b> (100%) points</div>'+
    '</button>';
  }).join('');

  document.querySelectorAll('.card').forEach(b=>{
    b.addEventListener('click',()=>{active=+b.dataset.i;renderRows();renderDetail()});
  });
}

function renderDetail(){
  const lv=LEVELS_DATA[LIST[active]];
  const vid=ytid(lv.verification);
  const vics=lv.records.filter(r=>r.percent>=100&&r.link).length;

  $('detail').innerHTML =
    (vid?'<a class="d-banner" href="'+esc(lv.verification)+'" target="_blank" rel="noopener"><img src="https://img.youtube.com/vi/'+vid+'/hqdefault.jpg" alt=""><span class="d-play"><i></i></span></a>':'')+
    '<div class="d-body">'+
      '<div class="d-title">'+esc(lv.name)+'</div>'+
      '<div class="d-sub">Verified by <b>'+esc(lv.verifier)+'</b></div>'+
      '<div class="d-stats">'+
        '<div class="d-stat"><b>#'+(active+1)+'</b><span>RANK</span></div>'+
        '<div class="d-stat"><b>'+vics+'</b><span>VICTORS</span></div>'+
        '<div class="d-stat"><b>'+lv.percentToQualify+'%</b><span>QUALIFY</span></div>'+
      '</div>'+
      '<div class="d-label">LEVEL INFO</div>'+
      '<div class="chips"><span class="chip"><b>ID</b>'+lv.id+'</span><span class="chip"><b>PASS</b>'+esc(lv.password)+'</span></div>'+
      '<div class="d-label">RECORDS ('+lv.records.length+')</div>'+
      lv.records.map((r,idx)=>
        '<div class="rec">'+avatar(r.user)+
          '<span class="rec-name" data-player="'+esc(r.user)+'">'+esc(r.user)+'</span>'+
          (idx===0&&r.percent>=100?'<span class="tag tag-first">FIRST</span>':'')+
          (r.mobile?'<span class="tag tag-mob">MOBILE</span>':'')+
          '<span class="rec-pct">'+r.percent+'%</span>'+
          '<a class="rec-watch" href="'+esc(r.link)+'" target="_blank" rel="noopener">Watch</a>'+
        '</div>').join('')+
    '</div>';

  $('detail').querySelectorAll('.rec-name').forEach(n=>{
    n.addEventListener('click',()=>showProfile(n.dataset.player));
  });
}

function buildBoard(){
  const p={};
  const slot=n=>(p[n]=p[n]||{beaten:0,progress:0,verified:0,total:0});
  LIST.forEach((key,i)=>{
    const lv=LEVELS_DATA[key], rank=i+1;
    if(lv.verifier){
      const s=slot(lv.verifier);
      s.verified++;
      if(lv.verification) s.total+=score(rank,100,lv.percentToQualify);
    }
    lv.records.forEach(r=>{
      if(!r.link) return;
      const s=slot(r.user);
      if(r.percent>=100) s.beaten++; else s.progress++;
      s.total+=score(rank,r.percent,lv.percentToQualify);
    });
  });
  return Object.entries(p).map(([user,v])=>({user,...v}))
    .filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
}

function renderBoard(){
  $('lb').innerHTML = buildBoard().map((x,i)=>
    '<div class="lb-row" data-player="'+esc(x.user)+'">'+
      '<span class="lb-rank '+(i<3?'top':'')+'">#'+(i+1)+'</span>'+
      avatar(x.user)+
      '<span class="lb-name">'+esc(x.user)+
        '<span class="lb-meta">'+x.beaten+' beaten &middot; '+x.progress+' progress &middot; '+x.verified+' verified</span>'+
      '</span>'+
      '<span class="lb-pts">'+fix(x.total)+'</span>'+
    '</div>').join('');

  $('lb').querySelectorAll('.lb-row').forEach(r=>{
    r.addEventListener('click',()=>showProfile(r.dataset.player));
  });
}

function renderStaff(){
  $('staff').innerHTML = STAFF.map(s=>
    '<div class="staff-card">'+avatar(s.name)+
      '<div><div class="staff-name">'+esc(s.name)+'</div>'+
      '<span class="staff-role">'+esc(s.role.toUpperCase())+'</span></div>'+
    '</div>').join('');
}

function playerCard(name){
  const out={beaten:[],progress:[],verified:[],total:0,firsts:0};
  LIST.forEach((key,i)=>{
    const lv=LEVELS_DATA[key], rank=i+1;
    if(lv.verifier&&lv.verifier.toLowerCase()===name.toLowerCase()){
      out.verified.push({level:lv.name,rank,link:lv.verification});
      if(lv.verification) out.total+=score(rank,100,lv.percentToQualify);
    }
    lv.records.forEach((r,idx)=>{
      if(r.user.toLowerCase()!==name.toLowerCase()||!r.link) return;
      const e={level:lv.name,rank,percent:r.percent,link:r.link,mobile:r.mobile,first:idx===0&&r.percent>=100};
      if(e.first) out.firsts++;
      (r.percent>=100?out.beaten:out.progress).push(e);
      out.total+=score(rank,r.percent,lv.percentToQualify);
    });
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

function showProfile(name){
  const who = name || currentUser();
  const el = $('p-profile');

  if(!who){
    el.innerHTML='<div class="box"><h2>Not logged in</h2><p class="lead">Log in to see your profile.</p><button class="go" data-go="login">Log in</button></div>';
    go('profile'); wireGo(); return;
  }

  const p = playerCard(who);
  const s = staffEntry(who);
  const mine = who.toLowerCase() === currentUser().toLowerCase();

  el.innerHTML =
    '<div class="pf-head">'+avatar(who)+
      '<div><div class="pf-name">'+esc(who)+'</div>'+
      '<span class="pf-role">'+(s?esc(s.role.toUpperCase()):'PLAYER')+
        (p.firsts?' &middot; '+p.firsts+' FIRST':'')+'</span></div>'+
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

  el.querySelectorAll('.sw').forEach(b=>{
    b.addEventListener('click',()=>applyTheme(b.dataset.theme));
  });
  applyTheme();

  const lo = $('doLogout');
  if(lo) lo.addEventListener('click',()=>{
    localStorage.removeItem('gd_user');
    localStorage.removeItem('gd_key');
    refreshNav(); go('home');
  });
}

function renderAdmin(){
  const who = staffEntry(currentUser());
  if(!who) return;

  $('p-admin').innerHTML =
    '<div class="head"><h1>Admin</h1><p>' + esc(who.name) + ' &middot; ' + esc(who.role) + '</p></div>' +

    '<div class="adm-tabs">' +
      '<button class="adm-tab" data-adm="record">Add record</button>' +
      '<button class="adm-tab" data-adm="level">Add level</button>' +
      '<button class="adm-tab" data-adm="order">Reorder list</button>' +
      '<button class="adm-tab" data-adm="icon">Set icon</button>' +
    '</div>' +

    '<div class="adm" id="adm-record">' +
      '<h3>Add a record</h3>' +
      '<p class="hint">Paste the Discord submission below and it fills itself in, or type it manually.</p>' +

      '<label class="field"><span>PASTE SUBMISSION</span>' +
        '<textarea id="rPaste" rows="3" placeholder="Paste the message with the YouTube link and username"></textarea></label>' +
      '<button class="go go-alt" id="rParse" style="margin-bottom:20px">Read it</button>' +

      '<div class="two">' +
        '<label class="field"><span>LEVEL</span><select id="rLevel">' +
          LIST.map(function(k){ return '<option value="' + esc(k) + '">#' + (LIST.indexOf(k)+1) + ' ' + esc(LEVELS_DATA[k].name) + '</option>' }).join('') +
        '</select></label>' +
        '<label class="field"><span>PERCENT</span><input type="number" id="rPct" value="100" min="1" max="100"></label>' +
      '</div>' +

      '<label class="field"><span>PLAYER</span><input type="text" id="rUser" placeholder="Username" list="peopleList"></label>' +
      '<datalist id="peopleList">' + allPeople().map(function(n){ return '<option value="' + esc(n) + '">' }).join('') + '</datalist>' +

      '<label class="field"><span>PROOF VIDEO</span><input type="text" id="rLink" placeholder="https://youtu.be/..."></label>' +

      '<label class="field"><span>DEVICE</span><select id="rMob">' +
        '<option value="false">PC</option><option value="true">Mobile</option></select></label>' +

      '<div id="rCheck" class="check" hidden></div>' +
      '<button class="go" id="genRec">Generate record</button>' +
    '</div>' +

    '<div class="adm" id="adm-level" hidden>' +
      '<h3>Add a level</h3>' +
      '<p class="hint">The key is the file name. Lowercase, no spaces.</p>' +

      '<div class="two">' +
        '<label class="field"><span>KEY</span><input type="text" id="aKey" placeholder="ninecircles"></label>' +
        '<label class="field"><span>LEVEL ID</span><input type="text" id="aId" placeholder="4322194"></label>' +
      '</div>' +

      '<label class="field"><span>NAME</span><input type="text" id="aName" placeholder="Nine Circles"></label>' +
      '<label class="field"><span>CREATORS</span><input type="text" id="aCreators" placeholder="Comma separated"></label>' +
      '<label class="field"><span>VERIFIER</span><input type="text" id="aVerifier" placeholder="Who verified it"></label>' +
      '<label class="field"><span>VERIFICATION VIDEO</span><input type="text" id="aVideo" placeholder="https://youtu.be/..."></label>' +

      '<div class="two">' +
        '<label class="field"><span>QUALIFY AT %</span><input type="number" id="aPct" value="50" min="1" max="100"></label>' +
        '<label class="field"><span>PLACE AT RANK</span><input type="number" id="aRank" value="1" min="1" max="' + (LIST.length+1) + '"></label>' +
      '</div>' +

      '<label class="field"><span>PASSWORD</span><input type="text" id="aPass" value="Free To Copy"></label>' +

      '<div id="aCheck" class="check" hidden></div>' +
      '<button class="go" id="genLevel">Generate level</button>' +
    '</div>' +

    '<div class="adm" id="adm-order" hidden>' +
      '<h3>Reorder the list</h3>' +
      '<p class="hint">Move levels up and down, then generate the new LIST.</p>' +
      '<div id="orderList" class="order"></div>' +
      '<button class="go" id="genOrder" style="margin-top:16px">Generate LIST</button>' +
    '</div>' +

    '<div class="adm" id="adm-icon" hidden>' +
      '<h3>Set a profile icon</h3>' +
      '<p class="hint">Admins only. Shows on the leaderboard, records and staff page.</p>' +
      '<label class="field"><span>WHO</span><select id="aWho">' +
        allPeople().map(function(n){ return '<option value="' + esc(n) + '">' + esc(n) + '</option>' }).join('') +
      '</select></label>' +
      '<div class="pfp-row">' +
        '<span class="pfp pfp-big" id="aPreview"></span>' +
        '<div class="pfp-side">' +
          '<label class="upload">Choose image<input type="file" id="aFile" accept="image/*"></label>' +
        '</div>' +
      '</div>' +
      '<button class="go" id="aGen" style="margin-top:14px">Generate icon code</button>' +
    '</div>' +

    '<div class="adm" id="outBox" hidden>' +
      '<h3>Paste this into data/data.js</h3>' +
      '<div class="out" id="outCode"></div>' +
      '<button class="go" id="copyOut">Copy</button>' +
    '</div>';

  admTab('record');

  document.querySelectorAll('.adm-tab').forEach(function(b){
    b.addEventListener('click', function(){ admTab(b.dataset.adm) });
  });

  wireRecord();
  wireLevel();
  wireOrder();
  wireIcon();

  $('copyOut').addEventListener('click', function(){
    navigator.clipboard.writeText($('outCode').textContent);
    $('copyOut').textContent = 'Copied';
    setTimeout(function(){ $('copyOut').textContent = 'Copy' }, 1200);
  });
}

function admTab(name){
  ['record','level','order','icon'].forEach(function(n){
    const el = $('adm-' + n);
    if(el) el.hidden = (n !== name);
  });
  document.querySelectorAll('.adm-tab').forEach(function(b){
    b.classList.toggle('on', b.dataset.adm === name);
  });
  const o = $('outBox');
  if(o) o.hidden = true;
}

function showOut(code){
  $('outCode').textContent = code;
  $('outBox').hidden = false;
  $('outBox').scrollIntoView({behavior:'smooth', block:'start'});
}

function note(id, msg, ok){
  const el = $(id);
  el.innerHTML = msg;
  el.className = 'check ' + (ok ? 'ok' : 'bad');
  el.hidden = false;
}

function wireRecord(){
  $('rParse').addEventListener('click', function(){
    const txt = $('rPaste').value;
    if(!txt.trim()) return;

    const url = (txt.match(/https?:\/\/[^\s]+/) || [])[0];
    if(url) $('rLink').value = url.split('?si=')[0].split('&')[0];

    const pct = txt.match(/(\d{1,3})\s*%/);
    if(pct) $('rPct').value = Math.min(100, Number(pct[1]));

    const u = txt.match(/(?:user|username|account)\s*(?:is|:)\s*([A-Za-z0-9_\-]+)/i);
    if(u) $('rUser').value = u[1];

    if(/mobile/i.test(txt)) $('rMob').value = 'true';

    note('rCheck', 'Read what I could. Check the fields before generating.', true);
  });

  $('genRec').addEventListener('click', function(){
    const key  = $('rLevel').value;
    const user = $('rUser').value.trim();
    const link = $('rLink').value.trim();
    const pct  = Number($('rPct').value) || 100;
    const lv   = LEVELS_DATA[key];
    const rank = LIST.indexOf(key) + 1;

    if(!user) return note('rCheck', 'Player name is required.', false);
    if(!link) return note('rCheck', 'Proof video is required, or the record scores nothing.', false);
    if(!ytid(link)) return note('rCheck', 'That does not look like a YouTube link.', false);

    const dupe = lv.records.find(function(r){ return r.user.toLowerCase() === user.toLowerCase() });
    if(dupe) return note('rCheck',
      user + ' already has ' + dupe.percent + '% on this level. Replace that line instead of adding a second one.', false);

    if(pct < lv.percentToQualify) return note('rCheck',
      pct + '% is below the ' + lv.percentToQualify + '% qualify mark, so it scores 0.', false);

    const rec = { user: user, percent: pct, link: link, mobile: $('rMob').value === 'true' };
    const all = lv.records.concat([rec]);
    const worth = score(rank, pct, lv.percentToQualify);

    note('rCheck', 'Looks good. ' + esc(user) + ' earns <b>' + fix(worth) + '</b> points.', true);

    showOut(
      'In "' + key + '", replace the records list with:\n\n' +
      '    records: ' + JSON.stringify(all, null, 2).replace(/\n/g, '\n    ')
    );
  });
}

function wireLevel(){
  $('genLevel').addEventListener('click', function(){
    const key = $('aKey').value.trim().toLowerCase().replace(/\s+/g,'');
    const name = $('aName').value.trim();

    if(!key)  return note('aCheck', 'Key is required.', false);
    if(!name) return note('aC
