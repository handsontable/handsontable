import { expect, test, BUNDLES_TAG } from '../fixtures/test';
import { DropdownObjectValuesPage } from '../fixtures/pages/DropdownObjectValuesPage';

/**
 * PRO-1292 — a key/value `source` entry whose `value` is an object, labeled by `sourceLabel`.
 *
 * Before the option, every object option displayed `[object Object]`. A pick then resolved its
 * label against the first entry, and typing a label stored a fabricated `{ key, value }` string
 * pair - the customer's nested data was gone after one edit.
 *
 * Column 0 is a `dropdown` labeled by a property path, column 1 a strict `autocomplete` labeled by
 * a function. Row 0 starts on the FIRST entry, which is exactly what a broken lookup falls back to,
 * so every pick below targets another one.
 */
test.describe('key/value source with object values (sourceLabel)', { tag: BUNDLES_TAG }, () => {
  let grid: DropdownObjectValuesPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new DropdownObjectValuesPage(page, theme, bundle);
    await grid.goto();
  });

  test('renders the cell with the label `sourceLabel` derives', async() => {
    await expect.poll(() => grid.cellLabel(0, 0)).toBe('United States');
    await expect.poll(() => grid.cellLabel(0, 1)).toBe('United States (USD)');
  });

  test('lists every option by its label in the dropdown', async() => {
    await grid.openEditor(0, 0);

    await expect(grid.options()).toHaveText(['United States', 'Poland', 'Japan']);
  });

  test('stores the source entry picked with the mouse, nested object intact', async() => {
    await grid.openEditor(0, 0);
    await grid.pickOption('Poland');

    await expect.poll(() => grid.storedEntryAt(0, 0)).toBe('entry:PL');
    await expect.poll(() => grid.cellLabel(0, 0)).toBe('Poland');
    await expect.poll(() => grid.validState(0, 0)).toBe('valid');
  });

  test('stores the source entry when the label is typed and committed with Enter', async({ page }) => {
    await grid.openEditor(0, 1);

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('Japan');
    // The function label filters the list, so only the composed text of the typed entry remains.
    await expect(grid.options()).toHaveText(['Japan (JPY)']);

    await page.keyboard.press('Enter');

    await expect.poll(() => grid.storedEntryAt(0, 1)).toBe('entry:JP');
    await expect.poll(() => grid.cellLabel(0, 1)).toBe('Japan (JPY)');
    await expect.poll(() => grid.validState(0, 1)).toBe('valid');
  });

  test('resolves a pasted plain-text label into the source entry', async() => {
    await grid.pastePlainText(1, 0, 'Japan');
    await grid.pastePlainText(1, 1, 'Poland (PLN)');

    await expect.poll(() => grid.storedEntryAt(1, 0)).toBe('entry:JP');
    await expect.poll(() => grid.storedEntryAt(1, 1)).toBe('entry:PL');
  });

  test('sorts the column by the label, keeping each object entry whole', async() => {
    await grid.clickSortHeader('Country (dropdown, path)');

    // Ascending by label. Rows 0, 2 and 3 hold US, PL and JP; row 1 is empty and sorts last.
    await expect.poll(() => grid.columnLabels(0, [0, 1, 2])).toEqual(['Japan', 'Poland', 'United States']);
    await expect.poll(() => grid.storedEntryAt(0, 0)).toBe('entry:JP');
    await expect.poll(() => grid.storedEntryAt(2, 0)).toBe('entry:US');
  });

  test('lists labels in the Filters value list and filters by one of them', async() => {
    await grid.openFilterMenu('Country (dropdown, path)');

    const listed = await grid.listedFilterValues();

    // Without the label every entry read `[object Object]` and collapsed into one item.
    expect(listed).toEqual(expect.arrayContaining(['Japan', 'Poland', 'United States']));
    expect(listed).not.toContain('[object Object]');

    await grid.filterByOnlyValue('Poland');

    await expect.poll(() => grid.columnLabels(0, [0])).toEqual(['Poland']);
    await expect.poll(() => grid.storedEntryAt(0, 0)).toBe('entry:PL');
  });

  test('orders an alphabetical list (`sortByRelevance: false`) by the label', async() => {
    await grid.openEditor(0, 2);

    await expect(grid.options()).toHaveText(['Japan', 'Poland', 'United States']);
  });

  test('keeps the list order of a key/value column without `sourceLabel` unchanged', async() => {
    // The control. The alphabetical comparator of a source without the option is left exactly as
    // it was - comparing whole entries - so its list stays in source order. Sorting it by label
    // would reorder lists of existing configurations, which this change must not do.
    await grid.openEditor(0, 3);

    await expect(grid.options()).toHaveText(['United States', 'Poland', 'Japan']);
  });

  test('copies the label `sourceLabel` derives, not `[object Object]`', async() => {
    await expect.poll(() => grid.copyableData(2, 0)).toBe('Poland');
    await expect.poll(() => grid.copyableData(2, 1)).toBe('Poland (PLN)');
  });

  test('exports the label `sourceLabel` derives as the cell value', async() => {
    await expect.poll(() => grid.exportedCsvRow(2)).toBe('Poland,Poland (PLN),Poland');
  });

  test('hands the formula engine the label `sourceLabel` derives', async() => {
    await expect.poll(() => grid.formulaValueAt(0, 1)).toBe('Poland');
    await expect.poll(() => grid.formulaValueAt(1, 1)).toBe('JAPAN');
  });

  test('leaves out an entry whose label resolves to nothing', async() => {
    // `location.city` on `{ location: null }` resolves to nothing. The list first showed the word
    // `undefined` for it, then a blank option - and picking a blank option cannot store the entry:
    // the editor holds empty text, which `getValue()` keeps empty, so the pick cleared the cell.
    await grid.openEditor(0, 4);

    await expect(grid.options()).toHaveText(['Paris']);
  });

  test('lists key/value entries of a mixed source by their labels and stores the one picked', async() => {
    // A plain string beside the entries sent the list down its mixed branch, which showed every
    // entry as `[object Object]`.
    await grid.openEditor(0, 5);

    await expect(grid.options()).toHaveText(['Other', 'Poland', 'Japan', 'France']);

    await grid.pickOption('Japan');

    await expect.poll(() => grid.storedEntryAt(0, 5)).toBe('entry:JP');
    await expect.poll(() => grid.cellLabel(0, 5)).toBe('Japan');
  });

  test('lists a string-valued entry of a mixed source by its text and stores the entry', async() => {
    // `getChoiceLabel()` hands a string `value` back unchanged, so the editor could not tell it was
    // relabeled: it listed `[object Object]`, and picking it stored that literal text.
    await grid.openEditor(1, 5);
    await grid.pickOption('France');

    await expect.poll(() => grid.storedEntryAt(1, 5)).toBe('other:{"key":"FR","value":"France"}');
    await expect.poll(() => grid.cellLabel(1, 5)).toBe('France');
  });

  test('keeps the source order of an alphabetical string key/value list under `sourceLabel`', async() => {
    // `sourceLabel` has no object value to label here - as when a grid-level option cascades to a
    // column of string entries - so the list must sort exactly as it did without the option.
    await grid.openEditor(0, 6);

    await expect(grid.options()).toHaveText(['United States', 'Poland', 'Japan']);
  });
});
