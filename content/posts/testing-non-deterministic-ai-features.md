---
title: "Testing AI Features That Don't Give the Same Answer Twice"
title_sr: "Testiranje AI funkcija koje nikad ne daju isti odgovor dvaput"
date: 2026-10-21
time: 12:00
tags: [qa, ai-in-qa, llm-testing, test-automation]
excerpt: Why assert-equal breaks on LLM-powered features, and how to replace it with rubric-based and intent-based checks that actually catch regressions.
excerpt_sr: Zašto assert-equal ne radi na funkcijama zasnovanim na LLM-u i kako ga zamijeniti provjerama zasnovanim na rubrikama i namjeri, koje zaista hvataju regresije.
image: assets/blog/testing-non-deterministic-ai-features.jpg
---
A support chatbot answers a refund question correctly on Monday. On Tuesday, after nothing changed in the code, it gives a different but equally correct answer — different wording, same facts. A test that asserts the response equals a fixed string fails every time the wording changes, whether or not anything actually broke. This is the core problem with testing AI-generated output: the thing you're testing doesn't have a single right answer, so the testing approach has to change, not just the test data.

![Illustration of a test function with a crossed-out assertEqual(output, expected) and a FAIL badge on the left, and on the right many branching evaluation paths passing through rubric, judge and safety checks that end in green checkmarks and red crosses](assets/blog/testing-non-deterministic-ai-features.jpg)

## Why assert-equal stops working

Deterministic code gives the same output for the same input, so `assertEqual(response, expected)` is a reasonable check. A generative feature built on an LLM doesn't work that way. Sampling temperature, model updates, retrieval changes in a RAG pipeline, or even unrelated prompt tweaks can all change the exact wording of a correct response. Keyword or regex checks don't fix this: they produce false failures when correct wording changes, and false passes when the right keyword shows up inside a wrong answer. The practical result is that teams either drop automated checks for AI features and rely on manual spot-checks before release, or they write brittle string matchers that get disabled within a month because they're always red.

The fix isn't a cleverer string match. It's testing properties of the output instead of its exact text — what's sometimes called intent-based or rubric-based testing.

## What to check instead

For a feature like a knowledge-base-backed support chatbot, a useful rubric usually checks:

- **Relevance** — does the response actually address what the user asked?
- **Factual consistency** — does it agree with the source documents it was supposed to use, not just sound plausible?
- **Hallucination** — does it introduce any claim that isn't in the knowledge base (a refund window, a price, a policy exception)?
- **Scope adherence** — does it stay inside its domain and avoid leaking another customer's data or an internal-only detail?
- **Safety** — no harmful, biased, or PII-exposing content.

Take a concrete case: a knowledge-base article says refunds are available within 30 days of purchase with a receipt. Two chatbot responses to "Can I get a refund on an item I bought three weeks ago?" might read:

> "Yes, since it's within the 30-day window, you're eligible for a refund as long as you have your receipt."

> "You're still inside the refund period (30 days), so a refund is possible — you'll just need to show proof of purchase."

Different sentences, same facts, both correct. A string-match test fails both. A rubric check — does this response correctly state the refund is allowed, cite the 30-day window, and require a receipt? — passes both and would actually catch a bad version, like one that drops the receipt requirement or invents a 60-day window.

In practice this check is usually implemented as LLM-as-judge: a second model call that receives the user's question, the source document, and the chatbot's response, and scores the response against a written rubric (pass/fail per criterion, or a 1–5 scale). Tools like DeepEval and custom pytest-based harnesses wrap this pattern; some teams use similarity scores like BERTScore against a reference answer as a cheaper first pass before an LLM-judge call. Either way, the judge's own accuracy needs to be checked periodically against human ratings — an unvalidated judge model can drift or rubber-stamp bad output just as easily as a human grader having an off day.

It's also worth testing the pipeline, not just the model. A wrong answer can come from a retrieval step pulling the wrong document, a prompt template silently truncating context, or a parsing bug mangling a well-formed model response — none of which is "the LLM being wrong." Isolating and testing each stage (retrieval, prompt assembly, model call, response parsing) catches a different class of bug than scoring the final text alone.

## Pitfalls and limits

This approach solves a real problem but creates new ones. LLM-as-judge calls cost money and add latency to a test suite, so running the full rubric on every commit can get expensive — tiered evaluation (cheap deterministic checks on every run, full judge scoring on a schedule or before release) keeps this manageable. The judge model itself needs validation, not blind trust, and its scoring can be inconsistent run to run, so treat "it passed" as a signal to investigate rather than a guarantee. Hallucinations are especially dangerous because they don't throw errors — a response can be fluent, confident, and simply wrong, and the first sign of a problem is often a user complaint rather than a failed build. In multi-turn conversations, compliance that holds for one exchange can erode over several turns, so single-turn test cases will miss degradation that only shows up in longer sessions. And none of this replaces ordinary tests: hard rules (don't quote a price that isn't in the catalog, never output another customer's ID) belong in deterministic checks, not a rubric, because deterministic checks are cheaper and can't be talked around by a lenient judge.

