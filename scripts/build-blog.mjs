#!/usr/bin/env node
/* Generates the SEO- and GEO-friendly, fully static blog from Markdown files in content/posts/*.md:
     blog/index.html              list of posts (EN)
     blog/<slug>/index.html       one real HTML page per post (EN, meta tags, Open Graph, JSON-LD, hreflang)
     sr/blog/index.html           list of posts (SR)
     sr/blog/<slug>/index.html    one real HTML page per post (SR, full Serbian HTML + hreflang)
     blog/posts.json              light index used by the home page
     llms.txt, llms-full.txt      GEO / AI-crawler index files
     sitemap.xml, rss.xml, robots.txt

   Usage:  node scripts/build-blog.mjs        (also runs automatically on every push via GitHub Actions)
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
const AUTHOR_ID = `${SITE}/#person`;
const OG_IMAGE = `${SITE}/assets/marko.jpg`;
const GA_ID = process.env.GA_MEASUREMENT_ID || 'G-TP2Z3K3Z94';
const esc = MD.esc;

const PERSON_REF = {
  '@type': 'Person',
  '@id': AUTHOR_ID,
  name: AUTHOR,
  jobTitle: 'QA Engineer',
  url: `${SITE}/`,
  image: OG_IMAGE,
  sameAs: [
    'https://www.linkedin.com/in/markolo%C5%A1i%C4%87/',
    'https://github.com/MarkoLosic'
  ]
};

/* ---------- image dimensions (pure Node, zero deps) ---------- */
const imgSizeCache = new Map();
function getImageSize(absPath) {
  if (imgSizeCache.has(absPath)) return imgSizeCache.get(absPath);
  let res = null;
  try {
    const buf = fs.readFileSync(absPath);
    // PNG
    if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      res = { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    // JPEG
    else if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        if (marker === 0xd9 || marker === 0xda) break;
        const len = buf.readUInt16BE(i + 2);
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
          res = { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
          break;
        }
        i += 2 + len;
      }
    }
    // WebP
    else if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = buf.toString('ascii', 12, 16);
      if (chunk === 'VP8X') {
        res = { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
      } else if (chunk === 'VP8 ') {
        res = { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      } else if (chunk === 'VP8L') {
        const b = buf.readUInt32LE(21);
        res = { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
    }
  } catch (_) {}
  imgSizeCache.set(absPath, res);
  return res;
}

function enhanceImages(html) {
  let idx = 0;
  return html.replace(/<img\s+([^>]*?)>/g, (full, attrs) => {
    idx++;
    const srcMatch = attrs.match(/src="([^"]+)"/);
    let next = attrs;
    if (srcMatch && !/^https?:/.test(srcMatch[1])) {
      const cleanRel = srcMatch[1].replace(/^(\.\.\/)+/, '').replace(/^\/+/, '');
      const dims = getImageSize(rel(cleanRel));
      if (dims && !/\bwidth=/.test(next)) {
        next += ` width="${dims.width}" height="${dims.height}"`;
      }
    }
    if (idx === 1) {
      next = next.replace(/\s*loading="lazy"/, '');
      if (!/\bfetchpriority=/.test(next)) next += ' fetchpriority="high"';
    }
    if (!/\bdecoding=/.test(next)) next += ' decoding="async"';
    return `<img ${next.trim()}>`;
  });
}

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
      slug,
      title: meta.title,
      seo_title: meta.seo_title || null,
      title_sr: meta.title_sr,
      seo_title_sr: meta.seo_title_sr || null,
      excerpt: meta.excerpt,
      excerpt_sr: meta.excerpt_sr,
      image: meta.image,
      body: bodyEn.trim(),
      body_sr: bodySr ? bodySr.trim() : null,
      tags,
      published_at: meta.date,
      published_time: meta.time || '00:00',
      updated_at: /^\d{4}-\d{2}-\d{2}/.test(meta.updated || '') ? meta.updated : meta.date
    });
  }
  return out;
}

