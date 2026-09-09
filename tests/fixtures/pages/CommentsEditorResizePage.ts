import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * How far inside the textarea's bottom-end corner the resizer is pressed.
 *
 * The native resizer's hit area is about 16px square, so any small inset lands on it. The value
 * matters for a second reason: it is the distance the pointer has to outrun for the browser to
 * report an element other than the textarea mid-drag, which is the whole mechanism under test. A
 * drag step must therefore be LARGER than this, or the gesture never reproduces the defect and the
 * spec goes green against unfixed code.
 */
const GRAB_INSET = 4;

/**
 * Page Object for the comment editor resize fixture (DEV-2871).
 *
 * The editor is a portal element on the document, not a descendant of the grid, so its locators
 * are rooted at the page. Everything here drives a REAL pointer: the plugin decides what to show
 * and hide from "mouseover"/"mousedown" targets, so a dispatched event or a `locator.click()` on
 * the wrong element tests nothing.
 */
export class CommentsEditorResizePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The grid container.
   *
   * @returns {Locator}
   */
  get grid(): Locator {
    return this.page.getByTestId('grid');
  }

  /**
   * The comment editor's outer element - the one the plugin shows and hides.
   *
   * @returns {Locator}
   */
  get editor(): Locator {
    return this.page.locator('.htComments');
  }

  /**
   * The comment editor's textarea, which is the element the user resizes.
   *
   * @returns {Locator}
   */
  get textarea(): Locator {
    return this.page.locator('.htCommentTextArea');
  }

  /**
   * A grid cell, by visual coordinates. The test id comes from the fixture's `afterRenderer`.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Opens the fixture.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/comments-editor-resize.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Wait for the bundle before the cell. The test id comes from the fixture's `afterRenderer`, so
    // "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
    await awaitBundle(this.page);

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Hovers a cell with a real pointer and lets the plugin's debounced show run, then asserts the
   * editor opened. The textarea is deliberately NOT focused - hover mode is the state the defect
   * lives in, because a focused editor makes every "mouseover" a no-op.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async openEditorByHover(row: number, col: number): Promise<void> {
    await this.cell(row, col).hover();

    // Past the plugin's 250ms display delay, deterministically. The spec installs the fake clock;
    // a longer assertion timeout would not do, because `toBeVisible()` resolves the moment it is
    // true and so would never observe a boundary.
    await this.page.clock.runFor(400);

    await expect(this.editor).toBeVisible();
  }

  /**
   * Presses the native resizer in the textarea's bottom-end corner and leaves the button down.
   *
   * @returns {Promise<{x: number, y: number}>} The pressed point, so a drag can be expressed
   *                                            relative to it.
   */
  async pressResizeGrip(): Promise<{ x: number, y: number }> {
    const box = await this.textarea.boundingBox();

    expect(box, 'the textarea must have a box before it can be resized').not.toBeNull();

    const grip = {
      x: box!.x + box!.width - GRAB_INSET,
      y: box!.y + box!.height - GRAB_INSET,
    };

    await this.page.mouse.move(grip.x, grip.y);
    await this.page.mouse.down();

    return grip;
  }

  /**
   * Moves the pointer to an absolute point in one jump, which is what a quick drag looks like to
   * the browser. One jump is enough: the browser resolves the moved-to element against the
   * textarea's PRE-resize box, so a single step wider than `GRAB_INSET` reports the element
   * underneath and is what used to arm the hide.
   *
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  async dragPointerTo(x: number, y: number): Promise<void> {
    await this.page.mouse.move(x, y);
  }

  /**
   * Releases the pointer button.
   */
  async releasePointer(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * The textarea's rendered width, which follows the resizer immediately and needs no observer.
   *
   * @returns {Promise<number>}
   */
  async textareaWidth(): Promise<number> {
    const box = await this.textarea.boundingBox();

    return box ? box.width : 0;
  }

  /**
   * The size the plugin persisted to the comment's cell meta, or undefined before any resize.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<{width: number, height: number} | undefined>}
   */
  async commentStyle(
    row: number, col: number
  ): Promise<{ width: number, height: number } | undefined> {
    return this.page.evaluate(([r, c]) => (window as unknown as {
      commentStyle: (row: number, col: number) => { width: number, height: number } | undefined
    }).commentStyle(r as number, c as number), [row, col]);
  }
}
