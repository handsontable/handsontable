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

{
  const isValid: boolean = cellRange.isValid({
    countRows: 10,
    countCols: 20,
    countRowHeaders: 1,
    countColHeaders: 2,
  });
}
{
  const isValid: boolean = cellRange.isValid({});
}
const isSingleCell: boolean = cellRange.isSingleCell();
const isSingleHeader: boolean = cellRange.isSingleHeader();
const isHeader: boolean = cellRange.isHeader();
const containsHeaders: boolean = cellRange.containsHeaders();
const getOuterHeight: number = cellRange.getOuterHeight();
const getOuterWidth: number = cellRange.getOuterWidth();
const getHeight: number = cellRange.getHeight();
const getWidth: number = cellRange.getWidth();
const getCellsCount: number = cellRange.getCellsCount();
const includes: boolean = cellRange.includes(cellCoords);
const includesRange: boolean = cellRange.includesRange(cellRangeRTL);
const isEqual: boolean = cellRange.isEqual(cellRangeRTL);
const overlaps: boolean = cellRange.overlaps(cellRangeRTL);
const isSouthEastOf: boolean = cellRange.isSouthEastOf(cellCoords);
const isNorthWestOf: boolean = cellRange.isNorthWestOf(cellCoords);
const isOverlappingHorizontally: boolean = cellRange.isOverlappingHorizontally(cellRangeRTL);
const isOverlappingVertically: boolean = cellRange.isOverlappingVertically(cellRangeRTL);
const expand: boolean = cellRange.expand(cellCoords);
const expandByRange1: boolean = cellRange.expandByRange(cellRangeRTL, true);
const expandByRange2: boolean = cellRange.expandByRange(cellRangeRTL, false);
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
  const getOppositeCorner: CellCoords = cellRange.getOppositeCorner(cellCoords);
}
const getBordersSharedWith: Array<'top' | 'right' | 'bottom' | 'left'> = cellRange.getBordersSharedWith(cellRangeRTL);
const getInner: CellCoords[] = cellRange.getInner();
const getAll: CellCoords[] = cellRange.getAll();

cellRange.forAll(() => true);

const clone: CellRange = cellRange.clone();
const toObject: { from: { row: number, col: number}, to: { row: number, col: number} } = cellRange.toObject();
