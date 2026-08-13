const ADMIN_ROLES = ['owner','admin','developer'];

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fix = n => (Math.round(n*100)/100).toFixed(2);
const ytid = u => (String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)||[])[1]||null;

function host(u){
  const t = String(u).toLowerCase();
  if(t.indexOf('medal.tv') !== -1)  return 'medal';
  if(t.indexOf('discord') !== -1)   return 'discord';
  if(t.indexOf('youtu') !== -1)     return 'youtube';
  return '';
}

function isVip(name){
  try{
    if(typeof VIPS === 'undefined' || !VIPS) return false;
    return VIPS.some(function(v){
      return String(v).toLowerCase() === String(name).toLowerCase();
    });
  }catch(e){ return false }
}

function vipTag(name){
  return isVip(name) ? '<span class="tag tag-vip">VIP</span>' : '';
}

function titleOf(name){
  try{
    if(typeof TITLES === 'undefined' || !TITLES) return '';
    var key = Object.keys(TITLES).find(function(k){
      return k.toLowerCase() === String(name).toLowerCase();
    });
    return key ? TITLES[key] : '';
  }catch(e){ return '' }
}

function titleTag(name){
  var t = titleOf(name);
  return t ? '<span class="tag tag-title">' + esc(t) + '</span>' : '';
}

function hostTag(u){
  const h = host(u);
  if(!h) return '';
  return '<span class="tag tag-' + h + '">' + h.toUpperCase() + '</span>';
}

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
          '<span class="rec-name" data-player="'+esc(r.user)+'">'+esc(r.user)+'</span>'+vipTag(r.user)+titleTag(r.user)+
          (idx===0&&r.percent>=100?'<span class="tag tag-first">FIRST</span>':'')+
          (r.mobile?'<span class="tag tag-mob">MOBILE</span>':'')+
          hostTag(r.link)+
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
      '<span class="lb-name">'+esc(x.user)+vipTag(x.user)+titleTag(x.user)+
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
      '<div><div class="staff-name">'+esc(s.name)+vipTag(s.name)+titleTag(s.name)+'</div>'+
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
      '<div><div class="pf-name">'+esc(who)+vipTag(who)+titleTag(who)+'</div>'+
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
    '<div class="head"><h1>Admin</h1><p>Signed in as '+esc(who.name)+' &middot; '+esc(who.role)+'</p></div>'+

    '<div class="adm">'+
      '<h3>Add a record</h3>'+
      '<p class="hint">Fill this in, press Generate, then paste the result into <b>data/data.js</b> and commit it.</p>'+
      '<label class="field"><span>LEVEL</span><select id="rLevel">'+
        LIST.map(k=>'<option value="'+esc(k)+'">'+esc(LEVELS_DATA[k].name)+'</option>').join('')+
      '</select></label>'+
      '<label class="field"><span>PLAYER</span><input type="text" id="rUser" placeholder="Username"></label>'+
      '<label class="field"><span>PERCENT</span><input type="number" id="rPct" value="100" min="1" max="100"></label>'+
      '<label class="field"><span>PROOF VIDEO</span><input type="text" id="rLink" placeholder="https://youtu.be/..."></label>'+
      '<label class="field"><span>MOBILE?</span><select id="rMob"><option value="false">No &mdash; PC</option><option value="true">Yes &mdash; Mobile</option></select></label>'+
      '<button class="go" id="genRec">Generate record code</button>'+
    '</div>'+

    '<div class="adm">'+
      '<h3>Set a profile picture</h3>'+
      '<p class="hint">Admins only. Pick a person and set their GD icon. It shows on the leaderboard, the records list and the staff page.</p>'+
      '<label class="field"><span>WHO</span><select id="aWho">'+
        allPeople().map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('')+
      '</select></label>'+
      '<div class="pfp-row">'+
        '<span class="pfp pfp-big" id="aPreview"></span>'+
        '<div class="pfp-side">'+
          '<label class="upload">Choose image<input type="file" id="aFile" accept="image/*"></label>'+
        '</div>'+
      '</div>'+
      '<button class="go" id="aGen" style="margin-top:14px">Generate picture code</button>'+
    '</div>'+

    '<div class="adm" id="outBox" hidden>'+
      '<h3>Copy this</h3>'+
      '<div class="out" id="outCode"></div>'+
      '<button class="go go-alt" id="copyOut">Copy</button>'+
    '</div>';

  $('genRec').addEventListener('click',()=>{
    const key=$('rLevel').value;
    const user=$('rUser').value.trim();
    const link=$('rLink').value.trim();
    if(!user){ alert('Player name is required.'); return }
    if(!link){ alert('Proof video is required, or the record scores nothing.'); return }

    const all = LEVELS_DATA[key].records.concat([{
      user:user,
      percent:Number($('rPct').value)||100,
      link:link,
      mobile:$('rMob').value==='true'
    }]);

    $('outCode').textContent = '"records": '+JSON.stringify(all,null,2).replace(/\n/g,'\n    ');
    $('outBox').hidden=false;
  });

  let aData = null;

  function drawWho(){
    $('aPreview').innerHTML = avatar($('aWho').value);
    aData = null;
  }
  $('aWho').addEventListener('change', drawWho);
  drawWho();

  $('aFile').addEventListener('change', function(){
    const f = $('aFile').files && $('aFile').files[0];
    if(!f) return;
    if(f.size > 6*1024*1024){ alert('That image is too big. Use one under 6MB.'); return }
    shrinkImage(f, function(data){
      if(!data){ alert('Could not read that image.'); return }
      aData = data;
      $('aPreview').innerHTML = '<img src="'+data+'" style="width:100%;height:100%;object-fit:cover">';
    });
  });

  $('aGen').addEventListener('click', function(){
    if(!aData){ alert('Choose an image first.'); return }
    const who = $('aWho').value;
    $('outCode').textContent =
      'Add this line inside AVATARS in data/data.js:\n\n' +
      '  "' + who + '": "' + aData + '",';
    $('outBox').hidden = false;
    $('outBox').scrollIntoView({behavior:'smooth',block:'start'});
  });

  $('copyOut').addEventListener('click',()=>{
    navigator.clipboard.writeText($('outCode').textContent);
    $('copyOut').textContent='Copied';
    setTimeout(()=>{$('copyOut').textContent='Copy'},1200);
  });
}

