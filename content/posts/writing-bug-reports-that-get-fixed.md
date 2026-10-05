---
title: "The Bug Report Developers Actually Want: A Field Guide"
title_sr: "Prijava greške kakvu developeri zaista žele: praktični vodič"
date: 2026-10-05
time: 18:00
tags: [qa, manual-testing, bug-reports, methodology]
excerpt: A practical structure for bug reports a developer can reproduce and fix on the first read, with a before/after example.
excerpt_sr: Praktična struktura prijave greške koju developer može da reprodukuje i popravi već iz prvog čitanja, uz primjer „prije i poslije".
image: assets/blog/writing-bug-reports-that-get-fixed.jpg
---
A bug report that says "the cart is broken" costs more time than it saves. A developer who gets it has to track down the tester, ask what browser they used, ask what "broken" means, try to guess the steps, and only then start actually investigating. Multiply that by a dozen reports a sprint and a tester with a sloppy reporting habit quietly becomes one of the slower parts of the release process, even if their bug-finding instincts are excellent. The fix isn't more tooling — it's a report structure that answers the developer's first five questions before they have to ask.

![Illustration of a laptop showing a bug report titled "Discount Code Dropped on Quantity Change" with numbered reproduction steps, an environment checklist, reproducibility 5/5 and an error log, surrounded by expected-vs-actual cart total windows, a discount input field, magnifying glasses and QA badges](assets/blog/writing-bug-reports-that-get-fixed.jpg)

## What a developer actually needs, in order

When a developer opens a bug report, they're trying to do one thing: reproduce the failure on their own machine as fast as possible, because an unreproducible bug can't be debugged. Everything in a good report serves that goal, in a predictable order:

1. **A specific title** that says what broke and where, not how you felt about it.
2. **Environment** — browser and version, OS, device, app version or build number, account/role if relevant.
3. **Steps to reproduce**, numbered, starting from a known state (not "do the usual stuff first").
4. **Expected result** versus **actual result**, stated separately so it's clear this is a mismatch and not a feature question.
5. **Evidence** — a screenshot, screen recording, or relevant console/network log.
6. **Reproducibility** — does it happen every time, or only sometimes?
7. **Severity and priority**, reported as two separate judgments, not one.

Severity and priority get collapsed into a single "how bad is it" field more often than they should be, and that's a mistake: severity describes technical impact (does this crash the app, corrupt data, or just look slightly off), while priority describes how urgently it needs fixing given the business context right now. A broken "share to Twitter" button might be low severity but high priority during a marketing push; a rare crash in an admin-only tool might be high severity but low priority. Reporting them as one number forces the developer to guess which one you meant.

## A before-and-after example

Here's a report that technically describes a real bug, but wastes everyone's time:

> **Title:** Checkout is broken
> **Description:** When I try to buy something the total is wrong. Tested on my laptop. Please fix soon, this is bad.

Nothing here is reproducible. "My laptop" isn't an environment. "The total is wrong" isn't an expected-vs-actual comparison. There's no indication of whether this happens every time or once. Here's the same bug written to be reproduced on the first try:

> **Title:** CHECKOUT — Order total excludes 10% discount code after quantity is changed
> **Environment:** Chrome 130, macOS 15, staging build 4.2.1, logged in as a standard (non-admin) account
> **Steps to reproduce:**
> 1. Add any item to the cart, apply discount code `SAVE10`
> 2. Confirm the cart total reflects the 10% discount
> 3. On the cart page, increase the item quantity from 1 to 2 using the stepper
> 4. Observe the recalculated total
>
> **Expected result:** Total reflects the new quantity with the 10% discount still applied.
> **Actual result:** Total reflects the new quantity, but the discount is silently dropped — no error shown, no indication the code was removed.
> **Reproducibility:** 5/5 attempts, both as guest and logged-in user.
> **Evidence:** screen recording attached (0:08–0:14 shows the total jump without the discount line)
> **Severity:** Major (customer is silently overcharged)
> **Priority:** High (affects every order with a quantity change after a discount code)

Everything a developer needs to start debugging — what, where, how to see it themselves, and how bad it is — is here without requiring a single follow-up question.

## Pitfalls and limits

