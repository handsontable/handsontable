import { test, expect } from '../fixtures/test';
import { CommentsEditorResizePage } from '../fixtures/pages/CommentsEditorResizePage';

/**
 * DEV-2871 (reported as DEV-65). The comment editor disappeared while the user was still dragging
 * its resize grip.
 *
 * The mechanism is a browser one, which is why this tier is the only one that can see it. The
 * browser resolves the element a "mousemove" moved onto against the textarea's PRE-resize box and
 * applies the new size afterwards, so one drag step wider than the distance from the pressed point
 * to the box edge reports the element UNDERNEATH the pointer. That reaches the plugin's
 * `#onMouseOver` hide branch and arms `DisplaySwitch`'s 250ms timer; the next event, back over the
 * grown textarea, cancelled nothing. jsdom never produces that event, so a unit test cannot
 * express any of this.
 *
 * Two things make these tests observe the boundary rather than race it. The fake clock crosses the
 * 250ms hide delay deterministically - `toBeVisible()` resolves the instant it is true, so a
 * longer assertion timeout would never see a hide that is still pending, and `waitForTimeout` is
 * banned here for that reason. And the drag is a single wide jump, which is the gesture that
 * produces the stray event; a drag in steps narrower than the grab inset keeps the pointer inside
 * the old box, arms nothing, and passes against unfixed code.
 *
 * Three of the seven tests are red on unfixed code, and each says below why it is red or why it is
 * not. The growing drag and the leave-and-return case fail on the behavior they name; the
 * "still hides after a resize" case fails at its own precondition, because the editor is already
 * gone by the time it looks. The other four are pins: a SHRINKING drag never leaves the box, so it
 * passed before the fix and is here to keep passing, and the three hide cases pin behavior the fix
 * had to preserve - the editor must still go away when the pointer genuinely leaves, and the drag
 * must leave neither the hold flag nor the hit-test state behind.
 */
test.describe('Comment editor resizing', () => {
  let grid: CommentsEditorResizePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    await page.clock.install();

    grid = new CommentsEditorResizePage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the editor open while the resize drag outruns the textarea edge', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    const widthBefore = await grid.textareaWidth();
    const grip = await grid.pressResizeGrip();

    await grid.dragPointerTo(grip.x + 220, grip.y + 160);

    // The test's PREMISE, not a repeated wait: unless the textarea actually grew, the press missed
    // the native resizer and every assertion below would pass on a gesture that did nothing.
    expect(await grid.textareaWidth()).toBeGreaterThan(widthBefore);

    // Past the hide delay while the button is still down - this is the moment the editor used to
    // vanish under the user's cursor.
    await page.clock.runFor(400);

    await expect(grid.editor).toBeVisible();

    await grid.releasePointer();
    await page.clock.runFor(400);

    await expect(grid.editor).toBeVisible();
  });

  test('keeps the editor open when the drag is released outside the textarea', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    const grip = await grid.pressResizeGrip();

    // A PIN, green before the fix: shrinking keeps the pointer inside the box, because the box
    // follows it inward, so no stray event is ever produced. It is here because the fix holds the
    // editor open for the whole gesture, and this is the case that would notice if that hold were
    // ever keyed on the pointer still being over the textarea at release time. Shrinking drags the
    // corner back over the grid, so the release lands on a cell rather than on the editor.
    await grid.dragPointerTo(grip.x - 60, grip.y - 30);
    await grid.releasePointer();

    await page.clock.runFor(400);

    await expect(grid.editor).toBeVisible();
  });

  test('keeps the editor open when the pointer leaves it and comes straight back', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    const box = await grid.textarea.boundingBox();

    expect(box).not.toBeNull();

    // No resize involved. This is the same uncancelled timer, reached by hand: stepping off the
    // editor arms the hide, and returning to the editor - well inside the 250ms delay - has to
    // call it off. Returning to the commented CELL always worked, because a show cancels hiding.
    await grid.dragPointerTo(box!.x + box!.width + 40, box!.y + box!.height + 40);
    await page.clock.runFor(100);
    await grid.dragPointerTo(box!.x + 40, box!.y + 20);

    await page.clock.runFor(400);

    await expect(grid.editor).toBeVisible();
  });

  test('still hides the editor when the pointer moves to a cell without a comment', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    await grid.cell(5, 3).hover();
    await page.clock.runFor(400);

    await expect(grid.editor).toBeHidden();
  });

  test('still hides the editor after a resize once the pointer moves away', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    const grip = await grid.pressResizeGrip();

    await grid.dragPointerTo(grip.x + 180, grip.y + 120);
    await grid.releasePointer();
    await page.clock.runFor(400);

    await expect(grid.editor).toBeVisible();

    // The drag holds the editor open through a flag that the document's "mouseup" clears. If it
    // were left set, the editor would never hide again and hover switching would be dead.
    await grid.cell(5, 3).hover();
    await page.clock.runFor(400);

    await expect(grid.editor).toBeHidden();
  });

  test('still hides the editor after a shrinking drag released over the grid', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    const grip = await grid.pressResizeGrip();

    // Shrinking releases the pointer over the grid rather than over the editor, so this is the
    // gesture that could leave hit-test state pointing at a cell. `#cellBelowCursor` feeds a
    // `=== target` short circuit, and a value left over from the gesture would swallow the hide
    // for whichever cell it named.
    await grid.dragPointerTo(grip.x - 120, grip.y - 50);
    await grid.releasePointer();
    await page.clock.runFor(400);

    await expect(grid.editor).toBeVisible();

    await grid.cell(4, 2).hover();
    await page.clock.runFor(400);

    await expect(grid.editor).toBeHidden();
  });

  test('still opens the editor on hover after a resize drag', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    const grip = await grid.pressResizeGrip();

    await grid.dragPointerTo(grip.x + 180, grip.y + 120);
    await grid.releasePointer();

    await grid.cell(5, 3).hover();
    await page.clock.runFor(400);
    await expect(grid.editor).toBeHidden();

    // The second half of the same guarantee: the flag has to be clear enough for a fresh hover to
    // open the editor again, not only for the old one to close.
    await grid.openEditorByHover(1, 1);

    await expect(grid.editor).toBeVisible();
  });
});

/**
 * The persisted size gets its own describe because it is the one assertion that must run on REAL
 * timers. The plugin writes the size from the editor's `ResizeObserver`, whose delivery rides the
 * browser's rendering steps rather than a page timer, so it must not be observed through a faked
 * clock. `expect.poll` resolves as soon as the write lands and needs no fixed wait.
 */
test.describe('Comment editor resizing — persisted size', () => {
  let grid: CommentsEditorResizePage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new CommentsEditorResizePage(page, theme, bundle);
    await grid.goto();
  });

  test('writes the dragged size to the comment cell meta', async () => {
    await grid.cell(1, 1).hover();
    await expect(grid.editor).toBeVisible();

    expect(await grid.commentStyle(1, 1)).toBeUndefined();

    const widthBefore = await grid.textareaWidth();
    const grip = await grid.pressResizeGrip();

    await grid.dragPointerTo(grip.x + 200, grip.y + 140);
    await grid.releasePointer();

    await expect.poll(async () => (await grid.commentStyle(1, 1))?.width)
      .toBeGreaterThan(widthBefore);
  });
});
