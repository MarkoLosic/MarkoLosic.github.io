(() => {
  'use strict';
  const root = document.documentElement;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  try { localStorage.getItem('x'); } catch (e) {}
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const load = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };

  /* ---------- i18n (English lives in the HTML; Serbian is swapped in — same pattern and localStorage key as the main site) ---------- */
  const SR = {
    nav_about: 'O meni', nav_skills: 'Vještine', nav_exp: 'Iskustvo', nav_blog: 'Blog', nav_contact: 'Kontakt',
    blog_h1: 'Bilješke sa <span class="grad">testerske klupe</span>.',
    blog_lead: 'Pišem o QA-u, automatizaciji testiranja, mobilnom i AI testiranju, i o tome šta učim gradeći softver.',
    search_ph: 'Pretraži članke…',
    tag_all: 'Sve',
    no_posts: 'Još nema članaka — svratite uskoro.',
    no_match: 'Nijedan članak ne odgovara pretrazi.',
    read_post: 'Pročitaj članak',
    min_read: 'min čitanja',
    all_posts: 'Svi članci',
    more_posts: 'Više članaka',
    contact_cta: 'Kontaktiraj me',
    back_home: 'Nazad na početnu ↑',
    copy_link: 'Kopiraj link',
    copied: 'Kopirano ✓',
    copy_fail: 'Pritisni Ctrl/Cmd+C'
  };

  const i18nNodes = $$('[data-i18n]');
  i18nNodes.forEach(n => { n.dataset.en = n.innerHTML; });
  const phNodes = $$('[data-i18n-placeholder]');
  phNodes.forEach(n => { n.dataset.enPh = n.getAttribute('placeholder') || ''; });
  const contentNodes = $$('[data-title-sr], [data-excerpt-sr]');
  contentNodes.forEach(n => {
    if (n.hasAttribute('data-title-sr')) {
      const h = n.matches('h1, h2') ? n : n.querySelector('h1, h2');
      if (h) n.dataset.titleEn = h.innerHTML;
    }
    if (n.hasAttribute('data-excerpt-sr')) {
      const p = n.matches('p') ? n : n.querySelector('p');
      if (p) n.dataset.excerptEn = p.innerHTML;
    }
  });
  const proseEl = $('.prose');
  const proseSrTpl = $('#prose-sr');
  if (proseEl) proseEl.dataset.en = proseEl.innerHTML;

  const fmtDate = (isoDate, style, lang) => {
    const d = new Date(isoDate + 'T00:00:00Z');
    if (isNaN(d)) return isoDate;
    const locale = lang === 'sr' ? 'sr-Latn-RS' : 'en-GB';
    const opts = style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
    return new Intl.DateTimeFormat(locale, opts).format(d);
  };

  let lang = 'en';
  const setLang = l => {
    lang = l;
    root.lang = l === 'sr' ? 'sr' : 'en';
    i18nNodes.forEach(n => { n.innerHTML = l === 'sr' && SR[n.dataset.i18n] != null ? SR[n.dataset.i18n] : n.dataset.en; });
    phNodes.forEach(n => { const k = n.dataset.i18nPlaceholder; n.setAttribute('placeholder', l === 'sr' && SR[k] != null ? SR[k] : n.dataset.enPh); });
    contentNodes.forEach(n => {
      const h = n.dataset.titleEn != null ? (n.matches('h1, h2') ? n : n.querySelector('h1, h2')) : null;
      if (h) h.innerHTML = l === 'sr' ? n.getAttribute('data-title-sr') : n.dataset.titleEn;
      const p = n.dataset.excerptEn != null ? (n.matches('p') ? n : n.querySelector('p')) : null;
      if (p) p.innerHTML = l === 'sr' ? n.getAttribute('data-excerpt-sr') : n.dataset.excerptEn;
    });
    if (proseEl) proseEl.innerHTML = l === 'sr' && proseSrTpl ? proseSrTpl.innerHTML : proseEl.dataset.en;
    $$('time[datetime]').forEach(t => { t.textContent = fmtDate(t.getAttribute('datetime'), t.dataset.fmt, l); });
    save('lang', l);
  };
  const langBtn = $('#lang');
  if (langBtn) langBtn.addEventListener('click', () => setLang(lang === 'en' ? 'sr' : 'en'));
  const savedLang = load('lang');
  if (savedLang === 'sr') setLang('sr');

  /* ---------- Copy link (post pages) ---------- */
  const shareBtn = $('#share');
  if (shareBtn) shareBtn.addEventListener('click', async () => {
    const en = shareBtn.dataset.en;
    try { await navigator.clipboard.writeText(location.href); shareBtn.textContent = lang === 'sr' ? SR.copied : 'Copied ✓'; }
    catch (_) { shareBtn.textContent = lang === 'sr' ? SR.copy_fail : 'Press Ctrl/Cmd+C'; }
    setTimeout(() => { shareBtn.innerHTML = lang === 'sr' && SR.copy_link != null ? SR.copy_link : en; }, 1800);
  });

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
