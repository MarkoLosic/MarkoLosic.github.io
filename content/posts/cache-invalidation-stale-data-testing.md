---
title: "Why Does a Website Sometimes Show the Old Price? A Plain-English Guide to Caching Bugs"
title_sr: "Zašto sajt ponekad prikazuje staru cijenu? Jednostavno objašnjenje keš bugova"
date: 2026-11-27
time: 09:00
tags: [real-world-bugs, test-strategy]
excerpt: A simple explanation of why websites sometimes show outdated information, and how testers catch these bugs before users do.
excerpt_sr: Jednostavno objašnjenje zašto sajtovi ponekad prikazuju zastarjele informacije i kako testeri hvataju ove bugove prije korisnika.
image: assets/blog/cache-invalidation-stale-data-testing.jpg
---
You check a product page and it says $40. You buy it, and at checkout it suddenly charges $35, because the store lowered the price an hour ago. Nobody did anything wrong — the website just hadn't "caught up" yet. This kind of glitch has a name in software: a caching bug. It's one of the most common, most annoying, and most avoidable problems in modern websites and apps, and it's a good example of why testing software is harder than it looks.

![A browser showing a product page with a $40 sticky note covering the real $35 price, connected by dashed lines to two server stacks and a database](assets/blog/cache-invalidation-stale-data-testing.jpg)

## What "caching" actually means

Imagine every time you wanted to know today's weather, you had to call the national weather service directly. That would be slow, and if a million people called at once, the phone lines would melt down. So instead, your weather app checks once, writes the answer on a sticky note, and shows you the sticky note the next ten times you ask — instead of calling again each time.

That sticky note is a cache. Websites do the same thing with almost everything: product prices, your profile picture, search results, news articles. Instead of asking the main database every single time (which would be slow and expensive), they save a quick copy and hand that out instead.

The problem starts when the real answer changes but nobody updates the sticky note. The weather service says it's raining now, but your app is still showing yesterday's sunny forecast, because it never bothered to check again.

## Why one sticky note isn't the whole story

Here's where it gets trickier: a modern website usually has several sticky notes, not just one, stacked in different places between you and the real database:

- One copy sits on **your own phone or browser**.
- Another copy sits at a **delivery center near your city** (companies use these so pages load fast no matter where you are).
- Another copy sits on the **company's own servers**.

Each of these copies gets refreshed on its own schedule, with no guarantee the others get the memo at the same time. So when a company updates a price, it's entirely possible that:

- The internal dashboard shows the new price immediately (because it skips all the sticky notes and talks straight to the database).
- Someone in another city still sees the old price for the next ten minutes, because the copy sitting near them hasn't been told to refresh yet.
- Someone using the mobile app sees a different, even older price, because the app checks a different sticky note that nobody remembered to update at all.

To the team, the bug looks fixed — the one copy they happened to check was correct. To the customer stuck looking at an old price, it very much isn't.

## A related trap: the "note on the wrong note"

Sometimes the sticky notes themselves get mislabeled. Picture a filing system where one clerk labels folders "Customer - Smith" and another clerk, working from a slightly different instruction sheet, labels the same folders "Customer - Smith - English version." When the first clerk is told "delete the old Smith file," they delete their own label just fine — but the second clerk's folder, with the slightly different label, never gets touched. From the outside, it looks like nothing was deleted at all, because somewhere there's still a folder with Smith's old information sitting untouched.

This happens in software constantly: the part of the system that writes new data builds its "label" slightly differently than the part that reads data back, and the two quietly drift apart over months of small changes. Nobody notices until a customer reports seeing information that should have been gone.

## Why this is hard to test (and why it isn't anyone's fault)

Testers sometimes check a single sticky note, see the "it's fixed" update show up, and sign off — without knowing there are five other sticky notes elsewhere that never got checked at all. It's not laziness; most testing environments used during development don't even include all those extra copies, so the bug is often physically impossible to spot until it reaches real users in the real world with the real setup.

There's also a case where showing slightly old information on purpose is completely fine. Many systems are designed to show a slightly outdated version for a few seconds while quietly fetching the new one in the background — a deliberate trade so the page loads instantly instead of making you wait. That's not a bug; that's a reasonable design choice. The real bug is when "slightly outdated" turns into "outdated for an hour because nothing ever refreshed it."

## What this means for you as a reader

If you ever see a website showing something that seems wrong — an old price, a changed setting that didn't stick, information that should have updated but didn't — a simple refresh sometimes fixes it instantly, because it forces your own device to throw away its sticky note and ask again. If refreshing doesn't help, that's a sign the problem lives further upstream, in one of the other copies you can't personally clear — which is exactly the kind of thing worth reporting to the company rather than assuming you did something wrong.

For teams building these systems, the fix isn't more cleverness — it's being honest about how many separate copies actually exist, testing all of them together rather than just the easiest one to check, and deliberately deciding how "slightly outdated" is allowed to be before it counts as broken.

<!--sr-->

Otvoriš stranicu proizvoda i piše $40. Kupiš ga, a na plaćanju ti odjednom naplati $35, jer je prodavnica spustila cijenu prije sat vremena. Niko nije ništa pogriješio — sajt jednostavno još nije "sustigao" promjenu. Ovakva greška u softveru ima ime: keš bug. To je jedan od najčešćih, najdosadnijih i najlakše izbježnih problema u modernim sajtovima i aplikacijama, i dobar primjer zašto je testiranje softvera teže nego što izgleda.

