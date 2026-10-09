import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const motion = read('src/animation/useDeskPaper.js');
assert.doesNotMatch(motion, /addEventListener\(['"](?:wheel|touchmove|touchstart|keydown|scroll)['"]/);
assert.doesNotMatch(motion, /requestLift|ScrollTrigger|IntersectionObserver|changePhase\('landing'\)/);
assert.match(read('src/components/JourneyWriting.jsx'), /onClick=\{desk\.open\}/);
const home = read('src/components/HomeArtwork.jsx');
assert.ok(home.indexOf('className="home-art-field"') < home.indexOf('className="home-brand-scroll"'));
assert.ok(home.indexOf('className="home-brand-scroll"') < home.indexOf('className={`home-painted-layer'));
console.log('Passed: click-only paper inputs and shared background/title/foreground layer order.');
