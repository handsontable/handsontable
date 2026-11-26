import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';
import './windowTypes';

export type GridDirection = 'rtl' | 'ltr';

/**
 * How a cell's text paints: its text, whether the error wrapper is there, the cell's computed
 * direction, and the left edges of the first and the last glyph.
 */
export interface GlyphOrder {
  text: string;
  hasErrorSpan: boolean;
  direction: string;
  firstLeft: number;
  lastLeft: number;
}

/**
 * Page Object for the error-value-in-RTL fixture. `window.hot` is a `layoutDirection: 'rtl'` grid
 * (`=1/0`, `=NOPE()`, the plain string `#tag!`, `1`), and a second, LTR grid holds `=1/0`.
 */
export class FormulasRtlErrorValuePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait until both engines have evaluated their formulas.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-rtl-error-value.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell('rtl', 0, 0)).toHaveText('#DIV/0!');
    await expect(this.cell('rtl', 0, 1)).toHaveText('#NAME?');
    await expect(this.cell('ltr', 0, 0)).toHaveText('#DIV/0!');
  }

  /**
   * A data cell of one of the two grids, by visual row/column.
   */
  cell(grid: GridDirection, row: number, col: number): Locator {
    return this.page.getByTestId(`grid-${grid}-cell-${row}-${col}`);
  }

  /**
   * The LTR isolation wrapper inside a cell, if any.
   */
  errorSpan(grid: GridDirection, row: number, col: number): Locator {
    return this.cell(grid, row, col).locator('span.ht-formula-error');
  }

  /**
   * `setDataAtCell()` on the RTL grid.
   */
  async setRtlDataAtCell(row: number, col: number, value: string | number): Promise<void> {
    await this.page.evaluate(([r, c, v]) => window.hot.setDataAtCell(r, c, v), [row, col, value] as const);
  }

  /**
   * Turns the Formulas plugin off on the RTL grid, without a render in between.
   */
  async disableRtlFormulas(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('formulas').disablePlugin());
  }

  /**
   * Reads, in one evaluation, how far the dropdown arrow of a cell sits from the cell's left and
   * right edges. In an RTL grid the arrow belongs at the inline end, the left edge.
   */
  async arrowGaps(grid: GridDirection, row: number, col: number): Promise<{ left: number, right: number }> {
    return this.page.evaluate((testId) => {
      const td = document.querySelector(`[data-testid="${testId}"]`);
      const arrow = td?.querySelector('.htAutocompleteArrow');

      if (!td || !arrow) {
        throw new Error(`No dropdown arrow in ${testId}`);
      }

      const cellBox = td.getBoundingClientRect();
      const arrowBox = arrow.getBoundingClientRect();

      return { left: arrowBox.left - cellBox.left, right: cellBox.right - arrowBox.right };
    }, `grid-${grid}-cell-${row}-${col}`);
  }

  /**
   * Reads how a cell's text paints, in one evaluation: the left edge of the first and the last
   * glyph, measured with a DOM `Range` over the cell's text nodes. With `unwrap`, the error wrapper
   * is first taken out (its children moved up), with no re-render in between, which is how the cell
   * painted before the isolation existed.
   */
  async glyphOrder(grid: GridDirection, row: number, col: number, unwrap = false): Promise<GlyphOrder> {
    return this.page.evaluate(([testId, removeWrapper]) => {
      const td = document.querySelector(`[data-testid="${testId}"]`);

      if (!td) {
        throw new Error(`No cell ${testId}`);
      }

      const span = td.querySelector('span.ht-formula-error');

      if (removeWrapper && span) {
        span.replaceWith(...Array.from(span.childNodes));
      }

      const chars: { node: Text, offset: number }[] = [];
      const walker = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);

      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node as Text;

        for (let offset = 0; offset < text.data.length; offset += 1) {
          chars.push({ node: text, offset });
        }
      }

      const leftOf = ({ node, offset }: { node: Text, offset: number }) => {
        const range = document.createRange();

        range.setStart(node, offset);
        range.setEnd(node, offset + 1);

        return range.getBoundingClientRect().left;
      };

      return {
        text: td.textContent ?? '',
        hasErrorSpan: td.querySelector('span.ht-formula-error') !== null,
        direction: getComputedStyle(td).direction,
        firstLeft: leftOf(chars[0]),
        lastLeft: leftOf(chars[chars.length - 1]),
      };
    }, [`grid-${grid}-cell-${row}-${col}`, unwrap] as const);
  }
}
