import { test, expect } from '../fixtures/test';
import { EmptyDataStateLayoutPage, type Box, type PanelGeometry } from '../fixtures/pages/EmptyDataStateLayoutPage';

/**
 * Where the empty-data-state message is drawn, asserted from DOM rects for each grid shape the visual
 * suite's `/empty-data-state-demo` route photographed, on every theme and bundle: a grid with no rows and
 * a fixed height, `height: 'auto'`, no height at all, no columns, and RTL; and the no-results state a
 * filter reaches through the dropdown menu, with the keyboard path the demo's captures took. The message
 * texts and the Reset filters button are asserted in Jasmine too
 * (`handsontable/src/plugins/emptyDataState/__tests__/`); what nothing asserted is where the panel sits
 * against the headers and the root. The captures that stay under
 * `visual-tests/tests/js-only/empty-data-state/` are of how the panel looks.
 */

const EDGE_TOLERANCE_PX = 0.5;
const CENTER_TOLERANCE_PX = 1;

/**
 * Asserts that the content is centred in the panel on both axes.
 *
 * @param {PanelGeometry} geometry The panel's geometry.
 */
function expectContentCentred({ panel, content }: PanelGeometry) {
  expect(Math.abs(((content.left + content.right) / 2) - ((panel.left + panel.right) / 2)))
    .toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
  expect(Math.abs(((content.top + content.bottom) / 2) - ((panel.top + panel.bottom) / 2)))
    .toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
  expect(content.top).toBeGreaterThan(panel.top);
  expect(content.bottom).toBeLessThan(panel.bottom);
}

/**
 * Asserts that the panel starts right under the column header row and spans exactly its width.
 *
 * @param {PanelGeometry} geometry The panel's geometry.
 */
function expectUnderTheHeaders({ panel, headers }: PanelGeometry) {
  const row = headers as Box;

  expect(Math.abs(panel.top - row.bottom), 'panel top vs the header row bottom').toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
  expect(Math.abs(panel.left - row.left), 'panel left vs the header row left').toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
  expect(Math.abs(panel.right - row.right), 'panel right vs the header row right').toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
}

