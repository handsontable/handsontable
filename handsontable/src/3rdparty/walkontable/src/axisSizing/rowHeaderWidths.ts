import type { SettingsPort } from '../ports';

/**
 * A row header width as the `rowHeaderWidth` setting or the `onModifyRowHeaderWidth` answer carries
 * it: one number for every level, or one entry per level, starting at the grid's edge.
 */
type RowHeaderWidthValue = number | Array<number | null | undefined> | null | undefined;

/**
 * Resolves the width of every rendered row header level. This is the one place the
 * `onModifyRowHeaderWidth` setting is asked, so the `col` elements (`ColumnUtils`) and the total the
 * viewport sizes the hider and the overlays with (`Viewport#getRowHeaderWidth`) cannot disagree.
 *
 * The hook gets the `rowHeaderWidth` setting as it is, a per-level number or a per-level array, and
 * never a total of the levels. Its answer is read by the same rule: a number is the width of each
 * level, an array gives each level its own entry. No answer (`null` or `undefined`, which is also
 * what an unset `onModifyRowHeaderWidth` setting gives) keeps the setting. A level the answer does
 * not cover, or covers with something that is not a finite number, gets the default column width.
 *
 * @param {object} wtSettings The Walkontable settings.
 * @returns {number[]} One width per rendered row header level.
 */
export function resolveRowHeaderWidths(wtSettings: Pick<SettingsPort, 'getSetting'>): number[] {
  const levels = wtSettings.getSetting<Function[]>('rowHeaders').length;

  if (levels === 0) {
    return [];
  }

  const setting = wtSettings.getSetting<RowHeaderWidthValue>('rowHeaderWidth');
  const answer = wtSettings.getSetting<RowHeaderWidthValue>('onModifyRowHeaderWidth', setting) ?? setting;
  const defaultColumnWidth = wtSettings.getSetting<number>('defaultColumnWidth');
  const widths = new Array<number>(levels);

  for (let level = 0; level < levels; level++) {
    const width = Array.isArray(answer) ? answer[level] : answer;

    widths[level] = typeof width === 'number' && Number.isFinite(width) ? width : defaultColumnWidth;
  }

  return widths;
}
