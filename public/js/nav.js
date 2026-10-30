const toggle = document.getElementById('navToggle');
const nav    = document.getElementById('mainNav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    const next = !expanded;
    toggle.setAttribute('aria-expanded', String(next));
    nav.classList.toggle('nav--open', next);
    toggle.classList.toggle('nav-toggle--open', next);
  });

  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      close();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      close();
      toggle.focus();
    }
  });

  nav.querySelectorAll('.nav__link').forEach(link =>
    link.addEventListener('click', close)
  );
}

function close() {
  if (!toggle || !nav) return;
  toggle.setAttribute('aria-expanded', 'false');
  nav.classList.remove('nav--open');
  toggle.classList.remove('nav-toggle--open');
}
