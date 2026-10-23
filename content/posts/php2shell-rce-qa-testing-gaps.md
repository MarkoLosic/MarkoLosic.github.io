---
title: "PHP2Shell: How a Critical PHP Core RCE Exposes Gaps in Standard QA Practices"
title_sr: "PHP2Shell: kako kritični RCE u jezgru PHP-a otkriva rupe u standardnim QA praksama"
date: 2026-10-23
time: 15:00
tags: [qa, security-testing, php, incident-response]
excerpt: What the PHP2Shell remote code execution bugs reveal about blind spots in typical test suites, and concrete steps to close them.
excerpt_sr: Šta PHP2Shell ranjivosti za udaljeno izvršavanje koda otkrivaju o slijepim tačkama tipičnih paketa testova i konkretni koraci da se one zatvore.
image: assets/blog/php2shell-rce-qa-testing-gaps.jpg
---
In late 2026, two critical vulnerabilities in PHP's core interpreter, tracked as CVE-2026-109618 and CVE-2026-109619, were disclosed with a CVSS score of 9.2. Neither requires authentication or user interaction. Both are reachable with ordinary-looking HTTP requests, and in-the-wild exploitation was reported before most sites could patch. What makes this case worth a QA team's attention isn't just the severity — it's that the bugs sit in exactly the kind of territory most test suites never look at: malformed input at the protocol level, and state that carries over between requests. That's a useful prompt to ask what your own tests would have caught, and what they wouldn't.

![Isometric illustration of a server tower with a glowing PHP chip on top, hit by streams of "HTTP REQUEST" data packets that slip past a cracked firewall shield, surrounded by warning panels reading "CVSS 9.2", "RCE critical alert", "PHP2Shell", "Memory corruption", "Use-after-free", "State leak", "Malformed multipart" and "Shell exploit active"](assets/blog/php2shell-rce-qa-testing-gaps.jpg)

## What actually happened

CVE-2026-109618 is a memory-corruption issue tied to how PHP parses multipart form data. A request without a `Content-Length` header can bypass the configured `post_max_size` limit, an uncapped number of HTTP headers can be sent to inflate memory use, and `max_file_uploads` doesn't count empty file fields, which lets the structures PHP builds for them exhaust memory.

CVE-2026-109619 is a use-after-free: PHP workers track per-request state, such as session data, and under specific error conditions that state isn't cleared before its memory is freed. Triggering it takes two separate requests — one that causes an error (an out-of-memory condition, an execution timeout, or a failed upload), followed by one that triggers a warning during initialization.

Researchers at Wiz reported confirmed exploitation on PHP 8.5 with `fatal_error_backtraces` enabled, and the affected code is suspected to date back to PHP 5. Patches landed in PHP 8.5.12, 8.4.27, 8.3.36, and 8.2.35; versions before 8.2 are expected to stay unpatched because those branches are end of life.

This is not a bug a typical functional test would stumble into. It lives in the gap between "the request worked" and "the request was well-formed," and in the gap between one request and the next.

## Why this is a testing blind spot

Most QA suites are built around three assumptions that this incident breaks. First, that a single request is a complete, isolated unit of testing — write the request, assert the response, move on. CVE-2026-109619 only appears across a *sequence*: an error-triggering request followed by a specific second request. Negative tests that check "does this bad input get rejected" one request at a time won't notice that the server's internal state didn't reset correctly in between.

Second, that malformed input means obviously wrong values — a negative number where a positive one is expected, a string where an integer belongs. Few test plans include a POST request with no `Content-Length` header, an excessive number of HTTP headers, or dozens of empty file-upload fields. These are protocol-level malformations, not business-logic edge cases, and they usually fall outside what either QA or product-focused security reviews think to check.

Third, that the staging environment where tests run matches production closely enough that a pass in staging means something in production. If your staging PHP build has `session.upload_progress` disabled, a different `max_file_uploads` setting, or lacks a vendor-bundled PHP that ships inside an appliance or control panel, your tests will pass against a target that was never actually exposed to the real risk.

