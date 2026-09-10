/**
 * Builds a standalone, self-contained preview of the promo reel.
 *
 * Not part of the app or its build — it exists so the reel can be reviewed on
 * its own (and shared) without running the dev server. It reads the real
 * `PromoReel.css` so the preview cannot drift from the component, and inlines
 * the three logo frames as data URIs so the page needs no network at all.
 *
 *   node src/components/promo/build-preview.cjs [outfile]
 */
const fs = require('fs');
const path = require('path');

const here = __dirname;
const publicPromo = path.resolve(here, '../../../public/promo');
const out = process.argv[2] || path.join(here, 'preview.html');

const css = fs.readFileSync(path.join(here, 'PromoReel.css'), 'utf8');
const b64 = (n) =>
  'data:image/png;base64,' + fs.readFileSync(path.join(publicPromo, n)).toString('base64');

const icon = b64('icon.png');
const wordmark = b64('wordmark.png');
const lockup = b64('lockup.png');

const COPY = {
  ar: {
    dir: 'rtl',
    tagline: 'نحو غدٍ أكثر استدامة',
    sub: 'نبني اليوم لبيئة وأجيال المستقبل',
    closing: 'Building a Sustainable Tomorrow',
    play: 'تشغيل المقطع',
    pillars: [
      ['٠١', 'القياس', 'سجّل مؤسستك واحسب نسبة المحتوى المحلي فيها.'],
      ['٠٢', 'التحقّق', 'ارفع المستندات واحصل على درجة استدامة مدقّقة.'],
      ['٠٣', 'النمو', 'افتح أبواب التمويل ومزايا الشركاء وفرص التوريد.']
    ]
  },
  en: {
    dir: 'ltr',
    tagline: 'Toward a more sustainable tomorrow',
    sub: 'Building today for the environment and generations ahead',
    closing: 'Building a Sustainable Tomorrow',
    play: 'Play the reel',
    pillars: [
      ['01', 'Measure', 'Register your enterprise and calculate its In-Country Value.'],
      ['02', 'Verify', 'Submit documents and earn an audited sustainability score.'],
      ['03', 'Grow', 'Unlock financing, partner benefits and procurement opportunities.']
    ]
  }
};

const PARTICLES = [
  [6, '20%', '14%', 'var(--promo-accent)', '0.4s'],
  [5, '70%', '80%', 'var(--promo-navy)', '1.3s'],
  [4, '36%', '86%', 'var(--promo-accent)', '2.1s'],
  [5, '78%', '20%', 'var(--promo-navy)', '0.8s']
];

const reel = (lang) => {
  const c = COPY[lang];
  return `
<div class="reel" dir="${c.dir}">
  <div class="promo-stage" data-playing="true">
    <div class="promo-glow"></div>
    <div class="promo-streak"></div>
    ${PARTICLES.map(
      ([s, top, left, bg, delay]) =>
        `<span class="promo-particle" style="width:${s}px;height:${s}px;top:${top};left:${left};background:${bg};animation-delay:${delay}"></span>`
    ).join('\n    ')}

    <div class="promo-scene promo-scene-reveal">
      <div class="lockup-row" dir="ltr">
        <img class="promo-wordmark" src="${wordmark}" alt="">
        <img class="promo-icon" src="${icon}" alt="">
      </div>
    </div>

    <div class="promo-scene promo-scene-tagline">
      <h3>${c.tagline}</h3>
      <p>${c.sub}</p>
    </div>

    <div class="promo-scene promo-scene-pillars">
      <div class="pillar-row">
        ${c.pillars
          .map(
            ([badge, title, body]) => `<div class="promo-pillar">
          <span class="badge">${badge}</span>
          <h4>${title}</h4>
          <p>${body}</p>
        </div>`
          )
          .join('\n        ')}
      </div>
    </div>

    <div class="promo-scene promo-scene-closing">
      <img class="lockup" src="${lockup}" alt="">
      <span class="sub">${c.closing}</span>
    </div>

    <div class="promo-flare"></div>
    <span class="base-band"></span>
    <div class="ticks">
      <span class="promo-tick"></span><span class="promo-tick"></span>
      <span class="promo-tick"></span><span class="promo-tick"></span>
    </div>
  </div>
  <p class="cap">${c.dir.toUpperCase()} — ${lang === 'ar' ? 'العربية' : 'English'}</p>
</div>`;
};

