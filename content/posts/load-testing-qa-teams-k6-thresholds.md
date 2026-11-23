---
title: "Load Testing for QA Teams: What k6 Catches, and What a Passing Threshold Can Still Hide"
title_sr: "Load testiranje za QA timove: šta k6 hvata, a šta prolazni prag i dalje može da sakrije"
date: 2026-11-20
time: 18:30
tags: [qa, performance-testing, load-testing, k6, tools-and-trends]
excerpt: A practical k6 walkthrough for QA teams: scripting a load test, setting thresholds, and the pitfalls that make a green dashboard misleading.
excerpt_sr: Praktičan k6 vodič za QA timove: pisanje load testa, postavljanje pragova i zamke zbog kojih zelen dashboard može da zavara.
image: assets/blog/load-testing-qa-teams-k6-thresholds.jpg
---
A functional suite goes green, a release ships, and the first real traffic spike takes the checkout endpoint down anyway. Nothing in the test suite was wrong — it just never asked what happens when five hundred people hit that endpoint at the same moment instead of one. That's the gap load testing is for, and it's one most QA suites still leave uncovered, often because the tooling used to demand a steep learning curve before it told you anything useful. Grafana's k6 has become the default entry point for closing that gap without the overhead JMeter or Gatling used to require.

![Illustration of a load test: a latency graph that stays flat and then spikes in red above a dotted threshold line, next to a cluster of servers hit by a wave of incoming requests](assets/blog/load-testing-qa-teams-k6-thresholds.jpg)

## Why this needs its own test suite

Functional tests check correctness one request at a time: given this input, is the output right. Load testing checks what happens when many requests arrive concurrently and keep arriving, and it surfaces failure modes a single-request test structurally cannot see — a connection pool that's fine at one request per second and exhausted at fifty, an N+1 query that only becomes visible under concurrent load, a cache that stays warm in isolation but stampedes when many clients miss it at once, a rate limiter that was never actually configured. None of that shows up in a suite that runs requests one after another.

## A first k6 script

k6 scripts are plain JavaScript, which is a large part of why it has become the common choice for teams that already write their functional tests in JS or TS — no separate GUI tool, no XML test plans to maintain. A minimal test against a checkout endpoint looks like this:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },  // ramp up to 20 virtual users
    { duration: '3m', target: 20 },  // hold steady
    { duration: '1m', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% of requests under 400ms
    http_req_failed: ['rate<0.01'],   // error rate under 1%
  },
};

