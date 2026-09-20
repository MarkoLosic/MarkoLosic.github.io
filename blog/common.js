(() => {
  'use strict';
  const root = document.documentElement;
  const $ = s => document.querySelector(s);
  try { localStorage.getItem('x'); } catch (e) {}
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const metaTheme = $('meta[name="theme-color"]');
  const sync = () => metaTheme && metaTheme.setAttribute('content', root.dataset.theme === 'light' ? '#f6f7fb' : '#07090d');
  sync();
  $('#theme').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    save('theme', root.dataset.theme);
    sync();
  });

  const nav = $('#nav'), bar = $('#progress'), links = $('#links'), menu = $('#menu');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', scrollY > 10);
    bar.style.transform = `scaleX(${h > 0 ? Math.min(scrollY / h, 1) : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  menu.addEventListener('click', () => menu.setAttribute('aria-expanded', links.classList.toggle('open')));
  document.addEventListener('click', e => { if (!nav.contains(e.target)) links.classList.remove('open'); });
  $('#year').textContent = new Date().getFullYear();
})();
