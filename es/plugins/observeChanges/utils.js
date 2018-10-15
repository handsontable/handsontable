var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

import { arrayFilter, arrayMap } from '../../helpers/array';

/**
 * Clean and extend patches from jsonpatch observer.
 *
 * @param {Array} patches
 * @returns {Array}
 */
export function cleanPatches(patches) {
  var newOrRemovedColumns = [];

  /**
   * If observeChanges uses native Object.observe method, then it produces patches for length property. Filter them.
   * If path can't be parsed. Filter it.
   */
  var cleanedPatches = arrayFilter(patches, function (patch) {
    if (/[/]length/ig.test(patch.path)) {
      return false;
    }
    if (!parsePath(patch.path)) {
      return false;
    }

    return true;
  });
  /**
   * Extend patches with changed cells coords
   */
  cleanedPatches = arrayMap(cleanedPatches, function (patch) {
    var coords = parsePath(patch.path);

    patch.row = coords.row;
    patch.col = coords.col;

    return patch;
  });
  /**
   * Removing or adding column will produce one patch for each table row.
   * Leaves only one patch for each column add/remove operation.
   */
  cleanedPatches = arrayFilter(cleanedPatches, function (patch) {
    if (['add', 'remove'].indexOf(patch.op) !== -1 && !isNaN(patch.col)) {
      if (newOrRemovedColumns.indexOf(patch.col) !== -1) {
        return false;
      }
      newOrRemovedColumns.push(patch.col);
    }

    return true;
  });
  newOrRemovedColumns.length = 0;

  return cleanedPatches;
}

/**
 * Extract coordinates from path where data was changed.
 *
 * @param {String} path Path describing where data was changed.
 * @returns {Object|null} Returns an object with `row` and `col` properties or `null` if path doesn't have necessary information.
 */
export function parsePath(path) {
  var match = path.match(/^\/(\d+)\/?(.*)?$/);

  if (!match) {
    return null;
  }

  var _match = _slicedToArray(match, 3),
      row = _match[1],
      column = _match[2];

  return {
    row: parseInt(row, 10),
    col: /^\d*$/.test(column) ? parseInt(column, 10) : column
  };
}