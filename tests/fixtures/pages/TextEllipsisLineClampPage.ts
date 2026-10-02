import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

/**
 * What one cell looks like on screen. Every field is read inside one `evaluate`, because the grid
 * recycles `<tr>`/`<td>` nodes across a draw and two separate reads could describe different rows.
 */
export interface CellMeasure {
  /**
   * Height of the `<tr>` that holds the cell, in px.
   */
  rowHeight: number;
  /**
   * Whether the cell holds an inner `.htLineClamp` wrapper.
   */
  hasWrapper: boolean;
  /**
   * The wrapper's `clientHeight`, or `null` without a wrapper.
   */
  wrapperClientHeight: number | null;
  /**
   * The wrapper's `scrollHeight`, or `null` without a wrapper.
   */
  wrapperScrollHeight: number | null;
  /**
   * The inline `--ht-text-line-clamp` value of the wrapper, or `null`.
   */
  clampVar: string | null;
  /**
   * The computed line height, in px, of the wrapper (or of the cell without one).
   */
  lineHeight: number;
  /**
   * The cell's class list.
   */
  classes: string[];
  /**
   * The cell's full `textContent`.
   */
  text: string;
}

/**
 * Page Object for the `textEllipsis` line-clamp fixture (PRO-192): mounting a grid with exact
 * settings, changing them at runtime, and measuring what a cell really renders.
 */
export class TextEllipsisLineClampPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly editor: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.editor = page.locator('.handsontableInput');
  }

  /**
   * Open the fixture, build the grid with the given settings and wait for the first cell.
   *
   * @param {Record<string, unknown>} settings Handsontable settings (serializable only).
   * @param {Record<string, Record<string, unknown>>} cellOverrides Cell meta by `"row,col"`.
   */
  async goto(settings: Record<string, unknown> = {}, cellOverrides: Record<string, Record<string, unknown>> = {}): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/text-ellipsis-line-clamp.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.page.evaluate(([s, c]) => {
      (window as any).mountGrid(s, c);
    }, [settings, cellOverrides] as const);
    // Terminal states: the cell rendered, or the build threw and the fixture says why.
    await this.page.waitForFunction(
      () => !!document.querySelector('[data-testid="cell-0-0"]') || !!(window as any).htBuildError,
      undefined,
      { polling: BUNDLE_POLLING_MS }
    );

    const buildError = await this.page.evaluate(() => (window as any).htBuildError as string | undefined);

    if (buildError) {
      throw new Error(`The fixture grid failed to build: ${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**

   * A master cell by visual row/column, through its stable test id.

   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**

   * The clamp wrapper inside a master cell.

   */
  wrapper(row: number, col: number): Locator {
    return this.cell(row, col).locator('.htLineClamp');
  }

  /**

   * The full text every long cell holds.

   */
  longText(): Promise<string> {
    return this.page.evaluate(() => (window as any).LONG_TEXT as string);
  }

  /**

   * Change settings at runtime.

   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((s) => {
      (window as any).hot.updateSettings(s);
    }, settings);
  }

  /**

   * Write cell meta and redraw, the way an application changes one cell at runtime.

   */
  async setCellMetaAndRender(row: number, col: number, key: string, value: unknown): Promise<void> {
    await this.page.evaluate(([r, c, k, v]) => {
      const hot = (window as any).hot;

      hot.setCellMeta(r, c, k, v);
      hot.render();
    }, [row, col, key, value] as const);
  }

  /**

   * Select a cell with a real click, then press Enter so the editor opens by keyboard.

   */
  async openEditorWithKeyboard(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
    await this.openEditorFromSelection();
  }

  /**
   * Press Enter on the current selection and wait for the editor. Takes no cell on purpose: a second
   * click on the same cell shortly after the first is a double click, which opens the editor by
   * itself, so a test that re-opens a cell it already clicked moves the selection with the keys.
   */
  async openEditorFromSelection(): Promise<void> {
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * Whether the cell editor is open. Read through the editor, not through the textarea's CSS: the
   * textarea stays in the DOM and is only moved and made transparent while the editor is closed.
   */
  isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (window as any).hot.getActiveEditor()?.isOpened() === true);
  }

  /**

   * Write one cell's value through the API, the way an application loads data at runtime.

   */
  async setDataAt(row: number, col: number, value: unknown): Promise<void> {
    await this.page.evaluate(([r, c, v]) => {
      (window as any).hot.setDataAtCell(r, c, v);
    }, [row, col, value] as const);
  }

  /**

   * Redraw the grid without changing anything, to prove a second draw leaves a cell as it was.

   */
  async render(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).hot.render();
    });
  }

  /**

   * How many dropdown arrows a master cell holds.

   */
  arrows(row: number, col: number): Locator {
    return this.cell(row, col).locator('.htAutocompleteArrow');
  }

  /**

   * The value in the source data.

   */
  dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as any).hot.getDataAtCell(r, c), [row, col] as const);
  }

  /**

   * What the clipboard would carry for a one-cell range.

   */
  copyableAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as any).hot.getCopyableData(r, c), [row, col] as const);
  }

  /**

   * Measure a master cell: its row, its wrapper and its line height, in one round trip.

   */
  async measure(row: number, col: number): Promise<CellMeasure> {
    return this.grid.evaluate((root, [r, c]) => {
      const td = root.querySelector(`.ht_master td[data-row="${r}"][data-col="${c}"]`);

      if (!td) {
        throw new Error(`Master cell ${r},${c} is not rendered.`);
      }

      const wrapper = td.querySelector<HTMLElement>('.htLineClamp');
      const lineSource = wrapper ?? td;
      const lineHeight = parseFloat(getComputedStyle(lineSource).lineHeight);

      if (Number.isNaN(lineHeight)) {
        throw new Error(`Line height is not a pixel value: ${getComputedStyle(lineSource).lineHeight}`);
      }

      return {
        rowHeight: (td.closest('tr') as HTMLElement).getBoundingClientRect().height,
        hasWrapper: !!wrapper,
        wrapperClientHeight: wrapper ? wrapper.clientHeight : null,
        wrapperScrollHeight: wrapper ? wrapper.scrollHeight : null,
        clampVar: wrapper ? wrapper.style.getPropertyValue('--ht-text-line-clamp') || null : null,
        lineHeight,
        classes: [...td.classList],
        text: td.textContent ?? '',
      };
    }, [row, col] as const);
  }

  /**
   * The height of the `<tr>` that holds a visual row, in the master and in every overlay that
   * renders it, all read in one evaluation so no node is recycled between reads.
   */
  async rowHeightsAcrossOverlays(row: number): Promise<Record<string, number>> {
    return this.grid.evaluate((root, r) => {
      const heights: Record<string, number> = {};

      for (const overlay of root.querySelectorAll<HTMLElement>('.ht_master, [class*="ht_clone_"]')) {
        const td = overlay.querySelector(`td[data-row="${r}"]`);

        if (td) {
          const name = overlay.classList.contains('ht_master') ?
            'master' :
            [...overlay.classList].find(cls => cls.startsWith('ht_clone_')) as string;

          heights[name] = (td.closest('tr') as HTMLElement).getBoundingClientRect().height;
        }
      }

      return heights;
    }, row);
  }
}
