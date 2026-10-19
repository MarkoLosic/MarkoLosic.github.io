---
title: "Mutation Testing: How to Tell If Your Test Suite Actually Catches Bugs"
title_sr: "Mutaciono testiranje: kako da saznate da li vaši testovi zaista hvataju bagove"
date: 2026-10-19
tags: [qa, test-automation, mutation-testing, test-design]
excerpt: Code coverage shows which lines ran. Mutation testing shows whether your tests would notice if the logic broke. Here's how to use it.
excerpt_sr: Pokrivenost koda pokazuje koje su linije izvršene. Mutaciono testiranje pokazuje da li bi vaši testovi primijetili da je logika pokvarena. Evo kako da ga koristite.
image: assets/blog/mutation-testing-weak-assertions.jpg
---
A test suite can sit at 95% line coverage and still let a one-character logic bug ship. Coverage only tells you that a line executed during a test run; it says nothing about whether any assertion would have failed if that line did the wrong thing. A function can be called, return a value nobody checks, and still count as "covered."

Mutation testing answers the question coverage can't: if this exact piece of logic were slightly wrong, would any test actually fail? It does this by automatically introducing small, deliberate bugs into your code, called mutants, and rerunning your test suite against each one. A mutant that causes a test to fail is "killed." A mutant that causes no test to fail "survives," and a surviving mutant is a direct, concrete signal that part of your logic has no real test coverage behind it, even if the coverage report says otherwise.

![Neon illustration of a DNA double helix made of code, with green "KILLED" badges on caught mutants, red target markers labelled "MUTANT DETECTED" and "MUTATED", glitching bug icons, a coverage chart, and a stats panel showing a "101 > 100" test failure](assets/blog/mutation-testing-weak-assertions.jpg)

## How a mutation testing run actually works

Tools like Stryker (JavaScript/TypeScript, .NET), PIT (Java), and mutmut or cosmic-ray (Python) parse your source and generate variants with small, mechanical changes: flipping a comparison operator (`<=` to `<`), swapping a boolean (`true` to `false`), changing an arithmetic operator (`+` to `-`), or removing a statement entirely. Each mutant is compiled or loaded individually, and your existing test suite runs against it, unchanged.

Take a simple discount calculator:

```python
def calculate_price(base_price, discount_percent):
    if discount_percent > 100:
        raise ValueError("Invalid discount")
    return base_price * (1 - discount_percent / 100)
```

A mutation tool might flip `discount_percent > 100` to `discount_percent >= 100`. If your test suite only checks `discount_percent = 150` and `discount_percent = 50`, that mutant survives, because nothing in the suite tests the boundary at exactly 100. The fix isn't to rewrite the function — it's to add a test for the boundary value itself:

```python
import pytest

def test_discount_of_exactly_100_is_allowed():
    assert calculate_price(200, 100) == 0

def test_discount_over_100_raises():
    with pytest.raises(ValueError):
        calculate_price(200, 101)
```

That's the pattern mutation testing surfaces again and again: tests that cover the happy path but never probe the edges where off-by-one and boundary bugs actually live.

## Mutation score, and what it does and doesn't tell you

The result of a run is usually expressed as a mutation score: killed mutants divided by total valid mutants, as a percentage. A score of 70% means 70% of the deliberately introduced bugs would have been caught by your tests; the other 30% could ship unnoticed.

Two things complicate that number. First, some mutants are "equivalent": the code is textually different but behaves identically for every input, so no test could ever kill it (a true equivalent mutant does not change observable behavior, as distinct from a boundary change like the one above, which does). Most tools can't reliably detect these automatically, so a real-world mutation score is a slight underestimate of what your tests are actually worth — a human has to eyeball a surviving mutant to tell "nobody tests this" from "nothing could test this." Second, mutation score is not a target to chase to 100%. Treating it like a coverage percentage to maximize produces the same problem coverage chasing does: tests written to kill mutants rather than to verify behavior that matters.

## Where it fits, and where it doesn't

Mutation testing is expensive. Running the full suite once per mutant means a project with a two-minute test suite and a few hundred mutants can take hours, not minutes. That makes it a poor fit for running on every commit. In practice, teams run it on a schedule (nightly, or on a weekly cadence) or scope it to the specific module or pull request diff that changed, rather than the whole codebase.

