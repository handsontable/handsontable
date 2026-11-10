import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The `stateBefore` a hook saw: `[row, values]` pairs, one per selected row, where `values` is
 * indexed by visual column and `null` stands for `undefined`.
 */
export type AlignmentState = [number, (string | null)[]][];

/**
 * Page Object for the context menu alignment fixture (DEV-857).
 *
 * Column 0 of the fixture holds one `className` case per row. The page records the `stateBefore`
 * that `beforeCellAlignment` and `afterUndo` received.
 */
export class ContextMenuAlignmentStateBeforePage {
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
   * Navigate to the fixture. The theme and bundle travel as query params so the fixture loads the
   * matching stylesheet and Handsontable build.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/context-menu-alignment-state-before.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    // Rethrow a constructor failure as itself, rather than as a cell that never appeared.
    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Select a block of cells with a click and a Shift+click. A single cell is just the click.
   */
  async selectCells(from: [number, number], to: [number, number] = from): Promise<void> {
    await this.cell(...from).click();

    if (from[0] !== to[0] || from[1] !== to[1]) {
      await this.cell(...to).click({ modifiers: ['Shift'] });
    }
  }

  /**
   * Pick `Alignment > <label>` for the current selection, through the context menu a user opens with
   * a right-click on `at`. Waits until the menu is gone, so the hook has run when this returns.
   */
  async alignThroughMenu(at: [number, number], label: string): Promise<void> {
    await this.cell(...at).click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu:visible').last();

    await expect(menu).toBeVisible();
    await menu.getByText('Alignment', { exact: true }).hover();

    const submenu = this.page.locator('[class*="htContextMenuSub_"]:visible').last();

    await expect(submenu).toBeVisible();
    await submenu.getByText(label, { exact: true }).click();
    await expect(this.page.locator('.htContextMenu:visible')).toHaveCount(0);
  }

  /**
   * Make the fixture's `beforeCellAlignment` listener delete every entry of the `stateBefore` it
   * receives, after it has logged it.
   */
  async mutateStateBeforeInHook(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { mutateStateBefore: boolean }).mutateStateBefore = true;
    });
  }

  /**
   * Undo the last step with the keyboard, as a user does, and wait for `afterUndo` to have run.
   */
  async undo(): Promise<void> {
    const before = (await this.undoLog()).length;

    await this.page.keyboard.press('ControlOrMeta+z');
    await expect.poll(async() => (await this.undoLog()).length).toBe(before + 1);
  }

  /**
   * Every `stateBefore` that `beforeCellAlignment` received, oldest first.
   */
  async alignmentLog(): Promise<AlignmentState[]> {
    return this.page.evaluate(() => (window as unknown as { alignmentLog: AlignmentState[] }).alignmentLog);
  }

  /**
   * Every `stateBefore` that `afterUndo` received for an alignment step, oldest first.
   */
  async undoLog(): Promise<AlignmentState[]> {
    return this.page.evaluate(() => (window as unknown as { undoLog: AlignmentState[] }).undoLog);
  }

  /**
   * The `className` stored in a cell's meta.
   */
  async className(row: number, col: number): Promise<string | string[] | undefined> {
    return this.page.evaluate(([r, c]) => (window as unknown as {
      hot: { getCellMeta(row: number, col: number): { className?: string | string[] } }
    }).hot.getCellMeta(r, c).className, [row, col]);
  }
}
