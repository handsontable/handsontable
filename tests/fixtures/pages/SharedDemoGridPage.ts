import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * The CSS transforms `fixtures/demo/shared-demo-grid.html` can put on `<body>` before it builds the
 * grid.
 */
export type SharedDemoTransform = 'none' | 'scale-0.75' | 'scale-0.5';

/**
 * A selection range as `getSelected()` reports it: `[fromRow, fromColumn, toRow, toColumn]`.
 */
export type SelectedRange = [number, number, number, number];

/**
 * What the open editor holds and how big it is, read in one evaluate.
 */
export type EditorState = {
  opened: boolean,
  value: string,
  height: number,
  scrollHeight: number,
  clientHeight: number,
  scrollWidth: number,
  clientWidth: number,
};

/**
 * The scroll offsets of the master holder and the two overlays that scroll with it on one axis each,
 * and where the master's first rendered row sits against its row header.
 */
export type ScrollState = {
  master: number,
  inlineStart: number,
  top: number,
  firstFullyVisibleRow: number,
  rowHeaderOffset: number,
};

/**
 * The sizes the grid laid out, in CSS pixels before any transform: what #10482 sized from the
 * transformed box.
 */
export type LayoutMetrics = {
  scale: number,
  holderWidth: number,
  holderHeight: number,
  lastRenderedRow: number,
  rowHeights: number[],
  rowHeaderHeights: number[],
  columnWidths: number[],
  columnHeaderWidths: number[],
};

type SharedDemoHot = {
  getSelected(): SelectedRange[] | undefined,
  getSelectedRangeLast(): { highlight: { row: number, col: number } } | undefined,
  getDataAtCell(row: number, column: number): unknown,
  getSourceDataAtCell(row: number, column: number): unknown,
  setDataAtCell(row: number, column: number, value: unknown): void,
  getCell(row: number, column: number): HTMLTableCellElement | null,
  getCellMeta(row: number, column: number): { rowspan?: number, colspan?: number },
  toPhysicalRow(row: number): number,
  isListening(): boolean,
  getActiveEditor(): {
    isOpened(): boolean,
    TEXTAREA: HTMLTextAreaElement | HTMLInputElement,
  } | undefined,
  getPlugin(name: 'undoRedo'): { isUndoAvailable(): boolean },
  view: {
    getFirstFullyVisibleRow(): number,
    getFirstRenderedVisibleRow(): number,
    getLastRenderedVisibleRow(): number,
  },
};

type SharedDemoWindow = { hot: SharedDemoHot };

/**
 * Page Object for the shared-demo-grid fixture: the visual suite's `/` grid, rebuilt for the functional
 * tier. The states the `multi-frameworks` captures photographed – where Tab and the arrows move the
 * focus, a merged cell under a column selection, a moved row, a wheel scroll, a drag selection, the
 * text and date editors, the grid under a CSS scale – are asserted on it.
 *
 * The fixture stamps every rendered cell and header with a test id built from VISUAL indexes. A header
 * is drawn once per overlay, so each locator picks the overlay that takes the pointer.
 */
