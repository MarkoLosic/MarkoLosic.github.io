---
title: "Manually Testing Chrome and Edge Extensions: Where the Usual Playbook Breaks Down"
title_sr: "Ručno testiranje Chrome i Edge ekstenzija: gdje uobičajeni pristup prestaje da radi"
date: 2026-09-29
time: 19:45
tags: [qa, manual-testing, browser-extensions, methodology]
excerpt: Why manual testing of browser extensions needs a different checklist than testing a website, and what to check on Chrome and Edge.
excerpt_sr: Zašto ručno testiranje ekstenzija za pretraživač traži drugačiju čeklistu od testiranja web sajta, i šta provjeriti na Chrome-u i Edge-u.
image: assets/blog/manually-testing-chrome-edge-extensions.jpg
---
A browser extension looks like a small, simple thing to test manually: install it, click around, confirm it does what it's supposed to. In practice, an extension is privileged code running alongside the browser itself, with its own install paths, its own background process lifecycle, and — even though Chrome and Edge share the same rendering engine — its own platform quirks per browser. A tester who runs the same click-through script they'd use on a web page will miss most of what actually breaks extensions in production.

![Illustration of Chrome and Edge browser windows side by side with panels for service worker inspection, extension state, extension icons and permission prompts, puzzle-piece extension icons, a service worker lifecycle chart and a magnifying glass between the two browsers](assets/blog/manually-testing-chrome-edge-extensions.jpg)

## The background process doesn't behave like an open tab

Since Manifest V3, an extension's background logic runs in a service worker instead of a persistent background page, and Chrome's own documentation is explicit about how aggressively it reclaims that worker: it goes idle after about 30 seconds of inactivity, a single event handler that runs longer than 5 minutes gets shut down, and a fetch that takes more than 30 seconds to respond is also cut off. Events, API calls, and long-lived messaging connections reset that idle clock, but anything sitting quietly in memory — including plain global variables the extension's code was relying on — disappears the moment the worker terminates.

This directly changes what a manual test session should look like. A common failure mode: a tester clicks an extension's toolbar icon, triggers an action, then pauses for a minute to write up a note or check something else, and when they come back and click a second button, the extension appears to have "forgotten" the first action or throws an error. The instinct is to log it as a logic bug. Often it's actually the service worker restarting mid-session and losing state that the extension never persisted to `chrome.storage` or `IndexedDB` in the first place — a real bug, but a different one than it looks like, and one you'll only catch reliably if you deliberately build pauses into your manual test steps instead of clicking through everything in one uninterrupted burst. Opening the extension's service worker inspector from `chrome://extensions` (or `edge://extensions`) before you start testing lets you watch it go idle and restart in real time, and read whatever it logs when it wakes back up.

## Chrome and Edge are not the same extension platform

