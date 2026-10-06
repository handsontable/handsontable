import { test, expect } from '../fixtures/test';
import { ComplexDemoStatesPage } from '../fixtures/pages/ComplexDemoStatesPage';

/**
 * The editor, menu, selection, sort and collapse states the visual suite photographed on its
 * `/complex-demo` route, asserted from the DOM and the API on every theme and bundle, on the same
 * settings and rows. The captures that stay under `visual-tests/tests/js-only/complex-demo/` are of how
 * those states look; whether they are reached is this spec's.
 */

const EDGE_TOLERANCE_PX = 1;

test.describe('complex demo states', () => {
  test('the dropdown menu opens under Age with its filters components, and the context menu opens on a cell', async({
    page, theme, bundle,
  }) => {
    const demo = new ComplexDemoStatesPage(page, theme, bundle);
    const age = demo.columnHeader('Age');

    await demo.goto();

    await age.locator('.changeType').click();
    await expect(demo.dropdownMenu).toBeVisible();
    await expect(demo.dropdownMenu.locator('tbody td').first()).toHaveText('Insert column left');
    await expect(demo.dropdownMenu.locator('.htFiltersMenuCondition')).toBeVisible();
    await expect(demo.dropdownMenu.locator('.htFiltersMenuValue')).toBeVisible();

    // It opens at the header's lower edge and under it; where exactly is `submenu-position.spec.ts`'s.
    const { header: ageBox, menu: menuBox } = await demo.headerAndDropdownMenuBoxes('Age');

    expect(menuBox.top).toBeGreaterThan(ageBox.top);
    expect(menuBox.top).toBeLessThanOrEqual(ageBox.bottom + EDGE_TOLERANCE_PX);
    expect(menuBox.left).toBeLessThan(ageBox.right);
    expect(menuBox.right).toBeGreaterThan(ageBox.left);
    expect(await demo.dropdownMenu.evaluate(element => getComputedStyle(element).direction)).toBe('ltr');

    await page.keyboard.press('Escape');
    await expect(demo.dropdownMenu).toBeHidden();

    await demo.cell(5, 1).click({ button: 'right' });
    await expect(demo.contextMenu).toBeVisible();
    // Nested rows put their own items first; the merge item closes the list.
    await expect(demo.contextMenu.locator('tbody td').first()).toHaveText('Insert child row');
    await expect(demo.contextMenu.locator('tbody td').filter({ hasText: /\S/ }).last()).toHaveText('Merge cells');
    expect(await demo.selected()).toEqual([[5, 1, 5, 1]]);
  });

  test('in an RTL grid the dropdown and context menus are laid out right to left', async({ page, theme, bundle }) => {
    const demo = new ComplexDemoStatesPage(page, theme, bundle);
    const age = demo.columnHeader('Age');

    await demo.goto('rtl');

    await age.locator('.changeType').click();
    await expect(demo.dropdownMenu).toBeVisible();
    await expect(demo.dropdownMenu.locator('.htFiltersMenuCondition')).toBeVisible();
    await expect(demo.dropdownMenu.locator('.htFiltersMenuValue')).toBeVisible();
    expect(await demo.dropdownMenu.evaluate(element => getComputedStyle(element).direction)).toBe('rtl');

    const { header: ageBox, menu: menuBox } = await demo.headerAndDropdownMenuBoxes('Age');

    expect(menuBox.top).toBeGreaterThan(ageBox.top);
    expect(menuBox.top).toBeLessThanOrEqual(ageBox.bottom + EDGE_TOLERANCE_PX);
    expect(menuBox.left).toBeLessThan(ageBox.right);
    expect(menuBox.right).toBeGreaterThan(ageBox.left);

    await page.keyboard.press('Escape');
    await expect(demo.dropdownMenu).toBeHidden();

    await demo.cell(5, 1).click({ button: 'right' });
    await expect(demo.contextMenu).toBeVisible();
    await expect(demo.contextMenu.locator('tbody td').first()).toHaveText('Insert child row');
    expect(await demo.contextMenu.evaluate(element => getComputedStyle(element).direction)).toBe('rtl');
  });

  test('in an RTL grid the select editor opens over an Interest cell, holding that cell\'s value', async({
    page, theme, bundle,
  }) => {
    const demo = new ComplexDemoStatesPage(page, theme, bundle);
    const wrapper = page.locator('.htSelectEditor');
    const select = wrapper.locator('select');

    await demo.goto('rtl');

    // The fixture's sixth row is interested in tech gadgets; the editor must open on that value.
    expect(await demo.dataAt(5, 4)).toBe('Tech Gadgets');

    await demo.cell(5, 4).click();
    await page.keyboard.press('Enter');
    await expect(wrapper).toBeVisible();
    await expect(select).toBeFocused();
    await expect(select).toHaveValue('Tech Gadgets');
    expect(await select.locator('option').allInnerTexts()).toEqual([
      'Electronics', 'Fashion', 'Tech Gadgets', 'Home Decor', 'Sports & Fitness', 'Books & Literature',
      'Beauty & Personal Care', 'Food & Cooking', 'Travel & Adventure', 'Art & Collectibles',
    ]);
    expect(await select.evaluate(element => getComputedStyle(element).direction)).toBe('rtl');

    const { cell: cellBox, editor: editorBox } = await demo.cellAndSelectEditorBoxes(5, 4);

    (['left', 'top', 'right', 'bottom'] as const).forEach((edge) => {
      expect(Math.abs(editorBox[edge] - cellBox[edge]), `editor ${edge} vs the cell`).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    });
  });

  test('in an RTL grid a drag across three rows and three columns selects that range', async({ page, theme, bundle }) => {
    const demo = new ComplexDemoStatesPage(page, theme, bundle);

    await demo.goto('rtl');

    // Column 0 is frozen at the inline start, so the drag starts in the overlay and ends in the master.
    await demo.dragSelect([3, 0], [5, 2]);

    await expect.poll(() => demo.selected()).toEqual([[3, 0, 5, 2]]);
    await expect(page.locator('.ht_master td.area')).toHaveCount(9);
    await expect(demo.cell(3, 0)).toHaveClass(/\bcurrent\b/);
  });

  test('sorting Age descending, then Interest ascending as the second key, marks both headers in order', async({
    page, theme, bundle,
  }) => {
    const demo = new ComplexDemoStatesPage(page, theme, bundle);
    const age = demo.columnHeader('Age');
    const interest = demo.columnHeader('Interest');

    await demo.goto();

    await age.locator('span.colHeader').click();
    await expect(age).toHaveAttribute('aria-sort', 'ascending');
    await age.locator('span.colHeader').click();
    await expect(age).toHaveAttribute('aria-sort', 'descending');
    await interest.locator('span.colHeader').click({ modifiers: ['ControlOrMeta'] });
    await expect(interest).toHaveAttribute('aria-sort', 'ascending');
    await expect(age).toHaveAttribute('aria-sort', 'descending');

    expect(await demo.sortConfig()).toEqual([
      { column: 3, sortOrder: 'desc' },
      { column: 4, sortOrder: 'asc' },
    ]);
    // Two plugins add these classes, so each is checked on its own, in no particular order.
    await expect(age.locator('.columnSorting')).toHaveClass(/\bdescending\b/);
    await expect(age.locator('.columnSorting')).toHaveClass(/\bsort-1\b/);
    await expect(interest.locator('.columnSorting')).toHaveClass(/\bascending\b/);
    await expect(interest.locator('.columnSorting')).toHaveClass(/\bsort-2\b/);
    expect(await demo.sortOrderBadge('Age')).toBe('"1"');
    expect(await demo.sortOrderBadge('Interest')).toBe('"2"');
  });

  test('collapsing the "I" group hides Password and leaves Name under a collapsed indicator', async({
    page, theme, bundle,
  }) => {
    const demo = new ComplexDemoStatesPage(page, theme, bundle);
    const groupI = demo.columnHeader('I');

    await demo.goto();

    await expect(groupI).toHaveAttribute('colspan', '2');
    expect(await demo.isColumnHidden(2)).toBe(false);

    await groupI.locator('.collapsibleIndicator').click();

    await expect(groupI.locator('.collapsibleIndicator')).toHaveClass(/\bcollapsed\b/);
    expect(await demo.isColumnHidden(2)).toBe(true);
    expect(await demo.isColumnHidden(1)).toBe(false);
    await expect(demo.columnHeader('Password')).toHaveCount(0);
    await expect(demo.columnHeader('Name')).toBeVisible();
    // The groups above shrink by the one column the collapse hid.
    await expect(groupI).not.toHaveAttribute('colspan', /./);
    await expect(demo.columnHeader('E')).toHaveAttribute('colspan', '3');
    await expect(demo.columnHeader('B')).toHaveAttribute('colspan', '7');
  });

  test('typing "to" into a City dropdown bolds the match in each option that holds it and highlights the first', async({
    page, theme, bundle,
  }) => {
    const demo = new ComplexDemoStatesPage(page, theme, bundle);
    const options = demo.editorList.locator('.ht_master tbody td');

    await demo.goto();

    await demo.selectCell(4, 7);
    await page.keyboard.press('Enter');
    await expect(demo.cellEditor).toBeFocused();
    await demo.cellEditor.fill('');
    await demo.cellEditor.pressSequentially('to');

    await expect(demo.editorList).toBeVisible();
    await expect(demo.cellEditor).toHaveValue('to');
    // A dropdown does not filter its list: the options before the matches stay.
    await expect(options.first()).toHaveText('New York');
    await expect(options.locator('strong')).toHaveText(['To', 'To']);
    await expect(options.filter({ has: page.locator('strong') })).toHaveText(['Toronto', 'Tokyo']);
    await expect(options.filter({ hasText: /^Toronto$/ })).toHaveClass(/\bcurrent\b/);
    await expect(demo.editorList.locator('.ht_master tbody td.current')).toHaveCount(1);

    // The list draws only the rows in its view. Houston, the source's last city, holds the match too,
    // in lower case, and scrolling to it leaves Toronto the current option.
    await demo.scrollEditorListToEnd();
    await expect(options.filter({ hasText: /^Houston$/ }).locator('strong')).toHaveText('to');
    expect(await demo.editorList.locator('.ht_master tbody td.current').allInnerTexts()).not.toContain('Houston');
  });
});
