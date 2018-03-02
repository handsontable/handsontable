/**
 * Apply the `colspan`/`rowspan` properties.
 *
 * @param {HTMLElement} TD The soon-to-be-modified cell.
 * @param {MergedCellCoords} merged cellInfo The merged cell in question.
 * @param {Number} row Row index.
 * @param {Number} col Column index.
 */
// eslint-disable-next-line import/prefer-default-export
export function applySpanProperties(TD, mergedCellInfo, row, col) {
  if (mergedCellInfo) {
    if (mergedCellInfo.row === row && mergedCellInfo.col === col) {
      TD.setAttribute('rowspan', mergedCellInfo.rowspan.toString());
      TD.setAttribute('colspan', mergedCellInfo.colspan.toString());

    } else {
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');

      TD.style.display = 'none';
    }

  } else {
    TD.removeAttribute('rowspan');
    TD.removeAttribute('colspan');

    TD.style.display = '';
  }
}

