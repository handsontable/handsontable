import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  changedPlaywrightSpecs,
  changedUnitTests,
  unitTestPattern,
  isJestInfraFailure,
  isSpawnInfraFailure,
  condenseTestOutput,
  TEST_RUN_MAX_BUFFER,
} from '../pre-push.mjs';

test('selects changed Playwright specs and maps them relative to tests/', () => {
  const changed = [
    'tests/e2e/grid.spec.ts',
    'tests/e2e/filters/menu.spec.ts',
    'tests/fixtures/pages/GridPage.ts', // support, not a spec
    'handsontable/src/plugins/filters/filters.ts', // source
    'handsontable/src/plugins/filters/__tests__/x.spec.js', // legacy Jasmine
    'tests/visual/theme.spec.ts', // visual, not e2e
  ];

  assert.deepEqual(changedPlaywrightSpecs(changed), [
    'e2e/grid.spec.ts',
    'e2e/filters/menu.spec.ts',
  ]);
});

test('returns nothing when no e2e specs changed', () => {
  assert.deepEqual(changedPlaywrightSpecs([
    'handsontable/src/core.ts',
    'tests/fixtures/demo/grid.html',
  ]), []);
});

test('selects changed handsontable unit tests, excluding build output', () => {
  const changed = [
    'handsontable/src/helpers/__tests__/number.unit.js',
    'handsontable/src/plugins/filters/__tests__/dataFilter.unit.ts',
    'handsontable/src/core.ts', // source, not a test
    'handsontable/src/plugins/filters/__tests__/filters.spec.js', // Jasmine e2e, not unit
    'handsontable/tmp/helpers/number.unit.js', // build output — must be excluded
    'tests/e2e/grid.spec.ts', // Playwright, not unit
  ];

  assert.deepEqual(changedUnitTests(changed), [
    'handsontable/src/helpers/__tests__/number.unit.js',
    'handsontable/src/plugins/filters/__tests__/dataFilter.unit.ts',
  ]);
});

test('unitTestPattern is a single shell-safe handsontable-relative path (never a |-joined regex)', () => {
  assert.equal(
    unitTestPattern('handsontable/src/helpers/__tests__/number.unit.ts'),
    'src/helpers/__tests__/number.unit.ts',
  );
  // run.mjs appends the pattern to a cross-env-shell command UNQUOTED, so a `|`
  // (regex alternation) would be read as a shell pipe (the exit-126 bug). Never
  // emit one — the hooks run one jest per file instead.
  assert.ok(!unitTestPattern('handsontable/src/plugins/filters/__tests__/dataFilter.unit.ts').includes('|'));
});

test('treats a jest config/module-resolution failure as infra (non-blocking), not a test failure', () => {
  assert.equal(isJestInfraFailure('● Validation Error:\n  Module jest-jasmine2 was not found.'), true);
  assert.equal(isJestInfraFailure('No tests found, exiting with code 1'), true);
  // A real run that reports failures is NOT infra — it must block.
  assert.equal(isJestInfraFailure('Tests:       1 failed, 4 passed, 5 total'), false);
});

test('a child killed before it could report (ENOBUFS, signal) is infra, not a test failure', () => {
  const overflow = Object.assign(new Error('stdout maxBuffer exceeded'), { code: 'ENOBUFS' });

  assert.equal(isSpawnInfraFailure({ error: overflow, status: null }), true);
  assert.equal(isSpawnInfraFailure({ status: null, signal: 'SIGTERM' }), true);
  assert.equal(isSpawnInfraFailure({ status: 1, signal: null }), false);
  assert.equal(isSpawnInfraFailure({ status: 0, signal: null }), false);
});

test('the run buffer is far above the 1 MB Node default that killed jsdom-noisy runs', () => {
  assert.ok(TEST_RUN_MAX_BUFFER >= 32 * 1024 * 1024);
});

