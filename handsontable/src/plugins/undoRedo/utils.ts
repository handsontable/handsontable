import type { HotInstance } from '../../core/types';
import { rangeEach } from '../../helpers/number';

/**
 * Gets all cell metas from the provided range.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} fromRow The starting row index.
 * @param {number} toRow The ending row index.
 * @param {number} fromColumn The starting column index.
 * @param {number} toColumn The ending column index.
 * @returns {Array} Returns an array of cell metas.
 */
export function getCellMetas(hot: HotInstance, fromRow: number, toRow: number, fromColumn: number, toColumn: number) {
  const cellMetas: unknown[] = [];

  rangeEach(fromColumn, toColumn, (columnIndex) => {
    rangeEach(fromRow, toRow, (rowIndex) => {
      const cellMeta = hot.getCellMeta(rowIndex, columnIndex);

      cellMetas.push([cellMeta.visualRow, cellMeta.visualCol, cellMeta]);
    });
  });

  return cellMetas;
}
