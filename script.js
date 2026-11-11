(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- i18n (English lives in the HTML; Serbian is swapped in) ---------- */
  const SR = {
    nav_about: 'O meni', nav_ai: 'AI', nav_blog: 'Blog', blog_h: 'Najnovije s bloga.', blog_all: 'Svi članci', nav_skills: 'Vještine', nav_exp: 'Iskustvo', nav_edu: 'Obrazovanje', nav_contact: 'Kontakt', min_read: 'min čitanja',
    status: 'QA inženjer u Bravo System-u · Banja Luka',
    h1_a: 'Pravim softver', h1_b: 'pouzdanim', h1_c: 'prije nego ga korisnici vide.',
    lead: 'Zdravo, ja sam <strong>Marko Lošić</strong> — QA inženjer specijalizovan za automatizaciju testiranja. Više od šest godina testiram web i mobilne aplikacije te ekstenzije za pretraživač, a Playwright i Maestro su mi svakodnevni alati, uz Cypress iskustvo sa ranijih projekata. Takođe testiram AI modele i pravim vlastite mobilne aplikacije.',
    cta_talk: 'Hajde da pričamo', cta_cv: 'Preuzmi CV', loc: 'Banja Luka, Bosna i Hercegovina', loc2: 'Banja Luka, Bosna i Hercegovina · Otvoren za remote rad',
    st1: 'Godina u QA', st2: 'Min. regresije, ranije cijeli dan', st3: 'Automatizovanih testova', st4: 'LLM promptova ocijenjenih ručno',
    about_h: 'Kvalitet je timski sport.',
    about_p1: 'QA inženjer sa 6+ godina iskustva u ručnom i automatizovanom testiranju web aplikacija, mobilnih aplikacija i ekstenzija za pretraživač, u domenima SaaS platformi za kreatore, e-commerce-a i analitike proizvoda. Gradim testne skupove u Playwright-u (uz ranije iskustvo sa Cypress-om), pišem test planove i test slučajeve i blisko sarađujem sa multifunkcionalnim timovima kako bismo isporučili pouzdan softver.',
    about_p2: 'Takođe sam Oracle APEX developer sa iskustvom u SQL-u i PL/SQL-u, testiram AI modele i kreiram mobilne aplikacije — pa proizvode razumijem od baze do uređaja, a ne samo od pretraživača naniže. Moj put u QA vodio je kroz tehničku podršku, trgovinu i prosvjetu, što oblikuje kako razmišljam o korisnicima i koliko jasno opisujem grešku.',
    hl1_t: 'Automatizacija koja se isplati', hl1_d: 'Playwright i Maestro testovi koji QA proces čine bržim i pouzdanijim.',
    hl2_t: 'Proces od nule', hl2_d: 'Izgradio sam QA proces jednog tima od temelja — od test strategije do regresije.',
    hl3_t: 'Blizu tima', hl3_d: 'Zahtjevi, test planovi i povratne informacije dijele se rano, unutar Agile i Scrum timova.',
    skills_h: 'Alati kojima radim.', sk1: 'Testiranje', sk2: 'Alati i platforme', sk3: 'Razvoj', sk4: 'Način rada',
    c_manual: 'Ručno testiranje', c_auto: 'Automatizovano testiranje', c_explo: 'Istraživačko testiranje', c_xb: 'Cross-browser testiranje', c_bug: 'Prijava i praćenje defekata', c_web: 'Web testiranje', c_mobile: 'Mobilno testiranje', c_ext: 'Testiranje ekstenzija za pretraživač',
    c_plan: 'Planiranje testiranja', c_strat: 'Test strategija', c_case: 'Dizajn test slučajeva', c_func: 'Funkcionalno', c_int: 'Integraciono', c_reg: 'Regresiono',
    sk5: 'Mobilne aplikacije', c_mobile2: 'Testiranje mobilnih aplikacija', c_mdev: 'Razvoj mobilnih aplikacija', sk5_d: 'Automatizujem tokove mobilnih aplikacija u Maestru i pravim vlastite mobilne aplikacije, pa vidim gdje se aplikacije najčešće lome.',
    sk6: 'Testiranje AI modela', c_ai: 'Testiranje AI modela', c_llm: 'Lokalni LLM-ovi', c_aiq: 'Provjera kvaliteta odgovora', c_aie: 'Testiranje rubnih slučajeva',  c_xfn: 'Saradnja u multifunkcionalnim timovima',
    ai_h: 'Radim s AI-jem, a ne mimo njega.',
    ai_lede: 'AI alate koristim svaki dan da radim brže i razmišljam šire. Pravilo je uvijek isto: AI predlaže, ja odlučujem. Svaki rezultat provjerim, pokrenem i razumijem prije nego uđe u testni skup ili izvještaj.',
    ai1_t: 'Dizajn testova', ai1_d: 'Pretvaram zahtjeve u ideje za testove, rubne slučajeve i nacrte test slučajeva, koje zatim pregledam, skratim i izoštrim.',
    ai2_t: 'Kod za automatizaciju', ai2_d: 'Pišem, refaktorišem i debagujem Playwright i Maestro testove uz AI asistente, pa se testni skupovi brže grade i popravljaju.',
    ai3_t: 'Analiza grešaka i izvještaji', ai3_d: 'Razumijem logove i padove testova, sužavam uzroke i pripremam nacrte prijava grešaka.',
    ai4_t: 'Planovi i dokumentacija', ai4_d: 'Pripremam nacrte test planova, strategija i dokumentacije te brže učim nove alate i domene.',
    ar1: '✓ Provjereno, nikad slijepo povjerenje', ar2: '✓ Ljudska procjena za svaki rezultat', ar3: '✓ Osjetljivi podaci ne idu u prompt',
    sk1_d: 'Ručno, istraživačko i automatizovano testiranje web aplikacija, mobilnih aplikacija i ekstenzija za pretraživač. Test planove i slučajeve pišem iz zahtjeva, a istraživačkim testiranjem pokrivam ono što skripte propuste.',
    sk2_d: 'Playwright (C#) uz Page Object Model za testove u pretraživaču, ranije Cypress (TypeScript), Maestro za mobilne tokove, Postman za REST API-je, a Jenkins ili GitHub Actions za pokretanje testova u Docker-u.',
    sk6_d: 'Lokalne LLM-ove provjeravam po tačnosti, dosljednosti i bezbjednosti, u odnosu na očekivane odgovore koje utvrđujem iz podataka.',
    sk3_d: 'Aplikacije zasnovane na bazi podataka u Oracle APEX-u, uz SQL i PL/SQL za provjeru podataka i praćenje grešaka do sloja baze.',
    sk4_d: 'Radim unutar Agile i Scrum timova, rano ukazujem na rizike dok su ispravke još jeftine i pišem prijave grešaka koje programer može odmah reprodukovati. Iskustvo u podršci, prosvjeti i trgovini pomaže mi da probleme objasnim tehničkim i netehničkim ljudima.',
   
    tn_more: 'Pročitaj više →',
    exp_h: 'Gdje sam isporučivao.', present: 'danas',
    j1_role: 'QA inženjer',
    j1_5: 'Testiram lokalni LLM (Llama 3) za analitiku proizvoda na dva projekta: napisao sam 100 stručnih promptova i svaki odgovor ocijenio u validacionoj tabeli; halucinacije i pogrešni odgovori iz prvih krugova doveli su do izmjena prompt šablona koje su podigle tačnost na 97%+, a tabela sada služi kao regresioni set nakon svake promjene modela ili prompta.',
    j1_1: 'Ručno testiram web aplikacije, mobilne aplikacije i ekstenzije za pretraživač rano, na lokalnim build-ovima, pa se većina defekata popravi prije regresije: regresija sada otkrije samo 1–2 buga, a dva kritična buga su zaustavljena prije produkcije. Svaka prijava buga sadrži korake, očekivano vs stvarno, dokaz i okruženje.',
    j1_2: 'Radeći u QA timu, skratili smo regresiono testiranje link-in-bio platforme sa cijelog dana na oko 30 minuta izgradnjom i održavanjem suite-a od 100 automatizovanih Playwright testova (C#, Page Object Model) koji se u Docker kontejneru pokreće na svaki pull request kroz GitHub Actions; na ostalim projektima suite-ovi se pokreću u Jenkins pipeline-ovima.',
    j1_6: 'Automatizujem tokove mobilnih aplikacija u Maestru na više projekata, uključujući i isti proizvod.',
    j2_role: 'QA inženjer i Oracle APEX developer',
    j2_1: 'Izgradio sam QA proces tima od temelja: pisane test case-ove, standardni šablon za prijavu buga (koraci, očekivano vs stvarno, dokaz) i Jira workflow za praćenje defekata.',
    j2_2: 'Uveo sam automatizaciju testiranja u tim uz Cypress: 30 automatizovanih testova preuzelo je ponavljajuće regresione provjere i skratilo regresiju na oko sat i po.',
    j2_4: 'Učestvovao sam u brainstorming sesijama o feature-ima sa developerima i unosio perspektivu testiranja prije početka razvoja.',
    j2_5: 'Projektovao sam i razvijao aplikacije zasnovane na bazi podataka u Oracle APEX-u.',
    earlier: 'Ranije iskustvo',
    e1_role: 'Menadžer kategorije', e1_d: 'Vodio sam tehničku i električnu kategoriju proizvoda: izbor proizvoda, cijene, zalihe i pregovore sa dobavljačima, uz istraživanje tržišta.',
    e2_role: 'Učitelj', e2_place: 'OŠ Grahovo · Bosansko Grahovo', e2_d: 'Planirao sam i izvodio zanimljive časove za učenike prvog razreda, što mi je izgradilo vještinu jasnog objašnjavanja i podučavanja ljudi.',
    e3_role: 'Agent tehničke podrške', e3_d: 'Pružao sam podršku korisnicima interneta i EON aplikacije pri rješavanju problema i vodio tim od 8 agenata podrške.',
    edu_h: 'Uvijek učim.', edu1: 'Diplomski studij (bachelor), razredna nastava', training: 'Obuka', edu2: 'Program treniranja timova u kojem se uvjerenja pretvaraju u provjerljive pretpostavke, a odluke donose na osnovu onoga što korisnici zaista rade. Završio sam obuku, a zatim radio kao trener programa, što mi je dalo praktično iskustvo u komunikaciji i obuci ljudi.',
    languages: 'Jezici', lang_en: 'Engleski', lang_en_lvl: 'C1 · Napredni nivo, svakodnevna upotreba',
    interests: 'Interesovanja', int_h: 'Van posla',
    i1: '🏃 Maratonsko trčanje', i2: '📷 Fotografija', i3: '🎸 Gitara', i4: '🥾 Planinarenje', i5: '⛺ Kampovanje',
    ct_h: 'Imate proizvod koji mora biti čvrst kao stijena?',
    ct_p: 'Hajde da razgovaramo o kvalitetu, automatizaciji ili vašem sljedećem izdanju. Rado se povezujem sa kolegama inženjerima, timovima i regruterima.',
    ct_mail: 'Pošalji imejl', ct_copy: 'Kopiraj imejl', ct_copied: 'Kopirano ✓',
    k_email: 'Imejl', k_loc: 'Lokacija',
    cs_eyebrow: 'Studije slučaja', cs_h: 'Pogledaj kako radim, ne samo šta navodim.', cs_more: 'Pogledaj studiju slučaja',
    cs1_n: 'Studija slučaja 01 · interaktivno', cs1_t: 'Kako isporučujem pouzdan softver',
    cs1_d: 'QA pipeline iza svakog pull request-a: Playwright sa C#-om u Docker-u, Maestro mobilni tokovi i kontrola koja blokira merge. Pokreni ga i gledaj kako hvata defekt.',
    cs2_n: 'Studija slučaja 02 · kvalitet AI-ja', cs2_t: 'Testiranje lokalnog LLM-a za analitiku proizvoda',
    cs2_d: '100 stručnih promptova koje sam napisao, sa tačnim odgovorom utvrđenim iz podataka, i svaki Llama 3 odgovor ručno ocijenjen u tabeli po tačnosti, dosljednosti i bezbjednosti.',
    j1_more: 'Pogledaj kako ovaj pipeline radi', j1_more2: 'Kako testiram LLM-ove',
    ai_case: 'Testiram i AI: pogledaj kako provjeravam lokalni Llama 3 model kroz 100 promptova iz analitike proizvoda',
    foot: 'Testirano pažljivo. Isporučeno zeleno. ✓', top: 'Na vrh ↑', cookies: 'Postavke kolačića'
  };
  const nodes = $$('[data-i18n]');
  nodes.forEach(n => { n.dataset.en = n.innerHTML; });
  const copyLabel = $('#copy-label');
  let lang = 'en';
  const setLang = l => {
    lang = l;
    root.lang = l === 'sr' ? 'sr' : 'en';
    nodes.forEach(n => {
      const k = n.dataset.i18n;
      n.innerHTML = l === 'sr' && SR[k] != null ? SR[k] : n.dataset.en;
    });
    document.title = l === 'sr'
      ? 'Marko Lošić — QA inženjer · Automatizacija testiranja'
      : 'Marko Lošić — QA Engineer · Test Automation';
    store.set('lang', l);
    renderLatest();
  };
  $('#lang').addEventListener('click', () => setLang(lang === 'en' ? 'sr' : 'en'));

  /* ---------- Theme ---------- */
  const metaTheme = $('meta[name="theme-color"]');
  const syncMeta = () => metaTheme && metaTheme.setAttribute('content', root.dataset.theme === 'light' ? '#f6f7fb' : '#07090d');
  syncMeta();
  $('#theme').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    store.set('theme', root.dataset.theme);
    syncMeta();
  });

  /* ---------- Nav: scroll state, progress, scrollspy, mobile menu ---------- */
  const nav = $('#nav'), bar = $('#progress'), links = $('#links'), menu = $('#menu');
  const sections = $$('main section[id]');
  const linkEls = $$('a', links);
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', y > 10);
    bar.style.transform = `scaleX(${h > 0 ? Math.min(y / h, 1) : 0})`;
    let current = '';
    sections.forEach(s => { if (s.offsetParent !== null && s.getBoundingClientRect().top <= innerHeight * .4) current = s.id; });
    linkEls.forEach(a => a.classList.toggle('active', (a.dataset.spy ? '#' + a.dataset.spy : a.getAttribute('href')) === '#' + current));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  menu.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', open);
  });
  const closeMenu = () => { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
  linkEls.forEach(a => a.addEventListener('click', closeMenu));
  // pointerdown, not click: iOS Safari/WebKit fire no click when tapping non-interactive elements
  document.addEventListener('pointerdown', e => { if (!nav.contains(e.target)) closeMenu(); });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => {
    // stagger siblings inside grids
    const sibs = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [];
    el.style.setProperty('--d', (Math.max(sibs.indexOf(el), 0) * 0.08) + 's');
    io.observe(el);
  });

  /* ---------- Count-up stats ---------- */
  const counters = $$('[data-count]');
  const cio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      cio.unobserve(en.target);
      const el = en.target, to = +el.dataset.count;
      if (reduced) { el.textContent = to; return; }
      const t0 = performance.now(), dur = 1100;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  counters.forEach(c => cio.observe(c));

  /* ---------- Spotlight hover on cards ---------- */
  $$('.card.glow').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---------- Hero terminal (illustrative test run) ---------- */
  const term = $('#term');
  let termToken = 0;
  const LINES = [
    ['cmd', '$ dotnet test\n'],
    ['dim', 'Running tests on web · mobile · extension · AI\n'],
    ['ok', '  ✓ '], ['', 'login › signs in with valid credentials\n'],
    ['ok', '  ✓ '], ['', 'maestro › onboarding flow on mobile\n'],
    ['ok', '  ✓ '], ['', 'extension › popup renders after install\n'],
    ['ok', '  ✓ '], ['', 'ai › model answers meet quality checks\n'],
    ['ok', '  ✓ '], ['', 'regression › critical paths stay green\n'],
    ['ok', '\n  All tests passed. Ship it.']
  ];
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function runTerminal() {
    if (!term) return;
    const token = ++termToken;
    const render = n => {
      let html = '';
      LINES.slice(0, n).forEach(([cls, txt]) => { html += cls ? `<span class="${cls}">${esc(txt)}</span>` : esc(txt); });
      term.innerHTML = html + '<span class="caret"></span>';
    };
    if (reduced) { render(LINES.length); return; }
    let i = 0;
    const step = () => {
      if (token !== termToken) return;
      i++; render(i);
      if (i < LINES.length) setTimeout(step, i === 1 ? 700 : 420);
    };
    render(0);
    setTimeout(step, 900);
  }

  /* ---------- Copy email ---------- */
  const copyBtn = $('#copy');
  copyBtn.addEventListener('click', async () => {
    const text = copyBtn.dataset.copy;
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) {} ta.remove();
    }
    const done = lang === 'sr' ? SR.ct_copied : 'Copied ✓';
    copyLabel.textContent = done;
    setTimeout(() => { copyLabel.innerHTML = lang === 'sr' ? SR.ct_copy : copyLabel.dataset.en; }, 1800);
  });

  /* ---------- Latest blog posts ---------- */
  let renderLatest = () => {};
  (function latestPosts() {
    const wrap = $('#blog'), grid = $('#latest');
    if (!wrap || !grid) return;
    const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const minRead = () => lang === 'sr' ? SR.min_read : 'min read';
    let list = [];
    const render = () => {
      if (!list.length) return;
      grid.innerHTML = list.map(p => {
        const dt = new Date(p.date + 'T00:00:00Z');
        const date = isNaN(dt) ? p.date : new Intl.DateTimeFormat(lang === 'sr' ? 'sr-Latn-RS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(dt);
        const title = (lang === 'sr' && p.titleSr) || p.title;
        const excerpt = (lang === 'sr' && p.excerptSr) || p.excerpt || '';
        return `<a class="post-card card glow reveal in" href="blog/${encodeURIComponent(p.slug)}/">
            <div class="meta"><span>${e(date)}</span><span>·</span><span>${p.readingTime || 1} ${minRead()}</span></div>
            <h2>${e(title)}</h2><p>${e(excerpt)}</p>
            <div class="tags">${(p.tags || []).map(t => `<span>${e(t)}</span>`).join('')}</div></a>`;
      }).join('');
      grid.querySelectorAll('.card.glow').forEach(c => c.addEventListener('pointermove', ev => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        c.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      }));
    };
    renderLatest = render;
    fetch('blog/posts.json', { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(d => {
        list = (Array.isArray(d) ? d : []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
        if (!list.length) return;
        render();
        wrap.hidden = false;
      })
      .catch(() => {});
  })();

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Init ---------- */
  const saved = store.get('lang');
  if (saved === 'sr') setLang('sr');
  runTerminal();
})();
