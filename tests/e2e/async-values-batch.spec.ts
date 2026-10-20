import { test, expect } from '../fixtures/test';
import { AsyncValuesBatchPage } from '../fixtures/pages/AsyncValuesBatchPage';

/**
 * An AI column filled by the AsyncValues plugin in batches, with a concurrency cap of two batches: real
 * clicks on Classify and Stop, the pending cells, the progress text, and the late result of a stopped batch.
 */
test.describe('async cell values in batches', () => {
  test('Classify fills the column two batches at a time, and Stop cancels the rest', async({ page, theme, bundle }) => {
    const batchPage = new AsyncValuesBatchPage(page, theme, bundle);

    await batchPage.goto();
    await expect(batchPage.progress).toHaveText('0 of 6 done, 0 failed');

    await batchPage.classify.click();

    // Six cells pending, but only two batches running.
    await expect.poll(() => batchPage.countPending()).toBe(6);
    await expect.poll(() => batchPage.batchRows()).toEqual([[0, 1], [2, 3]]);
    await expect(batchPage.cell(5, 1).locator('.htAsyncIndicator')).toBeVisible();

    await batchPage.resolveBatch(0, ['Drinkware', 'Electronics']);

    await expect(batchPage.cell(0, 1)).toHaveText('Drinkware');
    await expect(batchPage.cell(1, 1)).toHaveText('Electronics');
    await expect(batchPage.progress).toHaveText('2 of 6 done, 0 failed');
    // The freed slot starts the queued batch.
    await expect.poll(() => batchPage.batchRows()).toEqual([[0, 1], [2, 3], [4, 5]]);

    await batchPage.stop.click();

    await expect.poll(() => batchPage.countPending()).toBe(0);
    await expect.poll(() => batchPage.batchesAborted()).toEqual([false, true, true]);
    await expect(batchPage.cell(2, 1).locator('.htAsyncIndicator')).toHaveCount(0);
    await expect(batchPage.progress).toHaveText('2 of 6 done, 0 failed');

    // The stopped batch answers late; a new run's batch answers after it, so its value landing proves
    // the late answer had its turn.
    await batchPage.classify.click();
    await expect.poll(() => batchPage.batchRows()).toHaveLength(5);
    await batchPage.resolveBatch(1, ['Late', 'Late']);
    await batchPage.resolveBatch(3, ['Kitchen', 'Office']);

    await expect(batchPage.cell(0, 1)).toHaveText('Kitchen');
    // Still empty: only the visually hidden loading text is in the cell.
    await expect(batchPage.cell(2, 1)).toHaveText('Loading...');
    await expect(batchPage.cell(2, 1).locator('.htAsyncIndicator')).toBeVisible();
  });
});
