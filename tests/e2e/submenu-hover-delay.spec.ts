import { test, expect } from '../fixtures/test';
import { SubmenuHoverDelayPage } from '../fixtures/pages/SubmenuHoverDelayPage';

/**
 * DEV-2861 / DEV-66. Opening a submenu waited 300 ms; closing one was instant. Because the submenu
 * is drawn beside the parent menu, reaching any item except the first means moving the pointer
 * right AND down, which crosses the parent rows below the anchor — and each crossed row called
 * `openSubMenu(row)` at once, which closes every open submenu before it even checks whether the new
 * row has one. Six of the seven alignment options could not be pointed at directly.
 *
 * Closing now waits the same 300 ms, and the pending switch is cancelled when the pointer reaches
 * the submenu, returns to the anchor row, or leaves the menu.
 *
 * All of this needs a real pointer path: the bug lives in the rows crossed on the way, so a single
 * jump to the destination cannot see it. The page object always moves with `steps`. The legacy
 * Jasmine suite dispatches one synthetic `mouseover` per element and cannot express a path at all.
 */
test.describe('context menu submenu hover delay', () => {
  let menu: SubmenuHoverDelayPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    menu = new SubmenuHoverDelayPage(page, theme, bundle);

    await menu.goto();
  });

  test('keeps the submenu open while the pointer travels diagonally to any of its items', async () => {
    await menu.openMenu();
    await menu.openAlignmentSubmenu();

    const labels = await menu.submenuItemLabels();

    // Guards the loop below: an empty or truncated list would make every iteration vacuous.
    expect(labels).toEqual(['Left', 'Center', 'Right', 'Justify', 'Top', 'Middle', 'Bottom']);

    for (const label of labels) {
      const target = await menu.submenuItemPoint(label);

      await menu.travelTo(target.x, target.y);

      // Before the fix this held for "Left" alone — every other item sits far enough below the
      // anchor row that the diagonal crosses "Copy" and "Cut" and killed the submenu on the way.
      await expect(menu.alignmentSubmenu,
        `submenu should survive the move to "${label}"`).toBeVisible();

      // Back to the anchor row for the next leg. Returning to the row that owns the open submenu
      // must not close and recreate it, which is its own guard in the fix.
      await menu.openAlignmentSubmenu();
      await expect(menu.alignmentSubmenu).toBeVisible();
    }
  });

  test('keeps the submenu open along the reported path, which leaves the menu and crosses the grid', async () => {
    await menu.openMenu();
    await menu.openAlignmentSubmenu();

    const parentMenu = await menu.menuBox();
    const anchor = await menu.itemBox('Alignment');

    // The submenu is taller than the parent menu, so its lower items hang below it over the grid.
    // This is the path from the report: straight down out of the menu's bottom edge, then across
    // the grid and into the submenu from below. The switch armed by the last crossed parent row
    // fires while the pointer is out over the grid, so only the `mouseleave` cancel saves it.
    const bottomItem = await menu.submenuItemPoint('Bottom');

    expect(bottomItem.y, 'the last submenu item must hang below the parent menu for this to be the reported path')
      .toBeGreaterThan(parentMenu.bottom);

    await menu.travelTo(anchor.left + 20, parentMenu.bottom + 40);
    await menu.travelTo(bottomItem.x, bottomItem.y);

    await expect(menu.alignmentSubmenu).toBeVisible();
  });

  test('closes the submenu once the pointer rests on another item', async () => {
    await menu.openMenu();
    await menu.openAlignmentSubmenu();

    const copy = await menu.itemBox('Copy');

    await menu.travelTo(copy.left + 20, (copy.top + copy.bottom) / 2);

    // The delay is a delay, not a block: resting on a plain row still closes the submenu, which is
    // what other spreadsheet applications do. Without this the first test could pass on a fix that
    // simply never closes anything.
    await expect(menu.alignmentSubmenu).toHaveCount(0);
  });

  test('does not open a submenu after the pointer has left the menu', async () => {
    await menu.openMenu();

    const anchor = await menu.itemBox('Alignment');
    const parentMenu = await menu.menuBox();
    const anchorMiddle = (anchor.top + anchor.bottom) / 2;

    // Brush the anchor and leave sideways, well inside the open delay. Exiting to the LEFT crosses
    // no other row, which is what makes the stale timer visible — leaving through other rows
    // re-aims the pending open at a row that has no submenu and hides the bug.
    await menu.travelTo(anchor.left + 30, anchorMiddle);
    await menu.travelTo(parentMenu.left - 60, anchorMiddle);

    // Bounded settle, counted in frames inside the page: ~660 ms at 60fps, well past the 300 ms
    // open delay. The submenu used to appear right here, with the pointer already off the menu.
    await menu.afterAnimationFrames(40);

    await expect(menu.alignmentSubmenu).toHaveCount(0);

    // Positive control, in the same test and after the negative read so nothing has to be reset:
    // hovering the anchor and STAYING still opens the submenu. Without this the assertion above
    // would pass just as happily on a build where hovering never opens anything at all.
    await menu.openAlignmentSubmenu();

    await expect(menu.alignmentSubmenu).toBeVisible();
  });

  test('opens the submenu with no delay when the keyboard asks for it', async ({ page }) => {
    await menu.openMenu();

    // The delay belongs to the hover handler only. The keyboard calls `openSubMenu` directly and
    // must stay instant, so this asserts with no wait at all between the key and the assertion.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('ArrowDown');

      const selected = await page.evaluate(() => (window as unknown as {
        hot: { getPlugin: (name: string) => { menu: { getSelectedItem: () => { key?: string } | undefined } } };
      }).hot.getPlugin('contextMenu').menu.getSelectedItem()?.key);

      if (selected === 'alignment') {
        break;
      }
    }

    await page.keyboard.press('ArrowRight');

    await expect(menu.alignmentSubmenu).toBeVisible();
  });
});
