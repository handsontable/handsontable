import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The layouts `fixtures/demo/grid-layouts.html` builds, one per cross-browser visual demo route.
 */
export type GridLayout =
  'frozen-hidden' |
  'rtl-nested-headers' |
  'merged-sorted' |
  'custom-borders' |
  'nested-headers' |
  'nested-rows' |
  'large';

/**
 * A selection range as `getSelected()` reports it: `[fromRow, fromColumn, toRow, toColumn]`.
 */
export type SelectedRange = [number, number, number, number];

type GridLayoutsWindow = {
  hot: {
    getSelected(): SelectedRange[] | undefined,
    getDataAtCell(row: number, column: number): unknown,
    countRows(): number,
    countCols(): number,
    getSettings(): { fixedColumnsStart?: number, nestedHeaders?: unknown[] },
  },
};

/**
 * Page Object for the grid-layouts fixture: one grid in the shape of one cross-browser demo route.
 *
 * The fixture stamps every rendered cell and header with a test id built from VISUAL indexes. A
 * header is drawn once per overlay, so the locators pick the overlay the pointer actually reaches:
 * a frozen column's header lives in the top-start corner, which is painted over the top overlay's
 * copy, and a click aimed at the copy underneath is refused by Playwright's hit-target check.
 */
export class GridLayoutsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The grid container.
   *
   * @returns {Locator}
   */
  get grid(): Locator {
    return this.page.getByTestId('grid');
  }

  /**
   * Opens the fixture in one layout and waits for the grid to have rendered its first cell.
   *
   * @param {GridLayout} layout The layout to build.
   */
  async goto(layout: GridLayout): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/grid-layouts.html?theme=${this.theme}&bundle=${this.bundle}&layout=${layout}`);
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The grid-layouts fixture failed to build the ${layout} grid: ${initError}`);
    }

    await expect(this.grid.locator('.ht_master td[data-testid]').first()).toBeVisible();
  }

  /**
   * How many header rows the grid draws: the nested header's row count, or one.
   *
   * @returns {Promise<number>}
   */
  async headerLevels(): Promise<number> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as GridLayoutsWindow;

      return hot.getSettings().nestedHeaders?.length ?? 1;
    });
  }

  /**
   * The header of a visual column, in the overlay that takes a click on it. `level` counts from the
   * top header row; omitted, it is the row nearest the cells, which has one cell per column.
   *
   * @param {number} column The visual column index.
   * @param {number} [level] The header row, 0 being the top one.
   * @returns {Promise<Locator>}
   */
  async columnHeader(column: number, level?: number): Promise<Locator> {
    const headerLevel = level ?? (await this.headerLevels()) - 1;
    const frozen = await this.page.evaluate(() => {
      const { hot } = window as unknown as GridLayoutsWindow;

      return hot.getSettings().fixedColumnsStart ?? 0;
    });
    const overlay = column < frozen ? '.ht_clone_top_inline_start_corner' : '.ht_clone_top';

    return this.grid.locator(overlay).getByTestId(`col-header-${headerLevel}-${column}`);
  }

  /**
   * The header of a visual row, in the inline-start overlay that takes a click on it.
   *
   * @param {number} row The visual row index.
   * @returns {Locator}
   */
  rowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_inline_start').getByTestId(`row-header-${row}`);
  }

  /**
   * A cell of the master table, by visual coordinates.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  cell(row: number, column: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${column}`);
  }

  /**
   * Clicks a column header, with optional modifiers, the way a user starts or extends a column
   * selection.
   *
   * @param {number} column The visual column index.
   * @param {Array<'Shift' | 'ControlOrMeta'>} [modifiers] Keys held during the click.
   */
  async clickColumnHeader(column: number, modifiers: Array<'Shift' | 'ControlOrMeta'> = []): Promise<void> {
    await (await this.columnHeader(column)).click({ modifiers });
  }

  /**
   * Clicks a row header, with optional modifiers.
   *
   * @param {number} row The visual row index.
   * @param {Array<'Shift' | 'ControlOrMeta'>} [modifiers] Keys held during the click.
   */
  async clickRowHeader(row: number, modifiers: Array<'Shift' | 'ControlOrMeta'> = []): Promise<void> {
    await this.rowHeader(row).click({ modifiers });
  }

  /**
   * The grid's selection, as `getSelected()` returns it.
   *
   * @returns {Promise<SelectedRange[] | undefined>}
   */
  async selected(): Promise<SelectedRange[] | undefined> {
    return this.page.evaluate(() => (window as unknown as GridLayoutsWindow).hot.getSelected());
  }

  /**
   * The focused cell or header of the last selection layer: where keyboard navigation continues
   * from, and what the grid draws with the `current` class.
   *
   * @returns {Promise<{ row: number, col: number } | undefined>}
   */
  async focus(): Promise<{ row: number, col: number } | undefined> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as {
        hot: { getSelectedRangeLast(): { highlight: { row: number, col: number } } | undefined },
      };
      const highlight = hot.getSelectedRangeLast()?.highlight;

      return highlight ? { row: highlight.row, col: highlight.col } : undefined;
    });
  }

  /**
   * The visual indexes of the columns whose header, at one header level, is drawn as part of the
   * active selection (`ht__active_highlight`). Read from the overlay headers in one evaluate, so the
   * list describes one frame.
   *
   * @param {number} level The header row, 0 being the top one.
   * @returns {Promise<number[]>}
   */
  async activeColumnHeaders(level: number): Promise<number[]> {
    return this.grid.evaluate((grid, headerLevel) => {
      const prefix = `col-header-${headerLevel}-`;
      const columns = [...grid.querySelectorAll(`.ht_clone_top th[data-testid^="${prefix}"],`
        + ` .ht_clone_top_inline_start_corner th[data-testid^="${prefix}"]`)]
        .filter(th => th.classList.contains('ht__active_highlight'))
        .map(th => Number(th.getAttribute('data-testid')?.slice(prefix.length)));

      return [...new Set(columns)].sort((a, b) => a - b);
    }, level);
  }

  /**
   * The visual indexes of the rows whose header is drawn as part of the active selection.
   *
   * @returns {Promise<number[]>}
   */
  async activeRowHeaders(): Promise<number[]> {
    return this.grid.evaluate((grid) => {
      const rows = [...grid.querySelectorAll('.ht_clone_inline_start th[data-testid^="row-header-"]')]
        .filter(th => th.classList.contains('ht__active_highlight'))
        .map(th => Number(th.getAttribute('data-testid')?.slice('row-header-'.length)));

      return [...new Set(rows)].sort((a, b) => a - b);
    });
  }

  /**
   * The value the grid holds at visual coordinates.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Promise<unknown>}
   */
  async dataAt(row: number, column: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as unknown as GridLayoutsWindow).hot.getDataAtCell(r, c),
      [row, column] as [number, number]);
  }

  /**
   * Scrolls the master viewport to one of its ends the way the visual spec did (the holder's own
   * `scrollTo`, past the end and clamped by the browser), then waits for what that scroll causes: a
   * redraw that renders the grid's last row and column (or its first ones), and the scrollbar
   * clearance band (#10370) closing again. A click aimed into the band while it is up belongs to the
   * scrollbar and is swallowed, so a range meant to reach the grid's far corner would stop short.
   *
   * The redraw is the render-state probe, not the scroll offset: the band is opened by the same
   * `scroll` handler that redraws, so once the redraw is seen the band is up if it is going to be.
   * The pointer is parked off the grid first, because a pointer resting within 26 px of a scrollbar
   * keeps that scrollbar's band open by design (`OVERLAY_SCROLLBAR_PROXIMITY`) — which is where it
   * rests after a click on the far corner.
   *
   * @param {'start' | 'end'} edge Which end to scroll to.
   */
  async scrollViewportTo(edge: 'start' | 'end'): Promise<void> {
    const offset = edge === 'end' ? 100_000 : 0;

    await this.page.mouse.move(0, 0);

    await this.grid.locator('.ht_master .wtHolder').evaluate((holder, value) => {
      holder.scrollTo(value, value);
    }, offset);

    await expect.poll(async() => this.page.evaluate((toEnd) => {
      const { hot } = window as unknown as { hot: {
        countRows(): number,
        countCols(): number,
        view: {
          getFirstRenderedVisibleRow(): number,
          getFirstRenderedVisibleColumn(): number,
          getLastRenderedVisibleRow(): number,
          getLastRenderedVisibleColumn(): number,
        },
      } };

      return toEnd
        ? hot.view.getLastRenderedVisibleRow() === hot.countRows() - 1
          && hot.view.getLastRenderedVisibleColumn() === hot.countCols() - 1
        : hot.view.getFirstRenderedVisibleRow() === 0 && hot.view.getFirstRenderedVisibleColumn() === 0;
    }, edge === 'end')).toBe(true);
    await expect(this.page.locator('.htScrollbarClearanceFiller')).toHaveCount(0);
  }

  /**
   * Every value of the grid, in visual order, as `getData()` returns it.
   *
   * @returns {Promise<unknown[][]>}
   */
  async data(): Promise<unknown[][]> {
    return this.page.evaluate(() => (window as unknown as { hot: { getData(): unknown[][] } }).hot.getData());
  }

  /**
   * Edits a cell the way a user does: click it, open the editor with Enter, replace the text, and
   * commit with Enter. Waits for the editor to close, so the edit is in the grid when this returns.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @param {string} text The new value.
   */
  async editCell(row: number, column: number, text: string): Promise<void> {
    const editor = this.grid.locator('.handsontableInputHolder textarea.handsontableInput');

    await this.cell(row, column).click();
    await this.page.keyboard.press('Enter');
    await expect.poll(async() => this.editorOpened()).toBe(true);
    await editor.fill(text);
    await this.page.keyboard.press('Enter');
    // The closed editor stays in the DOM (`ht_editor_hidden`), and Playwright still reports its
    // textarea as visible, so the editor's own state is what says the edit was committed.
    await expect.poll(async() => this.editorOpened()).toBe(false);
  }

  /**
   * Whether the grid's active editor is open.
   *
   * @returns {Promise<boolean>}
   */
  async editorOpened(): Promise<boolean> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as { hot: { getActiveEditor(): { isOpened(): boolean } | undefined } };

      return hot.getActiveEditor()?.isOpened() ?? false;
    });
  }

  /**
   * Undoes the last change with the platform's keyboard shortcut (Ctrl+Z, or Cmd+Z on macOS).
   */
  async undoWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  /**
   * Redoes the last undone change with the platform's keyboard shortcut (Ctrl+Y, or Cmd+Y on macOS),
   * the one the cross-browser visual spec pressed.
   */
  async redoWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+y');
  }

  /**
   * The grid's visual row and column counts.
   *
   * @returns {Promise<{ rows: number, columns: number }>}
   */
  async size(): Promise<{ rows: number, columns: number }> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as GridLayoutsWindow;

      return { rows: hot.countRows(), columns: hot.countCols() };
    });
  }
}
