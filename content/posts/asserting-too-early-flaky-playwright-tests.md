---
title: Asserting Too Early: The Quiet Source of Flaky Playwright Tests
title_sr: Prerana provjera: tihi izvor nestabilnih Playwright testova
date: 2026-09-21
tags: [qa, test-automation, playwright, flaky-tests]
excerpt: Many flaky Playwright tests aren't slow, they check too early. How instant checks and missing awaits cause false failures and false passes.
excerpt_sr: Mnogi nestabilni Playwright testovi nisu spori, nego provjeravaju prerano. Kako trenutne provjere i zaboravljeni await uzrokuju lažne padove i lažne prolaze.
image: assets/blog/asserting-too-early-flaky-playwright-tests.png
---
When a Playwright test fails one run in twenty, the usual advice is to add a wait. But the deeper problem is often different: the test looks at the page at the wrong moment. It checks the application once, right now, instead of checking until the application settles. That single habit produces two kinds of flakiness, and the second one is much harder to spot.

## The problem: a test that looks once

Playwright locators wait for elements to be ready before they act on them. Assertions written the right way retry until the expected state appears. Assertions written the wrong way do not.

Methods such as `isVisible()` return immediately instead of waiting, so a check built on them never gives the page a second to catch up. The Playwright best-practices guide recommends web-first assertions like `toBeVisible()` because they wait and retry until the condition is met.

Here is an illustrative scenario: a team tests a promo code on the cart page.

```ts
test('applies promo code', async ({ page }) => {
  await page.goto('/cart');
  await page.getByLabel('Promo code').fill('SAVE10');
  await page.getByRole('button', { name: 'Apply' }).click();

  // Reads the page once, at this exact instant
  expect(await page.getByText('Discount applied').isVisible()).toBe(true);
  expect(await page.getByTestId('spinner').isVisible()).toBe(false);
});
```

The first check fails whenever the server answers a little slowly. That is the familiar kind of flakiness: a false failure, and a loud one.

## The quiet failure: the false pass

Look at the second line. If the spinner has not rendered yet when the test reads the page, `isVisible()` returns `false` and the assertion passes. The test is green because it looked before anything had happened. It says nothing about whether the app finished the work.

A false pass is worse than a false failure. Nobody investigates a green test, so the gap stays in the suite until a real bug slips through it.

<!--html-->
<div class="callout-grid">
<div class="callout warn"><span class="ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span><div><h4>False failure &mdash; loud</h4><p>The test turns red because the server answered a little slower than usual. Annoying, but easy to notice and investigate.</p></div></div>
<div class="callout bad"><span class="ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg></span><div><h4>False pass &mdash; quiet</h4><p>The test turns green because it looked before the app did anything. Nobody investigates a green test, so the gap stays hidden.</p></div></div>
</div>
<figure class="diagram" role="img" aria-label="Timeline showing a naive check reading the page too early, producing both a false failure and a false pass, compared with a correct check that waits for a positive signal.">
<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg">
<line x1="40" y1="120" x2="680" y2="120" stroke="var(--border-strong)" stroke-width="2"/>
<line x1="150" y1="18" x2="150" y2="120" stroke="var(--danger)" stroke-width="1.6" stroke-dasharray="4 4"/>
<circle cx="150" cy="120" r="4" fill="var(--danger)"/>
<text x="150" y="12" text-anchor="middle" font-weight="600" font-size="12" fill="var(--danger)">Naive check reads here</text>
<text x="150" y="178" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--danger)">&#10005; discount &rarr; false FAIL</text>
<text x="150" y="194" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--danger)">&#10003; spinner &rarr; false PASS</text>
<line x1="620" y1="18" x2="620" y2="120" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="4 4"/>
<circle cx="620" cy="120" r="4" fill="var(--accent)"/>
<text x="620" y="12" text-anchor="middle" font-weight="600" font-size="12" fill="var(--accent)">Correct check waits here</text>
<text x="620" y="178" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--accent)">&#10003; waits for the real signal</text>
<circle cx="90" cy="120" r="5" fill="var(--muted)"/>
<text x="90" y="145" text-anchor="middle" font-size="11.5" fill="var(--text)">Click Apply</text>
<text x="90" y="160" text-anchor="middle" font-family="var(--font-mono)" font-size="10" fill="var(--muted)">0ms</text>
<circle cx="230" cy="120" r="5" fill="var(--muted)"/>
<text x="230" y="145" text-anchor="middle" font-size="11.5" fill="var(--text)">Spinner shows</text>
<text x="230" y="160" text-anchor="middle" font-family="var(--font-mono)" font-size="10" fill="var(--muted)">~40ms</text>
<circle cx="580" cy="120" r="5" fill="var(--accent)"/>
<text x="580" y="145" text-anchor="middle" font-size="11.5" fill="var(--text)">Spinner hides, discount shown</text>
<text x="580" y="160" text-anchor="middle" font-family="var(--font-mono)" font-size="10" fill="var(--muted)">~820ms</text>
</svg>
<figcaption class="diagram-caption">The naive check reads the page before anything happened; the correct check waits for a positive signal.</figcaption>
</figure>
<!--/html-->