test.describe('empty data state layout', () => {
  test('with a fixed height the message fills the grid body under the column headers', async({
    page, theme, bundle,
  }) => {
    const edsPage = new EmptyDataStateLayoutPage(page, theme, bundle);

    await edsPage.goto();

    await expect(edsPage.title).toHaveText('No data available');
    await expect(edsPage.description).toHaveText('There’s nothing to display yet.');
    await expect(edsPage.panel.getByRole('button')).toHaveCount(0);

    const geometry = await edsPage.geometry();

    expectUnderTheHeaders(geometry);
    expect(geometry.disablesTopBorder).toBe(true);
    expect(Math.abs(geometry.panel.bottom - geometry.root.bottom)).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    expect(geometry.root.bottom - geometry.root.top).toBeCloseTo(400, 0);
    expectContentCentred(geometry);
  });

  test('with `height: auto`, and with no height, the grid shrinks to the headers plus the message', async({
    page, theme, bundle,
  }) => {
    const edsPage = new EmptyDataStateLayoutPage(page, theme, bundle);

    await edsPage.goto();

    const fixed = await edsPage.geometry();

    await edsPage.goto({ height: 'auto' });

    const auto = await edsPage.geometry();

    expectUnderTheHeaders(auto);
    expectContentCentred(auto);
    // The root ends where the panel ends: nothing below the message, and nothing cut off.
    expect(Math.abs(auto.panel.bottom - auto.root.bottom)).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    // Shorter than the 400 px grid, and still taller than its own content.
    expect(auto.root.bottom - auto.root.top).toBeLessThan(fixed.root.bottom - fixed.root.top);
    expect(auto.panel.bottom - auto.panel.top).toBeGreaterThan(auto.content.bottom - auto.content.top);

    // Leaving `height` out lays the grid out exactly as `auto` does.
    await edsPage.goto({ height: 'undefined' });

    const undefinedHeight = await edsPage.geometry();

    (['left', 'top', 'right', 'bottom'] as const).forEach((edge) => {
      expect(undefinedHeight.panel[edge], `panel ${edge}`).toBeCloseTo(auto.panel[edge], 1);
      expect(undefinedHeight.root[edge], `root ${edge}`).toBeCloseTo(auto.root[edge], 1);
    });
  });

  test('with no columns the message covers the whole root, the header corner included', async({
    page, theme, bundle,
  }) => {
    const edsPage = new EmptyDataStateLayoutPage(page, theme, bundle);

    await edsPage.goto({ height: 'auto', noColumns: true });

    await expect(edsPage.title).toHaveText('No data available');

    const geometry = await edsPage.geometry();

    expect(geometry.headers).toBeNull();
    (['left', 'top', 'right', 'bottom'] as const).forEach((edge) => {
      expect(Math.abs(geometry.panel[edge] - geometry.root[edge]), `panel ${edge} vs the root`)
        .toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    });
    expect(geometry.disablesTopBorder).toBe(false);
    expectContentCentred(geometry);
  });

  test('filtering every value out from the keyboard shows the no-results message, and Reset filters clears it', async({
    page, theme, bundle,
  }) => {
    const edsPage = new EmptyDataStateLayoutPage(page, theme, bundle);
    const companyName = edsPage.columnHeader('Company name');
    const menu = edsPage.dropdownMenu;

    await edsPage.goto();

    // The demo's key presses: into the grid's corner header, then onto the first column's header.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect.poll(() => edsPage.selected()).toEqual([[-1, 0, -1, 0]]);
    await expect(companyName).toHaveClass(/\bcurrent\b/);

    await page.keyboard.press('Alt+Shift+ArrowDown');
    await expect(menu).toBeVisible();

    // The condition select, the search input, Select all, Clear.
    await page.keyboard.press('Tab');
    await expect(menu.locator('.htFiltersMenuCondition .htUISelect')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(menu.locator('.htUIMultipleSelectSearch input')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(menu.locator('.htUISelectAll a')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(menu.locator('.htUIClearAll a')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(menu.locator('.htUIButtonOK input')).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(menu).toBeHidden();
    await expect(companyName).toHaveClass(/\bhtFiltersActive\b/);
    await expect(companyName).toHaveClass(/\bcurrent\b/);
    expect(await edsPage.filterConditions()).toEqual([
      { column: 0, operation: 'conjunction', conditions: [{ name: 'by_value', args: [[]] }] },
    ]);
    await expect(edsPage.title).toHaveText('No results found');
    await expect(edsPage.description).toHaveText('It looks like your current filters are hiding all results.');

    const reset = edsPage.button('Reset filters');

    await expect(reset).toHaveClass(/\bht-button--secondary\b/);

    const filtered = await edsPage.geometry();

    expectUnderTheHeaders(filtered);
    expectContentCentred(filtered);

    await reset.click();
    await expect(edsPage.title).toHaveText('No data available');
    await expect(companyName).not.toHaveClass(/\bhtFiltersActive\b/);
    expect(await edsPage.filterConditions()).toEqual([]);
  });

  test('in an RTL grid the message is mirrored under the headers', async({ page, theme, bundle }) => {
    const edsPage = new EmptyDataStateLayoutPage(page, theme, bundle);

    await edsPage.goto({ dir: 'rtl' });

    await expect(edsPage.title).toHaveText('لا توجد بيانات متاحة');

    const geometry = await edsPage.geometry();

    expectUnderTheHeaders(geometry);
    // The columns start at the root's right edge, so the panel does too.
    expect(Math.abs(geometry.panel.right - geometry.root.right)).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    expect(geometry.panel.left).toBeGreaterThan(geometry.root.left);
    expect(Math.abs(geometry.panel.bottom - geometry.root.bottom)).toBeLessThanOrEqual(EDGE_TOLERANCE_PX);
    expectContentCentred(geometry);
  });
});
