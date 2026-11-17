import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPlan, loadManifests } from '../src/manifest.mjs';
import { transformFile } from '../src/runner.mjs';

const manifests = await loadManifests();
const plan = buildPlan(manifests.filter(manifest => manifest.version === '18.0.0'), ['18.0.0/numeric-format-culture']);
const HEAD = 'import Handsontable from \'handsontable\';\n';
const REACT = 'import { HotTable, HotColumn } from \'@handsontable/react-wrapper\';\n';
const TODO = 'TODO(handsontable-codemod 18.0.0/numeric-format-culture)';

/**
 * Run the culture rule three times over a file, as the idempotency contract does.
 *
 * @param {string} source File text.
 * @param {string} [filePath] File name, which picks the parser.
 * @returns {Promise<{output: string, entries: object[]}>} The first run.
 */
async function threeRuns(source, filePath = 'grid.js') {
  const first = await transformFile({ filePath, source, plan, options: { markers: true } });
  const second = await transformFile({ filePath, source: first.output, plan, options: { markers: true } });
  const third = await transformFile({ filePath, source: second.output, plan, options: { markers: true } });

  assert.equal(second.output, first.output, 'run 2 changed the file');
  assert.equal(third.output, second.output, 'run 3 changed the file');

  return first;
}

const kinds = entries => entries.map(entry => entry.severity);

describe('numeric-format-culture leaves a culture that can be empty, or that is not a value', () => {
  const column = culture => `${HEAD}new Handsontable(el, { locale: 'pl-PL', `
    + `columns: [{ type: 'numeric', numericFormat: { ${culture} } }] });\n`;

  for (const value of [
    'undefined',
    'null',
    'void 0',
    'isDe ? \'de-DE\' : undefined',
    'isDe ? null : \'de-DE\'',
    'saved ?? undefined',
    'saved || null',
    'isDe && \'de-DE\'',
    '(isDe ? \'de-DE\' : undefined) as string',
  ]) {
    it(`does not move culture: ${value}, because an own locale of undefined overrides the grid locale`, async() => {
      const source = column(`culture: ${value}`);
      const result = await threeRuns(source, 'grid.ts');
      const manual = result.entries.filter(entry => entry.severity === 'manual');

      assert.equal(result.output.replace(/\/\/ TODO.*\n\s*/g, ''), source, result.output);
      assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 0);
      assert.equal(manual.length, 1, JSON.stringify(result.entries));
      assert.match(manual[0].message, /can be undefined or null here/);
    });
  }

  for (const [label, member] of [
    ['a method', 'culture() { return \'de-DE\'; }'],
    ['a getter', 'get culture() { return \'de-DE\'; }'],
    ['an async method', 'async culture() { return \'de-DE\'; }'],
  ]) {
    it(`does not move culture written as ${label}, which is no value, and reports it`, async() => {
      const source = column(member);
      const result = await threeRuns(source, 'grid.ts');
      const manual = result.entries.filter(entry => entry.severity === 'manual');

      assert.equal(result.output.replace(/\/\/ TODO.*\n\s*/g, ''), source, result.output);
      assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 0);
      assert.equal(manual.length, 1, JSON.stringify(result.entries));
      assert.match(manual[0].message, /^Move numericFormat\.culture to locale by hand\./);
    });
  }

  for (const value of [
    '\'de-DE\'',
    'isDe ? \'de-DE\' : \'en-US\'',
    'saved ?? \'de-DE\'',
    'saved || \'de-DE\'',
    'locales.de',
  ]) {
    it(`still moves culture: ${value}`, async() => {
      const result = await threeRuns(column(`culture: ${value}`), 'grid.ts');

      assert.equal(result.entries.filter(entry => entry.severity === 'changed').length, 1,
        JSON.stringify(result.entries));
      assert.match(result.output, /locale: /);
    });
  }

  it('does not move a culture that is a method, and reports it', async() => {
    const source = column('culture() { return \'de-DE\'; }');
    const result = await threeRuns(source, 'grid.ts');

    assert.equal(result.output.replace(/\/\/ TODO.*\n\s*/g, ''), source);
    assert.deepEqual(kinds(result.entries), ['manual']);
    assert.match(result.entries[0].message, /^Move numericFormat\.culture to locale by hand\./);
  });
});

