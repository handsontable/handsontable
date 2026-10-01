import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { afterAnimationFrames } from '../frames';

/**
 * One edge of a clone cell that does not coincide with the cell it is compared against: the master
 * cell painted under it, or, for the bottom-start corner, the bottom overlay's cell in the same row.
 */
export type Misalignment = {
  overlay: string,
  against: 'master' | 'bottom',
  section: 'thead' | 'tbody',
  row: number,
  cell: number,
  edge: 'top' | 'bottom' | 'left' | 'right' | 'height',
  clone: number,
  reference: number,
};

/**
 * The result of comparing every overlay cell with the cell it has to coincide with.
 */
export type AlignmentReport = {
  /**
   * How many clone cells had a counterpart to compare with.
   */
  compared: number,
  /**
   * The same count per comparison, so an overlay that rendered no rows cannot pass unnoticed.
   */
  comparedByOverlay: Record<string, number>,
  /**
   * The largest edge difference seen, in CSS pixels of the viewport.
   */
  maxDifference: number,
  /**
   * Every edge past the tolerance. Empty when the overlays line up.
   */
  misalignments: Misalignment[],
  /**
   * Clone rows for which the counterpart table had no row at the mapped index — a mapping bug, not a
   * layout one.
   */
  unmatchedRows: string[],
};

/**
 * The comparisons `alignment()` runs: the five overlays a grid with frozen rows top and bottom and
 * row headers paints over its master, and the bottom-start corner against the bottom overlay.
 */
export const COMPARISONS = [
  'top', 'inline-start', 'top-start-corner', 'bottom', 'bottom-start-corner', 'bottom-start-corner vs bottom',
] as const;

/**
 * Page Object for the overlay alignment fixture: the complex demo's layout (nested headers, a
 * merged block, frozen rows top and bottom, row headers, with and without a frozen column) rendered
 * under CSS zoom.
 *
 * A grid is several tables painted over each other, and every overlay cell has a master cell
 * underneath it at the same coordinates while the grid sits at its scroll start. `alignment()`
 * compares them pairwise, so "the headers line up with their cells" and "the overlays line up with
 * the master" are one assertion: no edge of any clone cell may differ from the cell it covers.
 */
export class OverlayAlignmentCssZoomPage {
  /**
   * The complex demo's shape: row headers plus a frozen column.
   */
  static readonly FROZEN_COLUMN = 'grid-frozen-column';
  /**
   * Row headers alone, so the row-header overlay's rows hold a `th` and nothing else.
   */
  static readonly ROW_HEADERS_ONLY = 'grid-row-headers-only';

  static readonly ALL_GRIDS = [
    OverlayAlignmentCssZoomPage.FROZEN_COLUMN,
    OverlayAlignmentCssZoomPage.ROW_HEADERS_ONLY,
  ];

