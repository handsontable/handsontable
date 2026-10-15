import { expect } from '@playwright/test';
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
    await this.page.waitForFunction(() => typeof (window as any).createGrid === 'function', undefined, { polling: 100 });
  }

  /**
   * Registers a GLOBAL `beforeAutofill` hook (`Handsontable.hooks.add`) that
   * returns `value`. The page is fresh per test, so nothing leaks between tests.
   */
  async addGlobalHook(value: unknown): Promise<void> {
    await this.page.evaluate((v) => {
      (window as any).Handsontable.hooks.add('beforeAutofill', () => v);
    }, value);
  }

  /** Creates the grid with Formulas enabled at init and, optionally, a `beforeAutofill` option. */
  async createGrid(options: { formulas?: boolean, beforeAutofill?: unknown } = {}): Promise<void> {
    await this.page.evaluate(({ formulas, beforeAutofill }) => {
      const w = window as any;
      const settings: Record<string, unknown> = {};

      if (formulas) {
        settings.formulas = w.formulasSettings();
      }
      if (beforeAutofill !== undefined) {
        settings.beforeAutofill = () => beforeAutofill;
      }

      w.createGrid(settings);
    }, options);
    await expect(this.cell(0, 1)).toBeVisible();
  }

  /** Adds an instance-level hook (`hot.addHook`) returning `value`. */
  async addInstanceHook(value: unknown): Promise<void> {
    await this.page.evaluate((v) => {
      (window as any).hot.addHook('beforeAutofill', () => v);
    }, value);
  }

  /** Runs `hot.updateSettings` with Formulas options (and optionally a hook option). */
  async updateFormulas(extra: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate((e) => {
      const w = window as any;

      w.hot.updateSettings({ formulas: { ...w.formulasSettings(), ...e } });
    }, extra);
  }

  /** Runs `hot.updateSettings({ formulas: false })`, which disables the Formulas plugin. */
  async disableFormulas(): Promise<void> {
    await this.page.evaluate(() => (window as any).hot.updateSettings({ formulas: false }));
  }

  /**
   * Selects A1:B1 and drags its fill handle one row down with the real mouse,
   * then waits for the gesture to finish (the handle disappears or the fill lands).
   */
  async fillRowDown(): Promise<void> {
    await this.selectRange(0, 0, 0, 1);

    const corner = await this.areaCorner.boundingBox();
    const target = await this.cell(1, 1).boundingBox();

    if (!corner || !target) {
      throw new Error('the fill handle or the target cell is not rendered');
    }

    await this.page.mouse.move(corner.x + corner.width / 2, corner.y + corner.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 5 });
    await this.page.mouse.up();
  }

  /** Raw source data of the second row (the fill target), formulas unevaluated. */
  async filledRow(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as any).hot.getSourceDataAtRow(1));
  }
}
