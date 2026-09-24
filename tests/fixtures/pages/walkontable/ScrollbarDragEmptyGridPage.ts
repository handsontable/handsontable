import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../../bundle';

/**
 * Where one rendered header sits against where its column or row is, along the scrolled axis.
 */
export interface HeaderPlacement {
  index: number;
  /**
   * The header's leading edge (inline-start for a column header, top for a row header), measured
   * from the same edge of the master holder.
   */
  actual: number;
  /**
   * The column or row offset in the table minus the holder's scroll: where the header must be.
   */
  expected: number;
}

/**
 * The fixture variants, each one an allowlisted query param of the fixture.
 */
export interface ScrollbarDragGridOptions {
  dir?: 'ltr' | 'rtl';
  rowHeaders?: 'on' | 'off';
  /**
   * `no-rows`: column headers over `data: []`, dragged horizontally. `no-columns`: row headers on
   * rows with no columns, dragged vertically.
   */
  shape?: 'no-rows' | 'no-columns';
  /**
   * `element`: the grid's holder scrolls. `window`: the grid is unsized and the page scrolls.
   */
  mode?: 'element' | 'window';
}

/**
 * Page Object for the empty-axis scrollbar-drag fixture (DEV-3083).
 *
 * A native scrollbar press cannot be synthesized in headless Chromium, which draws no scrollbars.
 * What the engine keys on is observable all the same: the `mousedown` of a scrollbar press targets
 * the scrollable element itself (the scrollbar is not a child node) - the holder, or the document
 * element when the page scrolls - and the drag then arrives as plain `scroll` events on it. The page
 * object reproduces exactly that pair.
 */
export class ScrollbarDragEmptyGridPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  mode: 'element' | 'window' = 'element';

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate and wait for the headers to render - a real DOM condition, never a sleep.
   *
   * @param {ScrollbarDragGridOptions} options The fixture variant.
   */
  async goto(options: ScrollbarDragGridOptions = {}): Promise<void> {
    const { dir = 'ltr', rowHeaders = 'off', shape = 'no-rows', mode = 'element' } = options;
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle, dir, rowHeaders, shape, mode });

    this.mode = mode;

    await this.page.goto(`/tests/fixtures/demo/walkontable/scrollbar-drag-empty-grid.html?${params}`);
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    const firstHeader = shape === 'no-rows'
      ? this.grid.locator('.ht_clone_top').getByTestId('col-header-0')
      : this.grid.locator('.ht_clone_inline_start').getByTestId('row-header-0');

    await expect(firstHeader).toBeVisible();
  }

  /**
   * Presses the mouse on the scrollbar: a `mousedown` whose target is the scrollable element.
   */
  async pressScrollbar(): Promise<void> {
    await this.grid.evaluate((root, mode) => {
      const target = mode === 'window'
        ? root.ownerDocument.documentElement
        : root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!target) {
        throw new Error('No scrollable element');
      }

      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }, this.mode);
  }

  /**
   * Drags the pressed scrollbar so the grid is `distance` pixels from its start along `axis`
   * (negative `scrollLeft` in RTL), and waits for the engine to process that scroll.
   *
   * It ends on the fixture's scroll-hook counter, not on the scroll offset: the engine fires the
   * scroll hooks, redraws, and re-syncs the sticky insets in one synchronous block
   * (`ScrollSync#syncScrollPositions`), so once the counter has moved the headers are final.
   *
   * @param {'horizontal' | 'vertical'} axis Which axis the drag moves.
   * @param {number} distance How far from the start of that axis to scroll, in pixels.
   */
  async dragScrollbarTo(axis: 'horizontal' | 'vertical', distance: number): Promise<void> {
    const syncsBefore = await this.page.evaluate(() => (window as any).htScrollSyncs as number);

    await this.grid.evaluate((root, { mode, dragAxis, value }) => {
      const holder = root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!holder) {
        throw new Error('No master holder');
      }

      const isRtl = getComputedStyle(holder).direction === 'rtl';
      const inline = isRtl ? -value : value;

      if (mode === 'window') {
        const view = root.ownerDocument.defaultView as Window;

        view.scrollTo(dragAxis === 'horizontal'
          ? { left: inline, behavior: 'instant' }
          : { top: value, behavior: 'instant' });

      } else if (dragAxis === 'horizontal') {
        holder.scrollLeft = inline;

      } else {
        holder.scrollTop = value;
      }
    }, { mode: this.mode, dragAxis: axis, value: distance });

    await expect.poll(() => this.page.evaluate(() => (window as any).htScrollSyncs as number))
      .toBeGreaterThan(syncsBefore);
  }

  /**
   * Releases the mouse anywhere on the page, which ends the scrollbar drag.
   */
  async releaseScrollbar(): Promise<void> {
    await this.page.evaluate(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
  }

  /**
   * How far the scrolling element is from its start along `axis`, in pixels.
   *
   * @param {'horizontal' | 'vertical'} axis Which axis to read.
   * @returns {Promise<number>}
   */
  async scrollDistance(axis: 'horizontal' | 'vertical'): Promise<number> {
    return this.grid.evaluate((root, { mode, readAxis }) => {
      const holder = root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!holder) {
        throw new Error('No master holder');
      }

      if (mode === 'window') {
        const view = root.ownerDocument.defaultView as Window;

        return Math.abs(readAxis === 'horizontal' ? view.scrollX : view.scrollY);
      }

      return Math.abs(readAxis === 'horizontal' ? holder.scrollLeft : holder.scrollTop);
    }, { mode: this.mode, readAxis: axis });
  }

  /**
   * The furthest the page can scroll horizontally, for the window-scrolled fixture.
   *
   * @returns {Promise<number>}
   */
  async maxWindowScrollLeft(): Promise<number> {
    return this.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }

  /**
   * The CSS `position` of the master spreader: `sticky` while the scrollbar-drag strategy owns it,
   * `relative` otherwise. The positive control that the simulated press really started a drag -
   * without it the ordinary scroll path keeps the headers aligned and every assertion passes.
   *
   * @returns {Promise<string>}
   */
  async spreaderPosition(): Promise<string> {
    return this.grid.evaluate((root) => {
      const spreader = root.querySelector<HTMLElement>('.ht_master > .wtHolder .wtSpreader');

      if (!spreader) {
        throw new Error('No master spreader');
      }

      return spreader.style.position;
    });
  }

  /**
   * Where every rendered column header in the top overlay sits, against where its column is. With
   * row headers on, the columns start after the row header column.
   *
   * @returns {Promise<HeaderPlacement[]>}
   */
  async columnHeaderPlacements(): Promise<HeaderPlacement[]> {
    return this.grid.evaluate((root) => {
      const hot = (window as any).hot;
      const holder = root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!holder) {
        throw new Error('No master holder');
      }

      const isRtl = getComputedStyle(holder).direction === 'rtl';
      const holderRect = holder.getBoundingClientRect();
      const scrolled = Math.abs(holder.scrollLeft);
      const corner = root.querySelector<HTMLElement>('.ht_clone_top_inline_start_corner thead th');
      const rowHeaderWidth = hot.getSettings().rowHeaders && corner ? corner.getBoundingClientRect().width : 0;
      const headers = [...root.querySelectorAll<HTMLElement>('.ht_clone_top th[data-testid^="col-header-"]')];

      return headers.map((th) => {
        const index = Number(th.dataset.testid?.replace('col-header-', ''));
        const rect = th.getBoundingClientRect();
        let columnOffset = rowHeaderWidth;

        for (let column = 0; column < index; column++) {
          columnOffset += hot.getColWidth(column);
        }

        return {
          index,
          actual: Math.round(isRtl ? holderRect.right - rect.right : rect.left - holderRect.left),
          expected: Math.round(columnOffset - scrolled),
        };
      });
    });
  }

  /**
   * Where every rendered row header in the inline-start overlay sits, against where its row is.
   *
   * @returns {Promise<HeaderPlacement[]>}
   */
  async rowHeaderPlacements(): Promise<HeaderPlacement[]> {
    return this.grid.evaluate((root) => {
      const hot = (window as any).hot;
      const holder = root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!holder) {
        throw new Error('No master holder');
      }

      const holderTop = holder.getBoundingClientRect().top;
      const headers = [...root.querySelectorAll<HTMLElement>('.ht_clone_inline_start th[data-testid^="row-header-"]')];

      return headers.map((th) => {
        const index = Number(th.dataset.testid?.replace('row-header-', ''));
        let rowOffset = 0;

        for (let row = 0; row < index; row++) {
          rowOffset += hot.getRowHeight(row);
        }

        return {
          index,
          actual: Math.round(th.getBoundingClientRect().top - holderTop),
          expected: Math.round(rowOffset - holder.scrollTop),
        };
      });
    });
  }
}
