import { test, expect } from '../fixtures/test';
import { HidingArrayClassNamePage } from '../fixtures/pages/HidingArrayClassNamePage';

/**
 * GitHub #7427 / DEV-2604. `className` is publicly typed `string | string[]` and `addClass()`
 * takes both, but `hiddenRows` and `hiddenColumns` cast it to a string inside `afterGetCellMeta`.
 * That produced two distinct failures, and a fix for either one alone leaves the other standing:
 *
 *   - `className.split(' ')` threw on an array, inside a render hook, so the grid rendered nothing.
 *     Enabling the plugin was enough — no row or column had to be hidden.
 *   - `className += ' afterHiddenRow'` coerced the array through `Array#toString`, collapsing
 *     `['test', 'test2']` into one bogus `test,test2` class token. Silent: no error, the user's
 *     CSS simply stopped matching.
 */
test.describe('hiding plugins with an array className', () => {
  let grid: HidingArrayClassNamePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new HidingArrayClassNamePage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('hiddenRows', () => {
    test('builds the grid when nothing is hidden', async () => {
      // The issue's own fiddle. `.split` on the array threw here and left the table blank.
      expect(await grid.initError(HidingArrayClassNamePage.ROWS_NONE)).toBeNull();
      await expect(grid.cell(HidingArrayClassNamePage.ROWS_NONE, 0, 0)).toBeVisible();
    });

    test('puts both array entries on the cell as separate classes', async () => {
      const classes = await grid.cellClasses(HidingArrayClassNamePage.ROWS_NONE, 0, 0);

      expect(classes).toEqual(expect.arrayContaining(HidingArrayClassNamePage.USER_CLASSES));
      expect(classes).not.toContain('test,test2');
    });

    test('keeps both classes alongside the marker on the row after a hidden row', async () => {
      // The silent defect: this cell used to read `test,test2 afterHiddenRow`. Asserted as tokens,
      // because a substring check on the class attribute accepts the corrupted form too.
      const classes = await grid.cellClasses(HidingArrayClassNamePage.ROWS_HIDDEN, 1, 0);

      expect(classes).toEqual(expect.arrayContaining([
        ...HidingArrayClassNamePage.USER_CLASSES,
        'afterHiddenRow',
      ]));
      expect(classes).not.toContain('test,test2');
    });

    test('drops only the marker when the row is shown again', async () => {
      await grid.showRows(HidingArrayClassNamePage.ROWS_HIDDEN, [0]);

      const classes = await grid.cellClasses(HidingArrayClassNamePage.ROWS_HIDDEN, 1, 0);

      expect(classes).toEqual(expect.arrayContaining(HidingArrayClassNamePage.USER_CLASSES));
      expect(classes).not.toContain('afterHiddenRow');
    });

    test('leaves the cell meta usable by addClass', async () => {
      // The plugin writes its result back into the user's cell meta. Whatever shape it settles on
      // must still be something `addClass()` accepts, and must not carry the merged token.
      const className = await grid.cellMetaClassName(HidingArrayClassNamePage.ROWS_NONE, 0, 0);
      const tokens = Array.isArray(className) ? className : String(className).split(' ');

      expect(tokens).toEqual(expect.arrayContaining(HidingArrayClassNamePage.USER_CLASSES));
      expect(tokens).not.toContain('test,test2');
    });
  });

  test.describe('hiddenColumns', () => {
    test('builds the grid when nothing is hidden', async () => {
      expect(await grid.initError(HidingArrayClassNamePage.COLS_NONE)).toBeNull();
      await expect(grid.cell(HidingArrayClassNamePage.COLS_NONE, 0, 0)).toBeVisible();
    });

    test('puts both array entries on the cell as separate classes', async () => {
      const classes = await grid.cellClasses(HidingArrayClassNamePage.COLS_NONE, 0, 0);

      expect(classes).toEqual(expect.arrayContaining(HidingArrayClassNamePage.USER_CLASSES));
      expect(classes).not.toContain('test,test2');
    });

    test('keeps both classes alongside the marker on the column after a hidden column', async () => {
      const classes = await grid.cellClasses(HidingArrayClassNamePage.COLS_HIDDEN, 0, 1);

      expect(classes).toEqual(expect.arrayContaining([
        ...HidingArrayClassNamePage.USER_CLASSES,
        'afterHiddenColumn',
      ]));
      expect(classes).not.toContain('test,test2');
    });

    test('drops only the marker when the column is shown again', async () => {
      await grid.showColumns(HidingArrayClassNamePage.COLS_HIDDEN, [0]);

      const classes = await grid.cellClasses(HidingArrayClassNamePage.COLS_HIDDEN, 0, 1);

      expect(classes).toEqual(expect.arrayContaining(HidingArrayClassNamePage.USER_CLASSES));
      expect(classes).not.toContain('afterHiddenColumn');
    });
  });
});
