---
title: "Chaos Engineering for QA Teams: What a Game Day Actually Looks Like"
title_sr: "Chaos engineering za QA timove: kako zapravo izgleda game day"
date: 2026-11-06
time: 08:00
tags: [qa, tools-and-trends, chaos-engineering, resilience-testing]
excerpt: A practical look at chaos engineering tools and how to run a resilience game day without turning it into an outage.
excerpt_sr: Praktičan pogled na chaos engineering alate i kako organizovati game day za testiranje otpornosti, a da se on ne pretvori u ispad sistema.
image: assets/blog/chaos-engineering-game-day-qa-teams.jpg
---
Most test suites check that a system behaves correctly when everything around it works. They rarely check what happens when a dependency times out, a container restarts mid-request, or a database fails over at the worst possible moment. Those are exactly the conditions that show up in real incidents, and chaos engineering — deliberately injecting failure in a controlled way to see how a system actually responds — is the discipline built around testing for them on purpose, instead of finding out in production.

![An isometric operations room where engineers watch telemetry dashboards around a cluster of server racks protected by a transparent dome, with a few racks sparking under injected faults](assets/blog/chaos-engineering-game-day-qa-teams.jpg)

QA teams are often left out of chaos engineering because it gets framed as an SRE or platform concern. That's a mistake. Designing a good failure scenario, defining what "still working" means, and deciding when a result counts as a pass or a fail are testing skills, not infrastructure skills.

## The tool landscape, briefly

There's no need to start by picking a tool. The ecosystem splits roughly into three groups: open-source, Kubernetes-focused frameworks like Chaos Mesh and LitmusChaos, which inject faults such as pod kills, network delay, or I/O stress inside a cluster; commercial platforms like Gremlin and Steadybit, which add guided workflows, access control, and reporting on top of similar fault types; and cloud-native services like AWS Fault Injection Service (FIS), which runs fully managed experiments — stopping an instance, throttling an API call, failing over a database — without installing any agents, and ships a scenario library with pre-built tests for things like an Availability Zone slowdown or a cross-Region connectivity disruption.

The detail worth noting, whichever tool you end up using, is the safety mechanism: FIS lets you scope an experiment by tag (so only resources tagged `environment: staging`, say, are eligible) and set stop conditions tied to CloudWatch alarms, so an experiment halts automatically if, for example, response time climbs past an acceptable threshold. That combination — narrow targeting plus an automatic kill switch — is what separates "controlled experiment" from "self-inflicted outage."

## Running a game day

A "game day" is a scheduled session where a team runs chaos experiments together, live, rather than as an unattended job. The structure that works in practice looks like this:

