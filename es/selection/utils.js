var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

import { CellRange } from './../3rdparty/walkontable/src';
import { arrayEach, arrayReduce } from './../helpers/array';
import { isUndefined } from './../helpers/mixed';

export var SELECTION_TYPE_UNRECOGNIZED = 0;
export var SELECTION_TYPE_EMPTY = 1;
export var SELECTION_TYPE_ARRAY = 2;
export var SELECTION_TYPE_OBJECT = 3;
export var SELECTION_TYPES = [SELECTION_TYPE_OBJECT, SELECTION_TYPE_ARRAY];
var ARRAY_TYPE_PATTERN = [['number'], ['number', 'string'], ['number', 'undefined'], ['number', 'string', 'undefined']];
var rootCall = Symbol('root');
var childCall = Symbol('child');

/**
 * Detect selection schema structure.
 *
 * @param {*} selectionRanges The selected range or and array of selected ranges. This type of data is produced by
 *                            `hot.getSelected()`, `hot.getSelectedLast()`, `hot.getSelectedRange()`
 *                            and `hot.getSelectedRangeLast()` methods.
 * @returns {Number} Returns a number that specifies the type of detected selection schema. If selection schema type
 *                   is unrecognized than it returns `0`.
 */
export function detectSelectionType(selectionRanges) {
  var _callSymbol = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : rootCall;

  if (_callSymbol !== rootCall && _callSymbol !== childCall) {
    throw new Error('The second argument is used internally only and cannot be overwritten.');
  }

  var isArray = Array.isArray(selectionRanges);
  var isRootCall = _callSymbol === rootCall;
  var result = SELECTION_TYPE_UNRECOGNIZED;

  if (isArray) {
    var firstItem = selectionRanges[0];

    if (selectionRanges.length === 0) {
      result = SELECTION_TYPE_EMPTY;
    } else if (isRootCall && firstItem instanceof CellRange) {
      result = SELECTION_TYPE_OBJECT;
    } else if (isRootCall && Array.isArray(firstItem)) {
      result = detectSelectionType(firstItem, childCall);
    } else if (selectionRanges.length >= 2 && selectionRanges.length <= 4) {
      var isArrayType = !selectionRanges.some(function (value, index) {
        return !ARRAY_TYPE_PATTERN[index].includes(typeof value === 'undefined' ? 'undefined' : _typeof(value));
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
 * @param {String} type Selection type which will be processed.
 * @param {Object} [options]
 * @param {Boolean} [options.keepDirection=false] If `true`, the coordinates which contain the direction of the
 *                                                selected cells won't be changed. Otherwise, the selection will be
 *                                                normalized to values starting from top-left to bottom-right.
 * @param {Function} [options.propToCol] Pass the converting function (usually `datamap.propToCol`) if the column
 *                                       defined as props should be normalized to the numeric values.
 * @returns {Number[]} Returns normalized data about selected range as an array (`[rowStart, columnStart, rowEnd, columnEnd]`).
 */
export function normalizeSelectionFactory(type) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$keepDirection = _ref.keepDirection,
      keepDirection = _ref$keepDirection === undefined ? false : _ref$keepDirection,
      propToCol = _ref.propToCol;

  if (!SELECTION_TYPES.includes(type)) {
    throw new Error('Unsupported selection ranges schema type was provided.');
  }

  return function (selection) {
    var isObjectType = type === SELECTION_TYPE_OBJECT;
    var rowStart = isObjectType ? selection.from.row : selection[0];
    var columnStart = isObjectType ? selection.from.col : selection[1];
    var rowEnd = isObjectType ? selection.to.row : selection[2];
    var columnEnd = isObjectType ? selection.to.col : selection[3];

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

    if (!keepDirection) {
      var origRowStart = rowStart;
      var origColumnStart = columnStart;
      var origRowEnd = rowEnd;
      var origColumnEnd = columnEnd;

      rowStart = Math.min(origRowStart, origRowEnd);
      columnStart = Math.min(origColumnStart, origColumnEnd);
      rowEnd = Math.max(origRowStart, origRowEnd);
      columnEnd = Math.max(origColumnStart, origColumnEnd);
    }

    return [rowStart, columnStart, rowEnd, columnEnd];
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
  var selectionType = detectSelectionType(selectionRanges);

  if (selectionType === SELECTION_TYPE_UNRECOGNIZED || selectionType === SELECTION_TYPE_EMPTY) {
    return [];
  }

  var selectionSchemaNormalizer = normalizeSelectionFactory(selectionType);
  var unorderedIndexes = new Set();

  // Iterate through all ranges and collect all column indexes which are not saved yet.
  arrayEach(selectionRanges, function (selection) {
    var _selectionSchemaNorma = selectionSchemaNormalizer(selection),
        _selectionSchemaNorma2 = _slicedToArray(_selectionSchemaNorma, 4),
        columnStart = _selectionSchemaNorma2[1],
        columnEnd = _selectionSchemaNorma2[3];

    var amount = columnEnd - columnStart + 1;

    arrayEach(Array.from(new Array(amount), function (_, i) {
      return columnStart + i;
    }), function (index) {
      if (!unorderedIndexes.has(index)) {
        unorderedIndexes.add(index);
      }
    });
  });

  // Sort indexes in ascending order to easily detecting non-consecutive columns.
  var orderedIndexes = Array.from(unorderedIndexes).sort(function (a, b) {
    return a - b;
  });
  var normalizedColumnRanges = arrayReduce(orderedIndexes, function (acc, visualColumnIndex, index, array) {
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
 * @param {Array[]|CellRange[]} selectionRanges Selection ranges produced by Handsontable.
 * @return {Array[]} Returns an array of arrays with ranges defines in that schema:
 *                   `[[visualColumnStart, distance], [visualColumnStart, distance], ...]`.
 *                   The column distances are always created starting from the left (zero index) to the
 *                   right (the latest column index).
 */
export function transformSelectionToRowDistance(selectionRanges) {
  var selectionType = detectSelectionType(selectionRanges);

  if (selectionType === SELECTION_TYPE_UNRECOGNIZED || selectionType === SELECTION_TYPE_EMPTY) {
    return [];
  }

  var selectionSchemaNormalizer = normalizeSelectionFactory(selectionType);
  var unorderedIndexes = new Set();

  // Iterate through all ranges and collect all column indexes which are not saved yet.
  arrayEach(selectionRanges, function (selection) {
    var _selectionSchemaNorma3 = selectionSchemaNormalizer(selection),
        _selectionSchemaNorma4 = _slicedToArray(_selectionSchemaNorma3, 3),
        rowStart = _selectionSchemaNorma4[0],
        rowEnd = _selectionSchemaNorma4[2];

    var amount = rowEnd - rowStart + 1;

    arrayEach(Array.from(new Array(amount), function (_, i) {
      return rowStart + i;
    }), function (index) {
      if (!unorderedIndexes.has(index)) {
        unorderedIndexes.add(index);
      }
    });
  });

  // Sort indexes in ascending order to easily detecting non-consecutive columns.
  var orderedIndexes = Array.from(unorderedIndexes).sort(function (a, b) {
    return a - b;
  });
  var normalizedRowRanges = arrayReduce(orderedIndexes, function (acc, rowIndex, index, array) {
    if (index !== 0 && rowIndex === array[index - 1] + 1) {
      acc[acc.length - 1][1] += 1;
    } else {
      acc.push([rowIndex, 1]);
    }

    return acc;
  }, []);

  return normalizedRowRanges;
}

/**
 * Check if passed value can be treated as valid cell coordinate. The second argument is
 * used to check if the value doesn't exceed the defined max table rows/columns count.
 *
 * @param {*} coord
 * @param {Number} maxTableItemsCount The value that declares the maximum coordinate that is still validatable.
 * @return {Boolean}
 */
export function isValidCoord(coord) {
  var maxTableItemsCount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Infinity;

  return typeof coord === 'number' && coord >= 0 && coord < maxTableItemsCount;
}