Edge is built on Chromium, and Microsoft's own porting guidance says extension APIs and manifest keys are "largely code-compatible" between the two browsers — but largely isn't entirely. Edge doesn't implement every Chrome extension API, so an extension that passes every manual check in Chrome can fail silently in Edge if it touches something outside Edge's supported API surface. Microsoft's documentation also flags smaller but real testing traps: the `update_url` manifest field has to be removed for Edge, native messaging hosts need Edge's own extension ID format in `allowed_origins` (it isn't the same ID Chrome assigns), and local testing on Edge requires sideloading the unpacked extension rather than relying on whatever install flow you used for Chrome.

The practical takeaway is that "cross-browser testing" for an extension can't mean running your Chrome test script again and eyeballing Edge for a few minutes. It means a separate manual pass against Edge's supported-API list, a check of anything the extension does with native messaging, and confirmation that the sideloaded build you're testing behaves like the signed build a real user would get from the Edge Add-ons store.

## The install-path matrix multiplies faster than it looks

Most manual test plans cover a fresh install and stop there. A more realistic matrix looks like this:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Install path</th><th>What to check</th></tr></thead>
<tbody>
<tr><td>Fresh install, default profile</td><td>Baseline functionality, permission prompts appear and are worded correctly</td></tr>
<tr><td>Update from previous version</td><td>Old stored data/settings still work; no leftover state causes a crash; new permissions (if any) are requested, not silently assumed</td></tr>
<tr><td>Multiple browser profiles</td><td>Extension state doesn't leak between profiles; per-profile settings persist correctly</td></tr>
<tr><td>Incognito / InPrivate mode</td><td>Extension behaves per its declared incognito permission (works, is disabled, or is limited, as intended — not just "whatever happens to happen")</td></tr>
<tr><td>Enterprise policy–managed profile</td><td>Extension respects admin-forced install/disable policies rather than assuming a consumer install</td></tr>
</tbody>
</table>
</div>
<!--/html-->

A short sample manual test case for the update path, written the way it should go into a test plan rather than a chat message:

```
Given: v1.4 of the extension is installed with saved user settings
When: the browser auto-updates the extension to v1.5
Then: previously saved settings are still applied
And: no new permission is silently granted without a user-visible prompt
And: the toolbar icon and popup UI load without a console error
```

Each row in that matrix is a separate manual pass, not a variation you can eyeball in passing — permission-prompt wording in particular is easy to skip past because the extension "still works" even when the prompt text is wrong or missing.

## Pitfalls and limits

Manual testing catches things automation misses — a confusing permission prompt, a broken popup layout, a first-run experience that feels off — but it doesn't scale across the real combinatorics of Chrome version × Edge version × OS × profile type × install path. Treat it as the layer that validates behavior and wording, not as your only regression net for logic that changes often; that belongs in automated checks. Watch for two misdiagnoses: attributing service-worker dormancy to application logic, and assuming a sideloaded build tested "clean" behaves identically once it goes through store signing and review — packaging and update mechanics differ from your local build in ways manual testing on the unpacked extension won't surface.

## What to do next

- Open the service worker inspector from `chrome://extensions` or `edge://extensions` before every manual session, and deliberately pause between test steps to let it go idle, instead of testing everything in one fast click-through.
- Build an install-path checklist (fresh install, update, multiple profiles, incognito, enterprise policy) and run it every release, not just for major version bumps.
- Keep a short list of Edge-unsupported APIs relevant to your extension and re-check it whenever you add a new capability, rather than assuming Chrome-tested equals Edge-tested.
- Test what happens when a user denies or later revokes a permission mid-session — not just the happy path where every permission is granted up front.

## Sources

- [Chrome Developers: Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Microsoft Edge Developer docs: Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)
- [Microsoft Edge Developer docs: Supported APIs for Microsoft Edge extensions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support)
<!--sr-->
Ekstenzija za pretraživač izgleda kao mala i jednostavna stvar za ručno testiranje: instalirate je, malo kliknete, potvrdite da radi ono što treba. U praksi, ekstenzija je privilegovani kod koji radi uz sam pretraživač, sa sopstvenim načinima instalacije, sopstvenim životnim ciklusom pozadinskog procesa i — iako Chrome i Edge dijele isti engine za prikaz — sopstvenim specifičnostima na svakom od ta dva pretraživača. Tester koji pokrene isti scenario klikanja koji bi koristio na web stranici propustiće većinu onoga što zaista kvari ekstenzije u produkciji.

![Ilustracija Chrome i Edge prozora jedan pored drugog, sa panelima za inspekciju service workera, stanje ekstenzije, ikone ekstenzija i dijaloge za dozvole, ikonama ekstenzija u obliku slagalice, grafikonom životnog ciklusa service workera i lupom između dva pretraživača](assets/blog/manually-testing-chrome-edge-extensions.jpg)

## Pozadinski proces se ne ponaša kao otvoren tab

Od Manifest V3, pozadinska logika ekstenzije radi u service workeru umjesto u trajnoj pozadinskoj stranici, a Chrome-ova dokumentacija jasno kaže koliko agresivno se taj worker gasi: prelazi u neaktivno stanje nakon otprilike 30 sekundi bez aktivnosti, pojedinačni event handler koji traje duže od 5 minuta biva prekinut, a fetch kojem odgovor treba više od 30 sekundi takođe se prekida. Događaji, API pozivi i dugotrajne konekcije za razmjenu poruka resetuju taj sat neaktivnosti, ali sve što tiho stoji u memoriji — uključujući obične globalne varijable na koje se kod ekstenzije oslanjao — nestaje onog trenutka kada se worker ugasi.

To direktno mijenja kako ručna test sesija treba da izgleda. Čest scenario greške: tester klikne na ikonu ekstenzije u traci s alatima, pokrene neku akciju, pa zastane minut da zapiše bilješku ili provjeri nešto drugo, a kada se vrati i klikne drugo dugme, ekstenzija kao da je „zaboravila" prvu akciju ili izbaci grešku. Instinkt je da se to prijavi kao greška u logici. Često je zapravo riječ o service workeru koji se restartovao usred sesije i izgubio stanje koje ekstenzija uopšte nije sačuvala u `chrome.storage` ili `IndexedDB` — stvarna greška, ali drugačija nego što izgleda, i uhvatićete je pouzdano samo ako namjerno ubacite pauze u korake ručnog testa, umjesto da sve prokliknete u jednom neprekidnom naletu. Ako prije početka testiranja otvorite inspektor service workera ekstenzije sa `chrome://extensions` (ili `edge://extensions`), možete uživo pratiti kako prelazi u neaktivno stanje i restartuje se, i pročitati šta god zapiše u log kada se ponovo probudi.

## Chrome i Edge nisu ista platforma za ekstenzije

Edge je izgrađen na Chromium-u, a Microsoft-ovo uputstvo za portovanje kaže da su API-ji ekstenzija i ključevi manifesta „uglavnom kompatibilni na nivou koda" između ta dva pretraživača — ali uglavnom nije isto što i potpuno. Edge ne implementira svaki Chrome API za ekstenzije, pa ekstenzija koja prođe svaku ručnu provjeru u Chrome-u može tiho da otkaže u Edge-u ako dotakne nešto van skupa API-ja koje Edge podržava. Microsoft-ova dokumentacija ukazuje i na manje, ali stvarne zamke za testiranje: polje `update_url` u manifestu mora se ukloniti za Edge, native messaging hostovi u `allowed_origins` trebaju Edge-ov format ID-a ekstenzije (to nije isti ID koji dodjeljuje Chrome), a lokalno testiranje na Edge-u zahtijeva sideloading raspakovane ekstenzije umjesto oslanjanja na postupak instalacije koji ste koristili za Chrome.

Praktičan zaključak je da „cross-browser testiranje" ekstenzije ne može da znači ponovno pokretanje Chrome test scenarija i nekoliko minuta letimičnog gledanja Edge-a. To znači poseban ručni prolaz u odnosu na Edge-ovu listu podržanih API-ja, provjeru svega što ekstenzija radi sa native messaging-om, i potvrdu da se sideload-ovani build koji testirate ponaša kao potpisani build koji bi stvarni korisnik dobio iz Edge Add-ons prodavnice.

## Matrica načina instalacije raste brže nego što izgleda

Većina planova ručnog testiranja pokriva novu instalaciju i tu staje. Realističnija matrica izgleda ovako:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Način instalacije</th><th>Šta provjeriti</th></tr></thead>
<tbody>
<tr><td>Nova instalacija, podrazumijevani profil</td><td>Osnovna funkcionalnost; dijalozi za dozvole se pojavljuju i ispravno su formulisani</td></tr>
<tr><td>Ažuriranje sa prethodne verzije</td><td>Stari sačuvani podaci/podešavanja i dalje rade; zaostalo stanje ne izaziva pad; nove dozvole (ako ih ima) se traže, a ne podrazumijevaju tiho</td></tr>
<tr><td>Više profila u pretraživaču</td><td>Stanje ekstenzije ne curi između profila; podešavanja po profilu se ispravno čuvaju</td></tr>
<tr><td>Incognito / InPrivate režim</td><td>Ekstenzija se ponaša u skladu sa deklarisanom incognito dozvolom (radi, isključena je ili je ograničena, kako je predviđeno — a ne „kako god ispadne")</td></tr>
<tr><td>Profil kojim upravljaju enterprise politike</td><td>Ekstenzija poštuje politike administratora za prinudnu instalaciju/isključivanje, umjesto da pretpostavlja običnu korisničku instalaciju</td></tr>
</tbody>
</table>
</div>
<!--/html-->

Kratak primjer ručnog test slučaja za ažuriranje, napisan onako kako treba da stoji u test planu, a ne u poruci u chatu:

```
Given: instalirana je verzija v1.4 ekstenzije sa sačuvanim korisničkim podešavanjima
When: pretraživač automatski ažurira ekstenziju na v1.5
Then: prethodno sačuvana podešavanja se i dalje primjenjuju
And: nijedna nova dozvola nije tiho odobrena bez vidljivog dijaloga za korisnika
And: ikona u traci s alatima i popup se učitavaju bez greške u konzoli
```

Svaki red u toj matrici je poseban ručni prolaz, a ne varijacija koju možete usput pogledati — posebno je lako preskočiti tekst dijaloga za dozvole, jer ekstenzija „i dalje radi" čak i kada je tekst pogrešan ili ga nema.

## Zamke i ograničenja

Ručno testiranje hvata ono što automatizacija propušta — zbunjujući dijalog za dozvole, pokvaren raspored popup-a, prvo pokretanje koje djeluje čudno — ali se ne skalira preko stvarnih kombinacija Chrome verzija × Edge verzija × OS × tip profila × način instalacije. Tretirajte ga kao sloj koji potvrđuje ponašanje i formulacije, a ne kao jedinu regresionu mrežu za logiku koja se često mijenja; to pripada automatizovanim provjerama. Pazite na dvije pogrešne dijagnoze: pripisivanje uspavljivanja service workera logici aplikacije, i pretpostavku da će se sideload-ovani build koji je „čisto" prošao testiranje ponašati identično kada prođe potpisivanje i reviziju u prodavnici — pakovanje i mehanizam ažuriranja razlikuju se od vašeg lokalnog builda na načine koje ručno testiranje raspakovane ekstenzije neće otkriti.

## Šta dalje

- Otvorite inspektor service workera sa `chrome://extensions` ili `edge://extensions` prije svake ručne sesije i namjerno pravite pauze između koraka da bi prešao u neaktivno stanje, umjesto da sve testirate u jednom brzom prolazu.
- Napravite čeklistu načina instalacije (nova instalacija, ažuriranje, više profila, incognito, enterprise politike) i prolazite je na svakoj objavi, a ne samo kod većih verzija.
- Vodite kratku listu API-ja koje Edge ne podržava, a koji su relevantni za vašu ekstenziju, i ponovo je provjerite kad god dodate novu mogućnost, umjesto da pretpostavite da testirano u Chrome-u znači testirano u Edge-u.
- Testirajte šta se dešava kada korisnik odbije ili kasnije opozove dozvolu usred sesije — ne samo srećan scenario u kojem je svaka dozvola odobrena unaprijed.

## Izvori

- [Chrome Developers: Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Microsoft Edge Developer docs: Port a Chrome extension to Microsoft Edge](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension)
- [Microsoft Edge Developer docs: Supported APIs for Microsoft Edge extensions](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support)
