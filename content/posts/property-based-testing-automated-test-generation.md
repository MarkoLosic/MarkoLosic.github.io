---
title: "Property-Based Testing: One Test That Covers Cases You'd Never Think to Write"
title_sr: "Property-based testiranje: jedan test koji pokriva slučajeve kojih se nikad ne biste sjetili"
date: 2026-10-26
time: 09:00
tags: [qa, test-automation, property-based-testing, methodology]
excerpt: How property-based testing with Hypothesis or fast-check finds edge cases example-based tests miss, and where it falls short.
excerpt_sr: Kako property-based testiranje uz Hypothesis ili fast-check pronalazi granične slučajeve koje testovi zasnovani na primjerima propuštaju, i gdje ima svoja ograničenja.
image: assets/blog/property-based-testing-automated-test-generation.jpg
---
Most automated test suites are built one example at a time: a test for the happy path, a test for an empty input, a test for a known edge case someone hit in production once. That approach works until the bug lives in a scenario nobody thought to write down — a list with exactly one element, a date right at a century boundary, a string with a character nobody tested. Property-based testing attacks that blind spot directly. Instead of writing a test per input, you write a test per rule, and a generator throws hundreds of inputs at that rule on every run.

![Isometric illustration of a chaotic stream of symbols, binary matrices and code fragments flowing into a glowing translucent gate on a circuit-board platform, where they are filtered into an ordered data pipeline that narrows down to a single highlighted red point](assets/blog/property-based-testing-automated-test-generation.jpg)

## What a "property" actually is

A property-based test doesn't say "when the input is X, the output should be Y." It states something that should be true for every valid input: a round trip that returns the original value, a result that never exceeds a bound, an operation that commutes regardless of order. Libraries like Hypothesis (Python), fast-check (JavaScript/TypeScript), and QuickCheck (Haskell, with ports in most other languages) generate inputs matching a strategy you declare, run your assertion against each one, and — this is the part that makes the technique useful rather than just noisy — shrink any failing input down to the smallest case that still fails.

A good illustration, adapted from a real refactor described in Increment's testing issue: a SaaS product limits how many collaborators a project can have. The original test created exactly three fixed users and checked that the fourth was rejected. That test passes, but it only proves the rule holds for three specific people. A property version states the actual rule: for any project name and any list of distinct users, adding more than the limit should be rejected, and adding exactly the limit should succeed. Here's that idea with fast-check:

```ts
import fc from 'fast-check';
import { test, expect } from 'vitest';

test('collaborator limit holds for any project and user list', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }),
      fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 10 }),
      (projectName, users) => {
        const project = createProject(projectName);
        const results = users.map((u) => project.addCollaborator(u));
        const accepted = results.filter(Boolean).length;
        expect(accepted).toBe(Math.min(users.length, project.collaboratorLimit));
      }
    )
  );
});
```

That single test replaces a whole family of example tests and keeps checking the rule as the codebase changes, instead of only the three cases someone remembered to write.

## Shrinking is what makes the failures usable

Random generation on its own would be nearly useless for debugging — a failing case with a 40-element array of garbage strings tells you almost nothing. Shrinking is the step that turns a random failure into a minimal, readable one. Hypothesis's own documentation describes finding a real bug in Argon2 Python bindings this way: a property test asserting that hashing and then verifying always succeeds found that hash lengths above 512 silently failed because they overran a fixed-size buffer in the underlying C library. The shrunk failing example was `hash_len=513` — one number, pointing straight at the boundary.

A similar round-trip property (parse a date, format it back, expect the same value) caught a real bug in the `dateutil` library: the ISO 8601 date `0005-01-01T00:00:05` was parsed as `0001-05-01T00:00:05` — the year and month had been swapped. No one would have picked that date by hand to test; the generator found it, and shrinking reduced it to the smallest input that still reproduced the swap.

Shrinking has a subtler failure mode worth knowing about, documented by the Hypothesis team: when a property can fail for more than one underlying reason, naive shrinking can "slip" from the bug you found toward a different, less interesting one. A test checking `min(xs) <= mean(xs) <= max(xs)` over a list of floats can fail because of `NaN` values, because of infinities, or because of floating-point precision — but a shrinker chasing "simpler" will often collapse everything down to the empty list, which fails for a boring reason (`min()` on an empty list raises an error) and hides the interesting bug you actually triggered. Modern Hypothesis versions address this by detecting and reporting multiple distinct failures separately, each shrunk on its own, rather than collapsing them into one.

## Where this approach falls short

