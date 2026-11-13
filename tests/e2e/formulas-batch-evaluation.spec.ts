import { test, expect, THEMES_TAG, BUNDLES_TAG } from '../fixtures/test';
import { FormulasBatchEvaluationPage } from '../fixtures/pages/FormulasBatchEvaluationPage';

/**
 * `formulas.batchEvaluation`: the writes of one `hot.batch()` recalculate once, and a write in
 * `batchExecution()` - which renders - paints a formula column that is wide enough for its new value.
 */
test.describe('Formulas: batchEvaluation', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  let grid: FormulasBatchEvaluationPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FormulasBatchEvaluationPage(page, theme, bundle);
  });

  test('recalculates once for the writes of one batch() and paints every dependent', async() => {
    await grid.goto();

    const before = await grid.valuesUpdates();

    await grid.writeInBatch([10, 20, 30, 40, 50]);

    await expect(grid.cell(0, 1)).toHaveText('10000');
    await expect(grid.cell(4, 1)).toHaveText('50000');
    expect(await grid.valuesUpdates() - before).toBe(1);
  });

  test('measures the formula column before the draw that paints a batchExecution() write', async() => {
    await grid.goto();
    await grid.clearRenderLog();

    await grid.writeInBatchExecution(123456789);

    await expect(grid.cell(0, 1)).toHaveText('123456789000');

    const paintedNewValue = (await grid.renderLog()).filter(({ text }) => text === '123456789000');

    // The value is wider than the column was measured for. Every draw that paints it already has the wider
    // column, so the value is never on screen cut off, even for one frame.
    expect(paintedNewValue.length).toBeGreaterThan(0);
    expect(paintedNewValue.every(({ fits }) => fits)).toBe(true);
  });
});
