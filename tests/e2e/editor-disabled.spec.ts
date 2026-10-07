import { test, expect } from '../fixtures/test';
import { EditorDisabledPage } from '../fixtures/pages/EditorDisabledPage';

/**
 * Every level of the cascading configuration that can carry `editor: false`,
 * with a cell it disables. Each level resolves through a different code path,
 * so the option is worth pinning once per level rather than once overall.
 */
const LEVELS = [
  { level: 'column', cell: [1, 1] },
  { level: 'hook', cell: [1, 3] },
  { level: 'single cell', cell: [1, 4] },
  { level: 'single row', cell: [4, 5] },
] as const;

test.describe('editor: false', () => {
  for (const { level, cell } of LEVELS) {
    test(`Enter opens no editor and the selection stays put — ${level}`, async({ page, theme, bundle }) => {
      const grid = new EditorDisabledPage(page, theme, bundle);

      await grid.goto();
      await grid.selectCell('levels', cell[0], cell[1]);
      await page.keyboard.press('Enter');

      await grid.expectNoEditor('levels');
      await grid.expectSelection('levels', cell[0], cell[1]);
    });
  }

  test('Enter opens no editor and the selection stays put — grid level', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('global', 0, 0);
    await page.keyboard.press('Enter');

    await grid.expectNoEditor('global');
    await grid.expectSelection('global', 0, 0);
    await grid.expectCell('global', 0, 0, 'A1');
  });

  // `readOnly` is the other way a cell ends up with no editor to open, and it
  // resolves Enter differently: the key stays a navigation key there, while on
  // `editor: false` above it is swallowed. The two are pinned side by side
  // because that difference is the open question this fixture exists to show —
  // not because either one is settled as the reference for the other.
  test('Enter moves the selection on a readOnly cell', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('levels', 1, 2);
    await page.keyboard.press('Enter');

    await grid.expectNoEditor('levels');
    await grid.expectSelection('levels', 2, 2);
  });

  test('Enter opens the editor on an editable cell', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('levels', 1, 0);
    await page.keyboard.press('Enter');

    await grid.expectEditorOpen('levels');
    await grid.expectSelection('levels', 1, 0);
  });

  // A column `type` supplies an editor of its own. It must not re-enable editing
  // that the grid level switched off — while everything else the type supplies
  // has to keep working, which is the half that makes the carve-out worth having.
  test('a column "type" does not re-enable editing disabled at grid level', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.cell('typed', 0, 1).dblclick();

    await grid.expectNoEditor('typed');
  });

  test('a column "type" still applies its renderer under a grid-level editor: false', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();

    // The numeric renderer's own marker class — proof the type expansion still
    // ran, and that only its editor was withheld.
    await grid.expectCellClass('typed', 0, 1, 'htNumeric');
    // The text column beside it is untouched by the numeric type.
    await grid.expectCell('typed', 0, 0, 'Alpha');
  });

  // A checkbox has no separate editing gesture — clicking the box IS the edit — so with no editor
  // it must not toggle. Before the fix, `editor: false` on a checkbox column had no effect at all.
  //
  // The native `disabled` attribute alone would block a click, so these cases remove it first:
  // they pin the renderer's own `click` and `change` guards, which must hold even when the
  // attribute is missing (for example, after a custom renderer rebuilds the cell).
  test('a checkbox click is cancelled when the grid has no editor, even without `disabled`', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.dataAtCell('typed', 0, 2)).toBe(true);

    await grid.clickCheckboxBypassingDisabled('typed', 0, 2);

    // The `click` guard cancels the native toggle, so the box itself stays checked...
    await expect(grid.checkbox('typed', 0, 2)).toBeChecked();
    // ...and nothing is written to the data.
    expect(await grid.dataAtCell('typed', 0, 2)).toBe(true);
  });

  test('a checkbox change writes nothing when the grid has no editor', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.dispatchCheckboxChange('typed', 0, 2);

    expect(await grid.dataAtCell('typed', 0, 2)).toBe(true);
  });

  // The box says so, rather than silently swallowing the click. `disabled` is what carries it:
  // the browser blocks the click and the label click, and announces the control as disabled.
  test('a checkbox with no editor is rendered disabled', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.checkbox('typed', 0, 2)).toBeDisabled();
  });

  // The keyboard route into the same write. It does not go through the input, so the renderer
  // gates it separately and it needs its own case.
  test('Space does not toggle a checkbox when the grid has no editor', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('typed', 0, 2);
    await page.keyboard.press('Space');

    expect(await grid.dataAtCell('typed', 0, 2)).toBe(true);
  });

  // `updateSettings()` reaches an untyped column through the cascade, so it is switched off.
  test('updateSettings({ editor: false }) disables an untyped column', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.updateSettings('updated', { editor: false });
    await grid.cell('updated', 0, 0).dblclick();

    await grid.expectNoEditor('updated');
  });

  // Documented limitation of the `editor` option, pinned so a change to it is noticed: a column
  // `type` wrote its editor onto the column when the column was built, and an `updateSettings()`
  // call that does not restate `columns` never rebuilds it, so the typed column stays editable.
  test('updateSettings({ editor: false }) without `columns` leaves a typed column editable', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.updateSettings('updated', { editor: false });
    await grid.cell('updated', 0, 1).dblclick();

    await grid.expectEditorOpen('updated');
  });

  // The documented workaround: restating `columns` in the same call rebuilds the typed column.
  test('updateSettings({ editor: false, columns }) disables a typed column', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.updateSettings('updated', {
      editor: false,
      columns: [
        { data: 'label' },
        { data: 'amount', type: 'numeric' },
      ],
    });
    await grid.cell('updated', 0, 1).dblclick();

    await grid.expectNoEditor('updated');
    await grid.expectCellClass('updated', 0, 1, 'htNumeric');
  });

  // Typing is the other way into an editor, and it must stay closed off.
  test('typing does not start an edit on a cell with no editor', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('global', 2, 2);
    await page.keyboard.press('x');

    await grid.expectNoEditor('global');
    await grid.expectCell('global', 2, 2, 'C3');
  });
});
