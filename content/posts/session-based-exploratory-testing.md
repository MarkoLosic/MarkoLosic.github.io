---
title: "Session-Based Exploratory Testing: How to Make Ad Hoc Testing Repeatable and Reportable"
title_sr: "Exploratory testiranje zasnovano na sesijama: kako ad hoc testiranje učiniti ponovljivim i mjerljivim"
date: 2026-11-23
time: 18:30
tags: [manual-testing, test-strategy]
excerpt: How session-based test management turns unscripted exploratory testing into something you can plan, measure, and report on, with a worked charter example.
excerpt_sr: Kako session-based test management pretvara exploratory testiranje bez skripte u nešto što možete planirati, mjeriti i o čemu možete izvještavati, uz konkretan primjer charter-a.
image: assets/blog/session-based-exploratory-testing.jpg
---
"Just explore the app for a bit and let us know what you find" is how most exploratory testing starts, and it's also why most of it never gets tracked, repeated, or trusted by anyone outside the person who did it. Without structure, exploratory testing looks like busywork to a manager who wants to know what got covered and what didn't. Session-based test management (SBTM) fixes that without turning exploration back into a script.

![Illustration of session-based exploratory testing: a charter checklist on a clipboard, a magnifying glass over a branching path of test ideas leading to bugs and warnings, and a stopwatch marking the timeboxed session](assets/blog/session-based-exploratory-testing.jpg)

## What SBTM actually adds

SBTM was formalized by Jonathan and James Bach around 2000 as a way to keep the creativity of exploratory testing while giving it the accountability of a planned activity. Instead of writing test cases up front, you write **charters**: short mission statements that scope a session without dictating steps. A session is a timeboxed, uninterrupted block of testing against one charter, and it ends with structured notes and a debrief.

The three moving parts are:

- **Charter** — the mission, usually one sentence in the form "Explore `<area>` with `<tools/approach>` to discover `<risk or information>`."
- **Session** — a 60–90 minute timeboxed block where the tester works that charter, free to follow leads as they appear.
- **Session sheet and debrief** — a short record of what was tested, what was found, and how the time was actually spent, reviewed with a lead or another tester afterward.

## A worked example

Say a team is about to ship changes to a checkout page's promo code field. A scripted suite already covers the happy path and the documented edge cases, but nobody has pressure-tested the field itself. A charter for that might read:

```
Charter: Explore the checkout promo-code field with manual
input variation and browser dev tools to discover validation
and discount-stacking bugs.

Time box: 90 minutes
Tester: session owner's name
```

During the session, the tester isn't following a script. They might try pasting a code with leading whitespace, stacking two promo codes in two tabs at once, switching currency mid-session, or throttling the network to see what happens if the discount API call times out after the cart total has already rendered. Whatever looks interesting gets followed for a few minutes before moving on — that drift is the point, not a deviation from plan.

At the end, the session sheet captures a few things in a lightweight format:

```
## Session notes
- Found: stacking a percentage code and a flat code applies
  both, taking the total below the item cost.
- Found: promo field accepts a code with trailing newline
  pasted from email, backend trims it inconsistently with UI.
- Investigated but clean: currency switch mid-session,
  discount recalculates correctly.

## Time breakdown (TBS metrics)
- Test design + execution: 65%
- Bug investigation + reporting: 20%
- Setup / environment issues: 15%
```

That time breakdown — often called TBS (test design, bug investigation, setup) metrics — is what turns a pile of anecdotes into something a lead can aggregate across a sprint: how many sessions ran, how much of that time was actual testing versus fighting the environment, and which charters turned up the most findings per hour.

The debrief itself doesn't need to be formal. A common structure, sometimes called PROOF, covers Past (what you did), Results (what you found), Obstacles (what got in the way), Outlook (what's left to explore), and Feelings (how confident you are in the coverage) in a few minutes of conversation, similar to a stand-up update.

## Pitfalls and limits

SBTM is not a replacement for regression suites or a way to avoid writing down requirements. A few ways teams misuse it:

- **Charters that are too broad.** "Explore the checkout page" produces vague notes and no comparable metrics across sessions. A charter should be narrow enough that a different tester could pick it up and know roughly where to start.
- **Debriefs that get skipped.** The session sheet without a debrief is just a diary. The value of SBTM comes from a second person reviewing coverage and deciding what charter comes next — skip that and you lose the accountability half of the method entirely.
- **Treating findings as bug reports.** Session notes are raw and personal; a "found" item still needs to be turned into a proper, reproducible bug report before a developer looks at it, with the usual repro steps and environment details.
- **Using it where scripted tests do the job better.** Stable, well-understood flows with clear pass/fail criteria (login, a known regression) are cheaper to cover with automated or scripted checks. SBTM earns its cost on new features, risky areas, and anything where you don't yet know the right questions to ask.
- **No tooling, no record.** Tracking sessions in someone's head or a scattered Slack thread defeats the purpose. Even a shared document with one row per session is enough to start; dedicated tools just reduce the overhead of capturing screenshots and timings.

