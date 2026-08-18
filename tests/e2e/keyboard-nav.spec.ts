import { test } from '../fixtures/test';
import { GridPage } from '../fixtures/pages/GridPage';

test.describe('keyboard navigation', () => {
  // A library-level, granular interaction: Handsontable *implements* keyboard
  // navigation, so we drive real keys and assert the observable outcome (where the
  // edit lands), hooking in by the stable data-testids the fixture stamps.
  test('arrow keys move the selection; an edit commits to the landed cell', async ({ page, theme, bundle }) => {
    const grid = new GridPage(page, theme, bundle);

    await grid.goto();

    // Intended behavior: from A1 (0,0), Down then Right lands on B2 (1,1).
    await grid.selectCell(0, 0);
    await grid.pressKeys('ArrowDown', 'ArrowRight');
    await grid.typeIntoSelected('X');

    // The edit landed on the navigated cell, and the origin is untouched.
    await grid.expectCell(1, 1, 'X');
    await grid.expectCell(0, 0, 'A1');
  });
});
