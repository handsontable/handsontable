import { type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

export interface HeaderAlignment {
  /** The row's height. */
  rowHeight: number;
  /** The distance from the top of the row to the top of the label's first line. */
  labelTop: number;
  /** The distance from the top of the row to the top of the collapse button. */
  buttonTop: number;
  /** The button's vertical center minus the center of the label's first line. */
  buttonToLabel: number;
  /** The button's vertical center minus the center of the whole label, every line of it. */
  buttonToLabelBlock: number;
  /** The number of lines the label takes. */
  labelLines: number;
}

/**
 * Page Object for the NestedRows row header alignment fixture.
 */
export class NestedRowsHeaderAlignmentPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render. `mode` picks whether `rowHeights` is an
   * exact height (AutoRowSize off) or a minimum (AutoRowSize on).
   */
  async goto(mode: 'exact' | 'minimum', labels: 'short' | 'long' = 'short'): Promise<void> {
    await this.page.goto('/tests/fixtures/demo/nested-rows-header-alignment.html' +
      `?theme=${this.theme}&bundle=${this.bundle}&mode=${mode}&labels=${labels}`);
    await awaitBundle(this.page);
    await expect(this.page.locator('.ht_clone_inline_start .ht_nestingButton').first()).toBeVisible();
  }

  /**
   * Reads where the label's first line and the collapse button sit in the row header of a visual row,
   * in one evaluation, from the header the row-header clone draws.
   */
  async alignment(row: number): Promise<HeaderAlignment> {
    return this.page.evaluate((visualRow) => {
      const hot = (window as any).hot;
      const th: HTMLElement = hot.getCell(visualRow, -1, true);
      const label = th.querySelector('.rowHeader')!;
      const button = th.querySelector('.ht_nestingButton')!;
      const range = document.createRange();

      range.selectNodeContents(label);

      const lines = Array.from(range.getClientRects());
      const firstLine = lines[0];
      const lastLine = lines[lines.length - 1];
      const header = th.getBoundingClientRect();
      const box = button.getBoundingClientRect();
      const buttonCenter = (box.top + box.bottom) / 2;

      return {
        rowHeight: header.height,
        labelTop: firstLine.top - header.top,
        buttonTop: box.top - header.top,
        buttonToLabel: buttonCenter - ((firstLine.top + firstLine.bottom) / 2),
        buttonToLabelBlock: buttonCenter - ((firstLine.top + lastLine.bottom) / 2),
        labelLines: new Set(lines.map(line => Math.round(line.top))).size,
      };
    }, row);
  }
}
