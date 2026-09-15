import { test, expect } from '../fixtures/test';
import { EditorOpenCheckboxFocusPage } from '../fixtures/pages/EditorOpenCheckboxFocusPage';

/**
 * `#isWithinOpenEditorDom()` asks whether the focused element sits in the grid's own DOM while a
 * cell is being edited, and it is deliberately not per-cell: it does not try to prove the field
 * belongs to the EDITED cell. On paper that widens the fix to any unstamped input the grid
 * renders - a checkbox renderer's `<input>`, say - while some other cell's editor is open.
 *
 * These cases pin the reason that shape does not actually occur. A press that moves the browser
 * focus onto another cell's input also changes the selection, and the selection change closes the
 * editor (`core.ts`, in the same local hook that runs `afterSelection`; its exclusion list covers
 * data-driven sources such as `'shift'` - the row/column SHIFT that an insert or a remove
 * performs - not a mouse press). So `isCellEdited()` is already false when the `mouseup` verdict
 * runs, the containment test is never consulted for that input, and the grid unlistens exactly as
 * it did before the fix.
 *
 * The editor column deliberately uses a bare `editorFactory` editor rather than the default one:
 * `textEditor` also ends its edit on `focusout`, which would close it for a second, unrelated
 * reason and leave the cases proving less than they claim.
 *
 * Both cases would go red if an editor ever survived that selection change, which is exactly when
 * the widening would start to matter and someone should look at it again.
 */
test.describe('A checkbox taking the focus while a cell is being edited', () => {
  test('has no open editor left by the time the mouseup verdict runs', async({ page, theme, bundle }) => {
    const grid = new EditorOpenCheckboxFocusPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditor(0, 0);

    await grid.recordFocusAtMouseup();
    await grid.resetUnlistenCount();
    await grid.shiftClickCheckbox(1, 1);

    // Read at the moment the verdict runs, which is the only moment either value is what the
    // handler sees: the focus is on the checkbox at `mousedown` and `mouseup` and back on `body`
    // once the `click` has run.
    expect(await grid.focusAtMouseup()).toEqual({ onCheckbox: true, editorOpen: false });

    expect(await grid.unlistenCount()).toBe(1);
  });

  /**
   * The same gesture from a grid with nothing being edited - the other side of the `isCellEdited()`
   * gate, where the fix changes nothing by design. An in-cell input a renderer owns must keep
   * unlistening the grid, or the arrow keys would move the selection while they move the caret,
   * and `checkboxRenderer`'s own `setTimeout(instance.listen, 10)` is what restores listening
   * afterwards. So this asserts the unlisten happened, not the state it heals to.
   */
  test('still unlistens the grid when no cell is being edited', async({ page, theme, bundle }) => {
    const grid = new EditorOpenCheckboxFocusPage(page, theme, bundle);

    await grid.goto();

    await grid.recordFocusAtMouseup();
    await grid.resetUnlistenCount();
    await grid.checkbox(1, 1).click();

    expect(await grid.focusAtMouseup()).toEqual({ onCheckbox: true, editorOpen: false });

    expect(await grid.unlistenCount()).toBe(1);
  });
});
