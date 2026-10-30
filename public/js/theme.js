const STORAGE_KEY = 'wj-theme';

function getTheme() {
  return document.documentElement.dataset.theme || 'light';
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  updateToggle(theme);
}

function updateToggle(theme) {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
  );
}

document.getElementById('themeToggle')?.addEventListener('click', () => {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
});

updateToggle(getTheme());

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  } catch (_) {}
});
