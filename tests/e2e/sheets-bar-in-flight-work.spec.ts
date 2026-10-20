import { test, expect } from '../fixtures/test';
import { SheetsBarInFlightWorkPage } from '../fixtures/pages/SheetsBarInFlightWorkPage';

/**
 * A sheet switch replaces the grid's data with the arriving sheet's. Work started on the departing sheet
 * and still running then finished on the arriving one: a change waiting for its validator was written
 * into it, an editor holding a rejected value stayed open over it, a header sort queued behind a
 * validation sorted it, a comment editor saved into its cell, and the Loading overlay put the departing
 * sheet's selection on it.
 */
test.describe('SheetsBar switch with work still in flight', () => {
  let grid: SheetsBarInFlightWorkPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarInFlightWorkPage(page, theme, bundle);
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('stays on the sheet while an edit waits for its validator, and the edit lands there', async() => {
    await grid.goto('asyncValidator');

    await grid.typeInto(0, 0, 'typed');
    await expect.poll(() => grid.pendingValidatorCount()).toBe(1);

    await grid.tab('Beta').click();

    expect(await grid.activeSheetName()).toBe('Alpha');

    expect(await grid.answerValidators(true)).toBe(1);
    await expect(grid.cell(0, 0)).toHaveText('typed');

    await grid.openSheet('Beta');

    expect(await grid.declaredSheetColumn(0, 0)).toEqual(['typed', 'a1', 'a2']);
    expect(await grid.declaredSheetColumn(1, 0)).toEqual(['b3', 'b1', 'b2']);
  });

  test('stays on the sheet while the editor holds a rejected value, and switches once it is corrected', async() => {
    await grid.goto('rejectedValue');

    await grid.typeInto(0, 0, 'bad');

    expect(await grid.isEditorOpened()).toBe(true);

    await grid.tab('Beta').click();

    expect(await grid.activeSheetName()).toBe('Alpha');
    expect(await grid.isEditorOpened()).toBe(true);

    await grid.editorInput().fill('good');
    await grid.editorInput().press('Enter');
    await grid.openSheet('Beta');

    expect(await grid.declaredSheetColumn(0, 0)).toEqual(['good', 'a1', 'a2']);
    expect(await grid.declaredSheetColumn(1, 0)).toEqual(['b3', 'b1', 'b2']);
  });

  test('sorts the sheet the header was clicked on when the sort waited for a validator', async() => {
    await grid.goto('asyncValidator');

    await grid.typeInto(0, 1, 'typed');
    await expect.poll(() => grid.pendingValidatorCount()).toBe(1);

    await grid.clickColumnHeader(0);
    await grid.tab('Beta').click();

    expect(await grid.activeSheetName()).toBe('Alpha');

    await grid.answerValidators(true);

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
    await expect(grid.cell(0, 0)).toHaveText('a1');

    await grid.openSheet('Beta');

    expect(await grid.sortConfig()).toEqual([]);
    await expect(grid.cell(0, 0)).toHaveText('b3');
  });

  test('saves a comment typed into an editor the API opened on the sheet it was opened on', async() => {
    await grid.goto('comments');

    await grid.typeCommentThroughApi(0, 0, 'note');

    expect(await grid.setActiveSheet('Beta')).toBe(true);

    await expect(grid.commentEditor()).toBeHidden();
    expect(await grid.commentAt(0, 0)).toBeUndefined();

    expect(await grid.setActiveSheet('Alpha')).toBe(true);
    expect(await grid.commentAt(0, 0)).toBe('note');
  });

  test('gives the arriving sheet its own selection when the Loading overlay hides', async() => {
    await grid.goto('loading');

    await grid.openSheet('Beta');
    await grid.selectCell(0, 0);
    await grid.openSheet('Alpha');
    await grid.selectCell(2, 1);

    await grid.setLoading(true);

    expect(await grid.setActiveSheet('Beta')).toBe(true);

    await grid.setLoading(false);

    expect(await grid.selected()).toEqual([[0, 0, 0, 0]]);
  });
});
