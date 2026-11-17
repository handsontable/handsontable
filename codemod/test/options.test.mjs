import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { skipWithoutFile } from './helpers/guide-source.mjs';
import { parse } from './helpers/parse.mjs';

const shippedManifests = await loadManifests();
const IMPORT = 'import Handsontable from \'handsontable\';\n';
const RENAME = { id: '18.0.0/rename', kind: 'optionRename', from: 'oldName', to: 'newName' };
const MOVE = {
  id: '18.0.0/move',
  kind: 'optionMove',
  from: 'numericFormat.culture',
  to: 'locale',
  minConfidence: 'medium',
};
const REMOVE = { id: '18.0.0/remove', kind: 'optionRemove', name: 'gone', advice: 'It is gone.' };
const REMOVE_FORMAT = { ...REMOVE, id: '18.0.0/correct-format', name: 'correctFormat' };
const CALLS = {
  id: '18.0.0/calls',
  kind: 'optionRename',
  from: 'columnHeaders',
  to: 'colHeaders',
  context: { callArg: ['downloadFile', 'exportAsString'], receiver: { plugin: 'exportFile' } },
};

/**
 * Run source text through some option rules.
 *
 * @param {string} source File text.
 * @param {object[]} rules Rules to run.
 * @param {object} [settings] Settings.
 * @param {string} [settings.filePath] File name, which picks the parser.
 * @param {boolean} [settings.aggressive] The `--aggressive` option.
 * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The `transformFile` result.
 */
function run(source, rules, { filePath = 'file.js', aggressive = false } = {}) {
  const full = rules.map(rule => ({ safe: true, version: '18.0.0', guideUrl: null, ...rule }));
  const plan = buildPlan([{ version: '18.0.0', rules: full }]);

  return transformFile({ filePath, source, plan, options: { aggressive, markers: false } });
}

/**
 * Wrap an options object in a call that makes it a high-confidence Handsontable options object.
 *
 * @param {string} object Object literal text.
 * @returns {string} A file.
 */
function grid(object) {
  return `${IMPORT}new Handsontable(el, ${object});\n`;
}

/**
 * Entries of one severity as `line:severity`, for compact assertions.
 *
 * @param {object[]} entries Report entries.
 * @returns {string[]} The entries.
 */
function summary(entries) {
  return entries.map(entry => `${entry.line}:${entry.severity}`);
}

describe('optionRename in option objects', () => {
  it('renames the key and leaves the value, the other keys, and the comments alone', async() => {
    const source = grid('{\n  // headers\n  oldName: true, // inline\n  colHeaders: true,\n}');
    const result = await run(source, [RENAME]);

    assert.equal(result.output, source.replace('oldName', 'newName'));
    assert.deepEqual(summary(result.entries), ['4:changed']);
  });

  it('keeps the quote style of a quoted key', async() => {
    const single = await run(grid('{ \'oldName\': 1, colHeaders: true }'), [RENAME]);
    const double = await run(grid('{ "oldName": 1, colHeaders: true }'), [RENAME]);

    assert.match(single.output, /'newName': 1/);
    assert.match(double.output, /"newName": 1/);
  });

  it('turns a shorthand property into key: value', async() => {
    const result = await run(grid('{ oldName, colHeaders: true }'), [RENAME]);

    assert.match(result.output, /newName: oldName/);
  });

  it('renames a method key and ignores a computed key', async() => {
    const method = await run(grid('{ oldName() { return 1; }, colHeaders: true }'), [RENAME]);
    const computed = await run(grid('{ [\'oldName\']: 1, colHeaders: true }'), [RENAME]);

    assert.match(method.output, /newName\(\)/);
    assert.equal(computed.changed, false);
  });

  it('reports instead of renaming when the target key exists', async() => {
    const result = await run(grid('{ oldName: 1, newName: 2 }'), [RENAME]);

    assert.equal(result.changed, false);
    assert.deepEqual(summary(result.entries), ['2:manual']);
    assert.match(result.entries[0].message, /both oldName and newName are set in this object/);
  });

  it('renames a key after a spread of an object literal that sets neither name', async() => {
    const source = `${IMPORT}const base = { other: 1 };\nnew Handsontable(el, { ...base, oldName: 1 });\n`;
    const result = await run(source, [RENAME]);

    assert.match(result.output, /\.\.\.base, newName: 1/);
  });

  it('reaches objects through columns, cells(), updateSettings(), and a one-hop variable', async() => {
    const source = `${IMPORT}const col = { oldName: 1 };
const hot = new Handsontable(el, { columns: [col, { oldName: 2 }], cells: () => ({ oldName: 3 }) });
hot.updateSettings({ oldName: 4 });
`;
    const result = await run(source, [RENAME]);

    assert.equal(result.output.match(/newName/g).length, 4);
    assert.equal(result.output.includes('oldName'), false);
  });
});

describe('optionRename and the receiver of updateSettings', () => {
  const FORMAT = { ...REMOVE, id: '18.0.0/correct-format', name: 'correctFormat' };
  const call = (receiver, preamble = '') => `${IMPORT}${preamble}${receiver}.updateSettings({ oldName: 1 });\n`;

  it('rewrites a confirmed instance, a hotInstance chain, and a class member set from new', async() => {
    for (const source of [
      call('hot', 'const hot = new Handsontable(el);\n'),
      call('ref.current?.hotInstance'),
      call('grid', 'const grid = ref.current.hotInstance;\n'),
      `${IMPORT}class A {\n  init() { this.hot = new Handsontable(el); }\n`
        + '  go() { this.hot.updateSettings({ oldName: 1 }); }\n}\n',
    ]) {
      const result = await run(source, [RENAME]);

      assert.match(result.output, /newName: 1/, source);
    }
  });

  it('leaves the argument of another API alone, even under --aggressive, with no entry', async() => {
    for (const source of [
      call('store', 'const store = { updateSettings() {} };\n'),
      call('form', 'import form from \'./form\';\n'),
      call('plugin', 'const plugin = hot.getPlugin(\'filters\');\n'),
      call('hot.getPlugin(\'filters\')'),
      `${IMPORT}class A {\n  store = { updateSettings() {} };\n`
        + '  go() { this.store.updateSettings({ oldName: 1 }); }\n}\n',
    ]) {
      for (const aggressive of [false, true]) {
        const result = await run(source, [RENAME], { aggressive });

        assert.equal(result.changed, false, source);
        assert.deepEqual(result.entries, [], source);
      }
    }
  });

  it('leaves the removable key of a store alone, whatever the other keys say', async() => {
    const source = `${IMPORT}const store = { updateSettings() {} };\n`
      + 'store.updateSettings({ correctFormat: true, colHeaders: true, rowHeaders: true });\n';

    for (const aggressive of [false, true]) {
      const result = await run(source, [FORMAT], { aggressive });

      assert.equal(result.changed, false);
      assert.deepEqual(result.entries, []);
    }
  });

  it('reports an unresolved receiver, and rewrites it under --aggressive', async() => {
    for (const source of [
      `${IMPORT}function f(grid) {\n  grid.updateSettings({ oldName: 1 });\n}\n`,
      call('registry.getInstance(id)'),
      call('hot'),
    ]) {
      const plain = await run(source, [RENAME]);
      const aggressive = await run(source, [RENAME], { aggressive: true });

      assert.equal(plain.changed, false, source);
      assert.equal(plain.entries.length, 1, source);
      assert.equal(plain.entries[0].severity, 'manual', source);
      assert.match(plain.entries[0].message, /--aggressive/, source);
      assert.match(aggressive.output, /newName: 1/, source);
    }
  });
});

