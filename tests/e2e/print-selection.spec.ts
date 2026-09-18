import { test, expect } from '../fixtures/test';
import { PrintSelectionPage } from '../fixtures/pages/PrintSelectionPage';

/**
 * DEV-133: on print, browsers drop `background-color` (and `box-shadow`) but keep CSS `border`s, so
 * the selection's fill handle printed as an empty bordered square (the "pit") while the
 * background-only selection outline vanished. The `@media print` rule in `_selection.scss` hides the
 * transient selection UI so a printout shows a clean grid, while a user-configured custom border,
 * which renders through the same `.wtBorder` element without a selection class, must still print.
 */
test.describe('DEV-133 — selection UI on print', () => {
  test('fill handle and area border are visible on screen but hidden on print', async({ page, theme, bundle }) => {
    const grid = new PrintSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.selectRange(1, 1, 2, 2);

    // Positive control: the transient selection UI is visible under screen media.
    await grid.emulateScreen();
    await expect(grid.visibleFillHandle()).toHaveCount(1);
    await expect(grid.visibleAreaBorder().first()).toBeVisible();

    // Fix: it is hidden under print media, so no empty bordered square ("pit") is printed.
    await grid.emulatePrint();
    await expect(grid.visibleFillHandle()).toHaveCount(0);
    await expect(grid.visibleAreaBorder()).toHaveCount(0);
  });

  test('a selected cell prints the same border color as an unselected cell', async({ page, theme, bundle }) => {
    const grid = new PrintSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.selectRange(1, 1, 2, 2);

    // Precondition: on screen a selected cell's border is color-mixed, so it differs from an
    // unselected cell — without this the print assertion below could pass vacuously on a theme
    // where the two happen to resolve equal.
    await grid.emulateScreen();
    expect(await grid.areaCellBorderTopColor()).not.toBe(await grid.plainCellBorderTopColor());

    // The selected-cell border residue is reset on print, so it matches its unselected neighbours
    // instead of printing a different (color-mixed) border.
    await grid.emulatePrint();
    expect(await grid.areaCellBorderTopColor()).toBe(await grid.plainCellBorderTopColor());
  });

  test('a custom border stays visible on print', async({ page, theme, bundle }) => {
    const grid = new PrintSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.selectRange(1, 1, 2, 2);

    // The print rule is scoped to the selection classes only. A user-configured custom border must
    // survive on both media, or hiding the selection would break configured decoration.
    await grid.emulateScreen();
    expect(await grid.visibleCustomBorderEdgeCount()).toBeGreaterThan(0);

    await grid.emulatePrint();
    expect(await grid.visibleCustomBorderEdgeCount()).toBeGreaterThan(0);
  });
});
