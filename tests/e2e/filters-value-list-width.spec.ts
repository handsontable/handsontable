import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

const WIDTH_FIXTURE = 'filters-value-list-width.html';
/**
 * How far a measured label's text runs past its cell on each theme. On `horizon` the ghost table the
 * width is measured in lays the label out 4px narrower than the list renders it, so the last 4px are
 * clipped; `develop` clipped them the same way before this list measured itself, so it is pinned here
 * rather than fixed. An unmeasured or undersized column clips far more (30px and up).
 */
const MEASURED_TEXT_OVERFLOW: Record<string, number> = { main: 0, horizon: 4, classic: 0 };

/**
 * The "filter by value" list is a nested one-column grid. Its column is as wide as the widest label it
 * lists, so a label too long for the box gets a horizontal scroll, and when every label fits it is as
 * wide as the box.
 *
 * The list used to get that width from AutoColumnSize, which read every listed value's cell meta and
 * data and ran `modifyAutoColumnSizeSeed` for it each time the list got data, only to pick the few
 * labels it then measured. The list now picks the same labels from its own items, and measures again
 * only when its rows change. The ghost tables inserted into the list count the measurements.
 *
 * The width is theme-dependent (the checkbox, the label gap and the cell padding), so the spec runs on
 * every theme and compares the column with the box and the label with its cell, never with a number.
 * The label is as wide as its cell and does not wrap, so "fits" is read from the label's text against
 * the cell that clips it: a column too narrow clips the text without moving the label's edge.
 */
