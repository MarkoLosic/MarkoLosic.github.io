---
title: Splitting a Slow Test Suite Across GitHub Actions Without Losing Signal
title_sr: Kako podijeliti spor skup testova na GitHub Actions, a ne izgubiti signal
date: 2026-10-08
tags: [qa, test-automation, ci-cd, github-actions, playwright]
excerpt: How matrix-based test sharding in GitHub Actions actually works, a real-world speedup example, and the specific ways it can quietly hide failures.
excerpt_sr: Kako sharding testova preko matrice u GitHub Actions zapravo radi, primjer ubrzanja iz prakse, i konkretni načini na koje može tiho da sakrije padove.
image: assets/blog/sharding-tests-github-actions.jpg
---
A test suite that takes forty minutes to run is more than an inconvenience — it's forty minutes between pushing code and finding out it's broken, forty minutes where a reviewer either waits or merges on faith. The usual fix is to run tests in parallel across several GitHub Actions runners instead of one. That part works, often dramatically. What doesn't get mentioned as often is how easy it is to split a suite in a way that speeds up the green checkmark without actually preserving what that checkmark used to mean.

## How matrix sharding actually splits the work

GitHub Actions' `strategy.matrix` doesn't know anything about your tests — it just spins up one job per entry in a list, in parallel. The splitting of actual test cases is handled separately, usually by the test runner itself. Playwright, for example, has a built-in `--shard` flag that divides the test file list into N contiguous groups and runs only one group per invocation:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: report-${{ matrix.shard }}
          path: playwright-report/
