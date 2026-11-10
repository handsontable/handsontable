import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { CollapsibleDropdownHitAreasPage } from '../fixtures/pages/CollapsibleDropdownHitAreasPage';

/**
 * A header cell that holds a collapsible group's indicator and the dropdown button gave each
 * button a hit area larger than its icon, and the two hit areas overlapped. The dropdown button is
 * stacked above the indicator, so it took the whole strip the two share and the indicator lost part of
 * its target. The strip must be shared evenly, in both directions and in every theme.
 */
// The grid's direction decides which edge faces the other button, never the page's: a left to right grid
// inside a right to left page must keep the left to right layout.
const SETUPS = [
  { direction: 'ltr', pageDirection: 'ltr', title: 'ltr grid' },
  { direction: 'rtl', pageDirection: 'ltr', title: 'rtl grid' },
  { direction: 'ltr', pageDirection: 'rtl', title: 'ltr grid in an rtl page' },
] as const;

for (const { direction, pageDirection, title } of SETUPS) {
  test.describe(`collapsible indicator and dropdown button in one header cell (${title})`, {
    tag: [THEMES_TAG, CROSS_BROWSER_TAG],
  }, () => {
    let grid: CollapsibleDropdownHitAreasPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new CollapsibleDropdownHitAreasPage(page, theme, bundle, { direction, pageDirection });
      await grid.goto();
    });

    test('the two buttons share the gap between their icons evenly', async () => {
      // The press passes from one button to the other halfway between the two icons. Before the fix the
      // dropdown button kept the whole strip the hit areas share, so the handover sat 2px (main, horizon)
      // or 4px (classic) past the middle, inside the indicator's side of the gap. The sweep steps 0.25px.
      expect(Math.abs(await grid.hitBoundaryOffsetFromGapMiddle())).toBeLessThanOrEqual(0.5);
    });

    test('pressing the indicator still collapses and expands the group', async () => {
      await grid.expectExpanded();

      await grid.indicator().click();
      await grid.expectCollapsed();

      await grid.indicator().click();
      await grid.expectExpanded();
    });

    test('pressing the dropdown button still opens the menu', async () => {
      await grid.menuButton().click();

      await expect(grid.openMenu()).toBeVisible();
    });
  });
}

// A sorted column draws a sort indicator, which widens the gap between the two buttons: their hit areas
// no longer touch, so nothing may be taken off either of them.
for (const direction of ['ltr', 'rtl'] as const) {
  test.describe(`collapsible indicator beside a sort indicator (${direction} grid)`, {
    tag: [THEMES_TAG, CROSS_BROWSER_TAG],
  }, () => {
    let grid: CollapsibleDropdownHitAreasPage;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new CollapsibleDropdownHitAreasPage(page, theme, bundle, { direction, sorted: true });
      await grid.goto();
    });

    test('the indicator keeps its whole hit area', async () => {
      expect(await grid.hitAtIndicatorFacingEdge()).toBe('indicator');
    });
  });
}
