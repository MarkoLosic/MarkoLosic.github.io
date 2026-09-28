---
title: "Risk-Based Testing: How to Decide What Not to Test Before a Deadline"
title_sr: "Testiranje zasnovano na riziku: kako odlučiti šta nećete testirati pred rok"
date: 2026-09-28
tags: [qa, test-automation, methodology, risk-based-testing]
excerpt: A practical guide to prioritizing QA coverage by risk when there isn't time to test everything before a release.
excerpt_sr: Praktičan vodič za određivanje prioriteta QA pokrivenosti prema riziku kada nema vremena da se prije objave testira sve.
image: assets/blog/risk-based-testing-what-not-to-test.jpg
---
Every QA team eventually hits the same wall: the release is scoped, the deadline is fixed, and there is more surface area to test than there is time to test it in. The instinctive response is to test faster — cut corners evenly across the board. The better response is to test unevenly on purpose. Risk-based testing is the discipline of deciding, deliberately and in advance, which parts of the system deserve deep scrutiny and which can get a lighter pass, so that when time runs out, it's the low-consequence areas that go untested rather than the ones that would hurt the most.

![Illustration of a deadline clock at 11:59 next to code windows, a magnifying glass, and a 3×3 risk heatmap scoring likelihood against impact, with high-priority cells in red and orange and low-risk or skipped cells in blue and yellow](assets/blog/risk-based-testing-what-not-to-test.jpg)

## What risk-based testing actually means

The ISTQB defines risk-based testing as an approach that uses identified risks to guide the test process — selecting techniques, prioritizing tests, and determining the extent of testing based on the likelihood and impact of things going wrong. Ministry of Testing's glossary puts it more plainly: it's a methodology that prioritizes test cases based on the potential impact and likelihood of failure, so that finite testing resources get allocated to the areas that matter most rather than spread evenly across everything.

That splits into two dimensions worth scoring separately:

- **Likelihood** — how probable is a defect here? New or recently changed code, complex logic, third-party integrations, and areas with a history of bugs all push likelihood up.
- **Impact** — how bad is it if this breaks? Revenue-critical paths, data integrity, security, and compliance-relevant features carry the highest impact, regardless of how "likely" a bug there feels.

Multiply (or combine) the two, and you get a risk score you can rank features by. The value isn't the precision of the number — it's that the ranking forces an honest conversation about where your limited hours should go.

## A worked example

Imagine a team migrating to a new payment processor two weeks before a release, alongside a handful of smaller changes: a redesigned profile page, an updated email footer, and a new sort option on a search results page. There is not enough time to fully regression-test all of it, so the team runs a short risk-scoring exercise with QA, engineering, and product together, scoring likelihood and impact from 1 (low) to 3 (high):

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Area</th><th>Likelihood</th><th>Impact</th><th>Risk score</th><th>Test depth</th></tr></thead>
<tbody>
<tr><td>Checkout / payment processor</td><td class="num">3</td><td class="num">3</td><td class="num"><span class="score hi">9</span></td><td>Full functional + edge cases + automated regression</td></tr>
<tr><td>Order confirmation emails</td><td class="num">2</td><td class="num">3</td><td class="num"><span class="score hi">6</span></td><td>Functional pass, key templates only</td></tr>
<tr><td>Search sort option</td><td class="num">2</td><td class="num">2</td><td class="num"><span class="score mid">4</span></td><td>Smoke test + one exploratory session</td></tr>
<tr><td>Profile page redesign</td><td class="num">1</td><td class="num">1</td><td class="num"><span class="score lo">1</span></td><td>Visual check only</td></tr>
</tbody>
</table>
</div>
<!--/html-->

The payment migration gets the team's best testers, a battery of edge cases (declined cards, expired sessions, currency rounding, webhook retries), and automation that will run on every future deploy. The profile redesign — cosmetic, easily reversible, and not on a critical path — gets a quick look and ships. That's the entire point: not "test everything a little," but "test the checkout flow like the business depends on it, because it does, and accept lighter coverage where a miss is cheap to fix after the fact."

## Where this goes wrong

Risk-based testing is not a way to avoid hard conversations about coverage — it just makes the trade-offs visible instead of accidental. A few ways teams misuse it:

**Scoring becomes political, not analytical.** If risk scores are assigned by whoever's loudest in the room rather than by data (bug history, code churn, past incidents), the matrix just launders existing biases with a number.

**Risk isn't reassessed as the release evolves.** A module scored "low risk" on day one can become high risk after a last-minute refactor. Risk-based testing needs to be a living exercise revisited when scope changes, not a one-time ritual at kickoff.

**It gets used to justify skipping compliance-required coverage.** In regulated domains — healthcare, finance, aviation — certain areas require full traceability and testing regardless of how "low risk" they score. Risk-based prioritization tunes where you go deep; it doesn't override a regulatory testing obligation.

