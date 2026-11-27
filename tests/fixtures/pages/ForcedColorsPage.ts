import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * How the fixture draws the checkbox and radio marks: as mask icons (the themes' default), or as
 * external (class) icons mapped through the theme engine.
 */
export type ForcedColorsIcons = 'mask' | 'external';

/**
 * A system color, as `getComputedStyle()` resolves it on this page.
 */
export type SystemColor = 'Highlight' | 'ButtonText' | 'GrayText' | 'CanvasText';

/**
 * Page object for `fixtures/demo/forced-colors.html`: one grid with every surface the forced-colors
 * rules of the stylesheet reach, a header menu button, a checkbox column (column 1), a dropdown column
 * (column 2), the context and dropdown menus with Filters, Pagination at five rows a page, and a sheets
 * bar of two sheets.
 *
 * Forced colors keeps the author's value in most computed styles, so a defect there shows only in what
 * is painted. `drawsElement()` compares a capture of an area with a capture of the same area with one
 * element taken out by a stylesheet rule.
 */
export class ForcedColorsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The grid container.
   *
   * @returns {Locator}
   */
  get grid(): Locator {
    return this.page.getByTestId('grid');
  }

  /**
   * Opens the fixture in forced colors and waits for the grid to have rendered its first cell.
   *
   * @param {ForcedColorsIcons} [icons] How the checkbox and radio marks are drawn.
   */
  async goto(icons: ForcedColorsIcons = 'mask'): Promise<void> {
    await this.page.emulateMedia({ forcedColors: 'active' });
    await this.page.goto(`/tests/fixtures/demo/forced-colors.html?theme=${this.theme}&bundle=${this.bundle}`
      + `&icons=${icons}`);
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The forced-colors fixture failed to build its grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A cell of the master table, by visual coordinates.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  cell(row: number, column: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${column}`);
  }

  /**
   * The column menu button of a column header, in the top overlay.
   *
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  headerMenuButton(column: number): Locator {
    return this.grid.locator('.ht_clone_top').getByTestId(`col-header-${column}`).locator('.changeType');
  }

  /**
   * The checkbox of a cell in the checkbox column.
   *
   * @param {number} row The visual row index.
   * @returns {Locator}
   */
  checkbox(row: number): Locator {
    return this.cell(row, 1).locator('input[type="checkbox"]');
  }

  /**
   * A pager button by its name (`first`, `prev`, `next`, `last`).
   *
   * @param {'first' | 'prev' | 'next' | 'last'} name The button.
   * @returns {Locator}
   */
  pagerButton(name: 'first' | 'prev' | 'next' | 'last'): Locator {
    return this.page.locator(`.ht-pagination .ht-page-${name}`);
  }

  /**
   * The menu items of the open context menu that a user can highlight.
   *
   * @returns {Locator}
   */
  get contextMenuItems(): Locator {
    return this.page.locator('.htContextMenu .ht_master .htCore tbody td:not(.htSeparator):not(.htDisabled)');
  }

  /**
   * The rows of the open dropdown editor's list.
   *
   * @returns {Locator}
   */
  get dropdownListItems(): Locator {
    return this.page.locator('.handsontableEditor.listbox .ht_master td');
  }

  /**
   * The rows of the open all-sheets menu of the sheets bar.
   *
   * @returns {Locator}
   */
  get allSheetsMenuItems(): Locator {
    return this.page.locator('.htSheetsBarMenu .ht_master td');
  }

  /**
   * The radio buttons of the open Filters' condition operators (And, Or).
   *
   * @returns {Locator}
   */
  get operatorRadios(): Locator {
    return this.page.locator('.htDropdownMenu .htFiltersMenuOperators input[type="radio"]');
  }

  /**
   * Moves the pointer off every grid surface, so no item takes the hover look.
   */
  async parkPointer(): Promise<void> {
    await this.page.mouse.move(0, 0);
  }

  /**
   * Opens the context menu from the keyboard on a cell.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   */
  async openContextMenu(row: number, column: number): Promise<void> {
    await this.selectCell(row, column);
    await this.parkPointer();
    await this.page.keyboard.press('Shift+F10');
    await expect(this.contextMenuItems.first()).toBeVisible();
  }

  /**
   * Opens the dropdown editor of a cell in the dropdown column with Enter.
   *
   * @param {number} row The visual row index.
   */
  async openDropdownEditor(row: number): Promise<void> {
    await this.selectCell(row, 2);
    await this.parkPointer();
    await this.page.keyboard.press('Enter');
    await expect(this.dropdownListItems.first()).toBeVisible();
  }

  /**
   * Opens the all-sheets menu of the sheets bar with its button.
   */
  async openAllSheetsMenu(): Promise<void> {
    await this.page.locator('.ht-sheets-bar__all').click();
    await this.parkPointer();
    await expect(this.allSheetsMenuItems.first()).toBeVisible();
  }

  /**
   * Adds a Filters condition on the first column, then opens its column menu from the keyboard, so
   * the condition operators (two radio buttons, And checked) are shown.
   */
  async openFiltersWithCondition(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as {
        hot: {
          getPlugin(name: 'filters'): {
            addCondition(column: number, name: string, args: unknown[]): void,
            filter(): void,
          },
        },
      };
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'contains', ['S']);
      filters.filter();
    });
    await this.selectCell(0, 0);
    await this.page.keyboard.press('Shift+Alt+ArrowDown');
    await expect(this.operatorRadios.first()).toBeVisible();
  }

  /**
   * Selects a cell through the API, so the keys that follow reach the grid.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   */
  async selectCell(row: number, column: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as { hot: { selectCell(row: number, column: number): void } }).hot.selectCell(r, c);
    }, [row, column]);
  }

  /**
   * Writes a value to a cell through the API.
   *
   * @param {number} row The visual row index.
   * @param {number} column The visual column index.
   * @param {unknown} value The value.
   */
  async setDataAt(row: number, column: number, value: unknown): Promise<void> {
    await this.page.evaluate(([r, c, v]) => {
      (window as unknown as { hot: { setDataAtCell(row: number, column: number, value: unknown): void } })
        .hot.setDataAtCell(r as number, c as number, v);
    }, [row, column, value]);
  }

  /**
   * Whether an element changes what an area looks like: a capture of the area, compared with a
   * capture of it with the element hidden by a stylesheet rule (a rule, not an inline style, because
   * the grid can draw again and build a new element). The rule is removed afterwards.
   *
   * @param {Locator} area The area to capture.
   * @param {Locator} element The element to take out.
   * @param {string} selector A selector for the element, for the rule.
   * @returns {Promise<boolean>}
   */
  async drawsElement(area: Locator, element: Locator, selector: string): Promise<boolean> {
    const drawn = await area.screenshot();
    const style = await this.page.addStyleTag({ content: `${selector} { visibility: hidden !important; }` });

    await expect(element.first()).toHaveCSS('visibility', 'hidden');

    const without = await area.screenshot();

    await style.evaluate(node => node.remove());

    return !drawn.equals(without);
  }

  /**
   * A system color resolved on this page, read from a probe element that opts out of forced colors.
   *
   * @param {SystemColor} color The system color.
   * @returns {Promise<string>}
   */
  async systemColor(color: SystemColor): Promise<string> {
    return this.page.evaluate((name) => {
      const probe = document.createElement('div');

      probe.style.cssText = `forced-color-adjust: none; color: ${name};`;
      document.body.appendChild(probe);

      const resolved = getComputedStyle(probe).color;

      probe.remove();

      return resolved;
    }, color);
  }

  /**
   * The color an element's outline resolves to.
   *
   * @param {Locator} element The element.
   * @returns {Promise<string>}
   */
  async outlineColor(element: Locator): Promise<string> {
    return element.evaluate(node => getComputedStyle(node).outlineColor);
  }
}
