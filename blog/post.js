(() => {
  'use strict';
  // Copy-link ("#share") is wired in common.js, alongside the language switcher it needs to label the button correctly.
  document.querySelectorAll('.post-card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  // View counter, backed by GoatCounter's public per-page counter endpoint (no key needed).
  const views = document.getElementById('views');
  const code = document.querySelector('meta[name="goatcounter-code"]')?.content;
  if (views && code) {
    fetch(`https://${code}.goatcounter.com/counter/${encodeURIComponent(location.pathname)}.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const n = d && parseInt(String(d.count).replace(/[^\d]/g, ''), 10);
        if (n) { document.getElementById('views-num').textContent = n.toLocaleString(); views.hidden = false; }
      })
      .catch(() => {});
  }
})();
