import { type Page, type Locator, expect } from '@playwright/test';
import { assertKnownBundle, awaitBundle, awaitFixtureBuilt, BUNDLE_POLLING_MS, type Bundle } from '../bundle';
import { afterAnimationFrames } from '../frames';

/**
 * The grid layout the fixture builds: `height` sizes the grid with `75vh`, `width` stretches its
 * columns over the container width.
 */
export type ResizeLayout = 'height' | 'width';

/**
 * The editor of the fixture's last column.
 */
export type ResizeEditor = 'text' | 'dropdown' | 'select' | 'multiselect';

/**
 * A box in viewport coordinates.
 */
export type Box = { left: number, top: number, right: number, bottom: number, width: number };

/**
 * What the tests compare about the open editor and its cell, read in one evaluation so a draw
 * cannot land between the reads.
 */
export type EditorState = {
  opened: boolean;
  textareaFocused: boolean;
  value: string | null;
  cell: Box | null;
  anchor: Box | null;
  popup: Box | null;
  viewportHeight: number;
};

type EditorLike = {
  isOpened(): boolean,
  TEXTAREA?: HTMLTextAreaElement,
};

type ResizeWindow = {
  hot: {
    selectCell(row: number, column: number): boolean,
    getActiveEditor(): EditorLike | undefined,
    getCell(row: number, column: number, topmost?: boolean): HTMLTableCellElement | null,
    getDataAtCell(row: number, column: number): unknown,
    refreshDimensions(): void,
    rootElement: HTMLElement,
  },
  htEditorParts(): { anchor: Element | null, popup: Element | null },
  htSizeChanges: number,
};

/**
 * Page Object for the editor container-resize fixture: a grid whose own size follows the
 * viewport, so `page.setViewportSize()` resizes the grid the way a soft keyboard does in a WebView
 * that resizes its content (the height layout) or a narrower window does (the width layout).
 */
export class EditorContainerResizePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly textarea: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    assertKnownBundle(bundle, '(page, theme, bundle)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.textarea = page.locator('textarea.handsontableInput');
  }

  /**
   * Navigate to the fixture in the given layout, with the given editor in the last column, and
   * wait for the grid to render.
   */
  async goto(layout: ResizeLayout, editor: ResizeEditor = 'text'): Promise<void> {
    await this.page.goto(
      '/tests/fixtures/demo/editor-container-resize.html' +
      `?theme=${this.theme}&bundle=${this.bundle}&layout=${layout}&editor=${editor}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.locator('.ht_master').getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Select a cell through the API (which scrolls it into view) and open its editor with Enter.
   */
  async openEditorAt(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      const { hot } = window as unknown as ResizeWindow;

      hot.selectCell(r, c);
    }, [row, col]);
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.page.evaluate(
      () => (window as unknown as ResizeWindow).hot.getActiveEditor()?.isOpened() ?? false
    ), { message: 'the editor opened' }).toBe(true);
  }

  /**
   * Resize the viewport and wait until the grid has run a size-changing `refreshDimensions()`.
   */
  async resizeViewport(width: number, height: number): Promise<void> {
    const before = await this.page.evaluate(() => (window as unknown as ResizeWindow).htSizeChanges);

    await this.page.setViewportSize({ width, height });
    await this.page.waitForFunction(
      count => (window as unknown as ResizeWindow).htSizeChanges > count,
      before,
      { polling: BUNDLE_POLLING_MS }
    );
  }

  /**
   * Call `refreshDimensions()` while the grid's size stays the same.
   */
  async refreshDimensionsAtSameSize(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as ResizeWindow).hot.refreshDimensions());
  }

  /**
   * The open editor, the element it places on its cell, the list it opens beside the cell, and the
   * cell itself, in viewport coordinates. `cell` is `null` while the grid does not render the cell.
   */
  async editorState(row: number, col: number): Promise<EditorState> {
    return this.page.evaluate(([r, c]) => {
      const { hot, htEditorParts } = window as unknown as ResizeWindow;
      const editor = hot.getActiveEditor();
      const input = editor?.TEXTAREA ?? null;
      const { anchor, popup } = htEditorParts();
      const box = (element: Element | null) => {
        if (!element) {
          return null;
        }

        const { left, top, right, bottom, width } = element.getBoundingClientRect();

        return { left, top, right, bottom, width };
      };

      return {
        opened: editor?.isOpened() ?? false,
        textareaFocused: input !== null && document.activeElement === input,
        value: input?.value ?? null,
        cell: box(hot.getCell(r, c, true)),
        anchor: box(anchor),
        popup: box(popup),
        viewportHeight: window.innerHeight,
      };
    }, [row, col]);
  }

  /**
   * The master holder's scroll offsets.
   */
  async holderScroll(): Promise<{ top: number, left: number }> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as ResizeWindow;
      const holder = hot.rootElement.querySelector('.ht_master .wtHolder');

      return { top: holder?.scrollTop ?? NaN, left: holder?.scrollLeft ?? NaN };
    });
  }

  /**
   * Scroll the master holder up by a distance, leaving the open editor's cell rendered but not
   * fully visible, and wait for the grid to have handled the scroll.
   */
  async scrollHolderUpBy(distance: number): Promise<void> {
    await this.page.evaluate((by) => {
      const { hot } = window as unknown as ResizeWindow;
      const holder = hot.rootElement.querySelector('.ht_master .wtHolder');

      if (holder) {
        holder.scrollTop -= by;
      }
    }, distance);
    await afterAnimationFrames(this.page, 2);
  }

  /**
   * Whether the grid renders the cell right now.
   */
  async isCellRendered(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as ResizeWindow).hot.getCell(r, c, true) !== null, [row, col]
    );
  }

  /**
   * Waits two animation frames, so a scroll the grid made has fired its `scroll` event.
   */
  async waitForFrames(): Promise<void> {
    await afterAnimationFrames(this.page, 2);
  }

  /**
   * The value the grid holds for a cell.
   */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as ResizeWindow).hot.getDataAtCell(r, c), [row, col]
    );
  }
}
