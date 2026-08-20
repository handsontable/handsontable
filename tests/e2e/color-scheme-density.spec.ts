import { test, expect } from '../fixtures/test';
import { ColorSchemeDensityPage } from '../fixtures/pages/ColorSchemeDensityPage';

/**
 * `colorScheme` and `density` as plain grid options (DEV-1476).
 *
 * Both are per-instance overrides on top of whatever theme the grid already
 * uses, so no theme has to be declared to switch to dark mode or to tighten the
 * spacing. The checks below read computed styles and rendered box sizes — the
 * result a user actually sees — rather than the CSS text the engine injected.
 */
// Every grid in the fixture renders the engine-driven `main` theme and the fixture always loads
// `ht-theme-main.min.css`, so every leg of the matrix exercises the real specificity scenario. The
// theme axis is therefore redundant here rather than misleading, and the bundle axis is genuine —
// the engine builds its CSS at runtime.
test.describe('colorScheme and density options', () => {
  test('applies colorScheme set at construction time', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    // Grid C is constructed with `colorScheme: 'dark'`; grid B declares nothing.
    expect(await grid.colorSchemeOf('c')).toBe('dark');
    expect(await grid.colorSchemeOf('b')).not.toBe('dark');
  });

  test('applies density set at construction time', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    // Grid C is constructed with `density: 'compact'`, which halves the cell's
    // vertical padding — so its rows must render shorter than the default ones.
    const compactHeight = await grid.cellHeightOf('c');
    const defaultHeight = await grid.cellHeightOf('b');

    expect(compactHeight).toBeLessThan(defaultHeight);
  });

  test('switches colorScheme at runtime through updateSettings', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    const lightBackground = await grid.cellBackgroundOf('a');

    await grid.clickToolbar('set-dark');

    await expect.poll(() => grid.colorSchemeOf('a')).toBe('dark');

    // The theme resolves colors with the CSS `light-dark()` function, so a
    // changed color scheme must change the rendered cell background too.
    expect(await grid.cellBackgroundOf('a')).not.toBe(lightBackground);

    await grid.clickToolbar('set-light');

    await expect.poll(() => grid.colorSchemeOf('a')).toBe('light');
    expect(await grid.cellBackgroundOf('a')).toBe(lightBackground);
  });

  test('switches density at runtime through updateSettings', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    const defaultHeight = await grid.cellHeightOf('a');

    await grid.clickToolbar('set-compact');
    await expect.poll(() => grid.cellHeightOf('a')).toBeLessThan(defaultHeight);

    await grid.clickToolbar('set-comfortable');
    await expect.poll(() => grid.cellHeightOf('a')).toBeGreaterThan(defaultHeight);
  });

  test('clears an override when the option is set back to undefined', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    const defaultHeight = await grid.cellHeightOf('a');

    await grid.clickToolbar('set-dark');
    await grid.clickToolbar('set-compact');
    await expect.poll(() => grid.colorSchemeOf('a')).toBe('dark');

    await grid.clickToolbar('reset-overrides');

    await expect.poll(() => grid.cellHeightOf('a')).toBe(defaultHeight);
    expect(await grid.colorSchemeOf('a')).not.toBe('dark');
  });

  test('does not leak an override to another grid sharing the same theme', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    const controlBackground = await grid.cellBackgroundOf('b');
    const controlHeight = await grid.cellHeightOf('b');

    await grid.clickToolbar('set-dark');
    await grid.clickToolbar('set-compact');
    await expect.poll(() => grid.colorSchemeOf('a')).toBe('dark');

    // Grid B shares the one registered `main` theme object with grid A. If the
    // override mutated that theme, or if its CSS rule were not scoped to grid
    // A's instance, grid B would flip to dark and compact along with it.
    expect(await grid.colorSchemeOf('b')).not.toBe('dark');
    expect(await grid.cellBackgroundOf('b')).toBe(controlBackground);
    expect(await grid.cellHeightOf('b')).toBe(controlHeight);
  });

  test('can change an override that was set at construction time', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    // Grid C is built with `colorScheme: 'dark'` and `density: 'compact'`.
    expect(await grid.colorSchemeOf('c')).toBe('dark');

    const compactHeight = await grid.cellHeightOf('c');

    await grid.clickToolbar('c-set-light');

    // Core builds a ThemeManager twice during startup. While the first one was left in the DOM its
    // <style> node sat later in source order at the same specificity, so its construction-time
    // rules beat everything the live manager wrote afterwards and this change did nothing.
    await expect.poll(() => grid.colorSchemeOf('c')).toBe('light');
    expect(await grid.cellHeightOf('c')).toBeGreaterThan(compactHeight);
  });

  test('leaves one theme style node per grid', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    // Two nodes would mean an orphaned ThemeManager is still holding stale override rules.
    expect(await grid.themeStyleNodeCountOf('a')).toBe(1);
    expect(await grid.themeStyleNodeCountOf('c')).toBe(1);
  });

  test('clears an override that was set at construction time', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    await grid.clickToolbar('c-reset');

    // Falls back to the theme values, which is what the control grid already renders.
    await expect.poll(() => grid.colorSchemeOf('c')).toBe(await grid.colorSchemeOf('b'));
    expect(await grid.cellHeightOf('c')).toBe(await grid.cellHeightOf('b'));
  });

  test('keeps the overrides when the theme engine is rebuilt', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    await grid.clickToolbar('set-dark');
    await grid.clickToolbar('set-compact');
    await expect.poll(() => grid.colorSchemeOf('a')).toBe('dark');

    const darkCompactHeight = await grid.cellHeightOf('a');

    // Switching to a class-named theme tears the theme engine down, and switching back to a
    // theme object builds a new ThemeManager. The options are still set on the grid, so the
    // rebuilt manager has to pick them up again instead of starting empty.
    await grid.clickToolbar('theme-as-class');
    await grid.clickToolbar('theme-as-object');

    await expect.poll(() => grid.colorSchemeOf('a')).toBe('dark');
    expect(await grid.cellHeightOf('a')).toBe(darkCompactHeight);
  });

  test('warns once, and only for a real value, when the theme engine is not active', async({
    page, theme, bundle,
  }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);
    const warnings = grid.collectWarnings();
    const engineWarnings = () => warnings.filter(text => text.includes('require the theme engine'));

    await grid.goto();

    // Grid D takes its theme from a CSS class name, so it has no ThemeManager.
    expect(engineWarnings()).toHaveLength(0);

    // Clearing the options is documented, and a framework wrapper re-sends every prop on each
    // render. Neither should produce a warning for a grid that never asked for these options.
    await grid.clickToolbar('d-reset');
    await grid.clickToolbar('d-reset');

    expect(engineWarnings()).toHaveLength(0);

    // Asking for a real value is worth one notice — and only one.
    await grid.clickToolbar('d-set-dark');
    await expect.poll(() => engineWarnings().length).toBe(1);

    await grid.clickToolbar('d-set-dark');
    await grid.clickToolbar('d-set-dark');

    expect(engineWarnings()).toHaveLength(1);
  });

  test('applies the colorScheme to menus rendered in the grid portal', async({ page, theme, bundle }) => {
    const grid = new ColorSchemeDensityPage(page, theme, bundle);

    await grid.goto();

    await grid.clickToolbar('set-dark');
    await expect.poll(() => grid.colorSchemeOf('a')).toBe('dark');

    // Menus live in the portal element, which core appends to `document.body`.
    // Stamping the scope class only on the wrapper would leave a light menu on a
    // dark grid.
    const darkMenu = await grid.openContextMenu('a');

    expect(await darkMenu.evaluate(el => getComputedStyle(el).colorScheme)).toBe('dark');

    await grid.closeContextMenu();

    const controlMenu = await grid.openContextMenu('b');

    expect(await controlMenu.evaluate(el => getComputedStyle(el).colorScheme)).not.toBe('dark');
  });
});
