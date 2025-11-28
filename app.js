const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const themeToggle = document.getElementById('themeToggle');
let darkMode = localStorage.getItem('landingTheme') ?? (prefersDark ? 'dark' : 'light');

function applyTheme() {
  const body = document.body;
  if (darkMode === 'light') {
    body.style.setProperty('--bg', '#f5f7fb');
    body.style.setProperty('--panel', 'rgba(255, 255, 255, 0.7)');
    body.style.setProperty('--text', '#0f1424');
    body.style.setProperty('--muted', '#556077');
    body.style.setProperty('--border', 'rgba(15, 20, 36, 0.12)');
    body.style.setProperty('--shadow-soft', '0 20px 60px rgba(34, 44, 72, 0.12)');
    themeToggle.textContent = 'Dark mode';
  } else {
    body.style.removeProperty('--bg');
    body.style.removeProperty('--panel');
    body.style.removeProperty('--text');
    body.style.removeProperty('--muted');
    body.style.removeProperty('--border');
    body.style.removeProperty('--shadow-soft');
    themeToggle.textContent = 'Light mode';
  }
}

function toggleTheme() {
  darkMode = darkMode === 'light' ? 'dark' : 'light';
  localStorage.setItem('landingTheme', darkMode);
  applyTheme();
}

applyTheme();
themeToggle.addEventListener('click', toggleTheme);

const navLinks = document.querySelectorAll('.nav a');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      window.scrollTo({ top: target.offsetTop - 60, behavior: 'smooth' });
    }
  });
});
