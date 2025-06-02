/**
 * Calculates the total height of the merged cell.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {*} row The merged cell's row index.
 * @param {*} rowspan The merged cell height.
 * @returns {number}
 */
export function sumCellsHeights(hotInstance, row, rowspan) {
  const { rowIndexMapper, stylesHandler } = hotInstance;
  const defaultHeight = stylesHandler.getDefaultRowHeight();
  let height = 0;

  for (let i = row; i < row + rowspan; i++) {
    if (!rowIndexMapper.isHidden(i)) {
      height += hotInstance.getRowHeight(i) ?? defaultHeight;

      if (i === 0 && !stylesHandler.isClassicTheme()) {
        height += 1; // border-top-width
      }
    }
  }

  return height;
}
