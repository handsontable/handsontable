/**
 * Finds the header level a keyboard toggle acts on: the level closest to the data, at or above the
 * starting one, whose header over the column can be collapsed or expanded. Header levels count from
 * the top, so the search walks from the starting level up to level `0`.
 *
 * @param {number} startLevel The header level to start from: the last level for a data cell, the
 * focused header's own level for a column header.
 * @param {Function} isToggleableAt Tells whether the header at a level can be collapsed or expanded.
 * @returns {number|null} The header level, or `null` when no level above the start has such a header.
 */
export function findClosestToggleLevel(
  startLevel: number, isToggleableAt: (headerLevel: number) => boolean
): number | null {
  for (let headerLevel = startLevel; headerLevel >= 0; headerLevel--) {
    if (isToggleableAt(headerLevel)) {
      return headerLevel;
    }
  }

  return null;
}
