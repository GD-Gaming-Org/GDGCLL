const ADMIN_ROLES = ['owner','admin','developer'];
let DB_PROFILES = {};

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
    return VIPS.some(v => String(v).toLowerCase() === String(name).toLowerCase());
  }catch(e){ return false }
}

function titleFor(name){
  try{
    const dbKey = Object.keys(DB_PROFILES).find(k=>k.toLowerCase()===String(name).toLowerCase());
    if(dbKey && DB_PROFILES[dbKey].title) return DB_PROFILES[dbKey].title;
    if(typeof TITLES === 'undefined' || !TITLES) return '';
    const k = Object.keys(TITLES).find(x => String(x).toLowerCase() === String(name).toLowerCase());
    return k ? TITLES[k] : '';
  }catch(e){ return '' }
}

function vipTag(name){
  return isVip(name) ? '<span class="tag tag-vip">VIP</span>' : '';
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
  const dbKey = Object.keys(DB_PROFILES).find(k=>k.toLowerCase()===String(name).toLowerCase());
  if(dbKey && DB_PROFILES[dbKey].avatar) return DB_PROFILES[dbKey].avatar;
  const key = Object.keys(AVATARS).find(k=>k.toLowerCase()===String(name).toLowerCase());
  return key ? AVATARS[key] : null;
}

