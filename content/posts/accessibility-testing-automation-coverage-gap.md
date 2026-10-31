---
title: "Automated Accessibility Testing Catches Only Part of Your Problems — Here's What Closes the Gap"
title_sr: "Automatsko testiranje pristupačnosti hvata samo dio problema — evo šta zatvara jaz"
date: 2026-10-15
tags: [qa, accessibility, test-automation, ci-cd]
excerpt: Scanners like axe-core catch only a portion of real accessibility failures. Here's how to wire them into CI sensibly and what still needs a human.
excerpt_sr: Skeneri poput axe-core hvataju samo dio stvarnih problema sa pristupačnošću. Evo kako da ih razumno uvežete u CI i šta i dalje zahtijeva čovjeka.
image: assets/blog/accessibility-testing-automation-coverage-gap.jpg
---
A team adds `axe-core` to its CI pipeline, the checks go green, and everyone quietly assumes accessibility is handled. Then a support ticket comes in: a screen reader user can't close a modal, or a keyboard user gets trapped tabbing through a date picker. The automated suite never flagged either, because it structurally can't.

That gap isn't a bug in the tooling. It's a limit of what any scanner can judge from the DOM alone, and it's worth understanding precisely so you know what your green checkmarks actually promise.

## What automated scanners actually cover

Scanners such as axe-core, WAVE, Pa11y and Lighthouse's accessibility audit all work the same way: they inspect rendered markup against a fixed set of programmatic rules — missing `alt` attributes, insufficient color contrast ratios, missing form labels, invalid ARIA attributes, broken heading hierarchies, and similar structural problems.

How much that covers depends on how you count. Measured against WCAG 2.x success criteria, the commonly cited estimate is that automation can fully evaluate only around 30 to 40% of them. Measured by the volume of issues found in real audits, the number looks better — Deque, the maintainers of axe-core, reported that automated checks accounted for a bit over half of the issues in their audit data — because the most frequent problems (contrast, missing labels, missing alt text) happen to be the ones machines check well. Either way, a large share of what matters is left over. Running a second scanner helps a little, but the tools overlap far more than they complement each other.

The remainder is the kind of thing a machine cannot evaluate without understanding intent: whether alt text actually describes the image or just says "image123.png", whether a custom dropdown behaves like a native one for keyboard and screen reader users, whether focus moves somewhere sensible after a modal closes, whether the reading order makes sense when CSS is stripped away.

## A concrete setup: axe-core in a Playwright pipeline

A practical pattern, documented by an engineering team running this in production, looks like this. They wrap `@axe-core/playwright` in a small helper that scopes the scan to WCAG 2.1 Level A and AA rules and excludes third-party elements they don't control (ad iframes, embedded widgets):

```js
import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function getAxeInstance(page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('#third-party-ad-slot');
}

test('login page accessibility scan', async ({ page }) => {
  await page.goto('/login');
  const results = await getAxeInstance(page).analyze();
  await attachViolationsReport(results, 'login', 'desktop');
});
```

Each test is a normal Playwright test: navigate to a page, run the scan, save violations as a report keyed by page and viewport. The CI step runs this against a fixed list of critical pages on every staging deploy.

The interesting decision is what happens when violations are found. This team doesn't fail the build. Their existing accessibility debt was too large for a hard gate to be sustainable, so a violation instead opens or updates a GitHub Issue, and the fixes get triaged and scheduled like any other bug. That's a reasonable starting posture if you're retrofitting accessibility into an existing codebase — a blocking gate on day one usually just gets disabled by a frustrated team two weeks later. Once the backlog is under control, tightening the gate to block new violations (while leaving existing debt to be paid down separately) is the natural next step.

## Pitfalls and limits

The biggest risk isn't that automated scanning catches too little — it's that a passing scan gets treated as proof of accessibility rather than a floor. Teams that stop there consistently miss:

- **Keyboard navigation flows**: whether every interactive element is reachable and operable by keyboard alone, in a sensible order, with visible focus indicators. A scanner can confirm an element is focusable; it can't walk through your checkout flow with Tab and Enter.
- **Screen reader experience**: whether announcements make sense in context. A correctly labeled button can still be announced in a confusing way if the surrounding ARIA live regions are set up wrong.
- **Content judgment**: alt text that's technically present but useless, or a heading structure that passes validation but doesn't reflect the actual content hierarchy.
- **Dynamic and custom components**: date pickers, comboboxes, drag-and-drop interfaces, and anything built from scratch rather than native HTML controls are exactly where automated tools are weakest and manual testing matters most.

