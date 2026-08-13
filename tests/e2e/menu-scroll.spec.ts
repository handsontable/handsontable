import { test, expect } from '../fixtures/test';
import { MenuScrollPage } from '../fixtures/pages/MenuScrollPage';

/**
 * Issue #12719 (v2 — follow behavior): menus portal to document.body with
 * once-at-open positioning. When an element OUTSIDE the menu scrolls, the menu
 * must FOLLOW its anchor (header button / cell / parent item). It closes only
 * when the anchor scrolls out of the rendered grid viewport. Page scroll and
 * menu-internal scrolls change nothing.
 */
test.describe('menu follows its anchor on outside element scroll', () => {
  let menuPage: MenuScrollPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    menuPage = new MenuScrollPage(page, theme, bundle);
    await menuPage.goto();
  });

  test('dropdown menu follows its header button when an ancestor container is scrolled', async () => {
    await menuPage.openDropdownMenu(0);
    const buttonBefore = await menuPage.boundingBox(menuPage.headerButton(0));
    const menuBefore = await menuPage.boundingBox(menuPage.dropdownMenu);

    await menuPage.scrollContainerBy(100);
    await menuPage.settleFrames();

    await expect(menuPage.dropdownMenu).toBeVisible();
    const buttonAfter = await menuPage.boundingBox(menuPage.headerButton(0));
    const menuAfter = await menuPage.boundingBox(menuPage.dropdownMenu);

    // The menu keeps the same offset to its anchor (allow 1px rounding).
    expect(Math.abs((menuAfter.y - buttonAfter.y) - (menuBefore.y - buttonBefore.y))).toBeLessThanOrEqual(1);
    expect(Math.abs((menuAfter.x - buttonAfter.x) - (menuBefore.x - buttonBefore.x))).toBeLessThanOrEqual(1);
    // And it actually moved with the content.
    expect(Math.abs((menuBefore.y - menuAfter.y) - 100)).toBeLessThanOrEqual(1);
  });

  test('context menu follows its cell when an ancestor container is scrolled', async () => {
    await menuPage.openContextMenu(1, 1);
    const cellBefore = await menuPage.boundingBox(menuPage.cell(1, 1));
    const menuBefore = await menuPage.boundingBox(menuPage.contextMenu);

    await menuPage.scrollContainerBy(80);
    await menuPage.settleFrames();

    await expect(menuPage.contextMenu).toBeVisible();
    const cellAfter = await menuPage.boundingBox(menuPage.cell(1, 1));
    const menuAfter = await menuPage.boundingBox(menuPage.contextMenu);

    expect(Math.abs((menuAfter.y - cellAfter.y) - (menuBefore.y - cellBefore.y))).toBeLessThanOrEqual(1);
    expect(Math.abs((menuAfter.x - cellAfter.x) - (menuBefore.x - cellBefore.x))).toBeLessThanOrEqual(1);
  });

  test('submenu follows together with its parent menu on container scroll', async () => {
    await menuPage.openContextMenu(1, 1);
    await menuPage.openAlignmentSubmenu();
    const parentBefore = await menuPage.boundingBox(menuPage.contextMenu);
    const subBefore = await menuPage.boundingBox(menuPage.submenu);

    await menuPage.scrollContainerBy(60);
    await menuPage.settleFrames();

    await expect(menuPage.contextMenu).toBeVisible();
    await expect(menuPage.submenu).toBeVisible();
    const parentAfter = await menuPage.boundingBox(menuPage.contextMenu);
    const subAfter = await menuPage.boundingBox(menuPage.submenu);

    expect(Math.abs((subAfter.y - parentAfter.y) - (subBefore.y - parentBefore.y))).toBeLessThanOrEqual(1);
    expect(Math.abs((parentBefore.y - parentAfter.y) - 60)).toBeLessThanOrEqual(1);
  });

  test('dropdown menu follows its column when the grid itself is scrolled horizontally', async () => {
    await menuPage.openDropdownMenu(1);
    const menuBefore = await menuPage.boundingBox(menuPage.dropdownMenu);

    await menuPage.scrollGridHorizontallyBy(60);
    await menuPage.settleFrames();

    await expect(menuPage.dropdownMenu).toBeVisible();
    const buttonAfter = await menuPage.boundingBox(menuPage.headerButton(1));
    const menuAfter = await menuPage.boundingBox(menuPage.dropdownMenu);

    // Menu moved left together with the column.
    expect(Math.abs((menuBefore.x - menuAfter.x) - 60)).toBeLessThanOrEqual(1);
    // Still attached to the (moved) button.
    expect(menuAfter.x).toBeGreaterThanOrEqual(buttonAfter.x - menuBefore.width);
  });

  test('dropdown menu closes when its column is scrolled out of the grid viewport', async () => {
    await menuPage.openDropdownMenu(0);
    await menuPage.scrollGridHorizontallyBy(2000);
    await expect(menuPage.dropdownMenu).toBeHidden();
  });

  test('dropdown menu does NOT move on vertical grid scroll (sticky header)', async () => {
    await menuPage.openDropdownMenu(0);
    const menuBefore = await menuPage.boundingBox(menuPage.dropdownMenu);

    await menuPage.scrollGridVerticallyBy(60);
    await menuPage.settleFrames();

    await expect(menuPage.dropdownMenu).toBeVisible();
    const menuAfter = await menuPage.boundingBox(menuPage.dropdownMenu);

    expect(Math.abs(menuAfter.y - menuBefore.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(menuAfter.x - menuBefore.x)).toBeLessThanOrEqual(1);
  });

  test('context menu follows its cell on vertical grid scroll and closes when the cell derenders', async () => {
    await menuPage.openContextMenu(1, 1);
    const menuBefore = await menuPage.boundingBox(menuPage.contextMenu);

    await menuPage.scrollGridVerticallyBy(40);
    await menuPage.settleFrames();

    await expect(menuPage.contextMenu).toBeVisible();
    const menuAfter = await menuPage.boundingBox(menuPage.contextMenu);
    expect(Math.abs((menuBefore.y - menuAfter.y) - 40)).toBeLessThanOrEqual(1);

    await menuPage.scrollGridVerticallyBy(2000);
    await expect(menuPage.contextMenu).toBeHidden();
  });

  test('filter condition select menu stays open on vertical grid scroll (sticky header)', async () => {
    await menuPage.openDropdownMenu(0);
    await menuPage.openConditionSelectMenu();
    const menuBefore = await menuPage.boundingBox(menuPage.conditionMenu);

    await menuPage.scrollGridVerticallyBy(60);
    await menuPage.settleFrames();

    // The dropdown menu is anchored to the sticky header, so neither it nor the
    // condition select menu moves — and neither may close.
    await expect(menuPage.dropdownMenu).toBeVisible();
    await expect(menuPage.conditionMenu).toBeVisible();
    const menuAfter = await menuPage.boundingBox(menuPage.conditionMenu);

    expect(Math.abs(menuAfter.y - menuBefore.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(menuAfter.x - menuBefore.x)).toBeLessThanOrEqual(1);
  });

  test('filter condition select menu follows its select element on container scroll', async () => {
    await menuPage.openDropdownMenu(0);
    await menuPage.openConditionSelectMenu();
    const selectBefore = await menuPage.boundingBox(menuPage.conditionSelect());
    const menuBefore = await menuPage.boundingBox(menuPage.conditionMenu);

    await menuPage.scrollContainerBy(60);
    await menuPage.settleFrames();

    await expect(menuPage.conditionMenu).toBeVisible();
    const selectAfter = await menuPage.boundingBox(menuPage.conditionSelect());
    const menuAfter = await menuPage.boundingBox(menuPage.conditionMenu);

    // The menu keeps the same offset to the select element (allow 1px rounding).
    expect(Math.abs((menuAfter.y - selectAfter.y) - (menuBefore.y - selectBefore.y))).toBeLessThanOrEqual(1);
    expect(Math.abs((menuAfter.x - selectAfter.x) - (menuBefore.x - selectBefore.x))).toBeLessThanOrEqual(1);
    // And it actually moved with the content.
    expect(Math.abs((menuBefore.y - menuAfter.y) - 60)).toBeLessThanOrEqual(1);
  });

  test('filter condition select menu follows after the dropdown menu is reinitialized', async () => {
    // First open builds the long-lived condition select menu; `updateSettings` then
    // recreates the dropdown `Menu`. With construction-time scroll listeners the
    // condition menu's listener would fire first and measure its anchor BEFORE the
    // dropdown menu moved it (zero correction, menu stranded). Scroll listeners are
    // registered per-open, so the dropdown menu (opened first) always repositions
    // before the condition menu measures.
    await menuPage.openDropdownMenu(0);
    await menuPage.reinitializeDropdownMenu();

    await menuPage.openDropdownMenu(0);
    await menuPage.openConditionSelectMenu();
    const selectBefore = await menuPage.boundingBox(menuPage.conditionSelect());
    const menuBefore = await menuPage.boundingBox(menuPage.conditionMenu);

    await menuPage.scrollContainerBy(60);
    await menuPage.settleFrames();

    await expect(menuPage.conditionMenu).toBeVisible();
    const selectAfter = await menuPage.boundingBox(menuPage.conditionSelect());
    const menuAfter = await menuPage.boundingBox(menuPage.conditionMenu);

    // The menu keeps the same offset to the select element (allow 1px rounding).
    expect(Math.abs((menuAfter.y - selectAfter.y) - (menuBefore.y - selectBefore.y))).toBeLessThanOrEqual(1);
    expect(Math.abs((menuAfter.x - selectAfter.x) - (menuBefore.x - selectBefore.x))).toBeLessThanOrEqual(1);
    // And it actually moved with the content.
    expect(Math.abs((menuBefore.y - menuAfter.y) - 60)).toBeLessThanOrEqual(1);
  });

  test('scrolling the filter value list inside the menu changes nothing', async () => {
    await menuPage.openDropdownMenu(0);
    const menuBefore = await menuPage.boundingBox(menuPage.dropdownMenu);

    await menuPage.scrollFilterValueListBy(40);
    await menuPage.settleFrames();

    await expect(menuPage.dropdownMenu).toBeVisible();
    const menuAfter = await menuPage.boundingBox(menuPage.dropdownMenu);
    expect(menuAfter.y).toBe(menuBefore.y);
    expect(menuAfter.x).toBe(menuBefore.x);
  });

  test('page scroll keeps the menu open and correctly positioned', async () => {
    await menuPage.openDropdownMenu(0);
    const buttonBefore = await menuPage.boundingBox(menuPage.headerButton(0));
    const menuBefore = await menuPage.boundingBox(menuPage.dropdownMenu);

    await menuPage.scrollPageBy(100);
    await menuPage.settleFrames();

    await expect(menuPage.dropdownMenu).toBeVisible();
    const buttonAfter = await menuPage.boundingBox(menuPage.headerButton(0));
    const menuAfter = await menuPage.boundingBox(menuPage.dropdownMenu);

    expect(Math.abs((menuAfter.y - buttonAfter.y) - (menuBefore.y - buttonBefore.y))).toBeLessThanOrEqual(1);
  });

  test('keyboard-opened context menu lands attached to its cell after the open-time viewport scroll', async () => {
    await menuPage.cell(2, 1).click();
    await menuPage.scrollGridVerticallyBy(30);
    await menuPage.settleFrames();
    await menuPage.page.keyboard.press('Shift+F10');

    await expect(menuPage.contextMenu).toBeVisible();
    await menuPage.settleFrames();
    await expect(menuPage.contextMenu).toBeVisible();

    const cellBox = await menuPage.boundingBox(menuPage.cell(2, 1));
    const menuBox = await menuPage.boundingBox(menuPage.contextMenu);

    // Menu top edge sits at/below the cell's top edge and within a cell-height of its bottom.
    expect(menuBox.y).toBeGreaterThanOrEqual(cellBox.y - 1);
    expect(menuBox.y).toBeLessThanOrEqual(cellBox.y + cellBox.height + 2);
  });
});

test.describe('menu with uiContainer follows its container natively', () => {
  let menuPage: MenuScrollPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    menuPage = new MenuScrollPage(page, theme, bundle);
    await menuPage.goto({ uiContainer: true });
  });

  test('container scroll keeps the uiContainer menu attached (no double translation)', async () => {
    await menuPage.openDropdownMenu(0);
    const buttonBefore = await menuPage.boundingBox(menuPage.headerButton(0));
    const menuBefore = await menuPage.boundingBox(menuPage.dropdownMenu);

    await menuPage.scrollContainerBy(60);
    await menuPage.settleFrames();

    await expect(menuPage.dropdownMenu).toBeVisible();
    const buttonAfter = await menuPage.boundingBox(menuPage.headerButton(0));
    const menuAfter = await menuPage.boundingBox(menuPage.dropdownMenu);

    expect(Math.abs((menuAfter.y - buttonAfter.y) - (menuBefore.y - buttonBefore.y))).toBeLessThanOrEqual(1);
  });
});
