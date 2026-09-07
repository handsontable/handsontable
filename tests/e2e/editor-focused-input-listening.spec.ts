import { test, expect } from '../fixtures/test';
import { EditorPreventCloseElementPage } from '../fixtures/pages/EditorPreventCloseElementPage';

/**
 * The grid decides on every document `mouseup` whether the focused input is its own, and it read
 * that from the `data-hot-input` attribute alone. The grid stamps the inputs it builds itself (the
 * text editor's textarea, the select editor's `select`, the filters and pagination controls); an
 * editor supplied by a user never carries it - `editorFactory` does not stamp `editor.input`, and
 * neither does any wrapper's component editor. So a click into a custom editor's own field read as
 * a click into a page input and unlistened the grid, which blocks EVERY `table`-scoped shortcut
 * context including the `editor` one: the editor's own Enter, Escape and Tab go with it (DEV-2787).
 *
 * The fixture's editor is built the way the documented recipes build one - a plain `<input>` inside
 * the editor's own container, which `editorFactory` appends to `rootElement`. The React wrapper's
 * portal host reaches the same verdict from `rootPortalElement`; that half is pinned by
 * `wrappers/react-wrapper/test/hotTable.spec.tsx`.
 */
test.describe('An editor whose own input takes the browser focus', () => {
  test('does not unlisten the grid', async({ page, theme, bundle }) => {
    const grid = new EditorPreventCloseElementPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditor(0, 1);

    expect(await grid.isListening()).toBe(true);

    await grid.startUnlistenCounter();
    await grid.editorInput.click();

    // The precondition the case rests on. With the focus anywhere else the verdict never reaches
    // the input branch, and the case would pin nothing.
    expect(await grid.isFocusInEditorInput()).toBe(true);

    expect(await grid.unlistenCount()).toBe(0);
  });

  /**
   * The end-to-end symptom, reached through the one ordinary gesture that does not heal itself.
   *
   * A press with the left button ends in a `click`, and the focus scope manager re-listens on that
   * click whenever the press landed inside the grid - so the dead window closes before the user can
   * type into it. A right button press ends in `contextmenu` and NO click, so nothing re-listens:
   * the grid stays deaf for the rest of the edit, and Escape - an `editor`-context shortcut -
   * cannot discard what the user typed.
   */
  test('keeps the editor\'s own Escape working after a right click in the field', async({ page, theme, bundle }) => {
    const grid = new EditorPreventCloseElementPage(page, theme, bundle);

    await grid.goto();
    await grid.openEditor(0, 1);

    await grid.editorInput.fill('TYPED');
    await grid.editorInput.click({ button: 'right' });

    expect(await grid.isFocusInEditorInput()).toBe(true);

    await page.keyboard.press('Escape');

    await expect.poll(() => grid.isEditorOpen()).toBe(false);
    expect(await grid.dataAtCell(0, 1)).toBe('B1');
  });
});
