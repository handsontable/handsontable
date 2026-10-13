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

  test('keeps an application listener running after the formatter once the filters option is re-sent',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle, DATE_FIXTURE);

      await grid.goto();
      await page.evaluate(() => {
        window.hot.addHook('modifyFiltersMultiSelectValue', (value: string) => `Pre ${value}`);
      });
      await grid.openMenu('Date');

      const before = await grid.listedValues();

      expect(before.map(item => item.label)).toEqual(['Pre 06/15/2002', 'Pre 11/12/2004', 'Pre 01/01/2005']);

      await grid.escapeMenu();
      await grid.updateSettings('{ filters: true }');
      await grid.openMenu('Date');

      expect(await grid.listedValues()).toEqual(before);
    });

  // `locale` alone never reaches `updatePlugin()`: the `filters` re-send on the first line is what
  // rebuilds the component, and the locale change on the second checks the labels still follow it.
  test('keeps the formatted dates when the locale changes after the filters option is re-sent',
    async({ page, theme, bundle }) => {
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
