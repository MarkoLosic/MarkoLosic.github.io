---
title: "Testing AI Agents That Take Actions: Why a Correct-Sounding Answer Isn't Enough"
title_sr: "Testiranje AI agenata koji izvršavaju akcije: zašto odgovor koji zvuči tačno nije dovoljan"
date: 2026-10-23
tags: [qa, ai-in-qa, agentic-ai, test-automation]
excerpt: A checklist for testing AI agents that call tools and change real systems, beyond just grading the final text answer.
excerpt_sr: Lista provjera za testiranje AI agenata koji pozivaju alate i mijenjaju stvarne sisteme, koja ide dalje od ocjenjivanja konačnog tekstualnog odgovora.
image: assets/blog/testing-ai-agents-tool-calls-side-effects.jpg
---
Most teams that test AI features still grade them the way they'd grade a search box: does the response look right. That works reasonably well for a chatbot that only talks. It breaks down for the growing category of AI features that act — rescheduling an appointment, updating a CRM record, issuing a refund, modifying a database row. An agent can write a fluent, confident, entirely plausible final message while having called the wrong tool, sent the wrong arguments, or changed nothing at all. If your test suite only reads the chat transcript, that failure is invisible.

![Isometric illustration of a glowing chat window where the user asks "Reschedule and refund my booking" and the agent replies "Done — your appointment is moved to Thursday at 2pm!", while underneath the surface broken pipelines connect cancel_booking and refund_booking nodes to "404 FAILED" flags and a table full of DUPLICATE_ID errors](assets/blog/testing-ai-agents-tool-calls-side-effects.jpg)

## The problem with grading the final answer

Grading only the agent's last message checks whether the words are plausible, not whether the world changed the way they claim it did. A reschedule agent can reply "Done — your appointment is moved to Thursday at 2pm" after a tool call that silently failed, timed out, or created a second, duplicate event instead of moving the original one. The text is correct-looking. The underlying state is wrong. This is the core shift testers need to make with agentic AI: you are testing a sequence of actions and a resulting state, not a single text output.

## A concrete example: a reschedule-and-refund support agent

Picture a support tool where an AI agent can look up a customer's booking, reschedule it, and issue a partial refund if the new slot is cheaper. A reasonable test case for this agent needs more than a prompt and an expected sentence. It needs:

- **Initial state**: a specific booking record, with a known price and time slot, loaded into a sandboxed copy of the system (never a production account).
- **Injected context**: a fixed "current time" and time zone, so a prompt like "move it to next Thursday" resolves to one deterministic date instead of whatever day the test happens to run.
- **Allowed and forbidden tools**: the agent should be allowed to call `get_booking` and `reschedule_booking`, but forbidden from calling `cancel_booking` or `refund_booking` unless the new slot is actually cheaper.
- **Required outcome, checked in the sandbox itself**: the booking's date field changed, exactly one booking exists for that customer (no duplicate was created), and a refund was issued only if the price actually dropped, for the correct amount.

That last point is the one teams skip most often. It's tempting to trust the agent's own claim of success. Instead, query the sandbox state directly after the run — the way you'd assert on a database row in an integration test — rather than trusting the chat transcript.

A useful mental model, borrowed from how tool-calling agents are evaluated in production settings, is to split your checks into layers:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Layer</th><th>What you're checking</th><th>Example failure it catches</th></tr></thead>
<tbody>
<tr><td>Tool necessity</td><td>Should a tool be called at all</td><td>Agent reschedules when the user only asked a question</td></tr>
<tr><td>Tool selection</td><td>Was the right tool chosen</td><td>Agent calls <code>cancel_booking</code> instead of <code>reschedule_booking</code></td></tr>
<tr><td>Arguments</td><td>Are the parameters correct</td><td>Correct tool, wrong date or wrong customer ID</td></tr>
<tr><td>Ordering</td><td>Did required steps happen in the right sequence</td><td>Refund issued before the reschedule was confirmed</td></tr>
<tr><td>Side effects</td><td>Did the system state actually change correctly</td><td>Booking &quot;moved&quot; per the reply, but the original slot is still held</td></tr>
<tr><td>Final answer</td><td>Does the reply match what actually happened</td><td>Agent reports success after a failed or unconfirmed write</td></tr>
</tbody>
</table>
</div>
<!--/html-->

