---
title: "Manual Testing for Mobile Apps: Why Interruptions Matter More Than Happy-Path Clicks"
title_sr: "Ručno testiranje mobilnih aplikacija: zašto su prekidi važniji od klikanja po srećnom scenariju"
date: 2026-09-29
time: 20:00
tags: [qa, manual-testing, mobile, methodology]
excerpt: A practical guide to manually testing how mobile apps handle backgrounding, calls, low battery, and dropped connections.
excerpt_sr: Praktičan vodič za ručno testiranje toga kako se mobilne aplikacije nose sa prelaskom u pozadinu, pozivima, slabom baterijom i prekinutom konekcijom.
image: assets/blog/manual-testing-mobile-apps-interruptions.jpg
---
A mobile app rarely fails in the quiet, uninterrupted lab conditions most manual test scripts assume. It fails when a phone call interrupts checkout, when the OS kills the app in the background to reclaim memory, when the connection drops mid-upload on a train, or when the user locks the screen halfway through filling out a form. Clicking through every screen on a plugged-in emulator confirms the app works when nothing goes wrong — which is exactly the condition real users are least often in.

![Illustration of a hand holding a phone with a sign-in screen, surrounded by an incoming call dialog, a low battery icon, crossed-out Wi-Fi and airplane icons, and an app lifecycle flow from active to background, suspended and terminated](assets/blog/manual-testing-mobile-apps-interruptions.jpg)

## The states your app actually lives in

An iOS app moves through five distinct states worth testing separately: active (in full use), background (still running a task like a location update or download), suspended (in memory but doing nothing), inactive (a brief transition during an interruption like an incoming call), and not running (terminated, requiring a fresh launch). Ministry of Testing's overview of iOS lifecycle testing frames the risk plainly: apps that don't handle these transitions correctly produce data loss, crashes, and behavior that looks fine in a demo and falls apart in the field.

Android has its own version of this problem, enforced more aggressively by the OS itself. Google's own documentation on background work restrictions describes how the system can flag an app for excessive background activity — holding a wake lock for over an hour with the screen off, or running too many background services — and once flagged, that app loses the ability to run jobs, trigger alarms, or use the network outside the foreground. An app that assumes it can finish a background sync whenever it wants can simply be cut off mid-task by the platform, and the only way to see that is to put the app in exactly that situation and watch what happens.

## Simulating interruptions on a real device

The manual test that actually catches these bugs isn't "open the app and check the screen" — it's "start an action, interrupt it deliberately, and check what the app remembers." A concrete session looks like this:

