import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

const LOCALE_FIXTURE = 'filters-value-list-locale.html';

/**
 * Regression coverage for DEV-2666.
 *
 * The value list's search box lowercases both the term and every listed value with the column's
 * locale, so on a `tr-TR` grid `inanç` has to match `Furkan İnanç`: Turkish lowercases `İ`
 * (U+0130) to a plain `i`, while the default locale turns it into an `i` followed by a combining
 * dot above (U+0069 U+0307), which `inanç` no longer contains. That makes the lowercase term the
 * one probe that tells the two locales apart — `İnanç` matches under both and proves nothing.
 *
 * Confirming the menu used to lose that locale. `ValueComponent.getState()` returned no `locale`
 * key, and `saveState()` REPLACES the column's state entry rather than merging into it, so the
 * locale `updateState()` had just stored was overwritten with `undefined`. The next opening
 * restored that entry and the search fell back to the default locale.
 */
test.describe('Filters — "filter by value" locale-aware search', () => {
  // Pin the browser's locale. When the search box loses the column's locale it falls back to the
  // HOST default, so on a Turkish, Azeri or Lithuanian machine the broken path lowercases `İ` the
  // same way the fixed one does and every assertion below passes against unfixed code.
  test.use({ locale: 'en-US' });

  test('searches with the column locale on the first opening', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, LOCALE_FIXTURE);

    await grid.goto();
    await grid.openMenu('Name');
    await grid.searchValues('inanç');

    await expect(grid.valueLabels).toHaveText(['Furkan İnanç']);
  });

  test('keeps searching with the column locale after the list was confirmed',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle, LOCALE_FIXTURE);

      await grid.goto();

      // Unchecking a value is what makes the column carry a `by_value` condition, and only a
      // column carrying one restores its state from the map on the next opening. With every value
      // still checked the component resets instead, and the reset reads the locale straight from
      // the column meta - so a confirmation that changed nothing would hide the defect.
      //
      // Which value is unchecked does not matter, so take the second one - see `uncheckValue()`
      // for why a row further down the list cannot be pressed reliably.
      await grid.openMenu('Name');
      await grid.uncheckValue('Abubekir Kılıç');
      await grid.confirmMenu();

      await expect(grid.columnCells(0)).toHaveText([
        'Abdulhamit Akkaya',
        'Furkan İnanç',
        'Halil İbrahim Öztürk',
        'Kaan Yerli',
        'Ömer Emin Sarıkoç',
      ]);

      await grid.openMenu('Name');
      await grid.searchValues('inanç');

      await expect(grid.valueLabels).toHaveText(['Furkan İnanç']);
    });

  // This one guards the WRONG fix rather than the original bug. Re-supplying the locale from
  // `getState()` also makes the test above pass, but `getState()`'s only source is the select that
  // `setState()` had just loaded from the stored value — so the column would be pinned to the
  // locale it carried when the filter was first confirmed. It fails against that fix and passes
  // against the original bug, where the locale was always absent; the pair pins both sides.
  test('follows the column locale when it changes while the filter is applied',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle, LOCALE_FIXTURE);

      await grid.goto();

      await grid.openMenu('Name');
      await grid.uncheckValue('Abubekir Kılıç');
      await grid.confirmMenu();

      // `locale` is not one of the Filters plugin's `SETTING_KEYS`, so this never reaches
      // `updatePlugin()` and the saved component state survives the call.
      await grid.setLocale('en-US');

      // Under `en-US`, `İ` lowercases to an `i` followed by a combining dot above, which `inanç`
      // does not contain - so the search must now match nothing. A stored locale that outlives the
      // column's own is exactly what makes this list keep answering in Turkish.
      await grid.openMenu('Name');
      await grid.searchValues('inanç');

      await expect(grid.valueLabels).toHaveCount(0);
    });
});
