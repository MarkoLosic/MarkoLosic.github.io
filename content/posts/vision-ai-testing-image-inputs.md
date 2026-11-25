---
title: "Testing AI Features That See: QA for Image and Document Inputs"
title_sr: "Testiranje AI funkcionalnosti koje vide: QA za ulazne slike i dokumente"
date: 2026-11-25
time: 17:00
tags: [ai-testing, test-automation]
excerpt: Vision AI features fail in two ways text-only QA misses: bad input images and confident hallucinations. Here's how to test for both.
excerpt_sr: Vision AI funkcionalnosti zakazuju na dva načina koje QA fokusiran samo na tekst propušta: loše ulazne slike i samouvjerene halucinacije. Evo kako testirati oba.
image: assets/blog/vision-ai-testing-image-inputs.jpg
---
More products now put a camera or a photo upload in front of an AI model: scan a receipt, verify an ID, snap a shelf and ask what's missing, upload a screenshot and ask for a fix. The text-only habits QA has built up for LLM features — rubric-based grading, golden-output diffs, prompt regression suites — only cover half of what can go wrong here. An image-based feature can fail because the photo itself is unusable, and it can fail in a second, quieter way: by giving a confident, well-formatted, wrong answer about an image it never actually looked at closely. Both need their own test design.

![Illustration of vision AI testing: a glowing camera-lens eye scanning two receipts—an orange shield blocking a blurry receipt on the left, while a sharp receipt on the right feeds data into a neural network alongside warning icons representing visual hallucinations](assets/blog/vision-ai-testing-image-inputs.jpg)

## Why a good test image is harder to produce than a good test string

A text test case is deterministic: you write the string, the model sees exactly that string. A photo is not. The same receipt looks different depending on phone model, lighting, compression, and whether the user's hand is shaking. A suite built only from a handful of clean, well-lit sample photos will pass in CI and then fail constantly in production, because real input is messier than anything a QA engineer photographs at their desk.

The fix teams increasingly reach for is a quality gate in front of the model: a cheap check that flags images as too blurry, too low-resolution, too dark, or too noisy before they reach the expensive model call. This is worth testing as its own component, separately from the model:

```python
from imageguard import validate

result = validate(
    "receipt.jpg",
    thresholds={"blur_score": 60.0, "resolution_score": 70.0},
)

if not result.ok:
    # The model is never called; the user is asked to retake the photo
    raise ValueError(f"Image rejected before model call: {result.reason}")
```

The QA question isn't just "does the OCR work on a clean photo," it's "does the gate catch the bad photo before it wastes a model call, and does it let a legitimately readable one through." Test both directions: a deliberately blurry, rotated, glare-heavy photo should be rejected; a slightly tilted but legible one should not be, just because it isn't studio-perfect. Teams that skip the second check end up with a feature that "works" but rejects a large share of real user photos — a bug that shows up as a support ticket, not a failed test.

## Feeding the model controlled test images instead of photographing paper by hand

Building a library of edge-case images (blurry, tilted, glare on the text, low light, extreme close-up) and manually photographing them for every test run doesn't scale. Mobile device testing platforms support image injection: uploading a test image so it appears to the app as if it came from the live camera feed, through the same camera API the app would normally use. The app processes it exactly as it would a real photo, but the input is now a fixed file you control and can version in your repo.

This turns "camera-based AI feature" testing into something closer to ordinary regression testing: a folder of twenty or so edge-case images, each with an expected outcome (reject, extract correctly, extract with a flagged low-confidence field), run automatically whenever the pipeline changes. It's a meaningful upgrade over manually printing a document and pointing a phone at it under office lighting, which is slow, inconsistent between runs, and nearly impossible to reproduce when a bug is reported.

## The bug that only shows up when you ask about something that isn't there

The second failure mode is specific to vision models and has no text-only equivalent: the model describing details it did not actually see. Research on multimodal model behavior has documented this as visual hallucination, including a pattern where a model confidently describes visual features even when no image was provided at all — and where, in at least one study, this tendency was more pronounced in newer model versions than older ones. The model isn't failing to read the image carefully; it's filling the gap with a plausible-sounding guess, formatted exactly like a correct answer.