describe('numeric-format-culture moves the key only where one column or cell reads it', () => {
  it('moves it in a column and in a cell, and reports a grid-level key without moving it', async() => {
    const result = await threeRuns(`${HEAD}const hot = new Handsontable(el, {});\n`
      + 'new Handsontable(el, { columns: [{ type: \'numeric\', '
      + 'numericFormat: { culture: \'de-DE\', pattern: \'0,0\' } }] });\n'
      + 'new Handsontable(el, { numericFormat: { culture: \'de-DE\', pattern: \'0,0\' } });\n'
      + 'hot.setCellMetaObject(0, 0, { type: \'numeric\', '
      + 'numericFormat: { culture: \'de-DE\', pattern: \'0,0\' } });\n');

    assert.match(result.output, /locale: 'de-DE',\s+numericFormat: \{\s+pattern: '0,0'\s+\}/, result.output);
    assert.match(result.output, /new Handsontable\(el, \{ numericFormat: \{ culture: 'de-DE', pattern: '0,0' \} \}\);/,
      result.output);
    assert.deepEqual(result.entries.map(entry => `${entry.line}:${entry.severity}`).sort(),
      ['3:changed', '4:manual', '5:changed']);
  });

  it('says what a grid-level locale would reach, and what to set instead', async() => {
    const result = await threeRuns(`${HEAD}new Handsontable(el, { numericFormat: { culture: 'de-DE' } });\n`);
    const [entry] = result.entries;

    assert.equal(result.entries.length, 1);
    assert.equal(entry.severity, 'manual');
    assert.match(entry.message, /^Set locale on the numeric columns that used numericFormat\.culture, or on the grid/);
    assert.match(entry.message, /date, time, intl-date, intl-time, and intl-datetime/);
    assert.match(entry.message, /sorting, filtering, and search/);
    assert.ok(result.output.includes(TODO), result.output);
  });

  it('reports a grid-level key in a settings variable, an updateSettings call, and a typed object', async() => {
    const cases = [
      'const cfg = { numericFormat: { culture: \'de-DE\' } }; new Handsontable(el, cfg);',
      'const hot = new Handsontable(el, {}); hot.updateSettings({ numericFormat: { culture: \'de-DE\' } });',
      'const cfg: Handsontable.GridSettings = { numericFormat: { culture: \'de-DE\' } };',
      'new Handsontable(el, { data: [], colHeaders: true, numericFormat: { culture: \'de-DE\' } });',
    ];

    for (const body of cases) {
      const result = await threeRuns(`${HEAD}${body}\n`, 'grid.ts');

      assert.deepEqual(kinds(result.entries), ['manual'], body);
      assert.ok(result.output.includes('culture: \'de-DE\''), body);
    }
  });

  it('moves the key in the elements of columns and cell, and in the object a cells function returns', async() => {
    const cases = [
      'new Handsontable(el, { columns: [{ type: \'numeric\', numericFormat: { culture: \'de-DE\' } }] });',
      'new Handsontable(el, { cell: [{ row: 0, col: 0, type: \'numeric\', numericFormat: { culture: \'de-DE\' } }] });',
      'new Handsontable(el, { cells: () => ({ type: \'numeric\', numericFormat: { culture: \'de-DE\' } }) });',
      'const col: Handsontable.ColumnSettings = { type: \'numeric\', numericFormat: { culture: \'de-DE\' } };',
    ];

    for (const body of cases) {
      const result = await threeRuns(`${HEAD}${body}\n`, 'grid.ts');

      assert.deepEqual(kinds(result.entries), ['changed', 'manual'], body);
      assert.ok(result.output.includes('locale: \'de-DE\''), body);
    }
  });

  it('moves the key of a HotColumn and reports the one of a HotTable', async() => {
    const column = await threeRuns(
      `${REACT}export const A = () => <HotColumn type="numeric" numericFormat={{ culture: 'de-DE' }} />;\n`,
      'grid.tsx');
    const table = await threeRuns(`${REACT}export const B = () => <HotTable numericFormat={{ culture: 'de-DE' }} />;\n`,
      'grid.tsx');
    const settings = await threeRuns(
      `${REACT}export const C = () => <HotTable settings={{ numericFormat: { culture: 'de-DE' } }} />;\n`, 'grid.tsx');

    assert.deepEqual(kinds(column.entries), ['changed', 'manual']);
    assert.match(column.output, /locale="de-DE"/);
    assert.deepEqual(kinds(table.entries), ['manual']);
    assert.match(table.output, /numericFormat=\{\{ culture: 'de-DE' \}\}/);
    assert.deepEqual(kinds(settings.entries), ['manual']);
    assert.match(settings.output, /culture: 'de-DE'/);
  });
});

