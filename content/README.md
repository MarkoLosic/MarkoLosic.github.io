# Kako se dodaje članak

1. Napravi fajl `content/posts/naziv-clanka.md` (ime fajla = URL, samo mala slova, brojevi i crtice).
2. Na vrh stavi blok:

```
---
title: Naslov članka
date: 2026-09-20
updated: 2026-09-25      (opciono)
tags: [qa, playwright]
excerpt: Jedna do dvije rečenice; ovo je opis u Google rezultatima.
image: assets/blog/naslovna.jpg   (opciono, slika za dijeljenje linka)
draft: true              (opciono; sakriva članak dok ne obrišeš ovu liniju)
---
```

3. Ispod ide tekst u Markdown-u (## naslovi, **podebljano**, - liste, > citat, ``` kod ```, [link](https://...), ![opis slike](assets/blog/slika.jpg)).
4. Slike stavi u `assets/blog/`.
5. Za custom HTML (npr. callout kutije ili ručno crtan SVG dijagram) koji Markdown ne pokriva, stavi ga između `<!--html-->` i `<!--/html-->` na svojim linijama — taj blok se ubacuje u stranicu bez izmjena, umjesto da bude eskejpovan kao tekst. Piši ga direktno u `.md` fajl (ne u generisani `blog/.../index.html`), inače nestane kod sljedećeg builda.
6. Objava: `git add . && git commit -m "Novi članak" && git push` — GitHub Action sam napravi stranicu, sitemap i RSS.

## Srpski prevod (opciono)

Cijeli blog (kao i naslovna strana) ima EN/SR prekidač. Ako želiš da članak ima i srpsku verziju:

1. Dodaj `title_sr` i `excerpt_sr` u front matter (ispod `title` i `excerpt`).
2. Na kraju engleskog teksta članka stavi liniju `<!--sr-->` samu za sebe, pa ispod nje napiši cijeli tekst na srpskom.

Ako `title_sr`/`excerpt_sr` ili `<!--sr-->` blok izostave, taj dio članka jednostavno ostaje na engleskom kad neko prebaci sajt na SR — ništa se ne lomi.

Pregled lokalno: `node scripts/build-blog.mjs`, pa `python3 -m http.server` i otvori http://localhost:8000/blog/
