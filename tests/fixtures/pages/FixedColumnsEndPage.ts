import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * Query params the `fixed-columns-end.html` fixture understands. All numbers or flags.
 */
export interface FixedColumnsEndFixtureOptions {
  rtl?: boolean;
  windowScroll?: boolean;
  fixedColumnsStart?: number;
  fixedColumnsEnd?: number;
  fixedRowsTop?: number;
  fixedRowsBottom?: number;
  minSpareCols?: number;
  manualColumnMove?: boolean;
  manualColumnResize?: boolean;
  customBorders?: boolean;
  cols?: number;
  rows?: number;
}

/**
 * A rectangle in viewport coordinates.
 */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface HotFixture {
  addHookOnce(name: string, callback: () => void): void;
  getFirstFullyVisibleColumn(): number;
  selectCell(row: number, col: number): boolean;
  getSelectedLast(): number[] | undefined;
  getCell(row: number, col: number, topmost: boolean): HTMLTableCellElement | null;
  getActiveEditor(): { isOpened(): boolean } | undefined;
  countCols(): number;
  updateSettings(settings: Record<string, unknown>): void;
  getDataAtRow(row: number): string[];
  getColWidth(col: number): number;
  alter(action: string, index: number, amount: number): void;
  getSettings(): { fixedColumnsEnd: number };
  getPlugin(name: string): { undo?(): void; redo?(): void };
  selection: { highlight: { customSelections: { settings?: { id?: string } }[] } };
}

type HotWindow = { hot: HotFixture };

/**
 * Page Object for the core `fixedColumnsEnd` fixture. It hides the globals and the overlay class names, so a
 * spec asserts what the user sees: where the editor opens, where the keyboard lands, which range a drag selects.
 */
