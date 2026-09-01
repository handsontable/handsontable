import { test, expect } from '../fixtures/test';
import { CellDropdownArrowPage, type CellType } from '../fixtures/pages/CellDropdownArrowPage';

// Every cell type that renders a dropdown indicator. The first three reach the same listener:
// `dropdownRenderer` and `handsontableRenderer` both delegate to `autocompleteRenderer`.
// `multiselect` reaches its own element and its own listener (#13316) and is included so the
// affordance every list cell type shares is asserted in one place.
const CELL_TYPES: CellType[] = ['autocomplete', 'dropdown', 'handsontable', 'multiselect'];

/**
 * DEV-2677. `autocompleteRenderer` registers a `mousedown` listener that opens the editor when the
 * press lands on a cell's dropdown arrow. It tested only the target's class and never the mouse
 * button, so a right-click on the arrow opened the editor - on a grid with a context menu, that
 * handed the user the editor and the menu at once. Walkontable restricts its own
 * double-click-to-open path to the left button; this path now does the same.
 *
 * Both halves are asserted every time. A case that only checked the right button would pass on a
 * "fix" that deleted the affordance, and opening the list from its arrow is behavior users have
 * relied on for a decade.
 *
 * The negative case anchors on the selection rather than polling for the editor to stay closed:
 * `expect.poll` retries until its condition holds, so it would report success on an editor that
 * opened one tick later. A right-button press selects the cell, so waiting for the selection to
 * land gives a deterministic point at which a single, non-retrying assertion is meaningful.
 */
CELL_TYPES.forEach((cellType) => {
  test.describe(`${cellType} cell dropdown arrow`, () => {
    let grid: CellDropdownArrowPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new CellDropdownArrowPage(page, theme, bundle, cellType);
      await grid.goto();
    });

    // Cell (1, 1) rather than (0, 0), and the editor's own coordinates rather than just "an editor
    // is open". To be clear about what that does and does not cover: the renderer builds its arrow
    // listener once and closes over the FIRST rendered cell's coordinates, and no assertion here
    // can catch that today - the pair reaches only `isCell()`, and `prepareEditor()` takes the
    // edited cell from the live selection, so the editor's coordinates and `getSelected()` are the
    // same state. Clicking a cell that is not the first one, and reading the coordinates the editor
    // was actually prepared with, is what would surface it if a later change starts honoring the
    // coordinates the listener passes. It does catch an editor reused without a re-`prepare()`.
    test('opens the editor when the arrow is pressed with the left button', async() => {
      await grid.arrow(1, 1).click();

      await expect.poll(() => grid.isEditorOpen()).toBe(true);
      expect(await grid.editorCoords()).toEqual([1, 1]);
    });

    test('leaves the editor closed when the arrow is pressed with the right button', async() => {
      await grid.arrow(0, 0).click({ button: 'right' });

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

      expect(await grid.isEditorOpen()).toBe(false);
    });

    // The indicator is the click target, so pressing the cell anywhere else must still only select.
    // Without this, a change that made the whole cell open the editor would pass every case above
    // while breaking ordinary selection and range dragging.
    test('leaves the editor closed when the cell body is clicked', async() => {
      await grid.clickCellBody(1, 1);

      await expect.poll(() => grid.selected()).toEqual([[1, 1, 1, 1]]);

      expect(await grid.isEditorOpen()).toBe(false);
    });

    // Row 2 is empty in the fixture. An empty cell is where the indicator matters most: it is the
    // only thing marking the cell as a list cell, and `multiselect` used to render it blank.
    test('renders the indicator in an empty cell', async() => {
      await expect(grid.arrow(2, 0)).toBeVisible();
    });
  });
});

/**
 * `multiselect` only, and deliberately so. Its listener resolves the cell at click time, which is
 * what makes this case reachable: the first version called `hot.getCell(row, col)` and bailed when
 * it answered `null`, and without the `topmost` flag that reads the MASTER table — so a frozen cell
 * scrolled past the master's rendered range returned `null` while its inline-start overlay clone,
 * the one on screen under the pointer, rendered fine. The visible indicator did nothing.
 *
 * The other three cell types reach `autocompleteRenderer`, which passes the `TD` its render closure
 * captured and never calls `getCell`, so they cannot fail this way. They are left out rather than
 * asserted as passing, because that same closure holds the FIRST rendered cell's coordinates — a
 * separate, pre-existing quirk this PR does not touch, and exercising it here would put a red leg on
 * an unrelated defect.
 */
test.describe('multiselect indicator on a frozen column', () => {
  let grid: CellDropdownArrowPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CellDropdownArrowPage(page, theme, bundle, 'multiselect');
    await grid.goto({ frozen: true });
  });

  test('opens the editor when the frozen clone is the only rendered copy', async() => {
    await grid.scrollPastFrozenColumn(7);

    await expect(grid.frozenArrow()).toBeVisible();

    await grid.frozenArrow().click();

    await expect.poll(() => grid.isEditorOpen()).toBe(true);
    // The cell, not merely "some editor": the coordinates come from the indicator's own dataset,
    // so a wrong row or column here would mean the click resolved against the wrong clone.
    expect(await grid.editorCoords()).toEqual([0, 0]);
  });
});
