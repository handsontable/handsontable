import type { WalkontableInstance } from './3rdparty/walkontable/src/types';
import { innerHeight, outerHeight } from './helpers/dom/element';

/**
 * A measurement-only ("shadow") probe of the rendered grid.
 *
 * The single-pass refactor moves content-driven size discovery out of the rendering engine. Today
 * Walkontable measures the rendered rows and headers mid-draw (`markOversizedRows` and
 * `syncOversizedColumnHeadersWithFrozenOverlays`, both in `axisSizing/oversizedRows`) and re-runs
 * its calculators in the same draw. The end
 * state supplies every size to the engine up front, so the engine renders once; whatever content
 * height cannot be known up front (wrapped cells and multi-line headers, with `AutoRowSize` off) is
 * discovered by this Handsontable-side probe after the draw and fed back into the next one.
 *
 * This class is the first, deliberately inert, step of that move. It runs after a full master draw
 * (from `TableView.afterRender`, the engine's `onDraw` callback, when the DOM is final), measures the
 * rendered row and column-header heights, and stores them in its own maps. It does NOT feed the
 * values into any size read and it does NOT trigger a re-draw — the engine's own oversized machinery
 * still owns the frame, unchanged. Consuming these values (and deleting the engine machinery) is the
 * next stage's work, gated behind the single-pass behavior change.
 *
 * Its only present job is to prove that an independent measurement produces the same numbers the
 * engine records in `wtViewport.oversizedRows` / `wtViewport.oversizedColumnHeaders`. The
 * characterization spec pins that equality, so the later deletion of the engine machinery rests on a
 * verified replacement. The row and header measurement math is a faithful copy of the engine methods
 * named above, including the border-box compensations.
 */
export class RenderSizeProbe {
  /**
   * Measured row heights, keyed by the engine's source row index (equivalently, Handsontable's
   * renderable row index). Mirrors the values the engine writes to `wtViewport.oversizedRows` for the
   * rows it deems oversized; this map holds every rendered row, so the pinned subset is
   * `oversizedRows`'s keys.
   *
   * @type {Map<number, number>}
   */
  rowHeights: Map<number, number> = new Map();
  /**
   * Measured column-header row heights, keyed by header level. Mirrors the rendered THEAD row heights
   * the engine reads into `wtViewport.oversizedColumnHeaders`.
   *
   * @type {Map<number, number>}
   */
  columnHeaderHeights: Map<number, number> = new Map();

  /**
   * Measures the rendered grid and refreshes the stored maps. A pure read — no DOM writes, no size
   * feedback, no re-draw. Safe to call on every full draw.
   *
   * @param {WalkontableInstance} wt The Walkontable facade for the rendered instance.
   */
  measure(wt: WalkontableInstance): void {
    this.rowHeights.clear();
    this.columnHeaderHeights.clear();

    if (!wt?.wtTable) {
      return;
    }

    const borderBoxSizing = wt.wtSettings.getSetting('stylesHandler').areCellsBorderBox();

    this.#measureRows(wt.wtTable, borderBoxSizing);

    // Frozen rows render in the top and bottom overlays' own tables, not the master TBODY, and the
    // master's band leaves them behind as soon as the grid is scrolled. Every table that can hold a
    // row the shared `oversizedRows` has a record for must be measured, or the probe silently stops
    // mirroring it:
    //
    // - the bottom clone measures itself (`markOversizedRows`, from `renderCellBand`);
    // - frozen ROW heights that came from a frozen COLUMN are measured off the inline-start clone
    //   and the two corners by `syncOversizedRowsWithFrozenOverlays`, which then applies them to the
    //   top and bottom clones — so those clones carry the final height by the time this runs.
    //
    // The master's band and these two together cover every row that can be recorded. The
    // inline-start clone mirrors the master's band, so it adds no rows of its own.
    [wt.wtOverlays?.topOverlay?.clone, wt.wtOverlays?.bottomOverlay?.clone].forEach((clone) => {
      if (clone?.wtTable) {
        this.#measureRows(clone.wtTable, borderBoxSizing);
      }
    });

    this.#measureColumnHeaders(wt.wtTable);
  }