function allPeople(){
  const set = {};
  STAFF.forEach(s=>{ set[s.name]=1 });
  LIST.forEach(k=>{
    const lv = LEVELS_DATA[k];
    if(lv.verifier) set[lv.verifier]=1;
    lv.records.forEach(r=>{ set[r.user]=1 });
  });
  return Object.keys(set).sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
}

const PAGES=['home','list','board','staff','login','register','profile','admin'];

function go(name){
  PAGES.forEach(p=>{ const el=$('p-'+p); if(el) el.hidden = (p!==name) });
  document.querySelectorAll('.nav button').forEach(b=>{
    b.setAttribute('aria-selected', b.dataset.go===name);
  });
  window.scrollTo({top:0,behavior:'smooth'});
}

function wireGo(){
  document.querySelectorAll('[data-go]').forEach(el=>{
    if(el.dataset.wired) return;
    el.dataset.wired='1';
    el.addEventListener('click',()=>{
      const t=el.dataset.go;
      if(t==='profile') showProfile();
      else if(t==='admin'){ renderAdmin(); go('admin') }
      else go(t);
    });
  });
}

function refreshNav(){
  const u=currentUser();
  $('navLogin').hidden = !!u;
  $('navProfile').hidden = !u;
  if(u) $('navProfile').textContent = u;
  $('navAdmin').hidden = !isAdmin();
}

function say(id,text,kind){
  const n=$(id); n.textContent=text; n.className='note '+(kind||'');
}
function getUsers(){
  try{ return JSON.parse(localStorage.getItem('gd_users')||'{}') }catch(e){ return {} }
}

$('loginGo').addEventListener('click',()=>{
  const user=$('userInput').value.trim();
  const pass=$('passInput').value;
  const users=getUsers();
  if(!user) return say('loginMsg','Enter your username.','bad');
  if(!users[user]) return say('loginMsg','No account with that name.','bad');
  if(users[user]!==pass) return say('loginMsg','Wrong password.','bad');
  localStorage.setItem('gd_user',user);
  localStorage.removeItem('gd_key');
  say('loginMsg','Logged in as '+user,'good');
  refreshNav(); setTimeout(()=>showProfile(),600);
});

$('codeGo').addEventListener('click',()=>{
  const raw=$('codeInput').value.trim().toUpperCase();
  if(!raw) return say('loginMsg','Enter your account code.','bad');
  const hash=hashCode(raw);
  const who=STAFF.find(s=>s.key&&s.key===hash);
  if(!who) return say('loginMsg','That code is not valid.','bad');
  localStorage.setItem('gd_user',who.name);
  localStorage.setItem('gd_key',hash);
  say('loginMsg','Welcome back, '+who.name+'.','good');
  refreshNav(); setTimeout(()=>showProfile(),600);
});

$('regGo').addEventListener('click',()=>{
  const user=$('regUser').value.trim();
  const pass=$('regPass').value;
  const pass2=$('regPass2').value;
  if(user.length<3) return say('regMsg','Username must be at least 3 letters.','bad');
  if(pass.length<6) return say('regMsg','Password must be at least 6 characters.','bad');
  if(pass!==pass2) return say('regMsg','Passwords do not match.','bad');
  const users=getUsers();
  if(users[user]) return say('regMsg','That username is taken.','bad');
  if(staffEntry(user)) return say('regMsg','That name belongs to staff. Use your account code.','bad');
  users[user]=pass;
  localStorage.setItem('gd_users',JSON.stringify(users));
  localStorage.setItem('gd_user',user);
  localStorage.removeItem('gd_key');
  say('regMsg','Registered as '+user,'good');
  
