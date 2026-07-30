document.getElementById('login').addEventListener('click', () => {
  window.location.href = 'html/login.html';
});

document.getElementById('profile').addEventListener('click', () => {
  window.location.href = 'html/profile.html';
});

document.getElementById('tabList').addEventListener('click', () => {
  setTab('list');
});

document.getElementById('tabScores').addEventListener('click', () => {
  setTab('scores');
});

function setTab(name) {
  document.getElementById('tabList').classList.toggle('active', name === 'list');
  document.getElementById('tabScores').classList.toggle('active', name === 'scores');
}

setTab('list');
