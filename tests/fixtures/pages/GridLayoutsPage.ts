import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { dragResizeHandle } from '../gestures';

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
   * keeps that scrollbar's band open by design (`OVERLAY_SCROLLBAR_PROXIMITY`) – which is where it
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
   * Drags a column header's resize handle by a distance: hover the header (which is what attaches the
   * handle), then press it, move and release with the real mouse.
   *
   * @param {number} column The visual column index.
   * @param {number} deltaX How far to drag, in CSS pixels.
   */
  async dragColumnHandle(column: number, deltaX: number): Promise<void> {
    const handle = this.grid.locator('.manualColumnResizer');

    await this.page.mouse.move(0, 0);
    await (await this.columnHeader(column)).hover();
    await expect(handle).toBeAttached();
    await dragResizeHandle(this.page, handle, { x: deltaX });
  }

  /**
   * Drags a row header's resize handle by a distance.
   *
   * @param {number} row The visual row index.
   * @param {number} deltaY How far to drag, in CSS pixels.
   */
  async dragRowHandle(row: number, deltaY: number): Promise<void> {
    const handle = this.grid.locator('.manualRowResizer');

    await this.page.mouse.move(0, 0);
    await this.rowHeader(row).hover();
    await expect(handle).toBeAttached();
    await dragResizeHandle(this.page, handle, { y: deltaY });
  }

  /**
   * The rendered width of a column and the rendered height of a row, read from the box of the cell at
   * their crossing, in one evaluate: the grid recycles its cells, so two separate reads could measure
   * two different rows. `getRowHeight()` cannot stand in for the height, because it reports nothing for
   * a row whose height was never set.
   *
   * @param {number} column The visual column index.
   * @param {number} row The visual row index.
   * @returns {Promise<{ width: number, height: number }>}
   */
  async sizes(column: number, row: number): Promise<{ width: number, height: number }> {
    return this.page.evaluate(([c, r]) => {
      const { hot } = window as unknown as {
        hot: { getCell(row: number, column: number, topmost: boolean): HTMLTableCellElement | null },
      };
      const cell = hot.getCell(r, c, true);

      if (cell === null) {
        throw new Error(`Cell (${r}, ${c}) is not rendered.`);
      }

      return {
        width: cell.getBoundingClientRect().width,
        height: (cell.parentElement as HTMLElement).getBoundingClientRect().height,
      };
    }, [column, row] as [number, number]);
  }

  /**
   * The width `ManualColumnResize` stores for a column, `null` while the column was never resized.
   *
   * @param {number} column The visual column index.
   * @returns {Promise<number | null>}
   */
  async manualColumnSize(column: number): Promise<number | null> {
    return this.page.evaluate((c) => {
      const { hot } = window as unknown as {
        hot: { getPlugin(name: string): { getManualSize(column: number): number | null } },
      };

      return hot.getPlugin('manualColumnResize').getManualSize(c);
    }, column);
  }

  /**
   * Makes every column resize end without a change, the way a `beforeColumnResize` callback that
   * returns `false` does.
   */
  async cancelColumnResizes(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as {
        hot: { addHook(name: string, callback: () => boolean): void },
      };

      hot.addHook('beforeColumnResize', () => false);
    });
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
   * Writes cell values through the API (setup, not the behavior under test).
   *
   * @param {Array<[number, number, unknown]>} changes `[row, column, value]` triples, by visual index.
   */
  async setValues(changes: Array<[number, number, unknown]>): Promise<void> {
    await this.page.evaluate(c => (window as unknown as {
      hot: { setDataAtCell(changes: Array<[number, number, unknown]>): void },
    }).hot.setDataAtCell(c), changes);
  }

  /**
   * Prepares a fill: empties one column through the API (setup, not the behavior under test), then
   * selects one cell of it through the API too, so no real click lands twice on the cell and opens
   * its editor as a double click.
   *
   * @param {number} column The visual column to empty.
   * @param {number} row The visual row of the cell to fill from.
   * @param {string} value The value to put in that cell.
   */
  async prepareFillFrom(column: number, row: number, value: string): Promise<void> {
    await this.page.evaluate(([c, r, v]) => {
      const { hot } = window as unknown as { hot: {
        countRows(): number,
        setDataAtCell(changes: Array<[number, number, unknown]>): void,
        selectCell(row: number, column: number): void,
      } };
      const changes: Array<[number, number, unknown]> = Array.from({ length: hot.countRows() },
        (_, index) => [index, c, index === r ? v : null]);

      hot.setDataAtCell(changes);
      hot.selectCell(r, c);
    }, [column, row, value] as [number, number, string]);
    await expect(this.grid.locator('.ht_master .wtBorder.current.corner').first()).toBeVisible();
  }

  /**
   * Double-clicks the fill handle (the selection's corner), which fills the selection down as far as
   * the neighboring columns hold data, and waits until the grid has handled the double click
   * (`afterOnCellCornerDblClick`). That hook runs whether or not a fill follows, so a test that
   * expects no fill still knows the gesture reached the handle.
   */
  async doubleClickFillHandle(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as { hot: {
        rootElement: HTMLElement,
        addHookOnce(name: string, callback: () => void): void,
      } };

      hot.rootElement.dataset.fillHandleDoubleClicked = 'false';
      hot.addHookOnce('afterOnCellCornerDblClick', () => {
        hot.rootElement.dataset.fillHandleDoubleClicked = 'true';
      });
    });
    await this.grid.locator('.ht_master .wtBorder.current.corner').first().dblclick();
    await expect.poll(async() => this.page.evaluate(() => (window as unknown as { hot: { rootElement: HTMLElement } })
      .hot.rootElement.dataset.fillHandleDoubleClicked)).toBe('true');
  }

  /**
   * Changes the grid's settings.
   *
   * @param {object} settings The settings to apply with `updateSettings()`.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(s => (window as unknown as {
      hot: { updateSettings(settings: Record<string, unknown>): void },
    }).hot.updateSettings(s), settings);
  }

  /**
   * Whether the grid's validator accepted a cell's value: `getCellMeta().valid`, which a cell that
   * failed validation keeps as `false` (and draws with `htInvalid`).
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Promise<boolean | undefined>}
   */
  async cellValid(row: number, column: number): Promise<boolean | undefined> {
    return this.page.evaluate(([r, c]) => (window as unknown as {
      hot: { getCellMeta(row: number, column: number): { valid?: boolean } },
    }).hot.getCellMeta(r, c).valid, [row, column] as [number, number]);
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
