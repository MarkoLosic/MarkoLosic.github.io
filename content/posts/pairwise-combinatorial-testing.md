---
title: "Pairwise Testing: Cutting Thousands of Config Combinations Down to a Suite You Can Actually Run"
title_sr: "Pairwise testiranje: kako hiljade kombinacija konfiguracije svesti na test suite koji zaista možete da pokrenete"
date: 2026-11-04
time: 08:00
tags: [qa, test-automation, test-design, methodology, combinatorial-testing]
excerpt: How pairwise and combinatorial testing shrink a combinatorial explosion into a small, high-coverage test suite, with a worked example and tool picks.
excerpt_sr: Kako pairwise i kombinatorno testiranje svode kombinatornu eksploziju na mali test suite sa visokom pokrivenošću, uz razrađen primjer i preporuke alata.
image: assets/blog/pairwise-combinatorial-testing.jpg
---
Take a form with four configuration dimensions — say, operating system, browser, locale, and payment method, each with three options — and the full combinatorial space is already 81 test cases. Add a fifth dimension and it jumps past 200. No team runs 81 end-to-end cases for one checkout form, so most teams quietly pick a handful of combinations by gut feeling and call it "good enough coverage." Pairwise testing is a way to replace that guess with a suite that is both smaller and more systematic.

![A dense, chaotic network of connected nodes on the left funnelling through converging arrows into a small, orderly hexagonal grid of nodes on the right](assets/blog/pairwise-combinatorial-testing.jpg)

## The problem with picking combinations by hand

Hand-picked combinations tend to test each value on its own, one at a time: Windows with Chrome, then macOS with Firefox, then Linux with Safari. That checks each value in isolation but rarely checks how values interact — and interaction bugs are exactly the ones that slip through manual review. A date picker that breaks only when the locale is `de-DE` **and** the browser is Safari is invisible to a test plan built value-by-value.

Research on software failures from NIST (Kuhn, Lei, and Kacker) is the standard reference point here. Their work on combinatorial testing states plainly that pairwise, or 2-way, coverage "is not sufficient for assurance of mission-critical software," and that going beyond pairwise requires significantly more test cases — which is exactly why their tooling, and tools like it, support coverage up to 6-way combinations when a system genuinely needs that level of assurance. For most everyday features, though, 2-way (pairwise) coverage is the practical sweet spot: it catches the large class of bugs caused by one value interacting badly with another, at a fraction of the cost of full combinatorial coverage.

## A worked example

Take the four-dimension form above: OS (Windows, macOS, Linux), Locale (en-US, de-DE, ja-JP), Browser (Chrome, Firefox, Safari), Payment (Card, PayPal, Apple Pay). Full coverage is 3 × 3 × 3 × 3 = 81 cases. A pairwise-covering set — built so that every possible pair of values from any two parameters appears together at least once — can bring that down to 9 cases:

<!--html-->
<div class="table-wrap"><table>
<thead><tr><th>Run</th><th>OS</th><th>Locale</th><th>Browser</th><th>Payment</th></tr></thead>
<tbody>
<tr><td class="num">1</td><td>Windows</td><td>en-US</td><td>Chrome</td><td>Card</td></tr>
<tr><td class="num">2</td><td>Windows</td><td>de-DE</td><td>Firefox</td><td>PayPal</td></tr>
<tr><td class="num">3</td><td>Windows</td><td>ja-JP</td><td>Safari</td><td>Apple Pay</td></tr>
<tr><td class="num">4</td><td>macOS</td><td>en-US</td><td>Firefox</td><td>Apple Pay</td></tr>
<tr><td class="num">5</td><td>macOS</td><td>de-DE</td><td>Safari</td><td>Card</td></tr>
<tr><td class="num">6</td><td>macOS</td><td>ja-JP</td><td>Chrome</td><td>PayPal</td></tr>
<tr><td class="num">7</td><td>Linux</td><td>en-US</td><td>Safari</td><td>PayPal</td></tr>
<tr><td class="num">8</td><td>Linux</td><td>de-DE</td><td>Chrome</td><td>Apple Pay</td></tr>
<tr><td class="num">9</td><td>Linux</td><td>ja-JP</td><td>Firefox</td><td>Card</td></tr>
</tbody>
</table></div>
<!--/html-->