Treat the bottom two rows — a false success claim and an irreversible or duplicated action — as hard release blockers regardless of how well the agent scores elsewhere. A chatbot that gives a slightly awkward answer is a quality issue. An agent that reports success after silently failing to refund someone, or after double-booking a slot, is a trust and possibly a financial issue.

It's also worth testing how the agent handles tool output it shouldn't trust blindly: a malformed response from a downstream API, a stale record, a timeout, or text returned from a tool that contains an embedded instruction (a form of prompt injection delivered through data rather than the user). A well-built agent treats everything a tool returns as untrusted input, not as ground truth to act on automatically.

## Pitfalls and limits

This kind of testing costs more than grading a chat reply, and it's worth being honest about that before you commit to it. You need a sandbox or emulated version of every system the agent can write to, a way to reset that state between test runs, and idempotency keys or similar guards so that retries during testing don't leave duplicate writes behind.

Comparing tool arguments is also messier than it looks — a semantic, LLM-based judge is reasonable for an open-ended field like a search query, but it should never be the thing that decides whether an account ID or a required field was correct; use exact or structural comparison for those. And because the same prompt can produce a different, equally valid sequence of tool calls on different runs, write your expected behavior as constraints (what must happen, what must never happen) rather than a single fixed transcript, or you'll get constant false failures on legitimate variation.

None of this replaces ordinary contract and integration testing of the tools themselves — if the booking API has a bug, no amount of agent-level testing will hide that, and it shouldn't.

## What to do next

1. For any AI feature that can write, pick its single riskiest action (a refund, a cancellation, a data change) and write one sandboxed test that checks the resulting state directly, not the chat reply.
2. Add a short list of forbidden tool calls for at least one test case, and assert the agent never makes them, even when a user tries to coax it there.
3. Build in a fixed, injected "current time" for any test involving relative dates, so results are reproducible.
4. Before the next release, review your test suite for cases where you're only asserting on the final message. Convert the highest-risk ones into state-based assertions.

## Sources

