import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * What one read of the open text editor, the cell it edits and the grid's viewport reports. Every length is in
 * CSS pixels, and every edge is in viewport coordinates, so the numbers compare with each other directly.
 */
export interface EditorViewportRead {
  /** The editor input's outer width (`offsetWidth`: content, padding and border). */
  editorWidth: number;
  /** The editor input's left edge. */
  editorLeft: number;
  /** The editor input's right edge. */
  editorRight: number;
  /** The edited cell's left edge. */
  cellLeft: number;
  /** How far the edited cell's left edge is from the left edge of the holder's client box. */
  cellOffsetInHolder: number;
  /** The holder's client width: the grid's width minus the scrollbars it draws, which is the viewport the editor must fit. */
  holderClientWidth: number;
  /** The right edge of the holder's client box, which is where the viewport ends. */
  holderClientRight: number;
}

/**
 * The part of the Handsontable instance the page object reads. The shared `FixtureHotInstance` does not carry the
 * rendered-column probes, so the shape is declared here, as `FixedColumnsEndPage` does.
 */
interface HotFixture {
  selectCell(row: number, col: number): boolean;
  scrollViewportTo(options: { row?: number, col?: number, horizontalSnap?: 'start' | 'end' | 'auto' }): boolean;
  getCell(row: number, col: number, topmost: boolean): HTMLTableCellElement | null;
  getActiveEditor(): { isOpened(): boolean } | undefined;
  getFirstFullyVisibleColumn(): number;
  view: { _wt: { wtTable: {
    holder: HTMLElement,
    getFirstRenderedColumn(): number,
    getLastRenderedColumn(): number,
  } } };
}

type HotWindow = { hot: HotFixture };

/**
 * Page object for the text editor viewport-size fixture (`demo/text-editor-viewport-size.html`): a 300x200 grid of
 * 40px columns that scrolls on both axes, with a long text in cell (1, 1). It answers one question: how wide the
 * open text editor is, measured against the viewport the grid leaves it.
 *
 * Every measurement is ONE `evaluate` that reads the editor, the cell and the holder together. Walkontable recycles
 * the cell nodes across a draw and the editor follows the master holder while the cells follow a clone, so two reads
 * can describe two different frames and agree with each other on a stale one (`tests/AGENTS.md`, Determinism).
 */
export class TextEditorViewportSizePage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: Bundle;
  /** The grid's container. */
  readonly grid: Locator;
  /**
   * The input of the editor that is open now. Every editor class keeps its holder in the DOM for good and only hides
   * it when it closes (`ht_editor_hidden`), so the open one is the input inside a holder that is not hidden.
   */
  readonly editor: Locator;

  /**
   * Wires up the page object for one theme/bundle leg.
   *
   * @param {Page} page The Playwright page.
   * @param {string} theme The theme the leg runs.
   * @param {Bundle} bundle The bundle the leg runs.
   */
  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.editor = page.locator('.handsontableInputHolder:not(.ht_editor_hidden) .handsontableInput');
  }

  /**
   * Opens the fixture, waits for the grid to be built (a constructor failure the fixture captured in
   * `htBuildError` is rethrown with its cause by the shared helper), and waits for the grid to draw.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/text-editor-viewport-size.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(1, 1)).toBeVisible();
  }

  /**
   * A single data cell, by visual row and column, via its stable test id. The grid has no frozen panes and no
   * headers, so every cell is drawn once, in the master table.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell through the API, so the pointer cannot land on anything but the cell, and opens its editor with
   * a real Enter key press, as the legacy case did. Ends when the editor reports itself open.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as unknown as HotWindow).hot.selectCell(r, c), [row, col]);
    await this.page.keyboard.press('Enter');
    await expect(this.editor).toBeVisible();
    await expect.poll(
      () => this.page.evaluate(() => (window as unknown as HotWindow).hot.getActiveEditor()?.isOpened() ?? false),
      { message: 'the editor opened' }
    ).toBe(true);
  }

  /**
   * Scrolls the viewport so that a column is the first fully visible one (`scrollViewportTo()` with
   * `horizontalSnap: 'start'`, the call an application makes) and ends on a render-state probe: the grid has drawn
   * the column and reports it as the first fully visible one. A scroll offset cannot be the end of the wait,
   * because it settles before the redraw. Without the snap, a column already inside the viewport makes the call a
   * no-op and a test would re-measure the state it had.
   *
   * @param {number} col Visual column to put at the viewport's start edge.
   */
  async scrollColumnToViewportStart(col: number): Promise<void> {
    await this.page.evaluate((c) => {
      (window as unknown as HotWindow).hot.scrollViewportTo({ col: c, horizontalSnap: 'start' });
    }, col);

    await expect.poll(() => this.page.evaluate((c) => {
      const { hot } = window as unknown as HotWindow;
      const { wtTable } = hot.view._wt;
      const drawn = wtTable.getFirstRenderedColumn() <= c && c <= wtTable.getLastRenderedColumn();

      return drawn && hot.getFirstFullyVisibleColumn() === c;
    }, col), { message: `the grid put column ${col} at the viewport's start` }).toBe(true);
  }

  /**
   * Reads the open editor, the cell it edits and the holder's client box in one evaluation.
   *
   * @param {number} row Visual row of the edited cell.
   * @param {number} col Visual column of the edited cell.
   */
  async readEditorViewport(row: number, col: number): Promise<EditorViewportRead> {
    return this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as HotWindow;
      const { holder } = hot.view._wt.wtTable;
      const cell = hot.getCell(r, c, true);
      const editor = document.querySelector<HTMLElement>(
        '.handsontableInputHolder:not(.ht_editor_hidden) .handsontableInput'
      );

      if (!cell || !editor) {
        throw new Error(`Cell ${r},${c} or the open editor is not rendered`);
      }

      const holderBox = holder.getBoundingClientRect();
      const holderClientLeft = holderBox.left + holder.clientLeft;
      const editorBox = editor.getBoundingClientRect();
      const cellBox = cell.getBoundingClientRect();

      return {
        editorWidth: editor.offsetWidth,
        editorLeft: editorBox.left,
        editorRight: editorBox.right,
        cellLeft: cellBox.left,
        cellOffsetInHolder: cellBox.left - holderClientLeft,
        holderClientWidth: holder.clientWidth,
        holderClientRight: holderClientLeft + holder.clientWidth,
      };
    }, [row, col] as const);
  }
}