Even a well-structured report can fail if it tries to do too much. Bundling two unrelated issues into one report ("also, the footer links are the wrong color") forces an arbitrary status on both when only one gets fixed, and makes the report hard to close cleanly — one bug per report, always. Being too thorough can backfire too: a report with fifteen reproduction steps because you didn't isolate the minimal path just means the developer has to do that isolation work themselves, which was the tester's job. Avoid editorializing about root cause unless you're confident — "the API must be caching wrong" is a guess dressed as a fact, and guesses that turn out wrong erode trust in the report. And reproducibility matters more than people give it credit for: a bug you saw once and can't reliably reproduce is a different kind of problem (worth logging, but flagged as such) than one that fails every time, and conflating the two wastes investigation time on the wrong priority.

## What to do next

Write (or adapt) a template with the seven fields above and make it the default in your tracker, so the structure is the path of least resistance rather than something testers have to remember. Before filing a report, try to reproduce it once more from a clean state (closed tabs, logged out and back in, or a fresh test account) — this alone catches a surprising number of "bugs" that were actually stale local state. Separate severity and priority as two distinct fields if your tracker currently merges them. And for anything intermittent, add a reproducibility note ("3 of 10 attempts") instead of describing it with the same confidence as a reliable failure — it changes how a developer should even approach debugging it.

## Sources