describe('optionRename confidence bar', () => {
  const heuristic = `${IMPORT}const settings = { oldName: 1, colHeaders: true, rowHeaders: true };\n`;

  it('reports a medium object and leaves it alone', async() => {
    const result = await run(heuristic, [RENAME]);

    assert.equal(result.changed, false);
    assert.deepEqual(summary(result.entries), ['2:manual']);
    assert.match(result.entries[0].message, /--aggressive/);
  });

  it('rewrites a medium object for a rule with minConfidence medium, and under --aggressive', async() => {
    const byRule = await run(heuristic, [{ ...RENAME, minConfidence: 'medium' }]);
    const byFlag = await run(heuristic, [RENAME], { aggressive: true });

    assert.match(byRule.output, /newName: 1/);
    assert.match(byFlag.output, /newName: 1/);
  });

  it('never touches a file with no Handsontable usage, not even under --aggressive', async() => {
    const source = '// handsontable settings\nexport const s = { oldName: 1, colHeaders: true, rowHeaders: true };\n';
    const plain = await run(source, [RENAME]);
    const aggressive = await run(source, [RENAME], { aggressive: true });

    assert.deepEqual([plain.changed, plain.entries.length], [false, 0]);
    assert.deepEqual([aggressive.changed, aggressive.entries.length], [false, 0]);
  });

  it('leaves the removal rules alone in a file with no Handsontable usage under --aggressive', async() => {
    const source = 'export const cfg = { correctFormat: true, datePickerConfig: {} };\n';
    const rules = [REMOVE_FORMAT, { ...REMOVE_FORMAT, id: '18.0.0/date-picker', name: 'datePickerConfig' }];
    const result = await run(source, rules, { aggressive: true });

    assert.deepEqual([result.changed, result.entries.length], [false, 0]);
    assert.equal(result.output, source);
  });

  it('needs two known options besides the one the rule acts on, even under --aggressive', async() => {
    const lookAlike = `${IMPORT}const s = { locale: 'zz', numericFormat: { culture: 'de-DE' } };\n`;
    const twoRemovals = `${IMPORT}const s = { correctFormat: true, datePickerConfig: {} };\n`;
    const moved = await run(lookAlike, [MOVE], { aggressive: true });
    const removed = await run(twoRemovals, [REMOVE_FORMAT], { aggressive: true });

    assert.equal(moved.changed, false);
    assert.equal(removed.changed, false);
    assert.match(moved.entries[0].message, /fewer than two other known options/);
    assert.match(removed.entries[0].message, /fewer than two other known options/);
  });

  it('needs one of the two other known options to be a distinctive one, even under --aggressive', async() => {
    // `locale`, `width`, `height`, `data`, and `language` also appear in objects that are not grid settings.
    for (const company of ['locale: \'pl\', width: 100', 'locale: \'pl\', height: 100', 'data: [], width: 100',
      'locale: \'pl\', language: \'en\'']) {
      const source = `${IMPORT}const s = { correctFormat: true, ${company} };\n`;
      const result = await run(source, [REMOVE_FORMAT], { aggressive: true });

      assert.equal(result.changed, false, company);
      assert.equal(result.output, source, company);
      assert.deepEqual(result.entries.map(entry => entry.severity), ['manual'], company);
    }

    const distinctive = await run(`${IMPORT}const s = { correctFormat: true, locale: 'pl', colHeaders: true };\n`,
      [REMOVE_FORMAT], { aggressive: true });

    assert.equal(distinctive.changed, true);
  });

  it('rewrites a hot-file object that has two other known options under --aggressive', async() => {
    const source = `${IMPORT}const s = { colHeaders: true, rowHeaders: true, correctFormat: true };\n`;
    const result = await run(source, [REMOVE_FORMAT], { aggressive: true });

    assert.equal(result.changed, true);
    assert.equal(result.output.includes('correctFormat: true'), false);
  });
});

describe('optionRename in wrapper components', () => {
  const file = props => `import { HotTable, HotColumn } from '@handsontable/react-wrapper';
export const App = () => <HotTable ${props} />;
`;

  it('renames a JSX attribute and reports a clash', async() => {
    const renamed = await run(file('oldName={true} colHeaders'), [RENAME], { filePath: 'App.tsx' });
    const clash = await run(file('oldName newName={1}'), [RENAME], { filePath: 'App.tsx' });

    assert.match(renamed.output, /newName=\{true\} colHeaders/);
    assert.deepEqual(summary(clash.entries), ['2:manual']);
    assert.equal(clash.changed, false);
  });

  it('leaves the same attribute name on another component alone', async() => {
    const source = `import { HotTable } from '@handsontable/react-wrapper';
export const App = () => <Other oldName={1} />;
`;

    assert.equal((await run(source, [RENAME], { filePath: 'App.tsx' })).changed, false);
  });
});

