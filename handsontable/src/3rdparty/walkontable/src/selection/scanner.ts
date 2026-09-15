/* eslint-disable no-continue */
import type { WalkontableInstance } from '../types';
import type Selection from './selection';
import { isHTMLElement } from '../../../../helpers/dom/element';

/**
 * The cell elements a selection layer resolved to, each with every source coordinate that
 * resolved to it (a merged cell's element is reached from each coordinate the block covers).
 * The coordinates let the manager ask the `onAfterDrawSelection` setting for a plugin's extra
 * class on every draw, for every coordinate, because that answer depends on plugin state
 * (MergeCells answers only for a block's first renderable coordinate, and only when every
 * selection layer covers the block) and cannot be cached with the elements.
 */
export interface CellScanResult {
  cells: Map<HTMLElement, Array<[number, number]>>;
}

/**
 * Selection scanner module scans the rendered cells and headers and if it finds an intersection with
 * the coordinates of the Selection class (highlight) it returns the DOM elements.
 *
 * @private
 */
export class SelectionScanner {
  /**
   * Active Selection instance to process.
   *
   * @type {Selection}
   */
  #selection: Selection | null = null;
  /**
   * The Walkontable instance that the scans depends on.
   *
   * @type {Walkontable}
   */
  #activeOverlaysWot: WalkontableInstance | null = null;

  /**
   * Sets the Walkontable instance that will be taking into account while scanning the table.
   *
   * @param {Walkontable} activeOverlaysWot The Walkontable instance.
   * @returns {SelectionScanner}
   */
  setActiveOverlay(activeOverlaysWot: WalkontableInstance | null) {
    this.#activeOverlaysWot = activeOverlaysWot;

    return this;
  }

  /**
   * Sets the Selection instance to process.
   *
   * @param {Selection} selection The Selection instance.
   * @returns {SelectionScanner}
   */
  setActiveSelection(selection: Selection | null) {
    this.#selection = selection;

    return this;
  }

  /**
   * Scans the header elements (TH) the selection covers, based on the selection type. Header scans
   * run hooks that let plugins redirect a header, so the result is never cached.
   *
   * @returns {Set<HTMLElement>}
   */
  scanHeaders(): Set<HTMLElement> {
    const selectionType = this.#selection!.settings.selectionType;
    const elements = new Set<HTMLElement>();
    const add = (element: HTMLElement) => elements.add(element);

    // TODO(improvement): use heuristics from coords to detect what type of scan
    // the Selection needs instead of using `selectionType` property.
    switch (selectionType) {
      case 'active-header':
      case 'focus':
      case 'header':
        this.scanColumnsInHeadersRange(add);
        this.scanRowsInHeadersRange(add);
        break;
      case 'row':
        this.scanRowsInHeadersRange(add);
        break;
      case 'column':
        this.scanColumnsInHeadersRange(add);
        break;
      default:
        break;
    }

    return elements;
  }

  /**
   * Scans the cell elements (TD) the selection covers, based on the selection type. The result is
   * a pure function of the selection corners and the rendered band, so the manager caches it.
   *
   * @returns {CellScanResult}
   */
  scanCells(): CellScanResult {
    const selectionType = this.#selection!.settings.selectionType;
    const result: CellScanResult = { cells: new Map() };
    const add = (element: HTMLElement, sourceRow: number, sourceColumn: number) => {
      const coordinates = result.cells.get(element);

      if (coordinates === undefined) {
        result.cells.set(element, [[sourceRow, sourceColumn]]);
      } else {
        coordinates.push([sourceRow, sourceColumn]);
      }
    };

    switch (selectionType) {
      case 'area':
      case 'fill':
      case 'focus':
        this.scanCellsRange(add);
        break;
      case 'row':
        this.scanRowsInCellsRange(add);
        break;
      case 'column':
        this.scanColumnsInCellsRange(add);
        break;
      default:
        break;
    }

    return result;
  }

