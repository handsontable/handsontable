import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
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

  // Delete and Backspace uncheck a checkbox through the renderer's own shortcut. With no editor that
  // shortcut must still CONSUME the key: otherwise it falls through to the grid's "empty the cell"
  // action, which writes `null` into a boolean column.
  for (const key of ['Delete', 'Backspace']) {
    test(`${key} leaves a checkbox with no editor unchanged`, async({ page, theme, bundle }) => {
      const grid = new EditorDisabledPage(page, theme, bundle);

      await grid.goto();
      await grid.selectCell('typed', 0, 2);
      await page.keyboard.press(key);

      expect(await grid.dataAtCell('typed', 0, 2)).toBe(true);
    });
  }

  // The checkbox shortcut consumes Delete for the whole selection, so it must clear the other cells
  // itself, even when the only checkbox in the selection has no editor and does not change.
  test('Delete clears the text cells of a selection that holds a checkbox with no editor', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('typed', 0, 0);
    await grid.call('typed', 'selectCell', 0, 0, 0, 2);
    await page.keyboard.press('Delete');

    expect(await grid.dataAtCell('typed', 0, 0)).toBeNull();
    expect(await grid.dataAtCell('typed', 0, 1)).toBeNull();
    expect(await grid.dataAtCell('typed', 0, 2)).toBe(true);
  });

  // The other side of the same shortcut: with no checkbox in the selection it does not consume the
  // key, and the grid clears the cells itself. They must be written once - one `afterChange`, one undo
  // step - not once by each.
  test('Delete writes a checkbox-free selection once in a grid with a checkbox column', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('typed', 0, 0);
    await grid.call('typed', 'selectCell', 0, 0, 0, 1);
    await grid.countChanges('typed');
    await page.keyboard.press('Delete');

    expect(await grid.dataAtCell('typed', 0, 0)).toBeNull();
    expect(await grid.dataAtCell('typed', 0, 1)).toBeNull();
    expect(await grid.changeCount('typed')).toBe(1);

    await page.keyboard.press('ControlOrMeta+z');

    expect(await grid.dataAtCell('typed', 0, 0)).toBe('Alpha');
    expect(await grid.dataAtCell('typed', 0, 1)).toBe(1234.5);
  });

  test('a "type" set on a single cell does not re-enable editing disabled at grid level', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.call('typed', 'setCellMeta', 0, 0, 'type', 'numeric');
    await grid.call('typed', 'render');
    await grid.cell('typed', 0, 0).dblclick();

    await grid.expectNoEditor('typed');
  });

  // `setCellMeta()` stores one key at a time and drops the `true` itself, while the cell's `type` is
  // expanded later. The request must survive that, and go away again with the `editor` key.
  test('a single cell opts back in with `editor: true` through setCellMeta()', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.call('typed', 'setCellMeta', 0, 0, 'type', 'numeric');
    await grid.call('typed', 'setCellMeta', 0, 0, 'editor', true);
    await grid.call('typed', 'render');
    await grid.cell('typed', 0, 0).dblclick();

    await grid.expectEditorOpen('typed');

    await page.keyboard.press('Escape');
    await grid.call('typed', 'removeCellMeta', 0, 0, 'editor');
    await grid.call('typed', 'render');
    await grid.cell('typed', 0, 0).dblclick();

    await grid.expectNoEditor('typed');
  });

  // The `cell` option goes through the same store, and a later `updateSettings()` that restates
  // `columns` clears the cell meta cache and replays the `cell` entries.
  test('a `cell` entry opts back in with `editor: true`, also after a cache reset', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);
    const columns = [
      { data: 'label', type: 'text' },
      { data: 'amount', type: 'numeric' },
      { data: 'done', type: 'checkbox' },
    ];

    await grid.goto();
    await grid.updateSettings('typed', { cell: [{ row: 0, col: 0, type: 'numeric', editor: true }] });
    await grid.cell('typed', 0, 0).dblclick();

    await grid.expectEditorOpen('typed');

    await page.keyboard.press('Escape');
    await grid.updateSettings('typed', { columns });
    await grid.cell('typed', 0, 0).dblclick();

    await grid.expectEditorOpen('typed');
  });

  // `editor: true` asks for the editor the column's type provides. It must opt a typed column back
  // in under a grid-level `editor: false`, the same way a named editor does.
  test('a column with `editor: true` stays editable under a grid-level editor: false', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.updateSettings('typed', {
      columns: [
        { data: 'label', type: 'text' },
        { data: 'amount', type: 'numeric', editor: true },
        { data: 'done', type: 'checkbox' },
      ],
    });
    await grid.cell('typed', 0, 1).dblclick();

    await grid.expectEditorOpen('typed');
  });

  // A cell meta reaches its column's `_automaticallyAssignedMetaProps` through the prototype. One cell
  // opting in through `cells()` must not turn the column's own `editor: false` into a type default
  // for the cells of that column expanded after it.
  test('a `cells()` opt-in on one cell leaves the other cells of a column with `editor: false` disabled', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await page.evaluate(() => {
      (window as any).hotTyped.updateSettings({
        columns: [
          { data: 'label', type: 'text' },
          { data: 'amount', type: 'numeric', editor: false },
          { data: 'done', type: 'checkbox' },
        ],
        // Every cell of the column expands the type itself, so the opted-in cell's write into the shared
        // set is read by the cells after it.
        cells(row: number, col: number) {
          if (col !== 1) {
            return {};
          }

          return row === 0 ? { type: 'numeric', editor: true } : { type: 'numeric' };
        },
      });
    });
    await grid.cell('typed', 0, 1).dblclick();

    await grid.expectEditorOpen('typed');

    await page.keyboard.press('Escape');
    await grid.cell('typed', 1, 1).dblclick();

    await grid.expectNoEditor('typed');
  });

  // `editor: true` written through `setCellMeta()` is stored as a request of its own, which the undo
  // step must carry, or Ctrl+Z leaves the cell editable.
  test('undo takes back an `editor: true` opt-in made through setCellMeta()', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    // The `type` comes from the `cell` option, which is not an undo step, so the undo below can only
    // take back the opt-in.
    await grid.updateSettings('typed', { cell: [{ row: 0, col: 0, type: 'numeric' }] });
    await grid.call('typed', 'setCellMeta', 0, 0, 'editor', true);
    await page.evaluate(() => (window as any).hotTyped.getPlugin('undoRedo').undo());
    await grid.call('typed', 'render');
    await grid.cell('typed', 0, 0).dblclick();

    await grid.expectNoEditor('typed');

    await page.evaluate(() => (window as any).hotTyped.getPlugin('undoRedo').redo());
    await grid.call('typed', 'render');
    await grid.cell('typed', 0, 0).dblclick();

    await grid.expectEditorOpen('typed');
  });

  // The reverse: naming an editor drops the request, and undoing that must bring the request back.
  test('undo of an `editor` write brings back an earlier `editor: true` opt-in', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.call('typed', 'setCellMeta', 0, 0, 'type', 'numeric');
    await grid.call('typed', 'setCellMeta', 0, 0, 'editor', true);
    await grid.call('typed', 'setCellMeta', 0, 0, 'editor', false);
    await grid.call('typed', 'render');
    await grid.cell('typed', 0, 0).dblclick();

    await grid.expectNoEditor('typed');

    await page.evaluate(() => (window as any).hotTyped.getPlugin('undoRedo').undo());
    await grid.call('typed', 'render');
    await grid.cell('typed', 0, 0).dblclick();

    await grid.expectEditorOpen('typed');
  });

  // The dynamic extension expands only a `type` the cell owns, so a request on a cell whose type
  // comes from its column has to be honored on its own.
  test('setCellMeta() `editor: true` opts in a cell whose `type` comes from its column', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.call('typed', 'setCellMeta', 0, 1, 'editor', true);
    await grid.call('typed', 'render');
    await grid.cell('typed', 0, 1).dblclick();

    await grid.expectEditorOpen('typed');

    await page.keyboard.press('Escape');
    await grid.call('typed', 'removeCellMeta', 0, 1, 'editor');
    await grid.call('typed', 'render');
    await grid.cell('typed', 0, 1).dblclick();

    await grid.expectNoEditor('typed');
  });

  // The request asks for the type's editor only in place of an inherited `editor: false`. Under a
  // named column editor it keeps that editor, so a password column does not open in plain text.
  test('setCellMeta() `editor: true` keeps a named editor the cell inherits from its column', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.updateSettings('updated', {
      columns: [
        { data: 'label', editor: 'password' },
        { data: 'amount', type: 'numeric' },
      ],
    });
    await grid.call('updated', 'setCellMeta', 0, 0, 'editor', true);
    await grid.call('updated', 'render');
    await grid.cell('updated', 0, 0).dblclick();

    await grid.expectEditorOpen('updated');
    expect(await grid.activeEditorIs('updated', 'PasswordEditor')).toBe(true);
  });

  // `renderMode: 'onChange'` repaints a cell only when its meta version moved. A `cells()` result that
  // starts asking for the type's editor changes the editor without changing any key it returns.
  test('a checkbox repaints as enabled under renderMode "onChange" once `cells()` opts it in', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await page.evaluate(() => {
      (window as any).hotTyped.updateSettings({
        renderMode: 'onChange',
        cells(_row: number, col: number) {
          if (col !== 2) {
            return {};
          }

          return (window as any).checkboxOptIn ? { type: 'checkbox', editor: true } : { type: 'checkbox' };
        },
      });
    });

    await expect(grid.checkbox('typed', 0, 2)).toBeDisabled();

    await page.evaluate(() => {
      (window as any).checkboxOptIn = true;
      (window as any).hotTyped.render();
    });

    await expect(grid.checkbox('typed', 0, 2)).toBeEnabled();
  });

  // The checkbox shortcut finds the checkboxes of a selection. A checkbox column scrolled out of view
  // has no rendered cell, and it must still consume Delete, or the grid writes `null` into it.
  test('Delete leaves a checkbox with no editor unchanged while its column is not rendered', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.updateSettings('typed', { width: 200, colWidths: 400, viewportColumnRenderingOffset: 0 });
    await grid.selectCell('typed', 0, 0);
    await grid.call('typed', 'selectRows', 0);

    expect(await grid.call('typed', 'getCell', 0, 2)).toBeNull();

    await page.keyboard.press('Delete');

    expect(await grid.dataAtCell('typed', 0, 0)).toBeNull();
    expect(await grid.dataAtCell('typed', 0, 2)).toBe(true);
  });

  // `readOnlyStyling: false` keeps a read-only checkbox looking editable, and a checkbox with no
  // editor must look the same way, while still refusing the toggle.
  test('readOnlyStyling: false renders a checkbox with no editor enabled, and a click still changes nothing', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.updateSettings('typed', { readOnlyStyling: false });

    await expect(grid.checkbox('typed', 0, 2)).toBeEnabled();

    await grid.checkbox('typed', 0, 2).click();

    await expect(grid.checkbox('typed', 0, 2)).toBeChecked();
    expect(await grid.dataAtCell('typed', 0, 2)).toBe(true);
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

// Whether a press on a disabled control reaches its ancestors has differed between engines, so this
// runs on Firefox and WebKit as well.
test.describe('editor: false – disabled checkbox', { tag: CROSS_BROWSER_TAG }, () => {
  // The box covers the middle of its cell, and three guide pages promise that clicking it still
  // selects the cell. The checkbox stylesheet lets the click through a disabled box.
  test('clicking a disabled checkbox selects its cell', async({ page, theme, bundle }) => {
    const grid = new EditorDisabledPage(page, theme, bundle);

    await grid.goto();
    await grid.selectCell('typed', 1, 0);
    await expect(grid.checkbox('typed', 0, 2)).toBeDisabled();
    await grid.checkbox('typed', 0, 2).click({ force: true });

    await grid.expectSelection('typed', 0, 2);
    expect(await grid.dataAtCell('typed', 0, 2)).toBe(true);
  });
});