  /**
   * Whether any measured column-header level is taller than the default header height, i.e. a
   * content-driven (or configured) header that the overlays must be re-synced to. Used to gate the
   * post-draw header reconcile so normal single-line headers pay nothing.
   *
   * @param {number} defaultHeight The default header (row) height in px.
   * @returns {boolean}
   */
  hasColumnHeaderTallerThan(defaultHeight: number): boolean {
    for (const height of this.columnHeaderHeights.values()) {
      if (height > defaultHeight) {
        return true;
      }
    }

    return false;
  }

  /**
   * Measures every rendered row of one table body and stores the height under its source row index.
   * The formula matches `markOversizedRows` (`axisSizing/oversizedRows`)'s stored value exactly (a row with a row header is
   * measured from the TH; otherwise from the TR minus the content-box border, then the content-box
   * `+1` is folded back so the stored value equals the engine's).
   *
   * @param {object} wtTable The engine table (master or bottom clone) whose TBODY is measured.
   * @param {boolean} borderBoxSizing Whether cells use `box-sizing: border-box` (the theme axis).
   */
  #measureRows(wtTable: WalkontableInstance['wtTable'], borderBoxSizing: boolean): void {
    const { TBODY, rowFilter } = wtTable;

    if (!TBODY || !rowFilter) {
      return;
    }

    const heightFn = borderBoxSizing ? outerHeight : innerHeight;
    const borderCompensation = borderBoxSizing ? 0 : 1;
    let renderedRowIndex = TBODY.childNodes.length;

    while (renderedRowIndex) {
      renderedRowIndex -= 1;

      const sourceRowIndex = rowFilter.renderedToSource(renderedRowIndex);
      const currentTr = TBODY.childNodes[renderedRowIndex] as HTMLTableRowElement;
      const rowHeader = currentTr.querySelector('th');
      let rowCurrentHeight;

      if (rowHeader) {
        rowCurrentHeight = heightFn(rowHeader);
      } else {
        rowCurrentHeight = heightFn(currentTr) - borderCompensation;
      }

      if (!borderBoxSizing) {
        rowCurrentHeight += 1;
      }

      this.rowHeights.set(sourceRowIndex, rowCurrentHeight);
    }
  }

  /**
   * Measures the rendered column-header heights per level. Matches
   * `Table.markIfOversizedColumnHeader`, which reads `innerHeight` of each header CELL (TH) and keeps
   * the tallest per level — not the THEAD row height, which is a border taller. Each THEAD child is a
   * header row (one per level); its TH cells are the per-column headers.
   *
   * @param {object} wtTable The master engine table whose THEAD is measured.
   */
  #measureColumnHeaders(wtTable: WalkontableInstance['wtTable']): void {
    const { THEAD } = wtTable;

    if (!THEAD) {
      return;
    }

    const headerRows = THEAD.childNodes;

    for (let level = 0, len = headerRows.length; level < len; level++) {
      const cells = headerRows[level].childNodes;
      let maxHeight;

      for (let col = 0; col < cells.length; col++) {
        const cell = cells[col];

        // Skip cells that span more than one header row (nested-header rowspan). Their height covers
        // several levels, so measuring it as this level's height would push the lower levels down.
        // Only single-row header cells carry a content-driven per-level height.
        if (cell instanceof HTMLTableCellElement && cell.rowSpan <= 1) {
          const cellHeight = innerHeight(cell);

          if (maxHeight === undefined || cellHeight > maxHeight) {
            maxHeight = cellHeight;
          }
        }
      }

      if (maxHeight !== undefined) {
        this.columnHeaderHeights.set(level, maxHeight);
      }
    }
  }
}
