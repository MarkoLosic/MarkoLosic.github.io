---
title: "Test Pyramid or Testing Trophy: Picking the Shape That Matches Your Risk, Not the Diagram"
title_sr: "Test piramida ili testing trofej: birajte oblik koji odgovara vašem riziku, a ne dijagramu"
date: 2026-11-09
time: 08:00
tags: [qa, test-automation, methodology, test-strategy]
excerpt: The test pyramid and testing trophy give opposite advice on where to put your tests. Here's how to decide which shape actually fits your codebase.
excerpt_sr: Test piramida i testing trofej daju suprotne savjete o tome gdje da uložite testove. Evo kako da odlučite koji oblik zaista odgovara vašem kodu.
image: assets/blog/test-pyramid-vs-testing-trophy.jpg
---
Most teams pick a test distribution shape once, early, and never revisit it. They draw a pyramid on a whiteboard during onboarding, everyone nods, and three years later half the "unit tests" are mocking so much of the system that a passing suite says almost nothing about whether the app works. The fix usually isn't "write more tests" — it's realizing the shape you copied from a conference talk doesn't match what your codebase actually breaks on.

![A layered pyramid with a wide amber base, a cyan middle and a small white tip on the left, next to a glowing cyan trophy with an amber base on the right](assets/blog/test-pyramid-vs-testing-trophy.jpg)

## Two shapes, two different bets

The test pyramid, popularized by Mike Cohn and later written up by Martin Fowler, says: write a large base of fast, isolated unit tests, a smaller layer of integration tests, and a thin sliver of slow end-to-end tests at the top. The bet is that most bugs live in small units of logic, and unit tests are cheap enough to write in bulk.

The testing trophy, proposed by Kent C. Dodds for front-end and full-stack JavaScript work, inverts the emphasis. It keeps a base of static analysis (type checking, linting) to catch a whole class of bugs before any test runs, but puts the bulk of the effort into integration tests — tests that render a component or hit a route with its real dependencies wired together, mocking only things like the network boundary. Unit and end-to-end tests exist but are deliberately smaller layers. The bet here is different: in UI-heavy and glue-heavy code, most real bugs happen at the seams between units, not inside a single pure function, so testing units in isolation gives you confidence that doesn't transfer to the running app.

Neither shape is "correct" in the abstract. They encode different beliefs about where your bugs come from, and that's exactly why copying one from a blog post without checking it against your own codebase is the actual mistake.

## A concrete example

Take a checkout flow with a `calculateOrderTotal(items, discounts, taxRules)` function and a `CheckoutForm` React component that calls an API, applies the result, and renders a total.

A pyramid-shaped suite might have 40 unit tests for `calculateOrderTotal` covering every discount combination, 8 integration tests that check the API route end to end, and 2 browser tests that click through checkout. This catches almost every pricing logic bug cheaply. But if a schema change renames `discountAmount` to `discount_amount` in the API response and nobody updates the mock in the component test, the 40 passing unit tests and the mocked integration tests tell you nothing — the bug only shows up in the 2 expensive browser tests, or in production.

A trophy-shaped suite flips the ratio: maybe 10 focused unit tests for the trickiest discount math, but 30+ tests that render `CheckoutForm` against a real (or realistically faked, e.g. via MSW) API contract, so a renamed field breaks tests immediately, without needing a full browser run.

```js
// Trophy-style integration test (React Testing Library + MSW v2)
import { http, HttpResponse } from "msw";

test("shows the discounted total after applying a promo code", async () => {
  server.use(
    http.post("/api/checkout", () =>
      HttpResponse.json({ discount_amount: 500, total: 4500 })
    )
  );

  render(<CheckoutForm items={cartItems} />);
  await userEvent.type(screen.getByLabelText(/promo code/i), "SAVE5");
  await userEvent.click(screen.getByRole("button", { name: /apply/i }));

  expect(await screen.findByText("$45.00")).toBeInTheDocument();
});
```

If your actual production incidents over the last six months were logic bugs in isolated functions, the pyramid's bet paid off and you should lean that way. If they were integration mismatches — a field rename, a null the component didn't expect, a race between two API calls — the trophy's bet would have caught them earlier. Pull your last 10-15 postmortems or bug tickets and sort them into "isolated logic" versus "the seams" before picking a shape.

## Pitfalls and limits

Both shapes get misapplied in the same two ways.