/* ---------- helpers ---------- */
const fmtLong = (d, lang = 'en') => new Date(d + 'T00:00:00Z').toLocaleDateString(lang === 'sr' ? 'sr-Latn-RS' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtShort = (d, lang = 'en') => new Date(d + 'T00:00:00Z').toLocaleDateString(lang === 'sr' ? 'sr-Latn-RS' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const iso = d => new Date(d).toISOString();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const plain = s => s.replace(/[#>*`_~\[\]()!-]+/g, ' ').replace(/\s+/g, ' ').trim();
const wordCount = s => plain(s).split(/\s+/).filter(Boolean).length;
const write = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); };
const jsonLd = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const fileLastMod = f => {
  try { return fs.statSync(rel(f)).mtime.toISOString().slice(0, 10); } catch (_) { return undefined; }
};

function relatedPosts(post, allPosts, count = 3) {
  const myTags = new Set(post.tags);
  return allPosts
    .filter(o => o.slug !== post.slug)
    .map(o => {
      let score = 0;
      for (const t of o.tags) {
        if (myTags.has(t)) score += t === 'qa' ? 0.5 : 2;
      }
      return { post: o, score };
    })
    .sort((a, b) => b.score - a.score || `${b.post.published_at}T${b.post.published_time}`.localeCompare(`${a.post.published_at}T${a.post.published_time}`))
    .slice(0, count)
    .map(x => x.post);
}

/* ---------- page shell ---------- */
function shell({
  depth, lang = 'en', staticLang = false, altUrl = '', title, description, canonical,
  type = 'website', image = OG_IMAGE, imageSize = null, imageAlt = '',
  hreflangs = [], head = '', body, scripts = ''
}) {
  const root = '../'.repeat(depth);
  const isSr = lang === 'sr';
  const blogHref = isSr ? `${root}sr/blog/` : `${root}blog/`;
  const ogLocale = isSr ? 'sr_RS' : 'en_US';
  const ogLocaleAlt = isSr ? 'en_US' : 'sr_RS';
  const hreflangTags = hreflangs.map(h => `<link rel="alternate" hreflang="${h.lang}" href="${h.href}">`).join('\n  ');
  const imgMeta = [
    `<meta property="og:image" content="${image}">`,
    imageSize ? `<meta property="og:image:width" content="${imageSize.width}">` : '',
    imageSize ? `<meta property="og:image:height" content="${imageSize.height}">` : '',
    imageAlt ? `<meta property="og:image:alt" content="${esc(imageAlt)}">` : ''
  ].filter(Boolean).join('\n  ');

  const navLabels = isSr
    ? { about: 'O meni', skills: 'Vještine', ai: 'AI', exp: 'Iskustvo', edu: 'Obrazovanje', blog: 'Blog', contact: 'Kontakt', cta: 'Kontaktiraj me', cookies: 'Postavke kolačića', back: 'Nazad na početnu ↑' }
    : { about: 'About', skills: 'Skills', ai: 'AI', exp: 'Experience', edu: 'Education', blog: 'Blog', contact: 'Contact', cta: 'Get in touch', cookies: 'Cookie settings', back: 'Back to home ↑' };

  return `<!DOCTYPE html>
<html lang="${lang}" data-theme="dark"${staticLang ? ` data-static-lang="${lang}"` : ''}${altUrl ? ` data-alt-url="${esc(altUrl)}"` : ''}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  ${hreflangTags}
  <meta name="author" content="${AUTHOR}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#07090d">
  <meta property="og:site_name" content="${AUTHOR}">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="${ogLocale}">
  <meta property="og:locale:alternate" content="${ogLocaleAlt}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  ${imgMeta}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${image}">
  <link rel="alternate" type="application/rss+xml" title="${AUTHOR} — Blog" href="${SITE}/rss.xml">
  <link rel="alternate" type="text/markdown" title="${AUTHOR} — LLMs.txt" href="${SITE}/llms.txt">
  ${head}
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 13 13' shape-rendering='crispEdges'%3E%3Crect width='13' height='13' rx='3' fill='%2307090d'/%3E%3Cpath d='M10 3h1v1h-1zM9 4h2v1h-2zM2 5h1v1h-1zM8 5h2v1h-2zM2 6h2v1h-2zM7 6h2v1h-2zM3 7h2v1h-2zM6 7h2v1h-2zM4 8h3v1h-3zM5 9h1v1h-1z' fill='%2334d399'/%3E%3C/svg%3E">
  <link rel="preload" href="${root}assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${root}assets/fonts.css">
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
      <a href="${root}#top" data-i18n="nav_about">${navLabels.about}</a>
      <a href="${root}#skills" data-i18n="nav_skills">${navLabels.skills}</a>
      <a href="${root}#ai" data-i18n="nav_ai">${navLabels.ai}</a>
      <a href="${root}#experience" data-i18n="nav_exp">${navLabels.exp}</a>
      <a href="${root}#education" data-i18n="nav_edu">${navLabels.edu}</a>
      <a href="${blogHref}" class="active" data-i18n="nav_blog">${navLabels.blog}</a>
      <a href="${root}#contact" data-i18n="nav_contact">${navLabels.contact}</a>
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
    <a href="${root}#contact" data-i18n="contact_cta">${navLabels.cta}</a>
    <button type="button" data-consent data-i18n="cookies">${navLabels.cookies}</button>
    <a href="${root}" data-i18n="back_home">${navLabels.back}</a>
  </footer>
  <script src="${root}js/consent.js" data-ga="${GA_ID}"></script>
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
    reading_time_sr: p.body_sr ? MD.readingTime(p.body_sr) : MD.readingTime(p.body),
    word_count: wordCount(p.body),
    word_count_sr: p.body_sr ? wordCount(p.body_sr) : wordCount(p.body),
    updated_at: p.updated_at || p.published_at
  };
});
posts.sort((a, b) => `${b.published_at}T${b.published_time}`.localeCompare(`${a.published_at}T${a.published_time}`));

// clean previously generated post folders (EN and SR)
for (const entry of fs.readdirSync(rel('blog'), { withFileTypes: true })) {
  if (entry.isDirectory()) fs.rmSync(rel('blog', entry.name), { recursive: true, force: true });
}
if (fs.existsSync(rel('sr', 'blog'))) {
  fs.rmSync(rel('sr', 'blog'), { recursive: true, force: true });
}

const allTags = [...new Set(posts.flatMap(p => p.tags))].sort();
const markoImgSize = getImageSize(rel('assets/marko.jpg'));

/* ---------- EN list page ---------- */
const cardsEn = posts.map((p, i) => `
      <a class="post-card card glow${i === 0 ? ' featured' : ''}" href="${p.slug}/" data-search="${esc((p.title + ' ' + p.title_sr + ' ' + p.excerpt + ' ' + p.excerpt_sr + ' ' + p.tags.join(' ')).toLowerCase())}" data-tags="${esc(p.tags.join('|'))}" data-title-sr="${esc(p.title_sr)}" data-excerpt-sr="${esc(p.excerpt_sr)}">
        <div class="meta"><time datetime="${p.published_at}" data-fmt="short">${fmtShort(p.published_at, 'en')}</time><span>·</span><span>${p.reading_time} <span data-i18n="min_read">min read</span></span></div>
        <h2>${esc(p.title)}</h2>
        <p>${esc(p.excerpt)}</p>
        <div class="tags">${tagSpans(p.tags)}</div>
        <span class="more"><span data-i18n="read_post">Read post</span> ${clock}</span>
      </a>`).join('');

const listBodyEn = `
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
    <div class="post-grid" id="posts">${cardsEn || '<p class="state" data-i18n="no_posts">No posts yet — check back soon.</p>'}
    <p class="state" id="none" hidden data-i18n="no_match">No posts match your search.</p></div>
  </main>`;

write(rel('blog/index.html'), shell({
  depth: 1,
  lang: 'en',
  altUrl: '../sr/blog/',
  title: `Blog — ${AUTHOR}`,
  description: 'Notes on QA, test automation, mobile testing, testing AI models and building software, by Marko Lošić.',
  canonical: `${SITE}/blog/`,
  imageSize: markoImgSize,
  imageAlt: `${AUTHOR} — QA Engineer`,
  hreflangs: [
    { lang: 'en', href: `${SITE}/blog/` },
    { lang: 'sr', href: `${SITE}/sr/blog/` },
    { lang: 'x-default', href: `${SITE}/blog/` }
  ],
  head: jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${SITE}/blog/#blog`,
        name: `${AUTHOR} — Blog`,
        inLanguage: 'en',
        url: `${SITE}/blog/`,
        author: PERSON_REF,
        blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}/`, datePublished: p.published_at }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` }
        ]
      }
    ]
  }),
  body: listBodyEn,
  scripts: '<script src="blog.js"></script>'
}));