test('condenses a jsdom-flooded run to a bounded excerpt', () => {
  const noise = Array.from({ length: 400 }, () => [
    '  console.error',
    '    Error: Could not parse CSS stylesheet',
    '        at exports.createStylesheet (/repo/node_modules/jsdom/lib/stylesheets.js:34:21)',
    `    .ht-cell::before { -webkit-mask-image: url("data:image/svg+xml,${'%3Csvg'.repeat(60)}"); }`,
  ].join('\n')).join('\n');
  const output = `${noise}\nTests:       50 passed, 50 total\n`;
  const condensed = condenseTestOutput(output);

  assert.ok(condensed.length < 8200, `expected a bounded excerpt, got ${condensed.length} chars`);
  assert.ok(!condensed.includes('data:image/svg+xml'), 'inlined CSS must be dropped');
  assert.ok(!condensed.includes('    at exports.createStylesheet'), 'stack frames must be dropped');
  assert.ok(condensed.includes('Tests:       50 passed, 50 total'), 'the summary must survive');
  assert.ok(condensed.startsWith('[output condensed'), 'truncation must be announced');
});

test('anchors the excerpt at the first failure so the diagnosis survives a long run', () => {
  const output = [
    ...Array.from({ length: 300 }, (_, i) => `  ✓ passing case ${i}`),
    '  ✕ renames a sheet on double-click (12 ms)',
    '  ● SheetsBar › renames a sheet on double-click',
    '    expect(received).toBe(expected)',
    'Tests:       1 failed, 300 passed, 301 total',
  ].join('\n');
  const condensed = condenseTestOutput(output, { maxLines: 10 });

  assert.ok(condensed.includes('✕ renames a sheet on double-click'), 'the failing test name must survive');
  assert.ok(condensed.includes('expect(received).toBe(expected)'), 'the assertion must survive');
  assert.ok(!condensed.includes('passing case 5'), 'the passing tail must be dropped');
});

test('keeps the first failure even when the failure block is longer than the caps', () => {
  // The anchor exists to preserve the diagnosis, so it must survive precisely when
  // the failure block is big enough to need trimming — trimming from the end would
  // drop the anchor and hand back the middle of the failure list instead.
  const output = [
    ...Array.from({ length: 40 }, (_, i) => `  ✓ passing case ${i}`),
    '  ✕ the first failing test (12 ms)',
    '  ● SheetsBar › the first failing test',
    '    expect(received).toBe(expected)',
    ...Array.from({ length: 200 }, (_, i) => `  ✕ later failing test ${i} (3 ms)`),
    'Tests:       201 failed, 40 passed, 241 total',
  ].join('\n');
  const condensed = condenseTestOutput(output);

  assert.ok(condensed.includes('✕ the first failing test'), 'the first failure must survive');
  assert.ok(condensed.includes('expect(received).toBe(expected)'), 'its assertion must survive');
  assert.ok(condensed.includes('Tests:       201 failed'), 'the summary must survive');
  assert.ok(!condensed.includes('passing case 3'), 'the passing prologue must be dropped');
  assert.ok(condensed.split('\n').length <= 121, 'the excerpt must stay bounded');
});

test('keeps the tail when there is no failure to anchor on', () => {
  // A crash or an infra error prints nothing matching a failure marker; there the
  // end of the run is the informative part.
  const condensed = condenseTestOutput([
    ...Array.from({ length: 300 }, (_, i) => `  ✓ passing case ${i}`),
    'Cannot find module jest-jasmine2',
  ].join('\n'), { maxLines: 5 });

  assert.ok(condensed.includes('Cannot find module jest-jasmine2'));
  assert.ok(!condensed.includes('passing case 0'));
});