- [Evaluate Tool-Calling Agents: Tools, Arguments, and Final Answers](https://oneuptime.com/blog/post/2026-08-31-evaluate-tool-calling-agents/markdown) — OneUptime
- [How to Evaluate AI Agents: A Practical Checklist for Production](https://www.getmaxim.ai/articles/how-to-evaluate-ai-agents-a-practical-checklist-for-production) — Maxim AI
<!--sr-->
Većina timova koji testiraju AI funkcije i dalje ih ocjenjuje onako kako bi ocjenjivali polje za pretragu: da li odgovor izgleda dobro. To prilično dobro funkcioniše za chatbot koji samo priča. Ali ne funkcioniše za sve veću kategoriju AI funkcija koje djeluju — pomjeraju termin, ažuriraju zapis u CRM-u, izdaju povraćaj novca, mijenjaju red u bazi podataka. Agent može da napiše tečnu, samouvjerenu i potpuno uvjerljivu završnu poruku, a da je pritom pozvao pogrešan alat, poslao pogrešne argumente ili nije promijenio baš ništa. Ako vaš paket testova čita samo transkript razgovora, taj propust je nevidljiv.

![Izometrijska ilustracija svijetlećeg prozora za čet u kojem korisnik traži „Reschedule and refund my booking", a agent odgovara „Done — your appointment is moved to Thursday at 2pm!", dok ispod površine pokidane cijevi povezuju čvorove cancel_booking i refund_booking sa zastavicama „404 FAILED" i tabelom punom grešaka DUPLICATE_ID](assets/blog/testing-ai-agents-tool-calls-side-effects.jpg)

## Problem sa ocjenjivanjem samo konačnog odgovora

Ocjenjivanje samo posljednje poruke agenta provjerava da li riječi zvuče uvjerljivo, a ne da li se svijet promijenio onako kako one tvrde. Agent za pomjeranje termina može da odgovori „Gotovo — vaš termin je pomjeren na četvrtak u 14h" nakon poziva alata koji je tiho pao, istekao (timeout) ili napravio drugi, duplirani događaj umjesto da pomjeri originalni. Tekst izgleda ispravno. Stanje ispod njega je pogrešno. To je ključna promjena u razmišljanju koju testeri moraju da naprave kod agentskog AI-ja: ne testirate jedan tekstualni izlaz, nego niz akcija i stanje koje iz njih proizlazi.

## Konkretan primjer: agent podrške za pomjeranje termina i povraćaj novca

Zamislite alat za korisničku podršku u kojem AI agent može da pronađe rezervaciju korisnika, pomjeri je i izda djelimičan povraćaj novca ako je novi termin jeftiniji. Smislen test slučaj za ovakvog agenta zahtijeva više od prompta i očekivane rečenice. Potrebno mu je:

- **Početno stanje**: konkretan zapis o rezervaciji, sa poznatom cijenom i terminom, učitan u sandbox kopiju sistema (nikada u produkcioni nalog).
- **Ubačeni kontekst**: fiksno „trenutno vrijeme" i vremenska zona, kako bi se prompt poput „pomjeri je na sljedeći četvrtak" uvijek razriješio na jedan, determinističan datum, a ne na onaj koji zavisi od dana kada se test slučajno pokrene.
- **Dozvoljeni i zabranjeni alati**: agent smije da poziva `get_booking` i `reschedule_booking`, ali ne smije da poziva `cancel_booking` niti `refund_booking`, osim ako je novi termin zaista jeftiniji.
- **Obavezan ishod, provjeren u samom sandboxu**: polje datuma na rezervaciji je promijenjeno, za tog korisnika postoji tačno jedna rezervacija (nije napravljen duplikat), a povraćaj novca je izdat samo ako je cijena zaista pala, i to u tačnom iznosu.

Upravo tu posljednju stavku timovi najčešće preskaču. Primamljivo je povjerovati agentu kada sam tvrdi da je uspio. Umjesto toga, nakon pokretanja direktno provjerite stanje u sandboxu — onako kako biste u integracionom testu provjeravali red u bazi — umjesto da se oslanjate na transkript razgovora.

Koristan mentalni model, preuzet iz načina na koji se agenti koji pozivaju alate ocjenjuju u produkcionim okruženjima, jeste da provjere podijelite u slojeve:

<!--html-->
<div class="table-wrap">
<table>
<thead><tr><th>Sloj</th><th>Šta provjeravate</th><th>Primjer greške koju hvata</th></tr></thead>
<tbody>
<tr><td>Potreba za alatom</td><td>Da li uopšte treba pozvati alat</td><td>Agent pomjera termin iako je korisnik samo postavio pitanje</td></tr>
<tr><td>Izbor alata</td><td>Da li je izabran pravi alat</td><td>Agent poziva <code>cancel_booking</code> umjesto <code>reschedule_booking</code></td></tr>
<tr><td>Argumenti</td><td>Da li su parametri ispravni</td><td>Pravi alat, ali pogrešan datum ili pogrešan ID korisnika</td></tr>
<tr><td>Redoslijed</td><td>Da li su obavezni koraci izvršeni pravim redom</td><td>Povraćaj novca izdat prije nego što je pomjeranje termina potvrđeno</td></tr>
<tr><td>Sporedni efekti</td><td>Da li se stanje sistema zaista ispravno promijenilo</td><td>Rezervacija je „pomjerena&quot; prema odgovoru, ali originalni termin je i dalje zauzet</td></tr>
<tr><td>Konačni odgovor</td><td>Da li odgovor odgovara onome što se zaista desilo</td><td>Agent prijavljuje uspjeh nakon neuspješnog ili nepotvrđenog upisa</td></tr>
</tbody>
</table>
</div>
<!--/html-->

Posljednja dva reda — lažnu tvrdnju o uspjehu i nepovratnu ili dupliranu akciju — tretirajte kao čvrste blokere za izdavanje verzije, bez obzira na to koliko dobro agent prolazi na ostalim provjerama. Chatbot koji da pomalo nespretan odgovor je problem kvaliteta. Agent koji prijavi uspjeh nakon što je tiho propustio da nekome vrati novac, ili nakon što je dvaput rezervisao isti termin, je problem povjerenja, a možda i finansijski problem.

Vrijedi testirati i kako agent postupa sa izlazom iz alata kojem ne bi trebalo slijepo da vjeruje: neispravan odgovor iz nekog API-ja niže u lancu, zastario zapis, timeout ili tekst koji alat vrati, a koji sadrži ugrađenu instrukciju (oblik prompt injection napada koji stiže kroz podatke, a ne od korisnika). Dobro napravljen agent sve što mu alat vrati tretira kao nepouzdan ulaz, a ne kao apsolutnu istinu na osnovu koje automatski djeluje.

## Zamke i ograničenja

Ovakvo testiranje košta više od ocjenjivanja odgovora u četu i dobro je da budete iskreni po tom pitanju prije nego što se upustite u njega. Potrebna vam je sandbox ili emulirana verzija svakog sistema u koji agent može da upisuje, način da resetujete to stanje između pokretanja testova, i idempotency ključevi ili slične zaštite, kako ponovni pokušaji tokom testiranja ne bi ostavljali duplirane upise.

Poređenje argumenata alata je takođe zapetljanije nego što izgleda — semantički sudija zasnovan na LLM-u je razuman izbor za otvoreno polje poput upita za pretragu, ali nikada ne bi trebalo da on odlučuje da li je ID naloga ili obavezno polje ispravno; za to koristite tačno ili strukturno poređenje. A pošto isti prompt pri različitim pokretanjima može da proizvede drugačiji, ali podjednako ispravan niz poziva alata, očekivano ponašanje pišite kao ograničenja (šta mora da se desi, šta nikada ne smije da se desi), a ne kao jedan fiksni transkript — inače ćete stalno dobijati lažne padove na sasvim legitimnim varijacijama.

Ništa od ovoga ne zamjenjuje uobičajeno contract i integraciono testiranje samih alata — ako API za rezervacije ima bag, nikakvo testiranje na nivou agenta to neće sakriti, i ne bi ni trebalo.

## Šta dalje

1. Za svaku AI funkciju koja može da upisuje podatke, izaberite njenu najrizičniju akciju (povraćaj novca, otkazivanje, izmjenu podataka) i napišite jedan test u sandboxu koji direktno provjerava rezultujuće stanje, a ne odgovor u četu.
2. Za bar jedan test slučaj dodajte kratku listu zabranjenih poziva alata i provjerite da ih agent nikada ne pravi, čak ni kada ga korisnik pokušava nagovoriti na to.
3. Za svaki test koji uključuje relativne datume ugradite fiksno, ubačeno „trenutno vrijeme", kako bi rezultati bili ponovljivi.
4. Prije sljedećeg izdanja pregledajte paket testova i pronađite slučajeve u kojima provjeravate samo konačnu poruku. Najrizičnije među njima pretvorite u provjere zasnovane na stanju.

## Izvori

- [Evaluate Tool-Calling Agents: Tools, Arguments, and Final Answers](https://oneuptime.com/blog/post/2026-08-31-evaluate-tool-calling-agents/markdown) — OneUptime
- [How to Evaluate AI Agents: A Practical Checklist for Production](https://www.getmaxim.ai/articles/how-to-evaluate-ai-agents-a-practical-checklist-for-production) — Maxim AI
