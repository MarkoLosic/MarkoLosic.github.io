---
title: "Building PetLink: Two AI Models Writing and Reviewing Each Other's Code"
title_sr: "Kako sam gradio PetLink: dva AI modela koji pišu i pregledaju kod jedan drugome"
date: 2026-10-02
time: 20:00
updated: 2026-11-26
tags: [ai-testing, mobile-testing]
excerpt: How I built PetLink, an all-in-one app for pet owners: my idea and my checks, with Gemini and Claude generating the code and reviewing each other's work.
excerpt_sr: Priča o razvoju PetLink-a, all-in-one aplikacije za vlasnike kućnih ljubimaca: ideja i provjera su moje, a Gemini i Claude su generisali kod i pregledali ga jedan drugome.
image: assets/blog/petlink-claude-code-gemini-ai-workflow.jpg
---
The idea for PetLink started with a boringly ordinary scene: a vaccination card the vet hands you, which then ends up in a drawer. Six weeks later the window for the next shot has passed, nobody noticed in time, and the pet owner is pulled back into the same old cycle: midnight panic over 40 contradictory Google results, searching for a lost dog through Facebook posts and flyers, a health history scattered across paper, emails and memory. None of those tools is bad on its own. The problem is the cognitive load of keeping everything in different places, exactly in the moments when there is the least time to go looking.

PetLink grew out of that frustration. It is an all-in-one mobile platform for pet owners, built in React Native with a Supabase backend: an electronic health record, a lost-pet alert with a real-time map, Love Match for breeding, an AI chat running on a DeepSeek model trained for pet care that takes the pet's species, breed, age and sex into account, a planner that syncs with the phone's calendar, and an adoption board. It is deliberately an ecosystem rather than a single feature, precisely because ecosystems are harder to leave once you are in.

![Illustration of the PetLink app on a phone, with dog and cat profiles, vaccination records, health history and vet appointments, surrounded by React Native code windows and a planning, coding and review workflow diagram](assets/blog/petlink-claude-code-gemini-ai-workflow.jpg)

What was, at least for me, just as interesting as the product itself is how it was built: the idea and the checking stayed with me, and two different AI models wrote the code and kept each other honest.

## Splitting the work: my idea, their code, cross-review

The workflow was simple on paper and fairly disciplined in practice. **The idea and the verification are mine**: what each feature should do, how it fits into the rest of the app, and whether it really works once it is built. **The code was generated with Gemini and Claude**, and **each one reviewed the other's code** before it reached the main branch.

Before any code was generated for a feature, I wrote down what that feature actually meant in the context of the rest of the app: where it lives in the navigation structure, which tables and relations it needs in Supabase, which screen states exist (empty, loading, error, full), and where it overlaps with features that already exist. For an app with six tightly connected modules, that overlap is not a cosmetic question. The health record feeds the AI chat with context, the planner relies on the same record for reminders, and the lost-pet map shares the pet profile with everything else. When those connections are clear up front, refactoring later is much rarer.

With that description in hand, Gemini or Claude wrote the implementation: components, Supabase queries, navigation logic. Coding speed was not the bottleneck. The bottleneck was whether that code really did what I had described, and whether it was secure and consistent with the rest of the codebase.

That is where the other model came in, as a reviewer. When Gemini wrote something, Claude reviewed it, and the other way around. A review pass typically looked for things that are easy to miss when you write fast:

