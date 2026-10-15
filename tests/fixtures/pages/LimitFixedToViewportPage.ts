import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

export type FrozenEdge = 'top' | 'bottom' | 'start' | 'end';

const CLONE_CLASS: Record<FrozenEdge, string> = {
  top: 'ht_clone_top',
  bottom: 'ht_clone_bottom',
  start: 'ht_clone_inline_start',
  end: 'ht_clone_inline_end',
};

/**
 * Page Object for the `limitFixedToViewport` option.
 *
 * The fixture is a 500 x 300 grid of 60 rows and 30 columns of 100px, with the option on. The frozen counts come
 * from the query params (`start`, `end`, `top`, `bottom`).
 */
export class LimitFixedToViewportPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  /**
   * Errors the page reported since this page object was created.
   */
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');

    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid. `query` switches the variants the fixture knows.
   *
   * @param query The fixture's query params.
   */
  async goto(query: Record<string, string | number> = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(query).forEach(([key, value]) => params.set(key, String(value)));
    await this.page.goto(`/tests/fixtures/demo/limit-fixed-to-viewport.html?${params.toString()}`);
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Grid failed to initialize: ${initError}`);
    }

    // a grid built inside a hidden box draws nothing until it is shown
    if (!query.hide) {
      await expect.poll(() => this.page.evaluate(() => window.hot.getCell(0, 0, true) !== null)).toBe(true);
    }
  }

  /**
   * Resizes the grid box and lets the grid pick the new size up, the way a resizing page does.
   *
   * @param size The new size of the box in pixels.
   * @param size.width The width.
   * @param size.height The height.
   */
  async resize(size: { width?: number, height?: number }): Promise<void> {
    await this.page.evaluate(({ width, height }) => {
      const root = window.hot.rootElement as HTMLElement;

      if (width !== undefined) {
        root.style.width = `${width}px`;
      }

      if (height !== undefined) {
        root.style.height = `${height}px`;
      }

      window.hot.refreshDimensions();
    }, size);
    await this.page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  }

  /**
   * Changes settings through the API, the way an app does.
   *
   * @param settings The settings to change.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(next => window.hot.updateSettings(next), settings);
  }

  /**
   * The count the app configured, read from the settings.
   *
   * @param option The settings key.
   */
  async setting(option: 'fixedColumnsStart' | 'fixedColumnsEnd' | 'fixedRowsTop' | 'fixedRowsBottom'): Promise<number> {
    return this.page.evaluate(key => window.hot.getSettings()[key] as number, option);
  }

  /**
   * The size the band of an edge occupies on screen: the width of a column band, the height of a row band.
   *
   * @param edge The edge.
   */
  async bandSize(edge: FrozenEdge): Promise<number> {
    return this.page.evaluate(({ className, horizontal }) => {
      const clone = window.hot.rootElement.querySelector(`.${className}`) as HTMLElement | null;

      if (!clone) {
        return 0;
      }

      const rect = clone.getBoundingClientRect();

      return horizontal ? rect.width : rect.height;
    }, { className: CLONE_CLASS[edge], horizontal: edge === 'start' || edge === 'end' });
  }

  /**
   * The number of frozen tracks the grid draws on an edge (not the configured one).
   *
   * @param edge The edge.
   */
  async drawnCount(edge: FrozenEdge): Promise<number> {
    return this.page.evaluate((e) => {
      const { view } = window.hot;

      return { top: view.countFixedRowsTop(), bottom: view.countFixedRowsBottom(),
        start: view.countFixedColumnsStart(), end: view.countFixedColumnsEnd() }[e];
    }, edge);
  }

  /**
   * The size of the grid box.
   */
  async gridSize(): Promise<{ width: number, height: number }> {
    return this.page.evaluate(() => {
      const rect = window.hot.rootElement.getBoundingClientRect();

      return { width: rect.width, height: rect.height };
    });
  }

  /**
   * Checks that part of the cell is on screen and nothing paints over it: the element at one of the points along
   * its top, middle or bottom is the cell itself. The strip the clamp keeps can be narrower than a column, so the center of
   * the cell may be covered while its edge is not. A cell under the frozen band fails.
   *
   * @param row The visual row.
   * @param col The visual column.
   */
  async isCellUncovered(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(([r, c]) => {
      const cell = window.hot.getCell(r, c, true);

      if (!cell) {
        return false;
      }

      const rect = cell.getBoundingClientRect();
      // a row taller than the grid can show only part of itself, so look near its top, middle and bottom
      const ys = [rect.top + Math.min(rect.height / 2, 15), rect.top + rect.height / 2, rect.bottom - Math.min(rect.height / 2, 15)];

      return ys.some(y => [0.1, 0.3, 0.5, 0.7, 0.9].some((share) => {
        const hit = window.hot.rootDocument.elementFromPoint(rect.left + rect.width * share, y);

        return hit === cell || (hit !== null && cell.contains(hit));
      }));
    }, [row, col]);
  }

  /**
   * Selects the cell through the API and waits until the grid has drawn it.
   *
   * @param row The visual row.
   * @param col The visual column.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => window.hot.selectCell(r, c), [row, col]);
  }

  /**
   * The selected cell, as `[row, col]`.
   */
  async selected(): Promise<number[]> {
    return this.page.evaluate(() => {
      const range = window.hot.getSelectedRangeLast();

      return range ? [range.highlight.row, range.highlight.col] : [];
    });
  }

  /**
   * The rectangle of the open editor and of the cell it edits, in viewport coordinates.
   */
  async editorAndCellRects(row: number, col: number): Promise<{ editor: DOMRect, cell: DOMRect } | null> {
    return this.page.evaluate(([r, c]) => {
      const editor = window.hot.getActiveEditor();
      const cell = window.hot.getCell(r, c, true);

      if (!editor || !cell) {
        return null;
      }

      return {
        editor: editor.TEXTAREA_PARENT.getBoundingClientRect().toJSON(),
        cell: cell.getBoundingClientRect().toJSON(),
      };
    }, [row, col]);
  }

  /**
   * The counts the clamp has to resolve, worked out from the sizes on the page and not from the code under test:
   * the grid box, the headers, the width of a column and the height of a row. A track is as large as the first
   * one, which holds for the fixture (a uniform grid), and the strip that stays scrollable is 40 px.
   *
   * @param requested The configured counts.
   * @param requested.start The configured start columns.
   * @param requested.end The configured end columns.
   * @param requested.top The configured top rows.
   * @param requested.bottom The configured bottom rows.
   */
  async expectedCounts(requested: { start?: number, end?: number, top?: number, bottom?: number }) {
    return this.page.evaluate(({ start = 0, end = 0, top = 0, bottom = 0 }) => {
      const strip = 40;
      const root = window.hot.rootElement;
      const colWidth = window.hot.getColWidth(0);
      const rowHeight = window.hot.getCell(1, -1, true)!.parentElement!.offsetHeight;
      const fit = (room: number, size: number, count: number) => Math.min(count, Math.max(Math.floor(room / size), 0));
      // the holder's own scrollbars are inside the box, and the strip is what is left within them
      const holder = root.querySelector('.wtHolder') as HTMLElement;
      const verticalScrollbar = holder.offsetWidth - holder.clientWidth;
      const horizontalScrollbar = holder.offsetHeight - holder.clientHeight;
      const columnsRoom = root.clientWidth - window.hot.view.getRowHeaderWidth() - verticalScrollbar - strip;
      const rowsRoom = root.clientHeight - window.hot.view.getColumnHeaderHeight() - horizontalScrollbar - strip;
      const startDrawn = fit(columnsRoom, colWidth, start);
      const topDrawn = fit(rowsRoom, rowHeight, top);

      return {
        start: startDrawn,
        end: fit(columnsRoom - startDrawn * colWidth, colWidth, Math.min(end, window.hot.countCols() - start)),
        top: topDrawn,
        bottom: fit(rowsRoom - topDrawn * rowHeight, rowHeight, Math.min(bottom, window.hot.countRows() - top)),
      };
    }, requested);
  }

  /**
   * The counts the grid draws.
   */
  async drawnCounts() {
    return {
      start: await this.drawnCount('start'),
      end: await this.drawnCount('end'),
      top: await this.drawnCount('top'),
      bottom: await this.drawnCount('bottom'),
    };
  }

  /**
   * How many times the grid finished a view render since the page loaded.
   */
  async viewRenderCount(): Promise<number> {
    return this.page.evaluate(() => (window as any).viewRenders as number);
  }

  /**
   * Renders the grid, the way an app does after it changed the data.
   */
  async render(): Promise<void> {
    await this.page.evaluate(() => window.hot.render());
  }

  /**
   * Loads data whose first 40 rows wrap into tall rows, into a grid that has only measured default-height rows.
   */
  async loadTallRows(): Promise<void> {
    await this.page.evaluate(() => {
      const rows = window.hot.getData() as string[][];

      window.hot.loadData(rows.map((row, index) => (
        index < 40 ? [`${row[0]} ${'lorem ipsum dolor sit amet '.repeat(6)}`, ...row.slice(1)] : row
      )));
    });
  }

  /**
   * Shows a grid that the fixture built inside a hidden box, and draws it.
   */
  async showHiddenGrid(): Promise<void> {
    await this.page.evaluate(() => {
      (document.querySelector('[data-testid="grid"]') as HTMLElement).style.display = '';
      window.hot.render();
    });
  }

  /**
   * The freezeBar plugin's count of an edge, as an app reads it.
   *
   * @param edge The edge.
   */
  async freezeBarCount(edge: FrozenEdge): Promise<number> {
    return this.page.evaluate(e => window.hot.getPlugin('freezeBar').getFreezeCount(e), edge);
  }

  /**
   * Asks the freezeBar plugin for a count, the way an app does through the API.
   *
   * @param edge The edge.
   * @param count The requested count.
   */
  async setFreezeBarCount(edge: FrozenEdge, count: number): Promise<boolean> {
    return this.page.evaluate(([e, c]) => window.hot.getPlugin('freezeBar').setFreezeCount(e as any, c as number), [edge, count]);
  }

  /**
   * Presses and releases the start bar without moving the pointer, the way a click focuses it.
   */
  async clickStartBar(): Promise<void> {
    await this.bar('start').click({ position: { x: 1, y: 40 } });
  }

  /**
   * Focuses a bar and presses a key on it.
   *
   * @param edge The edge.
   * @param key The key.
   */
  async pressOnBar(edge: FrozenEdge, key: string): Promise<void> {
    await this.separator(edge).focus();
    await this.page.keyboard.press(key);
  }

  /**
   * The bar of an edge, which is what a pointer presses.
   *
   * @param edge The edge.
   */
  bar(edge: FrozenEdge): Locator {
    return this.page.locator(`.ht-freeze-bar--${edge}:not(.ht-freeze-bar--segment)`);
  }

  /**
   * The focusable separator of an edge. It carries the ARIA value (`aria-valuenow` is the count the bar sits on)
   * and receives the keys.
   *
   * @param edge The edge.
   */
  separator(edge: FrozenEdge): Locator {
    return this.page.locator(`[data-ht-freeze-separator="${edge}"]`);
  }

  /**
   * The log the `afterFreezeChange` hook wrote.
   */
  async freezeLog(): Promise<Array<{ edge: string, newCount: number, oldCount: number, source: string }>> {
    return this.page.evaluate(() => (window as any).freezeLog);
  }

  /**
   * The inline-start edge of the band that is drawn, and the middle of the start bar, in viewport coordinates.
   */
  async startBarAndBandEdge(): Promise<{ bar: number, band: number }> {
    return this.page.evaluate(() => {
      const root = window.hot.rootElement;
      const barRect = root.querySelector('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)')!.getBoundingClientRect();
      const bandRect = root.querySelector('.ht_clone_inline_start')!.getBoundingClientRect();

      return { bar: barRect.left + barRect.width / 2, band: bandRect.right };
    });
  }

  /**
   * What the move plugins say about a column and a row: are they inside the frozen band that is drawn?
   *
   * @param column A visual column.
   * @param row A visual row.
   */
  async moveBandFlags(column: number, row: number) {
    return this.page.evaluate(([c, r]) => ({
      column: window.hot.getPlugin('manualColumnMove').isFixedColumnsStart(c),
      row: window.hot.getPlugin('manualRowMove').isFixedRowTop(r),
    }), [column, row]);
  }

  /**
   * Asks ManualColumnMove whether it would move the columns to the target, which is what `moveColumns()` checks.
   *
   * @param columns The visual columns to move.
   * @param target The visual index the first moved column lands on.
   */
  async isColumnMovePossible(columns: number[], target: number): Promise<boolean> {
    return this.page.evaluate(([cols, to]) => (
      window.hot.getPlugin('manualColumnMove').isMovePossible(cols as number[], to as number)
    ), [columns, target]);
  }

  /**
   * Whether ManualColumnMove treats the column as part of the end band it positions the guideline for: the band the
   * grid draws, which is what the end clone holds.
   *
   * @param column The visual column.
   */
  async isInDrawnEndBandForMove(column: number): Promise<boolean> {
    return this.page.evaluate(c => window.hot.getPlugin('manualColumnMove').isFixedColumnsEnd(c), column);
  }

  /**
   * Blocks every `refreshDimensions()` call, the way an app does from `beforeRefreshDimensions`, and counts the
   * calls it blocked, so a test can tell a blocked resize from a resize that never reached the grid.
   */
  async blockRefreshDimensions(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).blockedRefreshes = 0;
      window.hot.addHook('beforeRefreshDimensions', () => {
        (window as any).blockedRefreshes += 1;

        return false;
      });
    });
  }

  /**
   * How many `refreshDimensions()` calls the blocking listener has stopped.
   */
  async blockedRefreshCount(): Promise<number> {
    return this.page.evaluate(() => (window as any).blockedRefreshes as number);
  }

  /**
   * The number of frozen tracks that are really on screen on an edge: the cells of the first row of a column clone,
   * or the rows of a row clone. It counts what the DOM holds, not what the grid reports, and a hidden track draws
   * nothing, so it is the drawn count minus the hidden ones in the band.
   *
   * @param edge The edge.
   */
  async renderedCount(edge: FrozenEdge): Promise<number> {
    return this.page.evaluate(({ className, horizontal }) => {
      const clone = window.hot.rootElement.querySelector(`.${className}`) as HTMLElement | null;

      if (!clone) {
        return 0;
      }

      if (horizontal) {
        const firstRow = clone.querySelector('tbody tr');

        return firstRow ? firstRow.querySelectorAll('td').length : 0;
      }

      return clone.querySelectorAll('tbody tr').length;
    }, { className: CLONE_CLASS[edge], horizontal: edge === 'start' || edge === 'end' });
  }

  /**
   * Moves the pointer over a column header, which makes the resize handle show on it, and reports which freeze marks
   * the handle carries.
   *
   * @param column The visual column.
   */
  async resizeHandleFreezeMarks(column: number): Promise<{ before: boolean, after: boolean }> {
    // The part of the header a pointer can reach: a column that scrolls is mostly under the frozen start band, so
    // aim at the visible part, just right of the band.
    const point = await this.page.evaluate((c) => {
      const header = window.hot.getCell(-1, c, true) as HTMLElement;
      const rect = header.getBoundingClientRect();
      const startClone = window.hot.rootElement.querySelector('.ht_clone_inline_start') as HTMLElement | null;
      const bandRight = startClone ? startClone.getBoundingClientRect().right : rect.left;
      const y = rect.top + rect.height / 2;

      // a frozen header lies inside the band: its middle is reachable
      if (rect.right <= bandRight + 1) {
        return { x: rect.left + rect.width / 2, y };
      }

      const left = Math.max(rect.left, bandRight);

      return { x: left + Math.min(8, Math.max((rect.right - left) / 2, 1)), y };
    }, column);

    // leave the grid first, so the move onto the header is a new `mouseover` for the grid
    await this.page.mouse.move(0, 0);
    await this.page.mouse.move(point.x, point.y);

    return this.page.evaluate(({ c, x, y }) => {
      const underPointer = window.hot.rootDocument.elementFromPoint(x, y)?.closest('th');
      const hoveredColumn = underPointer ? window.hot.getCoords(underPointer as HTMLTableCellElement)?.col : null;

      if (hoveredColumn !== c) {
        throw new Error(`The pointer is over the header of column ${hoveredColumn}, not ${c}`);
      }

      const handle = window.hot.rootElement.querySelector('.manualColumnResizer') as HTMLElement;

      return {
        before: handle.classList.contains('ht-resize-handle--freeze-before'),
        after: handle.classList.contains('ht-resize-handle--freeze-after'),
      };
    }, { c: column, x: point.x, y: point.y });
  }

  /**
   * The names of the items the column context menu shows for a column, read from the DOM after it opened.
   *
   * @param column The visual column.
   */
  async columnMenuItems(column: number): Promise<string[]> {
    // opened and read in one task: the menu closes when the grid is drawn again, which a scroll can do
    const items = await this.page.evaluate((c) => {
      window.hot.selectColumns(c);

      // open it under the header, at the part of it a pointer can reach: a column that scrolls lies mostly under the
      // frozen start band
      const header = window.hot.getCell(-1, c, true) as HTMLElement;
      const rect = header.getBoundingClientRect();
      const startClone = window.hot.rootElement.querySelector('.ht_clone_inline_start') as HTMLElement | null;
      const left = Math.max(rect.left, startClone ? startClone.getBoundingClientRect().right : rect.left);

      window.hot.getPlugin('contextMenu').open({ top: rect.bottom, left: left + 2, width: 1, height: 1 });

      const names = Array.from(document.querySelectorAll('.htContextMenu .ht_master tbody td'))
        .map(cell => (cell.textContent ?? '').trim())
        .filter(Boolean);

      window.hot.getPlugin('contextMenu').close();

      return names;
    }, column);

    // an empty list is a menu that did not open, never an answer
    expect(items.length).toBeGreaterThan(0);

    return items;
  }

  /**
   * Scrolls the grid so the column is rendered in the master table.
   *
   * @param column The visual column.
   */
  async scrollToColumn(column: number): Promise<void> {
    await this.page.evaluate(c => window.hot.scrollViewportTo({ col: c, horizontalSnap: 'start' }), column);
    await this.page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  }

  /**
   * Whether the header cell of a column carries the collapse button of a collapsible group.
   *
   * @param column The visual column.
   */
  async hasCollapseButton(column: number): Promise<boolean> {
    return this.page.evaluate((c) => {
      // the group sits in the first header row, whatever number the other header rows have
      for (let row = -1; row >= -3; row--) {
        const cell = window.hot.getCell(row, c, true);

        if (cell?.querySelector('.collapsibleIndicator')) {
          return true;
        }
      }

      return false;
    }, column);
  }

  /**
   * How many custom border selections the customBorders plugin keeps alive: one per border on a cell it considers
   * visible (in the master range, or in a frozen band).
   */
  async customBorderSelectionCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.selection.highlight.customSelections.length);
  }

  /**
   * Waits two animation frames, so a resize handler that was going to render has done it.
   */
  async settleFrames(): Promise<void> {
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }

  /**
   * The section the open editor reports it sits in (a corner, an overlay, or the master).
   */
  async editorSection(): Promise<string> {
    return this.page.evaluate(() => window.hot.getActiveEditor()!.checkEditorSection());
  }

  /**
   * Freezes a column through the ManualColumnFreeze API and reports whether the plugin did it.
   *
   * @param column The visual column.
   */
  async freezeColumn(column: number): Promise<boolean> {
    return this.page.evaluate(c => new Promise<boolean>((resolve) => {
      window.hot.addHookOnce('afterColumnFreeze', (_column: number, performed: boolean) => resolve(performed));
      window.hot.getPlugin('manualColumnFreeze').freezeColumn(c);
    }), column);
  }

  /**
   * Unfreezes a column through the ManualColumnFreeze API and reports whether the plugin did it.
   *
   * @param column The visual column.
   */
  async unfreezeColumn(column: number): Promise<boolean> {
    return this.page.evaluate(c => new Promise<boolean>((resolve) => {
      window.hot.addHookOnce('afterColumnUnfreeze', (_column: number, performed: boolean) => resolve(performed));
      window.hot.getPlugin('manualColumnFreeze').unfreezeColumn(c);
    }), column);
  }

  /**
   * The visual index a physical column sits at.
   *
   * @param physical The physical column.
   */
  async visualColumnOf(physical: number): Promise<number | null> {
    return this.page.evaluate(p => window.hot.columnIndexMapper.getVisualFromPhysicalIndex(p), physical);
  }

  /**
   * The size of the part of the grid that still scrolls next to a band: what the master holder shows, without the
   * band and the headers it holds. It is what the 40 px promise is about, whatever the scrollbars take.
   *
   * @param edge The edge.
   */
  async scrollableStrip(edge: FrozenEdge): Promise<number> {
    const band = await this.bandSize(edge);

    return this.page.evaluate(({ band: bandSize, horizontal }) => {
      const holder = window.hot.rootElement.querySelector('.wtHolder') as HTMLElement;

      return (horizontal ? holder.clientWidth : holder.clientHeight) - bandSize;
    }, { band, horizontal: edge === 'start' || edge === 'end' });
  }

  /**
   * Loads the plain data of the fixture back, the way an app reloads its rows.
   */
  async loadPlainRows(): Promise<void> {
    await this.page.evaluate(() => window.hot.loadData(window.Handsontable.helper.createSpreadsheetData(60, 30)));
  }

  /**
   * Resizes the browser window, which is what changes the room of a grid that the window scrolls.
   *
   * @param size The new size of the window.
   * @param size.width The width.
   * @param size.height The height.
   */
  async resizeWindow(size: { width: number, height: number }): Promise<void> {
    await this.page.setViewportSize(size);
  }

  /**
   * Removes a row and asks the freezeBar plugin for a count in one batch, before anything is drawn.
   */
  async alterAndSetCountInBatch(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.batch(() => {
        window.hot.alter('remove_row', 0);
        window.hot.getPlugin('freezeBar').setFreezeCount('top', 5);
      });
    });
  }
}