- [How to write an Effective Bug Report — BrowserStack](https://www.browserstack.com/guide/how-to-write-a-bug-report)
- [How to Write a Bug Report (A Step-By-Step Guide) — Marker.io](https://marker.io/blog/how-to-write-bug-report)

<!--sr-->

Prijava greške koja kaže „korpa ne radi" košta više vremena nego što uštedi. Developer koji je dobije mora da pronađe testera, pita koji je browser koristio, pita šta znači „ne radi", pokuša da pogodi korake, i tek onda zaista počne da istražuje. Pomnožite to sa desetak prijava po sprintu i tester sa aljkavom navikom prijavljivanja tiho postaje jedan od sporijih dijelova procesa objave, čak i ako su mu instinkti za pronalaženje grešaka odlični. Rješenje nije više alata — nego struktura prijave koja odgovara na prvih pet pitanja developera prije nego što ih uopšte postavi.

![Ilustracija laptopa koji prikazuje prijavu greške pod naslovom „Discount Code Dropped on Quantity Change" sa numerisanim koracima za reprodukciju, listom okruženja, ponovljivošću 5/5 i logom greške, okruženog prozorima sa očekivanim i stvarnim iznosom korpe, poljem za unos popusta, lupama i QA bedževima](assets/blog/writing-bug-reports-that-get-fixed.jpg)

## Šta developeru zaista treba, i kojim redom

Kada developer otvori prijavu greške, pokušava da uradi jednu stvar: da što brže reprodukuje problem na svojoj mašini, jer grešku koja se ne može reprodukovati nije moguće debagovati. Sve u dobroj prijavi služi tom cilju, predvidljivim redom:

1. **Konkretan naslov** koji kaže šta se pokvarilo i gdje, a ne kako ste se vi osjećali zbog toga.
2. **Okruženje** — browser i verzija, operativni sistem, uređaj, verzija aplikacije ili broj build-a, nalog/uloga ako je bitno.
3. **Koraci za reprodukciju**, numerisani, počevši od poznatog stanja (a ne „prvo uradi ono uobičajeno").
4. **Očekivani rezultat** naspram **stvarnog rezultata**, navedeni odvojeno, kako bi bilo jasno da je u pitanju neslaganje, a ne pitanje o funkcionalnosti.
5. **Dokazi** — screenshot, snimak ekrana ili relevantan log iz konzole/mreže.
6. **Ponovljivost** — da li se dešava svaki put ili samo ponekad?
7. **Ozbiljnost i prioritet**, prijavljeni kao dvije odvojene procjene, a ne jedna.

Ozbiljnost i prioritet se češće nego što bi trebalo spoje u jedno polje „koliko je loše", i to je greška: ozbiljnost (severity) opisuje tehnički uticaj (da li ruši aplikaciju, kvari podatke ili samo malo čudno izgleda), dok prioritet opisuje koliko hitno treba da se popravi s obzirom na trenutni poslovni kontekst. Neispravno dugme „podijeli na Twitter" može biti niske ozbiljnosti, ali visokog prioriteta tokom marketinške kampanje; rijedak pad u alatu koji koriste samo administratori može biti visoke ozbiljnosti, ali niskog prioriteta. Prijavljivanje oba kao jedne vrijednosti tjera developera da pogađa šta ste mislili.

## Primjer „prije i poslije"

Evo prijave koja tehnički opisuje stvarnu grešku, ali svima troši vrijeme:

> **Naslov:** Checkout ne radi
> **Opis:** Kad pokušam nešto da kupim, iznos je pogrešan. Testirano na mom laptopu. Molim popravite što prije, ovo je loše.

Ništa ovdje nije moguće reprodukovati. „Moj laptop" nije okruženje. „Iznos je pogrešan" nije poređenje očekivanog i stvarnog. Nema naznake da li se dešava svaki put ili se desilo jednom. Evo iste greške, napisane tako da se reprodukuje iz prvog pokušaja:

> **Naslov:** CHECKOUT — Ukupan iznos narudžbe ne uključuje 10% popusta nakon promjene količine
> **Okruženje:** Chrome 130, macOS 15, staging build 4.2.1, prijavljen kao standardni (ne-admin) nalog
> **Koraci za reprodukciju:**
> 1. Dodajte bilo koji artikal u korpu, primijenite kod za popust `SAVE10`
> 2. Potvrdite da ukupan iznos u korpi uključuje popust od 10%
> 3. Na stranici korpe povećajte količinu artikla sa 1 na 2 pomoću stepera
> 4. Posmatrajte ponovo izračunat ukupan iznos
>
> **Očekivani rezultat:** Ukupan iznos odražava novu količinu, a popust od 10% je i dalje primijenjen.
> **Stvarni rezultat:** Ukupan iznos odražava novu količinu, ali popust je tiho uklonjen — nema poruke o grešci, niti ikakve naznake da je kod uklonjen.
> **Ponovljivost:** 5/5 pokušaja, i kao gost i kao prijavljeni korisnik.
> **Dokazi:** priložen snimak ekrana (0:08–0:14 pokazuje skok iznosa bez stavke popusta)
> **Ozbiljnost:** Velika (kupcu se tiho naplaćuje više)
> **Prioritet:** Visok (pogađa svaku narudžbu u kojoj se količina mijenja nakon unosa koda za popust)

Sve što developeru treba da počne debagovanje — šta, gdje, kako da to sam vidi i koliko je ozbiljno — nalazi se ovdje, bez ijednog dodatnog pitanja.

## Zamke i ograničenja

Čak i dobro strukturirana prijava može da promaši ako pokušava da uradi previše. Spajanje dva nepovezana problema u jednu prijavu („i usput, linkovi u footer-u su pogrešne boje") nameće proizvoljan status obama kada se popravi samo jedan, i otežava čisto zatvaranje prijave — jedna greška po prijavi, uvijek. Pretjerana detaljnost takođe može da se obije o glavu: prijava sa petnaest koraka za reprodukciju zato što niste izolovali minimalnu putanju znači samo da developer mora sam da uradi tu izolaciju, a to je bio posao testera. Izbjegavajte nagađanje o uzroku osim ako niste sigurni — „mora da API pogrešno kešira" je pretpostavka predstavljena kao činjenica, a pretpostavke koje se ispostave kao netačne narušavaju povjerenje u prijavu. I ponovljivost je važnija nego što joj se priznaje: greška koju ste vidjeli jednom i ne možete pouzdano da reprodukujete je drugačija vrsta problema (vrijedi je zabilježiti, ali tako i označiti) od one koja pada svaki put, a miješanje te dvije troši vrijeme istrage na pogrešan prioritet.

## Šta dalje

Napišite (ili prilagodite) šablon sa sedam gore navedenih polja i postavite ga kao podrazumijevani u vašem tracker-u, tako da struktura bude put najmanjeg otpora, a ne nešto čega testeri moraju da se sjete. Prije nego što prijavite grešku, pokušajte još jednom da je reprodukujete iz čistog stanja (zatvoreni tabovi, odjava i ponovna prijava ili novi testni nalog) — samo to otkriva iznenađujući broj „grešaka" koje su zapravo bile zastarjelo lokalno stanje. Razdvojite ozbiljnost i prioritet u dva posebna polja ako ih vaš tracker trenutno spaja. I za sve što se dešava povremeno, dodajte napomenu o ponovljivosti („3 od 10 pokušaja") umjesto da to opisujete sa istom sigurnošću kao pouzdan pad — to mijenja čak i to kako developer uopšte treba da pristupi debagovanju.

## Izvori

- [How to write an Effective Bug Report — BrowserStack](https://www.browserstack.com/guide/how-to-write-a-bug-report)
- [How to Write a Bug Report (A Step-By-Step Guide) — Marker.io](https://marker.io/blog/how-to-write-bug-report)