Check any two columns against each other and every pair of values shows up at least once — Windows paired with every locale, every browser, and every payment method; `de-DE` paired with every browser; and so on. That is a roughly 9x reduction in run count while still exercising every two-way interaction, which is where most interaction bugs actually live.

You rarely need to build a table like this by hand. The construction above is a standard orthogonal array, and free tools generate it automatically from a plain-text model of your parameters: Microsoft's open-source [PICT](https://github.com/microsoft/pict) takes a short parameter file and outputs a tab-separated pairwise suite in seconds; NIST's own [ACTS](https://www.nist.gov/node/565361) tool goes further, generating 1-way up to 6-way covering arrays through a GUI, CLI, or API when pairwise coverage genuinely isn't enough; and commercial platforms like Hexawise add a web UI and reporting on top of the same idea. For most teams, feeding the parameter list into PICT once and checking the output into the repo next to the test suite is the whole setup cost.

## Pitfalls and limits

Pairwise testing trades completeness for efficiency, and that trade has real edges.

- **It only guarantees 2-way coverage.** Bugs that only appear with a specific three- or four-way combination (a particular OS, on a particular browser, with a particular locale **and** payment method all at once) can slip through a pairwise suite entirely. These are rarer than 2-way interaction bugs, but they exist, especially in tightly coupled subsystems like payment processing or device permissions.
- **It assumes the parameters are genuinely independent inputs.** If two "parameters" are actually linked (certain payment methods aren't offered in certain locales), feeding them into a generic pairwise tool without encoding that constraint produces invalid or wasted test cases. Most tools support constraints, but someone has to specify them, and that step is easy to skip under deadline pressure.
- **It tells you nothing about priority.** A pairwise algorithm treats every parameter and value as equally important. If one payment method handles 90% of real traffic and another is used by a handful of customers, a pairwise suite still gives them equal weight — you may need to layer risk-based judgment on top rather than trusting the algorithm's output as-is.
- **It's a generation technique, not a test oracle.** The tool produces input combinations, not expected outputs. You still have to write the assertions, and a badly chosen set of assertions undermines a perfectly good pairwise suite just as it would any other.
- **It's a different tool than property-based testing.** Property-based testing generates large numbers of semi-random inputs to check that an invariant holds; pairwise testing systematically covers interactions between a fixed set of discrete parameters. They solve different problems and are worth combining, not substituting one for the other.

## What to do next

1. Pick one feature with more than three independent configuration dimensions — locale, device, plan tier, feature flag state, payment provider — and list out every parameter and its possible values.
2. Run that list through PICT or ACTS (both are free) and compare the generated suite size against the full combinatorial count. The gap is usually the clearest argument you can make to a skeptical teammate or manager.
3. Before you commit to the generated suite, check it against known dependencies between parameters (unsupported combinations, region-locked options) and encode those as constraints rather than filtering results by hand afterward.
4. If the feature is high-risk (payments, auth, data migration), consider generating a 3-way covering array instead of 2-way for that feature specifically, and compare the case count increase before deciding it's worth the extra run time.

## Sources

- [NIST — Practical Combinatorial Testing: Beyond Pairwise](https://www.nist.gov/node/565361)
- [NIST — Automated Combinatorial Test Methods: Beyond Pairwise Testing](https://www.nist.gov/node/565371)
- [Microsoft PICT (GitHub)](https://github.com/microsoft/pict)
- [TestRail — Pairwise Testing Explained with Tools & Examples](https://www.testrail.com/blog/pairwise-testing/)
- [BrowserStack — What is Combinatorial Testing?](https://www.browserstack.com/guide/combinatorial-testing)

<!--sr-->

Uzmite formu sa četiri dimenzije konfiguracije — recimo operativni sistem, browser, lokalizaciju i način plaćanja, svaka sa po tri opcije — i potpun kombinatorni prostor već iznosi 81 test slučaj. Dodajte petu dimenziju i broj skače preko 200. Nijedan tim ne pokreće 81 end-to-end slučaj za jednu checkout formu, pa većina timova tiho izabere šačicu kombinacija po osjećaju i nazove to „dovoljno dobrom pokrivenošću". Pairwise testiranje je način da se to nagađanje zamijeni test suiteom koji je istovremeno manji i sistematičniji.

![Gusta, haotična mreža povezanih čvorova sa lijeve strane koja se kroz strelice koje se spajaju sliva u malu, urednu heksagonalnu mrežu čvorova sa desne strane](assets/blog/pairwise-combinatorial-testing.jpg)

## Problem sa ručnim biranjem kombinacija

Ručno izabrane kombinacije obično testiraju svaku vrijednost zasebno, jednu po jednu: Windows sa Chromeom, pa macOS sa Firefoxom, pa Linux sa Safarijem. Tako se svaka vrijednost provjeri izolovano, ali se rijetko provjeri kako vrijednosti međusobno djeluju — a upravo bagovi u interakciji su oni koji promaknu ručnom pregledu. Date picker koji puca samo kad je lokalizacija `de-DE` **i** browser Safari nevidljiv je za test plan sastavljen vrijednost po vrijednost.

Istraživanje grešaka u softveru iz NIST-a (Kuhn, Lei i Kacker) standardna je referentna tačka za ovu temu. Njihov rad o kombinatornom testiranju jasno kaže da pairwise, odnosno 2-way pokrivenost „nije dovoljna za garanciju kvaliteta softvera od kritične važnosti" i da izlazak van pairwise nivoa zahtijeva znatno više test slučajeva — i upravo zato njihovi alati, kao i slični alati, podržavaju pokrivenost sve do 6-way kombinacija kada sistemu zaista treba toliki nivo sigurnosti. Ipak, za većinu svakodnevnih funkcionalnosti, 2-way (pairwise) pokrivenost je praktična optimalna tačka: hvata veliku klasu bagova nastalih kada jedna vrijednost loše djeluje sa drugom, uz djelić cijene potpune kombinatorne pokrivenosti.

## Razrađen primjer

Uzmimo formu sa četiri dimenzije od gore: OS (Windows, macOS, Linux), lokalizacija (en-US, de-DE, ja-JP), browser (Chrome, Firefox, Safari), plaćanje (kartica, PayPal, Apple Pay). Potpuna pokrivenost je 3 × 3 × 3 × 3 = 81 slučaj. Pairwise skup — napravljen tako da se svaki mogući par vrijednosti iz bilo koja dva parametra pojavi zajedno bar jednom — može to da svede na 9 slučajeva:

<!--html-->
<div class="table-wrap"><table>
<thead><tr><th>Pokretanje</th><th>OS</th><th>Lokalizacija</th><th>Browser</th><th>Plaćanje</th></tr></thead>
<tbody>
<tr><td class="num">1</td><td>Windows</td><td>en-US</td><td>Chrome</td><td>Kartica</td></tr>
<tr><td class="num">2</td><td>Windows</td><td>de-DE</td><td>Firefox</td><td>PayPal</td></tr>
<tr><td class="num">3</td><td>Windows</td><td>ja-JP</td><td>Safari</td><td>Apple Pay</td></tr>
<tr><td class="num">4</td><td>macOS</td><td>en-US</td><td>Firefox</td><td>Apple Pay</td></tr>
<tr><td class="num">5</td><td>macOS</td><td>de-DE</td><td>Safari</td><td>Kartica</td></tr>
<tr><td class="num">6</td><td>macOS</td><td>ja-JP</td><td>Chrome</td><td>PayPal</td></tr>
<tr><td class="num">7</td><td>Linux</td><td>en-US</td><td>Safari</td><td>PayPal</td></tr>
<tr><td class="num">8</td><td>Linux</td><td>de-DE</td><td>Chrome</td><td>Apple Pay</td></tr>
<tr><td class="num">9</td><td>Linux</td><td>ja-JP</td><td>Firefox</td><td>Kartica</td></tr>
</tbody>
</table></div>
<!--/html-->

Uporedite bilo koje dvije kolone i svaki par vrijednosti pojavljuje se bar jednom — Windows u paru sa svakom lokalizacijom, svakim browserom i svakim načinom plaćanja; `de-DE` u paru sa svakim browserom; i tako dalje. To je otprilike 9 puta manje pokretanja, a i dalje se provjerava svaka dvosmjerna interakcija, a upravo tu živi većina bagova u interakciji.

Ovakvu tabelu rijetko treba praviti ručno. Gornja konstrukcija je standardan ortogonalni niz, a besplatni alati je automatski generišu iz tekstualnog modela vaših parametara: Microsoftov open-source [PICT](https://github.com/microsoft/pict) uzima kratak fajl sa parametrima i za nekoliko sekundi izbacuje pairwise suite razdvojen tabovima; NIST-ov alat [ACTS](https://www.nist.gov/node/565361) ide korak dalje i generiše covering nizove od 1-way do 6-way kroz GUI, CLI ili API, kada pairwise pokrivenost zaista nije dovoljna; a komercijalne platforme poput Hexawise-a dodaju web interfejs i izvještaje na istu ideju. Za većinu timova, jednom propustiti listu parametara kroz PICT i commitovati izlaz u repo pored test suitea je cijeli trošak postavke.

## Zamke i ograničenja

Pairwise testiranje mijenja potpunost za efikasnost, a ta razmjena ima stvarne granice.

- **Garantuje samo 2-way pokrivenost.** Bagovi koji se javljaju samo uz određenu kombinaciju tri ili četiri vrijednosti (određeni OS, na određenom browseru, sa određenom lokalizacijom **i** načinom plaćanja istovremeno) mogu potpuno da promaknu pairwise suiteu. Rjeđi su od 2-way bagova u interakciji, ali postoje, naročito u čvrsto povezanim podsistemima kao što su obrada plaćanja ili dozvole uređaja.
- **Pretpostavlja da su parametri zaista nezavisni ulazi.** Ako su dva „parametra" zapravo povezana (određeni načini plaćanja nisu dostupni u određenim lokalizacijama), ubacivanje u generički pairwise alat bez zadavanja tog ograničenja daje nevalidne ili protraćene test slučajeve. Većina alata podržava ograničenja (constraints), ali neko mora da ih zada, a taj korak se lako preskoči pod pritiskom roka.
- **Ne govori ništa o prioritetu.** Pairwise algoritam tretira svaki parametar i vrijednost kao jednako važne. Ako jedan način plaćanja obrađuje 90% stvarnog saobraćaja, a drugi koristi šačica korisnika, pairwise suite im i dalje daje istu težinu — možda ćete morati da dodate procjenu zasnovanu na riziku umjesto da izlazu algoritma vjerujete onakvom kakav jeste.
- **To je tehnika generisanja, ne test oracle.** Alat proizvodi kombinacije ulaza, ne očekivane izlaze. Asercije i dalje morate sami da napišete, a loše izabran skup asercija potkopava savršeno dobar pairwise suite isto kao i bilo koji drugi.
- **To nije isto što i property-based testiranje.** Property-based testiranje generiše veliki broj polunasumičnih ulaza da bi provjerilo da li neka invarijanta važi; pairwise testiranje sistematski pokriva interakcije između fiksnog skupa diskretnih parametara. Rješavaju različite probleme i vrijedi ih kombinovati, a ne zamijeniti jedno drugim.

## Šta dalje

1. Izaberite jednu funkcionalnost sa više od tri nezavisne dimenzije konfiguracije — lokalizacija, uređaj, nivo pretplate, stanje feature flaga, provajder plaćanja — i izlistajte svaki parametar i njegove moguće vrijednosti.
2. Propustite tu listu kroz PICT ili ACTS (oba su besplatna) i uporedite veličinu generisanog suitea sa punim kombinatornim brojem. Ta razlika je obično najjasniji argument koji možete da iznesete skeptičnom kolegi ili menadžeru.
3. Prije nego što se obavežete na generisani suite, provjerite ga u odnosu na poznate zavisnosti između parametara (nepodržane kombinacije, opcije ograničene na region) i zadajte ih kao ograničenja umjesto da naknadno ručno filtrirate rezultate.
4. Ako je funkcionalnost visokog rizika (plaćanja, autentifikacija, migracija podataka), razmislite o generisanju 3-way covering niza umjesto 2-way baš za tu funkcionalnost, i uporedite povećanje broja slučajeva prije nego što odlučite da li je vrijedno dodatnog vremena izvršavanja.

## Izvori

- [NIST — Practical Combinatorial Testing: Beyond Pairwise](https://www.nist.gov/node/565361)
- [NIST — Automated Combinatorial Test Methods: Beyond Pairwise Testing](https://www.nist.gov/node/565371)
- [Microsoft PICT (GitHub)](https://github.com/microsoft/pict)
- [TestRail — Pairwise Testing Explained with Tools & Examples](https://www.testrail.com/blog/pairwise-testing/)
- [BrowserStack — What is Combinatorial Testing?](https://www.browserstack.com/guide/combinatorial-testing)
