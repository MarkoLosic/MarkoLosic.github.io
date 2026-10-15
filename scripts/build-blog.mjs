#!/usr/bin/env node
/* Generates the SEO-friendly, fully static blog from Markdown files in content/posts/*.md:
     blog/index.html          list of posts
     blog/<slug>/index.html   one real HTML page per post (meta tags, Open Graph, JSON-LD)
     blog/posts.json          light index used by the home page
     sitemap.xml, rss.xml, robots.txt

   Usage:  node scripts/build-blog.mjs        (also runs automatically on every push via GitHub Actions)

   Each post is one file, e.g. content/posts/my-first-post.md (the file name becomes the URL):
     ---
     title: My first post
     title_sr: Moj prvi članak       (optional, Serbian nav pill on the site)
     date: 2026-09-20
     time: 18:30                (optional, HH:MM; orders posts published on the same day)
     updated: 2026-09-25        (optional)
     tags: [qa, playwright]
     excerpt: One or two sentences, used as the Google description.
     excerpt_sr: ...             (optional)
     image: assets/blog/cover.jpg   (optional, used for link previews)
     draft: true                (optional, hides the post)
     ---
     English markdown body...

     <!--sr-->

     Serbian markdown body (optional; on its own line "<!--sr-->" splits the two).
     Whatever isn't translated (title_sr, excerpt_sr, or the whole body) just falls
     back to English when a reader switches the site to SR — nothing breaks.
*/
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const MD = require('../js/md.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (...p) => path.join(ROOT, ...p);

/* ---------- config ---------- */
const SITE = (process.env.SITE_URL || 'https://markolosic.github.io').replace(/\/+$/, '');
const AUTHOR = 'Marko Lošić';
const OG_IMAGE = `${SITE}/assets/marko.jpg`;
// Free analytics/view-counter service (goatcounter.com). Sign up (no card needed), then set this
// to your site code (the "X" in https://X.goatcounter.com), either here or via GOATCOUNTER_CODE.
const GOATCOUNTER = process.env.GOATCOUNTER_CODE || 'markolosic';
const esc = MD.esc;

/* ---------- data ---------- */
function parseFrontMatter(raw, file) {
  const m = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter (--- ... --- block at the top)`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 1 || line.trim().startsWith('#')) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  return { meta, body: m[2].trim() };
}

function loadPosts() {
  const dir = rel('content/posts');
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.md')).sort()) {
    const slug = f.replace(/\.md$/, '');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`${f}: file name must be lowercase letters, numbers and dashes (it becomes the URL)`);
    const { meta, body } = parseFrontMatter(fs.readFileSync(path.join(dir, f), 'utf8'), f);
    if (String(meta.draft).toLowerCase() === 'true') continue;
    if (!meta.title) throw new Error(`${f}: "title" is required`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date || '')) throw new Error(`${f}: "date" is required as YYYY-MM-DD`);
    if (meta.time && !/^\d{2}:\d{2}$/.test(meta.time)) throw new Error(`${f}: "time" must be HH:MM`);
    const tags = (meta.tags || '').replace(/^\[|\]$/g, '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const [bodyEn, bodySr] = body.split(/\n<!--\s*sr\s*-->\n/);
    out.push({
      slug, title: meta.title, title_sr: meta.title_sr, excerpt: meta.excerpt, excerpt_sr: meta.excerpt_sr,
      image: meta.image, body: bodyEn.trim(), body_sr: bodySr ? bodySr.trim() : null,
      tags, published_at: meta.date, published_time: meta.time || '00:00', updated_at: /^\d{4}-\d{2}-\d{2}/.test(meta.updated || '') ? meta.updated : meta.date
    });
  }
  return out;
}

/* ---------- helpers ---------- */
const fmtLong = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtShort = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const iso = d => new Date(d).toISOString();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const plain = s => s.replace(/[#>*`_~\[\]()!-]+/g, ' ').replace(/\s+/g, ' ').trim();
const write = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); };
const jsonLd = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

