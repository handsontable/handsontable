import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUNDLES_TAG,
  FULL_MATRIX_ENV,
  IGNORE_COMMENT,
  LEG_TAG_LIKE,
  SURFACE_MARKERS,
  TAG_CONSTANTS,
  THEMES_TAG,
  checkSpec,
  findMarkerHits,
  fixturesNamed,
  isTypeOnlyModule,
  legGrep,
  legsOf,
  parseFullMatrix,
  projectsOf,
  readBlocks,
  readGeometryHelpers,
  readIgnores,
  relativeImports,
  scanFixtureHtml,
  scanSource,
  tagLookahead,
} from '../leg-declarations.mjs';

// tests/AGENTS.md ("Declaring the legs"): a spec runs on `e2e-main` only unless its top-level blocks
// carry THEMES_TAG or BUNDLES_TAG, and the five other legs grep for those tags. Two things go wrong
// silently with that. A spec can touch a theme or bundle surface (a computed style, a token, a branch
// on the theme, HyperFormula) without declaring the axis, and the one leg it runs on then never sees
// what the other legs would have caught; the nightly's full matrix is the only place it would turn
// red. And a declaration can be written wrong (a bare string one typo off, a misspelled constant that
// evaluates to `undefined`, a tag on one block of three), and Playwright accepts every one of those
// without a word. The module tests below pin the rules; the sweep at the end reads every spec, the
// page objects it imports and the fixtures those name, and fails with the file, the marker and the
// fix.
//
// Text-based, like visual-tests/lib/__tests__/visual-declarations.test.mjs: the root tooling job
// installs no dependencies, so neither the config nor a TypeScript parser can be imported.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPEC_IMPORTS = 'import { test, expect, THEMES_TAG, BUNDLES_TAG, CROSS_BROWSER_TAG } from \'../fixtures/test\';\n';
const STRING_TAG = JSON.stringify(THEMES_TAG).replace(/"/g, '\'');

/**
 * A synthetic spec: the import line, then the body.
 *
 * @param {string} body The body.
 * @returns {string} The source.
 */
function spec(body) {
  return `${SPEC_IMPORTS}\n${body}\n`;
}

/**
 * A synthetic describe with an optional details argument.
 *
 * @param {string|null} details The details argument's source, or `null` for none.
 * @param {string} inner The body.
 * @param {string} [title] The title.
 * @returns {string} The source.
 */
function describe(details, inner, title = '\'suite\'') {
  return `test.describe(${title}, ${details ? `${details}, ` : ''}() => {\n${inner}\n});\n`;
}

const PLAIN_TEST = 'test(\'does a thing\', async({ page, theme, bundle }) => {\n  expect(1).toBe(1);\n});';

/**
 * The violations of a synthetic spec, by rule.
 *
 * @param {string} source The spec's source.
 * @param {object} [extra] Modules and fixtures.
 * @returns {string[]} The rule ids, in order.
 */
function rulesOf(source, extra = {}) {
  return checkSpec({ file: 'e2e/probe.spec.ts', source, ...extra }).violations.map(violation => violation.rule);
}

/**
 * The violation messages of a synthetic spec.
 *
 * @param {string} source The spec's source.
 * @param {object} [extra] Modules and fixtures.
 * @returns {string} The messages, joined.
 */
function messagesOf(source, extra = {}) {
  return checkSpec({ file: 'e2e/probe.spec.ts', source, ...extra }).violations.map(violation => violation.message).join('\n');
}

test('parseFullMatrix reads "1" as on, "0", "" and unset as off, and refuses anything else', () => {
  assert.equal(parseFullMatrix('1'), true);
  assert.equal(parseFullMatrix('0'), false);
  assert.equal(parseFullMatrix(''), false);
  assert.equal(parseFullMatrix(undefined), false);
  // A night meant to run everything must not run the reduced shape on a value the config did not read.
  for (const raw of ['true', 'yes', ' 1', 'on', '2']) {
    assert.throws(() => parseFullMatrix(raw), new RegExp(`${FULL_MATRIX_ENV} must be "1"`), raw);
  }
});

test('legGrep runs everything on e2e-main and in the full matrix, and greps for the tags elsewhere', () => {
  assert.equal(legGrep({ theme: 'main', bundle: 'umd' }), undefined);
  assert.ok(legGrep({ theme: 'horizon', bundle: 'umd' }) instanceof RegExp);
  assert.ok(legGrep({ theme: 'classic', bundle: 'umd' }) instanceof RegExp);
  assert.ok(legGrep({ theme: 'main', bundle: 'full-min' }) instanceof RegExp);
  assert.ok(legGrep({ theme: 'horizon', bundle: 'full-min' }) instanceof RegExp);

  for (const theme of ['main', 'horizon', 'classic']) {
    for (const bundle of ['umd', 'full-min']) {
      assert.equal(legGrep({ theme, bundle, fullMatrix: true }), undefined, `${theme} ${bundle} in the full matrix`);
    }
  }
});

test('the greps match the tags as tokens of the string Playwright greps, and nothing that merely looks like one', () => {
  // Playwright greps `<project> <file> <describe titles, each followed by its tags> <test title>
  // <test tags>`, space-joined (`_grepTitleWithTags()`), with `RegExp#test`.
  const themes = legGrep({ theme: 'horizon', bundle: 'umd' });
  const bundles = legGrep({ theme: 'main', bundle: 'full-min' });
  const both = legGrep({ theme: 'classic', bundle: 'full-min' });
  const title = (tags, testTags = '') => `e2e-horizon e2e/some.spec.ts suite ${tags} does a thing ${testTags}`.trim();

  assert.equal(themes.test(title(THEMES_TAG)), true, 'a describe tag');
  assert.equal(themes.test(title('', THEMES_TAG)), true, 'a test tag at the very end');
  assert.equal(themes.test(`${THEMES_TAG} ${title('')}`), true, 'at the very start');
  assert.equal(themes.test(title(`@core ${THEMES_TAG} @cross-browser`)), true, 'among other tags');
  assert.equal(themes.test(title(BUNDLES_TAG)), false, 'the other axis alone');
  assert.equal(themes.test('e2e-horizon e2e/theme-switch.spec.ts theme switch keeps the theme'), false,
    'a file and a title about themes carry no tag');
  assert.equal(themes.test(title(`foo${THEMES_TAG}`)), false, 'glued to a word');
  assert.equal(themes.test(title(`${THEMES_TAG}-extra`)), false, 'a longer tag with the same prefix');
  assert.equal(themes.test(title(`${THEMES_TAG}s`)), false, 'a plural');

  assert.equal(bundles.test(title(BUNDLES_TAG)), true);
  assert.equal(bundles.test(title(THEMES_TAG)), false);

  assert.equal(both.test(title(`${THEMES_TAG} ${BUNDLES_TAG}`)), true, 'both, in order');
  assert.equal(both.test(title(`${BUNDLES_TAG} ${THEMES_TAG}`)), true, 'both, reversed');
  assert.equal(both.test(title(THEMES_TAG, BUNDLES_TAG)), true, 'one on the describe, one on the test');
  assert.equal(both.test(title(THEMES_TAG)), false, 'one of two is not both');
  assert.equal(both.test(title(BUNDLES_TAG)), false);
  assert.equal(both.test(title('@core @cross-browser')), false);

  // `lastIndex` never matters (Playwright resets it, and these regexes are not global).
  assert.equal(themes.global, false);
  assert.equal(tagLookahead('@a.b'), '(?=[\\s\\S]*(?<!\\S)@a\\.b(?!\\S))', 'metacharacters are escaped');
  assert.ok(new RegExp(tagLookahead('@a\\b')).test('x @a\\b y'), 'a backslash is escaped too');
  assert.ok(!new RegExp(tagLookahead('@a\\b')).test('x @ab y'));
});

test('legsOf and projectsOf are the truth table the greps implement', () => {
  assert.deepEqual(legsOf([]), { themes: false, bundles: false });
  assert.deepEqual(legsOf([THEMES_TAG, '@core']), { themes: true, bundles: false });
  assert.deepEqual(legsOf([BUNDLES_TAG]), { themes: false, bundles: true });
  assert.deepEqual(legsOf([BUNDLES_TAG, THEMES_TAG]), { themes: true, bundles: true });

  assert.deepEqual(projectsOf({ themes: false, bundles: false }), ['e2e-main']);
  assert.deepEqual(projectsOf({ themes: true, bundles: false }), ['e2e-main', 'e2e-horizon', 'e2e-classic']);
  assert.deepEqual(projectsOf({ themes: false, bundles: true }), ['e2e-main', 'e2e-main-min']);
  assert.deepEqual(projectsOf({ themes: true, bundles: true }),
    ['e2e-main', 'e2e-horizon', 'e2e-classic', 'e2e-main-min', 'e2e-horizon-min', 'e2e-classic-min']);

  // The greps agree with the table on every leg and declaration.
  const legs = [
    ['e2e-main', 'main', 'umd'], ['e2e-horizon', 'horizon', 'umd'], ['e2e-classic', 'classic', 'umd'],
    ['e2e-main-min', 'main', 'full-min'], ['e2e-horizon-min', 'horizon', 'full-min'], ['e2e-classic-min', 'classic', 'full-min'],
  ];

  for (const themes of [false, true]) {
    for (const bundles of [false, true]) {
      const tags = [themes ? THEMES_TAG : '', bundles ? BUNDLES_TAG : ''].join(' ');
      const title = `project e2e/x.spec.ts suite ${tags} test`;
      const expected = projectsOf({ themes, bundles });

      for (const [name, theme, bundle] of legs) {
        const grep = legGrep({ theme, bundle });

        assert.equal(grep === undefined || grep.test(title), expected.includes(name),
          `${name} with themes=${themes} bundles=${bundles}`);
      }
    }
  }
});

test('scanSource blanks comments in both views and strings in the masked view only', () => {
  const source = [
    '// test.describe(\'in a line comment\', () => {}); getComputedStyle(',
    '/* test(\'in a block\n   comment\') elementFromPoint */',
    'const label = \'test.describe( in a string --ht-foo\';',
    'const quoted = "it\'s \\"fine\\" // not a comment";',
    'const glob = \'**/fixture-image/*.svg\';',
    'await page.goto(\'/demo/grid.html\');',
    '',
  ].join('\n');
  const { code, masked, literals } = scanSource(source, 'probe.spec.ts');

  assert.equal(code.length, source.length);
  assert.equal(masked.length, source.length);
  assert.equal(code.split('\n').length, source.split('\n').length, 'line breaks survive');
  assert.ok(!code.includes('in a line comment') && !code.includes('in a block'), 'comments are blanked');
  assert.ok(!code.includes('elementFromPoint'), 'a marker in a comment is gone');
  assert.ok(code.includes('test.describe( in a string --ht-foo'), 'a string survives in code');
  assert.ok(!masked.includes('in a string'), 'and is blanked in masked');
  assert.ok(masked.includes('\'                                   \''), 'its quotes stay');
  assert.ok(masked.includes('await page.goto('), 'the glob string did not open a block comment');
  assert.ok(code.includes('it\'s \\"fine\\" // not a comment'), 'an apostrophe and a // inside a string are text');
  assert.deepEqual(literals.map(literal => literal.value), [
    'test.describe( in a string --ht-foo', 'it\'s \\"fine\\" // not a comment', '**/fixture-image/*.svg', '/demo/grid.html',
  ]);
  assert.equal(source.slice(literals[3].start, literals[3].end), '/demo/grid.html', 'positions index the source');
});

test('scanSource walks a template literal\'s expressions as code and blanks its text', () => {
  const inner = '${';
  const source = `test.describe(\`drag (${inner}direction} ${inner}x ? 'y' : "z\\"w"} \`, () => {\n`
    + `  const t = \`a ${inner}\`nested ${inner}1 + 1}\`} b\`;\n});\n`;
  const { code, masked, literals } = scanSource(source);

  assert.equal(masked.length, source.length);
  assert.ok(!masked.includes('drag (') && !masked.includes('nested'), 'the text chunks are blanked');
  assert.ok(masked.includes(`test.describe(\`      ${inner}direction} ${inner}x ? ' ' : "    "} \``),
    'the expressions are kept as code, with their own strings blanked as strings');
  assert.ok(masked.includes(`${inner}1 + 1}`), 'a nested template\'s expression is walked');
  assert.ok(code.includes('drag (') && code.includes('nested'), 'code keeps the text');
  assert.deepEqual(literals.filter(literal => literal.value.trim() !== '').map(literal => literal.value.trim()),
    ['drag (', 'y', 'z\\"w', 'a', 'nested', 'b']);
});

test('scanSource reads a regular expression as one token and a division as code', () => {
  const source = [
    'const re = /it\'s \\/\\/ "quoted" [/]x/g;',
    'const after = total / 2;',
    'function f() { return /a\'b/.test(s); }',
    'const half = (a + b) / 2 / c;',
    'const text = `${a / 2}`;',
    '',
  ].join('\n');
  const { code, masked } = scanSource(source);

  assert.ok(masked.includes('const re = /'), 'the regex opens');
  assert.ok(!masked.includes('quoted'), 'its body is blanked in masked');
  assert.ok(code.includes('"quoted"'), 'and kept in code');
  assert.ok(masked.includes('const after = total / 2;'), 'a division after an identifier is code');
  assert.ok(masked.includes('return /') && !masked.includes('a\'b'), 'a regex after return is a regex');
  assert.ok(masked.includes('(a + b) / 2 / c'), 'divisions after a bracket and a number');
  assert.ok(masked.includes('a / 2'), 'a division inside a template expression');
  // A slash that cannot close on its line is a division after all, never a swallowed file.
  const divided = scanSource('const x = a } / 2;\nconst y = 3;\n');

  assert.ok(divided.masked.includes('const y = 3;'));
});

test('scanSource throws, naming the file and the line, on text it cannot close', () => {
  assert.throws(() => scanSource('const a = 1;\nconst s = \'open\n', 'e2e/x.spec.ts'),
    /e2e\/x\.spec\.ts: a string literal opened at line 2 and never closed/);
  assert.throws(() => scanSource('const t = `open', 'e2e/y.spec.ts'), /e2e\/y\.spec\.ts: a template literal opened at line 1/);
  assert.throws(() => scanSource('/* open', 'e2e/z.spec.ts'), /a block comment opened at line 1/);
  assert.throws(() => scanSource('const t = `a ${ b ;', 'e2e/w.spec.ts'), /a template expression opened at line 1/);
});

test('readBlocks finds every test and describe with its depth, wherever it sits', () => {
  const inner = '${';
  const source = spec([
    'test.describe.configure({ mode: \'serial\' });',
    'test.use({ hasTouch: true });',
    'test.beforeEach(async({ page }) => {});',
    describe('{ tag: THEMES_TAG }', `  ${PLAIN_TEST}\n  test.describe('nested', () => {\n    ${PLAIN_TEST}\n  });`),
    'for (const direction of [\'ltr\', \'rtl\'] as const) {',
    `  test.describe(\`drag (${inner}direction})\`, { tag: [CROSS_BROWSER_TAG, THEMES_TAG] }, () => {`,
    `    ${PLAIN_TEST}`,
    '  });',
    '}',
    '// test(\'in a comment\', () => {});',
    'const title = \'test(\\\'in a string\\\')\';',
    'test(\'bare\', { tag: THEMES_TAG }, async() => {});',
    'test.describe.serial(\'serial\', { tag: THEMES_TAG }, () => {});',
  ].join('\n'));
  const blocks = readBlocks(source, 'probe.spec.ts');

  assert.deepEqual(blocks.map(block => [block.callee, block.depth, block.title]), [
    ['test.describe', 0, '\'suite\''],
    ['test', 1, '\'does a thing\''],
    ['test.describe', 1, '\'nested\''],
    ['test', 2, '\'does a thing\''],
    ['test.describe', 0, `\`drag (${inner}direction})\``],
    ['test', 1, '\'does a thing\''],
    ['test', 0, '\'bare\''],
    ['test.describe.serial', 0, '\'serial\''],
  ]);
  assert.deepEqual(blocks.filter(block => block.depth === 0).map(block => block.tags),
    [[THEMES_TAG], ['@cross-browser', THEMES_TAG], [THEMES_TAG], [THEMES_TAG]]);
  assert.deepEqual(blocks[0].details.items.map(item => item.kind), ['identifier']);
  assert.equal(blocks[1].details, null, 'a two-argument call has no details');
  assert.equal(blocks[0].line, 6, 'the import line, a blank, configure, use, beforeEach, then the describe');
});

test('readBlocks reads the shapes of details that exist today, and names what it cannot resolve', () => {
  const read = details => readBlocks(spec(describe(details, PLAIN_TEST)))[0].details;

  assert.deepEqual(read('{ tag: \'@core\' }').tags, ['@core']);
  assert.deepEqual(read('{ tag: [\'@walkontable\', BUNDLES_TAG] }').tags, ['@walkontable', BUNDLES_TAG]);
  assert.deepEqual(read('{ tag: [CROSS_BROWSER_TAG, CLIPBOARD_SHORTCUT_TAG] }').tags,
    [TAG_CONSTANTS.CROSS_BROWSER_TAG, TAG_CONSTANTS.CLIPBOARD_SHORTCUT_TAG]);
  assert.deepEqual(read('{ annotation: { type: \'issue\', description: \'x, y\' }, tag: THEMES_TAG }').tags, [THEMES_TAG],
    'a property holding a comma does not split the tag off');
  assert.deepEqual(read('{\n  tag: [\n    THEMES_TAG,\n    BUNDLES_TAG,\n  ],\n}').tags, [THEMES_TAG, BUNDLES_TAG],
    'one per line, trailing commas');
  assert.deepEqual(read('{ annotation: { type: \'issue\' } }').tags, [], 'an object without a tag');
  assert.equal(read('quarantined(\'DEV-1234\', \'2026-10-30\', \'why\')').kind, 'quarantined');
  assert.equal(read('details').kind, 'unreadable');
  assert.deepEqual(read('{ tag: THEME_TAG }').items.map(item => item.kind), ['unknown-identifier']);
  assert.deepEqual(read('{ tag: [THEMES_TAG, tags.extra] }').items.map(item => item.kind), ['identifier', 'unreadable']);
});

test('readIgnores reads the opt-out grammar and nothing like it', () => {
  const source = [
    `// ${IGNORE_COMMENT} theme-compare -- the fixture pins the main theme; the spec tests the engine`,
    `  // ${IGNORE_COMMENT} css-token`,
    `// ${IGNORE_COMMENT} formulas --`,
    `const note = '// ${IGNORE_COMMENT} hit-test -- not a comment';`,
    `/* ${IGNORE_COMMENT} geometry -- not a line comment */`,
  ].join('\n');

  assert.deepEqual(readIgnores(source), [
    { marker: 'theme-compare', why: 'the fixture pins the main theme; the spec tests the engine', line: 1 },
    { marker: 'css-token', why: '', line: 2 },
    { marker: 'formulas', why: '', line: 3 },
  ]);
});

test('relativeImports lists the runtime imports and skips import type', () => {
  const code = [
    'import { test, expect } from \'../fixtures/test\';',
    'import type { Shape } from \'../fixtures/pages/Types\';',
    'import { type Only, Runtime } from \'../fixtures/pages/Mixed\';',
    'import \'../fixtures/side-effect\';',
    'import { X } from "../fixtures/pages/Quoted";',
    'const lazy = await import(\'../fixtures/pages/Lazy\');',
    'import { Y } from \'@playwright/test\';',
    'import { Z } from \'../fixtures/test\';',
  ].join('\n');

  assert.deepEqual(relativeImports(code), [
    '../fixtures/test', '../fixtures/pages/Mixed', '../fixtures/side-effect', '../fixtures/pages/Quoted',
    '../fixtures/pages/Lazy',
  ]);
});

test('isTypeOnlyModule tells a module of types from one with runtime exports', () => {
  assert.equal(isTypeOnlyModule('export type A = 1;\nexport interface B { x: number }\ndeclare global { interface Window { hot: B } }'), true);
  assert.equal(isTypeOnlyModule('export type A = 1;\nexport const B = 2;'), false);
  assert.equal(isTypeOnlyModule('export abstract class Page {}'), false);
  assert.equal(isTypeOnlyModule('const x = 1;\nexport { x };'), false);
  assert.equal(isTypeOnlyModule('export async function f() {}'), false);
});

test('fixturesNamed resolves .html names by path and unique basename, and bare names only beside a dynamic one', () => {
  const index = new Map([
    ['grid.html', 'grid.html'],
    ['numeric.html', 'numeric.html'],
    ['numeric-formulas.html', 'numeric-formulas.html'],
    ['walkontable/overlays.html', 'walkontable/overlays.html'],
    ['overlays.html', 'walkontable/overlays.html'],
  ]);
  const scanned = source => scanSource(source);

  // A full path resolves through its relative path once the directory prefix is dropped, so a second
  // fixture with the same basename (which deletes the basename key) cannot make it vanish: a top-level
  // fixture's relative path IS its basename, and a nested one's path still resolves.
  const ambiguous = new Map([['grid.html', 'grid.html'], ['walkontable/grid.html', 'walkontable/grid.html'],
    ['walkontable/x.html', 'walkontable/x.html'], ['other/x.html', 'other/x.html']]);

  assert.deepEqual(fixturesNamed([scanned('goto(`/tests/fixtures/demo/grid.html?theme=${theme}`)')], ambiguous), ['grid.html']);
  assert.deepEqual(fixturesNamed([scanned('goto(`/tests/fixtures/demo/walkontable/grid.html`)')], ambiguous), ['walkontable/grid.html']);
  assert.deepEqual(fixturesNamed([scanned('const f = \'fixtures/demo/walkontable/grid.html\';')], ambiguous), ['walkontable/grid.html']);
  assert.deepEqual(fixturesNamed([scanned('const f = \'grid.html\';')], ambiguous), ['grid.html'], 'the top-level fixture, by its relative path');
  assert.deepEqual(fixturesNamed([scanned('const f = \'x.html\';')], ambiguous), [], 'a bare basename two nested fixtures share resolves nothing');

  assert.deepEqual(fixturesNamed([scanned('await page.goto(\'/tests/fixtures/demo/grid.html?theme=main\');')], index), ['grid.html']);
  assert.deepEqual(fixturesNamed([scanned('goto(`/tests/fixtures/demo/walkontable/overlays.html?x=${x}`)')], index),
    ['walkontable/overlays.html']);
  assert.deepEqual(fixturesNamed([scanned('const f = \'overlays.html\';')], index), ['walkontable/overlays.html'],
    'a unique basename resolves');
  assert.deepEqual(fixturesNamed([scanned('const name = \'numeric-formulas\';')], index), [],
    'a bare name alone is a word, not a fixture');
  assert.deepEqual(fixturesNamed([
    scanned('new Grid(page, theme, bundle, \'numeric-formulas\');'),
    scanned('class Grid { constructor(page, theme, bundle, fixture = \'numeric\') {}\n'
      + '  goto() { return this.page.goto(`/tests/fixtures/demo/${this.fixture}.html`); } }'),
  ], index), ['numeric-formulas.html', 'numeric.html'], 'beside a dynamic name, bare literals of the whole set resolve');
  assert.deepEqual(fixturesNamed([scanned('// demo/grid.html in a comment')], index), [], 'a comment names nothing');
  assert.deepEqual(fixturesNamed([scanned('goto(\'/demo/unknown.html\')')], index), [], 'an unknown file is skipped');

  // Beside a dynamic name, a spec's bare literals count only inside a constructor call: a test id or a
  // shortcut context named 'grid' must not pull `grid.html` and its markers into the spec.
  const dynamicPage = scanned('class Grid {\n  readonly fixture: \'numeric\' | \'numeric-formulas\';\n'
    + '  constructor(page, theme, bundle, fixture = \'numeric\') { this.fixture = fixture; }\n'
    + '  cell() { return this.page.getByTestId(\'grid\'); }\n'
    + '  goto() { return this.page.goto(`/tests/fixtures/demo/${this.fixture}.html`); } }');

  assert.deepEqual(fixturesNamed([
    scanned('const grid = new Grid(page, theme, bundle, \'numeric-formulas\');\nawait page.getByTestId(\'grid\').click();\n'
      + 'expect(context).toBe(\'grid\');'),
    dynamicPage,
  ], index), ['numeric-formulas.html', 'numeric.html'], 'the constructor argument resolves, the test id does not');
  assert.deepEqual(fixturesNamed([scanned('await page.getByTestId(\'grid\').click();'), dynamicPage], index),
    ['numeric-formulas.html', 'numeric.html'], 'no constructor argument: the page object\'s own default and union, never its test id');
});

test('scanFixtureHtml blanks HTML comments and script comments, and keeps styles and markup', () => {
  const html = [
    '<!-- --ht-in-a-comment getComputedStyle( -->',
    '<style>.x { color: var(--ht-foreground-color); }</style>',
    '<script>',
    '  // getComputedStyle( in a js comment',
    '  const s = "elementFromPoint in a string";',
    '  /* HyperFormula in a block */',
    '</script>',
    '<script src="/tests/node_modules/hyperformula/dist/hyperformula.full.min.js"></script>',
  ].join('\n');
  const code = scanFixtureHtml(html, 'probe.html');

  assert.ok(!code.includes('in-a-comment') && !code.includes('in a js comment') && !code.includes('in a block'));
  assert.ok(code.includes('var(--ht-foreground-color)'), 'a style block is read');
  assert.ok(code.includes('elementFromPoint in a string'), 'a script string is read');
  assert.ok(code.includes('hyperformula.full.min.js'), 'markup is read');
  assert.equal(code.split('\n').length, html.split('\n').length);

  // A closing tag with whitespace before its `>` still closes the script: otherwise the body would run on
  // into the markup below and a comment there would hide the markup's markers (CodeQL, bad HTML filtering).
  for (const closer of ['</script >', '</script\t\n bar>', '</SCRIPT>']) {
    const spaced = scanFixtureHtml(`<script>\n  // getComputedStyle( in a comment\n${closer}\n<style>.y { --ht-x: 1px; }</style>\n`);

    assert.ok(!spaced.includes('in a comment'), closer);
    assert.ok(spaced.includes('--ht-x'), `the style block after a ${JSON.stringify(closer)} is still read`);
  }
  assert.ok(scanFixtureHtml('<script>\n  // x\n</scripts>\n</script>\n').includes('</scripts>'), '`</scripts>` does not close a script');
});

test('an HTML comment sequence inside a script is script, and a script inside an HTML comment is comment', () => {
  // Blanking HTML comments before cutting out the script bodies erased everything between a `"<!--"`
  // and a `"-->"` string inside one script, and the marker between them with it (demtario, review of
  // the first version). The walk decides by whichever comes first.
  const inString = '<script>const s = "<!--"; hot.getPlugin(\'formulas\'); const t = "-->";</script>\n';

  assert.ok(scanFixtureHtml(inString).includes('getPlugin(\'formulas\')'), 'the code between the two strings survives');
  assert.deepEqual(findMarkerHits(scanFixtureHtml(inString), 'fixture', 'f.html').map(hit => hit.id), ['formulas']);

  const commentedOut = '<!-- <script>hot.getPlugin(\'formulas\'); getComputedStyle(el);</script> -->\n<div id="grid"></div>\n';
  const read = scanFixtureHtml(commentedOut);

  assert.ok(!read.includes('formulas') && !read.includes('getComputedStyle'), 'a commented-out script never runs');
  assert.ok(read.includes('<div id="grid"></div>'), 'the markup after it is read');
  assert.equal(read.split('\n').length, commentedOut.split('\n').length);

  // Both kinds, in order: a comment, then a script holding a comment sequence, then a comment again.
  const mixed = '<!-- --ht-a -->\n<script>const x = "<!-- --ht-b -->"; // --ht-c\n</script>\n<!-- --ht-d -->\n<style>.z { --ht-e: 1px; }</style>\n';
  const hits = scanFixtureHtml(mixed);

  assert.ok(!hits.includes('--ht-a') && !hits.includes('--ht-c') && !hits.includes('--ht-d'), 'comments of both kinds are blanked');
  assert.ok(hits.includes('--ht-b') && hits.includes('--ht-e'), 'a string in the script and the style block are read');

  // An unterminated HTML comment blanks to the end of the file; an unterminated script scans to the end.
  assert.equal(scanFixtureHtml('<!-- open\nmore').trim(), '');
  assert.ok(scanFixtureHtml('<script>\n// gone\nkept();').includes('kept();'));
});

test('a marker without the tag is a violation, and the tag covers it: themes', () => {
  const body = describe(null, 'test(\'t\', async({ page, theme }) => {\n  if (theme === \'horizon\') { expect(1).toBe(1); }\n});');
  const tagged = describe('{ tag: THEMES_TAG }', 'test(\'t\', async({ page, theme }) => {\n  if (theme === \'horizon\') { expect(1).toBe(1); }\n});');

  assert.deepEqual(rulesOf(spec(body)), ['undeclared-themes']);
  assert.match(messagesOf(spec(body)), /theme-compare in e2e\/probe\.spec\.ts:\d+/);
  assert.match(messagesOf(spec(body)), /Add \{ tag: THEMES_TAG \}/);
  assert.deepEqual(rulesOf(spec(tagged)), []);
  assert.deepEqual(checkSpec({ file: 'e2e/probe.spec.ts', source: spec(tagged) }).declared, { themes: true, bundles: false });
});

test('a marker without the tag is a violation, and the tag covers it: bundles', () => {
  const engine = describe(null, 'test(\'t\', async({ page }) => {\n  expect(await page.evaluate(() => typeof window.HyperFormula)).toBe(\'object\');\n});');
  const branch = describe(null, 'test(\'t\', async({ page, bundle }) => {\n  if (bundle === \'full-min\') { expect(1).toBe(1); }\n});');
  const tagged = describe('{ tag: BUNDLES_TAG }', 'test(\'t\', async({ page, bundle }) => {\n  if (bundle === \'full-min\') { expect(1).toBe(1); }\n});');

  assert.deepEqual(rulesOf(spec(engine)), ['undeclared-bundles']);
  assert.match(messagesOf(spec(engine)), /hyperformula in e2e\/probe\.spec\.ts/);
  assert.deepEqual(rulesOf(spec(branch)), ['undeclared-bundles']);
  assert.match(messagesOf(spec(branch)), /bundle-compare/);
  assert.deepEqual(rulesOf(spec(tagged)), []);
  assert.deepEqual(rulesOf(spec(describe(null, 'test(\'t\', async({ bundle }) => { expect(bundle).toBe(\'umd\'); });'))), [],
    'the bare word and the bundle name are plumbing, not markers');
});

test('both axes at once need both tags', () => {
  const body = 'test(\'t\', async({ page, theme }) => {\n  expect(theme === \'main\' && await page.evaluate(() => window.HyperFormula)).toBeTruthy();\n});';

  assert.deepEqual(rulesOf(spec(describe(null, body))), ['undeclared-themes', 'undeclared-bundles']);
  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', body))), ['undeclared-bundles']);
  assert.deepEqual(rulesOf(spec(describe('{ tag: [THEMES_TAG, BUNDLES_TAG] }', body))), []);
});

test('markers in a reached page object count, except in a module of types only', () => {
  const page = { file: 'fixtures/pages/ProbePage.ts', source: 'export class ProbePage {\n  async color() {\n    return this.page.evaluate(() => getComputedStyle(document.body).color);\n  }\n}\n' };
  const types = { file: 'fixtures/pages/windowTypes.ts', source: 'export interface Hot {\n  getPlugin(name: \'formulas\'): { x: number };\n}\n' };
  const plain = spec(describe(null, PLAIN_TEST));

  assert.deepEqual(rulesOf(plain, { modules: [page] }), ['undeclared-themes']);
  assert.match(messagesOf(plain, { modules: [page] }), /computed-style in fixtures\/pages\/ProbePage\.ts:3/);
  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', PLAIN_TEST)), { modules: [page] }), []);
  assert.deepEqual(rulesOf(plain, { modules: [types] }), [], 'a type overload naming the plugin is not a use of it');
});

test('markers in a named fixture count, except the theme class its param block builds', () => {
  const fixture = { file: 'fixtures/demo/probe.html', source: '<script>\n  document.write(\'<link href="/styles/ht-theme-\' + window.htTheme + \'.min.css">\');\n</script>\n' };
  const styled = { file: 'fixtures/demo/probe.html', source: '<style>#grid { --ht-cell-horizontal-padding: 2px; }</style>\n' };
  const engine = { file: 'fixtures/demo/formulas.html', source: '<script src="/tests/node_modules/hyperformula/dist/hyperformula.full.min.js"></script>\n' };
  const plain = spec(describe(null, PLAIN_TEST));

  assert.deepEqual(rulesOf(plain, { fixtures: [fixture] }), [], 'the fixture\'s theme class is plumbing');
  assert.deepEqual(rulesOf(plain, { fixtures: [styled] }), ['undeclared-themes']);
  assert.match(messagesOf(plain, { fixtures: [styled] }), /css-token in fixtures\/demo\/probe\.html:1/);
  assert.deepEqual(rulesOf(plain, { fixtures: [engine] }), ['undeclared-bundles']);
  assert.deepEqual(rulesOf(spec(describe('{ tag: BUNDLES_TAG }', PLAIN_TEST)), { fixtures: [engine] }), []);
});

test('a geometry read counts in the spec text only', () => {
  const page = { file: 'fixtures/pages/GridPage.ts', source: 'export class GridPage {\n  box() { return this.cell.boundingBox(); }\n  width() { return this.root.evaluate(el => el.offsetWidth); }\n}\n' };
  const reading = describe(null, 'test(\'t\', async({ page }) => {\n  const box = await page.getByTestId(\'cell\').boundingBox();\n  expect(box.width).toBe(50);\n});');
  const css = describe(null, 'test(\'t\', async({ page }) => {\n  await expect(page.locator(\'td\')).toHaveCSS(\'padding\', \'4px\');\n});');

  assert.deepEqual(rulesOf(spec(describe(null, PLAIN_TEST)), { modules: [page] }), [],
    'a base page object with a geometry helper forces nothing on its importers');
  assert.deepEqual(rulesOf(spec(reading)), ['undeclared-themes']);
  assert.match(messagesOf(spec(reading)), /geometry in e2e\/probe\.spec\.ts/);
  assert.deepEqual(rulesOf(spec(css)), ['undeclared-themes']);
  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', PLAIN_TEST.replace('expect(1).toBe(1);', 'expect(await page.locator(\'td\').boundingBox()).toBeTruthy();')))), []);
});

