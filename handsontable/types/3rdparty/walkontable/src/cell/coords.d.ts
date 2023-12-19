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
  isRtl(): boolean;
  isEqual(cellCoords: CellCoords): boolean;
  isSouthEastOf(testedCoords: CellCoords): boolean;
  isNorthWestOf(testedCoords: CellCoords): boolean;
  isSouthWestOf(testedCoords: CellCoords): boolean;
  isNorthEastOf(testedCoords: CellCoords): boolean;
  normalize(): CellCoords;
  assign(coords: CellCoords | { row?: number, col?: number }): CellCoords;
  clone(): CellCoords;
  toObject(): { row: number, col: number };
}
