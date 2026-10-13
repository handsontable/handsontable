import { test, expect } from '../fixtures/test';
import { IconElementsPage } from '../fixtures/pages/IconElementsPage';

/**
 * 18.1 parity for the sort indicator after icons became real `<i class="ht-icon">` elements
 * (DEV-3003, QA review of #13639).
 *
 * In 18.1 the arrow was `.columnSorting.sortAction.ascending::before` (and the descending twin),
 * and `sortAction` is only added when `headerAction` is `true`. So a `headerAction: false`
 * column showed no arrow, even while sorted, and its AutoColumnSize ghost header kept the `*`
 * stand-in at the glyph's own width. A tap on the arrow sorted, because the arrow was part of
 * the label.
 */
test.describe('Icon elements: sort indicator 18.1 parity', () => {
  test.describe('`headerAction: false`', () => {
    test('a column sorted through the API shows no indicator, keeps `aria-sort`, and a clickable column still shows one', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();
      await grid.updateSettings({
        columns: [
          { type: 'checkbox' },
          { columnSorting: { headerAction: false } },
          {},
          {},
        ],
      });
      await grid.sortThroughApi('columnSorting', { column: 1, sortOrder: 'asc' });

      const notClickable = grid.sortHeader(1);

      await expect(notClickable).toHaveAttribute('aria-sort', 'ascending');
      await expect(notClickable.locator('.ht-sort-indicator')).toHaveCount(0);

      const clickable = grid.sortHeader(2);

      await clickable.locator('.colHeader').click();

      await expect(clickable).toHaveAttribute('aria-sort', 'ascending');
      await expect(clickable.locator('.ht-sort-indicator')).toHaveCount(1);
      await expect(grid.icon('arrow-narrow-up', clickable)).toHaveCount(1);
    });

    test('with multiColumnSorting, a sorted `headerAction: false` column shows no indicator; the other sorted column shows one', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();
      await grid.updateSettings({
        columnSorting: false,
        multiColumnSorting: true,
        columns: [
          { type: 'checkbox' },
          { multiColumnSorting: { headerAction: false } },
          {},
          {},
        ],
      });
      await grid.sortThroughApi('multiColumnSorting', [
        { column: 1, sortOrder: 'asc' },
        { column: 2, sortOrder: 'desc' },
      ]);

      const notClickable = grid.sortHeader(1);
      const clickable = grid.sortHeader(2);

      await expect(notClickable).toHaveAttribute('aria-sort', 'ascending');
      await expect(clickable).toHaveAttribute('aria-sort', 'descending');
      await expect(clickable.locator('.ht-sort-indicator')).toHaveCount(1);
      await expect(grid.icon('arrow-narrow-down', clickable)).toHaveCount(1);
      await expect(notClickable.locator('.ht-sort-indicator')).toHaveCount(0);
    });

    // The ghost-table `*` stand-in got `width: var(--ht-icon-size)` in 18.1 only through the
    // glyph rule, which was keyed on `.sortAction`. A label without `sortAction` measured the
    // `*` at its own width; a clickable label measured an icon-size box.
    test('the ghost-table `*` stand-in keeps the glyph width on a label without `sortAction`', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();

      const probe = await grid.ghostSortReserve([
        'colHeader columnSorting',
        'colHeader columnSorting sortAction',
      ]);
      const [notClickable, clickable] = probe.labels;

      expect(probe.iconSize).toBeGreaterThan(0);
      expect(probe.starWidth).toBeGreaterThan(0);
      // The `*` glyph is narrower than the icon in every theme, so the two expectations below
      // cannot both hold by accident.
      expect(probe.starWidth).toBeLessThan(probe.iconSize);

      expect(notClickable.content).toBe('"*"');
      expect(notClickable.width).toBeCloseTo(probe.starWidth, 0);
      expect(notClickable.paddingInlineEnd).toBe(probe.iconSize + 2);

      expect(clickable.content).toBe('"*"');
      expect(clickable.width).toBe(probe.iconSize);
      expect(clickable.paddingInlineEnd).toBe(probe.iconSize + 2);
    });

    test('AutoColumnSize measures a `headerAction: false` header narrower than the same clickable header, by the icon box minus the glyph', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();
      // Long identical headers over short data, so the header decides both widths, and no menu
      // button, so the only difference between the two columns is `sortAction`.
      await grid.updateSettings({
        data: [['a', 'a'], ['b', 'b']],
        colHeaders: ['Quarterly revenue total', 'Quarterly revenue total'],
        columns: [
          { columnSorting: { headerAction: false } },
          {},
        ],
        dropdownMenu: false,
        filters: false,
        pagination: false,
      });

      const [notClickableWidth, clickableWidth] = await grid.autoColumnWidths([0, 1]);
      const probe = await grid.ghostSortReserve([]);
      const expectedDifference = probe.iconSize - probe.starWidth;

      expect(expectedDifference).toBeGreaterThan(0);
      expect(clickableWidth! - notClickableWidth!).toBeGreaterThan(0);
      // AutoColumnSize rounds each width, so allow one pixel either way.
      expect(Math.abs((clickableWidth! - notClickableWidth!) - expectedDifference)).toBeLessThanOrEqual(1);
    });
  });

  test.describe('touch', () => {
    test.use({ hasTouch: true });

    // Blink's touch adjustment retargets a tap to the nearest node it considers tappable. Both
    // sorting and the column menu listen on ancestors, so the `<i>` counts as tappable only
    // through a hover-dependent style; without one the tap snaps to the adjacent dropdown-menu
    // button and opens the menu instead of sorting.
    test('a tap on the sort indicator toggles the sort order and does not open the column menu', async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsPage(page, theme, bundle);

      await grid.goto();
      await grid.updateSettings({ colWidths: 140 });
      await grid.sortThroughApi('columnSorting', { column: 1, sortOrder: 'asc' });

      const header = grid.sortHeader(1);

      await expect(grid.icon('arrow-narrow-up', header)).toHaveCount(1);
      // The menu button must be next to the indicator, or the test proves nothing.
      await expect(header.locator('.changeType')).toBeVisible();

      await grid.tapSortIndicator(1);

      await expect.poll(() => grid.sortOrder('columnSorting', 1)).toBe('desc');
      await expect(grid.icon('arrow-narrow-down', header)).toHaveCount(1);
      await expect(page.locator('.htDropdownMenu')).toBeHidden();
    });
  });
});
