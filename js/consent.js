/* Cookie consent + Google Analytics. Nothing from Google loads (and no cookies are set) until the visitor accepts.
   The choice is kept in localStorage ('consent' = 'granted' | 'denied'); any [data-consent] element reopens the banner.
   The GA measurement ID comes from the tag's data-ga attribute so the build script stays the single place to change it. */
(() => {
  'use strict';
  const GA_ID = document.currentScript && document.currentScript.dataset.ga;
  const KEY = 'consent';
  const root = document.documentElement;
  const load = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const TEXT = {
    en: {
      label: 'Cookie consent',
      msg: 'I use Google Analytics cookies to see which pages and posts get read. Nothing is loaded unless you accept.',
      accept: 'Accept', decline: 'Decline'
    },
    sr: {
      label: 'Pristanak na kolačiće',
      msg: 'Koristim Google Analytics kolačiće da vidim koje se stranice i članci čitaju. Ništa se ne učitava dok ne prihvatiš.',
      accept: 'Prihvati', decline: 'Odbij'
    }
  };

  let gaLoaded = false;
  const startGA = () => {
    if (!GA_ID) return;
    window['ga-disable-' + GA_ID] = false;
    if (gaLoaded) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.append(s);
  };
  const stopGA = () => {
    if (GA_ID) window['ga-disable-' + GA_ID] = true;
    // Drop any _ga* cookies left from an earlier "Accept"
    document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(n => n.startsWith('_ga')).forEach(n => {
      document.cookie = `${n}=; Max-Age=0; path=/`;
      document.cookie = `${n}=; Max-Age=0; path=/; domain=.${location.hostname}`;
    });
  };

  let bar;
  const render = () => {
    const t = TEXT[root.lang === 'sr' ? 'sr' : 'en'];
    bar.setAttribute('aria-label', t.label);
    bar.querySelector('p').textContent = t.msg;
    bar.querySelector('[data-v="denied"]').textContent = t.decline;
    bar.querySelector('[data-v="granted"]').textContent = t.accept;
  };
  const show = () => {
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'consent';
      bar.setAttribute('role', 'region');
      bar.innerHTML = '<p></p><div class="consent-btns"><button type="button" class="btn ghost" data-v="denied"></button><button type="button" class="btn primary" data-v="granted"></button></div>';
      bar.addEventListener('click', e => {
        const v = e.target.closest('button[data-v]')?.dataset.v;
        if (!v) return;
        save(KEY, v);
        v === 'granted' ? startGA() : stopGA();
        bar.hidden = true;
      });
      document.body.append(bar);
      // The page's own language switcher sets <html lang>; follow it
      new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['lang'] });
    }
    render();
    bar.hidden = false;
  };

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-consent]')) return;
    e.preventDefault();
    show();
  });

  const choice = load(KEY);
  if (choice === 'granted') startGA();
  else if (choice !== 'denied') show();
})();
