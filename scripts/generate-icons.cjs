/**
 * Generate PWA icons (SVG source + PNG renders) for all three apps.
 * Run with: node scripts/generate-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');

/* ─── SVG sources ─────────────────────────────────────────────── */

const tradestatSvg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <rect x="40" y="40" width="432" height="432" rx="80" fill="#0a0e1c" fill-opacity="0.88"/>
  <path d="M 110 348 L 222 236 L 296 310 L 416 190"
        stroke="#5eead4" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M 320 190 L 416 190 L 416 286"
        stroke="#5eead4" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const shiftbookSvg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0.3" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#5fa478"/>
      <stop offset="100%" stop-color="#2f5d44"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <circle cx="256" cy="256" r="156" fill="none" stroke="#ffffff" stroke-width="30" opacity="0.95"/>
  <line x1="256" y1="158" x2="256" y2="256" stroke="#ffffff" stroke-width="30" stroke-linecap="round"/>
  <line x1="256" y1="256" x2="330" y2="296" stroke="#ffffff" stroke-width="30" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="16" fill="#ffffff"/>
</svg>`;

const launcherSvg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0e1430"/>
      <stop offset="100%" stop-color="#1a1136"/>
    </linearGradient>
    <linearGradient id="t1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#67e8f9"/>
    </linearGradient>
    <linearGradient id="t2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <linearGradient id="t3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5fa478"/>
      <stop offset="100%" stop-color="#3f7a5a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <rect x="108" y="108" width="140" height="140" rx="32" fill="url(#t1)"/>
  <rect x="264" y="108" width="140" height="140" rx="32" fill="url(#t2)"/>
  <rect x="108" y="264" width="140" height="140" rx="32" fill="url(#t3)"/>
  <rect x="264" y="264" width="140" height="140" rx="32" fill="#f7f4ec"/>
</svg>`;

/* ─── Renderer ────────────────────────────────────────────────── */

async function renderIcon(svg, outDir, baseName){
  fs.mkdirSync(outDir, { recursive: true });

  // SVG source (vector master)
  fs.writeFileSync(path.join(outDir, baseName + '.svg'), svg);

  const buf = Buffer.from(svg);

  // Standard PWA icons
  await sharp(buf).resize(192, 192).png().toFile(path.join(outDir, baseName + '-192.png'));
  await sharp(buf).resize(512, 512).png().toFile(path.join(outDir, baseName + '-512.png'));

  // Apple touch icon — iOS draws its own rounded mask, so put icon on solid
  // background that matches the icon's own background, no transparency.
  await sharp(buf).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'));

  // Maskable: Android adaptive icons crop to a circle/squircle with ~80%
  // safe zone. Pad the icon down to 80% on a same-color background.
  // Easiest: render icon at 410px centered on 512x512 canvas matching
  // first stop of gradient (we just use the icon scaled smaller, with the
  // SVG's own background bleeding via additional outer padding).
  // Sharp can't easily extract bg color from SVG; we render the SVG at
  // 410, then composite onto a 512 black canvas (good enough — gradient
  // shows around edges nicely for our designs since corners are rounded).
  // For a cleaner maskable, we generate a second SVG with no corner
  // radius (full bleed) so the safe zone shows the design and corners
  // bleed to the gradient.
  const maskableSvg = svg.replace(/rx="112"/, 'rx="0"');
  const inner = await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toBuffer();
  await sharp(inner)
    .resize(410, 410)
    .extend({ top:51, bottom:51, left:51, right:51, background: bgColorOf(svg) })
    .png()
    .toFile(path.join(outDir, baseName + '-maskable.png'));

  console.log(`✓ ${outDir}`);
}

function bgColorOf(svg){
  // pick first <stop> color from the gradient we use for the rect bg.
  const m = svg.match(/<stop offset="0%" stop-color="(#[0-9a-fA-F]+)"/);
  return m ? m[1] : '#000000';
}

/* ─── Run ─────────────────────────────────────────────────────── */
(async () => {
  await renderIcon(launcherSvg,  path.join(ROOT),             'icon');
  await renderIcon(tradestatSvg, path.join(ROOT, 'tradestat'), 'icon');
  await renderIcon(shiftbookSvg, path.join(ROOT, 'shiftbook'), 'icon');
  console.log('\nDone.');
})();