1. **Pick a scenario with a reason behind it** — reproducing a past incident, stress-testing a feature that just shipped, retesting a fix from a previous game day, or revisiting a post-mortem the team still worries about.
2. **Write a steady state before touching anything.** For example: "5,000 requests per minute to the index page succeed 99% of the time within one second." If you can't state this, you don't yet know what "broken" would look like.
3. **Write a hypothesis**, not just an action. Not "kill a container" but "when a single container is restarted, the steady state still holds." The hypothesis is what gets tested; the failure injection is just the mechanism.
4. **Start with the smallest blast radius that can teach you anything** — one instance, one non-critical service, a short time window, during low-traffic hours — and widen it only after that smaller test succeeds.
5. **Run it, watch it, write it down.** Confirm the steady state holds before you inject anything (an already-unstable system won't give you a useful result), then watch both the target and anything up- or downstream of it for surprises.
6. **Debrief like a controlled post-mortem.** Review every experiment, starting with the ones that didn't go as expected, file bugs for what you found, and decide whether a successful experiment is worth automating so it runs on a recurring basis.

A simple way to write the test case down, before it ever touches a tool, is just:

```
Scenario: Primary database instance fails over
Steady state: 95% of checkout requests complete in < 200ms
Hypothesis: failover completes with no checkout requests lost,
            though latency may briefly exceed the 200ms target
Blast radius: single staging replica, 15-minute window, off-peak
Stop condition: error rate > 5% for 60 seconds -> abort
```

That's a test case a QA engineer can write and review with the same rigor as any other test, before anyone opens a chaos tool at all.

## Pitfalls and limits

Chaos engineering fails most often for reasons that have nothing to do with the tooling. Evaluating tools before running a single manual experiment is a common first mistake — logging into a console and stopping one server by hand teaches you more, faster, than a tool bake-off. Skipping the blast-radius limits is the second: production-wide, unannounced experiments are something mature teams eventually grow into, not a starting point. Running an experiment without a written hypothesis turns it into undirected poking, which makes it hard to know afterward whether anything was actually learned. And running experiments without enough observability to see what happened during the test — not just whether it "passed" — means you can't answer the most useful follow-up question, which is usually "why."

There are harder limits too. A chaos experiment on an already-unstable system mostly tells you the system is unstable, which you probably knew. In regulated or tightly coupled production environments, the cost and risk of experimentation can be real, so some teams never move past staging — and that's a legitimate stopping point, not a failure. And a passing game day result is a snapshot: it says the system handled this failure, on this day, under this load — not that it will handle every failure forever.

## What to do next

- Run one manual experiment this week with no tooling involved: disable a single non-critical instance in a non-production environment and watch what happens.
- For your next planned game day, write the steady state and hypothesis before picking the failure to inject — the format above is enough.
- Start with the smallest blast radius you can learn from, and only widen it once that experiment behaves as expected.
- If your stack is AWS-native, try FIS's scenario library for a first guided experiment with a built-in stop condition, rather than hand-rolling one.

## Sources

- [Four chaos engineering mistakes to avoid — Thoughtworks](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/four-chaos-engineering-mistakes-to-avoid)
- [AWS Fault Injection Service — Features](https://aws.amazon.com/fis/features/)
- [How to run a Chaos Engineering GameDay — Steadybit](https://steadybit.com/blog/how-to-run-chaosengineering-gameday/)

<!--sr-->

Većina test suiteova provjerava da li se sistem ponaša ispravno kada sve oko njega radi. Rijetko provjeravaju šta se dešava kada zavisnost istekne (timeout), kada se kontejner restartuje usred zahtjeva ili kada baza podataka pređe na rezervnu instancu (failover) u najgorem mogućem trenutku. Upravo takvi uslovi se pojavljuju u stvarnim incidentima, a chaos engineering — namjerno i kontrolisano ubacivanje grešaka da bi se vidjelo kako sistem zaista reaguje — disciplina je izgrađena oko toga da se ovo testira namjerno, umjesto da se otkrije u produkciji.

![Izometrijska operativna sala u kojoj inženjeri prate telemetrijske dashboarde oko grupe serverskih ormara zaštićenih providnom kupolom, dok nekoliko ormara varniči pod ubačenim greškama](assets/blog/chaos-engineering-game-day-qa-teams.jpg)

QA timovi se često izostavljaju iz chaos engineeringa jer se on predstavlja kao briga SRE ili platform tima. To je greška. Osmišljavanje dobrog scenarija otkaza, definisanje šta znači „i dalje radi" i odlučivanje kada se rezultat računa kao prolaz, a kada kao pad — to su vještine testiranja, a ne vještine infrastrukture.

## Ukratko o alatima

Nema potrebe počinjati izborom alata. Ekosistem se grubo dijeli u tri grupe: open-source frameworke fokusirane na Kubernetes, poput Chaos Mesh i LitmusChaos, koji unutar klastera ubacuju greške kao što su gašenje podova, mrežno kašnjenje ili I/O opterećenje; komercijalne platforme poput Gremlina i Steadybita, koje na slične tipove grešaka dodaju vođene tokove rada, kontrolu pristupa i izvještaje; i cloud-native servise poput AWS Fault Injection Service (FIS), koji pokreće potpuno upravljane eksperimente — zaustavljanje instance, ograničavanje API poziva, failover baze — bez instaliranja ikakvih agenata, i dolazi sa bibliotekom scenarija sa unaprijed pripremljenim testovima za stvari poput usporavanja jedne Availability Zone ili prekida konekcije između regiona.

Detalj vrijedan pažnje, koji god alat na kraju koristili, jeste sigurnosni mehanizam: FIS omogućava da se eksperiment ograniči po tagu (tako da su, recimo, samo resursi označeni sa `environment: staging` kvalifikovani) i da se postave uslovi zaustavljanja vezani za CloudWatch alarme, pa se eksperiment automatski prekida ako, na primjer, vrijeme odziva pređe prihvatljivi prag. Ta kombinacija — usko ciljanje plus automatski prekidač — je ono što razdvaja „kontrolisani eksperiment" od „samoizazvanog ispada".

## Kako izgleda game day

„Game day" je zakazana sesija u kojoj tim zajedno, uživo, pokreće chaos eksperimente, umjesto da ih pušta kao posao bez nadzora. Struktura koja se u praksi pokazala dobrom izgleda ovako:

1. **Izaberite scenario sa razlogom iza njega** — reprodukcija ranijeg incidenta, stres-test funkcionalnosti koja je upravo puštena, ponovno testiranje ispravke sa prethodnog game daya ili vraćanje na post-mortem koji tim i dalje brine.
2. **Zapišite stabilno stanje (steady state) prije nego što bilo šta dirate.** Na primjer: „5.000 zahtjeva u minuti ka početnoj stranici uspijeva u 99% slučajeva za manje od jedne sekunde." Ako ovo ne možete da formulišete, još ne znate kako bi izgledalo „pokvareno".
3. **Napišite hipotezu**, a ne samo akciju. Ne „ugasi kontejner", nego „kada se jedan kontejner restartuje, stabilno stanje i dalje važi." Testira se hipoteza; ubacivanje greške je samo mehanizam.
4. **Počnite sa najmanjim radijusom uticaja (blast radius) iz kog možete nešto da naučite** — jedna instanca, jedan nekritičan servis, kratak vremenski prozor, u satima slabog saobraćaja — i proširujte ga tek kada taj manji test uspije.
5. **Pokrenite, posmatrajte, zapišite.** Potvrdite da stabilno stanje važi prije nego što išta ubacite (sistem koji je već nestabilan neće vam dati koristan rezultat), a zatim pratite i metu i sve što je ispred ili iza nje u lancu zbog mogućih iznenađenja.
6. **Uradite debrief kao kontrolisani post-mortem.** Pregledajte svaki eksperiment, počevši od onih koji nisu prošli kako je očekivano, prijavite bagove za ono što ste pronašli i odlučite da li je uspješan eksperiment vrijedan automatizacije, tako da se redovno pokreće.

Jednostavan način da se test slučaj zapiše, prije nego što uopšte dođe do alata, je ovaj:

```
Scenario: Primary database instance fails over
Steady state: 95% of checkout requests complete in < 200ms
Hypothesis: failover completes with no checkout requests lost,
            though latency may briefly exceed the 200ms target
Blast radius: single staging replica, 15-minute window, off-peak
Stop condition: error rate > 5% for 60 seconds -> abort
```

To je test slučaj koji QA inženjer može da napiše i pregleda sa istom rigoroznošću kao i bilo koji drugi test, prije nego što iko otvori ijedan chaos alat.

## Zamke i ograničenja

Chaos engineering najčešće ne uspije iz razloga koji nemaju nikakve veze sa alatima. Procjenjivanje alata prije nego što se pokrene ijedan ručni eksperiment česta je prva greška — prijava u konzolu i ručno gašenje jednog servera nauči vas više, i brže, od upoređivanja alata. Preskakanje ograničenja radijusa uticaja je druga: eksperimenti nad cijelom produkcijom, bez najave, nešto su do čega zreli timovi vremenom stignu, a ne početna tačka. Pokretanje eksperimenta bez zapisane hipoteze pretvara ga u nasumično čačkanje, pa je kasnije teško znati da li se išta zaista naučilo. A pokretanje eksperimenata bez dovoljno observabilityja da se vidi šta se dešavalo tokom testa — a ne samo da li je „prošao" — znači da ne možete da odgovorite na najkorisnije pitanje nakon toga, a to je obično „zašto".

Postoje i tvrđa ograničenja. Chaos eksperiment nad sistemom koji je već nestabilan uglavnom vam kaže da je sistem nestabilan, što ste vjerovatno već znali. U regulisanim ili čvrsto povezanim produkcijskim okruženjima trošak i rizik eksperimentisanja mogu biti stvarni, pa neki timovi nikada ne odu dalje od staginga — i to je legitimna tačka zaustavljanja, a ne neuspjeh. I uspješan rezultat game daya je samo snimak trenutnog stanja: kaže da je sistem podnio ovaj otkaz, ovog dana, pod ovim opterećenjem — a ne da će zauvijek podnijeti svaki otkaz.

## Šta dalje

- Ove sedmice pokrenite jedan ručni eksperiment bez ikakvih alata: isključite jednu nekritičnu instancu u neprodukcijskom okruženju i posmatrajte šta se dešava.
- Za sljedeći planirani game day zapišite stabilno stanje i hipotezu prije nego što izaberete grešku koju ćete ubaciti — format iznad je dovoljan.
- Počnite sa najmanjim radijusom uticaja iz kog možete nešto da naučite i proširujte ga tek kada se taj eksperiment ponaša kako je očekivano.
- Ako je vaš stack AWS-native, isprobajte FIS biblioteku scenarija za prvi vođeni eksperiment sa ugrađenim uslovom zaustavljanja, umjesto da ga pravite ručno.

## Izvori

- [Four chaos engineering mistakes to avoid — Thoughtworks](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/four-chaos-engineering-mistakes-to-avoid)
- [AWS Fault Injection Service — Features](https://aws.amazon.com/fis/features/)
- [How to run a Chaos Engineering GameDay — Steadybit](https://steadybit.com/blog/how-to-run-chaosengineering-gameday/)
