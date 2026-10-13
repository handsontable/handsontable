import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

const DATE_FIXTURE = 'filters-date-value-list-rerender.html';
const FORMATTED_DATES = [
  { checked: true, label: '06/15/2002' },
  { checked: true, label: '11/12/2004' },
  { checked: true, label: '01/01/2005' },
];

/**
 * Regression coverage for DEV-3383.
 *
 * Every time the Filters plugin was enabled it built a new value component, and that component
 * registered a `modifyFiltersMultiSelectValue` listener on the grid that nothing removed. After
 * `updateSettings()` carried the `filters` key (the React and Angular wrappers send it on every
 * update) the grid held two listeners, and the second one ran the date formatter on the label the
 * first had already formatted. A formatted date is not an ISO string, so every label read
 * `#bad-value#`.
 */
test.describe('Filters — date Filter-by-value display after a settings update', () => {
  test('lists the formatted dates on the first opening', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, DATE_FIXTURE);

    await grid.goto();
    await grid.openMenu('Date');

    expect(await grid.listedValues()).toEqual(FORMATTED_DATES);
  });

  test('keeps the formatted dates after the filters option is re-sent', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, DATE_FIXTURE);

    await grid.goto();
    await grid.updateSettings('{ filters: true }');
    await grid.updateSettings('{ filters: true }');
    await grid.openMenu('Date');

    expect(await grid.listedValues()).toEqual(FORMATTED_DATES);
  });

  test('keeps the formatted dates after the locale changes', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, DATE_FIXTURE);

    await grid.goto();
    await grid.updateSettings('{ filters: true }');
    await grid.setLocale('de-DE');
    await grid.openMenu('Date');

    expect(await grid.listedValues()).toEqual([
      { checked: true, label: '15.06.2002' },
      { checked: true, label: '12.11.2004' },
      { checked: true, label: '01.01.2005' },
    ]);
  });
});