**It can create false confidence.** A high risk score doesn't guarantee your tests actually cover the failure modes that matter — it's still possible to write thorough-looking tests for the wrong scenarios. Risk-based testing tells you where to look harder, not what you'll find when you do.

**It doesn't replace exploratory testing.** A risk matrix is built from what the team already knows to worry about. The defects that hurt most are often the ones nobody thought to score, which is why even "low risk" areas benefit from someone poking around rather than being skipped entirely.

## What to do next

- **Run a short risk-scoring session before your next release**, not a lengthy process — 30 minutes with QA, engineering, and product, scoring each major change area on a simple likelihood-and-impact scale, is enough to reshape how the remaining test time gets spent.
- **Write the scores down alongside the test plan.** A risk register that lists what got deep coverage and what got a light pass, and why, turns "we didn't have time to test that" from an excuse into a documented, defensible decision.
- **Automate regression for your highest-risk areas first.** They're the ones you'll retest on every future release, so that's where automation pays back fastest.
- **Revisit the scores when scope changes mid-cycle.** If a "low risk" area gets touched by a late refactor, re-score it before assuming the original test plan still holds.

## Sources

- [ISTQB Glossary: risk-based testing](https://glossary.istqb.org/en_US/term/risk-based-testing)
- [Ministry of Testing: Risk-based testing](https://www.ministryoftesting.com/software-testing-glossary/risk-based-testing)
- [Wikipedia: Risk-based testing](https://en.wikipedia.org/wiki/Risk-based_testing)
<!--sr-->
Svaki QA tim prije ili kasnije udari u isti zid: obim objave je definisan, rok je fiksan, a za testiranje ima više površine nego vremena. Instinktivna reakcija je da se testira brže — da se ravnomjerno skrati na svemu. Bolja reakcija je da se namjerno testira neravnomjerno. Testiranje zasnovano na riziku je disciplina svjesnog i unaprijed donesenog odlučivanja o tome koji dijelovi sistema zaslužuju detaljnu provjeru, a koji mogu proći sa lakšim pregledom — tako da, kada vrijeme istekne, netestirani ostanu dijelovi sa malim posljedicama, a ne oni koji bi najviše zaboljeli.

![Ilustracija sata koji pokazuje 11:59 pored prozora sa kodom, lupe i 3×3 toplotne mape rizika koja upoređuje vjerovatnoću i uticaj, sa poljima visokog prioriteta u crvenoj i narandžastoj boji i poljima niskog rizika ili preskočenim poljima u plavoj i žutoj](assets/blog/risk-based-testing-what-not-to-test.jpg)

## Šta testiranje zasnovano na riziku zaista znači

ISTQB definiše testiranje zasnovano na riziku kao pristup koji koristi identifikovane rizike da usmjeri proces testiranja — izbor tehnika, određivanje prioriteta testova i obima testiranja na osnovu vjerovatnoće i uticaja da nešto pođe po zlu. Rječnik Ministry of Testing-a to kaže jednostavnije: to je metodologija koja određuje prioritete test slučajeva prema potencijalnom uticaju i vjerovatnoći greške, kako bi se ograničeni resursi za testiranje usmjerili na oblasti koje su najvažnije, umjesto da se ravnomjerno rasporede na sve.

To se dijeli na dvije dimenzije koje vrijedi ocjenjivati odvojeno:

- **Vjerovatnoća** — koliko je vjerovatno da ovdje postoji greška? Nov ili nedavno mijenjan kod, složena logika, integracije sa trećim stranama i oblasti sa istorijom grešaka povećavaju vjerovatnoću.
- **Uticaj** — koliko je loše ako se ovo pokvari? Tokovi ključni za prihod, integritet podataka, bezbjednost i funkcije vezane za regulatornu usklađenost imaju najveći uticaj, bez obzira na to koliko greška tu djeluje „vjerovatno".

Pomnožite (ili kombinujte) ove dvije vrijednosti i dobićete ocjenu rizika po kojoj možete rangirati funkcionalnosti. Vrijednost nije u preciznosti broja — već u tome što rangiranje tjera na iskren razgovor o tome gdje treba da odu vaši ograničeni sati.

## Primjer iz prakse

Zamislite tim koji dvije sedmice prije objave prelazi na novog procesora plaćanja, uz nekoliko manjih izmjena: redizajniranu stranicu profila, ažurirano podnožje emaila i novu opciju sortiranja na stranici rezultata pretrage. Nema dovoljno vremena za kompletno regresiono testiranje svega, pa tim — QA, inženjeri i product zajedno — sprovede kratku vježbu ocjenjivanja rizika, dajući vjerovatnoći i uticaju ocjene od 1 (nisko) do 3 (visoko):

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Oblast</th><th>Vjerovatnoća</th><th>Uticaj</th><th>Ocjena rizika</th><th>Dubina testiranja</th></tr></thead>
<tbody>
<tr><td>Checkout / procesor plaćanja</td><td class="num">3</td><td class="num">3</td><td class="num"><span class="score hi">9</span></td><td>Kompletno funkcionalno + granični slučajevi + automatizovana regresija</td></tr>
<tr><td>Emailovi sa potvrdom narudžbe</td><td class="num">2</td><td class="num">3</td><td class="num"><span class="score hi">6</span></td><td>Funkcionalni prolaz, samo ključni šabloni</td></tr>
<tr><td>Opcija sortiranja u pretrazi</td><td class="num">2</td><td class="num">2</td><td class="num"><span class="score mid">4</span></td><td>Smoke test + jedna istraživačka sesija</td></tr>
<tr><td>Redizajn stranice profila</td><td class="num">1</td><td class="num">1</td><td class="num"><span class="score lo">1</span></td><td>Samo vizuelna provjera</td></tr>
</tbody>
</table>
</div>
<!--/html-->

Migracija plaćanja dobija najbolje testere u timu, niz graničnih slučajeva (odbijene kartice, istekle sesije, zaokruživanje valuta, ponovni pokušaji webhook-ova) i automatizaciju koja će se pokretati na svakom budućem deploy-u. Redizajn profila — kozmetički, lako povratan i van kritične putanje — dobija brz pregled i ide u produkciju. U tome je cijela poenta: ne „testiraj sve pomalo", već „testiraj checkout kao da posao zavisi od njega, jer zavisi, i prihvati lakšu pokrivenost tamo gdje je propust jeftino ispraviti naknadno".

## Gdje ovo pođe po zlu

Testiranje zasnovano na riziku nije način da se izbjegnu teški razgovori o pokrivenosti — ono samo čini kompromise vidljivim umjesto slučajnim. Nekoliko načina na koje ga timovi pogrešno koriste:

**Ocjenjivanje postaje političko, a ne analitičko.** Ako ocjene rizika dodjeljuje onaj ko je najglasniji u prostoriji, a ne podaci (istorija grešaka, učestalost izmjena koda, ranji incidenti), matrica samo pretvara postojeće predrasude u broj.

**Rizik se ne preispituje kako objava napreduje.** Modul ocijenjen kao „nizak rizik" prvog dana može postati visokorizičan nakon refaktorisanja u posljednjem trenutku. Testiranje zasnovano na riziku mora biti živa vježba kojoj se vraćate kada se obim promijeni, a ne jednokratni ritual na početku.

**Koristi se kao opravdanje za preskakanje pokrivenosti koju zahtijevaju propisi.** U regulisanim oblastima — zdravstvu, finansijama, avijaciji — određeni dijelovi zahtijevaju punu sljedivost i testiranje bez obzira na to koliko „nizak rizik" imaju. Određivanje prioriteta prema riziku podešava gdje idete u dubinu; ne poništava regulatornu obavezu testiranja.

**Može da stvori lažan osjećaj sigurnosti.** Visoka ocjena rizika ne garantuje da vaši testovi zaista pokrivaju načine otkaza koji su bitni — i dalje je moguće napisati testove koji izgledaju temeljno, ali za pogrešne scenarije. Testiranje zasnovano na riziku vam kaže gdje da gledate pažljivije, a ne šta ćete tamo pronaći.

**Ne zamjenjuje istraživačko testiranje.** Matrica rizika se gradi od onoga za šta tim već zna da treba da brine. Greške koje najviše bole često su upravo one koje niko nije ni pomislio da ocijeni, zbog čega i oblasti „niskog rizika" imaju koristi od toga da neko malo pročačka po njima, umjesto da budu potpuno preskočene.

## Šta dalje

- **Prije sljedeće objave održite kratku sesiju ocjenjivanja rizika**, a ne dugačak proces — 30 minuta sa QA-om, inženjerima i product-om, uz ocjenjivanje svake veće izmjene na jednostavnoj skali vjerovatnoće i uticaja, dovoljno je da promijeni kako se troši preostalo vrijeme za testiranje.
- **Zapišite ocjene uz test plan.** Registar rizika koji navodi šta je dobilo detaljnu pokrivenost, a šta lakši prolaz, i zašto, pretvara „nismo imali vremena da to testiramo" iz izgovora u dokumentovanu odluku koju možete odbraniti.
- **Prvo automatizujte regresiju za oblasti najvećeg rizika.** Njih ćete ponovo testirati na svakoj budućoj objavi, pa se tu automatizacija najbrže isplati.
- **Vratite se ocjenama kada se obim promijeni usred ciklusa.** Ako kasno refaktorisanje dotakne oblast „niskog rizika", ponovo je ocijenite prije nego što pretpostavite da originalni test plan i dalje važi.

## Izvori

- [ISTQB Glossary: risk-based testing](https://glossary.istqb.org/en_US/term/risk-based-testing)
- [Ministry of Testing: Risk-based testing](https://www.ministryoftesting.com/software-testing-glossary/risk-based-testing)
- [Wikipedia: Risk-based testing](https://en.wikipedia.org/wiki/Risk-based_testing)