describe('optionRename with context.callArg', () => {
  const PLUGIN = `${IMPORT}const hot = new Handsontable(el, {});\n`
    + 'const plugin = hot.getPlugin(\'exportFile\');\n';

  it('renames in object-literal arguments of method calls, at any position and in sheets entries', async() => {
    const source = `${PLUGIN}plugin.downloadFile('csv', { columnHeaders: true });
plugin?.exportAsString('csv', { filename: 'a' }, { columnHeaders: true });
plugin.downloadFile('xlsx', { sheets: [{ columnHeaders: true }, { colHeaders: true }] });
`;
    const result = await run(source, [CALLS]);

    assert.equal(result.output.match(/colHeaders/g).length, 4);
    assert.equal(result.output.includes('columnHeaders'), false);
  });

  it('rewrites only where the receiver is the exportFile plugin, and reports the other receivers', async() => {
    const source = `${PLUGIN}xlsx.downloadFile({ columnHeaders: ['a', 'b'] });
hot.getPlugin('filters').exportAsString('csv', { columnHeaders: true });
axios.downloadFile('csv', { filename: 'a' });
hot.getPlugin('exportFile').downloadFile('csv', { columnHeaders: true });
const other = makeExporter();
other?.downloadFile('csv', { columnHeaders: true });
`;
    const result = await run(source, [CALLS]);

    assert.match(result.output, /xlsx\.downloadFile\(\{ columnHeaders: \['a', 'b'\] \}\);/);
    assert.match(result.output, /getPlugin\('filters'\)\.exportAsString\('csv', \{ columnHeaders: true \}\);/);
    assert.match(result.output, /getPlugin\('exportFile'\)\.downloadFile\('csv', \{ colHeaders: true \}\);/);
    assert.match(result.output, /other\?\.downloadFile\('csv', \{ columnHeaders: true \}\);/);
    assert.deepEqual(summary(result.entries), ['4:manual', '7:changed', '9:manual']);
    assert.match(result.entries[0].message, /exportFile plugin/);
  });

  it('stays silent about a receiver in a file that does not use Handsontable', async() => {
    const result = await run('xlsx.downloadFile({ columnHeaders: true });\n', [CALLS]);

    assert.deepEqual([result.changed, result.entries.length], [false, 0]);
  });

  it('skips bare calls, other methods, and non-literal arguments', async() => {
    const source = `${PLUGIN}downloadFile('csv', { columnHeaders: true });
plugin.save('csv', { columnHeaders: true });
plugin.downloadFile('csv', options);
plugin.downloadFile('csv', ...rest);
const unrelated = { columnHeaders: true };
`;

    assert.equal((await run(source, [CALLS])).changed, false);
  });

  it('ignores the confidence of the surrounding file and reports a clash', async() => {
    const source = `${PLUGIN}plugin.downloadFile('csv', { columnHeaders: true, colHeaders: false });\n`;
    const result = await run(source, [CALLS]);

    assert.equal(result.changed, false);
    assert.deepEqual(summary(result.entries), ['4:manual']);
  });

  it('appends the rule message to the changed entry', async() => {
    const source = `${PLUGIN}plugin.downloadFile('csv', { columnHeaders: true });\n`;
    const result = await run(source, [{ ...CALLS, message: 'Removed in 19.0.' }]);

    assert.match(result.entries[0].message, /Renamed columnHeaders to colHeaders\. Removed in 19\.0\./);
  });

  it('rejects a context without callArg', async() => {
    const result = await run(`${IMPORT}x.downloadFile({ columnHeaders: true });\n`, [{ ...CALLS, context: {} }]);

    assert.equal(result.entries[0].ruleId, 'transform-error');
  });
});

describe('optionMove', () => {
  const column = numericFormat => grid(`{ columns: [{ type: 'numeric', numericFormat: ${numericFormat} }] }`);

  it('moves the nested key before its parent and keeps the value text', async() => {
    const result = await run(column('{ pattern: \'0,0\', culture: \'de-DE\' }'), [MOVE]);

    assert.match(result.output, /locale: 'de-DE'/);
    assert.match(result.output, /pattern: '0,0'/);
    assert.equal(result.output.includes('culture'), false);
    assert.ok(result.output.indexOf('locale') < result.output.indexOf('numericFormat'));
    assert.deepEqual(summary(result.entries), ['2:changed']);
  });

  it('keeps an emptied parent object, in an object and in a JSX attribute', async() => {
    const object = await run(column('{ culture: \'ja-JP\' }'), [MOVE]);
    const same = await run(grid('{ columns: [{ locale: \'ja-JP\', numericFormat: { culture: \'ja-JP\' } }] }'), [MOVE]);
    const element = '<HotColumn type="numeric" numericFormat={{ culture: \'ja-JP\' }} />';
    const jsx = await run(`import { HotColumn } from '@handsontable/react-wrapper';\nconst a = (\n  ${element}\n);\n`,
      [MOVE], { filePath: 'a.tsx' });

    assert.match(object.output, /locale: 'ja-JP'/);
    assert.match(object.output, /numericFormat: \{\}/);
    assert.match(same.output, /numericFormat: \{\}/);
    assert.match(jsx.output, /locale="ja-JP"/);
    assert.match(jsx.output, /numericFormat=\{\{\}\}/);
  });

  it('still holds in the core source: the numeric renderer reads {} and an absent value differently', (context) => {
    const path = new URL('../../handsontable/src/renderers/numericRenderer/utils.ts', import.meta.url);

    if (skipWithoutFile(context, fileURLToPath(path), 'the numeric renderer source')) {
      return;
    }

    const source = readFileSync(path, 'utf8');

    assert.match(source, /numericFormat \?\? DEFAULT_INTL_FORMAT/);
    assert.match(source, /useGrouping: false/);
  });

  it('moves a value that is not a literal and asks for a check', async() => {
    const identifier = await run(column('{ culture }'), [MOVE]);
    // eslint-disable-next-line no-template-curly-in-string
    const template = await run(column('{ culture: `de-${region}` }'), [MOVE]);

    assert.match(identifier.output, /locale: culture/);
    assert.match(template.output, /locale: `de-\$\{region\}`/);
    assert.deepEqual(summary(identifier.entries), ['2:changed', '2:manual']);
  });

  it('keeps a quoted key quoted', async() => {
    const result = await run(grid('{ columns: [{ \'numericFormat\': { \'culture\': \'de-DE\' } }] }'), [MOVE]);

    assert.match(result.output, /'locale': 'de-DE'/);
  });

  it('moves the comments of the moved key with it', async() => {
    const result = await run(column('{\n  // German\n  culture: \'de-DE\',\n  pattern: \'0,0\'\n}'), [MOVE]);

    assert.match(result.output, /\/\/ German\s+locale: 'de-DE'/);
  });

  it('reports a literal that is not a valid BCP 47 tag, a different locale, and a variable source', async() => {
    const invalid = await run(column('{ culture: \'en_US\' }'), [MOVE]);
    const different = await run(grid('{ locale: \'fr-FR\', numericFormat: { culture: \'de-DE\' } }'), [MOVE]);
    const variable = await run(
      `${IMPORT}const f = { culture: 'de-DE' };\nnew Handsontable(el, { numericFormat: f });\n`, [MOVE]
    );

    for (const result of [invalid, different, variable]) {
      assert.equal(result.changed, false);
      assert.equal(result.entries.length, 1);
      assert.equal(result.entries[0].severity, 'manual');
    }

    assert.match(invalid.entries[0].message, /not a valid BCP 47/);
    assert.equal(different.entries[0].message, 'Set locale to \'de-DE\' if that was intended, then remove culture. '
      + '18.0 formats this column with locale \'fr-FR\' and ignores numericFormat.culture \'de-DE\', so the output '
      + 'changed from de-DE to fr-FR.');
    assert.match(variable.entries[0].message, /comes from a variable/);
  });

  it('words the locale and culture conflict generically when a value is not a string literal', async() => {
    const result = await run(grid('{ locale: userLocale, numericFormat: { culture: \'de-DE\' } }'), [MOVE]);

    assert.equal(result.changed, false);
    assert.equal(result.entries[0].message, 'Keep one of locale and numericFormat.culture by hand: 18.0 uses locale '
      + 'and ignores culture, so the output may differ from 17.x.');
  });

  it('drops the nested key when the destination holds the same value', async() => {
    const source = grid('{ locale: \'de-DE\', numericFormat: { culture: \'de-DE\', pattern: \'0\' } }');
    const result = await run(source, [MOVE]);

    assert.equal(result.output.includes('culture'), false);
    assert.equal(result.output.match(/de-DE/g).length, 1);
  });

  it('does not move when the object that would receive the key holds a spread', async() => {
    const after = await run(grid('{ numericFormat: { culture: \'de-DE\' }, ...base }'), [MOVE]);
    const before = await run(grid('{ ...base, numericFormat: { culture: \'de-DE\' } }'), [MOVE]);
    const element = await run('import { HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const A = () => <HotColumn {...base} numericFormat={{ culture: \'de-DE\' }} />;\n', [MOVE],
    { filePath: 'a.tsx' });

    for (const result of [after, before, element]) {
      assert.equal(result.changed, false);
      assert.equal(result.entries.length, 1);
      assert.equal(result.entries[0].severity, 'manual');
      assert.match(result.entries[0].message, /a spread may already set locale/);
    }
  });

  it('does nothing without the nested key or for a call as the parent', async() => {
    const none = await run(grid('{ numericFormat: { pattern: \'0\' } }'), [MOVE]);
    const call = await run(grid('{ numericFormat: makeFormat() }'), [MOVE]);

    assert.deepEqual([none.changed, call.changed], [false, false]);
    assert.deepEqual([none.entries.length, call.entries.length], [0, 0]);
  });

  it('reports, and never moves, the pair in an object that is not recognized as an options object', async() => {
    const plain = await run(`${IMPORT}const x = { numericFormat: { culture: 'de-DE' } };\n`, [MOVE]);
    const noImport = await run('const x = { numericFormat: { culture: \'de-DE\' } };\n', [MOVE]);

    assert.equal(plain.changed, false);
    assert.deepEqual(summary(plain.entries), ['2:manual']);
    assert.match(plain.entries[0].message, /^Move numericFormat\.culture to locale by hand if this object holds/);
    assert.equal(noImport.changed, false);
    assert.deepEqual(noImport.entries, []);
  });

  it('respects minConfidence high and the aggressive flag', async() => {
    const source = `${IMPORT}const s = { colHeaders: true, rowHeaders: true, numericFormat: { culture: 'de-DE' } };\n`;
    const strict = await run(source, [{ ...MOVE, minConfidence: undefined }]);
    const aggressive = await run(source, [{ ...MOVE, minConfidence: undefined }], { aggressive: true });

    assert.equal(strict.changed, false);
    assert.equal(strict.entries[0].severity, 'manual');
    assert.match(aggressive.output, /locale: 'de-DE'/);
  });

  it('adds the rule report text after every move', async() => {
    const result = await run(column('{ culture: \'de-DE\' }'), [{ ...MOVE, report: 'Check the pattern.' }]);

    assert.deepEqual(result.entries.map(entry => entry.message).slice(-1), ['Check the pattern.']);
  });

  it('rejects a rule whose from has no parent, or whose to is nested', async() => {
    const noParent = await run(column('{ culture: \'de-DE\' }'), [{ ...MOVE, from: 'culture' }]);
    const nested = await run(column('{ culture: \'de-DE\' }'), [{ ...MOVE, to: 'a.b' }]);

    assert.equal(noParent.entries[0].ruleId, 'transform-error');
    assert.equal(nested.entries[0].ruleId, 'transform-error');
  });
});

