import CellCoords from './coords';

export default class CellRange {
  constructor(highlight: CellCoords, from?: CellCoords, to?: CellCoords);

  highlight: CellCoords;
  from: CellCoords;
  to: CellCoords;

  setHighlight(coords: CellCoords): CellRange;
  setFrom(coords: CellCoords): CellRange;
  setTo(coords: CellCoords): CellRange;
  isValid(wot: any): boolean;
  isSingle(): boolean;
  getOuterHeight(): number;
  getOuterWidth(): number;
  getHeight(): number;
  getWidth(): number;
  includes(cellCoords: CellCoords): boolean;
  includesRange(cellRange: CellRange): boolean;
  isEqual(cellRange: CellRange): boolean;
  overlaps(cellRange: CellRange): boolean;
  isSouthEastOf(cellRange: CellRange): boolean;
  isNorthWestOf(cellRange: CellRange): boolean;
  isOverlappingHorizontally(cellRange: CellRange): boolean;
  isOverlappingVertically(cellRange: CellRange): boolean;
  expand(cellCoords: CellCoords): boolean;
  expandByRange(expandingRange: CellRange): boolean;
  getDirection(): string;
  setDirection(direction: string): void;
  getVerticalDirection(): string;
  getHorizontalDirection(): string;
  flipDirectionVertically(): void;
  flipDirectionHorizontally(): void;
  getTopStartCorner(): CellCoords;
  getTopEndCorner(): CellCoords;
  getBottomStartCorner(): CellCoords;
  getBottomEndCorner(): CellCoords;
  getTopLeftCorner(): CellCoords;
  getTopRightCorner(): CellCoords;
  getBottomLeftCorner(): CellCoords;
  getBottomRightCorner(): CellCoords;
  getOuterTopStartCorner(): CellCoords;
  getOuterTopEndCorner(): CellCoords;
  getOuterTopLeftCorner(): CellCoords;
  getOuterTopRightCorner(): CellCoords;
  getOuterBottomStartCorner(): CellCoords;
  getOuterBottomEndCorner(): CellCoords;
  getOuterBottomLeftCorner(): CellCoords;
  getOuterBottomRightCorner(): CellCoords;
  isCorner(coords: CellCoords, expandedRange?: CellRange): boolean;
  getOppositeCorner(coords: CellCoords, expandedRange?: CellRange): CellCoords;
  getBordersSharedWith(range: CellRange): any[];
  getInner(): any[];
  getAll(): any[];
  forAll(callback: (row: number, column: number) => boolean): void;
  clone(): CellRange;
  toObject(): any;
}
