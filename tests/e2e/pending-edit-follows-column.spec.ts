import { expect, test } from '../fixtures/test';
import { PendingEditFollowsColumnPage } from '../fixtures/pages/PendingEditFollowsColumnPage';

const SOURCE = [['a0', 'b0', 'c0'], ['a1', 'b1', 'c1'], ['a2', 'b2', 'c2']];

/**
 * Returns the source rows with the cell `b1` replaced by a value.
 */
function withEdit(value: string): (string | null)[][] {
  return SOURCE.map(row => row.map(cell => (cell === 'b1' ? value : cell)));
}

/**
 * A user confirms a value in a column whose validator answers later, and the columns are moved, inserted, or removed
 * before the answer arrives. The value belongs to the column it was typed into (`b`, on visual column 1), so it must
 * land there, not in the column that now sits at visual column 1.
 */
test.describe('an edit waiting for its validator while the columns change', () => {
  let grid: PendingEditFollowsColumnPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PendingEditFollowsColumnPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('writes the value to its column when the column is moved meanwhile', async() => {
    await grid.typeAndConfirm(1, 1, 'edited');
    await grid.expectPending('edited');

    await grid.moveColumn(1, 0);
    await expect(grid.cell(1, 0)).toHaveText('b1');

    await grid.answer('edited', true);

    await expect.poll(() => grid.sourceData()).toEqual(withEdit('edited'));
    await expect(grid.cell(1, 0)).toHaveText('edited');
    await expect(grid.cell(1, 1)).toHaveText('a1');
  });

  test('writes the value to its column when a column is inserted before it meanwhile', async() => {
    await grid.typeAndConfirm(1, 1, 'edited');
    await grid.expectPending('edited');

    await grid.insertColumn(0);
    await expect(grid.cell(1, 2)).toHaveText('b1');

    await grid.answer('edited', true);

    await expect.poll(() => grid.sourceData()).toEqual([
      [null, 'a0', 'b0', 'c0'],
      [null, 'a1', 'edited', 'c1'],
      [null, 'a2', 'b2', 'c2'],
    ]);
    await expect(grid.cell(1, 2)).toHaveText('edited');
  });

  test('writes the value to its column when a column before it is removed meanwhile', async() => {
    await grid.typeAndConfirm(1, 1, 'edited');
    await grid.expectPending('edited');

    await grid.removeColumn(0);
    await expect(grid.cell(1, 0)).toHaveText('b1');

    await grid.answer('edited', true);

    await expect.poll(() => grid.sourceData()).toEqual([['b0', 'c0'], ['edited', 'c1'], ['b2', 'c2']]);
    await expect(grid.cell(1, 0)).toHaveText('edited');
  });

  test('writes nothing when the column was removed meanwhile', async() => {
    await grid.typeAndConfirm(1, 1, 'edited');
    await grid.expectPending('edited');

    await grid.removeColumn(1);
    await grid.answer('edited', true);

    await expect.poll(() => grid.sourceData()).toEqual([['a0', 'c0'], ['a1', 'c1'], ['a2', 'c2']]);
    await expect(grid.cell(1, 1)).toHaveText('c1');
  });
});

/**
 * With `allowInvalid: false`, a rejected value reopens the editor so the user can correct it. When the columns changed
 * while the validator worked, the editor reopens on the column the value was typed into, at the visual column that
 * column has now; when the column was removed, there is no cell to reopen on and the editor closes.
 */
test.describe('a rejected edit when the columns changed while it waited', () => {
  let grid: PendingEditFollowsColumnPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PendingEditFollowsColumnPage(page, theme, bundle, false);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('reopens the editor on the column\'s new place after a move and writes the corrected value there', async() => {
    await grid.typeAndConfirm(1, 1, 'bad');
    await grid.expectPending('bad');

    await grid.moveColumn(1, 0);
    await grid.answer('bad', false);

    await expect.poll(() => grid.editorState()).toEqual({
      opened: true,
      waiting: false,
      row: 1,
      col: 0,
      selected: [1, 0],
    });
    await expect(grid.editorInput).toHaveValue('bad');
    expect(await grid.sourceData()).toEqual(SOURCE);

    await grid.retypeAndConfirm('good');
    await grid.expectPending('good');
    await grid.answer('good', true);

    await expect.poll(() => grid.sourceData()).toEqual(withEdit('good'));
    await expect(grid.cell(1, 0)).toHaveText('good');
    await expect(grid.cell(1, 1)).toHaveText('a1');
  });

  test('reopens the editor on the column\'s new place after an insert and writes the corrected value there', async() => {
    await grid.typeAndConfirm(1, 1, 'bad');
    await grid.expectPending('bad');

    await grid.insertColumn(0);
    await grid.answer('bad', false);

    await expect.poll(() => grid.editorState()).toEqual({
      opened: true,
      waiting: false,
      row: 1,
      col: 2,
      selected: [1, 2],
    });
    await expect(grid.editorInput).toHaveValue('bad');

    await grid.retypeAndConfirm('good');
    await grid.expectPending('good');
    await grid.answer('good', true);

    await expect.poll(() => grid.sourceData()).toEqual([
      [null, 'a0', 'b0', 'c0'],
      [null, 'a1', 'good', 'c1'],
      [null, 'a2', 'b2', 'c2'],
    ]);
  });

  test('closes the editor and writes nothing when the column was removed', async() => {
    await grid.typeAndConfirm(1, 1, 'bad');
    await grid.expectPending('bad');

    await grid.removeColumn(1);
    await grid.answer('bad', false);

    await expect.poll(async() => {
      const { opened, waiting } = await grid.editorState();

      return { opened, waiting };
    }).toEqual({ opened: false, waiting: false });
    expect(await grid.sourceData()).toEqual([['a0', 'c0'], ['a1', 'c1'], ['a2', 'c2']]);
  });

  test('closes the editor and writes nothing when the column was hidden', async() => {
    await grid.typeAndConfirm(1, 1, 'bad');
    await grid.expectPending('bad');

    await grid.hideColumn(1);
    await grid.answer('bad', false);

    await expect.poll(async() => {
      const { opened, waiting } = await grid.editorState();

      return { opened, waiting };
    }).toEqual({ opened: false, waiting: false });
    expect(await grid.sourceData()).toEqual(SOURCE);
  });
});