describe('optionMove in wrapper components', () => {
  const file = attributes => `import { HotColumn } from '@handsontable/react-wrapper';
export const App = ({ culture }) => <HotColumn ${attributes} />;
`;

  it('adds a quoted attribute for a string and a braced one for any other expression', async() => {
    const text = await run(file('numericFormat={{ pattern: \'0\', culture: \'de-DE\' }}'), [MOVE],
      { filePath: 'a.tsx' });
    const expression = await run(file('numericFormat={{ culture }}'), [MOVE], { filePath: 'a.tsx' });

    assert.match(text.output, /locale="de-DE"/);
    assert.match(text.output, /pattern: '0'/);
    assert.match(expression.output, /locale=\{culture\}/);
    assert.doesNotMatch(text.output, /culture: '/);
  });

  it('drops the nested key when the attribute holds the same value, and reports a different one', async() => {
    const same = await run(file('locale="de-DE" numericFormat={{ culture: \'de-DE\' }}'), [MOVE],
      { filePath: 'a.tsx' });
    const different = await run(file('locale={culture} numericFormat={{ culture: \'de-DE\' }}'), [MOVE],
      { filePath: 'a.tsx' });

    assert.equal(same.output.match(/de-DE/g).length, 1);
    assert.equal(different.changed, false);
    assert.equal(different.entries[0].severity, 'manual');
  });

  it('reports a valueless locale attribute as a different value', async() => {
    const result = await run(file('locale numericFormat={{ culture: \'de-DE\' }}'), [MOVE], { filePath: 'a.tsx' });

    assert.equal(result.changed, false);
  });
});

describe('optionRemove', () => {
  const quiet = { ...REMOVE, todo: false };

  it('deletes the property and reports it as changed when todo is false', async() => {
    const result = await run(grid('{ a: 1, gone: true, b: 2 }'), [quiet]);

    assert.equal(result.output.includes('gone'), false);
    assert.equal(result.output.includes('TODO'), false);
    assert.deepEqual(summary(result.entries), ['2:changed']);
  });

  it('reports a deletion once, as a change that carries the advice, whether or not it leaves a TODO', async() => {
    const withTodo = await run(grid('{ a: 1, gone: true, b: 2 }'), [REMOVE]);
    const attribute = await run('import { HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const App = () => <HotColumn gone />;\n', [REMOVE], { filePath: 'a.tsx' });

    assert.deepEqual(summary(withTodo.entries), ['2:changed']);
    assert.equal(withTodo.entries[0].message, 'Removed gone. It is gone.');
    assert.equal(attribute.entries.length, 1);
    assert.equal(attribute.entries[0].severity, 'changed');
    assert.match(attribute.entries[0].message, /It is gone\.$/);
    assert.match(withTodo.output, /TODO\(handsontable-codemod 18\.0\.0\/remove\): Deleted gone here\./);
  });

  it('leaves one TODO before the next property and does not add a second one on a rerun', async() => {
    const first = await run(grid('{\n  a: 1,\n  gone: true,\n  b: 2,\n}'), [REMOVE]);
    const second = await run(first.output, [REMOVE]);

    const todos = first.output.match(/\(handsontable-codemod 18\.0\.0\/remove\): Deleted gone here\. It is gone\./g);

    assert.equal(todos.length, 1);
    assert.match(first.output, /\/\/ TODO[^\n]*\n\s*b: 2/);
    assert.deepEqual([second.changed, second.entries.length], [false, 0]);
  });

  it('puts the TODO before the previous property when the last one is removed', async() => {
    const result = await run(grid('{\n  a: 1,\n  gone: true,\n}'), [REMOVE]);

    assert.match(result.output, /\/\/ TODO[^\n]*\n\s*a: 1/);
  });

  it('puts the TODO outside the object when it was the only property', async() => {
    const inArray = await run(grid('{ columns: [{ gone: true }, { a: 1 }] }'), [REMOVE]);
    const inReturn = await run(`${IMPORT}new Handsontable(el, {\n  cells() {\n    return { gone: true };\n  },\n});\n`,
      [REMOVE]);

    assert.match(inArray.output, /\/\/ TODO[^\n]*\n\s*\{\}/);

    const lines = inReturn.output.split('\n');

    assert.ok(lines.findIndex(line => line.includes('TODO')) < lines.findIndex(line => line.includes('return')),
      'the comment is before return, never between return and the object');
    assert.match(inReturn.output, /return \{\};/);
  });

  it('keeps every comment of a removed property, on the next property or else on the previous one', async() => {
    const described = await run(grid('{\n  a: 1,\n  // describes gone\n  gone: true, // also gone\n  b: 2,\n}'),
      [quiet]);
    const header = await run(grid('{\n  // Date columns\n\n  gone: true,\n  b: 2,\n}'), [quiet]);
    const todo = await run(grid('{\n  // TODO(handsontable-codemod other): keep me\n  gone: true,\n  b: 2,\n}'),
      [quiet]);
    const last = await run(grid('{\n  a: 1,\n  // describes gone\n  gone: true,\n}'), [quiet]);
    const only = await run(grid('{\n  // describes gone\n  gone: true,\n}'), [quiet]);

    assert.match(described.output, /\/\/ describes gone\s+(\/\/ also gone\s+)?b: 2/);
    assert.match(described.output, /\/\/ also gone/);
    assert.match(header.output, /\/\/ Date columns\s+b: 2/);
    assert.match(todo.output, /keep me\s+b: 2/);
    assert.match(last.output, /\/\/ describes gone/);
    assert.match(only.output, /\/\/ describes gone/);

    for (const result of [described, header, todo, last, only]) {
      assert.doesNotThrow(() => parse(result.output, 'babylon'));
    }
  });

  it('keeps the comments of a removed attribute', async() => {
    const source = 'import { HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const App = () => <HotColumn\n  data="a"\n  // describes gone\n  gone\n/>;\n';
    const result = await run(source, [quiet], { filePath: 'a.tsx' });

    assert.match(result.output, /describes gone/);
  });

  it('keeps a property whose value is computed and reports it', async() => {
    const call = await run(grid('{\n  a: 1,\n  gone: compute(),\n  b: 2,\n}'), [REMOVE]);
    const nested = await run(grid('{\n  gone: { firstDay: pick(), i18n: {} },\n  b: 2,\n}'), [REMOVE]);
    const inert = await run(grid('{\n  gone: { firstDay: 1, onSelect: () => {}, list: [a.b, \'c\'] },\n  b: 2,\n}'),
      [REMOVE]);

    for (const result of [call, nested]) {
      assert.match(result.output, /gone: (compute\(\)|\{)/);
      assert.match(result.output, /TODO\(handsontable-codemod 18\.0\.0\/remove\): gone is computed/);
      assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 0);
      assert.equal(result.entries.filter(entry => entry.severity === 'manual').length, 1);
    }

    assert.equal(inert.output.includes('gone:'), false);
    assert.equal(inert.entries.filter(entry => entry.severity === 'changed').length, 1);
  });

  describe('a removed option whose value has an effect keeps its property, and an inert twin is deleted', () => {
    // Each pair is an effect and its inert twin. The twin is the same shape with nothing to run.
    const PAIRS = [
      ['a call', 'track()', 'tracked'],
      ['a call in the right side of a logical expression', 'a || track()', 'a || b'],
      ['a call in the left side of a logical expression', 'track() ?? a', 'a ?? b'],
      ['a call in the right side of a binary expression', '1 + track()', '1 + a'],
      ['a call in the left side of a binary expression', 'track() + 1', 'a + 1'],
      ['a call in the test of a conditional', 'track() ? 1 : 2', 'c ? 1 : 2'],
      ['a call in the consequent of a conditional', 'c ? track() : 1', 'c ? 1 : 2'],
      ['a call in the alternate of a conditional', 'c ? 1 : track()', 'c ? 1 : 2'],
      // eslint-disable-next-line no-template-curly-in-string
      ['a call in a template literal', '`${track()}`', '`${x}`'],
      ['a delete', 'delete x.y', 'typeof x.y'],
      ['a call in a computed member', 'o[track()]', 'o[k]'],
      ['a call as the object of a member', 'track().x', 'a.x'],
      ['a call in an optional computed member', 'o?.[track()]', 'o?.[k]'],
      ['a call under a unary operator', '-track()', '-x'],
      ['a call in a spread of an object', '{ ...track() }', '{ ...a }'],
      ['a call in a property value of an object', '{ k: track() }', '{ k: a }'],
      ['a call in a computed key of an object', '{ [track()]: 1 }', '{ [k]: 1 }'],
      ['a call in a computed key of an object method', '{ [track()]() {} }', '{ [k]() {} }'],
      ['a call in an array', '[1, track()]', '[1, a]'],
      ['a call in a spread of an array', '[...track()]', '[...a]'],
      ['a new expression', 'new Thing()', 'Thing'],
      ['an await', 'await load()', 'load'],
      ['a tagged template', 'tag`x`', '`x`'],
      ['an update expression', 'i++', '-i'],
      ['an assignment', '(x = 1)', 'x'],
      ['a sequence', '(a, b)', 'b'],
    ];

    it('has a pair for every shape the rule tells apart', () => {
      assert.equal(PAIRS.length >= 26, true);
    });

    for (const [label, effect, inert] of PAIRS) {
      it(`keeps the property for ${label}: ${effect}`, async() => {
        const result = await run(grid(`{\n  a: 1,\n  gone: ${effect},\n  b: 2,\n}`), [REMOVE]);

        assert.equal(result.output.includes(`gone: ${effect}`), true, result.output);
        assert.match(result.output, /TODO\(handsontable-codemod 18\.0\.0\/remove\): gone is computed/);
        assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 0);
        assert.equal(result.entries.filter(entry => entry.severity === 'manual').length, 1);
      });

      it(`deletes the property for its inert twin: ${inert}`, async() => {
        const result = await run(grid(`{\n  a: 1,\n  gone: ${inert},\n  b: 2,\n}`), [REMOVE]);

        assert.equal(result.output.includes('gone:'), false, result.output);
        assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 1);
        assert.equal(result.entries.filter(entry => entry.severity === 'manual').length, 0);
      });
    }

    it('keeps a JSX attribute that holds an effect inside an expression, and deletes an inert one', async() => {
      const jsx = value => 'import { HotColumn } from \'@handsontable/react-wrapper\';\n'
        + `export const App = () => <HotColumn gone={${value}} />;\n`;
      const effect = await run(jsx('a || track()'), [REMOVE], { filePath: 'a.tsx' });
      const inert = await run(jsx('a || b'), [REMOVE], { filePath: 'a.tsx' });

      assert.match(effect.output, /gone=\{a \|\| track\(\)\}/);
      assert.equal(effect.entries.filter(entry => entry.severity === 'changed').length, 0);
      assert.equal(inert.output.includes('gone='), false);
      assert.equal(inert.entries.filter(entry => entry.severity === 'changed').length, 1);
    });
  });

  it('keeps an attribute whose value is a call', async() => {
    const source = 'import { HotColumn } from \'@handsontable/react-wrapper\';\n'
      + 'export const App = () => <HotColumn gone={compute()} />;\n';
    const result = await run(source, [REMOVE], { filePath: 'a.tsx' });

    assert.match(result.output, /gone=\{compute\(\)\}/);
    assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 0);
  });

  it('keeps the TODO of one rule when a later rule removes the property that carried it', async() => {
    const other = { ...REMOVE, id: '18.0.0/other', name: 'also', advice: 'Also gone.' };
    const result = await run(grid('{\n  a: 1,\n  gone: true,\n  also: true,\n}'), [REMOVE, other]);

    assert.equal(result.output.match(/TODO/g).length, 2);
    assert.match(result.output, /It is gone\.\n\s+\/\/ TODO[^\n]*Deleted also here\. Also gone\.\n\s+a: 1/);
  });

  it('uses the message, then a generic text, when a rule has no advice', async() => {
    const message = await run(grid('{ gone: 1, b: 2 }'), [{ ...REMOVE, advice: undefined, message: 'Use b.' }]);
    const bare = await run(grid('{ gone: 1, b: 2 }'), [{ ...REMOVE, advice: undefined }]);

    assert.match(message.output, /: Deleted gone here\. Use b\./);
    assert.match(bare.output, /: Deleted gone here\. gone was removed\./);
  });

  it('reports a medium object and removes nothing', async() => {
    const source = `${IMPORT}const s = { gone: true, colHeaders: true, rowHeaders: true };\n`;
    const result = await run(source, [REMOVE]);

    assert.equal(result.changed, false);
    assert.equal(result.entries[0].severity, 'manual');
  });

  it('removes an attribute and leaves the TODO before the statement that holds the element', async() => {
    const source = `import { HotColumn } from '@handsontable/react-wrapper';
export const App = () => <HotColumn type="date" gone />;
export function Other() {
  return <HotColumn gone={false} />;
}
`;
    const result = await run(source, [REMOVE], { filePath: 'a.tsx' });

    assert.doesNotMatch(result.output, /<HotColumn[^>]*gone/);
    assert.equal(result.output.match(/TODO/g).length, 2);
    assert.match(result.output, /\/\/ TODO[^\n]*\nexport const App/);
    assert.match(result.output, /\/\/ TODO[^\n]*\n\s*return/);
    assert.equal((await run(result.output, [REMOVE], { filePath: 'a.tsx' })).changed, false);
  });

  describe('TODO placement for a removed attribute', () => {
    const wrapper = 'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';\n';
    const runJsx = source => run(`${wrapper}${source}`, [REMOVE], { filePath: 'a.tsx' });

    it('puts a JSX comment right before an element that is a child of another element', async() => {
      const result = await runJsx([
        'export const App = () => (',
        '  <HotTable data={[]}>',
        '    <HotColumn data="a" gone />',
        '    <HotColumn data="b" />',
        '  </HotTable>',
        ');',
        '',
      ].join('\n'));

      assert.match(result.output,
        /\n {4}\{\/\* TODO[^\n]*It is gone\. \*\/\}\n {4}<HotColumn data="a" \/>\n {4}<HotColumn data="b" \/>/);
      assert.equal(result.output.includes('// TODO'), false);
      assert.doesNotThrow(() => parse(result.output, 'tsx'));
      assert.equal((await runJsx(result.output.replace(wrapper, ''))).changed, false);
    });

    it('puts the JSX comment before the expression that holds the element', async() => {
      const result = await runJsx([
        'export const App = () => (',
        '  <HotTable data={[]}>',
        '    {on && <HotColumn data="a" gone />}',
        '    {list.map(item => <HotColumn key={item} gone />)}',
        '  </HotTable>',
        ');',
        '',
      ].join('\n'));

      assert.match(result.output, /\{\/\* TODO[^\n]*\*\/\}\n {4}\{on && <HotColumn data="a" \/>\}/);
      assert.match(result.output, /\{\/\* TODO[^\n]*\*\/\}\n {4}\{list\.map\(item => <HotColumn key=\{item\} \/>\)\}/);
      assert.doesNotThrow(() => parse(result.output, 'tsx'));
    });

    it('puts a line comment above the statement when the element is its value and it starts close', async() => {
      const result = await runJsx([
        'export function App() {',
        '  return (',
        '    <HotColumn',
        '      data="a"',
        '      gone',
        '    />',
        '  );',
        '}',
        '',
      ].join('\n'));

      assert.match(result.output, /\{\n {2}\/\/ TODO[^\n]*\n {2}return/);
      assert.doesNotThrow(() => parse(result.output, 'tsx'));
    });

    it('puts a line comment on the first attribute when the statement is far above the element', async() => {
      const result = await runJsx([
        'export const view = render(',
        '  first,',
        '  second,',
        '  third,',
        '  fourth,',
        '  wrap(<HotColumn data="a" gone />),',
        ');',
        '',
      ].join('\n'));

      assert.match(result.output, /<HotColumn\s+\/\/ TODO[^\n]*\n\s+data="a"/);
      assert.doesNotThrow(() => parse(result.output, 'tsx'));
      assert.equal((await runJsx(result.output.replace(wrapper, ''))).changed, false);
    });
  });

  it('ignores a computed key and a key of the same name in a plain object', async() => {
    const computed = await run(grid('{ [\'gone\']: true, colHeaders: true }'), [REMOVE]);
    const plain = await run(`${IMPORT}const row = { gone: true };\n`, [REMOVE]);

    assert.deepEqual([computed.changed, plain.changed], [false, false]);
  });
});