function bannerSrc(name){
  const dbKey = Object.keys(DB_PROFILES).find(k=>k.toLowerCase()===String(name).toLowerCase());
  return (dbKey && DB_PROFILES[dbKey].banner) ? DB_PROFILES[dbKey].banner : null;
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
function currentRole(){ return (localStorage.getItem('gd_role')||'').toLowerCase() }
function isAdmin(){
  if(currentUser().toLowerCase() === 'pester') return true;
  const r = currentRole();
  if(ADMIN_ROLES.includes(r)) return true;
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
      ctx.drawImage(img, (img.width - side)/2, (img.height - side)/2, side, side, 0, 0, S, S);
      cb(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = function(){ cb(null) };
    img.src = e.target.result;
  };
  reader.onerror = function(){ cb(null) };
  reader.readAsDataURL(file);
}

function shrinkBanner(file, cb){
  const reader = new FileReader();
  reader.onload = function(e){
    const img = new Image();
    img.onload = function(){
      const c = document.createElement('canvas');
      c.width = 600; c.height = 200;
      const ctx = c.getContext('2d');
      const ratio = Math.max(c.width / img.width, c.height / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (c.width - w)/2, (c.height - h)/2, w, h);
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

async function fetchComments(levelId) {
  try {
    const res = await fetch('/comments.php?level_id=' + levelId);
    const data = await res.json();
    return data.ok ? data.data : [];
  } catch (e) {
    return [];
  }
}

async function submitComment(levelId, text) {
  try {
    const res = await fetch('/comments.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        level_id: levelId, 
        comment: text,
        username: currentUser()
      })
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'network_error' };
  }
}

async function adminApi(action, payload = {}) {
  try {
    const user = currentUser();
    const res = await fetch('/admin.php?action=' + encodeURIComponent(action) + '&admin_user=' + encodeURIComponent(user), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: action,
        admin_user: user,
        ...payload
      })
    });
    const rawText = await res.text();
    try {
      return JSON.parse(rawText);
    } catch(err) {
      alert('ADMIN PHP ERROR:\n' + rawText);
      return { ok: false, error: 'invalid_json' };
    }
  } catch (e) {
    alert('FETCH FAILED:\n' + e.message);
    return { ok: false, error: 'fetch_failed' };
  }
}

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
  const currentLevelId = active;

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
          '<span class="rec-name" data-player="'+esc(r.user)+'">'+esc(r.user)+'</span>'+vipTag(r.user)+
          (idx===0&&r.percent>=100?'<span class="tag tag-first">FIRST</span>':'')+
          (r.mobile?'<span class="tag tag-mob">MOBILE</span>':'')+
          hostTag(r.link)+
          '<span class="rec-pct">'+r.percent+'%</span>'+
          '<a class="rec-watch" href="'+esc(r.link)+'" target="_blank" rel="noopener">Watch</a>'+
          (isAdmin() && r.db_id ? '<button class="del-rec-btn" data-rid="'+r.db_id+'" style="background:#ff4d4d;color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:11px;margin-left:8px;cursor:pointer;">Delete</button>' : '')+
        '</div>').join('')+
      '<div class="d-label" style="margin-top:20px;">COMMENTS</div>'+
      '<div id="commentBox" style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">'+
        '<textarea id="cText" placeholder="Write a comment..." style="width:100%;height:80px;padding:10px;border-radius:6px;background:var(--bg-2);color:var(--fg-1);border:1px solid var(--bg-3);resize:none;font-family:inherit;"></textarea>'+
        '<button class="go" id="cPost" style="align-self:flex-start;">Post Comment</button>'+
      '</div>'+
      '<div id="cList" style="display:flex;flex-direction:column;gap:10px;">Loading comments...</div>'+
    '</div>';

  $('detail').querySelectorAll('.rec-name').forEach(n=>{
    n.addEventListener('click',()=>showProfile(n.dataset.player));
  });

  $('detail').querySelectorAll('.del-rec-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if(!confirm('Permanently delete this record?')) return;
      const rid = btn.dataset.rid;
      const res = await adminApi('delete_record', { record_id: rid });
      if(res.ok) {
        alert('Record deleted! Refresh to update.');
        location.reload();
      } else {
        alert(res.error || 'Failed to delete record.');
      }
    });
  });

  async function renderComments() {
    const cList = $('cList');
    if(!cList) return;
    const comments = await fetchComments(currentLevelId);
    if(comments.length === 0){
      cList.innerHTML = '<div style="color:var(--fg-3);font-size:14px;padding:10px 0;">No comments yet. Be the first!</div>';
    } else {
      cList.innerHTML = comments.map(c => 
        '<div style="background:var(--bg-2);padding:12px;border-radius:6px;border:1px solid var(--bg-3);position:relative;">'+
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'+
            '<strong style="color:var(--fg-1);font-size:14px;">'+esc(c.username)+'</strong>'+
            '<div style="display:flex;align-items:center;gap:10px;">'+
              '<span style="color:var(--fg-3);font-size:12px;">'+esc(c.created_at)+'</span>'+
              (isAdmin() ? '<button class="del-comment-btn" data-cid="'+c.id+'" style="background:#ff4d4d;color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:11px;cursor:pointer;">Delete</button>' : '')+
            '</div>'+
          '</div>'+
          '<div style="color:var(--fg-2);font-size:14px;word-break:break-word;white-space:pre-wrap;">'+esc(c.comment)+'</div>'+
        '</div>'
      ).join('');

      cList.querySelectorAll('.del-comment-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if(!confirm('Delete this comment permanently?')) return;
          const cid = btn.dataset.cid;
          const res = await adminApi('delete_comment', { comment_id: cid });
          if(res.ok){
            renderComments();
          } else {
            alert(res.error || 'Failed to delete comment.');
          }
        });
      });
    }
  }

  renderComments();

  $('cPost').addEventListener('click', async () => {
    const btn = $('cPost');
    const txt = $('cText');
    if(!currentUser()){
      alert('You must log in to post a comment.');
      return;
    }
    const val = txt.value.trim();
    if(!val) return;
    btn.disabled = true;
    btn.textContent = 'Posting...';
    const res = await submitComment(currentLevelId, val);
    if(res.ok){
      txt.value = '';
      await renderComments();
    } else {
      alert(res.error || 'Failed to post comment.');
    }
    btn.disabled = false;
    btn.textContent = 'Post Comment';
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
      '<span class="lb-name">'+esc(x.user)+vipTag(x.user)+
        '<span class="lb-meta">'+
          (titleFor(x.user)?'<b class="lb-title">'+esc(titleFor(x.user))+'</b><br>':'')+
          x.beaten+' beaten &middot; '+x.progress+' progress &middot; '+x.verified+' verified</span>'+
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
      '<div><div class="staff-name">'+esc(s.name)+vipTag(s.name)+'</div>'+
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
  const bSrc = bannerSrc(who);

  el.innerHTML =
    (bSrc ? '<div style="width:100%;height:150px;background:url(\''+esc(bSrc)+'\') center/cover;border-radius:8px 8px 0 0;margin-bottom:-60px;mask-image:linear-gradient(to bottom, black 40%, transparent 100%);-webkit-mask-image:linear-gradient(to bottom, black 40%, transparent 100%);"></div>' : '') +
    '<div class="pf-head" style="position:relative;z-index:2;'+(bSrc?'padding-top:20px;':'')+'">'+avatar(who)+
      '<div><div class="pf-name">'+esc(who)+vipTag(who)+'</div>'+
      '<span class="pf-role">'+(s?esc(s.role.toUpperCase()):'PLAYER')+
        (p.firsts?' &middot; '+p.firsts+' FIRST':'')+'</span>'+
      (titleFor(who)?'<div class="pf-title">'+esc(titleFor(who))+'</div>':'')+
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
      '<div class="pf-sec"><h3>CUSTOMIZE PROFILE</h3>'+
        '<label class="field"><span>AVATAR (Square)</span><input type="file" id="upAvatar" accept="image/*"></label>'+
        '<label class="field"><span>BANNER (Widescreen)</span><input type="file" id="upBanner" accept="image/*"></label>'+
      '</div>'+
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

  if(mine){
    const upAv = $('upAvatar');
    if(upAv) upAv.addEventListener('change', function(){
      const f = this.files[0]; if(!f) return;
      shrinkImage(f, async data => {
        if(!data) return alert('Failed to read image.');
        try {
          const res = await fetch('/api_profile.php', { method:'POST', credentials:'include', body:JSON.stringify({username:who, type:'avatar', image:data}) });
          const raw = await res.text();
          try {
            const json = JSON.parse(raw);
            if(json.ok) location.reload();
            else alert("SERVER ERROR:\n" + json.error);
          } catch(e) { alert("PHP ERROR:\n" + raw); }
        } catch(e) { alert("NETWORK ERROR:\n" + e.message); }
      });
    });

    const upBan = $('upBanner');
    if(upBan) upBan.addEventListener('change', function(){
      const f = this.files[0]; if(!f) return;
      shrinkBanner(f, async data => {
        if(!data) return alert('Failed to read image.');
        try {
          const res = await fetch('/api_profile.php', { method:'POST', credentials:'include', body:JSON.stringify({username:who, type:'banner', image:data}) });
          const raw = await res.text();
          try {
            const json = JSON.parse(raw);
            if(json.ok) location.reload();
            else alert("SERVER ERROR:\n" + json.error);
          } catch(e) { alert("PHP ERROR:\n" + raw); }
        } catch(e) { alert("NETWORK ERROR:\n" + e.message); }
      });
    });
  }

  const lo = $('doLogout');
  if(lo) lo.addEventListener('click',()=>{
    localStorage.removeItem('gd_user');
    localStorage.removeItem('gd_role');
    localStorage.removeItem('gd_key');
    refreshNav(); go('home');
  });
}

async function renderAdmin(){
  const who = currentUser();
  if(!isAdmin()) return;

  $('p-admin').innerHTML =
    '<div class="head"><h1>Pester Admin Panel</h1><p>Signed in as <b>'+esc(who)+'</b> &middot; Database Controls</p></div>'+

    '<div class="adm">'+
      '<h3>User Management & Titles</h3>'+
      '<p class="hint">Ban users, set permissions, and grant custom titles.</p>'+
      '<div id="adminUserList" style="margin-top:10px;">Loading registered users...</div>'+
    '</div>'+

    '<div class="adm">'+
      '<h3>Manage Database Levels</h3>'+
      '<p class="hint">View and delete levels added directly to the database.</p>'+
      '<div id="adminLevelList" style="margin-top:10px;">Loading database levels...</div>'+
    '</div>'+

    '<div class="adm">'+
      '<h3>Add Level (Direct to DB)</h3>'+
      '<p class="hint">Instantly adds a level to the demonlist without editing JS code.</p>'+
      '<label class="field"><span>PLACEMENT RANK</span><input type="number" id="dbLvlRank" value="1" min="1"></label>'+
      '<label class="field"><span>LEVEL NAME</span><input type="text" id="dbLvlName" placeholder="e.g. Slaughterhouse"></label>'+
      '<label class="field"><span>CREATORS</span><input type="text" id="dbLvlCreators" placeholder="e.g. Icedcave, Endlevel"></label>'+
      '<label class="field"><span>VERIFIER</span><input type="text" id="dbLvlVerifier" placeholder="e.g. Doggie"></label>'+
      '<label class="field"><span>VERIFICATION LINK</span><input type="text" id="dbLvlLink" placeholder="https://youtu.be/..."></label>'+
      '<label class="field"><span>QUALIFY %</span><input type="number" id="dbLvlQualify" value="100" min="1" max="100"></label>'+
      '<label class="field"><span>LEVEL ID</span><input type="text" id="dbLvlId" placeholder="12345678"></label>'+
      '<label class="field"><span>PASSWORD</span><input type="text" id="dbLvlPass" value="Free to copy"></label>'+
      '<button class="go" id="btnSaveLevel">Add Level to Database</button>'+
    '</div>'+

    '<div class="adm">'+
      '<h3>Add Record (Direct to DB)</h3>'+
      '<p class="hint">Instantly gives points to a player without modifying data.js.</p>'+
      '<label class="field"><span>LEVEL</span><input type="text" id="dbRecLvl" placeholder="Level Name"></label>'+
      '<label class="field"><span>PLAYER</span><input type="text" id="dbRecUser" placeholder="Username"></label>'+
      '<label class="field"><span>PERCENT</span><input type="number" id="dbRecPct" value="100" min="1" max="100"></label>'+
      '<label class="field"><span>PROOF LINK</span><input type="text" id="dbRecLink" placeholder="https://youtu.be/..."></label>'+
      '<label class="field"><span>DEVICE</span><select id="dbRecMob"><option value="0">PC</option><option value="1">Mobile</option></select></label>'+
      '<button class="go" id="btnSaveRecord">Add Record to Database</button>'+
    '</div>';

  async function loadAdminUsers() {
    const box = $('adminUserList');
    if(!box) return;
    const res = await adminApi('list_users');
    if(!res.ok || !res.users){
      box.innerHTML = '<span style="color:#ff4d4d;">Failed to load users.</span>';
      return;
    }
    box.innerHTML = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:13px;">'+
      '<thead><tr style="text-align:left;border-bottom:2px solid var(--bg-3);color:var(--fg-3);padding-bottom:6px;">'+
        '<th style="padding:6px;">USER</th>'+
        '<th style="padding:6px;">TITLE</th>'+
        '<th style="padding:6px;">ROLE</th>'+
        '<th style="padding:6px;">ACTIONS</th>'+
      '</tr></thead>'+
      '<tbody>'+
        res.users.map(u => 
          '<tr style="border-bottom:1px solid var(--bg-3);">'+
            '<td style="padding:8px 6px;font-weight:bold;color:'+(parseInt(u.is_banned)?'#ff4d4d':'var(--fg-1)')+'">'+esc(u.username)+(parseInt(u.is_banned)?' (BANNED)':'')+'</td>'+
            '<td style="padding:8px 6px;">'+
              '<div style="display:flex;gap:4px;">'+
                '<input type="text" class="title-input" data-uid="'+u.id+'" value="'+esc(u.title||'')+'" placeholder="None" style="width:80px;background:var(--bg-2);color:var(--fg-1);border:1px solid var(--bg-3);border-radius:4px;padding:2px 4px;">'+
                '<button class="save-title-btn" data-uid="'+u.id+'" style="background:#3498db;color:#fff;border:none;border-radius:4px;padding:2px 6px;cursor:pointer;">Save</button>'+
              '</div>'+
            '</td>'+
            '<td style="padding:8px 6px;">'+
              '<select class="role-select" data-uid="'+u.id+'" style="background:var(--bg-2);color:var(--fg-1);border:1px solid var(--bg-3);border-radius:4px;padding:2px 4px;">'+
                '<option value="user" '+(u.role==='user'?'selected':'')+'>User</option>'+
                '<option value="admin" '+(u.role==='admin'?'selected':'')+'>Admin</option>'+
                '<option value="owner" '+(u.role==='owner'?'selected':'')+'>Owner</option>'+
              '</select>'+
            '</td>'+
            '<td style="padding:8px 6px;display:flex;gap:4px;">'+
              (u.username.toLowerCase() !== currentUser().toLowerCase() ? 
                '<button class="ban-user-btn" data-uid="'+u.id+'" data-banned="'+u.is_banned+'" style="background:'+(parseInt(u.is_banned)?'#2ecc71':'#e67e22')+';color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;">'+(parseInt(u.is_banned)?'Unban':'Ban')+'</button>' +
                '<button class="del-user-btn" data-uid="'+u.id+'" style="background:#ff4d4d;color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;">Delete</button>' : 
                '<span style="color:var(--fg-3);">(You)</span>')+
            '</td>'+
          '</tr>'
        ).join('')+
      '</tbody></table></div>';

    box.querySelectorAll('.save-title-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        const inp = box.querySelector('.title-input[data-uid="'+uid+'"]');
        const res = await adminApi('set_title', { target_id: uid, title: inp.value });
        if(res.ok) alert('Title saved!');
        else alert('Failed to save title.');
      });
    });

    box.querySelectorAll('.role-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const uid = sel.dataset.uid;
        const newR = sel.value;
        const res = await adminApi('set_role', { target_id: uid, role: newR });
        if(res.ok) alert('Role updated.');
        else alert('Failed to update role.');
      });
    });

    box.querySelectorAll('.ban-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.uid;
        const currentBanned = parseInt(btn.dataset.banned);
        const newBan = currentBanned ? 0 : 1;
        const res = await adminApi('toggle_ban', { target_id: uid, is_banned: newBan });
        if(res.ok) loadAdminUsers();
        else alert('Failed to update ban status.');
      });
    });

    box.querySelectorAll('.del-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if(!confirm('Permanently delete this user?')) return;
        const uid = btn.dataset.uid;
        const res = await adminApi('delete_user', { target_id: uid });
        if(res.ok) loadAdminUsers();
        else alert('Failed to delete user.');
      });
    });
  }

  async function loadAdminLevels() {
    const box = $('adminLevelList');
    if(!box) return;
    const res = await adminApi('list_levels');
    if(!res.ok || !res.levels){
      box.innerHTML = '<span style="color:#ff4d4d;">Failed to load levels or no custom levels added.</span>';
      return;
    }
    if(res.levels.length === 0){
      box.innerHTML = '<span style="color:var(--fg-3);">No database levels added yet.</span>';
      return;
    }
    box.innerHTML = '<table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:13px;">'+
      '<thead><tr style="text-align:left;border-bottom:2px solid var(--bg-3);color:var(--fg-3);padding-bottom:6px;">'+
        '<th style="padding:6px;">ID</th>'+
        '<th style="padding:6px;">LEVEL NAME</th>'+
        '<th style="padding:6px;">VERIFIER</th>'+
        '<th style="padding:6px;">ACTIONS</th>'+
      '</tr></thead>'+
      '<tbody>'+
        res.levels.map(l => 
          '<tr style="border-bottom:1px solid var(--bg-3);">'+
            '<td style="padding:8px 6px;">#'+l.id+'</td>'+
            '<td style="padding:8px 6px;font-weight:bold;">'+esc(l.name)+'</td>'+
            '<td style="padding:8px 6px;">'+esc(l.verifier)+'</td>'+
            '<td style="padding:8px 6px;">'+
              '<button class="del-lvl-btn" data-lid="'+l.id+'" style="background:#ff4d4d;color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;">Delete</button>'+
            '</td>'+
          '</tr>'
        ).join('')+
      '</tbody></table>';

    box.querySelectorAll('.del-lvl-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if(!confirm('Permanently delete this level from the database?')) return;
        const lid = btn.dataset.lid;
        const res = await adminApi('delete_level', { level_id: lid });
        if(res.ok) {
          alert('Level deleted! Refresh the page to update the ranking list.');
          loadAdminLevels();
        } else {
          alert('Failed to delete level.');
        }
      });
    });
  }

  loadAdminUsers();
  loadAdminLevels();

  $('btnSaveLevel').addEventListener('click', async () => {
    const payload = {
      rank: parseInt($('dbLvlRank').value) || 999,
      name: $('dbLvlName').value.trim(),
      creators: $('dbLvlCreators').value.trim(),
      verifier: $('dbLvlVerifier').value.trim(),
      link: $('dbLvlLink').value.trim(),
      qualify: $('dbLvlQualify').value,
      level_id: $('dbLvlId').value.trim(),
      password: $('dbLvlPass').value.trim()
    };
    if(!payload.name || !payload.verifier || !payload.link) return alert('Name, Verifier, and Link are required.');
    const res = await adminApi('add_level', payload);
    if(res.ok){
      alert('Level added directly to database! Refresh the page to see it on the Rankings.');
      $('dbLvlName').value = '';
      $('dbLvlCreators').value = '';
      $('dbLvlVerifier').value = '';
      $('dbLvlLink').value = '';
      loadAdminLevels();
    } else {
      alert(res.error || 'Failed to add level.');
    }
  });

  $('btnSaveRecord').addEventListener('click', async () => {
    const payload = {
      level_name: $('dbRecLvl').value.trim(),
      username: $('dbRecUser').value.trim(),
      percent: $('dbRecPct').value,
      link: $('dbRecLink').value.trim(),
      is_mobile: $('dbRecMob').value
    };
    if(!payload.level_name || !payload.username || !payload.link) return alert('Level name, Player, and Link are required.');
    const res = await adminApi('add_record', payload);
    if(res.ok){
      alert('Record added directly to database! Refresh the page to update player points.');
      $('dbRecLvl').value = '';
      $('dbRecUser').value = '';
      $('dbRecLink').value = '';
    } else {
      alert(res.error || 'Failed to add record.');
    }
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

async function apiRegister(username, password){
  const res = await fetch('/register.php', {
    method:'POST', 
    headers:{
      'Content-Type':'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({username, password})
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch(e){ return { error: 'not_json', raw: text }; }
}

async function apiLogin(username, password){
  const res = await fetch('/login.php', {
    method:'POST', 
    headers:{
      'Content-Type':'application/json',
      'Accept': 'application/json'
    },
    credentials:'include', 
    body: JSON.stringify({username, password})
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch(e){ return { error: 'not_json', raw: text }; }
}

$('loginGo').addEventListener('click', async (e)=>{
  e.preventDefault(); 
  const user = $('userInput').value.trim();
  const pass = $('passInput').value;
  if(!user || !pass) return say('loginMsg','Enter your username and password.','bad');
  
  const result = await apiLogin(user, pass);
  
  if(result.ok){
    localStorage.setItem('gd_user', result.username);
    localStorage.setItem('gd_role', result.role || 'user');
    say('loginMsg','Logged in as '+result.username,'good');
    refreshNav();
    setTimeout(() => { location.reload(); }, 1000); 
  } else {
    say('loginMsg', result.error || 'Something went wrong.', 'bad');
  }
});

$('regGo').addEventListener('click', async (e)=>{
  e.preventDefault(); 
  const user = $('regUser').value.trim();
  const pass = $('regPass').value;
  const pass2 = $('regPass2').value;
  if(user.length<3) return say('regMsg','Username must be at least 3 letters.','bad');
  if(pass.length<6) return say('regMsg','Password must be at least 6 characters.','bad');
  if(pass!==pass2) return say('regMsg','Passwords do not match.','bad');
  
  const result = await apiRegister(user, pass);
  
  if(result.ok){
    say('regMsg','Registration successful! You can now log in.','good');
    $('regUser').value = '';
    $('regPass').value = '';
    $('regPass2').value = '';
    setTimeout(() => go('login'), 1500); 
  } else {
    say('regMsg', result.error || 'Something went wrong.', 'bad');
  }
});

$('navLogin').addEventListener('click',()=>go('login'));
$('navProfile').addEventListener('click',()=>showProfile());

async function boot() {
  document.querySelectorAll('[data-ico]').forEach(el=>{ el.innerHTML=ico(el.dataset.ico) });
  applyTheme();

  const who = currentUser();
  if (who) {
    try {
      const authRes = await fetch('/api_check.php?username=' + encodeURIComponent(who));
      const authDb = await authRes.json();
      if (authDb.ok) {
        if (authDb.is_banned === 1 || authDb.role !== currentRole()) {
          localStorage.removeItem('gd_user');
          localStorage.removeItem('gd_role');
          localStorage.removeItem('gd_key');
          if (authDb.is_banned === 1) alert('Your account has been banned.');
          else alert('Your account permissions have changed. Please log in again.');
          location.reload();
          return;
        }
      } else {
        localStorage.removeItem('gd_user');
        localStorage.removeItem('gd_role');
        localStorage.removeItem('gd_key');
        location.reload();
        return;
      }
    } catch(e) {}
  }

  try {
    const pRes = await fetch('/api_profile.php?t=' + Date.now());
    const pDb = await pRes.json();
    if(pDb.ok) DB_PROFILES = pDb.profiles;
  } catch(e) {}

  try {
    const res = await fetch('/api_levels.php');
    const db = await res.json();
    
    if (db.ok) {
      db.levels.sort((a, b) => parseInt(a.placement_rank) - parseInt(b.placement_rank));

      db.levels.forEach(l => {
        const key = 'db_' + l.id;
        const targetIndex = Math.max(0, (parseInt(l.placement_rank) || LIST.length + 1) - 1);
        
        LIST.splice(targetIndex, 0, key); 
        
        LEVELS_DATA[key] = {
          id: l.level_id_string || 'N/A',
          name: l.name,
          creators: (l.creators || '').split(',').map(s=>s.trim()),
          verifier: l.verifier,
          verification: l.verification_link,
          percentToQualify: parseInt(l.percent_qualify) || 100,
          password: l.password || 'Free to copy',
          records: []
        };
      });

      db.records.forEach(r => {
        const matchingKey = Object.keys(LEVELS_DATA).find(key => LEVELS_DATA[key].name.toLowerCase() === r.level_name.toLowerCase());
        if (matchingKey) {
          LEVELS_DATA[matchingKey].records.push({
            db_id: r.id,
            user: r.username,
            percent: parseInt(r.percent),
            link: r.link,
            mobile: parseInt(r.is_mobile) === 1
          });
        }
      });

      Object.keys(LEVELS_DATA).forEach(k => {
         LEVELS_DATA[k].records.sort((a,b) => b.percent - a.percent);
      });
    }
  } catch (e) {}

  renderRows(); 
  renderDetail(); 
  renderBoard(); 
  renderStaff();
  refreshNav(); 
  wireGo(); 
  
  if (location.hash === '#profile') showProfile();
  else go('home');
}

boot();