test('keeps the assertion values, truncating long lines instead of dropping them', () => {
  // Jest prints each of `Expected:`/`Received:` on one line, and those lines run
  // long precisely when the values are interesting. Dropping them by length hands
  // back "a test failed" with no way to tell why.
  const long = 'x'.repeat(230);
  const condensed = condenseTestOutput([
    '  ✕ renames a sheet (12 ms)',
    '  ● SheetsBar › renames a sheet',
    '    expect(received).toBe(expected)',
    `    Expected: "${long}"`,
    `    Received: "${long.replace(/x/g, 'y')}"`,
    'Tests:       1 failed, 49 passed, 50 total',
  ].join('\n'));

  assert.ok(condensed.includes('Expected: "xxx'), 'the expected value must survive');
  assert.ok(condensed.includes('Received: "yyy'), 'the received value must survive');
  condensed.split('\n').forEach((line) => {
    assert.ok(line.length <= 202, `every line stays bounded, got ${line.length}`);
  });
});

test('drops data-URI CSS dumps regardless of length', () => {
  const condensed = condenseTestOutput([
    '  ✕ a failing test',
    `    .ht-cell::before { -webkit-mask-image: url("data:image/svg+xml,${'%3Csvg'.repeat(60)}"); }`,
    'Tests:       1 failed, 0 passed, 1 total',
  ].join('\n'));

  assert.ok(!condensed.includes('data:image'), 'the CSS dump is noise and must go');
  assert.ok(condensed.includes('✕ a failing test'), 'the failure must stay');
});

test('still truncates when the summary alone fills the character budget', () => {
  // charBudget hits 0 here. A negative-offset tail slice would read as slice(-0),
  // i.e. slice(0), and hand back the whole run instead of nothing.
  const condensed = condenseTestOutput(
    `${Array.from({ length: 50 }, (_, i) => `  ✓ passing case ${i}`).join('\n')
    }\nTests:       50 passed, 50 total`,
    { maxChars: 20 },
  );

  assert.ok(!condensed.includes('passing case 0'), 'the body must be cut, not returned whole');
  assert.ok(condensed.includes('Tests:       50 passed'), 'the summary is always kept');
});

test('anchors a Playwright failure too, not just a Jest one', () => {
  // The Stop hook runs both suites through this helper; Playwright's reporter
  // numbers its failures instead of using Jest's markers.
  const condensed = condenseTestOutput([
    ...Array.from({ length: 50 }, (_, i) => `  ✓ spec ${i}`),
    '  1) grid.spec.ts:12:3 › renames a sheet',
    '    Error: expect(locator).toBeVisible() failed',
    ...Array.from({ length: 200 }, (_, i) => `  noise ${i}`),
  ].join('\n'));

  assert.ok(condensed.includes('renames a sheet'), 'the failing spec must survive');
  assert.ok(condensed.includes('toBeVisible'), 'its error must survive');
});

test('returns nothing when nothing survives condensing', () => {
  // A header describing an empty excerpt is worse than silence.
  assert.equal(condenseTestOutput('\n\n\n').trim(), '');
  assert.equal(condenseTestOutput('    at foo (/a/b.js:1:1)\n    at bar (/a/b.js:2:2)').trim(), '');
});

test('never stamps a repeat count on a blank line', () => {
  const condensed = condenseTestOutput('a\n\n\n\nb');

  assert.ok(!/\(×\d+\)\s*$/m.test(condensed), 'a count on emptiness reads as missing content');
  assert.ok(condensed.split('\n').filter(line => line.trim() === '').length <= 1, 'blanks still collapse');
});

test('leaves a short, clean output untouched', () => {
  const output = 'Test Suites: 1 passed, 1 total\nTests:       3 passed, 3 total\n';

  assert.equal(condenseTestOutput(output), 'Test Suites: 1 passed, 1 total\nTests:       3 passed, 3 total');
});

test('collapses repeated identical lines into a count', () => {
  const condensed = condenseTestOutput(`${Array.from({ length: 50 }, () => 'jsdom warning').join('\n')}\ndone`);

  assert.ok(condensed.includes('jsdom warning    (×50)'));
  assert.ok(condensed.includes('done'));
});