describe('a spread after the key', () => {
  const COMPONENT = 'import { HotTable } from \'@handsontable/react-wrapper\';\n';

  it('keeps a key that a later spread can set again, in an object, and reports it', async() => {
    const source = grid('{ oldName: 1, ...rest, colHeaders: true }');
    const result = await run(source, [RENAME]);

    assert.equal(result.output, source);
    assert.deepEqual(summary(result.entries), ['2:manual']);
    assert.match(result.entries[0].message,
      /^Rename oldName to newName by hand: a spread after it can set oldName again/);
  });

  it('still renames a key in an object with no spread, and one after a spread that cannot hold either name', async() => {
    const base = 'const base = { other: 1 };\n';
    const nested = 'const inner = { more: 1 };\nconst base = { ...inner, other: 1 };\n';

    for (const preamble of [base, nested]) {
      const source = `${IMPORT}${preamble}new Handsontable(el, { ...base, oldName: 1 });\n`;

      assert.equal((await run(source, [RENAME])).output, source.replace('oldName', 'newName'));
    }

    assert.equal((await run(grid('{ oldName: 1, colHeaders: true }'), [RENAME])).output,
      grid('{ newName: 1, colHeaders: true }'));
  });

  it('keeps an attribute that a later spread attribute can set again, and renames one after a spread of a literal',
    async() => {
      const before = `${COMPONENT}export const A = () => <HotTable oldName {...rest} />;\n`;
      const after = `${COMPONENT}const rest = { other: 1 };\nexport const A = () => <HotTable {...rest} oldName />;\n`;
      const kept = await run(before, [RENAME], { filePath: 'a.jsx' });
      const renamed = await run(after, [RENAME], { filePath: 'a.jsx' });

      assert.equal(kept.output, before);
      assert.deepEqual(summary(kept.entries), ['2:manual']);
      assert.equal(renamed.output, after.replace('oldName', 'newName'));
    });

  it('keeps an attribute that follows a spread attribute that the tool cannot read or that sets a name', async() => {
    for (const rest of ['', 'const rest = { newName: 1 };\n', 'const rest = { oldName: 1 };\n',
      'const rest = { ...other };\n', 'const rest = { [key]: 1 };\n']) {
      const source = `${COMPONENT}${rest}export const A = () => <HotTable {...rest} oldName />;\n`;
      const result = await run(source, [RENAME], { filePath: 'a.jsx' });

      assert.equal(result.output, source, rest);
      assert.equal(result.entries.some(entry => /a spread attribute before it can set newName or oldName already/
        .test(entry.message)), true, rest);
    }
  });

  it('keeps a key after a spread that may set the new name, because the key would win over it', async() => {
    for (const preamble of ['', 'const base = { newName: 1 };\n', 'const base = { oldName: 1 };\n',
      'const base = { ...unknown };\n', 'let base = { other: 1 };\n']) {
      const source = `${IMPORT}${preamble}new Handsontable(el, { ...base, oldName: 2 });\n`;
      const result = await run(source, [RENAME]);

      assert.equal(result.output, source, preamble);
      const lead = /^Rename oldName to newName by hand: a spread before it can set newName or oldName already/;

      assert.equal(result.entries.some(entry => lead.test(entry.message)), true, preamble);
    }
  });

  it('keeps the export option in the argument of an export call', async() => {
    const call = (argument, preamble = '') => `${IMPORT}${preamble}const hot = new Handsontable(el, {});\n`
      + `hot.getPlugin('exportFile').downloadFile('csv', ${argument});\n`;
    const kept = await run(call('{ columnHeaders: false, ...opts }'), [CALLS]);

    assert.equal(kept.output, call('{ columnHeaders: false, ...opts }'));
    assert.deepEqual(summary(kept.entries), ['3:manual']);
    assert.match(kept.entries[0].message, /a spread after it can set columnHeaders again/);
  });

  it('keeps columnHeaders after a spread that may set colHeaders, which an explicit colHeaders overrides', async() => {
    // In 18.x an explicit `colHeaders` wins over `columnHeaders` (`normalizeExportOptions()`), so `opts.colHeaders`
    // decides the header row of `{ ...opts, columnHeaders: false }` today. After the rename the later `colHeaders`
    // would win over the spread, and the header row would change.
    const call = (argument, preamble = '') => `${IMPORT}${preamble}const hot = new Handsontable(el, {});\n`
      + `hot.getPlugin('exportFile').downloadFile('csv', ${argument});\n`;

    for (const preamble of ['', 'const opts = { colHeaders: true };\n', 'const opts = { ...fromElsewhere };\n']) {
      const source = call('{ ...opts, columnHeaders: false }', preamble);
      const result = await run(source, [CALLS]);

      assert.equal(result.output, source, preamble);
      assert.equal(result.entries.some(entry => /a spread before it can set colHeaders or columnHeaders already/
        .test(entry.message)), true, preamble);
    }
  });

  it('renames columnHeaders after a spread of a literal that sets neither name', async() => {
    const source = `${IMPORT}const opts = { columnDelimiter: ';' };\nconst hot = new Handsontable(el, {});\n`
      + 'hot.getPlugin(\'exportFile\').downloadFile(\'csv\', { ...opts, columnHeaders: false });\n';
    const result = await run(source, [CALLS]);

    assert.equal(result.output, source.replace('columnHeaders', 'colHeaders'));
  });

  it('keeps a nested key that a later spread can set again, and moves one that stands after the spread', async() => {
    const column = nested => grid(`{ columns: [{ numericFormat: ${nested} }] }`);
    const kept = await run(column('{ culture: \'ja-JP\', ...base }'), [MOVE]);
    const moved = await run(column('{ ...base, culture: \'ja-JP\' }'), [MOVE]);

    assert.equal(kept.output, column('{ culture: \'ja-JP\', ...base }'));
    assert.deepEqual(summary(kept.entries), ['2:manual']);
    assert.match(kept.entries[0].message, /^Move numericFormat\.culture to locale by hand: a spread after culture/);
    assert.match(moved.output, /locale: 'ja-JP'/);
  });

  it('keeps a nested key on a wrapper element when a spread follows it', async() => {
    const source = `${COMPONENT}export const A = () => <HotTable numericFormat={{ culture: 'ja-JP', ...base }} />;\n`;
    const result = await run(source, [MOVE], { filePath: 'a.jsx' });

    assert.equal(result.output, source);
    assert.deepEqual(summary(result.entries), ['2:manual']);
  });
});

