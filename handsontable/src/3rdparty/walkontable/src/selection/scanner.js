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
    const headers = new Set();

    // TODO: remove this
    if (topColumn === null || bottomColumn === null) {
      return headers;
    }

    const { wtTable } = this.#activeOverlaysWot;
    const renderedColumnsCount = wtTable.getRenderedColumnsCount();
    const columnHeadersCount = wtTable.getColumnHeadersCount();
    let cursor = 0;

    for (let column = -wtTable.getRowHeadersCount(); column < renderedColumnsCount; column++) {
      const sourceColumn = wtTable.columnFilter.renderedToSource(column);

      if (sourceColumn < topColumn || sourceColumn > bottomColumn) {
        continue;
      }

      for (let headerLevel = -columnHeadersCount; headerLevel < 0; headerLevel++) {
        if (headerLevel < topRow || headerLevel > bottomRow) {
          continue;
        }

        const positiveBasedHeaderLevel = headerLevel + columnHeadersCount;
        let TH = wtTable.getColumnHeader(sourceColumn, positiveBasedHeaderLevel);
        const newSourceCol = this.#activeOverlaysWot
          .getSetting('onBeforeHighlightingColumnHeader', sourceColumn, positiveBasedHeaderLevel, {
            selectionType: this.#selection.settings.selectionType,
            columnCursor: cursor,
            selectionWidth: bottomColumn - topColumn + 1,
          });

        if (newSourceCol === null) {
          continue;
        }

        if (newSourceCol !== sourceColumn) {
          TH = wtTable.getColumnHeader(newSourceCol, positiveBasedHeaderLevel);
        }

        headers.add(TH);
      }

      cursor += 1;
    }

    return headers;
  }

  scanRowsInHeadersRange() {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const headers = new Set();

    // TODO: remove this
    if (topRow === null || bottomRow === null) {
      return headers;
    }

    const { wtTable } = this.#activeOverlaysWot;
    const renderedRowsCount = wtTable.getRenderedRowsCount();
    const rowHeadersCount = wtTable.getRowHeadersCount();
    let cursor = 0;

    for (let row = -wtTable.getColumnHeadersCount(); row < renderedRowsCount; row++) {
      const sourceRow = wtTable.rowFilter.renderedToSource(row);

      if (sourceRow < topRow || sourceRow > bottomRow) {
        continue;
      }

      for (let headerLevel = -rowHeadersCount; headerLevel < 0; headerLevel++) {
        if (headerLevel < topColumn || headerLevel > bottomColumn) {
          continue;
        }

        const positiveBasedHeaderLevel = headerLevel + rowHeadersCount;
        let TH = wtTable.getRowHeader(sourceRow, positiveBasedHeaderLevel);
        const newSourceRow = this.#activeOverlaysWot
          .getSetting('onBeforeHighlightingRowHeader', sourceRow, positiveBasedHeaderLevel, {
            selectionType: this.#selection.settings.selectionType,
            rowCursor: cursor,
            selectionHeight: bottomRow - topRow + 1,
          });

        if (newSourceRow === null) {
          continue;
        }

        if (newSourceRow !== sourceRow) {
          TH = wtTable.getRowHeader(newSourceRow, positiveBasedHeaderLevel);
        }

        headers.add(TH);
      }

      cursor += 1;
    }

    return headers;
  }

  scanCellsRange() {
    const [topRow, topColumn, bottomRow, bottomColumn] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const cells = new Set();

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      if (sourceRow >= topRow && sourceRow <= bottomRow && sourceColumn >= topColumn && sourceColumn <= bottomColumn) {
        const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        // support for old API
        const additionalSelectionClass = this.#activeOverlaysWot
          .getSetting('onAfterDrawSelection', sourceRow, sourceColumn, this.#selection.settings.layerLevel);

        if (typeof additionalSelectionClass === 'string') {
          addClass(cell, additionalSelectionClass);
        }

        cells.add(cell);
      }
    });

    return cells;
  }

  scanRowsInCellsRange() {
    const [topRow,, bottomRow,] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const cells = new Set();

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      if (sourceRow >= topRow && sourceRow <= bottomRow) {
        const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        cells.add(cell);
      }
    });

    return cells;
  }

  scanColumnsInCellsRange() {
    const [, topColumn,, bottomColumn] = this.#selection.getCorners();
    const { wtTable } = this.#activeOverlaysWot;
    const cells = new Set();

    this.#scanCellsRange((sourceRow, sourceColumn) => {
      if (sourceColumn >= topColumn && sourceColumn <= bottomColumn) {
        const cell = wtTable.getCell(this.#activeOverlaysWot.createCellCoords(sourceRow, sourceColumn));

        cells.add(cell);
      }
    });

    return cells;
  }

  #scanCellsRange(callback) {
    const { wtTable } = this.#activeOverlaysWot;
    const renderedRowsCount = wtTable.getRenderedRowsCount();
    const renderedColumnsCount = wtTable.getRenderedColumnsCount();

    for (let row = 0; row < renderedRowsCount; row += 1) {
      const sourceRow = wtTable.rowFilter.renderedToSource(row);

      for (let column = 0; column < renderedColumnsCount; column += 1) {
        callback(sourceRow, wtTable.columnFilter.renderedToSource(column));
      }
    }
  }
}