Here's the kind of check this incident argues for adding, aimed at catching state leakage across requests rather than at reproducing the exploit itself:

```python
import httpx

def test_error_request_does_not_poison_next_request(base_url):
    client = httpx.Client(base_url=base_url)

    # Request 1: deliberately trigger a server-side error
    # (e.g. a payload that exceeds max_file_uploads or times out)
    r1 = client.post("/upload", files=oversized_upload_payload())
    assert r1.status_code in (413, 500, 504)

    # Request 2: an ordinary, valid request right after
    r2 = client.get("/account/session-check")
    assert r2.status_code == 200
    assert r2.json()["session_id"] != r1.headers.get("leaked-session-id")
```

A test like this won't catch every variant of a use-after-free, but it builds the habit of asserting that one request's failure can't contaminate the next one — which is the actual shape of the bug class, independent of this specific CVE.

## Pitfalls and limits

Writing tests for this class of bug has real limits. You can't fuzz production, and running genuinely malformed requests (missing headers, huge payloads, malformed multipart boundaries) against a shared staging environment can crash it for other teams, so this kind of testing needs its own isolated, disposable environment.

It's also easy to write a test that passes for the wrong reason: if your staging `php.ini` differs from production even slightly — a different `upload_max_filesize`, a disabled module, a backported distro patch that changes behavior without changing the version string — a green test tells you nothing about the real target.

And version fingerprinting is unreliable in both directions: a `X-Powered-By` header can be hidden by a proxy, and a Linux distribution's security patches can land before the upstream version number changes, so "we're on patched PHP 8.4.27" isn't something you can safely infer from a response header alone.

## What to do next

1. **Track PHP core, not just your dependencies.** Composer audit and Dependabot-style tools catch vulnerable packages; they don't catch a vulnerable PHP interpreter itself. Add the PHP version your servers actually run (confirmed via `php -v` / `php-fpm -v` on the box, not inferred from headers) to whatever CVE or patch-tracking process you already have.
2. **Add protocol-level negative tests to your suite**, run against an isolated, disposable environment: oversized header counts, missing `Content-Length`, malformed multipart boundaries, and empty file-upload fields. Treat these the same way you already treat SQL injection or XSS payloads — as a standing regression set, not a one-off pentest finding.
3. **Test request sequences, not just single requests**, specifically around error paths: does a failed request leave any state (sessions, caches, temp files) that the next request can read or reuse?
4. **Keep staging configuration identical to production** for anything security-relevant — `php.ini` directives, loaded modules, and the exact PHP build — and re-verify that alignment periodically rather than assuming it from a deployment script written months ago.

## Sources

