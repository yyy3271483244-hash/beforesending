import fs from 'node:fs';

const component = fs.readFileSync(new URL('../src/components/StampSendScene.jsx', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/stamp-send-scene.css', import.meta.url), 'utf8');
const journey = fs.readFileSync(new URL('../src/data/journey.mjs', import.meta.url), 'utf8');
const required = [
  'send-flow-pack',
  'send-flow-stamp-stage',
  'send-flow-address-stage',
  'send-flow-delivery-stage',
  'deliveryEmail',
  'Fold and place inside',
  'Confirm address',
  'Send letter',
];
for (const needle of required) {
  if (!component.includes(needle)) throw new Error(`Missing send-flow stage or control: ${needle}`);
}
if (component.includes('waxPouring') || component.includes('selectedWaxHead')) throw new Error('Wax-seal interaction remains in the send flow.');
if (!styles.includes('.send-flow-background') || !styles.includes('.send-envelope') || !styles.includes('.send-flow-stamp-tray')) throw new Error('Background and foreground layers are not separately styled.');
if (!journey.includes("const email = (letter.deliveryEmail ?? '').trim();")) throw new Error('Recipient email is not part of delivery validation.');
if (journey.includes('!letter.stampAppliedAt || !letter.sealedAt')) throw new Error('Old wax-seal delivery gate remains.');
console.log('Send-flow structure, independent foreground layers, and no-wax delivery gate verified.');
