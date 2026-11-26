---
title: "PetLink: The Pet Care App I Built and Tested End to End"
title_sr: "PetLink: aplikacija za brigu o ljubimcima koju sam napravio i testirao od početka do kraja"
date: 2026-11-26
time: 20:00
tags: [mobile-testing, test-strategy]
excerpt: Why I built PetLink, an Android app for dog and cat owners, how Gemini and Claude wrote and reviewed its React Native and Supabase code, and what testing my own product taught me.
excerpt_sr: Zašto sam napravio PetLink, Android aplikaciju za vlasnike pasa i mačaka, kako su Gemini i Claude pisali i pregledali njen React Native i Supabase kod, i šta me naučilo testiranje sopstvenog proizvoda.
image: assets/blog/petlink-pet-care-app.jpg
---
I spend my days breaking other people's software. This time I shipped my own: PetLink is now live on Google Play.

![PetLink features around a dog and a cat: pet health record with checklist, vaccination calendar with reminder bell, lost-pet map with location pin, chat bubble, adoption card and NFC collar tag](assets/blog/petlink-pet-care-app.jpg)

Every dog or cat owner knows the routine. The vaccination booklet is in a drawer somewhere, the parasite treatment date lives in your head, and when a pet goes missing the only tools are Facebook groups and paper posters. PetLink puts all of that in one place: health records, reminders, lost-pet alerts, adoption and care advice. It's free, has no ads, and works in Serbian, Croatian, Bosnian and English.

