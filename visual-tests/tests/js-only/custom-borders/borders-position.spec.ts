import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import {
  selectCell,
  makeSelectionFromCell,
} from '../../../src/page-helpers';

/**
 * Checks that the custom borders of the custom-borders demo stay in place under a selection dragged 200 px
 * right and 200 px down from (10, 3), the top-left cell of a bordered range, so the selection crosses
 * that range's edges. It is the only check of how the border segments meet at their corners there:
 * `tests/e2e/customBorders.spec.ts` asserts where custom borders render and how thick they are, not how
 * their corners join. The border colors are the demo's own data and the theme adds only the selection's
 * accent, so the capture is on the two-theme default rather than every js variant. Owned by DEV-3285.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/custom-borders-demo')
      .getFullUrl()
  );

  const cell = await selectCell(10, 3);

  await makeSelectionFromCell(cell, 200);

  // The drag starts on (10, 3), its focused cell, and covers the diagonal neighbor, so the selection
  // spans rows and columns past the bordered range's corner whatever the theme's cell sizes.
  await expect(cell).toHaveClass(/\bcurrent\b/);
  await expect(await selectCell(11, 4)).toHaveClass(/\barea\b/);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
