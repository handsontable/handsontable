import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BUILT_IN_CELL_TYPES, BUILT_IN_EDITORS, BUILT_IN_RENDERERS, BUILT_IN_VALIDATORS }
  from '../src/lib/option-objects.mjs';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests();
const REMOVALS = ['18.0.0/correct-format-removed', '18.0.0/date-picker-config-removed'];
const CULTURE = ['18.0.0/numeric-format-culture'];
const IMPORT = 'import Handsontable from \'handsontable\';\n';
const REACT = 'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';\n';

/**
 * Run rules over a source text three times, as the idempotency contract does.
 *
 * @param {string} source Source text.
 * @param {string[]} only Rule ids.
 * @param {string} [file] File name.
 * @returns {Promise<{output: string, entries: object[]}>} The first run, after checking runs 2 and 3 change nothing.
 */
async function run(source, only, file = 'grid.tsx') {
  const plan = buildPlan(manifests.filter(manifest => manifest.version === '18.0.0'), only);
  const first = await transformFile({ filePath: file, source, plan, options: { markers: true } });
  const second = await transformFile({ filePath: file, source: first.output, plan, options: { markers: true } });
  const third = await transformFile({ filePath: file, source: second.output, plan, options: { markers: true } });

  assert.equal(second.output, first.output, 'run 2 changed the file');
  assert.equal(third.output, second.output, 'run 3 changed the file');

  return first;
}

/**
 * Wrap a column in a grid.
 *
 * @param {string} column The column object text.
 * @param {string} [after] Statements after the grid.
 * @returns {string} The source.
 */
const bare = (column, after = '') => `new Handsontable(el, { columns: [${column}] });\n${after}`;
const grid = (column, after = '') => `${IMPORT}${bare(column, after)}`;

/**
 * Whether a removal rule deleted the option from the first run's output.
 *
 * @param {{output: string}} result The run.
 * @param {string} name The option name.
 * @returns {boolean} `true` when the key no longer stands as a property.
 */
const deleted = (result, name) => !new RegExp(`${name}\\s*[:=]`).test(result.output.replace(/\/\/ TODO.*$/gm, ''));

