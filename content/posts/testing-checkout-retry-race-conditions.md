---
title: "Testing the Retry Button: Catching Duplicate-Charge Race Conditions Before Customers Do"
title_sr: "Testiranje dugmeta za ponovni pokušaj: kako uhvatiti duple naplate prije kupaca"
date: 2026-09-25
tags: [qa, api-testing, test-automation, fintech, race-conditions]
excerpt: Why sequential idempotency tests miss checkout double-charge bugs, and how to design a test that exposes the real race.
excerpt_sr: Zašto sekvencijalni testovi idempotentnosti propuštaju duple naplate na checkout-u i kako napisati test koji otkriva stvarni race condition.
image: assets/blog/testing-checkout-retry-race-conditions.jpg
---
A customer taps "Place order," the screen spins for a few seconds too long, and they tap it again. Nothing unusual happens from their side — until two charges show up on their card instead of one. This is one of the most common ways payment bugs reach production, and it's also one of the easiest to miss in QA, because the tests that are supposed to catch it often pass for the wrong reason. The following walkthrough is illustrative: imagine a team shipping a checkout flow that looked well covered, only to find its idempotency protection had a hole that only concurrency could reveal.

![Isometric illustration of a checkout screen with a Place Order button sending parallel request streams past a retry and idempotency key validation step, ending in duplicate charges, error warnings and QA checkpoints](assets/blog/testing-checkout-retry-race-conditions.jpg)

## The scenario

The checkout service accepted an `Idempotency-Key` header on order creation, following the same pattern used by Stripe, PayPal, and other payment platforms: the client generates a key per checkout attempt, and the server is supposed to guarantee that repeated requests with that key produce at most one order and one charge. On a slow or flaky connection — a dropped connection, a mobile network hiccup, a load balancer timing out mid-request — the client has no way to know whether the original request actually failed or just never got a response back. The safe move for the client is to retry with the same key. The server's job is to make that retry a no-op if the original request already went through.

The team had a test for this. It sent a request, waited for the response, sent the exact same request again, and asserted that both responses contained the same order ID. It passed reliably in CI. What it didn't test was two requests arriving at the server close enough together that both could see the idempotency key as "not yet used" before either one had a chance to record it.

## Why the passing test wasn't proving what it looked like it proved

Sequential retries and concurrent retries exercise completely different code paths. A sequential test — request, wait, retry — only ever hits the server after the first request has already committed and stored its result. It will pass even if the server has no locking or coordination at all around the "check key, then write" step, because there's never a moment where two requests are mid-flight on the same key at once. That's exactly the moment a double-tap, an auto-retry on a slow network, or a client-side double-submit produces: two requests that both read "key not seen yet" from the database before either one writes its result. Both proceed. Both charge the card.

## Designing a test that actually forces the race

Catching this requires deliberately creating the overlap instead of hoping timing happens to produce it. A concurrent black-box test fires a batch of identical requests at the same endpoint with the same idempotency key and inspects the resulting state, not just the HTTP responses:

```typescript
const key = crypto.randomUUID();
const attempts = Array.from({ length: 10 }, () =>
  request.post('/v1/orders', {
    headers: { 'Idempotency-Key': key },
    data: orderPayload,
  })
);

const responses = await Promise.all(attempts);

// The real assertion isn't on the HTTP responses —
// it's on what actually got committed.
const orders = await db.query(
  'select id from orders where idempotency_key = $1',
  [key]
);
expect(orders.length).toBe(1);
```

Two details matter here. First, the requests are fired together with `Promise.all`, not one after another — a loop that awaits each response before sending the next one is just a slower version of the sequential test that already missed the bug. Second, the assertion checks the authoritative source — the orders table, or a payment ledger — rather than comparing the HTTP response bodies. Two workers can create two separate rows in the database and still both return a response that looks identical to a test that only checks status codes, so the check has to look at what was actually persisted, not just what was returned.

Running this kind of test against the checkout service in the earlier example turned up exactly the failure mode described: instead of one order ID repeated ten times, the ledger showed several distinct orders, each with its own charge, all created from requests sharing the same key. The check-then-write logic wasn't wrapped in anything that prevented two requests from both passing the check before either one finished the write.

## Pitfalls and limits

Concurrent testing like this is noisier and more environment-sensitive than ordinary functional tests. A shared staging database, request queuing at a load balancer, or a rate limiter can all absorb the burst before it reaches the code path you're trying to stress, producing a false pass that says nothing about production behavior under real concurrency. Forcing genuine overlap sometimes requires a test hook that pauses execution at the exact point right before the key is claimed, which means adding test-only code to production paths — a trade-off that needs sign-off from the team, not something QA should sneak in unilaterally. It's also worth resisting the urge to add a client-side lock (disabling the button after one click) and calling the problem solved: that helps the honest double-tap case, but does nothing for the client that legitimately retries after a genuine timeout, which is the case idempotency keys exist for in the first place. Finally, this kind of test is expensive to run on every commit; it belongs in a targeted suite that runs against payment and order-creation endpoints specifically, not as a blanket pattern applied everywhere state gets written.