![Pregledač sa stranicom proizvoda na kojoj ceduljica sa cijenom od $40 prekriva stvarnu cijenu od $35, povezan isprekidanim linijama sa dva servera i bazom podataka](assets/blog/cache-invalidation-stale-data-testing.jpg)

## Šta zapravo znači "keširanje"

Zamisli da svaki put kad želiš da znaš današnju prognozu moraš direktno da zoveš državni hidrometeorološki zavod. To bi bilo sporo, a kad bi milion ljudi zvalo u isto vrijeme, telefonske linije bi se zagušile. Zato tvoja aplikacija za vrijeme provjeri jednom, zapiše odgovor na ceduljicu i narednih deset puta kad pitaš pokaže ti tu ceduljicu — umjesto da svaki put ponovo zove.

Ta ceduljica je keš. Sajtovi isto rade sa skoro svime: cijenama proizvoda, tvojom profilnom slikom, rezultatima pretrage, vijestima. Umjesto da svaki put pitaju glavnu bazu podataka (što bi bilo sporo i skupo), sačuvaju brzu kopiju i daju nju.

Problem počinje kad se pravi odgovor promijeni, a niko ne ažurira ceduljicu. Zavod kaže da sad pada kiša, ali tvoja aplikacija i dalje prikazuje jučerašnju sunčanu prognozu, jer se nije potrudila da ponovo provjeri.

## Zašto jedna ceduljica nije cijela priča

Tu postaje komplikovanije: moderan sajt obično nema jednu, nego nekoliko ceduljica, raspoređenih na različitim mjestima između tebe i prave baze podataka:

- Jedna kopija stoji na **tvom telefonu ili pregledaču**.
- Druga kopija stoji u **distributivnom centru blizu tvog grada** (kompanije ih koriste da bi se stranice brzo učitavale bez obzira gdje se nalaziš).
- Treća kopija stoji na **serverima same kompanije**.

Svaka od ovih kopija se osvježava po svom rasporedu, bez garancije da će i ostale dobiti obavještenje u isto vrijeme. Zato je, kad kompanija promijeni cijenu, sasvim moguće da:

- Interni dashboard odmah prikaže novu cijenu (jer preskače sve ceduljice i pita direktno bazu).
- Neko u drugom gradu još deset minuta vidi staru cijenu, jer kopiji blizu njega još niko nije rekao da se osvježi.
- Neko u mobilnoj aplikaciji vidi drugačiju, još stariju cijenu, jer aplikacija čita drugu ceduljicu koju se niko nije sjetio da ažurira.

Timu bug izgleda popravljeno — jedina kopija koju su slučajno provjerili je bila tačna. Kupcu koji gleda staru cijenu, nikako nije.

## Srodna zamka: "pogrešna etiketa"

Ponekad same ceduljice dobiju pogrešnu etiketu. Zamisli arhivu u kojoj jedan službenik označava fascikle sa "Kupac - Petrović", a drugi, koji radi po malo drugačijem uputstvu, iste fascikle označava sa "Kupac - Petrović - engleska verzija". Kad prvom službeniku kažu "obriši staru Petrovićevu fasciklu", on bez problema obriše svoju — ali fascikla drugog službenika, sa malo drugačijom etiketom, ostaje netaknuta. Spolja izgleda kao da ništa nije obrisano, jer negdje i dalje stoji fascikla sa Petrovićevim starim podacima.

Ovo se u softveru dešava stalno: dio sistema koji upisuje nove podatke pravi svoju "etiketu" malo drugačije od dijela koji te podatke čita, i ta dva dijela se tiho razilaze kroz mjesece sitnih izmjena. Niko to ne primijeti dok kupac ne prijavi da vidi podatke koji je trebalo da nestanu.

## Zašto je ovo teško testirati (i zašto to nije ničija krivica)

Testeri ponekad provjere jednu ceduljicu, vide da se "popravljeno" pojavilo i odobre — ne znajući da negdje postoji još pet ceduljica koje niko nije ni pogledao. To nije lijenost; većina testnih okruženja koja se koriste tokom razvoja uopšte nema sve te dodatne kopije, pa je bug često fizički nemoguće uočiti dok ne stigne do pravih korisnika, u pravom svijetu, sa pravom postavkom.

Postoji i slučaj kad je namjerno prikazivanje malo starijih podataka sasvim u redu. Mnogi sistemi su napravljeni tako da nekoliko sekundi prikazuju malo zastarjelu verziju dok u pozadini tiho preuzimaju novu — svjesna razmjena da bi se stranica učitala odmah umjesto da čekaš. To nije bug; to je razumna dizajnerska odluka. Pravi bug je kad "malo zastarjelo" postane "zastarjelo sat vremena jer ništa nikad nije osvježeno".

## Šta ovo znači za tebe kao čitaoca

Ako ikad vidiš da sajt prikazuje nešto što ne izgleda kako treba — staru cijenu, promijenjeno podešavanje koje se nije sačuvalo, informaciju koja je trebalo da se ažurira, a nije — običan refresh ponekad to odmah popravi, jer natjera tvoj uređaj da baci svoju ceduljicu i pita ponovo. Ako refresh ne pomogne, to je znak da je problem dalje u lancu, u nekoj od kopija koje ti ne možeš da očistiš — a to je upravo ono što vrijedi prijaviti kompaniji, umjesto da misliš da si ti nešto pogriješio.

Za timove koji prave ovakve sisteme, rješenje nije veća domišljatost — nego iskrenost o tome koliko odvojenih kopija zaista postoji, testiranje svih njih zajedno umjesto samo one koju je najlakše provjeriti, i svjesna odluka koliko "malo zastarjelo" smije da bude prije nego što se računa kao greška.
