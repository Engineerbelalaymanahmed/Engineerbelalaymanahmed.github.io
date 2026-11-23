// Static prerender: injects crawlable HTML into the generated per-page shells.
// app.js replaces #hdr/#main/#ftr content on load, so JS users see the live app
// unchanged; crawlers and no-JS users get the same text content server-side.
// Run from repo root AFTER scripts/generate-pages.sh: node scripts/prerender.mjs
import {readFileSync, writeFileSync} from 'fs';

const J = f => JSON.parse(readFileSync(f, 'utf8'));
const P = J('data/profile.json'), S = J('data/social-links.json'), I = J('data/i18n.json'),
      SV = J('data/services.json'), SK = J('data/skills.json'), PK = J('data/packages.json'),
      TM = J('data/terms.json'), PR = J('data/projects.json'), CF = J('data/certificates.json');
const SITE = J('data/site.json').siteUrl;
const lang = 'en', ui = k => I[lang][k] ?? I.en[k] ?? k, t = v => v && typeof v === 'object' ? v[lang] ?? v.en ?? '' : v ?? '';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = n => Number(n).toLocaleString('en-US');
const NAV = ['home', 'services', 'information', 'portfolio', 'certifications', 'social', 'contact'];

const socialsHtml = () => `<ul class="soc">${S.filter(s => s.featured).map(s =>
  `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span class="sr">${esc(s.platform)}</span><span class="mono" aria-hidden="true">${esc(s.icon)}</span></a></li>`).join('')}</ul>`;
const logoHtml = () => `<div class="plate"><img src="{R}assets/branding/logo-900.webp" alt="${esc(t(P.professionalName))} logo" width="900" height="600" loading="lazy" decoding="async"></div>`;

const headerHtml = page => `<div class="wrap bar"><a class="brand" href="{R}">${esc(t(P.professionalName))}</a><nav aria-label="Main">${NAV.map(p =>
  `<a href="{R}${p === 'home' ? '' : p + '/'}"${p === page ? ' aria-current="page"' : ''}>${esc(ui(p))}</a>`).join('')}</nav><button id="lt" class="btn sm" lang="ar">العربية</button></div>`;

const footerHtml = () => `<div class="wrap foot">${logoHtml()}<div><strong>${esc(t(P.professionalName))}</strong><p class="mut small">${esc(t(P.bio.short))}</p><p class="mut small">© ${new Date().getFullYear()} ${esc(t(P.name))}. ${esc(ui('rights'))}.</p></div><nav aria-label="Footer">${NAV.map(p =>
  `<a href="{R}${p === 'home' ? '' : p + '/'}">${esc(ui(p))}</a>`).join('')}</nav><div>${socialsHtml()}<p class="small"><a href="mailto:${esc(P.contact.professional.email)}" dir="ltr">${esc(P.contact.professional.email)}</a></p></div></div>`;

const sec = (title, body, cls = '') => `<section class="sec rv in${cls ? ' ' + cls : ''}"><div class="wrap">${title ? `<h2>${esc(title)}</h2>` : ''}${body}</div></section>`;
const head = x => `<section class="phead"><div class="wrap"><h1>${esc(x)}</h1></div></section>`;
const cta = () => sec(ui('ctaTitle'), `<div class="cta"><a class="btn p" href="{R}contact/">${esc(ui('contactCta'))}</a><a class="btn" href="{R}social/">${esc(ui('social'))}</a></div>`, 'center');
const svGrid = () => `<div class="grid">${SV.map(s => `<article class="card"><h3>${esc(t(s.title))}</h3><p class="mut">${esc(t(s.text))}</p></article>`).join('')}</div>`;
const skGrid = () => `<div class="grid">${SK.map(g => `<div class="card"><h3>${esc(t(g.group))}</h3><ul class="tags">${g.items.map(x => `<li class="tag">${esc(t(x))}</li>`).join('')}</ul></div>`).join('')}</div>`;
const chips = a => `<ul class="tags">${a.map(x => `<li class="tag">${esc(t(x))}</li>`).join('')}</ul>`;

