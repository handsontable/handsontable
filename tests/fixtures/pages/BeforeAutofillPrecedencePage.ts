import { expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { dragFillHandle } from '../gestures';
import { FormulasGridPage } from './FormulasGridPage';

/**
 * Page Object for the `beforeAutofill` precedence fixture (DEV-3424). The
 * fixture builds no grid on load: the spec registers hooks in the order under
 * test, then calls `createGrid()`, and finally drags the real fill handle.
 *
 * Inherits the range selection from {@link FormulasGridPage}; the drag is
 * simpler here because the 150px grid shows every row, so no auto-scroll is
 * involved.
 */
export class BeforeAutofillPrecedencePage extends FormulasGridPage {
  /** Opens the fixture; no grid exists until `createGrid()` runs. */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/formulas-before-autofill.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.page.waitForFunction(() => typeof (window as any).createGrid === 'function', undefined, { polling: 100 });
  }

  /**
   * Registers a GLOBAL `beforeAutofill` hook (`Handsontable.hooks.add`) that
   * returns `value`. The page is fresh per test, so nothing leaks between tests.
   */
  async addGlobalHook(value: unknown): Promise<void> {
    await this.page.evaluate((v) => {
      const w = window as any;

      w.__calls = w.__calls ?? [];
      w.Handsontable.hooks.add('beforeAutofill', () => {
        w.__calls.push('global');

        return v;
      });
    }, value);
  }

  /** Creates the grid with Formulas enabled at init and, optionally, a `beforeAutofill` option. */
  async createGrid(options: { formulas?: boolean, beforeAutofill?: unknown } = {}): Promise<void> {
    await this.page.evaluate(({ formulas, beforeAutofill }) => {
      const w = window as any;
      const settings: Record<string, unknown> = {
        afterAutofill: () => {
          w.__calls.push('afterAutofill');
        },
      };

      w.__calls = w.__calls ?? [];

      if (formulas) {
        settings.formulas = w.formulasSettings();
      }
      if (beforeAutofill !== undefined) {
        settings.beforeAutofill = () => {
          w.__calls.push('option');

          return beforeAutofill;
        };
      }

      w.createGrid(settings);
    }, options);
    await expect(this.cell(0, 1)).toBeVisible();

    if (options.formulas) {
      await this.expectFormulasEnabled();
    }
  }

  /**
   * Fails the test when the Formulas plugin is not enabled. Its own callback is not
   * logged, so without this a "user callback wins" test would also pass if the
   * plugin never switched on.
   */
  async expectFormulasEnabled(): Promise<void> {
    await expect
      .poll(() => this.page.evaluate(() => (window as any).hot.getPlugin('formulas').enabled), {
        message: 'the Formulas plugin is not enabled',
      })
      .toBe(true);
  }

  /** Adds an instance-level hook (`hot.addHook`, optionally with an `orderIndex`) returning `value`. */
  async addInstanceHook(value: unknown, orderIndex?: number): Promise<void> {
    await this.page.evaluate(({ v, order }) => {
      const w = window as any;

      w.hot.addHook('beforeAutofill', () => {
        w.__calls.push('instance');

        return v;
      }, order);
    }, { v: value, order: orderIndex });
  }

  /** Re-passes the `beforeAutofill` option through `updateSettings()`, as a wrapper re-render does. */
  async updateBeforeAutofillOption(value: unknown): Promise<void> {
    await this.page.evaluate((v) => {
      const w = window as any;

      w.hot.updateSettings({
        beforeAutofill: () => {
          w.__calls.push('option');

          return v;
        },
      });
    }, value);
  }

  /** Runs `hot.updateSettings({ formulas })`; `extra` is merged into the Formulas settings object. */
  async updateFormulas(extra: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate((e) => {
      const w = window as any;

      w.hot.updateSettings({ formulas: { ...w.formulasSettings(), ...e } });
    }, extra);
    await this.expectFormulasEnabled();
  }

  /** Runs `hot.updateSettings({ formulas: false })`, which disables the Formulas plugin. */
  async disableFormulas(): Promise<void> {
    await this.page.evaluate(() => (window as any).hot.updateSettings({ formulas: false }));
  }

  /**
   * Selects A1:B1 and drags its fill handle one row down with the real mouse,
   * ending with the button release. It waits for nothing after that: the caller
   * polls `calls()` (the hook ran) before reading `filledRow()`.
   */
  async fillRowDown(): Promise<void> {
    await this.selectRange(0, 0, 0, 1);

    await dragFillHandle(this.page, this.areaCorner, this.cell(1, 1));
  }

  /** The last selection as `[fromRow, fromCol, toRow, toCol]`; a real fill grows A1:B1 to A1:B2. */
  async selection(): Promise<number[]> {
    return this.page.evaluate(() => {
      const range = (window as any).hot.getSelectedRangeLast();

      return [range.from.row, range.from.col, range.to.row, range.to.col];
    });
  }

  /**
   * The log of the user callbacks that ran, in order: `global`, `option`, `instance`
   * (their `beforeAutofill` callbacks) and `afterAutofill` (the fill was applied).
   * Formulas' own callback is not logged.
   */
  async calls(): Promise<string[]> {
    return this.page.evaluate(() => (window as any).__calls ?? []);
  }

  /**
   * Waits until the drag reached the hook, so a result read afterwards is not
   * just the untouched initial row. `expected` is the exact log to wait for.
   */
  async expectCalls(expected: string[]): Promise<void> {
    await expect.poll(() => this.calls(), { message: 'the fill gesture never reached the beforeAutofill hooks' })
      .toEqual(expected);
  }

  /** Raw source data of the second row (the fill target), formulas unevaluated. */
  async filledRow(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as any).hot.getSourceDataAtRow(1));
  }
}
