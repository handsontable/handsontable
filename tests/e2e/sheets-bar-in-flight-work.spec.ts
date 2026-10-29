import { test, expect } from '../fixtures/test';
import { SheetsBarInFlightWorkPage } from '../fixtures/pages/SheetsBarInFlightWorkPage';

/**
 * A sheet switch replaces the grid's data with the arriving sheet's. Work started on the departing sheet
 * and still running then finished on the arriving one: a change waiting for its validator was written
 * into it, an editor holding a rejected value stayed open over it, a header sort queued behind a
 * validation sorted it, a comment editor saved into its cell, and the Loading overlay put the departing
 * sheet's selection on it.
 */
/**
 * On a touch screen the grid ignores the mouse events a tap synthesizes, so the cell editor stayed open
 * until the tab's `click` closed it, and the validator then answered too late for that click: the first
 * tap on another tab saved the edit and switched nothing.
 */
test.describe('SheetsBar tap on a tab while a cell with a validator is edited', () => {
  let grid: SheetsBarInFlightWorkPage;

  test.use({ hasTouch: true });

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarInFlightWorkPage(page, theme, bundle);
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('switches on the first tap, and the edit stays on its sheet', async({ page }) => {
    await grid.goto('rejectedValue');

    await grid.cell(0, 0).click();
    await page.keyboard.type('good');

    expect(await grid.isEditorOpened()).toBe(true);

    await grid.tab('Beta').tap();

    await expect(grid.tab('Beta')).toHaveAttribute('aria-current', 'true');
    expect(await grid.declaredSheetColumn(0, 0)).toEqual(['good', 'a1', 'a2']);
    expect(await grid.declaredSheetColumn(1, 0)).toEqual(['b3', 'b1', 'b2']);
  });
});

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

  test('leaves a wide sheet while its columns are still measured without breaking later renders', async() => {
    await grid.goto('wideSheet');

    expect(await grid.switchDuringColumnSweep('Beta')).toEqual({ sweepRunning: true, switched: true });

    await expect.poll(() => grid.isColumnSweepRunning()).toBe(false);

    expect(await grid.renderError()).toBeNull();
    expect(await grid.activeSheetName()).toBe('Beta');
    await expect(grid.tab('Beta')).toHaveAttribute('aria-current', 'true');
    await expect(grid.cell(0, 0)).toHaveText('b3');
  });

  test('keeps measuring the columns when the grid only updates its data', async() => {
    await grid.goto('wideSheet');

    expect(await grid.updateDataDuringColumnSweep()).toEqual({ before: true, after: true });

    await expect.poll(() => grid.isColumnSweepRunning()).toBe(false);

    expect(await grid.renderError()).toBeNull();
  });

  test('finishes measuring the columns without breaking later renders when an update shrinks the data', async() => {
    await grid.goto('wideSheet');

    expect(await grid.shrinkDataDuringColumnSweep()).toBe(true);

    await expect.poll(() => grid.isColumnSweepRunning()).toBe(false);

    expect(await grid.renderError()).toBeNull();
  });

  test('skips the columns an update took away without spending idle tasks on them', async() => {
    await grid.goto('wideSheet');

    // The sweep measures 50 columns at once, then 51 more in the same task, and 51 per idle task after that,
    // so 149 columns of the 250-column sheet wait for idle tasks when the data shrinks. A column the grid lost
    // used to count against a task's 51, so the lost columns still took three idle tasks, which kept the sweep
    // running and held back the queued width refreshes.
    expect(await grid.shrinkDataAndWaitOneSweepChunk()).toEqual({ before: true, afterOneChunk: false });
    expect(await grid.renderError()).toBeNull();
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