describe('option rules in all parsers', () => {
  it('produces output that parses again', async() => {
    const source = grid('{ columns: [{ gone: true, numericFormat: { culture: \'de-DE\' } }], oldName: 1 }');

    for (const [filePath, parser] of [['a.js', 'babylon'], ['a.ts', 'ts'], ['a.tsx', 'tsx']]) {
      const result = await run(source, [REMOVE, MOVE, RENAME], { filePath });

      assert.equal(result.changed, true, filePath);
      assert.doesNotThrow(() => parse(result.output, parser), filePath);
    }
  });
});

describe('options in templates', () => {
  const rules = [MOVE, REMOVE_FORMAT, { ...REMOVE_FORMAT, id: '18.0.0/picker', name: 'datePickerConfig' }, RENAME];

  /**
   * Report entries of a template, as `ruleId line` pairs.
   *
   * @param {string} source File text.
   * @param {string} filePath File name.
   * @returns {Promise<string[]>} Sorted pairs.
   */
  async function sites(source, filePath) {
    const result = await run(source, rules, { filePath });

    assert.equal(result.changed, false, 'a template is never rewritten');

    return result.entries.map(entry => `${entry.ruleId.replace('18.0.0/', '')} ${entry.line}`).sort();
  }

  it('reports the options that kebab-case and camel-case attributes set on Vue wrapper tags', async() => {
    const source = [
      '<template>',
      '  <hot-table :settings="grid" :old-name="1">',
      '    <hot-column :numeric-format="fmt" correct-format />',
      '    <HotColumn v-bind:correctFormat="true" datePickerConfig="{}" />',
      '    <div correct-format />',
      '  </hot-table>',
      '</template>',
      '<script>import Handsontable from \'handsontable\';</script>',
      '',
    ].join('\n');

    assert.deepEqual(await sites(source, 'a.vue'), [
      'correct-format 3',
      'correct-format 4',
      'move 3',
      'picker 4',
      'rename 2',
    ]);
  });

  it('reports Angular bindings, tags that span lines, and a settings binding that names the option', async() => {
    const source = [
      '<hot-table',
      '  [settings]="{ correctFormat: true, colHeaders: true }"',
      '  [datePickerConfig]="cfg">',
      '  <hot-column [(numericFormat)]="fmt"></hot-column>',
      '</hot-table>',
      '',
    ].join('\n');

    assert.deepEqual(await sites(source, 'a.component.html'), [
      'correct-format 2',
      'move 4',
      'picker 3',
    ]);
  });

  it('reads a bare v-bind object and a v-bind:settings binding on a wrapper tag', async() => {
    const source = [
      '<template>',
      '  <hot-table v-bind="{ correctFormat: true, data: rows }" />',
      '  <hot-table v-bind:settings="{ correctFormat: true }" />',
      '  <hot-table v-bind="{ data: rows }" />',
      '  <div v-bind="{ correctFormat: true }"></div>',
      '</template>',
      '<script>import Handsontable from \'handsontable\';</script>',
      '',
    ].join('\n');

    assert.deepEqual(await sites(source, 'a.vue'), ['correct-format 2', 'correct-format 3']);
  });

  it('ignores a plain element and an attribute that only contains the name', async() => {
    const source = '<div correctFormat="x"></div>\n'
      + '<hot-table my-correct-format="1" data-numeric-format="x"></hot-table>\n';

    assert.deepEqual(await sites(source, 'a.html'), []);
  });
});