// The shapes below are the ones the sweep missed on #13918, where five specs were narrowed while the sweep
// stayed green and review put the axes back. Each probe passed the sweep before its marker existed.

/**
 * A synthetic page object in `fixtures/pages/ProbePage.ts`.
 *
 * @param {string[]} lines The class body, one member line per entry.
 * @param {string} [imports] Import lines above the class.
 * @returns {{file: string, source: string}} The module.
 */
function probePage(lines, imports = '') {
  return { file: 'fixtures/pages/ProbePage.ts', source: `${imports}export class ProbePage {\n${lines.join('\n')}\n}\n` };
}

/**
 * A synthetic test with a grid built from `ProbePage`.
 *
 * @param {string} body The lines after the grid is built.
 * @param {string} [title] The test's title.
 * @returns {string} The test's source.
 */
function gridTest(body, title = 't') {
  return `test('${title}', async({ page, theme, bundle }) => {\n  const grid = new ProbePage(page, theme, bundle);\n\n  ${body}\n});`;
}

test('a hit test is every point API, elementsFromPoint and the caret ones included', () => {
  // `WindowScrollPinnedOverlaysPage.cellAtViewportCenter()` takes the master cell under the middle of the
  // viewport with `document.elementsFromPoint()`, which the marker did not match, so the spec read as
  // theme-blind.
  const page = probePage([
    '  async cellAtViewportCenter(row: number): Promise<string | null> {',
    '    return this.page.evaluate(r => document.elementsFromPoint(window.innerWidth / 2, 40)',
    '      .find(el => el.getAttribute(\'data-testid\')?.startsWith(`cell-${r}-`))?.id ?? null, row);',
    '  }',
  ]);
  const plain = spec(describe(null, PLAIN_TEST));

  assert.deepEqual(rulesOf(plain, { modules: [page] }), ['undeclared-themes']);
  assert.match(messagesOf(plain, { modules: [page] }), /hit-test in fixtures\/pages\/ProbePage\.ts:3/);
  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', PLAIN_TEST)), { modules: [page] }), []);

  for (const call of ['document.caretRangeFromPoint(10, 20)', 'document.caretPositionFromPoint(10, 20)',
    'root.shadowRoot.elementsFromPoint(10, 20)', 'document.elementFromPoint(10, 20)']) {
    const probe = describe(null, `test('t', async({ page }) => {\n  await page.evaluate(() => ${call});\n});`);

    assert.deepEqual(rulesOf(spec(probe)), ['undeclared-themes'], call);
  }
});

