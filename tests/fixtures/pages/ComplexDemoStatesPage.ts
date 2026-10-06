import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * A box in viewport coordinates, as `getBoundingClientRect()` reports it.
 */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Page object for `fixtures/demo/complex-demo-states.html`, the visual suite's `/complex-demo` grid.
 */
export class ComplexDemoStatesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  /**
   * The dropdown menu's root, not its submenus, which carry the same class.
   */
  readonly dropdownMenu: Locator;
  readonly contextMenu: Locator;
  readonly cellEditor: Locator;
  /**
   * The list the dropdown and autocomplete editors open under the cell.
   */
  readonly editorList: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.dropdownMenu = page.locator('.htDropdownMenu:not([class*="htDropdownMenuSub_"])');
    this.contextMenu = page.locator('.htContextMenu:not([class*="htContextMenuSub_"])');
    this.cellEditor = page.locator('.handsontableInput');
    this.editorList = page.locator('.autocompleteEditor');
  }

  /**
   * Opens the fixture in the given direction, on the demo specs' 1920 x 1080 page.
   *
   * @param {'ltr'|'rtl'} dir The grid's layout direction.
   */
  async goto(dir: 'ltr' | 'rtl' = 'ltr'): Promise<void> {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.page.goto(`/tests/fixtures/demo/complex-demo-states.html?theme=${this.theme}&bundle=${this.bundle}&dir=${dir}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(1, 1)).toBeVisible();
  }

  /**
   * A body cell of the master table, by its rendered row and column; the grid is at its scroll origin
   * in every test, so these are the visual indexes.
   *
   * @param {number} row The rendered row.
   * @param {number} column The rendered column.
   * @returns {Locator}
   */
  cell(row: number, column: number): Locator {
    return this.page.locator(`.ht_master .htCore tbody > tr:nth-of-type(${row + 1}) > td:nth-of-type(${column + 1})`);
  }

  /**
   * A column header in the top overlay, by its label's exact text. Not by its accessible name: a sort
   * order badge (`::after` content) is part of that name once a second column is sorted.
   *
   * @param {string} label The header's label.
   * @returns {Locator}
   */
  columnHeader(label: string): Locator {
    return this.page.locator('.ht_clone_top thead th').filter({
      has: this.page.locator('span.colHeader').getByText(label, { exact: true }),
    });
  }

  /**
   * Selects a cell through the API, which keeps a press off a dropdown arrow (`tests/AGENTS.md`).
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   */
  async selectCell(row: number, column: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as unknown as { hot: { selectCell(row: number, column: number): void } })
      .hot.selectCell(r, c), [row, column]);
  }

  /**
   * The grid's selection, as `getSelected()` returns it.
   *
   * @returns {Promise<number[][] | undefined>}
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as { hot: { getSelected(): number[][] | undefined } })
      .hot.getSelected());
  }

  /**
   * The multi-column sort the plugin holds.
   *
   * @returns {Promise<Array<{column: number, sortOrder: string}>>}
   */
  async sortConfig(): Promise<Array<{ column: number; sortOrder: string }>> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getPlugin(name: string): { getSortConfig(): Array<{ column: number; sortOrder: string }> } };
    }).hot.getPlugin('multiColumnSorting').getSortConfig());
  }

  /**
   * The sort order number a sorted header draws after its label (its `::after` content).
   *
   * @param {string} label The header's label.
   * @returns {Promise<string>}
   */
  async sortOrderBadge(label: string): Promise<string> {
    return this.columnHeader(label).locator('.columnSorting')
      .evaluate(element => getComputedStyle(element, '::after').content);
  }

  /**
   * Whether a physical column is hidden from the view.
   *
   * @param {number} column The physical column.
   * @returns {Promise<boolean>}
   */
  async isColumnHidden(column: number): Promise<boolean> {
    return this.page.evaluate(col => (window as unknown as {
      hot: { columnIndexMapper: { isHidden(index: number): boolean } };
    }).hot.columnIndexMapper.isHidden(col), column);
  }

  /**
   * The value of a cell, by visual coordinates.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @returns {Promise<unknown>}
   */
  async dataAt(row: number, column: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as unknown as {
      hot: { getDataAtCell(row: number, column: number): unknown };
    }).hot.getDataAtCell(r, c), [row, column]);
  }

  /**
   * The box of a column header in the top overlay, by its label, and the box of the dropdown menu, read
   * in one evaluation: the header cell is a node Walkontable recycles, so a second round trip could
   * measure another column.
   *
   * @param {string} label The header's label.
   * @returns {Promise<{header: Box, menu: Box}>}
   */
  async headerAndDropdownMenuBoxes(label: string): Promise<{ header: Box; menu: Box }> {
    return this.page.evaluate((text) => {
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect();

        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      };
      const header = [...document.querySelectorAll('.ht_clone_top thead th')]
        .find(th => th.querySelector('span.colHeader')?.textContent === text) as Element;
      const menu = document.querySelector('.htDropdownMenu:not([class*="htDropdownMenuSub_"])') as Element;

      return { header: box(header), menu: box(menu) };
    }, label);
  }

  /**
   * The box of a cell, by visual coordinates, and the box of the select editor, read in one evaluation.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @returns {Promise<{cell: Box, editor: Box}>}
   */
  async cellAndSelectEditorBoxes(row: number, column: number): Promise<{ cell: Box; editor: Box }> {
    return this.page.evaluate(([r, c]) => {
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect();

        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      };
      const hot = (window as unknown as {
        hot: { getCell(row: number, column: number, topmost: boolean): HTMLElement };
      }).hot;

      return {
        cell: box(hot.getCell(r, c, true)),
        editor: box(document.querySelector('.htSelectEditor') as Element),
      };
    }, [row, column]);
  }

  /**
   * Presses a cell's top-start corner and drags to another cell's, the demo spec's gesture. Both cells
   * are measured in one evaluation, on the topmost overlay that draws them.
   *
   * @param {[number, number]} from The visual row and column the drag starts on.
   * @param {[number, number]} to The visual row and column it ends on.
   */
  async dragSelect(from: [number, number], to: [number, number]): Promise<void> {
    const [fromBox, toBox] = await this.page.evaluate(cells => cells.map(([row, column]) => {
      const hot = (window as unknown as {
        hot: { getCell(row: number, column: number, topmost: boolean): HTMLElement };
      }).hot;
      const rect = hot.getCell(row, column, true).getBoundingClientRect();

      return { x: rect.left, y: rect.top };
    }), [from, to]);

    await this.page.mouse.move(fromBox.x + 10, fromBox.y + 10);
    await this.page.mouse.down();
    await this.page.mouse.move(toBox.x + 10, toBox.y + 10);
    await this.page.mouse.up();
  }
}
