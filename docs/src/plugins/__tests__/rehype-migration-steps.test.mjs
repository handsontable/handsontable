import assert from 'node:assert/strict';
import test from 'node:test';
import { rehypeMigrationSteps } from '../rehype-migration-steps.mjs';

/** Minimal HAST element. */
function el(tagName, children = [], properties = {}) {
  return { type: 'element', tagName, properties, children };
}

/** Minimal HAST text node. */
function text(value) {
  return { type: 'text', value };
}

/** Runs the plugin over a root built from the given children. */
function run(children) {
  const tree = { type: 'root', children };

  rehypeMigrationSteps()(tree);

  return tree;
}

/** Class list of a node, always as an array. */
function classesOf(node) {
  const value = node.properties?.className;

  return Array.isArray(value) ? value : [];
}

test('the ordered list after a `## Steps` heading gets the sl-steps markup', () => {
  const list = el('ol', [el('li', [text('Install the icon pack.')])]);
  const tree = run([el('h2', [text('Steps')], { id: 'steps' }), text('\n'), list]);
  const [, , transformed] = tree.children;

  assert.equal(transformed, list, 'the list is marked in place, not replaced');
  assert.ok(classesOf(transformed).includes('sl-steps'));
  assert.equal(transformed.properties.role, 'list');
  assert.equal(transformed.properties.id, undefined);
});

test('an existing class on the list is kept', () => {
  const tree = run([
    el('h2', [text('Steps')]),
    el('ol', [el('li', [text('Install the icon pack.')])], { className: ['custom'] }),
  ]);
  const list = tree.children[1];

  assert.deepEqual(classesOf(list), ['custom', 'sl-steps']);
});

test('a list already carrying sl-steps is left alone', () => {
  const list = el('ol', [el('li', [text('Install the icon pack.')])], {
    className: ['sl-steps'],
    role: 'list',
  });
  const tree = run([el('h2', [text('Steps')]), list]);

  assert.deepEqual(classesOf(tree.children[1]), ['sl-steps'], 'the class is not duplicated');
});

test('an ordered list under any other heading is untouched', () => {
  const tree = run([el('h2', [text('Prerequisites')]), el('ol', [el('li', [text('A grid.')])])]);

  assert.deepEqual(classesOf(tree.children[1]), []);
  assert.equal(tree.children[1].properties.role, undefined);
});

test('an unordered list under `## Steps` is untouched', () => {
  const tree = run([el('h2', [text('Steps')]), el('ul', [el('li', [text('A grid.')])])]);

  assert.deepEqual(classesOf(tree.children[1]), []);
});

test('a paragraph between the heading and the list stops the match', () => {
  const tree = run([
    el('h2', [text('Steps')]),
    el('p', [text('Follow these in order.')]),
    el('ol', [el('li', [text('Install the icon pack.')])]),
  ]);

  assert.deepEqual(classesOf(tree.children[2]), []);
});

test('the heading-based wrapping still works alongside it', () => {
  const tree = run([
    el('h2', [text('1. Replace the imports')]),
    el('p', [text('Swap the import path.')]),
    el('h2', [text('2. Update the settings')]),
  ]);
  const [wrapper] = tree.children;

  assert.equal(wrapper.tagName, 'ol');
  assert.deepEqual(classesOf(wrapper), ['sl-steps']);
  assert.equal(wrapper.properties.role, 'list');
  assert.equal(wrapper.children.length, 2);
  assert.equal(wrapper.children[0].tagName, 'li');
  assert.equal(
    wrapper.children[0].children[0].children[0].value,
    'Replace the imports',
    'the step number prefix is stripped from the heading'
  );
});

test('a `## Steps` heading whose steps are numbered headings is not double-processed', () => {
  const tree = run([
    el('h2', [text('Steps')]),
    el('h3', [text('1. Define a store')]),
    el('h3', [text('2. Activate it')]),
  ]);
  const wrapper = tree.children[1];

  assert.equal(wrapper.tagName, 'ol');
  assert.deepEqual(classesOf(wrapper), ['sl-steps']);
  assert.equal(wrapper.children.length, 2);
});
