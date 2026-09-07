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
});
