(() => {
  'use strict';
  // Copy-link ("#share") is wired in common.js, alongside the language switcher it needs to label the button correctly.
  document.querySelectorAll('.post-card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));
})();