- whether Supabase row-level security policies really restrict who can read and change whose record (critical when a pet's health data should be visible only to the owner),
- whether error and empty states are really covered, or only the happy path,
- whether a new component quietly duplicated logic that already exists elsewhere in the app,
- whether types and data shapes are consistent between screens that share the same pet profile.

None of this is dramatic on its own. But in an app with six modules that share data, exactly this kind of small inconsistency is the slowest to surface through manual testing and the fastest to catch in a review that looks at the whole context at once. After the review, the last check was mine: running the feature on a real device and testing it against what I had written down at the start.

## Why cross-review between two models

The natural question is why not let one model write and review its own code. The reason is practical, not ideological. A review done by someone (or something) that did not write the code is more honest. It is easier to spot a problem in someone else's solution than in your own. That holds for people, and it turned out to hold in a similar way for two different models. Neither one was defending decisions it had made while writing. Each looked at the description and the actual code, and compared them.

Two different models also make different mistakes. One would miss an edge case in the calendar sync, the other would miss a loose security rule. Having them check each other caught more of those blind spots than either one reviewing itself would have.

## Where this approach breaks

This was not a frictionless process, and it is worth being honest about where it falls short. A review is only as good as the description it is given. If my description of a feature was vague or incomplete, a review against it could not catch that the description itself was wrong, only whether the code was faithful to it.

AI tools can also sound confident while being wrong. Both Gemini and Claude occasionally suggest a solution that sounds convincing but does not hold up in a specific edge case, for example in the calendar sync logic or in handling the state when the user has no internet connection. Sometimes the reviewing model agreed with the mistake. None of that replaces manual testing on a real device, and none of it replaces the decision about whether a feature is worth building at all. That is a product question, not a question for the tool that writes the code.

And maybe most importantly: this workflow speeds up *how fast* an idea becomes working code, but it does not answer whether people actually want that idea. That is exactly why the next phase for PetLink is deliberately slow and small: an 8 to 10 week validation plan with 50 to 100 real users, where the only metric being watched is weekly retention at day 30. If it goes above 20% and at least one segment shows a willingness to pay, the full build goes ahead. If not, we learn from it and adjust. The codebase and the lessons learned stay, whatever the outcome.

## What I would pass on to someone building something similar

If you are building something similar, an app with several connected modules that share data, a few things from this experience are worth trying right away:

1. **Write down what a feature should do before any code is generated**, even when you work alone. It does not have to be a long document. It is enough that it explicitly says what the new feature touches in the rest of the system.
2. **Let a different model review the code**, and have it look at your description and the code side by side, not just whether the code runs. The question is not only "does this run without errors", but "is this consistent with the rest of the app, and are the edge cases covered".
3. **Pay special attention to security rules when several modules share the same data.** The kind of bug that hurts the most (who can see whose health record) is exactly the one that is easiest to overlook when you are rushing to ship a feature.
4. **Keep the final check for yourself.** AI can write and review the code, but testing on a real device and deciding when something is done stays with you.
5. **Keep a clear line between how fast you ship code and proof that the product is worth building.** Building faster does not mean the idea is validated. That is a separate process, with its own metric and its own deadline.

PetLink is now live on Google Play. I wrote about what the app does and how I tested it in [PetLink: The Pet Care App I Built and Tested End to End](/blog/petlink-pet-care-app/).

<!--sr-->

Ideja za PetLink je počela od jedne dosadno obične scene: kartice za vakcinaciju koju ti veterinar gurne u ruku, a koja onda završi u fioci. Šest sedmica kasnije prozor za sljedeću vakcinu je prošao, niko to nije primijetio na vrijeme, a vlasnik ljubimca je ponovo upao u isti stari ciklus: panika u ponoć uz 40 kontradiktornih Google rezultata, potraga za nestalim psom preko Facebook objava i flajera, zdravstvena istorija razbacana po papirima, mejlovima i sjećanju. Nijedan od tih alata pojedinačno nije loš. Problem je kognitivno opterećenje držanja svega toga na različitim mjestima, baš u trenucima kad je najmanje vremena za traženje.

Iz te frustracije je nastao PetLink, mobilna all-in-one platforma za vlasnike kućnih ljubimaca, rađena u React Native-u sa Supabase backendom: elektronski zdravstveni karton, alert za nestale ljubimce sa mapom u realnom vremenu, Love Match za parenje, AI čet koji radi na DeepSeek modelu istreniranom za brigu o ljubimcima i uzima u obzir vrstu, rasu, starost i pol ljubimca, planer sa sinhronizacijom sa kalendarom telefona i oglasnik za udomljavanje. Namjerno je to ekosistem, a ne jedna funkcija, baš zato što je ekosisteme teže napustiti kad jednom uđeš u njih.

![Ilustracija PetLink aplikacije na telefonu, sa profilima psa i mačke, kartonom vakcinacije, zdravstvenom istorijom i terminima kod veterinara, okružena prozorima sa React Native kodom i dijagramom radnog toka planiranje, pisanje koda i recenzija](assets/blog/petlink-claude-code-gemini-ai-workflow.jpg)

Ono što je, bar meni, bilo jednako zanimljivo koliko i sam proizvod jeste kako je pravljen: ideja i provjera su ostale na meni, a dva različita AI modela su pisala kod i držala jedan drugog pod kontrolom.

## Podjela posla: moja ideja, njihov kod, unakrsni review

Radni tok je bio jednostavan na papiru, a prilično disciplinovan u praksi. **Ideja i provjera su moje**: šta svaka funkcionalnost treba da radi, kako se uklapa u ostatak aplikacije i da li zaista radi kad se napravi. **Kod je generisan uz Gemini i Claude**, a **svaki od njih je pregledao kod onog drugog** prije nego što bi ušao u glavnu granu.

Prije nego što je generisan ikakav kod za neku funkcionalnost, zapisao sam šta ta funkcionalnost tačno znači u kontekstu ostatka aplikacije: gdje živi u navigacionoj strukturi, koje tabele i relacije joj trebaju u Supabase-u, koja stanja ekrana postoje (prazno, učitavanje, greška, puno) i gdje se preklapa sa funkcijama koje već postoje. Za aplikaciju sa šest usko povezanih modula to preklapanje nije kozmetičko pitanje. Zdravstveni karton hrani AI čet kontekstom, planer se oslanja na isti karton za podsjetnike, a mapa za nestale ljubimce dijeli profil ljubimca sa svim ostalim. Kad su te veze jasne unaprijed, kasnije refaktorisanje je mnogo rjeđe.

Sa tim opisom u ruci, Gemini ili Claude je pisao implementaciju: komponente, Supabase upite, navigacionu logiku. Brzina pisanja koda nije bila usko grlo. Usko grlo je bilo da li taj kod zaista radi ono što sam opisao i da li je bezbjedan i konzistentan sa ostatkom baze koda.

Tu je ulazio drugi model, kao recenzent. Kad je Gemini nešto napisao, Claude je to pregledao, i obrnuto. Review prolaz je tipično tražio stvari koje je lako propustiti kad se piše brzo:

- da li Supabase row-level security pravila zaista ograničavaju ko može da čita i mijenja čiji zapis (kritično kad zdravstveni podaci ljubimca treba da budu vidljivi samo vlasniku),
- da li su stanja greške i praznog ekrana zaista pokrivena ili samo happy path,
- da li je neka nova komponenta tiho duplirala logiku koja već postoji u drugom dijelu aplikacije,
- da li su tipovi i oblici podataka konzistentni između ekrana koji dijele isti profil ljubimca.

Ništa od ovoga nije dramatično pojedinačno. Ali u aplikaciji sa šest modula koji dijele podatke, baš ta vrsta sitnih nekonzistentnosti je ono što se najsporije otkriva ručnim testiranjem, a najbrže na review-u koji gleda cijeli kontekst odjednom. Poslije review-a, posljednja provjera je bila moja: pokretanje funkcionalnosti na pravom uređaju i testiranje u odnosu na ono što sam zapisao na početku.

## Zašto unakrsni review između dva modela

Prirodno pitanje je zašto ne pustiti jedan model da piše i sam pregleda svoj kod. Razlog je praktičan, ne ideološki. Review koji radi neko (ili nešto) ko nije napisao taj kod je iskreniji. Lakše je primijetiti problem u tuđem rješenju nego u sopstvenom. To važi za ljude, a ispostavilo se da slično važi i za dva različita modela. Nijedan nije branio odluke koje je sam donio tokom pisanja. Svaki je gledao opis i stvarni kod, i upoređivao ih.

Dva različita modela takođe prave različite greške. Jedan bi propustio edge case u sinhronizaciji kalendara, drugi bi propustio labavo sigurnosno pravilo. To što su provjeravali jedan drugog uhvatilo je više takvih slijepih mrlja nego što bi uhvatio bilo koji od njih pregledajući sam sebe.

## Gdje se ovaj pristup lomi

Ovo nije bio proces bez trenja, i vrijedi biti iskren oko toga gdje nije savršen. Review je onoliko dobar koliko je dobar opis koji mu je dat. Ako je moj opis neke funkcionalnosti bio nejasan ili nepotpun, review protiv njega nije mogao da uhvati da je sam opis pogrešan, samo da li je kod vjeran opisu.

AI alati takođe mogu djelovati sigurno dok griješe. I Gemini i Claude povremeno predlažu rješenje koje zvuči uvjerljivo, a ne drži vodu u konkretnom edge case-u, na primjer u logici oko sinhronizacije kalendara ili u obradi stanja kad korisnik nema internet konekciju. Ponekad se i model koji radi review složio sa greškom. Ništa od toga ne zamjenjuje ručno testiranje na pravom uređaju, niti zamjenjuje odluku da li je neka funkcionalnost uopšte vrijedna truda da se gradi. To je pitanje za proizvod, ne za alat koji piše kod.

I možda najvažnije: ovaj radni tok ubrzava *kako brzo* ideja postaje radni kod, ali ne odgovara na pitanje da li ljudi tu ideju zapravo žele. Baš zato je sljedeća faza za PetLink namjerno spora i mala: plan validacije od 8 do 10 sedmica sa 50 do 100 pravih korisnika, gdje je jedina metrika koja se posmatra sedmična retencija na dan 30. Ako pređe 20% i bar jedan segment pokaže volju da plati, ide se dalje na punu izgradnju. Ako ne, uči se iz toga i prilagođava. Kodna baza i naučene lekcije ostaju, bez obzira na ishod.

## Šta bih prenio nekom ko pravi slično

Ako gradiš nešto slično, aplikaciju sa više povezanih modula koji dijele podatke, nekoliko stvari iz ovog iskustva vrijedi probati odmah:

1. **Zapiši šta funkcionalnost treba da radi prije nego što se generiše ikakav kod**, čak i kad radiš sam. Ne mora da bude dugačak dokument. Dovoljno je da eksplicitno kaže šta nova funkcionalnost dira u ostatku sistema.
2. **Neka kod pregleda drugi model**, i neka gleda tvoj opis i kod jedan pored drugog, a ne samo da li kod radi. Pitanje nije samo "da li se ovo pokreće bez greške", nego "da li je ovo konzistentno sa ostatkom aplikacije i da li su edge case-ovi pokriveni".
3. **Posebno obrati pažnju na sigurnosna pravila kad više modula dijeli iste podatke.** Tip bugova koji najviše boli (ko može da vidi čiji zdravstveni karton) je baš onaj koji se najlakše previdi kad se žuri sa isporukom funkcije.
4. **Posljednju provjeru zadrži za sebe.** AI može da piše i pregleda kod, ali testiranje na pravom uređaju i odluka kad je nešto gotovo ostaju na tebi.
5. **Drži jasnu granicu između brzine isporuke koda i dokaza da proizvod vrijedi graditi.** Brža izrada ne znači da je ideja validirana. To je zaseban proces, sa sopstvenom metrikom i sopstvenim rokom.

PetLink je sada dostupan na Google Play-u. O tome šta aplikacija radi i kako sam je testirao pisao sam u članku [PetLink: aplikacija za brigu o ljubimcima koju sam napravio i testirao od početka do kraja](/blog/petlink-pet-care-app/).
