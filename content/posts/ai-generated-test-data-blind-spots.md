---
title: "AI-Generated Test Data: Why It Looks Right and Still Misses the Bugs That Matter"
title_sr: "Testni podaci generisani AI-jem: zašto izgledaju ispravno, a ipak promaše bitne bagove"
date: 2026-10-14
tags: [qa, ai-in-qa, test-data]
excerpt: GenAI test data generation is everywhere, but trust in it at scale is low. Here's why realistic-looking data still misses the edge cases that break systems.
excerpt_sr: Generisanje testnih podataka GenAI-jem je svuda, ali povjerenje u njega na većem obimu je nisko. Evo zašto realistični podaci i dalje promaše granične slučajeve koji ruše sisteme.
image: assets/blog/ai-generated-test-data-blind-spots.jpg
---
Most QA teams have started using generative AI to produce test data: synthetic customer records, order histories, API payloads, anything that would normally take hours to hand-craft or require scrubbing production data. Adoption is close to universal. Confidence is not. Industry surveys on test data practices report that the overwhelming majority of organizations are using GenAI somewhere in their test data pipeline, yet only a small fraction have fully integrated it or trust it enough to run it unchecked at scale. That gap is worth taking seriously, because it points to a specific failure mode: data that looks plausible can still be the wrong data for finding bugs.

![Realistic synthetic test data passing on one side, broken edge cases and schemas on the other](assets/blog/ai-generated-test-data-blind-spots.jpg)

## Why realistic isn't the same as useful

A language model asked to generate test records is good at one thing: producing output that matches a schema and reads as believable. Ask it for a hundred customer orders and you'll get orders with sensible names, addresses, dates, and totals. What you won't reliably get is the handful of records that actually stress the system: a quantity of zero, a discount that exceeds the order total, a shipping address with no postal code because the country doesn't use one, a timestamp that falls exactly on a daylight-saving transition. Those are the rows that cause defects. They're also exactly the rows a model is least likely to generate on its own, because they're statistically rare in the kind of data it was trained to imitate.

Here's a simplified version of the kind of generation script teams write:

```python
prompt = """
Generate 50 realistic e-commerce order records as JSON.
Fields: order_id, customer_name, quantity, unit_price,
discount_code, discount_percent, shipping_country, order_date.
"""
records = llm_generate(prompt)
```

Run that and inspect the output: every quantity will be a small positive integer, every discount will be a sane percentage, every date will fall in a normal range. Nothing will be malformed, because malformed is not what "realistic" means to the model. The checkout flow that only gets tested against this data will look solid, right up until a real customer enters a quantity of 0, applies two stacked discount codes, or ships to a territory with no postal-code format at all.

## The problem compounds when the same model grades its own data

A related failure shows up when teams go a step further and let the model also decide what the tests should check. If one model generates the data and a model from the same family (or the same prompt pattern) writes the assertions, the assertions tend to validate exactly the properties the data already has. Research on LLM-generated test suites has found that model-written tests cluster around the same blind spots as the model's own output: in evaluations of widely used code benchmarks, roughly half of the problems had test suites that failed to catch known injected errors, and the majority of the verification logic examined was flawed in ways that let incorrect solutions pass. The pattern is consistent: a model's errors and a model's test coverage tend to share the same shape, because both come from the same underlying assumptions about what "normal" input looks like. A green test suite built this way isn't proof of correctness — it's proof that the data and the checks agree with each other, which isn't the same thing.

## Pitfalls and limits

AI-generated test data is genuinely useful for volume and speed, but it has real limits that are easy to ignore once it's producing output fast enough to feel finished.

It can generate records that are technically valid but practically impossible, or miss the rare combinations that actually matter, so test suites built entirely on it can look thorough while leaving real gaps. Bias in the generated distribution is hard to spot by eye, since nothing in the output looks wrong until you compare it against production patterns. Most generation pipelines don't produce an audit trail of why a given record was created or what it was meant to cover, which makes it hard to explain gaps later. And "synthetic" is not automatically "safe": if the generation was conditioned on or fine-tuned from real customer data, the output can still echo sensitive patterns even though no single record is a real person's, so synthetic data headed anywhere near compliance-sensitive systems still needs a privacy review, not an assumption.

