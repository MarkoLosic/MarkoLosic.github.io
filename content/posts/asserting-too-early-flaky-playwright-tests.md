---
title: Asserting Too Early: The Quiet Source of Flaky Playwright Tests
title_sr: Prerana provjera: tihi izvor nestabilnih Playwright testova
date: 2026-09-21
tags: [qa, test-automation, playwright, flaky-tests]
excerpt: Many flaky Playwright tests aren't slow, they check too early. How instant checks and missing awaits cause false failures and false passes.
excerpt_sr: Mnogi nestabilni Playwright testovi nisu spori, nego provjeravaju prerano. Kako trenutne provjere i zaboravljeni await uzrokuju lažne padove i lažne prolaze.
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
