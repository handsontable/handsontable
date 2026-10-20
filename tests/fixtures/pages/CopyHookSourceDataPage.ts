import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The fixture's `?hook=` allowlist: what the `beforeCopy` hook of grid A does to the copied data.
 */
export type CopyHook = 'map' | 'splice' | 'mask';

/**
 * Page Object for the copy-hook fixture: grid A copies object cells through a `beforeCopy` hook,
 * grid B (`parsePastedValue: true`) receives them.
 */
export class CopyHookSourceDataPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly hook: CopyHook;

  constructor(page: Page, theme = 'main', bundle = 'umd', hook: CopyHook = 'mask') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.hook = hook;
  }

  /**
   * Opens the fixture and waits for both grids to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/copy-hook-source-data.html?theme=${this.theme}&bundle=${this.bundle}&hook=${this.hook}`
    );
    await awaitBundle(this.page);
    await expect(this.cellA(0, 0)).toBeVisible();
    await expect(this.cellB(0, 0)).toBeVisible();
  }

  /**
   * A data cell of grid A, the source.
   */
  cellA(row: number, col: number): Locator {
    return this.page.getByTestId(`a-cell-${row}-${col}`);
  }

  /**
   * A data cell of grid B, the target.
   */
  cellB(row: number, col: number): Locator {
    return this.page.getByTestId(`b-cell-${row}-${col}`);
  }

  /**
   * Selects both rows of grid A's first column and copies them with the keyboard: a real copy event.
   */
  async copyBothRows(): Promise<void> {
    await this.cellA(0, 0).click();
    await this.cellA(1, 0).click({ modifiers: ['Shift'] });
    await this.page.keyboard.press('ControlOrMeta+c');
  }

  /**
   * Pastes into the first cell of grid B with the keyboard: a real, trusted paste event.
   */
  async pasteIntoB(): Promise<void> {
    await this.cellB(0, 0).click();
    await this.page.keyboard.press('ControlOrMeta+v');
  }

  /**
   * Describes what the data source of a cell of grid B holds.
   */
  async sourceAtB(row: number, col: number): Promise<string> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as { htSourceAtB(r: number, c: number): string }).htSourceAtB(r, c),
      [row, col] as const,
    );
  }
}
