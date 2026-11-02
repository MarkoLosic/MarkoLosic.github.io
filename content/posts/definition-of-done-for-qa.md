---
title: "Definition of Done for QA: How Teams Agree on What 'Tested' Actually Means"
title_sr: "Definition of Done za QA: kako se tim dogovori šta zapravo znači „testirano“"
date: 2026-11-02
time: 08:00
tags: [qa, methodology, definition-of-done, scrum]
excerpt: A vague Definition of Done lets everyone assume someone else tested the edge cases. Here's how to write one that actually catches bugs before release.
excerpt_sr: Nejasan Definition of Done svima dozvoljava da pretpostave da je neko drugi testirao granične slučajeve. Evo kako napisati onaj koji zaista hvata bagove prije izdanja.
image: assets/blog/definition-of-done-for-qa.jpg
---
Ask three people on a feature team what "tested" means for a finished ticket, and you'll often get three different answers: "the acceptance criteria pass," "QA signed off," and "it works on my machine and nothing broke in CI." None of those are wrong exactly, but none of them are a shared standard either — and the gap between them is exactly where regressions slip through. A Definition of Done (DoD) is supposed to close that gap. In practice, most teams write one once, early in a project, and never revisit whether it still matches how they actually ship.

![Isometric illustration of clipboards with ticked checklists and a kanban board, a magnifying glass revealing bugs hiding in a code panel, surrounded by shields, gears and branching diagrams](assets/blog/definition-of-done-for-qa.jpg)

## What a Definition of Done is actually for

The Scrum Guide describes the Definition of Done as a formal description of the state a piece of work must reach to count as done — not "coded," not "demoed," but releasable. Work that doesn't meet it isn't finished; it goes back to the backlog. That sounds strict, and it's meant to be: a widely cited set of principles on the topic puts it plainly — "don't show or deliver undone work," and "never abandon the Definition of Done" to hit a deadline. The same source makes a point that QA teams run into constantly: writing the DoD is not the testers' job alone. It's a whole-team agreement, which means product, developers, and QA all have to actually negotiate what "tested" covers — not have QA quietly backfill the definition after the fact.

The problem is that "tested" is a word every role on the team can use honestly while meaning something different by it.

## A concrete example: the DoD that said "tested" and nothing else

Imagine a team shipping a self-serve password reset flow. Their Definition of Done, written a year earlier when the team was two developers and no dedicated QA, says simply: "code reviewed, unit tests pass, tested, deployed to staging." Everyone agrees the ticket meets it. A developer writes unit tests for the token-generation logic. QA runs the happy path manually in staging — request a reset, click the email link, set a new password — and it works. The ticket moves to done.

What the DoD never specified: what happens to a reset token after it's used once, what happens if the user requests two reset emails in a row and clicks the older one, and what happens if the account was deleted between the request and the click. None of those are exotic scenarios — they're the first three things an experienced tester would normally think to check on any reset flow — but "tested" in this team's DoD didn't say *which* cases, so nobody treated them as mandatory. Three weeks after release, a support ticket comes in: a user reused an old reset link from a week earlier and it still worked, because the token had no expiry check in that one secondary code path. The acceptance criteria had been "a user can reset their password," which the happy-path test satisfied completely. The bug was real, but by the DoD's own wording, the ticket had genuinely been done.

This is the pattern behind most "unclear DoD" escapes: it's rarely that nobody tested anything. It's that the DoD described an outcome ("tested") instead of a standard (what counts as having tested it), so every person filled in the blank with their own reasonable-sounding default.

## Writing a DoD that actually specifies what "tested" covers

A DoD clause that just says "tested" or "QA approved" is a placeholder, not a standard. A version that functions as one tends to be specific about the *kind* of coverage expected, for example:

```
A story is Done when:
- Acceptance criteria pass, AND
- At least one negative/invalid-input case per input field is covered
  (empty, malformed, expired, already-used, where applicable)
- Any state transition in the ticket (e.g. token used -> token invalid)
  has an explicit test, automated or manual
- Cross-browser/device check only if the ticket touches UI rendering
- A tester other than the implementer has exercised the change
```

None of this is exotic — it's the same four or five categories (invalid input, state transitions, concurrency, permissions, and cross-environment behavior) that account for most escaped defects in practice. The value isn't in the specific list; it's in writing down *which* categories apply to *this kind* of ticket, so "tested" stops being a word people fill in from memory under deadline pressure.

Xebia's engineering team found a related gap when they realized their single DoD worked fine for new features but kept leaving customers with unanswered questions after bug fixes — things like which versions were affected and whether a workaround existed. Their fix wasn't a stricter DoD overall; it was a second, bug-specific DoD that asked a different set of questions than the feature DoD did. The lesson generalizes: one DoD rarely fits every kind of work item, and trying to force it to often produces a document vague enough to technically fit everything.

## Pitfalls and limits

