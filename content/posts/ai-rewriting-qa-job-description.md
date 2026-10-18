---
title: "AI Is Rewriting the QA Job Description, Not Deleting It"
title_sr: "AI prepisuje opis QA posla, ali ga ne briše"
date: 2026-10-18
time: 12:00
tags: [qa, ai-in-qa, career, test-strategy]
excerpt: AI already drafts test cases and triages failures. Here's what that actually changes about QA work, and where the role is heading next.
excerpt_sr: AI već piše nacrte test slučajeva i sortira padove testova. Evo šta to zaista mijenja u QA poslu i kuda ta uloga ide.
image: assets/blog/ai-rewriting-qa-job-description.jpg
---
Every few months another "will AI replace QA testers" post circulates, and the honest answer is almost always the boring one: it's replacing tasks, not the role, and the tasks it's replacing were rarely the valuable part of the job anyway. The more useful question is narrower: what does a QA engineer actually spend less time on now, what do they spend more time on instead, and does that change what makes someone good at this job.

![Illustration of an AI-assisted QA pipeline: AI assistants feeding logic blueprints, test suites and QA evaluation on the left, and a QA engineer on the right working on a large screen showing system architecture, edge cases, error handling, quality strategy and decision-making](assets/blog/ai-rewriting-qa-job-description.jpg)

## What AI has actually taken off the plate

The clearest wins are in drafting and triage, not in deciding what matters. Given a user story or acceptance criteria, an LLM can draft a reasonable first pass of test cases in a fraction of the time it takes to write them from scratch. Given a pile of CI failures, it can cluster them by likely cause instead of a human scrolling logs line by line. Given a rough bug description, it can tighten it into something a developer can act on without five follow-up questions. None of this requires the model to understand the product; it's pattern completion over text, and it's genuinely useful for that.

Here's where it falls over, concretely: ask an AI tool to draft test cases for a currency conversion feature, and it will reliably cover the happy path (convert USD to EUR, display two decimals) and a few obvious negatives (negative amount, unsupported currency code). What it tends to miss is the case that actually ships bugs — rounding behavior when a conversion rate produces a third decimal that gets truncated differently in the UI than in the backend ledger, or what happens when the rate changes mid-transaction because a cached rate expired. Those cases come from knowing how the system is actually built and where past incidents happened, not from reading the ticket. A tester who treats the AI draft as a finished suite ships with that gap; a tester who treats it as a first pass and adds the domain-specific cases on top ships with better coverage *and* spent less time getting there than if they'd started from a blank page.

## The role is splitting, not shrinking

Ask people doing this work day to day and the pattern that comes up repeatedly is a reallocation of time, not a reduction of headcount. One longtime tester estimated that discovery and exploratory testing already ate about 60% of their time before AI tools arrived, and said they'd like that closer to 80% — using AI for the basic health-check automation that wasn't previously worth scripting, so more hours go to the investigative work that actually finds unknown problems. Another framed it as judgment rising in relative value: once AI absorbs the repetitive parts (writing routine cases, chasing requirement changes, syncing test artifacts across tools), what's left and what gets paid for is deciding how deeply to test a given area, recognizing when an automated check is giving a misleading green, and connecting a failure to actual user impact.

That shows up in job titles too. Postings increasingly blend "QA Engineer" with "SDET" or "Quality Engineer," expecting comfort with AI-assisted drafting plus enough automation literacy — basic API calls, selectors, reading a CI pipeline — to judge whether the output is trustworthy. Purely manual, script-execution-only roles are the ones actually shrinking; roles that sit closer to product and system design, and that can validate what an AI-assisted pipeline produces, are the ones holding up.

## Pitfalls and limits

None of this is an unqualified improvement, and treating it as one is how teams get burned. AI-generated test cases skew generic and confident-sounding, which is a bad combination — a suite that looks thorough but misses the specific failure mode your product actually has is worse than an obviously incomplete one, because nobody double-checks it. Agentic test runners that click through an app autonomously are still fragile in complex, stateful enterprise applications; they handle a clean demo flow and struggle with the modal that only appears for users with a specific account state. And exploratory testing — the kind driven by "that's weird, let me poke at it" — doesn't have an AI substitute yet, because it depends on noticing something wasn't asked about, not answering what was.

There's also a real failure mode on the team side: using AI output as a reason to cut testing capacity rather than to test more. A team that treats faster drafting as "now we need fewer testers" ends up with less actual coverage than before, since the time saved on boilerplate just disappears instead of going toward the edge cases nobody automated.

