import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the fixture that removes a nested parent row while a HyperFormula engine is
 * attached (DEV-3092).
 *
 * Formulas' `beforeRemoveRow` listener used to read the removed physical rows before NestedRows
 * expanded that list to the whole subtree, so the engine could end up holding leftover descendant
 * rows the grid no longer showed. NestedRows now registers its own listener with `orderIndex: -1`,
 * so every default-order listener - Formulas' included - sees the expanded list instead. The spec
 * compares the engine's serialized sheet against the grid's own row count and a formula's computed
 * value to catch that divergence.
 */
export class FormulasNestedRowsRemoveParentPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-nested-rows-remove-parent.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    const fixtureError = await this.page.evaluate(() => window.htFixtureError);

    if (fixtureError) {
      throw new Error(`The fixture grid failed to build: ${fixtureError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Removes rows through the API, the way `hot.alter('remove_row', ...)` is documented to be
   * called - a single contiguous visual range can span more than one parent's subtree.
   *
   * @param {number} row Visual row index to start from.
   * @param {number} [amount] How many visual rows to remove.
   */
  async removeRow(row: number, amount = 1): Promise<void> {
    await this.page.evaluate(
      ({ visualRow, count }) => window.hot.alter('remove_row', visualRow, count),
      { visualRow: row, count: amount });
  }

  /** Collapses one parent's children through the plugin's public API (visual row index). */
  async collapseParent(row: number): Promise<void> {
    await this.page.evaluate(
      visualRow => window.hot.getPlugin('nestedRows').collapseParent(visualRow), row);
  }

  /** Undoes the last action through the public `undoRedo` plugin. */
  async undo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').undo());
  }

  /** Redoes the last undone action through the public `undoRedo` plugin. */
  async redo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').redo());
  }

  /**
   * Re-sends `nestedRows: true` through `updateSettings()` - the path a React re-render takes on
   * every commit. NestedRows' `updatePlugin()` clears and re-registers its own hooks on this call,
   * so it is the way to exercise whether its `beforeRemoveRow` listener still runs ahead of the
   * host's and Formulas' after the round trip (DEV-3092).
   */
  async reenableNestedRows(): Promise<void> {
    await this.page.evaluate(() => window.hot.updateSettings({ nestedRows: true }));
  }

  /**
   * What HyperFormula holds for this grid's sheet, serialized - formulas as their own text.
   *
   * This is the measure that catches a leftover descendant: the grid can already show the right
   * number of rows while the engine still holds rows nobody removed from it.
   */
  sheetContent(): Promise<unknown[][]> {
    return this.page.evaluate(() => {
      const plugin = window.hot.getPlugin('formulas');

      return plugin.engine!.getSheetSerialized(plugin.sheetId!);
    });
  }

  /**
   * How many rows HyperFormula holds for this grid's sheet.
   *
   * Compared against {@link FormulasNestedRowsRemoveParentPage#countRows} directly: on a shrink
   * `getSheetDimensions()` does not give the extent back, so `sheetContent().length` is the only
   * reliable measure - see `formulas/AGENTS.md`, "the engine's sheet size is not the grid's axis
   * length".
   */
  async sheetHeight(): Promise<number> {
    return (await this.sheetContent()).length;
  }

  /** The grid's own row count, after any flattening or trimming. */
  countRows(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /** The computed value of one data cell, by visual row/column - what the renderer paints. */
  dataAtCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ({ r, c }) => window.hot.getDataAtCell(r, c), { r: row, c: col });
  }

  /**
   * Physical rows the host's own `beforeRemoveRow` listener (declared in the fixture's constructor
   * settings, not by any plugin) saw on each call it made, in firing order.
   */
  hostBeforeRemoveRowLog(): Promise<number[][]> {
    return this.page.evaluate(() => window.hostBeforeRemoveRowLog ?? []);
  }
}