## The fix: wait for a positive signal

```ts
await page.getByRole('button', { name: 'Apply' }).click();

// 1. A positive signal that the operation completed
await expect(page.getByText('Discount applied')).toBeVisible();

// 2. Only now is "no spinner" a meaningful statement
await expect(page.getByTestId('spinner')).toBeHidden();
await expect(page.getByTestId('order-total')).toHaveText('$90.00');
```

The rule behind this: a negative assertion ("this is not there") is only trustworthy after a positive one ("the operation finished"). Otherwise it can pass before the app has even started.

When the UI gives no reliable visible signal, wait on the network instead. Create the promise before the click so the response cannot slip past:

```ts
const applied = page.waitForResponse(
  (r) => r.url().includes('/api/promo') && r.ok()
);
await page.getByRole('button', { name: 'Apply' }).click();
await applied;
```

BrowserStack's guide on Playwright waits suggests choosing the wait that matches what the app needs next, such as a visible element, a changed URL, or a completed API response, and replacing hard waits with checks for the final user-facing state. A fixed `waitForTimeout(3000)` does the opposite: it is too short on a slow CI machine and wasteful on a fast one.

## Two more ways to check too early

**A missing await.** Write `expect(locator).toBeVisible()` without `await`, and the test can finish before the assertion resolves. It passes without ever checking anything. The Playwright docs recommend the `@typescript-eslint/no-floating-promises` lint rule to catch this, along with `tsc --noEmit` on CI.

**Unstable dependencies.** If a test depends on a third-party service, its timing is not yours to control. The docs advise testing only what you control and using the network API to guarantee the response you need, for example with `page.route()`.

## Pitfalls and limits

- **Web-first assertions do not fix everything.** Auto-waiting does not mean every timing problem is solved by default. A test can still wait on the wrong signal.
- **Do not raise timeouts as a first response.** A longer timeout hides a slow or racy app instead of explaining it. Expect assertions retry for a limited time (five seconds by default), so raising it should be a deliberate decision.
- **Do not lean on retries.** Retries keep the pipeline green, but they also hide real problems. Use them to collect evidence, not to cover for a flaky test.
- **Some flakiness is a product bug.** If a test fails only when two requests finish in a certain order, the test may be right and the app wrong. Check before you "stabilize" it.
- **How common is this?** One vendor guide claims that asynchronous timing and wait issues cause roughly 45% of flaky tests. It is a vendor figure, so treat it as a rough indicator, not a benchmark.

## What to do next

1. Search your suite for `isVisible()`, `isChecked()` and `textContent()` used inside `expect(...)`, and for `waitForTimeout`. Each hit is a candidate for a web-first assertion.
2. Turn on the `no-floating-promises` rule so a missing `await` fails the lint step instead of silently passing.
3. Pair every negative assertion with a positive one that proves the operation finished.
4. Keep traces on failure paths. The docs suggest recording a trace on the first retry in CI rather than for every test, because tracing everything is heavy. In `playwright.config.ts`, set `use: { trace: 'on-first-retry' }`, then open the trace to see what the page looked like at the moment of failure.

## Sources

- Best Practices | Playwright
- Playwright Waits: Auto-Waiting, Assertions, and Best Practices | BrowserStack
- How to Detect and Avoid Playwright Flaky Tests | BrowserStack
<!--sr-->
Kad Playwright test padne jednom u dvadeset pokretanja, uobičajeni savjet je da se doda čekanje. Ali dublji problem je često drugačiji: test gleda stranicu u pogrešnom trenutku. Aplikaciju provjeri jednom, odmah, umjesto da provjerava sve dok se aplikacija ne smiri. Ta jedna navika proizvodi dvije vrste nestabilnosti, a drugu je mnogo teže uočiti.

## Problem: test koji pogleda samo jednom

Playwright lokatori čekaju da element bude spreman prije nego što s njim nešto urade. Provjere napisane na pravi način ponavljaju se dok se očekivano stanje ne pojavi. Provjere napisane na pogrešan način ne rade to.

