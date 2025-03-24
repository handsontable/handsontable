import { CellRange } from './../3rdparty/walkontable/src';
import { arrayEach, arrayReduce } from './../helpers/array';
import { isUndefined } from './../helpers/mixed';
import { CellCoords } from '../3rdparty/walkontable/src/selection/interfaces';

export const SELECTION_TYPE_UNRECOGNIZED = 0;
export const SELECTION_TYPE_EMPTY = 1;
export const SELECTION_TYPE_ARRAY = 2;
export const SELECTION_TYPE_OBJECT = 3;
export const SELECTION_TYPES = [
  SELECTION_TYPE_OBJECT,
  SELECTION_TYPE_ARRAY,
];
const ARRAY_TYPE_PATTERN = [
  ['number'],
  ['number', 'string'],
  ['number', 'undefined'],
  ['number', 'string', 'undefined']
] as const;
const rootCall = Symbol('root');
const childCall = Symbol('child');

// Define interface for Hot instance
interface HotInstance {
  getSelected(): any[];
  _createCellCoords: (row: number, col: number) => CellCoords;
  _createCellRange: (from: CellCoords, from2: CellCoords, to: CellCoords) => CellRange;
}

// Define interface for normalization options
interface NormalizationOptions {
  createCellCoords: (row: number, column: number) => CellCoords;
  createCellRange: (from: CellCoords, from2: CellCoords, to: CellCoords) => CellRange;
  keepDirection?: boolean;
  propToCol?: (prop: string) => number;
}

// Define type for selection schema
type SelectionSchema = any;

/**
 * Detect selection schema structure.
 *
 * @param {*} selectionRanges The selected range or and array of selected ranges. This type of data is produced by
 * `hot.getSelected()`, `hot.getSelectedLast()`, `hot.getSelectedRange()`
 * and `hot.getSelectedRangeLast()` methods.
 * @param {symbol} _callSymbol The symbol object which indicates source of the helper invocation.
 * @returns {number} Returns a number that specifies the type of detected selection schema. If selection schema type
 * is unrecognized than it returns `0`.
 */
export function detectSelectionType(selectionRanges: any, _callSymbol: symbol = rootCall): number {
  if (_callSymbol !== rootCall && _callSymbol !== childCall) {
    throw new Error('The second argument is used internally only and cannot be overwritten.');
  }

  const isArray = Array.isArray(selectionRanges);
  const isRootCall = _callSymbol === rootCall;
  let result = SELECTION_TYPE_UNRECOGNIZED;

  if (isArray) {
    const firstItem = selectionRanges[0];

    if (selectionRanges.length === 0) {
      result = SELECTION_TYPE_EMPTY;

    } else if (isRootCall && firstItem instanceof CellRange) {
      result = SELECTION_TYPE_OBJECT;

    } else if (isRootCall && Array.isArray(firstItem)) {
      result = detectSelectionType(firstItem, childCall);

    } else if (selectionRanges.length >= 2 && selectionRanges.length <= 4) {
      const isArrayType = !selectionRanges.some((value: any, index: number) => {
        const valueType = typeof value;
        return !ARRAY_TYPE_PATTERN[index].includes(valueType as any);
      });

      if (isArrayType) {
        result = SELECTION_TYPE_ARRAY;
      }
    }
  }

  return result;
}

/**
 * Factory function designed for normalization data schema from different data structures of the selection ranges.
 *
 * @param {number} type Selection type which will be processed.
 * @param {object} options The normalization options.
 * @param {function(number, number): CellCoords} options.createCellCoords The factory function that returns an instance of the `CellCoords` class.
 * @param {function(CellCoords, CellCoords, CellCoords): CellRange} options.createCellRange The factory function that returns an instance of the `CellRange` class.
 * @param {boolean} [options.keepDirection=false] If `true`, the coordinates which contain the direction of the
 *                                                selected cells won't be changed. Otherwise, the selection will be
 *                                                normalized to values starting from top-left to bottom-right.
 * @param {Function} [options.propToCol] Pass the converting function (usually `datamap.propToCol`) if the column
 *                                       defined as props should be normalized to the numeric values.
 * @returns {number[]} Returns normalized data about selected range as an array (`[rowStart, columnStart, rowEnd, columnEnd]`).
 */
export function normalizeSelectionFactory(type: number, {
  createCellCoords,
  createCellRange,
  keepDirection = false,
  propToCol,
}: NormalizationOptions = {} as NormalizationOptions): (selection: SelectionSchema) => CellRange {
  if (!SELECTION_TYPES.includes(type)) {
    throw new Error('Unsupported selection ranges schema type was provided.');
  }

  return function(selection: SelectionSchema): CellRange {
    const isObjectType = type === SELECTION_TYPE_OBJECT;
    let rowStart: number;
    let columnStart: number | string;
    let rowEnd: number;
    let columnEnd: number | string;
    
    if (isObjectType && selection instanceof CellRange) {
      rowStart = selection.from?.row ?? 0;
      columnStart = selection.from?.col ?? 0;
      rowEnd = selection.to?.row ?? 0;
      columnEnd = selection.to?.col ?? 0;
    } else if (Array.isArray(selection)) {
      rowStart = selection[0] as number;
      columnStart = selection[1] as number | string;
      rowEnd = selection[2] as number | undefined || rowStart;
      columnEnd = selection[3] as number | string | undefined || columnStart;
    } else {
      throw new Error('Invalid selection type provided');
    }

    if (typeof propToCol === 'function') {
      if (typeof columnStart === 'string') {
        columnStart = propToCol(columnStart);
      }
      if (typeof columnEnd === 'string') {
        columnEnd = propToCol(columnEnd);
      }
    }

    if (!keepDirection) {
      const origRowStart = rowStart;
      const origColumnStart = columnStart as number;
      const origRowEnd = rowEnd;
      const origColumnEnd = columnEnd as number;

      rowStart = Math.min(origRowStart, origRowEnd);
      columnStart = Math.min(origColumnStart, origColumnEnd);
      rowEnd = Math.max(origRowStart, origRowEnd);
      columnEnd = Math.max(origColumnStart, origColumnEnd);
    }

    const from = createCellCoords(rowStart, columnStart as number);
    const to = createCellCoords(rowEnd, columnEnd as number);

    return createCellRange(from, from, to);
  };
}