## What to do next

Audit which of your idempotency or duplicate-prevention tests are actually sequential retries in disguise, and rewrite the ones that matter — payment, order creation, anything with a side effect that costs money to reverse — as concurrent burst tests using `Promise.all` or an equivalent in your stack. Assert against the database or ledger state, not the HTTP response, since that's where a race actually shows up. Add a test case for a changed payload reusing the same key, since a correct implementation should reject that rather than silently processing it. And if your API doesn't document what a duplicate concurrent request is supposed to return — the stored result, a 409, something else — get that written down before writing more tests against it, because right now the test would just be guessing at the contract too.

## Sources

- [Testing Idempotency Keys Under Concurrent Requests](https://oneuptime.com/blog/post/2026-08-24-test-idempotency-key-concurrent-requests/view)
- [Sequential Retries Pass, Concurrent Duplicates Fail: Black-Box Testing for Idempotency-Key Races](https://dev.to/jay_stride/sequential-retries-pass-concurrent-duplicates-fail-black-box-testing-for-idempotency-key-races-3f0j)
- [The Bug Where a Customer Got Charged Twice for Nothing They Did Wrong](https://dev.to/mangeshmandlik/the-bug-where-a-customer-got-charged-twice-for-nothing-they-did-wrong-gn)
<!--sr-->
Kupac dodirne „Place order", ekran se vrti nekoliko sekundi predugo, pa dodirne ponovo. S njegove strane se ne dešava ništa neobično — sve dok mu se na kartici ne pojave dvije naplate umjesto jedne. Ovo je jedan od najčešćih načina na koje greške u plaćanju stignu do produkcije, a ujedno i jedan od najlakših za propustiti u QA-u, jer testovi koji bi trebalo da ga uhvate često prolaze iz pogrešnog razloga. Primjer koji slijedi je ilustrativan: zamislite tim koji objavljuje checkout tok koji je izgledao dobro pokriven testovima, da bi se ispostavilo da zaštita idempotentnosti ima rupu koju može otkriti samo istovremenost.

![Izometrijska ilustracija checkout ekrana na kojem dugme Place Order šalje paralelne tokove zahtjeva kroz korak ponovnog pokušaja i validacije idempotency ključa, koji se završavaju duplim naplatama, upozorenjima o greškama i QA kontrolnim tačkama](assets/blog/testing-checkout-retry-race-conditions.jpg)

## Scenario

Checkout servis je prilikom kreiranja narudžbe prihvatao `Idempotency-Key` zaglavlje, po istom obrascu koji koriste Stripe, PayPal i druge platforme za plaćanje: klijent generiše ključ za svaki pokušaj plaćanja, a server bi trebalo da garantuje da ponovljeni zahtjevi sa tim ključem proizvedu najviše jednu narudžbu i jednu naplatu. Na sporoj ili nestabilnoj vezi — prekinuta konekcija, zastoj mobilne mreže, load balancer kojem istekne vrijeme usred zahtjeva — klijent nikako ne može znati da li je originalni zahtjev zaista pao ili samo odgovor nikada nije stigao nazad. Bezbjedan potez za klijenta je da pokuša ponovo sa istim ključem. Posao servera je da taj ponovni pokušaj ne uradi ništa ako je originalni zahtjev već prošao.

Tim je imao test za ovo. Test je slao zahtjev, čekao odgovor, slao potpuno isti zahtjev ponovo i provjeravao da oba odgovora sadrže isti ID narudžbe. Pouzdano je prolazio na CI-ju. Ono što nije testirao jesu dva zahtjeva koja stignu na server toliko blizu jedan drugom da oba vide idempotency ključ kao „još neiskorišćen" prije nego što bilo koji od njih stigne da ga zabilježi.

## Zašto test koji prolazi nije dokazivao ono što je izgledalo da dokazuje

Sekvencijalni i istovremeni ponovni pokušaji prolaze kroz potpuno različite putanje u kodu. Sekvencijalni test — zahtjev, čekanje, ponovni pokušaj — uvijek pogodi server tek nakon što je prvi zahtjev već završio i sačuvao svoj rezultat. Proći će čak i ako server uopšte nema zaključavanje ni koordinaciju oko koraka „provjeri ključ, pa upiši", jer nikada ne postoji trenutak u kojem su dva zahtjeva sa istim ključem istovremeno u obradi. A upravo taj trenutak proizvodi dupli dodir, automatski ponovni pokušaj na sporoj mreži ili dvostruko slanje forme na klijentu: dva zahtjeva koja oba iz baze pročitaju „ključ još nije viđen" prije nego što bilo koji od njih upiše svoj rezultat. Oba nastavljaju. Oba naplate karticu.

## Kako napisati test koji zaista izaziva race condition

Da biste ovo uhvatili, preklapanje morate namjerno izazvati, umjesto da se nadate da će ga tajming sam proizvesti. Istovremeni black-box test ispali grupu identičnih zahtjeva na isti endpoint sa istim idempotency ključem i provjerava stanje koje je nastalo, a ne samo HTTP odgovore:

```typescript
const key = crypto.randomUUID();
const attempts = Array.from({ length: 10 }, () =>
  request.post('/v1/orders', {
    headers: { 'Idempotency-Key': key },
    data: orderPayload,
  })
);

const responses = await Promise.all(attempts);

// Prava provjera nije nad HTTP odgovorima —
// nego nad onim što je zaista upisano.
const orders = await db.query(
  'select id from orders where idempotency_key = $1',
  [key]
);
expect(orders.length).toBe(1);
```

Ovdje su bitna dva detalja. Prvo, zahtjevi se šalju zajedno pomoću `Promise.all`, a ne jedan za drugim — petlja koja čeka svaki odgovor prije slanja sljedećeg zahtjeva samo je sporija verzija sekvencijalnog testa koji je grešku već propustio. Drugo, provjera gleda mjerodavni izvor — tabelu narudžbi ili knjigu plaćanja (ledger) — umjesto da poredi tijela HTTP odgovora. Dva workera mogu napraviti dva odvojena reda u bazi, a da oba i dalje vrate odgovor koji izgleda identično testu koji provjerava samo statusne kodove, pa provjera mora gledati šta je zaista sačuvano, a ne samo šta je vraćeno.

Pokretanje ovakvog testa nad checkout servisom iz prethodnog primjera otkrilo je upravo opisani problem: umjesto jednog ID-a narudžbe ponovljenog deset puta, ledger je pokazao nekoliko različitih narudžbi, svaku sa sopstvenom naplatom, a sve su nastale iz zahtjeva sa istim ključem. Logika „provjeri, pa upiši" nije bila zaštićena ničim što bi spriječilo da dva zahtjeva oba prođu provjeru prije nego što bilo koji od njih završi upis.

## Zamke i ograničenja

Ovakvo istovremeno testiranje je bučnije i osjetljivije na okruženje od običnih funkcionalnih testova. Dijeljena staging baza, redovi zahtjeva na load balanceru ili rate limiter mogu upiti nalet zahtjeva prije nego što stigne do putanje koju pokušavate da opteretite, pa dobijete lažni prolaz koji ne govori ništa o ponašanju u produkciji pod stvarnom istovremenošću. Da biste izazvali pravo preklapanje, ponekad vam treba test hook koji pauzira izvršavanje tačno prije trenutka kada se ključ zauzme, što znači dodavanje koda samo za testiranje u produkcione putanje — kompromis za koji je potrebna saglasnost tima, a ne nešto što QA treba da ubaci na svoju ruku. Vrijedi i odoljeti porivu da se doda zaključavanje na klijentu (onemogućavanje dugmeta nakon jednog klika) i da se problem proglasi riješenim: to pomaže u slučaju slučajnog duplog dodira, ali ne radi ništa za klijenta koji legitimno pokušava ponovo nakon stvarnog isteka vremena — a upravo zbog tog slučaja idempotency ključevi i postoje. Na kraju, ovakav test je skup za pokretanje na svakom commitu; mjesto mu je u ciljanom skupu testova koji se pokreće baš nad endpointima za plaćanje i kreiranje narudžbi, a ne kao šablon koji se primjenjuje svuda gdje se upisuje stanje.

## Šta dalje

Provjerite koji su vaši testovi idempotentnosti ili zaštite od duplikata zapravo prerušeni sekvencijalni ponovni pokušaji, i one bitne — plaćanje, kreiranje narudžbi, sve što ima posljedicu čije poništavanje košta novca — prepišite kao testove istovremenog naleta pomoću `Promise.all` ili ekvivalenta u vašem stacku. Provjeravajte stanje baze ili ledgera, a ne HTTP odgovor, jer se race condition tu zaista pokaže. Dodajte test slučaj u kojem se isti ključ ponovo koristi sa izmijenjenim payloadom, jer bi ispravna implementacija to trebalo da odbije, a ne da tiho obradi. A ako vaš API ne dokumentuje šta bi dupli istovremeni zahtjev trebalo da vrati — sačuvani rezultat, 409 ili nešto treće — prvo to zapišite, pa tek onda pišite nove testove, jer bi u suprotnom i test samo nagađao kakav je ugovor.

## Izvori

- [Testing Idempotency Keys Under Concurrent Requests](https://oneuptime.com/blog/post/2026-08-24-test-idempotency-key-concurrent-requests/view)
- [Sequential Retries Pass, Concurrent Duplicates Fail: Black-Box Testing for Idempotency-Key Races](https://dev.to/jay_stride/sequential-retries-pass-concurrent-duplicates-fail-black-box-testing-for-idempotency-key-races-3f0j)
- [The Bug Where a Customer Got Charged Twice for Nothing They Did Wrong](https://dev.to/mangeshmandlik/the-bug-where-a-customer-got-charged-twice-for-nothing-they-did-wrong-gn)
