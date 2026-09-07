import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  changedPlaywrightSpecs,
  changedUnitTests,
  unitTestPattern,
  needsDeterminismRatchet,
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

test('the determinism ratchet is skipped (never spawned) when the push touches no spec/unit file', () => {
  // The skip path: source, Playwright, wrapper and docs changes carry nothing the
  // ratcheted rules apply to, so pre-push must not pay for a node + ESLint spawn.
  assert.equal(needsDeterminismRatchet([
    'handsontable/src/core.ts',
    'handsontable/src/plugins/filters/filters.ts',
    'tests/e2e/filters/menu.spec.ts', // Playwright bans sleep at error on its own
    'wrappers/react-wrapper/test/hotTable.spec.tsx',
    'handsontable/test/helpers/common.js', // a helper, not a spec
    'handsontable/tmp/plugins/filters/__tests__/filters.spec.js', // build output
    'docs/content/guides/foo.md',
  ]), false);
});

test('the determinism ratchet runs when a frozen-suite spec or a unit test changed', () => {
  assert.equal(needsDeterminismRatchet([
    'handsontable/src/core.ts',
    'handsontable/src/plugins/filters/__tests__/filters.spec.js',
  ]), true);
  assert.equal(needsDeterminismRatchet(['handsontable/src/helpers/__tests__/number.unit.js']), true);
  assert.equal(needsDeterminismRatchet(['handsontable/src/3rdparty/walkontable/test/spec/table.spec.js']), true);
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

test('keeps the diagnosis when console noise sits between the FAIL header and the failure block', () => {
  // The scenario this helper was built for, in Jest's real output order: the
  // suite header, then the buffered console dump, then the failure details. The
  // stylesheet ThemeManager emits is many distinct `--ht-*` lines, so it neither
  // reads as noise nor collapses as a repeat — anchoring on the header hands back
  // the flood and cuts the `●` block, which tells the agent "failing" with no why.
  const cssDump = Array.from({ length: 50 }, () => [
    '  console.error',
    ...Array.from({ length: 40 }, (_, v) => `      --ht-token-${v}: ${v * 7}px;`),
  ].join('\n')).join('\n');
  const condensed = condenseTestOutput([
    'FAIL handsontable/src/plugins/sheetsBar/__tests__/sheetsBar.unit.js',
    '  ● Console',
    cssDump,
    '  ✕ renames a sheet on double-click (12 ms)',
    '  ● SheetsBar › renames a sheet on double-click',
    '    expect(received).toBe(expected)',
    '    Expected: "Sheet2"',
    '    Received: "Sheet1"',
    'Tests:       1 failed, 49 passed, 50 total',
  ].join('\n'));

  assert.ok(condensed.includes('✕ renames a sheet on double-click'), 'the failing test name must survive');
  assert.ok(condensed.includes('Expected: "Sheet2"'), 'the expected value must survive');
  assert.ok(condensed.includes('Received: "Sheet1"'), 'the received value must survive');
  assert.ok(!condensed.includes('--ht-token-'), 'the console flood must not fill the excerpt');
  assert.ok(condensed.includes('Tests:       1 failed'), 'the summary must survive');
});

test('anchors on the FAIL header only when no marker names a failing test', () => {
  // A suite killed before it reported a single test still has a usable anchor.
  const condensed = condenseTestOutput([
    ...Array.from({ length: 200 }, (_, i) => `  ✓ passing case ${i}`),
    'FAIL handsontable/src/plugins/sheetsBar/__tests__/sheetsBar.unit.js',
    '  Killed: 9',
  ].join('\n'), { maxLines: 5 });

  assert.ok(condensed.includes('FAIL handsontable'), 'the header must anchor the excerpt');
  assert.ok(condensed.includes('Killed: 9'), 'what followed it must survive');
  assert.ok(!condensed.includes('passing case 0'), 'the passing prologue must be dropped');
});

test('a Jest config notice never wins the anchor over the real failure', () => {
  const condensed = condenseTestOutput([
    '● Validation Warning:',
    '  Unknown option "foo" with value "bar" was found.',
    ...Array.from({ length: 200 }, (_, i) => `  ✓ passing case ${i}`),
    '  ● SheetsBar › renames a sheet',
    '    expect(received).toBe(expected)',
  ].join('\n'), { maxLines: 6 });

  assert.ok(condensed.includes('● SheetsBar › renames a sheet'), 'the real failure must anchor the excerpt');
  assert.ok(!condensed.includes('Unknown option'), 'the config notice must not anchor it');
});

test('a "test suite failed to run" bullet still anchors the excerpt', () => {
  const condensed = condenseTestOutput([
    ...Array.from({ length: 200 }, (_, i) => `  ✓ passing case ${i}`),
    '  ● Test suite failed to run',
    '    Cannot find module \'./missing\' from \'sheetsBar.unit.js\'',
  ].join('\n'), { maxLines: 4 });

  assert.ok(condensed.includes('● Test suite failed to run'), 'an infra bullet is a failure marker too');
  assert.ok(condensed.includes('Cannot find module'), 'its cause must survive');
});

test('strips SGR escapes so color in the run output cannot defeat the anchor', () => {
  // The run inherits the hook environment; a leaked FORCE_COLOR would otherwise
  // wrap every marker in escape codes and silently break every pattern here.
  const esc = String.fromCharCode(27);
  const red = text => `${esc}[31m${text}${esc}[39m`;
  const condensed = condenseTestOutput([
    ...Array.from({ length: 200 }, (_, i) => `  ${esc}[32m✓${esc}[39m passing case ${i}`),
    `  ${red('✕')} renames a sheet (12 ms)`,
    `  ${red('●')} SheetsBar › renames a sheet`,
    '    expect(received).toBe(expected)',
    `${red('Tests:')}       1 failed, 200 passed, 201 total`,
  ].join('\n'), { maxLines: 6 });

  assert.ok(!condensed.includes(esc), 'escape codes must not reach the excerpt');
  assert.ok(condensed.includes('✕ renames a sheet'), 'the failure must still anchor the excerpt');
  assert.ok(condensed.includes('Tests:       1 failed'), 'the summary must still be recognized');
});

test('counts every dropped line, including the noise filtered before collapsing', () => {
  // Measuring from the post-`isNoise` list under-reports the flood by exactly the
  // part that caused it, so the header contradicted the output it described.
  const condensed = condenseTestOutput([
    '  ✕ a failing test',
    ...Array.from({ length: 100 }, (_, i) => `    at frame${i} (/repo/a.js:${i}:1)`),
    'Tests:       1 failed, 0 passed, 1 total',
  ].join('\n'));
  const dropped = Number(/(\d+) noise\/duplicate lines dropped/.exec(condensed)?.[1]);

  assert.equal(dropped, 100, 'the 100 stack frames must be counted as dropped');
});
