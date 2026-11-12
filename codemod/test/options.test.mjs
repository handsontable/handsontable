import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlan } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';
import { parse } from './helpers/parse.mjs';

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
const CALLS = {
  id: '18.0.0/calls',
  kind: 'optionRename',
  from: 'columnHeaders',
  to: 'colHeaders',
  context: { callArg: ['downloadFile', 'exportAsString'] },
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

  return transformFile({ filePath, source, plan, options: { aggressive } });
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
    assert.match(result.entries[0].message, /Both oldName and newName/);
  });

  it('handles explicit keys of an object that has a spread', async() => {
    const result = await run(grid('{ ...base, oldName: 1 }'), [RENAME]);

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

  it('finds a medium object in a file with no Handsontable import only under --aggressive', async() => {
    const source = '// handsontable settings\nexport const s = { oldName: 1, colHeaders: true, rowHeaders: true };\n';
    const plain = await run(source, [RENAME]);
    const aggressive = await run(source, [RENAME], { aggressive: true });

    assert.deepEqual([plain.changed, plain.entries.length], [false, 0]);
    assert.match(aggressive.output, /newName: 1/);
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
  it('renames in object-literal arguments of method calls, at any position and in sheets entries', async() => {
    const source = `${IMPORT}plugin.downloadFile('csv', { columnHeaders: true });
plugin?.exportAsString('csv', { filename: 'a' }, { columnHeaders: true });
plugin.downloadFile('xlsx', { sheets: [{ columnHeaders: true }, { colHeaders: true }] });
`;
    const result = await run(source, [CALLS]);

    assert.equal(result.output.match(/colHeaders/g).length, 4);
    assert.equal(result.output.includes('columnHeaders'), false);
  });

  it('skips bare calls, other methods, and non-literal arguments', async() => {
    const source = `${IMPORT}downloadFile('csv', { columnHeaders: true });
plugin.save('csv', { columnHeaders: true });
plugin.downloadFile('csv', options);
plugin.downloadFile('csv', ...rest);
const unrelated = { columnHeaders: true };
`;

    assert.equal((await run(source, [CALLS])).changed, false);
  });

  it('ignores the confidence of the surrounding file and reports a clash', async() => {
    const source = `${IMPORT}plugin.downloadFile('csv', { columnHeaders: true, colHeaders: false });\n`;
    const result = await run(source, [CALLS]);

    assert.equal(result.changed, false);
    assert.deepEqual(summary(result.entries), ['2:manual']);
  });

  it('appends the rule message to the changed entry', async() => {
    const source = `${IMPORT}plugin.downloadFile('csv', { columnHeaders: true });\n`;
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

  it('keeps an emptied parent object', async() => {
    const result = await run(column('{ culture: \'ja-JP\' }'), [MOVE]);

    assert.match(result.output, /numericFormat: \{\}/);
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
    assert.match(different.entries[0].message, /already set to a different value/);
    assert.match(variable.entries[0].message, /comes from a variable/);
  });

  it('drops the nested key when the destination holds the same value', async() => {
    const source = grid('{ locale: \'de-DE\', numericFormat: { culture: \'de-DE\', pattern: \'0\' } }');
    const result = await run(source, [MOVE]);

    assert.equal(result.output.includes('culture'), false);
    assert.equal(result.output.match(/de-DE/g).length, 1);
  });

  it('does nothing without the nested key, for a non-object parent, or for an unrecognized object', async() => {
    const none = await run(grid('{ numericFormat: { pattern: \'0\' } }'), [MOVE]);
    const call = await run(grid('{ numericFormat: makeFormat() }'), [MOVE]);
    const plain = await run(`${IMPORT}const x = { numericFormat: { culture: 'de-DE' } };\n`, [MOVE]);

    assert.deepEqual([none.changed, call.changed, plain.changed], [false, false, false]);
    assert.deepEqual([none.entries.length, call.entries.length, plain.entries.length], [0, 0, 0]);
  });

  it('respects minConfidence high and the aggressive flag', async() => {
    const source = `${IMPORT}const s = { colHeaders: true, numericFormat: { culture: 'de-DE' } };\n`;
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

  it('drops comments that describe the removed property and keeps a section header and a TODO', async() => {
    const described = await run(grid('{\n  a: 1,\n  // describes gone\n  gone: true, // also gone\n  b: 2,\n}'),
      [quiet]);
    const header = await run(grid('{\n  // Date columns\n\n  gone: true,\n  b: 2,\n}'), [quiet]);
    const todo = await run(grid('{\n  // TODO(handsontable-codemod other): keep me\n  gone: true,\n  b: 2,\n}'),
      [quiet]);

    assert.equal(described.output.includes('describes gone'), false);
    assert.equal(described.output.includes('also gone'), false);
    assert.match(header.output, /\/\/ Date columns\s+b: 2/);
    assert.match(todo.output, /keep me\s+b: 2/);
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

  it('ignores a computed key and a key of the same name in a plain object', async() => {
    const computed = await run(grid('{ [\'gone\']: true, colHeaders: true }'), [REMOVE]);
    const plain = await run(`${IMPORT}const row = { gone: true };\n`, [REMOVE]);

    assert.deepEqual([computed.changed, plain.changed], [false, false]);
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
