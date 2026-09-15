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
 * Each test says below whether it is red on unfixed code and why. Three cover the reported defect
 * itself. Three more cover defects the FIX introduced, all found in review and all invisible to the
 * happy path: the editor stuck open when the pointer returned to the cell it left the editor for,
 * the editor swapping to another cell's comment, and a press with no release killing hover
 * switching. The rest are pins on behavior the fix had to preserve.
 *
 * Two gestures do NOT do what their names suggest, and the comments say so where it matters: the
 * browser's resizer keeps the grab offset, so the pointer stays inside the textarea for a whole
 * drag however far it travels, and reaching a release over a CELL takes an explicit move off the
 * corner first.
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
    // ever keyed on the pointer still being over the textarea at release time.
    //
    // The release itself lands INSIDE the textarea, not on a cell: the browser's resizer keeps the
    // grab offset, so the corner tracks GRAB_INSET outside the pointer for the whole drag. The
    // release-over-a-cell case is the test below, which moves the pointer off the corner first.
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

    await grid.hoverCellWithoutComment();
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
    await grid.hoverCellWithoutComment();
    await page.clock.runFor(400);

    await expect(grid.editor).toBeHidden();
  });

  test('still hides the editor after a drag released over a cell', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    // Measured before the press: mid-drag the resizer holds the pointer, so the cell has to be
    // aimed at by coordinate rather than through `hover()`.
    const cellPoint = await grid.cellWithoutCommentPoint();
    const grip = await grid.pressResizeGrip();

    // Shrink first, then step the pointer off the corner onto a comment-less cell BEFORE releasing.
    // Dragging alone never gets there - the resizer keeps the grab offset, so the pointer stays
    // inside the textarea for the whole drag - and this is the gesture that ends with the hold flag
    // cleared while the pointer sits on a cell, which is where a stale `#cellBelowCursor` would
    // swallow that cell's hide.
    await grid.dragPointerTo(grip.x - 120, grip.y - 50);
    await grid.dragPointerTo(cellPoint.x, cellPoint.y);
    await grid.releasePointer();
    await page.clock.runFor(400);

    // Still open, and correctly so: the release itself is not a pointer move, so nothing has asked
    // for a hide yet. The editor goes away on the next move, which is the assertion that matters.
    await expect(grid.editor).toBeVisible();

    // A different cell, because the pointer is already resting on the one the drag ended over.
    await grid.hoverOtherCellWithoutComment();
    await page.clock.runFor(400);

    await expect(grid.editor).toBeHidden();
  });

  test('hides the editor when the pointer returns to the same cell it left the editor for', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    // RED before the `#cellBelowCursor = null` in the textarea branch. The early return that cancels
    // the hide also skips the field's write, so it kept naming this cell; coming back to it matched
    // the `=== target` short circuit, armed no hide, and the editor stayed open indefinitely. Going
    // to a DIFFERENT cell always worked, which is what made it easy to miss.
    await grid.hoverCellWithoutComment();
    await page.clock.runFor(100);
    await grid.hoverEditor();
    await page.clock.runFor(100);
    await grid.hoverCellWithoutComment();

    await page.clock.runFor(400);

    await expect(grid.editor).toBeHidden();
  });

  test('does not swap to another cell comment when the pointer rests on the editor', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    const firstComment = await grid.editorValue();

    // RED before `keepVisible()`. Arm a show for the second commented cell, overrule it with a hide
    // from a comment-less cell, then land on the editor inside the same delay: cancelling the hide
    // set `wasLastActionShow` back to `true`, which revived that show, and the editor swapped to the
    // other cell's comment and jumped to it while the pointer rested on it.
    await grid.cell(3, 0).hover();
    await page.clock.runFor(60);
    await grid.hoverCellWithoutComment();
    await page.clock.runFor(60);
    await grid.hoverEditor();

    await page.clock.runFor(600);

    await expect(grid.editor).toBeVisible();
    expect(await grid.editorValue()).toBe(firstComment);
  });

  test('keeps the editor open while the grip is held, without focusing it', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    const grip = await grid.pressResizeGrip();

    // The PREMISE of the whole hold-flag half of the fix, and the reason it is needed at all: a
    // press on the resizer does NOT focus the textarea. A focused editor is held open by the
    // `isFocused()` short circuit at the top of `#onMouseOver` and needs nothing else - so if the
    // grip press focused it, the flag would be dead weight. Every OTHER press on the editor does
    // focus it, which is why no test here can observe a stranded flag: focus holds the editor open
    // in exactly those cases anyway.
    expect(await grid.editorIsFocused()).toBe(false);

    await grid.dragPointerTo(grip.x + 180, grip.y + 120);
    await page.clock.runFor(400);

    await expect(grid.editor).toBeVisible();

    await grid.releasePointer();
  });

  test('still opens the editor on hover after a resize drag', async ({ page }) => {
    await grid.openEditorByHover(1, 1);

    const grip = await grid.pressResizeGrip();

    await grid.dragPointerTo(grip.x + 180, grip.y + 120);
    await grid.releasePointer();

    await grid.hoverCellWithoutComment();
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