## What to do next

1. Pick one upcoming feature or risky area and write three charters for it, each narrow enough to finish in under 90 minutes.
2. Run one session per charter, timeboxed, with the TBS split above tracked in whatever you already use for notes.
3. Hold a five-minute debrief after each session and write the next charter based on what came up, rather than planning all charters in advance.
4. After a sprint or two, look at the aggregated session metrics — findings per session, time spent on setup versus testing — and use that pattern to justify fixing environment or data issues that keep eating session time.

For the strategy and reporting habits around exploratory work, see [Risk-Based Testing Prioritization](/blog/risk-based-testing-prioritization/), [The Bug Report Developers Actually Want](/blog/writing-bug-reports-that-get-fixed/), and [Definition of Done for QA](/blog/definition-of-done-for-qa/).


## Sources

- [Session-based testing — Wikipedia](https://en.wikipedia.org/wiki/Session-based_testing)
- [Do you know how to manage and report on exploratory testing? — SSW](https://www.ssw.com.au/rules-legacy/manage-report-exploratory-testing/)
- [Creating an Exploratory Testing Charter — Tricentis](https://www.tricentis.com/blog/creating-an-exploratory-testing-charter)
- [Checklists to Support Test Charter Design in Exploratory Testing (arXiv)](https://arxiv.org/pdf/1704.00988)

<!--sr-->

"Samo malo istraži aplikaciju i javi nam šta nađeš" je način na koji počinje većina exploratory testiranja, a to je i razlog zašto se većina njega nikad ne prati, ne ponavlja i zašto mu niko osim osobe koja ga je radila ne vjeruje. Bez strukture, exploratory testiranje izgleda kao prazan hod menadžeru koji želi da zna šta je pokriveno, a šta nije. Session-based test management (SBTM) to rješava, a da istraživanje ne pretvara ponovo u skriptu.

![Ilustracija exploratory testiranja zasnovanog na sesijama: charter u obliku čeklista na podlošku, lupa nad razgranatim putanjama ideja za testiranje koje vode do bagova i upozorenja, i štoperica koja označava vremenski ograničenu sesiju](assets/blog/session-based-exploratory-testing.jpg)

## Šta SBTM zapravo dodaje

SBTM su oko 2000. godine formalizovali Jonathan i James Bach kao način da se zadrži kreativnost exploratory testiranja, a da mu se istovremeno da odgovornost planirane aktivnosti. Umjesto da unaprijed pišete test slučajeve, pišete **charter-e**: kratke izjave o misiji koje određuju obim sesije bez propisivanja koraka. Sesija je vremenski ograničen, neprekinut blok testiranja prema jednom charter-u, i završava se strukturiranim bilješkama i debrifingom.

Tri pokretna dijela su:

- **Charter** — misija, obično jedna rečenica u obliku "Istraži `<oblast>` pomoću `<alati/pristup>` da otkriješ `<rizik ili informaciju>`."
- **Sesija** — vremenski ograničen blok od 60–90 minuta u kom tester radi na tom charter-u, slobodan da prati tragove kako se pojavljuju.
- **Session sheet i debrifing** — kratak zapis o tome šta je testirano, šta je pronađeno i kako je vrijeme zaista potrošeno, koji se nakon toga pregleda sa lead-om ili drugim testerom.

## Konkretan primjer

Recimo da tim treba da isporuči izmjene polja za promo kod na checkout stranici. Skriptovani skup testova već pokriva happy path i dokumentovane granične slučajeve, ali niko nije stvarno "pritisnuo" samo polje. Charter za to mogao bi da glasi:

```
Charter: Explore the checkout promo-code field with manual
input variation and browser dev tools to discover validation
and discount-stacking bugs.

Time box: 90 minutes
Tester: session owner's name
```

Tokom sesije tester ne prati skriptu. Može da pokuša da nalijepi kod sa razmakom na početku, da kombinuje dva promo koda u dva taba istovremeno, da promijeni valutu usred sesije ili da uspori mrežu kako bi vidio šta se dešava ako poziv ka API-ju za popust istekne nakon što je ukupan iznos korpe već prikazan. Šta god izgleda zanimljivo prati se nekoliko minuta prije prelaska dalje — to skretanje je poenta, a ne odstupanje od plana.

Na kraju, session sheet bilježi nekoliko stvari u laganom formatu:

```
## Session notes
- Found: stacking a percentage code and a flat code applies
  both, taking the total below the item cost.
- Found: promo field accepts a code with trailing newline
  pasted from email, backend trims it inconsistently with UI.
- Investigated but clean: currency switch mid-session,
  discount recalculates correctly.

## Time breakdown (TBS metrics)
- Test design + execution: 65%
- Bug investigation + reporting: 20%
- Setup / environment issues: 15%
```

Ta raspodjela vremena — često nazvana TBS metrike (test design, bug investigation, setup) — je ono što gomilu anegdota pretvara u nešto što lead može da sabere kroz sprint: koliko je sesija održano, koliko je od tog vremena bilo stvarno testiranje u odnosu na borbu sa okruženjem i koji charter-i su dali najviše nalaza po satu.

Sam debrifing ne mora biti formalan. Uobičajena struktura, ponekad nazvana PROOF, pokriva Past (šta ste radili), Results (šta ste našli), Obstacles (šta vam je smetalo), Outlook (šta je ostalo da se istraži) i Feelings (koliko ste sigurni u pokrivenost) u nekoliko minuta razgovora, slično stand-up izvještaju.

## Zamke i ograničenja

SBTM nije zamjena za regresione skupove testova niti način da se izbjegne zapisivanje zahtjeva. Nekoliko načina na koje ga timovi pogrešno koriste:

- **Previše široki charter-i.** "Istraži checkout stranicu" daje nejasne bilješke i nikakve uporedive metrike između sesija. Charter treba da bude dovoljno uzak da bi drugi tester mogao da ga preuzme i otprilike zna odakle da počne.
- **Preskočeni debrifinzi.** Session sheet bez debrifinga je samo dnevnik. Vrijednost SBTM-a dolazi od druge osobe koja pregleda pokrivenost i odlučuje koji charter ide sljedeći — preskočite to i u potpunosti gubite onu polovinu metode koja se tiče odgovornosti.
- **Tretiranje nalaza kao bug reportova.** Bilješke iz sesije su sirove i lične; stavka "found" i dalje mora da se pretvori u pravi, reproducibilan bug report prije nego što je developer pogleda, sa uobičajenim koracima za reprodukciju i detaljima okruženja.
- **Korišćenje tamo gdje skriptovani testovi bolje rade posao.** Stabilne, dobro shvaćene tokove sa jasnim kriterijumima prolaza/pada (prijava, poznata regresija) jeftinije je pokriti automatizovanim ili skriptovanim provjerama. SBTM opravdava svoj trošak na novim funkcionalnostima, rizičnim oblastima i svemu gdje još ne znate prava pitanja.
- **Bez alata, bez zapisa.** Praćenje sesija u nečijoj glavi ili u razbacanoj Slack niti poništava svrhu. Čak je i dijeljeni dokument sa jednim redom po sesiji dovoljan za početak; namjenski alati samo smanjuju trud oko snimanja screenshot-ova i mjerenja vremena.

## Šta dalje

1. Izaberite jednu predstojeću funkcionalnost ili rizičnu oblast i napišite tri charter-a za nju, svaki dovoljno uzak da se završi za manje od 90 minuta.
2. Održite jednu vremenski ograničenu sesiju po charter-u, uz praćenje TBS raspodjele u čemu god već vodite bilješke.
3. Nakon svake sesije održite petominutni debrifing i napišite sljedeći charter na osnovu onoga što se pojavilo, umjesto da sve charter-e planirate unaprijed.
4. Nakon sprinta ili dva, pogledajte zbirne metrike sesija — nalaze po sesiji, vrijeme potrošeno na podešavanje u odnosu na testiranje — i iskoristite taj obrazac da opravdate popravku problema sa okruženjem ili podacima koji stalno jedu vrijeme sesija.

Za strategiju i izvještavanje oko istraživačkog testiranja pogledaj članke [Testiranje zasnovano na riziku](/sr/blog/risk-based-testing-prioritization/), [Prijava baga kakvu developeri zaista žele](/sr/blog/writing-bug-reports-that-get-fixed/) i [Definition of Done za QA](/sr/blog/definition-of-done-for-qa/).


## Izvori

- [Session-based testing — Wikipedia](https://en.wikipedia.org/wiki/Session-based_testing)
- [Do you know how to manage and report on exploratory testing? — SSW](https://www.ssw.com.au/rules-legacy/manage-report-exploratory-testing/)
- [Creating an Exploratory Testing Charter — Tricentis](https://www.tricentis.com/blog/creating-an-exploratory-testing-charter)
- [Checklists to Support Test Charter Design in Exploratory Testing (arXiv)](https://arxiv.org/pdf/1704.00988)
