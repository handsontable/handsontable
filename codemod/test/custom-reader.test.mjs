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
    ['a write to the option', 'function f(meta) { meta.correctFormat = false; }'],
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
