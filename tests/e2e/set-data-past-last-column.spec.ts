import { test, expect } from '../fixtures/test';
import { SetDataPastLastColumnPage } from '../fixtures/pages/SetDataPastLastColumnPage';

/**
 * `setDataAtCell()` skips a change addressed past the last column of an object data source (#5409).
 * When it skips every change of a call, it returns before `processChanges()`: that function cancels
 * the active editor on an empty change set, so a skipped write from application code would discard
 * what the user is still typing in another cell.
 */
test.describe('setDataAtCell past the last column of an object data source', () => {
  test('leaves an open editor alone when every change is skipped', async({ page, theme, bundle }) => {
    const grid = new SetDataPastLastColumnPage(page, theme, bundle);

    await grid.goto();
    await grid.typeIntoCell(1, 1, 'still typing');

    await grid.setDataAtCell(0, 2, 'skipped');

    // The skip itself, so the editor check below cannot pass on a write that landed.
    expect(await grid.sourceRow(0)).toEqual({ id: 1, name: 'Ted Right' });

    expect(await grid.isEditorOpen()).toBe(true);
    expect(await grid.editorValue()).toBe('still typing');
  });
});