export class FixedColumnsEndPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;
  readonly endOverlay: Locator;
  readonly editor: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
    this.endOverlay = this.grid.locator('.ht_clone_inline_end');
    this.editor = this.grid.locator('textarea.handsontableInput');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {FixedColumnsEndFixtureOptions} options The fixture options.
   */
  async goto(options: FixedColumnsEndFixtureOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => {
      if (value !== undefined && value !== false) {
        params.set(name, value === true ? '1' : String(value));
      }
    });
    await this.page.goto(`/tests/fixtures/demo/fixed-columns-end.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /**
   * Select a cell through the API.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as unknown as HotWindow).hot.selectCell(r, c), [row, col]);
  }

  /**
   * The number of columns of the grid.
   */
  async countCols(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.countCols());
  }

  /**
   * The last selected range as `[fromRow, fromCol, toRow, toCol]`.
   */
  async selectedRange(): Promise<number[] | undefined> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getSelectedLast());
  }

  /**
   * Press a key (or a chord such as `Control+End`) on the grid.
   *
   * @param {string} key The Playwright key descriptor.
   */
  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Press an arrow key several times in one task, the way a page sees keys that queued up behind a long task:
   * every press has run before the browser dispatches the first `scroll` event. A press that scrolls the grid
   * queues a scroll of the browser window to its cell for the next `afterScroll`, so after the last press the
   * queue holds one for each of them. This resolves once the grid has run them: the hook it waits on is added
   * after the presses, so it runs after the queued scrolls.
   *
   * Returns the first column the grid shows whole once the presses have scrolled it. It is read before the queued
   * scrolls run, so it does not depend on what they do to the grid.
   *
   * `page.keyboard.press()` cannot do this. Presses sent one by one land milliseconds apart, and how many of
   * them share an animation frame depends on the machine, the bundle and the load.
   *
   * The grid has to scroll by its own holder, not by the window.
   *
   * @param {'ArrowLeft'|'ArrowRight'} key The arrow key to press.
   * @param {number} times How many presses to send.
   */
  async pressInOneTask(key: 'ArrowLeft' | 'ArrowRight', times: number): Promise<{ firstVisibleColumn: number }> {
    return this.page.evaluate(async ([name, count]) => {
      const { hot } = window as unknown as HotWindow;
      const holder = document.querySelector('.ht_master .wtHolder')!;
      const scrollBefore = holder.scrollLeft;
      const keyCode = name === 'ArrowLeft' ? 37 : 39;

      for (let press = 0; press < count; press += 1) {
        for (const type of ['keydown', 'keyup']) {
          // Like a real key, an event goes to whatever has the focus when it arrives.
          (document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent(type, {
            key: name, code: name, keyCode, bubbles: true, cancelable: true, composed: true,
          }));
        }
      }

      // Without a scroll there is no `afterScroll` to wait for.
      if (holder.scrollLeft === scrollBefore) {
        throw new Error(`Pressing ${name} ${count} times did not scroll the grid`);
      }

      const firstVisibleColumn = hot.getFirstFullyVisibleColumn();

      await new Promise<void>(resolve => hot.addHookOnce('afterScroll', () => resolve()));

      return { firstVisibleColumn };
    }, [key, times] as const);
  }

  /**
   * The bounding box of the topmost rendered cell at the coordinates, in viewport coordinates.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async cellBox(row: number, col: number): Promise<Box> {
    return this.page.evaluate(([r, c]) => {
      const td = (window as unknown as HotWindow).hot.getCell(r, c, true);

      if (!td) {
        throw new Error(`Cell ${r},${c} is not rendered`);
      }

      const { left, right, top, bottom } = td.getBoundingClientRect();

      return { left, right, top, bottom };
    }, [row, col]);
  }

  /**
   * How far a cell reaches under the end columns: the distance from the inline-start edge of the end clone to the
   * cell's inline-end edge. A value of 0 or less means the cell ends beside the clone. A positive one is how far the
   * cell's edge lies under it, which is more than the cell's width when the whole cell is. The cell and the clone
   * are measured in one evaluation, so both rectangles describe the same frame.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   * @param {boolean} rtl Whether the layout runs right to left, so the end columns sit on the left.
   */
  async endColumnsOverlap(row: number, col: number, rtl: boolean): Promise<number> {
    return this.endOverlay.evaluate((clone, [r, c, isRtl]) => {
      const td = (window as unknown as HotWindow).hot.getCell(r, c, true);

      if (!td) {
        throw new Error(`Cell ${r},${c} is not rendered`);
      }

      const cell = td.getBoundingClientRect();
      const end = clone.getBoundingClientRect();

      return isRtl ? end.right - cell.left : cell.right - end.left;
    }, [row, col, rtl] as const);
  }

  /**
   * Whether the active cell editor is open.
   */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getActiveEditor()?.isOpened() ?? false);
  }

  /**
   * Whether the open editor's textarea is the topmost element at its own center, i.e. no overlay is painted
   * over it.
   */
  async isEditorOnTop(): Promise<boolean> {
    return this.editor.evaluate((textarea) => {
      const { left, right, top, bottom } = textarea.getBoundingClientRect();
      const hit = textarea.ownerDocument.elementFromPoint((left + right) / 2, (top + bottom) / 2);

      return hit === textarea;
    });
  }

  /**
   * The bounding box of the open editor's textarea, in viewport coordinates.
   */
  async editorBox(): Promise<Box> {
    return this.editor.evaluate((textarea) => {
      const { left, right, top, bottom } = textarea.getBoundingClientRect();

      return { left, right, top, bottom };
    });
  }

  /**
   * The clone a cell is rendered in, by its structural class (`master` for none).
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async overlayOf(row: number, col: number): Promise<string> {
    return this.page.evaluate(([r, c]) => {
      const td = (window as unknown as HotWindow).hot.getCell(r, c, true);
      const clone = td?.closest('[class*="ht_clone_"]');
      const names = (clone?.className ?? '').split(/\s+/).filter(name => /^ht_clone_(inline|top|bottom)/.test(name));

      return names.find(name => !/_left_corner$/.test(name))?.replace('ht_clone_', '') ?? 'master';
    }, [row, col]);
  }

  /**
   * The grid's own client box: the part of the master holder the scrollbars leave.
   */
  async holderClientBox(): Promise<Box> {
    return this.master.locator('.wtHolder').evaluate((holder) => {
      const rect = holder.getBoundingClientRect();
      const left = rect.left + holder.clientLeft;
      const top = rect.top + holder.clientTop;

      return { left, right: left + holder.clientWidth, top, bottom: top + holder.clientHeight };
    });
  }

  /**
   * The master's horizontal scroll offset (magnitude).
   */
  async scrollLeft(): Promise<number> {
    return this.master.locator('.wtHolder').evaluate(holder => Math.abs(holder.scrollLeft));
  }

  /**
   * The master's horizontal scroll offset (magnitude), sampled on each of the next animation frames. A one-frame
   * jump back and forth shows in the samples, which a single poll that stops at the first match cannot catch.
   *
   * @param {number} frames How many frames to sample.
   */
  async scrollLeftOverFrames(frames: number): Promise<number[]> {
    return this.master.locator('.wtHolder').evaluate(async (holder, count) => {
      const samples: number[] = [];

      for (let i = 0; i < count; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        samples.push(Math.abs(holder.scrollLeft));
      }

      return samples;
    }, frames);
  }

  /**
   * Let the grid run through a number of animation frames, so a negative assertion ("nothing changed") is read
   * after the work that would have changed it. Use it only beside a positive control that shows the change is
   * observable on the same path.
   *
   * @param {number} frames How many frames to wait.
   */
  async settleFrames(frames: number): Promise<void> {
    await this.page.evaluate(async (count) => {
      for (let i = 0; i < count; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    }, frames);
  }

  /**
   * The first row the grid shows fully, in visual coordinates.
   */
  async firstVisibleRow(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { view: { _wt: { wtScroll: { getFirstVisibleRow(): number } } } }
    }).hot.view._wt.wtScroll.getFirstVisibleRow());
  }

  /**
   * Scroll the master holder to an absolute offset and let the overlays sync.
   *
   * @param {{ top?: number, left?: number }} offset The offsets to set. `left` is the magnitude.
   */
  async scrollTo({ top, left }: { top?: number, left?: number }): Promise<void> {
    await this.master.locator('.wtHolder').evaluate((holder, target) => {
      const isRtl = getComputedStyle(holder).direction === 'rtl';

      if (target.top !== undefined) {
        holder.scrollTop = target.top;
      }

      if (target.left !== undefined) {
        holder.scrollLeft = isRtl ? -target.left : target.left;
      }
    }, { top, left });
  }

  /**
   * Scroll the browser window (for a grid the window scrolls) and wait until it got there.
   *
   * @param {{ x: number, y: number }} offset The scroll offsets. `x` is the magnitude: it follows the layout
   *   direction.
   */
  async scrollWindow({ x, y }: { x: number, y: number }): Promise<void> {
    const isRtl = await this.page.evaluate(() => document.documentElement.dir === 'rtl');

    await this.page.evaluate(([left, top, rtl]) => window.scrollTo(rtl ? -(left as number) : left as number,
      top as number), [x, y, isRtl]);
    await expect.poll(() => this.page.evaluate(() => [Math.abs(window.scrollX), window.scrollY]))
      .toEqual([x, y]);
  }

  /**
   * The largest horizontal scroll offset of the master holder (magnitude).
   */
  async maxScrollLeft(): Promise<number> {
    return this.master.locator('.wtHolder').evaluate(holder => holder.scrollWidth - holder.clientWidth);
  }

  /**
   * Press the mouse on one cell and release it on another.
   *
   * @param {[number, number]} from The `[row, col]` the press starts on.
   * @param {[number, number]} to The `[row, col]` the press ends on.
   */
  async dragFromTo(from: [number, number], to: [number, number]): Promise<void> {
    const start = await this.cellBox(...from);
    const end = await this.cellBox(...to);
    const center = (box: Box) => ({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 });
    const a = center(start);
    const b = center(end);

    await this.page.mouse.move(a.x, a.y);
    await this.page.mouse.down();
    // One jump to the target: a pointer that crosses a partially visible column on its way scrolls it into
    // view, which moves the cells under the pointer and turns the drag's end into a different cell.
    await this.page.mouse.move(b.x, b.y);
    await this.page.mouse.up();
  }

  /**
   * Press the mouse button on the middle of the grid's client box, the start of a drag that leaves room on both
   * sides to move the pointer to.
   */
  async pressGridCenter(): Promise<void> {
    const box = await this.holderClientBox();

    await this.page.mouse.move((box.left + box.right) / 2, (box.top + box.bottom) / 2);
    await this.page.mouse.down();
  }

  /**
   * Move the pressed pointer to a point inside the grid's client box, a distance from its left or right edge,
   * at the height of its middle.
   *
   * @param {'left'|'right'} side The viewport edge the distance is measured from.
   * @param {number} inset The distance from the edge, in px.
   */
  async movePointerInsideEdge(side: 'left' | 'right', inset: number): Promise<void> {
    const box = await this.holderClientBox();

    await this.page.mouse.move(side === 'left' ? box.left + inset : box.right - inset, (box.top + box.bottom) / 2);
  }

  /**
   * Click the center of a cell.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async clickCell(row: number, col: number): Promise<void> {
    const box = await this.cellBox(row, col);

    await this.page.mouse.click((box.left + box.right) / 2, (box.top + box.bottom) / 2);
  }

  /**
   * Change the grid settings.
   *
   * @param {Record<string, unknown>} settings The settings to apply.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(next => (window as unknown as HotWindow).hot.updateSettings(next), settings);
  }

  /**
   * The first row's data in the current column order, e.g. `['R1C1', 'R1C2', ...]`.
   */
  async firstRow(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getDataAtRow(0));
  }

  /**
   * The bounding box of the topmost rendered column header of a column, in viewport coordinates.
   *
   * @param {number} col Visual column.
   */
  async headerBox(col: number): Promise<Box> {
    return this.cellBox(-1, col);
  }

  /**
   * Press the mouse on a column header, after selecting its column, as a user starts moving the column.
   *
   * @param {number} col Visual column.
   */
  async pressColumnHeader(col: number): Promise<void> {
    const box = await this.headerBox(col);
    const x = (box.left + box.right) / 2;
    const y = (box.top + box.bottom) / 2;

    await this.page.mouse.click(x, y);
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
  }

  /**
   * Move the pressed mouse over a column header.
   *
   * @param {number} col Visual column.
   * @param {number} [fromInlineStart] How far across the header the pointer lands, from its inline-start edge:
   *   0 is the edge, 1 the inline-end edge.
   * @param {boolean} [rtl] Whether the layout runs right to left.
   */
  async moveOverColumnHeader(col: number, fromInlineStart = 0.5, rtl = false): Promise<void> {
    const box = await this.headerBox(col);
    const width = box.right - box.left;
    const x = rtl ? box.right - (width * fromInlineStart) : box.left + (width * fromInlineStart);

    await this.page.mouse.move(x, (box.top + box.bottom) / 2, { steps: 6 });
  }

  /**
   * Release the mouse.
   */
  async releaseMouse(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * Move a column by dragging its header over another one.
   *
   * @param {number} from The dragged visual column.
   * @param {number} to The visual column whose inline-start half the pointer is released over.
   * @param {boolean} [rtl] Whether the layout runs right to left.
   */
  async dragColumnHeader(from: number, to: number, rtl = false): Promise<void> {
    await this.pressColumnHeader(from);
    await this.moveOverColumnHeader(to, 0.2, rtl);
    await this.releaseMouse();
  }

  /**
   * The bounding box of the column move guideline, in viewport coordinates.
   */
  async guidelineBox(): Promise<Box> {
    return this.grid.locator('.ht__manualColumnMove--guideline').evaluate((element) => {
      const { left, right, top, bottom } = element.getBoundingClientRect();

      return { left, right, top, bottom };
    });
  }

  /**
   * Move the mouse over a column header, which shows the column resize handle there.
   *
   * @param {number} col Visual column.
   */
  async hoverColumnHeader(col: number): Promise<void> {
    const box = await this.headerBox(col);

    await this.page.mouse.move((box.left + box.right) / 2, (box.top + box.bottom) / 2, { steps: 4 });
  }

  /**
   * The bounding box of the column resize handle, in viewport coordinates.
   */
  async resizeHandleBox(): Promise<Box> {
    const handle = this.grid.locator('.manualColumnResizer');

    await expect(handle).toBeAttached();

    return handle.evaluate((element) => {
      const { left, right, top, bottom } = element.getBoundingClientRect();

      return { left, right, top, bottom };
    });
  }

  /**
   * Drag the column resize handle by a distance. A positive distance moves the pointer to the right.
   *
   * @param {number} distance The horizontal travel, in pixels.
   */
  async dragResizeHandle(distance: number): Promise<void> {
    const handle = await this.resizeHandleBox();
    const x = (handle.left + handle.right) / 2;
    const y = (handle.top + handle.bottom) / 2;

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x + distance, y, { steps: 6 });
    await this.page.mouse.up();
  }

  /**
   * The width the grid gives a column.
   *
   * @param {number} col Visual column.
   */
  async colWidth(col: number): Promise<number> {
    return this.page.evaluate(c => (window as unknown as HotWindow).hot.getColWidth(c), col);
  }

  /**
   * Whether the CustomBorders plugin has a border of a cell rendered right now.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async hasRenderedCustomBorder(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(id => (window as unknown as HotWindow).hot.selection.highlight.customSelections
      .some(selection => selection.settings?.id === id), `border_row${row}col${col}`);
  }

  /**
   * The number of custom border edges that are visible inside the end clone.
   */
  async visibleBordersInEndOverlay(): Promise<number> {
    return this.endOverlay.locator('.wtBorder:visible').count();
  }

  /**
   * Remove columns through the API.
   *
   * @param {number} index The first column to remove.
   * @param {number} amount How many columns to remove.
   */
  async removeColumns(index: number, amount: number): Promise<void> {
    await this.page.evaluate(([i, n]) => (window as unknown as HotWindow).hot.alter('remove_col', i, n), [index, amount]);
  }

  /**
   * Undo the last step.
   */
  async undo(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as HotWindow).hot.getPlugin('undoRedo').undo?.());
  }

  /**
   * The frozen end column count the grid works with.
   */
  async fixedColumnsEnd(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as HotWindow).hot.getSettings().fixedColumnsEnd);
  }
}