/* ---------- page shell ---------- */
function shell({ depth, title, description, canonical, type = 'website', image = OG_IMAGE, head = '', body, scripts = '' }) {
  const root = '../'.repeat(depth);
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="author" content="${AUTHOR}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#07090d">
  <meta property="og:site_name" content="${AUTHOR}">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${image}">
  <link rel="alternate" type="application/rss+xml" title="${AUTHOR} — Blog" href="${SITE}/rss.xml">
  ${head}
  <meta name="goatcounter-code" content="${GOATCOUNTER}">
  <script data-goatcounter="https://${GOATCOUNTER}.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 13 13' shape-rendering='crispEdges'%3E%3Crect width='13' height='13' rx='3' fill='%2307090d'/%3E%3Cpath d='M10 3h1v1h-1zM9 4h2v1h-2zM2 5h1v1h-1zM8 5h2v1h-2zM2 6h2v1h-2zM7 6h2v1h-2zM3 7h2v1h-2zM6 7h2v1h-2zM4 8h3v1h-3zM5 9h1v1h-1z' fill='%2334d399'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${root}styles.css">
  <link rel="stylesheet" href="${root}blog/blog.css">
  <script>
    try {
      var t = localStorage.getItem('theme');
      if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      document.documentElement.dataset.theme = t;
    } catch (e) {}
  </script>
</head>
<body>
  <div class="progress" id="progress" aria-hidden="true"></div>
  <div class="bg-glow" aria-hidden="true"><span></span><span></span></div>

  <header class="nav" id="nav">
    <a class="brand" href="${root}" aria-label="${AUTHOR} — home">
      <span class="brand-mark"><svg class="px" viewBox="0 0 9 9" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 1h1v1h-1zM7 2h2v1h-2zM0 3h1v1h-1zM6 3h2v1h-2zM0 4h2v1h-2zM5 4h2v1h-2zM1 5h2v1h-2zM4 5h2v1h-2zM2 6h3v1h-3zM3 7h1v1h-1z"/></svg></span>
      <span class="brand-name">Marko&nbsp;Lošić</span>
    </a>
    <nav class="links" id="links" aria-label="Primary">
      <a href="${root}#about" data-i18n="nav_about">About</a>
      <a href="${root}#skills" data-i18n="nav_skills">Skills</a>
      <a href="${root}#experience" data-i18n="nav_exp">Experience</a>
      <a href="${root}blog/" class="active" data-i18n="nav_blog">Blog</a>
      <a href="${root}#contact" data-i18n="nav_contact">Contact</a>
    </nav>
    <div class="tools">
      <button class="pill-btn" id="lang" type="button" aria-label="Switch language">
        <span data-lang-label="en">EN</span><span class="sep">/</span><span data-lang-label="sr">SR</span>
      </button>
      <button class="icon-btn" id="theme" type="button" aria-label="Toggle light / dark theme">
        <svg class="px i-moon" viewBox="0 0 9 9" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M3 0h4v1h-4zM2 1h2v1h-2zM1 2h2v1h-2zM1 3h2v1h-2zM1 4h2v1h-2zM1 5h2v1h-2zM8 5h1v1h-1zM2 6h2v1h-2zM7 6h2v1h-2zM3 7h5v1h-5z"/></svg>
        <svg class="px i-sun" viewBox="0 0 9 9" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M4 0h1v1h-1zM1 1h1v1h-1zM7 1h1v1h-1zM3 2h3v1h-3zM2 3h5v1h-5zM0 4h1v1h-1zM2 4h5v1h-5zM8 4h1v1h-1zM2 5h5v1h-5zM3 6h3v1h-3zM1 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1z"/></svg>
      </button>
      <button class="icon-btn menu-btn" id="menu" type="button" aria-label="Menu" aria-expanded="false">
        <svg class="px" viewBox="0 0 9 9" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M0 1h9v1h-9zM0 4h9v1h-9zM0 7h9v1h-9z"/></svg>
      </button>
    </div>
  </header>
${body}
  <footer class="footer wrap">
    <span>© <span id="year">${new Date().getFullYear()}</span> ${AUTHOR}</span>
    <a href="${root}#contact" data-i18n="contact_cta">Get in touch</a>
    <a href="${root}" data-i18n="back_home">Back to home ↑</a>
  </footer>
  <script src="${root}blog/common.js"></script>
  ${scripts}
</body>
</html>
`;
}

const tagSpans = tags => (tags || []).map(t => `<span>${esc(t)}</span>`).join('');
const clock = '<svg class="px" viewBox="0 0 9 9" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M5 1h1v1h-1zM6 2h1v1h-1zM7 3h1v1h-1zM0 4h9v1h-9zM7 5h1v1h-1zM6 6h1v1h-1zM5 7h1v1h-1z"/></svg>';
const back = '<svg class="px" viewBox="0 0 9 9" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M3 1h1v1h-1zM2 2h1v1h-1zM1 3h1v1h-1zM0 4h9v1h-9zM1 5h1v1h-1zM2 6h1v1h-1zM3 7h1v1h-1z"/></svg>';

/* ---------- build ---------- */
const posts = loadPosts().map(p => {
  const excerpt = p.excerpt || clip(plain(p.body || ''), 160);
  return {
    ...p,
    tags: p.tags || [],
    excerpt,
    title_sr: p.title_sr || p.title,
    excerpt_sr: p.excerpt_sr || excerpt,
    reading_time: MD.readingTime(p.body),
    updated_at: p.updated_at || p.published_at
  };
});
posts.sort((a, b) => `${b.published_at}T${b.published_time}`.localeCompare(`${a.published_at}T${a.published_time}`));

// clean previously generated post folders
for (const entry of fs.readdirSync(rel('blog'), { withFileTypes: true })) {
  if (entry.isDirectory()) fs.rmSync(rel('blog', entry.name), { recursive: true, force: true });
}

/* list page */
const allTags = [...new Set(posts.flatMap(p => p.tags))].sort();
const cards = posts.map((p, i) => `
      <a class="post-card card glow${i === 0 ? ' featured' : ''}" href="${p.slug}/" data-search="${esc((p.title + ' ' + p.title_sr + ' ' + p.excerpt + ' ' + p.excerpt_sr + ' ' + p.tags.join(' ')).toLowerCase())}" data-tags="${esc(p.tags.join('|'))}" data-title-sr="${esc(p.title_sr)}" data-excerpt-sr="${esc(p.excerpt_sr)}">
        <div class="meta"><time datetime="${p.published_at}" data-fmt="short">${fmtShort(p.published_at)}</time><span>·</span><span>${p.reading_time} <span data-i18n="min_read">min read</span></span></div>
        <h2>${esc(p.title)}</h2>
        <p>${esc(p.excerpt)}</p>
        <div class="tags">${tagSpans(p.tags)}</div>
        <span class="more"><span data-i18n="read_post">Read post</span> ${clock}</span>
      </a>`).join('');

const listBody = `
  <main class="wrap blog-wrap">
    <section class="blog-hero">
      <span class="eyebrow">Blog</span>
      <h1 class="blog-title" data-i18n="blog_h1">Notes from the <span class="grad">test bench</span>.</h1>
      <p class="lead" data-i18n="blog_lead">Writing about QA, test automation, mobile and AI testing, and what I learn while building software.</p>
    </section>
    <div class="blog-tools">
      <label class="search"><svg class="px" viewBox="0 0 9 9" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M1 0h4v1h-4zM0 1h1v1h-1zM5 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM0 3h1v1h-1zM5 3h1v1h-1zM0 4h1v1h-1zM5 4h1v1h-1zM1 5h4v1h-4zM5 6h2v1h-2zM6 7h2v1h-2zM7 8h2v1h-2z"/></svg><input id="q" type="search" data-i18n-placeholder="search_ph" placeholder="Search posts…" aria-label="Search posts" autocomplete="off"></label>
      <div class="tag-row" id="tags" aria-label="Filter by tag">${allTags.length ? ['', ...allTags].map(t => `<button type="button" class="tag${t ? '' : ' on'}" data-t="${esc(t)}"${t ? '' : ' data-i18n="tag_all"'}>${t ? esc(t) : 'All'}</button>`).join('') : ''}</div>
    </div>
    <div class="post-grid" id="posts">${cards || '<p class="state" data-i18n="no_posts">No posts yet — check back soon.</p>'}
    <p class="state" id="none" hidden data-i18n="no_match">No posts match your search.</p></div>
  </main>`;

write(rel('blog/index.html'), shell({
  depth: 1,
  title: `Blog — ${AUTHOR}`,
  description: 'Notes on QA, test automation, mobile testing, testing AI models and building software, by Marko Lošić.',
  canonical: `${SITE}/blog/`,
  head: jsonLd({
    '@context': 'https://schema.org', '@type': 'Blog', name: `${AUTHOR} — Blog`, url: `${SITE}/blog/`,
    author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/` },
    blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}/`, datePublished: p.published_at }))
  }),
  body: listBody,
  scripts: '<script src="blog.js"></script>'
}));

/* post pages */
for (const p of posts) {
  const url = `${SITE}/blog/${p.slug}/`;
  const html = MD.render(p.body, '../../');
  const htmlSr = p.body_sr ? MD.render(p.body_sr, '../../') : null;
  const firstImg = p.image || (html.match(/<img src="([^"]+)"/) || [])[1];
  const image = firstImg ? (/^https?:/.test(firstImg) ? firstImg : `${SITE}/${firstImg.replace(/^(\.\.\/)+/, '')}`) : OG_IMAGE;
  const more = posts.filter(o => o.slug !== p.slug).slice(0, 3);
  const moreCard = o => `
      <a class="post-card card glow" href="../${o.slug}/" data-title-sr="${esc(o.title_sr)}" data-excerpt-sr="${esc(o.excerpt_sr)}"><div class="meta"><time datetime="${o.published_at}" data-fmt="short">${fmtShort(o.published_at)}</time><span>·</span><span>${o.reading_time} <span data-i18n="min_read">min read</span></span></div><h2>${esc(o.title)}</h2><p>${esc(o.excerpt)}</p></a>`;
  const body = `
  <main class="wrap post-wrap">
    <a class="back" href="../">${back} <span data-i18n="all_posts">All posts</span></a>
    <article>
      <header class="post-head">
        <div class="meta"><time datetime="${p.published_at}" data-fmt="long">${fmtLong(p.published_at)}</time><span>·</span><span>${p.reading_time} <span data-i18n="min_read">min read</span></span><span>·</span><span class="views" id="views" hidden><svg class="px" viewBox="0 0 9 9" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M2 2h5v1h-5zM1 3h1v1h-1zM4 3h1v1h-1zM7 3h1v1h-1zM0 4h1v1h-1zM3 4h3v1h-3zM8 4h1v1h-1zM1 5h1v1h-1zM4 5h1v1h-1zM7 5h1v1h-1zM2 6h5v1h-5z"/></svg><span id="views-num"></span></span></div>
        <h1 data-title-sr="${esc(p.title_sr)}">${esc(p.title)}</h1>
        ${p.excerpt ? `<p class="lead" data-excerpt-sr="${esc(p.excerpt_sr)}">${esc(p.excerpt)}</p>` : ''}
        <div class="tags">${tagSpans(p.tags)}</div>
      </header>
      <div class="prose">${html}</div>
      ${htmlSr ? `<template id="prose-sr">${htmlSr}</template>` : ''}
    </article>
    <div class="post-end">
      <button class="btn ghost" id="share" type="button" data-i18n="copy_link">Copy link</button>
      <a class="btn primary" href="../../#contact" data-i18n="contact_cta">Get in touch</a>
    </div>
    ${more.length ? `<section class="more-posts"><h2 data-i18n="more_posts">More posts</h2><div class="post-grid">${more.map(moreCard).join('')}</div></section>` : ''}
  </main>`;
  write(rel('blog', p.slug, 'index.html'), shell({
    depth: 2,
    title: `${p.title} — ${AUTHOR}`,
    description: clip(p.excerpt, 160),
    canonical: url,
    type: 'article',
    image,
    head: jsonLd({
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: p.title, description: p.excerpt, image, url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      datePublished: p.published_at, dateModified: iso(p.updated_at),
      keywords: p.tags.join(', '),
      author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/` },
      publisher: { '@type': 'Person', name: AUTHOR }
    }) + `\n  <meta property="article:published_time" content="${p.published_at}">\n  <meta property="article:modified_time" content="${iso(p.updated_at)}">`,
    body,
    scripts: '<script src="../post.js"></script>'
  }));
}