```

This is usually enough to turn one long job into four shorter ones running at the same time. The catch is in that word "contiguous": by default, sharding splits by file count or test count, not by how long each test actually takes. A suite with a handful of slow integration tests bunched into one file can leave one shard running for twenty minutes while the other three finish in two.

## A concrete example: from two hours to ten minutes

The database company behind EdgeDB (now Gel) documented this problem directly. Their suite of roughly five thousand tests took about two hours and twenty minutes on a single runner. Rather than buying a bigger machine, they split the suite across sixteen parallel GitHub Actions runners — but instead of dividing tests evenly by count, they recorded each test's average runtime across prior runs and used that data to distribute tests so every shard took roughly the same wall-clock time. Tests sharing an expensive setup step, like a database migration, were grouped together so that setup wasn't repeated per shard unless the time saved was worth the duplication. A final verification job confirmed that every test in the suite had actually run somewhere, since a bug in a custom sharding script can silently drop tests with nothing to flag it. The result: the test stage dropped to about seven minutes, and the full pipeline ran roughly ten times faster overall.

The numbers are specific to their suite, but the pattern generalizes: naive sharding gets you parallelism; timing-aware sharding plus an integrity check is what gets you parallelism you can actually trust.

## Pitfalls and limits

**Equal split isn't equal time.** Dividing by file or test count assumes every test costs the same, which is rarely true. The visible symptom is a pipeline that reports "all shards done" at wildly different times, with your total runtime still bottlenecked by the single slowest shard — defeating much of the point of sharding in the first place.

**A sharding bug can hide missing tests.** If you write custom logic to assign tests to shards, a bug there doesn't fail loudly — it just means some tests silently never ran, while the pipeline still shows green. This is worth a dedicated check: count tests actually executed across all shards and compare it to the suite total.

**Retries can mask the flakiness sharding was supposed to expose.** Running Playwright with `retries: 2` to keep a parallelized suite stable is common, but a test that fails once and passes on retry is still flaky — it's just flaky quietly instead of loudly. If retries are swallowing failures without anyone tracking which tests needed them, the team loses the signal that would tell them what to actually go fix.

**More shards means more concurrent cost, not less total cost.** Splitting a suite into sixteen parallel jobs doesn't reduce the total compute minutes billed — it compresses the same total work into a shorter wall-clock window using more runners at once. On GitHub-hosted runners this is usually fine, but on a constrained self-hosted pool or a tight Actions minutes budget, heavy sharding can create queuing delays instead of speedups.

**Shared setup can erase the gains.** Grouping tests that depend on an expensive shared fixture, like a seeded database, sounds efficient, but splitting that group across shards means paying the setup cost multiple times. Sometimes the right call is not to split a given cluster of tests at all.

## What to do next

1. **Start with a small, even shard count** (three or four) using your runner's built-in sharding flag and GitHub Actions' `strategy.matrix`, before writing any custom distribution logic.
2. **Add a verification job** that sums the test count actually run across all shards and fails the build if it doesn't match the suite total — this is the single cheapest guard against silently dropped tests.
3. **Separate flaky tests into their own job** with `continue-on-error: true`, rather than relying on blanket retries to paper over instability in the main suite; track what lands there and assign it an owner.
4. **Move to timing-weighted sharding once equal splits stop being equal** — log per-test duration from your existing CI runs and use it to balance shards by time, not file count.

## Sources

- [How We Sharded Our Test Suite for 10x Faster Runs on GitHub Actions — Gel (EdgeDB)](https://www.geldata.com/blog/how-we-sharded-our-test-suite-for-10x-faster-runs-on-github-actions)
- [Flaky Test GitHub Actions: Detect, Quarantine, and Fix Unstable Tests — Testdino](https://testdino.com/blog/flaky-test-github-actions)
- [Playwright GitHub Actions Setup — Currents](https://docs.currents.dev/getting-started/ci-setup/github-actions/playwright-github-actions)
<!--sr-->
Skup testova kojem treba četrdeset minuta nije samo neprijatnost — to je četrdeset minuta između push-a i saznanja da je nešto pokvareno, četrdeset minuta u kojima reviewer ili čeka ili merge-uje na povjerenje. Uobičajeno rješenje je da se testovi pokreću paralelno na nekoliko GitHub Actions runnera umjesto na jednom. Taj dio radi, često i dramatično dobro. Ono što se rjeđe pominje jeste koliko je lako podijeliti skup testova tako da zelena kvačica stigne brže, a da pritom više ne znači ono što je ranije značila.

## Kako sharding preko matrice zapravo dijeli posao

`strategy.matrix` u GitHub Actions ne zna ništa o vašim testovima — samo pokrene po jedan job za svaku stavku u listi, paralelno. Sama podjela test slučajeva se rješava odvojeno, obično u samom test runneru. Playwright, na primjer, ima ugrađen `--shard` flag koji dijeli listu test fajlova na N uzastopnih grupa i u svakom pokretanju izvršava samo jednu grupu:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: report-${{ matrix.shard }}
          path: playwright-report/
```

To je obično dovoljno da se jedan dug job pretvori u četiri kraća koja rade istovremeno. Kvaka je u riječi "uzastopnih": sharding po defaultu dijeli po broju fajlova ili testova, a ne po tome koliko svaki test zaista traje. Skup sa nekoliko sporih integracionih testova nagomilanih u jednom fajlu može ostaviti jedan shard da radi dvadeset minuta, dok ostala tri završe za dva.

## Konkretan primjer: od dva sata do deset minuta

Kompanija koja stoji iza baze podataka EdgeDB (danas Gel) dokumentovala je upravo ovaj problem. Njihov skup od otprilike pet hiljada testova trajao je oko dva sata i dvadeset minuta na jednom runneru. Umjesto da kupe jaču mašinu, podijelili su testove na šesnaest paralelnih GitHub Actions runnera — ali ne ravnomjerno po broju, nego su bilježili prosječno trajanje svakog testa kroz prethodna pokretanja i na osnovu toga raspoređivali testove tako da svaki shard traje otprilike isto realnog vremena. Testovi koji dijele skup korak pripreme, poput migracije baze, grupisani su zajedno, kako se ta priprema ne bi ponavljala u svakom shardu, osim ako ušteđeno vrijeme opravdava dupliranje. Završni verifikacioni job potvrđivao je da se svaki test iz skupa zaista negdje izvršio, jer bug u custom skripti za sharding može tiho da izbaci testove a da to ništa ne označi. Rezultat: faza testiranja je pala na oko sedam minuta, a cijeli pipeline je postao otprilike deset puta brži.