- [Critical PHP Vulnerability (CVE-2026-109618, CVE-2026-109619)](https://isc.sans.edu/diary.html?storyid=35447) — SANS Internet Storm Center
- [PHP2Shell scanner for CVE-2026-109618 and CVE-2026-109619](https://pentest-tools.com/network-vulnerability-scanning/php2shell-scanner) — Pentest-Tools.com
<!--sr-->
Krajem 2026. godine objavljene su dvije kritične ranjivosti u jezgru PHP interpretera, označene kao CVE-2026-109618 i CVE-2026-109619, sa CVSS ocjenom 9.2. Nijedna ne zahtijeva autentifikaciju niti bilo kakvu interakciju korisnika. Obje se mogu dosegnuti HTTP zahtjevima koji izgledaju sasvim obično, a zloupotreba u stvarnom svijetu prijavljena je prije nego što je većina sajtova stigla da se zakrpi. Ono što ovaj slučaj čini vrijednim pažnje QA tima nije samo ozbiljnost — nego to što se ovi bagovi nalaze upravo na teritoriji koju većina paketa testova nikada ne pogleda: neispravan ulaz na nivou protokola i stanje koje se prenosi iz jednog zahtjeva u drugi. To je dobar povod da se zapitate šta bi vaši testovi uhvatili, a šta ne bi.

![Izometrijska ilustracija serverskog ormara sa svijetlećim PHP čipom na vrhu, koji pogađaju tokovi paketa podataka „HTTP REQUEST" što prolaze pored napuklog štita firewalla, okružena panelima upozorenja sa natpisima „CVSS 9.2", „RCE critical alert", „PHP2Shell", „Memory corruption", „Use-after-free", „State leak", „Malformed multipart" i „Shell exploit active"](assets/blog/php2shell-rce-qa-testing-gaps.jpg)

## Šta se zapravo desilo

CVE-2026-109618 je problem korupcije memorije vezan za način na koji PHP parsira multipart podatke iz formi. Zahtjev bez `Content-Length` zaglavlja može da zaobiđe podešeno ograničenje `post_max_size`, može se poslati neograničen broj HTTP zaglavlja kako bi se naduvala potrošnja memorije, a `max_file_uploads` ne broji prazna polja za upload fajlova, što omogućava da strukture koje PHP pravi za njih iscrpe memoriju.

CVE-2026-109619 je use-after-free: PHP workeri prate stanje po zahtjevu, poput podataka o sesiji, a pod određenim uslovima greške to stanje se ne očisti prije nego što se njegova memorija oslobodi. Za aktiviranje su potrebna dva odvojena zahtjeva — jedan koji izazove grešku (nedostatak memorije, istek vremena izvršavanja ili neuspješan upload), a zatim drugi koji izazove upozorenje tokom inicijalizacije.

Istraživači iz Wiza prijavili su potvrđenu zloupotrebu na PHP 8.5 sa uključenim `fatal_error_backtraces`, a sumnja se da pogođeni kod potiče još iz PHP 5. Zakrpe su izašle u verzijama PHP 8.5.12, 8.4.27, 8.3.36 i 8.2.35; očekuje se da verzije starije od 8.2 ostanu nezakrpljene, jer su te grane na kraju životnog vijeka (end of life).

Ovo nije bag na koji bi tipičan funkcionalni test slučajno naletio. On živi u procjepu između „zahtjev je uspio" i „zahtjev je bio ispravno formiran", kao i u procjepu između jednog zahtjeva i sljedećeg.

## Zašto je ovo slijepa tačka testiranja

Većina QA paketa testova izgrađena je na tri pretpostavke koje ovaj incident ruši. Prva je da je jedan zahtjev kompletna, izolovana jedinica testiranja — napišeš zahtjev, provjeriš odgovor, ideš dalje. CVE-2026-109619 se pojavljuje samo kroz *niz* zahtjeva: zahtjev koji izazove grešku, a zatim određeni drugi zahtjev. Negativni testovi koji jedan po jedan zahtjev provjeravaju „da li se ovaj loš ulaz odbija" neće primijetiti da se interno stanje servera između njih nije ispravno resetovalo.

Druga je da neispravan ulaz znači očigledno pogrešne vrijednosti — negativan broj tamo gdje se očekuje pozitivan, string tamo gdje pripada cijeli broj. Malo koji test plan uključuje POST zahtjev bez `Content-Length` zaglavlja, prevelik broj HTTP zaglavlja ili desetine praznih polja za upload fajlova. To su neispravnosti na nivou protokola, a ne granični slučajevi poslovne logike, i obično padaju van onoga što QA ili bezbjednosni pregledi fokusirani na proizvod uopšte pomisle da provjere.

Treća je da staging okruženje u kojem se testovi pokreću dovoljno vjerno odgovara produkciji da prolaz na stagingu nešto znači i za produkciju. Ako vaš staging PHP build ima isključen `session.upload_progress`, drugačije podešen `max_file_uploads` ili ne sadrži PHP koji proizvođač isporučuje unutar nekog uređaja ili kontrolnog panela, vaši testovi će prolaziti nad metom koja nikada nije bila izložena stvarnom riziku.

Evo kakvu provjeru ovaj incident opravdava da dodate — usmjerenu na hvatanje curenja stanja između zahtjeva, a ne na reprodukovanje samog exploita:

```python
import httpx

def test_error_request_does_not_poison_next_request(base_url):
    client = httpx.Client(base_url=base_url)

    # Request 1: deliberately trigger a server-side error
    # (e.g. a payload that exceeds max_file_uploads or times out)
    r1 = client.post("/upload", files=oversized_upload_payload())
    assert r1.status_code in (413, 500, 504)

    # Request 2: an ordinary, valid request right after
    r2 = client.get("/account/session-check")
    assert r2.status_code == 200
    assert r2.json()["session_id"] != r1.headers.get("leaked-session-id")
```

Ovakav test neće uhvatiti svaku varijantu use-after-free baga, ali gradi naviku da se provjerava da neuspjeh jednog zahtjeva ne može da kontaminira sljedeći — a upravo to je stvarni oblik ove klase bagova, nezavisno od ovog konkretnog CVE-a.

## Zamke i ograničenja

Pisanje testova za ovu klasu bagova ima stvarna ograničenja. Ne možete fuzzovati produkciju, a slanje zaista neispravnih zahtjeva (bez zaglavlja, sa ogromnim payload-om, sa neispravnim multipart granicama) na zajedničko staging okruženje može da ga obori i drugim timovima, pa je ovakvom testiranju potrebno sopstveno izolovano okruženje koje se može baciti nakon upotrebe.

Lako je napisati i test koji prolazi iz pogrešnog razloga: ako se vaš staging `php.ini` i malo razlikuje od produkcijskog — drugačiji `upload_max_filesize`, isključen modul, zakrpa koju je distribucija backportovala i koja mijenja ponašanje bez promjene oznake verzije — zelen test vam ne govori ništa o stvarnoj meti.

Uz to, prepoznavanje verzije (fingerprinting) je nepouzdano u oba smjera: proxy može da sakrije `X-Powered-By` zaglavlje, a bezbjednosne zakrpe Linux distribucije mogu stići prije nego što se promijeni upstream broj verzije, pa „mi smo na zakrpljenom PHP 8.4.27" nije nešto što možete bezbjedno zaključiti samo na osnovu zaglavlja odgovora.

## Šta dalje

1. **Pratite jezgro PHP-a, a ne samo svoje zavisnosti.** Composer audit i alati poput Dependabota hvataju ranjive pakete; ne hvataju ranjiv sam PHP interpreter. Verziju PHP-a koju vaši serveri zaista pokreću (potvrđenu komandama `php -v` / `php-fpm -v` na samoj mašini, a ne zaključenu iz zaglavlja) dodajte u proces praćenja CVE-ova ili zakrpa koji već imate.
2. **Dodajte negativne testove na nivou protokola u svoj paket**, i pokrećite ih u izolovanom okruženju koje se može baciti: prevelik broj zaglavlja, nedostajući `Content-Length`, neispravne multipart granice i prazna polja za upload fajlova. Tretirajte ih isto kao što već tretirate SQL injection ili XSS payload-e — kao stalni regresioni set, a ne kao jednokratni nalaz iz pentesta.
3. **Testirajte nizove zahtjeva, a ne samo pojedinačne zahtjeve**, naročito oko putanja grešaka: da li neuspješan zahtjev ostavlja bilo kakvo stanje (sesije, keš, privremene fajlove) koje sljedeći zahtjev može da pročita ili ponovo iskoristi?
4. **Održavajte konfiguraciju staginga identičnom produkciji** za sve što je bitno za bezbjednost — `php.ini` direktive, učitane module i tačan PHP build — i povremeno ponovo provjerite da se poklapaju, umjesto da to pretpostavljate na osnovu deployment skripte napisane prije nekoliko mjeseci.

## Izvori

- [Critical PHP Vulnerability (CVE-2026-109618, CVE-2026-109619)](https://isc.sans.edu/diary.html?storyid=35447) — SANS Internet Storm Center
- [PHP2Shell scanner for CVE-2026-109618 and CVE-2026-109619](https://pentest-tools.com/network-vulnerability-scanning/php2shell-scanner) — Pentest-Tools.com
