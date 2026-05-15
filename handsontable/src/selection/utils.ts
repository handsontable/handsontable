import type { HotInstance } from '../core/types';
import type { default as CellCoords } from '../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';
import { CellRange as CellRangeClass } from './../3rdparty/walkontable/src';
import { arrayEach, arrayReduce } from './../helpers/array';
import { isUndefined } from './../helpers/mixed';
import { throwWithCause } from '../helpers/errors';

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
];
const rootCall = Symbol('root');
const childCall = Symbol('child');

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
export function detectSelectionType(selectionRanges: unknown, _callSymbol = rootCall) {
  if (_callSymbol !== rootCall && _callSymbol !== childCall) {
    throwWithCause('The second argument is used internally only and cannot be overwritten.');
  }

  const isArray = Array.isArray(selectionRanges);
  const isRootCall = _callSymbol === rootCall;
  let result = SELECTION_TYPE_UNRECOGNIZED;

  if (isArray) {
    const firstItem = selectionRanges[0];

    if (selectionRanges.length === 0) {
      result = SELECTION_TYPE_EMPTY;

    } else if (isRootCall && firstItem instanceof CellRangeClass) {
      result = SELECTION_TYPE_OBJECT;

    } else if (isRootCall && Array.isArray(firstItem)) {
      result = detectSelectionType(firstItem, childCall);

    } else if (selectionRanges.length >= 2 && selectionRanges.length <= 4) {
      const isArrayType = !selectionRanges.some((value, index) => !ARRAY_TYPE_PATTERN[index].includes(typeof value));

      if (isArrayType) {
        result = SELECTION_TYPE_ARRAY;
      }
    }
  }

  return result;
}

interface NormalizeOptions {
  createCellCoords: (row: number, col: number) => CellCoords;
  createCellRange: (highlight: CellCoords, from: CellCoords, to: CellCoords) => CellRange;
  keepDirection?: boolean;
  propToCol?: (prop: string | number) => number;
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
}: NormalizeOptions = {} as NormalizeOptions) {
  if (!SELECTION_TYPES.includes(type)) {
    throwWithCause('Unsupported selection ranges schema type was provided.');
  }

  return function(selection: unknown): CellRange {
    const isObjectType = type === SELECTION_TYPE_OBJECT;
    const selArr = selection as [number, number | string, number, number | string];
    let rowStart = isObjectType ? (selection as CellRange).from.row : selArr[0];
    let columnStart = isObjectType ? (selection as CellRange).from.col : selArr[1];
    let rowEnd = isObjectType ? (selection as CellRange).to.row : selArr[2];
    let columnEnd = isObjectType ? (selection as CellRange).to.col : selArr[3];

    if (typeof propToCol === 'function') {
      if (typeof columnStart === 'string') {
        columnStart = propToCol(columnStart);
      }
      if (typeof columnEnd === 'string') {
        columnEnd = propToCol(columnEnd);
      }
    }

    if (isUndefined(rowEnd)) {
      rowEnd = rowStart;
    }
    if (isUndefined(columnEnd)) {
      columnEnd = columnStart;
    }

    // At this point columnStart/columnEnd are guaranteed numbers (strings were converted by propToCol above).
    let colStart = columnStart as number;
    let colEnd = columnEnd as number;

    if (!keepDirection) {
      const origRowStart = rowStart;
      const origRowEnd = rowEnd;
      const origColStart = colStart;
      const origColEnd = colEnd;

      rowStart = Math.min(origRowStart, origRowEnd);
      colStart = Math.min(origColStart, origColEnd);
      rowEnd = Math.max(origRowStart, origRowEnd);
      colEnd = Math.max(origColStart, origColEnd);
    }

    const highlight = isObjectType ? (selection as CellRange).highlight.clone() : createCellCoords(rowStart, colStart);
    const from = createCellCoords(rowStart, colStart);
    const to = createCellCoords(rowEnd, colEnd);

    return createCellRange(highlight, from, to);
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
export function transformSelectionToColumnDistance(hotInstance: HotInstance) {
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
    const { from, to } = selectionSchemaNormalizer(selection);
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
  const normalizedColumnRanges = arrayReduce(orderedIndexes, (acc: number[][], visualColumnIndex, index, array) => {
    if (index !== 0 && visualColumnIndex === array[index - 1] + 1) {
      acc[acc.length - 1][1] += 1;

    } else {
      acc.push([visualColumnIndex, 1]);
    }

    return acc;
  }, []);

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
export function transformSelectionToRowDistance(hotInstance: HotInstance) {
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
    const { from, to } = selectionSchemaNormalizer(selection);
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
  const normalizedRowRanges = arrayReduce(orderedIndexes, (acc: number[][], rowIndex, index, array) => {
    if (index !== 0 && rowIndex === array[index - 1] + 1) {
      acc[acc.length - 1][1] += 1;

    } else {
      acc.push([rowIndex, 1]);
    }

    return acc;
  }, []);

  return normalizedRowRanges;
}