First, teams treat the shape as a quota instead of a tool. Chasing a specific ratio of unit-to-integration tests leads to padding: writing a unit test for a trivial getter just to keep the pyramid's base wide, or writing an integration test for something a pure function could cover in milliseconds. The shape should describe where your confidence actually comes from, not a target you optimize for directly.

Second, the trophy's heavier integration layer has real costs the pyramid avoids: tests are slower, flakier when they touch timers, animations or real network timing, and harder to debug because a failure can come from several components at once instead of one function. A backend service with almost no UI and genuinely isolated business logic — a pricing engine, a tax calculator, a batch job — is still better served by a pyramid. The trophy was designed for UI and glue code, not for domain logic with few external dependencies.

Also, neither shape fixes a team that doesn't review its tests. A suite can be pyramid-shaped or trophy-shaped and still be useless if the integration layer over-mocks everything down to a unit test in disguise, or if the "unit" layer is actually making real database calls.

## What to do next

1. Pull your last 10-15 production bugs or postmortems and classify each as "isolated logic" or "seam/integration" — let that ratio, not a diagram, guide your target shape.
2. Audit one existing integration or component test: check what it actually exercises versus what it mocks. If it mocks the thing you're supposedly testing, it's a unit test wearing an integration test's name.
3. Pick one layer to invest in next sprint based on the classification above, rather than rebalancing the whole suite at once.
4. Revisit the shape every quarter or after a major incident — the right ratio shifts as the codebase and its failure modes change.

## Sources

- [Martin Fowler — Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)
- [Kent C. Dodds — The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Kent C. Dodds — Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)

<!--sr-->

Većina timova izabere oblik raspodjele testova jednom, na početku, i nikad mu se ne vrati. Na onboardingu nacrtaju piramidu na tabli, svi klimnu glavom, a tri godine kasnije polovina „unit testova" mockuje toliko sistema da prolazak suitea ne govori gotovo ništa o tome da li aplikacija radi. Rješenje obično nije „napišite više testova" — nego shvatiti da oblik koji ste prepisali sa neke konferencijske prezentacije ne odgovara onome na čemu vaš kod zaista puca.

![Slojevita piramida sa širokom žutom osnovom, cijan srednjim slojem i malim bijelim vrhom sa lijeve strane, pored svijetlećeg cijan trofeja sa žutim postoljem sa desne strane](assets/blog/test-pyramid-vs-testing-trophy.jpg)

## Dva oblika, dvije različite opklade

Test piramida, koju je popularizovao Mike Cohn, a kasnije opisao Martin Fowler, kaže: napišite široku osnovu brzih, izolovanih unit testova, manji sloj integracionih testova i tanak vrh sporih end-to-end testova. Opklada je da većina bagova živi u malim jedinicama logike i da su unit testovi dovoljno jeftini da se pišu na veliko.

Testing trofej, koji je Kent C. Dodds predložio za front-end i full-stack JavaScript, okreće naglasak. Zadržava osnovu statičke analize (provjera tipova, linting) koja hvata čitavu klasu bagova prije nego što se ijedan test pokrene, ali najveći dio truda ulaže u integracione testove — testove koji renderuju komponentu ili gađaju rutu sa stvarnim zavisnostima povezanim zajedno, mockujući samo stvari poput mrežne granice. Unit i end-to-end testovi postoje, ali su namjerno manji slojevi. Opklada je ovdje drugačija: u kodu koji je pretežno UI i „ljepilo" između dijelova, većina stvarnih bagova nastaje na spojevima između jedinica, a ne unutar jedne čiste funkcije, pa testiranje jedinica u izolaciji daje sigurnost koja se ne prenosi na aplikaciju koja radi.

Nijedan oblik nije „ispravan" sam po sebi. Oni kodiraju različita uvjerenja o tome odakle dolaze vaši bagovi, i upravo zato je prava greška prepisati jedan iz nekog blog posta bez provjere u odnosu na sopstveni kod.

## Konkretan primjer

Uzmimo checkout tok sa funkcijom `calculateOrderTotal(items, discounts, taxRules)` i React komponentom `CheckoutForm` koja poziva API, primjenjuje rezultat i prikazuje ukupan iznos.