## What to do next

Pick one recurring task you currently do by hand — drafting test cases from a ticket, or triaging a batch of CI failures — and spend a week having AI produce the first pass while you review and extend it, so you can see concretely where it's reliable and where it isn't for your specific codebase. Write down the domain-specific cases it missed; that list is the actual argument for why your judgment is worth paying for. If you're in a primarily manual role, use the time freed up by faster drafting to build basic automation literacy (reading a Playwright trace, understanding a selector, following a CI log) rather than letting it evaporate into more manual execution. And if you lead a QA team, write down an explicit policy for what AI-generated test content needs human review before it ships, instead of leaving that judgment call to whoever is busiest that week.

## Sources

- [How will Software QA change in 2026 with AI/Agents — and which QA roles will be most valuable?](https://club.ministryoftesting.com/t/how-will-software-qa-change-in-2026-with-ai-agents-and-which-qa-roles-will-be-most-valuable/86992) — Ministry of Testing
- [How AI Is Changing QA in 2026: Skills, Roles & 90-Day Plan](https://softwaretestpilot.com/blog/ai-in-testing/how-ai-is-changing-qa-2026) — Software Test Pilot
- [Will AI Replace QA Testers? The Future of Software Testing](https://testcollab.com/blog/will-ai-replace-qa-testers) — TestCollab

<!--sr-->

Na svakih nekoliko mjeseci kruži novi tekst na temu „da li će AI zamijeniti QA testere", a iskren odgovor je gotovo uvijek onaj dosadni: zamjenjuje zadatke, ne ulogu, a zadaci koje zamjenjuje rijetko su bili vrijedan dio posla. Korisnije pitanje je uže: na šta QA inženjer sada zaista troši manje vremena, na šta umjesto toga troši više, i da li to mijenja ono što nekoga čini dobrim u ovom poslu.

![Ilustracija QA procesa uz pomoć AI-ja: AI asistenti s lijeve strane hrane logičke nacrte, pakete testova i QA evaluaciju, a s desne strane QA inženjer radi na velikom ekranu na kojem su arhitektura sistema, granični slučajevi, obrada grešaka, strategija kvaliteta i donošenje odluka](assets/blog/ai-rewriting-qa-job-description.jpg)

## Šta je AI zaista skinuo sa stola

Najjasnije koristi su u pisanju nacrta i trijaži, a ne u odlučivanju šta je važno. Na osnovu user story-ja ili kriterijuma prihvatanja, LLM može da napiše razuman prvi nacrt test slučajeva za djelić vremena koje bi trebalo da se napišu od nule. Na osnovu gomile CI padova, može da ih grupiše po vjerovatnom uzroku, umjesto da čovjek liniju po liniju lista logove. Na osnovu grubog opisa baga, može da ga pretvori u nešto na osnovu čega developer može da djeluje bez pet dodatnih pitanja. Ništa od ovoga ne zahtijeva da model razumije proizvod; u pitanju je dopunjavanje obrazaca u tekstu, i za to je zaista koristan.

Evo gdje konkretno pada: zatražite od AI alata da napiše test slučajeve za funkciju konverzije valuta i on će pouzdano pokriti srećan put (konvertuj USD u EUR, prikaži dvije decimale) i nekoliko očiglednih negativnih slučajeva (negativan iznos, nepodržan kod valute). Ono što obično promaši je slučaj koji zaista pušta bagove u produkciju — zaokruživanje kada kurs proizvede treću decimalu koja se u UI-ju odsiječe drugačije nego u backend knjigovodstvu, ili šta se dešava kada se kurs promijeni usred transakcije jer je keširani kurs istekao. Takvi slučajevi dolaze iz poznavanja načina na koji je sistem zaista napravljen i gdje su se ranije dešavali incidenti, a ne iz čitanja tiketa. Tester koji AI nacrt tretira kao gotov paket testova izlazi u produkciju sa tom rupom; tester koji ga tretira kao prvi nacrt i doda slučajeve specifične za domen dobija bolju pokrivenost *i* do nje stiže brže nego da je krenuo od prazne stranice.

## Uloga se dijeli, ne smanjuje

Pitajte ljude koji ovaj posao rade svakodnevno i obrazac koji se stalno ponavlja je preraspodjela vremena, a ne smanjenje broja ljudi. Jedan dugogodišnji tester procijenio je da su otkrivanje i istraživačko testiranje zauzimali oko 60% njegovog vremena i prije nego što su stigli AI alati, i rekao da bi volio da to bude bliže 80% — tako što bi AI koristio za osnovnu health-check automatizaciju koju ranije nije bilo isplativo skriptovati, kako bi više sati otišlo na istraživački rad koji zaista pronalazi nepoznate probleme. Drugi je to opisao kao rast relativne vrijednosti procjene: kada AI preuzme ponavljajuće dijelove (pisanje rutinskih slučajeva, praćenje izmjena zahtjeva, sinhronizacija test artefakata između alata), ono što ostaje i za šta se plaća je odluka koliko duboko testirati određenu oblast, prepoznavanje kada automatska provjera daje lažno zeleno svjetlo i povezivanje pada sa stvarnim uticajem na korisnika.

To se vidi i u nazivima pozicija. Oglasi sve češće spajaju „QA Engineer" sa „SDET" ili „Quality Engineer" i očekuju lakoću u radu sa nacrtima uz pomoć AI-ja, plus dovoljno pismenosti u automatizaciji — osnovni API pozivi, selektori, čitanje CI pipeline-a — da bi se procijenilo da li je rezultat pouzdan. Čisto manuelne uloge, svedene samo na izvršavanje skripti, su one koje se zaista smanjuju; uloge koje su bliže dizajnu proizvoda i sistema, i koje mogu da provjere ono što proizvede pipeline uz pomoć AI-ja, su one koje opstaju.

## Zamke i ograničenja

Ništa od ovoga nije bezuslovno poboljšanje, a tretiranje kao takvog je način na koji timovi nastradaju. Test slučajevi koje generiše AI naginju ka generičkim i samouvjerenim formulacijama, što je loša kombinacija — paket testova koji izgleda temeljno, a promaši baš onaj način otkaza koji vaš proizvod ima, gori je od očigledno nepotpunog, jer ga niko ne provjerava dvaput. Agentski test alati koji samostalno klikću kroz aplikaciju i dalje su krhki u složenim enterprise aplikacijama sa mnogo stanja; snalaze se u čistom demo toku, a muče se sa modalom koji se pojavljuje samo korisnicima sa specifičnim stanjem naloga. A istraživačko testiranje — ono koje pokreće misao „ovo je čudno, hajde da čačnem" — još nema AI zamjenu, jer zavisi od primjećivanja nečega što niko nije pitao, a ne od odgovaranja na ono što jeste.

Postoji i stvaran problem na nivou tima: korišćenje AI rezultata kao razloga da se smanji kapacitet testiranja, umjesto da se testira više. Tim koji brže pisanje nacrta shvati kao „sada nam treba manje testera" završi sa manjom stvarnom pokrivenošću nego prije, jer vrijeme ušteđeno na šablonskom poslu jednostavno nestane, umjesto da ode na granične slučajeve koje niko nije automatizovao.

## Šta dalje

Izaberite jedan ponavljajući zadatak koji trenutno radite ručno — pisanje test slučajeva na osnovu tiketa ili trijažu serije CI padova — i nedjelju dana pustite AI da napravi prvi nacrt dok ga vi pregledate i dopunjavate, kako biste konkretno vidjeli gdje je pouzdan, a gdje nije za vaš kod. Zapišite slučajeve specifične za domen koje je promašio; ta lista je pravi argument zašto vaša procjena vrijedi novca. Ako ste u pretežno manuelnoj ulozi, vrijeme oslobođeno bržim pisanjem nacrta iskoristite da izgradite osnovnu pismenost u automatizaciji (čitanje Playwright trace-a, razumijevanje selektora, praćenje CI loga), umjesto da ga pustite da ispari u još više manuelnog izvršavanja. A ako vodite QA tim, zapišite eksplicitnu politiku o tome koji sadržaj testova koji generiše AI mora da prođe ljudski pregled prije puštanja, umjesto da tu odluku prepustite onome ko je te nedjelje najzauzetiji.

## Izvori

- [How will Software QA change in 2026 with AI/Agents — and which QA roles will be most valuable?](https://club.ministryoftesting.com/t/how-will-software-qa-change-in-2026-with-ai-agents-and-which-qa-roles-will-be-most-valuable/86992) — Ministry of Testing
- [How AI Is Changing QA in 2026: Skills, Roles & 90-Day Plan](https://softwaretestpilot.com/blog/ai-in-testing/how-ai-is-changing-qa-2026) — Software Test Pilot
- [Will AI Replace QA Testers? The Future of Software Testing](https://testcollab.com/blog/will-ai-replace-qa-testers) — TestCollab