test('a pointer aimed a fixed number of pixels from a box edge counts, in a page object as well', () => {
  // `FormulasHyperlinkPage.selectCell()` clicks 4 px inside the cell's right edge so the press lands past
  // the label; how much room the label leaves there is the theme's padding and font.
  const aim = line => probePage([
    '  async aim(): Promise<void> {',
    '    const box = (await this.cell.boundingBox())!;',
    `    ${line}`,
    '  }',
  ]);
  const plain = spec(describe(null, PLAIN_TEST));
  const aimed = [
    'await this.page.mouse.click(box.x + box.width - 4, box.y + box.height / 2);',
    'await this.page.mouse.move(box.x + 4, box.y);',
    'await this.page.mouse.dblclick(box.right - 2, box.top + 2);',
    'await this.page.touchscreen.tap(box.x + 10, box.y + 10);',
    'await this.#dragFrom(start, { x: start.x, y: box.y + box.height + 20 });',
    'await this.cell.click({ position: { x: box.width - 4, y: 5 } });',
    'await this.page.mouse.move((box?.x ?? 0) + 5, 0);',
    'await this.cdp.send(\'Input.dispatchMouseEvent\', { type: \'mousePressed\', x: 3 + box.x, y: box.y });',
  ];

  aimed.forEach((line) => {
    assert.deepEqual(rulesOf(plain, { modules: [aim(line)] }), ['undeclared-themes'], line);
    assert.match(messagesOf(plain, { modules: [aim(line)] }), /pointer-offset in fixtures\/pages\/ProbePage\.ts:4/, line);
  });
  assert.match(messagesOf(plain, { modules: [aim(aimed[0])] }), /aimed at `box\.x \+ box\.width - 4`/);

  // A fraction of the box scales with the box the theme sized, a corner is on the box whatever its size, and a
  // wheel delta or a point that names no box aims at nothing: none of them is a hit.
  [
    'await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);',
    'await this.page.mouse.move(box.x + box.width * 0.75, box.y + 10 * this.row);',
    'await this.page.mouse.move(box.x, box.y);',
    'await this.page.mouse.click(20, 30);',
    'await this.page.mouse.wheel(0, box.height + 40);',
    'const point: { x: number; y: number } = { x: margin + 4, y: 2 };',
  ].forEach((line) => {
    assert.deepEqual(rulesOf(plain, { modules: [aim(line)] }), [], line);
  });

  // In the spec text too, and the tag covers it.
  const inSpec = describe(null, 'test(\'t\', async({ page }) => {\n  await page.mouse.click(box.x + box.width - 4, box.y);\n});');

  assert.deepEqual(rulesOf(spec(inSpec)), ['undeclared-themes']);
  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', PLAIN_TEST)), { modules: [aim(aimed[0])] }), []);
});

