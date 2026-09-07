import { test, expect } from '../fixtures/test';
import { EditorPreventCloseElementPage } from '../fixtures/pages/EditorPreventCloseElementPage';

/**
 * `preventCloseElement` is the documented contract for an editor that renders part of itself
 * outside its own container - a dropdown, a popover, a third-party picker appended to the document
 * body. The grid must treat that element and its subtree as a part of the editor.
 *
 * The regression these cases pin (DEV-2785): the grid grew a SECOND outside-click path, a
 * focus-driven verdict on the document's `mouseup`. `preventCloseElement`'s own mechanism is a
 * `mousedown` listener that stops propagation, which reaches the first path only - so a picker that
 * takes the browser focus (flatpickr moves it into its calendar) made the next `mouseup` read as a
 * focus loss to the outside. That deselected the cell, `afterDeselect` closed the editor, and the
 * editor's PRE-EDIT value was committed before the picker had reported the picked one.
 *
 * Every case asserts, as its own precondition, that the browser focus really moved into the panel.
 * A picker that keeps the focus in the editor's input never reaches this path at all, which is why
 * the `color-picker` recipe escaped the defect while the `flatpickr` one did not - so without that
 * precondition a case here would go green on unfixed code and pin nothing.
 */
test.describe('An editor with a preventCloseElement outside the grid', () => {
  test('survives the browser focus moving into that element', async({ page, theme, bundle }) => {
    const grid = new EditorPreventCloseElementPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditor(0, 1);

    expect(await grid.clickPanelFocusTarget()).toBe(true);

    expect(await grid.isEditorOpen()).toBe(true);
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.selected()).toEqual([[0, 1, 0, 1]]);

    // Reading the change log rather than the data is what rules out the defect's actual shape: the
    // forced commit wrote the value the editor was opened with, so the cell looks untouched.
    expect(await grid.committedChanges()).toEqual([]);
  });

  /**
   * The end-to-end symptom from the report. The panel reports a value and then ends the edit from
   * its own callback, which is exactly how the `flatpickr` recipe commits (`onClose` calls
   * `finishEditing()`). Before the fix the editor had already been finished with its pre-edit
   * value by then, so the picked value never reached the cell.
   */
  test('commits the value the panel reported', async({ page, theme, bundle }) => {
    const grid = new EditorPreventCloseElementPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditor(0, 1);

    expect(await grid.clickPanelFocusTarget()).toBe(true);

    await grid.writeValueFromPanel();
    await grid.commitFromPanel();

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    expect(await grid.dataAtCell(0, 1)).toBe('FROM_PANEL');
  });

  /**
   * The same verdict reached through its other branch. A focused `<input>` outside the grid is
   * `isOutsideInput`, which `tableView` tests before the focus check - and flatpickr's calendar
   * carries exactly that (a year field, and a month `<select>`), so this is the shape the reported
   * widget actually puts under the pointer.
   */
  test('survives the focus moving into an input inside that element', async({ page, theme, bundle }) => {
    const grid = new EditorPreventCloseElementPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditor(0, 1);

    expect(await grid.clickPanelInput()).toBe(true);

    expect(await grid.isEditorOpen()).toBe(true);
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.selected()).toEqual([[0, 1, 0, 1]]);
    expect(await grid.committedChanges()).toEqual([]);
  });

  /**
   * `outsideClickDeselects: false` sends the `mousedown` path to `destroyEditor()` instead of a
   * deselect, and gates the `mouseup` path's deselect away entirely – so unlike the cases above,
   * this one was already green before the fix, and its green is explained by `isFocusLostToOutside`
   * alone: with the cell still selected, every `#isPathWithinGrid()` call in that handler is
   * short-circuited away before it runs. It is here as regression coverage for the setting's own
   * path, so a later change to either branch cannot quietly break it.
   */
  test('survives the focus move with outsideClickDeselects disabled', async({ page, theme, bundle }) => {
    const grid = new EditorPreventCloseElementPage(page, theme, bundle, { outsideClickDeselects: false });

    await grid.goto();
    await grid.openEditor(0, 1);

    expect(await grid.clickPanelFocusTarget()).toBe(true);

    expect(await grid.isEditorOpen()).toBe(true);
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.committedChanges()).toEqual([]);
  });

  /**
   * Tells the fix's two halves apart, part 1: the EVENT-PATH half.
   *
   * With the surface assigned in `afterOpen`, `editorFactory`'s own `mousedown` `stopPropagation`
   * listener does not exist - it is wired once, right after `init` returns - so the press reaches
   * the document handler and `#isPathWithinGrid()` is the only thing between it and a deselect.
   * Verified: red with the `#isPathWithinGrid()` branch reverted, green with only the focus guard
   * reverted. Both are documented lifecycle hooks for assigning the element, so this is a shape
   * the contract has to cover, not a synthetic one.
   */
  test('survives a press on a surface that was assigned in afterOpen', async({ page, theme, bundle }) => {
    const grid = new EditorPreventCloseElementPage(page, theme, bundle, { surfaceAssignedIn: 'afterOpen' });

    await grid.goto();
    await grid.openEditor(0, 1);

    expect(await grid.clickPanelFocusTarget()).toBe(true);

    expect(await grid.isEditorOpen()).toBe(true);
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.selected()).toEqual([[0, 1, 0, 1]]);
    expect(await grid.committedChanges()).toEqual([]);
  });

  /**
   * Tells the fix's two halves apart, part 2: the FOCUS half.
   *
   * A press inside the panel released outside it - a picker's slider dragged past its edge. The
   * release's event path runs through the page rather than the panel, so `#isPathWithinGrid()`
   * cannot recognize it, and the focused element still sitting in the panel is the only thing left
   * to go on. Verified: red with the focus guard reverted, green with only the
   * `#isPathWithinGrid()` branch reverted.
   */
  test('survives a press inside the surface released outside it', async({ page, theme, bundle }) => {
    const grid = new EditorPreventCloseElementPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditor(0, 1);

    expect(await grid.dragFromPanelToOutside()).toBe(true);

    expect(await grid.isEditorOpen()).toBe(true);
    expect(await grid.editorState()).toBe('STATE_EDITING');
    expect(await grid.selected()).toEqual([[0, 1, 0, 1]]);
    expect(await grid.committedChanges()).toEqual([]);
  });

  /**
   * The guard refuses a surface that CONTAINS the grid instead of honoring it. A picker library
   * that returns its root rather than its popup makes `document.body` an easy value to assign, and
   * taking it at face value would silently disable outside-click deselect for as long as that
   * editor stays open, with nothing visible to blame. The mistake is reported once per instance
   * rather than swallowed.
   */
  test('ignores a surface that contains the grid, and says so once', async({ page, theme, bundle }) => {
    const grid = new EditorPreventCloseElementPage(page, theme, bundle, { surfaceElement: 'body' });

    await grid.goto();
    await grid.openEditor(0, 1);

    await grid.clickOutsideEverything();

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    await expect.poll(() => grid.selected()).toBe(null);

    expect(await grid.warnings()).toContain(
      'The editor\'s `preventCloseElement` contains the grid, so it cannot be told apart from the ' +
      'page. Assign the picker\'s own popup element instead of an ancestor of the grid. The element ' +
      'is ignored, and clicks outside the grid keep closing the editor.'
    );
  });

  /**
   * The guard must not swallow a genuine outside click. The panel is the only element outside the
   * grid that counts as its own, so a press on the page background still ends the edit.
   */
  test('still ends the edit on a click outside both the grid and the panel',
    async({ page, theme, bundle }) => {
      const grid = new EditorPreventCloseElementPage(page, theme, bundle);

      await grid.goto();
      await grid.openEditor(0, 1);

      await grid.clickOutsideEverything();

      await expect.poll(() => grid.isEditorOpen()).toBe(false);
      await expect.poll(() => grid.selected()).toBe(null);
    });
});