It's also not a substitute for integration or end-to-end testing. Mutation testing operates at the unit level, inside a single function or class; it tells you whether your unit tests would catch a logic error in that unit, not whether your system behaves correctly end to end. And it's noisy on code that's inherently permissive — validation logic with many acceptable inputs, logging statements, or getters/setters generate a lot of mutants that either can't meaningfully be killed or aren't worth killing. Most tools let you exclude files, methods, or specific mutation types (string literals, logging calls) to cut that noise, and skipping that configuration step is the most common reason teams try mutation testing once and abandon it as "too slow and too noisy."

## What to do next

1. Pick one tool for your stack (Stryker for JS/TS or .NET, PIT for Java, mutmut for Python) and run it against a single, business-critical module first, not the whole repo.
2. Read the surviving mutants, not just the score. Each one is a specific, actionable gap: either write a test for it, or document why it's equivalent and exclude it.
3. Configure exclusions before judging the tool. Cut noisy mutation types and low-value files so the surviving mutants you review are the ones worth your time.
4. If it proves useful, run it on a schedule or scoped to changed files in CI, with a mutation score threshold that gates review, not a hard build failure, until the team trusts the signal.

## Sources

- [Mutation testing](https://learn.microsoft.com/dotnet/core/testing/mutation-testing) — Microsoft Learn (.NET docs)
- [How is mutation testing different to coverage measurement?](https://mutants.rs/vs-coverage.html) — mutants.rs
<!--sr-->
Paket testova može imati 95% pokrivenosti linija koda i ipak propustiti u produkciju logički bag od jednog jedinog karaktera. Pokrivenost vam govori samo da je linija izvršena tokom testiranja; ne govori ništa o tome da li bi ijedna provjera (assertion) pala da ta linija radi pogrešnu stvar. Funkcija može biti pozvana, vratiti vrijednost koju niko ne provjerava i svejedno se računati kao „pokrivena".

Mutaciono testiranje odgovara na pitanje na koje pokrivenost ne može: da je baš ovaj dio logike malo pogrešan, da li bi ijedan test zaista pao? To radi tako što automatski ubacuje male, namjerne bagove u vaš kod, koji se zovu mutanti, i ponovo pokreće paket testova nad svakim od njih. Mutant zbog kojeg neki test padne je „ubijen" (killed). Mutant zbog kojeg nijedan test ne padne „preživljava" (survives), a preživjeli mutant je direktan, konkretan signal da iza dijela vaše logike ne stoji nikakvo stvarno testiranje, čak i ako izvještaj o pokrivenosti tvrdi suprotno.

![Neonska ilustracija dvostruke spirale DNK sastavljene od koda, sa zelenim oznakama „KILLED" na uhvaćenim mutantima, crvenim metama sa natpisima „MUTANT DETECTED" i „MUTATED", ikonama bagova koji trepere, grafikonom pokrivenosti i panelom sa statistikom koji prikazuje pad testa „101 > 100"](assets/blog/mutation-testing-weak-assertions.jpg)

## Kako zapravo izgleda jedno pokretanje mutacionog testiranja

Alati kao što su Stryker (JavaScript/TypeScript, .NET), PIT (Java) i mutmut ili cosmic-ray (Python) parsiraju vaš izvorni kod i generišu varijante sa malim, mehaničkim izmjenama: obrću operator poređenja (`<=` u `<`), mijenjaju bulovu vrijednost (`true` u `false`), mijenjaju aritmetički operator (`+` u `-`) ili potpuno uklanjaju naredbu. Svaki mutant se zasebno kompajlira ili učitava, a vaš postojeći paket testova se nad njim pokreće bez ikakvih izmjena.

Uzmimo jednostavan kalkulator popusta:

```python
def calculate_price(base_price, discount_percent):
    if discount_percent > 100:
        raise ValueError("Invalid discount")
    return base_price * (1 - discount_percent / 100)
```

Alat za mutaciono testiranje mogao bi da promijeni `discount_percent > 100` u `discount_percent >= 100`. Ako vaš paket testova provjerava samo `discount_percent = 150` i `discount_percent = 50`, taj mutant preživljava, jer ništa u paketu ne testira granicu od tačno 100. Rješenje nije da prepišete funkciju — nego da dodate test za samu graničnu vrijednost:

```python
import pytest

def test_discount_of_exactly_100_is_allowed():
    assert calculate_price(200, 100) == 0

def test_discount_over_100_raises():
    with pytest.raises(ValueError):
        calculate_price(200, 101)
```

To je obrazac koji mutaciono testiranje otkriva iznova i iznova: testovi koji pokrivaju „srećan put" (happy path), ali nikada ne zadiru u ivice na kojima zapravo žive off-by-one i granični bagovi.

## Mutacioni skor: šta vam govori, a šta ne

Rezultat pokretanja se obično izražava kao mutacioni skor: broj ubijenih mutanata podijeljen sa ukupnim brojem validnih mutanata, u procentima. Skor od 70% znači da bi vaši testovi uhvatili 70% namjerno ubačenih bagova; preostalih 30% bi moglo neprimijećeno da završi u produkciji.

Dvije stvari komplikuju taj broj. Prvo, neki mutanti su „ekvivalentni": kod se razlikuje u tekstu, ali se za svaki ulaz ponaša identično, pa nijedan test nikada ne može da ga ubije (pravi ekvivalentni mutant ne mijenja vidljivo ponašanje, za razliku od izmjene granice kao u primjeru iznad, koja ga mijenja). Većina alata ne može pouzdano da ih otkrije automatski, pa je mutacioni skor u praksi blago potcijenjena mjera stvarne vrijednosti vaših testova — čovjek mora da pogleda preživjelog mutanta da bi razlikovao „ovo niko ne testira" od „ovo ništa ne može da testira". Drugo, mutacioni skor nije cilj koji treba gurati do 100%. Ako ga tretirate kao procenat pokrivenosti koji treba maksimizovati, dobijate isti problem kao i kod jurenja pokrivenosti: testove napisane da ubiju mutante, umjesto da provjere ponašanje koje je zaista važno.

## Gdje se uklapa, a gdje ne

Mutaciono testiranje je skupo. Pokretanje cijelog paketa po jednom za svakog mutanta znači da projekat sa paketom testova od dva minuta i nekoliko stotina mutanata može da traje satima, a ne minutima. Zato nije dobar izbor za pokretanje na svaki commit. U praksi ga timovi pokreću po rasporedu (svake noći ili jednom sedmično) ili ga ograničavaju na konkretan modul ili diff iz pull requesta koji se promijenio, umjesto na cijeli kod.

Takođe nije zamjena za integraciono ili end-to-end testiranje. Mutaciono testiranje radi na nivou jedinice, unutar jedne funkcije ili klase; govori vam da li bi vaši unit testovi uhvatili logičku grešku u toj jedinici, a ne da li se vaš sistem ispravno ponaša od početka do kraja. Uz to, bučno je na kodu koji je po prirodi popustljiv — validaciona logika sa mnogo prihvatljivih ulaza, naredbe za logovanje ili getteri i setteri generišu mnogo mutanata koje ili nije moguće smisleno ubiti ili se ne isplati ubijati. Većina alata omogućava da isključite fajlove, metode ili određene tipove mutacija (string literale, pozive za logovanje) kako biste smanjili tu buku, a preskakanje tog koraka konfiguracije je najčešći razlog zbog kojeg timovi jednom probaju mutaciono testiranje i odustanu od njega kao od nečega „presporog i prebučnog".

## Šta dalje

1. Izaberite jedan alat za svoj stek (Stryker za JS/TS ili .NET, PIT za Javu, mutmut za Python) i prvo ga pokrenite nad jednim, poslovno kritičnim modulom, a ne nad cijelim repozitorijumom.
2. Čitajte preživjele mutante, ne samo skor. Svaki od njih je konkretna rupa na kojoj se može raditi: ili napišite test za nju, ili dokumentujte zašto je mutant ekvivalentan i isključite ga.
3. Podesite izuzetke prije nego što donesete sud o alatu. Izbacite bučne tipove mutacija i fajlove male vrijednosti, kako bi preživjeli mutanti koje pregledate bili oni koji su vrijedni vašeg vremena.
4. Ako se pokaže korisnim, pokrećite ga po rasporedu ili samo nad izmijenjenim fajlovima u CI-ju, sa pragom mutacionog skora koji služi kao signal za review, a ne kao tvrdi pad build-a, dok tim ne stekne povjerenje u taj signal.

## Izvori

- [Mutation testing](https://learn.microsoft.com/dotnet/core/testing/mutation-testing) — Microsoft Learn (.NET dokumentacija)
- [How is mutation testing different to coverage measurement?](https://mutants.rs/vs-coverage.html) — mutants.rs
