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

describe('resolve: a key that an object literal repeats', () => {
  const source = 'const MAP = { date: \'first\', other: \'x\', date: \'last\' };\n'
    + 'export const read = [MAP.date, MAP.other];\n';
  const { j, root } = parse(source, 'babylon');
  const { stringOf } = createHop(j, root);
  const items = root.find(j.ArrayExpression).paths()[0];

  it('takes the last value, as the language does', () => {
    assert.equal(stringOf(items.get('elements', 0)), 'last');
    assert.equal(stringOf(items.get('elements', 1)), 'x');
  });
});

describe('numeric-format-culture: custom code that reads the key', () => {
  it('moves the key for a built-in renderer, for none, and for undefined', async() => {
    const result = await move('{ renderer: \'numeric\', numericFormat: { culture: \'de-DE\' } }, '
      + '{ type: \'numeric\', renderer: \'text\', numericFormat: { culture: \'de-DE\' } }, '
      + '{ type: \'numeric\', renderer: undefined, numericFormat: { culture: \'de-DE\' } }');

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
    assert.match(result.entries[0].message, /^Move numericFormat\.culture to locale and update the code that reads it/);
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
    ['a read of a nullish default', 'const c = (cp.numericFormat ?? {}).culture;'],
    ['a read of a falsy default', 'const c = (cp.numericFormat || {}).culture;'],
    ['a destructuring of a nullish default', 'const { culture } = cp.numericFormat ?? {};'],
    ['a destructuring of a falsy default', 'const { culture } = cp.numericFormat || {};'],
    ['a read of a bare name with a falsy default', 'const c = (numericFormat || {}).culture;'],
    ['a chain of defaults', 'const c = (cp.numericFormat || fallback || {}).culture;'],
  ]) {
    it(`keeps the key when the file reads it: ${name}`, async() => {
      const result = await run('18.0.0', 'grid.ts', `${IMPORT}${read}\n`
        + 'new Handsontable(el, { columns: [{ type: \'numeric\', numericFormat: { culture: \'de-DE\' } }] });\n',
      [CULTURE]);

      assert.equal(result.changed, false);
      assert.deepEqual(result.entries.map(entry => entry.severity), ['manual']);
      assert.match(result.entries[0].message, /the code in this file that reads numericFormat\.culture/);
    });
  }

  it('moves the key when the file reads another key or another object', async() => {
    const result = await run('18.0.0', 'grid.ts', `${IMPORT}const a = cellProperties.numericFormat.pattern;\n`
      + 'const b = config.culture;\nconst { pattern } = cellProperties.numericFormat;\n'
      + 'new Handsontable(el, { columns: [{ type: \'numeric\', numericFormat: { culture: \'de-DE\' } }] });\n',
    [CULTURE]);

    assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 1);
    assert.match(result.output, /locale: 'de-DE'/);
  });

  it('keeps the key next to a custom renderer attribute of a wrapper', async() => {
    const source = 'import { HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = () => <HotColumn renderer="mine" numericFormat={{ culture: \'de-DE\' }} />;\n'
      + 'export const B = () => <HotColumn renderer="numeric" numericFormat={{ culture: \'de-DE\' }} />;\n';
    const result = await run('18.0.0', 'grid.tsx', source, [CULTURE]);

    // The element that moved also gets the note about the number format, which 18.0 gives the Intl defaults.
    assert.deepEqual(result.entries.map(entry => `${entry.line}:${entry.severity}`),
      ['2:manual', '3:changed', '3:manual']);
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

describe('numeric-format-culture: a const object that the file changes', () => {
  const cases = [
    ['a member write', 'fmt.culture = \'de-DE\';'],
    ['a member write below the object', 'fmt.nested = {};\nfmt.nested.culture = \'de-DE\';'],
    ['a string key write', 'fmt[\'culture\'] = \'de-DE\';'],
    ['a delete', 'delete fmt.pattern; // culture'],
    ['an update', 'fmt.count++; // culture'],
    ['a destructuring target', '({ culture: fmt.culture } = bag);'],
    ['an assign of another object', 'Object.assign(fmt, base); // culture is in base'],
    ['a call that receives it', 'configure(fmt); // culture is set in configure'],
  ];

  for (const [label, change] of cases) {
    it(`reports it after ${label}, as a value it cannot read`, async() => {
      const result = await move('{ numericFormat: fmt }', `const fmt = { pattern: '0,0' };\n${change}`);

      assert.equal(result.changed, false);
      assert.deepEqual(result.entries.map(entry => entry.severity), ['manual']);
      assert.match(result.entries[0].message, /by hand if it sets culture/);
    });
  }

  it('stays silent for an object that nothing changes, and for one that only reads or hands over a copy', async() => {
    const reads = 'const fmt = { pattern: \'0,0\' };\nuse(fmt.pattern);\nconst copy = { ...fmt };\nlog({ ...fmt });\n'
      + 'const keys = Object.keys(fmt);\nconst twin = Object.assign({}, fmt);\nconsole.log(fmt);\n'
      + 'JSON.stringify(fmt);\n// culture is elsewhere.';
    const result = await move('{ numericFormat: fmt }', reads);

    assert.deepEqual(result.entries, []);
  });

  it('keeps an object passed to new, which is how a grid reads its settings', async() => {
    const result = await move('{ numericFormat: fmt }',
      'const fmt = { pattern: \'0,0\' };\nnew Widget(fmt);\n// culture');

    assert.deepEqual(result.entries, []);
  });

  it('answers an exact question with null and a plain one with the object', () => {
    const { j, root } = parse('const fmt = { a: 1 };\nfmt.b = 2;\nconst fine = { a: 1 };\nuse(fmt, fine);', 'ts');
    const { hop } = createHop(j, root);
    const call = root.find(j.CallExpression).paths()[0];

    assert.equal(hop(call.get('arguments', 0)).node.type, 'ObjectExpression');
    assert.equal(hop(call.get('arguments', 0), { exact: true }), null);
    assert.equal(hop(call.get('arguments', 1), { exact: true }), null, 'use(fine) hands the object to a call');
  });
});

describe('resolve: a method call on a const object or array is a possible change', () => {
  /**
   * Resolve the identifier read at the end of a file exactly.
   *
   * @param {string} body Statements before the last one, which reads `value`.
   * @returns {boolean} `true` when the exact answer is the literal.
   */
  const resolvesExactly = (body) => {
    const { j, root } = parse(`${body}\nexport const out = [value];\n`, 'ts');
    const { hop } = createHop(j, root);
    const out = root.find(j.ArrayExpression).paths().pop();

    return hop(out.get('elements', 0), { exact: true }) !== null;
  };

  for (const [label, body] of [
    ['push', 'const value = [];\nvalue.push(1);'],
    ['sort', 'const value = [2, 1];\nvalue.sort();'],
    ['splice on a member', 'const value = { list: [1, 2] };\nvalue.list.splice(0, 1);'],
    ['an optional call', 'const value = [];\nvalue?.push(1);'],
    ['a method of the object itself', 'const value = { reset() {} };\nvalue.reset();'],
    ['a computed method name', 'const value = [];\nvalue[\'push\'](1);'],
    ['merge of a settings object', 'const value = { a: 1 };\nvalue.merge(base);'],
    ['set on a member of the object', 'const value = { entries: [] };\nvalue.entries.set(key, 1);'],
  ]) {
    it(`gives null for an exact answer after ${label}`, () => {
      assert.equal(resolvesExactly(body), false, body);
    });
  }

  for (const [label, body] of [
    ['map and filter', 'const value = [1, 2];\nvalue.map(String);\nvalue.filter(Boolean);'],
    ['slice, join, and includes', 'const value = [1, 2];\nvalue.slice(1).join(\',\');\nvalue.includes(1);'],
    ['forEach', 'const value = [1];\nvalue.forEach(item => item);'],
    ['hasOwnProperty', 'const value = { a: 1 };\nvalue.hasOwnProperty(\'a\');'],
    ['a read of a member', 'const value = { a: [1] };\nconst first = value.a[0];'],
    ['trim of a string member', 'const value = { pattern: \' 0.0 \' };\nvalue.pattern.trim();'],
    ['startsWith and endsWith of a string member',
      'const value = { pattern: \'0.0\' };\nvalue.pattern.startsWith(\'0\');\nvalue.pattern.endsWith(\'0\');'],
    ['case and replace of a string member',
      'const value = { name: \'a-b\' };\nvalue.name.toLowerCase().replace(\'-\', \'_\').split(\'_\');'],
    ['padding, repeat, and match of a string member',
      'const value = { name: \'a\' };\nvalue.name.padStart(3).repeat(2).match(/a/);\nvalue.name.localeCompare(\'b\');'],
    ['substring and char reads of a string member',
      'const value = { name: \'abc\' };\nvalue.name.substring(1);\nvalue.name.charAt(0);\nvalue.name.normalize();'],
    ['get and has of a map member',
      'const value = { cache: new Map() };\nvalue.cache.get(key);\nvalue.cache.has(key);'],
    ['has of a set member', 'const value = { seen: new Set() };\nvalue.seen.has(key);'],
    ['number formatting of a member', 'const value = { size: 1.5 };\nvalue.size.toFixed(1);'],
    ['toJSON and with on a member', 'const value = { list: [1] };\nvalue.list.toJSON();\nvalue.list.with(0, 2);'],
  ]) {
    it(`keeps the exact answer when the file only reads: ${label}`, () => {
      assert.equal(resolvesExactly(body), true, body);
    });
  }
});

describe('resolve: a const that the file only reads through string and map methods keeps its exact answer', () => {
  const REMOVAL = ['18.0.0/correct-format-removed'];

  it('still deletes correctFormat next to a spread of a const that is trimmed and tested', async() => {
    const source = `${IMPORT}const base = { colHeaders: true, label: ' a ', cache: new Map() };\n`
      + 'const label = base.label.trim().toUpperCase();\nconst seen = base.cache.has(label);\n'
      + 'new Handsontable(el, { columns: [{ ...base, type: \'date\', correctFormat: true }] });\n';
    const result = await run('18.0.0', 'a.js', source, REMOVAL);

    const changed = result.entries.filter(entry => entry.severity === 'changed');

    assert.equal(changed.length, 1, JSON.stringify(result.entries));
    assert.doesNotMatch(result.output, /correctFormat: true/);
  });

  it('keeps correctFormat and reports it when the same const is changed through a method', async() => {
    const source = `${IMPORT}const base = { colHeaders: true, cache: new Map() };\nbase.cache.set(key, 1);\n`
      + 'new Handsontable(el, { columns: [{ ...base, type: \'date\', correctFormat: true }] });\n';
    const result = await run('18.0.0', 'a.js', source, REMOVAL);

    const changed = result.entries.filter(entry => entry.severity === 'changed');

    assert.equal(changed.length, 0, JSON.stringify(result.entries));
    assert.match(result.output, /correctFormat: true/);
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

  it('follows a local that holds markup and a spread the tool cannot read, one hop or two', async() => {
    const local = `${head}const held = { ...remote, colHeaders: ['<i>A</i>'] };\n`;
    const direct = await run('18.0.0', 'a.js', `${local}new Handsontable(el, { ...held });\n`, [RULE]);
    const twice = await run('18.0.0', 'a.js',
      `${local}const outer = { ...held, rowHeaders: ['x'] };\nnew Handsontable(el, { ...outer });\n`, [RULE]);

    for (const result of [direct, twice]) {
      assert.equal(result.entries.length, 1);
      assert.match(result.entries[0].message, /^Check that one of the spread \.\.\.remote sets a sanitizer option/);
    }
  });

  it('stays silent for such a local when it, or the object that holds it, sets a sanitizer', async() => {
    const inner = await run('18.0.0', 'a.js', `${head}const held = { ...remote, ...markup, sanitizer: s };\n`
      + 'new Handsontable(el, { ...held });\n', [RULE]);
    const outer = await run('18.0.0', 'a.js', `${head}const held = { ...remote, ...markup };\n`
      + 'new Handsontable(el, { ...held, sanitizer: s });\n', [RULE]);
    const none = await run('18.0.0', 'a.js', `${head}const held = { ...remote, ...none };\n`
      + 'new Handsontable(el, { ...held });\n', [RULE]);

    assert.deepEqual([inner.entries.length, outer.entries.length, none.entries.length], [0, 0, 0]);
  });

  it('reads the element of a wrapper the same way', async() => {
    const result = await run('18.0.0', 'a.jsx', 'import { HotTable } from \'@handsontable/react-wrapper\';\n'
      + 'const held = { ...remote, colHeaders: [\'<i>A</i>\'] };\n'
      + 'export const A = () => <HotTable {...held} />;\n', [RULE]);

    assert.equal(result.entries.length, 1);
    assert.match(result.entries[0].message, /^Check that one of the spread \.\.\.remote sets/);
  });

  it('ends on objects that spread each other', async() => {
    const result = await run('18.0.0', 'a.js', `${IMPORT}const a = { ...b, colHeaders: ['<i>A</i>'] };\n`
      + 'const b = { ...a };\nnew Handsontable(el, { ...a });\n', [RULE]);

    assert.equal(result.entries.length, 1);
    assert.match(result.entries[0].message, /^Check that one of the spread \.\.\.(a|b) sets/);
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
