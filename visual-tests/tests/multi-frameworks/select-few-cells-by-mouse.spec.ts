import { visualTest, JS_VARIANTS, WRAPPERS, WRAPPERS_REASON_UNAUDITED } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell, makeSelectionFromCell } from '../../src/page-helpers';

/**
 * Checks that a selection dragged 100 px from a cell in the first column renders its highlight. Owned by
 * DEV-2981.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: WRAPPERS,
  wrappersReason: WRAPPERS_REASON_UNAUDITED,
}, async({ tablePage }) => {
  const cell = await selectCell(1, 0);

  await makeSelectionFromCell(cell, 100);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
