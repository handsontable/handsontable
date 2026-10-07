import { expect, test } from '../fixtures/test';
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
test.describe('key/value source with object values (sourceLabel)', () => {
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
});
