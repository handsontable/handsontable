import { test, expect } from '../fixtures/test';
import { DataSchemaUpdatePage } from '../fixtures/pages/DataSchemaUpdatePage';

const NARROW_SCHEMA = { a: null, b: null, c: null };
const WIDE_SCHEMA = { a: null, b: null, c: null, d: null, e: null };
const REORDERED_SCHEMA = { c: null, b: null, a: null };
const RENAMED_SCHEMA = { x: null, y: null, z: null };
const NEW_DATA = [
  { a: 'n0', b: 'm0', c: 'k0', d: 'j0', e: 'i0' },
  { a: 'n1', b: 'm1', c: 'k1', d: 'j1', e: 'i1' },
];

/**
 * A grid whose column count comes from `dataSchema` (no `columns` option) sized its index mappers
 * from the schema once, at load. An `updateSettings({ dataSchema })` that carried no `data` and no
 * `columns` re-sized nothing: the column count stayed at the old schema's, and the column-to-property
 * map stayed stale.
 *
 * A changed schema now re-creates the data map and re-initializes the index mappers, the way
 * `loadData()` and a changed `columns` already do, so every index-based state (the column order the
 * `ManualColumnMove` plugin keeps in the mapper, hidden and trimmed indexes, sorting, manual sizes)
 * starts over. A schema that did not change, and a grid whose `columns` decides the column count,
 * keep that state.
 */
