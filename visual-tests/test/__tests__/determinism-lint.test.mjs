// The capture-adjacency rule and the spec docblock rules in `visual-tests/.eslintrc.js`, run through ESLint
// itself on fixtures. A config test that only reads the selector's TEXT cannot tell a rule that works from
// one that matches nothing: esquery accepts the relative `:has(> X)` form without an error and matches
// nothing with it, and a draft of this very rule written that way reported 0 sites on a tree that had 128.
// So every rule here is proved by a fixture that must fire and one that must stay silent.
//
// This file imports ESLint, so it lives outside `lib/__tests__/`, which the root `test:tooling` glob runs in
// a job that installs nothing. It runs from `lint.yml`'s `visual-tests` job through `test:lint-config`,
// a literal path (`handsontable/scripts/tasks.json` explains why a glob would turn a missing file green).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslintPackage from 'eslint';

const { ESLint } = eslintPackage;
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const eslint = new ESLint({ cwd: packageRoot });
const SPEC_PATH = path.join(packageRoot, 'tests/js-only/determinism-lint-fixture.spec.ts');
const CAPTURE_MESSAGE = /^A capture straight after a pointer or keyboard action/;

/**
 * Lint a fixture as if it were a spec, with the shipped config.
 *
 * @param {string} code The fixture's source.
 * @param {string} [filePath] Where to pretend it lives.
 * @returns {Promise<Array<{ruleId: string, line: number, message: string}>>} ESLint's messages.
 */
async function lint(code, filePath = SPEC_PATH) {
  const [result] = await eslint.lintText(code, { filePath });

  return result.messages;
}

/**
 * The lines the capture rule reported.
 *
 * @param {Array<{line: number, message: string}>} messages ESLint's messages.
 * @returns {number[]} One line per capture finding.
 */
const captureLines = messages => messages.filter(m => CAPTURE_MESSAGE.test(m.message)).map(m => m.line);

/**
 * The docblock rules a source reports, and nothing else — a two-line fixture trips unrelated rules.
 *
 * @param {Array<{ruleId: string, line: number}>} messages ESLint's messages.
 * @returns {Array<[string, number]>} `[ruleId, line]` per jsdoc finding.
 */
const docblockFindings = messages => messages
  .filter(m => typeof m.ruleId === 'string' && m.ruleId.startsWith('jsdoc/'))
  .map(m => [m.ruleId, m.line]);

/**
 * A spec body wrapped in a declared, documented test, so only the rule under test can fire.
 *
 * @param {string} body The test body.
 * @returns {string} A complete spec source whose body starts on line 12.
 */
const spec = body => [
  'import { visualTest, expect } from \'../../src/test-runner\';',
  'import { helpers } from \'../../src/helpers\';',
  '',
  '/**',
  ' * Fixture. Owned by DEV-1234.',
  ' */',
  'visualTest(__filename, { themes: [\'main\'], browsers: [\'chromium\'], wrappers: [] }, async({ tablePage }) => {',
  '  const cell = tablePage.locator(\'td\').first();',
  '  const menu = tablePage.locator(\'.htMenu\');',
  '  const box = await cell.boundingBox();',
  '',
  body,
  '});',
  '',
].join('\n');

const CAPTURE = '  await tablePage.screenshot({ path: helpers.screenshotPath() });';

test('a capture straight after each kind of primitive is reported, on the capture line', async() => {
  // The four shapes the rule exists for, plus the modern spelling of `type()`. The message lands on the
  // capture (esquery `A + B` reports B), which is the line the disable directive has to sit above.
  const actions = [
    '  await tablePage.keyboard.press(\'Tab\');',
    '  await cell.click();',
    '  await tablePage.mouse.move(box!.x, box!.y);',
    '  await cell.hover();',
    '  await cell.pressSequentially(\'abc\');',
    '  await tablePage.touchscreen.tap(1, 1);',
    '  await cell.focus();',
    // An action whose result is kept is still an action: the half that matches it takes a declaration.
    '  const clicked = await cell.click();',
  ];
  const results = await Promise.all(actions.map(action => lint(spec(`${action}\n${CAPTURE}`))));

  results.forEach((messages, i) => {
    assert.deepEqual(captureLines(messages), [13], `not reported after: ${actions[i].trim()}`);
  });
});

