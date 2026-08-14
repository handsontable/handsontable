import { test, expect } from '../fixtures/test';
import { EditorScrollPage } from '../fixtures/pages/EditorScrollPage';

/**
 * The open editor must track its cell while the WINDOW scrolls — migrated
 * from the legacy textEditor spec "editor should move with the page when
 * scrolled with fixed rows and horizontal overflow without a set height",
 * skipped since the 2025 viewport refactor with the note that the editor no
 * longer moves on window scroll (DEV-2183).
 *
 * Two cases, because the two positioning mechanisms differ: a frozen-corner
 * cell is pinned by its overlay (the cell holds still in viewport coordinates
 * while the page scrolls under it), and a regular cell moves with the page.
 * In both, the editor's offset from its cell must not change.
 */
test.describe('editor position on window scroll', () => {
  let grid: EditorScrollPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new EditorScrollPage(page, theme, bundle);
    await grid.goto();
  });

  // Known product bug (verified 2026-08-07, migrated from the legacy skip):
  // when the edited cell lives in a PINNED overlay, the editor scrolls away
  // with the page instead of holding to the pinned cell — 184px drift after a
  // 200px window scroll (the 16px body margin pins the overlay late). The
  // regular-cell case below passes. Unskip with the fix (DEV-2201).
  // eslint-disable-next-line no-restricted-syntax -- DEV-2201: pinned-overlay editor drift; unskip with the fix
  test.fixme('tracks a frozen-corner cell while the window scrolls', async () => {
    const cell = grid.frozenCornerCell(1, 1);

    await grid.openEditorAt(cell);

    const before = await grid.editorOffsetFromCell(cell);

    await grid.scrollWindowBy(0, 200);

    const after = await grid.editorOffsetFromCell(cell);

    expect(Math.abs(after.dx - before.dx)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.dy - before.dy)).toBeLessThanOrEqual(1);
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
