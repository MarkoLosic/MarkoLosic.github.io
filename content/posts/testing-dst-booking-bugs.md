---
title: "Testing Across Daylight Saving Time: The Booking Bugs That Only Show Up Twice a Year"
title_sr: "Testiranje kroz pomjeranje sata: bagovi u zakazivanju koji se javljaju samo dva puta godišnje"
date: 2026-10-16
tags: [qa, real-world-use-case, timezones, scheduling]
excerpt: Why scheduling and booking features break around DST transitions, and how to write tests that actually catch it.
excerpt_sr: Zašto funkcije zakazivanja i rezervacija pucaju oko prelaska na ljetnje i zimsko računanje vremena i kako napisati testove koji to zaista hvataju.
image: assets/blog/testing-dst-booking-bugs.jpg
---
A meeting scheduler, a delivery slot picker, a cron-based reminder system — any feature that promises "this happens at this local time" eventually has to survive the two days a year when local time itself is inconsistent. Daylight saving time transitions create an hour that doesn't exist and, a few months later, an hour that happens twice. Most test suites never touch either one, because they run against whatever today happens to be, and today is rarely a transition day.

![Illustration of a stopwatch whose dial splits around 2 and 3 a.m., surrounded by March and November calendars with DST transition dates circled, timezone labels such as UTC, GMT, IANA, America/New_York and Europe/London, and code editor windows with bug and warning icons](assets/blog/testing-dst-booking-bugs.jpg)

## Why this keeps catching teams off guard

The failure mode isn't exotic, and it has hit companies with far more time-handling experience than most teams building a booking feature. In 2010, iPhone recurring alarms fired at the wrong time after DST changes, first in Australia and New Zealand and then in Europe, and people woke up an hour off. In 2007, when the US extended daylight saving by several weeks, Microsoft Outlook appointments falling in the new window shifted by an hour, and companies spent weeks correcting meetings by hand. Infrastructure vendors still ship support articles warning that a time change can throw off scheduled jobs — Dell has one for PowerProtect Cyber Recovery. None of these were careless teams. Their time-handling code was correct on every day except the two that mattered.

The underlying bugs come from a short list that keeps recurring:

- **The missing hour.** On the spring-forward date, a time like 2:30 a.m. in `America/New_York` simply doesn't exist. Anything scheduled for it either throws, silently skips, or gets normalized to a time nobody chose.
- **The duplicate hour.** On fall-back, 1:30 a.m. happens twice. A job or reminder scheduled in local time for that slot can fire twice — or, depending on the scheduler, not at all.
- **Local time stored without a zone.** If a booking is saved as a naive timestamp or as a fixed UTC offset instead of a time plus an IANA zone ID (`Europe/Berlin`, not `GMT+1`), the booking is correct until the zone's offset changes — then it's off by an hour.
- **"Every 24 hours" scheduling.** A job set to run every 86,400 seconds drifts relative to the wall clock the moment the offset changes, which is exactly how automated schedules end up firing an hour early or late right after a time change.

## A concrete test scenario

Take a meeting-booking feature where a user in `America/New_York` books a recurring 9:00 a.m. call with a user in `Europe/London`. The useful test here isn't "booking works". It's a set of checks pinned to specific calendar dates. In 2026, the US springs forward on March 8 and the UK on March 29, so for three weeks the two cities are four hours apart instead of five:

```text
Fixed clock: 2026-03-07 (the day before US spring-forward)
1. Book a weekly 9:00 a.m. America/New_York call, starting 2026-03-01.
2. Assert the 2026-03-01 occurrence shows 9:00 a.m. New York / 2:00 p.m. London.
3. Assert the 2026-03-08 and 2026-03-15 occurrences (after the US shift)
   still show 9:00 a.m. New York, but now 1:00 p.m. London — not 2:00 p.m.,
   because the UK's own shift hasn't happened yet.
4. Assert the 2026-03-29 occurrence (after the UK shift) is back to
   9:00 a.m. New York / 2:00 p.m. London.
5. Attempt to book a one-off call at 2:30 a.m. America/New_York on
   2026-03-08 (the nonexistent hour). Assert the system rejects it or
   explicitly normalizes it, rather than silently accepting a timestamp
   that never occurred.
6. Repeat for the US fall-back on 2026-11-01, asserting that a reminder
   scheduled for 1:30 a.m. (the ambiguous hour) fires exactly once.
```

