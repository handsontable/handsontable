import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The sorting plugin a grid starts with: `multi` for `multiColumnSorting`, `column` for `columnSorting`.
 */
export type SortingPlugin = 'multi' | 'column';

/**
 * Which of the two sorting plugins report themselves enabled.
 */
export interface SortingPluginsState {
  columnSorting: boolean;
  multiColumnSorting: boolean;
}

/**
 * Page Object for the sorting-plugin-swap fixture.
 *
 * Every console warning the page logs is collected from construction on, so a spec can assert the
 * swap stayed silent. Header locators are scoped to the top overlay, because column headers render
 * in several overlay layers.
 */
export class SortingPluginSwapPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly headerOverlay: Locator;
  readonly warnings: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.headerOverlay = page.locator('.ht_clone_top');

    page.on('console', (message) => {
      if (message.type() === 'warning') {
        this.warnings.push(message.text());
      }
    });
  }

  /**
   * Navigate to the fixture with one sorting plugin enabled and wait for the grid to render.
   */
  async goto(start: SortingPlugin): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/sorting-plugin-swap.html?theme=${this.theme}&bundle=${this.bundle}&start=${start}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Turn the current sorting plugin off and the other one on, in one `updateSettings` call.
   */
  async swapTo(target: SortingPlugin): Promise<void> {
    const multi = target === 'multi';

    await this.page.evaluate(({ multiColumnSorting }) => {
      const { hot } = window as unknown as {
        hot: { updateSettings(settings: Record<string, unknown>): void };
      };

      hot.updateSettings({ columnSorting: !multiColumnSorting, multiColumnSorting });
    }, { multiColumnSorting: multi });
  }

  /**
   * Whether each sorting plugin reports itself enabled.
   */
  async pluginsState(): Promise<SortingPluginsState> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as {
        hot: { getPlugin(name: string): { isEnabled(): boolean } };
      };

      return {
        columnSorting: hot.getPlugin('columnSorting').isEnabled(),
        multiColumnSorting: hot.getPlugin('multiColumnSorting').isEnabled(),
      };
    });
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The clickable sorting label inside a column header.
   */
  sortLabel(col: number): Locator {
    return this.headerOverlay.getByTestId(`col-header-${col}`).locator('span.colHeader');
  }

  /**
   * Click a column header's label, the gesture a user sorts with.
   */
  async clickHeader(col: number): Promise<void> {
    await this.sortLabel(col).click();
  }

  /**
   * Sort a column from the keyboard: select its first cell, move up onto the header, press Enter.
   */
  async pressEnterOnHeader(col: number): Promise<void> {
    await this.cell(0, col).click();
    await this.page.keyboard.press('ArrowUp');
    await expect.poll(() => this.page.evaluate(() => {
      const { hot } = window as unknown as {
        hot: { getSelectedRangeActive(): { highlight: { row: number, col: number } } | undefined };
      };
      const highlight = hot.getSelectedRangeActive()?.highlight;

      return highlight ? [highlight.row, highlight.col] : null;
    })).toEqual([-1, col]);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Assert the rendered column, top to bottom (web-first, auto-retrying).
   */
  async expectColumn(col: number, values: string[]): Promise<void> {
    for (const [row, value] of values.entries()) {
      await expect(this.cell(row, col)).toHaveText(value);
    }
  }

  /**
   * Console warnings that name either sorting plugin.
   */
  sortingWarnings(): string[] {
    return this.warnings.filter(text => /columnSorting|multiColumnSorting/.test(text));
  }
}