Metode poput `isVisible()` vraćaju rezultat odmah umjesto da čekaju, pa provjera zasnovana na njima stranici nikad ne da ni sekundu da stigne. Playwright vodič za najbolje prakse preporučuje "web-first" provjere poput `toBeVisible()`, jer čekaju i ponavljaju se dok uslov nije ispunjen.

Evo ilustrativnog scenarija: tim testira promo kod na stranici korpe.

```ts
test('applies promo code', async ({ page }) => {
  await page.goto('/cart');
  await page.getByLabel('Promo code').fill('SAVE10');
  await page.getByRole('button', { name: 'Apply' }).click();

  // Reads the page once, at this exact instant
  expect(await page.getByText('Discount applied').isVisible()).toBe(true);
  expect(await page.getByTestId('spinner').isVisible()).toBe(false);
});
```

Prva provjera padne kad god server odgovori malo sporije. To je poznata vrsta nestabilnosti: lažan pad, i to glasan.

## Tihi kvar: lažan prolaz

Pogledajte drugu liniju. Ako spinner još nije iscrtan u trenutku kad test pročita stranicu, `isVisible()` vraća `false` i provjera prolazi. Test je zelen jer je pogledao prije nego što se bilo šta desilo. Ne govori ništa o tome da li je aplikacija završila posao.

Lažan prolaz je gori od lažnog pada. Niko ne istražuje zelen test, pa rupa ostaje u skupu testova dok kroz nju ne promakne pravi bug.

<!--html-->
<div class="callout-grid">
<div class="callout warn"><span class="ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span><div><h4>Lažan pad &mdash; glasan</h4><p>Test postane crven jer je server odgovorio malo sporije nego obično. Neugodno, ali lako se primijeti i istraži.</p></div></div>
<div class="callout bad"><span class="ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg></span><div><h4>Lažan prolaz &mdash; tih</h4><p>Test postane zelen jer je pogledao prije nego što se aplikacija bilo šta desila. Niko ne istražuje zelen test, pa rupa ostaje skrivena.</p></div></div>
</div>
<figure class="diagram" role="img" aria-label="Vremenska linija koja prikazuje naivnu provjeru koja čita stranicu prerano, uzrokujući i lažan pad i lažan prolaz, naspram ispravne provjere koja čeka pozitivan signal.">
<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg">
<line x1="40" y1="120" x2="680" y2="120" stroke="var(--border-strong)" stroke-width="2"/>
<line x1="150" y1="18" x2="150" y2="120" stroke="var(--danger)" stroke-width="1.6" stroke-dasharray="4 4"/>
<circle cx="150" cy="120" r="4" fill="var(--danger)"/>
<text x="150" y="12" text-anchor="middle" font-weight="600" font-size="12" fill="var(--danger)">Naivna provjera čita ovdje</text>
<text x="150" y="178" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--danger)">&#10005; discount &rarr; lažan pad</text>
<text x="150" y="194" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--danger)">&#10003; spinner &rarr; lažan prolaz</text>
<line x1="620" y1="18" x2="620" y2="120" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="4 4"/>
<circle cx="620" cy="120" r="4" fill="var(--accent)"/>
<text x="620" y="12" text-anchor="middle" font-weight="600" font-size="12" fill="var(--accent)">Ispravna provjera čeka ovdje</text>
<text x="620" y="178" text-anchor="middle" font-family="var(--font-mono)" font-size="11" fill="var(--accent)">&#10003; čeka pravi signal</text>
<circle cx="90" cy="120" r="5" fill="var(--muted)"/>
<text x="90" y="145" text-anchor="middle" font-size="11.5" fill="var(--text)">Klik na Apply</text>
<text x="90" y="160" text-anchor="middle" font-family="var(--font-mono)" font-size="10" fill="var(--muted)">0ms</text>
<circle cx="230" cy="120" r="5" fill="var(--muted)"/>
<text x="230" y="145" text-anchor="middle" font-size="11.5" fill="var(--text)">Spinner se pojavi</text>
<text x="230" y="160" text-anchor="middle" font-family="var(--font-mono)" font-size="10" fill="var(--muted)">~40ms</text>
<circle cx="580" cy="120" r="5" fill="var(--accent)"/>
<text x="580" y="145" text-anchor="middle" font-size="11.5" fill="var(--text)">Spinner nestane, discount prikazan</text>
<text x="580" y="160" text-anchor="middle" font-family="var(--font-mono)" font-size="10" fill="var(--muted)">~820ms</text>
</svg>
<figcaption class="diagram-caption">Naivna provjera čita stranicu prije nego što se bilo šta desilo; ispravna provjera čeka pozitivan signal.</figcaption>
</figure>
<!--/html-->