test('a capture that is not awaited is still a capture', async() => {
  // The capture half has two branches, `await x.screenshot()` and a bare `x.screenshot()`; nothing in the tree
  // uses the second, so only this keeps it from being deleted with every other test green.
  const body = '  await cell.click();\n  tablePage.screenshot({ path: helpers.screenshotPath() });';

  assert.deepEqual(captureLines(await lint(spec(body))), [13]);
});

test('the blind spots visual-tests/AGENTS.md lists are real', async() => {
  // Adjacency judges the one statement before the capture, and only an expression or a declaration. These
  // shapes are documented as unseen; if the rule starts seeing one, update the "What the capture rule cannot
  // see" bullet with it rather than deleting the case.
  const unseen = [
    '  if (box) {\n    await cell.click();\n  }',
    '  try {\n    await cell.click();\n  } finally {\n    await cell.blur();\n  }',
    '  await cell.click();\n  const other = await cell.boundingBox();',
  ];
  const results = await Promise.all(unseen.map(before => lint(spec(`${before}\n${CAPTURE}`))));

  results.forEach((messages, i) => {
    assert.deepEqual(captureLines(messages), [], `the documented blind spot is now reported: ${unseen[i]}`);
  });
});

test('a comment between the action and the capture does not hide it', async() => {
  // Comments are not AST siblings, so `// take a screenshot of …` — the shape escaping-the-menu.spec.ts
  // had at every one of its sixteen captures — still counts as "straight after".
  const body = `  await tablePage.keyboard.press('Escape');\n\n  // take a screenshot\n${CAPTURE}`;

  assert.deepEqual(captureLines(await lint(spec(body))), [15]);
});

test('an action nested inside the previous statement still counts', async() => {
  // The action half is a descendant match on purpose: ten clicks folded into a `reduce()` (sheetsBar/tabs)
  // acted just as much as one.
  const messages = await lint(spec(
    `  await [1, 2].reduce(previous => previous.then(() => cell.click()), Promise.resolve());\n${CAPTURE}`,
  ));

  assert.deepEqual(captureLines(messages), [13]);
});

test('an asserted state between the action and the capture keeps it quiet', async() => {
  const assertions = [
    '  await expect(cell).toBeFocused();',
    '  await expect(menu).toBeHidden();',
    '  await menu.waitFor();',
  ];
  const results = await Promise.all(assertions.map(between => lint(
    spec(`  await tablePage.keyboard.press('Tab');\n${between}\n${CAPTURE}`),
  )));

  results.forEach((messages, i) => {
    assert.deepEqual(captureLines(messages), [], `reported although the state was asserted: ${assertions[i].trim()}`);
  });
});

test('a capture with nothing before it, or after a non-action, is not reported', async() => {
  assert.deepEqual(captureLines(await lint(spec(CAPTURE))), []);
  assert.deepEqual(captureLines(await lint(spec(`  await cell.scrollIntoViewIfNeeded();\n${CAPTURE}`))), []);
});

test('a test that acts followed by a test that captures is not a capture after an action', async() => {
  // The regression this rule shipped with and caught on the tree: with a descendant `:has()` on the
  // capture half, a whole `visualTest(…)` statement whose body captures matched as "a capture", right
  // after the previous test's statement matched as "an action". cross-browser/copy-paste.spec.ts has that
  // shape twice, and the rule reported the second test CALL. The capture half is the statement's own call.
  const source = [
    'import { visualTest } from \'../../src/test-runner\';',
    'import { helpers } from \'../../src/helpers\';',
    '',
    '/**',
    ' * First. Owned by DEV-1234.',
    ' */',
    'visualTest(\'acts\', { themes: [\'main\'], browsers: [\'chromium\'], wrappers: [] }, async({ tablePage }) => {',
    '  await tablePage.keyboard.press(\'Tab\');',
    '});',
    '',
    '/**',
    ' * Second. Owned by DEV-1234.',
    ' */',
    'visualTest(\'captures\', { themes: [\'main\'], browsers: [\'chromium\'], wrappers: [] }, '
      + 'async({ tablePage }) => {',
    '  await tablePage.screenshot({ path: helpers.screenshotPath() });',
    '});',
    '',
  ].join('\n');

  assert.deepEqual(captureLines(await lint(source)), []);
});