A detailed DoD checklist can become its own problem if treated as a substitute for judgment: a 20-item checklist that a tester rubber-stamps without thinking is no better than "tested" with no detail at all, just slower. A DoD also can't cover cases nobody on the team has thought of yet — it codifies known categories of risk, not unknown ones, which is why it needs revisiting after every escaped bug, not just at project kickoff. And a DoD owned only by QA tends to get quietly worked around by the rest of the team under deadline pressure, since nobody else feels bound by it; it only holds if product and engineering helped write it and are willing to push a deadline rather than ship around it.

## What to do next

- Pull up your team's current DoD and check whether "tested" is followed by any specifics. If it isn't, that's the gap to close first.
- After the next bug that reaches production, ask explicitly: would our current DoD have caught this, or did it genuinely satisfy the wording as written? Rewrite the clause that let it through.
- If your team ships both features and bug fixes, check whether one DoD is trying to cover both — consider a short, separate bug DoD like Xebia's, focused on impact and regression risk rather than new-feature coverage.
- Make the next DoD review a whole-team conversation, not a QA memo — the Scrum Guide's own framing is that it's a team commitment, and it only holds up under deadline pressure if everyone agreed to it.

## Sources

- [Definition of Done Theses: 10 Simple Principles of a Critical Scrum Success Factor](https://www.scrum.org/resources/blog/definition-done-theses) — Scrum.org
- [Definition of Done for User Stories vs. Bugs](https://xebia.com/blog/definition-of-done-for-user-stories-vs-bugs/) — Xebia

<!--sr-->

Pitajte tri osobe iz istog tima šta znači „testirano" za završen tiket, i često ćete dobiti tri različita odgovora: „acceptance kriterijumi prolaze", „QA je odobrio" i „radi kod mene i ništa nije puklo u CI-ju". Nijedan od tih odgovora nije baš pogrešan, ali nijedan nije ni zajednički standard — a upravo kroz prazninu između njih provlače se regresije. Definition of Done (DoD) bi trebalo da zatvori tu prazninu. U praksi ga većina timova napiše jednom, na početku projekta, i više nikad ne provjeri da li još uvijek odgovara načinu na koji zaista isporučuju.

![Izometrijska ilustracija tabli sa štikliranim checklistama i kanban tablom, lupa koja otkriva bagove skrivene u panelu sa kodom, okružena štitovima, zupčanicima i dijagramima grananja](assets/blog/definition-of-done-for-qa.jpg)

## Čemu Definition of Done zapravo služi

Scrum Guide opisuje Definition of Done kao formalan opis stanja koje dio posla mora da dostigne da bi se smatrao završenim — ne „iskodiran", ne „demonstriran", nego spreman za izdanje. Posao koji ga ne ispunjava nije završen; vraća se u backlog. To zvuči strogo, i tako je i zamišljeno: često citiran skup principa na ovu temu kaže to direktno — „ne pokazujte i ne isporučujte nezavršen posao" i „nikada ne odustajte od Definition of Done" da biste stigli do roka. Isti izvor ističe nešto na šta QA timovi stalno nailaze: pisanje DoD-a nije posao samo testera. To je dogovor cijelog tima, što znači da product, developeri i QA moraju zaista da ispregovaraju šta „testirano" pokriva — a ne da QA naknadno, u tišini, popunjava definiciju.

Problem je u tome što je „testirano" riječ koju svaka uloga u timu može iskreno da koristi, a da pod njom podrazumijeva nešto drugo.

## Konkretan primjer: DoD u kojem piše „testirano" i ništa više

Zamislite tim koji isporučuje samostalni reset lozinke. Njihov Definition of Done, napisan godinu dana ranije dok je tim imao dva developera i nijednog posvećenog QA-a, kaže samo: „kod pregledan, unit testovi prolaze, testirano, deployovano na staging". Svi se slažu da tiket to ispunjava. Developer piše unit testove za logiku generisanja tokena. QA ručno prolazi srećnu putanju na stagingu — zatraži reset, klikne link iz mejla, postavi novu lozinku — i sve radi. Tiket prelazi u done.

Ono što DoD nikad nije precizirao: šta se dešava sa reset tokenom nakon što se jednom iskoristi, šta se dešava ako korisnik zatraži dva reset mejla zaredom i klikne na stariji, i šta se dešava ako je nalog obrisan između zahtjeva i klika. Nijedan od tih scenarija nije egzotičan — to su prve tri stvari koje bi iskusan tester inače provjerio na bilo kom reset toku — ali „testirano" u DoD-u ovog tima nije reklo *koje* slučajeve, pa ih niko nije tretirao kao obavezne. Tri sedmice nakon izdanja stiže tiket od podrške: korisnik je ponovo iskoristio stari reset link od prije sedmicu dana i on je i dalje radio, jer token nije imao provjeru isteka u toj jednoj sporednoj putanji koda. Acceptance kriterijum je glasio „korisnik može da resetuje lozinku", što je test srećne putanje u potpunosti zadovoljio. Bag je bio stvaran, ali po samom tekstu DoD-a, tiket je zaista bio završen.

To je obrazac iza većine bagova koji promaknu zbog „nejasnog DoD-a": rijetko je problem u tome što niko ništa nije testirao. Problem je što je DoD opisivao ishod („testirano") umjesto standarda (šta se računa kao da je nešto testirano), pa je svako popunio prazninu svojom razumnom podrazumijevanom pretpostavkom.

## Kako napisati DoD koji zaista precizira šta „testirano" pokriva

Stavka u DoD-u koja kaže samo „testirano" ili „QA odobrio" je čuvar mjesta, ne standard. Verzija koja zaista funkcioniše kao standard obično je konkretna u vezi sa *vrstom* očekivane pokrivenosti, na primjer:

```
Priča je Done kada:
- Acceptance kriterijumi prolaze, I
- Pokriven je bar jedan negativan slučaj / slučaj nevalidnog unosa po polju
  (prazno, neispravan format, isteklo, već iskorišteno, gdje je primjenjivo)
- Svaka promjena stanja u tiketu (npr. token iskorišten -> token nevažeći)
  ima eksplicitan test, automatizovan ili ručni
- Provjera na više browsera/uređaja samo ako tiket dira prikaz UI-ja
- Izmjenu je isprobao tester koji nije onaj ko ju je implementirao
```

Ništa od ovoga nije egzotično — to su iste četiri ili pet kategorija (nevalidan unos, promjene stanja, konkurentnost, dozvole i ponašanje u različitim okruženjima) koje u praksi čine većinu bagova koji promaknu. Vrijednost nije u konkretnoj listi; vrijednost je u tome da se zapiše *koje* kategorije važe za *ovu vrstu* tiketa, kako „testirano" ne bi više bila riječ koju ljudi popunjavaju iz sjećanja pod pritiskom roka.

Inženjerski tim iz Xebie naišao je na srodnu prazninu kada je shvatio da njihov jedinstveni DoD dobro radi za nove funkcionalnosti, ali da nakon ispravki bagova stalno ostavlja korisnike sa neodgovorenim pitanjima — npr. koje verzije su pogođene i da li postoji zaobilazno rješenje. Njihovo rješenje nije bio strožiji DoD u cjelini; bio je to drugi DoD, posebno za bagove, koji postavlja drugačiji skup pitanja od DoD-a za funkcionalnosti. Pouka važi i šire: jedan DoD rijetko odgovara svakoj vrsti radnog zadatka, a pokušaj da se to nametne često proizvede dokument dovoljno nejasan da tehnički odgovara svemu.

## Zamke i ograničenja

Detaljna DoD checklista može postati problem sama po sebi ako se tretira kao zamjena za rasuđivanje: checklista od 20 stavki koju tester štiklira bez razmišljanja nije ništa bolja od golog „testirano" — samo je sporija. DoD takođe ne može da pokrije slučajeve kojih se niko u timu još nije sjetio — on kodifikuje poznate kategorije rizika, ne nepoznate, i zato ga treba preispitati nakon svakog baga koji promakne, a ne samo na početku projekta. A DoD koji „pripada" samo QA-u ostatak tima pod pritiskom roka obično tiho zaobiđe, jer se niko drugi ne osjeća obaveznim da ga poštuje; on opstaje samo ako su ga product i inženjering zajedno pisali i spremni su da pomjere rok umjesto da isporuče mimo njega.

## Šta dalje

- Otvorite trenutni DoD vašeg tima i provjerite da li iza riječi „testirano" stoji bilo kakva konkretizacija. Ako ne stoji, to je praznina koju prvu treba zatvoriti.
- Nakon sljedećeg baga koji stigne do produkcije, eksplicitno pitajte: da li bi ga naš trenutni DoD uhvatio, ili je tiket zaista ispunio tekst onako kako je napisan? Prepišite stavku koja ga je propustila.
- Ako vaš tim isporučuje i funkcionalnosti i ispravke bagova, provjerite da li jedan DoD pokušava da pokrije oboje — razmislite o kratkom, zasebnom DoD-u za bagove, poput Xebijinog, fokusiranom na uticaj i rizik od regresije umjesto na pokrivenost novih funkcionalnosti.
- Neka sljedeći pregled DoD-a bude razgovor cijelog tima, a ne QA memo — i sam Scrum Guide ga posmatra kao obavezu tima, a pod pritiskom roka opstaje samo ako su se svi oko njega dogovorili.

## Izvori

- [Definition of Done Theses: 10 Simple Principles of a Critical Scrum Success Factor](https://www.scrum.org/resources/blog/definition-done-theses) — Scrum.org
- [Definition of Done for User Stories vs. Bugs](https://xebia.com/blog/definition-of-done-for-user-stories-vs-bugs/) — Xebia
