---
title: "The QA Metrics That Actually Predict Quality (and the Ones That Don't)"
title_sr: "QA metrike koje zaista predviđaju kvalitet (i one koje ne predviđaju)"
date: 2026-10-12
tags: [qa, methodology, metrics]
excerpt: Pass rate and test count feel reassuring but say little about quality. Here's what to track instead, and how to read it.
excerpt_sr: Procenat prolaznosti i broj testova djeluju umirujuće, ali malo govore o kvalitetu. Evo šta pratiti umjesto toga i kako to čitati.
image: assets/blog/qa-metrics-that-matter.jpg
---
A dashboard showing "1,842 tests, 98% passing" looks like proof that a product is healthy. It usually isn't. Teams can hit numbers like that while shipping a broken checkout flow, because the metric describes the test suite, not the product. The gap between "our tests look good" and "our product is good" is where a lot of avoidable incidents live, and it's worth being specific about which numbers close that gap and which ones just feel reassuring.

![Illustration of a QA dashboard where a large green "misleading pass rate: 98%" sits next to a red chart labelled "actual escaped bug rate: 15% increasing", while a team points at a "bug reported by user" panel](assets/blog/qa-metrics-that-matter.jpg)

## Why pass rate is the wrong north star

Pass rate is popular because it's a single number that moves toward a clean 100%. The problem is what it hides. A suite of 100 tests where one test covering core functionality fails has a 99% pass rate, but the product may not be shippable. A suite of 1,000 tests where 200 of them hit that same one bug has an 80% pass rate for the exact same underlying problem. Steve Rowe, a former Microsoft test lead, made this point plainly in a widely cited post on his Microsoft blog: pass rate conflates the number of tests with the severity of what they found, and below 100% it stops distinguishing between "fine" and "not fine" at all.

It also responds to the wrong pressure. If the goal is "95% passing by Friday," a team can get there by deleting flaky tests, splitting one strict test into several lenient ones, or skipping hard-to-pass cases instead of fixing the product. None of that makes the software better, but the chart goes up and to the right.

The same problem shows up with test count and automation percentage. A growing test count can mean better coverage, or years of duplicated, obsolete tests nobody deleted. "Percentage of flows automated" can mean the automation does real work, or it can mean brittle scripts that get skipped whenever they're inconvenient. Neither number tells you which, so neither belongs as the headline on a quality dashboard.

## What to track instead: escaped defects

The metric that actually answers "is testing working" is the escaped defect rate: the share of bugs that reached users instead of being caught before release.

```
escape rate = escaped bugs / (escaped bugs + bugs caught pre-release)
```

If a team caught 100 bugs in QA and users reported 10 more after release, the escape rate is 10 / 110, about 9%. That number is comparable release over release in a way pass rate never is, because it's measured against the thing you actually care about, defects a customer experienced, not against the size or shape of the test suite.

A concrete version of this: imagine a team ships a pricing update every two weeks. For three releases in a row, pass rate sits at a steady 97%, and nobody raises a flag. But the escape rate creeps from 4% to 9% to 15% over the same period, because an edge case in currency rounding keeps slipping through and support tickets confirm it each time. Pass rate said "nothing changed." Escape rate said "testing is losing ground," and it said it early enough to act on, by adding a rounding-specific regression suite instead of waiting for a fourth complaint spike.

Escape rate isn't free of problems. It depends on how reliably post-release bugs get reported and linked back to a release, so it needs some support or incident-tracking discipline behind it, and it lags by definition, since you only learn about an escape after release. Pair it with a forward-looking signal too: time to detect a regression once it's introduced, which shows how fast the pipeline would catch the next one, not just the last one.

## Other numbers worth watching, and how to read them

A few other metrics earn their place, but only with the right caveat attached:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Metric</th><th>What it's good for</th><th>What it misses</th></tr></thead>
<tbody>
<tr><td>Escaped defect rate</td><td>Whether testing is catching what matters, trending over time</td><td>Lags release by days or weeks; needs clean bug-to-release tracking</td></tr>
<tr><td>Flaky test rate</td><td>Whether the suite's signal can be trusted at all</td><td>Doesn't say anything about product quality directly</td></tr>
<tr><td>Mean time to detect a regression</td><td>How fast the pipeline would catch the next real bug</td><td>Requires a seeded or historical regression to measure against</td></tr>
<tr><td>Defect severity mix</td><td>Whether effort is going toward the bugs that matter</td><td>Severity labels are subjective and easy to game</td></tr>
</tbody>
</table>
</div>
<!--/html-->

Notice none of these are "number of tests" or "percent passing." Those two keep showing up on dashboards because they're easy to compute and always trending somewhere, not because they predict anything about the product.

## Pitfalls and limits

Metrics-driven QA has its own failure modes. Any metric a team is measured on will eventually be optimized directly rather than the thing it's meant to represent: chase escape rate hard enough and testers will start reclassifying post-release bugs as "pre-existing" or "edge case" to keep the number down. Metrics also don't replace judgment about what's actually risky in a given release; a quiet refactor of the payment path deserves more scrutiny than the raw numbers would suggest, no matter how good last quarter's escape rate looked. And none of this works without decent bug tracking discipline. If defects aren't consistently logged, tagged with where they were found, and linked to a release, escape rate is just a guess dressed up as a number. Finally, metrics are a lagging view of a team's testing effectiveness, not a substitute for exploratory testing or reviewing what the suite doesn't cover at all.