test('the shipped selectors avoid the forms esquery silently ignores', async() => {
  // The fixtures above are the real proof; this names the trap for whoever edits the rule next.
  const config = await eslint.calculateConfigForFile(SPEC_PATH);
  const [, ...entries] = config.rules['no-restricted-syntax'];
  const capture = entries.find(entry => CAPTURE_MESSAGE.test(entry.message));

  assert.ok(capture, 'no capture-adjacency entry in the spec override');
  assert.doesNotMatch(capture.selector, /:has\(\s*>/, 'relative :has(> …) matches nothing in esquery 1.7');
  assert.doesNotMatch(capture.selector, /~/, '`~` matches any earlier sibling, not the one before');
});

test('the rule is an error for specs and for src/, and the docblock rules are spec-only', async() => {
  // `no-restricted-syntax` is one rule id with one severity, so the capture rule is an error or nothing.
  // It is carried in both overrides because the spec override restates the whole list.
  const specConfig = await eslint.calculateConfigForFile(SPEC_PATH);
  const srcConfig = await eslint.calculateConfigForFile(path.join(packageRoot, 'src/page-helpers.ts'));

  [['a spec', specConfig], ['src/', srcConfig]].forEach(([where, config]) => {
    const [level, ...entries] = config.rules['no-restricted-syntax'];

    assert.equal(level, 'error', `no-restricted-syntax is not an error for ${where}`);
    assert.ok(entries.some(entry => CAPTURE_MESSAGE.test(entry.message)), `no capture rule for ${where}`);
  });

  const [specJsdocLevel, specJsdocOptions] = specConfig.rules['jsdoc/require-jsdoc'];

  assert.equal(specJsdocLevel, 'error');
  assert.ok(specJsdocOptions.contexts.some(context => context.includes('visualTest')),
    'the docblock context does not name visualTest(), so it matches nothing after the variant declaration');
  assert.equal(specConfig.rules['jsdoc/match-description'][0], 'error');
  assert.equal(srcConfig.rules['jsdoc/match-description'][0], 'off');
});

test('giving the docblock rule a context does not stop it asking for function docblocks', async() => {
  // Checked by behavior, not by reading the option back: ESLint fills a rule's schema defaults into the
  // options it reports, so `require.FunctionDeclaration` reads true whether or not the config sets it.
  // What matters is that a function in a spec still needs its block now that `contexts` is set.
  const messages = await lint('export function helper() {\n  return 1;\n}\n');

  assert.deepEqual(docblockFindings(messages), [['jsdoc/require-jsdoc', 1]]);
});

test('a test call needs a docblock, and the docblock needs a ticket', async() => {
  const call = 'visualTest(__filename, { themes: [\'main\'], browsers: [\'chromium\'], wrappers: [] }, async() => {});';
  const rulesOf = async source => docblockFindings(await lint(source)).map(([ruleId]) => ruleId);

  assert.deepEqual(await rulesOf(`${call}\n`), ['jsdoc/require-jsdoc']);
  assert.deepEqual(await rulesOf(`/**\n * Checks something.\n */\n${call}\n`), ['jsdoc/match-description']);
  assert.deepEqual(await rulesOf(`/**\n * Checks something. Owned by DEV-1234.\n */\n${call}\n`), []);
  assert.deepEqual(await rulesOf(`/**\n * Checks something, reported in #12345.\n */\n${call}\n`), []);
});

test('a looped test gets a docblock per inner call', async() => {
  // Five cross-browser specs register one test per demo URL from inside `urls.forEach()`; the jsdoc plugin
  // attaches the block to the call's own statement, inside the loop.
  const looped = '[\'/a\'].forEach((url) => {\n  visualTest(url, { themes: [\'classic\'], browsers: [\'chromium\'], '
    + 'wrappers: [] }, async() => {});\n});\n';
  const messages = await lint(looped, path.join(packageRoot, 'tests/cross-browser/fixture.spec.ts'));

  assert.deepEqual(docblockFindings(messages), [['jsdoc/require-jsdoc', 2]]);
});

test('the spec template\'s placeholder ticket fails until it is replaced', async() => {
  // The template tells whoever copies it that the lint rejects a block naming no ticket. ESLint never lints
  // the dotfile itself, so this lints its source as the spec a copy would become — at the same depth, so
  // its relative imports still resolve.
  const template = readFileSync(path.join(packageRoot, 'tests/multi-frameworks/.empty-test-template.ts'), 'utf8');
  const messages = await lint(template);

  assert.deepEqual(docblockFindings(messages).map(([ruleId]) => ruleId), ['jsdoc/match-description']);
  assert.deepEqual(captureLines(messages), [], 'the template itself captures after an unasserted action');
});

test('the messages name the fix and the escape hatch', async() => {
  // The register of the shipped determinism messages: what to do instead, the tracked exception, the doc.
  const config = await eslint.calculateConfigForFile(SPEC_PATH);
  const [, ...entries] = config.rules['no-restricted-syntax'];
  const capture = entries.find(entry => CAPTURE_MESSAGE.test(entry.message)).message;

  assert.match(capture, /toBeFocused\(\)/);
  assert.match(capture, /eslint-disable-next-line no-restricted-syntax -- DEV-1234: <why>/);
  assert.match(capture, /visual-tests\/AGENTS\.md \(Determinism\)/);
  assert.match(config.rules['jsdoc/match-description'][1].message, /visual-tests\/AGENTS\.md \(Determinism\)/);
});

/**
 * Every spec file under `tests/`.
 *
 * @param {string} dir The directory to walk.
 * @returns {string[]} Absolute paths.
 */
function specFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);

    if (statSync(full).isDirectory()) {
      return specFiles(full);
    }

    return name.endsWith('.spec.ts') ? [full] : [];
  });
}