test('a page object\'s geometry read compared to a literal counts, in the spec and in the page object', () => {
  // `verticalOffsetInHeader()` (`fixtures/rowSelection.ts`) measures a header checkbox against its cell,
  // and checkbox-header.spec.ts asserts the offset stays within 1 px. The read sits in a shared helper, so
  // the spec text had no geometry in it.
  const helper = {
    file: 'fixtures/probeGeometry.ts',
    source: [
      'export async function verticalOffsetInHeader(checkbox: Locator): Promise<number> {',
      '  return checkbox.evaluate((element) => {',
      '    const input = element.getBoundingClientRect();',
      '    const cell = element.closest(\'th\')!.getBoundingClientRect();',
      '',
      '    return (input.top + (input.height / 2)) - (cell.top + (cell.height / 2));',
      '  });',
      '}',
      '',
      'export async function visibleLabels(page: Page): Promise<string[]> {',
      '  return page.evaluate(() => [...document.querySelectorAll(\'li\')]',
      '    .filter(li => li.offsetHeight > 0).map(li => li.textContent ?? \'\'));',
      '}',
      '',
    ].join('\n'),
  };
  const page = probePage([
    '  async headerVerticalOffset(): Promise<number> {',
    '    return verticalOffsetInHeader(this.headerCheckbox());',
    '  }',
    '',
    '  async isInView(): Promise<boolean> {',
    '    const box = await this.cell.boundingBox();',
    '',
    '    return box !== null && box.y + box.height <= 300;',
    '  }',
    '',
    '  menuLabels(): Promise<string[]> {',
    '    return visibleLabels(this.page);',
    '  }',
    '',
    '  async $edge(): Promise<number> {',
    '    return this.page.evaluate(() => document.body.getBoundingClientRect().left);',
    '  }',
    '',
    '  async drawCount(): Promise<number> {',
    '    return this.page.evaluate(() => window.drawCount);',
    '  }',
  ], 'import { verticalOffsetInHeader, visibleLabels } from \'../probeGeometry\';\n\n');
  const modules = [page, helper];
  const probe = body => spec(describe(null, gridTest(body)));

  [
    'expect(Math.abs(await grid.headerVerticalOffset())).toBeLessThanOrEqual(1);',
    'expect(await verticalOffsetInHeader(grid.headerCheckbox())).toBe(0);',
    'await expect.poll(() => grid.headerVerticalOffset()).not.toBeCloseTo(0.5);',
    'const offset = await grid.headerVerticalOffset();\n\n  expect(offset, \'centred\').toBeLessThan(MAX_OFFSET_PX);',
    'const { offset } = { offset: await grid.headerVerticalOffset() };\n  const half = offset / 2;\n\n  expect(half).toBeGreaterThanOrEqual(-1);',
    'expect([await grid.headerVerticalOffset()]).toEqual([0]);',
    'expect(await grid.isInView()).toBe(false);',
    'expect(await grid.$edge()).toBe(0);',
    'const $left = await grid.$edge();\n\n  expect($left).toBe(0);',
  ].forEach((body) => {
    assert.deepEqual(rulesOf(probe(body), { modules }), ['undeclared-themes'], body);
    assert.match(messagesOf(probe(body), { modules }), /geometry-helper in e2e\/probe\.spec\.ts:\d+, through (?:headerVerticalOffset|verticalOffsetInHeader|isInView|\$edge)\(\) at fixtures\//, body);
  });
  assert.match(messagesOf(probe('expect(await grid.headerVerticalOffset()).toBe(0);'), { modules }),
    /through headerVerticalOffset\(\) at fixtures\/pages\/ProbePage\.ts:4/);

  // A read that is not compared to a literal, a list a geometry filter picked, a count, a box that only has
  // to exist, and a value that came from elsewhere are not pixel assertions.
  [
    'expect(await grid.headerVerticalOffset()).toBe(await grid.headerVerticalOffset());',
    'expect((await grid.menuLabels()).filter(label => label === \'Freeze\')).toHaveLength(1);',
    'expect(countOf(await grid.menuLabels(), \'Freeze\')).toBe(1);',
    'const offsets = [await grid.headerVerticalOffset()];\n\n  expect(offsets.length).toBe(1);',
    'expect(await grid.headerVerticalOffset()).toBeGreaterThan(0);',
    'expect(await grid.isInView()).toBeTruthy();',
    'expect(await grid.drawCount()).toBe(1);',
    'await grid.headerVerticalOffset();\n  expect(1).toBe(1);',
  ].forEach((body) => {
    assert.deepEqual(rulesOf(probe(body), { modules }), [], body);
  });

  // A variable is followed within its own scope: another test's `before` from a geometry read does not make
  // this test's `before`, a draw count, one.
  const scoped = spec(describe(null, [
    gridTest('const before = await grid.headerVerticalOffset();\n  await grid.goto(before);', 'a'),
    gridTest('const before = await grid.drawCount();\n\n  expect(await grid.drawCount() - before).toBe(1);', 'b'),
  ].join('\n')));

  assert.deepEqual(rulesOf(scoped, { modules }), []);

  // Inside a page object, an assertion of its own on a geometry read decides the outcome the same way.
  const asserting = probePage([
    '  async expectCentred(): Promise<void> {',
    '    expect(Math.abs(await verticalOffsetInHeader(this.headerCheckbox()))).toBeLessThanOrEqual(1);',
    '  }',
    '',
    '  async expectWidth(): Promise<void> {',
    '    const box = (await this.cell.boundingBox())!;',
    '',
    '    expect(box.width).toBe(50);',
    '  }',
  ], 'import { verticalOffsetInHeader } from \'../probeGeometry\';\n\n');

  assert.deepEqual(rulesOf(probe('await grid.expectCentred();'), { modules: [asserting, helper] }), ['undeclared-themes']);
  assert.match(messagesOf(probe('await grid.expectCentred();'), { modules: [asserting, helper] }),
    /geometry-helper in fixtures\/pages\/ProbePage\.ts:5 \(2 hits\)/);
  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', gridTest('await grid.expectCentred();'))), { modules: [asserting, helper] }), []);
  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', gridTest('expect(await grid.isInView()).toBe(true);'))), { modules }), []);
});

test('readGeometryHelpers follows a read through the functions that call it, and drops one that cannot return a size', () => {
  const helpers = readGeometryHelpers([
    {
      file: 'fixtures/edges.ts',
      source: 'export async function edge(el: Locator): Promise<number> {\n  return el.evaluate(e => e.getBoundingClientRect().left);\n}\n',
    },
    {
      file: 'fixtures/pages/EdgePage.ts',
      source: [
        'import { edge } from \'../edges\';',
        '',
        'export class EdgePage {',
        '  async inset(): Promise<number> {',
        '    return (await edge(this.cell)) - 4;',
        '  }',
        '',
        '  async #box() {',
        '    return this.cell.boundingBox();',
        '  }',
        '',
        '  async corner(): Promise<{ x: number; y: number }> {',
        '    const box = (await this.#box())!;',
        '',
        '    return { x: box.x, y: box.y };',
        '  }',
        '',
        '  async labels(): Promise<string[]> {',
        '    return this.page.evaluate(() => [...document.querySelectorAll(\'li\')].filter(li => li.offsetHeight > 0).map(li => li.id));',
        '  }',
        '',
        '  async expectLaidOut(): Promise<void> {',
        '    expect((await this.cell.boundingBox())!.width).toBeGreaterThan(0);',
        '  }',
        '',
        '  async cellCount(): Promise<number> {',
        '    return this.page.evaluate(() => document.querySelectorAll(\'td\').length);',
        '  }',
        '}',
      ].join('\n'),
    },
    { file: 'fixtures/types.ts', source: 'export interface Hot { box(): { offsetWidth: number }; }\n' },
  ]);

  assert.deepEqual([...helpers.keys()].sort(), ['#box', 'corner', 'edge', 'inset']);
  assert.deepEqual(helpers.get('inset'), { file: 'fixtures/pages/EdgePage.ts', line: 4 });
  assert.deepEqual(helpers.get('edge'), { file: 'fixtures/edges.ts', line: 1 });
});

test('a fixture that picks a file by the bundle\'s name branches on the bundle', () => {
  // icon-elements.html loads `dist/themes/<theme>.min.js` on the -min legs and `<theme>.js` on the others,
  // chosen by `window.htBundle.indexOf('.min.')`, which none of the comparison shapes matched.
  const fixture = {
    file: 'fixtures/demo/probe.html',
    source: '<script>\n  const themeScriptFile = window.htBundle.indexOf(\'.min.\') === -1 ?\n    \'main.js\' : \'main.min.js\';\n</script>\n',
  };
  const plain = spec(describe(null, PLAIN_TEST));

  assert.deepEqual(rulesOf(plain, { fixtures: [fixture] }), ['undeclared-bundles']);
  assert.match(messagesOf(plain, { fixtures: [fixture] }), /bundle-compare in fixtures\/demo\/probe\.html:2/);
  assert.deepEqual(rulesOf(spec(describe('{ tag: BUNDLES_TAG }', PLAIN_TEST)), { fixtures: [fixture] }), []);

  // The same string test on the theme reads as a branch on the theme.
  const themed = { file: 'fixtures/demo/probe.html', source: '<script>\n  if (window.htTheme.startsWith(\'h\')) { pad = 8; }\n</script>\n' };

  assert.deepEqual(rulesOf(plain, { fixtures: [themed] }), ['undeclared-themes']);
});

test('every marker in the table has a scope, an axis and a reason, and fires on its own example', () => {
  const examples = {
    'theme-compare': 'if (theme === \'horizon\') {}',
    'computed-style': 'getComputedStyle(el).color',
    'css-token': 'var(--ht-cell-horizontal-padding)',
    'theme-class': 'root.classList.contains(\'ht-theme-main\')',
    'hit-test': 'document.elementFromPoint(x, y)',
    geometry: 'el.getBoundingClientRect().width',
    'pointer-offset': 'await page.mouse.click(box.x + box.width - 4, box.y);',
    'geometry-helper': {
      code: 'expect(await grid.offset()).toBe(1);',
      modules: [{
        file: 'fixtures/pages/P.ts',
        source: 'export class P {\n  async offset(): Promise<number> {\n    return this.el.evaluate(el => el.getBoundingClientRect().top);\n  }\n}\n',
      }],
    },
    formulas: 'hot.getPlugin(\'formulas\')',
    hyperformula: 'window.HyperFormula',
    'bundle-compare': 'htBundle === \'handsontable.full.min.js\'',
  };
  // The ids of the markers that hit a line of test code (and the page objects the example names).
  const hitIds = example => checkSpec({
    file: 'e2e/probe.spec.ts',
    source: spec(describe(null, `test('t', async({ page }) => {\n  ${example.code ?? example}\n});`)),
    modules: example.modules ?? [],
  }).hits.map(hit => hit.id);

  assert.deepEqual(SURFACE_MARKERS.map(marker => marker.id).sort(), Object.keys(examples).sort());
  SURFACE_MARKERS.forEach((marker) => {
    assert.ok(['themes', 'bundles'].includes(marker.axis), marker.id);
    assert.ok(marker.scopes.includes('spec'), `${marker.id} is read in the spec at least`);
    assert.ok(marker.why.length > 20, `${marker.id} explains itself`);
    assert.ok((marker.pattern instanceof RegExp) !== (typeof marker.find === 'function'),
      `${marker.id} is read by a pattern or by a finder, never both`);
    assert.ok(!marker.find || !marker.scopes.includes('fixture'), `${marker.id} reads code, and a fixture is markup`);
    assert.deepEqual(hitIds(examples[marker.id]), [marker.id], marker.id);
  });

  // A branch on the axis has four shapes; a comparison is only the first (budnix, review of the first version).
  const themeCompare = SURFACE_MARKERS.find(marker => marker.id === 'theme-compare').pattern;
  const bundleCompare = SURFACE_MARKERS.find(marker => marker.id === 'bundle-compare').pattern;

  for (const shape of ['theme !== \'main\'', '\'horizon\' === theme', 'const w = { main: 29, horizon: 37, classic: 23 }[theme];',
    'widths[ htTheme ]', 'const width = widths[this.theme];', 'switch (theme) {', 'switch(hotTheme){', 'switch (this.theme) {',
    '[\'horizon\', \'classic\'].includes(theme)', 'TALL.includes(this.theme)', 'if (this.theme === \'horizon\')',
    'window.htTheme.startsWith(\'h\')', 'this.theme.includes(\'o\')', '/horizon|classic/.test(theme)']) {
    assert.match(shape, themeCompare, shape);
  }
  for (const shape of ['bundle === \'full-min\'', '\'umd\' !== this.bundle', 'const file = BUNDLE_FILES[bundle];', 'FILES[this.bundle]',
    'switch (htBundle) {', 'switch (this.bundle) {', 'MIN.includes(bundle)', 'if (window.htBundle === \'handsontable.full.min.js\')',
    'window.htBundle.indexOf(\'.min.\') === -1', 'htBundle.endsWith(\'.min.js\')', 'this.bundle?.startsWith(\'full\')',
    'htBundle.match(/min/)', '/\\.min\\./.test(window.htBundle)']) {
    assert.match(shape, bundleCompare, shape);
  }
  // Still not a branch: the fixture allowlist keyed by the query param, a template that prints the value, a name
  // built from the value, and a word that only starts with the axis's name.
  for (const shape of ['({ main: \'main\', horizon: \'horizon\' })[htParams.get(\'theme\') ?? \'main\']', '`?theme=${theme}&bundle=${bundle}`',
    'themes.forEach(theme => …)', 'const [theme] = args;', 'window.htBundle.replace(\'.js\', \'.min.js\')', 'bundleFiles.includes(name)',
    'themeNames.startsWith(\'h\')']) {
    assert.doesNotMatch(shape, themeCompare, shape);
    assert.doesNotMatch(shape, bundleCompare, shape);
  }
  // The plumbing every fixture and page object carries is not a marker.
  const plumbing = [
    'window.htBundle = ({ umd: \'handsontable.js\', \'full-min\': \'handsontable.full.min.js\' })[htParams.get(\'bundle\') ?? \'umd\'];',
    'constructor(page: Page, theme = \'main\', bundle: Bundle = \'umd\') {}',
    'goto(`/tests/fixtures/demo/grid.html?theme=${this.theme}&bundle=${this.bundle}`)',
    'showFormulas(): void; isShowingFormulas(): boolean;',
  ];

  plumbing.forEach(line => assert.deepEqual(hitIds(line), [], `no marker may fire on: ${line}`));
});

test('an ignore comment covers a marker, and a wrong one is a violation of its own', () => {
  const body = 'test(\'t\', async({ page, theme }) => {\n  if (theme === \'horizon\') { expect(1).toBe(1); }\n});';
  const ignore = (marker, why) => `// ${IGNORE_COMMENT} ${marker}${why === undefined ? '' : ` -- ${why}`}\n`;
  const why = 'the fixture pins the main theme; the branch only picks a label';

  assert.deepEqual(rulesOf(spec(ignore('theme-compare', why) + describe(null, body))), []);
  assert.deepEqual(rulesOf(spec(ignore('theme-compar', why) + describe(null, body))), ['ignore-unknown-marker', 'undeclared-themes']);
  assert.deepEqual(rulesOf(spec(ignore('theme-compare', 'short') + describe(null, body))), ['ignore-no-reason']);
  assert.deepEqual(rulesOf(spec(ignore('theme-compare') + describe(null, body))), ['ignore-no-reason']);
  assert.deepEqual(rulesOf(spec(ignore('css-token', why) + describe(null, body))), ['ignore-stale', 'undeclared-themes']);
  assert.deepEqual(rulesOf(spec(ignore('theme-compare', why) + describe('{ tag: THEMES_TAG }', body))), ['ignore-redundant']);
  assert.deepEqual(rulesOf(spec(ignore('theme-compare', why) + describe(null, `${body}\ntest('u', async({ page }) => { await page.evaluate(() => window.HyperFormula); });`))),
    ['undeclared-bundles'], 'an ignore covers its own marker only');

  const module = { file: 'fixtures/pages/ProbePage.ts', source: `${ignore('computed-style', why)}export class ProbePage { c() { return getComputedStyle(this.el); } }\n` };

  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', PLAIN_TEST)), { modules: [module] }), ['ignore-misplaced']);
});

test('a quarantined top-level test is the no-tag shape: fine in a file that declares nothing, named where a tag is needed', () => {
  // A file of only quarantined tests used to leave `declared` null and skip the marker checks, so one reading
  // a computed style passed with no declaration; the first fix forced a describe on every quarantined test,
  // although `tests/AGENTS.md` (Quarantine) shows the bare form in a file with nothing to declare (budnix).
  const parked = 'test(\'parked\', quarantined(\'DEV-1\', \'2026-10-30\'), async({ page }) => {\n'
    + '  expect(await page.evaluate(() => getComputedStyle(document.body).color)).toBe(\'rgb(0, 0, 0)\');\n});\n';
  const plainParked = 'test(\'parked\', quarantined(\'DEV-1\', \'2026-10-30\'), async() => {});\n';

  assert.deepEqual(rulesOf(spec(parked)), ['undeclared-themes'], 'a marker still asks for the axis');
  assert.match(messagesOf(spec(parked)), /A quarantined top-level test cannot carry the tag: put it inside a describe that does/);
  assert.deepEqual(rulesOf(spec(plainParked)), [], 'nothing to declare: the bare form is fine');
  assert.deepEqual(rulesOf(spec(PLAIN_TEST + '\n' + plainParked)), [], 'beside an untagged test too');
  assert.deepEqual(rulesOf(spec(describe(null, PLAIN_TEST) + plainParked)), [], 'beside an untagged describe too');
  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', PLAIN_TEST) + plainParked)), ['top-level-legs-agree'],
    'in a file that declares an axis, it disagrees');
  assert.deepEqual(rulesOf(spec(describe('{ tag: THEMES_TAG }', parked))), [], 'inside a tagged describe it is fine');
});

