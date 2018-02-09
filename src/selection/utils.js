import {CellRange} from './../3rdparty/walkontable/src';
import {arrayEach, arrayReduce} from './../helpers/array';

const SELECTION_TYPE_ARRAY = 'array';
const SELECTION_TYPE_OBJECT = 'object';
const SELECTION_TYPES = [SELECTION_TYPE_OBJECT, SELECTION_TYPE_ARRAY];

/**
 * Detect data structure, a holder for coordinates for selection functionality.
 *
 * @param {Array[]|CellRange[]} selectionRanges An array of selected ranges. This type of data is produced by
 *                                              `hot.getSelected()` and `hot.getSelectedRange()` methods.
 * @returns {String|undefined} It returns strings: `array` or `object` depends on from what method the selection data is
 *                            provided. If data type is unrecognized than it returns `undefined`.
 */
export function detectSelectionType(selectionRanges) {
  let result;

  if (selectionRanges.length) {
    const firstItem = selectionRanges[0];

    if (Array.isArray(firstItem)) {
      result = SELECTION_TYPE_ARRAY;

    } else if (firstItem instanceof CellRange) {
      result = SELECTION_TYPE_OBJECT;
    }
  }

  return result;
}

/**
 * Factory function designed for normalization data schema from different data structures of the selection ranges.
 *
 * @param {String} type Selection type which will be processed.
 * @returns {Array} Returns normalized data about selected range as an array: `[rowStart, columnStart, rowEnd, columnEnd]`.
 */
export function normalizeSelectionFactory(type) {
  if (!SELECTION_TYPES.includes(type)) {
    throw new Error('Unsupported selection ranges data type was provided.');
  }

  return function(selection) {
    const isObjectType = type === SELECTION_TYPE_OBJECT;
    const rowStart = isObjectType ? selection.from.row : selection[0];
    const columnStart = isObjectType ? selection.from.col : selection[1];
    const rowEnd = isObjectType ? selection.to.row : selection[2];
    const columnEnd = isObjectType ? selection.to.col : selection[3];

    return [
      Math.min(rowStart, rowEnd),
      Math.min(columnStart, columnEnd),
      Math.max(rowStart, rowEnd),
      Math.max(columnStart, columnEnd),
    ];
  };
}

/**
 * Function transform selection ranges (produced by `hot.getSelected()` and `hot.getSelectedRange()`) to normalized
 * data structure. It merges repeated ranges into consecutive coordinates. The returned structure
 * contains an array of arrays. The single item contains at index 0 visual column index from the selection was
 * started and at index 1 distance as a count of selected columns.
 *
 * @param {Array[]|CellRange[]} selectionRanges Selection ranges produced by Handsontable.
 * @return {Array[]} Returns an array of arrays with ranges defines in that schema:
 *                   `[[visualColumnStart, distance], [visualColumnStart, distance], ...]`.
 *                   The column distances are always created starting from the left (zero index) to the
 *                   right (the latest column index).
 */
export function transformSelectionToColumnDistance(selectionRanges) {
  const selectionType = detectSelectionType(selectionRanges);

  if (!selectionType) {
    return [];
  }

  const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType);
  const unorderedIndexes = new Set();

  // Iterate through all ranges and collect all column indexes which are not saved yet.
  arrayEach(selectionRanges, (selection) => {
    const [, columnStart,, columnEnd] = selectionSchemaNormalizer(selection);
    const amount = columnEnd - columnStart + 1;

    arrayEach(Array.from(new Array(amount), (_, i) => columnStart + i), (index) => {
      if (!unorderedIndexes.has(index)) {
        unorderedIndexes.add(index);
      }
    });
  });

  // Sort indexes in ascending order to easily detecting non-consecutive columns.
  const orderedIndexes = Array.from(unorderedIndexes).sort((a, b) => a - b);
  const normalizedColumnRanges = arrayReduce(orderedIndexes, (acc, visualColumnIndex, index, array) => {
    if (index !== 0 && visualColumnIndex === array[index - 1] + 1) {
      acc[acc.length - 1][1]++;

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
 * @param {Array[]|CellRange[]} selectionRanges Selection ranges produced by Handsontable.
 * @return {Array[]} Returns an array of arrays with ranges defines in that schema:
 *                   `[[visualColumnStart, distance], [visualColumnStart, distance], ...]`.
 *                   The column distances are always created starting from the left (zero index) to the
 *                   right (the latest column index).
 */
export function transformSelectionToRowDistance(selectionRanges) {
  const selectionType = detectSelectionType(selectionRanges);

  if (!selectionType) {
    return [];
  }

  const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType);
  const unorderedIndexes = new Set();

  // Iterate through all ranges and collect all column indexes which are not saved yet.
  arrayEach(selectionRanges, (selection) => {
    const [rowStart,, rowEnd] = selectionSchemaNormalizer(selection);
    const amount = rowEnd - rowStart + 1;

    arrayEach(Array.from(new Array(amount), (_, i) => rowStart + i), (index) => {
      if (!unorderedIndexes.has(index)) {
        unorderedIndexes.add(index);
      }
    });
  });

  // Sort indexes in ascending order to easily detecting non-consecutive columns.
  const orderedIndexes = Array.from(unorderedIndexes).sort((a, b) => a - b);
  const normalizedRowRanges = arrayReduce(orderedIndexes, (acc, rowIndex, index, array) => {
    if (index !== 0 && rowIndex === array[index - 1] + 1) {
      acc[acc.length - 1][1]++;

    } else {
      acc.push([rowIndex, 1]);
    }

    return acc;
  }, []);

  return normalizedRowRanges;
}