Good properties are genuinely harder to come up with than good examples, and teams new to the technique often spend their first attempts writing properties that are too weak to catch anything ("the function doesn't throw") or constraints that filter out so many generated inputs that the test barely runs. Generators also need real care: too loose, and you'll spend your CI budget generating invalid inputs the real system would never see; too tight, and you've quietly reintroduced the same blind spots example-based testing had. Shrinking can mask a bug behind a simpler but less relevant one, as described above, so a failing property test is a starting point for investigation, not an automatic root cause. And property tests are usually slower and noisier in CI than deterministic examples — a flaky-looking failure that only reproduces with a specific random seed needs that seed saved and replayed, not just rerun and ignored.

Property-based testing also isn't a replacement for example-based tests that document specific, named business scenarios ("a VIP customer gets free shipping over $50"). Those are still clearer as explicit examples. The two techniques work best side by side: examples for documenting intent, properties for catching the inputs nobody thought to document.

## What to do next

Pick one pure function in your codebase with an obvious invariant — a serializer/deserializer, a sort, a parser, anything with a round trip or a clear mathematical rule — and write exactly one property test for it using Hypothesis or fast-check. Run it locally against existing code before trusting it in CI, and actually read the first few failures it surfaces instead of dismissing them as noise. When it finds a real bug, save the failing seed and add it as a permanent regression example alongside the property. Expand to a second function only once the first property test has earned its place in the suite — converting a whole test file at once tends to produce a flood of findings that's hard to triage.

## Sources

