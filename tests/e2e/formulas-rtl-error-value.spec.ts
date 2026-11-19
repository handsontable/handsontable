import { test, expect, THEMES_TAG, BUNDLES_TAG } from '../fixtures/test';
import { FormulasRtlErrorValuePage } from '../fixtures/pages/FormulasRtlErrorValuePage';

/**
 * In a `layoutDirection: 'rtl'` grid a Formulas error value (`#DIV/0!`, `#NAME?`) is made of neutral
 * punctuation around Latin letters, so the bidi algorithm paints it in the cell's RTL order
 * (`!DIV/0#`). The Formulas plugin wraps the content of an error cell in `span.ht-formula-error`
 * with `dir="ltr"`. The checks measure the painted glyph order with a DOM `Range`, so they prove
 * what the user sees, and the last test proves the measurement catches the old order.
 */
test.describe('Formulas: error values in an RTL grid', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  let grid: FormulasRtlErrorValuePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulasRtlErrorValuePage(page, theme, bundle);
    await grid.goto();
  });

  test('paints #DIV/0! and #NAME? left to right while the cell stays RTL', async() => {
    for (const [col, text] of [[0, '#DIV/0!'], [1, '#NAME?']] as const) {
      const order = await grid.glyphOrder('rtl', 0, col);

      expect(order.text).toBe(text);
      expect(order.hasErrorSpan).toBe(true);
      expect(order.direction).toBe('rtl');
      expect(order.firstLeft).toBeLessThan(order.lastLeft);
    }
  });

  test('leaves a plain string that looks like an error unwrapped', async() => {
    await expect(grid.errorSpan('rtl', 0, 0)).toHaveCount(1);
    await expect(grid.cell('rtl', 0, 2)).toHaveText('#tag!');
    await expect(grid.errorSpan('rtl', 0, 2)).toHaveCount(0);
  });

  test('does not wrap an error value in an LTR grid, where it already paints in order', async() => {
    const order = await grid.glyphOrder('ltr', 0, 0);

    expect(order.text).toBe('#DIV/0!');
    expect(order.hasErrorSpan).toBe(false);
    expect(order.direction).toBe('ltr');
    expect(order.firstLeft).toBeLessThan(order.lastLeft);
  });

  test('drops the wrapper when the recycled cell gets a normal value', async() => {
    await expect(grid.errorSpan('rtl', 0, 0)).toHaveCount(1);

    await grid.setRtlDataAtCell(0, 0, 5);

    await expect(grid.cell('rtl', 0, 0)).toHaveText('5');
    await expect(grid.errorSpan('rtl', 0, 0)).toHaveCount(0);
  });

  test('keeps a dropdown arrow at the inline end of an RTL error cell', async() => {
    const gaps = await grid.arrowGaps('rtl', 0, 4);

    expect(gaps.left).toBeLessThan(gaps.right);
    await expect(grid.errorSpan('rtl', 0, 4)).toHaveText('#DIV/0!');
  });

  test('takes the wrapper out when the Formulas plugin is turned off', async() => {
    await expect(grid.errorSpan('rtl', 0, 0)).toHaveCount(1);

    await grid.disableRtlFormulas();

    await expect(grid.errorSpan('rtl', 0, 0)).toHaveCount(0);
  });

  test('measures the reversed order once the wrapper is taken out', async() => {
    const order = await grid.glyphOrder('rtl', 0, 0, true);

    expect(order.text).toBe('#DIV/0!');
    expect(order.hasErrorSpan).toBe(false);
    expect(order.firstLeft).toBeGreaterThan(order.lastLeft);
  });
});