/* ---------- SR list page ---------- */
const srPosts = posts.filter(p => p.body_sr);
const cardsSr = srPosts.map((p, i) => `
      <a class="post-card card glow${i === 0 ? ' featured' : ''}" href="${p.slug}/" data-search="${esc((p.title_sr + ' ' + p.title + ' ' + p.excerpt_sr + ' ' + p.excerpt + ' ' + p.tags.join(' ')).toLowerCase())}" data-tags="${esc(p.tags.join('|'))}">
        <div class="meta"><time datetime="${p.published_at}" data-fmt="short">${fmtShort(p.published_at, 'sr')}</time><span>·</span><span>${p.reading_time_sr} min čitanja</span></div>
        <h2>${esc(p.title_sr)}</h2>
        <p>${esc(p.excerpt_sr)}</p>
        <div class="tags">${tagSpans(p.tags)}</div>
        <span class="more">Pročitaj članak ${clock}</span>
      </a>`).join('');

const listBodySr = `
  <main class="wrap blog-wrap">
    <section class="blog-hero">
      <span class="eyebrow">Blog</span>
      <h1 class="blog-title">Bilješke sa <span class="grad">testerske klupe</span>.</h1>
      <p class="lead">Pišem o QA-u, automatizaciji testiranja, mobilnom i AI testiranju, i o tome šta učim gradeći softver.</p>
    </section>
    <div class="blog-tools">
      <label class="search"><svg class="px" viewBox="0 0 9 9" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M1 0h4v1h-4zM0 1h1v1h-1zM5 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM0 3h1v1h-1zM5 3h1v1h-1zM0 4h1v1h-1zM5 4h1v1h-1zM1 5h4v1h-4zM5 6h2v1h-2zM6 7h2v1h-2zM7 8h2v1h-2z"/></svg><input id="q" type="search" placeholder="Pretraži članke…" aria-label="Pretraži članke" autocomplete="off"></label>
      <div class="tag-row" id="tags" aria-label="Filtriraj po tagu">${allTags.length ? ['', ...allTags].map(t => `<button type="button" class="tag${t ? '' : ' on'}" data-t="${esc(t)}">${t ? esc(t) : 'Sve'}</button>`).join('') : ''}</div>
    </div>
    <div class="post-grid" id="posts">${cardsSr || '<p class="state">Još nema članaka — svratite uskoro.</p>'}
    <p class="state" id="none" hidden>Nijedan članak ne odgovara pretrazi.</p></div>
  </main>`;

