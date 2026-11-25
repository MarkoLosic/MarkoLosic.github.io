---
title: "Testing RAG Pipelines: Why Your Retrieval Step Needs Its Own Test Suite"
title_sr: "Testiranje RAG pipeline-a: zašto korak pretrage treba sopstveni skup testova"
date: 2026-11-18
time: 18:30
tags: [ai-testing, test-automation]
excerpt: RAG systems fail quietly when retrieval goes wrong. Here's how to test retrieval and generation separately, with a worked example and a metric to watch.
excerpt_sr: RAG sistemi tiho otkazuju kada pretraga pogriješi. Evo kako testirati pretragu i generisanje odvojeno, uz konkretan primjer i metriku koju vrijedi pratiti.
image: assets/blog/testing-rag-pipelines-retrieval-evaluation.jpg
---
A support bot built on retrieval-augmented generation answers a pricing question with total confidence. The number is wrong — it was retired two releases ago. No exception was thrown, no test failed, nothing in the logs looks unusual. The model did exactly what it was built to do: generate a fluent answer from whatever context it was handed. The bug was never in the language model. It was in what got retrieved.

![Isometric illustration of a RAG pipeline: a stack of documents inspected by a magnifying glass, with two irrelevant documents highlighted in red, flowing into a generation layer that produces an answer, each stage under its own verification shield](assets/blog/testing-rag-pipelines-retrieval-evaluation.jpg)

This is the pattern that trips up teams testing RAG systems for the first time: treating the pipeline as one thing and testing it the way you'd test any AI feature — a handful of prompts, eyeballed outputs, a vibe check. A RAG pipeline is two systems wearing one coat: a retriever that searches a knowledge base, and a generator that writes an answer from what the retriever hands it. Each fails independently, and a single end-to-end "looks right" check can't tell you which one broke.

## Why one score isn't enough

If you only check whether the final answer sounds correct, you're left guessing at the cause when it isn't. Maybe the retriever pulled the wrong chunks. Maybe it pulled the right ones but the model ignored them and answered from its own training data instead. Maybe the chunks were right but years out of date in the index. Each needs a different fix, and none show up as an error in monitoring — the pipeline runs fine, returns a response on time, and simply hands the user something false.

The standard remedy is to split evaluation into the two components the pipeline actually has:

- **Retrieval quality**: did the system fetch the right documents, and rank them so the relevant ones are near the top?
- **Generation quality**: given those documents, did the model produce an answer that's actually grounded in them, and that addresses the question?

The RAGAS framework (Retrieval Augmented Generation Assessment) is the most common way teams operationalize this split. It scores four things, two per side: **context precision** (what fraction of retrieved chunks were actually relevant) and **context recall** (whether the retrieved set covers everything needed to answer) on the retrieval side; **faithfulness** (whether every claim in the answer is supported by the retrieved context) and **answer relevancy** (whether the answer actually addresses the question) on the generation side.

## A worked example

Say your retriever returns five chunks for a query, and three are actually relevant. Context precision is 0.6 — the retriever is noisy, even if the final answer happens to be fine. Now say the correct answer needs three distinct facts and retrieval only surfaced two. Context recall is roughly 0.67 — a gap the model has no way to fill, however good it is at writing.

Reading these two together is where the diagnostic value sits:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Faithfulness</th><th>Context precision/recall</th><th>What it tells you</th></tr></thead>
<tbody>
<tr><td>High</td><td>High</td><td>Pipeline is healthy</td></tr>
<tr><td>High</td><td>Low</td><td>Retrieval is noisy or incomplete; model handles it correctly — fix the retriever</td></tr>
<tr><td>Low</td><td>High</td><td>Right docs retrieved, model isn't using them — check context truncation or prompt structure</td></tr>
<tr><td>Low</td><td>Low</td><td>Both halves broken — start with retrieval; generation can't be scored fairly on bad input</td></tr>
</tbody>
</table>
</div>
<!--/html-->

A minimal RAGAS test case needs only the query, the retrieved context, and the generated answer — no ground-truth answer required for faithfulness or answer relevancy. Context recall does need a reference answer, which is the thing to budget time for: even 30–50 labeled question/reference-answer pairs from your own domain is what makes this testable at all.

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness, answer_relevancy,
    context_precision, context_recall,
)

