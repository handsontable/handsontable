import { test, expect } from '../fixtures/test';
import { AutoRowHeaderSizePage } from '../fixtures/pages/AutoRowHeaderSizePage';

/**
 * DEV-2623. AutoRowHeaderSize sizes each row header column to its own widest label. Both halves of
 * "correct" here are geometry, so neither can be checked in jsdom, where every width reads as zero:
 * the longest label must not be cut off, and it must not sit flush against the cell border either.
 *
 * The second half is the one that regressed. The grid's own row header renderer wraps its label in
 * a padded element, but a renderer pushed through `afterGetRowHeaderRenderers` writes straight into
 * the `th` and carries no padding, so measuring the cell exactly left the text touching the border.
 */
test.describe('AutoRowHeaderSize geometry', () => {
  let grid: AutoRowHeaderSizePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new AutoRowHeaderSizePage(page, theme, bundle);
    await grid.goto();
  });

  test('shows the longest label of every level in full', async () => {
    expect(await grid.isClipped('line-item-header', AutoRowHeaderSizePage.WIDEST_LINE_ITEM)).toBe(false);
    expect(await grid.isClipped('group-header', AutoRowHeaderSizePage.WIDEST_GROUP)).toBe(false);
  });

  test('leaves room around a label a custom renderer draws with no padding of its own', async () => {
    const lineItemSlack = await grid.slackAround(
      'line-item-header', AutoRowHeaderSizePage.WIDEST_LINE_ITEM
    );
    const groupSlack = await grid.slackAround('group-header', AutoRowHeaderSizePage.WIDEST_GROUP);

    // Asserted as a floor, not an equality: the exact figure depends on each theme's font. Measured
    // exactly, these two cells came out with under 2px around the whole label - which is what
    // "the text touches the border" looks like as a number.
    expect(lineItemSlack).toBeGreaterThan(4);
    expect(groupSlack).toBeGreaterThan(4);
  });

  test('sizes each level to its own labels, not to the widest of them all', async () => {
    const lineItem = await grid.cellWidth('line-item-header', AutoRowHeaderSizePage.WIDEST_LINE_ITEM);
    const group = await grid.cellWidth('group-header', AutoRowHeaderSizePage.WIDEST_GROUP);

    // "Cost of goods sold" is six characters longer than "Direct costs", so its level has to come
    // out wider. Sizing every level by the first one's labels made these equal.
    expect(lineItem).toBeGreaterThan(group + 10);
  });
});