Brojke važe za njihov skup testova, ali obrazac se može generalizovati: naivni sharding vam daje paralelizam; sharding koji uzima u obzir trajanje, uz provjeru integriteta, daje vam paralelizam kojem zaista možete vjerovati.

## Zamke i ograničenja

**Jednaka podjela nije jednako vrijeme.** Podjela po broju fajlova ili testova pretpostavlja da svaki test košta isto, što je rijetko tačno. Vidljiv simptom je pipeline u kojem shardovi završavaju u veoma različito vrijeme, a ukupno trajanje je i dalje ograničeno najsporijim shardom — čime se poništava veći dio smisla sharding-a.

**Bug u sharding-u može sakriti testove koji nedostaju.** Ako pišete custom logiku za raspoređivanje testova po shardovima, bug u njoj ne pada glasno — samo znači da se neki testovi tiho nikad nisu izvršili, dok pipeline i dalje pokazuje zeleno. Za to vrijedi imati posebnu provjeru: prebrojte testove koji su se zaista izvršili u svim shardovima i uporedite sa ukupnim brojem testova.

**Retry-ji mogu prikriti nestabilnost koju je sharding trebalo da otkrije.** Pokretanje Playwright-a sa `retries: 2` da bi paralelizovan skup ostao stabilan je uobičajeno, ali test koji jednom padne pa prođe u ponovnom pokušaju i dalje je nestabilan (flaky) — samo je nestabilan tiho umjesto glasno. Ako retry-ji gutaju padove a niko ne prati kojim testovima su bili potrebni, tim gubi signal koji bi mu rekao šta zapravo treba popraviti.

**Više shardova znači veći istovremeni trošak, a ne manji ukupni.** Podjela skupa na šesnaest paralelnih jobova ne smanjuje ukupan broj naplaćenih minuta — samo sabija isti posao u kraći period koristeći više runnera odjednom. Na runnerima koje hostuje GitHub to je obično u redu, ali na ograničenom self-hosted pool-u ili uz tijesan budžet Actions minuta, agresivan sharding može izazvati čekanje u redu umjesto ubrzanja.

**Zajednička priprema može poništiti dobitak.** Grupisanje testova koji zavise od skupog zajedničkog fixture-a, poput popunjene baze, zvuči efikasno, ali razbijanje te grupe na više shardova znači da se trošak pripreme plaća više puta. Ponekad je ispravna odluka da se određena grupa testova uopšte ne dijeli.

## Šta dalje

1. **Počnite sa malim, ravnomjernim brojem shardova** (tri ili četiri), koristeći ugrađeni sharding flag vašeg test runnera i `strategy.matrix` u GitHub Actions, prije nego što napišete bilo kakvu custom logiku za raspodjelu.
2. **Dodajte verifikacioni job** koji sabira broj testova zaista izvršenih u svim shardovima i obara build ako se ne poklapa sa ukupnim brojem — to je najjeftinija zaštita od tiho izbačenih testova.
3. **Izdvojite nestabilne testove u poseban job** sa `continue-on-error: true`, umjesto da se oslanjate na sveopšte retry-je da prikriju nestabilnost u glavnom skupu; pratite šta tamo završi i dodijelite vlasnika.
4. **Pređite na sharding po trajanju kad jednake podjele prestanu da budu jednake** — bilježite trajanje svakog testa iz postojećih CI pokretanja i koristite te podatke da balansirate shardove po vremenu, a ne po broju fajlova.

## Izvori

- [How We Sharded Our Test Suite for 10x Faster Runs on GitHub Actions — Gel (EdgeDB)](https://www.geldata.com/blog/how-we-sharded-our-test-suite-for-10x-faster-runs-on-github-actions)
- [Flaky Test GitHub Actions: Detect, Quarantine, and Fix Unstable Tests — Testdino](https://testdino.com/blog/flaky-test-github-actions)
- [Playwright GitHub Actions Setup — Currents](https://docs.currents.dev/getting-started/ci-setup/github-actions/playwright-github-actions)
