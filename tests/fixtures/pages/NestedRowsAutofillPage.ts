import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

export interface NestedRowsAutofillState {
  /** The raw nested source, as the plugin keeps it (`getSourceData()` is flattened). */
  tree: unknown[];
  /** The nesting level of every visual row. */
  levels: Array<number | null>;
  /** The `item` column of every visual row. */
  items: unknown[];
}

/**
 * Page object for the DEV-139 reproduction: the fill handle dragged past the last row of a nested
 * grid, where `autoInsertRow` adds rows while the pointer stays below the table.
 */
export class NestedRowsAutofillPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /** Navigate to the fixture and wait for the bundle and the last row. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/nested-rows-autofill.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(3, 1)).toBeVisible();
  }

  /** A single data cell addressed by its visual row and column. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The fill handle of the focused selection, scoped to the master overlay. */
  fillHandle(): Locator {
    return this.page.locator('.ht_master .wtBorder.current.corner:visible');
  }

  /** Collapse a parent row through the plugin's public API (setup, not the gesture under test). */
  async collapseParent(row: number): Promise<void> {
    await this.page.evaluate(parentRow => window.hot.getPlugin('nestedRows').collapseParent(parentRow), row);
  }

  /** The number of visual rows. */
  countRows(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /**
   * Press the fill handle of `cell(row, col)` and drag it below the table until the grid has inserted
   * a row, then onto the first inserted row, and release. Waiting on the row count keeps the gesture
   * independent of the 200 ms insert timer and of the theme's row height.
   */
  async dragFillHandleBelowTable(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();

    const rowsBefore = await this.countRows();
    const handleBox = await this.fillHandle().boundingBox();
    const gridBox = await this.page.getByTestId('grid').boundingBox();

    if (!handleBox || !gridBox) {
      throw new Error('The fill handle or the grid is not rendered.');
    }

    const pointerX = handleBox.x + (handleBox.width / 2);

    await this.page.mouse.move(pointerX, handleBox.y + (handleBox.height / 2));
    await this.page.mouse.down();
    await this.page.mouse.move(pointerX, gridBox.y + gridBox.height + 80, { steps: 8 });

    await expect.poll(() => this.countRows()).toBeGreaterThan(rowsBefore);

    const insertedBox = await this.cell(rowsBefore, col).boundingBox();

    if (!insertedBox) {
      throw new Error('The inserted row is not rendered.');
    }

    await this.page.mouse.move(insertedBox.x + (insertedBox.width / 2), insertedBox.y + (insertedBox.height / 2), {
      steps: 4,
    });
    await this.page.mouse.up();
  }

  /** Undo every recorded step through the platform Cmd/Ctrl+Z shortcut. */
  async undoAllWithKeyboard(): Promise<void> {
    await expect.poll(async() => {
      const available = await this.page.evaluate(() => window.hot.getPlugin('undoRedo').isUndoAvailable());

      if (available) {
        await this.page.keyboard.press('ControlOrMeta+z');
      }

      return available;
    }).toBe(false);
  }

  /** The tree, the levels and the values of the grid, read in one round trip. */
  state(): Promise<NestedRowsAutofillState> {
    return this.page.evaluate(() => {
      const hot = window.hot;
      const nestedRows = hot.getPlugin('nestedRows');
      const rows = Array.from({ length: hot.countRows() }, (_, row) => row);

      return {
        tree: nestedRows.dataManager.getRawSourceData(),
        levels: rows.map(row => nestedRows.getRowLevel(row)),
        items: rows.map(row => hot.getDataAtCell(row, 1)),
      };
    });
  }
}
