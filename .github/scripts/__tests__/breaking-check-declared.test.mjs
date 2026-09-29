import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  declaredSignals,
  detectBreakingEntry,
  detectDefaultsTouched,
  detectDeprecationWarnAdded,
  detectRemovedRegistryTouched,
} from '../lib/breaking-check/declared.mjs';

const fileDiff = (path, bodyLines) => ({
  path,
  text: [
    `diff --git a/${path} b/${path}`,
    `--- a/${path}`,
    `+++ b/${path}`,
    ...bodyLines,
  ].join('\n'),
});

// --- detectBreakingEntry ---

test('detectBreakingEntry: positive on an added changelog entry with "breaking": true', () => {
  const files = [
    fileDiff('.changelogs/13999.json', [
      '@@ -0,0 +1,6 @@',
      '+{',
      '+  "title": "Removed the foo option",',
      '+  "type": "removed",',
      '+  "issueOrPR": 13999,',
      '+  "breaking": true',
      '+}',
    ]),
  ];

  const result = detectBreakingEntry(files);

  assert.equal(result.breakingEntry, true);
  assert.match(result.evidence, /13999\.json/);
});

test('detectBreakingEntry: negative when the entry says "breaking": false', () => {
  const files = [
    fileDiff('.changelogs/14000.json', [
      '@@ -0,0 +1,6 @@',
      '+{',
      '+  "title": "Fixed a rendering glitch",',
      '+  "type": "fixed",',
      '+  "issueOrPR": 14000,',
      '+  "breaking": false',
      '+}',
    ]),
  ];

  const result = detectBreakingEntry(files);

  assert.equal(result.breakingEntry, false);
  assert.equal(result.evidence, null);
});

test('detectBreakingEntry: negative when no changelog entry is present at all', () => {
  const files = [fileDiff('handsontable/src/core.ts', ['@@ -1,1 +1,1 @@', '-old', '+new'])];

  assert.equal(detectBreakingEntry(files).breakingEntry, false);
});

// --- detectRemovedRegistryTouched ---

test('detectRemovedRegistryTouched: positive when a core.ts hunk mentions REMOVED_OPTIONS', () => {
  const files = [
    fileDiff('handsontable/src/core.ts', [
      '@@ -10,3 +10,4 @@ const REMOVED_OPTIONS = new Map([',
      " ['foo', ...],",
      "+['bar', { version: '18.0.0' }],",
      ' ]);',
    ]),
  ];

  const result = detectRemovedRegistryTouched(files);

  assert.equal(result.removedRegistryTouched, true);
  assert.match(result.evidence, /REMOVED_OPTIONS/);
});

test('detectRemovedRegistryTouched: positive when a hooks/constants.ts hunk mentions REMOVED_HOOKS', () => {
  const files = [
    fileDiff('handsontable/src/core/hooks/constants.ts', [
      '@@ -5,2 +5,3 @@ export const REMOVED_HOOKS = new Map([',
      "+['afterFoo', { version: '19.0.0' }],",
      ' ]);',
    ]),
  ];

  assert.equal(detectRemovedRegistryTouched(files).removedRegistryTouched, true);
});

test('detectRemovedRegistryTouched: negative when core.ts changes have nothing to do with REMOVED_OPTIONS', () => {
  const files = [
    fileDiff('handsontable/src/core.ts', [
      '@@ -100,2 +100,3 @@ function render() {',
      '-  doSomething();',
      '+  doSomethingElse();',
    ]),
  ];

  const result = detectRemovedRegistryTouched(files);

  assert.equal(result.removedRegistryTouched, false);
  assert.equal(result.evidence, null);
});

test('detectRemovedRegistryTouched: negative when neither target file is present', () => {
  const files = [fileDiff('handsontable/src/other.ts', ['@@ -1,1 +1,1 @@', '-a', '+b'])];

  assert.equal(detectRemovedRegistryTouched(files).removedRegistryTouched, false);
});

// --- detectDeprecationWarnAdded ---

test('detectDeprecationWarnAdded: positive when an added line warns and another mentions deprecation', () => {
  const files = [
    fileDiff('handsontable/src/plugins/foo/foo.ts', [
      '@@ -20,0 +21,3 @@',
      '+  // This method is deprecated since 18.0, use bar() instead.',
      "+  deprecatedWarnOnce('Foo.oldMethod', 'Use bar() instead.');",
      '+  return this.bar();',
    ]),
  ];

  const result = detectDeprecationWarnAdded(files);

  assert.equal(result.deprecationWarnAdded, true);
  assert.match(result.evidence, /deprecatedWarnOnce/);
});

