import { test, expect } from '../fixtures/test';
import { CommentsMenuItemsDisabledPage } from '../fixtures/pages/CommentsMenuItemsDisabledPage';

const ENABLED = { disabled: false, ariaDisabled: null };
const DISABLED = { disabled: true, ariaDisabled: 'true' };

/**
 * DEV-263. "Delete comment" stayed enabled on a cell without a comment, and clicking it wrote
 * `comment: undefined` meta to that cell. "Read-only comment" was disabled there, but judged the
 * highlighted cell only, while both items act on every cell of the active range.
 *
 * Both items are now offered while any cell of the active range holds a comment, and disabled when
 * none does. The legacy Jasmine suite covers what the clicks do; nothing covered when they are offered.
 */
test.describe('the comment context menu items are offered only where there is a comment', () => {
  let grid: CommentsMenuItemsDisabledPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CommentsMenuItemsDisabledPage(page, theme, bundle);
    await grid.goto();
  });

  test('offers both items on a cell with a comment', async() => {
    await grid.openMenuOnCell(0, 0);

    expect(await grid.itemState('Delete comment')).toEqual(ENABLED);
    expect(await grid.itemState('Read-only comment')).toEqual(ENABLED);
  });

  test('disables both items on a cell without a comment', async() => {
    await grid.openMenuOnCell(0, 1);

    expect(await grid.itemState('Delete comment')).toEqual(DISABLED);
    expect(await grid.itemState('Read-only comment')).toEqual(DISABLED);
    // The control: an item that does not depend on a comment stays available on the same cell.
    expect(await grid.itemState('Add comment')).toEqual(ENABLED);
  });

  test('offers both items on a range whose highlighted cell has no comment but another cell does', async() => {
    // Highlight (1, 1), no comment; the range reaches (0, 0), which has one.
    await grid.selectRange(1, 1, 0, 0);
    await grid.openMenuWithKeyboard();

    expect(await grid.itemState('Delete comment')).toEqual(ENABLED);
    expect(await grid.itemState('Read-only comment')).toEqual(ENABLED);
  });

  test('disables both items on a range without any comment', async() => {
    await grid.selectRange(5, 0, 5, 5);
    await grid.openMenuWithKeyboard();

    expect(await grid.itemState('Delete comment')).toEqual(DISABLED);
    expect(await grid.itemState('Read-only comment')).toEqual(DISABLED);
  });

  test('judges a column selected from its header by its cells', async() => {
    // Column 3 holds the comment on (1, 3); column 1 has none, and would read it under a row/column swap.
    await grid.openMenuOnColumnHeader(3);

    expect(await grid.itemState('Delete comment')).toEqual(ENABLED);

    await grid.closeMenu();
    await grid.openMenuOnColumnHeader(1);

    expect(await grid.itemState('Delete comment')).toEqual(DISABLED);
  });

  test('judges the active selection layer only, as the clicks act on it alone', async() => {
    // The first layer holds the comment on (0, 0); the active one, (4, 4), has none.
    await grid.selectTwoLayers();
    await grid.openMenuWithKeyboard();

    expect(await grid.itemState('Delete comment')).toEqual(DISABLED);
    expect(await grid.itemState('Read-only comment')).toEqual(DISABLED);
  });

  test('does not count a comment on a cell a merged block hides', async() => {
    await grid.mergeHiddenComment();
    await grid.selectRange(3, 0, 3, 0);
    await grid.openMenuWithKeyboard();

    expect(await grid.itemState('Delete comment')).toEqual(DISABLED);
  });

  test('skips the disabled item on the keyboard', async() => {
    await grid.openMenuOnCell(0, 1);

    expect(await grid.keyboardReaches('Delete comment')).toBe(false);

    await grid.closeMenu();

    // The positive control: the same walk reaches the item on a cell with a comment.
    await grid.openMenuOnCell(0, 0);

    expect(await grid.keyboardReaches('Delete comment')).toBe(true);
  });

  test('ignores a click on the disabled item, so nothing is written to a cell without a comment', async() => {
    const writesBefore = await grid.commentMetaWrites();

    await grid.openMenuOnCell(0, 1);
    // The menu treats a click on a disabled item as passive: it stays open and runs no callback.
    await grid.clickItem('Delete comment');

    expect(await grid.commentMetaWrites()).toEqual(writesBefore);

    await grid.closeMenu();
  });

  test('writes only to the cells that hold a comment when the click deletes a range', async() => {
    // Rows 0 and 1, every column: 12 cells, of which (0, 0) and (1, 3) hold a comment.
    const writesBefore = await grid.commentMetaWrites();

    await grid.selectRange(0, 0, 1, 5);
    await grid.openMenuWithKeyboard();
    await grid.clickItem('Delete comment');

    expect((await grid.commentMetaWrites()).slice(writesBefore.length)).toEqual([[0, 0, null], [1, 3, null]]);
    expect(await grid.commentAt(0, 0)).toBeNull();
    expect(await grid.commentAt(1, 3)).toBeNull();
  });

  test('leaves the comment on a cell a merged block hides, as the item does not count it', async() => {
    await grid.mergeHiddenComment();
    await grid.commentOnMergeAnchor();
    await grid.selectRange(3, 0, 3, 0);
    await grid.openMenuWithKeyboard();
    await grid.clickItem('Delete comment');

    expect(await grid.commentMetaWrites()).toEqual([[3, 0, null]]);
    expect(await grid.commentAt(3, 0)).toBeNull();
    expect(await grid.commentAt(4, 1)).toBe('Hidden note');
  });
});
