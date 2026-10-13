import { test, expect } from '../fixtures/test';
import { IconElementsCheckboxPage } from '../fixtures/pages/IconElementsCheckboxPage';

/**
 * The checkbox renderer's tick is an `<i class="ht-icon">` element, which an `<input>` cannot
 * hold, so the renderer puts both in a `span.htCheckboxRendererBox` wrapper. Without it, the input
 * and the tick were two adjacent inline-blocks in a `white-space: pre-wrap` cell - a soft-wrap
 * opportunity - and in a column narrower than the gaps plus the box the tick dropped onto a second
 * line: off the box, and growing the row.
 */
test.describe('Checkbox renderer tick layout', () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    const goto = (grid: IconElementsCheckboxPage) => grid.goto(dir === 'rtl' ? { dir: 'rtl' } : {});

    test(`in a narrow column the tick stays on its box and the row keeps its height (${dir})`, async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsCheckboxPage(page, theme, bundle);

      await goto(grid);
      await grid.configureCheckboxColumn({ width: await grid.narrowColumnWidth() });

      const geometry = await grid.checkboxGeometry(0);

      expect(geometry.box.width).toBeGreaterThan(0);
      expect(geometry.checkboxRowHeight).toBe(geometry.textRowHeight);
      expect(Math.abs(geometry.tick.left - geometry.box.left), 'tick x').toBeLessThan(0.5);
      expect(Math.abs(geometry.tick.top - geometry.box.top), 'tick y').toBeLessThan(0.5);
      expect(Math.abs(geometry.tick.width - geometry.box.width), 'tick width').toBeLessThan(0.5);
      expect(Math.abs(geometry.tick.height - geometry.box.height), 'tick height').toBeLessThan(0.5);
    });

    test(`at a regular column width the tick stays on its box and the row keeps its height (${dir})`, async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsCheckboxPage(page, theme, bundle);

      await goto(grid);
      await grid.configureCheckboxColumn({ width: 100 });

      const geometry = await grid.checkboxGeometry(0);

      expect(geometry.checkboxRowHeight).toBe(geometry.textRowHeight);
      expect(Math.abs(geometry.tick.left - geometry.box.left), 'tick x').toBeLessThan(0.5);
      expect(Math.abs(geometry.tick.top - geometry.box.top), 'tick y').toBeLessThan(0.5);
    });

    test(`a wrapped label after the checkbox keeps the tick on its box in a narrow column (${dir})`, async({
      page, theme, bundle,
    }) => {
      const grid = new IconElementsCheckboxPage(page, theme, bundle);

      await goto(grid);
      await grid.configureCheckboxColumn({
        width: await grid.narrowColumnWidth(),
        label: { value: 'Pick', position: 'after' },
        wordWrap: true,
      });

      const geometry = await grid.checkboxGeometry(0);

      expect(geometry.box.width).toBeGreaterThan(0);
      expect(Math.abs(geometry.tick.left - geometry.box.left), 'tick x').toBeLessThan(0.5);
      expect(Math.abs(geometry.tick.top - geometry.box.top), 'tick y').toBeLessThan(0.5);
    });
  }

  // `noValue` dims the input to 0.5. The tick is the input's sibling, not its descendant, so the
  // input's opacity alone left a full-strength tick over a dimmed box.
  test('an empty cell dims the tick together with its box', async({ page, theme, bundle }) => {
    const grid = new IconElementsCheckboxPage(page, theme, bundle);

    await grid.goto();
    await grid.configureCheckboxColumn({ width: 100 });

    await expect(grid.checkboxInput(2)).toHaveClass(/noValue/);

    const geometry = await grid.checkboxGeometry(2);

    expect(geometry.tickOpacity).toBeCloseTo(0.5, 2);
  });
});

/**
 * The multi-select editor's list item is `div { input, i.ht-icon, label }`. Its label used to
 * carry a physical `padding-left` of two gaps, so the text sat two gaps from the box in LTR and
 * touched it in RTL. One logical gap matches the Filters "Filter by value" list.
 */
test.describe('Multi-select editor list label gap', () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    test(`the label text starts one gap after the checkbox box (${dir})`, async({ page, theme, bundle }) => {
      const grid = new IconElementsCheckboxPage(page, theme, bundle);

      await grid.goto({ multiSelect: true, ...(dir === 'rtl' ? { dir: 'rtl' as const } : {}) });

      const dropdown = await grid.openMultiSelectEditor();
      const { gap, distance, textAfterBox } = await grid.multiSelectLabelGap(dropdown);

      expect(gap).toBeGreaterThan(0);
      expect(textAfterBox).toBe(true);
      expect(Math.abs(distance - gap), `distance ${distance} vs gap ${gap}`).toBeLessThanOrEqual(1);
    });
  }
});
