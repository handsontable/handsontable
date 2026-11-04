import { expect, test } from '../fixtures/test';
import { ValidatedEditReloadPage } from '../fixtures/pages/ValidatedEditReloadPage';

const RELOADED_ROWS = [
  { id: 'EMP-512', name: 'Sofia Rossi', title: 'Data Analyst' },
  { id: 'EMP-104', name: 'James Okafor', title: 'Senior Engineer' },
  { id: 'EMP-221', name: 'Li Wei', title: 'Product Manager' },
];

/**
 * A user confirms an edit in a column whose validator answers later, and the app reloads the data
 * with `loadData()` before the answer arrives. The edit was made for the record the grid showed
 * then, so it must not land in the record the reload put at the same row.
 */
test.describe('an edit waiting for its validator when the app reloads the data', () => {
  let grid: ValidatedEditReloadPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ValidatedEditReloadPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('writes the edit when no reload lands before the validator answers', async() => {
    await grid.typeAndConfirm(0, 1, 'Ana García');
    await expect.poll(() => grid.pendingCount()).toBe(1);

    await grid.answer('Ana García', true);

    await expect.poll(async() => (await grid.sourceData())[0]).toEqual(
      { id: 'EMP-104', name: 'Ana García', title: 'Senior Engineer' }
    );
    await expect(grid.cell(0, 1)).toHaveText('Ana García');
  });

  test('drops the edit and closes the waiting editor when the reload lands first', async() => {
    await grid.typeAndConfirm(0, 1, 'Ana García');
    await expect.poll(() => grid.pendingCount()).toBe(1);

    await grid.reload();

    expect(await grid.editorState()).toEqual({ opened: false, waiting: false });

    await grid.answer('Ana García', true);

    expect(await grid.loadedArray()).toEqual(RELOADED_ROWS);
    expect(await grid.edits()).toEqual([]);
    await expect(grid.cell(0, 1)).toHaveText('Sofia Rossi');
  });

  test('keeps the editor closed when the validator rejects the edit after the reload', async() => {
    await grid.typeAndConfirm(0, 2, 'Staff Engineer');
    await expect.poll(() => grid.pendingCount()).toBe(1);

    await grid.reload();
    await grid.answer('Staff Engineer', false);

    expect(await grid.editorState()).toEqual({ opened: false, waiting: false });
    expect(await grid.loadedArray()).toEqual(RELOADED_ROWS);
    await expect(grid.cell(0, 2)).toHaveText('Data Analyst');
  });

  test('keeps the next edit waiting for its own answer when the dropped edit answers first', async() => {
    await grid.typeAndConfirm(0, 2, 'Staff Engineer');
    await expect.poll(() => grid.pendingCount()).toBe(1);

    await grid.reload();
    await grid.typeAndConfirm(1, 2, 'Lead Analyst');
    await expect.poll(() => grid.pendingCount()).toBe(2);

    await grid.answer('Staff Engineer', true);

    expect(await grid.editorState()).toEqual({ opened: true, waiting: true });

    await grid.answer('Lead Analyst', true);

    await expect.poll(() => grid.editorState()).toEqual({ opened: false, waiting: false });
    expect((await grid.sourceData())[1].title).toBe('Lead Analyst');
  });

  test('reopens the editor on a rejected edit when no reload lands first', async() => {
    await grid.typeAndConfirm(0, 2, 'Staff Engineer');
    await expect.poll(() => grid.pendingCount()).toBe(1);

    await grid.answer('Staff Engineer', false);

    await expect.poll(() => grid.editorState()).toEqual({ opened: true, waiting: false });
    expect((await grid.sourceData())[0].title).toBe('Senior Engineer');
  });
});
