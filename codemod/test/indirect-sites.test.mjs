import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createHop } from '../src/lib/resolve.mjs';
import { VERSIONS_DIR, buildPlan, loadManifest } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { normalizeSelector } from '../src/transforms/detect.mjs';
import { parse } from './helpers/parse.mjs';

const MANIFESTS = {
  '18.0.0': await loadManifest(join(VERSIONS_DIR, '18.0.0')),
  '18.1.0': await loadManifest(join(VERSIONS_DIR, '18.1.0')),
};
const CULTURE = '18.0.0/numeric-format-culture';
const IMPORT = 'import Handsontable from \'handsontable\';\n';

/**
 * Run a file through the real rules of one version, with the generic markers off.
 *
 * @param {string} version Manifest version.
 * @param {string} filePath File name, which picks the adapter.
 * @param {string} source File text.
 * @param {string[]} [only] Rule ids to run, all when empty.
 * @param {boolean} [aggressive] The `--aggressive` option.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The `transformFile` result.
 */
function run(version, filePath, source, only = [], aggressive = false) {
  const plan = buildPlan([MANIFESTS[version]], only);

  return transformFile({ filePath, source, plan, options: { markers: false, aggressive } });
}

/**
 * Run the culture move rule over a settings object in a Handsontable file, plus extra file text.
 *
 * @param {string} columns The text of the `columns` array.
 * @param {string} [extra] Text added before the grid.
 * @param {boolean} [aggressive] The `--aggressive` option.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The result.
 */
function move(columns, extra = '', aggressive = false) {
  return run('18.0.0', 'grid.js', `${IMPORT}${extra}\nnew Handsontable(el, { columns: [${columns}] });\n`, [CULTURE],
    aggressive);
}

describe('resolve: one hop in the same file', () => {
  const source = [
    'import { IMPORTED } from \'./x\';',
    'const FORMAT = \'DD.MM.YYYY\';',
    'let mutable = \'a\';',
    'const MAP = { date: \'YYYY\', nested: { deep: \'z\' } } as const;',
    'const ALIAS = FORMAT;',
    'function f(param) {',
    '  return [param, IMPORTED, FORMAT, mutable, MAP.date, MAP.nested, MAP.missing, ALIAS, \'literal\'];',
    '}',
  ].join('\n');
  const { j, root } = parse(source, 'ts');
  const { hop, stringOf } = createHop(j, root);
  const items = root.find(j.ArrayExpression).paths()[0];
  const at = index => items.get('elements', index);

  it('follows a const identifier and a member of a const object, through as const', () => {
    assert.equal(stringOf(at(2)), 'DD.MM.YYYY');
    assert.equal(stringOf(at(4)), 'YYYY');
    assert.equal(stringOf(at(8)), 'literal');
    assert.equal(hop(at(5)).node.type, 'ObjectExpression');
  });

  it('does not follow an import, a parameter, a let, a missing member, or a second hop', () => {
    assert.equal(hop(at(0)), null);
    assert.equal(hop(at(1)), null);
    assert.equal(hop(at(3)), null);
    assert.equal(hop(at(6)), null);
    assert.equal(stringOf(at(7)), null);
  });
});

