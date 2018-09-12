import { arrayFilter, arrayMap } from '../../helpers/array';

/**
 * Clean and extend patches from jsonpatch observer.
 *
 * @param {Array} patches
 * @returns {Array}
 */
export function cleanPatches(patches) {
  const newOrRemovedColumns = [];

  /**
   * If observeChanges uses native Object.observe method, then it produces patches for length property. Filter them.
   * If path can't be parsed. Filter it.
   */
  let cleanedPatches = arrayFilter(patches, (patch) => {
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
  cleanedPatches = arrayMap(cleanedPatches, (patch) => {
    const coords = parsePath(patch.path);

    patch.row = coords.row;
    patch.col = coords.col;

    return patch;
  });
  /**
   * Removing or adding column will produce one patch for each table row.
   * Leaves only one patch for each column add/remove operation.
   */
  cleanedPatches = arrayFilter(cleanedPatches, (patch) => {
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
  const match = path.match(/^\/(\d+)\/?(.*)?$/);

  if (!match) {
    return null;
  }
  const [, row, column] = match;

  return {
    row: parseInt(row, 10),
    col: /^\d*$/.test(column) ? parseInt(column, 10) : column
  };
}
