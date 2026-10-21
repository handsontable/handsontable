import { type Locator, expect } from '@playwright/test';
import { IconElementsPage } from './IconElementsPage';

/**
 * Page object for `icon-elements-misc.spec.ts`: the icon-elements fixture plus the flows that
 * spec drives - an external icon renderer on the collapsible indicator, the pagination
 * navigation buttons, and the sheets-bar all-sheets menu.
 */
export class IconElementsMiscPage extends IconElementsPage {
  /**
   * The collapsible nested-header indicator in the visible top clone.
   */
  collapsibleIndicator(): Locator {
    return this.page.locator('.ht_clone_top .collapsibleIndicator');
  }

  /**
   * Maps `collapseOff` to a renderer that inserts an inline-block child - the shape a ligature
   * font or an inline-SVG renderer produces. Inline content is what an inherited `text-indent`
   * displaces; a mask icon has none.
   */
  async mapCollapseOffToInlineRenderer(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { Handsontable: any }).Handsontable.themes.getTheme('icons-tabler')
        .params({
          icons: {
            collapseOff: (element: HTMLElement) => {
              const glyph = document.createElement('span');

              glyph.className = 'renderer-glyph';
              glyph.textContent = 'v';
              glyph.style.cssText = 'display:inline-block;font-family:monospace;';
              element.replaceChildren(glyph);
            },
          },
        });
      // Redraw the headers, so the indicator re-syncs its icon under the new mapping.
      (window as unknown as { hot: any }).hot.render();
    });
  }

  /**
   * The glyph the inline renderer inserted into the indicator's icon.
   */
  collapsibleRendererGlyph(): Locator {
    return this.collapsibleIndicator().locator('.ht-icon .renderer-glyph');
  }

  /**
   * One of the pagination navigation buttons.
   */
  paginationButton(which: 'first' | 'prev' | 'next' | 'last'): Locator {
    return this.page.locator(`.ht-page-navigation-section__button.ht-page-${which}`);
  }

  /**
   * Moves the pagination to a page through the plugin API.
   */
  async setPage(pageNumber: number): Promise<void> {
    await this.page.evaluate((n) => {
      (window as unknown as { hot: any }).hot.getPlugin('pagination').setPage(n);
    }, pageNumber);
  }

  /**
   * Reads the computed border color of a locator.
   */
  async borderColor(locator: Locator): Promise<string> {
    return locator.evaluate(el => getComputedStyle(el).borderTopColor);
  }

  /**
   * Rebuilds a locator's layout box (a `display: none` round trip, two frames apart), so the next
   * paint of it is a fresh one rather than an invalidation of the previous paint.
   */
  async forceFreshPaint(locator: Locator): Promise<void> {
    await locator.evaluate(async(el: HTMLElement) => {
      const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
      const previous = el.style.display;

      el.style.display = 'none';
      await frame();
      el.style.display = previous;
      await frame();
      await frame();
    });
  }

  /**
   * Renames the active sheet through the plugin API.
   */
  async renameActiveSheet(name: string): Promise<void> {
    await this.page.evaluate((newName) => {
      const plugin = (window as unknown as { hot: any }).hot.getPlugin('sheetsBar');
      const active = plugin.getSheets().find((sheet: { isActive: boolean }) => sheet.isActive);

      plugin.renameSheet(active.id, newName);
    }, name);
  }

  /**
   * Opens the sheets-bar all-sheets menu and waits for it.
   */
  async openAllSheetsMenu(): Promise<void> {
    await this.page.locator('.ht-sheets-bar__all').click();
    await expect(this.page.locator('.htSheetsBarMenu:visible')).toHaveCount(1);
  }

  /**
   * The item wrapper of the all-sheets menu row that carries the active-sheet mark.
   */
  activeSheetMenuWrapper(): Locator {
    return this.page.locator('.htSheetsBarMenu .ht_master .htItemWrapper').filter({
      has: this.page.locator('.selected'),
    });
  }

  /**
   * Horizontal center of a locator's box.
   */
  async centerX(locator: Locator): Promise<number> {
    const box = await locator.boundingBox();

    if (box === null) {
      throw new Error('The element has no rendered box to measure.');
    }

    return box.x + (box.width / 2);
  }
}