const TRACKED_CAPTURE = new RegExp('eslint-disable-next-line no-restricted-syntax -- (DEV|PRO|SU)-\\d+: '
  + 'capture after an unasserted ');

test('every tracked capture exception sits on a capture and still suppresses something', async() => {
  // A directive above anything but a capture is the wrong line (the pre-fix selector put two above test
  // calls), and a directive left behind after the state is asserted is debt counted that no longer exists.
  // Both are silent in `npm run lint`, which does not report unused directives.
  const misplaced = [];

  specFiles(path.join(packageRoot, 'tests')).forEach((file) => {
    const lines = readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, i) => {
      if (TRACKED_CAPTURE.test(line) && !/\.screenshot\(/.test(lines[i + 1] ?? '')) {
        misplaced.push(`${path.relative(packageRoot, file)}:${i + 1}`);
      }
    });
  });

  assert.deepEqual(misplaced, [], 'a tracked capture exception must sit directly above the capture it excuses');

  const unused = await new ESLint({ cwd: packageRoot, reportUnusedDisableDirectives: 'error' })
    .lintFiles(['tests/**/*.spec.ts']);

  // A glob that silently matched nothing would pass everything below.
  assert.ok(unused.length >= 100, `linted ${unused.length} specs; the tree has more than 100`);

  const stale = unused.flatMap(result => result.messages
    .filter(m => m.ruleId === null && /Unused eslint-disable directive/.test(m.message))
    .filter(m => TRACKED_CAPTURE.test(readFileSync(result.filePath, 'utf8').split('\n')[m.line - 1]))
    .map(m => `${path.relative(packageRoot, result.filePath)}:${m.line}`));

  assert.deepEqual(stale, [], 'these capture exceptions excuse nothing any more; delete them');
});