In a system built like this, step 3 is where the bug usually surfaces. It comes down to storing "9:00 a.m. New York time" versus storing "14:00 UTC". The second form bakes in the rule that applied on the day the booking was created rather than what the user actually meant, so it goes wrong the moment the offset changes. The fix is to store the local time plus the IANA zone ID for every future-dated event, and only resolve it to a UTC instant at read time, not at creation time.

## Pitfalls and limits

Testing this well has real costs, and it's worth naming them rather than pretending the approach is free.

- **You can't enumerate every zone pair.** There are hundreds of IANA zones, many with their own transition dates, and some countries change their rules with little notice (Mexico abolished DST for most of the country in 2022). Pick a representative set — UTC, a zone west of Greenwich, a zone east of it, a half-hour-offset zone like `Asia/Kolkata`, and one that doesn't observe DST at all — rather than trying to cover all of them.
- **A fixed-clock test still needs a real tz database.** Mocking "now" without updating the underlying timezone data gives you tests that pass against stale rules.
- **This doesn't replace monitoring.** A rule can change in the real world (a country announces a new DST policy) faster than your test fixtures do. Tests catch known transition logic. They won't catch a government changing the rules next year.
- **Over-testing every date is wasted effort.** You don't need coverage of all 365 days. The value sits in the handful of transition dates for each zone you actually support.

## What to do next

1. Grep your codebase for date math that doesn't go through a timezone-aware library, and for any place where a future event's instant is computed and stored at creation time instead of at read time.
2. Add a small fixture: a fixed clock plus 3–4 representative IANA zones, and write one test per bug category above (missing hour, duplicate hour, cross-zone drift) rather than one generic "timezones work" test.
3. Check your job scheduler's behavior on the fall-back date specifically. It's the cheapest check with the highest payoff, since a double-fired job or notification is the most common and most visible version of this bug.
4. If you depend on Moment.js, which its own maintainers describe as a legacy project, or a similar library, flag it for replacement before the next DST transition, not after it causes a ticket.

## Sources

