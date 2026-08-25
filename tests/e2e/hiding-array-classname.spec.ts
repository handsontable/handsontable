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
    // `goto()` already fails the whole describe if any grid's constructor threw, and it reports the
    // thrown message — so these render checks assert the visible outcome, not the absence of an
    // error. The issue's own fiddle is ROWS_NONE: `.split` on the array threw and left it blank.
    test('builds the grid when nothing is hidden', async () => {
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
      await expect(grid.cell(HidingArrayClassNamePage.COLS_NONE, 0, 0)).toBeVisible();
    });

    test('leaves the cell meta usable by addClass', async () => {
      const className = await grid.cellMetaClassName(HidingArrayClassNamePage.COLS_HIDDEN, 0, 1);
      const tokens = Array.isArray(className) ? className : String(className).split(' ');

      expect(tokens).toEqual(expect.arrayContaining([
        ...HidingArrayClassNamePage.USER_CLASSES,
        'afterHiddenColumn',
      ]));
      expect(tokens).not.toContain('test,test2');
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

  test.describe('a grid-level array className', () => {
    test('never has the marker pushed into the array the user passed in', async () => {
      // One array instance is shared by every cell through the meta prototype chain, so pushing
      // into it rather than into a copy would leak `afterHiddenRow` onto the whole grid.
      expect(await grid.gridLevelSourceArray()).toEqual(HidingArrayClassNamePage.USER_CLASSES);
    });

    test('still marks the row after the hidden one', async () => {
      const classes = await grid.cellClasses(HidingArrayClassNamePage.GRID_LEVEL, 1, 0);

      expect(classes).toEqual(expect.arrayContaining([
        ...HidingArrayClassNamePage.USER_CLASSES,
        'afterHiddenRow',
      ]));
    });

    test('normalizes the array to a string on the cells it touches', async () => {
      // An array always differs from its normalized string, so every cell this hook reads does get
      // its own `className`. That is the cost of normalizing, and it is why the array is copied
      // rather than pushed into — see the test above.
      expect(await grid.hasOwnClassName(HidingArrayClassNamePage.GRID_LEVEL, 2, 0)).toBe(true);
      expect(await grid.cellClasses(HidingArrayClassNamePage.GRID_LEVEL, 2, 0))
        .toEqual(expect.arrayContaining(HidingArrayClassNamePage.USER_CLASSES));
    });
  });

  test.describe('both hiding plugins on one grid', () => {
    test('carries both markers alongside the user classes', async () => {
      const classes = await grid.cellClasses(HidingArrayClassNamePage.BOTH_PLUGINS, 1, 1);

      expect(classes).toEqual(expect.arrayContaining([
        ...HidingArrayClassNamePage.USER_CLASSES,
        'afterHiddenRow',
        'afterHiddenColumn',
      ]));
      expect(classes).not.toContain('test,test2');
    });

    test('strips only its own marker when the row is shown again', async () => {
      await grid.showRows(HidingArrayClassNamePage.BOTH_PLUGINS, [0]);

      const classes = await grid.cellClasses(HidingArrayClassNamePage.BOTH_PLUGINS, 1, 1);

      expect(classes).toContain('afterHiddenColumn');
      expect(classes).not.toContain('afterHiddenRow');
      expect(classes).toEqual(expect.arrayContaining(HidingArrayClassNamePage.USER_CLASSES));
    });
  });

  test.describe('a user class containing the marker name', () => {
    test('still gets the marker added', async () => {
      // `afterHiddenRowHighlight` contains `afterHiddenRow`. The old substring check read that as
      // "marker already present" and skipped it, so the cell lost its `afterHiddenRow` styling.
      const classes = await grid.cellClasses(HidingArrayClassNamePage.SUBSTRING, 1, 0);

      expect(classes).toContain('afterHiddenRowHighlight');
      expect(classes).toContain('afterHiddenRow');
    });

    test('keeps the lookalike class when the row is shown again', async () => {
      await grid.showRows(HidingArrayClassNamePage.SUBSTRING, [0]);

      const classes = await grid.cellClasses(HidingArrayClassNamePage.SUBSTRING, 1, 0);

      expect(classes).toContain('afterHiddenRowHighlight');
      expect(classes).not.toContain('afterHiddenRow');
    });
  });

  test.describe('a plain string className', () => {
    test('renders the same classes it always did', async () => {
      const classes = await grid.cellClasses(HidingArrayClassNamePage.STRING_PATH, 1, 0);

      expect(classes).toEqual(['afterHiddenRow', ...HidingArrayClassNamePage.USER_CLASSES].sort());
    });

    test('leaves the cascade intact on rows it does not mark', async () => {
      // The write-on-change guard. Row 2 needs no marker and its class string is already canonical,
      // so the plugin must write nothing. An unconditional assignment would put an own `className`
      // on the meta, shadowing the grid-level value and stopping it from cascading. The rendered
      // classes are identical either way, so the meta is the only place this shows.
      expect(await grid.hasOwnClassName(HidingArrayClassNamePage.STRING_PATH, 2, 0)).toBe(false);
      expect(await grid.cellClasses(HidingArrayClassNamePage.STRING_PATH, 2, 0))
        .toEqual(HidingArrayClassNamePage.USER_CLASSES);
    });
  });
});