## What to do next

1. Pull the last three to six releases and calculate escaped defect rate, even roughly, from existing bug tracker data. If no one can produce this without a manual pass through tickets, that's the first gap to fix.
2. Stop reporting raw test count or percentage automated as a quality signal in standups or dashboards; if they stay useful at all, keep them as capacity metrics, not quality ones.
3. Add flaky test rate next to pass rate on any dashboard. A suite can't tell you anything trustworthy about the product if its own stability is unknown.
4. Pick one severity category, such as defects in the payment or auth path, and track escape rate for that category specifically. A single aggregate number across all severities will always average away the part that actually matters.

## Sources

- [Pass rates don't matter](https://learn.microsoft.com/ja-jp/archive/blogs/steverowe/pass-rates-dont-matter), Steve Rowe
- [Bug escape rate](https://www.ministryoftesting.com/software-testing-glossary/bug-escape-rate), Ministry of Testing glossary
- [7 Useless Test Metrics](https://dzone.com/articles/7-useless-test-metrics), DZone
- [Metrics for functional testing](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/metrics-for-functional-testing.html), AWS Well-Architected DevOps Guidance
<!--sr-->
Dashboard koji pokazuje "1.842 testa, 98% prolazi" izgleda kao dokaz da je proizvod zdrav. Obično nije. Timovi mogu da dostignu takve brojke dok isporučuju pokvaren checkout flow, jer metrika opisuje test skup, a ne proizvod. Razlika između "naši testovi izgledaju dobro" i "naš proizvod je dobar" je mjesto gdje živi mnogo incidenata koji su se mogli izbjeći, i vrijedi biti konkretan oko toga koje brojke tu razliku zatvaraju, a koje samo djeluju umirujuće.

![Ilustracija QA dashboard-a na kojem veliki zeleni "misleading pass rate: 98%" stoji pored crvenog grafikona sa natpisom "actual escaped bug rate: 15% increasing", dok tim pokazuje na panel "bug reported by user"](assets/blog/qa-metrics-that-matter.jpg)

## Zašto pass rate nije dobar glavni pokazatelj

Pass rate (procenat testova koji prolaze) je popularan jer je to jedan broj koji se kreće ka čistih 100%. Problem je u onome što skriva. Skup od 100 testova u kojem padne jedan test koji pokriva ključnu funkcionalnost ima pass rate od 99%, a proizvod možda nije spreman za isporuku. Skup od 1.000 testova u kojem 200 njih udari u isti taj bug ima pass rate od 80% za potpuno isti problem u pozadini. Steve Rowe, bivši test lead u Microsoftu, to je jasno rekao u često citiranom postu na svom Microsoft blogu: pass rate miješa broj testova sa ozbiljnošću onoga što su pronašli, a ispod 100% uopšte prestaje da razlikuje "u redu" od "nije u redu".

Pored toga, reaguje na pogrešan pritisak. Ako je cilj "95% prolazi do petka", tim može da stigne do toga brisanjem flaky testova, razbijanjem jednog strogog testa na nekoliko blažih ili preskakanjem teških slučajeva umjesto popravljanja proizvoda. Ništa od toga ne čini softver boljim, ali grafikon ide gore i desno.

Isti problem se javlja i sa brojem testova i procentom automatizacije. Rastući broj testova može da znači bolju pokrivenost, ili godine dupliranih, zastarjelih testova koje niko nije obrisao. "Procenat automatizovanih flow-ova" može da znači da automatizacija radi pravi posao, ili krhke skripte koje se preskaču kad god smetaju. Nijedan od ta dva broja ne kaže koje je od toga, pa nijedan ne pripada na vrh dashboard-a o kvalitetu.

## Šta pratiti umjesto toga: escaped defects

Metrika koja zaista odgovara na pitanje "da li testiranje radi" je escaped defect rate: udio bugova koji su stigli do korisnika umjesto da budu uhvaćeni prije izdanja.

```
escape rate = escaped bugs / (escaped bugs + bugs caught pre-release)
```

Ako je tim u QA-u uhvatio 100 bugova, a korisnici su nakon izdanja prijavili još 10, escape rate je 10 / 110, otprilike 9%. Taj broj je uporediv od izdanja do izdanja na način na koji pass rate nikad nije, jer se mjeri u odnosu na ono do čega vam je zaista stalo, defekte koje je doživio korisnik, a ne u odnosu na veličinu ili oblik test skupa.

Konkretan primjer: zamislite tim koji svake dvije sedmice isporučuje izmjenu cijena. Tri izdanja zaredom pass rate stoji na stabilnih 97% i niko ne diže uzbunu. Ali escape rate u istom periodu puže sa 4% na 9% pa na 15%, jer granični slučaj u zaokruživanju valuta stalno promakne, a tiketi podrške to svaki put potvrde. Pass rate je rekao "ništa se nije promijenilo". Escape rate je rekao "testiranje gubi teren", i rekao je to dovoljno rano da se reaguje, dodavanjem regresionog skupa posvećenog zaokruživanju, umjesto čekanja na četvrti talas žalbi.

Ni escape rate nije bez problema. Zavisi od toga koliko se pouzdano bugovi nakon izdanja prijavljuju i povezuju sa izdanjem, pa iza njega mora da stoji određena disciplina u podršci ili praćenju incidenata, a po definiciji kasni, jer za bug koji je pobjegao saznate tek nakon izdanja. Uparite ga i sa signalom koji gleda unaprijed: vremenom potrebnim da se regresija otkrije nakon što je uvedena, što pokazuje koliko brzo bi pipeline uhvatio sljedeću, a ne samo prošlu.

## Ostale brojke koje vrijedi pratiti, i kako ih čitati

Nekoliko drugih metrika zaslužuje svoje mjesto, ali samo uz odgovarajuću napomenu:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Metrika</th><th>Za šta je dobra</th><th>Šta propušta</th></tr></thead>
<tbody>
<tr><td>Escaped defect rate</td><td>Da li testiranje hvata ono što je bitno, kroz vrijeme</td><td>Kasni za izdanjem danima ili sedmicama; traži uredno povezivanje bugova sa izdanjima</td></tr>
<tr><td>Flaky test rate</td><td>Da li se signalu test skupa uopšte može vjerovati</td><td>Ne govori ništa direktno o kvalitetu proizvoda</td></tr>
<tr><td>Prosječno vrijeme do otkrivanja regresije</td><td>Koliko brzo bi pipeline uhvatio sljedeći pravi bug</td><td>Zahtijeva namjerno ubačenu ili istorijsku regresiju za mjerenje</td></tr>
<tr><td>Raspodjela ozbiljnosti defekata</td><td>Da li trud ide ka bugovima koji su bitni</td><td>Oznake ozbiljnosti su subjektivne i lako se izigravaju</td></tr>
</tbody>
</table>
</div>
<!--/html-->

Primijetite da nijedna od ovih nije "broj testova" ili "procenat koji prolazi". Te dvije se stalno pojavljuju na dashboard-ima zato što ih je lako izračunati i uvijek negdje trenduju, a ne zato što išta predviđaju o proizvodu.

## Zamke i ograničenja

QA vođen metrikama ima svoje načine da pođe po zlu. Svaka metrika po kojoj se tim ocjenjuje vremenom će se optimizovati direktno, umjesto onoga što bi trebalo da predstavlja: ako se dovoljno uporno juri escape rate, testeri će početi da reklasifikuju bugove nakon izdanja kao "postojeće od ranije" ili "granični slučaj" da bi broj ostao nizak. Metrike takođe ne zamjenjuju procjenu šta je zaista rizično u datom izdanju; tihi refaktor payment putanje zaslužuje više pažnje nego što bi same brojke sugerisale, bez obzira koliko je dobar bio escape rate prošlog kvartala. I ništa od ovoga ne radi bez pristojne discipline u praćenju bugova. Ako se defekti ne bilježe dosljedno, ne označavaju prema tome gdje su pronađeni i ne povezuju sa izdanjem, escape rate je samo nagađanje obučeno u broj. Na kraju, metrike su zakašnjeli pogled na efikasnost testiranja tima, a ne zamjena za eksplorativno testiranje ili pregled onoga što test skup uopšte ne pokriva.

## Šta dalje

1. Uzmite posljednja tri do šest izdanja i izračunajte escaped defect rate, makar i grubo, iz postojećih podataka u bug trackeru. Ako niko to ne može da uradi bez ručnog prolaska kroz tikete, to je prva rupa koju treba zakrpiti.
2. Prestanite da prijavljujete goli broj testova ili procenat automatizacije kao signal kvaliteta na standupima ili dashboard-ima; ako su uopšte korisni, zadržite ih kao metrike kapaciteta, a ne kvaliteta.
3. Na svaki dashboard dodajte flaky test rate pored pass rate-a. Test skup ne može da vam kaže ništa pouzdano o proizvodu ako se ne zna koliko je sam stabilan.
4. Izaberite jednu kategoriju ozbiljnosti, na primjer defekte u payment ili auth putanji, i pratite escape rate posebno za nju. Jedan zbirni broj preko svih nivoa ozbiljnosti uvijek će uprosječiti baš onaj dio koji je zaista bitan.

## Izvori

- [Pass rates don't matter](https://learn.microsoft.com/ja-jp/archive/blogs/steverowe/pass-rates-dont-matter), Steve Rowe
- [Bug escape rate](https://www.ministryoftesting.com/software-testing-glossary/bug-escape-rate), Ministry of Testing glossary
- [7 Useless Test Metrics](https://dzone.com/articles/7-useless-test-metrics), DZone
- [Metrics for functional testing](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/metrics-for-functional-testing.html), AWS Well-Architected DevOps Guidance
