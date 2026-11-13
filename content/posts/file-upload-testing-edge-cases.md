---
title: "Testing File Uploads: The Edge Cases a Happy-Path Suite Walks Right Past"
title_sr: "Testiranje otpremanja fajlova: granični slučajevi pored kojih happy-path testovi samo prođu"
date: 2026-11-13
time: 18:30
tags: [qa, real-world-use-case, file-upload, security-testing]
excerpt: Why file upload features break in production and how to test size limits, type spoofing, concurrency, and interrupted transfers.
excerpt_sr: Zašto funkcije za otpremanje fajlova pucaju u produkciji i kako testirati ograničenja veličine, lažiranje tipa fajla, istovremena otpremanja i prekinute prenose.
image: assets/blog/file-upload-testing-edge-cases.jpg
---
A file upload field looks like one of the simplest things in an application: pick a file, send it, show a success message. That simplicity is exactly why it gets under-tested. Most upload test suites cover one happy path — a small, valid file that uploads cleanly — and stop there. In production, uploads fail in far more interesting ways: oversized files that time out mid-transfer, filenames that break storage paths, content types that lie about what they are, and two uploads racing to claim the same slot. Any one of these can turn a "simple" feature into a support queue full of corrupted documents or a security incident.

![Isometric illustration of a cloud with a scanner lens checking files: a verified document rising on an upward arrow, a document with a hidden bug, a half-transferred file breaking apart, two documents colliding with a warning sign, and a cracked document on a red outline](assets/blog/file-upload-testing-edge-cases.jpg)

## A concrete scenario

Imagine a team building a document-sharing feature for a B2B product: users upload PDFs and images that get attached to records and later downloaded by teammates. The original test suite checked exactly three things: a 200 KB PDF uploads successfully, a non-PDF file (a `.txt`) is rejected, and a file over the stated 25 MB limit is rejected with a clear error. All three passed, and the feature shipped.

Within a few weeks, three separate problems surfaced. First, a user on a flaky mobile connection uploaded a 20 MB file that cut off at 12 MB; the server stored the partial file as if it had succeeded, and the next person to open it got a corrupted PDF with no error anywhere in the logs. Second, a file named `invoice.pdf.exe` was uploaded from a device that hid file extensions, so it looked like an ordinary PDF to the user; the server's validation only checked the extension, so the executable passed through disguised as a PDF. Third, two browser tabs open to the same record both uploaded a replacement file for that record within the same second, and the version that "won" was effectively random — whichever write happened to finish last — with no warning to either user that their upload had been silently discarded.

None of these required unusual skill to trigger. They required testing conditions the happy-path suite never simulated: an interrupted connection, a mismatch between a file's declared type and its actual content, and concurrent writes to the same resource.

## What to actually test

**Size and boundary conditions.** Test at the limit, one byte over the limit, and zero bytes. A surprising number of upload handlers accept an empty file without complaint, which is rarely the intended behavior.

**Interrupted and partial transfers.** Start an upload and kill the connection partway through, using a proxy tool or simply throttling and dropping the connection mid-request. The system should either discard the partial file or support resuming it explicitly — it should never present a half-written file as a completed, valid one. If the application advertises resumable uploads for large files, the [tus resumable upload protocol](https://tus.io/protocols/resumable-upload) is a useful reference for what a correct implementation offers: a stable upload URL, the ability to query how many bytes the server has actually received, and support for resuming from that offset rather than restarting from zero.

**Content type versus content.** Never trust a client-reported `Content-Type` header or a file extension on its own. Test it directly: rename an executable or script to `.jpg` and confirm the server rejects it based on the file's actual bytes (magic numbers), not its name or header. The [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) and the [OWASP Web Security Testing Guide's file upload tests](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/08-Test_Upload_of_Unexpected_File_Types) both describe this class of check in detail, including double extensions (`invoice.pdf.php`), null-byte tricks in filenames, and polyglot files that are valid as two formats at once.

**Filenames, not just file contents.** Upload files with spaces, non-ASCII characters, emoji, path separators (`../../etc/passwd`), and names at the maximum length the OS or storage backend allows. A validation layer that only tests with `report.pdf` will miss path traversal and encoding bugs that only show up with unusual names.

**Decompression and resource exhaustion.** If the feature accepts archives or any format that gets unpacked or processed server-side, test with a highly compressed file (a "zip bomb") that expands to a disproportionate size. The goal isn't to crash a production system — run this only against a test or staging environment — but to confirm there's a size or depth limit on decompression before it ever reaches that point.

**Concurrency.** Fire two uploads at the same target (the same record, the same user quota, the same filename) at nearly the same time and check what happens to the loser. It should get a clear conflict response, not silent data loss.

