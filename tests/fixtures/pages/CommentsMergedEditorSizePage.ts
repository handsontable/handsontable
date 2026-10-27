import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, assertKnownBundle } from '../bundle';

/**
 * Page Object for the merged-cell comment editor fixture: merged ranges of several shapes, each with
 * a comment, and a plain commented cell to compare against.
 *
 * The editor is opened through the plugin API, not a hover, so the box is measured against a cell
 * the pointer never moved.
 */
export class CommentsMergedEditorSizePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    assertKnownBundle(bundle);
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The comment editor's textarea, the element the user sees and resizes.
   *
   * @returns {Locator}
   */
  get textarea(): Locator {
    return this.page.locator('.htCommentTextArea');
  }

  /**
   * Opens the fixture and waits for the bundle and the grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/comments-merged-editor-size.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
  }

  /**
   * Opens the comment editor of a cell through the plugin API.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async showEditorAt(row: number, col: number): Promise<void> {
    await this.page.evaluate(({ r, c }) => {
      (window as any).hot.getPlugin('comments').showAtCell(r, c);
    }, { r: row, c: col });

    await expect(this.textarea).toBeVisible();
  }

  /**
   * The editor's textarea height and the height of the rendered cell it belongs to, read in one
   * evaluation so a re-render between two round trips cannot pair a box with another cell.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<{ editor: number, cell: number }>}
   */
  async heights(row: number, col: number): Promise<{ editor: number, cell: number }> {
    return this.page.evaluate(({ testId }) => {
      // The master table's cell spans the whole merged block. A frozen overlay draws its own copy, cut at
      // the freeze line, and is the only one there is for a block that sits wholly in the frozen rows.
      const cell = (document.querySelector(`.ht_master [data-testid="${testId}"]`)
        ?? document.querySelector(`[data-testid="${testId}"]`)) as HTMLElement;
      const textarea = document.querySelector('.htCommentTextArea') as HTMLElement;

      return {
        editor: textarea.getBoundingClientRect().height,
        cell: cell.getBoundingClientRect().height,
      };
    }, { testId: `cell-${row}-${col}` });
  }

  /**
   * The vertical extent of the rendered cell and of the editor's textarea, in viewport pixels, read in
   * one evaluation.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<{ cell: { top: number, bottom: number }, editor: { top: number, bottom: number } }>}
   */
  async verticalExtents(row: number, col: number): Promise<{
    cell: { top: number, bottom: number },
    editor: { top: number, bottom: number },
  }> {
    return this.page.evaluate(({ testId }) => {
      const cell = (document.querySelector(`.ht_master [data-testid="${testId}"]`)
        ?? document.querySelector(`[data-testid="${testId}"]`)) as HTMLElement;
      const cellBox = cell.getBoundingClientRect();
      const editorBox = (document.querySelector('.htCommentTextArea') as HTMLElement).getBoundingClientRect();

      return {
        cell: { top: cellBox.top, bottom: cellBox.bottom },
        editor: { top: editorBox.top, bottom: editorBox.bottom },
      };
    }, { testId: `cell-${row}-${col}` });
  }

  /**
   * Freezes the top rows of the grid, so an overlay draws the part of a merged range that sits in them.
   *
   * @param {number} count How many rows to freeze.
   */
  async freezeTopRows(count: number): Promise<void> {
    await this.page.evaluate((rows) => {
      (window as any).hot.updateSettings({ fixedRowsTop: rows });
    }, count);
    await expect(this.page.locator('.ht_clone_top [data-testid="cell-1-1"]')).toBeAttached();
  }

  /**
   * Scrolls the grid down until the master table no longer draws the frozen rows' own range of rows, so
   * only the top overlay draws a block that starts in them.
   *
   * @param {number} row The row to scroll to the top of the master table.
   */
  async scrollMasterToRow(row: number): Promise<void> {
    await this.page.evaluate((r) => {
      (window as any).hot.scrollViewportTo({ row: r, col: 1, verticalSnap: 'top' });
    }, row);
    await expect.poll(() => this.page.evaluate(() => {
      return (window as any).hot.view._wt.wtTable.getFirstRenderedRow();
    })).toBeGreaterThan(5);
  }

  /**
   * Freezes the first column and scrolls the grid sideways until it is the only thing that draws that
   * column: the master table no longer has its cells.
   */
  async freezeFirstColumnAndScrollAway(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as any).hot;

      hot.updateSettings({ fixedColumnsStart: 1, colWidths: 120, width: 300 });
      hot.scrollViewportTo({ row: 1, col: 5, horizontalSnap: 'start' });
    });
    await expect.poll(() => this.page.evaluate(() => {
      return (window as any).hot.view._wt.wtTable.getFirstRenderedColumn();
    })).toBeGreaterThan(1);
  }

  /**
   * Waits for the editor's resize observer to have had its turn, so a write it would make is
   * visible to the caller. A callback runs after the layout of the frame that changed the size.
   */
  async settleResizeObserver(): Promise<void> {
    await this.page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  }

  /**
   * The height the grid gives a row.
   *
   * @param {number} row The visual row index.
   * @returns {Promise<number>}
   */
  async rowHeight(row: number): Promise<number> {
    return this.page.evaluate(r => (window as any).hot.getRowHeight(r) ?? 0, row);
  }

  /**
   * Drags the native resizer in the textarea's bottom-end corner, the way a user resizes the box.
   *
   * @param {number} dy How far to drag down, in px.
   */
  async dragResizerDown(dy: number): Promise<void> {
    const box = await this.textarea.boundingBox();

    expect(box, 'the textarea must have a box before it can be resized').not.toBeNull();

    // The grip's hit area is about 16px square, so a point 4px inside the corner lands on it.
    const grip = { x: box!.x + box!.width - 4, y: box!.y + box!.height - 4 };

    await this.page.mouse.move(grip.x, grip.y);
    await this.page.mouse.down();
    await this.page.mouse.move(grip.x, grip.y + dy);
    await this.page.mouse.up();
  }

  /**
   * The size the comment persisted in its cell meta, `undefined` while the user has not resized it.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<{ width: number, height: number } | undefined>}
   */
  async savedStyle(row: number, col: number): Promise<{ width: number, height: number } | undefined> {
    return this.page.evaluate(({ r, c }) => {
      const comment = (window as any).hot.getCellMeta(r, c).comment;

      return comment ? comment.style : undefined;
    }, { r: row, c: col });
  }
}
