import { arrayEach } from '../helpers/array';

/**
 * Collect physical indexes of the contiguous hidden stretches next to a visual index.
 *
 * Walks left, then right, from `visualIndex` and stops at the first visible or missing
 * neighbor. A middle gap is collected. A non-adjacent hidden index is not.
 *
 * Shared by HiddenColumns and HiddenRows Show-item `hidden()` callbacks (DEV-1040). Keep
 * this in `utils/` rather than duplicating it in either plugin — the plugins must not
 * import each other, and a copy trips Sonar duplication on new code.
 *
 * @param {number} visualIndex The selected visible visual index.
 * @param {number} visualCount Total visual index count.
 * @param {number[]} notTrimmedIndexes Map from visual index to physical index.
 * @param {Set<number>} hiddenPhysicalIndexes Hidden physical indexes.
 * @param {number[]} [target] Array to append into. A new array is used when omitted.
 * @returns {number[]} Adjacent hidden physical indexes in visual order.
 */
export function collectAdjacentHiddenPhysicalIndexes(
  visualIndex: number,
  visualCount: number,
  notTrimmedIndexes: number[],
  hiddenPhysicalIndexes: Set<number>,
  target: number[] = [],
): number[] {
  const leftPhysicalIndexes: number[] = [];

  for (let visual = visualIndex - 1; visual >= 0; visual -= 1) {
    const physical = notTrimmedIndexes[visual];

    if (typeof physical !== 'number' || !hiddenPhysicalIndexes.has(physical)) {
      break;
    }

    leftPhysicalIndexes.push(physical);
  }

  // Reverse after the left walk so visual order is preserved without an indexed copy loop
  // (typescript:S4138) and without `push(...array)` (stack overflow on a long stretch).
  // Keep `reverse()` in its own statement (typescript:S4043).
  leftPhysicalIndexes.reverse();
  arrayEach(leftPhysicalIndexes, (physical) => {
    target.push(physical);
  });

  for (let visual = visualIndex + 1; visual < visualCount; visual += 1) {
    const physical = notTrimmedIndexes[visual];

    if (typeof physical !== 'number' || !hiddenPhysicalIndexes.has(physical)) {
      break;
    }

    target.push(physical);
  }

  return target;
}
