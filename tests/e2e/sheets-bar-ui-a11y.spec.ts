import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarUiPage } from '../fixtures/pages/SheetsBarUiPage';
import type { Locator, Page } from '@playwright/test';

/**
 * Reads a one-pixel line along one edge of an element, inset from its corners.
 *
 * @param {Locator} element The element.
 * @param {'top' | 'bottom'} edge The edge to read.
 * @returns {Promise<Buffer>} The pixels.
 */
async function edgePixels(element: Locator, edge: 'top' | 'bottom'): Promise<Buffer> {
  const box = await element.boundingBox();

  expect(box, 'the element is laid out').not.toBeNull();

  const { x, y, height } = box!;

  return element.page().screenshot({
    clip: { x: x + 4, y: edge === 'top' ? y : y + height - 1, width: 16, height: 1 },
    animations: 'disabled',
  });
}

/**
 * Counts how often the paging section is shown or hidden over ten animation frames.
 *
 * @param {Page} page The page.
 * @returns {Promise<number>} The number of `hidden` attribute changes.
 */
function pagingToggles(page: Page): Promise<number> {
  return page.evaluate(() => new Promise<number>((resolve) => {
    const paging = document.querySelector('.ht-sheets-bar__paging') as HTMLElement;
    let toggles = 0;
    let frames = 0;
    const observer = new MutationObserver((records) => {
      toggles += records.length;
    });
    const tick = () => {
      frames += 1;

      if (frames < 10) {
        requestAnimationFrame(tick);
      } else {
        observer.disconnect();
        resolve(toggles);
      }
    };

    observer.observe(paging, { attributes: true, attributeFilter: ['hidden'] });
    requestAnimationFrame(tick);
  }));
}

