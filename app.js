const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;
const themes = {
  dark: {
    '--bg': '#0f1424',
    '--bg-2': 'rgba(255, 255, 255, 0.06)',
    '--panel': 'rgba(255, 255, 255, 0.12)',
    '--text': '#e9edf5',
    '--muted': '#b9c2d8',
    '--accent': '#9ad8ff',
    '--accent-2': '#f6a3ff',
    '--border': 'rgba(255, 255, 255, 0.2)',
    '--nav-bg': 'rgba(15, 20, 36, 0.65)',
    '--hover-bg': 'rgba(255, 255, 255, 0.05)',
    '--ghost-bg': 'rgba(255, 255, 255, 0.08)',
    '--card-bg': 'rgba(17, 24, 39, 0.55)',
    '--solid-text': '#0f1424',
    '--solid-shadow': '0 10px 30px rgba(154, 216, 255, 0.35)',
    '--footer-bg': 'rgba(15, 20, 36, 0.65)',
    '--shadow-soft': '0 20px 60px rgba(0, 0, 0, 0.25)'
  },
  light: {
    '--bg': '#eef3fb',
    '--bg-2': 'rgba(255, 255, 255, 0.65)',
    '--panel': 'rgba(255, 255, 255, 0.78)',
    '--text': '#0f1424',
    '--muted': '#4f5c76',
    '--accent': '#7fb6ff',
    '--accent-2': '#f0a7ff',
    '--border': 'rgba(15, 20, 36, 0.12)',
    '--nav-bg': 'rgba(255, 255, 255, 0.9)',
    '--hover-bg': 'rgba(15, 20, 36, 0.06)',
    '--ghost-bg': 'rgba(15, 20, 36, 0.05)',
    '--card-bg': 'rgba(255, 255, 255, 0.86)',
    '--solid-text': '#0f1424',
    '--solid-shadow': '0 10px 30px rgba(127, 182, 255, 0.2)',
    '--footer-bg': 'rgba(255, 255, 255, 0.9)',
    '--shadow-soft': '0 20px 60px rgba(34, 44, 72, 0.08)'
  }
};

let darkMode = localStorage.getItem('landingTheme') ?? 'dark';

function applyTheme() {
  const theme = themes[darkMode] ?? themes.dark;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  if (darkMode === 'light') {
    document.body.style.background = `radial-gradient(circle at 20% 20%, rgba(127, 182, 255, 0.14), transparent 35%),
      radial-gradient(circle at 80% 0%, rgba(240, 167, 255, 0.16), transparent 40%),
      radial-gradient(circle at 50% 80%, rgba(119, 137, 255, 0.12), transparent 45%),
      ${theme['--bg']}`;
    themeToggle.textContent = 'Dark mode';
  } else {
    document.body.style.background = `radial-gradient(circle at 20% 20%, rgba(154, 216, 255, 0.12), transparent 35%),
      radial-gradient(circle at 80% 0%, rgba(246, 163, 255, 0.15), transparent 40%),
      radial-gradient(circle at 50% 80%, rgba(119, 137, 255, 0.18), transparent 45%),
      ${theme['--bg']}`;
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