describe('numeric-format-culture: custom code that reads the key', () => {
  it('moves the key for a built-in renderer, for none, and for undefined', async() => {
    const result = await move('{ renderer: \'numeric\', numericFormat: { culture: \'de-DE\' } }, '
      + '{ renderer: \'text\', numericFormat: { culture: \'de-DE\' } }, '
      + '{ renderer: undefined, numericFormat: { culture: \'de-DE\' } }');

    assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 3);
    assert.doesNotMatch(result.output, /culture/);
  });

  it('keeps the key next to a function, an identifier, a member, and an unknown name', async() => {
    const result = await move('{ renderer: fn, numericFormat: { culture: \'a-A\' } }, '
      + '{ renderer: kit.render, numericFormat: { culture: \'b-B\' } }, '
      + '{ renderer: \'mine\', numericFormat: { culture: \'c-C\' } }, '
      + '{ renderer(i, td) { return td; }, numericFormat: { culture: \'d-D\' } }');

    assert.equal(result.changed, false);
    assert.deepEqual(result.entries.map(entry => entry.severity), ['manual', 'manual', 'manual', 'manual']);
    assert.match(result.entries[0].message, /^Move numericFormat\.culture to locale and update the renderer/);
  });

  it('applies under --aggressive to a guessed object too', async() => {
    const source = `${IMPORT}const s = { colHeaders: true, rowHeaders: true, renderer: fn, `
      + 'numericFormat: { culture: \'de-DE\' } };\n';
    const result = await run('18.0.0', 'grid.js', source, [CULTURE], true);

    assert.equal(result.changed, false);
    assert.equal(result.entries[0].severity, 'manual');
  });

  for (const [name, read] of [
    ['a member read', 'const c = cellProperties.numericFormat.culture;'],
    ['an optional read', 'const c = cellProperties.numericFormat?.culture;'],
    ['a read through as and parentheses', 'const c = (cellProperties.numericFormat as { culture?: string })?.culture;'],
    ['a read of the bare name', 'const c = numericFormat.culture;'],
    ['a destructuring with a default', 'const { culture = \'en\' } = (cellProperties.numericFormat ?? {}) as Fmt;'],
    ['a nested destructuring', 'const { numericFormat: { culture } } = cellProperties;'],
  ]) {
    it(`keeps the key when the file reads it: ${name}`, async() => {
      const result = await run('18.0.0', 'grid.ts', `${IMPORT}${read}\n`
        + 'new Handsontable(el, { columns: [{ numericFormat: { culture: \'de-DE\' } }] });\n', [CULTURE]);

      assert.equal(result.changed, false);
      assert.deepEqual(result.entries.map(entry => entry.severity), ['manual']);
    });
  }

  it('moves the key when the file reads another key or another object', async() => {
    const result = await run('18.0.0', 'grid.ts', `${IMPORT}const a = cellProperties.numericFormat.pattern;\n`
      + 'const b = config.culture;\nconst { pattern } = cellProperties.numericFormat;\n'
      + 'new Handsontable(el, { columns: [{ numericFormat: { culture: \'de-DE\' } }] });\n', [CULTURE]);

    assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 1);
    assert.match(result.output, /locale: 'de-DE'/);
  });

  it('keeps the key next to a custom renderer attribute of a wrapper', async() => {
    const source = 'import { HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = () => <HotColumn renderer="mine" numericFormat={{ culture: \'de-DE\' }} />;\n'
      + 'export const B = () => <HotColumn renderer="numeric" numericFormat={{ culture: \'de-DE\' }} />;\n';
    const result = await run('18.0.0', 'grid.tsx', source, [CULTURE]);

    assert.deepEqual(result.entries.map(entry => `${entry.line}:${entry.severity}`), ['2:manual', '3:changed']);
  });
});

describe('numeric-format-culture: a value the tool cannot read', () => {
  it('reports a member read, an imported name, and a spread, and stays silent for a certain absence', async() => {
    const result = await move('{ numericFormat: kit.amount }, { numericFormat: IMPORTED }, '
      + '{ numericFormat: { ...kit.amount } }, { numericFormat: PLAIN }, { numericFormat: { ...PLAIN, style: \'x\' } }',
    'import { IMPORTED, kit } from \'./kit\';\nconst PLAIN = { style: \'percent\' };\n// Every culture is set in kit.');

    assert.equal(result.changed, false);
    assert.equal(result.entries.length, 3);
    assert.ok(result.entries.every(entry => entry.severity === 'manual'));
  });

  it('does not read a let, a var, or a parameter', async() => {
    const result = await move('{ numericFormat: letFormat }',
      'let letFormat = { style: \'percent\' };\n// culture is set elsewhere.');

    assert.equal(result.entries.length, 1);
  });

  it('reports the pair in an object that no option rule recognizes, in a Handsontable file only', async() => {
    const hot = await run('18.0.0', 'a.js',
      `${IMPORT}export const x = (c) => ({ ...c, numericFormat: { culture: 'a' } });\n`,
      [CULTURE]);
    const plain = await run('18.0.0', 'a.js',
      'export const x = (c) => ({ ...c, numericFormat: { culture: \'a\' } });\n',
      [CULTURE]);

    assert.deepEqual(hot.entries.map(entry => entry.severity), ['manual']);
    assert.equal(hot.changed, false);
    assert.deepEqual(plain.entries, []);
  });

  it('ignores a DOM tag and a component with too few known options', async() => {
    const source = 'import { HotTable } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = () => <input correctFormat numericFormat={{ culture: \'a\' }} />;\n'
      + 'export const B = () => <Chart correctFormat />;\n'
      + 'export const C = () => <Chart data correctFormat />;\n';
    const result = await run('18.0.0', 'a.tsx', source, ['18.0.0/correct-format-removed', CULTURE]);

    assert.deepEqual(result.entries, []);
  });
});