export class SharedDemoGridPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
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
   * Opens the fixture and waits for the grid to have rendered its first cell.
   *
   * @param {SharedDemoTransform} [transform] The transform on `<body>` while the grid is built.
   */
  async goto(transform: SharedDemoTransform = 'none'): Promise<void> {
    await this.page.goto('/tests/fixtures/demo/shared-demo-grid.html'
      + `?theme=${this.theme}&bundle=${this.bundle}&transform=${transform}`);
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The shared-demo-grid fixture failed to build its grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
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
   * A column header, in the top overlay that takes a click on it (no column is frozen).
   *
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  columnHeader(column: number): Locator {
    return this.grid.locator('.ht_clone_top').getByTestId(`col-header-${column}`);
  }

  /**
   * A row header, in the inline-start overlay that takes a click on it.
   *
   * @param {number} row The visual row index.
   * @returns {Locator}
   */
  rowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_inline_start').getByTestId(`row-header-${row}`);
  }

  /**
   * The corner header, in the corner overlay that is painted over the others.
   *
   * @returns {Locator}
   */
  get corner(): Locator {
    return this.grid.locator('.ht_clone_top_inline_start_corner').getByTestId('corner');
  }

  /**
   * Presses a key, a number of times, on whatever holds the focus – the way a user walks the grid.
   *
   * @param {string} key The key or chord.
   * @param {number} [times] How many presses.
   */
  async press(key: string, times = 1): Promise<void> {
    for (let press = 0; press < times; press++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.keyboard.press(key);
    }
  }

  /**
   * The grid's selection, as `getSelected()` returns it.
   *
   * @returns {Promise<SelectedRange[] | undefined>}
   */
  async selected(): Promise<SelectedRange[] | undefined> {
    return this.page.evaluate(() => (window as unknown as SharedDemoWindow).hot.getSelected());
  }

  /**
   * Everything the grid draws as selected, read from the DOM in one evaluate: the test ids of the
   * elements carrying the focus (`current`), and how many cells and headers carry a selection class.
   * The overlays draw a header more than once, so the test ids are de-duplicated.
   *
   * @returns {Promise<{ current: string[], areas: number, highlightedHeaders: number }>}
   */
  async drawnSelection(): Promise<{ current: string[], areas: number, highlightedHeaders: number }> {
    return this.grid.evaluate((grid) => {
      const current = [...grid.querySelectorAll('td.current, th.current')]
        .map(element => element.getAttribute('data-testid') ?? '?');

      return {
        current: [...new Set(current)].sort(),
        areas: grid.querySelectorAll('.ht_master td.area, .ht_master td.highlight').length,
        highlightedHeaders: grid.querySelectorAll('th.ht__highlight, th.ht__active_highlight').length,
      };
    });
  }

  /**
   * The test ids of the column and row headers drawn as part of the active selection
   * (`ht__active_highlight`), de-duplicated across overlays and sorted.
   *
   * @returns {Promise<string[]>}
   */
  async activeHeaders(): Promise<string[]> {
    return this.grid.evaluate((grid) => {
      const ids = [...grid.querySelectorAll('th.ht__active_highlight')]
        .map(th => th.getAttribute('data-testid') ?? '?');

      return [...new Set(ids)].sort();
    });
  }

  /**
   * The focus ring a focused header draws, against the selection border color the theme resolves, in
   * one evaluate. A header does not get the selection border elements a cell gets: the stylesheet
   * draws its ring as an inset `box-shadow` on `th.current`, in `--ht-cell-selection-border-color`.
   * The header is read in the overlay that paints it on top (the corner overlay for the corner, the
   * top overlay for a column header, the inline-start overlay for a row header).
   *
   * @param {string} overlay The overlay class, such as `ht_clone_top`.
   * @param {string} testId The header's test id.
   * @returns {Promise<{ focused: boolean, boxShadow: string, ringColor: string }>}
   */
  async focusRing(overlay: string, testId: string): Promise<{ focused: boolean, boxShadow: string, ringColor: string }> {
    return this.grid.evaluate((grid, [overlayClass, id]) => {
      const header = grid.querySelector(`.${overlayClass} [data-testid="${id}"]`) as HTMLElement;
      // Resolve the token to the color string the browser serializes, through an element inside the
      // themed root so the theme's value applies.
      const probe = document.createElement('div');

      probe.style.color = 'var(--ht-cell-selection-border-color)';
      header.appendChild(probe);

      const ringColor = getComputedStyle(probe).color;

      probe.remove();

      return {
        focused: header.classList.contains('current'),
        boxShadow: getComputedStyle(header).boxShadow,
        ringColor,
      };
    }, [overlay, testId] as [string, string]);
  }

  /**
   * Whether the page itself holds the focus, and whether the element that does sits inside the grid.
   *
   * @returns {Promise<{ pageHasFocus: boolean, focusInGrid: boolean, listening: boolean }>}
   */
  async focusState(): Promise<{ pageHasFocus: boolean, focusInGrid: boolean, listening: boolean }> {
    return this.page.evaluate(() => ({
      pageHasFocus: document.hasFocus(),
      focusInGrid: document.querySelector('[data-testid="grid"]')?.contains(document.activeElement) ?? false,
      listening: (window as unknown as SharedDemoWindow).hot.isListening(),
    }));
  }

  /**
   * The value the grid holds at visual coordinates.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Promise<unknown>}
   */
  async dataAt(row: number, column: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as unknown as SharedDemoWindow).hot.getDataAtCell(r, c),
      [row, column] as [number, number]);
  }

  /**
   * The source value at visual coordinates – for the date column the ISO string the native input works
   * with, where `dataAt()` would answer the same and the cell shows it formatted.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Promise<unknown>}
   */
  async sourceAt(row: number, column: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as SharedDemoWindow;

      return hot.getSourceDataAtCell(hot.toPhysicalRow(r), c);
    }, [row, column] as [number, number]);
  }

  /**
   * Writes a value through the API, the way a test seeds a cell it is about to copy.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @param {unknown} value The value.
   */
  async setDataAt(row: number, column: number, value: unknown): Promise<void> {
    await this.page.evaluate(([r, c, v]) => {
      (window as unknown as SharedDemoWindow).hot.setDataAtCell(r as number, c as number, v);
    }, [row, column, value] as [number, number, unknown]);
  }

  /**
   * The physical row behind each of the first visual rows: what a row move reorders.
   *
   * @param {number} count How many visual rows, from the first.
   * @returns {Promise<number[]>}
   */
  async physicalRows(count: number): Promise<number[]> {
    return this.page.evaluate((rows) => {
      const { hot } = window as unknown as SharedDemoWindow;

      return Array.from({ length: rows }, (_, row) => hot.toPhysicalRow(row));
    }, count);
  }

  /**
   * The text shown in a rendered cell.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Promise<string>}
   */
  async shownAt(row: number, column: number): Promise<string> {
    return this.cell(row, column).innerText();
  }

  /**
   * Selects a cell with a click and opens its editor with Enter, as a user does.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   */
  async openEditor(row: number, column: number): Promise<void> {
    await this.cell(row, column).click();
    await expect.poll(async() => this.selected()).toEqual([[row, column, row, column]]);
    await this.page.keyboard.press('Enter');
    await expect.poll(async() => (await this.editorState()).opened).toBe(true);
  }

  /**
   * The active editor's element.
   *
   * @returns {Locator}
   */
  get editorInput(): Locator {
    return this.grid.locator('.handsontableInputHolder .handsontableInput');
  }

  /**
   * What the active editor holds and its size, in one evaluate.
   *
   * @returns {Promise<EditorState>}
   */
  async editorState(): Promise<EditorState> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as SharedDemoWindow).hot.getActiveEditor();

      if (!editor) {
        return {
          opened: false, value: '', height: 0, scrollHeight: 0, clientHeight: 0, scrollWidth: 0, clientWidth: 0,
        };
      }

      const input = editor.TEXTAREA;

      return {
        opened: editor.isOpened(),
        value: input.value,
        height: input.offsetHeight,
        scrollHeight: input.scrollHeight,
        clientHeight: input.clientHeight,
        scrollWidth: input.scrollWidth,
        clientWidth: input.clientWidth,
      };
    });
  }

  /**
   * Whether the grid's own undo stack holds a step: what a Ctrl+Z inside the editor must leave alone.
   *
   * @returns {Promise<boolean>}
   */
  async gridUndoAvailable(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as SharedDemoWindow).hot.getPlugin('undoRedo')
      .isUndoAvailable());
  }

  /**
   * Drags a selection with the real mouse from the middle of a cell by an offset, as the visual spec
   * did, and returns the cell the pointer was released over, read from the master cells' boxes before
   * the drag (the selection border is drawn over them after it).
   *
   * @param {number} row The visual row of the cell the drag starts in.
   * @param {number} column The visual column of the cell the drag starts in.
   * @param {number} offset How far right and down to drag, in CSS pixels.
   * @returns {Promise<{ row: number, column: number }>}
   */
  async dragSelectFrom(row: number, column: number, offset: number): Promise<{ row: number, column: number }> {
    const box = await this.cell(row, column).boundingBox();

    if (box === null) {
      throw new Error(`Cell (${row}, ${column}) has no box to start a drag from.`);
    }

    const start = { x: box.x + (box.width / 2), y: box.y + (box.height / 2) };
    const end = { x: start.x + offset, y: start.y + offset };
    const target = await this.grid.evaluate((grid, point) => {
      const hit = [...grid.querySelectorAll('.ht_master td[data-testid]')].find((cell) => {
        const rect = cell.getBoundingClientRect();

        return point.x >= rect.left && point.x < rect.right && point.y >= rect.top && point.y < rect.bottom;
      });
      const [, r, c] = (hit?.getAttribute('data-testid') ?? '').split('-');

      return hit ? { row: Number(r), column: Number(c) } : null;
    }, end);

    if (target === null) {
      throw new Error(`No master cell lies under the drag's end point ${JSON.stringify(end)}.`);
    }

    await this.page.mouse.move(start.x, start.y);
    await this.page.mouse.down();
    await this.page.mouse.move(end.x, end.y);
    await this.page.mouse.up();

    return target;
  }

  /**
   * Drags a row header with the real mouse onto the upper part of another row's header: the gesture
   * ManualRowMove takes as "put the dragged row in that row's place".
   *
   * @param {number} row The visual row whose header is dragged.
   * @param {number} targetRow The visual row it is dropped on.
   */
  async dragRowHeaderOnto(row: number, targetRow: number): Promise<void> {
    const from = await this.rowHeader(row).boundingBox();
    const to = await this.rowHeader(targetRow).boundingBox();

    if (from === null || to === null) {
      throw new Error(`Row header ${row} or ${targetRow} has no box to drag between.`);
    }

    await this.page.mouse.move(from.x + (from.width / 2), from.y + (from.height / 2));
    await this.page.mouse.down();
    await this.page.mouse.move(to.x + (to.width / 2), to.y + 3, { steps: 5 });
    await this.page.mouse.up();
  }

  /**
   * Turns the mouse wheel over the middle of the master table's body.
   *
   * @param {number} deltaY The wheel delta, in CSS pixels.
   */
  async wheelOverBody(deltaY: number): Promise<void> {
    const body = await this.grid.locator('.ht_master .htCore tbody').boundingBox();

    if (body === null) {
      throw new Error('The master table body has no box to turn the wheel over.');
    }

    await this.page.mouse.move(body.x + (body.width / 2), body.y + 200);
    await this.page.mouse.wheel(0, deltaY);
  }

  /**
   * The scroll offsets and the row-header alignment, in one evaluate: the master holder, the
   * inline-start overlay (the row headers, which follow it vertically) and the top overlay (the
   * column headers, which must not move vertically), and how far the first fully visible row's header
   * sits from that row's first cell.
   *
   * @returns {Promise<ScrollState>}
   */
  async scrollState(): Promise<ScrollState> {
    return this.grid.evaluate((grid) => {
      const { hot } = window as unknown as SharedDemoWindow;
      const holder = (selector: string) => grid.querySelector(`${selector} .wtHolder`) as HTMLElement;
      const row = hot.view.getFirstFullyVisibleRow();
      const cell = grid.querySelector(`.ht_master [data-testid="cell-${row}-0"]`) as HTMLElement;
      const header = grid.querySelector(`.ht_clone_inline_start [data-testid="row-header-${row}"]`) as HTMLElement;

      return {
        master: holder('.ht_master').scrollTop,
        inlineStart: holder('.ht_clone_inline_start').scrollTop,
        top: holder('.ht_clone_top').scrollTop,
        firstFullyVisibleRow: row,
        rowHeaderOffset: header.getBoundingClientRect().top - cell.getBoundingClientRect().top,
      };
    });
  }

  /**
   * The sizes the grid laid out, in one evaluate: the master holder, the last row rendered, and the
   * first rows' heights and the columns' widths in the master next to their headers in the overlays.
   * Every size is a layout size (`offset*`), which a CSS transform does not scale; the scale itself is
   * read off the root's rendered box against its layout box, so the caller can prove the transform
   * applied.
   *
   * @param {number} rows How many rows, from the first, to compare with their headers.
   * @returns {Promise<LayoutMetrics>}
   */
  async layoutMetrics(rows: number): Promise<LayoutMetrics> {
    return this.grid.evaluate((grid, rowCount) => {
      const { hot } = window as unknown as SharedDemoWindow;
      const holder = grid.querySelector('.ht_master .wtHolder') as HTMLElement;
      const root = grid.querySelector('.handsontable') as HTMLElement;
      const height = (selector: string) => (grid.querySelector(selector) as HTMLElement | null)?.offsetHeight ?? -1;
      const width = (selector: string) => (grid.querySelector(selector) as HTMLElement | null)?.offsetWidth ?? -1;
      const rowIndexes = Array.from({ length: rowCount }, (_, row) => row);
      const columnIndexes = Array.from({ length: 9 }, (_, column) => column);

      return {
        scale: root.getBoundingClientRect().width / root.offsetWidth,
        holderWidth: holder.offsetWidth,
        holderHeight: holder.offsetHeight,
        lastRenderedRow: hot.view.getLastRenderedVisibleRow(),
        rowHeights: rowIndexes.map(row => height(`.ht_master [data-testid="cell-${row}-0"]`)),
        rowHeaderHeights: rowIndexes.map(row => height(`.ht_clone_inline_start [data-testid="row-header-${row}"]`)),
        columnWidths: columnIndexes.map(column => width(`.ht_master [data-testid="cell-0-${column}"]`)),
        columnHeaderWidths: columnIndexes.map(column => width(`.ht_clone_top [data-testid="col-header-${column}"]`)),
      };
    }, rows);
  }
}
