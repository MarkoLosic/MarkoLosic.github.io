/* Serbian strings for the pipeline page. Static text uses data-i18n keys (merged into blog/common.js);
   PL_SR holds the text pipeline.js renders itself. */
window.PAGE_SR = {
  cta_cv: 'Preuzmi CV',
  pl_eyebrow: 'Studija slučaja · Bravo System',
  pl_h1: 'Kako isporučujem <span class="grad">pouzdan</span> softver.',
  pl_lede: 'Svaki pull request na Biolink platformi prolazi kroz istu kontrolu kvaliteta: izolovan Docker stack, Playwright E2E suite i Maestro mobilne tokove. Ništa se ne merge-uje dok sve nije zeleno. Prođi kroz to ispod, ili pokreni pipeline i gledaj kako hvata defekt.',
  pl_note: '<b>Ilustrativni prikaz.</b> Kod klijenta je pod NDA, pa su isječci koda, nazivi testova i trace podaci ovdje pojednostavljeni, anonimizovani primjeri stvarnog sistema — ne produkcijski kod.',
  pl_m1k: 'Regresioni ciklus',
  pl_m1s: 'ranije cijeli dan ručnog testiranja',
  pl_m3k: 'Pokreće se na',
  pl_m3b: 'Svakom PR-u',
  pl_m4k: 'Mobilno',
  pl_m4s: 'YAML tokovi · Android i iOS',
  pl_h2a: 'Pipeline',
  pl_hint1: 'Izaberi scenario, pokreni ga, pa klikni na bilo koju fazu da vidiš kako je napravljena.',
  pl_pass: 'PR prolazi',
  pl_defect: 'Uhvaćen defekt',
  pl_keyp: 'Ključne prakse',
  pl_h2b: 'Unutar jednog test run-a',
  pl_hint2: 'Pogled u stilu trace viewer-a na tri testa. Izaberi test i korak da vidiš snimak ekrana, mrežni log i izvorni kod.',
  pl_tv: 'Trace viewer i izvještaj o kvalitetu',
  pl_specs: 'Testovi (3)',
  pl_actions: 'Akcije i provjere',
  pl_snap: 'Snimak',
  pl_tab1: 'Mreža i konzola',
  pl_tab2: 'Izvorni kod',
  pl_h2c: 'Razmišljanje iza toga',
  pl_hint3: 'Svaki dio ovog pipeline-a ima detaljniji tekst na blogu.',
  pl_st12: 'Faza 01–02', pl_st2: 'Faza 02', pl_st3: 'Faza 03', pl_st4: 'Van pipeline-a',
  bt_shard: 'Kako podijeliti spor skup testova na GitHub Actions, a ne izgubiti signal',
  bt_early: 'Prerana provjera: tihi izvor nestabilnih Playwright testova',
  bt_maestro: 'Pouzdana automatizacija testiranja mobilnih aplikacija uz Maestro',
  bt_llm: 'Kako ručno testiram lokalni Llama 3 kroz 100 stručnih promptova'
};

window.PL_SR = {
  ui: {
    stage: 'FAZA', running: 'u toku…', inspecting: '● Pregled', inspect: 'Pregledaj →', runtime: 'Trajanje faze',
    run: 'Pokreni pipeline', runAgain: 'Pokreni ponovo', runningBtn: 'Pokrećem…', copy: 'Kopiraj', copied: 'Kopirano ✓',
    badge: { passed: '✓ Prošlo', failed: '✕ 1 defekt', blocked: '⚠ Blokirano', running: '● U toku', queued: 'Na čekanju' },
    runningStage: (step, title) => `Pokrećem fazu ${step} · ${title}…`,
    statusPass: 'Workflow #1842 · sve provjere prošle za 27m 45s · spremno za merge',
    statusDefect: 'Workflow #1843 · 1 defekt uhvaćen u Web E2E · merge blokiran',
    allPassed: '3 prošla', somePassed: '2 prošla · 1 pao', step: 'Korak'
  },
  stages: [
    { title: 'PR i Docker okruženje', subtitle: 'GitHub Actions + Compose', badge: 'FAZA 01 · PRIVREMENO OKRUŽENJE',
      desc: 'Svaki pull request podiže sopstveni izolovani stack kroz Docker Compose — bazu sa početnim podacima, keš, API i Playwright workere — tako da se testovi nikad ne sudaraju oko zajedničkih staging podataka.',
      bullets: ['Determinističko punjenje baze prije pokretanja testova', 'Suite podijeljen po NUnit kategorijama u paralelne poslove na GitHub Actions runnerima', 'Zastarjeli run-ovi na istoj grani se otkazuju da se uštede CI minuti'] },
    { title: 'Web E2E', subtitle: 'Playwright + C# · POM', badge: 'FAZA 02 · PLAYWRIGHT .NET',
      desc: 'Suite koji je regresiju sveo sa cijelog dana ručnog rada na oko 30 minuta. Playwright za .NET u C#-u, uz NUnit i strogi Page Object Model. Prijava se priprema jednom, a svaki test koji padne ostavlja trace iza sebe.',
      bullets: ['Stanje prijave se sačuva jednom i ponovo koristi, umjesto da se kroz UI ponavlja u svakom testu', 'Prvo lokatori koje vidi korisnik (role, labele), data-testid samo kad UI ne nudi ništa bolje', 'Trace sa snimcima ekrana i DOM-a čuva se za svaki pad, pa niko ne mora da reprodukuje naslijepo'] },
    { title: 'Mobilni tokovi', subtitle: 'Maestro · Android i iOS', badge: 'FAZA 03 · MAESTRO',
      desc: 'Ključni mobilni tokovi provjeravaju se na svakom build-u. To što i sam pravim mobilne aplikacije oblikuje šta ovdje pokrivam: deep linkove, dozvole i šta se desi kad mreža padne usred toka.',
      bullets: ['Deklarativni YAML tokovi koji sačekaju animacije i spora mrežna učitavanja', 'Onboarding, paywall i objavljivanje pokriveni od početka do kraja', 'Pokreće se headless na Android emulatoru u CI-ju'] },
    { title: 'Kontrola kvaliteta', subtitle: 'Spojeni izvještaj + PR komentar', badge: 'FAZA 04 · IZVJEŠTAVANJE',
      desc: 'TRX rezultati i trace fajlovi iz svih paralelnih poslova skupljaju se u jedan artefakt, a sažetak ide direktno na pull request. Ako web ili mobilni testovi padnu, merge je blokiran.',
      bullets: ['Iz PR komentara direktno do trace.zip fajla za svaki test koji je pao', 'Obavezna provjera statusa: crveno znači nema merge-a', 'Trajanje i nestabilnost testova prate se kroz vrijeme, ne samo po run-u'] }
  ],
  suites: ['Web E2E · Chromium · Editor', 'Bezbjednost · API + web', 'Maestro · Android emulator']
};
