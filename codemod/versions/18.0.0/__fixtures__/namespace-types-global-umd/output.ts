// The Handsontable global comes from a script tag, so this file is not a module.
declare const hot: Handsontable;

// TODO(handsontable-codemod 18.0.0/ns-core-types): Import CellCoords from "handsontable" and use it instead. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
let corner: Handsontable.CellCoords | undefined;

// TODO(handsontable-codemod 18.0.0/ns-core-types): Import CellCoords from "handsontable" and use it instead. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
function select(coords: Handsontable.CellCoords): void {
  hot.selectCell(coords.row, coords.col);
}
