import { type Page, type Locator, expect } from '@playwright/test';

/**
 * How the fixture keeps the grid's container out of the layout while the grid is
 * constructed: `detached` builds the subtree before appending it to the
 * document, `unslotted` makes it a light-DOM child of a shadow host whose
 * `<slot>` renders later.
 */
export type UnlaidOutMode = 'unslotted' | 'detached' | 'hidden' | 'laid-out';

/**
 * The overlay alignment read out of the fixture after a scroll.
 */
export interface OverlayAlignment {
  deadSpaceBelowLastRow: number;
  holderScrollRange: number;
  rowCount: number;
  defaultRowHeight: number | null;
  holderScrollTop: number;
  holderScrollLeft: number;
  frozenColumnsOffset: number;
  columnHeadersOffset: number;
  renderedRows: number;
  scrollsWithWindow: boolean;
}

/**
 * State read after a forced render, used to tell a settled correction pass from
 * one that re-runs on every draw.
 */
export interface DrawState {
  provisional: boolean;
  holderScrollRange: number;
  renderedRows: number;
}

/**
 * Page Object for the unlaid-out-init fixture (`unlaid-out-init.html`).
 *
 * The fixture builds the grid into a container that has no layout boxes yet, so
 * the grid resolves its scrollable element against empty computed styles
 * (DEV-2515). Nothing happens at navigation time — the spec drives
 * `buildGrid()` and `attach()` so that window is exact.
 */
export class UnlaidOutInitPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly status: Locator;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.status = page.getByTestId('status');
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture. Waits only for the document `load` event — the
   * grid does not exist yet, so there is nothing to wait on in the DOM.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/unlaid-out-init.html?theme=${this.theme}&bundle=${this.bundle}`);
  }

  /**
   * Construct the grid while its container is still outside the layout.
   *
   * @param {UnlaidOutMode} mode How the container is kept out of the layout.
   */
  async buildGrid(mode: UnlaidOutMode): Promise<void> {
    await this.page.evaluate(
      buildMode => (window as unknown as { buildGrid(mode: string): void }).buildGrid(buildMode),
      mode
    );
  }

  /**
   * Adds `fixedRowsTop` and `fixedRowsBottom` to the grid the next `buildGrid()`
   * builds. Frozen rows keep their height records apart from the ordinary ones,
   * and the correction pass wipes both.
   */
  async useFrozenRows(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { htFrozenRows: boolean }).htFrozenRows = true;
    });
  }

  /**
   * Whether the overlays still hold a provisional answer for their scrolling
   * element.
   */
  async readProvisionalLayout(): Promise<boolean> {
    return this.page.evaluate(
      () => (window as unknown as { readProvisionalLayout(): boolean }).readProvisionalLayout()
    );
  }

  /**
   * Forces `count` full renders and reports the state after each one.
   *
   * @param {number} count How many renders to force.
   */
  async drawAndReadState(count: number): Promise<DrawState[]> {
    return this.page.evaluate(
      drawCount => (window as unknown as { drawAndReadState(count: number): DrawState[] })
        .drawAndReadState(drawCount),
      count
    );
  }

  /**
   * Put the container into the layout - append the detached subtree, or render
   * the host's `<slot>`.
   */
  async attach(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as { attach(): void }).attach());
    await expect(this.status).toHaveText('attached');
    await expect(this.grid.locator('.ht_master tbody td').first()).toBeVisible();
  }

  /**
   * Scroll the grid's own holder and let the overlays follow.
   *
   * Polls until the holder reports the requested offsets. The grid resizes
   * itself over a few frames after the container joins the layout, and until it
   * does the holder does not scroll at all - a scroll that silently does nothing
   * would leave every overlay trivially aligned and turn this into a false green.
   */
  async scrollGrid(top: number, left: number): Promise<void> {
    await expect.poll(async () => this.page.evaluate(
      ([scrollTop, scrollLeft]) => {
        const api = window as unknown as {
          scrollGrid(top: number, left: number): void,
          readOverlayAlignment(): OverlayAlignment,
        };

        api.scrollGrid(scrollTop, scrollLeft);

        return new Promise<[number, number]>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const alignment = api.readOverlayAlignment();

            resolve([alignment.holderScrollTop, alignment.holderScrollLeft]);
          }));
        });
      },
      [top, left]
    )).toEqual([top, left]);
  }

  /**
   * Waits until both overlay offsets settle within `tolerance` pixels, at a scroll
   * position that is actually scrolled.
   *
   * The correction can redraw a frame after the container joins the layout, so a
   * single sample can land mid-draw and read a transient offset. Polling removes
   * that race.
   *
   * The scroll position is part of the polled value on purpose. Both offsets are
   * trivially 0 at `scrollTop === 0`, so a future change that dropped the scroll
   * offset - or a scroll that silently did nothing - would satisfy an assertion
   * that only looked at the offsets.
   *
   * @param {number} expectedTop The holder scroll position the offsets must hold at.
   * @param {number} expectedLeft The holder scroll position the offsets must hold at.
   * @param {number} tolerance Largest offset, in pixels, still counted as aligned.
   */
  async expectOverlaysAligned(expectedTop: number, expectedLeft: number, tolerance = 1): Promise<void> {
    await expect.poll(async () => {
      const alignment = await this.readOverlayAlignment();

      return {
        holderScrollTop: alignment.holderScrollTop,
        holderScrollLeft: alignment.holderScrollLeft,
        aligned: Math.max(alignment.frozenColumnsOffset, alignment.columnHeadersOffset) <= tolerance
      };
    }).toEqual({ holderScrollTop: expectedTop, holderScrollLeft: expectedLeft, aligned: true });
  }

  /**
   * Waits until the last painted row reaches the container's bottom edge, i.e. the
   * grid fills the space it was given, and did not get there by rendering everything.
   *
   * Dead space at or below zero on its own is a false green: a grid that renders its
   * whole data set - the pre-fix window-scroll state this is meant to catch - has
   * strongly negative dead space and passes. The band size is what separates the two,
   * so it is polled alongside. Dead space itself cannot be bounded from below,
   * because overscan legitimately paints several rows past the container's edge.
   *
   * @param {number} maxRenderedRows Largest band, in rows, a filled viewport may have.
   */
  async expectContainerFilled(maxRenderedRows = 25): Promise<void> {
    await expect.poll(async () => {
      const { deadSpaceBelowLastRow, renderedRows } = await this.readOverlayAlignment();

      return {
        fills: deadSpaceBelowLastRow <= 0,
        bandBounded: renderedRows > 0 && renderedRows <= maxRenderedRows
      };
    }).toEqual({ fills: true, bandBounded: true });
  }

  /**
   * How far the frozen-column and column-header overlays sit from the cells they
   * must stay aligned with, plus the size of the rendered row band.
   */
  async readOverlayAlignment(): Promise<OverlayAlignment> {
    return this.page.evaluate(
      () => (window as unknown as { readOverlayAlignment(): OverlayAlignment }).readOverlayAlignment()
    );
  }

  /**
   * Whether the container really had no layout boxes when the grid was built —
   * proves the scenario was exercised rather than silently skipped.
   */
  async hadNoLayoutAtInit(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as { htWithoutLayoutAtInit: boolean }).htWithoutLayoutAtInit);
  }
}
