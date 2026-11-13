import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * One rendered body row, as the master draws it and as the row header overlay draws its header.
 */
export interface RowPair {
  /**
   * The row's visual index, read from its header label.
   */
  row: number;
  masterTop: number;
  masterBottom: number;
  headerTop: number;
  headerBottom: number;
}

/**
 * Page object for `fixtures/demo/row-size-alignment.html`, the visual suite's retired `/row-size-demo` grid.
 */
export class RowSizeAlignmentPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly holder: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.holder = page.locator('.ht_master .wtHolder');
  }

  /**
   * Opens the fixture with 100 px or 40 px columns.
   *
   * @param {'normal'|'small'} cells The column width shape.
   */
  async goto(cells: 'normal' | 'small'): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/row-size-alignment.html?theme=${this.theme}&bundle=${this.bundle}&cells=${cells}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.locator('.ht_master tbody tr').first()).toBeVisible();
  }

  /**
   * The first body row the master renders, by its row header label.
   *
   * @returns {Promise<number>}
   */
  async firstRenderedRow(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { view: { getFirstRenderedVisibleRow(): number } };
    }).hot.view.getFirstRenderedVisibleRow());
  }

  /**
   * The master's first rendered row and the vertical scroll offsets of the master's and the row header
   * clone's holders, read in one evaluation.
   *
   * @returns {Promise<{firstRow: number, masterScrollTop: number, cloneScrollTop: number}>}
   */
  async scrollState(): Promise<{ firstRow: number; masterScrollTop: number; cloneScrollTop: number }> {
    return this.page.evaluate(() => ({
      firstRow: (window as unknown as {
        hot: { view: { getFirstRenderedVisibleRow(): number } };
      }).hot.view.getFirstRenderedVisibleRow(),
      masterScrollTop: (document.querySelector('.ht_master .wtHolder') as HTMLElement).scrollTop,
      cloneScrollTop: (document.querySelector('.ht_clone_inline_start .wtHolder') as HTMLElement).scrollTop,
    }));
  }

  /**
   * Wheels over the middle of the grid body, the way the demo's specs scroll it, and waits until the
   * scroll has settled: a later first row drawn, the row header clone scrolled to the master's offset,
   * and that offset the same on two reads in a row, so a wheel the browser plays over several frames
   * has finished before anything is measured.
   *
   * @param {number} deltaY The wheel distance.
   */
  async wheelDown(deltaY: number): Promise<void> {
    const before = await this.firstRenderedRow();
    const box = await this.holder.boundingBox();
    let previousScrollTop = Number.NaN;

    await this.page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
    await this.page.mouse.wheel(0, deltaY);
    await expect.poll(async() => {
      const { firstRow, masterScrollTop, cloneScrollTop } = await this.scrollState();
      const settled = firstRow > before && masterScrollTop === cloneScrollTop && masterScrollTop === previousScrollTop;

      previousScrollTop = masterScrollTop;

      return settled;
    }).toBe(true);
  }

  /**
   * Every row inside the holder's visible area, master row and row header read in one evaluation,
   * matched by visual index, so no node is recycled between the two reads.
   *
   * @returns {Promise<RowPair[]>}
   */
  async visibleRowPairs(): Promise<RowPair[]> {
    return this.page.evaluate(() => {
      const holder = (document.querySelector('.ht_master .wtHolder') as HTMLElement).getBoundingClientRect();
      const headerRows = [...document.querySelectorAll('.ht_clone_inline_start tbody tr')] as HTMLElement[];
      const masterRows = [...document.querySelectorAll('.ht_master tbody tr')] as HTMLElement[];
      const masterByRow = new Map(masterRows.map((tr) => {
        const label = (tr.querySelector('td') as HTMLElement).textContent ?? '';

        return [Number(label.split(',')[0]), tr.getBoundingClientRect()];
      }));

      return headerRows.map((tr) => {
        const header = tr.getBoundingClientRect();
        const row = Number((tr.querySelector('th') as HTMLElement).textContent) - 1;
        const master = masterByRow.get(row);

        return {
          row,
          masterTop: master ? master.top : Number.NaN,
          masterBottom: master ? master.bottom : Number.NaN,
          headerTop: header.top,
          headerBottom: header.bottom,
        };
      }).filter(pair => pair.headerBottom > holder.top && pair.headerTop < holder.bottom);
    });
  }
}