For QA this means your test set needs negative questions alongside your normal extraction checks. If a receipt scanner is asked "what's the tip amount" on a receipt with no tip line, the correct behavior is some form of "I don't see a tip amount here," not a fabricated number. Build a handful of these per feature: ask about a field or detail deliberately absent from the test image, and check whether the response flags the absence or invents an answer. This single test category catches a class of bug a clean-image, correct-answer test suite will never surface, because every one of its images actually contains what's being asked about.

## Pitfalls and limits

- Image injection tests the vision/model pipeline, not the camera hardware — autofocus, HDR processing, and real-device quirks still need periodic testing on physical devices.
- A hallucination test set isn't a one-time deliverable; model and prompt updates can change this behavior, sometimes for the worse, so rerun it on every model or prompt change, not just once.
- Quality gates can overcorrect: a threshold tuned to reject every blurry test image will also reject photos real users would consider fine — trading one bug for a worse one.
- Image inputs cost more tokens and latency than text, so a large eval set is expensive to run on every change; most teams need a small, high-signal set on every change and a larger one periodically.
- A model that answers "I don't know" to every negative question technically passes the hallucination check while being useless on real questions — grade for calibration, not just the absence of wrong answers.

## What to do next

1. Build a folder of 15-30 deliberately bad test images (blur, rotation, glare, low light, low resolution) with an expected pass/reject outcome for each, and automate feeding them into your pipeline via image injection or a direct API test rather than photographing them by hand.
2. Add negative questions to your model eval set that ask about details absent from each test image, and grade responses on whether they flag the absence instead of fabricating an answer.
3. Test your image quality gate in both directions: confirm it rejects the bad images and does not reject realistic, slightly imperfect ones.
4. Re-run the hallucination and extraction eval sets whenever the underlying model or prompt changes, not just when the surrounding application code changes.