export default function () {
  const res = http.post(
    'https://staging.example.com/api/checkout',
    JSON.stringify({ cartId: 'cart_123', paymentToken: 'tok_test' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'order id returned': (r) => r.json('orderId') !== undefined,
  });

  sleep(1); // think time between requests, not a tight loop
}
```

The `thresholds` block is the part that turns this into something CI can gate on: if p95 latency or the error rate crosses the line you set, the run fails, the same way a failed assertion fails a functional test. For a real checkout flow you'd usually model more than one endpoint — add to cart, apply a coupon, submit payment — each with its own traffic weight, which is what k6's scenario feature is for: it lets you combine several request patterns into one run instead of writing separate scripts per endpoint. k6 itself is maintained by Grafana Labs, and recent releases have added a browser module that can drive a real Chromium instance under load, useful when you need to see how the UI behaves while the backend is under stress, not just raw API throughput.

## Reading the results, not just the dashboard

A green run isn't the same as a healthy system. The number worth watching is p95 or p99 latency, not the average — an average response time of 150ms comfortably hides a tail of users waiting four seconds, and a dashboard that only surfaces the mean will tell you everything is fine while a meaningful slice of real users have a bad experience. The other thing worth checking before trusting the numbers is how the load is generated: a fixed number of virtual users looping with no delay models a closed system, where the load automatically backs off the moment the server slows down, which can understate problems compared to real traffic, where new requests keep arriving at their own rate regardless of how the server is doing.

## Pitfalls and limits

Load testing earns its place in a QA suite, but it comes with real failure modes of its own:

- **Staging rarely matches production closely enough.** Smaller instance types, a fraction of the production data volume, and lower connection limits are common, and the result cuts both ways: tests can under-predict problems because production has more headroom, or over-predict them because staging chokes on load that production data volumes would never produce. Treat staging results as directional, not as a guarantee, and say so explicitly when you report them.
- **Pointing the test at the wrong environment.** A misconfigured base URL or environment variable can send real load at production with no rate limit in place. Keep the target URL explicit, gated, and reviewed, the same way you'd review a migration script.
- **No think time.** Firing requests back-to-back with no pause between them doesn't resemble how a real user clicks through a flow, and it will produce throughput numbers no real traffic pattern will ever hit.
- **Choosing the pass/fail bar after the results are in.** If thresholds aren't set before the run, it's tempting to rationalize whatever number comes back. Set the threshold from your actual SLO first.
- **AI-assisted scenario generation is still new and often paywalled.** Several 2026 load testing tools now offer AI-assisted scripting or scenario suggestions, but the features are frequently locked behind paid tiers and still need a human to confirm the generated scenario matches real traffic, not just that it runs without errors.

## What to do next

- Pick one critical flow — checkout, login, search — rather than trying to load test the whole site on the first attempt.
- Run your script at a low virtual-user count first and confirm the checks pass before ramping up; a load test that's wrong at 1 VU is just wrong faster at 100.
- Write your thresholds from an existing SLO or support-ticket history, not from whatever the first run happens to produce.
- Wire the test into CI against staging, track p95/p99 over time, and document the known gaps between that staging environment and production rather than treating a passing run as a production guarantee.

## Sources

- [k6 Load Testing Guide 2026: Scripts, Thresholds, and CI Setup](https://qaskills.sh/blog/k6-load-testing-guide-2026)
- [k6 load testing: a practical guide for APIs — Apidog](https://apidog.com/blog/k6-load-testing/)
- [How to Implement API Load Testing with k6 in Node.js (2026 Guide) — DEV Community](https://dev.to/1xapi/how-to-implement-api-load-testing-with-k6-in-nodejs-2026-guide-9dn)
- [k6 vs JMeter vs Gatling: 2026 comparison — Tech Insider](https://tech-insider.org/k6-vs-jmeter-vs-gatling-2026/)
- [K6 Review 2026: AI-Driven Performance Engineering](https://aiindigo.com/blog/k6-review-2026-ai-driven-performance-engineering)
- [7 Load Testing Mistakes That Give You False Confidence — loadtest.qa](https://loadtest-qa-v1.pages.dev/blog/load-testing-mistakes/)
- [Load Testing Footguns](https://grokdatum.github.io/grokdevops-wiki/library/topics/load-testing/footguns)
- [Common Pitfalls & Best Practices — Gatling Learning](https://nitinkc.github.io/GatlingLearning/theory/06-common-pitfalls)
- [7 Common Performance Testing Mistakes (and How to Avoid Them) in 2026 — LoadFocus](https://loadfocus.com/blog/2026/06/performance-testing-mistakes-how-to-avoid)

<!--sr-->

Funkcionalni testovi su zeleni, izdanje ide u produkciju, a prvi pravi skok saobraćaja svejedno obori checkout endpoint. Ništa u skupu testova nije bilo pogrešno — samo nijedan test nikad nije pitao šta se dešava kada petsto ljudi pogodi taj endpoint u istom trenutku umjesto jednog. To je rupa koju load testiranje popunjava, i većina QA skupova testova je i dalje ostavlja nepokrivenom, često zato što su alati nekada zahtijevali strmu krivu učenja prije nego što bi vam rekli bilo šta korisno. Grafanin k6 je postao podrazumijevana ulazna tačka za zatvaranje te rupe bez režijskog troška koji su nekada tražili JMeter ili Gatling.

![Ilustracija load testa: grafik latencije koji je ravan, a zatim skače crveno iznad isprekidane linije praga, pored grupe servera koju pogađa talas dolaznih zahtjeva](assets/blog/load-testing-qa-teams-k6-thresholds.jpg)

## Zašto ovo zaslužuje sopstveni skup testova

Funkcionalni testovi provjeravaju ispravnost jedan po jedan zahtjev: za ovaj ulaz, da li je izlaz tačan. Load testiranje provjerava šta se dešava kada mnogo zahtjeva stiže istovremeno i nastavlja da stiže, i otkriva načine otkazivanja koje test sa jednim zahtjevom strukturno ne može da vidi — connection pool koji je u redu na jednom zahtjevu u sekundi, a iscrpljen na pedeset, N+1 upit koji postaje vidljiv tek pod istovremenim opterećenjem, keš koji ostaje "topao" u izolaciji, ali doživi stampedo kada ga mnogo klijenata promaši odjednom, rate limiter koji zapravo nikad nije podešen. Ništa od toga se ne pojavljuje u skupu testova koji šalje zahtjeve jedan za drugim.

## Prva k6 skripta

k6 skripte su obični JavaScript, što je velikim dijelom razlog zašto je k6 postao uobičajen izbor za timove koji već pišu funkcionalne testove u JS-u ili TS-u — nema posebnog GUI alata, nema XML test planova za održavanje. Minimalan test protiv checkout endpointa izgleda ovako:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },  // postepeno do 20 virtuelnih korisnika
    { duration: '3m', target: 20 },  // zadrži stabilno
    { duration: '1m', target: 0 },   // postepeno spuštanje
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% zahtjeva ispod 400ms
    http_req_failed: ['rate<0.01'],   // stopa grešaka ispod 1%
  },
};

export default function () {
  const res = http.post(
    'https://staging.example.com/api/checkout',
    JSON.stringify({ cartId: 'cart_123', paymentToken: 'tok_test' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'order id returned': (r) => r.json('orderId') !== undefined,
  });

  sleep(1); // vrijeme razmišljanja između zahtjeva, ne petlja bez pauze
}
```

Blok `thresholds` je dio koji ovo pretvara u nešto na čemu CI može da blokira build: ako p95 latencija ili stopa grešaka pređe granicu koju ste postavili, pokretanje pada, isto kao što neuspješna asercija obori funkcionalni test. Za pravi checkout tok obično biste modelovali više od jednog endpointa — dodavanje u korpu, primjena kupona, slanje plaćanja — svaki sa sopstvenim udjelom u saobraćaju, a tome služi k6 funkcionalnost scenarija: omogućava da kombinujete više obrazaca zahtjeva u jednom pokretanju umjesto da pišete posebne skripte za svaki endpoint. Sam k6 održava Grafana Labs, a novija izdanja su dodala browser modul koji može da pokreće pravu Chromium instancu pod opterećenjem, što je korisno kada treba da vidite kako se UI ponaša dok je backend pod stresom, a ne samo sirovu propusnost API-ja.

## Čitajte rezultate, ne samo dashboard

Zeleno pokretanje nije isto što i zdrav sistem. Broj koji vrijedi pratiti je p95 ili p99 latencija, a ne prosjek — prosječno vrijeme odgovora od 150ms lako sakrije "rep" korisnika koji čekaju četiri sekunde, a dashboard koji prikazuje samo srednju vrijednost reći će vam da je sve u redu dok značajan dio stvarnih korisnika ima loše iskustvo. Druga stvar koju vrijedi provjeriti prije nego što povjerujete brojevima je način na koji se opterećenje generiše: fiksni broj virtuelnih korisnika koji se vrte u petlji bez pauze modeluje zatvoren sistem, u kom se opterećenje automatski povlači čim server uspori, što može umanjiti probleme u poređenju sa stvarnim saobraćajem, gdje novi zahtjevi nastavljaju da stižu sopstvenim tempom bez obzira na to kako je serveru.

## Zamke i ograničenja

Load testiranje zaslužuje svoje mjesto u QA skupu testova, ali ima i sopstvene stvarne načine otkazivanja:

- **Staging rijetko dovoljno liči na produkciju.** Manje instance, djelić produkcionog obima podataka i niži limiti konekcija su uobičajeni, a posljedica seče u oba smjera: testovi mogu da potcijene probleme jer produkcija ima više rezerve, ili da ih precijene jer se staging guši pod opterećenjem koje produkcioni obim podataka nikad ne bi proizveo. Tretirajte rezultate sa staginga kao smjernicu, ne kao garanciju, i to eksplicitno navedite kada ih izvještavate.
- **Test usmjeren na pogrešno okruženje.** Pogrešno podešen base URL ili promjenljiva okruženja može poslati pravo opterećenje na produkciju bez ikakvog rate limita. Neka ciljni URL bude eksplicitan, zaštićen i pregledan, isto kao što biste pregledali skriptu za migraciju.
- **Bez vremena razmišljanja.** Ispaljivanje zahtjeva jedan za drugim bez pauze ne liči na način na koji stvaran korisnik klikće kroz tok, i daće brojeve propusnosti koje nijedan stvaran obrazac saobraćaja nikad neće dostići.
- **Biranje granice prolaza/pada nakon što stignu rezultati.** Ako pragovi nisu postavljeni prije pokretanja, primamljivo je opravdati koji god broj se vrati. Prag prvo postavite na osnovu stvarnog SLO-a.
- **AI generisanje scenarija je još novo i često iza paywall-a.** Nekoliko alata za load testiranje u 2026. nudi AI pomoć pri pisanju skripti ili prijedloge scenarija, ali te funkcije su često zaključane u plaćenim paketima i i dalje traže da čovjek potvrdi da generisani scenario odgovara stvarnom saobraćaju, a ne samo da se izvršava bez grešaka.

## Šta dalje

- Izaberite jedan kritičan tok — checkout, prijavu, pretragu — umjesto da u prvom pokušaju load testirate cijeli sajt.
- Prvo pokrenite skriptu sa malim brojem virtuelnih korisnika i potvrdite da provjere prolaze prije podizanja opterećenja; load test koji je pogrešan na 1 VU je samo brže pogrešan na 100.
- Pragove pišite na osnovu postojećeg SLO-a ili istorije tiketa podrške, a ne na osnovu onoga što prvo pokretanje slučajno pokaže.
- Uvežite test u CI protiv staginga, pratite p95/p99 kroz vrijeme i dokumentujte poznate razlike između tog staging okruženja i produkcije, umjesto da prolazno pokretanje tretirate kao garanciju za produkciju.

## Izvori

- [k6 Load Testing Guide 2026: Scripts, Thresholds, and CI Setup](https://qaskills.sh/blog/k6-load-testing-guide-2026)
- [k6 load testing: a practical guide for APIs — Apidog](https://apidog.com/blog/k6-load-testing/)
- [How to Implement API Load Testing with k6 in Node.js (2026 Guide) — DEV Community](https://dev.to/1xapi/how-to-implement-api-load-testing-with-k6-in-nodejs-2026-guide-9dn)
- [k6 vs JMeter vs Gatling: 2026 comparison — Tech Insider](https://tech-insider.org/k6-vs-jmeter-vs-gatling-2026/)
- [K6 Review 2026: AI-Driven Performance Engineering](https://aiindigo.com/blog/k6-review-2026-ai-driven-performance-engineering)
- [7 Load Testing Mistakes That Give You False Confidence — loadtest.qa](https://loadtest-qa-v1.pages.dev/blog/load-testing-mistakes/)
- [Load Testing Footguns](https://grokdatum.github.io/grokdevops-wiki/library/topics/load-testing/footguns)
- [Common Pitfalls & Best Practices — Gatling Learning](https://nitinkc.github.io/GatlingLearning/theory/06-common-pitfalls)
- [7 Common Performance Testing Mistakes (and How to Avoid Them) in 2026 — LoadFocus](https://loadfocus.com/blog/2026/06/performance-testing-mistakes-how-to-avoid)
