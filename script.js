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
    lead: 'Zdravo, ja sam <strong>Marko Lošić</strong> — QA inženjer specijalizovan za automatizaciju testiranja. Više od šest godina testiram web i mobilne aplikacije te ekstenzije za pretraživač, a Playwright, Cypress i Maestro su mi svakodnevni alati. Takođe testiram AI modele i pravim vlastite mobilne aplikacije.',
    cta_talk: 'Hajde da pričamo', cta_cv: 'Preuzmi CV', loc: 'Banja Luka, Bosna i Hercegovina', loc2: 'Banja Luka, Bosna i Hercegovina',
    st1: 'Godina u QA', st2: 'Platforme: web, mobilne, ekstenzije', st3: 'Alata za automatizaciju: Playwright, Cypress, Maestro', st4: '+ PL/SQL i Oracle APEX',
    about_h: 'Kvalitet je timski sport.',
    about_p1: 'QA inženjer sa 6+ godina iskustva u ručnom i automatizovanom testiranju web aplikacija, mobilnih aplikacija i ekstenzija za pretraživač. Gradim testne skupove u Playwright-u i Cypress-u, pišem test planove i test slučajeve i blisko sarađujem sa multifunkcionalnim timovima kako bismo isporučili pouzdan softver.',
    about_p2: 'Takođe sam Oracle APEX developer sa iskustvom u SQL-u i PL/SQL-u, testiram AI modele i kreiram mobilne aplikacije — pa proizvode razumijem od baze do uređaja, a ne samo od pretraživača naniže. Moj put u QA vodio je kroz tehničku podršku, trgovinu i prosvjetu, što oblikuje kako razmišljam o korisnicima i koliko jasno opisujem grešku.',
    hl1_t: 'Automatizacija koja se isplati', hl1_d: 'Playwright i Cypress testovi koji QA proces čine bržim i pouzdanijim.',
    hl2_t: 'Proces od nule', hl2_d: 'Izgradio sam QA proces jednog tima od temelja — od test strategije do regresije.',
    hl3_t: 'Blizu tima', hl3_d: 'Zahtjevi, test planovi i povratne informacije dijele se rano, unutar Agile i Scrum timova.',
    skills_h: 'Alati kojima radim.', sk1: 'Testiranje', sk2: 'Alati i platforme', sk3: 'Razvoj', sk4: 'Način rada',
    c_manual: 'Ručno testiranje', c_auto: 'Automatizovano testiranje', c_web: 'Web testiranje', c_mobile: 'Mobilno testiranje', c_ext: 'Testiranje ekstenzija za pretraživač',
    c_plan: 'Planiranje testiranja', c_strat: 'Test strategija', c_case: 'Dizajn test slučajeva', c_func: 'Funkcionalno', c_int: 'Integraciono', c_reg: 'Regresiono',
    sk5: 'Mobilne aplikacije', c_mobile2: 'Testiranje mobilnih aplikacija', c_mdev: 'Razvoj mobilnih aplikacija', sk5_d: 'Mobilne aplikacije su mi područje rada s obje strane: automatizujem testiranje mobilnih aplikacija pomoću Maestra i kreiram vlastite mobilne aplikacije.',
    m1_h: 'Testiranje pomoću Maestra',
    m1_1: 'Automatizujem end-to-end tokove korisničkog interfejsa, poput uvodnog toka, prijave i navigacije, kao čitljive i ponovljive Maestro tokove.',
    m1_2: 'Iste tokove ponovo pokrećem kao regresione provjere prije svakog izdanja, da ispravka na jednom ekranu ne pokvari nešto na drugom.',
    m1_3: 'Automatizaciju kombinujem sa ručnim istraživačkim testiranjem na različitim uređajima i veličinama ekrana.',
    m1_4: 'Greške prijavljujem sa jasnim koracima za reprodukciju kako bi se brže ispravile.',
    m2_h: 'Kreiranje mobilnih aplikacija',
    m2_1: 'Dizajniram i razvijam vlastite mobilne aplikacije, od ideje do aplikacije koja radi.',
    m2_2: 'Pošto ih sâm pravim, vidim kako su strukturisane i gdje se najčešće lome, pa su moji testovi precizniji.',
    m2_3: 'U razvoj unosim tester mentalitet: rubni slučajevi i stvarni korisnički tokovi razmatraju se tokom izrade, a ne poslije.',
    sk6: 'Testiranje AI modela', c_ai: 'Testiranje AI modela', c_aiq: 'Provjera kvaliteta odgovora', c_aie: 'Testiranje rubnih slučajeva',  c_xfn: 'Saradnja u multifunkcionalnim timovima',
    ai_h: 'Radim s AI-jem, a ne mimo njega.',
    ai_lede: 'AI alate koristim svaki dan da radim brže i razmišljam šire. Pravilo je uvijek isto: AI predlaže, ja odlučujem. Svaki rezultat provjerim, pokrenem i razumijem prije nego uđe u testni skup ili izvještaj.',
    ai1_t: 'Dizajn testova', ai1_d: 'Pretvaram zahtjeve u ideje za testove, rubne slučajeve i nacrte test slučajeva, koje zatim pregledam, skratim i izoštrim.',
    ai2_t: 'Kod za automatizaciju', ai2_d: 'Pišem, refaktorišem i debagujem Playwright, Cypress i Maestro testove uz AI asistente, pa se testni skupovi brže grade i popravljaju.',
    ai3_t: 'Analiza grešaka i izvještaji', ai3_d: 'Razumijem logove i padove testova, sužavam uzroke i pišem prijave grešaka sa jasnim koracima za reprodukciju.',
    ai4_t: 'Planovi i dokumentacija', ai4_d: 'Pripremam nacrte test planova, strategija i dokumentacije te brže učim nove alate i domene.',
    ar1: '✓ Provjereno, nikad slijepo povjerenje', ar2: '✓ Ljudska procjena za svaki rezultat', ar3: '✓ Osjetljivi podaci ne idu u prompt',
    sk1_d: 'Testiranje je moja osnovna disciplina. Pokrivam cijeli raspon, od istraživačkih ručnih provjera do automatizovanih testnih skupova, na web aplikacijama, mobilnim aplikacijama i ekstenzijama za pretraživač.',
    t1_h: 'Ručno i istraživačko',
    t2_h: 'Automatizovano i regresiono',
    t1_1: 'Planiranje testiranja, strategija i dizajn test slučajeva na osnovu zahtjeva.',
    t1_2: 'Funkcionalno testiranje novih mogućnosti u odnosu na zahtjeve.',
    t1_3: 'Istraživačko testiranje kojim uočavam ono što skriptovani testovi propuste.',
    t1_4: 'Prijave grešaka sa jasnim koracima za reprodukciju.',
    t2_1: 'Integraciono testiranje kojim provjeravam da komponente rade zajedno.',
    t2_2: 'Regresioni testovi automatizovani u Playwright-u i Cypress-u i ponovo pokretani pri svakom izdanju.',
    t2_3: 'Testiranje web aplikacija, mobilnih aplikacija i ekstenzija za pretraživač.',
    t2_4: 'Izgradio sam QA proces jednog tima od temelja.',
    sk2_d: 'Alati kojima planiram, automatizujem, pratim i isporučujem.',
    o1_h: 'Automatizacija i API',
    o2_h: 'Saradnja i okruženja',
    o1_1: 'Playwright i Cypress za end-to-end testove u pretraživaču.',
    o1_2: 'Maestro za automatizaciju tokova u mobilnim aplikacijama.',
    o1_3: 'Postman za testiranje API-ja i provjeru odgovora backenda.',
    o1_4: 'Jenkins za automatsko pokretanje testnih skupova.',
    o2_1: 'Jira za praćenje grešaka i testnih zadataka u Agile timovima.',
    o2_2: 'Figma za razumijevanje dizajna i poređenje sa implementacijom.',
    o2_3: 'Git i Bitbucket za verzionisanje testnog koda.',
    o2_4: 'Podjednako se snalazim na Windows-u, Linux-u i macOS-u.',
    sk6_d: 'Testiram kako se AI modeli ponašaju: jesu li odgovori tačni, dosljedni i bezbjedni.',
    a1_h: 'Šta provjeravam',
    a2_h: 'Kako testiram',
    a1_1: 'Tačnost: da li su odgovori tačni i korisni.',
    a1_2: 'Dosljednost: da li model daje stabilne odgovore na slične upite.',
    a1_3: 'Bezbjednost: kako se model ponaša kod neobičnih ili problematičnih upita.',
    a2_1: 'Sastavljam skupove upita sa očekivanim ponašanjem, uključujući rubne slučajeve.',
    a2_2: 'Poredim rezultate kroz više pokretanja i verzija modela.',
    a2_3: 'Neuspjehe dokumentujem konkretnim primjerima.',
    sk3_d: 'Uz QA projektujem i razvijam aplikacije zasnovane na bazi podataka u Oracle APEX-u, a SQL i PL/SQL su mi dnevni alati.',
    d1_h: 'Oracle APEX',
    d2_h: 'SQL i PL/SQL',
    d1_1: 'Projektovao sam i razvijao aplikacije zasnovane na bazi podataka u Oracle APEX-u.',
    d1_2: 'Radio sam kao QA inženjer i APEX developer u istom timu, u Krajina Klas-u.',
    d2_1: 'SQL upiti za provjeru i pregled podataka.',
    d2_2: 'PL/SQL za logiku koja živi u bazi.',
    d2_3: 'Poznavanje baze pomaže mi da testiram sloj podataka i pratim greške do uzroka.',
    sk4_d: 'Kvalitet nastaje u timu. Evo kako radim s ljudima oko sebe.',
    w1_h: 'Agile i Scrum',
    w2_h: 'Komunikacija',
    w1_1: 'Radim unutar Agile i Scrum timova.',
    w1_2: 'Sa multifunkcionalnim timovima definišem zahtjeve za testiranje i pišem test planove.',
    w1_3: 'Tokom razvoja dajem uvide i prijedloge za poboljšanje kvaliteta softvera.',
    w2_1: 'Jasne pisane prijave grešaka koje programer može odmah reprodukovati.',
    w2_2: 'Rane povratne informacije, dok su ispravke još jeftine.',
    w2_3: 'Iskustvo u podršci, prosvjeti i trgovini pomaže mi da isto objasnim tehničkim i netehničkim ljudima.',
    tn_h: 'True North program', tn_sub: 'Završena obuka · Trener programa',
    tn_lede: 'True North je program treniranja timova izgrađen oko jedne ideje: timovi treba da pređu put od neizvjesnosti do dokaza. Umjesto ulaštavanja mišljenja, timovi uče da provjere šta vjeruju o svojim korisnicima i da stvarno ponašanje odluči šta slijedi.',
    tn1_h: 'Šta program znači',
    tn1_1: 'Prvo razumjeti korisnika: intervjui sa empatijom, pa fokus na jedan problem koji je sada najvažniji.',
    tn1_2: 'Pretvoriti uvjerenja u provjerljive pretpostavke, pa pokretati eksperimente koji mjere šta ljudi zaista rade, a ne šta govore.',
    tn1_3: 'Odlučivati na osnovu dokaza i pratiti napredak metrikama koje mijenjaju šta tim radi dalje.',
    tn1_4: 'Raditi u kratkim sprintovima sa planiranjem, dnevnim sastancima i retrospektivama, uz jasne uloge i otvorenu komunikaciju.',
    tn2_h: 'Šta znači za mene',
    tn2_1: 'Završio sam obuku, a zatim radio kao trener programa i pomagao drugima da savladaju metod.',
    tn2_2: 'Unaprijedio je način na koji vodim timove i komuniciram: postavljam bolja pitanja i držim sve fokusiranim na zajedničke ciljeve.',
    tn2_3: 'Isti način razmišljanja vodi moje testiranje: pretpostavke se eksplicitno navode, a kvalitet se procjenjuje po uočenom ponašanju, a ne po mišljenju.',
    exp_h: 'Gdje sam isporučivao.', present: 'danas',
    j1_role: 'QA inženjer',
    j1_1: 'Ručno testiram web aplikacije, mobilne aplikacije i ekstenzije za pretraživač kako bi kvalitet bio visok u svakom izdanju.',
    j1_2: 'Gradim i održavam automatizovane testove u Playwright-u i Cypress-u, čime poboljšavam efikasnost i pouzdanost QA procesa.',
    j1_3: 'Sarađujem sa multifunkcionalnim timovima na definisanju zahtjeva za testiranje, pisanju test planova i izvršavanju test slučajeva.',
    j1_4: 'Temeljno testiram i otklanjam greške kako bih uočio defekte i obezbijedio besprijekorno funkcionisanje.',
    j2_role: 'QA inženjer i Oracle APEX developer',
    j2_1: 'Izgradio sam QA proces tima od temelja.',
    j2_2: 'Razvijao sam automatizovane testove u Playwright-u i Cypress-u, čime sam poboljšao efikasnost i pouzdanost QA procesa.',
    j2_3: 'Izvodio sam funkcionalno, integraciono i regresiono testiranje radi pouzdanosti i stabilnosti aplikacija.',
    j2_4: 'Tokom razvoja sam davao uvide i prijedloge za poboljšanje kvaliteta softvera.',
    j2_5: 'Projektovao sam i razvijao aplikacije zasnovane na bazi podataka u Oracle APEX-u.',
    earlier: 'Ranije iskustvo',
    e1_role: 'Menadžer kategorije', e1_d: 'Vodio sam tehničku i električnu kategoriju proizvoda: izbor proizvoda, cijene, zalihe i pregovore sa dobavljačima, uz istraživanje tržišta.',
    e2_role: 'Učitelj', e2_place: 'OŠ Grahovo · Bosansko Grahovo', e2_d: 'Planirao sam i izvodio zanimljive časove za učenike prvog razreda.',
    e3_role: 'Agent tehničke podrške', e3_d: 'Pružao sam podršku korisnicima interneta i EON aplikacije pri rješavanju problema i vodio tim agenata podrške.',
    edu_h: 'Uvijek učim.', edu1: 'Diplomski studij (bachelor), razredna nastava', training: 'Obuka', edu2: 'Završena obuka · Trener programa',
    interests: 'Interesovanja', int_h: 'Van posla',
    i1: '🏃 Maratonsko trčanje', i2: '📷 Fotografija', i3: '🎸 Gitara', i4: '🥾 Planinarenje', i5: '⛺ Kampovanje',
    ct_h: 'Imate proizvod koji mora biti čvrst kao stijena?',
    ct_p: 'Hajde da razgovaramo o kvalitetu, automatizaciji ili vašem sljedećem izdanju. Rado se povezujem sa kolegama inženjerima, timovima i regruterima.',
    ct_mail: 'Pošalji imejl', ct_copy: 'Kopiraj imejl', ct_copied: 'Kopirano ✓',
    k_email: 'Imejl', k_phone: 'Telefon', k_loc: 'Lokacija',
    foot: 'Testirano pažljivo. Isporučeno zeleno. ✓', top: 'Na vrh ↑'
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
    linkEls.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  menu.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', open);
  });
  linkEls.forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
  document.addEventListener('click', e => { if (!nav.contains(e.target)) links.classList.remove('open'); });

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
    ['cmd', '$ npx playwright test\n'],
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
        io.observe(wrap.querySelector('.sec-head'));
      })
      .catch(() => {});
  })();

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Init ---------- */
  const saved = store.get('lang');
  if (saved === 'sr') setLang('sr');
  runTerminal();
})();
