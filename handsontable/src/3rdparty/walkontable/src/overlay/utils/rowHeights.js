/**
 * Get the precomputed row-height sum for uniform-height datasets.
 *
 * @param {Settings} wtSettings The Walkontable settings.
 * @param {Viewport} wtViewport The viewport instance.
 * @param {number} from The starting row index.
 * @param {number} to The ending row index.
 * @returns {number|null}
 */
export function getUniformRowHeightSum(wtSettings, wtViewport, from, to) {
  const uniformRowHeight = wtSettings.getSetting('uniformRowHeight');
  const hasOversizedRows = wtViewport.oversizedRows.length > 0;

  if (Number.isFinite(uniformRowHeight) && !hasOversizedRows) {
    return (to - from) * uniformRowHeight;
  }

  return null;
}
