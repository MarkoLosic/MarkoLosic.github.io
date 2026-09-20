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
     date: 2026-09-20
     updated: 2026-09-25        (optional)
     tags: [qa, playwright]
     excerpt: One or two sentences, used as the Google description.
     image: assets/blog/cover.jpg   (optional, used for link previews)
     draft: true                (optional, hides the post)
     ---
     Markdown body...
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
    const tags = (meta.tags || '').replace(/^\[|\]$/g, '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    out.push({ slug, title: meta.title, excerpt: meta.excerpt, image: meta.image, body, tags, published_at: meta.date, updated_at: /^\d{4}-\d{2}-\d{2}/.test(meta.updated || '') ? meta.updated : meta.date });
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
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%2307090d'/%3E%3Cpath d='M16 34l11 11 21-26' fill='none' stroke='%2334d399' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
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
      <span class="brand-mark"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg></span>
      <span class="brand-name">Marko&nbsp;Lošić</span>
    </a>
    <nav class="links" id="links" aria-label="Primary">
      <a href="${root}#about">About</a>
      <a href="${root}#skills">Skills</a>
      <a href="${root}#experience">Experience</a>
      <a href="${root}blog/" class="active">Blog</a>
      <a href="${root}#contact">Contact</a>
    </nav>
    <div class="tools">
      <button class="icon-btn" id="theme" type="button" aria-label="Toggle light / dark theme">
        <svg class="i-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>
        <svg class="i-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
      <button class="icon-btn menu-btn" id="menu" type="button" aria-label="Menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </header>
${body}
  <footer class="footer wrap">
    <span>© <span id="year">${new Date().getFullYear()}</span> ${AUTHOR}</span>
    <a href="${root}#contact">Get in touch</a>
    <a href="${root}">Back to home ↑</a>
  </footer>
  <script src="${root}blog/common.js"></script>
  ${scripts}
</body>
</html>
`;
}

const tagSpans = tags => (tags || []).map(t => `<span>${esc(t)}</span>`).join('');
const clock = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- build ---------- */
const posts = loadPosts().map(p => ({
  ...p,
  tags: p.tags || [],
  excerpt: p.excerpt || clip(plain(p.body || ''), 160),
  reading_time: MD.readingTime(p.body),
  updated_at: p.updated_at || p.published_at
}));
posts.sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));

// clean previously generated post folders
for (const entry of fs.readdirSync(rel('blog'), { withFileTypes: true })) {
  if (entry.isDirectory()) fs.rmSync(rel('blog', entry.name), { recursive: true, force: true });
}

/* list page */
const allTags = [...new Set(posts.flatMap(p => p.tags))].sort();
const cards = posts.map((p, i) => `
      <a class="post-card card glow${i === 0 ? ' featured' : ''}" href="${p.slug}/" data-search="${esc((p.title + ' ' + p.excerpt + ' ' + p.tags.join(' ')).toLowerCase())}" data-tags="${esc(p.tags.join('|'))}">
        <div class="meta"><time datetime="${p.published_at}">${fmtShort(p.published_at)}</time><span>·</span><span>${p.reading_time} min read</span></div>
        <h2>${esc(p.title)}</h2>
        <p>${esc(p.excerpt)}</p>
        <div class="tags">${tagSpans(p.tags)}</div>
        <span class="more">Read post ${clock}</span>
      </a>`).join('');

const listBody = `
  <main class="wrap blog-wrap">
    <section class="blog-hero">
      <span class="eyebrow">Blog</span>
      <h1 class="blog-title">Notes from the <span class="grad">test bench</span>.</h1>
      <p class="lead">Writing about QA, test automation, mobile and AI testing, and what I learn while building software.</p>
    </section>
    <div class="blog-tools">
      <label class="search"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="q" type="search" placeholder="Search posts…" aria-label="Search posts" autocomplete="off"></label>
      <div class="tag-row" id="tags" aria-label="Filter by tag">${allTags.length ? ['', ...allTags].map(t => `<button type="button" class="tag${t ? '' : ' on'}" data-t="${esc(t)}">${t ? esc(t) : 'All'}</button>`).join('') : ''}</div>
    </div>
    <div class="post-grid" id="posts">${cards || '<p class="state">No posts yet — check back soon.</p>'}
    <p class="state" id="none" hidden>No posts match your search.</p></div>
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
  const firstImg = p.image || (html.match(/<img src="([^"]+)"/) || [])[1];
  const image = firstImg ? (/^https?:/.test(firstImg) ? firstImg : `${SITE}/${firstImg.replace(/^(\.\.\/)+/, '')}`) : OG_IMAGE;
  const more = posts.filter(o => o.slug !== p.slug).slice(0, 3);
  const body = `
  <main class="wrap post-wrap">
    <a class="back" href="../">${clock.replace('M5 12h14M13 6l6 6-6 6', 'M19 12H5M11 6l-6 6 6 6')} All posts</a>
    <article>
      <header class="post-head">
        <div class="meta"><time datetime="${p.published_at}">${fmtLong(p.published_at)}</time><span>·</span><span>${p.reading_time} min read</span></div>
        <h1>${esc(p.title)}</h1>
        ${p.excerpt ? `<p class="lead">${esc(p.excerpt)}</p>` : ''}
        <div class="tags">${tagSpans(p.tags)}</div>
      </header>
      <div class="prose">${html}</div>
    </article>
    <div class="post-end">
      <button class="btn ghost" id="share" type="button">Copy link</button>
      <a class="btn primary" href="../../#contact">Get in touch</a>
    </div>
    ${more.length ? `<section class="more-posts"><h2>More posts</h2><div class="post-grid">${more.map(o => `
      <a class="post-card card glow" href="../${o.slug}/"><div class="meta"><time datetime="${o.published_at}">${fmtShort(o.published_at)}</time><span>·</span><span>${o.reading_time} min read</span></div><h2>${esc(o.title)}</h2><p>${esc(o.excerpt)}</p></a>`).join('')}</div></section>` : ''}
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
write(rel('blog/posts.json'), JSON.stringify(posts.map(({ slug, title, excerpt, tags, published_at, reading_time }) => ({ slug, title, excerpt, tags, date: published_at, readingTime: reading_time })), null, 2));

/* sitemap, rss, robots */
const urls = [
  { loc: `${SITE}/`, lastmod: posts[0] ? String(posts[0].updated_at).slice(0, 10) : undefined },
  { loc: `${SITE}/blog/`, lastmod: posts[0] ? String(posts[0].updated_at).slice(0, 10) : undefined },
  ...posts.map(p => ({ loc: `${SITE}/blog/${p.slug}/`, lastmod: String(p.updated_at).slice(0, 10) }))
];
write(rel('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
write(rel('rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>${AUTHOR} — Blog</title><link>${SITE}/blog/</link><description>Notes on QA, test automation, mobile and AI testing.</description><language>en</language>\n${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}/</link><guid>${SITE}/blog/${p.slug}/</guid><pubDate>${new Date(p.published_at + 'T00:00:00Z').toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`).join('\n')}\n</channel></rss>\n`);
write(rel('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Built ${posts.length} post(s) for ${SITE}`);
