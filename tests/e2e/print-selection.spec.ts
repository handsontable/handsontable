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

    // Positive control: the fill handle, the area outline, and the current-cell outline are all
    // visible under screen media.
    await grid.emulateScreen();
    await expect(grid.visibleFillHandle()).toHaveCount(1);
    await expect(grid.visibleAreaBorder().first()).toBeVisible();
    await expect(grid.visibleCurrentBorder().first()).toBeVisible();

    // Fix: all of them are hidden under print media, so no empty bordered square ("pit") is printed.
    await grid.emulatePrint();
    await expect(grid.visibleFillHandle()).toHaveCount(0);
    await expect(grid.visibleAreaBorder()).toHaveCount(0);
    await expect(grid.visibleCurrentBorder()).toHaveCount(0);
  });

  test('the print rule does not hide a custom border', async({ page, theme, bundle }) => {
    const grid = new PrintSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.selectRange(1, 1, 2, 2);

    // The print rule's selectors must not match a custom border, or hiding the selection would break
    // configured decoration. This asserts the rule leaves the custom border's element displayed under
    // print media — not real-print visibility: `emulateMedia({ media: 'print' })` activates @media
    // print but does not simulate the browser's own background drop (which this background-based
    // custom border would take on a real printout regardless, exactly like the grid's cell borders).
    // The fixture draws exactly four magenta edges; pin the count so a future print rule that hides
    // some (but not all) of them is caught, not just a total wipe.
    await grid.emulateScreen();
    expect(await grid.visibleCustomBorderEdgeCount()).toBe(4);

    await grid.emulatePrint();
    expect(await grid.visibleCustomBorderEdgeCount()).toBe(4);
  });
});
