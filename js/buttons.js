const body = document.body;
const lightBtn = document.getElementById('light');
const loginBtn = document.getElementById('login');

function setTheme(light) {
  body.classList.toggle('light-mode', light);
  lightBtn.textContent = light ? 'Dark Mode' : 'Light Mode';
  localStorage.setItem('theme', light ? 'light' : 'dark');
}

setTheme(localStorage.getItem('theme') === 'light');

lightBtn.addEventListener('click', () => {
  setTheme(!body.classList.contains('light-mode'));
});

loginBtn.addEventListener('click', () => {
  window.location.href = 'html/login.html';
});
