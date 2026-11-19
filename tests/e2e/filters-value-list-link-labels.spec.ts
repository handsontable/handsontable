import { test, expect, THEMES_TAG } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

/**
 * The two links above the "filter by value" list sit in one row. A long translation used to run
 * past the menu's right edge and get clipped, because the row inherited `white-space: nowrap` from
 * the menu, so the second link could never move to a new line. How far a label runs over depends on
 * the theme's paddings, so the spec runs on every theme.
 */
const LONG_LABELS = [
  { locale: 'es-MX', selectAll: 'Seleccionar todo', clear: 'Deseleccionar todo' },
  { locale: 'pl-PL', selectAll: 'Zaznacz wszystko', clear: 'Odznacz wszystko' },
  { locale: 'de-DE', selectAll: 'Alles auswählen', clear: 'Auswahl aufheben' },
];

test.describe('Filters — links above the "filter by value" list', { tag: THEMES_TAG }, () => {
  for (const { locale, selectAll, clear } of LONG_LABELS) {
    test(`keep inside their row with the ${locale} labels`, async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle);

      await grid.goto();
      await grid.useLinkLabels(`x-${locale}`, selectAll, clear);
      await grid.openMenu('Name');

      await expect(grid.valueActionLinks).toHaveText([selectAll, clear]);
      await expect.poll(() => grid.clearLinkOverflow()).toBeLessThanOrEqual(0);
    });
  }
});
