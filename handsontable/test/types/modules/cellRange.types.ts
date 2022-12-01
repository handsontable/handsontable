import {
  CellCoords,
  CellRange,
} from 'handsontable/base';

const cellCoords = new CellCoords(1, 2);
const cellRange = new CellRange(cellCoords);
const cellRange1 = new CellRange(cellCoords, cellCoords, cellCoords, true);
const cellRangeRTL = new CellRange(cellCoords, cellCoords, cellCoords, true);

{
  const thisCellRange: CellRange = cellRange.setHighlight(cellCoords);
}
{
  const thisCellRange: CellRange = cellRange.setFrom(cellCoords);
}
{
  const thisCellRange: CellRange = cellRange.setTo(cellCoords);
}

const isSingle: boolean = cellRange.isSingle();
const getOuterHeight: number = cellRange.getOuterHeight();
const getOuterWidth: number = cellRange.getOuterWidth();
const getHeight: number = cellRange.getHeight();
const getWidth: number = cellRange.getWidth();
const getCellsCount: number = cellRange.getCellsCount();
const includes: boolean = cellRange.includes(cellCoords);
const includesRange: boolean = cellRange.includesRange(cellRangeRTL);
const isEqual: boolean = cellRange.isEqual(cellRangeRTL);
const overlaps: boolean = cellRange.overlaps(cellRangeRTL);
const isSouthEastOf: boolean = cellRange.isSouthEastOf(cellRangeRTL);
const isNorthWestOf: boolean = cellRange.isNorthWestOf(cellRangeRTL);
const isOverlappingHorizontally: boolean = cellRange.isOverlappingHorizontally(cellRangeRTL);
const isOverlappingVertically: boolean = cellRange.isOverlappingVertically(cellRangeRTL);
const expand: boolean = cellRange.expand(cellCoords);
const expandByRange: boolean = cellRange.expandByRange(cellRangeRTL);
const getDirection: 'NW-SE' | 'NE-SW' | 'SE-NW' | 'SW-NE' = cellRange.getDirection();

cellRange.setDirection('NE-SW');

const getVerticalDirection: 'N-S' | 'S-N' = cellRange.getVerticalDirection();
const getHorizontalDirection: 'W-E' | 'E-W' = cellRange.getHorizontalDirection();

cellRange.flipDirectionVertically();
cellRange.flipDirectionHorizontally();

const getTopStartCorner: CellCoords = cellRange.getTopStartCorner();
const getTopLeftCorner: CellCoords = cellRange.getTopLeftCorner();
const getBottomEndCorner: CellCoords = cellRange.getBottomEndCorner();
const getBottomRightCorner: CellCoords = cellRange.getBottomRightCorner();
const getTopEndCorner: CellCoords = cellRange.getTopEndCorner();
const getTopRightCorner: CellCoords = cellRange.getTopRightCorner();
const getBottomStartCorner: CellCoords = cellRange.getBottomStartCorner();
const getBottomLeftCorner: CellCoords = cellRange.getBottomLeftCorner();
const getOuterTopStartCorner: CellCoords = cellRange.getOuterTopStartCorner();
const getOuterTopLeftCorner: CellCoords = cellRange.getOuterTopLeftCorner();
const getOuterBottomEndCorner: CellCoords = cellRange.getOuterBottomEndCorner();
const getOuterBottomRightCorner: CellCoords = cellRange.getOuterBottomRightCorner();
const getOuterTopEndCorner: CellCoords = cellRange.getOuterTopEndCorner();
const getOuterTopRightCorner: CellCoords = cellRange.getOuterTopRightCorner();
const getOuterBottomStartCorner: CellCoords = cellRange.getOuterBottomStartCorner();
const getOuterBottomLeftCorner: CellCoords = cellRange.getOuterBottomLeftCorner();
{
  const isCorner: boolean = cellRange.isCorner(cellCoords);
}
{
  const isCorner: boolean = cellRange.isCorner(cellCoords, cellRangeRTL);
}
{
  const getOppositeCorner: CellCoords = cellRange.getOppositeCorner(cellCoords);
}
{
  const getOppositeCorner: CellCoords = cellRange.getOppositeCorner(cellCoords, cellRangeRTL);
}
const getBordersSharedWith: Array<'top' | 'right' | 'bottom' | 'left'> = cellRange.getBordersSharedWith(cellRangeRTL);
const getInner: CellCoords[] = cellRange.getInner();
const getAll: CellCoords[] = cellRange.getAll();

cellRange.forAll(() => true);

const clone: CellRange = cellRange.clone();
const toObject: { from: { row: number, col: number}, to: { row: number, col: number} } = cellRange.toObject();