## What to do next

- List which features in your product are genuinely non-deterministic (LLM-generated text, ranked results from a model, anything with a sampling step) versus deterministic code that just looks fuzzy because it's untested.
- Build a small curated set of 50–100 real input/expected-behavior pairs for one of those features, with a written rubric of what counts as correct, partially correct, and wrong — vague criteria produce unreliable grading no matter what checks it.
- Replace string-match assertions on that feature with rubric or LLM-judge checks, while keeping hard deterministic gates (schema validation, banned terms, PII patterns) as separate, cheaper checks that still run on every change.
- Wire the rubric suite into CI as a regression gate, and rerun it whenever the prompt, model version, or retrieved data source changes — quality can drift with no code change at all.

## Sources

- [Testing AI Chatbots and LLM Features: Why Deterministic Tests Don't Work](https://www.testsprite.com/blog/testing-ai-chatbots-and-llm-features-why-deterministic-tests-don-t-work) — TestSprite
- [How Do You Test an AI?](https://builtin.com/articles/ai-testing-framework-engineers) — Built In
- [LLM Testing Frameworks: A Practical Guide for QA Teams](https://testomat.io/?p=26046) — Testomat.io

<!--sr-->

Chatbot za korisničku podršku u ponedjeljak tačno odgovori na pitanje o povraćaju novca. U utorak, iako se u kodu ništa nije promijenilo, da drugačiji, ali jednako tačan odgovor — druge riječi, iste činjenice. Test koji provjerava da je odgovor jednak fiksnom stringu pada svaki put kada se formulacija promijeni, bez obzira na to da li se nešto zaista pokvarilo. To je suština problema sa testiranjem izlaza koji generiše AI: ono što testirate nema jedan jedini tačan odgovor, pa mora da se promijeni pristup testiranju, a ne samo test podaci.

![Ilustracija test funkcije sa precrtanim assertEqual(output, expected) i oznakom FAIL s lijeve strane, a s desne strane mnoštvo grananih puteva evaluacije koji prolaze kroz provjere po rubrici, sudiju i bezbjednosne provjere i završavaju zelenim kvačicama i crvenim iksićima](assets/blog/testing-non-deterministic-ai-features.jpg)

## Zašto assert-equal prestaje da radi

Deterministički kod za isti ulaz daje isti izlaz, pa je `assertEqual(response, expected)` razumna provjera. Generativna funkcija zasnovana na LLM-u ne radi tako. Temperatura uzorkovanja, ažuriranja modela, izmjene u retrieval koraku RAG pipeline-a, pa čak i nepovezane izmjene prompta mogu da promijene tačnu formulaciju ispravnog odgovora. Provjere po ključnim riječima ili regexu to ne rješavaju: daju lažne padove kada se ispravna formulacija promijeni i lažne prolaze kada se prava ključna riječ pojavi unutar pogrešnog odgovora. U praksi timovi ili odustanu od automatskih provjera za AI funkcije i oslone se na ručne provjere uzoraka prije izdanja, ili napišu krhke provjere stringova koje se ugase u roku od mjesec dana jer su stalno crvene.

Rješenje nije pametnije poređenje stringova. Rješenje je testiranje svojstava izlaza umjesto njegovog tačnog teksta — ono što se ponekad zove testiranje zasnovano na namjeri ili na rubrici.

## Šta provjeravati umjesto toga

Za funkciju kao što je chatbot za podršku zasnovan na bazi znanja, korisna rubrika obično provjerava:

- **Relevantnost** — da li odgovor zaista odgovara na ono što je korisnik pitao?
- **Činjeničnu usklađenost** — da li se slaže sa izvornim dokumentima koje je trebalo da koristi, a ne samo da zvuči uvjerljivo?
- **Halucinacije** — da li uvodi neku tvrdnju koje nema u bazi znanja (rok za povraćaj, cijenu, izuzetak od pravila)?
- **Poštovanje opsega** — da li ostaje u svom domenu i ne odaje podatke drugog korisnika ili interne detalje?
- **Bezbjednost** — bez štetnog, pristrasnog sadržaja ili sadržaja koji otkriva lične podatke.

Uzmimo konkretan primjer: članak u bazi znanja kaže da je povraćaj novca moguć u roku od 30 dana od kupovine, uz račun. Dva odgovora chatbota na pitanje „Mogu li da dobijem povraćaj novca za proizvod koji sam kupio prije tri nedjelje?" mogu da glase:

> „Da, pošto ste u roku od 30 dana, imate pravo na povraćaj novca, pod uslovom da imate račun."

> „Još ste u periodu za povraćaj (30 dana), tako da je povraćaj moguć — samo ćete morati da pokažete dokaz o kupovini."

Različite rečenice, iste činjenice, oba odgovora tačna. Test koji poredi stringove obara oba. Provjera po rubrici — da li odgovor tačno kaže da je povraćaj dozvoljen, navodi rok od 30 dana i traži račun? — propušta oba, a uhvatila bi lošu verziju, recimo onu koja izostavi uslov sa računom ili izmisli rok od 60 dana.

U praksi se ova provjera obično implementira kao LLM-as-judge: drugi poziv modelu koji dobija pitanje korisnika, izvorni dokument i odgovor chatbota, pa ocjenjuje odgovor prema napisanoj rubrici (prolaz/pad po kriterijumu ili skala od 1 do 5). Alati kao što je DeepEval i prilagođeni harnessi zasnovani na pytest-u pakuju ovaj obrazac; neki timovi koriste mjere sličnosti kao što je BERTScore u odnosu na referentni odgovor kao jeftiniji prvi filter prije poziva LLM sudiji. U svakom slučaju, tačnost samog sudije treba povremeno provjeravati u odnosu na ljudske ocjene — nevalidiran model-sudija može da odluta ili da bez razmišljanja odobri loš izlaz, jednako lako kao i čovjek koji ocjenjuje u lošem danu.

Vrijedi testirati i pipeline, ne samo model. Pogrešan odgovor može da dođe iz retrieval koraka koji povuče pogrešan dokument, iz šablona prompta koji tiho skrati kontekst ili iz baga u parsiranju koji pokvari ispravno formiran odgovor modela — a ništa od toga nije „LLM je pogriješio". Izolovano testiranje svake faze (retrieval, sklapanje prompta, poziv modelu, parsiranje odgovora) hvata drugu klasu bagova od samog ocjenjivanja konačnog teksta.

## Zamke i ograničenja

Ovaj pristup rješava stvaran problem, ali stvara nove. Pozivi LLM sudiji koštaju i usporavaju test paket, pa pokretanje cijele rubrike na svakom commitu može da postane skupo — evaluacija u slojevima (jeftine determinističke provjere na svakom pokretanju, puno ocjenjivanje sudijom po rasporedu ili prije izdanja) drži to pod kontrolom. Sam model-sudija zahtijeva validaciju, a ne slijepo povjerenje, i njegove ocjene mogu da se razlikuju od pokretanja do pokretanja, pa „prošlo je" tretirajte kao signal za istraživanje, a ne kao garanciju. Halucinacije su posebno opasne jer ne bacaju greške — odgovor može da bude tečan, samouvjeren i jednostavno pogrešan, a prvi znak problema je često žalba korisnika, a ne pao build. U razgovorima od više poruka, pravila koja se poštuju u jednoj razmjeni mogu da erodiraju kroz nekoliko koraka, pa test slučajevi od jedne poruke promaše degradaciju koja se pojavi tek u dužim sesijama. I ništa od ovoga ne zamjenjuje obične testove: tvrda pravila (ne navodi cijenu koje nema u katalogu, nikad ne ispisuj ID drugog korisnika) pripadaju determinističkim provjerama, a ne rubrici, jer su determinističke provjere jeftinije i blagi sudija ne može da ih zaobiđe.

## Šta dalje

- Napravite spisak funkcija u vašem proizvodu koje su zaista nedeterminističke (tekst koji generiše LLM, rangirani rezultati modela, sve što ima korak uzorkovanja), za razliku od determinističkog koda koji samo djeluje nejasno jer nije testiran.
- Za jednu od tih funkcija napravite mali, pažljivo odabran skup od 50–100 stvarnih parova ulaz/očekivano ponašanje, uz napisanu rubriku šta se smatra tačnim, djelimično tačnim i pogrešnim — nejasni kriterijumi daju nepouzdano ocjenjivanje, bez obzira na to ko ili šta ocjenjuje.
- Na toj funkciji zamijenite provjere poređenja stringova provjerama po rubrici ili LLM sudijom, a tvrde determinističke kapije (validacija šeme, zabranjeni izrazi, obrasci ličnih podataka) zadržite kao odvojene, jeftinije provjere koje i dalje rade na svakoj izmjeni.
- Uključite paket rubrika u CI kao regresionu kapiju i pokrenite ga ponovo kad god se promijeni prompt, verzija modela ili izvor podataka za retrieval — kvalitet može da odluta i bez ijedne izmjene u kodu.

## Izvori

- [Testing AI Chatbots and LLM Features: Why Deterministic Tests Don't Work](https://www.testsprite.com/blog/testing-ai-chatbots-and-llm-features-why-deterministic-tests-don-t-work) — TestSprite
- [How Do You Test an AI?](https://builtin.com/articles/ai-testing-framework-engineers) — Built In
- [LLM Testing Frameworks: A Practical Guide for QA Teams](https://testomat.io/?p=26046) — Testomat.io
