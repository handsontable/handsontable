import { GridPage } from './GridPage';
import './windowTypes';

/**
 * The slice of the instance API this page drives in the browser. `windowTypes.ts` declares `hot`
 * with the shared fixture surface, which has none of these, so the page casts locally.
 */
interface ValidateHot {
  updateSettings(settings: object): void;
  validateCells(callback: (valid: boolean) => void): void;
  validateRows(rows: number[], callback: (valid: boolean) => void): void;
  validateColumns(columns: number[], callback: (valid: boolean) => void): void;
  getPlugin(name: 'hiddenRows'): { showRows(rows: number[]): void, isHidden(row: number): boolean };
  getPlugin(name: 'hiddenColumns'): { showColumns(columns: number[]): void, isHidden(column: number): boolean };
  render(): void;
}

type ValidateWindow = { hot: ValidateHot };

/**
 * Page Object for pinning what `validateCells()`, `validateRows()` and `validateColumns()` do with
 * rows hidden by HiddenRows and columns hidden by HiddenColumns (DEV-3736).
 *
 * It reuses the generic grid fixture and reconfigures the grid in-page: every cell is validated by a
 * validator that rejects the value `INVALID`, and one cell holds it. Each `validate*()` helper
 * resolves with the `valid` flag the grid hands to its callback, so a spec awaits the real result.
 */
export class ValidateHiddenCellsPage extends GridPage {
  /**
   * Load a 5 x 3 data set where one cell holds a value the validator rejects, and hide rows and
   * columns through the `hiddenRows` and `hiddenColumns` options.
   */
  async configure(options: { invalid: [number, number], hiddenRows?: number[], hiddenColumns?: number[] }): Promise<void> {
    await this.page.evaluate(({ invalid, hiddenRows = [], hiddenColumns = [] }) => {
      const data = [
        ['A1', 'B1', 'C1'],
        ['A2', 'B2', 'C2'],
        ['A3', 'B3', 'C3'],
        ['A4', 'B4', 'C4'],
        ['A5', 'B5', 'C5'],
      ];

      data[invalid[0]][invalid[1]] = 'INVALID';

      (window as unknown as ValidateWindow).hot.updateSettings({
        data,
        validator: (value: unknown, callback: (valid: boolean) => void) => callback(value !== 'INVALID'),
        hiddenRows: { rows: hiddenRows },
        hiddenColumns: { columns: hiddenColumns },
      });
    }, options);
  }

  /**
   * Run `validateCells()` and resolve with the `valid` flag of its callback.
   */
  async validateCells(): Promise<boolean> {
    return this.page.evaluate(() => new Promise<boolean>((resolve) => {
      (window as unknown as ValidateWindow).hot.validateCells(resolve);
    }));
  }

  /**
   * Run `validateRows()` on the given visual rows and resolve with the `valid` flag of its callback.
   */
  async validateRows(rows: number[]): Promise<boolean> {
    return this.page.evaluate(visualRows => new Promise<boolean>((resolve) => {
      (window as unknown as ValidateWindow).hot.validateRows(visualRows, resolve);
    }), rows);
  }

  /**
   * Run `validateColumns()` on the given visual columns and resolve with the `valid` flag of its callback.
   */
  async validateColumns(columns: number[]): Promise<boolean> {
    return this.page.evaluate(visualColumns => new Promise<boolean>((resolve) => {
      (window as unknown as ValidateWindow).hot.validateColumns(visualColumns, resolve);
    }), columns);
  }

  /**
   * Bring hidden rows back through the HiddenRows plugin.
   */
  async showRows(rows: number[]): Promise<void> {
    await this.page.evaluate((visualRows) => {
      const { hot } = window as unknown as ValidateWindow;

      hot.getPlugin('hiddenRows').showRows(visualRows);
      hot.render();
    }, rows);
  }

  /**
   * Bring hidden columns back through the HiddenColumns plugin.
   */
  async showColumns(columns: number[]): Promise<void> {
    await this.page.evaluate((visualColumns) => {
      const { hot } = window as unknown as ValidateWindow;

      hot.getPlugin('hiddenColumns').showColumns(visualColumns);
      hot.render();
    }, columns);
  }

  /**
   * Whether the grid's HiddenRows plugin reports a row as hidden. Proves the fixture really hid it.
   */
  async isRowHidden(row: number): Promise<boolean> {
    return this.page.evaluate(
      visualRow => (window as unknown as ValidateWindow).hot.getPlugin('hiddenRows').isHidden(visualRow),
      row
    );
  }

  /**
   * Whether the grid's HiddenColumns plugin reports a column as hidden. Proves the fixture really hid it.
   */
  async isColumnHidden(column: number): Promise<boolean> {
    return this.page.evaluate(
      visualColumn => (window as unknown as ValidateWindow).hot.getPlugin('hiddenColumns').isHidden(visualColumn),
      column
    );
  }
}
