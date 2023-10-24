export default class CellCoords {
  constructor(row: number, column: number, isRtl?: boolean);

  row: number;
  col: number;

  isValid(tableParams: {
    countRows?: number;
    countCols?: number;
    countRowHeaders?: number;
    countColHeaders?: number;
  }): boolean;
  isEqual(cellCoords: CellCoords): boolean;
  isSouthEastOf(testedCoords: any): boolean;
  isNorthWestOf(testedCoords: any): boolean;
  isSouthWestOf(testedCoords: any): boolean;
  isNorthEastOf(testedCoords: any): boolean;
  normalize(): CellCoords;
  clone(): CellCoords;
  toObject(): any;
}
