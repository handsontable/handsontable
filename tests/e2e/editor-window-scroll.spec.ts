import { test, expect } from '../fixtures/test';
import { EditorScrollPage } from '../fixtures/pages/EditorScrollPage';

/**
 * The open editor must track its cell while the WINDOW scrolls — migrated
 * from the legacy textEditor spec "editor should move with the page when
 * scrolled with fixed rows and horizontal overflow without a set height",
 * skipped since the 2025 viewport refactor with the note that the editor no
 * longer moves on window scroll (DEV-2183).
 *
 * A regular cell moves with the page, and the editor's offset from its cell
 * must not change. A cell pinned by a frozen overlay is not covered here: the
 * editor still drifts away from it (DEV-2201).
 */
test.describe('editor position on window scroll', () => {
  let grid: EditorScrollPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new EditorScrollPage(page, theme, bundle);
    await grid.goto();
  });

  test('tracks a regular cell while the window scrolls', async () => {
    const cell = grid.cell(10, 4);

    await grid.openEditorAt(cell);

    const before = await grid.editorOffsetFromCell(cell);

    await grid.scrollWindowBy(0, 150);

    const after = await grid.editorOffsetFromCell(cell);

    expect(Math.abs(after.dx - before.dx)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.dy - before.dy)).toBeLessThanOrEqual(1);
  });
});