  /**
   * Scans the table (only rendered headers) and collect all column headers (TH) that match
   * the coordinates passed in the Selection instance.
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanColumnsInHeadersRange(callback: (element: HTMLElement) => void) {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection!.getCorners();
    const { wtTable } = this.#activeOverlaysWot!;
    const renderedColumnsCount = wtTable.getRenderedColumnsCount();
    const columnHeadersCount = wtTable.getColumnHeadersCount();
    let cursor = 0;

    for (let column = -wtTable.getRowHeadersCount(); column < renderedColumnsCount; column++) {
      const sourceColumn = wtTable.columnFilter!.renderedToSource(column);

      if (sourceColumn < topColumn || sourceColumn > bottomColumn) {
        continue;
      }

      for (let headerLevel = -columnHeadersCount; headerLevel < 0; headerLevel++) {
        if (headerLevel < topRow || headerLevel > bottomRow) {
          continue;
        }

        const positiveBasedHeaderLevel = headerLevel + columnHeadersCount;
        let TH = wtTable.getColumnHeader(sourceColumn, positiveBasedHeaderLevel);
        const newSourceCol = this.#activeOverlaysWot!
          .getSetting('onBeforeHighlightingColumnHeader', sourceColumn, positiveBasedHeaderLevel, {
            selectionType: this.#selection!.settings.selectionType,
            columnCursor: cursor,
            selectionWidth: bottomColumn - topColumn + 1,
          });

        if (newSourceCol === null) {
          continue;
        }

        if (newSourceCol !== sourceColumn) {
          TH = wtTable.getColumnHeader(newSourceCol as number, positiveBasedHeaderLevel);
        }

        if (isHTMLElement(TH)) {
          callback(TH);
        }
      }

      cursor += 1;
    }
  }

  /**
   * Scans the table (only rendered headers) and collect all row headers (TH) that match
   * the coordinates passed in the Selection instance.
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanRowsInHeadersRange(callback: (element: HTMLElement) => void) {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection!.getCorners();
    const { wtTable } = this.#activeOverlaysWot!;
    const renderedRowsCount = wtTable.getRenderedRowsCount();
    const rowHeadersCount = wtTable.getRowHeadersCount();
    let cursor = 0;

    for (let row = -wtTable.getColumnHeadersCount(); row < renderedRowsCount; row++) {
      const sourceRow = wtTable.rowFilter!.renderedToSource(row);

      if (sourceRow < topRow || sourceRow > bottomRow) {
        continue;
      }

      for (let headerLevel = -rowHeadersCount; headerLevel < 0; headerLevel++) {
        if (headerLevel < topColumn || headerLevel > bottomColumn) {
          continue;
        }

        const positiveBasedHeaderLevel = headerLevel + rowHeadersCount;
        let TH = wtTable.getRowHeader(sourceRow, positiveBasedHeaderLevel);
        const newSourceRow = this.#activeOverlaysWot!
          .getSetting('onBeforeHighlightingRowHeader', sourceRow, positiveBasedHeaderLevel, {
            selectionType: this.#selection!.settings.selectionType,
            rowCursor: cursor,
            selectionHeight: bottomRow - topRow + 1,
          });

        if (newSourceRow === null) {
          continue;
        }

        if (newSourceRow !== sourceRow) {
          TH = wtTable.getRowHeader(newSourceRow as number, positiveBasedHeaderLevel);
        }

        if (isHTMLElement(TH)) {
          callback(TH);
        }
      }

      cursor += 1;
    }
  }

  /**
   * Scans the table (only rendered cells) and collect all cells (TR) that match
   * the coordinates passed in the Selection instance.
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanCellsRange(callback: (element: HTMLElement, sourceRow: number, sourceColumn: number) => void) {
    const { wtTable } = this.#activeOverlaysWot!;

    this.#scanCellsRange((sourceRow: number, sourceColumn: number) => {
      const cell = wtTable.getCell(this.#activeOverlaysWot!.createCellCoords(sourceRow, sourceColumn));

      if (isHTMLElement(cell)) {
        callback(cell, sourceRow, sourceColumn);
      }
    });
  }

  /**
   * Scans the table (only rendered cells) and collects all cells (TR) that match the coordinates
   * passed in the Selection instance but only for the X axis (rows).
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanRowsInCellsRange(callback: (element: HTMLElement, sourceRow: number, sourceColumn: number) => void) {
    // eslint-disable-next-line comma-spacing
    const [topRow,, bottomRow,] = this.#selection!.getCorners();
    const { wtTable } = this.#activeOverlaysWot!;

    this.#scanViewportRange((sourceRow: number, sourceColumn: number) => {
      if (sourceRow >= topRow && sourceRow <= bottomRow) {
        const cell = wtTable.getCell(this.#activeOverlaysWot!.createCellCoords(sourceRow, sourceColumn));

        if (isHTMLElement(cell)) {
          callback(cell, sourceRow, sourceColumn);
        }
      }
    });
  }

  /**
   * Scans the table (only rendered cells) and collects all cells (TR) that match the coordinates
   * passed in the Selection instance but only for the Y axis (columns).
   *
   * @param {function(HTMLTableElement): void} callback The callback function to trigger.
   */
  scanColumnsInCellsRange(callback: (element: HTMLElement, sourceRow: number, sourceColumn: number) => void) {
    const [, topColumn,, bottomColumn] = this.#selection!.getCorners();
    const { wtTable } = this.#activeOverlaysWot!;

    this.#scanViewportRange((sourceRow: number, sourceColumn: number) => {
      if (sourceColumn >= topColumn && sourceColumn <= bottomColumn) {
        const cell = wtTable.getCell(this.#activeOverlaysWot!.createCellCoords(sourceRow, sourceColumn));

        if (isHTMLElement(cell)) {
          callback(cell, sourceRow, sourceColumn);
        }
      }
    });
  }

  /**
   * The method triggers a callback for each rendered cell.
   *
   * @param {function(number, number): void} callback The callback function to trigger.
   */
  #scanCellsRange(callback: (row: number, column: number) => void) {
    let [topRow, startColumn, bottomRow, endColumn] = this.#selection!.getCorners();

    if (topRow < 0 && bottomRow < 0 || startColumn < 0 && endColumn < 0) {
      return;
    }

    const { wtTable } = this.#activeOverlaysWot!;
    const isMultiple = (topRow !== bottomRow || startColumn !== endColumn);

    startColumn = Math.max(startColumn ?? 0, 0);
    endColumn = Math.max(endColumn ?? 0, 0);
    topRow = Math.max(topRow ?? 0, 0);
    bottomRow = Math.max(bottomRow ?? 0, 0);

    if (isMultiple) {
      startColumn = Math.max(startColumn, wtTable.getFirstRenderedColumn());
      endColumn = Math.min(endColumn, wtTable.getLastRenderedColumn());
      topRow = Math.max(topRow, wtTable.getFirstRenderedRow());
      bottomRow = Math.min(bottomRow, wtTable.getLastRenderedRow());

      if (endColumn < startColumn || bottomRow < topRow) {
        return;
      }

    } else {
      const cell = wtTable.getCell(this.#activeOverlaysWot!.createCellCoords(topRow, startColumn));

      if (!isHTMLElement(cell)) {
        return;
      }
    }

    for (let row = topRow; row <= bottomRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        callback(row, column);
      }
    }
  }

  /**
   * The method triggers a callback for each rendered cell including headers.
   *
   * @param {function(number, number): void} callback The callback function to trigger.
   */
  #scanViewportRange(callback: (row: number, column: number) => void) {
    const { wtTable } = this.#activeOverlaysWot!;
    const renderedRowsCount = wtTable.getRenderedRowsCount();
    const renderedColumnsCount = wtTable.getRenderedColumnsCount();

    for (let row = 0; row < renderedRowsCount; row += 1) {
      const sourceRow = wtTable.rowFilter!.renderedToSource(row);

      for (let column = 0; column < renderedColumnsCount; column += 1) {
        callback(sourceRow, wtTable.columnFilter!.renderedToSource(column));
      }
    }
  }
}
