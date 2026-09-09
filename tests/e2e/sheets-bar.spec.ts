import { test, expect } from '../fixtures/test';
import { SheetsBarPage } from '../fixtures/pages/SheetsBarPage';

test.describe('sheets bar', () => {
  test('clicking a tab switches the grid to that sheet', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.expectActiveTab(0);
    await bar.expectCell(0, 0, 'A1');

    await bar.clickTab(1);

    await bar.expectActiveTab(1);
    await bar.expectCell(0, 0, 'B1');

    await bar.clickTab(2);
    await bar.expectCell(0, 0, 'G1');
  });

  test('the add button appends a new default-named sheet', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await bar.addButton.click();

    await bar.tab(3).waitFor();
    await bar.clickTab(3);
    await bar.expectActiveTab(3);
  });

  test('column width and sort survive a sheet round-trip', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await page.evaluate(() => {
      const hot = (window as never as { hot: any }).hot;

      hot.getPlugin('manualColumnResize').setManualSize(0, 260);
      hot.render();
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    });

    await bar.clickTab(1);
    await bar.clickTab(0);

    const width = await page.evaluate(() => (window as never as { hot: any }).hot.getColWidth(0));

    expect(width).toBe(260);
    await bar.expectCell(0, 0, 'A3');
  });

  test('a cell edit survives a sheet round-trip', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await page.evaluate(() => {
      (window as never as { hot: any }).hot.setDataAtCell(0, 0, 'edited');
    });

    await bar.expectCell(0, 0, 'edited');

    await bar.clickTab(1);
    await bar.expectCell(0, 0, 'B1');

    await bar.clickTab(0);
    await bar.expectCell(0, 0, 'edited');
  });

  test('a sheet can be activated with the keyboard alone', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    // One stop per tab: the tab is the control, and Tab walks the strip a sheet at a time.
    await bar.tab(0).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await bar.expectActiveTab(1);
    await bar.expectCell(0, 0, 'B1');
  });

  test('activating a tab from the keyboard leaves the focus on it', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    // Which tab holds the focus, and whether the focus is on the tab itself rather than on
    // something inside it. The class list is deliberately not compared: activating a sheet adds
    // the active modifier to the very tab under test.
    const focused = () => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;

      return {
        isTab: active?.classList.contains('ht-sheets-bar__tab') ?? false,
        sheet: active?.closest?.('[data-sheet-id]')?.getAttribute('data-sheet-id') ?? null,
      };
    });

    await bar.tab(1).focus();

    const before = await focused();

    await page.keyboard.press('Enter');

    // The strip repaints on activation, which replaces the node the focus was on. It has to
    // come back to the same tab rather than to the document.
    await bar.expectActiveTab(1);
    expect(await focused()).toEqual(before);

    await bar.tab(2).focus();
    await page.keyboard.press('Space');

    await bar.expectActiveTab(2);
    expect(await focused()).toEqual({ isTab: true, sheet: '3' });
  });

  test('the keyboard takes two activations: the sheet first, then its menu', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const menu = page.locator('.htSheetsBarMenu:visible');

    await bar.tab(1).focus();
    await page.keyboard.press('Enter');

    // First activation moves to the sheet and nothing more.
    await bar.expectActiveTab(1);
    await expect(menu).toHaveCount(0);

    await page.keyboard.press('Enter');

    // Second activation, on the sheet you are now on, opens its menu.
    await expect(menu).toHaveCount(1);
    await expect(page.locator('.htSheetsBarMenu td.current')).toHaveText(/Rename/);

    await page.keyboard.press('Escape');

    // Closing hands the focus back to the tab it was opened from.
    await expect(bar.tab(1)).toBeFocused();
  });

  test('the menu trigger takes two clicks on another tab, one on the active tab', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const menu = page.locator('.htSheetsBarMenu:visible');

    // The trigger is on every tab, not only the active one.
    await expect(bar.chevron(0)).toBeVisible();
    await expect(bar.chevron(2)).toBeVisible();

    await bar.chevron(2).click();

    // A menu acts on a sheet, so the first click only brings you to that sheet.
    await bar.expectActiveTab(2);
    await expect(menu).toHaveCount(0);

    await bar.chevron(2).click();

    await expect(menu).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);

    // On the tab you are already on, one click is enough.
    await bar.chevron(2).click();

    await expect(menu).toHaveCount(1);
  });

  test('only the active tab\'s menu trigger answers to hover', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const surfaceOf = (index: number) => bar.chevron(index)
      .evaluate(element => getComputedStyle(element).backgroundColor);

    const resting = await surfaceOf(0);

    // Tab 0 is the active one: its trigger opens the menu, so it reads as hit-able.
    await bar.chevron(0).hover();

    expect(await surfaceOf(0)).not.toEqual(resting);

    // Tab 2 is not: one click there moves to that sheet rather than opening anything, so the
    // trigger must not promise a menu.
    await bar.chevron(2).hover();

    expect(await surfaceOf(2)).toEqual(resting);
  });

  test('the menu trigger is easier to hit than the glyph it draws', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const target = (await bar.chevron(0).boundingBox())!;
    const glyph = await bar.chevron(0).evaluate((element) => {
      const styles = getComputedStyle(element, '::after');

      return { width: parseFloat(styles.width) || 0, height: parseFloat(styles.height) || 0 };
    });

    // The hit area is grown around the glyph rather than being the glyph itself.
    expect(target.width).toBeGreaterThan(glyph.width);
    expect(target.height).toBeGreaterThan(glyph.height);
  });

  test('dragging a tab selects no text', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const first = (await bar.tab(0).boundingBox())!;
    const third = (await bar.tab(2).boundingBox())!;
    const middle = first.y + (first.height / 2);

    await page.mouse.move(first.x + (first.width / 2), middle);
    await page.mouse.down();
    await page.mouse.move(first.x + first.width, middle);
    await page.mouse.move(third.x + (third.width / 2), middle);

    // Sweeping across the names must move the tab, not select the words it passes.
    expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');

    await page.mouse.up();

    expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
  });

  test('a repaint leaves focus outside the strip where it was', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.addButton.focus();
    await page.keyboard.press('Enter');

    // The add button repaints the strip too; a repaint must hand focus back, never take it.
    await expect(bar.addButton).toBeFocused();
  });

  test('double-clicking a tab label renames the sheet', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
    await bar.renameInput.fill('Quarterly');
    await bar.renameInput.press('Enter');

    await expect(bar.tabByName('Quarterly')).toBeVisible();
    await expect(bar.tabByName('Alpha')).toHaveCount(0);
  });

  test('the rename field stops accepting characters at fifty', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
    await bar.renameInput.fill('z'.repeat(50));

    await page.keyboard.type('QQQ');

    // Nothing lands past the limit, and what was already typed is left alone.
    await expect(bar.renameInput).toHaveJSProperty('value', 'z'.repeat(50));

    // A paste is cut to fit rather than refused outright.
    await bar.renameInput.fill('z'.repeat(48));
    await page.keyboard.type('abcd');

    await expect(bar.renameInput).toHaveJSProperty('value', `${'z'.repeat(48)}ab`);

    await bar.renameInput.fill('z'.repeat(50));

    await bar.renameInput.press('Enter');

    await expect(bar.tabByName('z'.repeat(50))).toBeVisible();
  });

  test('opening the tab menu with the pointer leaves no item highlighted', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.chevron(0).click();

    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);
    await expect(page.locator('.htSheetsBarMenu td.current')).toHaveCount(0);
  });

  test('the add button switches to the new sheet, seeded blank at A-Z by 1000', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.addButton.click();

    await expect(bar.tab(3)).toHaveClass(/ht-sheets-bar__tab--active/);
    await expect.poll(() => page.evaluate(
      () => (window as unknown as { hot: { countRows: () => number, countCols: () => number } }).hot.countRows(),
    )).toBe(1000);
    await expect.poll(() => page.evaluate(
      () => (window as unknown as { hot: { countCols: () => number } }).hot.countCols(),
    )).toBe(26);
  });

  test('Escape returns focus to the button the menu was opened from', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const focusedClass = () => page.evaluate(() => document.activeElement?.className ?? '');

    await bar.allButton.click();
    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);
    await page.keyboard.press('Escape');

    await expect.poll(focusedClass).toContain('ht-sheets-bar__all');

    await bar.chevron(0).click();
    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);
    await page.keyboard.press('Escape');

    // The tab is what the menu was opened from, so the tab is where the focus belongs.
    await expect.poll(focusedClass).toContain('ht-sheets-bar__tab');
  });

  test('a move from the menu leaves the focus on the moved sheet\'s tab', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const names = () => page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab-label'),
    ).map(label => label.textContent));

    await bar.tab(0).focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);

    await bar.menuItem('Move right').click();

    await expect.poll(names).toEqual(['Beta', 'Alpha', 'Gamma']);

    // The move rebuilds the tab the menu was opened from, so the focus has to find the sheet
    // again rather than the node it started on — which by now is detached.
    await expect(bar.tabByName('Alpha')).toBeFocused();
  });

  test('running a menu command with Enter does not reopen the menu it just closed', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const menu = page.locator('.htSheetsBarMenu:visible');

    await bar.tab(0).focus();
    await page.keyboard.press('Enter');

    await expect(menu).toHaveCount(1);
    await expect(page.locator('.htSheetsBarMenu td.current')).toHaveText(/Rename/);

    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.htSheetsBarMenu td.current')).toHaveText(/Duplicate/);

    await page.keyboard.press('Enter');

    await expect(bar.tabByName('Alpha (2)')).toBeVisible();

    // The command closes the menu and hands the focus back to the tab. The bar's activation
    // shortcut swallows its keystroke, so nothing of that Enter reaches the tab and the menu
    // stays closed.
    await expect(menu).toHaveCount(0);
    await expect(bar.tabByName('Alpha')).toBeFocused();
  });

  test('deleting a sheet from the menu leaves the focus on the tab that takes its place', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.tab(1).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');

    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);

    await bar.menuItem('Delete').click();

    await expect(bar.tabByName('Beta')).toHaveCount(0);

    // Beta is gone, so the focus goes to the sheet that now stands where it did.
    await expect(bar.tabByName('Gamma')).toBeFocused();

    // Deleting the last tab has nowhere after it to go, so the focus falls back to the one
    // before it.
    await bar.tab(1).focus();
    await page.keyboard.press('Enter');
    await bar.menuItem('Delete').click();

    await expect(bar.tabByName('Gamma')).toHaveCount(0);
    await expect(bar.tabByName('Alpha')).toBeFocused();
  });

  test('the delete item is disabled on the last remaining sheet', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const remove = page.locator('.htSheetsBarMenu td', { hasText: 'Delete' });

    await bar.chevron(0).click();

    await expect(remove).not.toHaveClass(/htDisabled/);

    await page.keyboard.press('Escape');

    // Down to one sheet: a workbook always keeps one, so the command is offered as disabled
    // rather than quietly doing nothing.
    await bar.tab(2).click({ button: 'right' });
    await bar.menuItem('Delete').click();
    await bar.tab(1).click({ button: 'right' });
    await bar.menuItem('Delete').click();

    await expect(bar.tab(1)).toHaveCount(0);

    await bar.chevron(0).click();

    await expect(remove).toHaveClass(/htDisabled/);
  });

  test('a menu command that moves focus keeps it, rather than losing it to the trigger', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.chevron(0).click();
    await bar.menuItem('Rename').click();

    // The rename input opens from a menu command, so the close-time focus restore must stand
    // aside — otherwise renaming from the menu would drop the caret before a key is pressed.
    await expect(bar.renameInput).toBeFocused();
  });

  test('the all-sheets rows respond to hover and to keyboard focus', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.allButton.click();

    const rows = page.locator('.htSheetsBarMenu td');
    const background = () => rows.first().evaluate(element => getComputedStyle(element).backgroundColor);
    const resting = await background();

    await rows.first().hover();

    await expect.poll(background).not.toBe(resting);

    await page.keyboard.press('ArrowDown');

    await expect(page.locator('.htSheetsBarMenu td.current')).toHaveCount(1);
    await expect(page.locator('.htSheetsBarMenu td.current')).toHaveCSS(
      'box-shadow',
      /inset|0px 0px 0px 1px/,
    );
  });

  test('the all-sheets menu scrolls once it passes eight sheets', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const metrics = () => page.evaluate(() => {
      const holder = document.querySelector('.htSheetsBarMenu .ht_master .wtHolder') as HTMLElement;
      const row = document.querySelector('.htSheetsBarMenu .ht_master tbody tr') as HTMLElement;
      const style = getComputedStyle(holder);
      // The menu's vertical padding lives inside the holder, so the scrollbar spans the menu's
      // full height; the row budget is the client height with that padding taken back out.
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

      return {
        visible: holder.clientHeight - padding,
        content: holder.scrollHeight - padding,
        rowHeight: row.getBoundingClientRect().height,
        scrollTop: holder.scrollTop,
      };
    });

    // Three sheets: short enough to sit at its natural height.
    await bar.allButton.click();
    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);

    const short = await metrics();

    expect(short.content).toBeLessThanOrEqual(short.visible);

    await page.keyboard.press('Escape');

    for (let i = 0; i < 12; i += 1) {
      await bar.addButton.click();
    }

    await bar.allButton.click();
    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);

    const long = await metrics();

    // Eight rows stay visible whatever the theme's density, and the rest scroll.
    expect(long.visible).toBe(Math.round(long.rowHeight * 8));
    expect(long.content).toBeGreaterThan(long.visible);

    // Keyboard navigation has to be able to reach the rows below the fold.
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('ArrowDown');
    }

    await expect.poll(async() => (await metrics()).scrollTop).toBeGreaterThan(0);

    // Vertical only: a scrollbar that takes width from the holder must not leave the menu
    // reachable sideways.
    const sideways = await page.evaluate(() => {
      const holder = document.querySelector('.htSheetsBarMenu .ht_master .wtHolder') as HTMLElement;

      holder.scrollLeft = 500;

      return { scrollLeft: holder.scrollLeft, overflowX: getComputedStyle(holder).overflowX };
    });

    expect(sideways).toEqual({ scrollLeft: 0, overflowX: 'hidden' });
  });

  test('the move items are disabled at the edges of the strip', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const moveLeft = page.locator('.htSheetsBarMenu td', { hasText: 'Move left' });
    const moveRight = page.locator('.htSheetsBarMenu td', { hasText: 'Move right' });

    await bar.chevron(0).click();

    await expect(moveLeft).toHaveClass(/htDisabled/);
    await expect(moveRight).not.toHaveClass(/htDisabled/);

    await page.keyboard.press('Escape');

    // Right-click is the one gesture that opens the menu of a tab you are not on.
    await bar.tab(2).click({ button: 'right' });

    await expect(moveLeft).not.toHaveClass(/htDisabled/);
    await expect(moveRight).toHaveClass(/htDisabled/);
  });

  test('right-clicking a tab opens its menu instead of the grid context menu', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await page.evaluate(() => (window as unknown as { hot: { updateSettings: (s: object) => void } })
      .hot.updateSettings({ contextMenu: true }));

    await bar.tab(0).click({ button: 'right' });

    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);
    await expect(page.locator('.htContextMenu:visible')).toHaveCount(0);
    // Summoned by pointer, so nothing is preselected here either.
    await expect(page.locator('.htSheetsBarMenu td.current')).toHaveCount(0);
  });

  test('right-clicking a cell still opens the grid context menu', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await page.evaluate(() => (window as unknown as { hot: { updateSettings: (s: object) => void } })
      .hot.updateSettings({ contextMenu: true }));

    await page.locator('.ht_master td').first().click({ button: 'right' });

    await expect(page.locator('.htContextMenu:visible')).toHaveCount(1);
    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(0);
  });

  test('opening the tab menu from the keyboard selects the first item', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    // A screen reader needs a `menuitem` to announce, and without a selection Escape stops
    // reaching the menu — so the keyboard path keeps the preselection the pointer path drops.
    // The first activation moves to the sheet; on the sheet you are already on, it opens the
    // menu. Tab 0 is the active one, so a single Enter is the menu.
    await bar.tab(0).focus();
    await bar.tab(0).press('Enter');

    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);
    await expect(page.locator('.htSheetsBarMenu td.current')).toHaveText(/Rename/);
  });

  test('the tab menu trigger is hidden while renaming and returns afterwards', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await expect(bar.chevronByName('Alpha')).toBeVisible();

    await bar.tab(0).dblclick();

    await expect(bar.renameInput).toBeVisible();
    await expect(bar.tab(0).locator('.ht-sheets-bar__tab-chevron')).toBeHidden();

    await bar.renameInput.press('Escape');

    await expect(bar.chevronByName('Alpha')).toBeVisible();
  });

  test('the tab keeps its width when the rename input replaces the label and chevron', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const tabBox = async () => (await bar.tab(0).boundingBox())!;
    const scrollY = () => page.evaluate(() => window.scrollY);
    const before = await tabBox();
    const scrollBefore = await scrollY();

    await bar.tab(0).dblclick();
    await expect(bar.renameInput).toBeVisible();

    const editing = await tabBox();

    expect(editing.width).toBeCloseTo(before.width, 0);
    expect(editing.height).toBeCloseTo(before.height, 0);
    expect(await scrollY()).toBe(scrollBefore);

    // Clearing the name must not collapse the tab either.
    await bar.renameInput.fill('');

    expect((await tabBox()).width).toBeCloseTo(before.width, 0);

    await bar.renameInput.press('Escape');
    await expect(bar.renameInput).toHaveCount(0);

    const after = await tabBox();

    expect(after.width).toBeCloseTo(before.width, 0);
    expect(after.height).toBeCloseTo(before.height, 0);
  });

  test('the rename input grows and shrinks with the text it holds', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.tab(0).dblclick();
    await expect(bar.renameInput).toBeVisible();

    const widthOf = async () => (await bar.renameInput.boundingBox())!.width;

    await bar.renameInput.fill('A');

    const short = await widthOf();

    await bar.renameInput.fill('A considerably longer sheet name');

    const long = await widthOf();

    expect(long).toBeGreaterThan(short);

    await bar.renameInput.fill('A');

    await expect.poll(widthOf).toBeLessThan(long);
  });

  test('the tab menu renames, duplicates, and deletes sheets', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await bar.chevron(0).click();
    await bar.menuItem('Rename').click();
    await bar.renameInput.fill('Budget');
    await bar.renameInput.press('Enter');
    await expect(bar.tabByName('Budget')).toBeVisible();

    await bar.chevronByName('Budget').click();
    await bar.menuItem('Duplicate').click();
    await expect(bar.tabByName('Budget (2)')).toBeVisible();

    // The copy is not the active sheet, so its menu is reached by right-click rather than by
    // one click on its trigger.
    await bar.tabByName('Budget (2)').click({ button: 'right' });
    await bar.menuItem('Delete').click();
    await expect(bar.tabByName('Budget (2)')).toHaveCount(0);
  });

  test('the all-sheets menu marks the sheet you are on', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    // The name without the mark's own character, which is hidden and carries `aria-hidden`.
    const marked = () => page.evaluate(() => Array.from(
      document.querySelectorAll('.htSheetsBarMenu .htItemWrapper'),
    ).filter(wrapper => wrapper.querySelector('.selected') !== null)
      .map(wrapper => (wrapper.textContent ?? '').replace(wrapper.querySelector('.selected')!.textContent ?? '', '')));

    await bar.allButton.click();
    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);

    // One mark, and it sits against the active sheet.
    expect(await marked()).toEqual(['Alpha']);

    // The mark is painted from a masked SVG rather than from the character, and the rule that
    // draws it lists the menus by class — so the sheets bar menu has to be on that list.
    const painted = await page.locator('.htSheetsBarMenu .htItemWrapper .selected').evaluate(
      element => getComputedStyle(element, '::after').webkitMaskImage,
    );

    expect(painted).toContain('svg');

    await page.keyboard.press('Escape');
    await bar.clickTab(2);
    await bar.allButton.click();
    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);

    expect(await marked()).toEqual(['Gamma']);
  });

  test('the all-sheets menu opens scrolled to the sheet you are on', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    for (let i = 0; i < 12; i += 1) {
      await bar.addButton.click();
    }

    const marked = () => page.evaluate(() => {
      const holder = document.querySelector('.htSheetsBarMenu .ht_master .wtHolder') as HTMLElement;
      const mark = document.querySelector('.htSheetsBarMenu .htItemWrapper .selected');
      const row = mark?.closest('td');

      if (!holder || !row) {
        return null;
      }

      const rowBox = row.getBoundingClientRect();
      const holderBox = holder.getBoundingClientRect();

      return {
        scrolled: holder.scrollTop > 0,
        withinView: rowBox.top >= holderBox.top - 1 && rowBox.bottom <= holderBox.bottom + 1,
      };
    });

    await bar.allButton.click();
    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);

    // The list scrolls past eight sheets, and the marked row is the one a reader opens it to
    // find — so on a long workbook it has to open already scrolled to it.
    expect(await marked()).toEqual({ scrolled: true, withinView: true });

    await page.keyboard.press('Escape');
    await bar.clickTab(0);
    await bar.allButton.click();
    await expect(page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);

    // The first sheet needs no scrolling to be seen.
    expect(await marked()).toEqual({ scrolled: false, withinView: true });
  });

  test('the paging arrows carry the same styling as the add and all-sheets buttons', async ({
    page, theme, bundle,
  }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    for (let i = 0; i < 10; i += 1) {
      await bar.addButton.click();
    }

    await expect(bar.pagingSection).toBeVisible();

    const look = (locator: typeof bar.addButton) => locator.evaluate((element) => {
      const styles = getComputedStyle(element);
      const box = element.getBoundingClientRect();

      return {
        background: styles.backgroundColor,
        border: styles.borderColor,
        radius: styles.borderRadius,
        padding: styles.padding,
        size: `${Math.round(box.width)}x${Math.round(box.height)}`,
      };
    });

    // The clicks above leave the pointer on the add button, which would measure its hover
    // colours against the others' resting ones.
    await page.mouse.move(0, 0);

    const reference = await look(bar.addButton);

    expect(await look(bar.allButton)).toEqual(reference);
    expect(await look(bar.pageNext)).toEqual(reference);

    // And the two clusters are spaced the same way, so they read as the same kind of control.
    const gaps = await page.evaluate(() => ({
      controls: getComputedStyle(document.querySelector('.ht-sheets-bar__controls')!).gap,
      paging: getComputedStyle(document.querySelector('.ht-sheets-bar__paging')!).gap,
    }));

    expect(gaps.paging).toBe(gaps.controls);
  });

  test('the all-sheets menu activates the chosen sheet', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();
    await bar.allButton.click();
    await bar.menuItem('Gamma').click();

    await bar.expectActiveTab(2);
    await bar.expectCell(0, 0, 'G1');
  });

  test('paging arrows appear once the tab strip overflows and scroll it on click', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    await expect(bar.pagingSection).toBeHidden();

    for (let i = 0; i < 10; i += 1) {
      await bar.addButton.click();
    }

    await expect(bar.pagingSection).toBeVisible();

    // Each added sheet became active, and the strip scrolled to keep it in view. Paging is
    // measured from a known resting position rather than from wherever that left it.
    await page.evaluate(() => {
      document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft = 0;
    });

    const scrollLeftBefore = await page.evaluate(
      () => document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft,
    );

    await bar.pageNext.click();

    await expect.poll(
      () => page.evaluate(() => document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft),
    ).toBeGreaterThan(scrollLeftBefore);

    const scrollLeftAfterNext = await page.evaluate(
      () => document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft,
    );

    await bar.pagePrev.click();

    await expect.poll(
      () => page.evaluate(() => document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft),
    ).toBeLessThan(scrollLeftAfterNext);
  });

  test('the paging arrows are disabled at each end of the strip', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    for (let i = 0; i < 10; i += 1) {
      await bar.addButton.click();
    }

    await expect(bar.pagingSection).toBeVisible();

    const scrollTo = (position: number) => page.evaluate((left) => {
      document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft = left;
    }, position);

    await scrollTo(0);

    await expect(bar.pagePrev).toBeDisabled();
    await expect(bar.pageNext).toBeEnabled();

    // Past the far end; the browser clamps it to the maximum offset.
    await scrollTo(100000);

    await expect(bar.pageNext).toBeDisabled();
    await expect(bar.pagePrev).toBeEnabled();
  });

  test('under RTL, the paging next arrow scrolls the strip toward negative scrollLeft', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto({ rtl: true });

    for (let i = 0; i < 10; i += 1) {
      await bar.addButton.click();
    }

    await expect(bar.pagingSection).toBeVisible();

    // Each added sheet became active, and the strip scrolled to keep it in view. Paging is
    // measured from a known resting position rather than from wherever that left it.
    await page.evaluate(() => {
      document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft = 0;
    });

    const scrollLeftBefore = await page.evaluate(
      () => document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft,
    );

    await bar.pageNext.click();

    await expect.poll(
      () => page.evaluate(() => document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft),
    ).toBeLessThan(scrollLeftBefore);
  });

  test('dragging a tab past its neighbour reorders the strip', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const names = () => page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab-label'),
    ).map(label => label.textContent));

    expect(await names()).toEqual(['Alpha', 'Beta', 'Gamma']);

    const first = (await bar.tab(0).boundingBox())!;
    const third = (await bar.tab(2).boundingBox())!;

    await page.mouse.move(first.x + (first.width / 2), first.y + (first.height / 2));
    await page.mouse.down();
    // Two moves: the first passes the threshold, the second carries the tab across.
    await page.mouse.move(first.x + first.width, first.y + (first.height / 2));
    await page.mouse.move(third.x + (third.width / 2) + 5, third.y + (third.height / 2));
    await page.mouse.up();

    await expect.poll(names).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  test('Escape during a drag leaves the order untouched', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const names = () => page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab-label'),
    ).map(label => label.textContent));

    const first = (await bar.tab(0).boundingBox())!;
    const third = (await bar.tab(2).boundingBox())!;

    await page.mouse.move(first.x + (first.width / 2), first.y + (first.height / 2));
    await page.mouse.down();
    await page.mouse.move(first.x + first.width, first.y + (first.height / 2));
    await page.mouse.move(third.x + (third.width / 2) + 5, third.y + (third.height / 2));

    // The drag must actually be live before Escape gets credit for restoring anything.
    await expect.poll(names).toEqual(['Beta', 'Gamma', 'Alpha']);

    await page.keyboard.press('Escape');
    await page.mouse.up();

    await expect.poll(names).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  test('the dragged tab travels with the pointer', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const first = (await bar.tab(0).boundingBox())!;
    const third = (await bar.tab(2).boundingBox())!;

    await page.mouse.move(first.x + (first.width / 2), first.y + (first.height / 2));
    await page.mouse.down();
    await page.mouse.move(first.x + first.width, first.y + (first.height / 2));

    // Well past the last slot's centre, so a tab that only swaps slots and a tab that follows
    // the pointer end up in visibly different places.
    const carriedTo = third.x + third.width + 20;
    const lastSlotCenter = third.x + (third.width / 2);

    await page.mouse.move(carriedTo, third.y + (third.height / 2));

    // The tab was grabbed at its centre, so its centre must stay under the pointer.
    await expect.poll(async() => {
      const box = (await bar.tab(2).boundingBox())!;
      const center = box.x + (box.width / 2);

      return {
        tracksPointer: Math.abs(center - carriedTo) < 6,
        leftItsSlot: Math.abs(center - lastSlotCenter) > 15,
      };
    }).toEqual({ tracksPointer: true, leftItsSlot: true });

    await expect(page.locator('.ht-sheets-bar')).toHaveClass(/ht-sheets-bar-dragging/);

    // The tabs sliding past the pointer must not light up their hover state, and the dragged
    // tab must not ease toward the pointer it is positioned from.
    await expect(bar.tab(0)).toHaveCSS('pointer-events', 'none');
    await expect(bar.tab(2)).toHaveCSS('transition-duration', '0s');

    // Opaque, so the tabs it crosses pass behind the dragged tab instead of showing through it.
    await expect(bar.tab(2)).toHaveCSS('opacity', '1');
    // No alpha channel in either notation: `rgb(r, g, b)` or the `color-mix()` result
    // `color(srgb r g b)`. A translucent surface would carry a `/ <alpha>` or read `rgba(`.
    await expect(bar.tab(2))
      .toHaveCSS('background-color', /^(rgb\([^/]+\)|color\(srgb [\d.]+ [\d.]+ [\d.]+\))$/);

    // Opaque, but still wearing the active tint — the dragged tab must not read as inactive
    // for the length of the gesture.
    const surfaces = await page.evaluate(() => Array.from(
      document.querySelectorAll('.ht-sheets-bar__tab'),
    ).map(tab => getComputedStyle(tab).backgroundColor));

    expect(surfaces[2]).not.toEqual(surfaces[0]);

    // The active tab's bottom-edge marker must survive the drag, alongside the drop shadow.
    await expect(bar.tab(2)).toHaveCSS('box-shadow', /inset/);

    await page.mouse.up();

    await expect(page.locator('body')).not.toHaveClass(/ht-sheets-bar-dragging/);
    await expect(bar.tab(0)).toHaveCSS('pointer-events', 'auto');
    await expect(bar.tab(0)).toHaveCSS('transition-duration', '0.15s');
  });

  test('a dragged tab keeps the hover surface it was picked up with', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    const surfaceOf = (locator: typeof bar.renameInput) => locator.evaluate(
      element => getComputedStyle(element).backgroundColor,
    );

    // The active tab is the one that needs proving: hovering it normally changes nothing,
    // because its hover surface is defined as its active surface.
    const resting = await surfaceOf(bar.tab(0));

    await bar.tab(0).hover();

    expect(await surfaceOf(bar.tab(0))).toEqual(resting);

    const box = (await bar.tab(0).boundingBox())!;
    const middle = box.y + (box.height / 2);

    await page.mouse.move(box.x + (box.width / 2), middle);
    await page.mouse.down();
    await page.mouse.move(box.x + (box.width / 2) + 10, middle);

    // The exact surface the rule promises: the active tint composited over the hover
    // background, rather than over the bar's plain one.
    const expected = await page.evaluate(() => {
      const strip = document.querySelector('.ht-sheets-bar') as HTMLElement;
      const tokens = getComputedStyle(strip);
      const probe = document.createElement('div');

      probe.style.backgroundColor = `color-mix(in srgb, ${
        tokens.getPropertyValue('--ht-sheets-bar-tab-active-background-color')} ${
        tokens.getPropertyValue('--ht-sheets-bar-tab-active-background-opacity')}, ${
        tokens.getPropertyValue('--ht-sheets-bar-tab-hover-background-color')})`;
      strip.appendChild(probe);

      const surface = getComputedStyle(probe).backgroundColor;

      probe.remove();

      return surface;
    });

    expect(expected).not.toEqual(resting);

    await expect.poll(
      () => surfaceOf(page.locator('.ht-sheets-bar__tab--dragging')),
    ).toEqual(expected);

    await page.mouse.up();
  });

  test('holding a dragged tab at the edge scrolls the strip', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    for (let i = 0; i < 10; i += 1) {
      await bar.addButton.click();
    }

    await expect(bar.pagingSection).toBeVisible();

    const scrollLeft = () => page.evaluate(
      () => document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft,
    );

    await page.evaluate(() => {
      document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft = 0;
    });

    const strip = (await page.locator('.ht-sheets-bar__tabs').boundingBox())!;
    const first = (await bar.tab(0).boundingBox())!;
    const middle = first.y + (first.height / 2);

    await page.mouse.move(first.x + (first.width / 2), middle);
    await page.mouse.down();
    await page.mouse.move(first.x + first.width, middle);
    // Parked just inside the strip's trailing edge, and held there — the pointer stops moving,
    // so only the auto-scroll can carry the strip any further.
    await page.mouse.move(strip.x + strip.width - 4, middle);

    await expect.poll(scrollLeft).toBeGreaterThan(0);

    await page.mouse.up();
  });

  test('activating a sheet scrolls its tab into view', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    for (let i = 0; i < 10; i += 1) {
      await bar.addButton.click();
    }

    // Each added sheet becomes the active one, so the strip has already had to follow the
    // additions out past its trailing edge.
    await expect.poll(
      () => page.evaluate(() => document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft),
    ).toBeGreaterThan(0);

    await bar.allButton.click();
    await bar.menuItem('Alpha').click();

    // Back to the first tab, which sits at the very start of the strip.
    await expect.poll(
      () => page.evaluate(() => document.querySelector('.ht-sheets-bar__tabs')!.scrollLeft),
    ).toBe(0);
  });

  test('a plain click still activates and a double-click still renames', async ({ page, theme, bundle }) => {
    const bar = new SheetsBarPage(page, theme, bundle);

    await bar.goto();

    // A press that moves less than the drag threshold must not enter the dragging state,
    // so the class it would carry never appears.
    const tabBox = (await bar.tab(1).boundingBox())!;

    await page.mouse.move(tabBox.x + (tabBox.width / 2), tabBox.y + (tabBox.height / 2));
    await page.mouse.down();
    await page.mouse.move(tabBox.x + (tabBox.width / 2) + 2, tabBox.y + (tabBox.height / 2));

    await expect(bar.tab(1)).not.toHaveClass(/ht-sheets-bar__tab--dragging/);

    await page.mouse.up();

    await bar.tab(1).click();

    await expect(bar.tab(1)).toHaveClass(/ht-sheets-bar__tab--active/);

    await bar.tab(1).dblclick();

    await expect(bar.renameInput).toBeVisible();
  });
});
