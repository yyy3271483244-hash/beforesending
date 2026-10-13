import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';
import { parse } from '@babel/parser';
import generate from '@babel/generator';

const ast = parse(readFileSync('src/animation/useHomeMotion.js', 'utf8'), { sourceType: 'module' });
ast.program.body = ast.program.body.filter(node => node.type !== 'ImportDeclaration')
  .map(node => node.type === 'ExportNamedDeclaration' ? node.declaration : node);
const script = new Script(generate(ast).code);

function run(ready, reduced = false) {
  const elements = Object.fromEntries(['.home-art-video', '.home-title-before', '.home-title-sending'].map(name => [name, { name }]));
  const sets = [], tweens = [];
  let cleanup, dependencies, timelines = 0, killed = false;
  const timeline = {
    fromTo(target, from, to, start) { tweens.push({ target, from, to, start }); return this; },
    kill() { killed = true; },
  };
  const context = {
    useLayoutEffect(effect, deps) { dependencies = deps; cleanup = effect(); },
    window: { matchMedia: () => ({ matches: reduced }) },
    gsap: { set(targets, values) { sets.push({ targets, values }); }, timeline() { timelines++; return timeline; } },
  };
  script.runInNewContext(context);
  context.useHomeMotion({ current: { querySelector: selector => elements[selector] } }, ready);
  return { sets, tweens, timelines, dependencies, cleanup, get killed() { return killed; } };
}

test('home artwork and both titles stay hidden until resources are ready', () => {
  const result = run(false);
  assert.equal(result.timelines, 0);
  assert.equal(result.sets.length, 1);
  assert.equal(result.sets[0].targets.length, 3);
  assert.equal(result.sets[0].values.opacity, 0);
  assert.equal(result.dependencies[1], false);
});

test('video and both titles enter on the same timeline with matching timing', () => {
  const result = run(true);
  assert.equal(result.timelines, 1);
  assert.equal(result.tweens.length, 3);
  assert.equal(new Set(result.tweens.map(tween => tween.target.name)).size, 3);
  for (const tween of result.tweens) {
    assert.equal(tween.start, 0);
    assert.equal(tween.from.opacity, 0);
    assert.equal(tween.to.opacity, 1);
    assert.equal(tween.to.duration, .9);
    assert.equal(tween.to.ease, 'power2.out');
  }
  result.cleanup();
  assert.equal(result.killed, true);
});

test('reduced motion reveals the whole home together without animating', () => {
  const result = run(true, true);
  assert.equal(result.timelines, 0);
  assert.equal(result.sets[0].targets.length, 3);
  assert.equal(result.sets[0].values.opacity, 1);
});

test('title playback waits for video and title preloading; video cannot autoplay early', () => {
  const component = parse(readFileSync('src/components/HomeArtwork.jsx', 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  const nodes = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type) nodes.push(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(component);
  const readiness = nodes.find(node => node.type === 'VariableDeclarator' && node.id.name === 'entryReady').init;
  assert.equal(readiness.operator, '&&');
  assert.equal(readiness.left.name, 'videoReady');
  assert.equal(readiness.right.name, 'titlesReady');
  const video = nodes.find(node => node.type === 'JSXOpeningElement' && node.name.name === 'video');
  assert.ok(!video.attributes.some(attribute => attribute.name?.name === 'autoPlay'));
  assert.ok(video.attributes.some(attribute => attribute.name?.name === 'onLoadedData'));
  const titleGates = nodes.filter(node => node.type === 'LogicalExpression' && node.left.name === 'entryReady' && node.right.type === 'JSXElement');
  assert.equal(titleGates.length, 2);
  const styles = readFileSync('src/visual-restoration.css', 'utf8');
  assert.ok(styles.includes("[data-home-entry-ready='false'] .home-brand-scroll { visibility: hidden; }"));
});