test.describe('Data schema update through updateSettings()', () => {
  let grid: DataSchemaUpdatePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DataSchemaUpdatePage(page, theme, bundle);
    await grid.goto();
  });

  test('starts with the control state the other tests rely on', async() => {
    // Without this, every "state is kept" assertion below would pass on a move that never happened.
    expect(await grid.countCols()).toBe(3);
    expect(await grid.firstPhysicalColumn()).toBe(0);

    await grid.moveFirstColumnToThirdPosition();

    expect(await grid.firstPhysicalColumn()).toBe(1);
  });

  test('resolves the column count of a wider schema and resets the column order', async() => {
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ dataSchema: WIDE_SCHEMA });

    expect(await grid.countCols()).toBe(5);
    await expect(grid.firstRowCells()).toHaveCount(5);
    await expect.poll(() => grid.firstRowTexts()).toEqual(['a0', 'b0', 'c0', 'd0', 'e0']);
    expect(await grid.firstPhysicalColumn()).toBe(0);
  });

  test('resolves the column count of a narrower schema and resets the column order', async() => {
    await grid.rebuild({ dataSchema: WIDE_SCHEMA });
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ dataSchema: NARROW_SCHEMA });

    expect(await grid.countCols()).toBe(3);
    await expect(grid.firstRowCells()).toHaveCount(3);
    expect(await grid.firstPhysicalColumn()).toBe(0);
  });

  test('resets the column order when the schema keeps its size but renames the properties', async() => {
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ dataSchema: RENAMED_SCHEMA });

    expect(await grid.countCols()).toBe(3);
    expect(await grid.firstPhysicalColumn()).toBe(0);
  });

  test('reads the properties in the key order of a reordered schema', async() => {
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ dataSchema: REORDERED_SCHEMA });

    // Same keys in another order. The property map has to be rebuilt, or the first column keeps reading `a`.
    await expect.poll(() => grid.firstRowTexts()).toEqual(['c0', 'b0', 'a0']);
    expect(await grid.firstPhysicalColumn()).toBe(0);
  });

  test('resets sorting', async() => {
    await grid.rebuild({ columnSorting: true });
    await grid.sortFirstColumnDescending();
    await expect.poll(() => grid.firstColumnTexts()).toEqual(['a2', 'a1', 'a0']);

    await grid.updateSettings({ dataSchema: WIDE_SCHEMA });

    expect(await grid.sortConfig()).toEqual([]);
    await expect.poll(() => grid.firstColumnTexts()).toEqual(['a0', 'a1', 'a2']);
  });

  test('resets columns hidden through the API', async() => {
    await grid.rebuild({ hiddenColumns: true });
    await grid.hideSecondColumn();
    expect(await grid.hiddenColumns()).toEqual([1]);

    await grid.updateSettings({ dataSchema: WIDE_SCHEMA });

    expect(await grid.hiddenColumns()).toEqual([]);
    await expect(grid.firstRowCells()).toHaveCount(5);
  });

  test('applies the hidden columns declared in the settings again', async() => {
    await grid.rebuild({ hiddenColumns: { columns: [1] } });

    await grid.updateSettings({ dataSchema: WIDE_SCHEMA });

    expect(await grid.hiddenColumns()).toEqual([1]);
    await expect(grid.firstRowCells()).toHaveCount(4);
  });

  test('resets manual column widths', async() => {
    await grid.rebuild({ manualColumnResize: true });

    const defaultWidth = await grid.firstColumnWidth();

    expect(await grid.resizeFirstColumn(defaultWidth + 80)).toBe(defaultWidth + 80);

    await grid.updateSettings({ dataSchema: WIDE_SCHEMA });

    expect(await grid.firstColumnWidth()).toBe(defaultWidth);
  });

  test('resets filtering', async() => {
    await grid.rebuild({ filters: true, dropdownMenu: true });
    await grid.filterFirstColumnEqualTo('a1');
    expect(await grid.countRows()).toBe(1);

    await grid.updateSettings({ dataSchema: WIDE_SCHEMA });

    expect(await grid.countRows()).toBe(3);
  });

  test('resets the column order when the schema is cleared and the data decides the columns', async() => {
    await grid.moveFirstColumnToThirdPosition();
    await grid.clearSchema();

    // The data holds five properties, which the grid reads once the schema no longer limits it to three.
    expect(await grid.countCols()).toBe(5);
    await expect.poll(() => grid.firstRowTexts()).toEqual(['a0', 'b0', 'c0', 'd0', 'e0']);
    expect(await grid.firstPhysicalColumn()).toBe(0);
  });

  test('keeps the column order when only the default value of a property changes', async() => {
    await grid.rebuild({ dataSchema: { a: null, b: null, c: null, d: 'new' } });
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ dataSchema: { a: null, b: null, c: null, d: 'open' } });

    expect(await grid.firstPhysicalColumn()).toBe(1);
  });

  test('keeps the column order when a new function returns the same columns', async() => {
    await grid.updateWithFunctionSchema(['a', 'b', 'c']);
    await grid.moveFirstColumnToThirdPosition();

    // A new function on every call, which is what an inline function in a component does on every render.
    await grid.updateWithFunctionSchema(['a', 'b', 'c']);

    expect(await grid.firstPhysicalColumn()).toBe(1);
    await expect.poll(() => grid.firstRowTexts()).toEqual(['b0', 'c0', 'a0']);
  });

  test('resets the column order when a new function returns other columns', async() => {
    await grid.updateWithFunctionSchema(['a', 'b', 'c']);
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateWithFunctionSchema(['c', 'b', 'a', 'd']);

    expect(await grid.countCols()).toBe(4);
    await expect.poll(() => grid.firstRowTexts()).toEqual(['c0', 'b0', 'a0', 'd0']);
    expect(await grid.firstPhysicalColumn()).toBe(0);
  });

  test('resets the column order when data and a schema with other columns arrive together', async() => {
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ data: NEW_DATA, dataSchema: WIDE_SCHEMA });

    expect(await grid.countCols()).toBe(5);
    await expect.poll(() => grid.firstRowTexts()).toEqual(['n0', 'm0', 'k0', 'j0', 'i0']);
    expect(await grid.firstPhysicalColumn()).toBe(0);
  });

  test('keeps the column order when data and an equal schema arrive together', async() => {
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ data: NEW_DATA, dataSchema: { ...NARROW_SCHEMA } });

    expect(await grid.firstPhysicalColumn()).toBe(1);
    await expect.poll(() => grid.firstRowTexts()).toEqual(['m0', 'k0', 'n0']);
  });

  test('keeps the column order when new data arrives without a schema', async() => {
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ data: NEW_DATA });

    expect(await grid.firstPhysicalColumn()).toBe(1);
  });

  test('keeps the column order when an equal schema is sent again', async() => {
    await grid.moveFirstColumnToThirdPosition();

    // A new object with the same content, which is what a wrapper re-sends on every render.
    await grid.updateSettings({ dataSchema: { ...NARROW_SCHEMA } });

    expect(await grid.countCols()).toBe(3);
    expect(await grid.firstPhysicalColumn()).toBe(1);
    await expect.poll(() => grid.firstRowTexts()).toEqual(['b0', 'c0', 'a0']);
  });

  test('keeps the column order when the update does not mention the schema', async() => {
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ readOnly: true });

    expect(await grid.firstPhysicalColumn()).toBe(1);
  });

  test('leaves the state alone when `columns` decides the column count', async() => {
    await grid.rebuild({ columns: [{ data: 'a' }, { data: 'b' }, { data: 'c' }] });
    await grid.moveFirstColumnToThirdPosition();
    await grid.updateSettings({ dataSchema: WIDE_SCHEMA });

    expect(await grid.countCols()).toBe(3);
    expect(await grid.firstPhysicalColumn()).toBe(1);
  });
});
