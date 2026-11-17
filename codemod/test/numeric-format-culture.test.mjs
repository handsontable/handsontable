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
    + `columns: [{ numericFormat: { ${culture} } }] });\n`;

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
      + 'new Handsontable(el, { columns: [{ numericFormat: { culture: \'de-DE\', pattern: \'0,0\' } }] });\n'
      + 'new Handsontable(el, { numericFormat: { culture: \'de-DE\', pattern: \'0,0\' } });\n'
      + 'hot.setCellMetaObject(0, 0, { numericFormat: { culture: \'de-DE\', pattern: \'0,0\' } });\n');

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
      'new Handsontable(el, { columns: [{ numericFormat: { culture: \'de-DE\' } }] });',
      'new Handsontable(el, { cell: [{ row: 0, col: 0, numericFormat: { culture: \'de-DE\' } }] });',
      'new Handsontable(el, { cells: () => ({ numericFormat: { culture: \'de-DE\' } }) });',
      'const col: Handsontable.ColumnSettings = { numericFormat: { culture: \'de-DE\' } };',
    ];

    for (const body of cases) {
      const result = await threeRuns(`${HEAD}${body}\n`, 'grid.ts');

      assert.deepEqual(kinds(result.entries), ['changed', 'manual'], body);
      assert.ok(result.output.includes('locale: \'de-DE\''), body);
    }
  });

  it('moves the key of a HotColumn and reports the one of a HotTable', async() => {
    const column = await threeRuns(
      `${REACT}export const A = () => <HotColumn numericFormat={{ culture: 'de-DE' }} />;\n`, 'grid.tsx');
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
      `${HEAD}new Handsontable(el, { columns: [{ numericFormat: { culture: 'de-DE' } }] });\n`);
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
      `${HEAD}new Handsontable(el, { columns: [{ numericFormat: { culture: 'de-DE', style: 'percent' } }] });\n`);

    assert.deepEqual(kinds(result.entries), ['changed', 'manual']);
  });

  it('adds no note when a pattern stays: the numbro-pattern rule speaks about it', async() => {
    const result = await threeRuns(
      `${HEAD}new Handsontable(el, { columns: [{ numericFormat: { culture: 'de-DE', pattern: '0,0' } }] });\n`);

    assert.deepEqual(kinds(result.entries), ['changed']);
  });

  it('adds the note when the locale is already set to the same value and only the culture goes', async() => {
    const result = await threeRuns(
      `${HEAD}new Handsontable(el, { columns: [{ locale: 'de-DE', numericFormat: { culture: 'de-DE' } }] });\n`);

    assert.deepEqual(kinds(result.entries), ['changed', 'manual']);
    assert.match(result.entries[1].message, note);
  });

  it('adds the note to the moved attribute of a HotColumn', async() => {
    const result = await threeRuns(
      `${REACT}export const A = () => <HotColumn numericFormat={{ culture: 'de-DE' }} />;\n`, 'grid.tsx');

    assert.match(result.entries.find(item => item.severity === 'manual').message, note);
  });

  it('adds no note when the key is not moved', async() => {
    const result = await threeRuns(`${HEAD}new Handsontable(el, { numericFormat: { culture: 'de-DE' } });\n`);

    assert.ok(!result.entries.some(entry => note.test(entry.message)));
  });
});