describe('options set by assignment or setCellMeta', () => {
  const rules = [MOVE, REMOVE_FORMAT, RENAME];

  /**
   * Run the rules over a file and describe the entries.
   *
   * @param {string} source File text.
   * @returns {Promise<{output: string, entries: string[]}>} The output and `ruleId line` pairs.
   */
  async function dynamic(source) {
    const result = await run(source, rules);

    return {
      output: result.output,
      entries: result.entries.map(entry => `${entry.ruleId.replace('18.0.0/', '')} ${entry.line}`).sort(),
    };
  }

  it('reports member assignments and setCellMeta calls in a Handsontable file, and rewrites none', async() => {
    const source = `${IMPORT}const hot = new Handsontable(el, {});
column.numericFormat = { pattern: '0.0' };
settings['correctFormat'] = true;
hot.setCellMeta(0, 1, 'correctFormat', false);
picker.setCellMetaObject(0, 1, { oldName: 1, other: 2 });
other.unrelated = 1;
`;
    const result = await dynamic(source);

    assert.deepEqual(result.entries, ['correct-format 4', 'correct-format 5', 'move 3', 'rename 6']);
    assert.equal(result.output, source);
  });

  it('names setCellMetaObject() once, and only once, for an object of an unconfirmed receiver', async() => {
    const source = `${IMPORT}picker.setCellMetaObject(0, 2, { dateFormat: 'DD/MM/YYYY', correctFormat: true });\n`;
    const result = await run(source, [REMOVE_FORMAT]);

    assert.equal(result.output, source);
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].severity, 'manual');
    assert.equal(result.entries[0].line, 2);
    assert.match(result.entries[0].message, /set by setCellMetaObject\(\) here/);
    assert.doesNotMatch(result.entries[0].message, /setCellMeta\(\)|only looks like/);
  });

  it('treats the object of setCellMetaObject() on a confirmed instance as a cell object', async() => {
    const source = `${IMPORT}const hot = new Handsontable(el, {});\n`
      + 'hot.setCellMetaObject(0, 2, { dateFormat: \'DD/MM/YYYY\', correctFormat: true });\n'
      + 'hot.setCellMetaObject(1, 2, { numericFormat: { pattern: \'0,0\', culture: \'de-DE\' } });\n';
    const result = await run(source, [REMOVE_FORMAT, MOVE]);

    assert.doesNotMatch(result.output, /correctFormat: true/);
    assert.match(result.output, /locale: 'de-DE'/);
    assert.doesNotMatch(result.output, /culture/);
    assert.deepEqual(result.entries.map(entry => [entry.ruleId.replace('18.0.0/', ''), entry.severity, entry.line]), [
      ['correct-format', 'changed', 3],
      ['move', 'changed', 4],
    ]);
  });

  it('stays silent in a file that does not belong to Handsontable', async() => {
    const result = await dynamic('column.numericFormat = {};\nform.correctFormat = true;\n');

    assert.deepEqual(result.entries, []);
  });
});

