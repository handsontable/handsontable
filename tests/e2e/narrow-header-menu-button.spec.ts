import { test, expect } from '../fixtures/test';
import { NarrowHeaderMenuButtonPage } from '../fixtures/pages/NarrowHeaderMenuButtonPage';

/**
 * DEV-158. A column dragged to its narrowest left the header's menu button hanging over the
 * neighbouring header. The narrowest width used to be a flat 20px, and the label and the sort
 * indicator kept their room, so the button - the only way into the menu - was pushed out of its own cell
 * while the neighbour painted over it.
 *
 * The narrowest width is now the icon size plus the cell padding on both sides, and the header gives
 * things up in a fixed order as it narrows: the label text, then the sort indicator, and the menu button
 * last. Both are layout facts (a clamp against the stored width, percentages against the header's own
 * width), so none of this is checkable in jsdom, where every size is zero.
 *
 * The widths come from a real drag on the resize handle, so the stored width is produced the way a
 * user produces it. The floor is pinned per theme (24, 32 and 40px), and so are the widths at which the
 * sort indicator is hidden, so a wrong formula in the product cannot pass by being repeated here.
 *
 * The alignment grids use `headerClassName`, which is the option that puts the class on the header's
 * inner element. `className` styles body cells only, so a grid built with it would run the default
 * header layout and prove nothing about the opposite-side rules; the spec asserts the class landed.
 */
