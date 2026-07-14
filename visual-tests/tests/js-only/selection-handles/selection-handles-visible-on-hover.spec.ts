import { test } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

test.skip(helpers.hotWrapper !== 'js', 'This test case is only for JavaScript framework');

/**
 * Verifies that four edge-adjustment handles are visible when hovering over a
 * cell inside the pre-selected range with `selectionHandles: true`.
 */
test(__filename, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/selection-handles-demo')
      .getFullUrl()
  );

  // The demo pre-selects rows 2-5, cols 2-4. Hover cell (3, 3) – an interior
  // cell – to trigger the mouseover that reveals the four edge handles.
  const cell = await selectCell(3, 3);

  await cell.hover();

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