write(rel('sr/blog/index.html'), shell({
  depth: 2,
  lang: 'sr',
  staticLang: true,
  altUrl: '../../blog/',
  title: `Blog — ${AUTHOR}`,
  description: 'Tekstovi o QA-u, automatizaciji testiranja, mobilnom i AI testiranju i razvoju softvera — Marko Lošić.',
  canonical: `${SITE}/sr/blog/`,
  imageSize: markoImgSize,
  imageAlt: `${AUTHOR} — QA inženjer`,
  hreflangs: [
    { lang: 'en', href: `${SITE}/blog/` },
    { lang: 'sr', href: `${SITE}/sr/blog/` },
    { lang: 'x-default', href: `${SITE}/blog/` }
  ],
  head: jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${SITE}/sr/blog/#blog`,
        name: `${AUTHOR} — Blog`,
        inLanguage: 'sr',
        url: `${SITE}/sr/blog/`,
        author: PERSON_REF,
        blogPost: srPosts.map(p => ({ '@type': 'BlogPosting', headline: p.title_sr, url: `${SITE}/sr/blog/${p.slug}/`, datePublished: p.published_at }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Početna', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/sr/blog/` }
        ]
      }
    ]
  }),
  body: listBodySr,
  scripts: '<script src="../../blog/blog.js"></script>'
}));

