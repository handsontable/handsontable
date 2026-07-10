import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rewriteHasSelectors, isStylesheetId } from '../replace-has-selectors.mjs';

test('replaces a static :has() with a stamped class and emits a manifest', () => {
  const { css, replaced, kept } = rewriteHasSelectors('.hot-example:has(.theme-dropdown) { color: red; }');

  assert.equal(replaced, 1);
  assert.equal(kept, 0);
  assert.match(css, /\.hot-example:where\(\.ht-nohas-[a-z0-9]+\):not\(\._\)\s*\{/);
  assert.match(css, /:root \{ --ht-nohas-[a-z0-9]+: "\.hot-example:has\(\.theme-dropdown\)"; \}/);
  assert.ok(!css.split(':root')[0].includes(':has('));
});

test('keeps hover/focus-driven :has() selectors untouched', () => {
  const input = '.sidebar-pane ul ul li:has(> a:not([aria-current="page"]):is(:hover, :focus-visible)) { border-color: red; }';
  const { css, replaced, kept } = rewriteHasSelectors(input);

  assert.equal(replaced, 0);
  assert.equal(kept, 1);
  assert.ok(css.includes(':has(> a:not([aria-current="page"]):is(:hover, :focus-visible))'));
  assert.ok(!css.includes(':root'));
});

test('rewrites only the :has() items of a selector list', () => {
  const { css, replaced } = rewriteHasSelectors('.a:has(.b), .c { color: red; }');

  assert.equal(replaced, 1);
  assert.match(css, /\.a:where\(\.ht-nohas-[a-z0-9]+\):not\(\._\), \.c \{/);
});

test('preserves the specificity of the dropped segments via padding', () => {
  // :has(> a[aria-current='page']) contributes (0,1,1) -> one :not(._) and one :not(_)
  const input = ".sidebar-pane ul ul li:has(> a[aria-current='page']) { border-color: red; }";
  const { css } = rewriteHasSelectors(input);

  assert.match(css, /li:where\(\.ht-nohas-[a-z0-9]+\):not\(\._\):not\(_\)\s*\{/);
});

test('handles a :has() anchor followed by a suffix', () => {
  const { css } = rewriteHasSelectors('main:has(.not-found) .hot-footer { display: none; }');

  assert.match(css, /main:where\(\.ht-nohas-[a-z0-9]+\):not\(\._\) \.hot-footer \{/);
  assert.match(css, /--ht-nohas-[a-z0-9]+: "main:has\(\.not-found\)"/);
});

test('handles multiple :not(:has(...)) segments in one compound', () => {
  const input = '.controls:not(:has(button:not([hidden]))):not(:has(input:not([hidden]))) { display: none; }';
  const { css, replaced } = rewriteHasSelectors(input);

  assert.equal(replaced, 1);
  // each dropped :not(:has(...)) contributes (0,1,1) -> total (0,2,2)
  assert.match(css, /\.controls:where\(\.ht-nohas-[a-z0-9]+\):not\(\._\):not\(\._\):not\(_\):not\(_\)\s*\{/);
  assert.ok(!css.split(':root')[0].includes(':has('));
});

test('rewrites the Starlight markdown list rule (comment inside the selector)', () => {
  const input = `.sl-markdown-content
 :is(ol, ul):has(> li > :not(a, strong, em, del, span, input, code, br, script, ol, ul))
 > li
 > :is(
    :last-child:not(a, strong, em, del, span, input, code, br, :where(.not-content *)),
    /* comment inside the selector */
    :not(script):has(~ script:last-child):not(:has(~ :not(script)))
 ) { margin-bottom: 1.25rem; }`;
  const { css, replaced } = rewriteHasSelectors(input);

  assert.equal(replaced, 1);
  assert.ok(!css.split(':root')[0].includes(':has('));
  assert.ok(!css.includes('/* comment inside the selector */') || css.indexOf('/*') > css.indexOf('{'));

  const anchors = [...css.matchAll(/--ht-nohas-[a-z0-9]+: "([^"]+)"/g)].map(m => m[1]);

  assert.equal(anchors.length, 2);
  assert.ok(anchors[0].startsWith('.sl-markdown-content :is(ol, ul):has('));
  assert.ok(anchors[1].includes('> li > :is('));
});

test('resolves & against parent rules for the manifest anchor', () => {
  const input = `ul ul li {
  &:has(> a[aria-current='page']) { border-color: red; }
}`;
  const { css } = rewriteHasSelectors(input);

  assert.match(css, /--ht-nohas-[a-z0-9]+: ":is\(ul ul li\):has\(> a\[aria-current='page'\]\)"/);
  assert.match(css, /&:where\(\.ht-nohas-[a-z0-9]+\)/);
});

test('keeps an explicit & when the only & sat inside the dropped :has()', () => {
  const input = `.search-dialog {
  div:has(> &) { justify-content: center; }
}`;
  const { css } = rewriteHasSelectors(input);

  assert.match(css, /div:where\(\.ht-nohas-[a-z0-9]+\)[^{]*:where\(&, :not\(&\)\)\s*\{/);
  assert.match(css, /--ht-nohas-[a-z0-9]+: "div:has\(> :is\(\.search-dialog\)\)"/);
});

test('same anchor in different rules maps to the same class', () => {
  const { css } = rewriteHasSelectors(
    'main:has(.not-found) .a { color: red; } main:has(.not-found) .b { color: blue; }',
  );
  const classes = [...css.matchAll(/:where\(\.(ht-nohas-[a-z0-9]+)\)/g)].map(m => m[1]);

  assert.equal(classes.length, 2);
  assert.equal(classes[0], classes[1]);
  assert.equal([...css.matchAll(/--ht-nohas-/g)].length, 1);
});

test('treats plain stylesheets and astro/vue style blocks as CSS modules', () => {
  assert.equal(isStylesheetId('/docs/src/styles/sidebar.css'), true);
  assert.equal(isStylesheetId('/docs/src/pages/index.astro?astro&type=style&index=0&lang.css'), true);
  assert.equal(isStylesheetId('/docs/src/components/Widget.vue?vue&type=style&index=0&lang.css'), true);
});

test('skips ?raw, ?url, and ?inline CSS imports (served as JavaScript, not stylesheets)', () => {
  // The example runner imports example CSS with `?raw`; vite serves it as
  // `export default "..."` - postcss parsing that failed the production build.
  assert.equal(isStylesheetId('/docs/content/guides/navigation/focus-scopes/javascript/example1.css?raw'), false);
  assert.equal(isStylesheetId('/docs/src/styles/anything.css?url'), false);
  assert.equal(isStylesheetId('/docs/src/styles/anything.css?inline'), false);
  assert.equal(isStylesheetId('/docs/src/components/module.mjs'), false);
});
