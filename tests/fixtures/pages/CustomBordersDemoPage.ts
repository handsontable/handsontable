import { type Page, type Locator, expect } from '@playwright/test';

/**
 * The overlay a border is expected to be painted in. Frozen rows and columns are rendered by
 * clone tables, so "is this border visible" is always a question about a specific overlay.
 */
export type OverlayName = 'corner' | 'inlineStart' | 'top' | 'master';

const OVERLAY_SELECTORS: Record<OverlayName, string> = {
  corner: '.ht_clone_top_inline_start_corner',
  inlineStart: '.ht_clone_inline_start',
  top: '.ht_clone_top',
  master: '.ht_master',
};

/**
 * Page Object for the static CustomBorders fixture (`custom-borders.html`) — a fixed grid with
 * frozen rows and columns and a preconfigured set of borders.
 *
 * Its counterpart `CustomBordersLabPage` drives the lab fixture, where each test builds its own
 * grid. This one exists so the frozen-area, UndoRedo and selection-ownership specs express intent
 * (`borderIn`, `hasRenderedBorder`) instead of repeating overlay selectors and reaching into
 * `hot.selection.highlight` from spec code.
 */
export class CustomBordersDemoPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render. The theme and bundle travel as query
   * params so the fixture loads the matching stylesheet and Handsontable build.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/custom-borders.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.page.getByTestId('cell-0-2')).toBeVisible();
  }

  /** The first visible custom-border edge painted in the given overlay. */
  borderIn(overlay: OverlayName): Locator {
    return this.page.locator(`${OVERLAY_SELECTORS[overlay]} .wtBorder:visible`).first();
  }

  /** Scroll the viewport to a row and/or column. */
  async scrollViewportTo(target: { row?: number, col?: number }): Promise<void> {
    await this.page.evaluate(t => (window as any).hot.scrollViewportTo(t), target);
  }

  /**
   * Whether the border for the given cell is currently part of the rendered working set. Asked by
   * id rather than by counting selections: how many survive depends on how many rows and columns a
   * given theme's cell size renders, so a specific id is the theme-robust signal.
   */
  async hasRenderedBorder(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(id => (window as any).hot.selection.highlight.customSelections
      .some((selection: any) => selection.settings?.id === id), `border_row${row}col${col}`);
  }

  /** Whether the plugin's border model holds an entry for the given cell. */
  async modelHasBorder(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(([r, c]) => (window as any).hot.getPlugin('customBorders').getBorders()
      .some((border: any) => border.row === r && border.col === c), [row, col] as const);
  }

  /** Whether the given cell carries `borders` cell meta. */
  async cellHasBordersMeta(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(
      ([r, c]) => Boolean((window as any).hot.getCellMeta(r, c).borders), [row, col] as const);
  }

  /** Run `alter`. It renders synchronously, so the DOM is settled when this resolves. */
  async alter(action: string, index: number, amount = 1): Promise<void> {
    await this.page.evaluate(
      ([a, i, n]) => (window as any).hot.alter(a, i, n), [action, index, amount] as const);
  }

  /** Undo the last action through the UndoRedo plugin. */
  async undo(): Promise<void> {
    await this.page.evaluate(() => (window as any).hot.getPlugin('undoRedo').undo());
  }

  /**
   * Register a custom selection the CustomBorders plugin does not own, so a following
   * `clearBorders()` can be checked for collateral damage.
   */
  async addForeignCustomSelection(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      const hot = (window as any).hot;
      const coords = hot._createCellCoords(r, c);

      hot.selection.highlight.addCustomSelection({
        border: { width: 2, color: 'orange' },
        visualCellRange: hot._createCellRange(coords, coords, coords),
      });
    }, [row, col] as const);
  }

  /** How many custom selections are registered, plugin-owned or not. */
  async customSelectionCount(): Promise<number> {
    return this.page.evaluate(() => (window as any).hot.selection.highlight.customSelections.length);
  }

  /** Clear every border the CustomBorders plugin owns. */
  async clearBorders(): Promise<void> {
    await this.page.evaluate(() => (window as any).hot.getPlugin('customBorders').clearBorders());
  }
}
