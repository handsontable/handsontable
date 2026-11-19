import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

interface Box {
  left: number;
  right: number;
  width: number;
}

export interface MoveUiGeometry {
  hider: Box;
  backlight: Box;
  guideline: Box;
  renderedColumns: number;
}

/**
 * Page Object for the fixture that moves a row by its header on a grid whose columns can be hidden:
 * a 6x4 grid with the HiddenColumns plugin on.
 */
export class ManualRowMoveNoColumnsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/manual-row-move-no-columns.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.rowHeader(0)).toBeVisible();
  }

  /**
   * The row header of a visual row.
   */
  rowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_inline_start tbody th').nth(row);
  }

  /**
   * Hide every column, or every column but the given one.
   */
  async hideColumns(except?: number): Promise<void> {
    await this.page.evaluate((keep) => {
      const hot = (window as any).hot;
      const columns = [0, 1, 2, 3].filter((column) => column !== keep);

      hot.getPlugin('hiddenColumns').hideColumns(columns);
      hot.render();
    }, except);
  }

  /**
   * The physical index of each of the first rows, in the order the grid shows them.
   */
  async physicalRows(count: number): Promise<number[]> {
    return this.page.evaluate(
      (length) => Array.from({ length }, (_, row) => (window as any).hot.toPhysicalRow(row)),
      count
    );
  }

  /**
   * Select a row through its header, then press the pointer on that header and drag it down onto the lower
   * half of another row's header, leaving the button pressed. The drop point is the target row's own
   * bottom edge less two pixels, never a literal: the plugin compares the pointer with the hovered row's
   * middle, and the row height is the theme's.
   */
  async dragRowHeaderToLowerHalfOf(row: number, target: number): Promise<void> {
    // The API selects the row: a header click followed by a press on the same point would read as a double click.
    await this.page.evaluate((r) => (window as any).hot.selectRows(r), row);

    const box = await this.rowHeader(row).boundingBox();
    const targetBox = await this.rowHeader(target).boundingBox();

    if (!box || !targetBox) {
      throw new Error(`Row header ${row} or ${target} is not rendered`);
    }

    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x, y + box.height / 2, { steps: 4 });
    await this.page.mouse.move(x, targetBox.y + targetBox.height - 2, { steps: 6 });
  }

  /**
   * Release the pointer, which drops the dragged row.
   */
  async release(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * The boxes of the move UI and of the table's hider, read in one evaluation while a row is dragged.
   * The backlight and the guideline are drawn only while the pointer is down.
   */
  async geometry(): Promise<MoveUiGeometry> {
    return this.page.evaluate(() => {
      const root = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const read = (selector: string) => {
        const element = root.querySelector(selector);

        if (!element) {
          throw new Error(`${selector} is not in the grid`);
        }

        const { left, right, width } = element.getBoundingClientRect();

        return { left, right, width };
      };

      return {
        hider: read('.wtHider'),
        backlight: read('.ht__manualRowMove--backlight'),
        guideline: read('.ht__manualRowMove--guideline'),
        renderedColumns: (window as any).hot.countRenderedCols(),
      };
    });
  }
}
