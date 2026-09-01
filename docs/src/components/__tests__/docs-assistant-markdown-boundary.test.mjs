import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';
import ts from 'typescript';

const rendererPath = fileURLToPath(
  new URL('../DocsAssistant/MarkdownRenderer.tsx', import.meta.url)
);
const rendererSource = readFileSync(rendererPath, 'utf8');
const cssPath = fileURLToPath(new URL('../DocsAssistant/DocsAssistant.css', import.meta.url));
const cssSource = readFileSync(cssPath, 'utf8');

const transpiled = ts.transpileModule(rendererSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.React,
  },
}).outputText;

/**
 * A data: URL module cannot resolve bare or relative specifiers, so the two static imports are
 * swapped for globals. The lazy `import()` calls stay untouched - they are never invoked here,
 * which is exactly the condition under test.
 */
const shimmed = transpiled
  .replace(
    /^import \{[^}]*\} from ["']react["'];$/m,
    'const { Component, lazy, Suspense } = globalThis.__hotTestReact;'
  )
  .replace(
    /^import \{ supportsModernRegex \} from ["'][^"']*["'];$/m,
    'const supportsModernRegex = () => true;'
  );

assert.doesNotMatch(
  shimmed,
  /^import [^(]/m,
  'Expected every static import to be shimmed before loading the module'
);

globalThis.__hotTestReact = React;

const { MarkdownRenderer } = await import(
  `data:text/javascript;charset=utf-8,${encodeURIComponent(`const React = globalThis.__hotTestReact;\n${shimmed}`)}`
);

const LAZY_TYPE = Symbol.for('react.lazy');

function collectElementTypes(node, types = []) {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectElementTypes(child, types);
    }

    return types;
  }

  if (node === null || typeof node !== 'object') {
    return types;
  }

  if (node.$$typeof === Symbol.for('react.element')) {
    types.push(node.type);
    collectElementTypes(node.props?.children, types);
  }

  return types;
}

function renderMarkdown(content) {
  const tree = MarkdownRenderer({ content });
  const Boundary = tree.type;

  return { tree, Boundary };
}

test('the error boundary wraps the Suspense tree that loads the lazy renderers', () => {
  const { tree, Boundary } = renderMarkdown('Set `autoWrapRow` to `true`.');

  assert.equal(typeof Boundary.getDerivedStateFromError, 'function');
  assert.equal(tree.props.content, 'Set `autoWrapRow` to `true`.');
  assert.equal(tree.props.children.type, React.Suspense);
  assert.equal(collectElementTypes(tree.props.children.props.children).length, 1);
});

test('the boundary renders its children untouched until a renderer chunk fails', () => {
  const { tree, Boundary } = renderMarkdown('Call `updateSettings()` once.');
  const boundary = new Boundary(tree.props);

  assert.deepEqual(boundary.state, { failed: false });
  assert.equal(boundary.render(), tree.props.children);
});

test('a failed renderer chunk keeps the assistant mounted and shows the message text', () => {
  const content = 'Register the plugin with `registerPlugin()`.';
  const { tree, Boundary } = renderMarkdown(content);
  const boundary = new Boundary(tree.props);

  boundary.state = Boundary.getDerivedStateFromError(
    new TypeError('Failed to fetch dynamically imported module: /docs/_astro/MarkdownRendererFull.js')
  );

  const fallback = boundary.render();

  assert.deepEqual(boundary.state, { failed: true });
  assert.equal(fallback.type, 'div');
  assert.match(fallback.props.className, /\bda-markdown-plain\b/);
  assert.equal(fallback.props.children, content);
});

test('the failure fallback renders no lazy component of its own', () => {
  const { tree, Boundary } = renderMarkdown('The `afterChange` hook fires once per edit.');
  const boundary = new Boundary(tree.props);

  boundary.state = Boundary.getDerivedStateFromError(new TypeError('chunk load failure'));

  const types = collectElementTypes(boundary.render());

  assert.ok(types.length > 0);

  for (const type of types) {
    assert.notEqual(
      type?.$$typeof,
      LAZY_TYPE,
      'A boundary cannot catch a throw raised inside its own fallback, so the fallback must not be lazy'
    );
    assert.notEqual(type, React.Suspense);
  }
});

test('the failure fallback reads live props so streamed message text keeps updating', () => {
  const { tree, Boundary } = renderMarkdown('Partial ans');
  const boundary = new Boundary(tree.props);

  boundary.state = Boundary.getDerivedStateFromError(new TypeError('chunk load failure'));

  assert.equal(boundary.render().props.children, 'Partial ans');

  boundary.props = { ...boundary.props, content: 'Partial answer, now complete.' };

  assert.equal(boundary.render().props.children, 'Partial answer, now complete.');
});

test('the plain-text fallback keeps markdown line breaks readable', () => {
  const match = cssSource.match(/\.da-markdown-plain\s*\{(?<body>[^}]+)\}/);

  assert.ok(match?.groups?.body, 'Expected a .da-markdown-plain rule');
  assert.match(match.groups.body, /white-space:\s*pre-wrap;/);
});
