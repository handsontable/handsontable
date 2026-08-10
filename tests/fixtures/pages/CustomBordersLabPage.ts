import { type Page, type Locator, expect } from '@playwright/test';

/**
 * A serializable border-side style, as configured in `customBorders`.
 */
export interface BorderSideStyle {
  width?: number;
  color?: string;
  hide?: boolean;
}

/**
 * Page Object for the CustomBorders lab fixture.
 *
 * Unlike the static demo fixture, the lab page exposes `window.createHot(settings)` so every
 * test builds the exact grid it needs (settings arrive JSON-serialized). Border-DOM geometry
 * helpers live in the fixture (`window.borderUtils`) — a single definition shared by every
 * geometry assertion — and this object wraps them as intent-level queries. Waits are
 * condition-based, never fixed timeouts.
 */
export class CustomBordersLabPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
  }

  /** Navigate to the lab fixture (no grid exists until `createGrid` is called). */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/custom-borders-lab.html?theme=${this.theme}`);
    await expect(this.grid).toBeAttached();
  }

  /**
   * Create the grid under test. Returns the size of the plugin's border model captured
   * synchronously at init — the only race-free way to observe the progressive path's
   * "deferred at init" state before the first background batch lands.
   */
  async createGrid(settings: Record<string, unknown>): Promise<number> {
    const modelSizeAtInit = await this.page.evaluate(
      s => (window as any).createHot(s), settings);

    await expect(this.cellInMaster(0, 0)).toBeVisible();

    return modelSizeAtInit;
  }

  /** A data cell in the master overlay (frozen clones duplicate test ids). */
  cellInMaster(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** Run `alter` and wait for the follow-up render to settle into the DOM. */
  async alter(action: string, index: number, amount = 1): Promise<void> {
    await this.page.evaluate(
      ([a, i, n]) => (window as any).hot.alter(a, i, n), [action, index, amount] as const);
  }

  /** The plugin's border model, reduced to its coordinates. */
  async borderCoords(): Promise<Array<{ row: number, col: number }>> {
    return this.page.evaluate(() => (window as any).hot.getPlugin('customBorders').getBorders()
      .map((border: any) => ({ row: border.row, col: border.col })));
  }

  /** The `borders` cell meta of a cell, or `null` when the cell carries none. */
  async cellBorders(row: number, col: number): Promise<Record<string, BorderSideStyle> | null> {
    return this.page.evaluate(
      ([r, c]) => (window as any).hot.getCellMeta(r, c).borders ?? null, [row, col] as const);
  }

  /** The cell's data value — for data-anchored assertions under trimming/moving. */
  async dataAtCell(row: number, col: number): Promise<string> {
    return this.page.evaluate(([r, c]) => (window as any).hot.getDataAtCell(r, c), [row, col] as const);
  }

  /** Number of custom-border divs in the DOM (visible or not). */
  async countCustomBorders(): Promise<number> {
    return this.page.evaluate(() => (window as any).borderUtils.countCustomBorders());
  }

  /** Number of visible custom-border divs in the DOM. */
  async countVisibleCustomBorders(): Promise<number> {
    return this.page.evaluate(() => (window as any).borderUtils.countVisibleCustomBorders());
  }

  /** Background colors of all visible custom-border edges. */
  async visibleBorderColors(): Promise<string[]> {
    return this.page.evaluate(() => (window as any).borderUtils.visibleBorderColors());
  }

  /**
   * Y position of the horizontal border edge of `color` crossing the cell, nearest to the
   * cell's `anchor` edge.
   */
  async horizontalEdgeTop(row: number, col: number, color: string, anchor: 'top' | 'bottom'): Promise<number> {
    return this.page.evaluate(
      ([r, c, col_, a]) => (window as any).borderUtils.horizontalEdgeTop(r, c, col_, a),
      [row, col, color, anchor] as const);
  }

  /** Inline z-index of the first visible border edge of `color`. */
  async zIndexOfColor(color: string): Promise<number> {
    return this.page.evaluate(c => (window as any).borderUtils.zIndexOfColor(c), color);
  }

  /** Right-most outer edge of `color` border edges touching the cell's box. */
  async outerRightNear(row: number, col: number, color: string, wantHorizontal: boolean): Promise<number> {
    return this.page.evaluate(
      ([r, c, col_, h]) => (window as any).borderUtils.outerRightNear(r, c, col_, h),
      [row, col, color, wantHorizontal] as const);
  }

  /** Left-most outer edge of `color` border edges touching the cell's box (RTL mirror). */
  async outerLeftNear(row: number, col: number, color: string, wantHorizontal: boolean): Promise<number> {
    return this.page.evaluate(
      ([r, c, col_, h]) => (window as any).borderUtils.outerLeftNear(r, c, col_, h),
      [row, col, color, wantHorizontal] as const);
  }

  /** Right-most outer edge of the horizontal `color` edge along the cell's bottom. */
  async bottomEdgeOuterRight(row: number, col: number, color: string): Promise<number> {
    return this.page.evaluate(
      ([r, c, col_]) => (window as any).borderUtils.bottomEdgeOuterRight(r, c, col_),
      [row, col, color] as const);
  }

  /** Left-most outer edge of the horizontal `color` edge along the cell's bottom (RTL mirror). */
  async bottomEdgeOuterLeft(row: number, col: number, color: string): Promise<number> {
    return this.page.evaluate(
      ([r, c, col_]) => (window as any).borderUtils.bottomEdgeOuterLeft(r, c, col_),
      [row, col, color] as const);
  }

  /** Number of custom-border divs materialized inside the given overlay root. */
  async countCustomBordersIn(overlaySelector: string): Promise<number> {
    return this.page.evaluate(
      s => (window as any).borderUtils.countCustomBordersIn(s), overlaySelector);
  }

  /** The bounding box of a master-overlay cell. */
  async cellRect(row: number, col: number): Promise<{ top: number, right: number, bottom: number, left: number }> {
    return this.page.evaluate(([r, c]) => {
      const rect = (window as any).hot.getCell(r, c).getBoundingClientRect();

      return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left };
    }, [row, col] as const);
  }

  /** How many times `afterCustomBordersUpdate` has fired since the grid was created. */
  async bordersUpdateCount(): Promise<number> {
    return this.page.evaluate(() => (window as any).bordersUpdateCount);
  }

  /**
   * Remove the border of a cell through the real context menu ("Borders" → "Remove
   * border(s)") — the user path that regressed with orphaned border ids.
   */
  async removeBorderViaContextMenu(row: number, col: number): Promise<void> {
    await this.cellInMaster(row, col).click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu:visible').last();

    await menu.getByText('Borders', { exact: true }).hover();

    const submenu = this.page.locator('.htContextMenuSub_Borders');

    await submenu.getByText('Remove border(s)', { exact: true }).click();
    // Deselect so the built-in selection borders cannot mask the caller's border assertions.
    await this.page.evaluate(() => (window as any).hot.deselectCell());
  }
}