Suite u obliku piramide mogao bi da ima 40 unit testova za `calculateOrderTotal` koji pokrivaju svaku kombinaciju popusta, 8 integracionih testova koji provjeravaju API rutu od početka do kraja i 2 browser testa koja klikću kroz checkout. To jeftino hvata gotovo svaki bag u logici cijena. Ali ako izmjena šeme preimenuje `discountAmount` u `discount_amount` u API odgovoru, a niko ne ažurira mock u testu komponente, 40 unit testova koji prolaze i mockovani integracioni testovi ne govore vam ništa — bag se pojavljuje tek u 2 skupa browser testa, ili u produkciji.

Suite u obliku trofeja okreće odnos: možda 10 fokusiranih unit testova za najzapetljaniju matematiku popusta, ali 30+ testova koji renderuju `CheckoutForm` naspram stvarnog (ili realistično lažiranog, npr. preko MSW-a) API ugovora, tako da preimenovano polje odmah obori testove, bez potrebe za punim pokretanjem u browseru.

```js
// Integracioni test u stilu trofeja (React Testing Library + MSW v2)
import { http, HttpResponse } from "msw";

test("shows the discounted total after applying a promo code", async () => {
  server.use(
    http.post("/api/checkout", () =>
      HttpResponse.json({ discount_amount: 500, total: 4500 })
    )
  );

  render(<CheckoutForm items={cartItems} />);
  await userEvent.type(screen.getByLabelText(/promo code/i), "SAVE5");
  await userEvent.click(screen.getByRole("button", { name: /apply/i }));

  expect(await screen.findByText("$45.00")).toBeInTheDocument();
});
```

Ako su vaši stvarni incidenti u produkciji u posljednjih šest mjeseci bili bagovi u logici izolovanih funkcija, opklada piramide se isplatila i trebalo bi da se priklonite njoj. Ako su to bila neslaganja na integraciji — preimenovano polje, `null` koji komponenta nije očekivala, trka između dva API poziva — opklada trofeja bi ih uhvatila ranije. Izvucite posljednjih 10-15 postmortema ili tiketa za bagove i razvrstajte ih na „izolovanu logiku" i „spojeve" prije nego što izaberete oblik.

## Zamke i ograničenja

Oba oblika se pogrešno primjenjuju na ista dva načina.

Prvo, timovi tretiraju oblik kao kvotu umjesto kao alat. Jurenje određenog odnosa unit i integracionih testova vodi ka „naduvavanju": pisanju unit testa za trivijalan getter samo da bi osnova piramide ostala široka, ili pisanju integracionog testa za nešto što bi čista funkcija pokrila za nekoliko milisekundi. Oblik treba da opisuje odakle zaista dolazi vaša sigurnost, a ne da bude cilj koji direktno optimizujete.

Drugo, deblji integracioni sloj trofeja ima stvarne troškove koje piramida izbjegava: testovi su sporiji, nestabilniji kad dodiruju tajmere, animacije ili stvarne mrežne vremenske odnose, i teže se debaguju jer greška može da dođe iz nekoliko komponenti odjednom umjesto iz jedne funkcije. Backend servisu bez gotovo ikakvog UI-ja i sa zaista izolovanom poslovnom logikom — engine za cijene, kalkulator poreza, batch job — piramida i dalje bolje odgovara. Trofej je osmišljen za UI i kod koji povezuje dijelove, a ne za domensku logiku sa malo spoljnih zavisnosti.

Takođe, nijedan oblik ne popravlja tim koji ne pregleda svoje testove. Suite može da bude u obliku piramide ili trofeja i da i dalje bude beskoristan ako integracioni sloj mockuje sve dok ne postane prerušeni unit test, ili ako „unit" sloj zapravo pravi stvarne pozive ka bazi.

## Šta dalje

1. Izvucite posljednjih 10-15 bagova iz produkcije ili postmortema i svaki klasifikujte kao „izolovana logika" ili „spoj/integracija" — neka vam taj odnos, a ne dijagram, odredi ciljni oblik.
2. Pregledajte jedan postojeći integracioni test ili test komponente: provjerite šta zaista izvršava, a šta mockuje. Ako mockuje upravo ono što navodno testirate, to je unit test koji nosi ime integracionog testa.
3. Na osnovu gornje klasifikacije izaberite jedan sloj u koji ćete uložiti u sljedećem sprintu, umjesto da prebalansirate cijeli suite odjednom.
4. Vratite se obliku svakog kvartala ili nakon većeg incidenta — pravi odnos se mijenja kako se mijenjaju kod i načini na koje on puca.

## Izvori

- [Martin Fowler — Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)
- [Kent C. Dodds — The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Kent C. Dodds — Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
