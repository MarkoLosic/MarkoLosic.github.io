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
5. Objava: `git add . && git commit -m "Novi članak" && git push` — GitHub Action sam napravi stranicu, sitemap i RSS.

Pregled lokalno: `node scripts/build-blog.mjs`, pa `python3 -m http.server` i otvori http://localhost:8000/blog/
