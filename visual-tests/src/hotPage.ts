import type { Locator, Page } from '@playwright/test';
import { helpers } from './helpers';

export class HotPage {
  readonly page: Page;
  readonly table: Locator;
  readonly tbody: Locator;
  readonly tocList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator(helpers.selectors.mainTable);
    this.tbody = this.table.locator(helpers.selectors.mainTableBody);

  }

  async loadTable() {

    await this.table.waitFor();
  }

  async selectCell(row:number, column:number, cellType:string = 'td') : Promise<Locator> {
    return this.tbody.locator(helpers.findCell({ row, column, cellType }));
  }

  async openEditor(cell:Locator) {

    await cell.click();
    await cell.press('Enter');
  }

  async selectEditor() {
    const cellEditor = this.table.locator(helpers.findCellEditor());

    await cellEditor.waitFor();

    return cellEditor;
  }
}