describe('selectors in component styles', () => {
  it('takes the scoping wrappers out of a selector', () => {
    assert.equal(normalizeSelector('.a :deep(.ht-grid) > b'), '.a .ht-grid > b');
    assert.equal(normalizeSelector(':global(.ht-grid > :first-child)'), '.ht-grid > :first-child');
    assert.equal(normalizeSelector('.a ::v-deep(.b:not(.c)) .d'), '.a .b:not(.c) .d');
    assert.equal(normalizeSelector('.a ::v-deep .b'), '.a   .b');
    assert.equal(normalizeSelector(':host ::ng-deep .b'), ':host   .b');
    assert.equal(normalizeSelector('.a >>> .b'), '.a   .b');
    assert.equal(normalizeSelector('.a /deep/ .b'), '.a   .b');
    assert.equal(normalizeSelector('.a :deep(.b'), '.a .b');
    assert.equal(normalizeSelector('.plain > .b'), '.plain > .b');
  });

  it('reports a wrapped selector in a Vue style block on its own line', async() => {
    const source = '<template><HotTable /></template>\n<style scoped lang="scss">\n'
      + '.m :deep(.ht-grid) > :first-child {\n  top: 0;\n}\n</style>\n';
    const result = await run('18.0.0', 'M.vue', source, ['18.0.0/wrapper-dom-selectors']);

    assert.deepEqual(result.entries.map(entry => entry.line), [3]);
  });
});

describe('column move hooks registered indirectly', () => {
  const HOOK = '18.1.0/column-move-hooks';
  const head = 'import Handsontable from \'handsontable/base\';\n';

  it('reads the hook name from a const object, also as const, and from a const', async() => {
    const result = await run('18.1.0', 'a.ts', `${head}const M = { moved: 'afterColumnMove' } as const;\n`
      + 'const N = \'beforeColumnMove\';\nconst O = { other: \'afterChange\' };\n'
      + 'const hot = new Handsontable(el, {});\n'
      + 'hot.addHook(M.moved, f);\nhot.addHook(N, f);\nhot.addHook(O.other, f);\nhot.addHook(M.missing, f);\n', [HOOK]);

    assert.deepEqual(result.entries.map(entry => entry.line), [6, 7]);
  });

  it('reads an alias of Handsontable.hooks, and no other receiver of add()', async() => {
    const result = await run('18.1.0', 'a.ts', `${head}const g = Handsontable.hooks;\nconst other = lib.hooks;\n`
      + 'const set = new Set();\ng.add(\'beforeColumnMove\', f);\ng.once(\'afterColumnMove\', f);\n'
      + 'other.add(\'afterColumnMove\', f);\n'
      + 'set.add(\'afterColumnMove\');\nHandsontable.hooks.add(\'afterColumnMove\', f);\n', [HOOK]);

    assert.deepEqual(result.entries.map(entry => entry.line), [5, 6, 9]);
  });

  it('reads a hook key of a map annotated Events, and nothing else', async() => {
    const result = await run('18.1.0', 'a.ts', `${head}import type { Events } from 'handsontable';\n`
      + 'const a: Partial<Events> = { afterColumnMove: f };\nconst b: Events = { beforeColumnMove: f };\n'
      + 'const c = { afterColumnMove: f };\nconst d: Record<string, unknown> = { afterColumnMove: f };\n', [HOOK]);

    assert.deepEqual(result.entries.map(entry => entry.line), [3, 4]);
  });
});

