import { expect, test } from '../fixtures/test';
import { PendingEditFollowsRecordPage } from '../fixtures/pages/PendingEditFollowsRecordPage';

const SOURCE: [string, number][] = [['p0', 0], ['p1', 5], ['p2', 3], ['p3', 1], ['p4', 6], ['p5', 4]];

/**
 * Returns the source rows with the first cell of record `p1` replaced by a value.
 */
function withP1(value: string): [string, number][] {
  return SOURCE.map(([name, rank]) => [name === 'p1' ? value : name, rank]);
}

/**
 * A user confirms a value in a column whose validator answers later, and the rows are sorted, moved,
 * or filtered before the answer arrives. The value belongs to the record it was typed into (`p1`, on
 * visual row 1), so it must land there, not on the record that now sits at visual row 1.
 */
test.describe('an edit waiting for its validator while the rows change order', () => {
  let grid: PendingEditFollowsRecordPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PendingEditFollowsRecordPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('writes the value to its record when the rows are sorted meanwhile', async() => {
    await grid.typeAndConfirm(1, 0, 'edited');
    await grid.expectPending('edited');

    await grid.sortByRank();
    await expect(grid.cell(1, 0)).toHaveText('p3');

    await grid.answer('edited', true);

    await expect.poll(() => grid.sourceData()).toEqual(withP1('edited'));
    await expect(grid.cell(4, 0)).toHaveText('edited');
    await expect(grid.cell(1, 0)).toHaveText('p3');
  });

  test('writes the value to its record when a row is moved meanwhile', async() => {
    await grid.typeAndConfirm(1, 0, 'edited');
    await grid.expectPending('edited');

    await grid.moveRow(1, 4);
    await expect(grid.cell(1, 0)).toHaveText('p2');

    await grid.answer('edited', true);

    await expect.poll(() => grid.sourceData()).toEqual(withP1('edited'));
    await expect(grid.cell(4, 0)).toHaveText('edited');
    await expect(grid.cell(1, 0)).toHaveText('p2');
  });

  test('writes the value to its record when a row above it is filtered out meanwhile', async() => {
    await grid.typeAndConfirm(1, 0, 'edited');
    await grid.expectPending('edited');

    await grid.filterRank('gt', 0);
    await expect(grid.cell(1, 0)).toHaveText('p2');

    await grid.answer('edited', true);

    await expect.poll(() => grid.sourceData()).toEqual(withP1('edited'));
    await expect(grid.cell(0, 0)).toHaveText('edited');
    await expect(grid.cell(1, 0)).toHaveText('p2');
  });
});

/**
 * With `allowInvalid: false`, a rejected value reopens the editor so the user can correct it. When
 * the rows changed order while the validator worked, the editor reopens on the record the value was
 * typed into, at the row that record has now; when the record was filtered out, there is no cell to
 * reopen on and the editor closes.
 */
test.describe('a rejected edit when the rows changed order while it waited', () => {
  let grid: PendingEditFollowsRecordPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PendingEditFollowsRecordPage(page, theme, bundle, false);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('reopens the editor on the record\'s new row and writes the corrected value there', async() => {
    await grid.typeAndConfirm(1, 0, 'bad');
    await grid.expectPending('bad');

    await grid.sortByRank();
    await expect(grid.cell(1, 0)).toHaveText('p3');

    await grid.answer('bad', false);

    await expect.poll(() => grid.editorState()).toEqual({
      opened: true,
      waiting: false,
      row: 4,
      selected: [4, 0],
    });
    await expect(grid.editorInput).toBeVisible();
    await expect(grid.editorInput).toHaveValue('bad');
    expect(await grid.sourceData()).toEqual(SOURCE);

    await grid.retypeAndConfirm('good');
    await grid.expectPending('good');
    await grid.answer('good', true);

    await expect.poll(() => grid.sourceData()).toEqual(withP1('good'));
    await expect(grid.cell(4, 0)).toHaveText('good');
    await expect(grid.cell(1, 0)).toHaveText('p3');
    expect((await grid.editorState()).opened).toBe(false);
  });

  test('closes the editor and writes nothing when the record was filtered out', async() => {
    await grid.typeAndConfirm(1, 0, 'bad');
    await grid.expectPending('bad');

    await grid.filterRank('neq', 5);
    await expect(grid.cell(1, 0)).toHaveText('p2');
    expect((await grid.editorState()).waiting).toBe(true);

    await grid.answer('bad', false);

    await expect.poll(async() => {
      const { opened, waiting } = await grid.editorState();

      return { opened, waiting };
    }).toEqual({ opened: false, waiting: false });
    expect(await grid.sourceData()).toEqual(SOURCE);
    await expect(grid.cell(1, 0)).toHaveText('p2');
  });
});

/**
 * Pagination hides the rows of the other pages. A sort while a rejected edit waits can put its record on another
 * page, where no cell of it is on screen, so the editor closes instead of reopening there, and nothing is written.
 */
test.describe('a rejected edit whose record a sort moved to another page', () => {
  let grid: PendingEditFollowsRecordPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PendingEditFollowsRecordPage(page, theme, bundle, false, 3);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('closes the editor and writes nothing', async() => {
    await grid.typeAndConfirm(1, 0, 'bad');
    await grid.expectPending('bad');

    await grid.sortByRank();
    await expect(grid.cell(1, 0)).toHaveText('p3');
    expect((await grid.editorState()).waiting).toBe(true);

    await grid.answer('bad', false);

    await expect.poll(async() => {
      const { opened, waiting } = await grid.editorState();

      return { opened, waiting };
    }).toEqual({ opened: false, waiting: false });
    expect(await grid.sourceData()).toEqual(SOURCE);
  });
});
