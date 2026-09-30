import { visualTest, test, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

test.beforeEach(async({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

/**
 * Checks how the row resize guide and the active handle look on the complex demo while the button is
 * held on the third row header's bottom edge: the guide's line, drawn from `--ht-accent-color`, across
 * the table and the handle's two indicator bars, drawn from `--ht-resize-indicator-color`. Those two
 * tokens are what this capture is of, and the second one is painted nowhere else in the suite, so the
 * capture stays on every js variant rather than on the two-theme default. Where both are drawn — the
 * handle centered on the row boundary, the guide's line level with it, spanning to the table's end,
 * stacked above the overlays and following a drag — is asserted from DOM rects in
 * `tests/e2e/manual-resize-guide-geometry.spec.ts` on every theme. The handle at rest under the pointer
 * paints the same pixels as the active handle here (`:hover` and `.active` share one rule), so it has no
 * capture of its own. Owned by DEV-3205.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers
      .setBaseUrl('/complex-demo')
      .getFullUrl()
  );
  const table = tablePage.locator(helpers.selectors.mainTable);
  const handle = tablePage.locator('.manualRowResizer');
  const guide = tablePage.locator('.manualRowResizerGuide');

  // The third row header, addressed in the master table; the inline-start overlay paints its copy over
  // it at the same coordinates, so the pointer goes there by coordinate — `hover()` would wait for the
  // master cell to receive events, which it never does. The first move attaches the handle to the
  // header's bottom edge, at opacity 0 until the pointer is over the handle itself.
  const cell = await selectCell(2, 0, table, 'th');
  const headerBox = await cell.boundingBox();

  await tablePage.mouse.move(
    headerBox!.x + (headerBox!.width / 2),
    headerBox!.y + (headerBox!.height / 2)
  );
  await expect(handle).toHaveCount(1);

  // 3px above the header's bottom edge is inside the handle's 10px strip: `:hover` shows it.
  await tablePage.mouse.move(
    headerBox!.x + (headerBox!.width / 2),
    headerBox!.y + headerBox!.height - 3
  );
  await expect(handle).toHaveCSS('opacity', '1');

  // The press attaches the guide and marks both elements active — the state this capture is of.
  await tablePage.mouse.down();
  await expect(guide).toHaveClass(/active/);
  await expect(handle).toHaveClass(/active/);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