test.describe('sheets bar UI and accessibility', { tag: THEMES_TAG }, () => {
  test('the tab menu trigger is a 24 by 24 px target', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();

    const hits = await fixture.chevron(0).evaluate((chevron) => {
      const box = chevron.getBoundingClientRect();
      const centerX = box.left + (box.width / 2);
      const centerY = box.top + (box.height / 2);
      const points = [[-11, 0], [11, 0], [0, -11], [0, 11]];

      return points.map(([dx, dy]) => {
        const hit = document.elementFromPoint(centerX + dx, centerY + dy);

        return hit !== null && chevron.contains(hit);
      });
    });

    expect(hits).toEqual([true, true, true, true]);
  });

  test('the tab menu and the all-sheets menu hang from their anchor in RTL', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ rtl: true });

    const edges = async(anchor: Locator) => anchor.evaluate((element) => {
      const menu = [...document.querySelectorAll<HTMLElement>('.htSheetsBarMenu')]
        .find(candidate => candidate.offsetParent !== null) as HTMLElement;

      return { anchorEnd: element.getBoundingClientRect().right, menuEnd: menu.getBoundingClientRect().right };
    });

    await fixture.chevron(0).click();
    await expect(fixture.openMenu).toBeVisible();

    const tabMenu = await edges(fixture.chevron(0));

    expect(Math.abs(tabMenu.menuEnd - tabMenu.anchorEnd)).toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(fixture.openMenu).toHaveCount(0);
    await fixture.allButton.click();
    await expect(fixture.openMenu).toBeVisible();

    const allSheetsMenu = await edges(fixture.allButton);

    expect(Math.abs(allSheetsMenu.menuEnd - allSheetsMenu.anchorEnd)).toBeLessThanOrEqual(1);
  });

  test('the all-sheets menu is named and offers its sheets as a single choice', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();
    await fixture.allButton.click();

    await expect(page.getByRole('menu', { name: 'All sheets' })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: 'Sheet 1' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('menuitemradio', { name: 'Sheet 2' })).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByRole('menuitemcheckbox')).toHaveCount(0);
  });

  test('the strip is one Tab stop, and the arrow keys move it', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ sheets: 30 });
    await fixture.allButton.focus();
    await page.keyboard.press('Tab');
    await expect(fixture.activeTab).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('.ht-sheets-bar__tab:focus')).toHaveCount(0);

    await page.keyboard.press('Shift+Tab');
    await expect(fixture.activeTab).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(fixture.tab(1)).toBeFocused();
    await expect(fixture.tab(1)).toHaveAttribute('tabindex', '0');
    await expect(fixture.tab(0)).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('Tab');
    await expect(page.locator('.ht-sheets-bar__tab:focus')).toHaveCount(0);
    await page.keyboard.press('Shift+Tab');
    await expect(fixture.activeTab).toBeFocused();
    await expect(fixture.tab(0)).toHaveAttribute('tabindex', '0');
    await expect(fixture.tab(1)).toHaveAttribute('tabindex', '-1');
  });

  test('the grid is named after the sheet it shows', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto();
    await expect(page.getByRole('treegrid', { name: 'Sheet 1' })).toBeAttached();

    await fixture.tab(1).click();
    await expect(page.getByRole('treegrid', { name: 'Sheet 2' })).toBeAttached();

    await fixture.tab(1).locator('.ht-sheets-bar__tab-label').dblclick();
    await fixture.renameInput.fill('Budget');
    await expect(page.getByRole('treegrid', { name: 'Sheet 2' })).toBeAttached();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('treegrid', { name: 'Budget' })).toBeAttached();

    await fixture.tab(1).locator('.ht-sheets-bar__tab-label').dblclick();
    await fixture.renameInput.fill('Draft');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('treegrid', { name: 'Budget' })).toBeAttached();
  });

  test('turning the bar off takes its name off the grid', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);
    const labelledBy = () => page.evaluate(() => (window as any).hot.rootElement.getAttribute('aria-labelledby'));

    await fixture.goto();
    await expect.poll(labelledBy).not.toBeNull();

    await page.evaluate(() => (window as any).hot.updateSettings({ sheetsBar: false }));

    await expect.poll(labelledBy).toBeNull();
  });

  test('with ariaTags off the bar writes no names or roles', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ ariaTags: false });

    expect(await page.evaluate(() => (window as any).hot.rootElement.hasAttribute('aria-labelledby'))).toBe(false);

    await fixture.allButton.click();
    await expect(fixture.openMenu).toBeVisible();
    await expect(fixture.openMenu).not.toHaveAttribute('aria-label', /./);
    await expect(fixture.openMenu.locator('[role="menuitemradio"]')).toHaveCount(0);
  });

  test('a bar in a custom container carries the grid theme class', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ uiContainer: true });

    await expect(fixture.bar).toHaveClass(new RegExp(`\\bht-theme-${theme}\\b`));
  });

  test('a name the host gave the grid is kept', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ hostLabel: 'Quarterly report' });
    await expect(page.getByRole('treegrid', { name: 'Quarterly report' })).toBeAttached();

    await fixture.tab(1).click();
    await expect(page.getByRole('treegrid', { name: 'Quarterly report' })).toBeAttached();
  });

  test('duplicating and moving a sheet from its menu is announced politely', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);
    const politeRegion = page.locator('[aria-live="polite"]');

    await fixture.goto();
    await fixture.chevron(0).click();
    await fixture.menuItem('Duplicate').click();

    const copyName = await page.evaluate(() => (window as any).hot.getPlugin('sheetsBar').getSheets()[1].name);

    await expect(politeRegion).toContainText(`Sheet Sheet 1 duplicated as ${copyName}`);

    await fixture.chevron(0).click();
    await fixture.menuItem('Move right').click();
    await expect(politeRegion).toContainText('Sheet Sheet 1 moved to position 2 of 4');
  });

  test('a refused rename is announced for the reason it was refused', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);
    const assertiveRegion = page.locator('[aria-live="assertive"]');

    await fixture.goto();
    await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
    await fixture.renameInput.fill('Sheet 2');
    await page.keyboard.press('Enter');

    await expect(assertiveRegion).toContainText('Sheet name not changed: Sheet 2 is already in use');

    await page.evaluate(() => (window as any).hot.addHook('beforeSheetTabRename', () => false));
    await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
    await fixture.renameInput.fill('Fresh');
    await page.keyboard.press('Enter');

    await expect(assertiveRegion).toHaveText('Sheet name not changed');
    await expect(fixture.tab(0)).toHaveText('Sheet 1');
  });

  test('the bar follows the colorScheme and density of its grid', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ colorScheme: 'dark', density: 'compact' });

    const tokens = await fixture.bar.evaluate((bar) => {
      const wrapper = bar.closest('.ht-root-wrapper') as HTMLElement;
      const read = (element: Element, name: string) => getComputedStyle(element).getPropertyValue(name).trim();

      return {
        bar: [read(bar, '--ht-background-color'), read(bar, '--ht-cell-vertical-padding')],
        grid: [read(wrapper, '--ht-background-color'), read(wrapper, '--ht-cell-vertical-padding')],
      };
    });

    expect(tokens.bar).toEqual(tokens.grid);
  });

  test('the bar and Pagination in a uiContainer follow the colorScheme and density of their grid', async({ page, theme, bundle }) => {
    const fixture = new SheetsBarUiPage(page, theme, bundle);

    await fixture.goto({ uiContainer: true, pagination: true, colorScheme: 'dark', density: 'compact' });

    const pagination = page.getByTestId('outside-pagination').locator('.ht-pagination');
    const read = (element: Element) => {
      const wrapper = document.querySelector('.ht-root-wrapper') as HTMLElement;
      const style = (target: Element) => getComputedStyle(target);

      return {
        colorScheme: style(element).colorScheme,
        tokens: [style(element).getPropertyValue('--ht-background-color').trim(),
          style(element).getPropertyValue('--ht-cell-vertical-padding').trim()],
        gridTokens: [style(wrapper).getPropertyValue('--ht-background-color').trim(),
          style(wrapper).getPropertyValue('--ht-cell-vertical-padding').trim()],
      };
    };

    await expect(pagination).toBeAttached();

    for (const element of [fixture.bar, pagination]) {
      const styles = await element.evaluate(read);

      expect(styles.colorScheme).toBe('dark');
      expect(styles.tokens).toEqual(styles.gridTokens);
    }
  });

  test.describe('the tab strip', () => {
    test('scrolls as a whole on a table narrower than its minimum, and stays as wide as the table', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);
      const tabNames = Array.from({ length: 6 }, (_, index) => `Quarterly report ${index + 1}`);
      const readLayout = () => page.evaluate(() => {
        const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;
        const barBox = bar.getBoundingClientRect();
        const strip = bar.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
        const active = bar.querySelector('.ht-sheets-bar__tab--active') as HTMLElement;
        const sheet1 = active.cloneNode(true) as HTMLElement;
        const table = (document.querySelector('.ht_master .htCore') as HTMLElement).getBoundingClientRect();
        const root = document.scrollingElement as HTMLElement;

        (sheet1.querySelector('.ht-sheets-bar__tab-label') as HTMLElement).textContent = 'Sheet1';
        strip.appendChild(sheet1);

        const sheet1Width = sheet1.getBoundingClientRect().width;

        sheet1.remove();

        return {
          minimum: (bar.querySelector('.ht-sheets-bar__inner') as HTMLElement).scrollWidth,
          clientWidth: bar.clientWidth,
          barWidth: Math.round(barBox.width),
          slotWidth: bar.parentElement!.clientWidth,
          barRightPastTable: Math.round(barBox.right - table.right),
          scrolls: bar.scrollWidth > bar.clientWidth,
          stripWidth: strip.clientWidth,
          sheet1Width,
          pageScrollsSideways: root.scrollWidth > root.clientWidth,
          paginationWidth: Math.round((document.querySelector('.ht-pagination') as HTMLElement).getBoundingClientRect().width),
        };
      });
      const paintedBehind = (selector: string) => page.evaluate((target) => {
        const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;
        const box = (bar.querySelector(target) as HTMLElement).getBoundingClientRect();
        const behind = document.elementsFromPoint(box.left + (box.width / 2), box.top + (box.height / 2))
          .filter(element => bar.contains(element) && element !== bar.querySelector(target)
            && !(bar.querySelector(target) as HTMLElement).contains(element));

        return behind.some(element => !['transparent', 'rgba(0, 0, 0, 0)']
          .includes(getComputedStyle(element).backgroundColor));
      }, selector);
      const scrollBarTo = (end: boolean) => page.evaluate((toEnd) => {
        const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;

        bar.scrollLeft = toEnd ? bar.scrollWidth : 0;
      }, end);

      await fixture.goto({
        sheets: 6, tabNames, columnCounts: [1, 3, 25, 4, 4, 4], fixedHeight: false, pagination: true,
      });

      const minimum = (await readLayout()).minimum;

      for (const index of [0, 1]) {
        await fixture.setActiveSheet(index);
        await expect(fixture.bar.locator('.ht-sheets-bar__paging')).toBeVisible();

        const layout = await readLayout();

        expect(layout.barWidth).toBe(layout.slotWidth);
        expect(layout.barRightPastTable).toBeLessThanOrEqual(0);
        expect(layout.scrolls).toBe(layout.clientWidth < minimum);
        expect(await page.evaluate(() => {
          const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;

          return { overflowsDown: bar.scrollHeight > bar.clientHeight, overflowY: getComputedStyle(bar).overflowY };
        })).toEqual({ overflowsDown: false, overflowY: 'hidden' });
        expect(layout.stripWidth).toBeGreaterThanOrEqual(Math.floor(layout.sheet1Width));
        expect(layout.pageScrollsSideways).toBe(false);
        expect(Math.abs(layout.paginationWidth - layout.slotWidth)).toBeLessThanOrEqual(1);
        expect(await pagingToggles(page)).toBe(0);

        await scrollBarTo(true);

        expect(await fixture.controlWhollyInBar('.ht-sheets-bar__page-next')).toBe(true);
        expect(await paintedBehind('.ht-sheets-bar__page-next')).toBe(true);

        await fixture.activeTab.focus();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Shift+Tab');
        await expect(fixture.addButton).toBeFocused();
        expect(await fixture.controlWhollyInBar('.ht-sheets-bar__add')).toBe(true);

        await scrollBarTo(false);

        await fixture.activeTab.focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await expect(fixture.bar.locator('.ht-sheets-bar__page-next')).toBeFocused();
        expect(await fixture.controlWhollyInBar('.ht-sheets-bar__page-next')).toBe(true);
      }

      await fixture.setActiveSheet(2);

      const wide = await readLayout();

      expect(wide.barWidth).toBe(wide.slotWidth);
      expect(wide.scrolls).toBe(false);
    });

    [false, true].forEach((rtl) => {
      test(`keeps every tab the arrow keys reach wholly in view in a bar that scrolls${rtl ? ' (RTL)' : ''}`, async({
        page, theme, bundle,
      }) => {
        const fixture = new SheetsBarUiPage(page, theme, bundle);
        const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
        const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

        await fixture.goto({
          sheets: 12,
          rtl,
          tabNames: Array.from({ length: 12 }, (_, index) => `S${index + 1}`),
          columnCounts: Array(12).fill(1),
          fixedHeight: false,
        });
        await expect.poll(() => page.evaluate(() => {
          const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;

          return bar.scrollWidth > bar.clientWidth;
        })).toBe(true);
        await fixture.activeTab.focus();

        for (let index = 1; index < 12; index += 1) {
          await page.keyboard.press(forward);
          await expect(fixture.tab(index)).toBeFocused();
          await expect.poll(() => fixture.tabWhollyInBar(index), `tab ${index} going forward`).toBe(true);
        }

        for (let index = 10; index >= 0; index -= 1) {
          await page.keyboard.press(backward);
          await expect(fixture.tab(index)).toBeFocused();
          await expect.poll(() => fixture.tabWhollyInBar(index), `tab ${index} going back`).toBe(true);
        }
      });
    });

    test('activates a tab clicked where the bar\'s edge cuts it, and does not scroll the bar', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({
        sheets: 12,
        tabNames: Array.from({ length: 12 }, (_, index) => `S${index + 1}`),
        columnCounts: Array(12).fill(1),
        fixedHeight: false,
      });

      const target = await page.evaluate(() => {
        const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;
        const strip = bar.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
        const tabs = Array.from(bar.querySelectorAll('.ht-sheets-bar__tab')) as HTMLElement[];
        const cutTab = () => {
          const right = bar.getBoundingClientRect().left + bar.clientLeft + bar.clientWidth;
          const stripBox = strip.getBoundingClientRect();

          return tabs.findIndex((tab) => {
            const box = tab.getBoundingClientRect();

            return !tab.classList.contains('ht-sheets-bar__tab--active')
              && box.left >= stripBox.left && box.left < right - 4 && box.right > right;
          });
        };

        for (let stripScroll = 0; stripScroll <= strip.scrollWidth; stripScroll += 4) {
          strip.scrollLeft = stripScroll;

          for (let barScroll = 0; barScroll <= bar.scrollWidth - bar.clientWidth; barScroll += 1) {
            bar.scrollLeft = barScroll;

            const index = cutTab();

            if (index > -1) {
              const box = tabs[index].getBoundingClientRect();

              return { index, x: box.left + 2, y: box.top + (box.height / 2), scrollLeft: bar.scrollLeft };
            }
          }
        }

        return { index: -1, x: 0, y: 0, scrollLeft: 0 };
      });

      expect(target.index).toBeGreaterThan(-1);

      await page.mouse.click(target.x, target.y);

      await expect(fixture.tab(target.index)).toHaveClass(/ht-sheets-bar__tab--active/);
      expect(await page.evaluate(() => (document.querySelector('.ht-sheets-bar') as HTMLElement).scrollLeft))
        .toBe(target.scrollLeft);
    });

    test.describe('the tabs pane\'s minimum is the widest tab', () => {
      const tabNames = ['Regional breakdown', 'Q1', 'Summary of the whole year', 'North', 'Budget 2026', 'East'];
      const readMinimum = (page: Page) => page.evaluate(() => {
        const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;
        const strip = bar.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
        const tabs = Array.from(strip.querySelectorAll('.ht-sheets-bar__tab')) as HTMLElement[];

        return {
          minimum: (bar.querySelector('.ht-sheets-bar__inner') as HTMLElement).scrollWidth,
          strip: strip.clientWidth,
          widestTab: Math.max(...tabs.map(tab => tab.getBoundingClientRect().width)),
        };
      });

      [false, true].forEach((rtl) => {
        test(`keeps every tab whole in the strip and in a bar that scrolls${rtl ? ' (RTL)' : ''}`, async({
          page, theme, bundle,
        }) => {
          const fixture = new SheetsBarUiPage(page, theme, bundle);
          const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
          const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

          await fixture.goto({ sheets: 6, rtl, tabNames, columnCounts: Array(6).fill(4), fixedHeight: false });

          const layout = await readMinimum(page);

          expect(layout.strip).toBeGreaterThanOrEqual(Math.floor(layout.widestTab));
          expect(await page.evaluate(() => {
            const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;

            return bar.scrollWidth > bar.clientWidth && bar.clientWidth > 250;
          })).toBe(true);

          await fixture.activeTab.focus();

          for (let index = 1; index < 6; index += 1) {
            await page.keyboard.press(forward);
            await expect(fixture.tab(index)).toBeFocused();
            await expect.poll(() => fixture.tabWhollyInStrip(index), `tab ${index} in the strip`).toBe(true);
            await expect.poll(() => fixture.tabWhollyInBar(index), `tab ${index} in the bar`).toBe(true);
          }

          for (let index = 4; index >= 0; index -= 1) {
            await page.keyboard.press(backward);
            await expect(fixture.tab(index)).toBeFocused();
            await expect.poll(() => fixture.tabWhollyInStrip(index), `tab ${index} in the strip`).toBe(true);
            await expect.poll(() => fixture.tabWhollyInBar(index), `tab ${index} in the bar`).toBe(true);
          }
        });
      });

      test('grows with a longer name and shrinks when the widest tab goes', async({ page, theme, bundle }) => {
        const fixture = new SheetsBarUiPage(page, theme, bundle);

        await fixture.goto({ sheets: 6, tabNames, columnCounts: Array(6).fill(1), fixedHeight: false });

        const before = await readMinimum(page);

        await page.evaluate(() => {
          const plugin = (window as any).hot.getPlugin('sheetsBar');

          plugin.renameSheet(plugin.getSheets()[1].id, 'A much longer name than any other tab here');
        });

        const grown = await readMinimum(page);

        expect(grown.minimum).toBeGreaterThan(before.minimum);
        expect(grown.strip).toBeGreaterThanOrEqual(Math.floor(grown.widestTab));

        await page.evaluate(() => {
          const plugin = (window as any).hot.getPlugin('sheetsBar');

          plugin.removeSheet(plugin.getSheets()[1].id);
        });

        expect((await readMinimum(page)).minimum).toBe(before.minimum);
      });
    });

    test('stays inside a container narrower than its minimum', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({
        sheets: 6,
        tabNames: Array.from({ length: 6 }, (_, index) => `Quarterly report ${index + 1}`),
        columnCounts: [4, 4, 4, 4, 4, 4],
        fixedHeight: false,
      });
      await page.evaluate(() => {
        (document.querySelector('[data-testid="host"]') as HTMLElement).style.width = '180px';
        (window as any).hot.render();
      });

      await expect.poll(() => page.evaluate(() => {
        const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;
        const wrapper = document.querySelector('.ht-root-wrapper') as HTMLElement;

        return {
          scrolls: bar.scrollWidth > bar.clientWidth,
          insideContainer: bar.getBoundingClientRect().right <= wrapper.getBoundingClientRect().right + 1,
        };
      })).toEqual({ scrolls: true, insideContainer: true });
      expect(await pagingToggles(page)).toBe(0);


      await page.evaluate(() => {
        const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;

        bar.scrollLeft = bar.scrollWidth;
      });
      expect(await fixture.controlWhollyInBar('.ht-sheets-bar__add')).toBe(false);
      await fixture.activeTab.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(fixture.addButton).toBeFocused();
      expect(await fixture.controlWhollyInBar('.ht-sheets-bar__add')).toBe(true);

      await page.evaluate(() => {
        (document.querySelector('.ht-sheets-bar') as HTMLElement).scrollLeft = 0;
      });
      expect(await fixture.controlWhollyInBar('.ht-sheets-bar__page-next')).toBe(false);
      await fixture.activeTab.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(fixture.bar.locator('.ht-sheets-bar__page-next')).toBeFocused();
      expect(await fixture.controlWhollyInBar('.ht-sheets-bar__page-next')).toBe(true);
    });

    test('reveals the active tab on first paint', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({ sheets: 30, activeSheet: 25 });
      await expect.poll(() => fixture.tabInStrip(25)).toBe(true);
    });

    test('reveals the active tab on first paint when the grid applies its theme itself', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({ sheets: 30, activeSheet: 25, colorScheme: 'light' });
      await expect.poll(() => fixture.tabInStrip(25)).toBe(true);
    });

    test('keeps the active tab in view when a theme change shrinks the tabs', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({ sheets: 30, activeSheet: 22, colorScheme: 'light' });
      await expect.poll(() => fixture.tabInStrip(22)).toBe(true);

      const tabWidth = () => fixture.tab(0).evaluate(tab => (tab as HTMLElement).offsetWidth);
      const wideWidth = await tabWidth();

      await page.addStyleTag({
        content: '.handsontable.ht-sheets-bar .ht-sheets-bar__tabs .ht-sheets-bar__tab-label { font-size: 6px; }',
      });
      await expect.poll(tabWidth).toBeLessThan(wideWidth * 0.8);
      await page.evaluate(() => (window as any).hot.updateSettings({ density: 'compact' }));

      await expect.poll(() => fixture.tabInStrip(22)).toBe(true);
    });

    test('keeps a strip the user paged when the theme changes the size of the tabs', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({ sheets: 30, activeSheet: 25, colorScheme: 'light' });
      await expect.poll(() => fixture.tabInStrip(25)).toBe(true);
      await fixture.strip.evaluate((strip) => { strip.scrollLeft = 0; });

      const tabWidth = () => fixture.tab(0).evaluate(tab => (tab as HTMLElement).offsetWidth);
      const comfortableWidth = await tabWidth();

      await page.evaluate(() => (window as any).hot.updateSettings({ density: 'compact' }));

      await expect.poll(tabWidth).not.toBe(comfortableWidth);
      await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }));
      expect(await fixture.strip.evaluate(strip => strip.scrollLeft)).toBe(0);
      expect(await fixture.tabInStrip(25)).toBe(false);
    });

    test('reveals a tab activated while the grid was hidden once it is shown', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto({ sheets: 30, hidden: true });
      await fixture.setActiveSheet(25);
      await fixture.showHost();
      await expect.poll(() => fixture.tabInStrip(25)).toBe(true);
    });

    [false, true].forEach((rtl) => {
      test(`reveals every tab the arrow keys move the focus to${rtl ? ' (RTL)' : ''}`, async({ page, theme, bundle }) => {
        const fixture = new SheetsBarUiPage(page, theme, bundle);
        const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
        const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

        const tabNames = Array.from({ length: 30 }, (_, index) => `${'Wide'.repeat((index % 4) + 1)} ${index + 1}`);

        await fixture.goto({ sheets: 30, rtl, tabNames });
        await fixture.activeTab.focus();

        /**
         * Presses a key that moves the focus to a tab, then checks the tab is wholly in the strip and, when the
         * strip scrolled to reveal it, that it sits flush with the strip edge it came in at.
         *
         * @param {string} key The key.
         * @param {number} index The tab the key moves the focus to.
         * @param {string} label What the step is, for the failure message.
         */
        const step = async(key: string, index: number, label: string) => {
          const scrollBefore = await fixture.stripScrollLeft();

          await page.keyboard.press(key);
          await expect(fixture.tab(index)).toBeFocused();
          await expect.poll(() => fixture.tabWhollyInStrip(index), `tab ${index} ${label}`).toBe(true);

          if (await fixture.stripScrollLeft() !== scrollBefore) {
            expect(await fixture.tabGapToStripEdge(index), `gap before tab ${index} ${label}`).toBeLessThanOrEqual(1);
          }
        };

        for (let index = 1; index < 30; index += 1) {
          await step(forward, index, 'going forward');
        }

        for (let index = 28; index >= 0; index -= 1) {
          await step(backward, index, 'going back');
        }

        await step('End', 29, 'after End');
      });
    });

    test('a rename stays open and focused while another sheet moves past it', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);
      const errors: string[] = [];

      page.on('pageerror', error => errors.push(error.message));
      await fixture.goto({ sheets: 4 });
      await fixture.tab(1).locator('.ht-sheets-bar__tab-label').dblclick();
      await fixture.renameInput.fill('XY');
      await page.evaluate(() => {
        const plugin = (window as any).hot.getPlugin('sheetsBar');

        plugin.moveSheetToIndex(plugin.getSheets()[0].id, 3);
      });

      await expect(fixture.renameInput).toBeFocused();
      await page.keyboard.type('Z');
      await page.keyboard.press('Enter');

      await expect(fixture.tab(0)).toHaveText('XYZ');
      expect(await page.evaluate(() => (window as any).hot.getPlugin('sheetsBar').getSheets().map((sheet: any) => sheet.name)))
        .toEqual(['XYZ', 'Sheet 3', 'Sheet 4', 'Sheet 1']);
      expect(errors).toEqual([]);
    });

    test('a press on another tab during a rename commits the name and switches', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
      await fixture.renameInput.fill('Draft');
      await fixture.tab(1).click();

      await expect(fixture.tab(0)).toHaveText('Draft');
      await expect(fixture.tab(1)).toHaveClass(/ht-sheets-bar__tab--active/);
    });

    test('a press on another tab\'s label during a rename that widens the tab commits the name and switches', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await fixture.renameSheets(['S0', 'S1', 'S2']);
      await fixture.label(0).dblclick();
      await fixture.renameInput.fill('Budget');
      await fixture.label(2).click();

      await expect(fixture.tab(2)).toHaveClass(/ht-sheets-bar__tab--active/);
      expect(await fixture.sheetStates()).toEqual(['Budget', 'S1', 'S2*']);
    });

    test('a press on another tab\'s label during a rename that narrows the tab commits the name and switches', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await fixture.renameSheets(['Quarterly budget', 'S1', 'S2']);
      await fixture.label(0).dblclick();
      await fixture.renameInput.fill('Q');
      await fixture.label(2).click();

      await expect(fixture.tab(2)).toHaveClass(/ht-sheets-bar__tab--active/);
      expect(await fixture.sheetStates()).toEqual(['Q', 'S1', 'S2*']);
    });

    test('a press on another tab\'s label during a rename to a taken name keeps the names and switches', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await fixture.renameSheets(['Budget-long-name', 'S1', 'S2']);
      await fixture.label(0).dblclick();
      await fixture.renameInput.fill('S1');
      await fixture.label(2).click();

      await expect(fixture.tab(2)).toHaveClass(/ht-sheets-bar__tab--active/);
      expect(await fixture.sheetStates()).toEqual(['Budget-long-name', 'S1', 'S2*']);
    });

    [
      { title: 'a taken one-character name', names: ['A', 'B', 'C'], draft: 'C', states: ['A', 'B*', 'C'] },
      { title: 'a new one-character name', names: ['A', 'B', 'C'], draft: 'Z', states: ['Z', 'B*', 'C'] },
      { title: 'a blank name', names: ['A', 'B', 'C'], draft: '', states: ['A', 'B*', 'C'] },
      { title: 'a one-character name from a long one', names: ['Quarterly budget', 'B', 'C'], draft: 'x',
        states: ['x', 'B*', 'C'] },
    ].forEach(({ title, names, draft, states }) => {
      test(`a press near the end of the next tab during a rename to ${title} switches to it`, async({
        page, theme, bundle,
      }) => {
        const fixture = new SheetsBarUiPage(page, theme, bundle);

        await fixture.goto();
        await fixture.renameSheets(names);
        await fixture.label(0).dblclick();
        await fixture.renameInput.fill(draft);
        await fixture.clickNearTabEnd(1);

        await expect(fixture.tab(1)).toHaveClass(/ht-sheets-bar__tab--active/);
        expect(await fixture.sheetStates()).toEqual(states);
      });
    });

    test('a tab click whose afterSheetTabStateRestore listener destroys the grid throws nothing', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);
      const errors: string[] = [];

      page.on('pageerror', error => errors.push(error.message));
      await fixture.goto();
      await fixture.tab(1).click();
      await expect(fixture.tab(1)).toHaveClass(/ht-sheets-bar__tab--active/);
      await fixture.tab(0).click();
      await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--active/);
      await fixture.destroyGridOnStateRestore();
      await fixture.tab(1).click();

      await expect.poll(() => fixture.isDestroyed()).toBe(true);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(errors).toEqual([]);
    });

    test('a repaint the rename did not cause keeps the name being typed', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
      await fixture.renameInput.fill('Draft');
      await page.evaluate(() => (window as any).hot.getPlugin('sheetsBar').addSheet('Added'));

      await expect(fixture.renameInput).toHaveValue('Draft');
      await expect(fixture.renameInput).toBeFocused();
    });

    test('a selection cleared by an outside click or the API stays cleared after a round trip', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);
      const selected = () => page.evaluate(() => (window as any).hot.getSelected() ?? null);

      await fixture.goto();
      await page.evaluate(() => (window as any).hot.selectCell(1, 1));
      await page.mouse.click(2, 2);
      await expect.poll(selected).toBeNull();

      await fixture.tab(1).click();
      await fixture.tab(0).click();
      await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--active/);
      expect(await selected()).toBeNull();

      await page.evaluate(() => {
        (window as any).hot.selectCell(2, 2);
        (window as any).hot.deselectCell();
      });
      await fixture.tab(1).click();
      await fixture.tab(0).click();
      await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--active/);
      expect(await selected()).toBeNull();
    });

    test('a cell selected before Tab moved the focus into the bar comes back with its sheet', async({
      page, theme, bundle,
    }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await page.evaluate(() => (window as any).hot.selectCell(5, 3));
      await page.keyboard.press('Tab');
      await expect(fixture.addButton).toBeFocused();

      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(fixture.activeTab).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      await expect(fixture.tab(1)).toHaveClass(/ht-sheets-bar__tab--active/);

      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Enter');
      await expect(fixture.tab(0)).toHaveClass(/ht-sheets-bar__tab--active/);
      await expect.poll(() => page.evaluate(() => (window as any).hot.getSelected())).toEqual([[5, 3, 5, 3]]);
    });
  });

  test.describe('forced colors', () => {
    test.beforeEach(async({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });
    });

    test('the active tab keeps a visible marker', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();

      expect(await edgePixels(fixture.tab(0), 'bottom'))
        .not.toEqual(await edgePixels(fixture.tab(1), 'bottom'));
    });

    test('the rename field keeps a visible edge', async({ page, theme, bundle }) => {
      const fixture = new SheetsBarUiPage(page, theme, bundle);

      await fixture.goto();
      await fixture.tab(0).locator('.ht-sheets-bar__tab-label').dblclick();
      await expect(fixture.renameInput).toBeFocused();

      expect(await edgePixels(fixture.tab(0), 'top'))
        .not.toEqual(await edgePixels(fixture.tab(1), 'top'));
    });
  });
});
