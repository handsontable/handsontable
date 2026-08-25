import type { HotInstance } from '../../../core/types';

/**
 * A fixed-area counter, described by the setting its value is read from and the setting its value is
 * written to. The two keys differ for the fixed columns - see `FIXED_COLUMN_COUNTS`.
 */
interface FixedCount {
  readKey: string;
  writeKey: string;
}

/**
 * The counters that `alter` lowers when it removes rows from a fixed area.
 */
export const FIXED_ROW_COUNTS: FixedCount[] = [
  { readKey: 'fixedRowsTop', writeKey: 'fixedRowsTop' },
  { readKey: 'fixedRowsBottom', writeKey: 'fixedRowsBottom' },
];

/**
 * The counters that `alter` lowers when it removes columns from a fixed area.
 *
 * Since 12.0.0, the "fixedColumnsLeft" option is replaced with the "fixedColumnsStart" option. The old
 * name still works, and using both names together throws an error. To prevent that, the engine needs to
 * modify the original option key to bypass the validation.
 */
export const FIXED_COLUMN_COUNTS: FixedCount[] = [
  { readKey: 'fixedColumnsStart', writeKey: '_fixedColumnsStart' },
];

/**
 * Removes rows or columns and brings back the fixed-area counters that the removal lowered.
 *
 * Undoing an insertion removes the created rows or columns. When they belong to a fixed area, `alter`
 * lowers the matching counter, which un-pins a row or column that was pinned before the insertion
 * (DEV-2551). The values from before the removal are put back from the `beforeRender` hook, so `alter`
 * still draws the grid once, with the counters already correct. Only a decrease is reverted - a value
 * raised in the meantime by `updateSettings` stays as the user set it.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {Array} counts The counters to keep.
 * @param {function(): void} removeCallback The callback that removes the rows or columns.
 */
export function removeAndKeepFixedCounts(
  hot: HotInstance,
  counts: FixedCount[],
  removeCallback: () => void
) {
  // Changing by the reference as `updateSettings` doesn't work the best.
  const settings = hot.getSettings() as unknown as Record<string, number | undefined>;
  const countsBefore = counts.map(({ readKey }) => settings[readKey] ?? 0);
  const restore = () => {
    let wasRestored = false;

    counts.forEach(({ readKey, writeKey }, index) => {
      if ((settings[readKey] ?? 0) < countsBefore[index]) {
        settings[writeKey] = countsBefore[index];
        wasRestored = true;
      }
    });

    return wasRestored;
  };
  const onBeforeRender = () => {
    restore();
  };

  // `alter` lowers the counters after the rows or columns are gone, but before it renders the grid.
  hot.addHookOnce('beforeRender', onBeforeRender);
  removeCallback();
  hot.removeHook('beforeRender', onBeforeRender);

  // The hook doesn't run while the rendering is suspended, so the counters are restored here instead.
  if (restore()) {
    hot.render();
  }
}