test.describe('Filters — "filter by value" list width', { tag: THEMES_TAG }, () => {
  test('sizes the list without the per-cell AutoColumnSize walk', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

    await grid.goto('rows=2000');
    await grid.openMenu('Name');

    // The positive control: the same listener counts the outer grid's AutoColumnSize sweep.
    expect(await grid.gridSeedCalls()).toBeGreaterThan(0);
    expect(await grid.listSeedCalls()).toBe(0);
  });

  test('is as wide as the box when every label fits', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

    await grid.goto();
    await grid.openMenu('Name');

    const { column, box, scroll } = await grid.listWidth();

    expect(column).toBe(box);
    expect(scroll).toBe(box);
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`fits a long label that is not rendered when the menu opens (${dir})`, async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

      await grid.goto(`long=last&dir=${dir}`);
      await grid.openMenu('Name');

      const { column, box, scroll } = await grid.listWidth();

      expect(column).toBeGreaterThan(box);
      expect(scroll).toBeGreaterThan(box);

      expect(await grid.labelTextOverflow('Zz', { scrollTo: 'end', dir }))
        .toBeLessThanOrEqual(MEASURED_TEXT_OVERFLOW[theme]);
    });
  }

  test('fits a label that is much longer than its value', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

    // `modifyFiltersMultiSelectValue` gives one short value a long label. Every value has the same
    // length, so a width taken from the values instead of the labels would stay at the box.
    await grid.goto('relabel=long');
    await grid.openMenu('Name');

    const { column, box } = await grid.listWidth();

    expect(column).toBeGreaterThan(box);

    expect(await grid.labelTextOverflow('Rr', { scrollTo: 'start', dir: 'ltr' }))
      .toBeLessThanOrEqual(MEASURED_TEXT_OVERFLOW[theme]);
  });

  for (const searchMode of ['show', 'apply']) {
    test(`narrows back to the box when a search hides the long label (searchMode: ${searchMode})`,
      async({ page, theme, bundle }) => {
        const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

        await grid.goto(`long=last&searchMode=${searchMode}`);
        await grid.openMenu('Name');

        const opened = await grid.listWidth();

        expect(opened.column).toBeGreaterThan(opened.box);

        await grid.searchValues('Value 0');

        await expect.poll(async() => {
          const { column, box } = await grid.listWidth();

          return column - box;
        }).toBe(0);

        await grid.searchValues('');

        await expect.poll(async() => {
          const { column, box } = await grid.listWidth();

          return column > box;
        }).toBe(true);
      });
  }

  for (const searchMode of ['show', 'apply']) {
    test(`narrows back to the box when a search matches nothing (searchMode: ${searchMode})`,
      async({ page, theme, bundle }) => {
        const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

        await grid.goto(`long=last&searchMode=${searchMode}`);
        await grid.openMenu('Name');

        const opened = await grid.listWidth();

        expect(opened.column).toBeGreaterThan(opened.box);

        await grid.searchValues('nothing matches this');

        await expect.poll(async() => {
          const { scroll, box } = await grid.listWidth();

          return scroll - box;
        }).toBe(0);
      });
  }

  test('does not measure again while a search keeps every row listed (searchMode: apply)',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

      await grid.goto('long=last&searchMode=apply');
      await grid.openMenu('Name');

      const measurements = await grid.listGhostTables();

      // Every listed value contains an "a", so each keystroke hides and shows no row.
      await grid.searchValues('a');
      await grid.searchValues('');

      expect(await grid.listGhostTables()).toBe(measurements);
    });

  test('measures the long label again when a column searched in apply mode is reopened',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

      await grid.goto('long=last&searchMode=apply');
      await grid.openMenu('Name');
      await grid.searchValues('Value 0');
      await expect.poll(async() => {
        const { column, box } = await grid.listWidth();

        return column - box;
      }).toBe(0);
      await grid.confirmMenu();

      // The reopened list holds every value again, the long one included.
      await grid.openMenuWithKeyboard(0, 0);
      await expect.poll(async() => {
        const { column, box } = await grid.listWidth();

        return column > box;
      }).toBe(true);
      expect(await grid.labelTextOverflow('Zz', { scrollTo: 'end', dir: 'ltr' }))
        .toBeLessThanOrEqual(MEASURED_TEXT_OVERFLOW[theme]);
    });

  test('measures a value added while the menu was closed, once it opens again', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

    await grid.goto();
    await grid.openMenuWithKeyboard(0, 0);
    await grid.escapeMenu();

    const measurements = await grid.listGhostTables();

    // The keyboard path keeps the list alive while the menu is closed.
    await grid.setCellValue(1, 0, 'Zz a value written while the menu was closed, too long for the list');

    // A closed menu measures nothing: the list gets the new value, and measures it, when it opens again.
    expect(await grid.listGhostTables()).toBe(measurements);

    await grid.openMenuWithKeyboard(0, 0);
    await expect.poll(async() => {
      const { column, box } = await grid.listWidth();

      return column > box;
    }).toBe(true);
  });

  test('sizes each column\'s list on its own when the menus are opened by click', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

    await grid.goto('long=last');
    await grid.openMenu('Name');

    const wide = await grid.listWidth();

    expect(wide.column).toBeGreaterThan(wide.box);

    await grid.escapeMenu();
    await grid.openMenu('City');

    const narrow = await grid.listWidth();

    expect(narrow.column).toBe(narrow.box);
    expect(narrow.scroll).toBe(narrow.box);
  });

  test('measures again when a web font loads while the menu is open', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

    await grid.goto('long=last&font=late');
    await grid.openMenu('Name');

    const before = await grid.listWidth();

    expect(before.column).toBeGreaterThan(before.box);

    await grid.loadLateFont();

    // The font doubles the labels' size, so the column has to grow with it, and the long label still fits.
    await expect.poll(async() => (await grid.listWidth()).column).toBeGreaterThan(before.column);
    expect(await grid.labelTextOverflow('Zz', { scrollTo: 'end', dir: 'ltr' }))
      .toBeLessThanOrEqual(MEASURED_TEXT_OVERFLOW[theme]);
  });

  test('measures once per opening', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

    await grid.goto('long=last');

    // Every menu render hands the list the same items again (`update()`), which must not measure.
    await grid.openMenu('Name');
    expect(await grid.listGhostTables()).toBe(1);
    await grid.escapeMenu();

    // A reopen loads the list's items anew, so it measures once more.
    await grid.openMenuWithKeyboard(0, 0);
    expect(await grid.listGhostTables()).toBe(2);
  });

  test('does not measure again when only the checkboxes change', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

    await grid.goto('long=last');
    await grid.openMenu('Name');

    const measurements = await grid.listGhostTables();
    const before = await grid.listWidth();

    // The positive control: the list was measured when it got its rows.
    expect(measurements).toBeGreaterThan(0);

    await grid.uncheckValue('Value 0001');
    await grid.clearAllValues();
    await grid.selectAllValues();

    expect(await grid.listGhostTables()).toBe(measurements);
    expect(await grid.listWidth()).toEqual(before);
  });

  test('follows the column when the menu is reopened from the keyboard', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, WIDTH_FIXTURE);

    await grid.goto('long=last');

    // The keyboard path keeps the list instance alive across openings, so its width has to follow the
    // rows it gets, in both directions.
    await grid.openMenuWithKeyboard(0, 0);
    await expect.poll(async() => {
      const { column, box } = await grid.listWidth();

      return column > box;
    }).toBe(true);
    await grid.escapeMenu();

    await grid.openMenuWithKeyboard(0, 1);
    await expect.poll(async() => {
      const { column, box } = await grid.listWidth();

      return column - box;
    }).toBe(0);
    await grid.escapeMenu();

    await grid.openMenuWithKeyboard(0, 0);
    await expect.poll(async() => {
      const { column, box } = await grid.listWidth();

      return column > box;
    }).toBe(true);
  });
});
