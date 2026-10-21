import { type Locator, expect } from '@playwright/test';
import { IconElementsPage } from './IconElementsPage';

/**
 * A rectangle read off `getBoundingClientRect()`, reduced to the four values the checkbox
 * geometry assertions compare.
 */
export type Rect = { left: number; top: number; width: number; height: number };

/**
 * Everything the narrow-column checkbox assertions compare, read in ONE evaluation off the grid
 * root (never a recycled cell node), so the values describe one rendered state.
 */
export type CheckboxCellGeometry = {
  /**
   * The rendered height of the row holding the checkbox.
   */
  checkboxRowHeight: number;
  /**
   * The rendered height of the row whose first cell is plain text.
   */
  textRowHeight: number;
  /**
   * The input's `::before` box, the square the tick must land on.
   */
  box: Rect;
  /**
   * The tick icon element.
   */
  tick: Rect;
  /**
   * The tick's effective opacity: its own times every ancestor's up to the cell.
   */
  tickOpacity: number;
};

/**
 * Page object for the checkbox-renderer layout cases of the icon-elements fixture: a checkbox
 * column squeezed narrower than its own gaps, next to a text column.
 */
export class IconElementsCheckboxPage extends IconElementsPage {
  /**
   * The column width that holds the checkbox box plus ONE `--ht-gap-size` (with 1px to spare) but
   * not the gap on both sides that a label-less checkbox asks for - so a layout with a soft-wrap
   * opportunity between the input and its tick wraps, on every theme.
   */
  async narrowColumnWidth(): Promise<number> {
    return this.page.locator('.ht_master td').first().evaluate((td) => {
      const style = getComputedStyle(td);
      const size = parseFloat(style.getPropertyValue('--ht-checkbox-size'));
      const gap = parseFloat(style.getPropertyValue('--ht-gap-size'));
      const chrome = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) +
        parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);

      return Math.ceil(chrome + size + gap + 1);
    });
  }

  /**
   * Rebuilds the grid as two columns - a checkbox column of the given width and a text column -
   * over three rows: row 0 holds `true` in the checkbox column, row 1 is plain text in both
   * columns, row 2 holds `null` (the `noValue` state). Auto-sizing and pagination are off so the
   * width is the one given and all three rows render.
   */
  async configureCheckboxColumn(options: {
    width: number;
    label?: Record<string, unknown>;
    wordWrap?: boolean;
  }): Promise<void> {
    await this.page.evaluate(({ width, label, wordWrap }) => {
      (window as unknown as { hot: any }).hot.updateSettings({
        data: [[true, 'a'], ['', 'a'], [null, 'a']],
        autoColumnSize: false,
        pagination: false,
        colWidths: [width, 80],
        wordWrap: wordWrap ?? true,
        columns: [
          label ? { type: 'checkbox', label } : { type: 'checkbox' },
          {},
        ],
        cells(row: number, col: number) {
          return row === 1 && col === 0 ? { type: 'text' } : {};
        },
      });
    }, options);

    await expect(this.checkboxInput(0)).toBeVisible();
  }

  /**
   * The checkbox input in the given row's first cell.
   */
  checkboxInput(row: number): Locator {
    return this.page.locator('.ht_master .htCore tbody tr').nth(row).locator('td').first()
      .locator('input.htCheckboxRendererInput');
  }

  /**
   * Reads the geometry of the checkbox in `row` (column 0), next to the text-only row 1.
   */
  async checkboxGeometry(row: number): Promise<CheckboxCellGeometry> {
    return this.grid().evaluate((root, checkboxRow) => {
      const rows = root.querySelectorAll('.ht_master .htCore tbody tr');
      const td = rows[checkboxRow].querySelector('td')!;
      const input = td.querySelector('input.htCheckboxRendererInput')!;
      const tick = td.querySelector('.ht-icon.ht-icon-checkbox')!;
      const inputRect = input.getBoundingClientRect();
      const before = getComputedStyle(input, '::before');
      const toRect = (rect: DOMRect | { left: number; top: number; width: number; height: number }) => ({
        left: rect.left, top: rect.top, width: rect.width, height: rect.height,
      });
      let tickOpacity = 1;

      for (let node: Element | null = tick; node && node !== td.parentElement; node = node.parentElement) {
        tickOpacity *= parseFloat(getComputedStyle(node).opacity);
      }

      return {
        checkboxRowHeight: rows[checkboxRow].getBoundingClientRect().height,
        textRowHeight: rows[1].getBoundingClientRect().height,
        // The `::before` box is anchored at the input's own top-left and sized in CSS pixels.
        box: toRect({
          left: inputRect.left + parseFloat(before.left || '0'),
          top: inputRect.top + parseFloat(before.top || '0'),
          width: parseFloat(before.width),
          height: parseFloat(before.height),
        }),
        tick: toRect(tick.getBoundingClientRect()),
        tickOpacity,
      };
    }, row);
  }

  /**
   * Opens the multi-select editor on cell (0, 3) - the fixture needs `goto({ multiSelect: true })`.
   */
  async openMultiSelectEditor(): Promise<Locator> {
    await this.page.evaluate(() => (window as unknown as { hot: any }).hot.selectCell(0, 3));
    await this.page.keyboard.press('Enter');

    const dropdown = this.page.locator('.handsontableEditor.ht_editor_visible .ht-multi-select-editor');

    await expect(dropdown).toBeVisible();

    return dropdown;
  }

  /**
   * Measures the distance from the first list item's checkbox box to the first glyph of its
   * label, along the inline direction, plus the theme's `--ht-gap-size` and the item's direction.
   */
  async multiSelectLabelGap(dropdown: Locator): Promise<{ gap: number; distance: number; textAfterBox: boolean }> {
    return dropdown.locator('li').first().evaluate((li) => {
      const input = li.querySelector('input[type="checkbox"]')!;
      const label = li.querySelector('label')!;
      const range = document.createRange();

      range.selectNodeContents(label);

      const box = input.getBoundingClientRect();
      const text = range.getBoundingClientRect();
      const rtl = getComputedStyle(li).direction === 'rtl';

      return {
        gap: parseFloat(getComputedStyle(li).getPropertyValue('--ht-gap-size')),
        distance: rtl ? box.left - text.right : text.left - box.right,
        // The text must follow the box in the inline direction, not merely sit somewhere near it.
        textAfterBox: rtl ? text.right <= box.left + 0.5 : text.left >= box.right - 0.5,
      };
    });
  }
}