- [DST software bugs](https://converttime.com/en/blog/dst-software-bugs) — ConvertTime
- [Time zone handling checklist](https://axonbuild.com/blog/time-zone-handling-checklist/) — Axon Build
- [PowerProtect Cyber Recovery: Time changes may cause schedule issues](https://www.dell.com/support/kbdoc/en-il/000197427/time-change-causes-schedule-issues) — Dell Support
<!--sr-->
Zakazivač sastanaka, birač termina za dostavu, sistem podsjetnika zasnovan na cron-u — svaka funkcija koja obećava „ovo se dešava u ovo lokalno vrijeme" prije ili kasnije mora da preživi dva dana u godini kada ni samo lokalno vrijeme nije dosljedno. Prelazak na ljetnje i zimsko računanje vremena (DST) pravi sat koji ne postoji, a nekoliko mjeseci kasnije sat koji se desi dva puta. Većina test paketa ne dotakne nijedan od njih, jer se testovi izvršavaju za koji god datum je danas, a danas je rijetko dan pomjeranja sata.

![Ilustracija štoperice čiji se brojčanik lomi oko 2 i 3 sata ujutru, okružene kalendarima za mart i novembar sa zaokruženim datumima pomjeranja sata, oznakama vremenskih zona kao što su UTC, GMT, IANA, America/New_York i Europe/London, i prozorima editora koda sa ikonama baga i upozorenja](assets/blog/testing-dst-booking-bugs.jpg)

## Zašto ovo stalno iznenadi timove

Ovakav kvar nije nešto egzotično, a pogodio je i kompanije sa mnogo više iskustva u radu sa vremenom nego što ga ima većina timova koji prave funkciju rezervacija. Godine 2010. ponavljajući alarmi na iPhone-u oglašavali su se u pogrešno vrijeme nakon pomjeranja sata, prvo u Australiji i Novom Zelandu, a zatim i u Evropi, pa su se ljudi budili sat ranije ili kasnije. Godine 2007, kada su SAD produžile ljetnje računanje vremena za nekoliko sedmica, sastanci u Microsoft Outlook-u koji su padali u novi period pomjerili su se za sat, a kompanije su sedmicama ručno ispravljale kalendare. Proizvođači infrastrukture i danas objavljuju članke podrške koji upozoravaju da pomjeranje sata može poremetiti zakazane poslove — Dell ima jedan za PowerProtect Cyber Recovery. Nijedan od ovih timova nije bio nemaran. Njihov kod za rad sa vremenom radio je ispravno svakog dana osim ona dva koja su bila bitna.

Bagovi u pozadini dolaze sa kratke liste koja se stalno ponavlja:

- **Sat koji nedostaje.** Na dan pomjeranja sata unaprijed, vrijeme poput 2:30 ujutru u zoni `America/New_York` jednostavno ne postoji. Sve što je zakazano za taj trenutak ili baci grešku, ili se tiho preskoči, ili se normalizuje na vrijeme koje niko nije izabrao.
- **Sat koji se ponavlja.** Kada se sat vraća unazad, 1:30 ujutru desi se dva puta. Posao ili podsjetnik zakazan po lokalnom vremenu za taj termin može da se okine dva puta — ili, zavisno od zakazivača, nijednom.
- **Lokalno vrijeme sačuvano bez zone.** Ako se rezervacija čuva kao „goli" timestamp ili kao fiksni UTC pomak umjesto kao vrijeme plus IANA ID zone (`Europe/Berlin`, a ne `GMT+1`), rezervacija je tačna sve dok se pomak zone ne promijeni — a onda je pomjerena za sat.
- **Zakazivanje „na svaka 24 sata".** Posao podešen da se pokreće na svakih 86.400 sekundi počne da odstupa od zidnog sata čim se pomak promijeni, i upravo tako se automatski rasporedi okinu sat ranije ili kasnije odmah nakon pomjeranja sata.

## Konkretan test scenario

Uzmimo funkciju za zakazivanje sastanaka u kojoj korisnik u zoni `America/New_York` zakazuje ponavljajući poziv u 9:00 ujutru sa korisnikom u zoni `Europe/London`. Koristan test ovdje nije „zakazivanje radi". To je skup provjera vezanih za konkretne datume. U 2026. godini SAD pomjeraju sat unaprijed 8. marta, a Velika Britanija 29. marta, pa su ta dva grada tri sedmice udaljena četiri sata umjesto pet:

```text
Fiksiran sat: 2026-03-07 (dan prije pomjeranja sata u SAD)
1. Zakaži sedmični poziv u 9:00 po America/New_York, sa početkom 2026-03-01.
2. Provjeri da termin 2026-03-01 prikazuje 9:00 Njujork / 14:00 London.
3. Provjeri da termini 2026-03-08 i 2026-03-15 (nakon pomjeranja u SAD)
   i dalje prikazuju 9:00 Njujork, ali sada 13:00 London — ne 14:00,
   jer se sat u Velikoj Britaniji još nije pomjerio.
4. Provjeri da je termin 2026-03-29 (nakon pomjeranja u Velikoj Britaniji)
   ponovo 9:00 Njujork / 14:00 London.
5. Pokušaj da zakažeš jednokratni poziv u 2:30 ujutru po America/New_York
   na dan 2026-03-08 (sat koji ne postoji). Provjeri da ga sistem odbije
   ili eksplicitno normalizuje, umjesto da tiho prihvati trenutak
   koji se nikada nije desio.
6. Ponovi za vraćanje sata u SAD 2026-11-01 i provjeri da se podsjetnik
   zakazan za 1:30 ujutru (dvosmislen sat) okine tačno jednom.
```

U sistemu koji je ovako napravljen, bag obično ispliva na trećem koraku. Sve se svodi na razliku između čuvanja „9:00 po njujorškom vremenu" i čuvanja „14:00 UTC". Drugi oblik u sebe ugrađuje pravilo koje je važilo na dan kada je rezervacija napravljena, a ne ono što je korisnik zaista mislio, pa postaje pogrešan čim se pomak promijeni. Rješenje je da se za svaki budući događaj čuva lokalno vrijeme plus IANA ID zone, a da se u UTC trenutak pretvara tek pri čitanju, ne pri kreiranju.

## Zamke i ograničenja

Dobro testiranje ovoga ima stvarnu cijenu i vrijedi je imenovati, umjesto da se pretvaramo da je pristup besplatan.

- **Ne možete pokriti svaki par zona.** Postoje stotine IANA zona, mnoge sa sopstvenim datumima pomjeranja, a neke zemlje mijenjaju pravila uz malo najave (Meksiko je 2022. ukinuo pomjeranje sata za veći dio zemlje). Izaberite reprezentativan skup — UTC, zonu zapadno od Griniča, zonu istočno od njega, zonu sa pomakom od pola sata kao što je `Asia/Kolkata` i jednu koja uopšte ne pomjera sat — umjesto da pokušavate da pokrijete sve.
- **Test sa fiksiranim satom i dalje traži stvarnu tz bazu.** Ako mock-ujete „sada", a ne ažurirate podatke o vremenskim zonama ispod toga, dobijate testove koji prolaze nad zastarjelim pravilima.
- **Ovo ne zamjenjuje monitoring.** Pravilo se u stvarnom svijetu može promijeniti (država najavi novu politiku pomjeranja sata) brže nego vaši test fixture-i. Testovi hvataju poznatu logiku prelaza. Neće uhvatiti vladu koja sljedeće godine promijeni pravila.
- **Testiranje svakog datuma je bačen trud.** Ne treba vam pokrivenost svih 365 dana. Vrijednost je u nekoliko datuma prelaza za svaku zonu koju zaista podržavate.

## Šta dalje

1. Pretražite kod (grep) za računanje sa datumima koje ne ide kroz biblioteku svjesnu vremenskih zona, i za svako mjesto gdje se trenutak budućeg događaja računa i čuva pri kreiranju umjesto pri čitanju.
2. Dodajte mali fixture: fiksiran sat plus 3–4 reprezentativne IANA zone, i napišite po jedan test za svaku kategoriju baga iznad (sat koji nedostaje, sat koji se ponavlja, odstupanje između zona), umjesto jednog opšteg testa „vremenske zone rade".
3. Posebno provjerite kako se vaš zakazivač poslova ponaša na dan vraćanja sata. To je najjeftinija provjera sa najvećom koristi, jer je dvaput okinut posao ili notifikacija najčešća i najvidljivija verzija ovog baga.
4. Ako zavisite od Moment.js-a, koji sami održavaoci opisuju kao legacy projekat, ili slične biblioteke, označite je za zamjenu prije sljedećeg pomjeranja sata, a ne nakon što izazove tiket.

## Izvori

- [DST software bugs](https://converttime.com/en/blog/dst-software-bugs) — ConvertTime
- [Time zone handling checklist](https://axonbuild.com/blog/time-zone-handling-checklist/) — Axon Build
- [PowerProtect Cyber Recovery: Time changes may cause schedule issues](https://www.dell.com/support/kbdoc/en-il/000197427/time-change-causes-schedule-issues) — Dell Support