test('every top-level block declares the same legs, and a quarantined top-level test cannot', () => {
  const two = describe('{ tag: THEMES_TAG }', PLAIN_TEST, '\'a\'') + describe(null, PLAIN_TEST, '\'b\'');
  const same = describe('{ tag: THEMES_TAG }', PLAIN_TEST, '\'a\'') + describe('{ tag: [\'@core\', THEMES_TAG] }', PLAIN_TEST, '\'b\'');
  const parked = describe('{ tag: THEMES_TAG }', PLAIN_TEST) + 'test(\'parked\', quarantined(\'DEV-1\', \'2026-10-30\'), async() => {});\n';
  const inside = describe('{ tag: THEMES_TAG }', `${PLAIN_TEST}\ntest('parked', quarantined('DEV-1', '2026-10-30'), async() => {});`);

  assert.deepEqual(rulesOf(spec(two)), ['top-level-legs-agree']);
  assert.match(messagesOf(spec(two)), /test\.describe\(\) at line \d+: themes\n\s+test\.describe\(\) at line \d+: no leg tag/);
  assert.deepEqual(rulesOf(spec(same)), []);
  assert.deepEqual(rulesOf(spec(parked)), ['top-level-legs-agree']);
  assert.match(messagesOf(spec(parked)), /quarantined\(…\), which cannot carry a leg tag/);
  assert.deepEqual(rulesOf(spec(inside)), []);
  // In a file that declares nothing, the same test is the no-tag shape and fine.
  assert.deepEqual(rulesOf(spec(describe(null, PLAIN_TEST) + 'test(\'parked\', quarantined(\'DEV-1\', \'2026-10-30\'), async() => {});\n')), []);
  assert.equal(checkSpec({ file: 'e2e/probe.spec.ts', source: spec(two) }).declared, null);
});

