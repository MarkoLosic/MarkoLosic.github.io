---
title: Why Maestro Deserves a Spot in Your Web Testing Toolkit
title_sr: Zašto Maestro zaslužuje mjesto u vašem alatu za testiranje web aplikacija
date: 2026-09-21
tags: [testing, automation, maestro]
excerpt: Maestro is known as a mobile UI testing tool, but its browser support quietly closes the gap with web testing. Here's why I reach for it, and how to write your first flow.
excerpt_sr: Maestro je poznat kao alat za testiranje mobilnih aplikacija, ali podrška za pretraživač tiho zatvara jaz prema web testiranju. Evo zašto ga koristim, i kako napisati svoj prvi tok.
---
I've used Maestro for a while now to automate mobile flows — onboarding, login, the usual suspects. What changed my mind about it recently is that the same tool now speaks browser too. Not as a Playwright replacement, but as something genuinely useful sitting next to it. Here's the case for giving it a try on your web app.

## What Maestro actually is

Maestro is a UI testing framework built around one idea: you describe *what* a user does, not *how* the framework should find and click a button. A flow is a plain YAML file, read top to bottom like a checklist:

```yaml
url: https://example.com
---
- launchApp
- tapOn: "Sign in"
- inputText: "user@example.com"
- tapOn: "Password"
- inputText: "correct horse battery staple"
- tapOn: "Log in"
- assertVisible: "Welcome back"
```

No selectors to hunt for, no explicit waits. Maestro retries each step until the element it's looking for shows up or a timeout is hit, which quietly removes a huge chunk of the flakiness that usually creeps into UI suites — the kind where a test fails because a button rendered 300ms later than usual, not because anything is actually broken.

## From mobile flows to the browser

Maestro started as a mobile-only tool, and mobile is still where it's most mature. But browser support (currently in beta, running on Chromium) means the exact same syntax now works against a website: swap the app's `appId` for a `url`, and the commands underneath — `tapOn`, `inputText`, `assertVisible` — behave the same way they do on an Android emulator or an iOS simulator.

That convergence is the actual pitch. If your product has both a mobile app and a web app — which describes most products I've tested — you no longer need two separate mental models to smoke-test the critical paths on each. One flow format, one CLI, one place to look when a release breaks something.

## Where it earns its place next to Playwright and Cypress

I'm not retiring Playwright or Cypress, and I don't think you should either. But Maestro fills a gap they don't:

- **Readable by anyone.** A Maestro flow reads like a script a non-engineer could review, or even write. That matters when a manual tester or a product owner wants to sanity-check what "automated" actually covers.
- **Flakiness handling is the default, not something you configure.** Retry-until-visible behaviour is built in, so you spend less time fighting timing issues and more time writing the next flow.
- **Maestro Studio.** Point it at a running app or page and it lets you click around while it generates the YAML for you. It's a fast way to draft a flow, or to explore an unfamiliar screen before writing assertions by hand.
- **One framework for onboarding new testers.** Teaching someone Maestro's dozen or so commands is a much shorter ramp than teaching them a full Playwright test suite's conventions.

## Where it doesn't (yet) replace your web suite

Worth being upfront about this, because overselling a tool wastes everyone's time:

- Web support is Chromium-only and still beta. There's no cross-browser coverage, so it can't be your only regression tool if Firefox or Safari quirks matter to you.
- It doesn't have Playwright's request interception, tracing, or network mocking depth. For deep functional coverage of edge cases, I still reach for Playwright.
- I treat it as a smoke-test and critical-path tool — login, checkout, the flow that would be a production incident if it silently broke — not as a replacement for a full assertion-heavy regression suite.

## Writing and running your first web flow

Getting started takes about five minutes:

1. Install the CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Open Maestro Studio to explore a page and generate commands as you click: `maestro studio`
3. Save a flow as a `.yaml` file and run it: `maestro test login.yaml`
4. Wire that same command into CI, right alongside your existing mobile Maestro flows, so a broken login page fails the build exactly like a broken login screen would.

## My take

I still write my deep, assertion-heavy web regression suites in Playwright. But for the handful of flows where a failure means "the site is actually down for users," Maestro's browser support gives me the same low-maintenance, readable checks I already trust for mobile — without asking the team to learn a second tool just for the web side. That's a good trade.
<!--sr-->
Maestro već neko vrijeme koristim za automatizaciju mobilnih tokova — uvodni tok, prijava, uobičajene stvari. Ono što me nedavno navelo da ga sagledam drugačije jeste da isti alat sada "govori" i jezik pretraživača. Ne kao zamjena za Playwright, nego kao nešto što ozbiljno ima smisla postaviti pored njega. Evo zašto vrijedi probati na vašoj web aplikaciji.

## Šta je Maestro zapravo

