import { addClass } from '../../../../helpers/dom/element';

/**
 * @private
 */
export class SelectionScanner {
  #selection;
  #activeOverlaysWot;

  setActiveOverlay(activeOverlaysWot) {
    this.#activeOverlaysWot = activeOverlaysWot;

    return this;
  }

  setActiveSelection(selection) {
    this.#selection = selection;
  }

  scanColumnsInHeadersRange() {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const { highlightOnlyClosestHeader, selectionType } = this.#selection.settings;
    const isFocusType = selectionType === 'focus';
    const headers = [];

    if (topColumn === null || bottomColumn === null) {
      return headers;
    }

    // if (!isFocusType && (topColumn < 0 || bottomColumn < 0)) {
    //   return headers;
    // }

    if (selectionType === 'active-header' && topRow >= 0 && bottomRow >= 0) {
      return headers;
    }

    const { wtTable } = this.#activeOverlaysWot;
    const renderedColumnsCount = wtTable.getRenderedColumnsCount();
    let rowHeadersCount = selectionType === 'header' ? 0 : -wtTable.getRowHeadersCount();
    let cursor = 0;

    for (let column = rowHeadersCount; column < renderedColumnsCount; column++) {
      const sourceColumn = this.#activeOverlaysWot.wtTable.columnFilter.renderedToSource(column);

      if (sourceColumn < topColumn || sourceColumn > bottomColumn) {
        continue;
      }

      let THs = this.#activeOverlaysWot.wtTable.getColumnHeaders(sourceColumn);
      const closestHeaderLevel = THs.length - 1;

      if (highlightOnlyClosestHeader && THs.length > 1) {
        THs = [THs[closestHeaderLevel]];
      }

      for (let headerLevel = 0; headerLevel < THs.length; headerLevel += 1) {
        let TH = THs[headerLevel];

        headerLevel = highlightOnlyClosestHeader ? closestHeaderLevel : headerLevel;

        const newSourceCol = this.#activeOverlaysWot
          .getSetting('onBeforeHighlightingColumnHeader', sourceColumn, headerLevel, {
            selectionType,
            columnCursor: cursor,
            selectionWidth: bottomColumn - topColumn + 1,
          });

        if (newSourceCol === null) {
          continue;
        }

        if (newSourceCol !== sourceColumn) {
          TH = this.#activeOverlaysWot.wtTable.getColumnHeader(newSourceCol, headerLevel);
        }

        if (!isFocusType || isFocusType && topRow < 0 && THs.length + topRow === headerLevel) {
          headers.push(TH);
        }
      }

      cursor += 1;
    }

    return headers;
  }

  scanRowsInHeadersRange() {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const { highlightOnlyClosestHeader, selectionType } = this.#selection.settings;
    const isFocusType = selectionType === 'focus';
    const headers = [];

    if (topRow === null || bottomRow === null) {
      return headers;
    }

    // if (!isFocusType && (topRow < 0 || bottomRow < 0)) {
    //   return headers;
    // }

    if (selectionType === 'header' && (topColumn < 0 || bottomColumn < 0)) {
      return headers;
    }
    if (selectionType === 'active-header' && topColumn >= 0 && bottomColumn >= 0) {
      return headers;
    }

    const { wtTable } = this.#activeOverlaysWot;
    const renderedRowsCount = wtTable.getRenderedRowsCount();
    const columnHeadersCount = selectionType === 'header' ? 0 : -wtTable.getColumnHeadersCount();
    let cursor = 0;

    for (let row = columnHeadersCount; row < renderedRowsCount; row++) {
      const sourceRow = this.#activeOverlaysWot.wtTable.rowFilter.renderedToSource(row);

      if (sourceRow < topRow || sourceRow > bottomRow) {
        continue;
      }

      let THs = this.#activeOverlaysWot.wtTable.getRowHeaders(sourceRow);
      const closestHeaderLevel = THs.length - 1;

      if (highlightOnlyClosestHeader && THs.length > 1) {
        THs = [THs[closestHeaderLevel]];
      }

      for (let headerLevel = 0; headerLevel < THs.length; headerLevel += 1) {
        let TH = THs[headerLevel];

        headerLevel = highlightOnlyClosestHeader ? closestHeaderLevel : headerLevel;

        const newSourceRow = this.#activeOverlaysWot
          .getSetting('onBeforeHighlightingRowHeader', sourceRow, headerLevel, {
            selectionType,
            rowCursor: cursor,
            selectionHeight: bottomRow - topRow + 1,
          });

        if (newSourceRow === null) {
          continue;
        }

        if (newSourceRow !== sourceRow) {
          TH = this.#activeOverlaysWot.wtTable.getRowHeaders(sourceRow, headerLevel);
        }

        if (!isFocusType || isFocusType && topColumn < 0 && THs.length + topColumn === headerLevel) {
          headers.push(TH);
        }
      }

      cursor += 1;
    }

    return headers;
  }

  scanCellsRange() {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const cells = [];

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      if (sourceRow >= topRow && sourceRow <= bottomRow && sourceColumn >= topColumn && sourceColumn <= bottomColumn) {
        const cell = this.#activeOverlaysWot.wtTable
          .getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        // support for old API
        const additionalSelectionClass = this.#activeOverlaysWot
          .getSetting('onAfterDrawSelection', sourceRow, sourceColumn, this.#selection.settings.layerLevel);

        if (typeof additionalSelectionClass === 'string') {
          addClass(cell, additionalSelectionClass);
        }

        cells.push(cell);
      }
    });

    return cells;
  }

  scanRowsInCellsRange() {
    const [topRow,, bottomRow,] = this.#selection.getCorners();
    const cells = [];

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      if (sourceRow >= topRow && sourceRow <= bottomRow) {
        const cell = this.#activeOverlaysWot.wtTable
          .getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        cells.push(cell);
      }
    });

    return cells;
  }

  scanColumnsInCellsRange() {
    const [, topColumn,, bottomColumn] = this.#selection.getCorners();
    const cells = [];

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      if (sourceColumn >= topColumn && sourceColumn <= bottomColumn) {
        const cell = this.#activeOverlaysWot.wtTable
          .getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        cells.push(cell);
      }
    });

    return cells;
  }

  #scanCellsRange(callback) {
    const { wtTable } = this.#activeOverlaysWot;
    const renderedRowsCount = wtTable.getRenderedRowsCount();
    const renderedColumnsCount = wtTable.getRenderedColumnsCount();

    for (let row = 0; row < renderedRowsCount; row += 1) {
      const sourceRow = this.#activeOverlaysWot.wtTable.rowFilter.renderedToSource(row);

      for (let column = 0; column < renderedColumnsCount; column += 1) {
        const sourceColumn = this.#activeOverlaysWot.wtTable.columnFilter.renderedToSource(column);

        callback(sourceRow, sourceColumn);
      }
    }
  }
}