describe('a cells option or a meta hook of the same settings that may set a reader', () => {
  const COLUMN = '{ type: \'date\', correctFormat: true }';
  const settings = hook => `${IMPORT}new Handsontable(el, {\n  columns: [${COLUMN}],\n  ${hook},\n});\n`;
  const KEPT = [
    ['a cells function that returns a custom editor', 'cells(row) { return { editor: PikadayEditor }; }'],
    ['a cells arrow that returns a conditional custom renderer',
      'cells: (row) => (row ? { renderer: fancy } : { readOnly: true })'],
    ['a cells function that is imported', 'cells: importedCells'],
    ['a cells function that returns something it cannot see', 'cells(row) { return lookup[row]; }'],
    ['a cells function that returns a spread', 'cells(row) { return { ...base, readOnly: true }; }'],
    ['a hook that assigns an editor to the meta', 'afterGetCellMeta(row, col, meta) { meta.editor = PikadayEditor; }'],
    ['a hook that assigns a validator by key', 'beforeGetCellMeta(row, col, meta) { meta[\'validator\'] = check; }'],
    ['a hook that installs an editor through setCellMeta',
      'afterGetCellMeta(row, col) { this.setCellMeta(row, col, \'editor\', PikadayEditor); }'],
    ['a hook that installs a renderer through an optional setCellMeta call',
      'afterGetCellMeta(row, col, meta) { meta.hot?.setCellMeta(row, col, \'renderer\', fancy); }'],
    ['a hook that installs an editor through setCellMetaObject',
      'afterGetCellMeta(row, col) { this.setCellMetaObject(row, col, { editor: PikadayEditor }); }'],
    ['a hook that defines a validator with Object.defineProperty',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperty(meta, \'validator\', { value: check }); }'],
    ['a hook that defines a renderer with a getter',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperty(meta, \'renderer\', { get() { return fancy; } }); }'],
    ['a hook that installs an editor with Object.assign',
      'beforeGetCellMeta(row, col, meta) { Object.assign(meta, { editor: PikadayEditor }); }'],
    ['a hook that installs an editor with Reflect.set',
      'beforeGetCellMeta(row, col, meta) { Reflect.set(meta, \'editor\', PikadayEditor); }'],
    ['a hook that sets a reader under a key that is a variable',
      'afterGetCellMeta(row, col) { this.setCellMeta(row, col, key, PikadayEditor); }'],
    ['a hook that sets a plain value under a key that is a variable',
      'afterGetCellMeta(row, col) { this.setCellMeta(row, col, key, true); }'],
    ['a hook that sets a key with Reflect.set under a key that is a variable',
      'beforeGetCellMeta(row, col, meta) { Reflect.set(meta, key, true); }'],
    ['a hook that defines a property under a key that is a variable',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperty(meta, key, { value: 1 }); }'],
    ['a hook that defines a reader key with a descriptor it cannot read',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperty(meta, \'editor\', descriptor); }'],
    ['a hook that defines a reader key with a descriptor that spreads',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperty(meta, \'editor\', { ...base, enumerable: true }); }'],
    ['a hook that defines a reader key with Reflect.defineProperty and a descriptor from a call',
      'beforeGetCellMeta(row, col, meta) { Reflect.defineProperty(meta, \'validator\', make()); }'],
    ['a hook that defines a plain key with a descriptor that spreads, which may carry a reader',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperty(meta, \'readOnly\', { ...base }); }'],
    ['a hook that defines properties from a variable',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperties(meta, descriptors); }'],
    ['a hook that assigns a source object from a variable',
      'beforeGetCellMeta(row, col, meta) { Object.assign(meta, defaults); }'],
    ['a hook that assigns one readable and one unreadable source',
      'beforeGetCellMeta(row, col, meta) { Object.assign(meta, { readOnly: true }, extra); }'],
    ['a hook that assigns a source that spreads',
      'beforeGetCellMeta(row, col, meta) { Object.assign(meta, { ...base, readOnly: true }); }'],
    ['a hook that passes setCellMetaObject an object from a variable',
      'afterGetCellMeta(row, col) { this.setCellMetaObject(row, col, settings); }'],
    ['a hook that passes setCellMetaObject an object that spreads',
      'afterGetCellMeta(row, col) { this.setCellMetaObject(row, col, { ...base, readOnly: true }); }'],
    ['a hook that returns an object that spreads the meta',
      'afterGetCellMeta(row, col, meta) { return { ...meta, readOnly: true }; }'],
    ['a hook that builds an object with a computed key',
      'afterGetCellMeta(row, col, meta) { Object.assign(meta, { [key]: value }); }'],
    ['a hook that is imported', 'afterGetCellMeta: importedHook'],
    ['a cell array with a custom editor', 'cell: [{ row: 0, col: 0, editor: PikadayEditor }]'],
    ['a named function that sets one',
      'cells: namedCells'],
  ];

  for (const [label, hook] of KEPT) {
    it(`keeps correctFormat when the settings hold ${label}`, async() => {
      const named = hook === 'cells: namedCells'
        ? 'function namedCells() { return { validator: check }; }\n' : '';
      const result = await run(`${named}${settings(hook)}`, REMOVALS);
      const manual = result.entries.filter(entry => entry.severity === 'manual');

      assert.ok(result.output.includes('correctFormat: true'), result.output);
      assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 0);
      assert.equal(manual.length, 1, JSON.stringify(result.entries));
      assert.match(manual[0].message, /^Check the cells option or the meta hook/);
    });
  }

  const DELETED = [
    ['a cells function that sets only plain options', 'cells(row) { return row === 0 ? { readOnly: true } : {}; }'],
    ['a cells function that returns nothing', 'cells() { return undefined; }'],
    ['a cells function that sets a built-in editor', 'cells: () => ({ editor: \'text\' })'],
    ['a hook that only reads the meta', 'afterGetCellMeta(row, col, meta) { log(meta.readOnly); }'],
    ['a hook that assigns a plain option', 'afterGetCellMeta(row, col, meta) { meta.readOnly = true; }'],
    ['a hook that sets a plain option through setCellMeta',
      'afterGetCellMeta(row, col) { this.setCellMeta(row, col, \'readOnly\', true); }'],
    ['a hook that sets a built-in editor through setCellMeta',
      'afterGetCellMeta(row, col) { this.setCellMeta(row, col, \'editor\', \'text\'); }'],
    ['a hook that defines a plain option with Object.defineProperty',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperty(meta, \'readOnly\', { value: true }); }'],
    ['a hook that defines a validator as undefined',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperty(meta, \'validator\', { value: undefined }); }'],
    ['a Map that stores an editor under a key', 'afterGetCellMeta() { cache.set(\'editor\', PikadayEditor); }'],
    ['a hook that defines a plain key with a descriptor it cannot read',
      'beforeGetCellMeta(row, col, meta) { Object.defineProperty(meta, \'readOnly\', descriptor); }'],
    ['a hook that assigns only readable literals',
      'beforeGetCellMeta(row, col, meta) { Object.assign(meta, { readOnly: true }, { className: \'a\' }); }'],
    ['a hook that passes setCellMetaObject a readable literal',
      'afterGetCellMeta(row, col) { this.setCellMetaObject(row, col, { readOnly: true, className: \'a\' }); }'],
    ['a hook that spreads an array and calls with spread arguments',
      'afterGetCellMeta(row, col, meta) { log(...[row, col]); return [...[meta]].length; }'],
    ['a hook that builds a plain object with a string computed key',
      'afterGetCellMeta(row, col, meta) { Object.assign(meta, { [\'readOnly\']: true }); }'],
    ['a cell array of plain options', 'cell: [{ row: 0, col: 0, readOnly: true }]'],
    ['an unrelated key named like a hook', 'afterRender() { return lookup; }'],
  ];

  for (const [label, hook] of DELETED) {
    it(`still deletes correctFormat when the settings hold ${label}`, async() => {
      const result = await run(settings(hook), REMOVALS);

      assert.equal(deleted(result, 'correctFormat'), true, result.output);
      assert.equal(result.entries.filter(entry => entry.severity === 'manual').length, 0,
        JSON.stringify(result.entries));
    });
  }

  it('reads a hook that a wrapper element takes as a prop', async() => {
    const keep = await run(`${REACT}export const a = <HotTable cells={importedCells}>\n`
      + '  <HotColumn type="date" correctFormat />\n</HotTable>;\n', REMOVALS);
    const drop = await run(`${REACT}export const a = <HotTable cells={(r) => ({ readOnly: r === 0 })}>\n`
      + '  <HotColumn type="date" correctFormat />\n</HotTable>;\n', REMOVALS);

    assert.ok(keep.output.includes('correctFormat'));
    assert.equal(keep.entries.filter(entry => entry.severity === 'manual').length, 1);
    assert.equal(deleted(drop, 'correctFormat'), true, drop.output);
  });
});

describe('a removal that custom code may read is reported, and deletes nothing', () => {
  const READERS = [
    ['a function validator', 'validator: myValidator'],
    ['an inline validator', 'validator(value, callback) { callback(true); }'],
    ['an arrow validator', 'validator: (value, callback) => callback(true)'],
    ['a registered validator name', 'validator: \'my-validator\''],
    ['a custom editor', 'editor: MyEditor'],
    ['a custom renderer', 'renderer: myRenderer'],
    ['a registered cell type name', 'type: \'my-date\''],
    ['a cell type from a variable', 'type: kind'],
    ['an editor from a member', 'editor: editors.mine'],
    ['a conditional with a custom branch', 'editor: wide ? \'date\' : MyEditor'],
  ];

  for (const [label, text] of READERS) {
    it(`keeps correctFormat next to ${label}`, async() => {
      const result = await run(grid(`{ type: 'date', correctFormat: true, ${text} }`), REMOVALS);
      const manual = result.entries.filter(entry => entry.severity === 'manual');

      assert.ok(result.output.includes('correctFormat: true'), result.output);
      assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 0);
      assert.equal(manual.length, 1);
      assert.match(manual[0].message, /^Check the (custom|cell type)/);
      assert.match(manual[0].message, /before you delete correctFormat/);
    });
  }

  it('keeps datePickerConfig next to a custom editor, and names the editor line', async() => {
    const column = '{\n  type: \'date\',\n  editor: PikadayEditor,\n  datePickerConfig: { firstDay: 1 },\n}';
    const result = await run(grid(column),
      REMOVALS);
    const manual = result.entries.filter(entry => entry.severity === 'manual');

    assert.ok(result.output.includes('datePickerConfig: { firstDay: 1 }'));
    assert.equal(manual.length, 1);
    assert.match(manual[0].message,
      /^Check the custom editor set next to it before you delete datePickerConfig\. It is on line 4\./);
  });

  it('keeps both options and reports each one', async() => {
    const column = '{ type: \'date\', correctFormat: true, datePickerConfig: {}, validator: v }';
    const result = await run(grid(column), REMOVALS);

    assert.equal(result.entries.filter(entry => entry.severity === 'manual').length, 2);
    assert.ok(result.output.includes('correctFormat: true') && result.output.includes('datePickerConfig: {}'));
  });

  it('keeps the option when an enclosing option object sets the reader', async() => {
    const source = `${IMPORT}new Handsontable(el, {\n  validator: gridValidator,\n`
      + '  columns: [{ type: \'date\', correctFormat: true }],\n});\n';
    const result = await run(source, REMOVALS);

    assert.ok(result.output.includes('correctFormat: true'));
    assert.equal(result.entries.filter(entry => entry.severity === 'manual').length, 1);
  });

  it('keeps the option next to a spread that the tool cannot read, and next to one that resolves to a reader', async() => {
    const unknown = await run(grid('{ type: \'date\', correctFormat: true, ...cellDefinition }'), REMOVALS);
    const resolved = await run(`${IMPORT}const base = { renderer: mine };\n${bare('{ correctFormat: true, ...base }')}`,
      REMOVALS);

    assert.ok(unknown.output.includes('correctFormat: true'));
    assert.match(unknown.entries.find(entry => entry.severity === 'manual').message,
      /^Check the spread next to it that the tool cannot read before you delete correctFormat\. It is on line 2\./);
    assert.ok(resolved.output.includes('correctFormat: true'));
  });

  it('keeps the option next to a computed key', async() => {
    const result = await run(grid('{ type: \'date\', correctFormat: true, [key]: 1 }'), REMOVALS);

    assert.ok(result.output.includes('correctFormat: true'));
  });

  it('keeps the option when the file registers a built-in name again', async() => {
    const column = '{ type: \'date\', correctFormat: true, validator: \'date\' }';
    const source = `${IMPORT}registerValidator('date', myDateValidator);\n${bare(column)}`;
    const result = await run(source, REMOVALS);

    assert.ok(result.output.includes('correctFormat: true'));
    assert.match(result.entries.find(entry => entry.severity === 'manual').message,
      /^Check the built-in name that this file registers again before you delete correctFormat\. It is on line 2\./);
  });

  const READS = [
    ['a member read', 'function f(cellProperties) { return cellProperties.correctFormat; }'],
    ['an optional read', 'const f = cellProperties => cellProperties?.correctFormat === true;'],
    ['a string key', 'const f = cellProperties => cellProperties[\'correctFormat\'];'],
    ['a destructuring', 'const f = ({ correctFormat }) => correctFormat;'],
    ['a destructuring of the cell meta', 'const { correctFormat } = hot.getCellMeta(0, 0);'],
    ['an in check', 'const f = cellProperties => \'correctFormat\' in cellProperties;'],
    ['a compound assignment, whose read half counts', 'function f(meta) { meta.correctFormat ||= true; }'],
    ['an update expression', 'function f(meta) { meta.correctFormat++; }'],
    ['a read of a member of the option', 'function f(meta) { return meta.correctFormat.value; }'],
    ['a read in the right side of an assignment', 'function f(meta) { target.correctFormat = meta.correctFormat; }'],
  ];

  for (const [label, text] of READS) {
    it(`keeps correctFormat when the file has ${label}`, async() => {
      const result = await run(grid('{ type: \'date\', correctFormat: true }', `${text}\n`), REMOVALS);

      assert.ok(result.output.includes('correctFormat: true'), result.output);
      assert.ok(result.entries.some(entry => /^Check the code in this file that reads correctFormat before you delete/
        .test(entry.message)), JSON.stringify(result.entries));
    });
  }

  it('keeps datePickerConfig when a custom editor reads it from the cell properties', async() => {
    const source = `${IMPORT}const editor = { getConfig(e) { return e.cellProperties.datePickerConfig; } };\n`
      + 'new Handsontable(el, { columns: [{ data: \'d\', datePickerConfig: { firstDay: 0 } }] });\n';
    const result = await run(source, REMOVALS);

    assert.ok(result.output.includes('datePickerConfig: { firstDay: 0 }'));
  });

  it('keeps an attribute of a wrapper element next to a custom editor or renderer', async() => {
    const element = attributes => `${REACT}export const G = () => <HotTable><HotColumn ${attributes} /></HotTable>;\n`;

    for (const attributes of ['type="date" correctFormat hotEditor={Mine}', 'correctFormat hotRenderer={mine}',
      'correctFormat validator={v}', 'correctFormat editor={E}', 'correctFormat type={kind}',
      'correctFormat {...rest}']) {
      const result = await run(element(attributes), REMOVALS);

      assert.match(result.output, /correctFormat/, attributes);
      assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 0, attributes);
    }
  });

  it('keeps an attribute of a wrapper element when the parent element sets the reader', async() => {
    const source = `${REACT}export const G = () => <HotTable validator={v}>`
      + '<HotColumn type="date" correctFormat /></HotTable>;\n';
    const result = await run(source, REMOVALS);

    assert.match(result.output, /correctFormat \/>/);
  });
});

describe('a write to the option is not a read of it', () => {
  const WRITES = [
    ['an assignment', 'function f(meta) { meta.correctFormat = false; }'],
    ['an assignment to an indexed column', 'columns[2].correctFormat = true;'],
    ['an assignment to a string key', 'function f(meta) { meta[\'correctFormat\'] = false; }'],
    ['an assignment to a nested member', 'function f(meta) { meta.cell.correctFormat = false; }'],
    ['a parenthesized assignment target', 'function f(meta) { (meta.correctFormat) = false; }'],
    ['a deletion', 'function f(meta) { delete meta.correctFormat; }'],
    ['a destructuring assignment target', 'function f(meta, list) { [meta.correctFormat] = list; }'],
    ['an object pattern assignment target', 'function f(meta, bag) { ({ value: meta.correctFormat } = bag); }'],
    ['a for head target', 'function f(meta, list) { for (meta.correctFormat of list) { run(); } }'],
    ['an object literal key', 'const defaults = { correctFormat: true };'],
    ['a class property key', 'class Defaults { correctFormat = true; }'],
  ];

  for (const [label, text] of WRITES) {
    it(`deletes correctFormat when the file has ${label}`, async() => {
      const result = await run(grid('{ type: \'date\', correctFormat: true }', `${text}\n`), REMOVALS, 'grid.ts');
      const column = result.output.split('\n').find(line => line.includes('new Handsontable'));

      assert.doesNotMatch(column, /correctFormat/, result.output);
      assert.ok(!result.entries.some(entry => /reads correctFormat/.test(entry.message)),
        JSON.stringify(result.entries));
    });
  }

  it('deletes datePickerConfig when the file only assigns it', async() => {
    const source = grid('{ type: \'date\', datePickerConfig: { firstDay: 1 } }',
      'columns[0].datePickerConfig = { firstDay: 0 };\n');
    const result = await run(source, REMOVALS);

    assert.ok(deleted(result, 'datePickerConfig') || !result.output.split('\n')[1].includes('datePickerConfig'),
      result.output);
    assert.ok(!result.entries.some(entry => /reads datePickerConfig/.test(entry.message)));
  });

  it('moves numericFormat.culture when the file only assigns it', async() => {
    const source = grid('{ data: \'a\', type: \'numeric\', numericFormat: { culture: \'de-DE\' } }',
      'meta.numericFormat.culture = \'fr-FR\';\n');
    const result = await run(source, CULTURE);

    assert.ok(result.output.includes('locale: \'de-DE\''), result.output);
  });

  it('keeps numericFormat.culture when the file reads it, in a member read and in an in check', async() => {
    for (const read of ['const c = meta.numericFormat.culture;', 'const c = \'culture\' in meta.numericFormat;']) {
      const source = grid('{ data: \'a\', type: \'numeric\', numericFormat: { culture: \'de-DE\' } }', `${read}\n`);
      const result = await run(source, CULTURE);

      assert.ok(result.output.includes('culture: \'de-DE\''), read);
    }
  });
});

describe('a removal that nothing can read still deletes the option', () => {
  const PLAIN = [
    ['a plain date column', '{ type: \'date\', correctFormat: true }'],
    ['a column with no type', '{ data: \'d\', correctFormat: true }'],
    ['built-in names',
      '{ type: \'intl-date\', editor: \'date\', renderer: \'date\', validator: \'date\', correctFormat: true }'],
    ['a regular expression validator', '{ validator: /^\\d+$/, correctFormat: true }'],
    ['no editor', '{ editor: false, correctFormat: true }'],
    ['an undefined renderer', '{ renderer: undefined, correctFormat: true }'],
    ['a conditional of built-in names', '{ type: wide ? \'date\' : \'time\', correctFormat: true }'],
  ];

  for (const [label, column] of PLAIN) {
    it(`deletes correctFormat in ${label}`, async() => {
      const result = await run(grid(column.replace('type: wide ? \'date\' : \'time\'', 'type: \'date\'')), REMOVALS);

      assert.ok(deleted(result, 'correctFormat'), result.output);
      assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 1);
    });
  }

  it('deletes next to a spread that resolves to built-in names only', async() => {
    const result = await run(`${IMPORT}const base = { type: 'date', editor: 'date' };\n${
      bare('{ correctFormat: true, ...base }')}`,
    REMOVALS);

    assert.ok(deleted(result, 'correctFormat'), result.output);
  });

  it('is not stopped by a spread or a custom key on an object that is not an option object', async() => {
    const column = '{ type: \'date\', correctFormat: true }';
    const source = `${IMPORT}const unrelated = { validator: mine, ...rest };\n${bare(column)}`;
    const result = await run(source, REMOVALS);

    assert.ok(deleted(result, 'correctFormat'), result.output);
  });

  it('is not stopped by an unreadable spread on the settings that enclose the column', async() => {
    const source = `${IMPORT}new Handsontable(el, { columns: [{ type: 'date', correctFormat: true }], ...extra });\n`;
    const result = await run(source, REMOVALS);

    assert.ok(deleted(result, 'correctFormat'), result.output);
  });

  it('is not stopped by a read of a different option, or by a read in a comment or a string', async() => {
    const source = grid('{ type: \'date\', correctFormat: true }',
      '// cellProperties.correctFormat is gone\nconst text = \'x.correctFormat\';\nconst y = other.dateFormat;\n');
    const result = await run(source, REMOVALS);

    assert.ok(deleted(result, 'correctFormat'), result.output);
  });

  it('deletes an attribute of a wrapper element that has built-in names only', async() => {
    const source = `${REACT}export const G = () => <HotTable>`
      + '<HotColumn type="date" editor="date" correctFormat /></HotTable>;\n';
    const result = await run(source, REMOVALS);

    assert.doesNotMatch(result.output.replace(/\{\/\*.*?\*\/\}/g, ''), /correctFormat/);
  });
});

describe('a move that custom code may read keeps the key', () => {
  const column = extra => grid(`{ data: 'a', type: 'numeric', numericFormat: { culture: 'de-DE' }${extra} }`);

  for (const text of [', validator: v', ', editor: E', ', renderer: r', ', type: kind']) {
    it(`keeps numericFormat.culture next to ${text.slice(2)}`, async() => {
      const source = column(text.startsWith(', type') ? '' : text).replace('type: \'numeric\'',
        text.startsWith(', type') ? 'type: kind' : 'type: \'numeric\'');
      const result = await run(source, CULTURE);

      assert.ok(result.output.includes('culture: \'de-DE\''), result.output);
      assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 0);
    });
  }

  it('moves it when the object has built-in names only', async() => {
    const result = await run(column(', validator: \'numeric\', editor: \'numeric\''), CULTURE);

    assert.ok(result.output.includes('locale: \'de-DE\''), result.output);
  });
});

describe('the built-in name lists', () => {
  it('hold every name of the 17.1 and 18.x packages and the develop source', () => {
    assert.deepEqual([...BUILT_IN_EDITORS].sort(), ['autocomplete', 'base', 'checkbox', 'date', 'dropdown',
      'handsontable', 'intl-date', 'intl-datetime', 'intl-time', 'multiselect', 'numeric', 'password', 'select', 'text',
      'time']);
    assert.deepEqual([...BUILT_IN_RENDERERS].sort(), ['autocomplete', 'base', 'checkbox', 'date', 'dropdown',
      'handsontable', 'html', 'intl-date', 'intl-datetime', 'intl-time', 'multiselect', 'numeric', 'password', 'select',
      'text', 'time']);
    assert.deepEqual([...BUILT_IN_VALIDATORS].sort(), ['autocomplete', 'checkbox', 'date', 'dropdown', 'intl-date',
      'intl-datetime', 'intl-time', 'multiselect', 'numeric', 'time']);
    assert.deepEqual([...BUILT_IN_CELL_TYPES].sort(), ['autocomplete', 'checkbox', 'date', 'dropdown', 'handsontable',
      'intl-date', 'intl-datetime', 'intl-time', 'multiselect', 'numeric', 'password', 'select', 'text', 'time']);
  });
});
