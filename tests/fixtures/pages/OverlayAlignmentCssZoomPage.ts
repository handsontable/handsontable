import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * One edge of a clone cell that does not coincide with the master cell under it.
 */
export type Misalignment = {
  overlay: string,
  section: 'thead' | 'tbody',
  row: number,
  cell: number,
  edge: 'top' | 'bottom' | 'left' | 'right' | 'height',
  clone: number,
  master: number,
};

/**
 * The result of comparing every overlay cell with the master cell it is painted over.
 */
export type AlignmentReport = {
  /** How many clone cells had a master counterpart to compare with. */
  compared: number,
  /** The same count per overlay, so an overlay that rendered no rows cannot pass unnoticed. */
  comparedByOverlay: Record<string, number>,
  /** The largest edge difference seen, in CSS pixels of the viewport. */
  maxDifference: number,
  /** Every edge past the tolerance. Empty when the overlays line up. */
  misalignments: Misalignment[],
  /** Clone rows for which the master had no row at the mapped index — a mapping bug, not a layout one. */
  unmatchedRows: string[],
};

/**
 * The five overlays a grid with frozen rows top and bottom and row headers paints over its master.
 */
export const OVERLAYS = ['top', 'inline-start', 'top-start-corner', 'bottom', 'bottom-start-corner'] as const;

/**
 * Page Object for the overlay alignment fixture: the complex demo's layout (nested headers, a
 * merged block, frozen rows top and bottom, row headers, with and without a frozen column) rendered
 * under CSS zoom.
 *
 * A grid is several tables painted over each other, and every overlay cell has a master cell
 * underneath it at the same coordinates while the grid sits at its scroll start. `alignment()`
 * compares them pairwise, so "the headers line up with their cells" and "the overlays line up with
 * the master" are one assertion: no edge of any clone cell may differ from its master cell's.
 */
export class OverlayAlignmentCssZoomPage {
  /** The complex demo's shape: row headers plus a frozen column. */
  static readonly FROZEN_COLUMN = 'grid-frozen-column';
  /** Row headers alone, so the row-header overlay's rows hold a `th` and nothing else. */
  static readonly ROW_HEADERS_ONLY = 'grid-row-headers-only';

  static readonly ALL_GRIDS = [
    OverlayAlignmentCssZoomPage.FROZEN_COLUMN,
    OverlayAlignmentCssZoomPage.ROW_HEADERS_ONLY,
  ];

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
   * The zoom the browser is really applying to a grid: a data cell's viewport box divided by its
   * layout box. `getBoundingClientRect()` is scaled by CSS zoom and `offsetWidth` is not, so the
   * ratio is 1 at 100% whatever the zoom attribute says, and every geometry assertion would then
   * pass on an unzoomed page.
   *
   * @param {string} gridId The grid's test id.
   * @returns {Promise<number>}
   */
  async effectiveZoom(gridId: string): Promise<number> {
    return this.page.evaluate((id) => {
      const td = document.querySelector(
        `[data-testid="${id}"] .ht_master table.htCore tbody td`
      ) as HTMLElement;

      return td.getBoundingClientRect().width / td.offsetWidth;
    }, gridId);
  }

  /**
   * The width the browser paints a data cell's bottom border at, in CSS pixels.
   *
   * The border is declared 1px. Under zoom the browser snaps it to whole device pixels, so the
   * computed value moves away from 1 — that snapping is the mechanism that can pull two tables'
   * rows apart, and this is the precondition that it is in play.
   *
   * @param {string} gridId The grid's test id.
   * @returns {Promise<number>}
   */
  async cellBorderBottomWidth(gridId: string): Promise<number> {
    return this.page.evaluate((id) => {
      const td = document.querySelector(`[data-testid="${id}"] .ht_master table.htCore tbody td`) as Element;

      return Number.parseFloat(getComputedStyle(td).borderBottomWidth);
    }, gridId);
  }

  /**
   * Compares every overlay cell of a grid with the master cell painted under it, in ONE `evaluate`.
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
   * the grid — here the window, which the table is taller than — so its vertical position differs
   * from the master's last rows by design and is NOT compared; what must match there is the
   * columns (`left`, `right`) and each row's `height`. Its FIRST row is the one exception to the
   * height: with no header row above it in that table it draws its own top border, and its box is
   * one border taller than the master's copy of the row (measured 30 against 29 on `main` at 100%)
   * — by design, so that row is compared on its columns alone.
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
      const rowsOf = (root: Element, section: 'thead' | 'tbody') => {
        return Array.from(root.querySelectorAll(`table.htCore > ${section} > tr`));
      };
      const master = grid.querySelector('.ht_master') as Element;
      const masterRows = { thead: rowsOf(master, 'thead'), tbody: rowsOf(master, 'tbody') };
      const allEdges = ['top', 'bottom', 'left', 'right'] as const;
      const bottomAnchoredEdges = ['left', 'right', 'height'] as const;
      const bottomAnchoredFirstRowEdges = ['left', 'right'] as const;
      const report: AlignmentReport = {
        compared: 0, comparedByOverlay: {}, maxDifference: 0, misalignments: [], unmatchedRows: [],
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

            const cloneCells = Array.from(cloneRow.children);
            const masterCells = Array.from(masterRow.children);

            cloneCells.forEach((cloneCell, cellIndex) => {
              const masterCell = masterCells[cellIndex];

              if (!masterCell) {
                report.unmatchedRows.push(`${name} ${section} row ${index} cell ${cellIndex}: no master cell`);

                return;
              }

              const cloneRect = cloneCell.getBoundingClientRect();
              const masterRect = masterCell.getBoundingClientRect();

              report.compared += 1;
              report.comparedByOverlay[name] += 1;

              edges.forEach((edge) => {
                const difference = Math.abs(cloneRect[edge] - masterRect[edge]);

                report.maxDifference = Math.max(report.maxDifference, difference);

                if (difference > tolerancePx) {
                  report.misalignments.push({
                    overlay: name,
                    section,
                    row: masterIndex,
                    cell: cellIndex,
                    edge,
                    clone: cloneRect[edge],
                    master: masterRect[edge],
                  });
                }
              });
            });
          });
        });
      });

      return report;
    }, [gridId, tolerance] as const);
  }
}