/* ---------- post pages (EN + SR) ---------- */
for (const p of posts) {
  const urlEn = `${SITE}/blog/${p.slug}/`;
  const urlSr = `${SITE}/sr/blog/${p.slug}/`;
  const hasSr = Boolean(p.body_sr);

  const htmlEn = enhanceImages(MD.render(p.body, '../../'));
  const htmlSrInEn = hasSr ? enhanceImages(MD.render(p.body_sr, '../../')) : null;
  const htmlSrPage = hasSr ? enhanceImages(MD.render(p.body_sr, '../../../')) : null;

  const firstImg = p.image || (htmlEn.match(/<img[^>]*src="([^"]+)"/) || [])[1];
  const imgRel = firstImg ? firstImg.replace(/^(\.\.\/)+/, '').replace(/^\/+/, '') : null;
  const image = firstImg ? (/^https?:/.test(firstImg) ? firstImg : `${SITE}/${imgRel}`) : OG_IMAGE;
  const imageSize = imgRel && !/^https?:/.test(firstImg) ? getImageSize(rel(imgRel)) : markoImgSize;
  const primarySection = p.tags.find(t => t !== 'qa') || p.tags[0] || 'qa';
  const more = relatedPosts(p, posts, 3);

  const hreflangs = hasSr
    ? [
        { lang: 'en', href: urlEn },
        { lang: 'sr', href: urlSr },
        { lang: 'x-default', href: urlEn }
      ]
    : [];

  /* EN post page */
  const moreCardEn = o => `
      <a class="post-card card glow" href="../${o.slug}/" data-title-sr="${esc(o.title_sr)}" data-excerpt-sr="${esc(o.excerpt_sr)}"><div class="meta"><time datetime="${o.published_at}" data-fmt="short">${fmtShort(o.published_at, 'en')}</time><span>·</span><span>${o.reading_time} <span data-i18n="min_read">min read</span></span></div><h3>${esc(o.title)}</h3><p>${esc(o.excerpt)}</p></a>`;

  const bodyEn = `
  <main class="wrap post-wrap">
    <a class="back" href="../">${back} <span data-i18n="all_posts">All posts</span></a>
    <article>
      <header class="post-head">
        <div class="meta"><time datetime="${p.published_at}" data-fmt="long">${fmtLong(p.published_at, 'en')}</time><span>·</span><span>${p.reading_time} <span data-i18n="min_read">min read</span></span></div>
        <h1 data-title-sr="${esc(p.title_sr)}">${esc(p.title)}</h1>
        ${p.excerpt ? `<p class="lead" data-excerpt-sr="${esc(p.excerpt_sr)}">${esc(p.excerpt)}</p>` : ''}
        <div class="tags">${tagSpans(p.tags)}</div>
      </header>
      <div class="prose">${htmlEn}</div>
      ${htmlSrInEn ? `<template id="prose-sr">${htmlSrInEn}</template>` : ''}
    </article>
    <div class="post-end">
      <button class="btn ghost" id="share" type="button" data-i18n="copy_link">Copy link</button>
      <a class="btn primary" href="../../#contact" data-i18n="contact_cta">Get in touch</a>
    </div>
    ${more.length ? `<section class="more-posts"><h2 data-i18n="more_posts">Related posts</h2><div class="post-grid">${more.map(moreCardEn).join('')}</div></section>` : ''}
  </main>`;

  const enPageTitle = `${p.seo_title || p.title} — ${AUTHOR}`;
  write(rel('blog', p.slug, 'index.html'), shell({
    depth: 2,
    lang: 'en',
    altUrl: hasSr ? `../../sr/blog/${p.slug}/` : '',
    title: enPageTitle,
    description: clip(p.excerpt, 160),
    canonical: urlEn,
    type: 'article',
    image,
    imageSize,
    imageAlt: p.title,
    hreflangs,
    head: jsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          '@id': `${urlEn}#article`,
          headline: p.title,
          description: p.excerpt,
          image,
          url: urlEn,
          inLanguage: 'en',
          wordCount: p.word_count,
          articleSection: primarySection,
          mainEntityOfPage: { '@type': 'WebPage', '@id': urlEn },
          datePublished: iso(`${p.published_at}T${p.published_time}:00Z`),
          dateModified: iso(`${p.updated_at}T${p.published_time}:00Z`),
          keywords: p.tags.join(', '),
          author: PERSON_REF,
          publisher: PERSON_REF
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
            { '@type': 'ListItem', position: 3, name: p.title, item: urlEn }
          ]
        }
      ]
    }) + `\n  <meta property="article:published_time" content="${iso(`${p.published_at}T${p.published_time}:00Z`)}">\n  <meta property="article:modified_time" content="${iso(`${p.updated_at}T${p.published_time}:00Z`)}">`,
    body: bodyEn,
    scripts: '<script src="../post.js"></script>'
  }));

  /* SR post page */
  if (hasSr) {
    const moreSr = more.filter(o => o.body_sr);
    const moreCardSr = o => `
      <a class="post-card card glow" href="../${o.slug}/"><div class="meta"><time datetime="${o.published_at}" data-fmt="short">${fmtShort(o.published_at, 'sr')}</time><span>·</span><span>${o.reading_time_sr} min čitanja</span></div><h3>${esc(o.title_sr)}</h3><p>${esc(o.excerpt_sr)}</p></a>`;

    const bodySr = `
  <main class="wrap post-wrap">
    <a class="back" href="../">${back} <span>Svi članci</span></a>
    <article>
      <header class="post-head">
        <div class="meta"><time datetime="${p.published_at}" data-fmt="long">${fmtLong(p.published_at, 'sr')}</time><span>·</span><span>${p.reading_time_sr} min čitanja</span></div>
        <h1>${esc(p.title_sr)}</h1>
        ${p.excerpt_sr ? `<p class="lead">${esc(p.excerpt_sr)}</p>` : ''}
        <div class="tags">${tagSpans(p.tags)}</div>
      </header>
      <div class="prose">${htmlSrPage}</div>
    </article>
    <div class="post-end">
      <button class="btn ghost" id="share" type="button">Kopiraj link</button>
      <a class="btn primary" href="../../../#contact">Kontaktiraj me</a>
    </div>
    ${moreSr.length ? `<section class="more-posts"><h2>Slični članci</h2><div class="post-grid">${moreSr.map(moreCardSr).join('')}</div></section>` : ''}
  </main>`;

    const srPageTitle = `${p.seo_title_sr || p.title_sr} — ${AUTHOR}`;
    write(rel('sr', 'blog', p.slug, 'index.html'), shell({
      depth: 3,
      lang: 'sr',
      staticLang: true,
      altUrl: `../../../blog/${p.slug}/`,
      title: srPageTitle,
      description: clip(p.excerpt_sr, 160),
      canonical: urlSr,
      type: 'article',
      image,
      imageSize,
      imageAlt: p.title_sr,
      hreflangs,
      head: jsonLd({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            '@id': `${urlSr}#article`,
            headline: p.title_sr,
            description: p.excerpt_sr,
            image,
            url: urlSr,
            inLanguage: 'sr',
            wordCount: p.word_count_sr,
            articleSection: primarySection,
            mainEntityOfPage: { '@type': 'WebPage', '@id': urlSr },
            datePublished: iso(`${p.published_at}T${p.published_time}:00Z`),
            dateModified: iso(`${p.updated_at}T${p.published_time}:00Z`),
            keywords: p.tags.join(', '),
            author: PERSON_REF,
            publisher: PERSON_REF
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Početna', item: `${SITE}/` },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/sr/blog/` },
              { '@type': 'ListItem', position: 3, name: p.title_sr, item: urlSr }
            ]
          }
        ]
      }) + `\n  <meta property="article:published_time" content="${iso(`${p.published_at}T${p.published_time}:00Z`)}">\n  <meta property="article:modified_time" content="${iso(`${p.updated_at}T${p.published_time}:00Z`)}">`,
      body: bodySr,
      scripts: '<script src="../../../blog/post.js"></script>'
    }));
  }
}

