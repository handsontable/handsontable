import { test, expect } from '../fixtures/test';
import { LayoutSlotFocusPage } from '../fixtures/pages/LayoutSlotFocusPage';

/**
 * The fixture pages 4 rows two at a time, so page 2 leaves row 0 unrendered while its visual
 * index stays valid. That is the state an open editor has to survive correctly.
 */
test.describe('editor with a cell that stops being rendered', () => {
  let grid: LayoutSlotFocusPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new LayoutSlotFocusPage(page, theme, bundle);
    await grid.goto();
  });

  test('finishes the edit when a programmatic page change unrenders the edited cell', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    // No pointer interaction, so the document mousedown handler never runs. Before the fix the
    // editor stayed open, pinned over whatever row took that position, and committed only much
    // later - to a row the user could no longer see.
    await grid.setPageProgrammatically(2);

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect.poll(() => grid.dataAt(0, 0)).toBe('EDITED');
  });

  test('finishes the edit when a pagination button click unrenders the edited cell', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    await grid.nextPageButton.click();

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect.poll(() => grid.dataAt(0, 0)).toBe('EDITED');
  });

});

/**
 * Virtualization is not hiding. These cases keep the fix from being written against DOM presence.
 */
test.describe('editor with a cell that is only scrolled out of view', () => {
  let scrolled: LayoutSlotFocusPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    scrolled = new LayoutSlotFocusPage(page, theme, bundle, true, 'scroll');
    await scrolled.goto();
  });

  test('leaves the edit pending when the edited cell is only scrolled out of view', async() => {
    await scrolled.openEditorAndType(0, 0, 'EDITED');

    // Virtualization is NOT hiding. The row stays renderable, so the edit has to stay pending.
    // Testing `getEditedCell() === null` instead of `isHidden()` would commit here, silently, on
    // every scroll away from an open editor.
    //
    // Assert on `state`, not `isOpened()`: scrolling runs `refreshDimensions()` -> `close()`,
    // which clears `_opened` but leaves the state at `STATE_EDITING`. That is the pre-existing
    // contract this test protects.
    await scrolled.scrollToRow(90);
    await expect(scrolled.cell(0, 0)).toBeHidden();

    await scrolled.scrollToRow(0);
    await expect(scrolled.cell(0, 0)).toBeVisible();

    // Waiting for row 0 to come back is what makes this deterministic: the round trip guarantees
    // the render cycles a wrongly-scheduled commit would have ridden on, so an empty recorder
    // rules the commit out instead of merely sampling before it.
    expect(await scrolled.committedChangeCount()).toBe(0);
    expect(await scrolled.dataAt(0, 0)).toBe('A1');
    expect(await scrolled.editorState()).toBe('STATE_EDITING');
    expect(await scrolled.editorText()).toBe('EDITED');
  });

});

test.describe('editor with a re-render that changes nothing', () => {
  let grid: LayoutSlotFocusPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new LayoutSlotFocusPage(page, theme, bundle);
    await grid.goto();
  });

  test('leaves the editor open when a re-render keeps the edited cell rendered', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    // The control case for the two above: a re-render that changes nothing about which rows are
    // renderable must not tear the editor down. `render()` rather than `setPage(1)`, because
    // paging to the page already shown can no-op and would make this assertion vacuous.
    await grid.rerender();

    await expect.poll(() => grid.isEditorOpen()).toBe(true);
    await expect.poll(() => grid.editorValue()).toBe('EDITED');
    await expect.poll(() => grid.dataAt(0, 0)).toBe('A1');
  });
});

/**
 * Sorting shifts the visual-to-physical mapping. `IndexMapper.isHidden()` takes a PHYSICAL index,
 * so a check fed the raw visual index reads another row's hidden flag. Without these two cases
 * every other test in this file passes over that bug, because visual equals physical whenever no
 * sorting, move, or trimming map is active.
 */
test.describe('editor with a hiding map and a sorted index mapping', () => {
  let grid: LayoutSlotFocusPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new LayoutSlotFocusPage(page, theme, bundle);
    await grid.goto();
    await grid.sortFirstColumnDescending();

    // Sorting descending puts the last record first, so the two are genuinely different now.
    await expect.poll(() => grid.toPhysicalRow(0)).toBe(3);
  });

  test('commits to the record the user was editing, not the one at the same visual index', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    await grid.setPageProgrammatically(2);

    await expect.poll(() => grid.isEditorOpen()).toBe(false);

    // Assert the whole column, not just the edited record. Committing through a stale visual index
    // is not the only way this can go wrong: the trimming defect in the same area appends spurious
    // rows, which a pair of single-cell probes would pass straight over.
    await expect.poll(() => grid.sourceColumn(0)).toEqual(['A1', 'A2', 'A3', 'EDITED']);
  });

  test('leaves a visible cell alone when a re-render happens while other rows are paginated away', async() => {
    await grid.openEditorAndType(0, 0, 'EDITED');

    await grid.rerender();
    await expect(grid.cell(0, 0)).toBeVisible();

    expect(await grid.committedChangeCount()).toBe(0);
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.editorText()).toBe('EDITED');
  });
});

/**
 * Clicking layout-slot UI is an outside click, and stays one. These cases pin that down so the
 * editor fix above cannot quietly change what `outsideClickDeselects` governs.
 */
for (const outsideClickDeselects of [true, false]) {
  test.describe(`layout-slot click (outsideClickDeselects: ${outsideClickDeselects})`, () => {
    let grid: LayoutSlotFocusPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new LayoutSlotFocusPage(page, theme, bundle, outsideClickDeselects);
      await grid.goto();
    });

    test(`${outsideClickDeselects ? 'clears' : 'keeps'} the selection when the page-size control is clicked`, async() => {
      await grid.cell(0, 0).click();

      await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);

      await grid.pageSizeSelect.click();

      if (outsideClickDeselects) {
        await expect.poll(() => grid.selected()).toBeUndefined();
      } else {
        await expect.poll(() => grid.selected()).toEqual([[0, 0, 0, 0]]);
      }
    });

    test('keeps the grid listening to the keyboard', async() => {
      await grid.cell(0, 0).click();

      await grid.nextPageButton.click();

      await expect.poll(() => grid.isListening()).toBe(true);
    });
  });
}