describe('the export rules name every method of the plugin that takes export options', () => {
  // The public methods of ExportFile that take the options object, from its API reference.
  const METHODS = ['exportAsString', 'exportAsBlob', 'exportAsBlobAsync', 'downloadFile', 'downloadFileAsync'];
  const RULES = [['18.0.0', '18.0.0/export-column-headers'], ['19.0.0', '19.0.0/export-column-headers']];

  /**
   * Run one shipped rule over a source text.
   *
   * @param {string} version The manifest version.
   * @param {string} id The rule id.
   * @param {string} source File text.
   * @returns {Promise<{output: string, changed: boolean, entries: object[]}>} The `transformFile` result.
   */
  function runShipped(version, id, source) {
    const plan = buildPlan(shippedManifests.filter(manifest => manifest.version === version), [id]);

    return transformFile({ filePath: 'a.js', source, plan, options: { markers: false } });
  }

  it('lists the methods that the core plugin has', (context) => {
    const path = fileURLToPath(new URL('../../handsontable/src/plugins/exportFile/exportFile.ts', import.meta.url));

    if (skipWithoutFile(context, path, 'the ExportFile plugin source')) {
      return;
    }

    const declared = [...readFileSync(path, 'utf8').matchAll(/^ {2}(?:async )?(exportAs\w+|downloadFile\w*)\(/gm)]
      .map(match => match[1]).sort();

    assert.deepEqual(declared, [...METHODS].sort());
  });

  for (const [version, id] of RULES) {
    for (const method of METHODS) {
      it(`${id} renames columnHeaders in ${method}() of the plugin, and in no look-alike`, async() => {
        const call = `hot.getPlugin('exportFile').${method}('xlsx', { columnHeaders: true });`;
        const plugin = `${IMPORT}const hot = new Handsontable(el, {});\n${call}\n`;
        const other = `${IMPORT}chart.${method}({ columnHeaders: true });\n`;
        const optional = plugin.replace('hot.getPlugin(\'exportFile\').', 'hot.getPlugin(\'exportFile\')?.');
        const renamed = await runShipped(version, id, plugin);
        const renamedOptional = await runShipped(version, id, optional);
        const kept = await runShipped(version, id, other);

        assert.equal(renamed.output, plugin.replace('columnHeaders', 'colHeaders'));
        assert.equal(renamed.entries.filter(entry => entry.severity === 'changed').length, 1);
        assert.notEqual(optional, plugin);
        assert.equal(renamedOptional.output, optional.replace('columnHeaders', 'colHeaders'));
        assert.equal(kept.changed, false);
        assert.equal(kept.output, other);
      });
    }

    it(`${id} names exactly those methods`, () => {
      const rule = shippedManifests.find(manifest => manifest.version === version).rules.find(item => item.id === id);

      assert.deepEqual([...rule.context.callArg].sort(), [...METHODS].sort());
    });
  }
});