## What to do next

Keep a small, human-written set of edge-case records — the zero quantities, boundary dates, malformed addresses, stacked discounts — version it alongside your test suite, and always run it in addition to any AI-generated bulk data, never instead of it.

Don't let the same model (or the same prompt) both generate your test data and write the assertions that check it; have a different reviewer, human or model, define what "correct" means for that data independently.

For any field that has caused a real production bug before, add a property-based or boundary-focused check specifically for it, rather than relying on generated examples to happen to include it.

Before synthetic data touches anything resembling customer records, confirm with whoever owns data compliance whether the generation process was conditioned on real data, and treat it as sensitive until that's confirmed otherwise.

## Sources

- [95% Are Using GenAI for Test Data. Only 10% Trust It at Scale. Why?](https://www.genrocket.com/newsletter/95-are-using-genai-for-test-data-only-10-trust-it-at-scale-why/) — GenRocket
- [The Case for Caution: Evaluating AI-Generated Synthetic Test Data](https://blog.datprof.com/blogs/the-case-for-caution-evaluating-ai-generated-synthetic-test-data) — DATPROF
- [The Test Homogenization Trap](https://agentpatterns.ai/patterns/anti-patterns/test-homogenization-trap/) — Agent Patterns
<!--sr-->
Većina QA timova je počela da koristi generativni AI za pravljenje testnih podataka: sintetičke zapise o kupcima, istorije narudžbi, API payload-e, sve ono što bi inače trajalo satima da se napravi ručno ili bi zahtijevalo čišćenje produkcionih podataka. Usvajanje je skoro univerzalno. Povjerenje nije. Istraživanja o praksama rada sa testnim podacima pokazuju da ogromna većina organizacija koristi GenAI negdje u svom procesu pripreme testnih podataka, ali samo mali dio ga je u potpunosti integrisao ili mu vjeruje dovoljno da ga pušta bez provjere na većem obimu. Taj jaz vrijedi shvatiti ozbiljno, jer ukazuje na konkretan način na koji stvari pucaju: podaci koji izgledaju uvjerljivo i dalje mogu biti pogrešni podaci za pronalaženje bagova.

![Realistični sintetički testni podaci prolaze s jedne strane, pokvareni granični slučajevi i šeme s druge](assets/blog/ai-generated-test-data-blind-spots.jpg)

## Zašto realistično nije isto što i korisno

Jezički model kome se zada da generiše testne zapise dobar je u jednoj stvari: da napravi izlaz koji odgovara šemi i djeluje vjerodostojno. Tražite od njega stotinu narudžbi i dobićete narudžbe sa smislenim imenima, adresama, datumima i iznosima. Ono što nećete pouzdano dobiti je onih nekoliko zapisa koji zaista opterećuju sistem: količina nula, popust veći od ukupnog iznosa narudžbe, adresa za dostavu bez poštanskog broja jer ga ta zemlja ne koristi, vremenska oznaka koja pada tačno na prelazak na ljetnje ili zimsko računanje vremena. To su redovi koji izazivaju defekte. To su ujedno i baš oni redovi koje model najmanje vjerovatno generiše sam od sebe, jer su statistički rijetki u vrsti podataka koju je naučen da imitira.

Evo pojednostavljene verzije skripte za generisanje kakvu timovi obično pišu:

```python
prompt = """
Generate 50 realistic e-commerce order records as JSON.
Fields: order_id, customer_name, quantity, unit_price,
discount_code, discount_percent, shipping_country, order_date.
"""
records = llm_generate(prompt)
```

Pokrenite to i pogledajte izlaz: svaka količina biće mali pozitivan cijeli broj, svaki popust razuman procenat, svaki datum u normalnom opsegu. Ništa neće biti neispravno formatirano, jer za model „realistično" ne znači neispravno. Checkout tok koji se testira samo nad ovim podacima izgledaće stabilno, sve dok pravi kupac ne unese količinu 0, ne primijeni dva kombinovana koda za popust ili ne naruči dostavu na teritoriju koja uopšte nema format poštanskog broja.

## Problem se uvećava kada isti model ocjenjuje sopstvene podatke

Srodan problem se javlja kada timovi odu korak dalje i prepuste modelu da odluči i šta testovi treba da provjeravaju. Ako jedan model generiše podatke, a model iz iste porodice (ili isti obrazac prompta) piše asercije, asercije obično potvrđuju baš ona svojstva koja podaci već imaju. Istraživanja o skupovima testova koje generišu LLM-ovi pokazala su da se testovi koje pišu modeli grupišu oko istih slijepih tačaka kao i izlaz samog modela: u evaluacijama široko korišćenih benchmarka za kod, otprilike polovina zadataka imala je skupove testova koji nisu uhvatili poznate ubačene greške, a većina analizirane logike provjere bila je manjkava na način koji je propuštao netačna rješenja. Obrazac je dosljedan: greške modela i pokrivenost testova koje model piše obično imaju isti oblik, jer oboje proizilaze iz istih pretpostavki o tome kako izgleda „normalan" ulaz. Zelen skup testova napravljen na ovaj način nije dokaz ispravnosti — on je dokaz da se podaci i provjere slažu međusobno, a to nije isto.

## Zamke i ograničenja

Testni podaci generisani AI-jem su zaista korisni za obim i brzinu, ali imaju stvarna ograničenja koja je lako zanemariti kada izlaz stiže dovoljno brzo da djeluje gotovo.

Mogu da generišu zapise koji su tehnički validni, ali praktično nemogući, ili da promaše rijetke kombinacije koje su zaista bitne, pa skupovi testova izgrađeni isključivo na njima mogu izgledati temeljno, a ostavljati stvarne rupe. Pristrasnost u generisanoj raspodjeli teško je primijetiti golim okom, jer ništa u izlazu ne izgleda pogrešno dok ga ne uporedite sa obrascima iz produkcije. Većina procesa za generisanje ne ostavlja trag o tome zašto je određeni zapis napravljen ili šta je trebalo da pokrije, pa je kasnije teško objasniti rupe u pokrivenosti. I „sintetičko" ne znači automatski „bezbjedno": ako je generisanje bilo uslovljeno pravim podacima kupaca ili je model na njima dodatno treniran, izlaz i dalje može da odražava osjetljive obrasce iako nijedan pojedinačni zapis ne pripada stvarnoj osobi. Zato sintetički podaci koji idu bilo gdje blizu sistema osjetljivih na usklađenost sa propisima i dalje zahtijevaju provjeru privatnosti, a ne pretpostavku.

## Šta dalje

Održavajte mali, ručno napisan skup zapisa za granične slučajeve — nulte količine, granične datume, neispravne adrese, kombinovane popuste — verzionišite ga zajedno sa testovima i uvijek ga pokrećite pored bilo kakvih masovnih podataka generisanih AI-jem, nikada umjesto njih.

Ne dozvolite da isti model (ili isti prompt) i generiše testne podatke i piše asercije koje ih provjeravaju; neka drugi recenzent, čovjek ili model, nezavisno definiše šta za te podatke znači „ispravno".

Za svako polje koje je već izazvalo pravi bag u produkciji dodajte provjeru zasnovanu na svojstvima (property-based) ili na graničnim vrijednostima, posebno za to polje, umjesto da se oslanjate na to da će generisani primjeri slučajno uključiti taj slučaj.

Prije nego što sintetički podaci dođu u dodir sa bilo čim što liči na podatke kupaca, provjerite sa osobom zaduženom za usklađenost podataka da li je proces generisanja bio uslovljen pravim podacima i tretirajte ih kao osjetljive dok se ne potvrdi suprotno.

## Izvori

- [95% Are Using GenAI for Test Data. Only 10% Trust It at Scale. Why?](https://www.genrocket.com/newsletter/95-are-using-genai-for-test-data-only-10-trust-it-at-scale-why/) — GenRocket
- [The Case for Caution: Evaluating AI-Generated Synthetic Test Data](https://blog.datprof.com/blogs/the-case-for-caution-evaluating-ai-generated-synthetic-test-data) — DATPROF
- [The Test Homogenization Trap](https://agentpatterns.ai/patterns/anti-patterns/test-homogenization-trap/) — Agent Patterns