/* ---------- posts.json (home page + client use) ---------- */
write(rel('blog/posts.json'), JSON.stringify(posts.map(({ slug, title, title_sr, excerpt, excerpt_sr, tags, published_at, reading_time }) => ({ slug, title, titleSr: title_sr, excerpt, excerptSr: excerpt_sr, tags, date: published_at, readingTime: reading_time })), null, 2));

/* ---------- home page: 3 latest posts (h3 under h2 section heading) ---------- */
{
  const home = fs.readFileSync(rel('index.html'), 'utf8');
  const start = '<!-- LATEST:START -->', end = '<!-- LATEST:END -->';
  const i = home.indexOf(start), j = home.indexOf(end);
  if (i < 0 || j < i) throw new Error('index.html: LATEST markers not found');
  const latest = posts.slice(0, 3).map(p => `
        <a class="post-card card glow reveal in" href="blog/${p.slug}/">
            <div class="meta"><span>${fmtShort(p.published_at, 'en')}</span><span>·</span><span>${p.reading_time} min read</span></div>
            <h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p>
            <div class="tags">${tagSpans(p.tags)}</div></a>`).join('');
  let out = home.slice(0, i + start.length) + latest + '\n      ' + home.slice(j);
  out = out.replace(/<section id="blog" class="wrap section"( hidden)?>/, `<section id="blog" class="wrap section"${posts.length ? '' : ' hidden'}>`);
  write(rel('index.html'), out);
}

