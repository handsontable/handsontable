import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

export interface NestedRowsRemoveLogEntry {
  hook: 'beforeRemoveRow' | 'afterRemoveRow';
  index: number;
  amount: number;
  physicalRows: number[];
  source?: string;
}

export interface NestedRowsUndoState {
  countRows?: number;
  visibleNames?: string[];
  sourceData?: unknown[];
  rowIndexesSequence?: number[];
  cellMeta?: Array<string | undefined>;
  error?: string;
}

/**
 * Page object for the DEV-30 nested parent removal and undo reproduction.
 *
 * The fixture keeps the parent at visual row 13, matching the reported gesture, and gives that
 * parent a nested parent descendant so the removal list and the source tree can diverge.
 */
export class NestedRowsUndoPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /** Navigate to the reproduction fixture and wait for the bundle and first cell. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/nested-rows-undo.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell addressed by its current visual row and column. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** Remove one row through the context-menu gesture reported in DEV-30. */
  async removeRowViaContextMenu(row: number): Promise<void> {
    await this.cell(row, 0).click({ button: 'right' });
    const menu = this.page.locator('.htContextMenu.handsontable').locator('visible=true');

    await expect(menu).toBeVisible();
    await menu.locator('.ht_master td').filter({ hasText: /^Remove row$/ }).click();
    await expect(menu).toBeHidden();
  }

  /** Undo the removal through the platform-specific Cmd/Ctrl+Z shortcut. */
  async undoWithKeyboard(): Promise<void> {
    await this.cell(0, 0).click();
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  /** Redo the removal through the UndoRedo plugin API. */
  async redo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').redo());
  }

  /** Undo through the plugin API without moving the highlight first. */
  async undoViaPlugin(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').undo());
  }

  /** Visual row of the current highlight, or `null` when nothing is selected. */
  selectedRow(): Promise<number | null> {
    return this.page.evaluate(() => window.hot.getSelectedLast()?.[0] ?? null);
  }

  /** Read the names currently visible through the public visual-row API. */
  visibleNames(): Promise<string[]> {
    return this.page.evaluate(() => {
      const names: string[] = [];

      for (let row = 0; row < window.hot.countRows(); row++) {
        names.push(String(window.hot.getDataAtCell(row, 0)));
      }

      return names;
    });
  }

  /** Capture the source tree, visual row count, and index-map sequence in one browser round trip. */
  state(): Promise<NestedRowsUndoState> {
    return this.page.evaluate(() => {
      try {
        const hot = window.hot;
        const countRows = hot.countRows();

        return {
          countRows,
          visibleNames: Array.from({ length: countRows }, (_, row) => String(hot.getDataAtCell(row, 0))),
          sourceData: hot.getPlugin('nestedRows').dataManager.getRawSourceData(),
          rowIndexesSequence: hot.rowIndexMapper.getIndexesSequence(),
          cellMeta: countRows > 15
            ? [13, 14, 15].map(row => hot.getCellMeta(row, 0).className)
            : [],
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }

  /** Return the last captured before/after remove hook arguments. */
  removeLog(): Promise<NestedRowsRemoveLogEntry[]> {
    return this.page.evaluate(() => window.removeLog);
  }

  /** Return the latest serialized UndoRedo action after the removal. */
  undoAction(): Promise<unknown> {
    return this.page.evaluate(() => {
      const actions = window.hot.getPlugin('undoRedo').doneActions;

      return actions[actions.length - 1];
    });
  }
}
