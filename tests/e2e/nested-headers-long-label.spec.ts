import { test, expect } from '../fixtures/test';
import { NestedHeadersLongLabelPage, type LabelGeometry } from '../fixtures/pages/NestedHeadersLongLabelPage';

/**
 * A collapsible group header whose label is longer than the group, on the visual suite's
 * `/nested-headers-demo?longNestedHeaders=true` grid, on every theme and bundle: Shift+Tab reaches the
 * group from the first cell along the demo spec's path and Enter collapses it, and in both states the
 * label stops short of the collapse icon, cut with an ellipsis once the group is one column wide. The
 * icon's size differs per theme (`--ht-icon-size`), so the geometry is measured, not assumed. The
 * collapsed header's look stays in `visual-tests/tests/js-only/nested-headers/collapse-column.spec.ts`.
 */

/**
 * Asserts that the label ends before the icon and both sit inside the header.
 *
 * @param {LabelGeometry} geometry The label's geometry.
 */
function expectLabelClearOfTheIcon(geometry: LabelGeometry) {
  expect(geometry.labelRight, 'label right vs the icon left').toBeLessThanOrEqual(geometry.iconLeft);
  expect(geometry.labelLeft).toBeGreaterThanOrEqual(geometry.headerLeft);
  expect(geometry.iconRight).toBeLessThanOrEqual(geometry.headerRight);
}

test.describe('nested headers with a long collapsible label', () => {
  test('the expanded group shows its whole label, clear of the collapse icon', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersLongLabelPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.longGroup).toHaveAttribute('colspan', '4');
    await expect(grid.longGroup.locator('.collapsibleIndicator')).toHaveClass(/\bexpanded\b/);

    const geometry = await grid.labelGeometry();

    expectLabelClearOfTheIcon(geometry);
    expect(geometry.labelScrollWidth).toBeLessThanOrEqual(geometry.labelClientWidth);
  });

  test('Shift+Tab reaches the group from the first cell, Enter collapses it, and the label is cut before the icon', async({
    page, theme, bundle,
  }) => {
    const grid = new NestedHeadersLongLabelPage(page, theme, bundle);

    await grid.goto();

    await grid.firstCell().click();
    await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

    // Back through the row header, the column headers right to left, the corner, and the group level
    // right to left: the long group is the seventeenth stop.
    for (let press = 0; press < 17; press++) {
      await page.keyboard.press('Shift+Tab');
    }

    await expect.poll(() => grid.selected()).toEqual([[-2, 3, -2, 3]]);
    await expect(grid.longGroup).toHaveClass(/\bcurrent\b/);

    await page.keyboard.press('Enter');

    await expect(grid.longGroup.locator('.collapsibleIndicator')).toHaveClass(/\bcollapsed\b/);
    await expect(grid.longGroup).not.toHaveAttribute('colspan', /./);
    expect(await grid.hidden([0, 1, 2, 3])).toEqual([false, true, true, true]);
    await expect(grid.longGroup).toHaveClass(/\bcurrent\b/);

    const geometry = await grid.labelGeometry();

    expectLabelClearOfTheIcon(geometry);
    // One column is too narrow for the label: it is cut, on one line, with an ellipsis.
    expect(geometry.labelScrollWidth).toBeGreaterThan(geometry.labelClientWidth);
    expect(geometry.textOverflow).toBe('ellipsis');
    expect(geometry.whiteSpace).toBe('nowrap');
    expect(geometry.overflowX).toBe('hidden');
  });
});
