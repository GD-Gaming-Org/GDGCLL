function onClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

function setTab(name) {
  const list = document.getElementById('tabList');
  const scores = document.getElementById('tabScores');
  if (!list || !scores) return;
  list.classList.toggle('active', name === 'list');
  scores.classList.toggle('active', name === 'scores');
}

onClick('login', () => {
  window.location.href = 'html/login.html';
});

onClick('profile', () => {
  window.location.href = 'html/profile.html';
});

onClick('tabList', () => setTab('list'));
onClick('tabScores', () => setTab('scores'));
setTab('list');

onClick('back', () => {
  window.location.href = '../index.html';
});

onClick('loginGo', () => {
  const user = document.getElementById('userInput').value.trim();
  const msg = document.getElementById('loginMsg');

  if (user === '') {
    msg.textContent = 'Enter your username first.';
    return;
  }

  localStorage.setItem('gdgcll-user', user);
  msg.textContent = 'Logged in as ' + user;
});

const savedUser = localStorage.getItem('gdgcll-user');
if (savedUser) {
  const profileBtn = document.getElementById('profile');
  if (profileBtn) profileBtn.textContent = savedUser;
}
