import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the `colorScheme` / `density` fixture (DEV-1476).
 *
 * The fixture hosts three grids that all share the default registered `main`
 * theme: grid `a` receives overrides at runtime, grid `b` is the untouched
 * control that proves the overrides do not leak between instances, and grid `c`
 * sets both options at construction time.
 *
 * Selectors are `data-testid` hooks stamped by the fixture. The assertions read
 * computed styles and box sizes rather than the injected CSS text, because what
 * matters to a user is the rendered result, not the stylesheet that produced it.
 */
export class ColorSchemeDensityPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait until all three grids have rendered.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/color-scheme-density.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    for (const grid of ['a', 'b', 'c']) {
      await expect(this.cell(grid, 0, 0)).toBeVisible();
    }
  }

  /** A single data cell of the given grid, by visual row/column. */
  cell(grid: string, row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${grid}-${row}-${col}`);
  }

  /**
   * The root wrapper of a grid — the element core stamps the theme class and the
   * per-instance override scope class on.
   */
  wrapper(grid: string): Locator {
    return this.page.getByTestId(`grid-${grid}`).locator('.ht-root-wrapper');
  }

  /**
   * Open a grid's context menu and return its root element.
   *
   * Menus render inside the grid's portal element, which core appends to
   * `document.body` rather than to the container — so the menu is the reachable
   * proof that the portal follows the same overrides as the grid itself.
   * `color-scheme` is an inherited CSS property, so the menu resolves whatever
   * the portal declares.
   */
  async openContextMenu(grid: string, row = 0, col = 0): Promise<Locator> {
    await this.cell(grid, row, col).click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu.handsontable').locator('visible=true');

    await expect(menu).toBeVisible();

    return menu;
  }

  /** Close an open context menu. */
  async closeContextMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.page.locator('.htContextMenu.handsontable').locator('visible=true'))
      .toHaveCount(0);
  }

  /** The resolved CSS `color-scheme` of a grid's wrapper. */
  async colorSchemeOf(grid: string): Promise<string> {
    return this.wrapper(grid).evaluate(el => getComputedStyle(el).colorScheme);
  }

  /** The resolved background color of a cell, as the browser reports it. */
  async cellBackgroundOf(grid: string, row = 0, col = 0): Promise<string> {
    return this.cell(grid, row, col).evaluate(el => getComputedStyle(el).backgroundColor);
  }

  /**
   * The rendered height of a cell in CSS pixels. Density changes the cell
   * padding, so this is the user-visible effect of a density override.
   */
  async cellHeightOf(grid: string, row = 0, col = 0): Promise<number> {
    const box = await this.cell(grid, row, col).boundingBox();

    if (!box) {
      throw new Error(`Cell ${row},${col} of grid "${grid}" has no box.`);
    }

    return box.height;
  }

  /** The value of a CSS custom property resolved on a grid's wrapper. */
  async cssVariableOf(grid: string, name: string): Promise<string> {
    return this.wrapper(grid).evaluate(
      (el, property) => getComputedStyle(el).getPropertyValue(property).trim(),
      name
    );
  }

  /** Click a toolbar button that calls `updateSettings()` on grid `a`. */
  async clickToolbar(testId: string): Promise<void> {
    await this.page.getByTestId(testId).click();
  }
}
