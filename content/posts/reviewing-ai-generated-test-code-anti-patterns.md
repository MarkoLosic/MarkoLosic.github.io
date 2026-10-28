---
title: "Reviewing AI-Generated Test Code: The Anti-Patterns That Slip Past a Quick Look"
title_sr: "Pregled testova koje je napisao AI: anti-obrasci koji promaknu na brzinu"
date: 2026-10-28
time: 09:00
tags: [qa, ai-in-qa, test-automation, code-review]
excerpt: AI assistants write tests as readily as code, but many of those tests pass without checking anything. Here's what to look for before merging them.
excerpt_sr: AI asistenti pišu testove jednako lako kao i kod, ali mnogi od tih testova prolaze a da ništa ne provjeravaju. Evo na šta treba obratiti pažnju prije nego što ih spojite.
image: assets/blog/reviewing-ai-generated-test-code-anti-patterns.jpg
---
When an AI coding assistant finishes a feature, it usually offers a test file along with it, and the suite is green. That greenness is exactly the problem: a test suite can pass completely and still verify almost nothing about the code it claims to cover. Reviewers are trained to scan test diffs for syntax and coverage percentage, not for whether a given test is structurally capable of failing. AI-generated tests make that blind spot much more common, because the model writing the test often has the same blind spots as the model (or developer) that wrote the implementation.

![Illustration of a code editor on a monitor showing passing test_calculate_discount() badges, while a magnifying glass over the code reveals hidden bugs and a "mutant survived" warning](assets/blog/reviewing-ai-generated-test-code-anti-patterns.jpg)

A recent analysis by the AI code review company CodeRabbit, covering 470 open-source pull requests (320 AI-coauthored, 150 human-only), found AI-authored changes carried about 1.7 times more issues overall than human-only ones, with logic and correctness problems up 75%. Test code wasn't singled out in that count, but the same forces that produce buggier implementation code produce weaker tests: pattern-matching on "what a test for this usually looks like" rather than reasoning about what could actually go wrong.

## The test that can't fail

The clearest anti-pattern is a test whose expected value is derived from the function it's testing, instead of calculated independently. If a developer or assistant writes the implementation and the test in the same pass, it's easy for the "expected" side of an assertion to just be a copy of whatever the function currently returns:

```python
def test_calculate_discount():
    order = Order(items=[...], coupon="SAVE10")
    result = calculate_discount(order)
    # "expected" was pasted from a debug print of the function's own output
    assert result == 12.6
```

If the discount logic is wrong, this test enshrines the wrong answer instead of catching it. The fix isn't more tests of this shape, it's a different question during review: would this test fail if the function returned a hardcoded, wrong value? If the answer is "I'm not sure," the expected value needs to be computed from the business rule, not copied from output.

## Over-mocking and happy-path-only coverage

Two other patterns show up constantly in AI-generated suites. The first is over-mocking: every collaborator of the unit under test gets replaced with a mock, including ones that are cheap and safe to call for real. At that point the test verifies that the code calls its mocks in the expected order, not that the code produces correct behavior. The second is happy-path concentration: the assistant writes tests for the cases a competent developer would think of first and skips the ones that require knowledge the model doesn't have about this specific system, such as which timezone timestamps are stored in, whether a date field is inclusive or exclusive, or what the actual contract of a shared utility is. Both patterns are easy to miss in review because the resulting test file looks thorough: lots of test functions, lots of assertions, good naming.

## Using mutation testing as a second opinion

Code coverage tells you a line was executed, not that the test would notice if that line were wrong. Mutation testing closes that gap: a tool systematically changes small things in the implementation (flips a `>` to `>=`, swaps `and` for `or`, changes a constant) and reruns the suite. A "mutant" that survives, meaning the tests still pass despite the deliberate bug, is a concrete example of something your tests don't actually check.

Research specifically aimed at LLM-generated tests backs this up. A 2023 paper introducing MuTAP, a mutation-testing-guided approach to improving LLM-generated tests, reported that about 17% of faulty code snippets in its benchmark went undetected by both a leading automated test generator and standard zero-shot/few-shot LLM prompting; feeding surviving mutants back into the prompt let the approach catch up to 28% more faulty snippets than the baselines. The detail worth remembering isn't the exact percentage, which is benchmark-specific, but the mechanism: LLM-written tests reliably miss a meaningful slice of real bugs, and mutation testing is one of the few techniques that tells you which slice, on your own code, instead of a benchmark.

You don't need a mutation testing pass on every commit. Run it selectively on files where an assistant generated most of the test code, especially business logic with branching, and treat a high survival rate as a signal to rewrite the tests, not just add more of them.

## Pitfalls and limits

Mutation testing is slow on anything beyond a focused module; running it over an entire codebase on every pull request usually isn't practical, so it needs to be scoped. It also produces some noise: "equivalent mutants" that can't be killed by any test because the mutated code behaves identically to the original, which can make a survival rate look worse than it is and requires a human to triage. None of this replaces human review of intent, either. A test can kill every mutant you throw at it and still be testing the wrong requirement, because the person who wrote the original ticket wanted different behavior than what got implemented. And accepting AI-written tests at review speed, the same speed you'd skim a one-line fix, is itself the root cause; the fixes below only work if review time actually increases for test files an assistant generated.

