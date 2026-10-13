/**
 * Resolves how many of the LAST columns the inline-end overlay really renders.
 *
 * The end band and the start band can ask for more columns than the grid has. The start band has
 * priority, so the end band is cut down to the columns that remain after it:
 * `min(requestedEnd, max(0, totalColumns - fixedColumnsStart))`.
 *
 * This is the only place that applies the rule. `Settings#getSetting('fixedColumnsEnd')` calls it, so
 * every reader in the engine (the calculators, the overlays, the tables, the selection) sees the same
 * number, and the host can import it to clamp the count it passes in.
 *
 * @param {number|undefined|null} requestedEnd The requested number of end columns.
 * @param {number|undefined|null} fixedColumnsStart The number of start columns (renderable).
 * @param {number|undefined|null} totalColumns The number of renderable columns.
 * @returns {number} A non-negative integer.
 */
export function clampFixedColumnsEnd(
  requestedEnd: number | undefined | null,
  fixedColumnsStart: number | undefined | null,
  totalColumns: number | undefined | null
): number {
  const end = Math.floor(Number(requestedEnd));

  if (!(end > 0)) {
    return 0;
  }

  if (typeof totalColumns !== 'number' || Number.isNaN(totalColumns)) {
    return end;
  }

  const start = Math.max(Number(fixedColumnsStart) || 0, 0);

  return Math.min(end, Math.max(0, totalColumns - start));
}