## Pitfalls and limits

This kind of testing has a real cost: simulating interrupted connections and race conditions is slower to write and run than a simple assertion, and some of it (decompression bombs, large files) needs to stay out of CI and run in an isolated environment to avoid flaky or dangerous builds. It also doesn't replace a real security review — magic-number checks and extension validation reduce risk but don't substitute for server-side antivirus or sandboxed file scanning when the application handles files from untrusted users. And not every application needs all of this: a tool that only ever accepts a handful of trusted internal CSV uploads has a much smaller attack surface than a public-facing upload form, so scale the effort to how exposed the feature actually is.

## What to do next

- Add explicit test cases for interrupted uploads and confirm partial files are never served as complete ones.
- Validate file type by content (magic numbers), not by extension or client-reported MIME type, and write a test that proves the server catches a renamed file.
- Add a concurrency test for any upload that can overwrite or race against another upload to the same target.
- If large files or archives are accepted, test decompression and size limits in an isolated environment before they reach production.

## Sources

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP Web Security Testing Guide — Test Upload of Unexpected File Types](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/08-Test_Upload_of_Unexpected_File_Types)
- [tus — Resumable Upload Protocol](https://tus.io/protocols/resumable-upload)
<!--sr-->
Polje za otpremanje fajla izgleda kao jedna od najjednostavnijih stvari u aplikaciji: izaberi fajl, pošalji ga, prikaži poruku o uspjehu. Upravo zbog te jednostavnosti se nedovoljno testira. Većina testova za otpremanje pokriva jedan happy path — mali, ispravan fajl koji se otpremi bez problema — i tu staje. U produkciji otpremanja padaju na mnogo zanimljivije načine: preveliki fajlovi kojima istekne vrijeme usred prenosa, imena fajlova koja lome putanje u skladištu, tipovi sadržaja koji lažu o tome šta su, i dva otpremanja koja se utrkuju za isto mjesto. Bilo šta od ovoga može da pretvori "jednostavnu" funkciju u red prijava podršci pun oštećenih dokumenata, ili u bezbjednosni incident.

![Izometrijska ilustracija oblaka sa sočivom skenera koje provjerava fajlove: potvrđen dokument koji se uzdiže na strelici, dokument sa skrivenim bagom, napola prenesen fajl koji se raspada, dva dokumenta koja se sudaraju uz znak upozorenja i napukao dokument na crvenom okviru](assets/blog/file-upload-testing-edge-cases.jpg)

## Konkretan scenario

Zamislite tim koji pravi funkciju za dijeljenje dokumenata u B2B proizvodu: korisnici otpremaju PDF-ove i slike koje se kače uz zapise, a kolege ih kasnije preuzimaju. Prvobitni testovi provjeravali su tačno tri stvari: PDF od 200 KB se uspješno otprema, fajl koji nije PDF (`.txt`) se odbija, a fajl veći od navedenog ograničenja od 25 MB se odbija uz jasnu poruku o grešci. Sva tri testa su prošla i funkcija je puštena.

U roku od nekoliko sedmica pojavila su se tri odvojena problema. Prvo, korisnik na nestabilnoj mobilnoj vezi otpremio je fajl od 20 MB koji se prekinuo na 12 MB; server je sačuvao djelimičan fajl kao da je otpremanje uspjelo, a sljedeća osoba koja ga je otvorila dobila je oštećen PDF, bez ijedne greške u logovima. Drugo, fajl pod imenom `invoice.pdf.exe` otpremljen je sa uređaja koji je skrivao ekstenzije fajlova, pa je korisniku izgledao kao običan PDF; validacija na serveru provjeravala je samo ekstenziju, pa je izvršni fajl prošao prerušen u PDF. Treće, dva taba u pregledaču otvorena na istom zapisu otpremila su zamjenski fajl za taj zapis u istoj sekundi, a verzija koja je "pobijedila" bila je praktično nasumična — ona čiji je upis slučajno završio posljednji — bez ikakvog upozorenja nijednom korisniku da je njegovo otpremanje tiho odbačeno.

Ništa od ovoga nije zahtijevalo posebnu vještinu da se izazove. Bilo je potrebno testirati uslove koje happy-path testovi nikad nisu simulirali: prekinutu vezu, neslaganje između deklarisanog tipa fajla i njegovog stvarnog sadržaja, i istovremene upise u isti resurs.

## Šta zaista testirati

**Veličina i granični uslovi.** Testirajte tačno na ograničenju, jedan bajt preko ograničenja i sa nula bajtova. Iznenađujuće mnogo handlera za otpremanje prihvata prazan fajl bez pogovora, što je rijetko željeno ponašanje.

**Prekinuti i djelimični prenosi.** Pokrenite otpremanje i prekinite vezu na pola puta, pomoću proxy alata ili jednostavno usporavanjem i prekidanjem veze usred zahtjeva. Sistem treba ili da odbaci djelimičan fajl ili da eksplicitno podrži nastavak otpremanja — nikada ne smije da predstavi napola upisan fajl kao završen i ispravan. Ako aplikacija nudi nastavljiva otpremanja za velike fajlove, [tus protokol za nastavljivo otpremanje](https://tus.io/protocols/resumable-upload) je koristan orijentir za ono što ispravna implementacija pruža: stabilan URL otpremanja, mogućnost da se upita koliko je bajtova server zaista primio i podršku za nastavak od te pozicije umjesto ponovnog kretanja od nule.

**Tip sadržaja naspram stvarnog sadržaja.** Nikada ne vjerujte samo `Content-Type` zaglavlju koje šalje klijent ili ekstenziji fajla. Testirajte to direktno: preimenujte izvršni fajl ili skriptu u `.jpg` i potvrdite da ga server odbija na osnovu stvarnih bajtova fajla (magic numbers), a ne imena ili zaglavlja. [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) i [testovi otpremanja fajlova iz OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/08-Test_Upload_of_Unexpected_File_Types) detaljno opisuju ovu vrstu provjera, uključujući dvostruke ekstenzije (`invoice.pdf.php`), trikove sa null bajtom u imenima fajlova i poliglot fajlove koji su istovremeno ispravni u dva formata.

**Imena fajlova, ne samo sadržaj.** Otpremite fajlove sa razmacima, ne-ASCII znakovima, emotikonima, separatorima putanje (`../../etc/passwd`) i imenima maksimalne dužine koju dozvoljava operativni sistem ili skladište. Validacija koja se testira samo sa `report.pdf` propustiće path traversal i bagove u kodiranju znakova koji se pojavljuju tek sa neobičnim imenima.

**Dekompresija i iscrpljivanje resursa.** Ako funkcija prihvata arhive ili bilo koji format koji se raspakuje ili obrađuje na serveru, testirajte sa jako kompresovanim fajlom ("zip bomba") koji se raspakuje do nesrazmjerne veličine. Cilj nije da srušite produkcijski sistem — ovo pokrećite isključivo na testnom ili staging okruženju — već da potvrdite da postoji ograničenje veličine ili dubine dekompresije prije nego što se do te tačke uopšte stigne.

**Istovremenost.** Pošaljite dva otpremanja na isti cilj (isti zapis, istu korisničku kvotu, isto ime fajla) gotovo u isto vrijeme i provjerite šta se dešava sa onim koji "izgubi". On treba da dobije jasan odgovor o konfliktu, a ne tihi gubitak podataka.

## Zamke i ograničenja

Ovakvo testiranje ima stvarnu cijenu: simuliranje prekinutih veza i stanja utrkivanja (race conditions) sporije je za pisanje i izvršavanje od obične asertacije, a dio toga (dekompresione bombe, veliki fajlovi) treba da ostane van CI-ja i da se izvršava u izolovanom okruženju, kako bi se izbjegli nestabilni ili opasni buildovi. Ovo takođe ne zamjenjuje pravu bezbjednosnu reviziju — provjere magic numbers i validacija ekstenzija smanjuju rizik, ali ne zamjenjuju antivirus na serveru ili skeniranje fajlova u sandboxu kada aplikacija obrađuje fajlove od nepouzdanih korisnika. I ne treba svakoj aplikaciji sve ovo: alat koji prihvata samo nekoliko pouzdanih internih CSV fajlova ima mnogo manju površinu napada od javne forme za otpremanje, pa trud prilagodite tome koliko je funkcija zaista izložena.

## Šta dalje

- Dodajte eksplicitne test slučajeve za prekinuta otpremanja i potvrdite da se djelimični fajlovi nikada ne serviraju kao kompletni.
- Validirajte tip fajla po sadržaju (magic numbers), a ne po ekstenziji ili MIME tipu koji prijavljuje klijent, i napišite test koji dokazuje da server hvata preimenovan fajl.
- Dodajte test istovremenosti za svako otpremanje koje može da prepiše drugo otpremanje na isti cilj ili da se sa njim utrkuje.
- Ako se prihvataju veliki fajlovi ili arhive, testirajte dekompresiju i ograničenja veličine u izolovanom okruženju prije nego što stignu do produkcije.

## Izvori

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP Web Security Testing Guide — Test Upload of Unexpected File Types](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/08-Test_Upload_of_Unexpected_File_Types)
- [tus — Resumable Upload Protocol](https://tus.io/protocols/resumable-upload)
