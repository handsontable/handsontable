import { test, expect, THEMES_TAG } from '../fixtures/test';
import { NestedHeadersAutosizeInitPage } from '../fixtures/pages/NestedHeadersAutosizeInitPage';

/**
 * NestedHeaders and CollapsibleColumns build their header tree in their ready step, before the `init` hook. So
 * AutoColumnSize, which measures every column from its `init` listener, reads the real bottom-level labels on the
 * first measure. Before, it ran ahead of NestedHeaders' own `init` listener, read every label as empty, and the
 * columns came out 1–2 px narrower than after the next data load re-measured them: the widths jumped.
 *
 * The widths depend on measured text and the theme's padding, which jsdom does not lay out, so they are checked here.
 */
test.describe('nested header widths at init', { tag: THEMES_TAG }, () => {
  test('are final from the first render and measured once', async({ page, theme, bundle }) => {
    const grid = new NestedHeadersAutosizeInitPage(page, theme, bundle);

    await grid.goto();

    const [firstRender] = await grid.widthsPerRender();

    expect(await grid.fullMeasures()).toBe(1);

    await grid.reloadData();
    await grid.updateSettings();

    // Every render, from the first one through a data reload and a settings update, draws the same widths.
    await expect.poll(async() => new Set(await grid.widthsPerRender())).toEqual(new Set([firstRender]));
    // The reload measured once more; nothing else did.
    expect(await grid.fullMeasures()).toBe(2);
  });
});