There's also a quieter risk: automated results can include false positives (a contrast check flagging text that's actually fine against its real background, because of a transparency layer or background image the tool couldn't account for) which, if ignored a few times, trains a team to ignore the tool altogether. Treat flagged issues as a starting point for review, not an automatic verdict.

## What to do next

1. **Add an automated scanner to CI as a non-blocking signal first**, scoped to WCAG A/AA rules, if you don't already have one. Expect real but partial coverage — if your debt is significant, treat the first results as a backlog, not a pass/fail gate.
2. **Build a short manual checklist for your highest-traffic flows** (checkout, sign-up, core workflows): tab through the entire flow with a keyboard only, then run it once with a screen reader (VoiceOver, NVDA, or similar). This catches the class of bugs scanners structurally can't.
3. **Combine two scanners, not more**: axe-core plus one other (Lighthouse or WAVE) captures most of the realistic automated gain. Adding a third mostly adds noise and duplicate findings.
4. **Revisit the gate periodically**: once new violations are rare, move from "open an issue" to "fail the build on new violations" so accessibility debt stops silently growing while old debt gets paid down on its own schedule.

## Sources

- [Automated vs. Manual Accessibility Audits: Coverage](https://testparty.ai/blog/automated-vs-manual-accessibility-audits-coverage) — TestParty
- [How We Automate Accessibility Testing with Playwright and Axe](https://dev.to/subito/how-we-automate-accessibility-testing-with-playwright-and-axe-3ok5) — Subito
<!--sr-->
Tim doda `axe-core` u svoj CI pipeline, provjere pozelene i svi prećutno pretpostave da je pristupačnost riješena. Onda stigne tiket od podrške: korisnik čitača ekrana ne može da zatvori modal, ili korisnik tastature ostane zarobljen dok tabom prolazi kroz birač datuma. Automatski testovi nisu prijavili ni jedno ni drugo, jer to po samoj prirodi ne mogu.

Taj jaz nije bag u alatu. To je granica onoga što bilo koji skener može da procijeni samo na osnovu DOM-a, i vrijedi je precizno razumjeti da biste znali šta vaše zelene kvačice zaista obećavaju.

## Šta automatski skeneri zaista pokrivaju

Skeneri kao što su axe-core, WAVE, Pa11y i Lighthouse audit pristupačnosti rade na isti način: provjeravaju renderovani markup prema fiksnom skupu programskih pravila — nedostajući `alt` atributi, nedovoljan kontrast boja, polja forme bez labela, neispravni ARIA atributi, polomljena hijerarhija naslova i slični strukturni problemi.

Koliko to pokriva zavisi od toga kako brojite. U odnosu na kriterijume uspjeha WCAG 2.x, često navođena procjena je da automatizacija može u potpunosti da ocijeni samo oko 30 do 40% njih. Kada se mjeri po broju problema pronađenih u stvarnim auditima, brojka izgleda bolje — Deque, tim koji održava axe-core, objavio je da su automatske provjere činile nešto više od polovine problema u njihovim podacima iz audita — jer su najčešći problemi (kontrast, nedostajuće labele, nedostajući alt tekst) baš oni koje mašine dobro provjeravaju. U oba slučaja, veliki dio onoga što je bitno ostaje nepokriven. Drugi skener malo pomaže, ali se alati mnogo više preklapaju nego što se dopunjuju.

Ostatak su stvari koje mašina ne može da ocijeni bez razumijevanja namjere: da li alt tekst zaista opisuje sliku ili samo kaže „image123.png", da li se custom padajući meni ponaša kao nativni za korisnike tastature i čitača ekrana, da li fokus ide negdje smisleno nakon zatvaranja modala, da li redoslijed čitanja ima smisla kada se ukloni CSS.

## Konkretna postavka: axe-core u Playwright pipeline-u

Praktičan obrazac, koji je opisao inženjerski tim koji ga koristi u produkciji, izgleda ovako. Oni `@axe-core/playwright` umotaju u mali helper koji ograničava skeniranje na WCAG 2.1 pravila nivoa A i AA i isključuje elemente trećih strana koje ne kontrolišu (iframe-ove sa reklamama, ugrađene widget-e):

```js
import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function getAxeInstance(page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('#third-party-ad-slot');
}

test('login page accessibility scan', async ({ page }) => {
  await page.goto('/login');
  const results = await getAxeInstance(page).analyze();
  await attachViolationsReport(results, 'login', 'desktop');
});
```

Svaki test je običan Playwright test: otvori stranicu, pokreni skeniranje, sačuvaj prekršaje kao izvještaj označen stranicom i veličinom ekrana. CI korak ovo pokreće nad fiksnom listom kritičnih stranica pri svakom deploy-u na staging.

Zanimljiva odluka je šta se dešava kada se prekršaji pronađu. Ovaj tim ne obara build. Njihov postojeći dug u pristupačnosti bio je prevelik da bi tvrda kapija bila održiva, pa prekršaj umjesto toga otvara ili ažurira GitHub Issue, a ispravke se trijažiraju i planiraju kao i svaki drugi bag. To je razuman početni pristup ako pristupačnost naknadno uvodite u postojeći kod — blokirajuća kapija od prvog dana obično završi tako što je frustrirani tim isključi dvije sedmice kasnije. Kada je backlog pod kontrolom, prirodan sljedeći korak je da se kapija pooštri tako da blokira nove prekršaje (dok se postojeći dug otplaćuje odvojeno).

## Zamke i ograničenja

Najveći rizik nije to što automatsko skeniranje hvata premalo — nego to što se prolazno skeniranje tretira kao dokaz pristupačnosti, a ne kao donja granica. Timovi koji tu stanu redovno promaše:

- **Tokove navigacije tastaturom**: da li je svaki interaktivni element dostupan i upotrebljiv samo tastaturom, smislenim redoslijedom i sa vidljivim indikatorom fokusa. Skener može da potvrdi da element može da dobije fokus; ne može da prođe kroz vaš checkout tok sa Tab i Enter.
- **Iskustvo sa čitačem ekrana**: da li najave imaju smisla u kontekstu. Ispravno označeno dugme i dalje može biti najavljeno na zbunjujući način ako su okolni ARIA live regioni loše postavljeni.
- **Procjenu sadržaja**: alt tekst koji tehnički postoji, ali je beskoristan, ili strukturu naslova koja prolazi validaciju, ali ne odražava stvarnu hijerarhiju sadržaja.
- **Dinamičke i custom komponente**: birači datuma, combobox-ovi, drag-and-drop interfejsi i sve što je napravljeno od nule umjesto nativnih HTML kontrola su upravo mjesta gdje su automatski alati najslabiji, a ručno testiranje najvažnije.

Postoji i tiši rizik: automatski rezultati mogu sadržati lažno pozitivne nalaze (provjera kontrasta prijavi tekst koji je zapravo u redu na svojoj stvarnoj pozadini, zbog sloja providnosti ili pozadinske slike koju alat nije mogao da uzme u obzir). Ako se takvi nalazi nekoliko puta ignorišu, tim nauči da ignoriše alat u cjelini. Tretirajte prijavljene probleme kao polaznu tačku za pregled, ne kao automatsku presudu.

## Šta dalje

1. **Prvo dodajte automatski skener u CI kao neblokirajući signal**, ograničen na WCAG A/AA pravila, ako ga već nemate. Očekujte stvarnu, ali djelimičnu pokrivenost — ako je vaš dug značajan, tretirajte prve rezultate kao backlog, a ne kao prolaz/pad kapiju.
2. **Napravite kratku listu za ručnu provjeru najposjećenijih tokova** (checkout, registracija, ključni tokovi rada): prođite kroz cijeli tok samo tastaturom, a zatim ga jednom prođite sa čitačem ekrana (VoiceOver, NVDA ili sličnim). Tako hvatate klasu bagova koje skeneri po prirodi ne mogu.
3. **Kombinujte dva skenera, ne više**: axe-core plus još jedan (Lighthouse ili WAVE) donosi većinu realnog dobitka od automatizacije. Treći uglavnom dodaje šum i duple nalaze.
4. **Povremeno preispitajte kapiju**: kada novi prekršaji postanu rijetki, pređite sa „otvori issue" na „obori build na novim prekršajima", da dug u pristupačnosti prestane neprimjetno da raste dok se stari dug otplaćuje svojim tempom.

## Izvori

- [Automated vs. Manual Accessibility Audits: Coverage](https://testparty.ai/blog/automated-vs-manual-accessibility-audits-coverage) — TestParty
- [How We Automate Accessibility Testing with Playwright and Axe](https://dev.to/subito/how-we-automate-accessibility-testing-with-playwright-and-axe-3ok5) — Subito