  /**
   * How many animation frames `afterFrames()` waits. The engine's slowest asynchronous redraw is the
   * resize monitor's: a `ResizeObserver` delivery, which arrives after a frame's rAF callbacks, schedules
   * the redraw in a rAF of the next frame (`resizeMonitor.ts`). Measured with a redraw delivered that way
   * on every zoom change: with no settle the draw counter saw it in 6 of 12 runs (and the window-resize
   * control itself failed in 3), with one frame and with three it saw it in 12 of 12. Three keeps a
   * margin of two frames over that, for a delivery that arrives a frame or two after the change.
   */
  static readonly SETTLE_FRAMES = 3;

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate at a given zoom and wait for both grids to have rendered every overlay's rows — a real
   * DOM condition, never a sleep. The fixture applies the zoom before constructing the grids, and a
   * constructor that threw is rethrown here rather than surfacing as a visibility timeout.
   *
   * @param {number} zoom The CSS zoom to render the page at.
   */
  async goto(zoom = 1): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/overlay-alignment-css-zoom.html?theme=${this.theme}&bundle=${this.bundle}&zoom=${zoom}`
    );
    await awaitBundle(this.page);

    const rows = await this.rowCount();

    for (const gridId of OverlayAlignmentCssZoomPage.ALL_GRIDS) {
      const initError = await this.page.getByTestId(gridId).getAttribute('data-init-error');

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }

      // Every overlay the comparison reads, so none can contribute zero cells because it had not
      // laid its rows out yet.
      await expect(this.overlay(gridId, '.ht_clone_top').locator('thead tr')).toHaveCount(4);
      await expect(this.overlay(gridId, '.ht_clone_top').locator('tbody tr')).toHaveCount(1);
      await expect(this.overlay(gridId, '.ht_clone_top_inline_start_corner').locator('thead tr')).toHaveCount(4);
      await expect(this.overlay(gridId, '.ht_clone_top_inline_start_corner').locator('tbody tr')).toHaveCount(1);
      await expect(this.overlay(gridId, '.ht_clone_inline_start').locator('tbody tr')).toHaveCount(rows);
      await expect(this.overlay(gridId, '.ht_clone_bottom').locator('tbody tr')).toHaveCount(2);
      await expect(this.overlay(gridId, '.ht_clone_bottom_inline_start_corner').locator('tbody tr')).toHaveCount(2);
    }
  }

  /**
   * An overlay's root element inside one grid.
   *
   * @param {string} gridId The grid's test id.
   * @param {string} className The overlay's class selector, e.g. `.ht_clone_top`.
   * @returns {Locator}
   */
  overlay(gridId: string, className: string): Locator {
    return this.page.getByTestId(gridId).locator(className);
  }

  /**
   * Changes the page zoom on the built grids, the way the retired visual spec did.
   *
   * @param {number} zoom The CSS zoom to apply.
   */
  async applyZoom(zoom: number): Promise<void> {
    await this.page.evaluate(value => (window as unknown as {
      applyZoom: (z: number) => void
    }).applyZoom(value), zoom);
  }

  /**
   * Waits `SETTLE_FRAMES` rendered frames. A bounded settle, so it is sound only beside a positive
   * control that proved a redraw lands inside it (see the spec's late-zoom case).
   */
  async afterFrames(): Promise<void> {
    await afterAnimationFrames(this.page, OverlayAlignmentCssZoomPage.SETTLE_FRAMES);
  }

  /**
   * Widens the viewport by one pixel. The window `resize` event is the one asynchronous path that
   * redraws these grids (they scroll with the window, so the engine's container observer is not
   * attached to them — `nativeScrollInput.ts`), which makes it the positive control for the redraw
   * counter.
   */
  async nudgeViewportWidth(): Promise<void> {
    const size = this.page.viewportSize();

    if (!size) {
      throw new Error('The page has no viewport size to nudge.');
    }

    await this.page.setViewportSize({ width: size.width + 1, height: size.height });
  }

  /**
   * How many times a grid has drawn itself since construction (`afterViewRender`).
   *
   * @param {string} gridId The grid's test id.
   * @returns {Promise<number>}
   */
  async renderCount(gridId: string): Promise<number> {
    return this.page.evaluate(id => (window as unknown as {
      renderCounts: Record<string, number>
    }).renderCounts[id], gridId);
  }

  /**
   * How many rows each grid holds.
   *
   * @returns {Promise<number>}
   */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htRowCount: number }).htRowCount);
  }

  /**
   * The theme a grid actually resolved, read from the instance rather than from the DOM.
   *
   * Linking a theme's stylesheet does not apply it — every rule is scoped to an `ht-theme-*` class
   * on the container. Without that class all three theme legs render the built-in default and
   * quietly test one configuration six times over.
   *
   * @param {string} gridId The grid's test id.
   * @returns {Promise<string>}
   */
  async activeTheme(gridId: string): Promise<string> {
    return this.page.evaluate(id => (window as unknown as {
      hots: Record<string, { getCurrentThemeName(): string }>,
    }).hots[id].getCurrentThemeName(), gridId);
  }

  /**
   * The zoom the browser is really applying to a grid, and the width it paints a data cell's 1px
   * bottom border at, read in one round trip.
   *
   * The zoom is a data cell's viewport box divided by its layout box: `getBoundingClientRect()` is
   * scaled by CSS zoom and `offsetWidth` is not, so the ratio is 1 at 100% whatever the zoom attribute
   * says. The border is declared 1px; under zoom the browser snaps it to whole device pixels, so its
   * computed value moves away from 1 — that snapping is the mechanism that can pull two tables' rows
   * apart. Both together are the precondition that the alignment checks measure a zoomed page.
   *
   * @param {string} gridId The grid's test id.
   * @returns {Promise<{ zoom: number, border: number }>}
   */
  async appliedZoom(gridId: string): Promise<{ zoom: number, border: number }> {
    return this.page.evaluate((id) => {
      const td = document.querySelector(
        `[data-testid="${id}"] .ht_master table.htCore tbody td`
      ) as HTMLElement;

      return {
        zoom: td.getBoundingClientRect().width / td.offsetWidth,
        border: Number.parseFloat(getComputedStyle(td).borderBottomWidth),
      };
    }, gridId);
  }

  /**
   * Compares every overlay cell of a grid with the cell it has to coincide with, in ONE `evaluate`.
   *
   * Each clone's header rows map to the master's header rows one to one, and its body rows map to
   * the master's body rows from the top (top and inline-start overlays and the top corner) or from
   * the bottom (the bottom overlay and the bottom corner). Cells map by position inside the row:
   * every clone renders the same column window and the same colspans as the master, so the n-th
   * cell of a row is the same cell in both tables.
   *
   * A top-anchored clone sits exactly over its master cells while the grid is at its scroll start,
   * so all four edges are compared: a header drawn one pixel taller than its row, a frozen column
   * one pixel wider than its master copy, or a corner cell shifted against either neighbour all
   * land in `misalignments`. A bottom-anchored clone is pinned to the bottom of whatever scrolls
   * the grid — here the window, which the table is taller than — so its vertical position against
   * the master's last rows is by design not compared here; against the master, it is compared on the
   * columns (`left`, `right`) and each row's `height`. Its FIRST row is the one exception to the
   * height: with no header row above it in that table it draws its own top border, and its box is
   * one border taller than the master's copy of the row (measured 30 against 29 on `main` at 100%)
   * — by design, so that row is compared with the master on its columns alone.
   *
   * The vertical position of the bottom band is compared instead between its two tables, which are
   * pinned the same way: every cell of the bottom-start corner against the bottom overlay's cell in
   * the same row, on all four edges, the seam row included. That is where a corner `th` coming out
   * shorter than the bottom overlay's row would break the bottom-freeze seam line. Their position
   * against the master rows is `bottomBandPlacement()`, with the grid's end in view.
   *
   * @param {string} gridId The grid's test id.
   * @param {number} tolerance The largest edge difference that counts as aligned, in CSS pixels.
   * @returns {Promise<AlignmentReport>}
   */
  async alignment(gridId: string, tolerance: number): Promise<AlignmentReport> {
    return this.page.evaluate(([id, tolerancePx]) => {
      const grid = document.querySelector(`[data-testid="${id}"]`) as HTMLElement;
      const overlays = [
        { name: 'top', selector: '.ht_clone_top', anchor: 'top' },
        { name: 'inline-start', selector: '.ht_clone_inline_start', anchor: 'top' },
        { name: 'top-start-corner', selector: '.ht_clone_top_inline_start_corner', anchor: 'top' },
        { name: 'bottom', selector: '.ht_clone_bottom', anchor: 'bottom' },
        { name: 'bottom-start-corner', selector: '.ht_clone_bottom_inline_start_corner', anchor: 'bottom' },
      ] as const;
      const rowsOf = (root: Element | null, section: 'thead' | 'tbody') => {
        return root ? Array.from(root.querySelectorAll(`table.htCore > ${section} > tr`)) : [];
      };
      const master = grid.querySelector('.ht_master') as Element;
      const masterRows = { thead: rowsOf(master, 'thead'), tbody: rowsOf(master, 'tbody') };
      const allEdges = ['top', 'bottom', 'left', 'right'] as const;
      const bottomAnchoredEdges = ['left', 'right', 'height'] as const;
      const bottomAnchoredFirstRowEdges = ['left', 'right'] as const;
      const report: AlignmentReport = {
        compared: 0, comparedByOverlay: {}, maxDifference: 0, misalignments: [], unmatchedRows: [],
      };
      const compare = (
        name: string, against: Misalignment['against'], section: Misalignment['section'], row: number,
        cellIndex: number, clone: Element, reference: Element, edges: readonly Misalignment['edge'][],
      ) => {
        const cloneRect = clone.getBoundingClientRect();
        const referenceRect = reference.getBoundingClientRect();

        report.compared += 1;
        report.comparedByOverlay[name] += 1;

        edges.forEach((edge) => {
          const difference = Math.abs(cloneRect[edge] - referenceRect[edge]);

          report.maxDifference = Math.max(report.maxDifference, difference);

          if (difference > tolerancePx) {
            report.misalignments.push({
              overlay: name,
              against,
              section,
              row,
              cell: cellIndex,
              edge,
              clone: cloneRect[edge],
              reference: referenceRect[edge],
            });
          }
        });
      };

      overlays.forEach(({ name, selector, anchor }) => {
        const clone = grid.querySelector(selector);

        report.comparedByOverlay[name] = 0;

        if (!clone) {
          report.unmatchedRows.push(`${name}: overlay not rendered`);

          return;
        }

        (['thead', 'tbody'] as const).forEach((section) => {
          const cloneRows = rowsOf(clone, section);
          const targetRows = masterRows[section];

          cloneRows.forEach((cloneRow, index) => {
            // Header rows and top-anchored body rows count from the first row; a bottom overlay
            // renders the master's LAST rows.
            const bottomAnchored = section === 'tbody' && anchor === 'bottom';
            const masterIndex = bottomAnchored ? targetRows.length - cloneRows.length + index : index;
            let edges: readonly Misalignment['edge'][] = allEdges;

            if (bottomAnchored) {
              edges = index === 0 ? bottomAnchoredFirstRowEdges : bottomAnchoredEdges;
            }

            const masterRow = targetRows[masterIndex];

            if (!masterRow) {
              report.unmatchedRows.push(`${name} ${section} row ${index} -> master row ${masterIndex}`);

              return;
            }

            const masterCells = Array.from(masterRow.children);

            Array.from(cloneRow.children).forEach((cloneCell, cellIndex) => {
              const masterCell = masterCells[cellIndex];

              if (!masterCell) {
                report.unmatchedRows.push(`${name} ${section} row ${index} cell ${cellIndex}: no master cell`);

                return;
              }

              compare(name, 'master', section, masterIndex, cellIndex, cloneCell, masterCell, edges);
            });
          });
        });
      });

      // The bottom band's two tables against each other, all four edges: both are pinned the same
      // way, and the corner renders the first cells of each of the bottom overlay's rows.
      const pairName = 'bottom-start-corner vs bottom';
      const cornerRows = rowsOf(grid.querySelector('.ht_clone_bottom_inline_start_corner'), 'tbody');
      const bottomRows = rowsOf(grid.querySelector('.ht_clone_bottom'), 'tbody');

      report.comparedByOverlay[pairName] = 0;

      cornerRows.forEach((cornerRow, index) => {
        const bottomRow = bottomRows[index];

        if (!bottomRow) {
          report.unmatchedRows.push(`${pairName} row ${index}: no bottom overlay row`);

          return;
        }

        Array.from(cornerRow.children).forEach((cornerCell, cellIndex) => {
          const bottomCell = bottomRow.children[cellIndex];

          if (!bottomCell) {
            report.unmatchedRows.push(`${pairName} row ${index} cell ${cellIndex}: no bottom overlay cell`);

            return;
          }

          compare(pairName, 'bottom', 'tbody', index, cellIndex, cornerCell, bottomCell, allEdges);
        });
      });

      return report;
    }, [gridId, tolerance] as const);
  }

  /**
   * Scrolls the window until a grid's last row is in the middle of the viewport, then waits
   * `SETTLE_FRAMES` frames for the overlays to follow the scroll. With the grid's end in view its
   * bottom band is no longer pinned to the window's edge: it sits over the master rows it repeats.
   *
   * @param {string} gridId The grid's test id.
   */
  async scrollGridEndIntoView(gridId: string): Promise<void> {
    await this.page.evaluate((id) => {
      const rows = document.querySelectorAll(`[data-testid="${id}"] .ht_master table.htCore > tbody > tr`);

      (rows[rows.length - 1] as HTMLElement).scrollIntoView({ block: 'center' });
    }, gridId);
    await this.afterFrames();
  }

  /**
   * Compares the bottom band's rows (the bottom overlay and the bottom-start corner) with the master
   * rows they repeat, vertically, in ONE `evaluate`. Call it with the grid's end in view
   * (`scrollGridEndIntoView()`), where the band sits over those rows.
   *
   * Every row's bottom edge coincides with its master row's. The rows above the band's first row
   * draw no top border of their own in the master, while the band's first row does (it is the
   * bottom-freeze seam), so that row's top sits one border higher than its master row's and its box
   * is one border taller; the other rows' tops and heights coincide. The border is the clone cell's
   * own computed `border-top-width`, scaled to the viewport by the zoom.
   *
   * @param {string} gridId The grid's test id.
   * @param {number} tolerance The largest difference that counts as aligned, in CSS pixels.
   * @returns {Promise<AlignmentReport>}
   */
  async bottomBandPlacement(gridId: string, tolerance: number): Promise<AlignmentReport> {
    return this.page.evaluate(([id, tolerancePx]) => {
      const grid = document.querySelector(`[data-testid="${id}"]`) as HTMLElement;
      const rowsOf = (selector: string) => {
        return Array.from(grid.querySelectorAll(`${selector} table.htCore > tbody > tr`));
      };
      const masterRows = rowsOf('.ht_master');
      const sampleCell = masterRows[0].children[masterRows[0].children.length - 1] as HTMLElement;
      const zoom = sampleCell.getBoundingClientRect().width / sampleCell.offsetWidth;
      const report: AlignmentReport = {
        compared: 0, comparedByOverlay: {}, maxDifference: 0, misalignments: [], unmatchedRows: [],
      };

      [
        { name: 'bottom', selector: '.ht_clone_bottom' },
        { name: 'bottom-start-corner', selector: '.ht_clone_bottom_inline_start_corner' },
      ].forEach(({ name, selector }) => {
        const cloneRows = rowsOf(selector);

        report.comparedByOverlay[name] = 0;

        cloneRows.forEach((cloneRow, index) => {
          const masterIndex = masterRows.length - cloneRows.length + index;
          const masterRow = masterRows[masterIndex];

          if (!masterRow) {
            report.unmatchedRows.push(`${name} row ${index} -> master row ${masterIndex}`);

            return;
          }

          Array.from(cloneRow.children).forEach((cloneCell, cellIndex) => {
            const masterCell = masterRow.children[cellIndex];

            if (!masterCell) {
              report.unmatchedRows.push(`${name} row ${index} cell ${cellIndex}: no master cell`);

              return;
            }

            const cloneRect = cloneCell.getBoundingClientRect();
            const masterRect = masterCell.getBoundingClientRect();
            const seam = index === 0 ? Number.parseFloat(getComputedStyle(cloneCell).borderTopWidth) * zoom : 0;
            const expected = {
              top: masterRect.top - seam,
              bottom: masterRect.bottom,
              height: masterRect.height + seam,
            };

            report.compared += 1;
            report.comparedByOverlay[name] += 1;

            (['top', 'bottom', 'height'] as const).forEach((edge) => {
              const difference = Math.abs(cloneRect[edge] - expected[edge]);

              report.maxDifference = Math.max(report.maxDifference, difference);

              if (difference > tolerancePx) {
                report.misalignments.push({
                  overlay: name,
                  against: 'master',
                  section: 'tbody',
                  row: masterIndex,
                  cell: cellIndex,
                  edge,
                  clone: cloneRect[edge],
                  reference: expected[edge],
                });
              }
            });
          });
        });
      });

      return report;
    }, [gridId, tolerance] as const);
  }
}