results = evaluate(
    dataset=your_eval_dataset,  # query, retrieved_context, answer, ground_truth
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
)
# {'faithfulness': 0.97, 'answer_relevancy': 0.94,
#  'context_precision': 0.62, 'context_recall': 0.71}
```

A result like that — strong generation scores, weak retrieval scores — is the quiet-failure pattern in a nutshell: nothing crashes, nothing looks wrong at a glance, but the system is serving answers built on gaps or noise. Run it as a CI gate with a fixed threshold and you catch regressions the way you'd catch a failing unit test, instead of finding out from a user complaint.

## Pitfalls and limits

Metric-driven RAG evaluation has real blind spots. Context precision treats a relevant chunk ranked first the same as one ranked fourth, as long as the chunk count and relevance ratio match — but a retriever that buries the right answer near the context window's cutoff behaves worse in practice than the score admits. Pair RAGAS with rank-aware classical metrics (MRR, nDCG) if ranking quality matters to your use case.

The deeper trap is staleness, invisible to every metric above. A RAGAS score computed today says nothing about whether your index still matches your source documents next month. Source content changes, chunking logic changes, embedding models get upgraded — any of these can leave an index full of vectors that score well on relevance while describing something no longer true, with latency and throughput staying green the whole time. If your knowledge base changes at all, freshness needs its own check, separate from the RAGAS run, because a faithful answer to a stale fact is still wrong.

LLM-as-judge scoring, which RAGAS relies on for all four metrics, has its own failure mode too: the judge model can be fooled by the same confident, well-structured wrong answer that fools a user. Spot-check a sample of judge verdicts by hand before trusting a dashboard full of green numbers.

## What to do next

1. Log retrieved chunks as their own span, separate from the final answer, so each stage can be scored on its own.
2. Build a small labeled eval set (30–50 real questions with reference answers) from your own domain rather than synthetic queries — the one-time cost that makes context recall measurable at all.
3. Run RAGAS, or an alternative like DeepEval, as a CI gate with explicit thresholds, not a one-off report glanced at after a demo.
4. Add a freshness check — periodic re-embed-and-compare of a reference document set, or change-data-capture on your source corpus — so a pipeline that scores well today doesn't quietly rot by next quarter.

For related AI QA patterns, see [how I test a local Llama 3 model with 100 prompts](/llm-testing/), [Testing AI Features That See](/blog/vision-ai-testing-image-inputs/), and [Testing AI Features That Don't Give the Same Answer Twice](/blog/testing-non-deterministic-ai-features/).


## Sources

- [Braintrust: How to test your RAG pipeline](https://www.braintrust.dev/articles/how-to-test-rag-pipeline)
- [DeepEval: RAG evaluation metrics](https://deepeval.com/docs/getting-started-rag)
- [RAGAS documentation via PromptLayer glossary](https://www.promptlayer.com/glossary/ragas-metrics)
- [Perficient: How to test a RAG system with RAGAS](https://blogs.perficient.com/how-to-test-a-rag-system-ragas-hallucination-detection-and-the-complete-genai-ci-cd-pipeline/)
- [Tian Pan: The RAG freshness problem](https://tianpan.co/blog/2026-04-10-rag-freshness-problem-stale-embeddings-silent-failure)

<!--sr-->

Bot za korisničku podršku izgrađen na retrieval-augmented generation (RAG) arhitekturi odgovara na pitanje o cijenama sa potpunom sigurnošću. Broj je pogrešan — povučen je prije dva izdanja. Nije bačen nijedan izuzetak, nijedan test nije pao, ništa u logovima ne izgleda neobično. Model je uradio tačno ono za šta je napravljen: generisao je tečan odgovor iz konteksta koji mu je predat. Bug nikad nije bio u jezičkom modelu. Bio je u onome što je pronađeno.

![Izometrijska ilustracija RAG pipeline-a: gomila dokumenata koju pregleda lupa, sa dva nerelevantna dokumenta označena crvenom bojom, koji teku ka sloju za generisanje koji proizvodi odgovor, pri čemu je svaka faza pod sopstvenim štitom verifikacije](assets/blog/testing-rag-pipelines-retrieval-evaluation.jpg)

Ovo je obrazac koji saplete timove koji prvi put testiraju RAG sisteme: pipeline se tretira kao jedna cjelina i testira se kao bilo koja AI funkcionalnost — nekoliko promptova, izlazi provjereni odokativno, testiranje "po osjećaju". RAG pipeline su zapravo dva sistema u jednom kaputu: retriever koji pretražuje bazu znanja i generator koji piše odgovor na osnovu onoga što mu retriever preda. Svaki od njih otkazuje nezavisno, a jedna end-to-end provjera tipa "izgleda dobro" ne može da vam kaže koji se pokvario.

## Zašto jedna ocjena nije dovoljna

Ako provjeravate samo da li konačni odgovor zvuči tačno, ostaje vam da nagađate uzrok kada nije. Možda je retriever izvukao pogrešne djelove (chunks). Možda je izvukao prave, ali ih je model ignorisao i odgovorio iz sopstvenih podataka za treniranje. Možda su djelovi bili pravi, ali godinama zastarjeli u indeksu. Svaki slučaj traži drugačiju ispravku, a nijedan se ne pojavljuje kao greška u monitoringu — pipeline radi normalno, vraća odgovor na vrijeme i korisniku jednostavno preda nešto netačno.

Standardno rješenje je podijeliti evaluaciju na dvije komponente koje pipeline zaista ima:

- **Kvalitet pretrage**: da li je sistem pronašao prave dokumente i rangirao ih tako da su relevantni pri vrhu?
- **Kvalitet generisanja**: s obzirom na te dokumente, da li je model dao odgovor koji je zaista utemeljen u njima i koji odgovara na pitanje?

RAGAS framework (Retrieval Augmented Generation Assessment) je najčešći način na koji timovi sprovode ovu podjelu u praksi. Ocjenjuje četiri stvari, po dvije sa svake strane: **context precision** (koji udio pronađenih djelova je zaista relevantan) i **context recall** (da li pronađeni skup pokriva sve što je potrebno za odgovor) na strani pretrage; **faithfulness** (da li je svaka tvrdnja u odgovoru potkrijepljena pronađenim kontekstom) i **answer relevancy** (da li odgovor zaista odgovara na pitanje) na strani generisanja.

## Konkretan primjer

Recimo da vaš retriever za neki upit vrati pet djelova, od kojih su tri zaista relevantna. Context precision je 0,6 — retriever je "bučan", čak i ako je konačni odgovor slučajno dobar. Sada recimo da tačan odgovor zahtijeva tri različite činjenice, a pretraga je pronašla samo dvije. Context recall je otprilike 0,67 — rupa koju model nikako ne može da popuni, koliko god dobro pisao.

Dijagnostička vrijednost je u čitanju ovih metrika zajedno:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Faithfulness</th><th>Context precision/recall</th><th>Šta vam govori</th></tr></thead>
<tbody>
<tr><td>Visok</td><td>Visok</td><td>Pipeline je zdrav</td></tr>
<tr><td>Visok</td><td>Nizak</td><td>Pretraga je bučna ili nepotpuna; model to ispravno obrađuje — popravite retriever</td></tr>
<tr><td>Nizak</td><td>Visok</td><td>Pronađeni su pravi dokumenti, ali ih model ne koristi — provjerite odsijecanje konteksta ili strukturu prompta</td></tr>
<tr><td>Nizak</td><td>Nizak</td><td>Obje polovine su pokvarene — počnite od pretrage; generisanje se ne može pošteno ocijeniti na lošem ulazu</td></tr>
</tbody>
</table>
</div>
<!--/html-->

Minimalnom RAGAS test slučaju potrebni su samo upit, pronađeni kontekst i generisani odgovor — za faithfulness i answer relevancy referentni (ground-truth) odgovor nije potreban. Context recall ipak zahtijeva referentni odgovor, i za to treba odvojiti vrijeme: već 30–50 označenih parova pitanje/referentni odgovor iz vašeg domena je ono što ovo uopšte čini mjerljivim.

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness, answer_relevancy,
    context_precision, context_recall,
)

results = evaluate(
    dataset=your_eval_dataset,  # query, retrieved_context, answer, ground_truth
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
)
# {'faithfulness': 0.97, 'answer_relevancy': 0.94,
#  'context_precision': 0.62, 'context_recall': 0.71}
```