Maestro je alat za testiranje korisničkog interfejsa izgrađen oko jedne ideje: opisujete *šta* korisnik radi, a ne *kako* alat treba da pronađe i klikne dugme. Tok je obična YAML datoteka, koja se čita od vrha ka dnu kao spisak koraka:

```yaml
url: https://example.com
---
- launchApp
- tapOn: "Sign in"
- inputText: "user@example.com"
- tapOn: "Password"
- inputText: "correct horse battery staple"
- tapOn: "Log in"
- assertVisible: "Welcome back"
```

Nema traženja selektora, nema eksplicitnih čekanja. Maestro ponavlja svaki korak dok se element koji traži ne pojavi ili dok ne istekne vrijeme, čime se tiho uklanja velik dio nestabilnosti koja se inače uvuče u UI testove — one situacije kad test padne jer se dugme pojavilo 300ms kasnije nego obično, a ne zato što je nešto zaista pokvareno.

## Od mobilnih tokova do pretraživača

Maestro je počeo kao alat isključivo za mobilne aplikacije, i mobilni dio mu je i dalje najzreliji. Ali podrška za pretraživač (trenutno u beta verziji, na Chromium-u) znači da ista sintaksa sada radi i na sajtu: umjesto aplikacionog `appId`, upišete `url`, a komande ispod — `tapOn`, `inputText`, `assertVisible` — ponašaju se isto kao na Android emulatoru ili iOS simulatoru.

To spajanje je zapravo suština priče. Ako vaš proizvod ima i mobilnu i web aplikaciju — što opisuje većinu proizvoda koje sam testirao — više vam ne trebaju dva odvojena načina razmišljanja da biste "dimno" (smoke) testirali ključne tokove na oba. Jedan format toka, jedan CLI, jedno mjesto gdje gledate kad izdanje nešto pokvari.

## Gdje se uklapa pored Playwright-a i Cypress-a

Ne penzionišem Playwright ni Cypress, i mislim da ni vi ne biste trebali. Ali Maestro popunjava prazninu koju oni ne pokrivaju:

- **Čitljiv svakome.** Maestro tok se čita kao skripta koju bi mogla pregledati, pa i napisati, osoba koja nije programer. To je bitno kad ručni tester ili product owner želi da provjeri šta "automatizovano" zapravo pokriva.
- **Rješavanje nestabilnosti je podrazumijevano, ne nešto što se dodatno podešava.** Ponašanje "pokušavaj dok se ne pojavi" je ugrađeno, pa manje vremena trošite na borbu s tajmingom, a više na pisanje sljedećeg toka.
- **Maestro Studio.** Usmjerite ga na pokrenutu aplikaciju ili stranicu i on vam dozvoljava da klikćete okolo dok on sam generiše YAML. Brz je način da napravite nacrt toka ili istražite nepoznat ekran prije nego ručno pišete provjere.
- **Jedan alat za uvođenje novih testera.** Naučiti nekoga desetak Maestro komandi mnogo je kraći put nego naučiti ga konvencijama cijelog Playwright testnog skupa.

## Gdje (još) ne zamjenjuje vaš web testni skup

Vrijedi biti iskren oko ovoga, jer preprodavanje alata samo oduzima svima vrijeme:

- Podrška za pretraživač radi samo na Chromium-u i i dalje je beta. Nema pokrivenosti više pretraživača, pa ne može biti jedini alat za regresiju ako vam Firefox ili Safari specifičnosti nešto znače.
- Nema Playwright-ovu dubinu presretanja zahtjeva, praćenja (tracing) ili mokovanja mreže. Za dublju funkcionalnu pokrivenost rubnih slučajeva i dalje posežem za Playwright-om.
- Tretiram ga kao alat za dimne testove (smoke test) i ključne tokove — prijava, plaćanje, tok čiji bi tihi kvar bio produkcioni incident — a ne kao zamjenu za pun, provjerama bogat regresioni skup.

## Pisanje i pokretanje prvog web toka

Početak traje oko pet minuta:

1. Instalirajte CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Otvorite Maestro Studio da istražite stranicu i generišete komande dok klikćete: `maestro studio`
3. Sačuvajte tok kao `.yaml` datoteku i pokrenite ga: `maestro test login.yaml`
4. Uključite istu komandu u CI, odmah pored postojećih mobilnih Maestro tokova, tako da pokvarena stranica za prijavu obori build isto kao što bi to učinio pokvaren ekran za prijavu na mobilnom.

## Moj zaključak

I dalje pišem duboke, provjerama bogate web regresione skupove u Playwright-u. Ali za onu šačicu tokova gdje kvar znači "sajt je stvarno nedostupan korisnicima", Maestro-ova podrška za pretraživač daje mi iste čitljive provjere s malo održavanja kojima već vjerujem na mobilnom — bez potrebe da tim uči drugi alat samo za web stranu. To je dobra razmjena.
