// The Handsontable global comes from a script tag, so this file is not a module.
declare const hot: Handsontable;

let corner: Handsontable.CellCoords | undefined;

function select(coords: Handsontable.CellCoords): void {
  hot.selectCell(coords.row, coords.col);
}
