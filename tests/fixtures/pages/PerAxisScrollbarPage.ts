import { expect } from '@playwright/test';
import { SelectionFeaturesPage } from './SelectionFeaturesPage';

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

/**
 * A grid whose scrollbars are restyled before Handsontable is constructed, so the cached probe and
 * the holder's own gutters can disagree. Same fixture as {@link SelectionFeaturesPage}.
 */
export class PerAxisScrollbarPage extends SelectionFeaturesPage {
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
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * The last row and column whose master cell box sits fully inside the holder's client box.
   */
  async fullyVisibleCellEdges(): Promise<{ lastRow: number, lastCol: number }> {
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

      return { lastRow, lastCol };
    });
  }

  /**
   * The throw-away probe's scrollbar gutters, measured the way `getScrollbarWidth()` measures them.
   * Width is the vertical bar, height the horizontal bar.
   */
  async probeGutters(): Promise<{ vertical: number, horizontal: number }> {
    return this.page.evaluate(() => {
      const probe = document.createElement('div');
      const inner = document.createElement('div');

      probe.className = 'htScrollbarTest';
      probe.style.cssText = 'position:absolute;top:0;left:0;width:200px;height:150px;overflow:scroll;visibility:hidden;box-sizing:content-box';
      inner.style.cssText = 'width:100%;height:200px';
      probe.appendChild(inner);
      document.body.appendChild(probe);

      const vertical = probe.offsetWidth - probe.clientWidth;
      const horizontal = probe.offsetHeight - probe.clientHeight;

      probe.remove();

      return { vertical, horizontal };
    });
  }
}