test('a leg tag on a nested block, a literal leg tag and an unreadable details argument are violations', () => {
  const nested = describe('{ tag: THEMES_TAG }', describe('{ tag: BUNDLES_TAG }', PLAIN_TEST, '\'inner\''));
  const literal = describe(`{ tag: ${STRING_TAG} }`, PLAIN_TEST);
  const misspelled = describe('{ tag: THEME_TAG }', PLAIN_TEST);
  const variable = describe('details', PLAIN_TEST);
  const spread = describe('{ ...shared, tag: THEMES_TAG }', PLAIN_TEST);

  assert.deepEqual(rulesOf(spec(nested)), ['nested-leg-tag']);
  assert.deepEqual(rulesOf(spec(literal)), ['literal-leg-tag']);
  assert.match(messagesOf(spec(literal)), /Use THEMES_TAG \/ BUNDLES_TAG from fixtures\/test/);
  assert.deepEqual(rulesOf(spec(misspelled)), ['details-unreadable']);
  assert.match(messagesOf(spec(misspelled)), /THEME_TAG, which is not one of THEMES_TAG, BUNDLES_TAG/);
  assert.deepEqual(rulesOf(spec(variable)), ['details-unreadable']);
  assert.deepEqual(rulesOf(spec(spread)), [], 'a spread beside a readable tag is read for its tag');
  assert.deepEqual(rulesOf(spec(describe('{ tag: [\'@core\'] }', PLAIN_TEST))), [], 'a free-form tag is not a leg tag');

  // Playwright reads a shorthand `{ tag }` and a quoted `'tag':` key; a reader that skipped them would check
  // the spec against the wrong declaration (budnix). Both are reported where they are written.
  for (const details of ['{ tag }', '{ annotation: { type: \'x\' }, tag }', '{ \'tag\': THEMES_TAG }', '{ "tag": [THEMES_TAG] }']) {
    assert.deepEqual(rulesOf(spec(describe(details, PLAIN_TEST))), ['details-unreadable'], details);
    assert.match(messagesOf(spec(describe(details, PLAIN_TEST))), /has a tag the sweep cannot read/, details);
  }
});