const html = `<title>Istedama Promo Reel</title>
<style>
:root{ --bg:#F8FAFC; --fg:#0F172A; --muted:#64748B; --rule:#E2E8F0; --card:#fff; }
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){ --bg:#0B1220; --fg:#E6EDF7; --muted:#93A4BE; --rule:#22304A; --card:#111B2E; }
}
:root[data-theme="dark"]{ --bg:#0B1220; --fg:#E6EDF7; --muted:#93A4BE; --rule:#22304A; --card:#111B2E; }
body{
  background:var(--bg); color:var(--fg); margin:0; padding:32px 20px 56px;
  font-family:'Tajawal',system-ui,-apple-system,'Segoe UI',sans-serif;
}
.wrap{ max-width:900px; margin:0 auto; }
h1{ font-size:1.5rem; font-weight:800; margin:0 0 6px; letter-spacing:-0.01em; }
.lede{ color:var(--muted); font-size:.95rem; margin:0 0 28px; line-height:1.6; }
.reel{ margin:0 0 34px; }
.cap{ color:var(--muted); font-size:.78rem; margin:10px 2px 0; letter-spacing:.04em; }

/* the component stylesheet, verbatim */
${css}

/* preview-only shell: mirrors the Tailwind utilities the component applies */
.promo-stage{
  position:relative; width:100%; aspect-ratio:16/9;
  border:1px solid var(--rule); border-radius:1.5rem; overflow:hidden;
  box-shadow:0 4px 14px -6px rgba(15,50,96,.10), 0 2px 5px -2px rgba(15,50,96,.05);
}
.promo-scene{ padding:0 6%; }
.lockup-row{ display:flex; flex-direction:row-reverse; align-items:center; gap:3%; }
.promo-wordmark{ height:15%; max-height:80px; width:auto; object-fit:contain; }
.promo-icon{ height:24%; max-height:128px; width:auto; object-fit:contain;
  filter:drop-shadow(0 16px 30px rgba(15,50,96,.28)); }
.promo-scene-tagline h3{
  font-size:clamp(1.1rem,4vw,2.75rem); font-weight:900; line-height:1.15;
  color:#0F172A; margin:0; }
.promo-scene-tagline p{
  font-size:clamp(.7rem,1.6vw,1.125rem); font-weight:500; color:rgba(15,50,96,.85); margin:0; }
.pillar-row{ display:flex; width:80%; align-items:stretch; justify-content:center; gap:2.5%; }
.promo-pillar{
  flex:1; display:flex; flex-direction:column; align-items:center; gap:6%;
  padding:5% 4%; border-radius:1.25rem; border:1px solid rgba(255,255,255,.85);
  background:rgba(255,255,255,.6); backdrop-filter:blur(12px);
  box-shadow:0 18px 40px rgba(15,50,96,.14); }
.promo-pillar .badge{
  display:flex; align-items:center; justify-content:center;
  width:clamp(1.4rem,3.4vw,2.75rem); height:clamp(1.4rem,3.4vw,2.75rem);
  border-radius:.75rem; background:#EEF3FA; color:#0F3260;
  font-weight:900; font-size:clamp(.6rem,1.5vw,1.05rem); }
.promo-pillar h4{ margin:0; font-size:clamp(.6rem,1.5vw,.95rem); font-weight:700; color:#0F172A; line-height:1.2; }
.promo-pillar p{ margin:0; font-size:clamp(.48rem,1.1vw,.72rem); color:#64748B; line-height:1.35; }
.promo-scene-closing .lockup{ height:22%; max-width:62%; width:auto; object-fit:contain;
  filter:drop-shadow(0 16px 30px rgba(15,50,96,.24)); }
.promo-scene-closing .sub{
  font-size:clamp(.5rem,1.1vw,.8rem); font-weight:500; text-transform:uppercase;
  letter-spacing:.2em; color:#64748B; }
.base-band{ position:absolute; inset-inline:0; bottom:0; height:8px;
  background:linear-gradient(90deg,#0F3260,#F97316); }
.ticks{ position:absolute; bottom:20px; inset-inline-start:20px; display:flex; gap:6px; }
.ticks .promo-tick{ height:4px; width:20px; border-radius:999px; background:rgba(15,50,96,.6); }
</style>

<div class="wrap">
  <h1>Istedama — promo reel</h1>
  <p class="lede">
    A 9-second loop in four scenes: the mark assembles, the tagline, the three pillars,
    then the closing lockup. Shown in both directions; the reel keeps one lockup
    arrangement in each, because a brand mark should not mirror with the text.
  </p>
  ${reel('ar')}
  ${reel('en')}
</div>
`;

fs.writeFileSync(out, html, 'utf8');
console.log('wrote', out, (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');
