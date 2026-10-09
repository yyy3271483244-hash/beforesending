import fs from 'node:fs';

const home = fs.readFileSync(new URL('../src/components/HomeArtwork.jsx', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/visual-restoration.css', import.meta.url), 'utf8');
const video = new URL('../public/assets/home-stage/before-sending-home.mp4', import.meta.url);

for (const value of ['before-sending-home.mp4', 'firstVideo', 'secondVideo', 'requestAnimationFrame']) {
  if (!home.includes(value)) throw new Error(`Missing home video loop requirement: ${value}`);
}
if (home.includes(' loop')) throw new Error('Native video loop must not replace the seamless dual-track loop.');
if (!styles.includes('.home-art-video') || !styles.includes('pointer-events:none') || !styles.includes('.home-brand-scroll') || !styles.includes('.home-mail-slot')) throw new Error('Home video/UI layer rules are incomplete.');
if (!fs.statSync(video).size) throw new Error('Home video asset is missing or empty.');
console.log('Home video uses two persistent tracks with a foreground UI layer and no native-loop fallback.');