If you are building out an AI QA practice, see also [my local LLM testing case study](/llm-testing/) (100 domain prompts graded by hand), [Testing AI Features That Don't Give the Same Answer Twice](/blog/testing-non-deterministic-ai-features/), and [Testing RAG Pipelines](/blog/testing-rag-pipelines-retrieval-evaluation/).


## Sources

- [Mirage: The Illusion of Visual Understanding](https://arxiv.org/html/2603.21687v1)
- [HallusionBench: An Advanced Diagnostic Suite for Entangled Language Hallucination and Visual Illusion in Large Vision-Language Models](https://arxiv.org/pdf/2310.14566)
- [pCloudy: Image Injection and Camera Input Testing](https://www.pcloudy.com/?p=26989)
- [imageguard: Validate images before AI pipelines](https://pypi.org/project/imageguard/)

<!--sr-->

Sve više proizvoda danas stavlja kameru ili otpremanje fotografije ispred AI modela: skenirajte račun, verifikujte lični dokument, fotografišite policu i pitajte šta nedostaje, otpremite screenshot i zatražite rješenje. Navike koje je QA razvio za tekstualne LLM funkcionalnosti — ocjenjivanje pomoću rubrika, poređenje sa referentnim izlazima, regresioni skupovi za promptove — pokrivaju samo polovinu onoga što ovdje može poći po zlu. Funkcionalnost zasnovana na slikama može zakazati zato što je sama fotografija neupotrebljiva, ali može zakazati i na drugi, tiši način: tako što daje samouvjeren, lijepo formatiran, pogrešan odgovor o slici koju zapravo nije ni pažljivo pogledala. Oba problema zahtijevaju sopstveni dizajn testova.

![Ilustracija testiranja vision AI sistema: svjetleće oko sa sočivom kamere skenira dva računa — narandžasti štit na lijevoj strani blokira zamućeni račun, dok oštar račun na desnoj strani šalje podatke u neuronsku mrežu uz ikone upozorenja koje predstavljaju vizuelne halucinacije](assets/blog/vision-ai-testing-image-inputs.jpg)

## Zašto je dobru testnu sliku teže napraviti nego dobar testni tekst

Tekstualni testni slučaj je deterministički: napišete string, model vidi tačno taj string. Fotografija nije takva. Isti račun izgleda drugačije u zavisnosti od modela telefona, osvjetljenja, kompresije i toga da li se korisniku trese ruka. Skup testova sastavljen samo od nekoliko čistih, dobro osvijetljenih uzoraka prolaziće u CI-ju, a onda stalno padati u produkciji, jer su stvarni ulazi neuredniji od svega što QA inženjer fotografiše za svojim stolom.

Rješenje za kojim timovi sve češće posežu jeste kontrola kvaliteta (quality gate) ispred modela: jeftina provjera koja označava slike kao previše zamućene, preniske rezolucije, pretamne ili sa previše šuma prije nego što stignu do skupog poziva modela. Ovo vrijedi testirati kao zasebnu komponentu, odvojeno od samog modela:

```python
from imageguard import validate

result = validate(
    "receipt.jpg",
    thresholds={"blur_score": 60.0, "resolution_score": 70.0},
)

if not result.ok:
    # Model se uopšte ne poziva; od korisnika se traži da ponovo fotografiše
    raise ValueError(f"Image rejected before model call: {result.reason}")
```

QA pitanje nije samo "da li OCR radi na čistoj fotografiji", već "da li gate zaustavlja lošu fotografiju prije nego što potroši poziv ka modelu i da li propušta fotografiju koja je realno čitljiva". Testirajte u oba smjera: namjerno zamućena, zarotirana fotografija sa jakim odsjajem treba biti odbijena; blago nagnuta, ali čitljiva fotografija ne smije biti odbijena samo zato što nije studijski savršena. Timovi koji preskoče drugu provjeru završe sa funkcionalnošću koja "radi", ali odbija veliki dio stvarnih korisničkih fotografija — bag koji se pojavljuje kao tiket korisničke podrške, a ne kao pao test.

## Slanje kontrolisanih testnih slika modelu umjesto ručnog fotografisanja papira

Kreiranje biblioteke graničnih slučajeva (zamućeno, nagnuto, odsjaj preko teksta, slabo osvjetljenje, ekstremni krupni plan) i ručno fotografisanje za svako pokretanje testova ne skalira. Platforme za testiranje mobilnih uređaja podržavaju image injection: otpremanje testne slike tako da aplikaciji izgleda kao da je došla direktno sa kamere, kroz isti camera API koji aplikacija inače koristi. Aplikacija je obrađuje potpuno isto kao stvarnu fotografiju, ali je ulaz sada fiksan fajl koji vi kontrolišete i možete verzionisati u repozitorijumu.

Time se testiranje "AI funkcionalnosti zasnovane na kameri" pretvara u nešto bliže uobičajenom regresionom testiranju: folder sa dvadesetak slika graničnih slučajeva, svaka sa očekivanim ishodom (odbij, izvuci tačno, izvuci uz označeno polje niske pouzdanosti), koji se pokreće automatski kad god se pipeline promijeni. To je značajno unapređenje u odnosu na ručno štampanje dokumenta i usmjeravanje telefona pod kancelarijskim svjetlom, što je sporo, nedosljedno između pokretanja i gotovo nemoguće reprodukovati kada se prijavi bag.

## Bag koji se pojavljuje tek kada pitate za nešto čega na slici nema

Drugi način zakazivanja specifičan je za vision modele i nema ekvivalent u radu samo sa tekstom: model opisuje detalje koje zapravo nije vidio. Istraživanja ponašanja multimodalnih modela dokumentovala su ovo kao vizuelnu halucinaciju, uključujući obrazac u kom model samouvjereno opisuje vizuelne karakteristike čak i kada slika uopšte nije dostavljena — a u najmanje jednoj studiji ova sklonost bila je izraženija kod novijih verzija modela nego kod starijih. Model ne propušta da pažljivo pročita sliku; on popunjava prazninu uvjerljivim nagađanjem, formatiranim potpuno isto kao tačan odgovor.

Za QA to znači da vaš skup testova pored standardnih provjera ekstrakcije mora imati i negativna pitanja. Ako skener računa pitate "koliki je iznos napojnice" na računu koji nema stavku za napojnicu, ispravno ponašanje je neki oblik odgovora "ovdje ne vidim iznos napojnice", a ne izmišljen broj. Napravite nekoliko ovakvih slučajeva po funkcionalnosti: pitajte za polje ili detalj koji namjerno nedostaje na testnoj slici i provjerite da li odgovor ukazuje na odsustvo ili izmišlja podatak. Ova jedna kategorija testova hvata klasu bagova koju skup testova sa čistim slikama i tačnim odgovorima nikad neće otkriti, jer svaka njegova slika zaista sadrži ono za šta se pita.

## Zamke i ograničenja

- Image injection testira vision/model pipeline, a ne hardver kamere — autofokus, HDR obrada i specifičnosti stvarnih uređaja i dalje zahtijevaju povremeno testiranje na fizičkim telefonima.
- Skup testova za halucinacije nije jednokratan zadatak; ažuriranja modela i promptova mogu promijeniti ovo ponašanje, ponekad i nagore, pa ga pokrećite ponovo pri svakoj promjeni modela ili prompta, a ne samo jednom.
- Kontrole kvaliteta mogu pretjerati: prag podešen tako da odbije svaku zamućenu testnu sliku odbijaće i fotografije koje stvarni korisnici smatraju sasvim dobrim — čime jedan bag zamjenjujete gorim.
- Ulazne slike troše više tokena i imaju veću latenciju od teksta, pa je veliki eval skup skupo pokretati pri svakoj izmjeni; većini timova treba mali skup visokog signala na svaku promjenu i veći skup povremeno.
- Model koji na svako negativno pitanje odgovara "ne znam" tehnički prolazi provjeru halucinacija dok je istovremeno beskoristan na stvarnim pitanjima — ocjenjujte kalibraciju, a ne samo odsustvo pogrešnih odgovora.

## Šta dalje

1. Napravite folder od 15 do 30 namjerno loših testnih slika (zamućenje, rotacija, odsjaj, slabo osvjetljenje, niska rezolucija) sa očekivanim ishodom prolaz/odbijanje za svaku, i automatizujte njihovo slanje u pipeline putem image injection-a ili direktnog API testa umjesto ručnog fotografisanja.
2. Dodajte negativna pitanja u eval skup modela koja pitaju za detalje odsutne sa svake testne slike, i ocjenjujte odgovore prema tome da li označavaju odsustvo umjesto da izmišljaju odgovor.
3. Testirajte quality gate za slike u oba smjera: potvrdite da odbija loše slike i da ne odbija realistične, blago nesavršene fotografije.
4. Ponovo pokrećite eval skupove za halucinacije i ekstrakciju kad god se promijeni osnovni model ili prompt, a ne samo kada se mijenja okolni kod aplikacije.

Ako gradiš praksu za testiranje AI sistema, pogledaj i [studiju slučaja testiranja lokalnog LLM-a](/llm-testing/) (100 domenskih promptova ručno ocijenjenih), kao i članke [Testiranje AI funkcionalnosti koje ne daju isti odgovor dvaput](/sr/blog/testing-non-deterministic-ai-features/) i [Testiranje RAG pipeline-a](/sr/blog/testing-rag-pipelines-retrieval-evaluation/).


## Izvori

- [Mirage: The Illusion of Visual Understanding](https://arxiv.org/html/2603.21687v1)
- [HallusionBench: An Advanced Diagnostic Suite for Entangled Language Hallucination and Visual Illusion in Large Vision-Language Models](https://arxiv.org/pdf/2310.14566)
- [pCloudy: Image Injection and Camera Input Testing](https://www.pcloudy.com/?p=26989)
- [imageguard: Validate images before AI pipelines](https://pypi.org/project/imageguard/)