describe('dates and times that come from a variable', () => {
  const DATE = '18.0.0/moment-date-format';

  it('tests a const as the literal it holds, and reports one it cannot read', async() => {
    const result = await run('18.0.0', 'a.js',
      `${IMPORT}const F = 'DD.MM.YYYY';\nconst E = '';\nconst I = { year: 'numeric' };\n`
      + 'new Handsontable(el, { columns: [\n{ dateFormat: F },\n{ dateFormat: E },\n'
      + '{ dateFormat: I },\n{ dateFormat: other },\n] });\n',
      [DATE]);

    assert.equal(result.entries.length, 2);
    assert.match(result.entries[0].message, /^Replace the string dateFormat/);
    assert.match(result.entries[1].message, /^Check the dateFormat value, because it comes from a variable/);
  });

  it('reports a JSX attribute that holds a variable', async() => {
    const result = await run('18.0.0', 'a.jsx', 'import { HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = () => <HotColumn dateFormat={FORMAT} />;\n', [DATE]);

    assert.equal(result.entries.length, 1);
    assert.match(result.entries[0].message, /comes from a variable/);
  });
});

describe('html without a sanitizer, with settings the tool cannot read', () => {
  const RULE = '18.0.0/html-without-sanitizer';
  const head = `${IMPORT}const markup = { colHeaders: ['<b>A</b>'] };\nconst none = { colHeaders: ['A'] };\n`;

  it('names the unread spread and asks to check it, when the markup is visible', async() => {
    const result = await run('18.0.0', 'a.js', `${head}new Handsontable(el, { ...props, ...markup });\n`, [RULE]);

    assert.equal(result.entries.length, 1);
    assert.match(result.entries[0].message, /^Check that one of the spread \.\.\.props sets a sanitizer option/);
  });

  it('names a computed key and the settings prop', async() => {
    const computed = await run('18.0.0', 'a.js', `${head}new Handsontable(el, { ...markup, [key]: 1 });\n`, [RULE]);
    const prop = await run('18.0.0', 'a.jsx', 'import { HotTable } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = ({ s }) => <HotTable colHeaders={[\'<i>x</i>\']} settings={s} />;\n', [RULE]);

    assert.match(computed.entries[0].message, /^Check that one of a computed key sets/);
    assert.match(prop.entries[0].message, /^Check that one of the settings prop sets/);
  });

  it('stays silent without visible markup, with a visible sanitizer, or with every source read', async() => {
    const noMarkup = await run('18.0.0', 'a.js', `${head}new Handsontable(el, { ...props, ...none });\n`, [RULE]);
    const sanitized = await run('18.0.0', 'a.js',
      `${head}new Handsontable(el, { ...props, ...markup, sanitizer: s });\n`, [RULE]);
    const hidden = await run('18.0.0', 'a.js', `${head}new Handsontable(el, { ...props });\n`, [RULE]);

    assert.deepEqual([noMarkup.entries.length, sanitized.entries.length, hidden.entries.length], [0, 0, 0]);
  });

  it('does not hedge the license key check, which has no markup to see', async() => {
    const result = await run('18.1.0', 'a.js', `${IMPORT}new Handsontable(el, { ...props });\n`,
      ['18.1.0/license-key-missing']);

    assert.deepEqual(result.entries, []);
  });
});

describe('markers of an entry inside a literal', () => {
  it('puts the marker of a variable in a template literal on the statement, and reports the line of the variable', async() => {
    const plan = buildPlan([MANIFESTS['18.0.0']], ['18.0.0/css-wrapper-border-width']);
    const source = 'export const s = css`\n  a {\n    --ht-wrapper-border-width: 1px;\n  }\n`;\n';
    const result = await transformFile({ filePath: 'a.js', source, plan, options: {} });

    assert.deepEqual(result.entries.map(entry => entry.line), [3]);
    assert.match(result.output, /^\/\/ TODO\(handsontable-codemod 18\.0\.0\/css-wrapper-border-width\)/);
  });
});
