import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * Which element holds the browser focus after a settings update.
 */
export interface SettingsUpdateFocusState {
  option: boolean;
  action: boolean;
  onHighlight: boolean;
  inGrid: boolean;
  body: boolean;
}

/**
 * Page object for a grid with an option checkbox and a button outside it, the shape of an example
 * whose options change the grid's settings.
 */
export class SettingsUpdateOutsideFocusPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly option: Locator;
  readonly action: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.option = page.getByTestId('option');
    this.action = page.getByTestId('action');
  }

  /**
   * Opens the fixture and waits until the first cell is rendered.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/settings-update-outside-focus.html?theme=${this.theme}&bundle=${this.bundle}`,
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Selects a cell through the API, which moves the browser focus onto it.
   *
   * @param row Visual row.
   * @param col Visual column.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      window.hot.selectCell(r, c);
    }, [row, col]);
  }

  /**
   * Calls `updateSettings()` with the given payload. `data` may be the string `'same'`, which sends
   * the instance's own source data, the way a wrapper re-sends it on each render.
   *
   * @param payload The settings to apply.
   */
  async updateSettings(payload: { data?: 'same' | 'new'; readOnly?: boolean; colHeaders?: boolean }): Promise<void> {
    await this.page.evaluate((settings) => {
      const { data, ...rest } = settings;
      const next: Record<string, unknown> = { ...rest };

      if (data === 'same') {
        next.data = window.hot.getSourceData();
      } else if (data === 'new') {
        next.data = [['X1', 'X2', 'X3', 'X4', 'X5'], ['Y1', 'Y2', 'Y3', 'Y4', 'Y5']];
      }

      window.hot.updateSettings(next);
    }, payload);
  }

  /**
   * Calls the public `updateData()` with the instance's own source data.
   */
  async updateData(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.updateData(window.hot.getSourceData());
    });
  }

  /**
   * Calls `loadData()` with the instance's own source data.
   */
  async loadData(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.loadData(window.hot.getSourceData());
    });
  }

  /**
   * Turns the Filters plugin on over five explicit columns and keeps a condition on the first one, so a
   * later change of the column layout has a condition set to clear.
   */
  async enableFilterWithCondition(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.updateSettings({ filters: true, columns: [{}, {}, {}, {}, {}] });
      const filters = window.hot.getPlugin('filters');

      filters.addCondition(0, 'neq', ['A2']);
      filters.filter();
    });
  }

  /**
   * Sends the instance's own data with a `columns` option that drops the middle column, the way a wrapper does
   * when a `<HotColumn>` is removed.
   */
  async dropMiddleColumn(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.updateSettings({
        data: window.hot.getSourceData(),
        columns: [{ data: 0 }, { data: 1 }, { data: 3 }, { data: 4 }],
      });
    });
  }

  /**
   * Which element holds the focus, and whether it is the highlighted cell.
   */
  async focusState(): Promise<SettingsUpdateFocusState> {
    return this.page.evaluate(() => {
      const active = document.activeElement;
      const highlight = window.hot.getSelectedRangeActive()?.highlight;
      const highlightCell = highlight ? window.hot.getCell(highlight.row, highlight.col, true) : null;

      return {
        option: active === document.querySelector('[data-testid="option"]'),
        action: active === document.querySelector('[data-testid="action"]'),
        onHighlight: highlightCell !== null && active === highlightCell,
        inGrid: window.hot.rootElement.contains(active),
        body: active === document.body,
      };
    });
  }

  /**
   * Whether a cell is highlighted, as `[row, col]`, or `null` for no selection.
   */
  async highlight(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const highlight = window.hot.getSelectedRangeActive()?.highlight;

      return highlight ? [highlight.row, highlight.col] : null;
    });
  }
}
