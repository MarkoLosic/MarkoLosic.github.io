// Progressive enhancement: the post list is already server-rendered HTML (good for SEO);
// this only adds instant search and tag filtering on top of it.
(() => {
  'use strict';
  const q = document.getElementById('q'), tagsEl = document.getElementById('tags'), none = document.getElementById('none');
  const cards = [...document.querySelectorAll('#posts .post-card')];
  let tag = '';

  function apply() {
    const term = q.value.trim().toLowerCase();
    let shown = 0;
    cards.forEach((c, i) => {
      const ok = (!tag || c.dataset.tags.split('|').includes(tag)) && (!term || c.dataset.search.includes(term));
      c.hidden = !ok;
      c.classList.toggle('featured', ok && shown === 0 && !tag && !term);
      if (ok) shown++;
    });
    if (none) none.hidden = shown > 0 || cards.length === 0;
  }
  q.addEventListener('input', apply);
  tagsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    tag = b.dataset.t;
    tagsEl.querySelectorAll('.tag').forEach(x => x.classList.toggle('on', x === b));
    apply();
  });
  const wanted = new URLSearchParams(location.search).get('tag');
  if (wanted) { const b = tagsEl.querySelector(`[data-t="${CSS.escape(wanted)}"]`); if (b) b.click(); }
  cards.forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));
})();