Ovakav rezultat — visoke ocjene generisanja, niske ocjene pretrage — je obrazac tihog otkaza u malom: ništa ne puca, ništa na prvi pogled ne izgleda pogrešno, ali sistem servira odgovore izgrađene na rupama ili šumu. Pokrenite ovo kao CI provjeru (gate) sa fiksnim pragom i hvataćete regresije kao što hvatate unit test koji pada, umjesto da za njih saznate iz korisničke žalbe.

## Zamke i ograničenja

Evaluacija RAG-a zasnovana na metrikama ima stvarne slijepe tačke. Context precision tretira relevantan dio rangiran kao prvi isto kao onaj rangiran kao četvrti, sve dok se broj djelova i odnos relevantnosti poklapaju — ali retriever koji zakopa pravi odgovor blizu granice kontekstnog prozora u praksi se ponaša lošije nego što ocjena priznaje. Ako vam je kvalitet rangiranja bitan, kombinujte RAGAS sa klasičnim metrikama koje uzimaju rang u obzir (MRR, nDCG).

Dublja zamka je zastarjelost, nevidljiva za sve gore navedene metrike. RAGAS ocjena izračunata danas ne govori ništa o tome da li će vaš indeks i sljedećeg mjeseca odgovarati izvornim dokumentima. Izvorni sadržaj se mijenja, logika dijeljenja na djelove se mijenja, embedding modeli se nadograđuju — bilo šta od ovoga može ostaviti indeks pun vektora koji dobro prolaze na relevantnosti, a opisuju nešto što više nije tačno, dok latencija i propusnost sve vrijeme ostaju zelene. Ako se vaša baza znanja uopšte mijenja, svježina treba sopstvenu provjeru, odvojenu od RAGAS pokretanja, jer je vjeran odgovor na zastarjelu činjenicu i dalje pogrešan.