## Rješenje: sačekajte pozitivan signal

```ts
await page.getByRole('button', { name: 'Apply' }).click();

// 1. A positive signal that the operation completed
await expect(page.getByText('Discount applied')).toBeVisible();

// 2. Only now is "no spinner" a meaningful statement
await expect(page.getByTestId('spinner')).toBeHidden();
await expect(page.getByTestId('order-total')).toHaveText('$90.00');
```

Pravilo iza ovoga: negativnoj provjeri ("ovoga nema") može se vjerovati tek nakon pozitivne ("operacija je završena"). Inače može proći i prije nego što je aplikacija uopšte počela.

Kad korisnički interfejs ne daje pouzdan vidljiv signal, čekajte na mrežu. Promise napravite prije klika, da odgovor ne može proći neopaženo:

```ts
const applied = page.waitForResponse(
  (r) => r.url().includes('/api/promo') && r.ok()
);
await page.getByRole('button', { name: 'Apply' }).click();
await applied;
```

BrowserStack-ov vodič o Playwright čekanjima predlaže da izaberete čekanje koje odgovara onome što aplikaciji treba sljedeće, poput vidljivog elementa, promijenjenog URL-a ili završenog API odgovora, i da čvrsta čekanja zamijenite provjerama krajnjeg stanja koje korisnik vidi. Fiksni `waitForTimeout(3000)` radi suprotno: prekratak je na sporoj CI mašini, a rasipnički na brzoj.

## Još dva načina da se provjeri prerano

**Zaboravljen await.** Napišete li `expect(locator).toBeVisible()` bez `await`, test može završiti prije nego što se provjera razriješi. Prolazi, a ništa nije provjerio. Playwright dokumentacija preporučuje lint pravilo `@typescript-eslint/no-floating-promises` da to uhvati, uz `tsc --noEmit` na CI-ju.

**Nestabilne zavisnosti.** Ako test zavisi od servisa treće strane, njegov tajming nije pod vašom kontrolom. Dokumentacija savjetuje da testirate samo ono što kontrolišete i da mrežni API koristite da osigurate odgovor koji vam treba, na primjer pomoću `page.route()`.

## Zamke i ograničenja

- **Web-first provjere ne rješavaju sve.** Auto-čekanje ne znači da je svaki problem s tajmingom podrazumijevano riješen. Test i dalje može čekati pogrešan signal.
- **Ne povećavajte timeout kao prvi potez.** Duži timeout krije sporu ili nestabilnu aplikaciju umjesto da je objasni. Expect provjere ponavljaju se ograničeno vrijeme (podrazumijevano pet sekundi), pa povećanje treba da bude promišljena odluka.
- **Ne oslanjajte se na ponovne pokušaje (retries).** Oni održavaju pipeline zelenim, ali kriju i prave probleme. Koristite ih za prikupljanje dokaza, a ne da pokrijete nestabilan test.
- **Neka nestabilnost je bug u proizvodu.** Ako test pada samo kad se dva zahtjeva završe određenim redoslijedom, možda je test u pravu, a aplikacija nije. Provjerite prije nego što ga "stabilizujete".
- **Koliko je ovo često?** Jedan vendorski vodič tvrdi da problemi s asinhronim tajmingom i čekanjem uzrokuju otprilike 45% nestabilnih testova. To je brojka proizvođača, pa je uzmite kao okvirni pokazatelj, a ne kao mjerilo.

## Šta dalje

1. Pretražite svoj skup testova za `isVisible()`, `isChecked()` i `textContent()` upotrijebljene unutar `expect(...)`, kao i za `waitForTimeout`. Svaki pogodak je kandidat za web-first provjeru.
2. Uključite pravilo `no-floating-promises` da zaboravljen `await` obori lint korak umjesto da tiho prođe.
3. Uz svaku negativnu provjeru stavite pozitivnu koja dokazuje da je operacija završena.
4. Zadržite trace za putanje s greškom. Dokumentacija predlaže snimanje trace-a pri prvom ponovnom pokušaju na CI-ju, a ne za svaki test, jer je snimanje svega zahtjevno. U `playwright.config.ts` postavite `use: { trace: 'on-first-retry' }`, pa otvorite trace da vidite kako je stranica izgledala u trenutku pada.

## Izvori

- Best Practices | Playwright
- Playwright Waits: Auto-Waiting, Assertions, and Best Practices | BrowserStack
- How to Detect and Avoid Playwright Flaky Tests | BrowserStack
