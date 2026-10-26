import { expect, type Page } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';
import './windowTypes';

/**
 * Which scrollbar the stylesheet is trying to disagree with the engine's probe.
 *
 * `global` is a page-wide `::-webkit-scrollbar` rule. The theme's `scrollbar-color` makes Chrome
 * ignore that rule on `.wtHolder`, so the holder keeps the classic gutter while the probe (outside
 * the theme, so its `scrollbar-color` is invalid) follows the rule.
 *
 * `holder` is the same rule on the master holder only, with `scrollbar-color` set back to `auto`
 * so the pseudo-element applies there and nowhere else.
 */
export type ScrollbarRule = 'global' | 'holder';

const RULES: Record<ScrollbarRule, string> = {
  global: '::-webkit-scrollbar { width: 100px; height: 10px; }',
  holder: [
    '.handsontable .ht_master .wtHolder { scrollbar-color: auto !important; }',
    '.handsontable .ht_master .wtHolder::-webkit-scrollbar { width: 100px; height: 10px; }',
  ].join('\n'),
};

interface ViewportRead {
  lastRow: number;
  lastCol: number;
  apiRow: number;
  apiCol: number;
  holderVertical: number;
  holderHorizontal: number;
  probeVertical: number;
  probeHorizontal: number;
  scrollTop: number;
  scrollLeft: number;
}

/**
 * A grid whose scrollbars are restyled before Handsontable is constructed, so the cached probe and
 * the holder's own gutters can disagree.
 */
export class PerAxisScrollbarPage {
  readonly page: Page;

  readonly theme: string;

  readonly bundle: Bundle;

  constructor(page: Page, theme: string, bundle: Bundle) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Installs the scrollbar rule into the fixture document, before any script runs.
   * `getScrollbarWidth()` caches on the first grid, and the fixture constructs one during load.
   * An init-script node is wiped when the parser creates the document, so the rule is written
   * into `<head>` of the response instead.
   *
   * @param rule Which disagreement to create.
   */
  async installScrollbarRule(rule: ScrollbarRule): Promise<void> {
    const css = RULES[rule];

    await this.page.route('**/selection-features.html*', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace('<head>', `<head><style>${css}</style>`);

      await route.fulfill({ response, body });
    });
  }

  /**
   * Opens the selection fixture (theme and bundle from the project) and waits for its grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/selection-features.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Rebuilds a grid tall and wide enough that an 85px scrollbar error changes the fully-visible
   * count on every theme, including horizon rows.
   *
   * @param sizing `predicted` forces the single-pass snapshot (uniform sizes, auto-size plugins
   * off). `measured` leaves the default plugins on, so the viewport is measured from the holder.
   */
  async initScrollingGrid(sizing: 'predicted' | 'measured'): Promise<void> {
    const data = Array.from({ length: 40 }, (_, row) =>
      Array.from({ length: 20 }, (_, col) => `R${row + 1}C${col + 1}`));
    const uniform = sizing === 'predicted'
      ? { autoRowSize: false, autoColumnSize: false, colWidths: 70, rowHeights: 42 }
      : { colWidths: 70 };

    await this.page.evaluate(({ gridData, settings }) => {
      window.initSelectionGrid({
        data: gridData,
        width: 420,
        height: 320,
        ...settings,
      });
    }, { gridData: data, settings: uniform });
    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * The fully-visible edges from cell boxes, the API's answer, and the probe versus the holder.
   * One evaluation, so the reads describe one frame.
   */
  async readViewport(): Promise<ViewportRead> {
    return this.page.evaluate(() => {
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;
      const holderRect = holder.getBoundingClientRect();
      const limitRight = holderRect.left + holder.clientLeft + holder.clientWidth;
      const limitBottom = holderRect.top + holder.clientTop + holder.clientHeight;
      let lastRow = -1;
      let lastCol = -1;

      holder.querySelectorAll('tbody td').forEach((node) => {
        const td = node as HTMLElement;
        const rect = td.getBoundingClientRect();
        const coords = window.hot.getCoords(td);

        if (!coords || coords.row < 0 || coords.col < 0) {
          return;
        }

        if (rect.top >= holderRect.top - 1 && rect.bottom <= limitBottom + 1) {
          lastRow = Math.max(lastRow, coords.row);
        }

        if (rect.left >= holderRect.left - 1 && rect.right <= limitRight + 1) {
          lastCol = Math.max(lastCol, coords.col);
        }
      });

      const probe = document.createElement('div');
      const inner = document.createElement('div');

      probe.className = 'htScrollbarTest';
      probe.style.cssText = 'position:absolute;top:0;left:0;width:200px;height:150px;overflow:scroll;visibility:hidden;box-sizing:content-box';
      inner.style.cssText = 'width:100%;height:200px';
      probe.appendChild(inner);
      document.body.appendChild(probe);

      const probeVertical = probe.offsetWidth - probe.clientWidth;
      const probeHorizontal = probe.offsetHeight - probe.clientHeight;

      probe.remove();

      return {
        lastRow,
        lastCol,
        apiRow: window.hot.getLastFullyVisibleRow(),
        apiCol: window.hot.getLastFullyVisibleColumn(),
        holderVertical: holder.offsetWidth - holder.clientWidth,
        holderHorizontal: holder.offsetHeight - holder.clientHeight,
        probeVertical,
        probeHorizontal,
        scrollTop: holder.scrollTop,
        scrollLeft: holder.scrollLeft,
      };
    });
  }

  /**
   * Clicks the cell. A fully visible cell must not move the holder; the selection scroll runs
   * before this returns.
   */
  async clickCell(row: number, col: number): Promise<void> {
    await this.page.getByTestId(`cell-${row}-${col}`).click();
  }

  /**
   * The master holder's scroll offsets, read together.
   */
  async scrollOffset(): Promise<{ scrollTop: number, scrollLeft: number }> {
    return this.page.evaluate(() => {
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;

      return { scrollTop: holder.scrollTop, scrollLeft: holder.scrollLeft };
    });
  }
}
