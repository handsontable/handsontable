import { test, expect, THEMES_TAG } from '../fixtures/test';
import { MergeCellsSelectionHighlightPage } from '../fixtures/pages/MergeCellsSelectionHighlightPage';

/**
 * A merged cell's `fullySelectedMergedCell-N` level matches a plain cell's `area` / `area-N`:
 * the number of ranges that fully cover the merge, minus 1. The fill opacity matches too.
 *
 * `merge()` and `unmerge()` leave the same highlight `mergeSelection()` and `unmergeSelection()`
 * leave when the selection meets the changed area, and they leave a selection that does not meet
 * it untouched. They do not fire the selection hooks.
 */
test.describe('merged cell selection highlight', { tag: THEMES_TAG }, () => {
  let grid: MergeCellsSelectionHighlightPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new MergeCellsSelectionHighlightPage(page, theme, bundle);
    await grid.goto();
  });

  test('a merged cell in a later layer uses the same level as a plain cell of that layer', async() => {
    // B1:B2, then F1:F2. F1:F2 touches F2:G3, so the second range grows to cover the merge.
    // The merge is covered once. A plain cell of that same range (F1) is covered once.
    await grid.selectCells([[0, 1, 1, 1], [0, 5, 1, 5]]);

    const merged = await grid.classNames(1, 5);
    const plain = await grid.classNames(0, 5);

    expect(merged).toContain('fullySelectedMergedCell-0');
    expect(merged).not.toContain('fullySelectedMergedCell-1');
    expect(plain).toContain('area');
    expect(plain).not.toContain('area-1');
    expect(await grid.fillOpacity(1, 5)).toBe(await grid.fillOpacity(0, 5));
  });

  test('overlapping ranges darken a merged cell the way they darken a plain cell', async() => {
    // The first range does not meet F2:G3. The next two both contain it, so the merge is covered
    // twice, at layers 1 and 2. F1 sits in both of those. E1 sits in the first of them only.
    await grid.selectCells([[0, 0, 0, 0], [0, 4, 3, 6], [0, 5, 2, 7]]);

    const merged = await grid.classNames(1, 5);
    const coveredTwice = await grid.classNames(0, 5);
    const coveredOnce = await grid.classNames(0, 4);

    expect(merged).toContain('fullySelectedMergedCell-0');
    expect(merged).toContain('fullySelectedMergedCell-1');
    expect(merged).not.toContain('fullySelectedMergedCell-2');
    expect(coveredTwice).toContain('area');
    expect(coveredTwice).toContain('area-1');
    expect(coveredTwice).not.toContain('area-2');
    expect(coveredOnce).toContain('area');
    expect(coveredOnce).not.toContain('area-1');
    expect(await grid.fillOpacity(1, 5)).toBe(await grid.fillOpacity(0, 5));
    expect(await grid.fillOpacity(1, 5)).not.toBe(await grid.fillOpacity(0, 4));
  });

  test('a column selection then a ctrl-click on a merged cell matches a plain cell ctrl-click', async() => {
    await grid.columnHeader(1).click();
    await grid.cell(1, 5).click({ modifiers: ['ControlOrMeta'] });

    const merged = await grid.classNames(1, 5);
    const plain = await grid.classNames(0, 0);

    // Column B does not cover F2:G3. The click is one range, same as ctrl-clicking a plain cell.
    expect(merged).toContain('fullySelectedMergedCell-0');
    expect(merged).not.toContain('fullySelectedMergedCell-1');
    expect(plain.filter(name => name === 'area' || name.startsWith('area-'))).toEqual([]);

    await grid.cell(4, 0).click({ modifiers: ['ControlOrMeta'] });

    const clickedPlain = await grid.classNames(4, 0);

    expect(clickedPlain).toContain('area');
    expect(clickedPlain).not.toContain('area-1');
    expect(await grid.classNames(1, 5)).toContain('fullySelectedMergedCell-0');
    expect(await grid.classNames(1, 5)).not.toContain('fullySelectedMergedCell-1');
    expect(await grid.fillOpacity(1, 5)).toBe(await grid.fillOpacity(4, 0));
  });

  test('merge() leaves the single-cell highlight mergeSelection() leaves', async() => {
    await grid.selectCell(5, 2, 7, 4);

    const hooksBeforeMerge = await grid.selectionHookCounts();

    await grid.merge(5, 2, 7, 4);

    const hooksAfterMerge = await grid.selectionHookCounts();
    const merged = await grid.classNames(5, 2);

    expect(merged).toContain('current');
    expect(merged).not.toContain('area');
    expect(merged.filter(name => name.startsWith('fullySelectedMergedCell'))).toEqual([]);
    await expect(grid.cell(5, 2)).toHaveAttribute('rowspan', '3');
    await expect(grid.cell(5, 2)).toHaveAttribute('colspan', '3');
    expect(await grid.highlight()).toEqual({ row: 5, col: 2 });
    expect(hooksAfterMerge.afterSelection - hooksBeforeMerge.afterSelection).toBe(0);
    expect(hooksAfterMerge.afterSelectionEnd - hooksBeforeMerge.afterSelectionEnd).toBe(0);
    expect(hooksAfterMerge.beforeSelectionHighlightSet - hooksBeforeMerge.beforeSelectionHighlightSet).toBe(0);

    await grid.goto();
    await grid.selectCell(5, 2, 7, 4);
    await grid.mergeSelection();

    const fromMenu = await grid.classNames(5, 2);

    expect(fromMenu).toContain('current');
    expect(fromMenu).not.toContain('area');
    expect(fromMenu.filter(name => name.startsWith('fullySelectedMergedCell'))).toEqual([]);
  });

  test('unmerge() restores the range highlight unmergeSelection() restores', async() => {
    await grid.selectCell(1, 1, 3, 3);

    const hooksBeforeUnmerge = await grid.selectionHookCounts();

    await grid.unmerge(1, 1, 3, 3);

    const hooksAfterUnmerge = await grid.selectionHookCounts();
    const anchor = await grid.classNames(1, 1);

    expect(anchor).toContain('current');
    expect(anchor).toContain('area');
    expect(await grid.selected()).toEqual([[1, 1, 3, 3]]);
    expect(await grid.highlight()).toEqual({ row: 1, col: 1 });
    expect(hooksAfterUnmerge.afterSelection - hooksBeforeUnmerge.afterSelection).toBe(0);
    expect(hooksAfterUnmerge.afterSelectionEnd - hooksBeforeUnmerge.afterSelectionEnd).toBe(0);
    expect(hooksAfterUnmerge.beforeSelectionHighlightSet - hooksBeforeUnmerge.beforeSelectionHighlightSet).toBe(0);

    await grid.goto();
    await grid.selectCell(1, 1, 3, 3);
    await grid.unmergeSelection();

    const fromMenu = await grid.classNames(1, 1);

    expect(fromMenu).toContain('current');
    expect(fromMenu).toContain('area');
    expect(await grid.selected()).toEqual([[1, 1, 3, 3]]);
  });

  test('merge() and unmerge() leave a selection that does not meet the area', async() => {
    await grid.selectCell(0, 0, 0, 0);
    await grid.scrollHolderTo(80);

    const hooksBefore = await grid.selectionHookCounts();

    await grid.merge(8, 6, 9, 7);

    expect(await grid.selected()).toEqual([[0, 0, 0, 0]]);
    expect(await grid.highlight()).toEqual({ row: 0, col: 0 });
    expect(await grid.holderScrollTop()).toBe(80);
    expect(await grid.selectionHookCounts()).toEqual(hooksBefore);

    const hooksAfterMerge = await grid.selectionHookCounts();

    await grid.unmerge(1, 5, 2, 6);

    expect(await grid.selected()).toEqual([[0, 0, 0, 0]]);
    expect(await grid.highlight()).toEqual({ row: 0, col: 0 });
    expect(await grid.holderScrollTop()).toBe(80);
    expect(await grid.selectionHookCounts()).toEqual(hooksAfterMerge);

    await grid.scrollHolderTo(0);
    expect(await grid.classNames(0, 0)).toContain('current');
    expect(await grid.classNames(0, 0)).not.toContain('area');
    await expect(grid.cell(1, 5)).not.toHaveAttribute('rowspan');
  });

  test('merge() does not fire afterSelection, so a listener there does not run', async() => {
    await grid.selectCell(5, 2, 7, 4);
    await grid.callAgainFromAfterSelection('merge', 5, 2, 7, 4);

    const hooksBefore = await grid.selectionHookCounts();

    await grid.merge(5, 2, 7, 4);

    const merged = await grid.classNames(5, 2);

    // There is no selection replay, so the listener never runs. The highlight is still the single cell.
    expect(await grid.reentryCalls()).toBe(0);
    expect((await grid.selectionHookCounts()).afterSelection - hooksBefore.afterSelection).toBe(0);
    expect(merged).toContain('current');
    expect(merged).not.toContain('area');
    await expect(grid.cell(5, 2)).toHaveAttribute('rowspan', '3');
  });

  test('unmerge() does not fire afterSelection, so a listener there does not run', async() => {
    await grid.selectCell(1, 1, 3, 3);
    await grid.callAgainFromAfterSelection('unmerge', 1, 1, 3, 3);

    const hooksBefore = await grid.selectionHookCounts();

    await grid.unmerge(1, 1, 3, 3);

    const anchor = await grid.classNames(1, 1);

    expect(await grid.reentryCalls()).toBe(0);
    expect((await grid.selectionHookCounts()).afterSelection - hooksBefore.afterSelection).toBe(0);
    expect(anchor).toContain('current');
    expect(anchor).toContain('area');
    await expect(grid.cell(1, 1)).not.toHaveAttribute('rowspan');
  });

  test('merge() closes an open editor without writing its value, as mergeSelection() does', async() => {
    await grid.selectCell(5, 2, 7, 4);
    await grid.openEditor();
    await grid.page.locator('textarea.handsontableInput').fill('kept');

    expect(await grid.editorState()).toEqual({ opened: true, value: 'kept' });

    await grid.merge(5, 2, 7, 4);

    // The edit is dropped. The closed editor then shows the cell value: nothing re-prepares it.
    expect(await grid.editorState()).toEqual({ opened: false, value: 'C6' });
    expect(await grid.dataAt(5, 2)).toBe('C6');
    await expect(grid.cell(5, 2)).toHaveAttribute('rowspan', '3');

    await grid.goto();
    await grid.selectCell(5, 2, 7, 4);
    await grid.openEditor();
    await grid.page.locator('textarea.handsontableInput').fill('kept');
    await grid.mergeSelection();

    expect(await grid.editorState()).toEqual({ opened: false, value: '' });
    expect(await grid.dataAt(5, 2)).toBe('C6');
  });

  test('merge() keeps the scroll position when the overlapping selection runs out of view', async() => {
    // Column H misses the merges that already exist. The selection runs past the top of the viewport.
    await grid.selectCell(0, 7, 8, 7);
    await grid.scrollHolderTo(80);

    const hooksBefore = await grid.selectionHookCounts();

    await grid.merge(5, 7, 7, 7);

    expect(await grid.holderScrollTop()).toBe(80);
    expect(await grid.selected()).toEqual([[0, 7, 8, 7]]);
    expect(await grid.highlight()).toEqual({ row: 0, col: 7 });
    expect((await grid.selectionHookCounts()).afterSelection).toBe(hooksBefore.afterSelection);
    await expect(grid.cell(5, 7)).toHaveAttribute('rowspan', '3');
  });

  test('merge() keeps every layer when only one of them meets the area', async() => {
    await grid.selectCells([[0, 0, 0, 0], [5, 2, 7, 4], [4, 0, 4, 0]]);

    const activeBefore = await grid.classNames(4, 0);
    const otherBefore = await grid.classNames(0, 0);
    const anchorBefore = await grid.classNames(5, 2);

    await grid.merge(5, 2, 7, 4);

    const anchorAfter = await grid.classNames(5, 2);

    expect(await grid.selected()).toEqual([[0, 0, 0, 0], [5, 2, 7, 4], [4, 0, 4, 0]]);
    expect(await grid.highlight()).toEqual({ row: 4, col: 0 });
    expect(await grid.classNames(4, 0)).toEqual(activeBefore);
    expect(await grid.classNames(0, 0)).toEqual(otherBefore);
    expect(anchorAfter.filter(name => name === 'area' || name.startsWith('area-') || name === 'current'))
      .toEqual(anchorBefore.filter(name => name === 'area' || name.startsWith('area-') || name === 'current'));
    expect(anchorAfter).toContain('fullySelectedMergedCell-0');
    await expect(grid.cell(5, 2)).toHaveAttribute('rowspan', '3');
    await expect(grid.cell(5, 2)).toHaveAttribute('colspan', '3');
  });

  test('merge() fires no selection hooks, for one layer and for several', async() => {
    await grid.selectCell(5, 2, 7, 4);

    const oneLayerBefore = await grid.selectionHookCounts();

    await grid.merge(5, 2, 7, 4);

    const oneLayer = hookDelta(oneLayerBefore, await grid.selectionHookCounts());

    expect(oneLayer.beforeSetRangeStartOnly).toBe(0);
    expect(oneLayer.beforeSetRangeEnd).toBe(0);
    expect(oneLayer.beforeSelectionHighlightSet).toBe(0);
    expect(oneLayer.afterSelection).toBe(0);
    expect(oneLayer.afterSelectionByProp).toBe(0);
    expect(oneLayer.afterSelectionEnd).toBe(0);
    expect(oneLayer.afterSelectionEndByProp).toBe(0);
    expect(oneLayer.afterIsMultipleSelection).toBe(0);

    await grid.goto();
    await grid.selectCells([[0, 0, 0, 0], [5, 2, 7, 4], [4, 0, 4, 0]]);

    const threeLayersBefore = await grid.selectionHookCounts();

    await grid.merge(5, 2, 7, 4);

    const threeLayers = hookDelta(threeLayersBefore, await grid.selectionHookCounts());

    expect(threeLayers.beforeSetRangeStartOnly).toBe(0);
    expect(threeLayers.beforeSetRangeEnd).toBe(0);
    expect(threeLayers.beforeSelectionHighlightSet).toBe(0);
    expect(threeLayers.afterSelection).toBe(0);
    expect(threeLayers.afterSelectionByProp).toBe(0);
    expect(threeLayers.afterSelectionEnd).toBe(0);
    expect(threeLayers.afterSelectionEndByProp).toBe(0);
    expect(threeLayers.afterIsMultipleSelection).toBe(0);
  });

  test('merge() inside batch() with selectAll() recomputes the highlight and fires no selection hooks', async() => {
    await grid.selectAll();

    const selectedBefore = await grid.selected();
    const hooksBefore = await grid.selectionHookCounts();

    await grid.batchMerges([[0, 0, 0, 2], [4, 0, 5, 1]]);

    const mergedTop = await grid.classNames(0, 0);
    const mergedLower = await grid.classNames(4, 0);
    const deltas = hookDelta(hooksBefore, await grid.selectionHookCounts());

    expect(await grid.selected()).toEqual(selectedBefore);
    expect(Object.values(deltas).every(count => count === 0)).toBe(true);
    expect(mergedTop).toContain('area');
    expect(mergedTop).toContain('fullySelectedMergedCell-0');
    expect(mergedLower).toContain('area');
    expect(mergedLower).toContain('fullySelectedMergedCell-0');
    await expect(grid.cell(0, 0)).toHaveAttribute('colspan', '3');
    await expect(grid.cell(4, 0)).toHaveAttribute('rowspan', '2');
    await expect(grid.cell(4, 0)).toHaveAttribute('colspan', '2');
  });
});

/**
 * Counts each selection hook fired between two snapshots.
 */
function hookDelta(
  before: Record<string, number>,
  after: Record<string, number>,
): Record<string, number> {
  return Object.fromEntries(Object.keys(after).map(key => [key, after[key] - before[key]]));
}
