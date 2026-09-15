import { test, expect } from '../fixtures/test';
import { NumericArrayClassNamePage } from '../fixtures/pages/NumericArrayClassNamePage';

/**
 * DEV-2618, follow-up to GitHub #7427 / DEV-2604. `numericRenderer` aliased the `className` it was
 * handed — `classArr = cellProperties.className as string[]` — and then pushed `htRight` and
 * `htNumeric` into it.
 *
 * A grid-level or column-level array is ONE instance shared by every cell through the cell meta
 * prototype chain, so those classes landed in the user's own array. Every other cell reading
 * `className` through that prototype then picked them up, and a text column sharing the array
 * rendered right-aligned and numeric-styled.
 *
 * No hiding plugin is enabled on any grid in the fixture, so each grid is about the renderer alone.
 * That also matters historically: until DEV-2618, `hiddenRows` and `hiddenColumns` rewrote every
 * array `className` they read into a string, which masked this leak — so it only reproduced without
 * one. They no longer rewrite cells they have no marker on, so they would not mask it today either.
 */
test.describe('numericRenderer with a shared array className', () => {
  let grid: NumericArrayClassNamePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new NumericArrayClassNamePage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('a grid-level array className', () => {
    test('never has the numeric classes pushed into the array the user passed in', async () => {
      expect(await grid.sourceArray(NumericArrayClassNamePage.GRID_LEVEL))
        .toEqual(NumericArrayClassNamePage.USER_CLASSES);
    });

    test('does not leak the numeric classes onto the text column sharing it', async () => {
      // The user-visible defect. Column 1 is `type: 'text'` and never goes through
      // `numericRenderer`, but it reads the same array through the prototype chain.
      const classes = await grid.cellClasses(NumericArrayClassNamePage.GRID_LEVEL, 0, 1);

      expect(classes).toEqual(expect.arrayContaining(NumericArrayClassNamePage.USER_CLASSES));
      expect(classes).not.toContain('htNumeric');
      expect(classes).not.toContain('htRight');
    });

    test('still puts the numeric classes on the numeric column', async () => {
      // The fix must not cost the renderer its actual job.
      const classes = await grid.cellClasses(NumericArrayClassNamePage.GRID_LEVEL, 0, 0);

      expect(classes).toEqual(expect.arrayContaining([
        ...NumericArrayClassNamePage.USER_CLASSES,
        ...NumericArrayClassNamePage.NUMERIC_CLASSES,
      ]));
    });

    test('keeps the source array stable across repeated draws', async () => {
      // An aliasing push is idempotent only by accident — the `indexOf` guards stop the second
      // push. Redrawing pins that the array does not grow at all, rather than growing once.
      await grid.render(NumericArrayClassNamePage.GRID_LEVEL);
      await grid.render(NumericArrayClassNamePage.GRID_LEVEL);

      expect(await grid.sourceArray(NumericArrayClassNamePage.GRID_LEVEL))
        .toEqual(NumericArrayClassNamePage.USER_CLASSES);
      expect(await grid.cellClasses(NumericArrayClassNamePage.GRID_LEVEL, 0, 1))
        .not.toContain('htNumeric');
    });
  });

  test.describe('one array instance shared by two columns', () => {
    test('never has the numeric classes pushed into it', async () => {
      expect(await grid.sourceArray(NumericArrayClassNamePage.COLUMN_LEVEL))
        .toEqual(NumericArrayClassNamePage.USER_CLASSES);
    });

    test('does not leak the numeric classes onto the text column', async () => {
      const classes = await grid.cellClasses(NumericArrayClassNamePage.COLUMN_LEVEL, 0, 1);

      expect(classes).toEqual(expect.arrayContaining(NumericArrayClassNamePage.USER_CLASSES));
      expect(classes).not.toContain('htNumeric');
      expect(classes).not.toContain('htRight');
    });
  });

  test.describe('an alignment class already in the shared array', () => {
    test('is respected instead of being overridden by htRight', async () => {
      const classes = await grid.cellClasses(NumericArrayClassNamePage.ALIGNED, 0, 0);

      expect(classes).toContain('htCenter');
      expect(classes).toContain('htNumeric');
      expect(classes).not.toContain('htRight');
    });

    test('leaves the source array untouched', async () => {
      expect(await grid.sourceArray(NumericArrayClassNamePage.ALIGNED))
        .toEqual(['shared', 'htCenter']);
    });
  });

  test.describe('a plain string className', () => {
    test('renders the numeric classes on the numeric column as it always did', async () => {
      const classes = await grid.cellClasses(NumericArrayClassNamePage.STRING_PATH, 0, 0);

      expect(classes).toEqual(expect.arrayContaining([
        ...NumericArrayClassNamePage.USER_CLASSES,
        ...NumericArrayClassNamePage.NUMERIC_CLASSES,
      ]));
    });

    test('never leaked onto the text column, and still does not', async () => {
      // A string is copied by `split(' ')` under both the old and the new code, so this path was
      // always correct. It is here so a regression in the shared normalize shows up on both forms.
      const classes = await grid.cellClasses(NumericArrayClassNamePage.STRING_PATH, 0, 1);

      expect(classes).toEqual(expect.arrayContaining(NumericArrayClassNamePage.USER_CLASSES));
      expect(classes).not.toContain('htNumeric');
      expect(classes).not.toContain('htRight');
    });
  });
});