- Start filling out a multi-field form (an order, a profile, a support ticket), then background the app by switching to another app or hitting the home button. Return after a minute and confirm the in-progress data is still there, not silently discarded.
- Begin a file upload or a checkout submission, then toggle airplane mode on and back off mid-request. Confirm the app either resumes, retries, or shows a clear failure state — not a spinner that never resolves and never tells the user anything.
- Trigger a real interruption on a physical device — an incoming call, a calendar alert, a low-battery warning — while a critical flow like payment or login is in progress, then confirm the app resumes correctly (or in the case of low-battery warnings, doesn't silently lose state if the OS suspends it).
- Force-kill the app from the task switcher, then relaunch it cold. This is a different test than background-and-return: confirm the user is still logged in, the last screen or an appropriate default loads, and no crash-on-launch happens from stale cached state.

On Android, you can force some of these background conditions directly instead of waiting for the OS to trigger them naturally:

```bash
# Simulate the OS restricting the app's background activity
adb shell cmd appops set <package_name> RUN_IN_BACKGROUND ignore

# Confirm the app degrades gracefully: no crash, a clear
# "reconnecting" or "paused" state instead of a silent hang

# Restore normal background behavior once the check is done
adb shell cmd appops set <package_name> RUN_IN_BACKGROUND allow
```

A short matrix makes the coverage explicit instead of ad hoc:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>App state / trigger</th><th>Manual action</th><th>What to verify</th></tr></thead>
<tbody>
<tr><td>Backgrounded mid-form</td><td>Switch apps, wait, return</td><td>Entered data is preserved</td></tr>
<tr><td>Backgrounded mid-network-call</td><td>Toggle airplane mode during the request</td><td>Clear retry or failure state, no infinite spinner</td></tr>
<tr><td>Real interruption (call, alert)</td><td>Trigger during a critical flow on a physical device</td><td>Flow resumes correctly after the interruption clears</td></tr>
<tr><td>Force-killed, then relaunched</td><td>Kill from task switcher, cold-start</td><td>Session/login persists; no crash-on-launch</td></tr>
<tr><td>Low memory / background restriction</td><td><code>adb shell cmd appops set ... ignore</code> (Android)</td><td>App degrades gracefully instead of silently failing</td></tr>
</tbody>
</table>
</div>
<!--/html-->

## Pitfalls and limits

Interruption testing is slower than a straight click-through, and it doesn't scale to every OS version, device, and interruption combination — so it needs to be prioritized by where a failure actually costs something: payment, authentication, and anything that captures user input the user would be angry to lose. Emulators make a reasonable first pass but can't fully substitute for a real device: real incoming calls, genuine low-battery states, and the specific way a mid-range or older phone reclaims memory under pressure are hard to simulate accurately in a virtual environment, and state-restoration bugs disproportionately show up on exactly the low-end devices many teams don't keep in their test pool. It's also easy to test backgrounding and forget the separate case of force-kill-and-relaunch — the two produce different bugs, and passing one doesn't mean the other works. None of this replaces automated regression for logic that changes often; manual interruption testing is best treated as a periodic, risk-prioritized pass on critical flows, not the only net catching state bugs before release.

## What to do next

- Build a short interruption matrix (like the one above) for each critical user flow — payment, login, and anything with a multi-step form — and run it as a standard part of pre-release testing, not an occasional spot check.
- Keep at least one real, non-flagship device in rotation for this kind of testing; low-memory conditions and real interruptions behave differently than they do on a simulator or a high-end phone.
- Test force-kill-and-relaunch as its own case, separate from simple backgrounding — they exercise different code paths and fail differently.
- On Android, use `adb shell cmd appops set <package> RUN_IN_BACKGROUND ignore` to force a background restriction on demand instead of waiting for the OS to trigger one naturally during a test session.

## Sources

- [Ministry of Testing: 10 ways to test iOS apps across different states and lifecycle stages](https://www.ministryoftesting.com/articles/10-ways-to-test-ios-apps-across-different-states-and-lifecycle-stages)
- [Android Developers: System restrictions on background tasks](https://developer.android.com/develop/background-work/background-tasks/bg-work-restrictions)
<!--sr-->
Mobilna aplikacija rijetko otkaže u mirnim, neometanim laboratorijskim uslovima koje pretpostavlja većina scenarija za ručno testiranje. Otkaže kada telefonski poziv prekine checkout, kada operativni sistem ugasi aplikaciju u pozadini da oslobodi memoriju, kada konekcija pukne usred otpremanja fajla u vozu, ili kada korisnik zaključa ekran na pola popunjavanja forme. Klikanje kroz svaki ekran na emulatoru priključenom na struju potvrđuje da aplikacija radi kada ništa ne pođe po zlu — a upravo u tom stanju su stvarni korisnici najrjeđe.

![Ilustracija ruke koja drži telefon sa ekranom za prijavu, okružen dijalogom dolaznog poziva, ikonom prazne baterije, precrtanim Wi-Fi i avionskim ikonama, i tokom životnog ciklusa aplikacije od aktivnog stanja preko pozadine i suspendovanog stanja do prekida rada](assets/blog/manual-testing-mobile-apps-interruptions.jpg)

## Stanja u kojima vaša aplikacija zaista živi

iOS aplikacija prolazi kroz pet različitih stanja koja vrijedi testirati zasebno: active (aktivno korišćenje), background (i dalje izvršava zadatak, npr. ažuriranje lokacije ili preuzimanje), suspended (u memoriji, ali ne radi ništa), inactive (kratak prelaz tokom prekida kao što je dolazni poziv) i not running (ugašena, zahtijeva novo pokretanje). Pregled Ministry of Testing-a o testiranju životnog ciklusa iOS aplikacija jasno opisuje rizik: aplikacije koje ne obrađuju ove prelaze ispravno dovode do gubitka podataka, padova i ponašanja koje u demo prikazu izgleda dobro, a u stvarnoj upotrebi se raspada.

Android ima svoju verziju ovog problema, koju sam operativni sistem sprovodi još agresivnije. Google-ova dokumentacija o ograničenjima rada u pozadini opisuje kako sistem može da označi aplikaciju zbog prekomjerne aktivnosti u pozadini — držanja wake lock-a duže od sat vremena sa ugašenim ekranom ili pokretanja previše pozadinskih servisa — a kada je označena, aplikacija gubi mogućnost da pokreće poslove, aktivira alarme ili koristi mrežu van prvog plana. Aplikacija koja pretpostavlja da može da završi sinhronizaciju u pozadini kad god hoće može jednostavno biti prekinuta od strane platforme usred zadatka, a jedini način da to vidite je da aplikaciju stavite upravo u tu situaciju i posmatrate šta se dešava.

## Simuliranje prekida na stvarnom uređaju

Ručni test koji zaista hvata ove greške nije „otvori aplikaciju i provjeri ekran" — već „pokreni akciju, namjerno je prekini i provjeri šta aplikacija pamti". Konkretna sesija izgleda ovako:

- Počnite da popunjavate formu sa više polja (narudžbu, profil, tiket za podršku), pa pošaljite aplikaciju u pozadinu prelaskom na drugu aplikaciju ili pritiskom na home dugme. Vratite se nakon minut i potvrdite da su uneseni podaci i dalje tu, a ne tiho odbačeni.
- Započnite otpremanje fajla ili slanje checkout-a, pa usred zahtjeva uključite i ponovo isključite avionski režim. Potvrdite da aplikacija ili nastavlja, ili pokušava ponovo, ili prikazuje jasno stanje greške — a ne spinner koji se nikad ne završi i korisniku ništa ne kaže.
- Izazovite stvaran prekid na fizičkom uređaju — dolazni poziv, obavještenje iz kalendara, upozorenje o slaboj bateriji — dok je u toku kritičan tok kao što je plaćanje ili prijava, pa potvrdite da se aplikacija ispravno nastavlja (odnosno, kod upozorenja o slaboj bateriji, da tiho ne izgubi stanje ako je OS suspenduje).
- Prinudno ugasite aplikaciju iz prebacivača zadataka, pa je pokrenite ispočetka (cold start). Ovo je drugačiji test od odlaska u pozadinu i povratka: potvrdite da je korisnik i dalje prijavljen, da se učitava posljednji ekran ili odgovarajući podrazumijevani, i da nema pada pri pokretanju zbog zastarjelog keširanog stanja.

Na Android-u neke od ovih pozadinskih uslova možete izazvati direktno, umjesto da čekate da ih OS prirodno pokrene:

```bash
# Simulirajte da OS ograničava aktivnost aplikacije u pozadini
adb shell cmd appops set <package_name> RUN_IN_BACKGROUND ignore

# Potvrdite da aplikacija elegantno degradira: bez pada, sa jasnim
# stanjem "ponovno povezivanje" ili "pauzirano" umjesto tihog zastoja

# Vratite normalno ponašanje u pozadini kada završite provjeru
adb shell cmd appops set <package_name> RUN_IN_BACKGROUND allow
```

Kratka matrica čini pokrivenost eksplicitnom umjesto improvizovanom:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Stanje aplikacije / okidač</th><th>Ručna akcija</th><th>Šta provjeriti</th></tr></thead>
<tbody>
<tr><td>U pozadini usred forme</td><td>Prebacite se na drugu aplikaciju, sačekajte, vratite se</td><td>Uneseni podaci su sačuvani</td></tr>
<tr><td>U pozadini usred mrežnog poziva</td><td>Uključite/isključite avionski režim tokom zahtjeva</td><td>Jasno stanje ponovnog pokušaja ili greške, bez beskonačnog spinnera</td></tr>
<tr><td>Stvaran prekid (poziv, obavještenje)</td><td>Izazovite ga tokom kritičnog toka na fizičkom uređaju</td><td>Tok se ispravno nastavlja nakon što prekid prođe</td></tr>
<tr><td>Prinudno ugašena, pa ponovo pokrenuta</td><td>Ugasite iz prebacivača zadataka, cold start</td><td>Sesija/prijava ostaje; nema pada pri pokretanju</td></tr>
<tr><td>Malo memorije / ograničenje rada u pozadini</td><td><code>adb shell cmd appops set ... ignore</code> (Android)</td><td>Aplikacija elegantno degradira umjesto da tiho otkaže</td></tr>
</tbody>
</table>
</div>
<!--/html-->

## Zamke i ograničenja

Testiranje prekida je sporije od običnog prolaska klikanjem i ne skalira se na svaku kombinaciju verzije OS-a, uređaja i vrste prekida — zato mu prioritet treba odrediti prema tome gdje greška zaista nešto košta: plaćanje, autentifikacija i sve što prikuplja korisnički unos za čijim bi gubitkom korisnik bio ljut. Emulatori su razuman prvi prolaz, ali ne mogu u potpunosti zamijeniti stvaran uređaj: stvarne dolazne pozive, pravo stanje slabe baterije i specifičan način na koji telefon srednje klase ili stariji telefon oslobađa memoriju pod pritiskom teško je precizno simulirati u virtuelnom okruženju, a greške u vraćanju stanja se nesrazmjerno često javljaju upravo na slabijim uređajima koje mnogi timovi nemaju u svom skupu za testiranje. Takođe je lako testirati odlazak u pozadinu i zaboraviti poseban slučaj prinudnog gašenja i ponovnog pokretanja — ta dva scenarija proizvode različite greške, i to što jedan prolazi ne znači da drugi radi. Ništa od ovoga ne zamjenjuje automatizovanu regresiju za logiku koja se često mijenja; ručno testiranje prekida najbolje je tretirati kao periodičan prolaz kroz kritične tokove, sa prioritetom prema riziku, a ne kao jedinu mrežu koja hvata greške u stanju prije objave.

## Šta dalje

- Napravite kratku matricu prekida (kao ova iznad) za svaki kritičan korisnički tok — plaćanje, prijavu i sve što ima formu u više koraka — i pokrećite je kao standardan dio testiranja prije objave, a ne kao povremenu provjeru.
- Držite bar jedan stvaran uređaj koji nije flagship u rotaciji za ovakvo testiranje; uslovi sa malo memorije i stvarni prekidi ponašaju se drugačije nego na simulatoru ili skupom telefonu.
- Testirajte prinudno gašenje i ponovno pokretanje kao zaseban slučaj, odvojeno od običnog odlaska u pozadinu — prolaze kroz različite dijelove koda i otkazuju na različite načine.
- Na Android-u koristite `adb shell cmd appops set <package> RUN_IN_BACKGROUND ignore` da po potrebi izazovete ograničenje rada u pozadini, umjesto da čekate da ga OS prirodno pokrene tokom test sesije.

## Izvori

- [Ministry of Testing: 10 ways to test iOS apps across different states and lifecycle stages](https://www.ministryoftesting.com/articles/10-ways-to-test-ios-apps-across-different-states-and-lifecycle-stages)
- [Android Developers: System restrictions on background tasks](https://developer.android.com/develop/background-work/background-tasks/bg-work-restrictions)
