import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, assertKnownBundle, type Bundle } from '../bundle';

/**
 * The sorting plugin the column-sorting-waiting-header-sort fixture enables.
 */
export type SortPlugin = 'columnSorting' | 'multiColumnSorting';

/**
 * A row of the fixture data: a label and a number.
 */
export type Row = [string, number];

interface SortingPlugin {
  isEnabled(): boolean;
  disablePlugin(): void;
  getSortConfig(): unknown;
}

interface FixtureWindow {
  hot: {
    getPlugin(name: string): SortingPlugin;
    getDataAtCol(col: number): unknown[];
    updateSettings(settings: Record<string, unknown>): void;
    loadData(data: Row[]): void;
    updateData(data: Row[]): void;
    getSourceData(): Row[];
    destroy(): void;
  };
  htSortPlugin: SortPlugin;
  heldValidations: Array<(valid: boolean) => void>;
  postAfterValidateCount: number;
  htAsyncErrors: string[];
}

/**
 * Page Object for the column-sorting-waiting-header-sort fixture: a grid whose column A validator
 * holds its callback until the spec answers it.
 */
export class ColumnSortingWaitingHeaderSortPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    assertKnownBundle(bundle, '(page, theme, bundle)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture with the given sorting plugin and wait for the grid to render.
   */
  async goto(plugin: SortPlugin = 'columnSorting'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/column-sorting-waiting-header-sort.html?theme=${this.theme}&bundle=${this.bundle}&plugin=${plugin}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The clickable sorting label of a column header, scoped to the top overlay.
   */
  sortLabel(col: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`col-header-${col}`).locator('span.colHeader');
  }

  /**
   * Types `value` into a cell of column A with the keyboard, then clicks the column B header label. The
   * click closes the editor, so the column A validator starts and holds its answer. Resolves once the
   * validator has been called, so the header sort now waits for that answer.
   */
  async editThenClickSortHeader(row: number, value: string): Promise<void> {
    await this.cell(row, 0).click();
    await this.page.keyboard.type(value);
    await expect(this.page.locator('textarea.handsontableInput')).toHaveValue(value);
    await this.sortLabel(1).click();
    await expect.poll(() => this.heldValidationCount()).toBe(1);
  }

  /**
   * Clicks a column header label once more while the first sort waits, with Ctrl (Cmd on macOS) held when
   * `ctrl` is set. The editor stays open until the validator answers, so this press waits too and starts no
   * validation of its own.
   */
  async clickSortHeaderAgain(col: number, ctrl = false): Promise<void> {
    await this.sortLabel(col).click({ modifiers: ctrl ? ['ControlOrMeta'] : [] });
    expect(await this.heldValidationCount()).toBe(1);
  }

  /**
   * How many validator calls are held without an answer.
   */
  async heldValidationCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).heldValidations.length);
  }

  /**
   * Answers every held validator call as valid, then waits until the grid ran `postAfterValidate` for it
   * and one more task has passed, so anything the answer queued has run.
   */
  async answerValidator(): Promise<void> {
    await this.answerHeldValidations();
    await expect.poll(() => this.page.evaluate(
      () => (window as unknown as FixtureWindow).postAfterValidateCount)).toBe(1);
    await this.nextTask();
  }

  /**
   * Answers every held validator call as valid and waits one task, without waiting for `postAfterValidate`. A
   * destroyed grid runs no hooks, so this is the answer to use after `destroy()`.
   */
  async answerValidatorAfterDestroy(): Promise<void> {
    await this.answerHeldValidations();
    await this.nextTask();
  }

  /**
   * Calls every held validator callback with `true`.
   */
  async answerHeldValidations(): Promise<void> {
    await this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;

      fixture.heldValidations.splice(0).forEach(callback => callback(true));
    });
  }

  /**
   * Resolves after one more task, so anything the page queued before it has run.
   */
  async nextTask(): Promise<void> {
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(null);
    }));
  }

  /**
   * Destroys the grid.
   */
  async destroyGrid(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as FixtureWindow).hot.destroy();
    });
  }

  /**
   * Calls `updateData()` with the records the grid holds now, as a wrapper does when it re-renders with the
   * same data.
   */
  async updateDataWithSameRecords(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;

      hot.updateData(hot.getSourceData());
    });
  }

  /**
   * Turns the fixture's sorting plugin off through `updateSettings()`.
   */
  async disableBySettings(): Promise<void> {
    await this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;

      fixture.hot.updateSettings({ [fixture.htSortPlugin]: false });
    });
  }

  /**
   * Calls `disablePlugin()` on the fixture's sorting plugin.
   */
  async disablePlugin(): Promise<void> {
    await this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;

      fixture.hot.getPlugin(fixture.htSortPlugin).disablePlugin();
    });
  }

  /**
   * Replaces the data with `loadData()`.
   */
  async loadData(rows: Row[]): Promise<void> {
    await this.page.evaluate((data) => {
      (window as unknown as FixtureWindow).hot.loadData(data);
    }, rows);
  }

  /**
   * Swaps the two columns with `updateSettings({ columns })`. That starts the column order over while it keeps
   * the rows, so no `afterLoadData` runs.
   */
  async swapColumns(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as FixtureWindow).hot.updateSettings({ columns: [{ data: 1 }, { data: 0 }] });
    });
  }

  /**
   * The values of one column, top to bottom, in visual order.
   */
  async columnValues(col: number): Promise<unknown[]> {
    return this.page.evaluate(column => (window as unknown as FixtureWindow).hot.getDataAtCol(column), col);
  }

  /**
   * Whether the fixture's sorting plugin is on. Reads the plugin's `enabled` flag, because `isEnabled()` reads the
   * settings, which `disablePlugin()` leaves as they are.
   */
  async isPluginEnabled(): Promise<boolean> {
    return this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;

      return fixture.hot.getPlugin(fixture.htSortPlugin).enabled;
    });
  }

  /**
   * The sort config the fixture's sorting plugin reports. Read it only while the plugin is enabled.
   */
  async sortConfig(): Promise<unknown> {
    return this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;

      return fixture.hot.getPlugin(fixture.htSortPlugin).getSortConfig();
    });
  }

  /**
   * Column A, top to bottom, in visual order.
   */
  async labels(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getDataAtCol(0));
  }

  /**
   * Every unhandled promise rejection the page reported.
   */
  async asyncErrors(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htAsyncErrors);
  }
}