test('detectDeprecationWarnAdded: negative when a warn call is added with no deprecation wording', () => {
  const files = [
    fileDiff('handsontable/src/plugins/foo/foo.ts', [
      '@@ -1,0 +2,1 @@',
      "+  console.warn('something unrelated happened');",
    ]),
  ];

  assert.equal(detectDeprecationWarnAdded(files).deprecationWarnAdded, false);
});

test('detectDeprecationWarnAdded: negative when deprecation is mentioned but nothing warns', () => {
  const files = [
    fileDiff('handsontable/src/plugins/foo/foo.ts', [
      '@@ -1,0 +2,1 @@',
      '+  // deprecated comment with no runtime warning',
    ]),
  ];

  assert.equal(detectDeprecationWarnAdded(files).deprecationWarnAdded, false);
});

test('detectDeprecationWarnAdded: negative outside handsontable/src and wrappers', () => {
  const files = [
    fileDiff('docs/content/guide.md', [
      '@@ -1,0 +2,1 @@',
      "+deprecatedWarnOnce('x', 'deprecated y');",
    ]),
  ];

  assert.equal(detectDeprecationWarnAdded(files).deprecationWarnAdded, false);
});

// --- detectDefaultsTouched ---

test('detectDefaultsTouched: positive on a real code change to metaSchema.ts', () => {
  const files = [
    fileDiff('handsontable/src/dataMap/metaManager/metaSchema.ts', [
      '@@ -50,1 +50,1 @@',
      '-  readOnly: false,',
      '+  readOnly: true,',
    ]),
  ];

  const result = detectDefaultsTouched(files);

  assert.equal(result.defaultsTouched, true);
  assert.match(result.evidence, /readOnly: false/);
});

test('detectDefaultsTouched: positive on the pre-TypeScript metaSchema.js path', () => {
  const files = [
    fileDiff('handsontable/src/dataMap/metaManager/metaSchema.js', [
      '@@ -4750,1 +4750,1 @@',
      '-    undo: undefined,',
      '+    undo: true,',
    ]),
  ];

  const result = detectDefaultsTouched(files);

  assert.equal(result.defaultsTouched, true);
  assert.match(result.evidence, /undo: undefined/);
});

test('detectDefaultsTouched: negative when a new option is only added', () => {
  const files = [
    fileDiff('handsontable/src/dataMap/metaManager/metaSchema.ts', [
      '@@ -60,0 +60,6 @@',
      '+    /**',
      '+     * Reveals the typed character for a moment.',
      '+     */',
      '+    hashRevealDelay: 0,',
      '+',
    ]),
  ];

  assert.equal(detectDefaultsTouched(files).defaultsTouched, false);
});

test('detectDefaultsTouched: negative on a comment-only change (JSDoc edit)', () => {
  const files = [
    fileDiff('handsontable/src/dataMap/metaManager/metaSchema.ts', [
      '@@ -40,3 +40,3 @@',
      '  /**',
      '-   * Old description of the option.',
      '+   * New, clearer description of the option.',
      '   */',
      '  readOnly: false,',
    ]),
  ];

  const result = detectDefaultsTouched(files);

  assert.equal(result.defaultsTouched, false);
  assert.equal(result.evidence, null);
});

test('detectDefaultsTouched: negative when metaSchema.ts is not in the diff at all', () => {
  const files = [fileDiff('handsontable/src/core.ts', ['@@ -1,1 +1,1 @@', '-a', '+b'])];

  assert.equal(detectDefaultsTouched(files).defaultsTouched, false);
});

// --- declaredSignals (combined) ---

test('declaredSignals combines all four detectors with their evidence', () => {
  const files = [
    fileDiff('.changelogs/1.json', ['@@ -0,0 +1,1 @@', '+{"breaking": true}']),
    fileDiff('handsontable/src/dataMap/metaManager/metaSchema.ts', ['@@ -1,1 +1,1 @@', '-x: false,', '+x: true,']),
  ];

  const result = declaredSignals(files);

  assert.equal(result.breakingEntry, true);
  assert.equal(result.defaultsTouched, true);
  assert.equal(result.removedRegistryTouched, false);
  assert.equal(result.deprecationWarnAdded, false);
  assert.ok(result.evidence.breakingEntry);
  assert.ok(result.evidence.defaultsTouched);
  assert.equal(result.evidence.removedRegistryTouched, null);
});
