import CellCoords from './coords';

type DirectionType = 'NW-SE' | 'NE-SW' | 'SE-NW' | 'SW-NE';

export default class CellRange {
  constructor(highlight: CellCoords, from?: CellCoords, to?: CellCoords, isRtl?: boolean);

  highlight: CellCoords;
  from: CellCoords;
  to: CellCoords;

  setHighlight(coords: CellCoords): CellRange;
  setFrom(coords: CellCoords): CellRange;
  setTo(coords: CellCoords): CellRange;
  isValid(tableParams: {
    countRows?: number;
    countCols?: number;
    countRowHeaders?: number;
    countColHeaders?: number;
  }): boolean;
  isSingleCell(): boolean;
  isSingleHeader(): boolean;
  isHeader(): boolean;
  containsHeaders(): boolean;
  getOuterHeight(): number;
  getOuterWidth(): number;
  getHeight(): number;
  getWidth(): number;
  getCellsCount(): number;
  includes(cellCoords: CellCoords): boolean;
  includesRange(cellRange: CellRange): boolean;
  isEqual(cellRange: CellRange): boolean;
  overlaps(cellRange: CellRange): boolean;
  isSouthEastOf(coords: CellCoords): boolean;
  isNorthWestOf(coords: CellCoords): boolean;
  isOverlappingHorizontally(cellRange: CellRange): boolean;
  isOverlappingVertically(cellRange: CellRange): boolean;
  expand(cellCoords: CellCoords): boolean;
  expandByRange(expandingRange: CellRange, changeDirection: boolean): boolean;
  getDirection(): DirectionType;
  setDirection(direction: DirectionType): void;
  getVerticalDirection(): 'N-S' | 'S-N';
  getHorizontalDirection(): 'W-E' | 'E-W';
  flipDirectionVertically(): void;
  flipDirectionHorizontally(): void;
  getTopStartCorner(): CellCoords;
  getTopLeftCorner(): CellCoords;
  getBottomEndCorner(): CellCoords;
  getBottomRightCorner(): CellCoords;
  getTopEndCorner(): CellCoords;
  getTopRightCorner(): CellCoords;
  getBottomStartCorner(): CellCoords;
  getBottomLeftCorner(): CellCoords;
  getOuterTopStartCorner(): CellCoords;
  getOuterTopLeftCorner(): CellCoords;
  getOuterBottomEndCorner(): CellCoords;
  getOuterBottomRightCorner(): CellCoords;
  getOuterTopEndCorner(): CellCoords;
  getOuterTopRightCorner(): CellCoords;
  getOuterBottomStartCorner(): CellCoords;
  getOuterBottomLeftCorner(): CellCoords;
  isCorner(coords: CellCoords): boolean;
  getOppositeCorner(coords: CellCoords): CellCoords;
  getBordersSharedWith(range: CellRange): Array<'top' | 'right' | 'bottom' | 'left'>;
  getInner(): CellCoords[];
  getAll(): CellCoords[];
  forAll(callback: (row: number, column: number) => boolean): void;
  clone(): CellRange;
  toObject(): { from: { row: number, col: number }, to: { row: number, col: number } };
}