describe('numeric-format-culture tells what 17.1 showed for a culture without a pattern', () => {
  const note = /^Check the numbers this column shows\. With a culture and no pattern, 17\.1 formatted them with the/;

  it('adds the note, and names the Intl options that keep the 17.1 output', async() => {
    const result = await threeRuns(
      `${HEAD}new Handsontable(el, { columns: [{ type: 'numeric', numericFormat: { culture: 'de-DE' } }] });\n`);
    const entry = result.entries.find(item => item.severity === 'manual');

    assert.match(entry.message, note);
    assert.match(entry.message, /Numbro pattern '0': every decimal and no grouping, so 1234\.56 showed as 1234,56/);
    assert.match(entry.message, /1\.234,56 for de-DE, and 1234\.5678 becomes 1\.234,568/);
    assert.match(entry.message, /Add useGrouping: false and maximumFractionDigits: 20 to numericFormat/);
    assert.ok(result.output.includes('numericFormat: {}'), 'the tool does not write the options itself');
    assert.ok(!result.output.includes('maximumFractionDigits'), result.output);
  });

  it('adds the note when other Intl options stay beside the culture', async() => {
    const result = await threeRuns(
      `${HEAD}new Handsontable(el, { columns: [{ type: 'numeric', `
      + 'numericFormat: { culture: \'de-DE\', style: \'percent\' } }] });\n');

    assert.deepEqual(kinds(result.entries), ['changed', 'manual']);
  });

  it('adds no note when a pattern stays: the numbro-pattern rule speaks about it', async() => {
    const result = await threeRuns(
      `${HEAD}new Handsontable(el, { columns: [{ type: 'numeric', `
      + 'numericFormat: { culture: \'de-DE\', pattern: \'0,0\' } }] });\n');

    assert.deepEqual(kinds(result.entries), ['changed']);
  });

  it('adds the note when the locale is already set to the same value and only the culture goes', async() => {
    const result = await threeRuns(
      `${HEAD}new Handsontable(el, { columns: [{ type: 'numeric', locale: 'de-DE', `
      + 'numericFormat: { culture: \'de-DE\' } }] });\n');

    assert.deepEqual(kinds(result.entries), ['changed', 'manual']);
    assert.match(result.entries[1].message, note);
  });

  it('adds the note to the moved attribute of a HotColumn', async() => {
    const result = await threeRuns(
      `${REACT}export const A = () => <HotColumn type="numeric" numericFormat={{ culture: 'de-DE' }} />;\n`,
      'grid.tsx');

    assert.match(result.entries.find(item => item.severity === 'manual').message, note);
  });

  it('adds no note when the key is not moved', async() => {
    const result = await threeRuns(`${HEAD}new Handsontable(el, { numericFormat: { culture: 'de-DE' } });\n`);

    assert.ok(!result.entries.some(entry => note.test(entry.message)));
  });
});

