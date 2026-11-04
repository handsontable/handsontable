import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { NestedGridInjectCoreCssPage, type NestedGridSurface } from '../fixtures/pages/NestedGridInjectCoreCssPage';

/**
 * The grids Handsontable builds inside editors and menus are Handsontable instances of their own,
 * each with a `StylesHandler` that reads `injectCoreCss` from its own settings. They must take the
 * parent grid's value: otherwise a page that loads the core CSS itself and sets
 * `injectCoreCss: false` still gets a full copy of the core stylesheet on the first open.
 *
 * Each surface runs on a page of its own, because the stylesheet is injected at most once per
 * document: on a shared page the first surface's injection would hide the next one's.
 */
const SURFACES: NestedGridSurface[] = ['editor', 'contextMenu', 'dropdownMenu'];

test.describe('nested grids follow the parent grid\'s injectCoreCss', { tag: BUNDLES_TAG }, () => {
  let grid: NestedGridInjectCoreCssPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new NestedGridInjectCoreCssPage(page, theme, bundle);
  });

  test('the dropdown, autocomplete and handsontable editor lists inject no core stylesheet', async () => {
    await grid.goto('editor');
    expect(await grid.injectedCoreStylesCount()).toBe(0);

    // The three editor types share one build site; each is opened in turn so a later split of them stays covered.
    for (const col of [0, 1, 2]) {
      await grid.openListEditor(0, col);
      expect(await grid.injectedCoreStylesCount()).toBe(0);
      await grid.closeEditor();
    }
  });

  test('the context menu and its submenu inject no core stylesheet', async () => {
    await grid.goto('contextMenu');
    expect(await grid.injectedCoreStylesCount()).toBe(0);

    await grid.openContextMenuWithSubmenu(0, 3);

    expect(await grid.injectedCoreStylesCount()).toBe(0);
  });

  test('the dropdown menu and its Filters value list inject no core stylesheet', async () => {
    await grid.goto('dropdownMenu');
    expect(await grid.injectedCoreStylesCount()).toBe(0);

    await grid.openDropdownMenuWithValueList(0);

    expect(await grid.injectedCoreStylesCount()).toBe(0);
  });

  // With the default value the grid injects the stylesheet as before, and a nested grid adds no second
  // copy. These are controls for the locator and the unchanged default, not for the fix: the injection
  // dedupes by element id, so they pass without it too.
  for (const surface of SURFACES) {
    test(`with the default injectCoreCss, the ${surface} keeps the single injected stylesheet`, async () => {
      await grid.goto(surface, 'default');
      expect(await grid.injectedCoreStylesCount()).toBe(1);

      await grid.openNestedGrid(surface);

      expect(await grid.injectedCoreStylesCount()).toBe(1);
    });
  }
});
