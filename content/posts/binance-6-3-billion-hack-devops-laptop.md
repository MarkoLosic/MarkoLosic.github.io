---
title: "The Heist of the Century: How One Laptop Cost Binance $6.3 Billion"
title_sr: "Pljačka stoljeća: kako je jedan laptop koštao Binance 6,3 milijarde dolara"
date: 2026-10-30
time: 18:30
tags: [security-testing, real-world-use-case, fintech]
excerpt: Binance lost an estimated $6.3 billion in the largest crypto theft ever, and the way in was a single compromised DevOps laptop. What happened and what to take away from it.
excerpt_sr: Binance je u najvećoj kripto krađi u historiji izgubio oko 6,3 milijarde dolara, a ulaz je bio jedan kompromitovan laptop DevOps inženjera. Šta se desilo i šta iz toga treba ponijeti.
image: assets/blog/binance-6-3-billion-hack-devops-laptop.jpg
---
Banks used to be robbed with masks and shotguns. Later, with insider deals. Today, one compromised laptop is enough to make more than $6 billion disappear.

![A laptop on a dark desk with a stream of glowing binary code and crypto coins pouring out of a shattered bank vault, surrounded by a network of padlock icons](assets/blog/binance-6-3-billion-hack-devops-laptop.jpg)

On October 29, Binance, the world's largest crypto exchange, suffered the largest crypto theft in history. By the company's estimate, the damage is around $6.3 billion. That's roughly four times the previous record, the $1.5 billion Bybit heist in February 2025.

## Twenty minutes, ten blockchains

Funds started leaving Binance's wallets around 20:05 UTC, across ten different blockchains. Most of it was gone within about twenty minutes. Digital money that, if it were paper, would have needed trucks to move.

Estimates differ: Binance puts the figure at $6.3 billion, while Chainalysis put it at $5.9 billion at the time of the attack. The exchange paused withdrawals on some of the affected chains and says user funds are safe and that it will cover the losses. Proof of reserves has been promised only after remediation, so for now that claim has to be taken on trust.

## In through a laptop, out through a service container

According to Binance's initial findings, the entry point was the compromised laptop of a DevOps engineer. From there, the attacker reached a service container that was able to submit withdrawal requests, and used it to push unauthorized transactions.

What *didn't* happen is just as interesting: the company says there is no evidence that wallet private keys were leaked. On Ethereum, the attacker abused EIP-7702 authorizations to make a Binance hot wallet execute a "sweeper" contract. On the other chains, the transfers were ordinary signed transactions.

CEO Richard Teng later stressed that this wasn't a single click or one person abusing their access. It was a complex attack with multiple factors and multiple points of compromise. But the question remains: how did a path from one work laptop to a system that moves billions exist in the first place?

## A familiar signature: North Korea

TRM Labs attributed the attack with high confidence to TraderTraitor, a North Korean state unit linked to the Lazarus Group. The same group was blamed for the Bybit heist.

The pattern repeats: attackers don't go after the crypto directly, they go after the people and devices that have access to it. LastPass went through something similar in 2022, when a senior DevOps engineer's compromised computer became the key to an internal vault. Attackers know the shortest path to the vault runs through someone who holds the key.

## What to take away

The details are still coming together, but some lessons are already clear:

- **The endpoint is the perimeter.** An engineer's laptop with production access should be protected like a server, not like an office PC.
- **No single access path should be able to move money.** High-value transactions need multiple signatures, separate systems and human confirmation.
- **Service containers are targets.** If a container can submit withdrawals, its permissions and network access have to be minimal.
- **Detection speed decides the outcome.** When most of the money is gone in 20 minutes, limits and automatic circuit breakers are worth more than any investigation afterwards.
- **New features bring new attack vectors.** EIP-7702 showed that even "safe" keys can be bypassed through the logic around them.

## Generals after the battle

Over the next few days the internet will fill up with two million generals after the battle who would have done everything faster, better and more securely. At a platform that has the money to hire every one of those people who would have done it faster, better and more securely.

The truth is simpler. It happened, someone made a mistake, and it will happen again. That's the world of cybersecurity: you think you're safe, and then you find out you aren't.

And yes, it's the most thankless job on the planet. The CISO's head will probably roll, unless the company is mature enough to understand that security isn't one person's job, just as this attack wasn't one laptop's job.

## Sources

- Hackread: *Binance Probes DevOps Engineer's Hacked Laptop After $6.3B Theft*
- TechCrunch: *North Korean hackers blamed for stealing record $6.3B in Binance breach*
- Forbes: *Binance's $6.3 Billion Hack Started With One Engineer's Laptop*
- Euronews: *How the Binance hack happened and who was behind it*
- daily.dev: *Binance's $6.3bn heist*

<!--sr-->

Nekada su se banke pljačkale maskama i puškama. Kasnije insajderskim poslovima. Danas je dovoljan jedan kompromitovan laptop da nestane više od 6 milijardi dolara.