/* ---------- llms.txt & llms-full.txt (GEO / AI crawlers) ---------- */
{
  const latestTen = posts.slice(0, 10);
  const llmsTxt = `# ${AUTHOR}

> QA Engineer based in Banja Luka, Bosnia and Herzegovina, with 6+ years in manual and automated testing of web apps, mobile apps and browser extensions. Currently QA Engineer at Bravo System (Playwright with C#, Maestro, LLM testing); previously QA Engineer & Oracle APEX Developer at Krajina Klas (Cypress).

Highlights: working in a QA team, cut regression testing on a link-in-bio platform from a full day to about 30 minutes with a suite of 100 automated Playwright tests; early local testing means a regression run now surfaces only 1–2 bugs, and two critical bugs were stopped before production; tests a local LLM (Llama 3) for product analytics with 100 hand-written prompts, reaching 97%+ answer accuracy after prompt-template fixes. Domains: SaaS creator platforms, e-commerce and product analytics. Languages: Serbian (native), English (C1). Open to remote.

Contact: markolosic1993@gmail.com

## CV

- [CV (plain text)](${SITE}/cv.txt): full CV in clean text, same content as the website and PDF
- [CV (PDF)](${SITE}/assets/Marko-Losic-CV.pdf): one-page A4 CV

## Profiles & Case Studies

- [Website](${SITE}/): portfolio, skills and experience
- [How I ship reliable software](${SITE}/pipeline/): interactive walkthrough of the QA pipeline (Playwright with C# in Docker on every PR, Maestro, quality gate)
- [Testing local LLMs](${SITE}/llm-testing/): case study of manually testing a locally hosted Llama 3 model for product analytics: 100 expert prompts, every answer graded in a validation table for correctness, consistency and safety; the table now serves as the regression set after every model or prompt change
- [PetLink on Google Play](https://play.google.com/store/apps/details?id=com.markolosic.petlink): personal project, a free Android pet care app (health record, vaccine reminders, lost-pet alerts with a live map, NFC collar, adoption, AI chat on DeepSeek); my idea and testing, code generated with Gemini and Claude reviewing each other; React Native + Supabase. Story: ${SITE}/blog/petlink-pet-care-app/
- [učiteljskidnevnik.online](https://učiteljskidnevnik.online/): personal project, a portal that helps teachers, parents and children with the primary school curriculum in Bosnia and Herzegovina: 1,436 daily lesson plans for grades 1–5 (Republika Srpska and FBiH curricula), three-level differentiated tasks, printable worksheets and educational games
- [LinkedIn](https://www.linkedin.com/in/markološić/)
- [GitHub](https://github.com/MarkoLosic)

## Blog (${posts.length} articles in English and Serbian)

- [Blog (English)](${SITE}/blog/): ${posts.length} articles on QA, test automation, mobile and AI testing
- [Blog (Serbian)](${SITE}/sr/blog/): ${srPosts.length} articles in Serbian
- [Full article index for LLMs](${SITE}/llms-full.txt): complete catalog with summaries and tags
- [RSS](${SITE}/rss.xml)

### Latest Articles

${latestTen.map(p => `- [${p.title}](${SITE}/blog/${p.slug}/): ${p.excerpt}`).join('\n')}
`;
  write(rel('llms.txt'), llmsTxt);

  const llmsFull = `# ${AUTHOR} — Complete Site & Blog Index

> QA Engineer in Banja Luka, Bosnia and Herzegovina (6+ years). Playwright (C#), Maestro, Cypress, Docker, GitHub Actions, Jenkins, LLM testing, Oracle APEX / SQL.

- Portfolio: ${SITE}/
- CV (text): ${SITE}/cv.txt
- Case Study — QA Pipeline: ${SITE}/pipeline/
- Case Study — Testing Local LLMs: ${SITE}/llm-testing/
- Project — PetLink (Android app on Google Play): https://play.google.com/store/apps/details?id=com.markolosic.petlink
- Project — učiteljskidnevnik.online (portal for class teachers, grades 1–5, BiH): https://učiteljskidnevnik.online/
- Blog (EN): ${SITE}/blog/
- Blog (SR): ${SITE}/sr/blog/
- RSS: ${SITE}/rss.xml

## All Blog Articles (${posts.length})

${posts.map(p => `### ${p.title}
- URL (EN): ${SITE}/blog/${p.slug}/${p.body_sr ? `\n- URL (SR): ${SITE}/sr/blog/${p.slug}/` : ''}
- Date: ${p.published_at}
- Tags: ${p.tags.join(', ')}
- Summary: ${p.excerpt}`).join('\n\n')}
`;
  write(rel('llms-full.txt'), llmsFull);
}