test('a spec without a top-level block, and a test.use() that sets an axis, are violations', () => {
  assert.deepEqual(rulesOf(spec('const x = 1;')), ['no-top-level-block']);
  assert.deepEqual(rulesOf(spec(`test.use({ theme: 'horizon' });\n${describe(null, PLAIN_TEST)}`)), ['test-use-axis']);
  assert.deepEqual(rulesOf(spec(`test.use({\n  ...devices['iPhone 13'],\n  bundle: 'full-min',\n});\n${describe(null, PLAIN_TEST)}`)), ['test-use-axis']);
  assert.deepEqual(rulesOf(spec(`test.use({ hasTouch: true, permissions: ['clipboard-read'] });\n${describe(null, PLAIN_TEST)}`)), []);
  assert.deepEqual(rulesOf(spec(`test.use({ locale: 'en-US', colorScheme: 'dark' });\n${describe(null, PLAIN_TEST)}`)), []);
});

test('a comment, a string or a regex holding a marker or a call is text, not code', () => {
  const body = describe(null, [
    '  // theme === \'horizon\' and getComputedStyle( and window.HyperFormula in a comment',
    '  /* test.describe(\'phantom\', { tag: THEMES_TAG }, () => {}); */',
    '  test(\'t\', async({ page }) => {',
    '    const label = \'getComputedStyle( is a function name in this label\';',
    '    expect(label).toMatch(/getComputedStyle\\(/);',
    '  });',
  ].join('\n'));
  const report = checkSpec({ file: 'e2e/probe.spec.ts', source: spec(body) });

  // Strings are kept for the markers (a token lives in a string), so the label is a hit; comments are not.
  assert.deepEqual(report.violations.map(violation => violation.rule), ['undeclared-themes']);
  assert.deepEqual(report.hits.map(hit => hit.id), ['computed-style']);
  assert.equal(report.hits[0].count, 1, 'the string, never the comment; the regex escapes its parenthesis');
  assert.equal(report.blocks.length, 2, 'the phantom describe in the comment is not a block');
});

// ---------------------------------------------------------------------------------------------------
// The sweep over the checked-in tree.

const SKIPPED_MODULES = new Set(['fixtures/test.ts', 'fixtures/bundle.ts', 'fixtures/quarantine.ts']);

/**
 * Every spec under `tests/e2e/`, relative to the tests package, sorted.
 *
 * @returns {string[]} The spec paths.
 */
function specPaths() {
  const walk = (dir, out) => {
    readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full, out);
      } else if (entry.name.endsWith('.spec.ts')) {
        out.push(path.relative(TESTS_ROOT, full).split(path.sep).join('/'));
      }
    });

    return out;
  };

  return walk(path.join(TESTS_ROOT, 'e2e'), []).sort();
}

/**
 * The fixture files under `tests/fixtures/demo/`, by relative path and by unique basename.
 *
 * @returns {Map<string, string>} Names to relative paths under `fixtures/demo/`.
 */
function fixtureIndex() {
  const root = path.join(TESTS_ROOT, 'fixtures/demo');
  const index = new Map();
  const seen = new Map();
  const walk = (dir) => {
    readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.html')) {
        const relative = path.relative(root, full).split(path.sep).join('/');

        index.set(relative, relative);
        seen.set(entry.name, (seen.get(entry.name) ?? 0) + 1);
        index.set(entry.name, relative);
      }
    });
  };

  walk(root);
  seen.forEach((count, name) => {
    if (count > 1) {
      index.delete(name);
    }
  });

  return index;
}

const FIXTURES = fixtureIndex();

/**
 * Resolves a relative import to a module the sweep reads, or `null`.
 *
 * @param {string} from The importing file, relative to the tests package.
 * @param {string} specifier The import specifier.
 * @returns {string|null} The module, relative to the tests package.
 */
function resolveImport(from, specifier) {
  let target = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));

  if (/\.(?:mjs|cjs|js|json)$/.test(target)) {
    return null;
  }
  if (!/\.m?ts$/.test(target)) {
    if (existsSync(path.join(TESTS_ROOT, `${target}.ts`))) {
      target = `${target}.ts`;
    } else if (existsSync(path.join(TESTS_ROOT, target, 'index.ts'))) {
      target = `${target}/index.ts`;
    } else {
      return null;
    }
  }
  if (!(target.startsWith('fixtures/') || target.startsWith('e2e/')) || SKIPPED_MODULES.has(target)) {
    return null;
  }

  return target;
}