![Laptop na tamnom stolu iz kojeg teče svijetleći binarni kod i kripto novčići prema razbijenom bankovnom trezoru, okružen mrežom ikonica katanaca](assets/blog/binance-6-3-billion-hack-devops-laptop.jpg)

Binance, najveća kripto berza na svijetu, 29. oktobra je doživjela najveću kripto krađu u historiji. Po procjenama kompanije, šteta je oko 6,3 milijarde dolara. To je otprilike četiri puta više od dosadašnjeg rekorda, pljačke Bybita od 1,5 milijardi u februaru 2025.

## Dvadeset minuta, deset blockchaina

Novac je počeo izlaziti iz Binanceovih walleta oko 20:05 UTC, na deset različitih blockchaina. Većina sredstava nestala je u roku od dvadesetak minuta. Digitalni novac koji bi se, da je papirni, vozio kamionima.

Procjene se razlikuju: Binance govori o 6,3 milijarde, Chainalysis je u trenutku napada iznos stavio na 5,9 milijardi. Berza je pauzirala povlačenja na dijelu blockchaina i tvrdi da su korisnička sredstva sigurna te da će pokriti gubitke. Dokaz rezervi obećan je tek nakon sanacije, pa ta tvrdnja zasad ostaje na riječ.

## Ulaz kroz laptop, izlaz kroz servisni kontejner

Prema prvim nalazima Binancea, ulazna tačka bio je kompromitovan laptop jednog DevOps inženjera. Preko njega je napadač došao do servisnog kontejnera koji je mogao slati zahtjeve za povlačenje sredstava, i iskoristio ga za neovlaštene transakcije.

Zanimljivo je šta se *nije* desilo: kompanija kaže da nema dokaza da su procurili privatni ključevi walleta. Na Ethereumu je napadač iskoristio EIP-7702 autorizacije da natjera Binanceov hot wallet da izvrši „sweeper" ugovor. Na ostalim lancima išli su obični, potpisani transferi.

CEO Richard Teng je kasnije naglasio da ovo nije bio jedan klik niti zloupotreba ovlasti jednog čovjeka. Riječ je o složenom napadu s više faktora i više tačaka proboja. Ali pitanje ostaje: kako je put od jednog radnog laptopa do sistema koji upravlja milijardama uopšte postojao?

## Poznati potpis: Sjeverna Koreja

TRM Labs je napad s visokom sigurnošću pripisao grupi TraderTraitor, sjevernokorejskoj državnoj jedinici povezanoj s Lazarus Groupom. Ista grupa okrivljena je i za pljačku Bybita.

Obrazac se ponavlja: ne napada se kripto direktno, nego ljudi i uređaji koji imaju pristup. Slično je 2022. prošao i LastPass, kada je kompromitovan računar senior DevOps inženjera postao ključ za interni vault. Napadači znaju da je najkraći put do trezora preko nekoga ko ima ključ.

## Šta iz ovoga treba ponijeti

Detalji će se tek slagati, ali neke lekcije su jasne već sada:

- **Endpoint je perimetar.** Laptop inženjera s produkcijskim pristupom treba štititi kao server, a ne kao kancelarijski računar.
- **Nijedan pojedinačni pristup ne smije pokretati novac.** Transakcije visoke vrijednosti traže više potpisa, odvojene sisteme i ljudsku potvrdu.
- **Servisni kontejneri su meta.** Ako kontejner može slati povlačenja, njegova ovlaštenja i mrežni pristup moraju biti minimalni.
- **Brzina detekcije odlučuje.** Kada većina novca nestane za 20 minuta, limiti i automatsko zaustavljanje vrijede više od svake istrage poslije.
- **Nove funkcije donose nove vektore.** EIP-7702 je pokazao da se i „sigurni" ključevi mogu zaobići kroz logiku oko njih.

## Generali poslije bitke

Na internetu će se u narednim danima pojaviti dva miliona generala poslije bitke koji bi sve uradili brže, bolje i sigurnije. I to kod platforme koja ima novca da kupi sve te koji bi to radili brže, bolje i sigurnije.

Istina je jednostavnija. Desilo se, neko je pogriješio, i desit će se opet. Takav je svijet cyber sigurnosti: misliš da si siguran, a onda te razuvjere.

I da, najnezahvalniji posao na planeti. CISO-u će vjerovatno pasti glava, osim ako je kompanija dovoljno zrela da shvati da sigurnost nije posao jednog čovjeka, baš kao što ni ovaj napad nije bio posao jednog laptopa.

## Izvori

- Hackread: *Binance Probes DevOps Engineer's Hacked Laptop After $6.3B Theft*
- TechCrunch: *North Korean hackers blamed for stealing record $6.3B in Binance breach*
- Forbes: *Binance's $6.3 Billion Hack Started With One Engineer's Laptop*
- Euronews: *How the Binance hack happened and who was behind it*
- daily.dev: *Binance's $6.3bn heist*
