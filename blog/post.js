(() => {
  'use strict';
  const b = document.getElementById('share');
  if (b) b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); b.textContent = 'Copied ✓'; }
    catch (_) { b.textContent = 'Press Ctrl/Cmd+C'; }
    setTimeout(() => { b.textContent = 'Copy link'; }, 1800);
  });
  document.querySelectorAll('.post-card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));
})();