/**
 * A spec with the modules it reaches and the fixtures those name.
 *
 * @param {string} file The spec, relative to the tests package.
 * @returns {import('../leg-declarations.mjs').SpecInput} The input for `checkSpec()`.
 */
function readSpecInputs(file) {
  const source = readFileSync(path.join(TESTS_ROOT, file), 'utf8');
  const modules = [];
  const queue = [{ file, source }];
  const seen = new Set([file]);
  const scanned = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const views = scanSource(current.source, current.file);

    scanned.push(views);
    relativeImports(views.code).forEach((specifier) => {
      const target = resolveImport(current.file, specifier);

      if (target && !seen.has(target)) {
        seen.add(target);
        const module = { file: target, source: readFileSync(path.join(TESTS_ROOT, target), 'utf8') };

        modules.push(module);
        queue.push(module);
      }
    });
  }

  const fixtures = fixturesNamed(scanned, FIXTURES).map(relative => ({
    file: `fixtures/demo/${relative}`,
    source: readFileSync(path.join(TESTS_ROOT, 'fixtures/demo', relative), 'utf8'),
  }));

  return { file, source, modules, fixtures };
}

const REPORTS = specPaths().map((file) => {
  try {
    return checkSpec(readSpecInputs(file));
  } catch (error) {
    return { file, violations: [{ rule: 'parse', message: error.message }], declared: null, fixtures: [], hits: [], topLevel: [] };
  }
});

test('the sweep reads the whole tree, and resolves the fixtures most specs name', () => {
  // Vacuity floors, well under today's counts; they fire when the walk or the resolution breaks, not
  // when a spec is added or removed.
  assert.ok(REPORTS.length >= 200, `the sweep read ${REPORTS.length} specs; the walk over tests/e2e broke`);

  const withFixture = specPaths().filter(file => readSpecInputs(file).fixtures.length > 0).length;

  assert.ok(withFixture >= REPORTS.length * 0.9,
    `only ${withFixture} of ${REPORTS.length} specs name a fixture the sweep could resolve; the resolution broke`);
});

test('every spec declares the legs its surface needs, on every top-level block', () => {
  const violations = REPORTS.flatMap(report => report.violations.map(violation => violation.message));

  assert.deepEqual(violations, [], `${violations.length} declaration problem(s) in tests/e2e (tests/AGENTS.md, `
    + `"Declaring the legs"):\n\n${violations.join('\n\n')}`);
});

test('the three declaration shapes are all in use, so no leg can be empty', () => {
  // A project whose grep matches nothing fails the run with "No tests found", by design (no
  // --pass-with-no-tests anywhere). These floors keep that from being reachable by the tree alone.
  const shapes = { 'themes-only': 0, 'bundles-only': 0, both: 0, none: 0 };

  REPORTS.forEach(({ declared }) => {
    if (!declared) {
      return;
    }
    if (declared.themes && declared.bundles) {
      shapes.both += 1;
    } else if (declared.themes) {
      shapes['themes-only'] += 1;
    } else if (declared.bundles) {
      shapes['bundles-only'] += 1;
    } else {
      shapes.none += 1;
    }
  });

  assert.ok(shapes['themes-only'] >= 1, `no spec declares THEMES_TAG alone: e2e-horizon and e2e-classic would run only the ${shapes.both} specs declaring both`);
  assert.ok(shapes['bundles-only'] >= 1, 'no spec declares BUNDLES_TAG alone');
  assert.ok(shapes.both >= 1, 'no spec declares both: e2e-horizon-min and e2e-classic-min would find no tests');
  assert.ok(shapes.none >= 1, 'every spec declares an axis; the default leg has nothing of its own, which means the declarations stopped being read');
});

// Specs a documented single-axis regression came from (tests/AGENTS.md, the matrix section's traps, and
// the ledger), and specs that hit a trap no marker can read. Each must keep declaring its axis; a new tagged
// spec may join without touching this list.
const THEMES_CANARIES = [
  'e2e/cell-dropdown-arrow-button.spec.ts',
  'e2e/comments-editor-resize.spec.ts',
  'e2e/editor-hidden-cell.spec.ts',
  'e2e/fixed-columns-end.spec.ts',
  'e2e/handsontable-editor-list-position.spec.ts',
  'e2e/iframe-cross-realm-scroll.spec.ts',
  // A band edge: it drags to row 6 of a 300 px grid, which only the row heights keep on screen. A text
  // rule cannot tell an index near the band's edge from one well inside it.
  'e2e/mobile-drag-to-scroll.spec.ts',
  'e2e/multiselect-open-left.spec.ts',
  'e2e/overlay-alignment-css-zoom.spec.ts',
  'e2e/row-header-border-ownership.spec.ts',
  'e2e/submenu-position.spec.ts',
  'e2e/width-window-scroll.spec.ts',
];
const BUNDLES_CANARIES = [
  'e2e/editor-trimmed-row.spec.ts',
  'e2e/fill-handle-formulas.spec.ts',
  'e2e/formulas-hyperlink.spec.ts',
  'e2e/formulas-move-cells.spec.ts',
  'e2e/numeric-formulas.spec.ts',
];

test('the specs that documented a theme- or bundle-only regression keep declaring that axis', () => {
  const byFile = new Map(REPORTS.map(report => [report.file, report]));

  THEMES_CANARIES.forEach((file) => {
    const report = byFile.get(file);

    assert.ok(report, `${file} is gone; update THEMES_CANARIES in this file`);
    assert.ok(report.declared?.themes, `${file} must declare THEMES_TAG: a theme-only regression was found through it, `
      + 'and without the tag only the nightly would see the next one (tests/AGENTS.md, the matrix section).');
  });
  BUNDLES_CANARIES.forEach((file) => {
    const report = byFile.get(file);

    assert.ok(report, `${file} is gone; update BUNDLES_CANARIES in this file`);
    assert.ok(report.declared?.bundles, `${file} must declare BUNDLES_TAG: it drives the Formulas plugin or the `
      + 'full bundle, which the plain UMD leg cannot prove.');
  });
});

test('the config greps each project through legGrep, per project and never top-level, and reads the full-matrix switch', () => {
  const { code } = scanSource(readFileSync(path.join(TESTS_ROOT, 'playwright.config.ts'), 'utf8'), 'playwright.config.ts');

  assert.match(code, /import \{ FULL_MATRIX_ENV, legGrep, parseFullMatrix \} from '\.\/lib\/leg-declarations\.mjs';/,
    'tests/playwright.config.ts must take the greps and the full-matrix switch from the lib, so the sweep and the run agree');
  assert.match(code, /const FULL_MATRIX = parseFullMatrix\(process\.env\[FULL_MATRIX_ENV\]\);/,
    'the config must read HOT_E2E_FULL_MATRIX through parseFullMatrix(), which throws on a value it does not know');

  const greps = [...code.matchAll(/\bgrep\s*:/g)];

  assert.equal(greps.length, 1, 'exactly one grep: the one inside the project map');
  assert.match(code, /grep: legGrep\(\{ theme, bundle, fullMatrix: FULL_MATRIX \}\)/,
    'each project greps for the tags its legs need, through legGrep()');
  assert.ok(greps[0].index > code.indexOf('projects: ['),
    'the grep sits inside a project, never top-level: a top-level grep would leak into tests/playwright-engines.config.ts '
    + 'through its spread of this config, and the engine legs must run every @cross-browser spec whatever the leg tags say');
  assert.doesNotMatch(code, /grepInvert/, 'the leg filter is a positive grep; the only grepInvert lives in the engines config');
  assert.doesNotMatch(code, /passWithNoTests|pass-with-no-tests/, 'an empty leg must be a red job, never a green one that ran nothing');
});

test('fixtures/test.ts re-exports the two leg tags from the lib, beside the engine tags', () => {
  const fixtures = readFileSync(path.join(TESTS_ROOT, 'fixtures/test.ts'), 'utf8');

  assert.match(fixtures, /export \{ THEMES_TAG, BUNDLES_TAG \} from '\.\.\/lib\/leg-declarations\.mjs';/,
    'tests/fixtures/test.ts must re-export THEMES_TAG and BUNDLES_TAG, so a spec imports every tag from one place');
  // The engine tags stay byte-identical: .github/scripts/__tests__/playwright-engines.test.mjs pins them.
  assert.match(fixtures, /export const CROSS_BROWSER_TAG = '@cross-browser';/);
});

test('the ESLint config bans a bare leg tag in a string and in a template, with the shape this module defines', () => {
  const eslintrc = readFileSync(path.join(TESTS_ROOT, '.eslintrc.cjs'), 'utf8');
  const shape = LEG_TAG_LIKE.source;

  assert.ok(eslintrc.includes(`Literal[value=/${shape}/]`),
    `tests/.eslintrc.cjs must carry the selector Literal[value=/${shape}/] (a bare '@themes' is one typo from a spec that runs on one leg)`);
  assert.ok(eslintrc.includes(`TemplateElement[value.cooked=/${shape}/]`),
    `tests/.eslintrc.cjs must carry the selector TemplateElement[value.cooked=/${shape}/]`);
  // The message is one string split over two lines; read it joined.
  assert.match(eslintrc.replace(/'\s*\n\s*\+\s*'/g, ''), /Use THEMES_TAG \/ BUNDLES_TAG from fixtures\/test/);
});
