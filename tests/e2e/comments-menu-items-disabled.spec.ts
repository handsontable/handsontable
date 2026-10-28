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
    await grid.selectRange(1, 0, 1, 5);
    await grid.openMenuWithKeyboard();

    expect(await grid.itemState('Delete comment')).toEqual(DISABLED);
    expect(await grid.itemState('Read-only comment')).toEqual(DISABLED);
  });

  test('judges a column selected from its header by its cells', async() => {
    // Column 2 holds the comment on (2, 2).
    await grid.openMenuOnColumnHeader(2);

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

  test('skips the disabled item on the keyboard, so nothing is written to a cell without a comment', async() => {
    const writesBefore = await grid.commentMetaWrites();

    await grid.openMenuOnCell(0, 1);

    expect(await grid.keyboardReaches('Delete comment')).toBe(false);

    await grid.closeMenu();

    // The positive control: the same walk reaches the item on a cell with a comment.
    await grid.openMenuOnCell(0, 0);

    expect(await grid.keyboardReaches('Delete comment')).toBe(true);

    await grid.closeMenu();

    expect(await grid.commentMetaWrites()).toEqual(writesBefore);
  });
});