/* posts.json (home page + client use) */
write(rel('blog/posts.json'), JSON.stringify(posts.map(({ slug, title, title_sr, excerpt, excerpt_sr, tags, published_at, reading_time }) => ({ slug, title, titleSr: title_sr, excerpt, excerptSr: excerpt_sr, tags, date: published_at, readingTime: reading_time })), null, 2));

/* sitemap, rss, robots */
const urls = [
  { loc: `${SITE}/`, lastmod: posts[0] ? String(posts[0].updated_at).slice(0, 10) : undefined },
  { loc: `${SITE}/blog/`, lastmod: posts[0] ? String(posts[0].updated_at).slice(0, 10) : undefined },
  ...posts.map(p => ({ loc: `${SITE}/blog/${p.slug}/`, lastmod: String(p.updated_at).slice(0, 10) }))
];
write(rel('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
write(rel('rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>${AUTHOR} — Blog</title><link>${SITE}/blog/</link><description>Notes on QA, test automation, mobile and AI testing.</description><language>en</language>\n${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}/</link><guid>${SITE}/blog/${p.slug}/</guid><pubDate>${new Date(`${p.published_at}T${p.published_time}:00Z`).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`).join('\n')}\n</channel></rss>\n`);
write(rel('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Built ${posts.length} post(s) for ${SITE}`);