👉 **[Get PetLink on Google Play](https://play.google.com/store/apps/details?id=com.markolosic.petlink)** · [Product page](https://markolosic.github.io/petlink-web/)

## What PetLink does

- **Digital e-Carton.** A profile for each pet with breed, date of birth, microchip number, vaccinations, parasite protection and illness history. Vet documents are uploaded and stored with the profile, visible only to the owner.
- **Smart reminders.** The app works out when the next vaccine or parasite treatment is due, notifies you before it expires and can add the date to your phone calendar. There's also a to-do planner with recurring tasks.
- **Pet Alert.** Report a missing pet with one tap. Users within 10 km get a push notification, the alert appears on a shared map, and anyone can report a sighting, call or message the owner. Each alert has its own group chat, and the app generates a printable poster with the pet's photo and a QR code.
- **NFC smart collar.** Write your pet's profile to an NFC tag on the collar. Whoever finds the pet taps the tag with a phone and gets a link to contact you. No personal data is stored on the tag itself.
- **Adoption.** Browse dog and cat listings with filters, post your own, message owners and report inappropriate ads.
- **Love Match.** Find a nearby breeding partner, check breed and health details, and chat once you match.
- **AI chat.** Ask about diet, behaviour, care or symptoms and get answers tailored to your pet's species, breed, age and sex. It's a helper, not a vet, and the app says so clearly. Five questions a day are free.

## How it's built

The idea for PetLink is mine, and so is the checking: deciding what each feature should do, and testing that it actually does it. Most of the code was written with AI. I used **Gemini and Claude** to generate it, and had them **review each other's code**: what one wrote, the other checked for bugs, missed edge cases and inconsistencies with the rest of the app. A second model reading the code catches things the first one is blind to, but neither of them decides when something is done. That part stayed with me.

The stack underneath:

- **React Native for the mobile app.** One JavaScript/TypeScript codebase for the whole app, the same components reused across every screen, and the door left open for an iOS version without a rewrite. Native features like NFC, push notifications, location, the camera and calendar sync are connected through React Native modules.
- **Supabase for the backend.** Supabase handles sign-in (email, Google and Apple), the PostgreSQL database with pet profiles, health records, alerts and adoption listings, and file storage for photos and vet documents. Keeping everything in one service meant less glue code and fewer places for things to break.
- **A DeepSeek model behind the AI chat.** The AI chat in the app runs on a DeepSeek model trained for pet care questions. Each question is sent together with the pet's species, breed, age and sex, so the answer fits the animal in front of you instead of being generic advice, and when symptoms sound serious it points the user to a vet.

I wrote more about working with AI on the code in [Building PetLink: Two AI Models Writing and Reviewing Each Other's Code](/blog/petlink-claude-code-gemini-ai-workflow/).

## Building it as a QA engineer

Building a product changes how you look at quality. On the job, I get a feature, a spec and a deadline. On PetLink, I was also the person deciding what "done" means. A few things stood out:

- **Risk decides where tests go.** A wrong date on a reminder is annoying. A Pet Alert that doesn't reach anyone nearby is a real failure. The location, notification and alert flows got the most test time, including bad GPS, denied permissions, and phones that were asleep or offline.
- **Real devices beat emulators.** NFC, push notifications and the camera only behave honestly on physical phones, so those features were tested on real Android devices, not just in an emulator.
- **Four languages means four times the layout bugs.** Serbian, Croatian and Bosnian strings run longer than English ones, and text that fits in English can be cut off in Bosnian. Every screen was checked in every language and in dark mode.
- **Privacy is a test case too.** Health records are private by default, the NFC tag stores only a link, users can block other users, and an account can be permanently deleted from inside the app. I treated each of those as a requirement with its own checks, not a footnote in the privacy policy.
- **AI output needs guardrails.** I tested the assistant the way I test LLMs at work: a set of real owner questions, checked for accuracy, tone and whether it sends the user to a vet when symptoms sound serious.

## What I learned

1. **Scope is the hardest bug.** Every feature idea sounds small until you write the test cases for it. Writing acceptance criteria first kept PetLink from growing forever.
2. **Your first users find the bugs your tests didn't imagine.** The first testers used the app in ways I never planned for, and that feedback shaped the release more than any checklist did.
3. **Store listings deserve QA too.** Screenshots, descriptions, translations and the data safety form are part of the product. Users see them before they see a single screen.

## What's next

PetLink is on Android today, and the React Native codebase keeps an iOS version within reach. If you have a dog or a cat, I'd love for you to try it and tell me what breaks. That's my favourite kind of feedback.

👉 **[Download PetLink on Google Play](https://play.google.com/store/apps/details?id=com.markolosic.petlink)**

Questions, ideas or bug reports: [markolosic1993@gmail.com](mailto:markolosic1993@gmail.com).

### Related posts

- [Session-based exploratory testing](/blog/session-based-exploratory-testing/)
- [Testing AI features that see](/blog/vision-ai-testing-image-inputs/)
- [Testing a local Llama 3 model](/llm-testing/)

<!--sr-->

Dane provodim lomeći tuđi softver. Ovog puta sam objavio svoj: PetLink je sada dostupan na Google Play-u.

![PetLink funkcije oko psa i mačke: zdravstveni karton ljubimca sa listom provjera, kalendar vakcinacije sa podsjetnikom, mapa za nestale ljubimce sa oznakom lokacije, poruka u četu, kartica za udomljavanje i NFC privjesak za ogrlicu](assets/blog/petlink-pet-care-app.jpg)

Svaki vlasnik psa ili mačke zna kako to ide. Knjižica vakcinacije je negdje u fioci, datum tretmana protiv parazita živi u tvojoj glavi, a kad ljubimac nestane, jedini alati su Facebook grupe i papirni plakati. PetLink sve to stavlja na jedno mjesto: zdravstveni karton, podsjetnike, upozorenja za nestale ljubimce, udomljavanje i savjete za njegu. Besplatan je, nema reklama i radi na srpskom, hrvatskom, bosanskom i engleskom.

👉 **[Preuzmi PetLink na Google Play-u](https://play.google.com/store/apps/details?id=com.markolosic.petlink)** · [Stranica proizvoda](https://markolosic.github.io/petlink-web/)

## Šta PetLink radi

- **Digitalni e-Karton.** Profil za svakog ljubimca sa rasom, datumom rođenja, brojem mikročipa, vakcinama, zaštitom od parazita i istorijom bolesti. Dokumenti od veterinara se otpremaju i čuvaju uz profil, vidljivi samo vlasniku.
- **Pametni podsjetnici.** Aplikacija izračuna kad je na redu sljedeća vakcina ili tretman protiv parazita, obavijesti te prije nego što istekne i može da doda datum u kalendar telefona. Tu je i planer obaveza sa zadacima koji se ponavljaju.
- **Pet Alert.** Prijavi nestalog ljubimca jednim dodirom. Korisnici u krugu od 10 km dobijaju push obavještenje, upozorenje se pojavljuje na zajedničkoj mapi, a svako može da prijavi da je vidio ljubimca, pozove ili pošalje poruku vlasniku. Svako upozorenje ima svoj grupni čet, a aplikacija pravi plakat za štampu sa fotografijom ljubimca i QR kodom.
- **NFC pametna ogrlica.** Upiši profil ljubimca na NFC tag na ogrlici. Ko god pronađe ljubimca, prisloni telefon na tag i dobije link da te kontaktira. Na samom tagu nema ličnih podataka.
- **Udomljavanje.** Pregledaj oglase za pse i mačke uz filtere, objavi svoj oglas, piši vlasnicima i prijavi neprimjerene oglase.
- **Love Match.** Pronađi partnera za parenje u blizini, provjeri podatke o rasi i zdravlju i dopisuj se kad se poklopite.
- **AI čet.** Pitaj o ishrani, ponašanju, njezi ili simptomima i dobij odgovore prilagođene vrsti, rasi, starosti i polu tvog ljubimca. To je pomoćnik, ne veterinar, i aplikacija to jasno kaže. Pet pitanja dnevno je besplatno.

## Kako je napravljen

Ideja za PetLink je moja, kao i provjera: odluka šta svaka funkcionalnost treba da radi i testiranje da li to zaista radi. Većina koda je napisana uz pomoć AI-ja. Za generisanje koda sam koristio **Gemini i Claude**, a oni su **pregledali kod jedan drugome**: ono što je jedan napisao, drugi je provjeravao na bugove, propuštene edge case-ove i nekonzistentnosti sa ostatkom aplikacije. Drugi model koji čita kod uhvati stvari za koje je prvi slijep, ali nijedan od njih ne odlučuje kad je nešto gotovo. Taj dio je ostao na meni.

Tehnologija ispod toga:

- **React Native za mobilnu aplikaciju.** Jedna JavaScript/TypeScript baza koda za cijelu aplikaciju, iste komponente na svim ekranima i otvorena vrata za iOS verziju bez prepisivanja. Nativne funkcije poput NFC-a, push obavještenja, lokacije, kamere i sinhronizacije sa kalendarom povezane su preko React Native modula.
- **Supabase za backend.** Supabase pokriva prijavu (email, Google i Apple), PostgreSQL bazu sa profilima ljubimaca, zdravstvenim kartonima, upozorenjima i oglasima za udomljavanje, kao i skladište za fotografije i veterinarske dokumente. Kad je sve u jednom servisu, manje je koda koji samo spaja dijelove i manje mjesta gdje nešto može da pukne.
- **DeepSeek model iza AI četa.** AI čet u aplikaciji radi na DeepSeek modelu istreniranom za pitanja o brizi za ljubimce. Svako pitanje se šalje zajedno sa vrstom, rasom, starošću i polom ljubimca, tako da odgovor odgovara baš tvojoj životinji, a ne nekom opštem savjetu, a kad simptomi zvuče ozbiljno, upućuje korisnika veterinaru.

Više o radu sa AI-jem na kodu sam pisao u članku [Kako sam gradio PetLink: dva AI modela koji pišu i pregledaju kod jedan drugome](/blog/petlink-claude-code-gemini-ai-workflow/).

## Pravljenje iz ugla QA inženjera

Kad praviš proizvod, drugačije gledaš na kvalitet. Na poslu dobijem funkcionalnost, specifikaciju i rok. Na PetLink-u sam ja bio i osoba koja odlučuje šta znači "gotovo". Nekoliko stvari se izdvojilo:

- **Rizik odlučuje gdje idu testovi.** Pogrešan datum na podsjetniku je neprijatan. Pet Alert koji ne stigne ni do koga u blizini je pravi promašaj. Tokovi lokacije, obavještenja i upozorenja dobili su najviše vremena za testiranje, uključujući loš GPS, odbijene dozvole i telefone koji su bili uspavani ili offline.
- **Pravi uređaji su bolji od emulatora.** NFC, push obavještenja i kamera se iskreno ponašaju samo na fizičkim telefonima, pa su te funkcije testirane na pravim Android uređajima, ne samo u emulatoru.
- **Četiri jezika znače četiri puta više grešaka u rasporedu.** Tekstovi na srpskom, hrvatskom i bosanskom su duži od engleskih, i tekst koji staje na engleskom može da bude odsječen na bosanskom. Svaki ekran je provjeren na svakom jeziku i u tamnom režimu.
- **Privatnost je takođe test slučaj.** Zdravstveni kartoni su podrazumijevano privatni, NFC tag čuva samo link, korisnici mogu da blokiraju druge korisnike, a nalog može trajno da se obriše iz same aplikacije. Svaku od tih stvari sam tretirao kao zahtjev sa sopstvenim provjerama, a ne kao fusnotu u politici privatnosti.
- **AI odgovorima trebaju zaštitne ograde.** Asistenta sam testirao kao što na poslu testiram LLM-ove: skup stvarnih pitanja vlasnika, provjerenih na tačnost, ton i to da li korisnika šalje veterinaru kad simptomi zvuče ozbiljno.

## Šta sam naučio

1. **Obim je najteži bug.** Svaka ideja za funkcionalnost zvuči malo dok ne napišeš test slučajeve za nju. Pisanje kriterijuma prihvatanja unaprijed je spriječilo da PetLink raste unedogled.
2. **Prvi korisnici nađu bugove koje tvoji testovi nisu zamislili.** Prvi testeri su koristili aplikaciju na načine koje nikad nisam planirao, i te povratne informacije su oblikovale izdanje više od bilo koje liste provjera.
3. **I stranica u prodavnici zaslužuje QA.** Snimci ekrana, opisi, prevodi i obrazac o bezbjednosti podataka su dio proizvoda. Korisnici ih vide prije nego što vide ijedan ekran.

## Šta slijedi

PetLink je danas na Android-u, a React Native baza koda drži iOS verziju nadohvat ruke. Ako imaš psa ili mačku, volio bih da ga probaš i kažeš mi šta se pokvarilo. To mi je najdraža vrsta povratne informacije.

👉 **[Preuzmi PetLink na Google Play-u](https://play.google.com/store/apps/details?id=com.markolosic.petlink)**

Pitanja, ideje ili prijave bugova: [markolosic1993@gmail.com](mailto:markolosic1993@gmail.com).

### Povezani članci

- [Sesijsko istraživačko testiranje](/blog/session-based-exploratory-testing/)
- [Testiranje AI funkcionalnosti koje vide](/blog/vision-ai-testing-image-inputs/)
- [Testiranje lokalnog Llama 3 modela](/llm-testing/)
