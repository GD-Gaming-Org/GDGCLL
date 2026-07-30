
const body = document.body;
const lightBtn = document.getElementById('light');
const loginBtn = document.getElementById('login');

function setTheme(light) {
  body.classList.toggle('light-mode', light);
  lightBtn.textContent = light ? 'Dark Mode' : 'Light Mode';
  localStorage.setItem('gdgcll-theme', light ? 'light' : 'dark');
}

setTheme(localStorage.getItem('gdgcll-theme') === 'light');

lightBtn.addEventListener('click', () => {
  setTheme(!body.classList.contains('light-mode'));
});

loginBtn.addEventListener('click', () => {
  window.location.href = 'html/login.html';
});