test.describe('Narrow header with a menu button', () => {
  let grid: NarrowHeaderMenuButtonPage;

  // Column 1 has the longest label, so it is the one that fights the menu button hardest.
  const COLUMN = 1;

  // `name` is the grid's key in the fixture's `grids` object, `alignment` the class its headers carry.
  const GRIDS = [
    { testId: 'menu', name: 'menu', label: 'a plain', rtl: false },
    { testId: 'menu-sort', name: 'menuSort', label: 'a sortable', rtl: false },
    {
      testId: 'menu-sort-right',
      name: 'menuSortRight',
      label: 'a right-aligned sortable',
      rtl: false,
      alignment: 'htRight',
    },
    { testId: 'menu-sort-rtl', name: 'menuSortRtl', label: 'a right-to-left sortable', rtl: true },
    {
      testId: 'menu-sort-rtl-left',
      name: 'menuSortRtlLeft',
      label: 'a right-to-left, left-aligned sortable',
      rtl: true,
      alignment: 'htLeft',
    },
  ] as const;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new NarrowHeaderMenuButtonPage(page, theme, bundle);
    await grid.goto();
  });

  for (const { testId, name, label, rtl, ...rest } of GRIDS) {
    // A right-to-left column narrows when its handle moves toward the inline end.
    const toNarrowest = rtl ? 400 : -400;
    const alignment = 'alignment' in rest ? rest.alignment : undefined;

    if (alignment) {
      test(`puts the alignment class on the headers of ${label} column`, async () => {
        // The precondition for every alignment case below: the opposite-side rules key on this class.
        expect(await grid.headerClasses(testId, COLUMN)).toContain(alignment);
      });
    }

    test(`stops ${label} column at the width that fits its menu button`, async () => {
      const minimum = grid.minimumWidth();

      await grid.dragColumnHandle(testId, COLUMN, toNarrowest);

      // The drag overshoots by hundreds of pixels, so the width is the floor and nothing else.
      expect((await grid.geometry(testId, COLUMN)).width).toBe(minimum);
    });

    test(`keeps the menu button of ${label} column inside its own header at the narrowest width`, async () => {
      await grid.dragColumnHandle(testId, COLUMN, toNarrowest);

      const { width, icon } = await grid.geometry(testId, COLUMN);

      // The icon, not its larger hit area: the hit area overhangs by design, the icon must not.
      // A pixel of slack for the border that the header's box includes.
      expect(icon[0]).toBeGreaterThanOrEqual(-1);
      expect(icon[1]).toBeLessThanOrEqual(width + 1);
    });

    if (name !== 'menu') {
      test(`keeps the menu button of a sorted ${label} column inside its header, and hides the indicator`, async () => {
        await grid.sortColumn(name, COLUMN);
        // The sorted state adds `has-sort-indicator`, which is what reserves room for the indicator.
        expect(await grid.headerClasses(testId, COLUMN)).toContain('has-sort-indicator');

        await grid.dragColumnHandle(testId, COLUMN, toNarrowest);

        const { width, icon, indicator } = await grid.geometry(testId, COLUMN);

        expect(icon[0]).toBeGreaterThanOrEqual(-1);
        expect(icon[1]).toBeLessThanOrEqual(width + 1);
        // The indicator gives way before the menu button does.
        expect(indicator).toBe(0);
      });

      test(`keeps the sort indicator of ${label} column while it is wide enough for it`, async () => {
        // The control for the test above: the indicator is hidden by the narrow-header rule, not always.
        await grid.sortColumn(name, COLUMN);
        await grid.dragColumnHandle(testId, COLUMN, rtl ? -120 : 120);

        const { width, icon, indicator } = await grid.geometry(testId, COLUMN);

        expect(width).toBeGreaterThan(grid.minimumWidth());
        expect(indicator).toBeGreaterThan(0);
        expect(icon[1]).toBeLessThanOrEqual(width + 1);
      });
    }
  }

  test('collapses the label before it hides the sort indicator', async () => {
    // The middle of the narrowing: just above the width where the indicator is hidden, the label has
    // already given up its room and the indicator is still drawn. If the two thresholds were swapped,
    // the narrowest and the widest case would both still pass.
    await grid.sortColumn('menuSort', COLUMN);
    await grid.dragColumnTo('menu-sort', COLUMN, grid.indicatorMinimumWidth() + 2);

    const { width, icon, indicator, label } = await grid.geometry('menu-sort', COLUMN);

    expect(width).toBe(grid.indicatorMinimumWidth() + 2);
    expect(indicator).toBeGreaterThan(0);
    // A pixel or two of the label can remain: it is what is left of the column after the slot.
    expect(label).toBeLessThanOrEqual(2);
    expect(icon[1]).toBeLessThanOrEqual(width + 1);
  });

  test('hides the sort indicator just below that width, and keeps the menu button inside', async () => {
    await grid.sortColumn('menuSort', COLUMN);
    await grid.dragColumnTo('menu-sort', COLUMN, grid.indicatorMinimumWidth() - 2);

    const { width, icon, indicator } = await grid.geometry('menu-sort', COLUMN);

    expect(width).toBe(grid.indicatorMinimumWidth() - 2);
    expect(indicator).toBe(0);
    expect(icon[0]).toBeGreaterThanOrEqual(-1);
    expect(icon[1]).toBeLessThanOrEqual(width + 1);
  });

  test('leaves what autoColumnSize measures unchanged for a sorted column', async () => {
    // The ghost table that `autoColumnSize` measures in has no width yet, so the narrow-header rules must
    // not reach it. Sorting changes nothing in a left-to-right grid. In a right-to-left grid with
    // right-aligned headers the ghost table counts the indicator's slot as well, 18px (14px in Classic) as
    // it always has; this pins it, so a rule that reached the ghost table would show up as a different width.
    const unsortedLtr = await grid.autoWidth('autosizeLtr', COLUMN);
    const unsortedRtl = await grid.autoWidth('autosizeRtlRight', COLUMN);

    await grid.sortColumn('autosizeLtr', COLUMN);
    await grid.sortColumn('autosizeRtlRight', COLUMN);

    expect(await grid.autoWidth('autosizeLtr', COLUMN)).toBe(unsortedLtr);
    expect(await grid.autoWidth('autosizeRtlRight', COLUMN)).toBe(unsortedRtl + grid.indicatorSlotWidth());
  });

  test('keeps the old 20px floor for a grid whose headers render no menu button', async () => {
    // There is no button to protect, so nothing changes for this grid.
    await grid.dragColumnHandle('no-menu', COLUMN, -400);

    expect(await grid.columnWidth('no-menu', COLUMN)).toBe(20);
  });

  test('resolves a theme token declared in rem, so the menu button still fits', async () => {
    // 1.25rem + 2 * 0.75rem at the default 16px root font size. The tokens read as the bare numbers 2
    // and 1, which would give a 20px floor and bring the overflow back for exactly these themes.
    const REM_MINIMUM = 44;

    await grid.sortColumn('menuSortRem', COLUMN);
    await grid.dragColumnHandle('menu-sort-rem', COLUMN, -400);

    const { width, icon, indicator } = await grid.geometry('menu-sort-rem', COLUMN);

    expect(width).toBe(REM_MINIMUM);
    expect(icon[0]).toBeGreaterThanOrEqual(-1);
    expect(icon[1]).toBeLessThanOrEqual(width + 1);
    expect(indicator).toBe(0);
  });
});
