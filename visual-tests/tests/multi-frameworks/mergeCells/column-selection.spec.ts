import { visualTest, expect, JS_VARIANTS, WRAPPERS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  selectCell,
  createSelection,
  clickWithPositionAndModifiers,
  selectClonedCell,
} from '../../../src/page-helpers';

/**
 * The theme and wrapper canary of the shared `/` grid: a range merged with Control+M, then covered whole
 * by three Ctrl+clicked column headers. It paints more of the selection's look than any other capture of
 * `/` – the active column headers and their menu buttons (`--ht-header-active-*`, which `horizon` defines
 * its own way), three stacked column layers (`--ht-cell-selection-background-color`, deeper per layer)
 * with their borders, and the merged cell's full-selection overlay, which no other spec draws – on the
 * grid every wrapper demo builds from its own config. So it renders on every js variant and under all
 * three wrappers. The merge, the layers, the merged cell's classes and the partial cover #10559 fixed
 * are asserted on every theme in `tests/e2e/merge-cells-header-selection.spec.ts`. Added in #10559 and
 * trimmed to this one capture by DEV-3351, which owns it.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: 'The parity canary of the shared / grid: each wrapper demo builds the grid from its own '
    + 'config, so a difference from the copied js golden is a wrapper that renders the grid, its merged '
    + 'cells or its selection differently from js.',
}, async({ tablePage }) => {
  const mergedCell = await selectCell(3, 0);

  await createSelection(mergedCell, await selectCell(5, 2));
  // Control+M merges the selected range on every platform.
  await tablePage.keyboard.press('Control+m');
  await expect(mergedCell).toHaveAttribute('rowspan', '3');
  await expect(mergedCell).toHaveAttribute('colspan', '3');

  // A Ctrl+click on each of the first three column headers adds a column layer; together they cover the
  // merged cell whole, which draws it as fully selected.
  await clickWithPositionAndModifiers(await selectClonedCell(0, 1));
  await clickWithPositionAndModifiers(await selectClonedCell(0, 2));
  await clickWithPositionAndModifiers(await selectClonedCell(0, 3));

  await expect(await selectClonedCell(0, 1)).toHaveClass(/\bht__active_highlight\b/);
  await expect(await selectClonedCell(0, 2)).toHaveClass(/\bht__active_highlight\b/);
  await expect(await selectClonedCell(0, 3)).toHaveClass(/\bht__active_highlight\b/);
  await expect(mergedCell).toHaveClass(/\bfullySelectedMergedCell-multiple\b/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