describe('numeric-format-culture moves the key only for a numeric column', () => {
  const COLUMN = 'numericFormat: { culture: \'de-DE\' }';
  const moved = result => result.entries.some(entry => entry.severity === 'changed');

  const REPORTED = [
    ['a text column', `new Handsontable(el, { columns: [{ type: 'text', ${COLUMN} }] });`],
    ['a column with no type', `new Handsontable(el, { columns: [{ data: 'a', ${COLUMN} }] });`],
    ['a date column', `new Handsontable(el, { columns: [{ type: 'date', ${COLUMN} }] });`],
    ['a column under a grid of another type',
      `new Handsontable(el, { type: 'text', columns: [{ data: 'a', ${COLUMN} }] });`],
    ['a text column under a numeric grid',
      `new Handsontable(el, { type: 'numeric', columns: [{ type: 'text', ${COLUMN} }] });`],
    ['a column whose type is not a literal', `new Handsontable(el, { columns: [{ type: kind, ${COLUMN} }] });`],
    ['a column that spreads an object that may set the type',
      `new Handsontable(el, { type: 'numeric', columns: [{ ...base, ${COLUMN} }] });`],
    ['a column that sets the type before a spread',
      `new Handsontable(el, { columns: [{ type: 'numeric', ...base, ${COLUMN} }] });`],
    ['a column of a variable the tool cannot place',
      `const col = { data: 'a', ${COLUMN} }; new Handsontable(el, { columns: [col] });`],
    ['a cell with no type', `new Handsontable(el, { cell: [{ row: 0, col: 0, ${COLUMN} }] });`],
    ['a cell of a text column', `new Handsontable(el, { type: 'text', cell: [{ row: 0, col: 0, ${COLUMN} }] });`],
    ['an object a cells function returns, with no type', `new Handsontable(el, { cells: () => ({ ${COLUMN} }) });`],
    ['a cell set by setCellMetaObject, with no type',
      `const hot = new Handsontable(el, {}); hot.setCellMetaObject(0, 0, { ${COLUMN} });`],
  ];

  for (const [label, body] of REPORTED) {
    it(`reports and keeps the key of ${label}`, async() => {
      const result = await threeRuns(`${HEAD}${body}\n`, 'grid.ts');
      const entry = result.entries.find(item => item.severity === 'manual');

      assert.ok(!moved(result), result.output);
      assert.ok(entry, result.output);
      // A type the tool cannot read is also a reader of the key, which speaks first.
      assert.match(entry.message,
        /^Move numericFormat\.culture to locale (by hand if this column is numeric|and update the code that reads it)/);
      assert.ok(result.output.includes('culture: \'de-DE\''), result.output);
      assert.ok(!result.output.includes('locale:'), result.output);
    });
  }

  const MOVED = [
    ['a numeric column', `new Handsontable(el, { columns: [{ type: 'numeric', ${COLUMN} }] });`],
    ['a column under a numeric grid',
      `new Handsontable(el, { type: 'numeric', columns: [{ data: 'a', ${COLUMN} }] });`],
    ['a numeric column under a text grid',
      `new Handsontable(el, { type: 'text', columns: [{ type: 'numeric', ${COLUMN} }] });`],
    ['a column that renders with the numeric renderer',
      `new Handsontable(el, { columns: [{ renderer: 'numeric', ${COLUMN} }] });`],
    ['a text column that renders with the numeric renderer',
      `new Handsontable(el, { columns: [{ type: 'text', renderer: 'numeric', ${COLUMN} }] });`],
    ['a numeric column whose type is set before the key in a wrapped annotation',
      `const col = { type: 'numeric', ${COLUMN} } as Handsontable.ColumnSettings;`],
    ['a cell of a numeric column', `new Handsontable(el, { cell: [{ row: 0, col: 0, type: 'numeric', ${COLUMN} }] });`],
    ['a cell under a numeric grid',
      `new Handsontable(el, { type: 'numeric', cell: [{ row: 0, col: 0, ${COLUMN} }] });`],
    ['a cells function that returns a numeric object',
      `new Handsontable(el, { cells: () => ({ type: 'numeric', ${COLUMN} }) });`],
  ];

  for (const [label, body] of MOVED) {
    it(`still moves the key of ${label}`, async() => {
      const result = await threeRuns(`${HEAD}${body}\n`, 'grid.ts');

      assert.ok(moved(result), result.output);
      assert.ok(result.output.includes('locale: \'de-DE\''), result.output);
    });
  }

  it('reads the type of a wrapper element and of the HotTable it sits in', async() => {
    const cases = [
      ['<HotColumn type="text" numericFormat={{ culture: \'de-DE\' }} />', false],
      ['<HotColumn numericFormat={{ culture: \'de-DE\' }} />', false],
      ['<HotColumn type={kind} numericFormat={{ culture: \'de-DE\' }} />', false],
      ['<HotColumn {...rest} numericFormat={{ culture: \'de-DE\' }} />', false],
      ['<HotColumn type="numeric" numericFormat={{ culture: \'de-DE\' }} />', true],
      ['<HotColumn type={\'numeric\'} numericFormat={{ culture: \'de-DE\' }} />', true],
      ['<HotColumn renderer="numeric" numericFormat={{ culture: \'de-DE\' }} />', true],
    ];

    for (const [element, expected] of cases) {
      const result = await threeRuns(`${REACT}export const A = () => <HotTable>${element}</HotTable>;\n`, 'grid.tsx');

      assert.equal(moved(result), expected, element);
    }

    const under = await threeRuns(`${REACT}export const A = () => <HotTable type="numeric"><HotColumn `
      + 'numericFormat={{ culture: \'de-DE\' }} /></HotTable>;\n', 'grid.tsx');
    const text = await threeRuns(`${REACT}export const A = () => <HotTable type="text"><HotColumn `
      + 'numericFormat={{ culture: \'de-DE\' }} /></HotTable>;\n', 'grid.tsx');

    assert.ok(moved(under), under.output);
    assert.ok(!moved(text), text.output);
  });

  it('says what to do and why, and leaves the text column\'s culture for the user to delete or move', async() => {
    const result = await threeRuns(`${HEAD}new Handsontable(el, { columns: [{ type: 'text', ${COLUMN} }] });\n`);
    const [entry] = result.entries;

    assert.equal(result.entries.length, 1);
    assert.match(entry.message, /delete it if it is not/);
    assert.match(entry.message, /numericFormat does nothing in a column of another type/);
    assert.match(entry.message, /18\.0 reads locale for text sorting, filtering, and search/);
    assert.ok(result.output.includes(TODO), result.output);
  });
});

describe('numeric-format-culture reads the cell type of a column the same way in every parser', () => {
  const cases = [
    ['a numeric type', 'type: \'numeric\'', ['changed', 'manual'], 'locale: \'de-DE\''],
    ['the numeric renderer', 'renderer: \'numeric\'', ['changed', 'manual'], 'locale: \'de-DE\''],
    ['a text type', 'type: \'text\'', ['manual'], 'culture: \'de-DE\''],
    ['a type the file does not show', 'type: kind', ['manual'], 'culture: \'de-DE\''],
    ['no type', 'width: 100', ['manual'], 'culture: \'de-DE\''],
  ];

  for (const file of ['grid.js', 'grid.ts', 'grid.tsx']) {
    for (const [label, key, severities, kept] of cases) {
      it(`${label} in a column of ${file}`, async() => {
        const source = `${HEAD}const kind = pick();\nnew Handsontable(el, `
          + `{ columns: [{ ${key}, numericFormat: { culture: 'de-DE' } }] });\n`;
        const result = await threeRuns(source, file);

        assert.deepEqual(kinds(result.entries), severities, result.output);
        assert.ok(result.output.includes(kept), result.output);
      });
    }
  }
});
