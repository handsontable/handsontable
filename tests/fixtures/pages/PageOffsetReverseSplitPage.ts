import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The layout the fixture builds: the wrapper's `overflow-y`, the grid's `preventOverflow`, the page
 * offset on the inline-start side, the frozen columns, and the page's direction.
 */
export interface PageOffsetLayout {
  dir?: 'ltr' | 'rtl';
  overflowY?: 'clip' | 'hidden' | 'auto' | 'visible';
  preventOverflow?: 'vertical';
  margin?: number;
  fixedColumnsStart?: number;
  fixedRowsBottom?: number;
  stretchH?: 'all';
  /**
   * How many 100px columns the grid has; 100 when omitted.
   */
  columns?: number;
  /**
   * The viewport width; the offset layout and its twin share a holder width when this differs by the margin.
   */
  viewportWidth?: number;
}

/**
 * What the grid reports after the scenario, in the units a reader sees on screen.
 */
export interface PageOffsetMetrics {
  holderWidth: number;
  renderedColumns: number;
  firstFullyVisible: number;
  lastFullyVisible: number;
  /**
   * How far the cell `selectCell` scrolled in from far away sits past the row header and frozen columns
   * (negative: under them).
   */
  selectedCellInset: number;
  /**
   * The row header's width.
   */
  rowHeaderWidth: number;
  /**
   * How many of the keyboard steps left the selected cell partly under the row header or frozen columns.
   */
  stepsUnderHeader: number;
  /**
   * The frozen clone's inline-start edge, measured from the holder's.
   */
  cloneInset: number | null;
}

/**
 * The sizes and scroll positions of the clones and of the page, read after the holder scrolled to the bottom.
 */
export interface CloneGeometry {
  inlineStartCloneHeight: number;
  topCloneWidth: number;
  /**
   * The bottom clone's width, or null when the grid has no frozen bottom rows.
   */
  bottomCloneWidth: number | null;
  holderScrollTop: number;
  inlineStartCloneScrollTop: number;
  documentScrollWidth: number;
  documentClientWidth: number;
  /**
   * The bottom inline-start corner's box (left, top, width, height), or null when it does not render.
   */
  bottomCorner: number[] | null;
  /**
   * The top-start corner's box (left, top, width, height), or null when it does not render.
   */
  topCorner: number[] | null;
  /**
   * The inline-start clone's box (left, top, width, height).
   */
  inlineStartClone: number[] | null;
  /**
   * Whether the grid carries the class that marks a window scrolling the columns.
   */
  markedAsWindowScrolled: boolean;
  /**
   * The holder's box (left, top, width, height) and its client width, which excludes its vertical scrollbar.
   */
  holderBox: number[];
  holderClientWidth: number;
}

interface FixtureHot {
  getSelectedLast(): number[] | undefined;
  selectCell(row: number, col: number): void;
  getFirstFullyVisibleRow(): number;
  getLastFullyVisibleRow(): number;
  getFirstFullyVisibleColumn(): number;
  getLastFullyVisibleColumn(): number;
  getCell(row: number, col: number): HTMLElement | null;
  view: { _wt: {
    wtTable: { holder: HTMLElement, getRenderedColumnsCount(): number },
    wtOverlays: { inlineStartOverlay: { mainTableScrollableElement: unknown, getOverlayOffset(): number } },
  } };
}

/**
 * Page Object for the fixture that puts a grid in a wrapper clipping the vertical axis only, offset from
 * the page's inline-start edge.
 */
export class PageOffsetReverseSplitPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigates to the fixture in the given layout and waits for the first cell.
   */
  async goto(layout: PageOffsetLayout = {}): Promise<void> {
    const { viewportWidth = 1000 } = layout;

    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    for (const [key, value] of Object.entries(layout)) {
      if (key !== 'viewportWidth' && value !== undefined) {
        params.set(key, String(value));
      }
    }

    await this.page.setViewportSize({ width: viewportWidth, height: 700 });
    await this.page.goto(`/tests/fixtures/demo/page-offset-reverse-split.html?${params.toString()}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.grid.getByTestId('cell-0-0').first()).toBeVisible();
  }

  /**
   * Lets two animation frames pass: scroll handlers and the draws they trigger run on later frames.
   */
  async settle(): Promise<void> {
    await this.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }

  /**
   * Runs the scenario: reads the columns rendered at init, scrolls the holder (or, on a page the window
   * scrolls, the window) a long way in, reads the visible columns, selects a cell from far away, then walks
   * the selection back with the keyboard.
   */
  async measure(): Promise<PageOffsetMetrics> {
    const initial = await this.read();

    await this.page.evaluate(() => {
      const hot = (window as unknown as { hot: FixtureHot }).hot;
      const dir = document.documentElement.dir;
      const holder = hot.view._wt.wtTable.holder;
      const x = dir === 'rtl' ? -3000 : 3000;

      if (hot.view._wt.wtOverlays.inlineStartOverlay.mainTableScrollableElement === window) {
        window.scrollTo(x, 0);
      } else {
        holder.scrollLeft = x;
      }
    });
    await this.settle();

    const visible = await this.read();

    await this.page.evaluate(() => (window as unknown as { hot: FixtureHot }).hot.selectCell(0, 60));
    await this.settle();
    await this.page.evaluate(() => (window as unknown as { hot: FixtureHot }).hot.selectCell(0, 5));
    await this.settle();

    const selected = await this.read();

    expect(Number.isFinite(selected.selectedInset), 'the selected cell is rendered').toBe(true);

    await this.page.evaluate(() => (window as unknown as { hot: FixtureHot }).hot.selectCell(0, 40));
    await this.settle();

    let stepsUnderHeader = 0;

    for (let step = 0; step < 25; step++) {
      await this.page.keyboard.press(selected.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
      await this.settle();

      const { selectedInset } = await this.read();

      // A selected cell that is not rendered counts as a failed step, not as a pass.
      if (!(selectedInset >= -1)) {
        stepsUnderHeader += 1;
      }
    }

    return {
      holderWidth: initial.holderWidth,
      renderedColumns: initial.renderedColumns,
      firstFullyVisible: visible.firstFullyVisible,
      lastFullyVisible: visible.lastFullyVisible,
      selectedCellInset: selected.selectedInset,
      rowHeaderWidth: selected.rowHeaderWidth,
      stepsUnderHeader,
      cloneInset: selected.cloneInset,
    };
  }

  /**
   * Scrolls to a far column and back, and reads the inline-start overlay's offset (where the scrolling
   * master sits relative to the frozen clones) next to the holder's scroll position.
   */
  async overlayOffset(): Promise<{ overlayOffset: number, holderScroll: number }> {
    await this.page.evaluate(() => (window as unknown as { hot: FixtureHot }).hot.selectCell(0, 60));
    await this.settle();
    await this.page.evaluate(() => (window as unknown as { hot: FixtureHot }).hot.selectCell(0, 20));
    await this.settle();

    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: FixtureHot }).hot;
      const wt = hot.view._wt;

      return {
        overlayOffset: wt.wtOverlays.inlineStartOverlay.getOverlayOffset(),
        holderScroll: Math.abs(wt.wtTable.holder.scrollLeft),
      };
    });
  }

  /**
   * The rendered width of the first data cell of the first row, in pixels.
   */
  async firstCellWidth(): Promise<number> {
    return this.page.evaluate(
      () => document.querySelector('.ht_master tbody tr:first-child td')!.getBoundingClientRect().width);
  }

  /**
   * Reads the grid's geometry once.
   */
  private async read() {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: FixtureHot }).hot;
      const rtl = document.documentElement.dir === 'rtl';
      const holder = hot.view._wt.wtTable.holder;
      const holderBox = holder.getBoundingClientRect();
      const selected = document.querySelector('.ht_master td.current');
      const header = document.querySelector('.ht_master tbody th');
      const clone = document.querySelector('.ht_clone_inline_start');
      const inset = (box: DOMRect) => (rtl ? holderBox.right - box.right : box.left - holderBox.left);
      // How far the cell sits past the row header and the frozen columns, which cover the holder's
      // inline-start edge (and are pinned to the viewport while the window scrolls). Negative: under them.
      const coverInset = (box: DOMRect) => {
        const cover = clone?.getBoundingClientRect();

        if (!cover) {
          return NaN;
        }

        return rtl ? cover.left - box.right : box.left - cover.right;
      };

      return {
        dir: document.documentElement.dir,
        holderWidth: holder.clientWidth,
        renderedColumns: hot.view._wt.wtTable.getRenderedColumnsCount(),
        firstFullyVisible: hot.getFirstFullyVisibleColumn(),
        lastFullyVisible: hot.getLastFullyVisibleColumn(),
        selectedInset: selected ? coverInset(selected.getBoundingClientRect()) : NaN,
        rowHeaderWidth: header ? header.getBoundingClientRect().width : 0,
        cloneInset: clone ? inset(clone.getBoundingClientRect()) : null,
      };
    });
  }

  /**
   * Scrolls the holder to the bottom and 500px along the columns, lets the draws settle, and reads the clone geometry.
   */
  async cloneGeometry(): Promise<CloneGeometry> {
    await this.page.evaluate(() => {
      const hot = (window as unknown as { hot: FixtureHot }).hot;

      // The holder scrolls the rows in a clipping ancestor; with `preventOverflow: 'vertical'` the window does.
      hot.view._wt.wtTable.holder.scrollTop = 1e6;
      window.scrollTo(0, 1e6);
      hot.view._wt.wtTable.holder.scrollLeft = document.documentElement.dir === 'rtl' ? -500 : 500;
    });
    await this.settle();

    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: FixtureHot }).hot;
      const box = (selector: string) => document.querySelector<HTMLElement>(selector);
      const rect = (selector: string) => {
        const bounds = box(selector)?.getBoundingClientRect();

        return bounds ? [bounds.left, bounds.top, bounds.width, bounds.height].map(Math.round) : null;
      };
      const bottom = box('.ht_clone_bottom');

      return {
        inlineStartCloneHeight: box('.ht_clone_inline_start')?.offsetHeight ?? NaN,
        topCloneWidth: box('.ht_clone_top')?.offsetWidth ?? NaN,
        bottomCloneWidth: bottom ? bottom.offsetWidth : null,
        holderScrollTop: hot.view._wt.wtTable.holder.scrollTop,
        inlineStartCloneScrollTop: box('.ht_clone_inline_start .wtHolder')?.scrollTop ?? NaN,
        documentScrollWidth: document.documentElement.scrollWidth,
        documentClientWidth: document.documentElement.clientWidth,
        bottomCorner: rect('.ht_clone_bottom_inline_start_corner'),
        topCorner: rect('.ht_clone_top_inline_start_corner'),
        inlineStartClone: rect('.ht_clone_inline_start'),
        markedAsWindowScrolled: !!document.querySelector('.htHorizontallyScrollableByWindow'),
        holderBox: rect('.ht_master .wtHolder') ?? [],
        holderClientWidth: hot.view._wt.wtTable.holder.clientWidth,
      };
    });
  }

  /**
   * Presses the mouse on a cell, then moves the held pointer through the given points and reads the selection's
   * end cell after each move. Each point is a column offset from the inline-start edge of the page (the page
   * offset gap is the first `margin` pixels) and the row whose vertical center the pointer moves to, so the
   * path does not depend on the theme's row height.
   */
  async dragThroughGap(points: [number, number][]): Promise<string[]> {
    const rtl = await this.page.evaluate(() => document.documentElement.dir === 'rtl');
    const viewportWidth = this.page.viewportSize()?.width ?? 0;
    const centers: number[] = [];

    for (const [, row] of points) {
      const rowBox = await this.page.getByTestId(`cell-${row}-1`).first().boundingBox();

      expect(rowBox, `row ${row} is rendered`).not.toBeNull();
      centers.push((rowBox?.y ?? 0) + (rowBox?.height ?? 0) / 2);
    }

    const box = await this.page.getByTestId('cell-2-1').first().boundingBox();

    expect(box, 'the start cell is rendered').not.toBeNull();
    await this.page.mouse.move((box?.x ?? 0) + 5, (box?.y ?? 0) + 5);
    await this.page.mouse.down();

    const ends: string[] = [];

    for (const [index, [x]] of points.entries()) {
      await this.page.mouse.move(rtl ? viewportWidth - x : x, centers[index], { steps: 3 });
      await this.settle();
      ends.push(await this.page.evaluate(() => {
        const range = (window as unknown as { hot: FixtureHot }).hot.getSelectedLast();

        return range ? `${range[2]},${range[3]}` : 'none';
      }));
    }

    await this.page.mouse.up();

    return ends;
  }

  /**
   * Scrolls the holder through a few bands (down the rows, then along the columns) and, at each stop, reads the
   * visible rows and columns and whether the cells at both ends of each range are rendered.
   */
  async scrollThroughBands(): Promise<string[]> {
    const stops: [number, number][] = [[400, 0], [1485, 0], [1485, 2500], [0, 2500], [0, 0]];
    const reads: string[] = [];

    for (const [top, left] of stops) {
      await this.page.evaluate(([scrollTop, scrollLeft]) => {
        const holder = (window as unknown as { hot: FixtureHot }).hot.view._wt.wtTable.holder;
        const rtl = document.documentElement.dir === 'rtl';

        holder.scrollTop = scrollTop;
        holder.scrollLeft = rtl ? -scrollLeft : scrollLeft;
      }, [top, left]);
      await this.settle();
      reads.push(await this.page.evaluate(() => {
        const hot = (window as unknown as { hot: FixtureHot }).hot;
        const rows = [hot.getFirstFullyVisibleRow(), hot.getLastFullyVisibleRow()];
        const columns = [hot.getFirstFullyVisibleColumn(), hot.getLastFullyVisibleColumn()];
        const rendered = rows.every(row => columns.every(column => hot.getCell(row, column) !== null));

        return `${rows.join('-')}/${columns.join('-')}/${rendered}`;
      }));
    }

    return reads;
  }

  /**
   * Scrolls the holder 300px along the columns, opens the editor of a cell in a frozen column and reads how far the
   * editor's left edge sits from the edge of the cell it edits (the same on both sides of the page, so the sign
   * follows the direction: positive when the editor lies further to the inline-end).
   */
  async editorShift(): Promise<number> {
    await this.page.evaluate(() => {
      const holder = (window as unknown as { hot: FixtureHot }).hot.view._wt.wtTable.holder;

      holder.scrollLeft = document.documentElement.dir === 'rtl' ? -300 : 300;
    });
    await this.settle();
    await this.page.evaluate(() => (window as unknown as { hot: FixtureHot }).hot.selectCell(3, 1));
    await this.page.keyboard.press('Enter');
    await this.settle();

    const editor = this.page.locator('.handsontableInputHolder textarea').first();

    await expect(editor).toBeVisible();

    const editorBox = await editor.boundingBox();
    const cellBox = await this.page.locator('.ht_clone_inline_start').getByTestId('cell-3-1').first().boundingBox();

    expect(editorBox, 'the editor is open').not.toBeNull();
    expect(cellBox, 'the frozen cell is rendered').not.toBeNull();

    return Math.round((editorBox?.x ?? 0) - (cellBox?.x ?? 0));
  }
}
