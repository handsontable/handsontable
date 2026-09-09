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
 * Two things every test here has to do, or it passes on a build with the fix removed:
 *
 * 1. Move with `steps`. The bug lives in the rows crossed on the way, so a single jump to the
 *    destination cannot see it. The legacy Jasmine suite dispatches one synthetic `mouseover` per
 *    element and cannot express a path at all, which is why this is Playwright-only.
 * 2. Settle past the delay before asserting survival. A `toBeVisible()` that resolves on its first
 *    poll runs ~50 ms after the pointer arrives, long before the 300 ms timer it claims to test.
 *    The settle is measured in milliseconds, not frames — a frame count that clears 300 ms on a
 *    60Hz display is only ~278 ms on a 144Hz one.
 *
 * The survival tests also stamp the container and read the stamp back, because `toBeVisible()`
 * cannot tell a submenu that survived from one that was closed and instantly recreated.
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
      await menu.markSubmenu();

      const target = await menu.submenuItemPoint(label);

      await menu.travelTo(target.x, target.y);
      await menu.settlePastHoverDelay();

      // Before the fix this held for "Left" alone — every other item sits far enough below the
      // anchor row that the diagonal crosses "Copy" and "Cut" and killed the submenu on the way.
      await expect(menu.alignmentSubmenu,
        `submenu should survive the move to "${label}"`).toBeVisible();

      // ...and it must be the SAME submenu. A build that closed it and reopened it on arrival
      // would satisfy the assertion above while still flickering under the user's pointer.
      expect(await menu.submenuMark(),
        `submenu should not have been recreated on the way to "${label}"`).toBe('original');

      // Back to the anchor row for the next leg. Returning to the row that owns the open submenu
      // must cancel the pending switch and change nothing else.
      await menu.openAlignmentSubmenu();
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

    await menu.markSubmenu();

    await menu.travelTo(anchor.left + 20, parentMenu.bottom + 40);
    await menu.travelTo(bottomItem.x, bottomItem.y);
    await menu.settlePastHoverDelay();

    await expect(menu.alignmentSubmenu).toBeVisible();
    expect(await menu.submenuMark()).toBe('original');
  });

  test('closes the submenu once the pointer rests on another item', async () => {
    await menu.openMenu();
    await menu.openAlignmentSubmenu();

    const copy = await menu.itemBox('Copy');

    await menu.travelTo(copy.left + 20, (copy.top + copy.bottom) / 2);

    // The delay is a delay, not a block: resting on a plain row still closes the submenu, which is
    // what other spreadsheet applications do. Without this the survival tests above could pass on a
    // build that simply never closes anything.
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

    await menu.settlePastHoverDelay();

    await expect(menu.alignmentSubmenu).toHaveCount(0);

    // Positive control, in the same test and after the negative read so nothing has to be reset:
    // hovering the anchor and STAYING still opens the submenu. Without this the assertion above
    // would pass just as happily on a build where hovering never opens anything at all.
    await menu.openAlignmentSubmenu();

    await expect(menu.alignmentSubmenu).toBeVisible();
  });

  test('reopens on hover after the submenu was closed from its own side', async () => {
    await menu.openMenu();
    await menu.openAlignmentSubmenu();

    const anchor = await menu.itemBox('Alignment');
    const anchorMiddle = (anchor.top + anchor.bottom) / 2;

    // Escape and ArrowLeft close the submenu by calling `close()` on the submenu itself, never the
    // parent's `closeSubMenu()`. The parent's `hotSubMenus` entry therefore survives — that is the
    // pre-existing lifecycle, and the next `openSubMenu()` is what destroys it. So the hover
    // handler must decide "is this row's submenu open" by asking the submenu, not by remembering a
    // row index: a remembered index still names this row here, and the early return it feeds would
    // leave the anchor permanently unresponsive to the mouse.
    await menu.closeSubmenuFromItsOwnSide();

    await expect(menu.alignmentSubmenu).toBeHidden();

    const bookkeeping = await menu.parentSubmenuBookkeeping();

    expect(bookkeeping.keys, 'the entry is expected to survive — the hover must not rely on it')
      .toEqual(['alignment']);

    // Leave the row and come back. This is the interaction that stopped working.
    await menu.travelTo(anchor.left + 20, anchorMiddle - 120);
    await menu.travelTo(anchor.left + 20, anchorMiddle);

    await expect(menu.alignmentSubmenu).toBeVisible();
  });

  test('keeps a keyboard-opened submenu when the pointer rests on another row', async ({ page }) => {
    await menu.openMenu();

    const copy = await menu.itemBox('Copy');

    await menu.selectItemWithKeyboard('alignment');

    // Open and close from the keyboard. ArrowLeft hands focus back to the parent menu, so the
    // parent is what handles the next key — and it keeps the closed submenu's `hotSubMenus` entry,
    // which is what makes the hover below arm a switch rather than an open.
    await page.keyboard.press('ArrowRight');
    await expect(menu.alignmentSubmenu).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(menu.alignmentSubmenu).toBeHidden();

    // Rest the pointer on another row. Hovering never moves the menu selection, so the pointer and
    // the selection now point at different rows.
    await menu.travelTo(copy.left + 20, (copy.top + copy.bottom) / 2);

    // Reopen from the keyboard while that switch is still pending.
    await page.keyboard.press('ArrowRight');

    await expect(menu.alignmentSubmenu).toBeVisible();

    // The deliberate keyboard open has to win. Without clearing the hover timers inside
    // `openSubMenu()`, the switch armed by "Copy" fires 300 ms later and tears it down.
    await menu.settlePastHoverDelay();

    await expect(menu.alignmentSubmenu,
      'a pending hover switch must not close what the keyboard just opened').toBeVisible();
  });

  test('opens the submenu with no delay when the keyboard asks for it', async ({ page }) => {
    await menu.openMenu();

    // The right-click leaves the cursor on the menu, which arms a delayed open for whichever row
    // it landed on. Park the pointer off the menu so that timer is cancelled and cannot fire in
    // the middle of the keyboard run below.
    await menu.parkPointerAwayFromMenu();

    // Throws if the navigation never reaches the item, so the failure below cannot blame the
    // submenu for something that went wrong earlier.
    await menu.selectItemWithKeyboard('alignment');

    // The delay belongs to the hover handler only. The keyboard calls `openSubMenu` directly and
    // must stay instant, so this asserts with no settle between the key and the assertion.
    await page.keyboard.press('ArrowRight');

    await expect(menu.alignmentSubmenu).toBeVisible();
  });
});