/**
 * Function transform selection ranges (produced by `hot.getSelected()` and `hot.getSelectedRange()`) to normalized
 * data structure. It merges repeated ranges into consecutive coordinates. The returned structure
 * contains an array of arrays. The single item contains at index 0 visual column index from the selection was
 * started and at index 1 distance as a count of selected columns.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {Array[]} Returns an array of arrays with ranges defines in that schema:
 *                   `[[visualColumnStart, distance], [visualColumnStart, distance], ...]`.
 *                   The column distances are always created starting from the left (zero index) to the
 *                   right (the latest column index).
 */
export function transformSelectionToColumnDistance(hotInstance: HotInstance): Array<[number, number]> {
  const selectionType = detectSelectionType(hotInstance.getSelected());

  if (selectionType === SELECTION_TYPE_UNRECOGNIZED || selectionType === SELECTION_TYPE_EMPTY) {
    return [];
  }

  const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType, {
    createCellCoords: hotInstance._createCellCoords.bind(hotInstance),
    createCellRange: hotInstance._createCellRange.bind(hotInstance),
  });
  const unorderedIndexes = new Set<number>();

  // Iterate through all ranges and collect all column indexes which are not saved yet.
  arrayEach(hotInstance.getSelected(), (selection) => {
    const result = selectionSchemaNormalizer(selection);
    // The CellRange has from and to properties that should be valid at this point
    const from = (result as any).from;
    const to = (result as any).to;
    const columnNonHeaderStart = Math.max(from.col, 0);
    const amount = to.col - columnNonHeaderStart + 1;

    arrayEach(Array.from(new Array(amount), (_, i) => columnNonHeaderStart + i), (index) => {
      if (!unorderedIndexes.has(index)) {
        unorderedIndexes.add(index);
      }
    });
  });

  // Sort indexes in ascending order to easily detecting non-consecutive columns.
  const orderedIndexes = Array.from(unorderedIndexes).sort((a, b) => a - b);
  const normalizedColumnRanges = arrayReduce(orderedIndexes, (acc: Array<[number, number]>, visualColumnIndex, index, array) => {
    if (index !== 0 && visualColumnIndex === array[index - 1] + 1) {
      acc[acc.length - 1][1] += 1;

    } else {
      acc.push([visualColumnIndex, 1]);
    }

    return acc;
  }, [] as Array<[number, number]>);

  return normalizedColumnRanges;
}

/**
 * Function transform selection ranges (produced by `hot.getSelected()` and `hot.getSelectedRange()`) to normalized
 * data structure. It merges repeated ranges into consecutive coordinates. The returned structure
 * contains an array of arrays. The single item contains at index 0 visual column index from the selection was
 * started and at index 1 distance as a count of selected columns.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {Array[]} Returns an array of arrays with ranges defines in that schema:
 *                   `[[visualColumnStart, distance], [visualColumnStart, distance], ...]`.
 *                   The column distances are always created starting from the left (zero index) to the
 *                   right (the latest column index).
 */
export function transformSelectionToRowDistance(hotInstance: HotInstance): Array<[number, number]> {
  const selectionType = detectSelectionType(hotInstance.getSelected());

  if (selectionType === SELECTION_TYPE_UNRECOGNIZED || selectionType === SELECTION_TYPE_EMPTY) {
    return [];
  }

  const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType, {
    createCellCoords: hotInstance._createCellCoords.bind(hotInstance),
    createCellRange: hotInstance._createCellRange.bind(hotInstance),
  });
  const unorderedIndexes = new Set<number>();

  // Iterate through all ranges and collect all column indexes which are not saved yet.
  arrayEach(hotInstance.getSelected(), (selection) => {
    const result = selectionSchemaNormalizer(selection);
    // The CellRange has from and to properties that should be valid at this point
    const from = (result as any).from;
    const to = (result as any).to;
    const rowNonHeaderStart = Math.max(from.row, 0);
    const amount = to.row - rowNonHeaderStart + 1;

    arrayEach(Array.from(new Array(amount), (_, i) => rowNonHeaderStart + i), (index) => {
      if (!unorderedIndexes.has(index)) {
        unorderedIndexes.add(index);
      }
    });
  });

  // Sort indexes in ascending order to easily detecting non-consecutive columns.
  const orderedIndexes = Array.from(unorderedIndexes).sort((a, b) => a - b);
  const normalizedRowRanges = arrayReduce(orderedIndexes, (acc: Array<[number, number]>, rowIndex, index, array) => {
    if (index !== 0 && rowIndex === array[index - 1] + 1) {
      acc[acc.length - 1][1] += 1;

    } else {
      acc.push([rowIndex, 1]);
    }

    return acc;
  }, [] as Array<[number, number]>);

  return normalizedRowRanges;
}