Ocjenjivanje pomoću LLM-a kao sudije (LLM-as-judge), na koje se RAGAS oslanja za sve četiri metrike, ima i sopstveni način otkazivanja: model-sudiju može da zavara isti samouvjeren, dobro strukturiran pogrešan odgovor koji zavara i korisnika. Ručno provjerite uzorak presuda sudije prije nego što povjerujete dashboard-u punom zelenih brojeva.

## Šta dalje

1. Logujte pronađene djelove kao poseban span, odvojeno od konačnog odgovora, kako bi se svaka faza mogla ocijeniti zasebno.
2. Napravite mali označeni evaluacioni skup (30–50 stvarnih pitanja sa referentnim odgovorima) iz sopstvenog domena umjesto sintetičkih upita — to je jednokratni trošak koji context recall uopšte čini mjerljivim.
3. Pokrećite RAGAS, ili alternativu kao što je DeepEval, kao CI gate sa eksplicitnim pragovima, a ne kao jednokratan izvještaj koji se pogleda poslije demo prezentacije.
4. Dodajte provjeru svježine — periodično ponovno embedovanje i poređenje referentnog skupa dokumenata, ili change-data-capture na izvornom korpusu — kako pipeline koji danas ima dobre ocjene ne bi tiho istrulio do sljedećeg kvartala.

Za povezane obrasce u testiranju AI sistema, pogledaj [kako testiram lokalni Llama 3 model sa 100 promptova](/llm-testing/), kao i članke [Testiranje AI funkcionalnosti koje vide](/sr/blog/vision-ai-testing-image-inputs/) i [Testiranje AI funkcionalnosti koje ne daju isti odgovor dvaput](/sr/blog/testing-non-deterministic-ai-features/).


## Izvori

- [Braintrust: How to test your RAG pipeline](https://www.braintrust.dev/articles/how-to-test-rag-pipeline)
- [DeepEval: RAG evaluation metrics](https://deepeval.com/docs/getting-started-rag)
- [RAGAS documentation via PromptLayer glossary](https://www.promptlayer.com/glossary/ragas-metrics)
- [Perficient: How to test a RAG system with RAGAS](https://blogs.perficient.com/how-to-test-a-rag-system-ragas-hallucination-detection-and-the-complete-genai-ci-cd-pipeline/)
- [Tian Pan: The RAG freshness problem](https://tianpan.co/blog/2026-04-10-rag-freshness-problem-stale-embeddings-silent-failure)