- [fast-check introduction](https://fast-check.dev/docs/introduction/)
- [Hypothesis: When multiple bugs attack](https://hypothesis.works/articles/multi-bug-discovery/)
- [In praise of property-based testing — Increment](https://increment.com/testing/in-praise-of-property-based-testing/)
<!--sr-->
Većina paketa automatizovanih testova gradi se primjer po primjer: test za srećni scenario (happy path), test za prazan ulaz, test za poznati granični slučaj na koji je neko jednom naletio u produkciji. Taj pristup radi sve dok se bag ne nađe u scenariju koji niko nije pomislio da zapiše — lista sa tačno jednim elementom, datum tačno na granici vijeka, string sa karakterom koji niko nije testirao. Property-based testiranje direktno napada tu slijepu tačku. Umjesto da pišete test za svaki ulaz, pišete test za svako pravilo, a generator pri svakom pokretanju baca stotine ulaza na to pravilo.

![Izometrijska ilustracija haotičnog toka simbola, binarnih matrica i fragmenata koda koji ulaze u svijetleću providnu kapiju na platformi nalik štampanoj ploči, gdje se filtriraju u uređen tok podataka koji se sužava do jedne istaknute crvene tačke](assets/blog/property-based-testing-automated-test-generation.jpg)

## Šta je zapravo „property"

Property-based test ne kaže „kada je ulaz X, izlaz treba da bude Y". On iskazuje nešto što treba da važi za svaki validan ulaz: povratno putovanje (round trip) koje vraća originalnu vrijednost, rezultat koji nikada ne prelazi neku granicu, operaciju koja daje isti rezultat bez obzira na redoslijed. Biblioteke poput Hypothesisa (Python), fast-checka (JavaScript/TypeScript) i QuickChecka (Haskell, sa portovima za većinu drugih jezika) generišu ulaze prema strategiji koju definišete, provjeravaju vašu tvrdnju nad svakim od njih i — upravo to tehniku čini korisnom, a ne samo bučnom — smanjuju (shrinking) svaki ulaz koji obori test do najmanjeg slučaja koji i dalje pada.

Dobra ilustracija, prilagođena iz stvarnog refaktorisanja opisanog u Incrementovom broju posvećenom testiranju: SaaS proizvod ograničava koliko saradnika jedan projekat može da ima. Originalni test pravio je tačno tri fiksna korisnika i provjeravao da je četvrti odbijen. Taj test prolazi, ali dokazuje samo da pravilo važi za tri konkretne osobe. Property verzija iskazuje stvarno pravilo: za bilo koji naziv projekta i bilo koju listu različitih korisnika, dodavanje više od limita treba da bude odbijeno, a dodavanje tačno do limita treba da uspije. Evo te ideje sa fast-checkom:

```ts
import fc from 'fast-check';
import { test, expect } from 'vitest';

test('collaborator limit holds for any project and user list', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }),
      fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 10 }),
      (projectName, users) => {
        const project = createProject(projectName);
        const results = users.map((u) => project.addCollaborator(u));
        const accepted = results.filter(Boolean).length;
        expect(accepted).toBe(Math.min(users.length, project.collaboratorLimit));
      }
    )
  );
});
```

Taj jedan test zamjenjuje čitavu porodicu testova zasnovanih na primjerima i nastavlja da provjerava pravilo kako se kod mijenja, umjesto samo ona tri slučaja kojih se neko sjetio da ih napiše.

## Shrinking je ono što padove čini upotrebljivim

Samo nasumično generisanje bilo bi skoro beskorisno za debagovanje — pad sa nizom od 40 besmislenih stringova ne govori vam gotovo ništa. Shrinking je korak koji nasumičan pad pretvara u minimalan, čitljiv primjer. Dokumentacija Hypothesisa opisuje kako je na ovaj način pronađen stvaran bag u Python bindinzima za Argon2: property test koji tvrdi da heširanje, pa zatim verifikacija, uvijek uspijeva otkrio je da dužine heša preko 512 tiho padaju jer prepunjavaju bafer fiksne veličine u C biblioteci ispod. Smanjeni primjer koji pada bio je `hash_len=513` — jedan broj koji pokazuje pravo na granicu.

Slično round-trip svojstvo (parsiraj datum, formatiraj ga nazad, očekuj istu vrijednost) uhvatilo je stvaran bag u biblioteci `dateutil`: ISO 8601 datum `0005-01-01T00:00:05` parsiran je kao `0001-05-01T00:00:05` — godina i mjesec su zamijenili mjesta. Niko ne bi ručno izabrao baš taj datum za testiranje; generator ga je pronašao, a shrinking ga je sveo na najmanji ulaz koji i dalje reprodukuje zamjenu.

Shrinking ima i suptilniji način da zakaže, koji je vrijedno poznavati, a dokumentovao ga je Hypothesis tim: kada svojstvo može da padne iz više od jednog razloga, naivan shrinking može da „sklizne" sa baga koji ste pronašli ka nekom drugom, manje zanimljivom. Test koji provjerava `min(xs) <= mean(xs) <= max(xs)` nad listom brojeva u pokretnom zarezu može da padne zbog `NaN` vrijednosti, zbog beskonačnosti ili zbog preciznosti računanja u pokretnom zarezu — ali shrinker koji juri „jednostavnije" često sve sruši na praznu listu, koja pada iz dosadnog razloga (`min()` nad praznom listom baca grešku) i sakriva zanimljiv bag koji ste zapravo pogodili. Novije verzije Hypothesisa ovo rješavaju tako što prepoznaju i prijavljuju više različitih padova odvojeno, svaki smanjen za sebe, umjesto da ih stope u jedan.

## Gdje ovaj pristup ne ide dovoljno daleko

Dobra svojstva je zaista teže smisliti nego dobre primjere, a timovi koji su novi u ovoj tehnici često prve pokušaje potroše na svojstva koja su preslaba da bilo šta uhvate („funkcija ne baca izuzetak") ili na ograničenja koja odbace toliko generisanih ulaza da se test jedva i izvrši. Generatori takođe zahtijevaju pažnju: ako su previše labavi, potrošićete CI budžet na generisanje nevalidnih ulaza koje stvarni sistem nikada ne bi vidio; ako su previše strogi, tiho ste vratili iste slijepe tačke koje je imalo testiranje zasnovano na primjerima. Shrinking može da sakrije bag iza jednostavnijeg, ali manje relevantnog, kao što je opisano gore, pa je property test koji pada polazna tačka za istraživanje, a ne automatski uzrok problema. I property testovi su u CI-ju obično sporiji i bučniji od determinističkih primjera — pad koji izgleda kao flaky, a reprodukuje se samo sa određenim nasumičnim seedom, zahtijeva da se taj seed sačuva i ponovo pusti, a ne samo da se test ponovo pokrene i ignoriše.

Property-based testiranje takođe nije zamjena za testove zasnovane na primjerima koji dokumentuju konkretne, imenovane poslovne scenarije („VIP kupac dobija besplatnu dostavu preko 50 dolara"). Oni su i dalje jasniji kao eksplicitni primjeri. Ove dvije tehnike najbolje rade jedna uz drugu: primjeri za dokumentovanje namjere, svojstva za hvatanje ulaza koje niko nije pomislio da dokumentuje.

## Šta dalje

Izaberite jednu čistu funkciju u svom kodu sa očiglednom invarijantom — serijalizator/deserijalizator, sortiranje, parser, bilo šta sa round tripom ili jasnim matematičkim pravilom — i napišite za nju tačno jedan property test uz Hypothesis ili fast-check. Pokrenite ga lokalno nad postojećim kodom prije nego što mu povjerite mjesto u CI-ju, i zaista pročitajte prvih nekoliko padova koje izbaci umjesto da ih otpišete kao šum. Kada pronađe stvaran bag, sačuvajte seed koji pada i dodajte ga kao trajni regresioni primjer uz svojstvo. Na drugu funkciju pređite tek kada prvi property test zasluži svoje mjesto u paketu — prebacivanje čitavog test fajla odjednom obično proizvede poplavu nalaza koju je teško trijažirati.

## Izvori

- [fast-check introduction](https://fast-check.dev/docs/introduction/)
- [Hypothesis: When multiple bugs attack](https://hypothesis.works/articles/multi-bug-discovery/)
- [In praise of property-based testing — Increment](https://increment.com/testing/in-praise-of-property-based-testing/)
