function onClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

function setTab(name) {
  const tabList = document.getElementById('tabList');
  const tabScores = document.getElementById('tabScores');
  const listContent = document.getElementById('listContent');
  const scoresContent = document.getElementById('scoresContent');

  if (tabList) tabList.classList.toggle('active', name === 'list');
  if (tabScores) tabScores.classList.toggle('active', name === 'scores');
  if (listContent) listContent.classList.toggle('active', name === 'list');
  if (scoresContent) scoresContent.classList.toggle('active', name === 'scores');
}

function init() {
  onClick('login', () => {
    window.location.href = 'html/login.html';
  });

  onClick('profile', () => {
    window.location.href = 'html/profile.html';
  });

  onClick('tabList', () => setTab('list'));
  onClick('tabScores', () => setTab('scores'));

  onClick('back', () => {
    window.location.href = '../index.html';
  });

  onClick('loginGo', (e) => {
    if (e) e.preventDefault();
    const userInput = document.getElementById('userInput');
    const msg = document.getElementById('loginMsg');
    if (!userInput || !msg) return;

    const user = userInput.value.trim();

    if (user === '') {
      msg.textContent = 'Enter your username first.';
      return;
    }

    localStorage.setItem('gdgcll-user', user);
    msg.textContent = 'Logged in as ' + user;

    const profileBtn = document.getElementById('profile');
    if (profileBtn) profileBtn.textContent = user;
  });

  const savedUser = localStorage.getItem('gdgcll-user');
  if (savedUser) {
    const profileBtn = document.getElementById('profile');
    if (profileBtn) profileBtn.textContent = savedUser;
  }

  setTab('list');
}

document.addEventListener('DOMContentLoaded', init);