/* ---------- sitemap, rss, robots ---------- */
const latestDate = posts[0] ? String(posts[0].updated_at).slice(0, 10) : undefined;
const urls = [
  { loc: `${SITE}/`, lastmod: latestDate },
  { loc: `${SITE}/blog/`, lastmod: latestDate },
  { loc: `${SITE}/sr/blog/`, lastmod: latestDate },
  { loc: `${SITE}/pipeline/`, lastmod: fileLastMod('pipeline/index.html') || latestDate },
  { loc: `${SITE}/llm-testing/`, lastmod: fileLastMod('llm-testing/index.html') || latestDate },
  ...posts.map(p => ({ loc: `${SITE}/blog/${p.slug}/`, lastmod: String(p.updated_at).slice(0, 10) })),
  ...srPosts.map(p => ({ loc: `${SITE}/sr/blog/${p.slug}/`, lastmod: String(p.updated_at).slice(0, 10) }))
];
write(rel('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
write(rel('rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n<title>${AUTHOR} — Blog</title><link>${SITE}/blog/</link><atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/><description>Notes on QA, test automation, mobile and AI testing.</description><language>en</language>\n${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}/</link><guid>${SITE}/blog/${p.slug}/</guid><pubDate>${new Date(`${p.published_at}T${p.published_time}:00Z`).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`).join('\n')}\n</channel></rss>\n`);
write(rel('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Built ${posts.length} EN + ${srPosts.length} SR post(s) for ${SITE}`);