const pkCard = p => {
  const f = p.features[lang] || p.features.en || [],
        wa = 'https://wa.me/201026531399?text=' + encodeURIComponent('Hello, I am interested in the ' + t(p.name) + '.');
  return `<article class="card pk">${p.image ? `<a href="{R}${esc(p.image)}" target="_blank" rel="noopener noreferrer" class="pk-img"><img src="{R}${esc(p.image)}" alt="${esc(t(p.name))}" loading="lazy" decoding="async"></a>` : ''}<h3>${esc(t(p.name))}</h3><p class="price">${num(p.price)} ${esc(ui('egp'))}</p><p class="bill mut small">${esc(ui(p.billing))}</p><ul class="feat">${f.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${p.adBudget ? `<p class="small mut">${esc(ui('adBudget'))}: ${num(p.adBudget)} ${esc(ui('egp'))}${p.adBudgetPeriod === 'monthly' ? ' ' + esc(ui('monthly')) : ''}</p>` : ''}${p.estReach ? `<p class="small mut">${esc(ui('estReach'))}: ${p.estReach.map(num).join(' - ')} · ${esc(ui('estImpr'))}: ${p.estImpr.map(num).join(' - ')}</p>` : ''}${p.outcome ? `<p class="small mut">${esc(ui('outcomeLbl'))}: ${esc(t(p.outcome))}</p>` : ''}${p.audience ? `<p class="small mut">${esc(ui('audienceLbl'))}: ${esc(t(p.audience))}</p>` : ''}<a class="btn sm" href="${wa}" target="_blank" rel="noopener noreferrer">${esc(ui('orderWhats'))}</a></article>`;
};
const pkGroup = (g, tk, ik, nk) => `<div class="pkgroup"><h3 class="mt">${esc(ui(tk))}</h3><p class="mut">${esc(ui(ik))}</p><p class="small mut">${esc(ui(nk))}</p><div class="grid">${PK.filter(p => p.group === g).map(pkCard).join('')}</div></div>`;
const tmBlk = g => TM[g] ? `<div class="card"><h3>${esc(ui(g === 'foundation' ? 'pkFndTitle' : 'pkOpsTitle'))}</h3><ul class="feat">${(TM[g][lang] || TM[g].en || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';

const pages = {
  home: () => [
    `<section class="hero"><div class="wrap"><div><p class="gold">${esc(t(P.bio.short))}</p><h1>${esc(t(P.tagline)[0])}<br>${esc(t(P.tagline)[1])}</h1><p class="lead">${esc(t(P.bio.medium))}</p><div class="cta"><a class="btn p" href="{R}contact/">${esc(ui('contactCta'))}</a><a class="btn" href="{R}portfolio/">${esc(ui('portfolio'))}</a></div>${socialsHtml()}</div><div class="portrait"><img src="{R}assets/profile/profile-800.webp" alt="${esc(t(P.professionalName))}" width="800" height="800" loading="eager" fetchpriority="high">${chips(['p1', 'p2', 'p3'].map(ui))}</div></div></section>`,
    sec(ui('who'), `<div class="two"><p class="big">${esc(t(P.bio.long))}</p>${logoHtml()}</div>`),
    sec(ui('do'), svGrid(), 'paper'),
    sec(ui('build'), PR.filter(p => p.featured).length ? `<div class="grid">${PR.filter(p => p.featured).map(p => `<a class="card" href="{R}portfolio/?p=${encodeURIComponent(p.slug)}">${p.thumbnail ? `<img src="{R}${esc(p.thumbnail)}" alt="${esc(t(p.title))}" loading="lazy" decoding="async">` : ''}<h3>${esc(t(p.title))}</h3><p class="mut">${esc(t(p.shortDescription))}</p></a>`).join('')}</div>` : `<p class="empty">${esc(ui('soon'))}</p>`),
    sec(ui('learn'), skGrid(), 'paper'),
    sec(ui('going'), `<div><p class="big">${esc(t(P.journeyStatement))}</p><div class="cta mt"><a class="btn p" href="{R}information/">${esc(ui('information'))}</a><a class="btn" href="{R}social/">${esc(ui('social'))}</a></div></div>`)
  ],
  services: () => [
    head(ui('services')),
    sec(null, svGrid()),
    sec(ui('packages'), `<div>${pkGroup('foundation', 'pkFndTitle', 'pkFndIntro', 'pkFndNote')}${pkGroup('operations', 'pkOpsTitle', 'pkOpsIntro', 'pkOpsNote')}<p class="small mut mt">${esc(ui('estNote'))}</p></div>`),
    sec(ui('termsTitle'), `<div class="two">${tmBlk('foundation')}${tmBlk('operations')}</div>`)
  ],
  information: () => [
    head(ui('information')),
    sec(ui('about'), `<div class="two"><div class="portrait" style="max-width:300px;margin:auto"><img src="{R}assets/profile/4-about-800.webp" alt="${esc(P.fullNameAr || t(P.professionalName))}" width="800" height="800" loading="eager"></div><div><p class="gold">${esc(P.fullNameAr || '')}</p><p class="big">${esc(t(P.bio.long))}</p><p class="mt"><strong>${esc(ui('birthdate'))}: </strong>${esc(t(P.birthDate))}</p></div></div>`),
    sec(ui('skills'), skGrid(), 'paper'),
    sec(ui('services'), svGrid())
  ],
  portfolio: () => [
    head(ui('portfolio')),
    sec(null, PR.length ? `<div class="grid">${PR.map(p => `<a class="card" href="{R}portfolio/?p=${encodeURIComponent(p.slug)}">${p.thumbnail ? `<img src="{R}${esc(p.thumbnail)}" alt="${esc(t(p.title))}" loading="lazy" decoding="async">` : ''}<h3>${esc(t(p.title))}</h3><p class="mut">${esc(t(p.shortDescription))}</p></a>`).join('')}</div>` : `<p class="empty">${esc(ui('soon'))}</p>`)
  ],
  certifications: () => [
    head(ui('certifications')),
    sec(null, CF.length ? `<div class="grid">${CF.map(c => `<article class="card">${c.image ? `<img src="{R}${esc(c.image)}" alt="${esc(t(c.title))}" loading="lazy" decoding="async">` : ''}<h3>${esc(t(c.title))}</h3><p class="mut small">${[c.issuer, c.date].filter(Boolean).map(esc).join(' · ')}</p></article>`).join('')}</div>` : `<p class="empty">${esc(ui('emptyCerts'))}</p>`)
  ],
  social: () => {
    const order = ['Professional', 'Personal', 'Technical', 'Content', 'Communication'], g = {};
    S.forEach(s => (g[s.type === 'personal' ? 'Personal' : s.category] ??= []).push(s));
    return [head(ui('social')), ...[...order, ...Object.keys(g).filter(k => !order.includes(k))].filter(k => g[k]).map(k =>
      sec(ui(k.toLowerCase()), `<div class="grid">${g[k].map(s => `<a class="card soc-card" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span class="mono" aria-hidden="true">${esc(s.icon)}</span><strong>${esc(s.platform)}</strong><span class="mut" dir="ltr">${esc(s.username)}</span>${s.description ? `<span class="small">${esc(t(s.description))}</span>` : ''}</a>`).join('')}</div>`, k === 'Personal' ? 'paper' : ''))];
  },
  contact: () => {
    const c = P.contact, row = (l, v, href) => `<li class="row"><span class="lab">${esc(ui(l))}</span><a href="${href}" dir="ltr">${esc(v)}</a></li>`,
      pRow = (l, v) => `<li class="row"><span class="lab">${esc(ui(l))}</span><span dir="ltr">${esc(v)}</span></li>`;
    return [
      head(ui('contact')),
      sec(null, `<div class="two"><div class="card pro"><h2 class="h3">${esc(ui('professional'))}</h2><ul class="rows">${row('email', c.professional.email, 'mailto:' + c.professional.email)}${row('phone', c.professional.phone, 'tel:' + c.professional.whatsapp.replace(/\s/g, ''))}${row('whatsapp', c.professional.whatsapp, c.professional.whatsappUrl)}${c.professional.telegram ? row('telegram', c.professional.telegram, 'https://t.me/' + c.professional.telegram.slice(1)) : ''}</ul></div>${c.payment ? `<div class="card pay"><h2 class="h3">${esc(ui('paymentMethods'))}</h2><ul class="rows">${c.payment.vodafoneCash ? pRow('vodafoneCash', c.payment.vodafoneCash) : ''}${c.payment.instapay ? pRow('instapay', c.payment.instapay) : ''}</ul></div>` : ''}</div>`),
      sec(ui('social'), `<div>${socialsHtml()}<p class="mt"><a class="btn" href="{R}social/">${esc(ui('social'))}</a></p></div>`)
    ];
  }
};

for (const page of NAV) {
  const file = page === 'home' ? 'index.html' : `${page}/index.html`;
  let html = readFileSync(file, 'utf8');
  const root = page === 'home' ? './' : '../';
  const fill = s => s.replaceAll('{R}', root);
  const parts = [...pages[page]().filter(Boolean), ...(page === 'contact' ? [] : [cta()])].map(fill);
  html = html
    .replace('<header id="hdr"></header>', `<header id="hdr">${fill(headerHtml(page))}</header>`)
    .replace(/<main id="main" tabindex="-1">[\s\S]*?<\/main>/, `<main id="main" tabindex="-1">${parts.join('')}</main>`)
    .replace('<footer id="ftr"></footer>', `<footer id="ftr">${fill(footerHtml())}</footer>`);
  writeFileSync(file, html);
  console.log(`prerendered ${file}`);
}