## What to do next

- Add one review question for any AI-generated test: "Would this fail if the function returned a hardcoded or obviously wrong value?" If you can't answer confidently by reading it, trace through it before approving.
- Run a mutation testing tool (Stryker for JS/TS, PIT for Java, mutmut or `cosmic-ray` for Python) against files where an assistant wrote most of the tests, and treat a high mutant survival rate as a signal to rewrite rather than pad the suite.
- Push back on over-mocking in review: ask whether a mocked collaborator could be called for real, or replaced with a lightweight fake, so the test exercises actual integration points.
- Track cases where a bug shipped despite "full" test coverage, and use them to build a short internal list of the specific anti-patterns your team's AI tooling tends to produce, so review time can target those first.

## Sources

- [CodeRabbit study via IT Brief Australia: AI-generated code far buggier than human work](https://itbrief.com.au/story/study-finds-ai-generated-code-far-buggier-than-human-work)
- [Dinella et al., "MuTAP: Mutation-Guided Genetic Adversarial LLM Prompting for Unit Test Generation" (arXiv)](https://arxiv.org/abs/2308.16557v1)
- [The Bugs AI Writes: Five Patterns That Show Up in AI-Generated Code (dev.to)](https://dev.to/stravukarl/the-bugs-ai-writes-five-patterns-that-show-up-in-ai-generated-code-bl3)
<!--sr-->
Kada AI asistent za kodiranje završi neku funkcionalnost, obično uz nju ponudi i test fajl, a paket testova je zelen. Upravo ta zelena boja je problem: paket testova može da prođe u potpunosti, a da pritom ne provjeri gotovo ništa o kodu koji navodno pokriva. Revjueri su navikli da u diffovima testova gledaju sintaksu i procenat pokrivenosti, a ne da li je dati test uopšte strukturno sposoban da padne. Testovi koje generiše AI čine tu slijepu tačku mnogo češćom, jer model koji piše test često ima iste slijepe tačke kao i model (ili developer) koji je napisao implementaciju.

![Ilustracija editora koda na monitoru sa oznakama da test_calculate_discount() prolazi, dok lupa nad kodom otkriva skrivene bagove i upozorenje „mutant survived"](assets/blog/reviewing-ai-generated-test-code-anti-patterns.jpg)

Nedavna analiza kompanije CodeRabbit, koja se bavi AI pregledom koda, obuhvatila je 470 open-source pull requestova (320 u čijem je pisanju učestvovao AI i 150 koje su pisali samo ljudi) i pokazala da izmjene koje je pisao AI imaju ukupno oko 1,7 puta više problema od onih koje su pisali samo ljudi, pri čemu su problemi sa logikom i ispravnošću porasli za 75%. Test kod u tom brojanju nije posebno izdvojen, ali iste sile koje proizvode kod sa više bagova proizvode i slabije testove: prepoznavanje obrasca „kako test za ovo obično izgleda", umjesto razmišljanja o tome šta zapravo može da pođe po zlu.

## Test koji ne može da padne

Najočigledniji anti-obrazac je test čija je očekivana vrijednost izvedena iz same funkcije koju testira, umjesto da je izračunata nezavisno. Ako developer ili asistent napiše implementaciju i test u istom prolazu, lako se desi da „očekivana" strana tvrdnje bude samo kopija onoga što funkcija trenutno vraća:

```python
def test_calculate_discount():
    order = Order(items=[...], coupon="SAVE10")
    result = calculate_discount(order)
    # "expected" was pasted from a debug print of the function's own output
    assert result == 12.6
```

Ako je logika popusta pogrešna, ovaj test ovjekovječuje pogrešan odgovor umjesto da ga uhvati. Rješenje nije više testova ovakvog oblika, već drugačije pitanje tokom pregleda: da li bi ovaj test pao kada bi funkcija vraćala hardkodovanu, pogrešnu vrijednost? Ako je odgovor „nisam siguran", očekivanu vrijednost treba izračunati iz poslovnog pravila, a ne kopirati iz izlaza.

## Previše mockova i pokrivenost samo srećnog scenarija

U paketima testova koje generiše AI stalno se pojavljuju još dva obrasca. Prvi je pretjerano mockovanje: svaki saradnik jedinice koja se testira zamijenjen je mockom, uključujući i one koje je jeftino i bezbjedno pozvati stvarno. U tom trenutku test provjerava da kod poziva svoje mockove očekivanim redoslijedom, a ne da kod daje ispravno ponašanje. Drugi je fokus na srećni scenario (happy path): asistent piše testove za slučajeve kojih bi se kompetentan developer prvo sjetio, a preskače one koji zahtijevaju znanje koje model nema o baš ovom sistemu — na primjer, u kojoj vremenskoj zoni se čuvaju vremenske oznake, da li je polje datuma inkluzivno ili ekskluzivno, ili kakav je stvarni ugovor neke zajedničke pomoćne funkcije. Oba obrasca je lako prevideti u pregledu, jer rezultujući test fajl izgleda temeljno: mnogo test funkcija, mnogo tvrdnji, dobra imena.

## Mutaciono testiranje kao drugo mišljenje

Pokrivenost koda govori vam da je linija izvršena, a ne da bi test primijetio kada bi ta linija bila pogrešna. Mutaciono testiranje zatvara tu prazninu: alat sistematski mijenja sitnice u implementaciji (okrene `>` u `>=`, zamijeni `and` sa `or`, promijeni konstantu) i ponovo pokreće testove. „Mutant" koji preživi — odnosno testovi i dalje prolaze uprkos namjerno ubačenom bagu — konkretan je primjer nečega što vaši testovi zapravo ne provjeravaju.

Istraživanja usmjerena baš na testove koje generišu LLM-ovi to potvrđuju. Rad iz 2023. godine koji predstavlja MuTAP, pristup za poboljšanje testova koje generišu LLM-ovi vođen mutacionim testiranjem, navodi da je oko 17% neispravnih isječaka koda u njegovom benchmarku ostalo neotkriveno i od strane vodećeg alata za automatsko generisanje testova i uz standardno zero-shot/few-shot promptovanje LLM-a; vraćanje preživjelih mutanata nazad u prompt omogućilo je ovom pristupu da uhvati i do 28% više neispravnih isječaka od osnovnih pristupa. Detalj koji vrijedi zapamtiti nije tačan procenat, koji zavisi od benchmarka, već mehanizam: testovi koje pišu LLM-ovi pouzdano propuštaju značajan dio stvarnih bagova, a mutaciono testiranje je jedna od rijetkih tehnika koja vam kaže koji je to dio — na vašem kodu, a ne na benchmarku.

Ne treba vam mutaciono testiranje na svakom commitu. Pokrećite ga selektivno nad fajlovima u kojima je asistent napisao većinu test koda, naročito nad poslovnom logikom sa grananjem, i visoku stopu preživljavanja mutanata shvatite kao signal da testove treba prepisati, a ne samo dodati nove.

## Zamke i ograničenja

Mutaciono testiranje je sporo na bilo čemu većem od fokusiranog modula; pokretanje nad cijelim kodom na svakom pull requestu obično nije praktično, pa mu treba ograničiti obim. Ono proizvodi i određeni šum: „ekvivalentne mutante" koje nijedan test ne može da ubije jer se mutirani kod ponaša identično originalu, što stopu preživljavanja može učiniti gorom nego što jeste i zahtijeva da čovjek to trijažira. Ništa od ovoga ne zamjenjuje ni ljudski pregled namjere. Test može da ubije svakog mutanta kog mu bacite, a da i dalje testira pogrešan zahtjev, jer je osoba koja je napisala originalni tiket htjela drugačije ponašanje od onoga što je implementirano. A prihvatanje testova koje je napisao AI brzinom pregleda — istom brzinom kojom biste preletjeli ispravku od jedne linije — samo po sebi je osnovni uzrok problema; mjere ispod funkcionišu samo ako se vrijeme pregleda zaista poveća za test fajlove koje je generisao asistent.

## Šta dalje

- Dodajte jedno pitanje u pregled svakog testa koji je napisao AI: „Da li bi ovo palo kada bi funkcija vraćala hardkodovanu ili očigledno pogrešnu vrijednost?" Ako čitanjem ne možete sa sigurnošću da odgovorite, prođite kroz test korak po korak prije odobravanja.
- Pokrenite alat za mutaciono testiranje (Stryker za JS/TS, PIT za Javu, mutmut ili `cosmic-ray` za Python) nad fajlovima u kojima je asistent napisao većinu testova, i visoku stopu preživjelih mutanata shvatite kao signal za prepisivanje, a ne za naduvavanje paketa testova.
- U pregledu se usprotivite pretjeranom mockovanju: pitajte da li bi mockovani saradnik mogao da se pozove stvarno ili da se zamijeni laganim fake objektom, kako bi test provjeravao stvarne tačke integracije.
- Pratite slučajeve u kojima je bag stigao do produkcije uprkos „punoj" pokrivenosti testovima i iskoristite ih da napravite kratku internu listu konkretnih anti-obrazaca koje AI alati vašeg tima obično proizvode, kako bi pregled prvo ciljao njih.

## Izvori

- [CodeRabbit study via IT Brief Australia: AI-generated code far buggier than human work](https://itbrief.com.au/story/study-finds-ai-generated-code-far-buggier-than-human-work)
- [Dinella et al., "MuTAP: Mutation-Guided Genetic Adversarial LLM Prompting for Unit Test Generation" (arXiv)](https://arxiv.org/abs/2308.16557v1)
- [The Bugs AI Writes: Five Patterns That Show Up in AI-Generated Code (dev.to)](https://dev.to/stravukarl/the-bugs-ai-writes-five-patterns-that-show-up-in-ai-generated-code-bl3)
