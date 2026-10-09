import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const journey = read('src/components/HorizontalJourney.jsx');
const header = read('src/components/GlobalHeader.jsx');
const headerCss = read('src/global-header.css');
const language = read('src/i18n/Language.jsx');
const scroll = read('src/animation/useVerticalJourney.js');
const reveal = read('src/animation/useSceneReveal.js');
const sceneCss = read('src/scene-continuity.css');
const baseCss = read('src/horizontal-journey.css');

assert.equal((journey.match(/<GlobalHeader\b/g) || []).length, 1);
assert.doesNotMatch(journey, /<header\b|postal-header/);
assert.match(header, /createPortal\(<header/);
assert.match(header, /document\.body/);
assert.equal((header.match(/<LanguageSwitch\b/g) || []).length, 1);
assert.doesNotMatch(language, /<LanguageSwitch\b/);
assert.match(headerCss, /position:fixed/);
assert.match(headerCss, /z-index:1000/);
assert.match(headerCss, /align-items:baseline; flex-wrap:nowrap/);
assert.doesNotMatch(headerCss, /data-chapter|flex-wrap:wrap/);
postcss.parse(headerCss).walkDecls(declaration => {
  if (['transform', 'translate', 'animation'].includes(declaration.prop)) {
    assert.equal(declaration.value, 'none', 'The global header must not move or animate.');
  }
});

assert.match(scroll, /addEventListener\('scroll', schedule, \{ passive: true \}\)/);
assert.doesNotMatch(scroll, /preventDefault|setTimeout|addEventListener\(['"]wheel|ScrollTrigger|gsap|autoAlpha|snapTo/);
assert.match(baseCss, /\.journey-section \{ position: relative; width: 100%; height: auto; min-height: 100svh/);
assert.match(baseCss, /\.journey-section-content \{ position: relative/);
assert.match(sceneCss, /scroll-snap-type:none !important; scroll-behavior:auto/);
assert.match(sceneCss, /opacity:1; transform:none; filter:none/);
assert.match(reveal, /IntersectionObserver/);
assert.match(reveal, /MutationObserver/);
assert.doesNotMatch(reveal, /scrollTo|scrollIntoView|preventDefault|\.journey-section['"]|\.journey-scene-frame['"]/);

for (const file of ['src/components/HomeArtwork.jsx', 'src/components/JourneyCompanion.jsx']) {
  assert.doesNotMatch(read(file), /<header\b/);
}
console.log('PASS: one body-level global header, baseline/no-wrap navigation, relative auto-height scenes, passive native scrolling, object-only reveals.');
